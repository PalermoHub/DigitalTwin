import test from 'node:test';
import assert from 'node:assert/strict';
import { richiesteLegendaWms, richiestaLegendaArcgis, vociLegendaArcgis, tipoImmagine, tipoLegenda } from '../../js/rndt/legenda.js';

test('WMS: una GetLegendGraphic per layer, senza i parametri della GetMap', () => {
  const r = richiesteLegendaWms({ url: 'https://s.it/wms?map=x&REQUEST=GetMap&LAYERS=zz', layers: 'a, b', version: '1.1.1' });
  assert.deepEqual(r.map(x => x.nome), ['a', 'b']);
  const u = new URL(r[1].url);
  assert.equal(u.searchParams.get('REQUEST'), 'GetLegendGraphic');
  assert.equal(u.searchParams.get('LAYER'), 'b');
  assert.equal(u.searchParams.get('VERSION'), '1.1.1');
  assert.equal(u.searchParams.get('map'), 'x');
  assert.equal(u.searchParams.has('LAYERS'), false);
});

test('ArcGIS: la legenda si ricava dall\'URL di export (un layer) o di tile (tutto il servizio)', () => {
  const exp = 'https://g.it/arcgis/rest/services/A/MapServer/export?bbox={bbox-epsg-3857}&layers=show%3A7&f=image';
  assert.deepEqual(richiestaLegendaArcgis(exp), { url: 'https://g.it/arcgis/rest/services/A/MapServer/legend?f=json', idLayer: 7 });
  assert.deepEqual(richiestaLegendaArcgis('https://g.it/arcgis/rest/services/A/MapServer/tile/{z}/{y}/{x}'), { url: 'https://g.it/arcgis/rest/services/A/MapServer/legend?f=json', idLayer: null });
  assert.equal(richiestaLegendaArcgis('https://x.it/{z}/{x}/{y}.png'), null);
});

test('ArcGIS: classi del layer richiesto, con simbolo come data URI; senza immagine si saltano', () => {
  const json = { layers: [
    { layerId: 7, layerName: 'Frane', legend: [{ label: 'P3', contentType: 'image/png', imageData: 'AAA' }, { label: 'vuota' }] },
    { layerId: 8, layerName: 'Altro', legend: [{ label: 'X', imageData: 'BBB' }] },
  ] };
  assert.deepEqual(vociLegendaArcgis(json, 7), [{ gruppo: 'Frane', etichetta: 'P3', src: 'data:image/png;base64,AAA' }]);
  assert.equal(vociLegendaArcgis(json, null).length, 2);
});

test('tipoImmagine riconosce PNG, JPEG, GIF e rifiuta XML', () => {
  assert.equal(tipoImmagine(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1]).buffer), 'image/png');
  assert.equal(tipoImmagine(Uint8Array.from([0xff, 0xd8, 0xff, 0]).buffer), 'image/jpeg');
  assert.equal(tipoImmagine(new TextEncoder().encode('<?xml').buffer), null);
});

test('tipoLegenda: quali layer hanno una legenda', () => {
  assert.equal(tipoLegenda({ tipo: 'wms' }), 'wms');
  assert.equal(tipoLegenda({ tipo: 'tile', sorgente: { url: 'https://g.it/x/MapServer/tile/{z}/{y}/{x}' } }), 'arcgis');
  assert.equal(tipoLegenda({ tipo: 'tile', sorgente: { url: 'https://x.it/{z}/{x}/{y}.png' } }), null);
  assert.equal(tipoLegenda({ tipo: 'geojson', colore: '#c00' }), 'vettoriale');
  assert.equal(tipoLegenda({ tipo: 'geojson' }), null);
});

import { origineLayer } from '../../js/rndt/legenda.js';
test('origineLayer: servizio e server di ogni tipo di layer', () => {
  assert.deepEqual(origineLayer({ tipo: 'wms', sorgente: { url: 'https://wms.it/ows?x=1' } }), { servizio: 'WMS', server: 'wms.it' });
  assert.deepEqual(origineLayer({ tipo: 'geojson', sorgente: { url: 'https://g.it/arcgis/rest/services/A/FeatureServer/0/query?f=geojson' } }), { servizio: 'ArcGIS', server: 'g.it' });
  assert.deepEqual(origineLayer({ tipo: 'geojson', sorgente: { url: 'https://w.it/ows?service=WFS&request=GetFeature' } }), { servizio: 'WFS', server: 'w.it' });
  assert.deepEqual(origineLayer({ tipo: 'geojson', sorgente: { dati: true } }), { servizio: null, server: '' });
});

import { urlQueryArcgisPunto } from '../../js/rndt/legenda.js';
import { vociDaMostrare } from '../../js/rndt/tooltip-remoto.js';
test('urlQueryArcgisPunto: query del punto sul layer dell\'export, non sulla cache', () => {
  const exp = 'https://g.it/arcgis/rest/services/A/MapServer/export?layers=show%3A7&f=image';
  const u = new URL(urlQueryArcgisPunto(exp, [13.36, 38.11], 17));
  assert.equal(u.pathname, '/arcgis/rest/services/A/MapServer/7/query');
  assert.equal(u.searchParams.get('f'), 'geojson');
  assert.equal(urlQueryArcgisPunto('https://g.it/A/MapServer/tile/{z}/{y}/{x}', [13, 38], 17), null);
});
test('vociDaMostrare: salta «Esito» e note di errore', () => {
  const voci = [
    { titolo: 'a', gruppi: [{ righe: [{ etichetta: 'Esito', valore: 'nessun dato' }] }] },
    { titolo: 'b', nota: 'Servizio non raggiungibile', gruppi: [] },
    { titolo: 'c', gruppi: [{ righe: [{ etichetta: 'Nome', valore: 'x' }] }] },
  ];
  assert.deepEqual(vociDaMostrare(voci).map(v => v.titolo), ['c']);
});

import { proprieta } from '../../js/rndt/info.js';
test('proprieta: salta i valori vuoti o fatti di soli spazi', () => {
  assert.deepEqual(proprieta({ A: '1', SEZIONE: ' ', B: '', C: null }), [{ etichetta: 'A', valore: '1' }]);
});
