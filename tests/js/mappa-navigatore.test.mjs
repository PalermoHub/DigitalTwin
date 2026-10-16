import test from 'node:test';
import assert from 'node:assert/strict';
import { passoNavigatore, assiDaTastiMappa, PITCH_MAX } from '../../js/core/mappa-navigatore.js';

const nulli = { avanti: 0, lato: 0, gira: 0, inclina: 0, zoom: 0 };
const vista = { pitch: 55, zoom: 14, bearing: 0, zoomMin: 9, zoomMax: 19 };

test('senza assi non cambia nulla', () => {
  assert.equal(passoNavigatore(nulli, 0.016, vista), null);
});

test('joystick avanti sposta la mappa verso l\'alto sullo schermo, a destra verso destra', () => {
  const p = passoNavigatore({ ...nulli, avanti: 1, lato: 1 }, 0.1, vista);
  assert.ok(p.dy < 0 && p.dx > 0);
});

test('l\'inclinazione resta tra 0 e PITCH_MAX', () => {
  assert.equal(passoNavigatore({ ...nulli, inclina: 1 }, 10, vista).pitch, PITCH_MAX);
  assert.equal(passoNavigatore({ ...nulli, inclina: -1 }, 10, vista).pitch, 0);
});

test('lo zoom resta nei limiti della mappa', () => {
  assert.equal(passoNavigatore({ ...nulli, zoom: 1 }, 10, vista).zoom, 19);
  assert.equal(passoNavigatore({ ...nulli, zoom: -1 }, 10, vista).zoom, 9);
});

test('gira cambia il bearing', () => {
  assert.ok(passoNavigatore({ ...nulli, gira: 1 }, 0.1, vista).bearing > 0);
});

test('tasti: W/A/S/D spostano, Q/E girano, R/F inclinano; le frecce non contano (le gestisce già MapLibre)', () => {
  const a = assiDaTastiMappa(new Set(['KeyW', 'KeyD']));
  assert.deepEqual([a.avanti, a.lato], [1, 1]);
  assert.equal(assiDaTastiMappa(new Set(['KeyQ'])).gira, -1);
  assert.equal(assiDaTastiMappa(new Set(['KeyR'])).inclina, 1);
  assert.deepEqual(assiDaTastiMappa(new Set(['ArrowUp'])), nulli);
});
