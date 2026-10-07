import test from 'node:test';
import assert from 'node:assert/strict';
import { creaOverlay, installaOverlay } from '../../js/core/condivisione-storage.js';

const reale = dati => ({ dati, getItem: k => dati[k] ?? null, setItem: (k, v) => { dati[k] = String(v); }, removeItem: k => { delete dati[k]; }, key: i => Object.keys(dati)[i] ?? null, get length() { return Object.keys(dati).length; }, clear: () => { for (const k of Object.keys(dati)) delete dati[k]; } });

test('le chiavi non protette passano al storage reale', () => {
  const r = reale({ 'dt.invito.no': '1' });
  const o = creaOverlay(r, {});
  assert.equal(o.getItem('dt.invito.no'), '1');
  o.setItem('altro', 'x');
  assert.equal(r.dati.altro, 'x');
});

test('le chiavi protette mostrano il valore condiviso, non quello del visitatore', () => {
  const r = reale({ 'dt-temi-strati': '{"mio":1}', 'dt-ordine-strati': '{"g":["a"]}' });
  const o = creaOverlay(r, { 'dt-temi-strati': '{"suo":1}' });
  assert.equal(o.getItem('dt-temi-strati'), '{"suo":1}');
  assert.equal(o.getItem('dt-ordine-strati'), null);
});

test('le scritture sulle chiavi protette restano in memoria e non toccano il reale', () => {
  const r = reale({ 'dt-temi-strati': '{"mio":1}', 'dt-tema': 'chiaro' });
  const o = creaOverlay(r, {});
  o.setItem('dt-temi-strati', '{"nuovo":1}');
  o.setItem('dt-tema', 'scuro');
  assert.equal(o.getItem('dt-temi-strati'), '{"nuovo":1}');
  assert.equal(o.getItem('dt-tema'), 'scuro');
  assert.deepEqual(r.dati, { 'dt-temi-strati': '{"mio":1}', 'dt-tema': 'chiaro' });
  o.removeItem('dt-temi-strati');
  assert.equal(o.getItem('dt-temi-strati'), null);
  assert.equal(r.dati['dt-temi-strati'], '{"mio":1}');
});

test('storage reale assente o che lancia: nessun errore', () => {
  const o = creaOverlay(null, { 'dt-temi-strati': '{}' });
  assert.equal(o.getItem('x'), null);
  assert.equal(o.getItem('dt-temi-strati'), '{}');
  o.setItem('x', '1'); o.removeItem('x');
  const guasto = creaOverlay({ getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } }, {});
  assert.equal(guasto.getItem('x'), null);
  guasto.setItem('x', '1'); guasto.removeItem('x');
});

test('installaOverlay sostituisce window.localStorage; se non può, lo dice', () => {
  const r = reale({});
  const w = {};
  Object.defineProperty(w, 'localStorage', { configurable: true, value: r });
  assert.equal(installaOverlay(w, { 'dt-temi-strati': '{}' }), true);
  assert.equal(w.localStorage.getItem('dt-temi-strati'), '{}');
  const bloccata = {};
  Object.defineProperty(bloccata, 'localStorage', { value: r });
  assert.equal(installaOverlay(bloccata, {}), false);
  const rifiuta = {};
  Object.defineProperty(rifiuta, 'localStorage', { configurable: true, get() { throw new Error('bloccato'); } });
  assert.equal(installaOverlay(rifiuta, {}), true);
  assert.equal(rifiuta.localStorage.getItem('qualsiasi'), null);
});
