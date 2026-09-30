import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizza, preparaIndice, cerca } from '../../js/core/indirizzi.js';

const voci = preparaIndice({
  'VIA MAQUEDA': { '1': [13.36, 38.11], '100': [13.361, 38.112] },
  'VIA ROMA': { '5': [13.37, 38.12] },
  "ARCO BONDI'": { '1': [13.3678, 38.1148] },
  'VIA DELLA LIBERTA': { '7': [13.35, 38.13] },
  'CORSO VITTORIO EMANUELE': { '2': [13.365, 38.115] },
});

test('normalizza: maiuscole, accenti, punteggiatura, spazi', () => {
  assert.equal(normalizza('  Via  della Libertà!  '), 'VIA DELLA LIBERTA');
  assert.equal(normalizza("Arco Bondi'"), "ARCO BONDI'");
});

test('via e civico esistente', () => {
  const r = cerca(voci, 'via maqueda 100');
  assert.deepEqual(r[0], { etichetta: 'VIA MAQUEDA 100', lon: 13.361, lat: 38.112 });
});

test('via senza civico: primo civico disponibile', () => {
  const r = cerca(voci, 'via roma');
  assert.equal(r[0].etichetta, 'VIA ROMA');
  assert.equal(r[0].lon, 13.37);
});

test('accenti nella query', () => {
  assert.equal(cerca(voci, 'via della Libertà 7')[0].etichetta, 'VIA DELLA LIBERTA 7');
});

test('apostrofo opzionale nella query', () => {
  assert.equal(cerca(voci, 'arco bondi')[0].etichetta, "ARCO BONDI'");
  assert.equal(cerca(voci, "arco bondi' 1")[0].etichetta, "ARCO BONDI' 1");
});

test('civico inesistente: ripiega sulla via', () => {
  const r = cerca(voci, 'via roma 999');
  assert.equal(r[0].etichetta, 'VIA ROMA');
});

test('input scomodi: vuoto, spazi, solo cifre, nessuna corrispondenza', () => {
  assert.deepEqual(cerca(voci, ''), []);
  assert.deepEqual(cerca(voci, '   '), []);
  assert.deepEqual(cerca(voci, '100'), []);
  assert.deepEqual(cerca(voci, 'xyzxyz'), []);
});

test('ordina prima le vie che iniziano con il testo', () => {
  const v2 = preparaIndice({
    'PIAZZA VERDI': { '1': [1, 1] },
    'VIA VERDI': { '1': [2, 2] },
    'VERDI': { '1': [3, 3] },
  });
  assert.equal(cerca(v2, 'verdi')[0].etichetta, 'VERDI');
});

test('rispetta il numero massimo di risultati', () => {
  const tante = preparaIndice(Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [`VIA ${i} TEST`, { '1': [0, i] }])
  ));
  assert.equal(cerca(tante, 'test', 5).length, 5);
});
