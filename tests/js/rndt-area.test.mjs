// tests/js/rndt-area.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { BBOX_PALERMO, intersezione, vistaPalermo, dentroAnello, filtraSuConfine, anelliDaZone } from '../../js/rndt/area.js';

const quadrato = [[13.3, 38.1], [13.4, 38.1], [13.4, 38.2], [13.3, 38.2], [13.3, 38.1]]; // contiene il centro di Palermo

test('intersezione di due bbox, nulla se non si toccano o si sfiorano soltanto', () => {
  assert.deepEqual(intersezione([0, 0, 2, 2], [1, 1, 3, 3]), [1, 1, 2, 2]);
  assert.equal(intersezione([0, 0, 1, 1], [2, 2, 3, 3]), null);
  assert.equal(intersezione([0, 0, 1, 1], [1, 0, 2, 1]), null);
});

test('vistaPalermo: la vista dentro Palermo resta, altrimenti si ripiega su tutta Palermo', () => {
  assert.deepEqual(vistaPalermo([13.2, 38.0, 13.3, 38.1]), [13.2, 38.0, 13.3, 38.1]);
  assert.deepEqual(vistaPalermo([13.0, 37.0, 13.4, 38.1]), [13.1, 37.9785, 13.4, 38.1]);
  assert.deepEqual(vistaPalermo([0, 0, 1, 1]), BBOX_PALERMO);
  assert.deepEqual(vistaPalermo(null), BBOX_PALERMO);
});

test('dentroAnello: punto dentro e fuori', () => {
  assert.equal(dentroAnello([13.35, 38.15], quadrato), true);
  assert.equal(dentroAnello([14, 39], quadrato), false);
});

const fc = features => ({ type: 'FeatureCollection', features });
const punto = (n, c) => ({ type: 'Feature', properties: { n }, geometry: { type: 'Point', coordinates: c } });

test('filtraSuConfine tiene le feature che toccano il confine e scarta le altre', () => {
  const linea = { type: 'Feature', properties: { n: 'linea' }, geometry: { type: 'LineString', coordinates: [[13.35, 38.15], [15, 40]] } };
  const grande = { type: 'Feature', properties: { n: 'grande' }, geometry: { type: 'Polygon', coordinates: [[[10, 35], [20, 35], [20, 45], [10, 45], [10, 35]]] } };
  const { fc: out, filtrato } = filtraSuConfine(fc([punto('dentro', [13.35, 38.15]), punto('fuori', [14, 39]), linea, grande]), [quadrato]);
  assert.equal(filtrato, true);
  assert.deepEqual(out.features.map(f => f.properties.n), ['dentro', 'linea', 'grande']);
});

test('filtraSuConfine non filtra sopra soglia né senza confine', () => {
  const tre = fc([punto('a', [14, 39]), punto('b', [14, 39]), punto('c', [14, 39])]);
  assert.deepEqual(filtraSuConfine(tre, [quadrato], 2), { fc: tre, filtrato: false });
  assert.deepEqual(filtraSuConfine(tre, []), { fc: tre, filtrato: false });
});

test('anelliDaZone prende gli anelli validi delle circoscrizioni', () => {
  assert.deepEqual(anelliDaZone({ circoscrizioni: [{ name: 'I', ring: quadrato }, { name: 'x', ring: [[0, 0]] }] }), [quadrato]);
  assert.deepEqual(anelliDaZone(null), []);
});
