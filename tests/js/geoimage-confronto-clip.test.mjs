import test from 'node:test';
import assert from 'node:assert/strict';
import { clipSwipe, clipSpotlight } from '../../js/geoimage/confronto-clip.js';

test('swipe: a metà taglia il 50 % di destra', () => {
  assert.equal(clipSwipe(50), 'inset(0 50% 0 0)');
  assert.equal(clipSwipe(98), 'inset(0 2% 0 0)');
});

test('spotlight normale: rettangolo meno cerchio, regola evenodd', () => {
  const c = clipSpotlight({ x: 100, y: 80, raggio: 20, invertito: false, larghezza: 800, altezza: 600 });
  assert.match(c, /^path\(evenodd, "M0 0 H800 V600 H0 Z /);
  assert.match(c, /M100 80 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0"\)$/);
});

test('spotlight invertito: solo il cerchio', () => {
  assert.equal(clipSpotlight({ x: 10, y: 20, raggio: 30, invertito: true, larghezza: 1, altezza: 1 }), 'circle(30px at 10px 20px)');
});
