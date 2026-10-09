import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import { distanzaM, fermateVicine, voceTrasportoVicino } from '../../js/layers/trasporto-vicino.js';

// 0,001° di latitudine ≈ 111 m
const f = (id, nome, lon, lat, linee) => ({ id, nome, lon, lat, linee });
const fermate = [
  f('A', 'Piazza Politeama', 13.350, 38.1300, ['101', 'T1']),
  f('B', 'Via Libertà', 13.350, 38.1320, ['101', '102']),
  f('C', 'Lontana', 13.350, 38.1500, ['999']),
];
const info = n => ({ T1: { tipo: 'tram', colore: '#111' }, 101: { tipo: 'bus', colore: '#222' }, 102: { tipo: 'bus', colore: '#333' } }[n]);
const punto = [13.350, 38.1301];

test('distanzaM: 0,001° di latitudine ≈ 111 m, zero per lo stesso punto', () => {
  assert.equal(distanzaM([13, 38], [13, 38]), 0);
  assert.ok(Math.abs(distanzaM([13.35, 38.13], [13.35, 38.131]) - 111) < 2);
});

test('fermateVicine: entro il raggio, dalla più vicina, con le linee ordinate e colorate', () => {
  const r = fermateVicine(punto, fermate, info, 300);
  assert.deepEqual(r.map(x => x.id), ['A', 'B']);
  assert.deepEqual(r[0].linee, [{ numero: '101', tipo: 'bus', colore: '#222' }, { numero: 'T1', tipo: 'tram', colore: '#111' }]);
  assert.ok(r[0].distanza < r[1].distanza);
});

test('fermateVicine: nessuna fermata nel raggio, o solo linee sconosciute → vuoto', () => {
  assert.deepEqual(fermateVicine([13.4, 38.0], fermate, info, 300), []);
  assert.deepEqual(fermateVicine(punto, [f('X', 'X', 13.35, 38.1301, ['ZZZ'])], info, 300), []);
});

test('voceTrasportoVicino: tetto alle fermate, nota, evidenza sulla mappa e hook dinamico', () => {
  const tante = Array.from({ length: 10 }, (_, i) => ({ id: `F${i}`, nome: `F${i}`, lon: 13.35, lat: 38.13, distanza: i, linee: [] }));
  let ricevute;
  const v = voceTrasportoVicino(tante, 300, fermate => { ricevute = fermate; return 'nodo'; });
  assert.equal(v.titolo, 'Trasporto pubblico vicino');
  assert.equal(v.dinamico(), 'nodo');
  assert.equal(ricevute.length, 8);
  assert.match(v.nota, /300 m/);
  assert.match(v.nota, /altre 2 più lontane/);
  assert.equal(v.evidenza[0].features.length, 8);
  assert.deepEqual(v.evidenza[0].features[0].geometry.coordinates, [13.35, 38.13]);
});

test('voceTrasportoVicino: senza fermate nessuna voce; la scheda la unisce', () => {
  assert.equal(voceTrasportoVicino([], 300, () => null), null);
  const v = voceTrasportoVicino([{ id: 'A', nome: 'A', lon: 13, lat: 38, distanza: 5, linee: [] }], 300, () => null);
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('fermateVicine: una stazione in apertura, senza linee, compare lo stesso con il suo stato', () => {
  const porto = { id: 'fosm-2', nome: 'Palermo Porto', lon: 13.350, lat: 38.1305, linee: [], stato: 'in apertura' };
  const r = fermateVicine(punto, [...fermate, porto], info, 300);
  assert.deepEqual(r.map(x => x.id), ['A', 'fosm-2', 'B']);
  assert.equal(r[1].stato, 'in apertura');
  assert.deepEqual(r[1].linee, []);
  assert.equal(r[0].stato, undefined);
});

test('fermateVicine: una fermata senza linee e senza stato resta esclusa', () => {
  assert.deepEqual(fermateVicine(punto, [f('V', 'Vuota', 13.35, 38.1301, [])], info, 300), []);
});
