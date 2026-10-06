// tests/js/aggiungi-controllo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaControllo } from '../../js/aggiungi/controllo.js';
import { leggiServizi, TETTO_SERVIZI } from '../../js/aggiungi/salvati.js';
import { creaCredenziali } from '../../js/aggiungi/credenziali.js';

const WMS = `<WMS_Capabilities version="1.3.0"><Capability><Request><GetMap><Format>image/png</Format></GetMap></Request>
<Layer><CRS>EPSG:3857</CRS><Layer><Name>pai</Name><Title>Piano PAI</Title></Layer><Layer><Name>rischio</Name><Title>Rischio</Title></Layer></Layer></Capability></WMS_Capabilities>`;
const WFS = '<WFS_Capabilities version="2.0.0"><FeatureTypeList><FeatureType><Name>ns:strade</Name><Title>Strade</Title></FeatureType></FeatureTypeList></WFS_Capabilities>';

const finto = () => { const m = new Map(); return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } }; };
function costruisci({ testo = WMS, risposte = null, wfsEsito = async () => 'miei-id', storage = finto() } = {}) {
  const chiamate = { tile: [], wms: [], wfs: [], fetch: [] };
  const host = {
    fetchArrayBuffer: async u => { chiamate.fetch.push(u); return new TextEncoder().encode(risposte ? risposte(u) : testo).buffer; },
    addTileLayer: (n, u) => { chiamate.tile.push([n, u]); return 'miei-t'; },
    addWmsLayer: (n, o) => { chiamate.wms.push([n, o]); return 'miei-w'; },
    addWfsLayer: async (n, r) => { chiamate.wfs.push([n, r]); return wfsEsito(n, r); },
  };
  const credenziali = creaCredenziali();
  return { c: creaControllo({ host, storage, credenziali }), chiamate, storage, credenziali };
}

test('leggiServizio WMS: chiede le capabilities e dà layer, versione e URL pulito', async () => {
  const { c, chiamate } = costruisci();
  const r = await c.leggiServizio('wms', 'https://x.it/ows?map=a&request=GetCapabilities');
  assert.equal(r.url, 'https://x.it/ows?map=a');
  assert.equal(r.versione, '1.3.0');
  assert.deepEqual(r.layer.map(l => l.nome), ['pai', 'rischio']);
  assert.match(chiamate.fetch[0], /REQUEST=GetCapabilities/);
  await assert.rejects(() => c.leggiServizio('wms', 'http://x.it/ows'), /https/);
});

test('aggiungiXyz: layer in mappa e servizio salvato; URL non valido → errore e niente salvato', () => {
  const { c, chiamate, storage } = costruisci();
  assert.deepEqual(c.aggiungiXyz({ nome: 'Ortofoto', url: 'https://t.it/{z}/{x}/{y}.png' }), { pieno: false });
  assert.deepEqual(chiamate.tile, [['Ortofoto', 'https://t.it/{z}/{x}/{y}.png']]);
  assert.equal(leggiServizi(storage).servizi[0].tipo, 'xyz');
  assert.throws(() => c.aggiungiXyz({ nome: 'X', url: 'https://t.it/tile.png' }), /\{z\}/);
  assert.equal(chiamate.tile.length, 1);
  assert.equal(leggiServizi(storage).servizi.length, 1);
});

test('aggiungiXyz senza nome: vale il nome dell’host', () => {
  const { c, chiamate } = costruisci();
  c.aggiungiXyz({ nome: '  ', url: 'https://t.it/{z}/{x}/{y}.png' });
  assert.equal(chiamate.tile[0][0], 't.it');
});

