globalThis.window ??= { matchMedia: () => ({ matches: false }) };
import test from 'node:test';
import assert from 'node:assert/strict';
const { dentroLimiti } = await import('../../js/core/geolocalizzazione.js');

test('dentroLimiti: Palermo sì, Roma no', () => {
  assert.equal(dentroLimiti(38.116, 13.361), true);
  assert.equal(dentroLimiti(41.9, 12.5), false);
});
