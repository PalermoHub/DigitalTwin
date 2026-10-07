// tests/js/rndt-proxy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { gestisci, ospiteValido, urlDestinazione, LIMITE_BYTE } from '../../worker/proxy-core.js';

const rq = (percorso, init = {}) => new Request(`https://proxy.test${percorso}`, init);
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: `${ORIGINE}, http://localhost:8000` };
const upstream = (corpo = 'ciao', init = {}) => async () => new Response(corpo, { status: 200, headers: { 'content-type': 'text/plain', 'set-cookie': 'a=b', ...init } });

test('ospiteValido: solo nomi pubblici, niente IP, localhost, porte o nomi senza punto', () => {
  assert.equal(ospiteValido('geodati.gov.it'), true);
  for (const no of ['localhost', '10.0.0.1', '192.168.1.1', '[::1]', 'intranet', 'x.internal', 'a.local', 'a.com:8080']) assert.equal(ospiteValido(no), false, no);
});

test('urlDestinazione: rotta /t/<host>/<percorso>?<query>', () => {
  assert.equal(urlDestinazione(rq('/t/geodati.gov.it/RNDT/q?a=1&b={x}')), 'https://geodati.gov.it/RNDT/q?a=1&b={x}');
  assert.equal(urlDestinazione(rq('/t/host.it')), 'https://host.it/');
  assert.equal(urlDestinazione(rq('/altro')), null);
  assert.equal(urlDestinazione(rq('/t/10.0.0.1/x')), null);
  assert.equal(urlDestinazione(rq('/t/localhost/x')), null);
});

test('metodo diverso da GET/HEAD = 405; OPTIONS = 204 con CORS', async () => {
  assert.equal((await gestisci(rq('/t/a.it/x', { method: 'POST', headers: { origin: ORIGINE } }), env, upstream())).status, 405);
  const pre = await gestisci(rq('/t/a.it/x', { method: 'OPTIONS', headers: { origin: ORIGINE } }), env, upstream());
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), ORIGINE);
});

test('origine non ammessa o assente = 403; senza lista ORIGINI passa chiunque', async () => {
  assert.equal((await gestisci(rq('/t/a.it/x', { headers: { origin: 'https://evil.example' } }), env, upstream())).status, 403);
  assert.equal((await gestisci(rq('/t/a.it/x'), env, upstream())).status, 403);
  assert.equal((await gestisci(rq('/t/a.it/x', { headers: { origin: 'https://qualunque.example' } }), {}, upstream())).status, 200);
});

test('host non valido = 400', async () => {
  assert.equal((await gestisci(rq('/t/10.0.0.1/x', { headers: { origin: ORIGINE } }), env, upstream())).status, 400);
});

test('GET ok: corpo, CORS, niente cookie, nessuna cache', async () => {
  let chiamato;
  const r = await gestisci(rq('/t/a.it/ows?x=1', { headers: { origin: ORIGINE } }), env, async (u, init) => { chiamato = [u, init]; return upstream()(); });
  assert.equal(chiamato[0], 'https://a.it/ows?x=1');
  assert.equal(await r.text(), 'ciao');
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGINE);
  assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('content-type'), 'text/plain');
});

test('risposta oltre il limite: 413 se lo dichiara, errore sul flusso altrimenti', async () => {
  const dichiara = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, upstream('x', { 'content-length': String(LIMITE_BYTE + 1) }));
  assert.equal(dichiara.status, 413);
  const flusso = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), { ...env, LIMITE_BYTE: 10 }, upstream('x'.repeat(100)));
  await assert.rejects(flusso.text());
});

test('servizio irraggiungibile = 502', async () => {
  const r = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, async () => { throw new Error('giù'); });
  assert.equal(r.status, 502);
});

test('ospiteValido rifiuta IP in forme alternative, caratteri speciali e nomi tutti numerici/esadecimali', () => {
  for (const no of ['0x7f.0.0.1', '0177.0.0.1', '127.1', '2130706433.it'.replace('.it', ''), 'a@b.com', 'a\\b.com', 'a%2fb.com', 'a#b.com', 'a/b.com', '1.2.3.4.5', '0x7f.1']) {
    assert.equal(ospiteValido(no), false, no);
  }
  assert.equal(ospiteValido('www.geodati.gov.it'), true);
});

test('un redirect verso un host non valido viene rifiutato, uno valido viene seguito', async () => {
  const redirect = async u => (u === 'https://a.it/x'
    ? new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest' } })
    : new Response('segreto'));
  const r = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, redirect);
  assert.equal(r.status, 502);
  const buono = async u => (u === 'https://a.it/x'
    ? new Response(null, { status: 301, headers: { location: 'https://b.it/y' } })
    : new Response('ok'));
  const r2 = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, buono);
  assert.equal(await r2.text(), 'ok');
});

test('troppi redirect = 502', async () => {
  const giro = async () => new Response(null, { status: 302, headers: { location: 'https://a.it/x' } });
  assert.equal((await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, giro)).status, 502);
});

test('Authorization va al servizio richiesto, non a un altro host dopo un redirect', async () => {
  const visti = [];
  const f = async (u, init) => {
    visti.push([u, init.headers.authorization]);
    return visti.length === 1 ? new Response(null, { status: 302, headers: { location: 'https://altro.it/y' } }) : new Response('ok');
  };
  await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE, authorization: 'Basic eDp5' } }), env, f);
  assert.deepEqual(visti, [['https://a.it/x', 'Basic eDp5'], ['https://altro.it/y', undefined]]);
});

test('Authorization si mantiene su un redirect nello stesso host', async () => {
  const visti = [];
  const f = async (u, init) => {
    visti.push([u, init.headers.authorization]);
    return visti.length === 1 ? new Response(null, { status: 302, headers: { location: '/y' } }) : new Response('ok');
  };
  await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE, authorization: 'Basic eDp5' } }), env, f);
  assert.deepEqual(visti.map(v => v[1]), ['Basic eDp5', 'Basic eDp5']);
});

test('senza Authorization nessuna intestazione viene inventata', async () => {
  let init;
  await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, async (u, i) => { init = i; return new Response('ok'); });
  assert.equal(init.headers.authorization, undefined);
});

test('preflight: Authorization è tra le intestazioni ammesse (il carattere jolly non la copre)', async () => {
  const pre = await gestisci(rq('/t/a.it/x', { method: 'OPTIONS', headers: { origin: ORIGINE } }), env, upstream());
  assert.match(pre.headers.get('access-control-allow-headers'), /authorization/i);
});

test('un 401 del servizio arriva com’è ma senza WWW-Authenticate (niente finestra di login del browser)', async () => {
  const r = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE, authorization: 'Basic eDp5' } }), env,
    async () => new Response('no', { status: 401, headers: { 'www-authenticate': 'Basic realm="x"' } }));
  assert.equal(r.status, 401);
  assert.equal(r.headers.get('www-authenticate'), null);
});
