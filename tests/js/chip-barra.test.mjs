import test from 'node:test';
import assert from 'node:assert/strict';
import { sovrapposti } from '../../js/core/chip-barra.js';

const R = (left, top, w, h) => ({ left, top, right: left + w, bottom: top + h });

test('sovrapposti: un chip sotto un\'icona della barra sì, chip accanto o più in basso no', () => {
  const icone = [R(560, 12, 32, 32), R(600, 12, 32, 32)];
  assert.equal(sovrapposti([R(100, 14, 120, 32), R(430, 14, 150, 32)], icone), true);
  assert.equal(sovrapposti([R(100, 14, 120, 32), R(230, 14, 150, 32)], icone), false);
  assert.equal(sovrapposti([R(430, 54, 150, 32)], icone), false);
});
