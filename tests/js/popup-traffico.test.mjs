import test from 'node:test';
import assert from 'node:assert/strict';
import { ancoraPopupTraffico } from '../../js/layers/popup-traffico.js';

const mappa = { clientWidth: 1600, clientHeight: 900 };

test('popup traffico: spazio a destra e sopra → scheda sopra, aperta a destra', () => {
  assert.deepEqual(ancoraPopupTraffico({ x: 200, y: 700 }, mappa), { anchor: 'bottom-left', offset: [0, -64] });
});

test('popup traffico: poco spazio a destra → scheda aperta a sinistra', () => {
  assert.equal(ancoraPopupTraffico({ x: 1500, y: 700 }, mappa).anchor, 'bottom-right');
});

test('popup traffico: poco spazio sopra → scheda sotto il mezzo', () => {
  assert.deepEqual(ancoraPopupTraffico({ x: 200, y: 150 }, mappa), { anchor: 'top-left', offset: [0, 64] });
  assert.equal(ancoraPopupTraffico({ x: 1500, y: 150 }, mappa).anchor, 'top-right');
});
