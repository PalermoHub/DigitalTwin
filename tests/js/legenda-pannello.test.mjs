import test from 'node:test';
import assert from 'node:assert/strict';
import { raccogliLegende, stratoDellaLegenda, legendaAperta, SOGLIA_VOCI } from '../../js/core/legenda-pannello.js';

test('raccogliLegende: la legenda del modulo vale per tutti i suoi strati', () => {
  const moduli = [{ legendaPannello: '.a', strati: [{ id: 'x' }, { id: 'y' }] }, { strati: [{ id: 'z' }] }];
  assert.deepEqual(raccogliLegende(moduli), [{ selettore: '.a', strati: ['x', 'y'] }]);
});

test('raccogliLegende: la legenda dello strato prevale su quella del modulo, e uno strato può avere la sua da solo', () => {
  const moduli = [{ strati: [{ id: 'omi', legendaPannello: '.omi' }, { id: 'prg' }, { id: 'catasto', legendaPannello: '.cat' }] }];
  assert.deepEqual(raccogliLegende(moduli), [{ selettore: '.omi', strati: ['omi'] }, { selettore: '.cat', strati: ['catasto'] }]);
});

test('raccogliLegende: moduli senza strati o senza legenda non producono nulla', () => {
  assert.deepEqual(raccogliLegende([{ strati: [] }, {}]), []);
});

test('stratoDellaLegenda: sotto il primo strato acceso, null se nessuno', () => {
  const accesi = new Set(['b', 'c']);
  assert.equal(stratoDellaLegenda(['a', 'b', 'c'], id => accesi.has(id)), 'b');
  assert.equal(stratoDellaLegenda(['a'], id => accesi.has(id)), null);
});

test('legendaAperta: ripiegata solo oltre la soglia', () => {
  assert.equal(legendaAperta(SOGLIA_VOCI), true);
  assert.equal(legendaAperta(SOGLIA_VOCI + 1), false);
});

test('raccogliLegende: con legendaPerStrato ogni strato ha la sua parte di legenda', () => {
  const moduli = [{ legendaPerStrato: true, strati: [{ id: 'p1' }, { id: 'p2' }] }];
  assert.deepEqual(raccogliLegende(moduli), [
    { selettore: '[data-legenda-strato="p1"]', strati: ['p1'] },
    { selettore: '[data-legenda-strato="p2"]', strati: ['p2'] },
  ]);
});
