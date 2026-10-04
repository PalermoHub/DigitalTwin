// tests/js/rndt-host.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaHost, urlProxy, TETTO_DATI } from '../../js/rndt/host.js';

const PROXY = 'https://proxy.test';
const quadrato = [[13.3, 38.1], [13.4, 38.1], [13.4, 38.2], [13.3, 38.2], [13.3, 38.1]];

function mappaFinta() {
  const sorgenti = new Map(), strati = new Map(), chiamate = [];
  return {
    sorgenti, strati, chiamate,
    addSource: (id, s) => sorgenti.set(id, s), removeSource: id => sorgenti.delete(id), getSource: id => sorgenti.get(id),
    addLayer: l => strati.set(l.id, l), removeLayer: id => strati.delete(id), getLayer: id => strati.get(id),
    setLayoutProperty: (id, k, v) => { strati.get(id).layout = { ...strati.get(id).layout, [k]: v }; },
    getBounds: () => ({ getWest: () => 13.0, getSouth: () => 37.0, getEast: () => 13.4, getNorth: () => 38.1 }),
    fitBounds: (b, o) => chiamate.push(['fitBounds', b, o]),
    queryRenderedFeatures: () => [], on() {},
  };
}
const corpo = testo => ({ ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(testo).buffer });
const costruisci = (extra = {}) => {
  const map = mappaFinta(), scritti = [], avvisi = [], chiamate = [];
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return extra.scrivi?.(s) ?? true; },
    anelli: () => extra.anelli ?? [], notifica: m => avvisi.push(m),
    fetchFn: extra.fetchFn ?? (async u => { chiamate.push(u); return corpo(extra.corpo ?? '{}'); }),
  });
  return { host, map, scritti, avvisi, chiamate };
};
const wmsOpz = { url: 'https://wms.example.org/ows?map=a', layers: 'pai', version: '1.3.0', format: 'image/png', transparent: true };
const fc = features => ({ type: 'FeatureCollection', features });
const pt = c => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } });

test('urlProxy: percorso e query dell’originale, segnaposto intatti', () => {
  assert.equal(urlProxy(PROXY + '/', 'https://a.it/x/{z}/{x}/{y}.png'), 'https://proxy.test/t/a.it/x/{z}/{x}/{y}.png');
  assert.equal(urlProxy(PROXY, 'http://a.it/ows?SERVICE=WMS'), 'https://proxy.test/t/a.it/ows?SERVICE=WMS');
  assert.equal(urlProxy(PROXY, 'https://a.it'), 'https://proxy.test/t/a.it/');
  assert.throws(() => urlProxy(PROXY, 'ftp://a.it'), /non valido/);
});

test('addWmsLayer: sorgente raster dai tile proxati, una volta sola, e salvataggio', () => {
  const { host, map, scritti } = costruisci();
  const id = host.addWmsLayer('PAI', wmsOpz);
  const sorg = map.sorgenti.get(id);
  assert.equal(sorg.type, 'raster');
  assert.ok(sorg.tiles[0].startsWith('https://proxy.test/t/wms.example.org/ows?'));
  assert.ok(sorg.tiles[0].endsWith('&BBOX={bbox-epsg-3857}'));
  assert.match(sorg.tiles[0], /LAYERS=pai/);
  assert.match(sorg.tiles[0], /CRS=EPSG%3A3857|CRS=EPSG:3857/);
  assert.deepEqual(sorg.bounds, [13.1, 37.9785, 13.55, 38.2919]);
  assert.equal(map.strati.get(id).type, 'raster');
  assert.equal(host.addWmsLayer('PAI', wmsOpz), id);
  assert.equal(map.strati.size, 1);
  assert.equal(scritti.at(-1).layers[0].tipo, 'wms');
  assert.deepEqual(host.getLayers(), [id]);
});

test('addWmsLayer rifiuta un CRS diverso da EPSG:3857', () => {
  assert.throws(() => costruisci().host.addWmsLayer('X', { ...wmsOpz, crs: 'EPSG:4326' }), /non supportato/);
});

