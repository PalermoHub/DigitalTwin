import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RAMPE, NODATA, coloriClassi, espressioneColore, etichetteClassi, datiGrafico } from '../../js/layers/isole-calore-classi.js';
import { voceIsolaCalore, FONTE } from '../../js/layers/scheda-isole-calore.js';

const dati = JSON.parse(readFileSync(new URL('../../dati/isole-calore/isole-calore.json', import.meta.url), 'utf8'));
const sez = { sez: 7, Quartiere: 'Tribunali-Castellammare', UPL_nome: 'Tribunali o Kalsa', circoscrizione: 'I',
  LST_2019: 41.35, LST_2020: 42.1, LST_2021: 40.07, LST_2022: 43.16, LST_2023: 41.99, LST_2024: 42.57, LST_2025: 42.24 };

test('una rampa di colori per ogni numero di classi, da 3 a 9', () => {
  for (let k = 3; k <= 9; k++) assert.equal(RAMPE[k].length, k);
  assert.equal(coloriClassi(5).length, 5);
  assert.equal(coloriClassi(2).length, 3); // fuori intervallo: si porta nei limiti
  assert.equal(coloriClassi(12).length, 9);
});

test('espressione colore: step sui limiti interni, grigio senza dato', () => {
  const e = espressioneColore('LST_2025', [30, 36, 40, 47]);
  assert.deepEqual(e, ['case', ['==', ['get', 'LST_2025'], null], NODATA,
    ['step', ['get', 'LST_2025'], RAMPE[3][0], 36, RAMPE[3][1], 40, RAMPE[3][2]]]);
});

test('etichette: intervalli in italiano, l\'ultimo include il massimo', () => {
  assert.deepEqual(etichetteClassi([30.31, 37.18, 39.75, 46.89]), ['30,3 – 37,2', '37,2 – 39,8', '39,8 – 46,9']);
});

test('i dati generati hanno soglie coerenti per ogni metodo e numero di classi', () => {
  for (const m of ['jenks', 'quantile', 'equal']) for (let k = 3; k <= 9; k++) {
    const s = dati.soglie[m][k];
    assert.equal(s.length, k + 1);
    assert.equal(etichetteClassi(s).length, k);
    assert.equal(espressioneColore('LST_2025', s)[3].length, 3 + (k - 1) * 2); // step: input, colore base, k-1 coppie
  }
});

test('dati del grafico: serie della sezione e media comunale sugli stessi anni, con scala', () => {
  const g = datiGrafico(sez, dati.serie);
  assert.deepEqual(g.anni, dati.anni);
  assert.equal(g.sezione.length, g.anni.length);
  assert.equal(g.sezione[0], 41.35);
  assert.equal(g.comune[0], dati.serie.media[0]);
  assert.ok(g.min <= Math.min(...g.sezione, ...g.comune) && g.max >= Math.max(...g.sezione, ...g.comune));
});

test('dati del grafico: anni senza dato restano null e non rompono la scala', () => {
  const g = datiGrafico({ LST_2019: 40, LST_2025: 44 }, dati.serie);
  assert.deepEqual(g.sezione.filter(v => v != null), [40, 44]);
  assert.equal(g.sezione[1], null);
  assert.ok(Number.isFinite(g.min) && Number.isFinite(g.max));
});

test('dati del grafico senza sezione: solo l\'andamento comunale', () => {
  const g = datiGrafico(null, dati.serie);
  assert.equal(g.sezione, null);
  assert.deepEqual(g.comune, dati.serie.media);
  assert.deepEqual(g.p25, dati.serie.p25);
});

test('scheda: sempre presente, badge con la temperatura, scarto dalla media e variazione', () => {
  const v = voceIsolaCalore(sez, dati, () => null);
  assert.equal(v.chiave, 'isolacalore-7');
  assert.equal(v.peso, 80);
  assert.equal(v.sempre, true);
  assert.equal(v.badge, '42,2 °C');
  const r = Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(x => [x.etichetta, x.valore]));
  assert.equal(r['Temperatura estiva'], '42,2 °C (2025)');
  assert.equal(r['Rispetto alla media comunale'], '+0,7 °C'); // 42,24 − 41,59 = 0,65
  assert.equal(r['Variazione dal 2019'], '+0,9 °C');
  assert.equal(typeof v.dinamico, 'function');
  assert.match(v.link.url, /isole_di_calore\.html$/);
  assert.equal(v.fonte, FONTE);
});

test('scheda: sezione senza dato 2025 non produce nessuna voce', () => {
  assert.equal(voceIsolaCalore({ sez: 9, LST_2019: 40 }, dati), null);
});
