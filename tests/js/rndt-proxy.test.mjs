// tests/js/rndt-proxy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { gestisci, ospiteValido, urlDestinazione, LIMITE_BYTE } from '../../worker/rndt-proxy.js';

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
