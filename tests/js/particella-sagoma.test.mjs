import test from 'node:test';
import assert from 'node:assert/strict';
import { sagomaSvg } from '../../js/core/particella-sagoma.js';

const rett = (x, y, w, h) => [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]];

test('sagoma nulla senza particella o con riquadro degenere', () => {
  assert.equal(sagomaSvg(null), null);
  assert.equal(sagomaSvg({ particella: [], edifici: [] }), null);
  assert.equal(sagomaSvg({ particella: [rett(0, 0, 0, 0)], edifici: [] }), null);
});

test('proporzioni conservate e nord in alto', () => {
  const g = sagomaSvg({ particella: [rett(0, 0, 100, 50)], edifici: [{ poligoni: [rett(10, 40, 10, 10)], cavallo: false, altezza: 9, area: 100 }] });
  
  assert.ok(g.larghezza > g.altezza);
  assert.equal(g.edifici.length, 1);
  assert.match(g.particella, /^M.+Z$/);
  // l'edificio sta in alto (y piccola): y_nord=50 -> margine
  const ys = [...g.edifici[0].d.matchAll(/ ([\d.]+)/g)].map(m => +m[1]);
  assert.ok(Math.min(...ys) < g.altezza / 3);
});

test('il riquadro include un edificio a cavallo che esce dal lotto', () => {
  const dentro = sagomaSvg({ particella: [rett(0, 0, 100, 100)], edifici: [] });
  const fuori = sagomaSvg({ particella: [rett(0, 0, 100, 100)], edifici: [{ poligoni: [rett(90, 0, 60, 20)], cavallo: true, altezza: null, area: 1200 }] });
  assert.notEqual(fuori.particella, dentro.particella); // scala ridotta per far stare anche l'edificio che esce
  assert.equal(fuori.edifici[0].cavallo, true);
});
