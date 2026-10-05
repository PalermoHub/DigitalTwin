import test from 'node:test';
import assert from 'node:assert/strict';
import { serializza, leggi, daTesto } from '../../js/geoimage/progetto.js';

const stato = () => ({
  immagine: { dataUrl: 'data:image/png;base64,AAAA', larghezza: 300, altezza: 200, nome: 'palermo.png' },
  angoli: [{ lat: 38.2, lng: 13.3 }, { lat: 38.2, lng: 13.4 }, { lat: 38.1, lng: 13.3 }, { lat: 38.1, lng: 13.4 }],
  angoliIniziali: [],
  opacita: 0.5,
  tipo: 'poly2',
  gcp: [{ px: 10, py: 20, lat: 38.15, lng: 13.35 }],
});

test('serializza usa il formato di Geoimage (angoli come [lat, lng])', () => {
  const o = serializza(stato());
  assert.equal(o.version, 1);
  assert.deepEqual(o.overlayCorners[0], [38.2, 13.3]);
  assert.equal(o.imageDataUrl, 'data:image/png;base64,AAAA');
  assert.deepEqual(o.gcps[0], { px: 10, py: 20, lat: 38.15, lng: 13.35 });
});

test('serializza e leggi sono l\'una l\'inverso dell\'altra', () => {
  const s = leggi(JSON.parse(JSON.stringify(serializza(stato()))));
  assert.deepEqual(s.angoli, stato().angoli);
  assert.equal(s.tipo, 'poly2');
  assert.equal(s.opacita, 0.5);
  assert.equal(s.immagine.nome, 'palermo.png');
  assert.deepEqual(s.angoliIniziali, s.angoli, 'il Reset riporta alla posizione del file');
});

test('un file di Geoimage senza transformType si apre con l\'affine e l\'opacità di default', () => {
  const o = serializza(stato());
  delete o.transformType; delete o.opacity;
  const s = leggi(o);
  assert.equal(s.tipo, 'poly1');
  assert.equal(s.opacita, 0.7);
});

test('file non validi danno un errore comprensibile', () => {
  assert.throws(() => daTesto('{rotto'), /JSON valido/);
  assert.throws(() => leggi(null), /progetto Geoimage/);
  assert.throws(() => leggi({ imageDataUrl: 'http://x/y.png', overlayCorners: [] }), /immagine/);
  assert.throws(() => leggi({ ...serializza(stato()), overlayCorners: [[1, 2]] }), /coordinate/);
  assert.throws(() => leggi({ ...serializza(stato()), overlayCorners: [[999, 0], [0, 0], [0, 0], [0, 0]] }), /coordinate/);
});

test('i GCP con numeri mancanti o fuori scala si scartano, gli altri restano; opacità fuori scala si riporta in 0-1', () => {
  const o = serializza(stato());
  o.gcps.push({ px: 1, py: 2, lat: 'x', lng: 3 }, { px: 1, py: 2, lat: 95, lng: 3 });
  o.opacity = 7;
  const s = leggi(o);
  assert.equal(s.gcp.length, 1);
  assert.equal(s.opacita, 1);
});
