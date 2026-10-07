import test from 'node:test';
import assert from 'node:assert/strict';
import { attribuzioniUniche, orientamento } from '../../js/core/stampa.js';

test('attribuzioniUniche toglie spazi, vuoti e duplicati mantenendo l\'ordine', () => {
  assert.deepEqual(attribuzioniUniche(['  © OSM ', '', 'Comune di Palermo', '© OSM', null]), ['© OSM', 'Comune di Palermo']);
  assert.deepEqual(attribuzioniUniche([]), []);
});

test('orientamento segue le proporzioni della mappa', () => {
  assert.equal(orientamento(1440, 800), 'landscape');
  assert.equal(orientamento(390, 700), 'portrait');
  assert.equal(orientamento(500, 500), 'landscape');
});

import { zoomPerScala, scalaDaZoom, barraScala, mmInPx } from '../../js/core/stampa.js';

test('mmInPx converte i millimetri in pixel CSS a 96 dpi', () => {
  assert.equal(Math.round(mmInPx(25.4)), 96);
});

test('zoomPerScala e scalaDaZoom sono inversi e crescono con il dettaglio', () => {
  const lat = 38.12;
  for (const n of [1000, 5000, 25000]) assert.ok(Math.abs(scalaDaZoom(zoomPerScala(lat, n), lat) - n) < 1);
  assert.ok(zoomPerScala(lat, 1000) > zoomPerScala(lat, 5000));
  // 1:5000 a Palermo: ~1,32 m per pixel CSS → zoom attorno a 16
  assert.ok(Math.abs(zoomPerScala(lat, 5000) - 15.8) < 0.3);
});

test('barraScala sceglie una lunghezza tonda che sta nello spazio e la misura in mm di carta', () => {
  const b = barraScala(5000, 60);
  assert.equal(b.metri, 250); // 250 m a 1:5000 = 50 mm
  assert.ok(Math.abs(b.mm - 50) < 1e-9);
  assert.equal(b.etichetta, '250 m');
  assert.equal(barraScala(25000, 60).etichetta, '1 km');
  assert.equal(barraScala(10000, 60).etichetta, '500 m');
});

import { areaMappaMm, pixelRatioPerFormato, FORMATI } from '../../js/core/stampa.js';

test('areaMappaMm toglie margini e fascia di titolo/legenda: A4 orizzontale = 277×125 mm', () => {
  assert.deepEqual(areaMappaMm('A4', 'landscape'), { larghezza: 277, altezza: 125 });
  assert.deepEqual(areaMappaMm('A4', 'portrait'), { larghezza: 190, altezza: 212 });
  assert.deepEqual(areaMappaMm('A0', 'landscape'), { larghezza: 1169, altezza: 756 });
  assert.deepEqual(Object.keys(FORMATI), ['A4', 'A3', 'A2', 'A1', 'A0']);
});

test('pixelRatioPerFormato: 192 dpi da A4 ad A1, 96 dpi solo per A0 (canvas troppo grande)', () => {
  assert.deepEqual(['A4', 'A3', 'A2', 'A1', 'A0'].map(pixelRatioPerFormato), [2, 2, 2, 2, 1]);
});

import { pixelRatioSicuro } from '../../js/core/stampa.js';

test('pixelRatioSicuro abbassa la risoluzione se il canvas supera il limite della GPU', () => {
  const area = { larghezza: 821, altezza: 504 }; // A1 orizzontale: ~3103 × 1905 px
  assert.equal(pixelRatioSicuro(2, area, 16384), 2);
  assert.ok(pixelRatioSicuro(2, area, 4096) < 2);
  assert.ok(mmInPx(821) * pixelRatioSicuro(2, area, 4096) <= 4096 + 1e-6); // il lato maggiore sta nel limite
  assert.equal(pixelRatioSicuro(1, { larghezza: 1169, altezza: 756 }, 2000), 1); // mai sotto 1: si tenta comunque
});
