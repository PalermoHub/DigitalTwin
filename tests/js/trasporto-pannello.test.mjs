import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaStrati, stratoLinea } from '../../js/layers/trasporto-strati.js';

const strati = creaStrati(() => {});

test('gli strati del trasporto sono divisi in AMAT e RFI, in quest\'ordine', () => {
  assert.deepEqual([...new Set(strati.map(s => s.sezione))], ['AMAT', 'RFI']);
  assert.deepEqual(strati.filter(s => s.sezione === 'AMAT').map(s => s.id), ['trasporto-bus', 'trasporto-tram', 'trasporto-fermate']);
  assert.deepEqual(strati.filter(s => s.sezione === 'RFI').map(s => s.id), ['trasporto-metro', 'trasporto-stazioni']);
});

test('le etichette: AMAT «Linee bus», «Linee tram», «Fermate»; RFI «Linea metro», «Stazioni metro»', () => {
  assert.deepEqual(strati.map(s => s.etichetta), ['Linee bus', 'Linee tram', 'Fermate', 'Linea metro', 'Stazioni metro']);
});

test('tutti gli strati partono spenti e ognuno governa il proprio layer', () => {
  for (const s of strati) assert.equal(s.attivo, false);
  for (const s of strati.filter(x => x.id !== 'trasporto-metro')) assert.deepEqual(s.layers, [s.id]);
});

test('la linea metro è un binario: un layer nero e uno di trattini bianchi, accesi insieme', () => {
  assert.deepEqual(strati.find(s => s.id === 'trasporto-metro').layers, ['trasporto-metro', 'trasporto-metro-tratti']);
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
