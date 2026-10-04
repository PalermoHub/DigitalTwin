// tests/js/scheda-ritardo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci, sezioniConRitardo } from '../../js/core/scheda-modello.js';

const indirizzo = { chiave: 'indirizzo', peso: 10, titolo: 'Indirizzo', gruppi: [{ righe: [{ etichetta: 'Via', valore: 'VIA ROMA' }] }] };
const attesa = { chiave: 'rndt:attesa', peso: 100, titolo: 'Altri dati (RNDT)', sempre: true, gruppi: [{ righe: [{ etichetta: 'Stato', valore: 'in corso' }] }] };
const risultato = { chiave: 'rndt:rndt-1:0', peso: 100, titolo: 'PAI', legale: true, gruppi: [{ righe: [{ etichetta: 'Classe', valore: 'P3' }] }] };

test('le sezioni RNDT in ritardo sostituiscono il segnaposto e le altre restano', () => {
  const dati = unisci([indirizzo, attesa]);
  const nuovi = unisci([risultato]);
  const fuso = sezioniConRitardo(dati, nuovi);
  assert.deepEqual(fuso.sezioni.map(s => s.chiave), ['indirizzo', 'rndt:rndt-1:0']);
});

test('ordina per peso e porta il flag legale', () => {
  const dati = unisci([{ ...indirizzo, peso: 200 }, attesa]);
  const fuso = sezioniConRitardo(dati, unisci([risultato]));
  assert.deepEqual(fuso.sezioni.map(s => s.peso), [100, 200]);
  assert.equal(fuso.legale, true);
  assert.equal(sezioniConRitardo(unisci([indirizzo]), unisci([])).legale, false);
});

test('senza nuove sezioni toglie solo il segnaposto', () => {
  const fuso = sezioniConRitardo(unisci([indirizzo, attesa]), unisci([]));
  assert.deepEqual(fuso.sezioni.map(s => s.chiave), ['indirizzo']);
});
