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

test('civico inesistente: ripiega sulla via e lo dice', () => {
  const r = cerca(voci, 'via roma 999');
  assert.equal(r[0].etichetta, 'VIA ROMA');
  assert.equal(r[0].nota, 'civico 999 non trovato');
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

// Formati dell'indice reale (palermohub): civici con lettera ("4A"), vie che finiscono con un numero
const reali = preparaIndice({
  'ARCO DEI CARTARI': { '1': [13.1, 38.1], '4A': [13.2, 38.2], '4B': [13.3, 38.3], '5': [13.4, 38.4] },
  'CORTILE V': { '1': [13.5, 38.5] },
  'LARGO V': { '21': [13.6, 38.6], '23': [13.7, 38.7] },
  "VIA DELLA LIBERTA'": { '7': [13.8, 38.8] },
});

test('civico con lettera: 4A, 4/A, 4 A, minuscole', () => {
  for (const t of ['arco dei cartari 4A', 'arco dei cartari 4/A', 'arco dei cartari 4 A', 'ARCO DEI CARTARI 4a']) {
    const r = cerca(reali, t);
    assert.equal(r[0].etichetta, 'ARCO DEI CARTARI 4A', t);
    assert.equal(r[0].lon, 13.2, t);
    assert.equal(r[0].nota, undefined, t);
  }
});

test('civico senza lettera quando esistono solo varianti con lettera: le propone', () => {
  const r = cerca(reali, 'arco dei cartari 4');
  assert.deepEqual(r.map(x => x.etichetta), ['ARCO DEI CARTARI 4A', 'ARCO DEI CARTARI 4B']);
});

test('lettera inesistente: ripiega sulla via con la nota', () => {
  const r = cerca(reali, 'arco dei cartari 4Z');
  assert.equal(r[0].etichetta, 'ARCO DEI CARTARI');
  assert.equal(r[0].nota, 'civico 4Z non trovato');
});

test('vie che finiscono con un numero o una lettera', () => {
  assert.equal(cerca(reali, 'cortile v 1')[0].etichetta, 'CORTILE V 1');
  assert.equal(cerca(reali, 'largo v 21')[0].etichetta, 'LARGO V 21');
  assert.equal(cerca(reali, 'largo v')[0].etichetta, 'LARGO V');
});

test('via con apostrofo e accento nell\'indice reale', () => {
  assert.equal(cerca(reali, 'via della libertà 7')[0].etichetta, "VIA DELLA LIBERTA' 7");
});

test('nessuna etichetta duplicata né numeri ripetuti', () => {
  for (const t of ['largo v 21', 'arco dei cartari 4A', 'cortile v 1', 'largo v 99']) {
    const e = cerca(reali, t)[0].etichetta;
    assert.ok(!/(\b\w+\b) \1$/.test(e), e); // es. «… 24 24»
  }
});
