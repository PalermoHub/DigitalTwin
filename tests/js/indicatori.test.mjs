import test from 'node:test';
import assert from 'node:assert/strict';
import { quantili, INDICATORI } from '../../js/core/indicatori.js';

test('quantili: cinque classi su 1..10', () => {
  assert.deepEqual(quantili([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5), [3, 5, 7, 9]);
});

test('quantili: valori ripetuti non producono soglie duplicate', () => {
  assert.deepEqual(quantili([1, 1, 1, 1, 1, 1, 1, 1, 1, 2], 5), [1]);
});

test('quantili: nessun valore valido', () => {
  assert.deepEqual(quantili([], 5), []);
  assert.deepEqual(quantili([NaN, Infinity], 5), []);
});

test('residenti: P1 nullo o assente = senza dato', () => {
  assert.equal(INDICATORI.residenti.calcola({ P1: null }), null);
  assert.equal(INDICATORI.residenti.calcola({}), null);
  assert.equal(INDICATORI.residenti.calcola({ P1: '' }), null);
});

test('residenti: P1 = 0 è un dato valido', () => {
  assert.equal(INDICATORI.residenti.calcola({ P1: 0 }), 0);
});

test('percentuali: P1 nullo o zero = senza dato, mai NaN', () => {
  for (const k of ['under15', 'over74']) {
    assert.equal(INDICATORI[k].calcola({ P1: 0, P14: 0, P15: 0, P16: 0, P29: 0 }), null);
    assert.equal(INDICATORI[k].calcola({ P1: null, P14: 1, P15: 1, P16: 1, P29: 1 }), null);
  }
});

test('percentuali: componente mancante = senza dato', () => {
  assert.equal(INDICATORI.under15.calcola({ P1: 100, P14: 5, P15: null, P16: 5 }), null);
});

test('under15 e over74', () => {
  assert.equal(INDICATORI.under15.calcola({ P1: 100, P14: 5, P15: 5, P16: 5 }), 15);
  assert.equal(INDICATORI.over74.calcola({ P1: 200, P29: 50 }), 25);
});

test('densità: ab/ha da Area in m²; Area nulla o zero = senza dato', () => {
  assert.equal(INDICATORI.densita.calcola({ P1: 50, Area: 10000 }), 50);
  assert.equal(INDICATORI.densita.calcola({ P1: 50, Area: 0 }), null);
  assert.equal(INDICATORI.densita.calcola({ P1: null, Area: 10000 }), null);
});
