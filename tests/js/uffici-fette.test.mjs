import test from 'node:test';
import assert from 'node:assert/strict';
import { fette, raggio, archi, areeDaSedi } from '../../js/layers/uffici-fette.js';

const u = (area, colore) => ({ area, colore });
const uffici = [u('B', '#b'), u('A', '#a'), u('B', '#b'), u('B', '#b'), u('C', '#c')];

test('fette: una per area, la più numerosa prima, a pari merito per nome', () => {
  assert.deepEqual(fette(uffici), [{ area: 'B', colore: '#b', n: 3 }, { area: 'A', colore: '#a', n: 1 }, { area: 'C', colore: '#c', n: 1 }]);
});

test('fette: la legenda restringe alle aree accese', () => {
  assert.deepEqual(fette(uffici, new Set(['A', 'C'])).map(f => f.area), ['A', 'C']);
  assert.deepEqual(fette(uffici, new Set()), []);
});

test('raggio: cresce con gli uffici ma ha un tetto', () => {
  assert.ok(raggio(1) < raggio(10) && raggio(10) < raggio(40));
  assert.equal(raggio(1000), 28);
});

test('archi: proporzionali, senza buchi, partono da ore 12 e chiudono il giro', () => {
  const a = archi(fette(uffici));
  assert.equal(a[0].da, -Math.PI / 2);
  assert.ok(Math.abs(a[0].a - a[0].da - (2 * Math.PI * 3) / 5) < 1e-9);
  assert.equal(a[1].da, a[0].a);
  assert.ok(Math.abs(a.at(-1).a - (3 * Math.PI) / 2) < 1e-9);
});

test('areeDaSedi: aree distinte con totale e ordine alfabetico', () => {
  const r = areeDaSedi([{ uffici }, { uffici: [u('A', '#a')] }]);
  assert.deepEqual(r.map(x => [x.area, x.n]), [['A', 2], ['B', 3], ['C', 1]]);
});
