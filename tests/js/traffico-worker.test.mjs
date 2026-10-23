// tests/js/traffico-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { estremiTile, tileInArea, segmento, gestisciTraffico } from '../../worker/traffico-core.js';

const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE, TOMTOM_KEY: 'chiave-segreta' };
const rq = (percorso, init = {}) => new Request(`https://proxy.test${percorso}`, { headers: { origin: ORIGINE }, ...init });
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };
// tile di Palermo a zoom 12: lon 13.36 → x 2200, lat 38.12 → y 1578
const TILE = '/traffico/tile/12/2200/1578';
const PNG = new Uint8Array([137, 80, 78, 71]);
const TOMTOM = { flowSegmentData: { frc: 'FRC3', currentSpeed: 21, freeFlowSpeed: 33, currentTravelTime: 132, freeFlowTravelTime: 84, confidence: 0.94, roadClosure: false,
  coordinates: { coordinate: [{ latitude: 38.11654914, longitude: 13.36362224 }, { latitude: 38.11646467, longitude: 13.3636732 }] } } };

const fonte = (n = { chiamate: 0, urls: [], opzioni: [] }, stato = 200) => async (url, opzioni) => {
  n.chiamate++; n.urls.push(url); n.opzioni.push(opzioni);
  if (stato !== 200) return new Response('{}', { status: stato });
  if (url.includes('/tile/flow/')) return new Response(PNG, { headers: { 'content-type': 'image/png' } });
  return new Response(JSON.stringify(TOMTOM));
};
const nuovo = () => ({ chiamate: 0, urls: [], opzioni: [] });

test('estremiTile: il tile 0/0/0 copre tutto il mondo', () => {
  const e = estremiTile(0, 0, 0);
  assert.equal(e.ovest, -180); assert.equal(e.est, 180);
  assert.ok(e.nord > 85 && e.sud < -85);
});

test('tileInArea: Palermo sì, Roma no', () => {
  assert.equal(tileInArea(12, 2200, 1578), true);
  assert.equal(tileInArea(12, 2178, 1500), false);
});

test('segmento: velocità, tempi e linea arrotondata', () => {
  const s = segmento(TOMTOM);
  assert.equal(s.velocita, 21); assert.equal(s.velocitaLibera, 33); assert.equal(s.chiusa, false);
  assert.deepEqual(s.linea[0], [13.36362, 38.11655]);
  assert.throws(() => segmento({}), /non prevista/);
});

test('tile: scarica da TomTom con Referer del progetto, poi serve dalla cache', async () => {
  const n = nuovo(); const cache = cacheFinta();
  const r1 = await gestisciTraffico(rq(TILE), env, fonte(n), cache);
  assert.equal(r1.status, 200);
  assert.equal(r1.headers.get('content-type'), 'image/png');
  assert.equal(r1.headers.get('access-control-allow-origin'), ORIGINE);
  assert.deepEqual([...new Uint8Array(await r1.arrayBuffer())], [...PNG]);
  assert.match(n.opzioni[0].headers.referer, /palermodigitaltwin\.opendatasicilia\.it/);
  assert.match(n.urls[0], /key=chiave-segreta/);
  const r2 = await gestisciTraffico(rq(TILE), env, fonte(n), cache);
  assert.equal(r2.status, 200);
  assert.equal(n.chiamate, 1);
});

test('tile: origine non ammessa → 403; senza Origin vale il Referer', async () => {
  const n = nuovo();
  assert.equal((await gestisciTraffico(new Request(`https://proxy.test${TILE}`, { headers: { origin: 'https://altro.it' } }), env, fonte(n), cacheFinta())).status, 403);
  assert.equal((await gestisciTraffico(new Request(`https://proxy.test${TILE}`), env, fonte(n), cacheFinta())).status, 403);
  const conReferer = new Request(`https://proxy.test${TILE}`, { headers: { referer: `${ORIGINE}/mappa.html` } });
  assert.equal((await gestisciTraffico(conReferer, env, fonte(n), cacheFinta())).status, 200);
});

test('tile: zoom, indici e area vengono controllati prima di chiamare TomTom', async () => {
  const n = nuovo();
  for (const [p, stato] of [['/traffico/tile/3/4/2', 400], ['/traffico/tile/20/1/1', 400], ['/traffico/tile/12/9999/1578', 400], ['/traffico/tile/12/2178/1500', 404]]) {
    assert.equal((await gestisciTraffico(rq(p), env, fonte(n), cacheFinta())).status, stato, p);
  }
  assert.equal(n.chiamate, 0);
});