test('aggiungiWms: un layer per scelta, con le opzioni del servizio; salvato con le voci', async () => {
  const { c, chiamate, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  const r = await c.aggiungiWms({ nome: 'Servizio PAI', url: servizio.url, servizio, scelti: [servizio.layer[0]] });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.equal(chiamate.wms.length, 1);
  assert.deepEqual([chiamate.wms[0][0], chiamate.wms[0][1].layers, chiamate.wms[0][1].version, chiamate.wms[0][1].format], ['Piano PAI', 'pai', '1.3.0', 'image/png']);
  const salvato = leggiServizi(storage).servizi[0];
  assert.deepEqual([salvato.tipo, salvato.nome, salvato.voci.length], ['wms', 'Servizio PAI', 1]);
});

test('aggiungiWms: un layer non supportato (niente EPSG:3857) non si aggiunge ma non rompe gli altri', async () => {
  const { c, chiamate } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  const scelti = [{ ...servizio.layer[0], supportato: false }, servizio.layer[1]];
  const r = await c.aggiungiWms({ nome: '', url: servizio.url, servizio, scelti });
  assert.equal(chiamate.wms.length, 1);
  assert.equal(r.errori.length, 1);
  assert.match(r.errori[0].messaggio, /3857/);
});

test('aggiungiWfs: costruisce il GetFeature con bbox di Palermo e tetto, salva le voci riuscite; un errore non ferma gli altri', async () => {
  const esito = async n => { if (n === 'Rotto') throw new Error('il servizio non produce GeoJSON'); return 'miei-ok'; };
  const { c, chiamate, storage } = costruisci({ testo: WFS, wfsEsito: esito });
  const servizio = await c.leggiServizio('wfs', 'https://x.it/wfs');
  const r = await c.aggiungiWfs({ nome: 'Strade', url: servizio.url, servizio, scelti: [servizio.tipi[0], { nome: 'ns:rotto', titolo: 'Rotto' }] });
  assert.equal(chiamate.wfs.length, 2);
  assert.match(chiamate.wfs[0][1], /typeNames=ns%3Astrade/);
  assert.match(chiamate.wfs[0][1], /count=5001/);
  assert.deepEqual(r.errori, [{ nome: 'Rotto', messaggio: 'il servizio non produce GeoJSON' }]);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 1);
});

test('aggiungiWfs: se tutto fallisce non si salva alcun servizio', async () => {
  const { c, storage } = costruisci({ testo: WFS, wfsEsito: async () => { throw new Error('più di 5000 elementi'); } });
  const servizio = await c.leggiServizio('wfs', 'https://x.it/wfs');
  const r = await c.aggiungiWfs({ nome: 'S', url: servizio.url, servizio, scelti: servizio.tipi });
  assert.equal(r.errori.length, 1);
  assert.equal(leggiServizi(storage).servizi.length, 0);
});

test('riaggiungi: rimette in mappa le voci salvate senza rileggere il servizio; due volte non duplica il servizio', async () => {
  const { c, chiamate, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer });
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer });
  assert.equal(leggiServizi(storage).servizi.length, 1);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 2);
  const fetchPrima = chiamate.fetch.length;
  const id = leggiServizi(storage).servizi[0].id;
  const r = await c.riaggiungi(id);
  assert.deepEqual(r, { errori: [] });
  assert.equal(chiamate.fetch.length, fetchPrima);
  assert.equal(chiamate.wms.length, 2 + 2 + 2);
});

test('rimuovi toglie il servizio dai salvati e avvisa chi ascolta', () => {
  const { c, storage } = costruisci();
  let avvisi = 0;
  c.suCambio(() => { avvisi++; });
  c.aggiungiXyz({ nome: 'A', url: 'https://t.it/{z}/{x}/{y}.png' });
  c.rimuovi(c.stato().servizi[0].id);
  assert.equal(leggiServizi(storage).servizi.length, 0);
  assert.equal(avvisi, 2);
});

test('al 51° servizio il layer entra in mappa ma il servizio non si salva: pieno true', () => {
  const { c, chiamate } = costruisci();
  for (let i = 0; i < TETTO_SERVIZI; i++) c.aggiungiXyz({ nome: `T${i}`, url: `https://t${i}.it/{z}/{x}/{y}.png` });
  assert.deepEqual(c.aggiungiXyz({ nome: 'Extra', url: 'https://extra.it/{z}/{x}/{y}.png' }), { pieno: true });
  assert.equal(chiamate.tile.length, TETTO_SERVIZI + 1);
  assert.equal(c.stato().servizi.length, TETTO_SERVIZI);
});

