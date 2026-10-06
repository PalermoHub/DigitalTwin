// tests/js/aggiungi-archivio.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { leggi, salva, CHIAVE, CHIAVE_MIEI } from '../../js/rndt/archivio.js';

const finto = () => {
  const m = new Map();
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
};
const stato = { v: 1, layers: [{ id: 'a', tipo: 'tile', nome: 'A', visibile: true, sorgente: { url: 'https://a.it/{z}/{x}/{y}.png' } }] };

test('senza chiave si usa quella del catalogo RNDT', () => {
  const s = finto();
  assert.equal(salva(s, stato), true);
  assert.deepEqual([...s.m.keys()], [CHIAVE]);
  assert.deepEqual(leggi(s), stato);
});

test('con una chiave propria gli stati non si mescolano', () => {
  const s = finto();
  salva(s, stato, CHIAVE_MIEI);
  assert.deepEqual(leggi(s), { v: 1, layers: [] });
  assert.deepEqual(leggi(s, CHIAVE_MIEI), stato);
  assert.equal(CHIAVE_MIEI, 'dt:miei:v1');
});

test('storage bloccato: leggi dà lo stato vuoto, salva dà false', () => {
  const rotto = { getItem() { throw new Error('bloccato'); }, setItem() { throw new Error('pieno'); } };
  assert.deepEqual(leggi(rotto, CHIAVE_MIEI), { v: 1, layers: [] });
  assert.equal(salva(rotto, stato, CHIAVE_MIEI), false);
  assert.deepEqual(leggi(null, CHIAVE_MIEI), { v: 1, layers: [] });
});
