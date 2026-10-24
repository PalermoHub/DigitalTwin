import test from 'node:test';
import assert from 'node:assert/strict';
import { leggiCesto, salvaCesto, svuotaCesto, collegaCestoAllaMappa, CHIAVE_CESTO } from '../../js/core/cesto-home.js';

const finto = () => { const dati = {}; return { dati, getItem: k => dati[k] ?? null, setItem: (k, v) => { dati[k] = v; }, removeItem: k => { delete dati[k]; } }; };

test('salva, rilegge e svuota il cesto; un valore illeggibile dà un cesto vuoto', () => {
  const s = finto();
  salvaCesto(s, new Set(['catasto', 'prg']));
  assert.deepEqual(leggiCesto(s), ['catasto', 'prg']);
  svuotaCesto(s);
  assert.deepEqual(leggiCesto(s), []);
  s.dati[CHIAVE_CESTO] = '{rotto';
  assert.deepEqual(leggiCesto(s), []);
});

test('le caselle accese sulla mappa finiscono nel cesto, esclusi i layer aggiunti dall\'utente', () => {
  const s = finto();
  const caselle = [['strato-catasto', true], ['strato-prg', false], ['strato-miei-a', true]].map(([id, checked]) => ({ id, checked, matches: q => q === 'input[id^="strato-"]' }));
  const ascolti = {};
  const doc = { querySelectorAll: () => caselle, addEventListener: (t, f) => { ascolti[t] = f; } };
  collegaCestoAllaMappa(doc, s);
  assert.deepEqual(leggiCesto(s), ['catasto']);
  caselle[1].checked = true;
  ascolti.change({ target: caselle[1] });
  assert.deepEqual(leggiCesto(s), ['catasto', 'prg']);
});

test('su telefono il Piano di emergenza apre subito la mappa, gli altri strati no', async () => {
  const { apreSubito } = await import('../../js/core/cesto-home.js');
  assert.equal(apreSubito(['protezione-civile'], true), true);
  assert.equal(apreSubito(['protezione-civile'], false), false);
  assert.equal(apreSubito(['scuole'], true), false);
});