test('addTileLayer passa dal proxy e conserva i segnaposto', () => {
  const { host, map } = costruisci();
  const id = host.addTileLayer('Sfondo', 'https://tile.example.org/{z}/{x}/{y}.png', { attribution: '© X' });
  assert.equal(map.sorgenti.get(id).tiles[0], 'https://proxy.test/t/tile.example.org/{z}/{x}/{y}.png');
});

test('getViewBounds è sempre dentro Palermo; fitBounds muove la mappa', () => {
  const { host, map } = costruisci();
  assert.deepEqual(host.getViewBounds(), [13.1, 37.9785, 13.4, 38.1]);
  host.fitBounds([13.2, 38.0, 13.3, 38.1]);
  assert.deepEqual(map.chiamate[0][1], [[13.2, 38.0], [13.3, 38.1]]);
});

test('fetchArrayBuffer passa dal proxy e rifiuta il download senza area', async () => {
  const { host, chiamate } = costruisci();
  await host.fetchArrayBuffer('https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=1,2,3,4');
  assert.equal(chiamate[0], 'https://proxy.test/t/wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=1,2,3,4');
  await host.fetchArrayBuffer('https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&resultType=hits');
  await host.fetchArrayBuffer('https://wms.example.org/ows?REQUEST=GetFeatureInfo&LAYERS=a');
  await assert.rejects(host.fetchArrayBuffer('https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x'), /limitato a Palermo/);
});

test('fetchArrayBuffer: risposta non ok = errore con lo stato', async () => {
  const { host } = costruisci({ fetchFn: async () => ({ ok: false, status: 403, arrayBuffer: async () => new ArrayBuffer(0) }) });
  await assert.rejects(host.fetchArrayBuffer('https://a.it/x'), /HTTP 403/);
});

test('addGeoJsonLayer salva l’URL del download recente', async () => {
  const url = 'https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=13.1,37.9,13.5,38.3';
  const a = costruisci();
  await a.host.fetchArrayBuffer(url);
  const id = a.host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15])]));
  assert.equal(a.scritti.at(-1).layers[0].sorgente.url, url);
  assert.equal(a.host.elenco().find(l => l.id === id).salvato, true);
});

test('addGeoJsonLayer senza download (file locale) salva i dati già filtrati', () => {
  const { host, scritti } = costruisci({ anelli: [quadrato] });
  const id = host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15]), pt([14, 39])]));
  const salvato = scritti.at(-1).layers[0];
  assert.equal(salvato.id, id);
  assert.equal(salvato.sorgente.dati.features.length, 1);
  assert.equal(host.elenco().find(l => l.id === id).salvato, true);
});

test('GeoJSON oltre il tetto: resta in mappa solo per la sessione, con avviso', () => {
  const grosso = fc([{ type: 'Feature', properties: { x: 'a'.repeat(TETTO_DATI) }, geometry: { type: 'Point', coordinates: [13.35, 38.15] } }]);
  const { host, map, scritti, avvisi } = costruisci();
  const id = host.addGeoJsonLayer('Grosso', grosso);
  assert.equal(map.sorgenti.size, 1);
  assert.equal(scritti.length, 0);
  assert.equal(host.elenco().find(l => l.id === id).salvato, false);
  assert.match(avvisi[0], /troppo grande/);
});

test('scrittura fallita di un GeoJSON: l’archivio non lo contiene e gli altri layer si salvano ancora', () => {
  const { host, scritti, avvisi } = costruisci({ scrivi: s => !s.layers.some(l => l.tipo === 'geojson') });
  const id = host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15])]));
  assert.equal(host.elenco().find(l => l.id === id).salvato, false);
  assert.match(avvisi[0], /Non riesco a salvare/);
  host.addWmsLayer('PAI', wmsOpz);
  assert.deepEqual(scritti.at(-1).layers.map(l => l.tipo), ['wms']);
});