test('storage bloccato: tutto funziona per la sessione senza eccezioni', () => {
  const rotto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); } };
  const { c, chiamate } = costruisci({ storage: rotto });
  assert.doesNotThrow(() => c.aggiungiXyz({ nome: 'A', url: 'https://t.it/{z}/{x}/{y}.png' }));
  assert.equal(chiamate.tile.length, 1);
  assert.equal(c.stato().servizi.length, 1);
});

test('leggiServizio con utente e password: le credenziali valgono per l’host prima della richiesta', async () => {
  const { c, credenziali } = costruisci();
  assert.equal(credenziali.intestazione('x.it'), null);
  await c.leggiServizio('wms', 'https://x.it/ows', { utente: 'mario', password: 'pw' });
  assert.equal(credenziali.utente('x.it'), 'mario');
  assert.ok(credenziali.intestazione('x.it').startsWith('Basic '));
});

test('il servizio salvato ricorda l’utente, mai la password', async () => {
  const { c, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows', { utente: 'mario', password: 'segretissima' });
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: [servizio.layer[0]], utente: 'mario' });
  const grezzo = [...storage.m.values()].join('|');
  assert.ok(grezzo.includes('"utente":"mario"'));
  assert.ok(!grezzo.includes('segretissima'));
  assert.ok(!grezzo.includes(Buffer.from('mario:segretissima').toString('base64')));
});

test('aggiungiXyz con credenziali: impostate per l’host e utente salvato', () => {
  const { c, credenziali, storage } = costruisci();
  c.aggiungiXyz({ nome: 'T', url: 'https://t.it/{z}/{x}/{y}.png', utente: 'mario', password: 'pw' });
  assert.equal(credenziali.utente('t.it'), 'mario');
  assert.equal(leggiServizi(storage).servizi[0].utente, 'mario');
});

test('riaggiungi di un servizio protetto: senza password non parte nulla; con la password sì', async () => {
  const storage = finto();
  const primo = costruisci({ storage });
  const servizio = await primo.c.leggiServizio('wms', 'https://x.it/ows', { utente: 'mario', password: 'pw' });
  await primo.c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: [servizio.layer[0]], utente: 'mario' });
  // nuova «sessione»: stesso storage, nessuna credenziale in memoria
  const secondo = costruisci({ storage });
  const id = leggiServizi(storage).servizi[0].id;
  assert.equal(secondo.c.serveCredenziali(id), true);
  assert.equal(secondo.c.protetto('https://x.it/ows?y=1'), true);
  const senza = await secondo.c.riaggiungi(id);
  assert.equal(senza.serve, true);
  assert.equal(secondo.chiamate.wms.length, 0);
  const con = await secondo.c.riaggiungi(id, { password: 'pw' });
  assert.deepEqual(con, { errori: [] });
  assert.equal(secondo.chiamate.wms.length, 1);
  assert.equal(secondo.c.serveCredenziali(id), false);
  assert.equal(secondo.c.protetto('https://x.it/ows'), false);
});

test('cerca filtra i servizi salvati', () => {
  const { c } = costruisci();
  c.aggiungiXyz({ nome: 'Ortofoto', url: 'https://a.it/{z}/{x}/{y}.png' });
  c.aggiungiXyz({ nome: 'Strade', url: 'https://b.it/{z}/{x}/{y}.png' });
  assert.deepEqual(c.cerca('orto').map(s => s.nome), ['Ortofoto']);
});

test('password sbagliata: le credenziali si dimenticano e il lucchetto resta', async () => {
  const storage = finto();
  const primo = costruisci({ testo: WFS, storage });
  const servizio = await primo.c.leggiServizio('wfs', 'https://x.it/wfs', { utente: 'mario', password: 'giusta' });
  await primo.c.aggiungiWfs({ nome: 'S', url: servizio.url, servizio, scelti: servizio.tipi, utente: 'mario' });
  const secondo = costruisci({ testo: WFS, storage, wfsEsito: async () => { throw new Error('il servizio richiede utente e password'); } });
  const id = leggiServizi(storage).servizi[0].id;
  const r = await secondo.c.riaggiungi(id, { password: 'sbagliata' });
  assert.equal(r.errori.length, 1);
  assert.equal(secondo.c.serveCredenziali(id), true);
});

