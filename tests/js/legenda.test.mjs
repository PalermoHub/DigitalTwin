import test from 'node:test';
import assert from 'node:assert/strict';
import { dopoClic, dopoClicMultiplo } from '../../js/core/legenda.js';

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

test('dopoClicMultiplo: un clic seleziona solo quella, altri clic aggiungono, il clic sull\'unica rimostra tutto', () => {
  const tutte = ['B1', 'B2', 'C1', 'C2'];
  let s = dopoClicMultiplo(new Set(tutte), tutte, ['B1']);
  assert.deepEqual([...s], ['B1']);
  s = dopoClicMultiplo(s, tutte, ['C2']);
  assert.deepEqual([...s].sort(), ['B1', 'C2']);
  s = dopoClicMultiplo(s, tutte, ['B1']); // toglie una delle due
  assert.deepEqual([...s], ['C2']);
  s = dopoClicMultiplo(s, tutte, ['C2']); // nessuna rimasta: tutto
  assert.equal(s.size, 4);
});

test('dopoClicMultiplo: una fascia (più zone) segue la stessa regola', () => {
  const tutte = ['B1', 'B2', 'C1', 'C2'];
  let s = dopoClicMultiplo(new Set(tutte), tutte, ['B1', 'B2']);
  assert.deepEqual([...s], ['B1', 'B2']);
  s = dopoClicMultiplo(s, tutte, ['C1', 'C2']);
  assert.equal(s.size, 4);
  s = dopoClicMultiplo(new Set(['B1', 'C1']), tutte, ['B1', 'B2']); // fascia anche solo in parte accesa: si spegne
  assert.deepEqual([...s], ['C1']);
});
