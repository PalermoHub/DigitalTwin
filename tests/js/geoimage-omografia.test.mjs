import test from 'node:test';
import assert from 'node:assert/strict';
import { omografia, proietta, davanti, css3d } from '../../js/geoimage/omografia.js';

const vicino = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
const ANGOLI_IMMAGINE = [[0, 0], [300, 0], [0, 200], [300, 200]]; // NO, NE, SO, SE

test('un rettangolo semplice è una traslazione con scala', () => {
  const m = omografia(200, 100, [[10, 20], [210, 20], [10, 120], [210, 120]]);
  const nord = proietta(m, 0, 0), sud = proietta(m, 200, 100);
  vicino(nord.x, 10); vicino(nord.y, 20);
  vicino(sud.x, 210); vicino(sud.y, 120);
});

test('un parallelogramma ruotato porta ogni angolo dell\'immagine sul suo punto', () => {
  const q = [[50, 10], [150, 40], [30, 90], [130, 120]];
  const m = omografia(300, 200, q);
  ANGOLI_IMMAGINE.forEach(([x, y], i) => { const p = proietta(m, x, y); vicino(p.x, q[i][0]); vicino(p.y, q[i][1]); });
});

test('un quadrilatero in prospettiva (mappa inclinata) porta ogni angolo sul suo punto', () => {
  const q = [[0, 0], [100, 10], [-20, 90], [130, 100]];
  const m = omografia(300, 200, q);
  ANGOLI_IMMAGINE.forEach(([x, y], i) => { const p = proietta(m, x, y); vicino(p.x, q[i][0]); vicino(p.y, q[i][1]); });
  assert.equal(davanti(m, 300, 200), true);
});

test('un quadrilatero degenere (punti coincidenti) non ha omografia', () => {
  assert.equal(omografia(10, 10, [[0, 0], [0, 0], [0, 0], [0, 0]]), null);
  assert.equal(omografia(10, 10, [[0, 0], [10, 0], [20, 0], [30, 0]]), null, 'tutti su una retta');
});

test('coordinate non finite (punto dietro la camera) non danno una matrice', () => {
  assert.equal(omografia(10, 10, [[NaN, 0], [1, 0], [0, 1], [1, 1]]), null);
});

test('css3d scrive le colonne nell\'ordine di matrix3d', () => {
  const m = { A: 2, B: 3, C: 5, D: 7, E: 11, F: 13, G: 0.1, H: 0.2 };
  assert.equal(css3d(m), 'matrix3d(2,7,0,0.1,3,11,0,0.2,0,0,1,0,5,13,0,1)');
});
