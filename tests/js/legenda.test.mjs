import test from 'node:test';
import assert from 'node:assert/strict';
import { dopoClic } from '../../js/core/legenda.js';

test('dopoClic: dal tutto acceso il clic seleziona solo la voce cliccata', () => {
  assert.deepEqual(dopoClic([true, true, true], 1), [false, true, false]);
});

test('dopoClic: da una voce sola accesa, il clic su un\'altra sposta la selezione', () => {
  assert.deepEqual(dopoClic([false, true, false], 2), [false, false, true]);
});

test('dopoClic: il clic sull\'unica voce accesa riaccende tutte', () => {
  assert.deepEqual(dopoClic([false, true, false], 1), [true, true, true]);
});

test('dopoClic: su una voce spenta con altre accese seleziona solo quella', () => {
  assert.deepEqual(dopoClic([true, false, true], 1), [false, true, false]);
});
