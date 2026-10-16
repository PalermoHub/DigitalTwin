import test from 'node:test';
import assert from 'node:assert/strict';
import { altezzaInPunto, offsetIcona } from '../../js/core/quota-icone.js';

const quadrato = (x, y, h) => ({ geometry: { type: 'Polygon', coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]] }, properties: { altezza: h } });

test('altezzaInPunto trova l\'edificio che contiene il punto', () => {
  const p = [quadrato(0, 0, 10), quadrato(5, 5, 24)];
  assert.equal(altezzaInPunto(p, 0.5, 0.5), 10);
  assert.equal(altezzaInPunto(p, 5.5, 5.5), 24);
  assert.equal(altezzaInPunto(p, 3, 3), undefined);
});

test('altezzaInPunto legge anche i MultiPolygon e prende la più alta', () => {
  const multi = { geometry: { type: 'MultiPolygon', coordinates: [quadrato(0, 0, 0).geometry.coordinates] }, properties: { altezza: 30 } };
  assert.equal(altezzaInPunto([quadrato(0, 0, 10), multi], 0.5, 0.5), 30);
});

test('offsetIcona: 0 in 2D, sale con altezza, zoom e inclinazione, mai oltre il tetto di 90 m', () => {
  assert.equal(offsetIcona(20, 0, 17.5, 38.1)[1] + 0, 0);
  assert.ok(offsetIcona(20, 55, 17.5, 38.1)[1] < offsetIcona(10, 55, 17.5, 38.1)[1]);
  assert.ok(offsetIcona(20, 55, 18, 38.1)[1] < offsetIcona(20, 55, 17, 38.1)[1]);
  assert.deepEqual(offsetIcona(500, 55, 17, 38), offsetIcona(90, 55, 17, 38));
  assert.equal(offsetIcona(20, 55, 17.5, 38.1)[0], 0);
});
