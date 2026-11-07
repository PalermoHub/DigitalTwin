import test from 'node:test';
import assert from 'node:assert/strict';
import { statisticheEdifici, mediana } from '../../js/core/particella-statistiche.js';

const ed = (area, altezza, uso = null) => ({ area, altezza, uso, cavallo: false });

test('nessun edificio: null', () => assert.equal(statisticheEdifici([]), null));

test('mediana: pari, dispari, vuoto', () => {
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([4, 1, 2, 3]), 2.5);
  assert.equal(mediana([]), null);
});

test('tessere: impronta, media, mediana, altezze', () => {
  const s = statisticheEdifici([ed(68, 20.5), ed(55, 4.5), ed(40, 18.5)]);
  assert.equal(s.n, 3);
  assert.equal(s.impronta, 163);
  assert.ok(Math.abs(s.mediaM2 - 54.33) < 0.01);
  assert.equal(s.medianaM2, 55);
  assert.equal(s.altezzaMediana, 18.5);
  assert.equal(s.altezzaMax, 20.5);
  assert.equal(s.conQuota, 3);
});

test('classi di altezza: i limiti appartengono alla classe inferiore', () => {
  const s = statisticheEdifici([ed(10, 3), ed(10, 3.1), ed(10, 6), ed(10, 30), ed(10, 31)]);
  assert.deepEqual(s.classiAltezza.map(c => [c.chiave, c.n]), [['a3', 1], ['a6', 2], ['a30', 1], ['oltre', 1]]);
});

test('altezza ignota: classe a parte, fuori da mediana e massimo', () => {
  const s = statisticheEdifici([ed(100, null), ed(50, 9)]);
  assert.deepEqual(s.altezzaIgnota, { n: 1, m2: 100 });
  assert.equal(s.altezzaMediana, 9);
  assert.equal(s.conQuota, 1);
  const solo = statisticheEdifici([ed(100, null)]);
  assert.equal(solo.altezzaMediana, null);
  assert.equal(solo.altezzaMax, null);
});

test('uso prevalente: per famiglia, ignora UNK e assente', () => {
  const s = statisticheEdifici([ed(1, 5, 'RES1'), ed(1, 5, 'RES2'), ed(1, 5, 'COM'), ed(1, 5, 'UNK'), ed(1, 5)]);
  assert.equal(s.usoPrevalente, 'RES');
  assert.equal(s.conUso, 3);
  assert.equal(statisticheEdifici([ed(1, 5, 'UNK')]).usoPrevalente, null);
});

test('più grandi: ordinati per area, al massimo cinque', () => {
  const s = statisticheEdifici([1, 9, 5, 7, 3, 8, 2].map(a => ed(a, 5)));
  assert.deepEqual(s.piuGrandi.map(e => e.area), [9, 8, 7, 5, 3]);
});
