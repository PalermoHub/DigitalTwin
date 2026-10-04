// tests/js/rndt-host.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaHost, urlProxy, TETTO_DATI } from '../../js/rndt/host.js';
import { archivioInMemoria } from '../../js/rndt/dati.js';

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
  const archivioDati = 'archivioDati' in extra ? extra.archivioDati : archivioInMemoria();
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return extra.scrivi?.(s) ?? true; },
    anelli: () => extra.anelli ?? [], notifica: m => avvisi.push(m), archivioDati,
    fetchFn: extra.fetchFn ?? (async u => { chiamate.push(u); return corpo(extra.corpo ?? '{}'); }),
  });
  return { host, map, scritti, avvisi, chiamate, archivioDati };
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

const urlWfs = 'https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=13.1,37.9,13.5,38.3';

test('addFileLayer: i dati filtrati vanno nell’archivio dati, poi il layer entra nell’elenco salvato', async () => {
  const { host, scritti, archivioDati } = costruisci({ anelli: [quadrato] });
  const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15]), pt([14, 39])]));
  assert.equal(host.elenco().find(l => l.id === id).salvato, false); // finché la scrittura non è finita
  assert.equal(scritti.length, 0);
  await host.attendi();
  assert.equal(archivioDati.m.get(id).features.length, 1); // solo la feature dentro Palermo
  assert.deepEqual(scritti.at(-1).layers[0].sorgente, { dati: true });
  assert.equal(host.elenco().find(l => l.id === id).salvato, true);
});

test('addGeoJsonLayer senza download riconosciuto salva i dati allo stesso modo', async () => {
  const { host, archivioDati } = costruisci();
  const id = host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15])]));
  await host.attendi();
  assert.equal(archivioDati.m.has(id), true);
});

test('addFileLayer entro 30 s da un download del catalogo non prende l’URL del download', async () => {
  const { host, scritti } = costruisci();
  await host.fetchArrayBuffer(urlWfs);
  host.addFileLayer('Mio file', fc([pt([13.35, 38.15])]));
  await host.attendi();
  assert.deepEqual(scritti.at(-1).layers[0].sorgente, { dati: true });
});

test('dati oltre il tetto di 5 MB: layer in mappa solo per la sessione, con avviso', async () => {
  const grosso = fc([{ type: 'Feature', properties: { x: 'a'.repeat(TETTO_DATI) }, geometry: { type: 'Point', coordinates: [13.35, 38.15] } }]);
  const { host, map, scritti, avvisi, archivioDati } = costruisci();
  const id = host.addFileLayer('Grosso', grosso);
  await host.attendi();
  assert.equal(map.sorgenti.size, 1);
  assert.equal(scritti.length, 0);
  assert.equal(archivioDati.m.size, 0);
  assert.equal(host.elenco().find(l => l.id === id).salvato, false);
  assert.match(avvisi[0], /troppo grande/);
});

test('senza IndexedDB (archivio null) o con scrittura fallita: solo sessione, un avviso, gli altri layer si salvano', async () => {
  const rotto = archivioInMemoria();
  rotto.scrivi = async () => { throw new Error('quota'); };
  for (const archivioDati of [null, rotto]) {
    const { host, scritti, avvisi } = costruisci({ archivioDati });
    const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15])]));
    await host.attendi();
    assert.equal(host.elenco().find(l => l.id === id).salvato, false);
    assert.equal(avvisi.length, 1);
    assert.match(avvisi[0], /Non riesco a salvare «Zone»/);
    host.addWmsLayer('PAI', wmsOpz);
    assert.deepEqual(scritti.at(-1).layers.map(l => l.tipo), ['wms']);
  }
});

test('layer rimosso mentre la scrittura è in corso: non resta nulla né nell’archivio né nell’elenco', async () => {
  const lento = archivioInMemoria();
  const vera = lento.scrivi;
  let sblocca;
  lento.scrivi = (id, f) => new Promise(ok => { sblocca = () => ok(vera(id, f)); });
  const { host, scritti } = costruisci({ archivioDati: lento });
  const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15])]));
  host.elimina(id);
  sblocca();
  await host.attendi();
  assert.equal(lento.m.size, 0);
  assert.deepEqual(scritti.at(-1).layers, []); // elimina() riscrive l'elenco: il layer rimosso non rientra con la scrittura tardiva
  assert.deepEqual(host.getLayers(), []);
});

