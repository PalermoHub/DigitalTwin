// tests/js/allerte-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { livello, ultimoBollettino, geometria, zoneSicilia, costruisci, gestisciAllerte, ZONE_SICILIA } from '../../worker/allerte-core.js';

const ORIGINE = 'https://dt.example';
const env = { ORIGINI: ORIGINE };
const rq = (init = {}) => new Request('https://proxy.test/allerte', { headers: { origin: ORIGINE }, ...init });
const cacheFinta = () => { const m = new Map(); return { match: async k => m.get(k.url)?.clone(), put: async (k, r) => { m.set(k.url, r); } }; };
const BASE = 'https://raw.githubusercontent.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/master/files';

// TopoJSON minimo: 9 quadrati in Sicilia (la prima zona contiene Palermo) e uno in Toscana; coordinate = delta × scala + traslazione
const quadrato = (x, y) => [[x, y], [10, 0], [0, 10], [-10, 0], [0, -10]];
const NESSUNA = 'Assenza di fenomeni significativi prevedibili / NESSUNA ALLERTA';
const topo = (testo, livelloTesto = NESSUNA) => ({
  type: 'Topology', transform: { scale: [0.1, 0.1], translate: [12, 37] },
  arcs: [...Array.from({ length: ZONE_SICILIA }, (_, i) => quadrato(i * 20, 0)), quadrato(20, 80)],
  objects: { x: { type: 'GeometryCollection', geometries: [
    ...Array.from({ length: ZONE_SICILIA }, (_, i) => ({
      type: 'Polygon', arcs: [[i]],
      properties: { 'Nome zona': `Zona ${i}`, Comuni: i === 0 ? ['Palermo', 'Monreale'] : [`Comune ${i}`, 'Enna'], 'Rappresentata nella mappa': i === 0 ? livelloTesto : NESSUNA,
        'Per rischio idraulico': NESSUNA, 'Per rischio temporali': i === 0 ? livelloTesto : NESSUNA, 'Per rischio idrogeologico': NESSUNA },
    })),
    { type: 'Polygon', arcs: [[ZONE_SICILIA]], properties: { 'Nome zona': 'Versilia', Comuni: ['Viareggio'], 'Rappresentata nella mappa': testo } },
  ] } },
});
const GIALLA = 'Ordinaria per rischio temporali / ALLERTA GIALLA';
const bollettino = { date: '2026-10-22T12:37:23.203Z', name: 'Bollettino del 22 ottobre 2026 ore 14:17', global_legend: `${BASE}/Legenda.jpg`,
  today: { topo_json: `${BASE}/topojson/20261022_1417_today.json`, html_descrition: '<p>Oggi:<br/><b>NESSUNA ALLERTA</b></p>' },
  tomorrow: { topo_json: `${BASE}/topojson/20261022_1417_tomorrow.json`, html_descrition: '<p>Domani:<br/><b>ALLERTA GIALLA</b></p>' } };

// risponde come GitHub: elenco della cartella, bollettino, TopoJSON di oggi e domani; conta le richieste
const fonte = (n = { chiamate: 0 }, guasto = null) => async url => {
  n.chiamate++;
  if (guasto) return new Response('no', { status: guasto });
  if (url.includes('/git/trees/')) return new Response(JSON.stringify({ tree: [{ path: '20261021_1436.json' }, { path: '20261022_1417.json' }, { path: 'Legenda.jpg' }, { path: 'topojson' }] }));
  if (url.endsWith('20261022_1417.json')) return new Response(JSON.stringify(bollettino));
  if (url.endsWith('_today.json')) return new Response(JSON.stringify(topo('x')));
  if (url.endsWith('_tomorrow.json')) return new Response(JSON.stringify(topo('x', GIALLA)));
  return new Response('?', { status: 404 });
};

test('livello: dal testo del DPC ai quattro livelli', () => {
  assert.equal(livello('Assenza di fenomeni significativi prevedibili / NESSUNA ALLERTA'), 0);
  assert.equal(livello(GIALLA), 1);
  assert.equal(livello('Moderata per rischio idraulico / ALLERTA ARANCIONE'), 2);
  assert.equal(livello('Elevata per rischio idrogeologico / ALLERTA ROSSA'), 3);
  assert.equal(livello(undefined), 0);
});

