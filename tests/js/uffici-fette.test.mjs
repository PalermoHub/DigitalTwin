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

import { coloriSedi } from '../../js/layers/uffici-fette.js';

test('coloriSedi: colore dell\'area più numerosa della sede, solo aree accese', () => {
  const dettagli = new Map([
    ['s1', { uffici: [u('B', '#b'), u('B', '#b'), u('A', '#a')] }],
    ['s2', { uffici: [u('C', '#c')] }],
    ['s3', { uffici: [u('A', '#a')] }],
  ]);
  const geom = id => ({ s1: 'k1', s2: 'k2', s3: 'k3' })[id];
  const fidPerSede = { k1: [10, 11], k2: [20], k3: [30] };
  assert.deepEqual([...coloriSedi(fidPerSede, dettagli, geom, null)], [[10, '#b'], [11, '#b'], [20, '#c'], [30, '#a']]);
  assert.deepEqual([...coloriSedi(fidPerSede, dettagli, geom, new Set(['A']))], [[10, '#a'], [11, '#a'], [30, '#a']]);
  assert.equal(coloriSedi(fidPerSede, dettagli, geom, new Set()).size, 0);
});
