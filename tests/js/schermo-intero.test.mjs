import test from 'node:test';
import assert from 'node:assert/strict';
import { collegaSchermoInteroMobile } from '../../js/core/schermo-intero.js';

function scenario({ telefono = true, abilitato = true } = {}) {
  const chiamate = { richieste: 0 };
  const ascolti = {};
  const doc = { fullscreenEnabled: abilitato, fullscreenElement: null, documentElement: { requestFullscreen: () => { chiamate.richieste++; return Promise.resolve(); } } };
  const win = { matchMedia: () => ({ matches: telefono }), addEventListener: (t, f) => { ascolti[t] = f; }, removeEventListener: t => { delete ascolti[t]; } };
  return { doc, win, ascolti, chiamate };
}

test('da telefono entra in schermo intero al primo tocco, una volta sola', () => {
  const s = scenario();
  assert.ok(collegaSchermoInteroMobile(s.doc, s.win));
  assert.equal(s.chiamate.richieste, 0);
  s.ascolti.pointerup();
  assert.equal(s.chiamate.richieste, 1);
  assert.equal(s.ascolti.pointerup, undefined);
});

test('su desktop o dove lo schermo intero non esiste non fa nulla', () => {
  const d = scenario({ telefono: false });
  assert.equal(collegaSchermoInteroMobile(d.doc, d.win), null);
  const i = scenario({ abilitato: false });
  assert.equal(collegaSchermoInteroMobile(i.doc, i.win), null);
  assert.equal(i.ascolti.pointerup, undefined);
});
