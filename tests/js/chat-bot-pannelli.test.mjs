import test from 'node:test';
import assert from 'node:assert/strict';
import { tabPannello, apriPannello } from '../../js/core/chat-bot-pannelli.js';

function docFinto(tabs) {
  const mappa = new Map(Object.entries(tabs).map(([s, attrs]) => [s, { clic: 0, getAttribute: a => attrs[a] ?? null, title: attrs.title, click() { this.clic++; } }]));
  return { querySelector: s => mappa.get(s) ?? null, mappa };
}
const SX = '#btn-gruppo-rndt';
const DX = '#rail-pannelli .rail-tab[data-pannello="rndt"]';

test('tabPannello: nome dal tab e lato; tab assente -> null', () => {
  const d = docFinto({ [SX]: { 'aria-label': 'RNDT' } });
  assert.deepEqual(tabPannello(d, 'sinistra:rndt'), { lato: 'sinistra', nome: 'RNDT' });
  assert.equal(tabPannello(d, 'destra:rndt'), null);
  assert.equal(tabPannello(d, 'sopra:rndt'), null);
});
test('apriPannello: clicca il tab chiuso, non quello già aperto', () => {
  const d = docFinto({ [SX]: { 'aria-expanded': 'false' }, [DX]: { 'aria-pressed': 'true' } });
  assert.equal(apriPannello(d, 'sinistra:rndt'), true);
  assert.equal(d.mappa.get(SX).clic, 1);
  assert.equal(apriPannello(d, 'destra:rndt'), true);
  assert.equal(d.mappa.get(DX).clic, 0);
});
test('apriPannello: tab assente -> false', () => {
  assert.equal(apriPannello(docFinto({}), 'sinistra:rndt'), false);
});

test('telefono: i tab di sinistra non ci sono, quelli di destra si aprono dal pulsante del foglio «Aggiungi»', () => {
  const d = docFinto({ [SX]: { 'aria-expanded': 'false' }, [DX]: { 'aria-label': 'RNDT', 'aria-pressed': 'false' }, '#btn-rndt-m': {} });
  assert.equal(tabPannello(d, 'sinistra:rndt', true), null);
  assert.deepEqual(tabPannello(d, 'destra:rndt', true), { lato: 'mobile', nome: 'RNDT' });
  assert.equal(apriPannello(d, 'sinistra:rndt', true), false);
  assert.equal(apriPannello(d, 'destra:rndt', true), true);
  assert.equal(d.mappa.get('#btn-rndt-m').clic, 1);
  assert.equal(d.mappa.get(DX).clic, 0);
});
test('telefono: pannello già aperto (tab di destra premuto) -> nessun clic', () => {
  const d = docFinto({ [DX]: { 'aria-pressed': 'true' }, '#btn-rndt-m': {} });
  apriPannello(d, 'destra:rndt', true);
  assert.equal(d.mappa.get('#btn-rndt-m').clic, 0);
});
