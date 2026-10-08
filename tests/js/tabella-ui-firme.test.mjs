import test from 'node:test';
import assert from 'node:assert/strict';
import { firmaVista, firmaEvidenza } from '../../js/core/tabella/ui.js';

const stato = (id, chiavi, { visibili = ['a'], troppe = false, sel = [] } = {}) => ({
  sorgente: { id }, troppe, righe: chiavi.map(chiave => ({ chiave })),
  colonne: visibili.map(campo => ({ campo, visibile: true, esporta: true })), sel: { sel: new Set(sel), ultimo: null },
});
const insieme = () => [stato('x', ['1', '2']), stato('y', ['3'])];

test('firmaVista resta uguale se non cambia nulla (anche con oggetti nuovi)', () => {
  assert.equal(firmaVista(insieme(), 'x'), firmaVista(insieme(), 'x'));
});
test('firmaVista cambia con righe, scheda corrente, troppe e colonne visibili', () => {
  const base = firmaVista(insieme(), 'x');
  assert.notEqual(firmaVista(insieme(), 'y'), base);
  const altre = insieme(); altre[0].righe.push({ chiave: '9' });
  assert.notEqual(firmaVista(altre, 'x'), base);
  const troppe = insieme(); troppe[1].troppe = true;
  assert.notEqual(firmaVista(troppe, 'x'), base);
  const colonne = insieme(); colonne[0].colonne[0].visibile = false;
  assert.notEqual(firmaVista(colonne, 'x'), base);
});
test('firmaVista cambia quando cambia solo lo stato acceso/spento di un layer', () => {
  const acceso = firmaVista(insieme(), 'x', () => true);
  assert.notEqual(firmaVista(insieme(), 'x', s => s.sorgente.id !== 'y'), acceso);
});
test('firmaEvidenza dipende da layer e righe selezionate, non dalle altre', () => {
  const a = firmaEvidenza(stato('x', ['1', '2'], { sel: ['1'] }));
  assert.equal(a, firmaEvidenza(stato('x', ['1', '2'], { sel: ['1', 'fuori'] })));
  assert.notEqual(a, firmaEvidenza(stato('x', ['1', '2'], { sel: ['2'] })));
  assert.notEqual(a, firmaEvidenza(stato('y', ['1', '2'], { sel: ['1'] })));
});