test('ultimoBollettino: il nome più recente tra i soli file AAAAMMGG_HHMM.json', () => {
  assert.equal(ultimoBollettino({ tree: [{ path: '20261021_1436.json' }, { path: '20261022_0900.json' }, { path: '20261022_1417.json' }, { path: 'zzz.json' }, { path: '20261022_1417_style.json' }] }), '20261022_1417');
  assert.equal(ultimoBollettino({ tree: [] }), null);
  assert.equal(ultimoBollettino(null), null);
});

test('geometria: decodifica delta e traslazione, anello chiuso', () => {
  const g = geometria(topo('x'), topo('x').objects.x.geometries[0]);
  assert.equal(g.type, 'Polygon');
  assert.deepEqual(g.coordinates[0], [[12, 37], [13, 37], [13, 38], [12, 38], [12, 37]]);
});

test('zoneSicilia: le nove zone siciliane, non quelle delle altre regioni', () => {
  const z = zoneSicilia(topo('x'));
  assert.equal(z.length, ZONE_SICILIA);
  assert.ok(!z.some(x => x.proprieta['Nome zona'] === 'Versilia'));
  assert.deepEqual(zoneSicilia(null), []);
});

test('costruisci: una zona per feature, livelli di oggi e domani, Palermo segnata', () => {
  const fc = costruisci('20261022_1417', bollettino, { today: topo('x'), tomorrow: topo('x', GIALLA) });
  assert.equal(fc.features.length, ZONE_SICILIA);
  const p = fc.features[0].properties;
  assert.equal(p.palermo, true);
  assert.equal(p.oggi.livello, 0);
  assert.equal(p.domani.livello, 1);
  assert.equal(p.domani.temporali, 1);
  assert.equal(p.livello, 1);
  assert.equal(fc.features.filter(f => f.properties.palermo).length, 1);
  assert.equal(fc.features[1].properties.livello, 0);
  assert.equal(p.descrizione_domani, undefined); // il testo del DPC elenca tutte le regioni: non serve
  assert.equal(fc.aggiornato, Math.floor(Date.parse(bollettino.date) / 1000));
  assert.throws(() => costruisci('20261022_1417', bollettino, { today: { objects: {} }, tomorrow: topo('x') }), /non trovate/);
});

test('risposta: GeoJSON delle zone siciliane, in cache per le richieste successive', async () => {
  const n = { chiamate: 0 };
  const cache = cacheFinta();
  const r = await gestisciAllerte(rq(), env, fonte(n), cache);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGINE);
  const corpo = await r.json();
  assert.equal(corpo.features.length, ZONE_SICILIA);
  assert.equal(corpo.features[0].properties.zona, 'Zona 0');
  assert.equal(n.chiamate, 4);
  await gestisciAllerte(rq(), env, fonte(n), cache);
  assert.equal(n.chiamate, 4);
});

test('origine non ammessa e metodo non ammesso', async () => {
  assert.equal((await gestisciAllerte(new Request('https://proxy.test/allerte', { headers: { origin: 'https://altro.example' } }), env, fonte(), cacheFinta())).status, 403);
  assert.equal((await gestisciAllerte(rq({ method: 'POST' }), env, fonte(), cacheFinta())).status, 405);
  assert.equal((await gestisciAllerte(rq({ method: 'OPTIONS' }), env, fonte(), cacheFinta())).status, 204);
});

test('fonte guasta: ultimo bollettino buono se c\'è, altrimenti 502', async () => {
  const cache = cacheFinta();
  assert.equal((await gestisciAllerte(rq(), env, fonte({ chiamate: 0 }, 500), cache)).status, 502);
  await gestisciAllerte(rq(), env, fonte(), cache);
  cache.match = (orig => async k => (k.url.endsWith('/allerte') ? undefined : orig(k)))(cache.match); // scaduta la copia fresca, resta l'ultima buona
  const r = await gestisciAllerte(rq(), env, fonte({ chiamate: 0 }, 500), cache);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-dati'), 'precedenti');
});

test('un TopoJSON fuori dal repository del DPC non si scarica', async () => {
  const f = async url => (url.includes('/git/trees/') ? new Response(JSON.stringify({ tree: [{ path: '20261022_1417.json' }] }))
    : new Response(JSON.stringify({ ...bollettino, today: { topo_json: 'https://evil.example/x.json' } })));
  assert.equal((await gestisciAllerte(rq(), env, f, cacheFinta())).status, 502);
});
