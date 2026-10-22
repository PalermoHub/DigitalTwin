// tests/js/voli-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { estrai, stato, distanzaNm, gestisciVoli, daOpenSky, AEROPORTO } from '../../worker/voli-core.js';

const AEREO = { hex: '345314', flight: 'VLG6599 ', r: 'EC-MOO', t: 'A321', alt_baro: 28675, gs: 409.5, track: 305.36, baro_rate: 1088, lat: 38.5, lon: 12.8 };
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const rq = (init = {}) => new Request('https://proxy.test/voli', { headers: { origin: ORIGINE }, ...init });
// Gesap (volo di linea degli aerei) ha i suoi test in aeroporto-worker.test.mjs: qui risponde sempre di no e non conta come richiesta alla fonte
const GESAP = /aeroportodipalermo/;
const upstream = (corpo, n = { chiamate: 0 }) => async url => { if (GESAP.test(url)) return new Response('', { status: 503 }); n.chiamate++; return new Response(JSON.stringify(corpo), { status: 200 }); };
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

test('/voli: se adsb.lol non risponde (429) si servono gli ultimi aerei buoni', async () => {
  const cache = cacheFinta();
  await gestisciVoli(rq(), env, upstream({ now: 1000, ac: [AEREO] }), cache);
  const scaduta = { ...cache, match: async k => (k.url.endsWith('/voli') ? undefined : cache.match(k)) }; // la copia da 5 minuti è scaduta, quella lunga no
  const limitata = async () => new Response('troppe richieste', { status: 429 });
  const r = await gestisciVoli(rq(), env, limitata, scaduta);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-dati'), 'precedenti');
  assert.equal((await r.json()).features.length, 1);
});

const STATO_OPENSKY = ['0201c4', 'RAM271  ', 'Morocco', 1792701589, 1792701590, 13.1695, 37.2609, 10972.8, false, 211.64, 302.49, 5.08, null, 11452.86, '6633', false, 0];

test('OpenSky: stati → forma di adsb.lol (piedi, nodi, piedi al minuto, a terra)', () => {
  const r = estrai(daOpenSky({ time: 1792701590, states: [STATO_OPENSKY, ['a1', 'X ', 'It', 0, 0, 13.1, 38.2, null, true, 0, 0, 0, null, null, '', false, 0], ['b2', '', 'It', 0, 0, null, null, 1, false, 1, 1, 0, null, null, '', false, 0]] }));
  assert.equal(r.features.length, 2); // il terzo non ha posizione
  const p = r.features.find(f => f.properties.id === '0201c4').properties;
  assert.equal(p.volo, 'RAM271');
  assert.equal(p.quota_ft, 36000);
  assert.equal(p.velocita_kt, 411);
  assert.equal(p.rateo_fpm, 1000);
  assert.equal(r.features.find(f => f.properties.id === 'a1').properties.stato, 'A terra');
  assert.match(r.fonte, /OpenSky/);
  assert.throws(() => daOpenSky({}), /OpenSky/);
});

test('/voli: se adsb.lol risponde 429 si passa a OpenSky; se cadono entrambe 502 con i due motivi', async () => {
  const chiamate = [];
  const f = async url => {
    if (GESAP.test(url)) return new Response('', { status: 503 });
    chiamate.push(new URL(url).host);
    return url.includes('adsb.lol') ? new Response('x', { status: 429 }) : new Response(JSON.stringify({ time: 1000, states: [STATO_OPENSKY] }), { status: 200 });
  };
  const r = await gestisciVoli(rq(), env, f, cacheFinta());
  assert.equal(r.status, 200);
  assert.deepEqual(chiamate, ['api.adsb.lol', 'opensky-network.org']);
  assert.equal((await r.json()).features.length, 1);
  const giu = async () => new Response('x', { status: 429 });
  const e = await gestisciVoli(rq(), env, giu, cacheFinta());
  assert.equal(e.status, 502);
  assert.match((await e.json()).dettaglio, /adsb\.lol 429; OpenSky 429/);
});
