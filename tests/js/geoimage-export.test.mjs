import test from 'node:test';
import assert from 'node:assert/strict';
import { nomeBase, escXml, puntiQgis, geojsonGcp, worldFile, estensioneWorldFile, kml, creaKmz } from '../../js/geoimage/export.js';

const gcp = [{ px: 10, py: 20, lat: 38.15, lng: 13.35 }, { px: 30, py: 40, lat: 38.16, lng: 13.36 }];
const angoli = [{ lat: 38.2, lng: 13.3 }, { lat: 38.2, lng: 13.4 }, { lat: 38.1, lng: 13.3 }, { lat: 38.1, lng: 13.4 }];

test('nomeBase toglie l\'estensione e ha un nome di riserva', () => {
  assert.equal(nomeBase('Palermo 1864.jpg'), 'Palermo 1864');
  assert.equal(nomeBase(''), 'mappa');
  assert.equal(nomeBase(undefined), 'mappa');
});

test('escXml protegge &, < e >', () => assert.equal(escXml('a&b<c>'), 'a&amp;b&lt;c&gt;'));

test('.points di QGIS: intestazione e y capovolta', () => {
  assert.equal(puntiQgis(gcp), 'mapX,mapY,sourceX,sourceY,enable\n13.35,38.15,10,-20,1\n13.36,38.16,30,-40,1\n');
});

test('GeoJSON dei GCP: punti [lng, lat] con id da 1', () => {
  const fc = geojsonGcp(gcp);
  assert.equal(fc.features.length, 2);
  assert.deepEqual(fc.features[1].geometry.coordinates, [13.36, 38.16]);
  assert.equal(fc.features[1].properties.id, 2);
});

test('world file: sei righe nell\'ordine a, d, b, e, c, f', () => {
  const righe = worldFile({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }).split('\n');
  assert.deepEqual(righe, ['1.0000000000', '4.0000000000', '2.0000000000', '5.0000000000', '3.0000000000', '6.0000000000']);
});

test('estensione del world file dal tipo dell\'immagine', () => {
  assert.equal(estensioneWorldFile('a.JPG'), 'jgw');
  assert.equal(estensioneWorldFile('a.png'), 'pgw');
  assert.equal(estensioneWorldFile('a.webp'), 'wld');
});

test('KML: gli angoli sono scritti SO, SE, NE, NO e il nome è protetto', () => {
  const k = kml({ nome: 'A&B', fileImmagine: 'files/a.jpg', angoli, gcp });
  assert.match(k, /<name>A&amp;B<\/name>/);
  const ordine = [...k.matchAll(/^\s+(13\.\d+),(38\.\d+),0$/gm)].map(m => `${m[1]},${m[2]}`);
  assert.deepEqual(ordine.slice(0, 4), ['13.30000000,38.10000000', '13.40000000,38.10000000', '13.40000000,38.20000000', '13.30000000,38.20000000']);
  assert.match(k, /<name>GCP 2<\/name>/);
});

test('KMZ: doc.kml e immagine in files/ con il nome giusto', async () => {
  const scritti = {};
  class ZipFinto {
    file(n, c, o) { scritti[n] = { c, o }; }
    folder(d) { return { file: (n, c, o) => { scritti[`${d}/${n}`] = { c, o }; } }; }
    async generateAsync(opz) { return { blob: true, opz }; }
  }
  const r = await creaKmz(ZipFinto, { nome: 'mappa.jpeg', dataUrl: 'data:image/jpeg;base64,QUJD', angoli, gcp });
  assert.ok(r.blob);
  assert.match(scritti['doc.kml'].c, /<href>files\/mappa\.jpg<\/href>/);
  assert.equal(scritti['files/mappa.jpg'].c, 'QUJD');
  assert.deepEqual(scritti['files/mappa.jpg'].o, { base64: true });
});
