import test from 'node:test';
import assert from 'node:assert/strict';
import { nascosti } from '../../js/core/sottogruppi.js';

// nodi finti: { t: 'titolo' | 'strato', chiuso?: bool }
const titolo = (chiuso = false) => ({ t: 'titolo', chiuso });
const strato = nome => ({ t: 'strato', nome });
const eTitolo = n => n.t === 'titolo';
const chiuso = n => n.chiuso;

test('nascosti: gli strati di un sottogruppo chiuso, fino al titolo successivo', () => {
  const a = strato('a'), b = strato('b'), c = strato('c');
  const nodi = [titolo(true), a, b, titolo(false), c];
  assert.deepEqual(nascosti(nodi, eTitolo, chiuso), [a, b]);
});

test('nascosti: tutti aperti, nessun nodo nascosto', () => {
  const nodi = [titolo(), strato('a'), titolo(), strato('b')];
  assert.deepEqual(nascosti(nodi, eTitolo, chiuso), []);
});

test('nascosti: i nodi prima del primo titolo non si nascondono mai', () => {
  const x = strato('x');
  assert.deepEqual(nascosti([x, titolo(true), strato('a')], eTitolo, chiuso).includes(x), false);
});

test('nascosti: l\'ultimo sottogruppo chiuso nasconde tutto ciò che lo segue', () => {
  const a = strato('a'), b = strato('b');
  assert.deepEqual(nascosti([titolo(false), strato('c'), titolo(true), a, b], eTitolo, chiuso), [a, b]);
});

test('nascosti: i titoli non si nascondono', () => {
  const t2 = titolo(false);
  assert.equal(nascosti([titolo(true), strato('a'), t2], eTitolo, chiuso).includes(t2), false);
});
