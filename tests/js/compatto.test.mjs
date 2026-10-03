import test from 'node:test';
import assert from 'node:assert/strict';
import { daColonne, decodificaOrari, decodificaCivici, chiaveSezione, SEZIONI_CIVICI } from '../../js/core/compatto.js';

test('daColonne ricompone i record e tiene i null', () => {
  assert.deepEqual(daColonne({ id: [1, 2], P1: [10, null] }), [{ id: 1, P1: 10 }, { id: 2, P1: null }]);
  assert.deepEqual(daColonne({}), []);
});

test('decodificaOrari somma le differenze e lascia il resto com\'è', () => {
  const compatto = {
    validita: { da: 'a', a: 'b' },
    servizi: { 0: ['2026-09-01'] },
    fermate: { S1: { 100: [[0, 0, 420, 1110], [1, 1, 600]], 200: [[0, 0, 480, 0, 15]] } },
  };
  assert.deepEqual(decodificaOrari(compatto), {
    validita: { da: 'a', a: 'b' },
    servizi: { 0: ['2026-09-01'] },
    fermate: { S1: { 100: [{ d: 0, s: 0, t: [420, 1530] }, { d: 1, s: 1, t: [600] }], 200: [{ d: 0, s: 0, t: [480, 480, 495] }] } },
  });
});

test('decodificaCivici riporta micro-gradi in differenze a gradi esatti', () => {
  const c = { 'ARCO SCIARA': [['1A', '1', '2'], [13355100, 97, -148], [38145718, -84, 176]] };
  assert.deepEqual(decodificaCivici(c), {
    'ARCO SCIARA': { '1A': [13.3551, 38.145718], 1: [13.355197, 38.145634], 2: [13.355049, 38.14581] },
  });
});

test('chiaveSezione: due cifre, tra 00 e 31, sempre uguale per la stessa via', () => {
  for (const via of ['VIA ROMA', 'ARCO BONDI\'', 'VIA DELLA LIBERTÀ', '']) {
    const k = chiaveSezione(via);
    assert.match(k, /^\d\d$/);
    assert.ok(Number(k) < SEZIONI_CIVICI);
    assert.equal(k, chiaveSezione(via));
  }
});
