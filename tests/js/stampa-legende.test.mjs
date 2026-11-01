import test from 'node:test';
import assert from 'node:assert/strict';
import { altezzaBlocco, colonneLegende, limitaVoci } from '../../js/core/stampa-legende.js';

const voci = n => Array.from({ length: n }, (_, i) => ({ testo: `voce ${i}`, simbolo: null }));
const blocco = (n, titolo = 'Layer') => ({ titolo, voci: voci(n) });

test('limitaVoci: sotto il massimo non cambia nulla', () => assert.equal(limitaVoci(voci(5), 14).length, 5));
test('limitaVoci: oltre il massimo chiude con «… e altre N voci»', () => {
  const r = limitaVoci(voci(20), 14);
  assert.equal(r.length, 14);
  assert.equal(r.at(-1).testo, '… e altre 7 voci');
});
test('colonneLegende: tutto in una colonna se ci sta', () => {
  const { colonne, omessi } = colonneLegende([blocco(3), blocco(3)], 100, 3);
  assert.equal(colonne.length, 1); assert.equal(omessi, 0);
});
test('colonneLegende: passa alla colonna successiva quando la prima è piena', () => {
  const h = altezzaBlocco(blocco(6));
  const { colonne, omessi } = colonneLegende([blocco(6), blocco(6), blocco(6)], h * 1.5, 3);
  assert.equal(colonne.length, 3); assert.equal(omessi, 0);
});
test('colonneLegende: oltre le colonne disponibili i blocchi si contano come omessi', () => {
  const h = altezzaBlocco(blocco(6));
  const { colonne, omessi } = colonneLegende([blocco(6), blocco(6), blocco(6)], h * 1.2, 2);
  assert.equal(colonne.length, 2); assert.equal(omessi, 1);
});
test('colonneLegende: un blocco più alto della colonna si accorcia e non esce mai', () => {
  const { colonne } = colonneLegende([blocco(40)], 12, 1);
  assert.ok(altezzaBlocco(colonne[0][0]) <= 12);
});
test('colonneLegende: senza blocchi nessuna colonna', () => assert.deepEqual(colonneLegende([], 50, 3), { colonne: [], omessi: 0 }));
