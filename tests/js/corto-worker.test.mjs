// tests/js/corto-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { gestisciCorto, generaCodice, urlAmmesso, LUNGHEZZA_CODICE } from '../../worker/corto-core.js';

const SITO = 'https://dt.example';
const ORIGINE = SITO;
const env = (kv) => ({ ORIGINI: `${SITO},http://localhost:8000`, SITI: SITO, DOMINIO_CORTO: 'https://corto.test', LINK: kv });
const kvFinto = () => {
  const m = new Map();
  return {
    m,
    get: async k => m.get(k) ?? null,
    put: async (k, v, opz) => { m.set(k, v); m.set(`${k}#opz`, opz); },
  };
};
const LUNGO = `${SITO}/mappa.html?v=v1z.AAAA#15.2/38.11/13.36`;
const post = (corpo, extra = {}) => new Request('https://corto.test/corto', {
  method: 'POST', headers: { origin: ORIGINE, 'content-type': 'application/json' }, body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo), ...extra,
});
const get = (percorso, host = 'https://corto.test') => new Request(`${host}${percorso}`, { headers: { origin: ORIGINE } });

test('codice: lunghezza e alfabeto senza caratteri ambigui', () => {
  for (let i = 0; i < 200; i++) {
    const c = generaCodice();
    assert.equal(c.length, LUNGHEZZA_CODICE);
    assert.match(c, /^[2-9A-HJ-NP-Za-km-z]+$/);
  }
  assert.notEqual(generaCodice(), generaCodice());
});

test('urlAmmesso: solo pagine del sito con parametri', () => {
  const siti = [SITO];
  assert.equal(urlAmmesso(LUNGO, siti), true);
  assert.equal(urlAmmesso(`${SITO}/`, siti), true);
  assert.equal(urlAmmesso('https://evil.example/mappa.html?v=x', siti), false);
  assert.equal(urlAmmesso('https://dt.example.evil.com/mappa.html', siti), false);
  assert.equal(urlAmmesso('javascript:alert(1)', siti), false);
  assert.equal(urlAmmesso('https://user:pw@dt.example/mappa.html', siti), false);
  assert.equal(urlAmmesso(`${SITO}/mappa.html?v=${'a'.repeat(9000)}`, siti), false);
  assert.equal(urlAmmesso(42, siti), false);
  assert.equal(urlAmmesso('', siti), false);
});

test('POST /corto: salva e restituisce il link corto', async () => {
  const kv = kvFinto();
  const r = await gestisciCorto(post({ url: LUNGO }), env(kv));
  assert.equal(r.status, 200);
  const { url } = await r.json();
  assert.match(url, /^https:\/\/corto\.test\/[2-9A-HJ-NP-Za-km-z]{6,8}$/);
  const codice = url.split('/').pop();
  assert.equal(kv.m.get(`u:${codice}`), LUNGO);
  assert.ok(kv.m.get(`u:${codice}#opz`).expirationTtl > 0);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGINE);
});

test('POST /corto: lo stesso link dà lo stesso codice, senza riempire il KV', async () => {
  const kv = kvFinto();
  const a = await (await gestisciCorto(post({ url: LUNGO }), env(kv))).json();
  const n = kv.m.size;
  const b = await (await gestisciCorto(post({ url: LUNGO }), env(kv))).json();
  assert.equal(a.url, b.url);
  assert.equal(kv.m.size, n);
});

test('POST /corto: rifiuta url altrui, corpo non valido, origine non ammessa, metodo sbagliato', async () => {
  const kv = kvFinto();
  assert.equal((await gestisciCorto(post({ url: 'https://evil.example/x' }), env(kv))).status, 400);
  assert.equal((await gestisciCorto(post('non json'), env(kv))).status, 400);
  assert.equal((await gestisciCorto(post({ altro: 1 }), env(kv))).status, 400);
  assert.equal((await gestisciCorto(post('x'.repeat(20000)), env(kv))).status, 413);
  const estranea = new Request('https://corto.test/corto', { method: 'POST', headers: { origin: 'https://evil.example' }, body: JSON.stringify({ url: LUNGO }) });
  assert.equal((await gestisciCorto(estranea, env(kv))).status, 403);
  assert.equal((await gestisciCorto(get('/corto'), env(kv))).status, 405);
  assert.equal(kv.m.size, 0);
});

test('POST /corto: preflight CORS', async () => {
  const r = await gestisciCorto(new Request('https://corto.test/corto', { method: 'OPTIONS', headers: { origin: ORIGINE } }), env(kvFinto()));
  assert.equal(r.status, 204);
  assert.match(r.headers.get('access-control-allow-methods'), /POST/);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGINE);
});

test('POST /corto: senza KV risponde 503', async () => {
  const r = await gestisciCorto(post({ url: LUNGO }), env(undefined));
  assert.equal(r.status, 503);
});

test('GET /<codice>: redirect al link lungo', async () => {
  const kv = kvFinto();
  const { url } = await (await gestisciCorto(post({ url: LUNGO }), env(kv))).json();
  const r = await gestisciCorto(get(new URL(url).pathname), env(kv));
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), LUNGO);
  assert.match(r.headers.get('cache-control'), /max-age|no-store/);
});

test('GET: codice sconosciuto o malformato = 404; radice = redirect al sito', async () => {
  const kv = kvFinto();
  assert.equal((await gestisciCorto(get('/Zzzzzzz'), env(kv))).status, 404);
  assert.equal((await gestisciCorto(get('/../etc'), env(kv))).status, 404);
  assert.equal((await gestisciCorto(get('/a'), env(kv))).status, 404);
  const radice = await gestisciCorto(get('/'), env(kv));
  assert.equal(radice.status, 302);
  assert.equal(radice.headers.get('location'), `${SITO}/`);
});

test('GET: un valore corrotto nel KV non diventa un redirect aperto', async () => {
  const kv = kvFinto();
  kv.m.set('u:Abcdefg', 'https://evil.example/');
  const r = await gestisciCorto(get('/Abcdefg'), env(kv));
  assert.equal(r.status, 404);
});
