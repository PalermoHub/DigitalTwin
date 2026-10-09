import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaStrati, stratoLinea } from '../../js/layers/trasporto-strati.js';

const strati = creaStrati(() => {});

test('gli strati del trasporto sono divisi in AMAT e RFI, in quest\'ordine', () => {
  assert.deepEqual([...new Set(strati.map(s => s.sezione))], ['AMAT', 'RFI']);
  assert.deepEqual(strati.filter(s => s.sezione === 'AMAT').map(s => s.id), ['trasporto-bus', 'trasporto-tram', 'trasporto-fermate']);
  assert.deepEqual(strati.filter(s => s.sezione === 'RFI').map(s => s.id), ['trasporto-metro', 'trasporto-stazioni']);
});

test('tutti gli strati partono spenti e ognuno governa il proprio layer', () => {
  for (const s of strati) {
    assert.equal(s.attivo, false);
    assert.deepEqual(s.layers, [s.id]);
  }
});

test('il callback di cambio è passato a ogni strato', () => {
  const chiamate = [];
  for (const s of creaStrati(v => chiamate.push(v))) s.suCambio(true);
  assert.equal(chiamate.length, 5);
});

test('stratoLinea: bus, tram e ferrovia hanno ciascuno il proprio strato', () => {
  assert.equal(stratoLinea('bus'), 'trasporto-bus');
  assert.equal(stratoLinea('tram'), 'trasporto-tram');
  assert.equal(stratoLinea('ferrovia'), 'trasporto-metro');
  assert.equal(stratoLinea(undefined), 'trasporto-bus');
});
