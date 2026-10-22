// tests/js/navi-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { categoria, leggiMessaggio, unisci, geojson, raccogli, aggiorna, gestisciNavi, SCADENZA_S } from '../../worker/navi-core.js';

const POS = { MessageType: 'PositionReport', MetaData: { MMSI: 247123456, ShipName: 'GNV BRIDGE@@@' }, Message: { PositionReport: { Latitude: 38.13, Longitude: 13.37, Sog: 12.34, Cog: 45.6, TrueHeading: 44, NavigationalStatus: 0 } } };
const STAT = { MessageType: 'ShipStaticData', MetaData: { MMSI: 247123456, ShipName: 'GNV BRIDGE' }, Message: { ShipStaticData: { Name: 'GNV BRIDGE@@', Type: 69, Destination: 'NAPOLI@@', Dimension: { A: 150, B: 40, C: 10, D: 15 } } } };
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const kvFinto = (iniziale = null) => { let v = iniziale; return { get: async () => v, put: async (k, s) => { v = JSON.parse(s); }, valore: () => v }; };
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };

test('categoria dal codice tipo AIS', () => {
  const casi = [[69, 'Passeggeri'], [79, 'Merci'], [89, 'Cisterne'], [30, 'Pesca'], [37, 'Diporto'], [52, 'Servizio'], [35, 'Militare'], [0, 'Altro'], [undefined, 'Altro'], [99, 'Altro']];
  for (const [t, atteso] of casi) assert.equal(categoria(t), atteso, String(t));
});

test('PositionReport: posizione pulita, nome senza @', () => {
  const { mmsi, dati } = leggiMessaggio(POS, 1000);
  assert.equal(mmsi, '247123456');
  assert.deepEqual(dati, { nome: 'GNV BRIDGE', lat: 38.13, lon: 13.37, sog: 12.34, cog: 45.6, prua: 44, stato: 0, visto: 1000 });
});

test('ShipStaticData: tipo, destinazione, lunghezza', () => {
  const { dati } = leggiMessaggio(STAT, 1000);
  assert.equal(dati.tipo, 69);
  assert.equal(dati.destinazione, 'NAPOLI');
  assert.equal(dati.lunghezza, 190);
});

test('messaggi non validi o senza posizione si scartano', () => {
  assert.equal(leggiMessaggio({ MessageType: 'PositionReport', MetaData: { MMSI: 12 }, Message: {} }, 1), null);
  assert.equal(leggiMessaggio({ ...POS, Message: { PositionReport: { Latitude: 0, Longitude: 0 } } }, 1), null);
  assert.equal(leggiMessaggio({ ...POS, Message: { PositionReport: { Latitude: 91, Longitude: 13 } } }, 1), null);
  assert.equal(leggiMessaggio({ MessageType: 'BaseStationReport', MetaData: { MMSI: 247123456 }, Message: {} }, 1), null);
  assert.equal(leggiMessaggio(null, 1), null);
});

test('unisci: una nave per MMSI, dati fissi e posizione si completano, le scadute escono', () => {
  const a = leggiMessaggio(POS, 1000), b = leggiMessaggio(STAT, 1010);
  const stato = unisci(null, [a, b], 1020);
  assert.equal(Object.keys(stato).length, 1);
  assert.equal(stato['247123456'].tipo, 69);
  assert.equal(stato['247123456'].lat, 38.13);
  const dopo = unisci(stato, [], 1000 + SCADENZA_S + 1);
  assert.deepEqual(dopo, {});
  assert.equal(Object.keys(unisci(stato, [], 1000 + SCADENZA_S)).length, 1);
});

test('unisci: i dati fissi arrivati prima della posizione non creano una nave senza posizione', () => {
  assert.deepEqual(unisci(null, [leggiMessaggio(STAT, 1000)], 1001), {});
});

test('geojson: proprietà e stato dedotto', () => {
  const stato = unisci(null, [leggiMessaggio(POS, 1000), leggiMessaggio(STAT, 1000)], 1000);
  const f = geojson(stato, 1180).features[0];
  assert.deepEqual(f.geometry, { type: 'Point', coordinates: [13.37, 38.13] });
  assert.equal(f.properties.categoria, 'Passeggeri');
  assert.equal(f.properties.velocita_kt, 12.3);
  assert.equal(f.properties.rotta, 46);
  assert.equal(f.properties.stato, 'In navigazione');
  assert.equal(f.properties.minuti_fa, 3);
  const ferma = geojson({ x: { lat: 38, lon: 13, sog: 0.1, cog: 200, prua: 90, visto: 5 } }, 5).features[0].properties;
  assert.equal(ferma.stato, 'Ferma');
  assert.equal(ferma.rotta, 90);
});

test('raccogli: invia la sottoscrizione con chiave e riquadro e raccoglie i messaggi', async () => {
  const ascoltatori = {};
  const inviati = [];
  const ws = { addEventListener: (t, f) => { ascoltatori[t] = f; }, send: s => { inviati.push(JSON.parse(s)); setTimeout(() => { ascoltatori.message({ data: JSON.stringify(POS) }); ascoltatori.message({ data: 'non json' }); ascoltatori.close(); }, 0); }, close() {} };
  const modifiche = await raccogli('CHIAVE', async () => ws, () => 77, 1000);
  assert.equal(modifiche.length, 1);
  assert.equal(inviati[0].APIKey, 'CHIAVE');
  assert.equal(inviati[0].BoundingBoxes[0].length, 2);
  assert.ok(inviati[0].FilterMessageTypes.includes('ShipStaticData'));
});

test('aggiorna: scrive nel KV; senza chiave o KV è un errore', async () => {
  const kv = kvFinto();
  const ascoltatori = {};
  const ws = { addEventListener: (t, f) => { ascoltatori[t] = f; }, send() { setTimeout(() => { ascoltatori.message({ data: JSON.stringify(POS) }); ascoltatori.close(); }, 0); }, close() {} };
  const r = await aggiorna({ AISSTREAM_KEY: 'k', NAVI: kv }, async () => ws, () => 500, 1000);
  assert.deepEqual(r, { ricevuti: 1, navi: 1 });
  assert.equal(kv.valore()['247123456'].lat, 38.13);
  await assert.rejects(() => aggiorna({ NAVI: kv }, async () => ws));
  await assert.rejects(() => aggiorna({ AISSTREAM_KEY: 'k' }, async () => ws));
});

test('/navi: GeoJSON dal KV con cache e CORS; origine estranea 403; metodo 405; KV rotto 502', async () => {
  const kv = kvFinto({ a: { lat: 38, lon: 13, sog: 5, cog: 10, visto: 100 } });
  const cache = cacheFinta();
  const rq = (init = {}) => new Request('https://proxy.test/navi', { headers: { origin: ORIGINE }, ...init });
  const a = await gestisciNavi(rq(), { ...env, NAVI: kv }, cache, () => 160);
  assert.equal(a.headers.get('access-control-allow-origin'), ORIGINE);
  assert.equal((await a.json()).features.length, 1);
  const b = await gestisciNavi(rq(), { ...env, NAVI: { get: async () => { throw new Error('x'); } } }, cache, () => 160);
  assert.equal(b.status, 200); // dalla cache
  assert.equal((await gestisciNavi(rq({ headers: { origin: 'https://altro.it' } }), { ...env, NAVI: kv }, null)).status, 403);
  assert.equal((await gestisciNavi(rq({ method: 'POST' }), { ...env, NAVI: kv }, null)).status, 405);
  assert.equal((await gestisciNavi(rq(), { ...env, NAVI: { get: async () => { throw new Error('x'); } } }, null)).status, 502);
});
