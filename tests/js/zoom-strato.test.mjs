import test from 'node:test';
import assert from 'node:assert/strict';
import { bboxGeoJSON, limitiStrato, zoomMinimoStrato } from '../../js/core/zoom-strato.js';

test('bboxGeoJSON: punti, linee e poligoni', () => {
  const fc = { type: 'FeatureCollection', features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [13.3, 38.1] } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[13.2, 38.0], [13.4, 38.0], [13.4, 38.2], [13.2, 38.0]]] } },
  ] };
  assert.deepEqual(bboxGeoJSON(fc), [13.2, 38.0, 13.4, 38.2]);
  assert.equal(bboxGeoJSON({ type: 'FeatureCollection', features: [] }), null);
});

function finta(layers, sorgenti) {
  return { getLayer: id => layers[id], getSource: id => sorgenti[id] };
}

test('limitiStrato: unisce i bounds delle sorgenti e restringe ai limiti', async () => {
  const map = finta({ a: { source: 's1' }, b: { source: 's2' }, c: { source: 's1' } },
    { s1: { bounds: [13.2, 38.0, 13.3, 38.1] }, s2: { bounds: [13.25, 38.05, 13.9, 38.5] } });
  assert.deepEqual(await limitiStrato(map, ['a', 'b', 'c', 'assente']), [13.2, 38.0, 13.9, 38.5]);
  assert.deepEqual(await limitiStrato(map, ['a', 'b'], [13.1, 37.9, 13.55, 38.29]), [13.2, 38.0, 13.55, 38.29]);
});

test('limitiStrato: geojson inline; senza dati null', async () => {
  const dati = { type: 'Feature', geometry: { type: 'Point', coordinates: [13.3, 38.1] } };
  const map = finta({ a: { source: 'g' }, b: { source: 'x' } },
    { g: { type: 'geojson', serialize: () => ({ data: dati }) }, x: { type: 'vector' } });
  assert.deepEqual(await limitiStrato(map, ['a']), [13.3, 38.1, 13.3, 38.1]);
  assert.equal(await limitiStrato(map, ['b']), null);
});

test('zoomMinimoStrato: minzoom più basso dei layer presenti', () => {
  const layers = { a: { minzoom: 14 }, b: { minzoom: 12 }, c: {} };
  const map = { getLayer: (id) => layers[id] };
  assert.equal(zoomMinimoStrato(map, ['a', 'b']), 12);
  assert.equal(zoomMinimoStrato(map, ['a', 'c']), 0);
  assert.equal(zoomMinimoStrato(map, ['assente']), 0);
});