test('lo stesso file caricato due volte di seguito: la scrittura più vecchia non cancella i dati del layer attuale', async () => {
  const { host, scritti, archivioDati } = costruisci();
  const dati = fc([pt([13.35, 38.15])]);
  const id = host.addFileLayer('Zone', dati);
  assert.equal(host.addFileLayer('Zone', dati), id);
  await host.attendi();
  assert.equal(archivioDati.m.has(id), true);
  assert.deepEqual(scritti.at(-1).layers.map(l => l.id), [id]);
  assert.equal(host.elenco().find(l => l.id === id).salvato, true);
});

test('elementi fuori dal Comune scartati dal filtro: un avviso dice quanti', () => {
  const { host, avvisi } = costruisci({ anelli: [quadrato] });
  host.addFileLayer('Regione', fc([pt([13.35, 38.15]), pt([14, 39]), pt([14.1, 39.1])]));
  assert.match(avvisi[0], /2 elementi su 3 sono fuori dal Comune di Palermo/);
  const uno = costruisci({ anelli: [quadrato] });
  uno.host.addFileLayer('Regione', fc([pt([13.35, 38.15]), pt([14, 39])]));
  assert.match(uno.avvisi[0], /1 elemento su 2 è fuori dal Comune di Palermo/);
  const tutti = costruisci({ anelli: [quadrato] });
  tutti.host.addFileLayer('Dentro', fc([pt([13.35, 38.15])]));
  assert.equal(tutti.avvisi.length, 0);
});

test('elimina rimuove anche i dati salvati', async () => {
  const { host, archivioDati } = costruisci();
  const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15])]));
  await host.attendi();
  host.elimina(id);
  await host.attendi();
  assert.equal(archivioDati.m.has(id), false);
});

test('ripristina un layer coi dati nell’archivio dati: stesso id, nessuna rete, accensione salvata', async () => {
  const stato = { v: 1, layers: [{ id: 'rndt-x1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati: true } }] };
  const archivioDati = archivioInMemoria();
  await archivioDati.scrivi('rndt-x1', fc([pt([13.35, 38.15])]));
  const { host, map, chiamate, scritti } = costruisci({ stato, archivioDati, fetchFn: async () => { throw new Error('rete'); } });
  await host.ripristina();
  assert.equal(chiamate.length, 0);
  assert.ok(map.sorgenti.has('rndt-x1'));
  assert.equal(host.elenco()[0].salvato, true);
  assert.equal(host.elenco()[0].indisponibile, false);
  assert.equal(scritti.length, 0);
  host.mostra('rndt-x1', false);
  assert.equal(scritti.at(-1).layers[0].visibile, false);
});

test('dati spariti dall’archivio al riavvio: il layer resta in elenco come non disponibile', async () => {
  const stato = { v: 1, layers: [{ id: 'rndt-x1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati: true } }] };
  const { host, map } = costruisci({ stato });
  await host.ripristina();
  assert.equal(host.elenco()[0].indisponibile, true);
  assert.equal(map.sorgenti.size, 0);
  const senza = costruisci({ stato, archivioDati: null });
  await senza.host.ripristina();
  assert.equal(senza.host.elenco()[0].indisponibile, true);
});

test('vecchio formato (dati dentro l’elenco in localStorage): si legge e passa all’archivio dati', async () => {
  const dati = fc([pt([13.35, 38.15])]);
  const stato = { v: 1, layers: [{ id: 'rndt-v1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati } }] };
  const { host, map, scritti, archivioDati } = costruisci({ stato });
  await host.ripristina();
  assert.ok(map.sorgenti.has('rndt-v1'));
  assert.deepEqual(archivioDati.m.get('rndt-v1'), dati);
  assert.deepEqual(scritti.at(-1).layers[0].sorgente, { dati: true });
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
