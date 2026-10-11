import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTA, riepilogo, classifica, saldoPerComune, quota, voceScheda, modelloTooltipPendolarismo, COLORE_ENTRATA, COLORE_USCITA } from '../../js/layers/scheda-pendolarismo.js';

const nodi = [
  { tipo: 'palermo', nome: 'Palermo', codice: '082053', interni: 1000, entrata: 1000, uscita: 1000, saldo: 0 },
  { tipo: 'comune', nome: 'Monreale', codice: '082049', entrata: 600, uscita: 100, saldo: 500 },
  { tipo: 'comune', nome: 'Carini', codice: '082021', entrata: 300, uscita: 200, saldo: 100 },
  { tipo: 'comune', nome: 'Isnello', codice: '082042', entrata: 5, uscita: 50, saldo: -45 },
  { tipo: 'comune', nome: 'Roma', codice: '058091', entrata: 0, uscita: 650, saldo: -650 },
];

test('riepilogo: totali e quote come nella card originale', () => {
  const r = riepilogo(nodi);
  assert.deepEqual([r.interni, r.uscita, r.entrata, r.saldo], [1000, 1000, 905, -95]);
  assert.equal(r.residenti, 2000); // vive e lavora qui + esce
  assert.equal(r.posti, 1905); // vive e lavora qui + entra
  assert.equal(r.quotaViveQui, 50);
  assert.equal(r.quotaAltrove, 50);
  assert.ok(Math.abs(r.quotaPostiDaFuori - (905 / 1905) * 100) < 1e-9);
});

test('classifica: ordinata, solo chi pesa almeno l\'1% e al massimo 25', () => {
  const usc = classifica(nodi, 'uscita');
  assert.deepEqual(usc.map(d => d.nome), ['Roma', 'Carini', 'Monreale', 'Isnello']);
  assert.equal(usc[0].quota, 65);
  assert.deepEqual(classifica(nodi, 'entrata').map(d => d.nome), ['Monreale', 'Carini']); // Isnello pesa lo 0,55%: sotto la soglia
  const tanti = [nodi[0], ...Array.from({ length: 40 }, (_, i) => ({ tipo: 'comune', nome: `C${i}`, codice: String(i), entrata: 10 + i, uscita: 0 }))];
  assert.equal(classifica(tanti, 'entrata').length, 25);
  assert.equal(classifica(tanti, 'entrata', { tutti: true }).length, 40);
});

test('quota: percentuale con un decimale, 0 senza totale', () => {
  assert.equal(quota(1, 0), 0);
  assert.equal(quota(1, 4), 25);
});

test('saldoPerComune: gli scarti maggiori in valore assoluto, poi dal saldo più alto al più basso', () => {
  assert.deepEqual(saldoPerComune(nodi, 3).map(d => d.nome), ['Monreale', 'Carini', 'Roma']);
  assert.ok(!saldoPerComune([...nodi, { tipo: 'comune', nome: 'Pari', codice: '1', entrata: 7, uscita: 7, saldo: 0 }], 10).some(d => d.nome === 'Pari'));
});

test('voceScheda: sezione dello strato, con fonte; la nota sul periodo del dato sta in un blocco apri/chiudi', () => {
  const v = voceScheda(nodi, () => document, null);
  assert.equal(v.strato, 'pendolarismo');
  assert.equal(v.chiave, 'pendolarismo');
  assert.match(v.fonte, /ISTAT/);
  assert.equal(v.nota, undefined);
  assert.match(NOTA, /2021/);
  assert.equal(typeof v.dinamico, 'function');
});

test('voceScheda: cliccando un comune compare il gruppo con i suoi numeri', () => {
  const v = voceScheda(nodi, () => document, nodi[1]);
  const g = v.gruppi.find(x => x.titolo === 'Monreale');
  assert.ok(g);
  assert.equal(g.righe.find(r => r.etichetta === 'Saldo (entrata − uscita)').valore, '+500');
  assert.equal(voceScheda(nodi, () => document, nodi[0]).gruppi.length, 0);
});

test('tooltip: nome, pallino col colore del saldo e badge entrata/uscita', () => {
  const m = modelloTooltipPendolarismo(nodi[1]);
  assert.equal(m.titolo, 'Monreale');
  assert.equal(m.pallino, COLORE_ENTRATA);
  assert.equal(modelloTooltipPendolarismo(nodi[4]).pallino, COLORE_USCITA);
  assert.equal(modelloTooltipPendolarismo(nodi[0]).pallino, '#7c3aed');
});
