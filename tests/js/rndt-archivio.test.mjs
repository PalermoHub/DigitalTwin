// tests/js/rndt-archivio.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHIAVE, leggi, salva, aggiungi, rimuovi, aggiorna } from '../../js/rndt/archivio.js';

const finto = (iniziale = {}) => {
  const dati = new Map(Object.entries(iniziale));
  return { getItem: k => dati.get(k) ?? null, setItem: (k, v) => { dati.set(k, v); }, dati };
};
const wms = { id: 'rndt-a', tipo: 'wms', nome: 'PAI', visibile: true, sorgente: { url: 'https://x.it/ows', layers: 'a' } };

test('senza storage o senza dati la lettura dà uno stato vuoto', () => {
  assert.deepEqual(leggi(null), { v: 1, layers: [] });
  assert.deepEqual(leggi(finto()), { v: 1, layers: [] });
});

test('salva e rilegge', () => {
  const s = finto();
  assert.equal(salva(s, aggiungi({ v: 1, layers: [] }, wms)), true);
  assert.deepEqual(leggi(s).layers, [wms]);
});

test('JSON rotto, versione diversa o layer non validi non rompono la lettura', () => {
  assert.deepEqual(leggi(finto({ [CHIAVE]: '{rotto' })), { v: 1, layers: [] });
  assert.deepEqual(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 2, layers: [wms] }) })), { v: 1, layers: [] });
  const misto = JSON.stringify({ v: 1, layers: [wms, { id: 'x', tipo: 'boh' }, null, { tipo: 'wms' }] });
  assert.deepEqual(leggi(finto({ [CHIAVE]: misto })).layers, [wms]);
});

test('storage bloccato o pieno: salva dà false e non lancia', () => {
  assert.equal(salva(null, { v: 1, layers: [] }), false);
  const pieno = { getItem: () => null, setItem: () => { throw new DOMException('piena', 'QuotaExceededError'); } };
  assert.equal(salva(pieno, { v: 1, layers: [] }), false);
});

test('aggiungi sostituisce lo stesso id, rimuovi e aggiorna lavorano per id', () => {
  let s = aggiungi({ v: 1, layers: [] }, wms);
  s = aggiungi(s, { ...wms, nome: 'PAI nuovo' });
  assert.equal(s.layers.length, 1);
  assert.equal(s.layers[0].nome, 'PAI nuovo');
  s = aggiorna(s, 'rndt-a', { visibile: false });
  assert.equal(s.layers[0].visibile, false);
  assert.deepEqual(rimuovi(s, 'rndt-a').layers, []);
});

test('un GeoJSON si legge se ha URL, dati nell’archivio dati o dati inline (vecchio formato); altrimenti si scarta', () => {
  const g = (id, sorgente) => ({ id, tipo: 'geojson', nome: id, visibile: true, sorgente });
  const dati = { type: 'FeatureCollection', features: [] };
  const stato = { v: 1, layers: [g('a', { url: 'https://x.it/a' }), g('b', { dati }), g('c', {}), g('d', { dati: { type: 'Feature' } }), g('e', { dati: true })] };
  assert.deepEqual(leggi(finto({ [CHIAVE]: JSON.stringify(stato) })).layers.map(l => l.id), ['a', 'b', 'e']);
});
