import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { unisciPezzi } from '../../js/core/edificio-contorno.js';

// Come nel browser: script classico che espone polygonClipping
const ctx = vm.createContext({});
vm.runInContext(readFileSync(new URL('../../js/vendor/polygon-clipping.umd.min.js', import.meta.url), 'utf8'), ctx);
const union = ctx.polygonClipping.union;
const quad = (x0, y0, x1, y1) => ({ type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] });

test('un solo pezzo resta com\'è', () => {
  assert.equal(unisciPezzi([quad(0, 0, 1, 1)], union).coordinates.length, 1);
});
test('pezzi affiancati o sovrapposti diventano un solo poligono senza giunture', () => {
  for (const b of [quad(1, 0, 2, 1), quad(0.8, 0, 2, 1)]) {
    const u = unisciPezzi([quad(0, 0, 1, 1), b], union);
    assert.equal(u.coordinates.length, 1);
    assert.equal(u.coordinates[0].length, 1); // nessun buco
    assert.equal(u.coordinates[0][0].length, 5); // rettangolo 0..2: 4 vertici + chiusura
  }
});
test('senza libreria o senza pezzi non si rompe', () => {
  assert.equal(unisciPezzi([], union), null);
  assert.equal(unisciPezzi([quad(0, 0, 1, 1), quad(1, 0, 2, 1)], null).coordinates.length, 2);
});
