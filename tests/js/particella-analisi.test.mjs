import test from 'node:test';
import assert from 'node:assert/strict';
import { analizzaParticella } from '../../js/core/particella-analisi.js';

// 1 m ≈ 0.00001144° di longitudine e 0.000009° di latitudine a Palermo
const LNG = 13.36, LAT = 38.11, DX = 0.00001144, DY = 0.000009;
// rettangolo in metri dall'origine
const rett = (x, y, w, h) => ({ type: 'Polygon', coordinates: [[[LNG + x * DX, LAT + y * DY], [LNG + (x + w) * DX, LAT + y * DY], [LNG + (x + w) * DX, LAT + (y + h) * DY], [LNG + x * DX, LAT + (y + h) * DY], [LNG + x * DX, LAT + y * DY]]] });
const vicino = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);

const particella = rett(0, 0, 100, 100); // 10.000 m²

test('particella senza edifici: solo la superficie', () => {
  const a = analizzaParticella(particella, []);
  vicino(a.m2, 10000, 200);
  assert.equal(a.n, 0);
  assert.equal(a.copertoM2, 0);
  assert.equal(a.altezze.med, null);
  assert.equal(a.volumeM3, null);
  assert.equal(a.residenti, null);
});

test('edificio interno: coperto, copertura, altezza e volume', () => {
  const a = analizzaParticella(particella, [{ id: 1, geometry: rett(10, 10, 20, 20), altezza: 10, pop: 8 }]);
  assert.equal(a.n, 1);
  assert.equal(a.nCavallo, 0);
  vicino(a.copertoM2, 400, 15);
  vicino(a.copertura, 4, 0.2);
  vicino(a.altezze.min, 10, 1e-9); vicino(a.altezze.max, 10, 1e-9); vicino(a.altezze.med, 10, 1e-9);
  vicino(a.volumeM3, 4000, 150);
  vicino(a.residenti, 8, 1e-9);
});

test('edificio a cavallo: conta, con solo la parte dentro nel coperto', () => {
  const a = analizzaParticella(particella, [{ id: 2, geometry: rett(90, 40, 20, 20), altezza: 12 }]);
  assert.equal(a.n, 1);
  assert.equal(a.nCavallo, 1);
  vicino(a.copertoM2, 200, 20);
});

test('edificio fuori o con meno del 10% dentro: non conta', () => {
  const a = analizzaParticella(particella, [
    { id: 3, geometry: rett(200, 200, 20, 20), altezza: 9 },
    { id: 4, geometry: rett(98, 40, 40, 20), altezza: 9 }, // 2 m su 40 = 5% dentro
  ]);
  assert.equal(a.n, 0);
  assert.equal(a.copertoM2, 0);
});

test('altezza 0 o assente = ignota: fuori da media, massimo e volume; la media pesa sull\'impronta', () => {
  const a = analizzaParticella(particella, [
    { id: 5, geometry: rett(5, 5, 10, 10), altezza: 6 },   // 100 m²
    { id: 6, geometry: rett(30, 5, 30, 10), altezza: 12 }, // 300 m²
    { id: 7, geometry: rett(5, 40, 10, 10), altezza: 0 },
    { id: 8, geometry: rett(30, 40, 10, 10) },
  ]);
  assert.equal(a.n, 4);
  assert.equal(a.altezze.ignote, 2);
  assert.equal(a.altezze.noti, 2);
  vicino(a.altezze.min, 6, 1e-9); vicino(a.altezze.max, 12, 1e-9);
  vicino(a.altezze.med, 10.5, 0.3); // (6·100 + 12·300) / 400
});

test('un edificio tagliato dai tile (stesso id, due pezzi) conta una volta; le copie identiche non raddoppiano', () => {
  const a = analizzaParticella(particella, [
    { id: 9, geometry: rett(10, 10, 10, 20), altezza: 8 },
    { id: 9, geometry: rett(20, 10, 10, 20), altezza: 8 },
    { id: 9, geometry: rett(20, 10, 10, 20), altezza: 8 },
  ]);
  assert.equal(a.n, 1);
  vicino(a.copertoM2, 400, 15);
});

test('particella con un buco (cortile): l\'edificio nel buco non conta', () => {
  const conBuco = { type: 'Polygon', coordinates: [...particella.coordinates, ...rett(40, 40, 20, 20).coordinates] };
  const a = analizzaParticella(conBuco, [{ id: 10, geometry: rett(45, 45, 10, 10), altezza: 5 }]);
  assert.equal(a.n, 0);
  vicino(a.m2, 9600, 200);
});

test('geometria non poligonale: null', () => {
  assert.equal(analizzaParticella({ type: 'Point', coordinates: [LNG, LAT] }, []), null);
});

test('pezzi di tile sovrapposti (pezziUniti): l\'area si misura sull\'unione, non sulla somma', () => {
  const unita = { type: 'MultiPolygon', coordinates: [rett(0, 0, 60, 100).coordinates, rett(40, 0, 60, 100).coordinates] }; // 20 m di buffer in comune
  const a = analizzaParticella(unita, [{ id: 11, geometry: rett(45, 40, 10, 10), altezza: 7 }], { pezziUniti: true });
  vicino(a.m2, 10000, 250); // la somma darebbe 12.000
  assert.equal(a.n, 1);
});

test('la sagoma elenca gli edifici contati, con il flag a cavallo', () => {
  const a = analizzaParticella(particella, [{ id: 1, geometry: rett(10, 10, 20, 20), altezza: 10 }, { id: 2, geometry: rett(90, 40, 30, 20), altezza: 6 }, { id: 3, geometry: rett(300, 300, 10, 10) }]);
  assert.equal(a.sagoma.particella.length, 1);
  assert.equal(a.sagoma.edifici.length, 2);
  assert.deepEqual(a.sagoma.edifici.map(e => e.cavallo), [false, true]);
});

test('supMq dei tile ha la precedenza sulla misura geometrica', () => {
  const part = rett(0, 0, 40, 40);
  assert.equal(analizzaParticella(part, [], { supMq: 1234.5 }).m2, 1234.5);
  assert.ok(Math.abs(analizzaParticella(part, [], { supMq: 0 }).m2 - 1600) < 50); // 0 o assente: misura sulla geometria
});
