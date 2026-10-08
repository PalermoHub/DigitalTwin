import test from 'node:test';
import assert from 'node:assert/strict';
import { cella, normalizza, geometriaUnita, colonneDa, unisciColonne, applicaPreferenze, ordina, filtra } from '../../js/core/tabella/modello.js';

const punto = (x, y, p = {}) => ({ type: 'Feature', properties: p, geometry: { type: 'Point', coordinates: [x, y] } });
const poli = (c, p = {}) => ({ type: 'Feature', properties: p, geometry: { type: 'Polygon', coordinates: [c] } });

test('cella: testo leggibile per valori nulli, array, oggetti e array serializzati da MapLibre', () => {
  assert.equal(cella(null), '');
  assert.equal(cella(undefined), '');
  assert.equal(cella(12.5), '12.5');
  assert.equal(cella(true), 'true');
  assert.equal(cella(['104', 'N1']), '104; N1');
  assert.equal(cella('["104","N1"]'), '104; N1');
  assert.equal(cella('[non è json]'), '[non è json]');
  assert.equal(cella({ a: 1 }), '{"a":1}');
  assert.equal(cella('[{"nome":"x"}]'), '{"nome":"x"}');
});

test('normalizza: deduplica per chiave del layer e non ripete geometrie identiche', () => {
  const s = { id: 'col', chiave: p => p.id };
  const righe = normalizza([punto(1, 2, { id: 'a', n: 1 }), punto(1, 2, { id: 'a', n: 1 }), punto(3, 4, { id: 'b' })], s);
  assert.equal(righe.length, 2);
  assert.equal(righe[0].chiave, 'col:a');
  assert.equal(righe[0].geometrie.length, 1);
});

test('normalizza: i pezzi di una particella tagliata dai tile diventano una riga con più geometrie', () => {
  const s = { id: 'cat', chiave: p => (p.Foglio != null ? `${p.Foglio}/${p.Paricella}` : null) };
  const p = { Foglio: 7, Paricella: 12 };
  const righe = normalizza([poli([[0, 0], [1, 0], [1, 1], [0, 0]], p), poli([[1, 0], [2, 0], [2, 1], [1, 0]], p)], s);
  assert.equal(righe.length, 1);
  assert.equal(righe[0].geometrie.length, 2);
});

test('normalizza: senza chiave si usano proprietà e posizione, quindi due punti uguali in posti diversi restano due righe', () => {
  const s = { id: 'inc' };
  const righe = normalizza([punto(1, 2, { Luogo: 'X' }), punto(1.1, 2, { Luogo: 'X' }), punto(1, 2, { Luogo: 'X' })], s);
  assert.equal(righe.length, 2);
});

test('normalizza: lista vuota e feature senza geometria', () => {
  assert.deepEqual(normalizza([], { id: 'x' }), []);
  const r = normalizza([{ type: 'Feature', properties: { a: 1 }, geometry: null }], { id: 'x' });
  assert.deepEqual(r[0].geometrie, []);
});

test('geometriaUnita: unisce poligoni in un multipoligono, tiene punti e linee', () => {
  const s = { id: 'cat', chiave: p => p.k };
  const [r] = normalizza([poli([[0, 0], [1, 0], [1, 1], [0, 0]], { k: 1 }), poli([[1, 0], [2, 0], [2, 1], [1, 0]], { k: 1 })], s);
  assert.equal(geometriaUnita(r).type, 'MultiPolygon');
  assert.equal(geometriaUnita(r).coordinates.length, 2);
  const [q] = normalizza([punto(1, 2, { id: 1 })], { id: 'p', chiave: p => p.id });
  assert.deepEqual(geometriaUnita(q), { type: 'Point', coordinates: [1, 2] });
  assert.equal(geometriaUnita({ geometrie: [] }), null);
});

test('colonneDa e unisciColonne: unione dei campi in ordine di comparsa, senza perdere quelle già scelte', () => {
  const righe = normalizza([punto(0, 0, { a: 1, b: 2 }), punto(1, 1, { b: 3, c: 4 })], { id: 'x' });
  const cols = colonneDa(righe);
  assert.deepEqual(cols.map(c => c.campo), ['a', 'b', 'c']);
  assert.deepEqual(cols[0], { campo: 'a', visibile: true, esporta: true });
  const attuali = [{ campo: 'b', visibile: false, esporta: false }];
  const unite = unisciColonne(attuali, righe);
  assert.deepEqual(unite.map(c => c.campo), ['b', 'a', 'c']);
  assert.equal(unite[0].esporta, false);
});

test('applicaPreferenze: ordine e flag salvati, campi sconosciuti in coda, preferenze obsolete ignorate', () => {
  const cols = [{ campo: 'a', visibile: true, esporta: true }, { campo: 'b', visibile: true, esporta: true }, { campo: 'c', visibile: true, esporta: true }];
  const out = applicaPreferenze(cols, [{ campo: 'c', visibile: true, esporta: false }, { campo: 'zzz', visibile: true, esporta: true }, { campo: 'a', visibile: false, esporta: false }]);
  assert.deepEqual(out.map(c => c.campo), ['c', 'a', 'b']);
  assert.equal(out[0].esporta, false);
  assert.equal(out[1].visibile, false);
  assert.deepEqual(applicaPreferenze(cols, null), cols);
});

test('ordina: numeri come numeri, testi con ordine italiano e vuoti in fondo', () => {
  const righe = normalizza([punto(0, 0, { n: 10, s: 'b' }), punto(1, 0, { n: 9, s: 'a' }), punto(2, 0, { n: '', s: 'c' })], { id: 'x' });
  assert.deepEqual(ordina(righe, 'n', 'su').map(r => r.proprieta.n), [9, 10, '']);
  assert.deepEqual(ordina(righe, 'n', 'giu').map(r => r.proprieta.n), [10, 9, '']);
  assert.deepEqual(ordina(righe, 's', 'su').map(r => r.proprieta.s), ['a', 'b', 'c']);
  assert.notEqual(ordina(righe, 'n', 'su'), righe, 'non modifica l’originale');
});

test('filtra: cerca in tutte le proprietà senza badare alle maiuscole', () => {
  const righe = normalizza([punto(0, 0, { nome: 'Via Roma' }), punto(1, 0, { nome: 'Via Libertà' })], { id: 'x' });
  assert.equal(filtra(righe, 'roma').length, 1);
  assert.equal(filtra(righe, '').length, 2);
  assert.equal(filtra(righe, 'zzz').length, 0);
});