const WMTS = `<Capabilities version="1.0.0"><ServiceIdentification><ServiceType>OGC WMTS</ServiceType></ServiceIdentification>
<Contents><Layer><Title>Base</Title><Identifier>base</Identifier><Format>image/png</Format>
<TileMatrixSetLink><TileMatrixSet>web</TileMatrixSet></TileMatrixSetLink>
<ResourceURL format="image/png" resourceType="tile" template="https://w.it/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"/></Layer>
<TileMatrixSet><Identifier>web</Identifier><SupportedCRS>EPSG:3857</SupportedCRS>
<TileMatrix><Identifier>0</Identifier><ScaleDenominator>559082264</ScaleDenominator><TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner><TileWidth>256</TileWidth><TileHeight>256</TileHeight><MatrixWidth>1</MatrixWidth><MatrixHeight>1</MatrixHeight></TileMatrix></TileMatrixSet>
</Contents></Capabilities>`;
const ARC_URL = 'https://x.it/arcgis/rest/services/S/MapServer';
const ARC_DINAMICO = JSON.stringify({ layers: [{ id: 1, name: 'Strade', subLayerIds: null }, { id: 2, name: 'Edifici', subLayerIds: null }] });
const ARC_CACHE = JSON.stringify({ layers: [{ id: 1, name: 'Strade', subLayerIds: null }], singleFusedMapCache: true,
  tileInfo: { rows: 256, cols: 256, origin: { x: -20037508.342787, y: 20037508.342787 }, spatialReference: { wkid: 3857 }, lods: [{ level: 0 }, { level: 1 }] } });

test('WMTS: legge, aggiunge i layer come tile XYZ e salva le voci con l’URL calcolato', async () => {
  const { c, chiamate, storage } = costruisci({ testo: WMTS });
  const servizio = await c.leggiServizio('wmts', 'https://w.it/wmts');
  assert.equal(servizio.layer[0].tile, 'https://w.it/web/{z}/{y}/{x}.png');
  const r = await c.aggiungiWmts({ nome: 'W', url: servizio.url, servizio, scelti: servizio.layer });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.deepEqual(chiamate.tile, [['Base', 'https://w.it/web/{z}/{y}/{x}.png']]);
  assert.deepEqual(leggiServizi(storage).servizi[0].voci, [{ chiave: 'base', nome: 'Base', tile: 'https://w.it/web/{z}/{y}/{x}.png' }]);
});

test('WMTS: un layer non supportato non si aggiunge e dà l’errore in chiaro', async () => {
  const { c, chiamate } = costruisci({ testo: WMTS });
  const servizio = await c.leggiServizio('wmts', 'https://w.it/wmts');
  const r = await c.aggiungiWmts({ nome: '', url: servizio.url, servizio, scelti: [{ ...servizio.layer[0], supportato: false, tile: null }] });
  assert.equal(chiamate.tile.length, 0);
  assert.match(r.errori[0].messaggio, /compatibile/);
});

test('ArcGIS dinamico, immagini: un layer raster export per layer scelto', async () => {
  const { c, chiamate, storage } = costruisci({ risposte: () => ARC_DINAMICO });
  const servizio = await c.leggiServizio('arcgis', ARC_URL);
  assert.equal(servizio.cache, false);
  assert.match(chiamate.fetch[0], /MapServer\?f=json$/);
  const r = await c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: [servizio.layer[0]], modo: 'immagini' });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.equal(chiamate.tile.length, 1);
  assert.equal(chiamate.tile[0][0], 'Strade');
  assert.match(chiamate.tile[0][1], /\/export\?bbox=\{bbox-epsg-3857\}.*layers=show%3A1&f=image$/);
  assert.equal(leggiServizi(storage).servizi[0].tipo, 'arcgis');
});

test('ArcGIS con cache: un solo layer con i tile z/y/x, qualunque sia la scelta', async () => {
  const { c, chiamate } = costruisci({ risposte: () => ARC_CACHE });
  const servizio = await c.leggiServizio('arcgis', ARC_URL);
  assert.equal(servizio.cache, true);
  await c.aggiungiArcgis({ nome: 'Strade', url: servizio.url, servizio, scelti: servizio.layer, modo: 'immagini' });
  assert.deepEqual(chiamate.tile, [['Strade', `${ARC_URL}/tile/{z}/{y}/{x}`]]);
});

