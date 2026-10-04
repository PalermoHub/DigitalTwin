import test from 'node:test';
import assert from 'node:assert/strict';
import { sposta, ordina, mosseMappa, mosseSequenza, applicaMosse, leggiOrdine, salvaOrdine } from '../../js/core/riordino.js';

// Mappa finta: moveLayer(id, prima) come in MapLibre (senza `prima` in cima).
function simula(stack, mosse) {
  const s = [...stack];
  applicaMosse({ moveLayer: (id, prima) => { s.splice(s.indexOf(id), 1); s.splice(prima === undefined ? s.length : s.indexOf(prima), 0, id); } }, mosse);
  return s;
}

test('sposta: porta un elemento in una nuova posizione senza toccare l\'originale', () => {
  const a = ['a', 'b', 'c', 'd'];
  assert.deepEqual(sposta(a, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(sposta(a, 3, 0), ['d', 'a', 'b', 'c']);
  assert.deepEqual(a, ['a', 'b', 'c', 'd']);
});
test('sposta: posizioni fuori limite si fermano ai bordi', () => {
  assert.deepEqual(sposta(['a', 'b', 'c'], 1, -5), ['b', 'a', 'c']);
  assert.deepEqual(sposta(['a', 'b', 'c'], 1, 9), ['a', 'c', 'b']);
});

test('ordina: segue l\'ordine salvato, i nuovi vanno in coda nell\'ordine originale', () => {
  assert.deepEqual(ordina(['a', 'b', 'c', 'd'], ['c', 'a']), ['c', 'a', 'b', 'd']);
  assert.deepEqual(ordina(['a', 'b'], ['x', 'b', 'y']), ['b', 'a']);
  assert.deepEqual(ordina(['a', 'b'], undefined), ['a', 'b']);
});

test('mosseMappa: il primo strato dell\'elenco finisce sopra gli altri', () => {
  const stack = ['x', 'a1', 'a2', 'b1', 'y'];
  // elenco: b in alto, poi a  -> b disegnato sopra a
  const mosse = mosseMappa(stack, [['b1'], ['a1', 'a2']]);
  const fine = simula(stack, mosse);
  assert.deepEqual(fine, ['x', 'a1', 'a2', 'b1', 'y']);
  const mosse2 = mosseMappa(stack, [['a1', 'a2'], ['b1']]);
  assert.deepEqual(simula(stack, mosse2), ['x', 'b1', 'a1', 'a2', 'y']);
});
test('mosseMappa: ignora i layer che non esistono e non fa nulla se tutto è già in ordine', () => {
  const stack = ['a1', 'b1'];
  assert.deepEqual(mosseMappa(stack, [['b1'], ['a1', 'assente']]), []);
});
test('mosseMappa: gli strati di altri gruppi restano al loro posto relativo', () => {
  const stack = ['a', 'z', 'b'];
  const fine = simula(stack, mosseMappa(stack, [['a'], ['b']]));
  assert.deepEqual(fine, ['z', 'b', 'a']);
});

test('mosseSequenza: ricostruisce una sequenza data dal basso', () => {
  const stack = ['x', 'b', 'z', 'a', 'y'];
  assert.deepEqual(simula(stack, mosseSequenza(stack, ['a', 'b'])), ['x', 'z', 'a', 'b', 'y']);
});

test('applicaMosse: usa moveLayer della mappa', () => {
  const chiamate = [];
  const map = { moveLayer: (id, prima) => chiamate.push([id, prima]) };
  applicaMosse(map, [['a', 'b'], ['c', undefined]]);
  assert.deepEqual(chiamate, [['a', 'b'], ['c', undefined]]);
});

test('leggiOrdine / salvaOrdine: giro completo e storage rotto ignorato', () => {
  const dati = new Map();
  const st = { getItem: k => dati.get(k) ?? null, setItem: (k, v) => dati.set(k, v) };
  assert.deepEqual(leggiOrdine(st), {});
  salvaOrdine(st, 'servizi', ['b', 'a']);
  assert.deepEqual(leggiOrdine(st), { servizi: ['b', 'a'] });
  assert.deepEqual(leggiOrdine({ getItem: () => '{non json' }), {});
  assert.doesNotThrow(() => salvaOrdine({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, 'x', []));
  assert.deepEqual(leggiOrdine(null), {});
});
