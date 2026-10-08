// tests/js/tabella-geom.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { puntoInPoligono, segmentiSiIncrociano, interseca, riquadro, chiudiPoligono } from '../../js/core/tabella/geom.js';

const quadrato = (x0, y0, x1, y1) => riquadro([x0, y0], [x1, y1]);

test('puntoInPoligono: dentro, fuori e nel buco', () => {
  const conBuco = [...quadrato(0, 0, 10, 10), [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]];
  assert.equal(puntoInPoligono([1, 1], conBuco), true);
  assert.equal(puntoInPoligono([5, 5], conBuco), false, 'nel buco');
  assert.equal(puntoInPoligono([11, 5], conBuco), false);
});

test('segmentiSiIncrociano: incrocio, parallelo, contatto in un estremo', () => {
  assert.equal(segmentiSiIncrociano([0, 0], [2, 2], [0, 2], [2, 0]), true);
  assert.equal(segmentiSiIncrociano([0, 0], [2, 0], [0, 1], [2, 1]), false);
  assert.equal(segmentiSiIncrociano([0, 0], [2, 0], [2, 0], [3, 1]), true);
  assert.equal(segmentiSiIncrociano([0, 0], [1, 0], [2, 0], [3, 0]), false, 'collineari disgiunti');
});

test('interseca: punti', () => {
  const c = [quadrato(0, 0, 10, 10)];
  assert.equal(interseca({ type: 'Point', coordinates: [5, 5] }, c), true);
  assert.equal(interseca({ type: 'Point', coordinates: [15, 5] }, c), false);
  assert.equal(interseca({ type: 'MultiPoint', coordinates: [[15, 5], [5, 5]] }, c), true);
});

test('interseca: linee che entrano, attraversano o restano fuori', () => {
  const c = [quadrato(0, 0, 10, 10)];
  assert.equal(interseca({ type: 'LineString', coordinates: [[5, 5], [20, 5]] }, c), true, 'un estremo dentro');
  assert.equal(interseca({ type: 'LineString', coordinates: [[-5, 5], [20, 5]] }, c), true, 'attraversa senza vertici dentro');
  assert.equal(interseca({ type: 'LineString', coordinates: [[-5, 20], [20, 20]] }, c), false);
});

test('interseca: poligoni che si toccano, si contengono o sono lontani', () => {
  const c = [quadrato(0, 0, 10, 10)];
  assert.equal(interseca({ type: 'Polygon', coordinates: quadrato(8, 8, 20, 20) }, c), true, 'sovrapposti');
  assert.equal(interseca({ type: 'Polygon', coordinates: quadrato(-5, -5, 20, 20) }, c), true, 'contiene il criterio');
  assert.equal(interseca({ type: 'Polygon', coordinates: quadrato(2, 2, 3, 3) }, c), true, 'contenuto nel criterio');
  assert.equal(interseca({ type: 'Polygon', coordinates: quadrato(20, 20, 30, 30) }, c), false);
});

test('interseca: criterio più piccolo di una feature con buco, dentro il buco → false', () => {
  const grande = { type: 'Polygon', coordinates: [...quadrato(0, 0, 100, 100), [[10, 10], [90, 10], [90, 90], [10, 90], [10, 10]]] };
  assert.equal(interseca(grande, [quadrato(40, 40, 50, 50)]), false);
  assert.equal(interseca(grande, [quadrato(1, 1, 2, 2)]), true);
});

test('interseca: multipoligono, geometry collection, null e criterio vuoto', () => {
  const c = [quadrato(0, 0, 10, 10)];
  assert.equal(interseca({ type: 'MultiPolygon', coordinates: [quadrato(20, 20, 30, 30), quadrato(5, 5, 6, 6)] }, c), true);
  assert.equal(interseca({ type: 'GeometryCollection', geometries: [{ type: 'Point', coordinates: [50, 50] }, { type: 'Point', coordinates: [5, 5] }] }, c), true);
  assert.equal(interseca(null, c), false);
  assert.equal(interseca({ type: 'Point', coordinates: [5, 5] }, []), false);
});

test('riquadro: ordina gli estremi e chiude l’anello', () => {
  assert.deepEqual(riquadro([10, 10], [0, 0]), [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);
});

test('chiudiPoligono: toglie i duplicati del doppio clic e rifiuta meno di 3 vertici', () => {
  assert.deepEqual(chiudiPoligono([[0, 0], [4, 0], [4, 4], [4, 4]]), [[[0, 0], [4, 0], [4, 4], [0, 0]]]);
  assert.equal(chiudiPoligono([[0, 0], [1, 1], [1, 1]]), null);
  assert.equal(chiudiPoligono([]), null);
});

test('interseca: criterio che tocca l’anello di una feature con buco, senza vertici nel corpo', () => {
  const conBuco = { type: 'Polygon', coordinates: [...quadrato(0, 0, 100, 100), [[10, 10], [90, 10], [90, 90], [10, 90], [10, 10]]] };
  assert.equal(interseca(conBuco, [quadrato(40, 40, 95, 95)]), true, 'il criterio attraversa il buco');
  assert.equal(interseca(conBuco, [quadrato(40, 40, 50, 50)]), false, 'tutto nel buco');
  assert.equal(interseca(conBuco, [quadrato(1, 1, 2, 2)]), true, 'nel corpo');
  assert.equal(interseca(conBuco, [quadrato(-5, -5, 200, 200)]), true, 'il criterio contiene la feature');
});
