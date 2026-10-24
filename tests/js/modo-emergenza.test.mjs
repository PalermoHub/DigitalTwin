import test from 'node:test';
import assert from 'node:assert/strict';
import { modoAttivo, moduliAlClic, STRATO_EMERGENZA } from '../../js/core/modo-emergenza.js';

test('modoAttivo: serve telefono, strato acceso e non uscito a mano', () => {
  assert.equal(modoAttivo({ telefono: true, stratoAcceso: true, uscito: false }), true);
  assert.equal(modoAttivo({ telefono: false, stratoAcceso: true, uscito: false }), false);
  assert.equal(modoAttivo({ telefono: true, stratoAcceso: false, uscito: false }), false);
  assert.equal(modoAttivo({ telefono: true, stratoAcceso: true, uscito: true }), false);
});

test('moduliAlClic: in emergenza resta solo il Piano di emergenza, altrimenti tutti', () => {
  const moduli = [{ id: 'monumenti' }, { id: STRATO_EMERGENZA }, { id: 'scuole' }];
  assert.deepEqual(moduliAlClic(moduli, true), [{ id: STRATO_EMERGENZA }]);
  assert.equal(moduliAlClic(moduli, false), moduli);
});

test('mini-mappa aree: zoom in base alla superficie e filtro sull\'id delle aree cliccate', async () => {
  const { zoomPerSuperficie, filtroEvidenza } = await import('../../js/layers/scheda-protezione-civile.js');
  assert.ok(zoomPerSuperficie(500) > zoomPerSuperficie(50000));
  assert.ok(zoomPerSuperficie(1e9) >= 13.5 && zoomPerSuperficie(1) <= 16);
  assert.equal(zoomPerSuperficie(NaN), 14.8);
  assert.deepEqual(filtroEvidenza([12]), ['in', ['get', 'id'], ['literal', [12]]]);
});
