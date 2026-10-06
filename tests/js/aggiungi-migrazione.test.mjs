// tests/js/aggiungi-migrazione.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { migraFileLocali } from '../../js/aggiungi/migrazione.js';
import { leggi, salva, CHIAVE, CHIAVE_MIEI } from '../../js/rndt/archivio.js';

const finto = (rifiuta = []) => {
  const m = new Map();
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { if (rifiuta.includes(k)) throw new Error('pieno'); m.set(k, v); } };
};
const file = { id: 'rndt-f1', tipo: 'geojson', nome: 'Mio file', visibile: true, sorgente: { dati: true } };
const fileVecchio = { id: 'rndt-f2', tipo: 'geojson', nome: 'Vecchio', visibile: true, sorgente: { dati: { type: 'FeatureCollection', features: [] } } };
const wfs = { id: 'rndt-w', tipo: 'geojson', nome: 'WFS catalogo', visibile: true, sorgente: { url: 'https://a.it/wfs?bbox=1' } };
const wms = { id: 'rndt-m', tipo: 'wms', nome: 'WMS', visibile: true, sorgente: { url: 'https://a.it/ows', layers: 'x' } };
const prepara = (s, layers) => salva(s, { v: 1, layers }, CHIAVE);

test('sposta solo i file dal computer (anche nel vecchio formato) e lascia il catalogo', () => {
  const s = finto();
  prepara(s, [file, wfs, fileVecchio, wms]);
  assert.equal(migraFileLocali(s), 2);
  assert.deepEqual(leggi(s, CHIAVE).layers.map(l => l.id), ['rndt-w', 'rndt-m']);
  assert.deepEqual(leggi(s, CHIAVE_MIEI).layers.map(l => l.id).sort(), ['rndt-f1', 'rndt-f2']);
});

test('è idempotente: la seconda volta non c’è più nulla da spostare', () => {
  const s = finto();
  prepara(s, [file]);
  assert.equal(migraFileLocali(s), 1);
  assert.equal(migraFileLocali(s), 0);
  assert.equal(leggi(s, CHIAVE_MIEI).layers.length, 1);
});

test('non duplica un file già presente tra i «miei»', () => {
  const s = finto();
  prepara(s, [file]);
  salva(s, { v: 1, layers: [file] }, CHIAVE_MIEI);
  migraFileLocali(s);
  assert.equal(leggi(s, CHIAVE_MIEI).layers.length, 1);
});

test('se la scrittura del catalogo fallisce si torna indietro: niente persi, niente doppi', () => {
  const s = finto();
  prepara(s, [file, wms]);
  s.m.set(CHIAVE_MIEI, JSON.stringify({ v: 1, layers: [] }));
  const bloccato = finto([CHIAVE]);
  for (const [k, v] of s.m) bloccato.m.set(k, v);
  assert.equal(migraFileLocali(bloccato), 0);
  assert.deepEqual(leggi(bloccato, CHIAVE).layers.map(l => l.id), ['rndt-f1', 'rndt-m']);
  assert.deepEqual(leggi(bloccato, CHIAVE_MIEI).layers, []);
});

test('se non si riesce a scrivere i «miei» non si tocca nulla; storage assente o corrotto → 0', () => {
  const s = finto([CHIAVE_MIEI]);
  prepara(s, [file]);
  assert.equal(migraFileLocali(s), 0);
  assert.deepEqual(leggi(s, CHIAVE).layers.map(l => l.id), ['rndt-f1']);
  assert.equal(migraFileLocali(null), 0);
  const c = finto();
  c.m.set(CHIAVE, '{rotto');
  assert.equal(migraFileLocali(c), 0);
});
