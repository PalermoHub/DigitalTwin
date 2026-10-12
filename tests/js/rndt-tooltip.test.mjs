import test from 'node:test';
import assert from 'node:assert/strict';
import { estensioniDa } from '../../js/rndt/tooltip.js';

const riquadro = (id, title, o, s, e, n) => ({ properties: { id, title }, geometry: { type: 'Polygon', coordinates: [[[o, s], [e, s], [e, n], [o, n], [o, s]]] } });

test('estensioni RNDT: senza doppioni e dalla più piccola alla più grande', () => {
  const r = estensioniDa([riquadro('a', 'Grande', 0, 0, 10, 10), riquadro('b', 'Piccola', 0, 0, 1, 1), riquadro('a', 'Grande', 0, 0, 10, 10)]);
  assert.deepEqual(r.map(v => v.titolo), ['Piccola', 'Grande']);
});

test('estensioni RNDT: niente da mostrare senza feature o senza id', () => {
  assert.deepEqual(estensioniDa(undefined), []);
  assert.deepEqual(estensioniDa([{ properties: {} }]), []);
});
