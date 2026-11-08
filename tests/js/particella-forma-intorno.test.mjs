import test from 'node:test';
import assert from 'node:assert/strict';
import { formaLotto } from '../../js/core/particella-forma.js';
import { percentile, percentileIstogramma, dimensioneRispetto } from '../../js/core/particella-percentile.js';
import { intornoParticella } from '../../js/core/particella-intorno.js';

const LNG = 13.36, LAT = 38.11, DX = 0.00001144, DY = 0.000009;
const rett = (x, y, w, h) => ({ type: 'Polygon', coordinates: [[[LNG + x * DX, LAT + y * DY], [LNG + (x + w) * DX, LAT + y * DY], [LNG + (x + w) * DX, LAT + (y + h) * DY], [LNG + x * DX, LAT + (y + h) * DY], [LNG + x * DX, LAT + y * DY]]] });
const vicino = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);

test('forma: quadrato 20×20 compatto, rettangolo 100×5 stretto', () => {
  const q = formaLotto(rett(0, 0, 20, 20));
  vicino(q.perimetro, 80, 1); vicino(q.rapporto, 1, 0.02); vicino(q.compattezza, Math.PI / 4, 0.02);
  assert.equal(q.esito, 'compatto');
  const r = formaLotto(rett(0, 0, 100, 5));
  vicino(r.lungo, 100, 1); vicino(r.corto, 5, 0.3);
  assert.equal(r.esito, 'stretto');
  assert.equal(formaLotto(null), null);
});

test('forma: MultiPolygon usa il poligono più esteso', () => {
  const g = { type: 'MultiPolygon', coordinates: [rett(0, 0, 2, 2).coordinates, rett(50, 0, 30, 30).coordinates] };
  vicino(formaLotto(g).perimetro, 120, 2);
});

test('percentile: mediana → 50, fuori intervallo → 2,5 / 97,5, dati incompleti → null', () => {
  const q = [10, 50, 100, 400, 1000];
  vicino(percentile(100, q), 50, 0.01);
  assert.equal(percentile(1, q), 2.5);
  assert.equal(percentile(1e6, q), 97.5);
  assert.equal(percentile(100, [1, 2]), null);
  assert.equal(percentile(0, q), null);
});

test('percentile da istogramma', () => {
  const h = { edges: [1, 10, 100], n: [50, 50] };
  vicino(percentileIstogramma(10, h), 50, 0.01);
  vicino(percentileIstogramma(31.6228, h), 75, 0.1);
  assert.equal(percentileIstogramma(1000, h), 100);
});

test('dimensioneRispetto: foglio, Palermo, zone; codici ignoti o doppi non producono righe', () => {
  const dati = { mediana: 240, hist: { edges: [1, 10, 100, 1000], n: [10, 10, 10] }, fogli: [{ f: 7, n: 100, q: [10, 50, 100, 400, 1000] }],
    q_zto: { E2: [500, 10, 50, 100, 400, 1000] }, q_omi: { R1: [800, 20, 60, 120, 500, 2000] } };
  const r = dimensioneRispetto(100, dati, { foglio: '7', zto: ['E2', 'E2', 'XX'], omi: ['R1'] });
  assert.equal(r.foglio.n, 100); assert.equal(r.foglio.mediana, 100); vicino(r.foglio.p, 50, 0.01);
  assert.equal(r.palermo.mediana, 240);
  assert.deepEqual(r.zto.map(z => [z.codice, z.n, z.mediana]), [['E2', 500, 100]]);
  assert.deepEqual(r.omi.map(z => z.codice), ['R1']);
  assert.equal(dimensioneRispetto(0, dati), null);
  assert.equal(dimensioneRispetto(100, dati, { foglio: '99' }).foglio, null);
});

test('intorno: confinanti (anche in più pezzi), entro 100 m, civici, vincolo lineare', () => {
  const me = rett(0, 0, 20, 20);
  const r = intornoParticella(me, {
    propria: 'A',
    vicine: [
      { id: 'A', geometry: me },
      { id: 'B', geometry: rett(20, 0, 20, 20) },       // adiacente
      { id: 'B', geometry: rett(20, 0, 20, 20) },       // stesso pezzo letto da un altro tile
      { id: 'C', geometry: rett(60, 0, 10, 10) },       // a 40 m
      { id: 'D', geometry: rett(300, 0, 10, 10) },      // lontana
    ],
    civici: [{ geometry: { type: 'Point', coordinates: [LNG + 10 * DX, LAT + 10 * DY] } }, { geometry: { type: 'Point', coordinates: [LNG + 500 * DX, LAT] } }],
    lineari: [{ tipo: 'Fascia', geometry: { type: 'LineString', coordinates: [[LNG + 10 * DX, LAT + 50 * DY], [LNG + 90 * DX, LAT + 50 * DY]] } }],
  });
  assert.deepEqual(r.confinanti, ['B']);
  assert.equal(r.vicine, 2);
  assert.equal(r.civici, 1);
  vicino(r.lineare.d, 40, 1); assert.equal(r.lineare.tipo, 'Fascia');
  assert.equal(intornoParticella(null), null);
  assert.equal(intornoParticella(me, {}).lineare, null);
});
