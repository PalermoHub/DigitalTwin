import test from 'node:test';
import assert from 'node:assert/strict';


test('inverti: la rampa si legge dal fondo e si conserva nella validazione', async () => {
  const { coloriRampa, validaAttributo, espressioneAttributo } = await import('../../js/core/tema-attributo.js');
  assert.deepEqual(coloriRampa('Blu', 3, true), [...coloriRampa('Blu', 3)].reverse());
  const a = { campo: 'x', tipo: 'graduata', rampa: 'Blu', soglie: [1, 2] };
  assert.equal(validaAttributo(a).inverti, undefined);
  assert.equal(validaAttributo({ ...a, inverti: true }).inverti, true);
  assert.notDeepEqual(espressioneAttributo({ ...a, inverti: true }), espressioneAttributo(a));
});
