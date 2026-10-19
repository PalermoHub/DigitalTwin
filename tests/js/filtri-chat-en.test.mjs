import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { impostaDizionari } from '../../js/core/i18n.js';
import { vociNominate, daLegenda } from '../../js/core/filtri-chat.js';

// Pagina in inglese: la legenda ha già i nomi tradotti e l'utente scrive in inglese.
const carica = l => JSON.parse(readFileSync(new URL(`../../js/locales/${l}.json`, import.meta.url), 'utf8'));
impostaDizionari('en', carica('en'), carica('it'));

const riga = testo => ({ textContent: testo, _filtro: { esclusivo: true, casella: { checked: true, click() {} } }, previousElementSibling: null });
const legendaFinta = nomi => {
  const contenitore = { };
  const righe = nomi.map(n => Object.assign(riga(n), { parentElement: contenitore }));
  return { querySelectorAll: s => (s === 'label' ? righe : []) };
};
const docCon = l => ({ querySelector: () => l });

test('distributori: la legenda in inglese ("Petrol") ritrova i sinonimi scritti sul nome italiano', () => {
  const d = daLegenda(docCon(legendaFinta(['Petrol (120)', 'Diesel (118)', 'LPG (30)', 'Methane (CNG) (9)'])), 'distributori');
  assert.deepEqual(vociNominate(d, 'show only gasoline stations'), ['g0:Petrol (120)']);
  assert.deepEqual(vociNominate(d, 'which ones sell unleaded'), ['g0:Petrol (120)']);
  assert.deepEqual(vociNominate(d, 'cng pumps'), ['g0:Methane (CNG) (9)']);
});
test('opere: «transport» e «water» trovano le categorie anche con la legenda in inglese', () => {
  const d = daLegenda(docCon(legendaFinta(['Transport infrastructure (10)', 'Environment and water resources (5)'])), 'opere');
  assert.ok(vociNominate(d, 'public works about transport').includes('g0:Transport infrastructure (10)'));
});
test('un descrittore con nomi italiani (colonnine) si trova anche col nome inglese', () => {
  const colonnine = { gruppi: [{ tipo: 'stato', titolo: 'Stato', voci: [{ chiave: 'Disponibile', nome: 'Disponibile', sinonimi: ['libere', 'available'] }] }], accese: () => new Set() };
  assert.deepEqual(vociNominate(colonnine, 'only available chargers'), ['stato:Disponibile']);
  assert.deepEqual(vociNominate(colonnine, 'chargers with dc'), []);
});
test('parole inglesi comuni non nominano voci per caso', () => {
  const d = daLegenda(docCon(legendaFinta(['Telecommunications and IT (3)', 'Energy (4)'])), 'opere');
  assert.deepEqual(vociNominate(d, 'is it open on sunday'), []);
});
