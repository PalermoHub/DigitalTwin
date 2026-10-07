import test from 'node:test';
import assert from 'node:assert/strict';
import { modelloPopupSede, voceUffici } from '../../js/layers/scheda-uffici.js';

const u = (nome, livello, area, extra = {}) => ({ nome, livello, area, settore: '', responsabile: '', telefoni: [], email: [], url: `https://x/${nome}`, ...extra });
const sede = {
  id: 'sede-1', nome: 'Palazzo X', indirizzo: 'Via Roma 1', n_uffici: 3,
  uffici: [u('U.O. Beta', 'unita', 'Area B', { responsabile: 'Mario Rossi', telefoni: ['0911'], email: ['a@b.it'] }), u('Area B', 'area', 'Area B'), u('Ufficio A', 'settore', 'Area A')],
};

test('popup: pochi dati, aree più numerose prima, senza elenco degli uffici', () => {
  const m = modelloPopupSede(sede);
  assert.equal(m.sottotitolo, '3 uffici comunali');
  assert.deepEqual(m.aree, [{ area: 'Area B', n: 2 }, { area: 'Area A', n: 1 }]);
  assert.equal(m.altreAree, 0);
});

test('popup: oltre 4 aree il resto è riassunto', () => {
  const molte = { ...sede, uffici: ['A', 'B', 'C', 'D', 'E', 'F'].map(a => u(`U ${a}`, 'unita', `Area ${a}`)) };
  const m = modelloPopupSede(molte);
  assert.equal(m.aree.length, 4);
  assert.equal(m.altreAree, 2);
});

test('scheda: righe riassuntive e uffici per area con link, responsabile e contatti', () => {
  const v = voceUffici(sede);
  assert.equal(v.chiave, 'uffici-sede-1');
  assert.equal(v.sempre, true);
  assert.deepEqual(v.gruppi[0].righe.map(r => [r.etichetta, r.valore]), [['Indirizzo', 'Via Roma 1'], ['Uffici', '3'], ['Aree', '2']]);
  const [b] = v.accordion.elementi;
  assert.equal(b.titolo, 'Area B');
  assert.deepEqual(b.righe.map(r => r.etichetta), ['Area B', 'U.O. Beta']); // l'area prima delle U.O.
  assert.equal(b.righe[1].url, 'https://x/U.O. Beta');
  assert.equal(b.righe[1].valore, 'Mario Rossi — 0911 · a@b.it');
});

test('un solo ufficio: singolare', () => {
  assert.equal(modelloPopupSede({ nome: 'S', n_uffici: 1, uffici: [sede.uffici[0]] }).sottotitolo, '1 ufficio comunale');
});
