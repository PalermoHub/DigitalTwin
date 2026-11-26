import test from 'node:test';
import assert from 'node:assert/strict';
import { ancoraTooltip } from '../../js/core/tooltip.js';

const area = { width: 1000, height: 600 }, senza = { top: 0, right: 0, bottom: 0, left: 0 };

test('tooltip: in basso a destra degli assi del mirino, alla stessa distanza dai due', () => {
  assert.deepEqual(ancoraTooltip({ x: 400, y: 200 }, area, senza), { anchor: 'top-left', offset: [14, 14] });
});

test('tooltip: vicino al bordo o al pannello passa dall\'altra parte dell\'asse', () => {
  assert.deepEqual(ancoraTooltip({ x: 900, y: 200 }, area, senza), { anchor: 'top-right', offset: [-14, 14] });
  assert.deepEqual(ancoraTooltip({ x: 400, y: 200 }, area, { ...senza, right: 400 }), { anchor: 'top-right', offset: [-14, 14] });
  assert.deepEqual(ancoraTooltip({ x: 400, y: 550 }, area, senza), { anchor: 'bottom-left', offset: [14, -14] });
  assert.deepEqual(ancoraTooltip({ x: 900, y: 550 }, area, senza), { anchor: 'bottom-right', offset: [-14, -14] });
});
