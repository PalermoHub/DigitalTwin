// tests/js/aggiungi-arcgis.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { leggiUrlArcgis, urlInfo, descriviArcgis, urlExport, urlTileCache, urlQuery } from '../../js/aggiungi/arcgis.js';

const MAP = 'https://x.it/arcgis/rest/services/Cat/Strade/MapServer';

test('leggiUrlArcgis: servizio, layer singolo, token e f tolti dall’indirizzo', () => {
  assert.deepEqual(leggiUrlArcgis(MAP), { base: MAP, tipo: 'MapServer', layerId: null, token: null });
  assert.deepEqual(leggiUrlArcgis(`${MAP}/`), { base: MAP, tipo: 'MapServer', layerId: null, token: null });
  assert.deepEqual(leggiUrlArcgis(`${MAP}/3?f=html&token=a%20b`), { base: MAP, tipo: 'MapServer', layerId: 3, token: 'a b' });
  assert.deepEqual(leggiUrlArcgis('https://x.it/a/rest/services/F/FeatureServer?token=t'), { base: 'https://x.it/a/rest/services/F/FeatureServer', tipo: 'FeatureServer', layerId: null, token: 't' });
});

test('leggiUrlArcgis: non https, non ArcGIS, ImageServer → errori in chiaro', () => {
  assert.throws(() => leggiUrlArcgis('http://x.it/a/MapServer'), /https/);
  assert.throws(() => leggiUrlArcgis('https://x.it/ows'), /MapServer o FeatureServer/);
  assert.throws(() => leggiUrlArcgis('https://x.it/a/ImageServer'), /MapServer o FeatureServer/);
  assert.throws(() => leggiUrlArcgis('ciao'), /non valido/);
});

test('urlInfo: del servizio o del layer', () => {
  assert.equal(urlInfo({ base: MAP, layerId: null }), `${MAP}?f=json`);
  assert.equal(urlInfo({ base: MAP, layerId: 3 }), `${MAP}/3?f=json`);
});

const CACHE = { singleFusedMapCache: true, tileInfo: { rows: 256, cols: 256, origin: { x: -20037508.342787, y: 20037508.342787 }, spatialReference: { wkid: 102100, latestWkid: 3857 }, lods: [{ level: 0 }, { level: 1 }, { level: 2 }] } };

test('MapServer dinamico: solo i layer foglia, con vettoriale a seconda della geometria', () => {
  const d = descriviArcgis({
    layers: [{ id: 0, name: 'Gruppo', subLayerIds: [1, 2] }, { id: 1, name: 'Strade', subLayerIds: null, geometryType: 'esriGeometryPolyline' }, { id: 2, name: 'Etichette', subLayerIds: null }],
    singleFusedMapCache: false,
  }, { tipo: 'MapServer', layerId: null });
  assert.equal(d.cache, false);
  assert.deepEqual(d.layer, [{ id: 1, nome: 'Strade', vettoriale: true }, { id: 2, nome: 'Etichette', vettoriale: true }]);
});

test('MapServer con cache a tile Web Mercator da livello 0: cache true', () => {
  assert.equal(descriviArcgis({ layers: [{ id: 0, name: 'A', subLayerIds: null }], ...CACHE }, { tipo: 'MapServer', layerId: null }).cache, true);
});

test('cache non utilizzabile (origine diversa, tile 512, livelli che non partono da 0, altro CRS) → cache false', () => {
  const con = patch => descriviArcgis({ layers: [{ id: 0, name: 'A', subLayerIds: null }], ...CACHE, tileInfo: { ...CACHE.tileInfo, ...patch } }, { tipo: 'MapServer', layerId: null }).cache;
  assert.equal(con({ origin: { x: -180, y: 90 } }), false);
  assert.equal(con({ rows: 512, cols: 512 }), false);
  assert.equal(con({ lods: [{ level: 3 }, { level: 4 }] }), false);
  assert.equal(con({ spatialReference: { wkid: 4326 } }), false);
});

test('FeatureServer: i layer sono vettoriali e non c’è cache', () => {
  const d = descriviArcgis({ layers: [{ id: 0, name: 'Punti', geometryType: 'esriGeometryPoint' }], tables: [{ id: 5, name: 'Tabella' }] }, { tipo: 'FeatureServer', layerId: null });
  assert.deepEqual(d, { tipo: 'FeatureServer', cache: false, layer: [{ id: 0, nome: 'Punti', vettoriale: true }] });
});

test('layer singolo: il JSON è quello del layer', () => {
  const d = descriviArcgis({ id: 3, name: 'Edifici', type: 'Feature Layer', geometryType: 'esriGeometryPolygon' }, { tipo: 'MapServer', layerId: 3 });
  assert.deepEqual(d, { tipo: 'MapServer', cache: false, layer: [{ id: 3, nome: 'Edifici', vettoriale: true }] });
});

test('errori del servizio: messaggio in chiaro, token mancante spiegato; JSON senza layer → errore', () => {
  assert.throws(() => descriviArcgis({ error: { code: 400, message: 'Service not found' } }, { tipo: 'MapServer', layerId: null }), /Service not found/);
  assert.throws(() => descriviArcgis({ error: { code: 499, message: 'Token Required' } }, { tipo: 'MapServer', layerId: null }), /token/i);
  assert.throws(() => descriviArcgis({ error: { code: 498, message: 'Invalid token.' } }, { tipo: 'MapServer', layerId: null }), /token/i);
  assert.throws(() => descriviArcgis({ pippo: 1 }, { tipo: 'MapServer', layerId: null }), /non è un servizio ArcGIS/);
  assert.throws(() => descriviArcgis({ layers: [] }, { tipo: 'MapServer', layerId: null }), /nessun layer/);
});

test('urlExport: segnaposto del riquadro intatti, un layer per volta', () => {
  assert.equal(urlExport(MAP, 4), `${MAP}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&dpi=96&layers=show%3A4&f=image`);
});

test('urlTileCache: ordine z/y/x di ArcGIS', () => {
  assert.equal(urlTileCache(MAP), `${MAP}/tile/{z}/{y}/{x}`);
});

test('urlQuery: riquadro di Palermo in WGS84, GeoJSON, tetto richiesto', () => {
  const u = new URL(urlQuery(MAP, 1, [13.1, 37.9785, 13.55, 38.2919], 5001));
  assert.equal(u.pathname, '/arcgis/rest/services/Cat/Strade/MapServer/1/query');
  const p = u.searchParams;
  assert.equal(p.get('where'), '1=1');
  assert.equal(p.get('geometry'), '13.1,37.9785,13.55,38.2919');
  assert.equal(p.get('geometryType'), 'esriGeometryEnvelope');
  assert.equal(p.get('inSR'), '4326');
  assert.equal(p.get('outSR'), '4326');
  assert.equal(p.get('spatialRel'), 'esriSpatialRelIntersects');
  assert.equal(p.get('outFields'), '*');
  assert.equal(p.get('returnGeometry'), 'true');
  assert.equal(p.get('f'), 'geojson');
  assert.equal(p.get('resultRecordCount'), '5001');
});
