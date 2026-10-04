import test from 'node:test';
import assert from 'node:assert/strict';
import { scala, applicaOpacita } from '../../js/core/opacita.js';

test('scala: numero', () => assert.equal(scala(0.8, 0.5), 0.4));
test('scala: interpolate per zoom scala solo le uscite', () => {
  assert.deepEqual(scala(['interpolate', ['linear'], ['zoom'], 10, 0.2, 14, 1], 0.5),
    ['interpolate', ['linear'], ['zoom'], 10, 0.1, 14, 0.5]);
});
test('scala: step', () => {
  assert.deepEqual(scala(['step', ['zoom'], 0.4, 12, 1], 0.5), ['step', ['zoom'], 0.2, 12, 0.5]);
});
test('scala: espressione generica avvolta', () => {
  assert.deepEqual(scala(['get', 'opacita'], 0.5), ['*', ['get', 'opacita'], 0.5]);
});

function finta(layers) {
  const paint = {};
  return {
    paint,
    getLayer: id => layers[id] && { type: layers[id].type },
    getPaintProperty: (id, p) => (paint[`${id}|${p}`] ?? layers[id].paint?.[p]),
    setPaintProperty: (id, p, v) => { paint[`${id}|${p}`] = v; },
  };
}

test('applicaOpacita: scala e ripristina l\'originale', () => {
  const map = finta({ a: { type: 'fill', paint: { 'fill-opacity': 0.8 } }, c: { type: 'circle' } });
  const orig = new Map();
  applicaOpacita(map, ['a', 'c', 'assente'], 0.5, orig);
  assert.equal(map.paint['a|fill-opacity'], 0.4);
  assert.equal(map.paint['c|circle-opacity'], 0.5);
  assert.equal(map.paint['c|circle-stroke-opacity'], 0.5);
  applicaOpacita(map, ['a', 'c'], 0.25, orig);
  assert.equal(map.paint['a|fill-opacity'], 0.2); // sempre dall'originale, non dal valore già scalato
  applicaOpacita(map, ['a'], 1, orig);
  assert.equal(map.paint['a|fill-opacity'], 0.8);
});
