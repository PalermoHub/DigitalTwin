import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { urbanisticaParticella } from '../../js/core/particella-urbanistica.js';

// Come nel browser: script classico che espone polygonClipping
const ctx = vm.createContext({});
vm.runInContext(readFileSync(new URL('../../js/vendor/polygon-clipping.umd.min.js', import.meta.url), 'utf8'), ctx);
const pc = ctx.polygonClipping;
const lib = { union: pc.union, intersection: pc.intersection };

const LNG = 13.36, LAT = 38.11, DX = 0.00001144, DY = 0.000009;
const rett = (x, y, w, h) => ({ type: 'Polygon', coordinates: [[[LNG + x * DX, LAT + y * DY], [LNG + (x + w) * DX, LAT + y * DY], [LNG + (x + w) * DX, LAT + (y + h) * DY], [LNG + x * DX, LAT + (y + h) * DY], [LNG + x * DX, LAT + y * DY]]] });
const vicino = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);

const particella = rett(0, 0, 100, 100); // 10.000 m²
const chiave = f => f.properties.ZTO;

test('zona che copre metà particella: 5.000 m² e 50 %', () => {
  const r = urbanisticaParticella(particella, [{ geometry: rett(-50, 0, 100, 100), properties: { ZTO: 'B1' } }], chiave, lib);
  assert.equal(r.righe.length, 1);
  assert.equal(r.righe[0].chiave, 'B1');
  vicino(r.righe[0].m2, 5000, 100);
  vicino(r.righe[0].quota, 50, 1);
});

test('due zone: righe ordinate dalla più estesa, resto non classificato', () => {
  const r = urbanisticaParticella(particella, [
    { geometry: rett(0, 0, 30, 100), properties: { ZTO: 'A' } },
    { geometry: rett(30, 0, 50, 100), properties: { ZTO: 'B' } },
  ], chiave, lib);
  assert.deepEqual(r.righe.map(x => x.chiave), ['B', 'A']);
  vicino(r.fuoriM2, 2000, 100);
});

test('pezzi di tile sovrapposti della stessa zona: non si conta due volte', () => {
  const r = urbanisticaParticella(particella, [
    { geometry: rett(0, 0, 60, 100), properties: { ZTO: 'A' } },
    { geometry: rett(40, 0, 60, 100), properties: { ZTO: 'A' } },
  ], chiave, lib);
  assert.equal(r.righe.length, 1);
  vicino(r.righe[0].m2, 10000, 150);
  vicino(r.fuoriM2, 0, 150);
});

test('zona che non tocca la particella: ignorata', () => {
  const r = urbanisticaParticella(particella, [{ geometry: rett(500, 500, 10, 10), properties: { ZTO: 'X' } }], chiave, lib);
  assert.equal(r.righe.length, 0);
  vicino(r.fuoriM2, 10000, 200);
});

test('senza libreria o con geometria vuota: null', () => {
  assert.equal(urbanisticaParticella(particella, [], chiave, null), null);
  assert.equal(urbanisticaParticella(null, [], chiave, lib), null);
});
