import test from 'node:test';
import assert from 'node:assert/strict';
import { registraTooltip } from '../../js/core/tooltip.js';

test('tooltip: mentre il mouse corre non ricalcola il contenuto, lo fa una volta sola quando rallenta (niente scatti)', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const gestori = {};
  const map = { on: (e, f) => { gestori[e] = f; }, getCanvas: () => ({ style: {} }) };
  const punti = [];
  registraTooltip(map, e => { punti.push(e.point.x); return null; });
  for (let x = 1; x <= 10; x++) { gestori.mousemove({ point: { x, y: 0 } }); t.mock.timers.tick(16); }
  assert.deepEqual(punti, []);
  t.mock.timers.tick(60);
  assert.deepEqual(punti, [10]);
  gestori.mousemove({ point: { x: 11, y: 0 } });
  gestori.mouseout();
  t.mock.timers.tick(60);
  assert.deepEqual(punti, [10], 'uscito dalla mappa, il calcolo in attesa si annulla');
});
