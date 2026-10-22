// tests/js/satelliti-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pulisci, unisci, gestisciSatelliti, GRUPPI } from '../../worker/satelliti-core.js';

const ISS = {
  OBJECT_NAME: 'ISS (ZARYA)', OBJECT_ID: '1998-067A', EPOCH: '2026-10-21T01:08:59.469792', MEAN_MOTION: 15.48967427, ECCENTRICITY: 0.00067597,
  INCLINATION: 51.6327, RA_OF_ASC_NODE: 37.2623, ARG_OF_PERICENTER: 289.5321, MEAN_ANOMALY: 70.4938, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: 'U',
  NORAD_CAT_ID: 25544, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 59126, BSTAR: 0.00018187691, MEAN_MOTION_DOT: 9.575e-5, MEAN_MOTION_DDOT: 0,
};
const ALTRO = { ...ISS, OBJECT_NAME: 'HST', OBJECT_ID: '1990-037B', NORAD_CAT_ID: 20580 };
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const rq = (init = {}) => new Request('https://proxy.test/satelliti', { headers: { origin: ORIGINE }, ...init });
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };
// risponde a ogni gruppo con l'elenco dato; conta le richieste alla fonte
const fonte = (per = {}, n = { chiamate: 0 }) => async url => {
  n.chiamate++;
  const g = new URL(url).searchParams.get('GROUP');
  const corpo = per[g] ?? [];
  return new Response(JSON.stringify(corpo), { status: 200 });
};

test('pulisci: tiene solo i campi di SGP4 e ripulisce il nome', () => {
  const p = pulisci({ ...ISS, OBJECT_NAME: ' ISS\u0000 (ZARYA) ', extra: 'x' });
  assert.equal(p.OBJECT_NAME, 'ISS  (ZARYA)');
  assert.equal(p.extra, undefined);
  assert.equal(p.NORAD_CAT_ID, 25544);
});

test('pulisci: scarta elementi incompleti o senza senso', () => {
  assert.equal(pulisci(null), null);
  assert.equal(pulisci({ ...ISS, MEAN_MOTION: null }), null);
  assert.equal(pulisci({ ...ISS, EPOCH: 'ieri' }), null);
  assert.equal(pulisci({ ...ISS, NORAD_CAT_ID: -1 }), null);
  assert.equal(pulisci({ ...ISS, OBJECT_NAME: '  ' }), null);
});

test('unisci: un satellite per numero NORAD, vince il primo gruppo', () => {
  const l = unisci([['stations', [ISS]], ['visual', [ISS, ALTRO, { rotto: true }]], ['vuoto', 'non un elenco']]);
  assert.deepEqual(l.map(s => [s.NORAD_CAT_ID, s.gruppo]), [[25544, 'stations'], [20580, 'visual']]);
});

test('risposta: elenco e fonte, una richiesta per gruppo', async () => {
  const n = { chiamate: 0 };
  const r = await gestisciSatelliti(rq(), env, fonte({ stations: [ISS], visual: [ALTRO] }, n), cacheFinta());
  assert.equal(r.status, 200);
  const corpo = await r.json();
  assert.equal(corpo.satelliti.length, 2);
  assert.match(corpo.fonte, /CelesTrak/);
  assert.equal(n.chiamate, GRUPPI.length);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGINE);
});

test('cache: la seconda richiesta non interroga CelesTrak', async () => {
  const n = { chiamate: 0 };
  const cache = cacheFinta();
  const f = fonte({ stations: [ISS] }, n);
  await gestisciSatelliti(rq(), env, f, cache);
  const dopo = n.chiamate;
  const r = await gestisciSatelliti(rq(), env, f, cache);
  assert.equal(r.status, 200);
  assert.equal(n.chiamate, dopo);
});

test('senza ISS i dati sono sospetti: 502, non un elenco monco', async () => {
  const r = await gestisciSatelliti(rq(), env, fonte({ stations: [], visual: [ALTRO] }), cacheFinta());
  assert.equal(r.status, 502);
});

test('fonte giù: si servono gli ultimi dati buoni, altrimenti 502', async () => {
  const cache = cacheFinta();
  await gestisciSatelliti(rq(), env, fonte({ stations: [ISS] }), cache);
  cache.match = (orig => async k => (k.url.endsWith('/satelliti') ? undefined : orig(k)))(cache.match); // scaduta la cache normale resta «ultimo»
  const giu = async () => new Response('', { status: 503 });
  const r = await gestisciSatelliti(rq(), env, giu, cache);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-dati'), 'precedenti');
  const vuoto = await gestisciSatelliti(rq(), env, giu, cacheFinta());
  assert.equal(vuoto.status, 502);
});

test('un gruppo senza JSON (CelesTrak risponde con testo) è un errore', async () => {
  const testo = async () => new Response('No GP data found', { status: 200 });
  const r = await gestisciSatelliti(rq(), env, testo, cacheFinta());
  assert.equal(r.status, 502);
});

test('origine non ammessa, metodo non ammesso, preflight', async () => {
  const f = fonte({ stations: [ISS] });
  assert.equal((await gestisciSatelliti(new Request('https://p.test/satelliti', { headers: { origin: 'https://x.example' } }), env, f, cacheFinta())).status, 403);
  assert.equal((await gestisciSatelliti(rq({ method: 'POST' }), env, f, cacheFinta())).status, 405);
  const pre = await gestisciSatelliti(rq({ method: 'OPTIONS' }), env, f, cacheFinta());
  assert.equal(pre.status, 204);
});
