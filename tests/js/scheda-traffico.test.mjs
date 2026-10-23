import test from 'node:test';
import assert from 'node:assert/strict';
import { statoFlusso, modelloPopupFlusso, STATI, CHIUSA } from '../../js/layers/scheda-traffico.js';

const s = (velocita, velocitaLibera, extra = {}) => ({ velocita, velocitaLibera, tempo: 132, tempoLibero: 84, confidenza: 0.94, chiusa: false, ...extra });

test('statoFlusso: soglie sul rapporto velocità attuale / senza traffico', () => {
  assert.equal(statoFlusso(s(40, 50)).nome, 'Scorrevole'); // 0,8
  assert.equal(statoFlusso(s(30, 50)).nome, 'Rallentato'); // 0,6
  assert.equal(statoFlusso(s(15, 50)).nome, 'Intenso'); // 0,3
  assert.equal(statoFlusso(s(5, 50)).nome, 'Quasi fermo');
  assert.equal(statoFlusso(s(0, 0)).nome, 'Scorrevole'); // senza velocità libera non si dice che c'è traffico
});

test('statoFlusso: strada chiusa vince sul rapporto', () => {
  assert.equal(statoFlusso(s(50, 50, { chiusa: true })), CHIUSA);
});

test('gli stati sono in ordine decrescente di soglia, con ultimo a 0', () => {
  assert.deepEqual(STATI.map(x => x.da), [...STATI.map(x => x.da)].sort((a, b) => b - a));
  assert.equal(STATI.at(-1).da, 0);
});

test('modelloPopupFlusso: velocità, ritardo e affidabilità', () => {
  const m = modelloPopupFlusso(s(21, 33));
  const val = etichetta => m.righe.find(r => r.etichetta === etichetta)?.valore;
  assert.equal(m.titolo, 'Rallentato');
  assert.equal(val('Velocità attuale'), '21 km/h');
  assert.equal(val('Velocità senza traffico'), '33 km/h');
  assert.equal(val('Ritardo sul tratto'), '+48 s');
  assert.equal(val('Affidabilità'), '94%');
});

test('modelloPopupFlusso: ritardo piccolo omesso, strada chiusa senza velocità attuale', () => {
  const lieve = modelloPopupFlusso(s(30, 31, { tempo: 90, tempoLibero: 85 }));
  assert.equal(lieve.righe.find(r => r.etichetta === 'Ritardo sul tratto'), undefined);
  const chiusa = modelloPopupFlusso(s(0, 40, { chiusa: true }));
  assert.equal(chiusa.titolo, 'Strada chiusa');
  assert.equal(chiusa.righe.find(r => r.etichetta === 'Velocità attuale'), undefined);
});

test('ritardo lungo in minuti', () => {
  const m = modelloPopupFlusso(s(5, 40, { tempo: 400, tempoLibero: 60 }));
  assert.equal(m.righe.find(r => r.etichetta === 'Ritardo sul tratto').valore, '+6 min');
});
