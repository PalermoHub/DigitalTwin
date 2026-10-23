// tests/js/satelliti-mondo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { proietta, LARGHEZZA } from '../../js/layers/satelliti-mondo.js';
import { TERRE } from '../../js/layers/satelliti-mondo-terre.js';

test('proietta: gli angoli e il centro del mondo', () => {
  const alto = LARGHEZZA / 2;
  assert.deepEqual(proietta(-180, 90), [0, 0]);
  assert.deepEqual(proietta(180, -90), [LARGHEZZA, alto]);
  assert.deepEqual(proietta(0, 0), [LARGHEZZA / 2, alto / 2]);
});

test('proietta: Palermo sta nel quadrante nord-est, vicino al centro in alto', () => {
  const [x, y] = proietta(13.36, 38.12);
  assert.ok(x > LARGHEZZA / 2 && x < LARGHEZZA * 0.6);
  assert.ok(y < LARGHEZZA / 4 && y > LARGHEZZA / 8);
});

test('terre emerse: percorso SVG valido nel rettangolo 360×180', () => {
  assert.match(TERRE, /^M[\d. L-]+Z/);
  const numeri = TERRE.match(/-?\d+(\.\d+)?/g).map(Number);
  assert.ok(numeri.length > 2000);
  for (let i = 0; i < numeri.length; i += 2) assert.ok(numeri[i] >= 0 && numeri[i] <= 360 && numeri[i + 1] >= 0 && numeri[i + 1] <= 180);
});