test('senza chiave → 503; metodo POST → 405; OPTIONS → 204', async () => {
  assert.equal((await gestisciTraffico(rq(TILE), { ORIGINI: ORIGINE }, fonte(), cacheFinta())).status, 503);
  assert.equal((await gestisciTraffico(rq(TILE, { method: 'POST' }), env, fonte(), cacheFinta())).status, 405);
  assert.equal((await gestisciTraffico(rq(TILE, { method: 'OPTIONS' }), env, fonte(), cacheFinta())).status, 204);
});

test('segmento: JSON con velocità; clic vicini condividono la cache', async () => {
  const n = nuovo(); const cache = cacheFinta();
  const r = await gestisciTraffico(rq('/traffico/segmento?lat=38.11571&lon=13.36149'), env, fonte(n), cache);
  assert.equal(r.status, 200);
  const dati = await r.json();
  assert.equal(dati.velocita, 21); assert.equal(dati.classe, 'FRC3');
  await gestisciTraffico(rq('/traffico/segmento?lat=38.11574&lon=13.36151'), env, fonte(n), cache);
  assert.equal(n.chiamate, 1);
});

test('segmento: punto fuori area o non numerico → 400; nessuna strada (400 di TomTom) → 404', async () => {
  const n = nuovo();
  assert.equal((await gestisciTraffico(rq('/traffico/segmento?lat=41.9&lon=12.5'), env, fonte(n), cacheFinta())).status, 400);
  assert.equal((await gestisciTraffico(rq('/traffico/segmento?lat=x&lon=y'), env, fonte(n), cacheFinta())).status, 400);
  assert.equal((await gestisciTraffico(rq('/traffico/segmento?lat=38.11&lon=13.36'), env, fonte(n, 400), cacheFinta())).status, 404);
});

test('guasto di TomTom → 502 senza far trapelare la chiave', async () => {
  const r = await gestisciTraffico(rq(TILE), env, fonte(nuovo(), 500), cacheFinta());
  assert.equal(r.status, 502);
  assert.ok(!JSON.stringify(await r.json()).includes('chiave-segreta'));
});

test('rotta sconosciuta → 404', async () => {
  assert.equal((await gestisciTraffico(rq('/traffico/altro'), env, fonte(), cacheFinta())).status, 404);
});

// KV finto: Map con get/put
const kvFinto = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, m }; };

test('tetto giornaliero: oltre il limite 429 senza chiamare TomTom; le risposte in cache non contano', async () => {
  const { entroIlTetto, TETTO_GIORNO } = await import('../../worker/traffico-core.js');
  const kv = kvFinto();
  kv.m.set(`traffico:segmento:${new Date().toISOString().slice(0, 10)}`, String(TETTO_GIORNO.segmento));
  const n = nuovo(); const cache = cacheFinta();
  const r = await gestisciTraffico(rq('/traffico/segmento?lat=38.1157&lon=13.3615'), { ...env, NAVI: kv }, fonte(n), cache);
  assert.equal(r.status, 429);
  assert.equal(n.chiamate, 0);
  assert.equal(await entroIlTetto({ NAVI: kv }, 'segmento'), false);
  assert.equal(await entroIlTetto({ NAVI: kv }, 'tile'), true); // il tetto dei tile è separato
});

test('tetto giornaliero: scrive nel KV solo una volta ogni PASSO richieste, a blocchi', async () => {
  const { entroIlTetto, PASSO } = await import('../../worker/traffico-core.js');
  const kv = kvFinto(); let scritture = 0; const put = kv.put; kv.put = async (k, v, o) => { scritture++; return put(k, v, o); };
  const sempre = () => 0; const mai = () => 0.999;
  for (let i = 0; i < 50; i++) await entroIlTetto({ NAVI: kv }, 'tile', new Date(), mai);
  assert.equal(scritture, 0);
  await entroIlTetto({ NAVI: kv }, 'tile', new Date(), sempre);
  assert.equal(scritture, 1);
  assert.equal([...kv.m.values()][0], String(PASSO.tile));
});

test('tetto giornaliero: con le cache hit non si legge né scrive il KV', async () => {
  const kv = kvFinto(); let letture = 0; const get = kv.get; kv.get = async k => { letture++; return get(k); };
  const n = nuovo(); const cache = cacheFinta(); const e = { ...env, NAVI: kv };
  await gestisciTraffico(rq(TILE), e, fonte(n), cache);
  const dopoPrima = letture;
  await gestisciTraffico(rq(TILE), e, fonte(n), cache);
  assert.equal(letture, dopoPrima);
});
