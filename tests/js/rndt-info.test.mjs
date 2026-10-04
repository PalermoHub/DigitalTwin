// tests/js/rndt-info.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { lngLatA3857, urlGetFeatureInfo, leggiRisposta, proprieta, vociDa, segnaposto, interrogaTutti } from '../../js/rndt/info.js';

test('conversione in Web Mercator', () => {
  const [x0, y0] = lngLatA3857([0, 0]);
  assert.ok(Math.abs(x0) < 1e-6 && Math.abs(y0) < 1e-6);
  assert.ok(Math.abs(lngLatA3857([180, 0])[0] - 20037508.342789244) < 1e-3);
});

test('GetFeatureInfo 1.3.0 usa CRS, I e J; 1.1.1 usa SRS, X e Y; i parametri già presenti restano', () => {
  const sorg = { url: 'https://x.it/ows?map=a.map', layers: 'uno,due', version: '1.3.0' };
  const u13 = new URL(urlGetFeatureInfo(sorg, [13.36, 38.11], 16, 'text/plain'));
  assert.equal(u13.searchParams.get('map'), 'a.map');
  assert.equal(u13.searchParams.get('REQUEST'), 'GetFeatureInfo');
  assert.equal(u13.searchParams.get('CRS'), 'EPSG:3857');
  assert.equal(u13.searchParams.get('I'), '50');
  assert.equal(u13.searchParams.get('QUERY_LAYERS'), 'uno,due');
  assert.equal(u13.searchParams.get('INFO_FORMAT'), 'text/plain');
  const u11 = new URL(urlGetFeatureInfo({ ...sorg, version: '1.1.1' }, [13.36, 38.11], 16, 'text/html'));
  assert.equal(u11.searchParams.get('SRS'), 'EPSG:3857');
  assert.equal(u11.searchParams.get('X'), '50');
  assert.equal(u11.searchParams.get('CRS'), null);
  const [w, s, e, n] = u13.searchParams.get('BBOX').split(',').map(Number);
  assert.ok(e > w && n > s);
});

test('proprieta scarta valori vuoti, oggetti e campi geometria', () => {
  assert.deepEqual(proprieta({ a: 1, b: null, c: '', d: { x: 1 }, geom: 'POINT', the_geom: 'x', e: 'ok' }),
    [{ etichetta: 'a', valore: '1' }, { etichetta: 'e', valore: 'ok' }]);
});

test('leggiRisposta: GeoJSON, vuoto, errore di servizio', () => {
  const json = JSON.stringify({ features: [{ properties: { a: 1 } }, { properties: {} }] });
  assert.deepEqual(leggiRisposta(json), { tipo: 'json', elementi: [[{ etichetta: 'a', valore: '1' }]] });
  assert.equal(leggiRisposta(JSON.stringify({ features: [] })).tipo, 'vuoto');
  assert.equal(leggiRisposta('').tipo, 'vuoto');
  assert.equal(leggiRisposta('<ServiceExceptionReport><ServiceException>x</ServiceException></ServiceExceptionReport>').tipo, 'errore');
  assert.equal(leggiRisposta('{rotto').tipo, 'errore');
});

test('leggiRisposta ripulisce l’HTML (script, tag) e tronca a 2000 caratteri', () => {
  const html = '<html><script>alert(1)</script><style>p{}</style><table><tr><td>Zona</td><td>B1</td></tr></table>' + '<p>' + 'x'.repeat(5000) + '</p></html>';
  const r = leggiRisposta(html);
  assert.equal(r.tipo, 'testo');
  assert.ok(!r.testo.includes('alert') && !r.testo.includes('<'));
  assert.ok(r.testo.startsWith('Zona B1'));
  assert.ok(r.testo.length <= 2000);
});

const layer = { id: 'rndt-1', tipo: 'wms', nome: 'Zone PAI', sorgente: { url: 'https://servizi.it/ows', layers: 'pai', version: '1.3.0' } };

test('vociDa: un elemento = una voce con peso 100, fonte e chiave rndt:', () => {
  const v = vociDa(layer, { tipo: 'json', elementi: [[{ etichetta: 'Classe', valore: 'P3' }], [{ etichetta: 'Classe', valore: 'P4' }]] });
  assert.equal(v.length, 2);
  assert.deepEqual(v.map(x => x.chiave), ['rndt:rndt-1:0', 'rndt:rndt-1:1']);
  assert.equal(v[0].titolo, 'Zone PAI (1/2)');
  assert.equal(v[0].peso, 100);
  assert.equal(v[0].legale, true);
  assert.match(v[0].fonte, /servizi\.it/);
});

test('vociDa: vuoto, errore, testo e layer non interrogabile', () => {
  assert.equal(vociDa(layer, { tipo: 'vuoto' })[0].gruppi[0].righe[0].valore, 'nessun dato in questo punto');
  assert.match(vociDa(layer, { tipo: 'errore' })[0].nota, /non raggiungibile/);
  assert.equal(vociDa(layer, { tipo: 'testo', testo: 'Zona B1' })[0].testo, 'Zona B1');
  assert.match(vociDa(layer, { tipo: 'non-interrogabile' })[0].gruppi[0].righe[0].valore, /solo grafico/);
});

test('segnaposto: voce di attesa con chiave rndt:attesa e peso 100', () => {
  const s = segnaposto();
  assert.equal(s.chiave, 'rndt:attesa');
  assert.equal(s.peso, 100);
});

test('interrogaTutti: WMS prova JSON, poi testo; GeoJSON legge la mappa senza duplicati; tile non interrogabile', async () => {
  const leggiTesto = async u => (u.includes('application%2Fjson') ? '<ServiceException>no</ServiceException>' : 'Valore: 5');
  const geo = { id: 'rndt-2', tipo: 'geojson', nome: 'Aree', sorgente: { url: 'https://servizi.it/wfs' } };
  const tile = { id: 'rndt-3', tipo: 'tile', nome: 'Sfondo', sorgente: { url: 'https://servizi.it/t/{z}/{x}/{y}' } };
  const voci = await interrogaTutti({
    layers: [layer, geo, tile], lngLat: [13.36, 38.11], zoom: 16, leggiTesto,
    featureAlPunto: () => [{ properties: { nome: 'A' } }, { properties: { nome: 'A' } }],
  });
  assert.equal(voci.find(v => v.chiave === 'rndt:rndt-1:0').testo, 'Valore: 5');
  assert.equal(voci.filter(v => v.chiave.startsWith('rndt:rndt-2')).length, 1);
  assert.match(voci.find(v => v.chiave.startsWith('rndt:rndt-3')).gruppi[0].righe[0].valore, /solo grafico/);
});

test('interrogaTutti: un servizio lento va in errore dopo il timeout, gli altri arrivano', async () => {
  const lento = { ...layer, id: 'rndt-lento' };
  const veloce = { ...layer, id: 'rndt-veloce' };
  const leggiTesto = u => (u.includes('lento') ? new Promise(() => {}) : Promise.resolve('Valore: 1'));
  const voci = await interrogaTutti({
    layers: [{ ...lento, sorgente: { ...lento.sorgente, url: 'https://lento.it/ows' } }, veloce],
    lngLat: [13.36, 38.11], zoom: 16, leggiTesto, featureAlPunto: () => [], timeoutMs: 30,
  });
  assert.match(voci.find(v => v.chiave === 'rndt:rndt-lento:0').nota, /non raggiungibile/);
  assert.equal(voci.find(v => v.chiave === 'rndt:rndt-veloce:0').testo, 'Valore: 1');
});
