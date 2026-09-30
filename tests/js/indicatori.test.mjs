import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { INDICATORI } from '../../js/core/indicatori.js';
import { leggiJson } from './dati.mjs';

const ORIGINALE = new URL('../../../palermo_popolazione/js/topics.js', import.meta.url);

test('indicatori disponibili: solo quelli con una rampa originale', () => {
  assert.deepEqual(Object.keys(INDICATORI), ['densita', 'vecchiaia']);
  assert.equal(INDICATORI.densita.rampa, 'popolazione');
  assert.equal(INDICATORI.vecchiaia.rampa, 'vecchiaia');
});

test('densità: ab/ha da Area in m²', () => {
  assert.equal(INDICATORI.densita.calcola({ P1: 50, Area: 10000 }), 50);
  assert.equal(INDICATORI.densita.calcola({ P1: 0, Area: 10000 }), 0);
});

test('densità: P1 nullo/assente/vuoto o Area nulla/zero = senza dato, mai NaN', () => {
  for (const r of [{ P1: null, Area: 10000 }, { Area: 10000 }, { P1: '', Area: 10000 },
                   { P1: 50, Area: 0 }, { P1: 50, Area: null }, { P1: 50 }]) {
    assert.equal(INDICATORI.densita.calcola(r), null, JSON.stringify(r));
  }
});

const SOTTO = ['P30', 'P31', 'P32', 'P67', 'P68', 'P69'];
const SOPRA = ['P43', 'P44', 'P45', 'P80', 'P81', 'P82'];
const rec = (sotto, sopra) => ({
  ...Object.fromEntries(SOTTO.map(k => [k, sotto])),
  ...Object.fromEntries(SOPRA.map(k => [k, sopra])),
});

test('vecchiaia: over65 ogni 100 under15, un decimale', () => {
  assert.equal(INDICATORI.vecchiaia.calcola(rec(10, 25)), 250);
  assert.equal(INDICATORI.vecchiaia.calcola({ ...rec(3, 1), P30: 4 }), 31.6); // 6/19 = 31.58
});

test('vecchiaia: nessun under15 (o campi mancanti) = senza dato, mai Infinity', () => {
  assert.equal(INDICATORI.vecchiaia.calcola(rec(0, 25)), null);
  assert.equal(INDICATORI.vecchiaia.calcola({}), null);
  assert.equal(INDICATORI.vecchiaia.calcola({ P43: 5 }), null);
});

for (const file of ['sezioni_indicatori.json', 'sezioni_indicatori_2023.json']) {
  test(`vecchiaia: identica a computeVecchiaiaById dell'app originale (${file})`,
    { skip: !existsSync(ORIGINALE) }, async () => {
      const { computeVecchiaiaById } = await import(ORIGINALE.href);
      const dati = await leggiJson(`popolazione/${file}`);
      const attesi = computeVecchiaiaById(dati);
      let confrontati = 0;
      for (const r of dati) {
        assert.equal(INDICATORI.vecchiaia.calcola(r), attesi.get(r.SEZ21_ID), `sezione ${r.SEZ21_ID}`);
        confrontati++;
      }
      assert.ok(confrontati > 3000);
    });
}