test('ripristina un GeoJSON salvato coi dati: stesso id, nessuna rete', async () => {
  const stato = { v: 1, layers: [{ id: 'rndt-x1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati: fc([pt([13.35, 38.15])]) } }] };
  const { host, map, chiamate } = costruisci({ stato, fetchFn: async () => { throw new Error('rete'); } });
  await host.ripristina();
  assert.equal(chiamate.length, 0);
  assert.ok(map.sorgenti.has('rndt-x1'));
  assert.equal(host.elenco()[0].indisponibile, false);
  host.mostra('rndt-x1', false);
  assert.equal(host.elenco()[0].visibile, false);
});

test('addGeoJsonLayer: nessuna feature dentro Palermo = errore, nessun layer in mappa', () => {
  const { host, map } = costruisci({ anelli: [quadrato] });
  assert.throws(() => host.addGeoJsonLayer('Fuori', fc([pt([14, 39])])), /nessuna feature dentro/);
  assert.equal(map.sorgenti.size, 0);
});

test('addGeoJsonLayer filtra sul confine comunale', () => {
  const { host, map } = costruisci({ anelli: [quadrato] });
  const id = host.addGeoJsonLayer('Misto', fc([pt([13.35, 38.15]), pt([14, 39])]));
  assert.equal(map.sorgenti.get(id).data.features.length, 1);
});

test('localStorage bloccato: un solo avviso, il layer resta in mappa', () => {
  const { host, map, avvisi } = costruisci({ scrivi: () => false });
  host.addWmsLayer('A', wmsOpz);
  host.addWmsLayer('B', { ...wmsOpz, layers: 'altro' });
  assert.equal(map.sorgenti.size, 2);
  assert.equal(avvisi.length, 1);
  assert.match(avvisi[0], /Non riesco a salvare/);
});

test('mostra e elimina aggiornano mappa e archivio', () => {
  const { host, map, scritti } = costruisci();
  const id = host.addWmsLayer('PAI', wmsOpz);
  host.mostra(id, false);
  assert.equal(map.strati.get(id).layout.visibility, 'none');
  assert.equal(scritti.at(-1).layers[0].visibile, false);
  host.elimina(id);
  assert.equal(map.strati.size, 0);
  assert.equal(map.sorgenti.size, 0);
  assert.deepEqual(scritti.at(-1).layers, []);
  assert.deepEqual(host.getLayers(), []);
});

test('ripristina riaggiunge WMS e GeoJSON salvati; un GeoJSON irraggiungibile resta in elenco come indisponibile', async () => {
  const stato = { v: 1, layers: [
    { id: 'rndt-w', tipo: 'wms', nome: 'PAI', visibile: false, sorgente: wmsOpz },
    { id: 'rndt-g', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { url: 'https://wfs.example.org/ok' } },
  ] };
  const ok = costruisci({ stato, corpo: JSON.stringify(fc([pt([13.35, 38.15])])) });
  await ok.host.ripristina();
  assert.equal(ok.map.sorgenti.size, 2);
  assert.equal(ok.host.elenco().find(l => l.tipo === 'wms').visibile, false);
  const ko = costruisci({ stato, fetchFn: async () => { throw new Error('rete'); } });
  await ko.host.ripristina();
  const g = ko.host.elenco().find(l => l.tipo === 'geojson');
  assert.equal(g.indisponibile, true);
  assert.equal(ko.scritti.length, 0); // il ripristino non riscrive l’archivio
});

test('registerRightPanel e openRightPanel passano dal pannello', () => {
  const eventi = [];
  const host = creaHost({
    map: mappaFinta(), proxy: PROXY, stato: { v: 1, layers: [] }, scrivi: () => true,
    pannello: { registra: r => { eventi.push(['registra', r.id]); return () => eventi.push(['rimuovi']); }, apri: () => eventi.push(['apri']), chiudi: () => eventi.push(['chiudi']) },
  });
  const dispose = host.registerRightPanel({ id: 'p', render() {} });
  host.openRightPanel('p');
  host.closeRightPanel('p');
  dispose();
  assert.deepEqual(eventi, [['registra', 'p'], ['apri'], ['chiudi'], ['rimuovi']]);
});
