import test from 'node:test';
import assert from 'node:assert/strict';
import { condivisibili } from '../../js/core/condivisione-esterni.js';

const wms = { id: 'rndt-1', tipo: 'wms', nome: 'A', visibile: true, sorgente: { url: 'https://s.it/wms', layers: 'x', version: '1.3.0' } };
const tile = { id: 'miei-2', tipo: 'tile', nome: 'B', visibile: false, sorgente: { url: 'https://t.it/{z}/{x}/{y}.png' } };
const geoUrl = { id: 'miei-3', tipo: 'geojson', nome: 'C', visibile: true, sorgente: { url: 'https://g.it/a.geojson' } };
const geoLocale = { id: 'miei-4', tipo: 'geojson', nome: 'D', visibile: true, sorgente: { dati: true } };
const conChiave = { id: 'rndt-5', tipo: 'wms', nome: 'E', visibile: true, sorgente: { url: 'https://s.it/wms?token=abc', layers: 'x' } };
const conUtente = { id: 'rndt-6', tipo: 'wms', nome: 'F', visibile: true, sorgente: { url: 'https://me:pw@s.it/wms', layers: 'x' } };

test('tiene i layer raggiungibili per indirizzo e scarta file locali e credenziali', () => {
  const r = condivisibili('dt:rndt:v1', { v: 1, layers: [wms, tile, geoUrl, geoLocale, conChiave, conUtente] });
  assert.deepEqual(r.valore.layers.map(l => l.id), ['rndt-1', 'miei-2', 'miei-3']);
  assert.equal(r.scartati, 3);
});

test('nessun layer condivisibile → valore null', () => {
  assert.deepEqual(condivisibili('dt:miei:v1', { v: 1, layers: [geoLocale] }), { valore: null, scartati: 1 });
  assert.deepEqual(condivisibili('dt:miei:v1', { v: 1, layers: [] }), { valore: null, scartati: 0 });
});

test('servizi: via utente e servizi che richiedono token', () => {
  const s = (id, extra, url = 'https://s.it/x') => ({ id, tipo: 'wms', nome: id, url, voci: [], ...extra });
  const r = condivisibili('dt:miei:servizi:v1', { v: 1, servizi: [s('a', {}), s('b', { utente: 'mario' }), s('c', { conToken: true }), s('d', {}, 'https://u:p@s.it/x')] });
  assert.deepEqual(r.valore.servizi.map(x => x.id), ['a']);
  assert.equal(r.scartati, 3);
});

test('forma inattesa o altra chiave: nessuna eccezione', () => {
  assert.deepEqual(condivisibili('dt:rndt:v1', 'testo'), { valore: null, scartati: 0 });
  assert.deepEqual(condivisibili('dt:rndt:v1', { v: 1, layers: [null, 5, { id: 1 }] }).valore, null);
  assert.deepEqual(condivisibili('dt-ordine-strati', { g: ['a'] }), { valore: { g: ['a'] }, scartati: 0 });
});
