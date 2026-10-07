import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { tendenza, LIVELLI } from '../../js/layers/popolazione-classifica.js';

const FILE_DATI = new URL('../../dati/popolazione/classifica.json', import.meta.url);
const dati = existsSync(FILE_DATI) ? JSON.parse(readFileSync(FILE_DATI)) : null; // i dati pesanti non stanno in git: in CI il test sui dati si salta

test('tendenza: segno, soglia di stabilità e dato mancante', () => {
  assert.equal(tendenza(100, 90).verso, 'down');
  assert.equal(tendenza(100, 110).verso, 'up');
  assert.equal(tendenza(1000, 1002).verso, 'flat');
  assert.equal(tendenza(100, null), null);
  assert.equal(tendenza(0, 5), null);
});

test('classifica.json: tre livelli per anno, ordinati e con il totale di Palermo', { skip: !dati && 'dati/popolazione/classifica.json assente' }, () => {
  for (const anno of ['2021', '2023']) {
    for (const l of Object.keys(LIVELLI)) {
      const righe = dati[anno][l];
      assert.ok(righe.length > 0);
      assert.deepEqual(righe.map(r => r[1]), righe.map(r => r[1]).sort((a, b) => b - a));
      assert.ok(righe.every(r => r[2] <= r[1]));
    }
  }
  assert.equal(dati['2021'].circoscrizioni.reduce((a, r) => a + r[1], 0), 635439);
});
