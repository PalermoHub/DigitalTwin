// tests/js/voli-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { estrai, stato, distanzaNm, gestisciVoli, AEROPORTO } from '../../worker/voli-core.js';

const AEREO = { hex: '345314', flight: 'VLG6599 ', r: 'EC-MOO', t: 'A321', alt_baro: 28675, gs: 409.5, track: 305.36, baro_rate: 1088, lat: 38.5, lon: 12.8 };
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const rq = (init = {}) => new Request('https://proxy.test/voli', { headers: { origin: ORIGINE }, ...init });
const upstream = (corpo, n = { chiamate: 0 }) => async () => { n.chiamate++; return new Response(JSON.stringify(corpo), { status: 200 }); };
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };

test('proprietà normalizzate', () => {
  const fc = estrai({ now: 1792693153001, ac: [AEREO] });
  const f = fc.features[0];
  assert.equal(fc.aggiornato, 1792693153);
  assert.deepEqual(f.geometry, { type: 'Point', coordinates: [12.8, 38.5] });
  assert.equal(f.properties.volo, 'VLG6599');
  assert.equal(f.properties.velocita_kt, 410);
  assert.equal(f.properties.rotta, 305);
  assert.equal(f.properties.stato, 'In transito');
});

test('scarta chi non ha posizione e ordina per hex', () => {
  const fc = estrai({ ac: [{ ...AEREO, hex: 'b' }, { hex: 'x' }, { ...AEREO, hex: 'a' }] });
  assert.deepEqual(fc.features.map(f => f.properties.id), ['a', 'b']);
});

test('stato dedotto da quota, distanza e velocità verticale', () => {
  const casi = [[3000, -900, 10, 'In arrivo'], [4000, 1800, 8, 'In partenza'], [3000, 0, 10, 'In transito'], [35000, -1000, 10, 'In transito'],
    [3000, -900, 90, 'In transito'], ['ground', 0, 1, 'A terra'], ['ground', 0, 30, 'In transito'], [null, null, 5, 'In transito'], [3000, undefined, 5, 'In transito']];
  for (const [q, r, d, atteso] of casi) assert.equal(stato(q, r, d), atteso, `${q} ${r} ${d}`);
});

test('a terra: quota nulla, cielo vuoto valido', () => {
  const f = estrai({ ac: [{ ...AEREO, alt_baro: 'ground', lat: AEROPORTO[0], lon: AEROPORTO[1] }] }).features[0].properties;
  assert.equal(f.stato, 'A terra');
  assert.equal(f.quota_ft, null);
  assert.deepEqual(estrai({ now: 1, ac: [] }).features, []);
});

test('risposta non valida = errore', () => {
  for (const r of [null, {}, { ac: null }, [], { message: 'rate limited' }]) assert.throws(() => estrai(r));
});

test('distanza in miglia nautiche', () => {
  assert.ok(distanzaNm(...AEROPORTO) < 0.01);
  assert.ok(Math.abs(distanzaNm(AEROPORTO[0] + 1, AEROPORTO[1]) - 60) < 0.5);
});

test('/voli: una sola richiesta a adsb.lol per molti utenti (cache), con CORS', async () => {
  const n = { chiamate: 0 };
  const cache = cacheFinta();
  const f = upstream({ now: 1000, ac: [AEREO] }, n);
  const a = await gestisciVoli(rq(), env, f, cache);
  const b = await gestisciVoli(rq(), env, f, cache);
  assert.equal(n.chiamate, 1);
  assert.equal(a.headers.get('access-control-allow-origin'), ORIGINE);
  assert.equal((await b.json()).features.length, 1);
});

test('/voli: origine non ammessa 403, metodo 405, OPTIONS 204, fonte giù 502 (e non va in cache)', async () => {
  assert.equal((await gestisciVoli(rq({ headers: { origin: 'https://altro.it' } }), env, upstream({ ac: [] }), null)).status, 403);
  assert.equal((await gestisciVoli(rq({ method: 'POST' }), env, upstream({ ac: [] }), null)).status, 405);
  assert.equal((await gestisciVoli(rq({ method: 'OPTIONS' }), env, upstream({ ac: [] }), null)).status, 204);
  const cache = cacheFinta();
  const giu = async () => new Response('x', { status: 500 });
  assert.equal((await gestisciVoli(rq(), env, giu, cache)).status, 502);
  assert.equal(await cache.match(new Request('https://cache.interno/voli')), undefined);
});
