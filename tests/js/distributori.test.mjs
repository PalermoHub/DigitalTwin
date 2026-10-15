import test from 'node:test';
import assert from 'node:assert/strict';
import { voceDistributore, modelloPopupDistributore } from '../../js/layers/scheda-distributori.js';

const P = {
  id: '54872', bandiera: 'Agip Eni', gestore: 'G P S.R.L.', indirizzo: 'RESURREZIONE 87 90146', marchio: 'Agip Eni',
  prezzi: [['Benzina', 0, 2.388, '14/10/2026 07:12:55'], ['Benzina', 1, 1.988, '14/10/2026 07:12:55'], ['Gasolio', 1, 2.19, '14/10/2026 07:12:55'],
    ['HVOlution', 0, 2.29, '14/10/2026 07:12:55'], ['HVOlution', 1, 2.19, '14/10/2026 07:12:55']],
  prezzi_del: '14/10/2026 07:12:55',
};
const riga = (v, k) => v.gruppi[0].righe.find(r => r.etichetta === k)?.valore;

test('voce nel tab «Servizi su strada» (peso 90), titolo la bandiera, strato distributori', () => {
  const v = voceDistributore(P);
  assert.equal(v.peso, 90);
  assert.equal(v.strato, 'distributori');
  assert.equal(v.titolo, 'Agip Eni');
  assert.equal(v.chiave, 'distributore-54872');
  assert.match(v.fonte, /MIMIT/);
});

test('prezzi: self e servito per carburante, 3 decimali; carburanti non venduti senza riga', () => {
  const v = voceDistributore(P);
  assert.equal(riga(v, 'Benzina'), '1,988 € self · 2,388 € servito');
  assert.equal(riga(v, 'Gasolio'), '2,190 € self');
  assert.equal(riga(v, 'GPL'), undefined);
  assert.equal(riga(v, 'Metano'), undefined);
});

test('altri carburanti col prezzo più basso; data dei prezzi', () => {
  const v = voceDistributore(P);
  assert.equal(riga(v, 'Altri carburanti'), 'HVOlution 2,190 €');
  assert.equal(riga(v, 'Prezzi del'), '14/10/2026');
});

test('impianto senza prezzi: restano gestore e indirizzo', () => {
  const v = voceDistributore({ id: '1', bandiera: 'Esso', gestore: 'X', indirizzo: 'Via Y', prezzi: [] });
  assert.deepEqual(v.gruppi[0].righe.map(r => r.etichetta), ['Gestore', 'Indirizzo']);
});

test('popup: bandiera, indirizzo, solo prezzi', () => {
  const m = modelloPopupDistributore(P);
  assert.equal(m.titolo, 'Agip Eni');
  assert.equal(m.sottotitolo, 'RESURREZIONE 87 90146');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Benzina', 'Gasolio', 'Prezzi del']);
});

test('senza bandiera il titolo è il gestore', () => {
  assert.equal(modelloPopupDistributore({ id: '2', gestore: 'Rossi', prezzi: [] }).titolo, 'Rossi');
});