test('ArcGIS, dati: ogni layer scaricato come GeoJSON con la query sul riquadro di Palermo; un errore non ferma gli altri', async () => {
  const esito = async n => { if (n === 'Edifici') throw new Error('più di 5000 elementi'); return 'miei-ok'; };
  const { c, chiamate, storage } = costruisci({ risposte: () => ARC_DINAMICO, wfsEsito: esito });
  const servizio = await c.leggiServizio('arcgis', ARC_URL);
  const r = await c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer, modo: 'dati' });
  assert.equal(chiamate.wfs.length, 2);
  assert.match(chiamate.wfs[0][1], /\/1\/query\?/);
  assert.match(chiamate.wfs[0][1], /resultRecordCount=5001/);
  assert.deepEqual(r.errori, [{ nome: 'Edifici', messaggio: 'più di 5000 elementi' }]);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 1);
});

test('ArcGIS: errore nel JSON (token richiesto) → messaggio in chiaro; non ArcGIS → errore', async () => {
  const a = costruisci({ risposte: () => JSON.stringify({ error: { code: 499, message: 'Token Required' } }) });
  await assert.rejects(() => a.c.leggiServizio('arcgis', ARC_URL), /richiede un token/);
  const b = costruisci({ risposte: () => '<html>no</html>' });
  await assert.rejects(() => b.c.leggiServizio('arcgis', ARC_URL), /non è un servizio ArcGIS/);
});

test('token nell’indirizzo: in memoria, tolto dall’URL e mai salvato; il servizio resta con conToken', async () => {
  const { c, credenziali, storage } = costruisci({ risposte: () => ARC_DINAMICO });
  const servizio = await c.leggiServizio('arcgis', `${ARC_URL}?token=SEGRETISSIMO`);
  assert.equal(servizio.url, ARC_URL);
  assert.equal(servizio.conToken, true);
  assert.equal(credenziali.token('x.it'), 'SEGRETISSIMO');
  await c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer, modo: 'immagini', conToken: true });
  const grezzo = [...storage.m.values()].join('|');
  assert.ok(!grezzo.includes('SEGRETISSIMO'));
  assert.ok(grezzo.includes('"conToken":true'));
});

test('servizio ArcGIS con token: alla riapertura serve il lucchetto; col token si rimette in mappa; token sbagliato → il lucchetto resta', async () => {
  const storage = finto();
  const primo = costruisci({ risposte: () => ARC_DINAMICO, storage });
  const servizio = await primo.c.leggiServizio('arcgis', `${ARC_URL}?token=t1`);
  await primo.c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer, modo: 'immagini', conToken: servizio.conToken });
  const secondo = costruisci({ risposte: () => ARC_DINAMICO, storage });
  const id = leggiServizi(storage).servizi[0].id;
  assert.equal(secondo.c.serveCredenziali(id), true);
  assert.equal(secondo.c.protetto(`${ARC_URL}/export?x=1`), true);
  assert.equal((await secondo.c.riaggiungi(id)).serve, true);
  assert.equal(secondo.chiamate.tile.length, 0);
  const con = await secondo.c.riaggiungi(id, { password: 't2' });
  assert.deepEqual(con, { errori: [] });
  assert.equal(secondo.credenziali.token('x.it'), 't2');
  assert.equal(secondo.chiamate.tile.length, 2);
  assert.equal(secondo.c.serveCredenziali(id), false);
});

test('riaggiungi ricostruisce dalle voci: tile, richiesta e opz', async () => {
  const { c, chiamate, storage } = costruisci({ testo: WMTS });
  const servizio = await c.leggiServizio('wmts', 'https://w.it/wmts');
  await c.aggiungiWmts({ nome: 'W', url: servizio.url, servizio, scelti: servizio.layer });
  chiamate.tile.length = 0;
  await c.riaggiungi(leggiServizi(storage).servizi[0].id);
  assert.deepEqual(chiamate.tile, [['Base', 'https://w.it/web/{z}/{y}/{x}.png']]);
});
