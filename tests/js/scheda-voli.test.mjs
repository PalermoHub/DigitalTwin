// tests/js/scheda-voli.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { testoRitardo, voceVolo, modelloPopupVolo, voceAeroporto, modelloPopupAeroporto, aeroportoInAllerta, gruppiAeroporto } from '../../js/layers/scheda-voli.js';

const AEREO = { id: 'abc', volo: 'EJU3512', matricola: 'OE-IJA', tipo: 'A320', stato: 'In partenza', quota_ft: 2500, velocita_kt: 160, rotta: 90, rateo_fpm: 1500, distanza_nm: 5 };
const LINEA = { linea_direzione: 'partenza', linea_volo: 'EC 03512', linea_compagnia: 'EasyJet Europe', linea_citta: 'MILANO Malpensa', linea_programmato: '23:45', linea_stimato: '00:06', linea_stimato_giorno_dopo: true, linea_ritardo_min: 21, linea_cancellato: false, linea_gate: 'A14', linea_stato: '' };
const volo = (n, extra = {}) => ({ volo: `FR 0${4000 + n}`, citta: 'BOLOGNA', programmato: `0${n}:05`, ritardo_min: 0, cancellato: false, gate: 'A12', stato: '', ...extra });
const DATI = {
  aggiornato: '2026-10-23T00:15', riepilogo: { voli: 4, ritardati: 2, cancellati: 1, ritardo_medio_min: 25 },
  partenze: [volo(1), volo(2, { ritardo_min: 30, stimato: '02:35' }), volo(3, { cancellato: true, ritardo_min: null }), volo(4, { stato: 'PARTITO' }), volo(6, { ritardo_min: 21, stimato: '00:06', stimato_giorno_dopo: true, programmato: '23:45' })],
  arrivi: [volo(5, { gate: '' })],
};

test('ritardo in parole', () => {
  assert.equal(testoRitardo(0, false), 'In orario');
  assert.equal(testoRitardo(4, false), 'In orario');
  assert.equal(testoRitardo(21, false), 'In ritardo di 21 min');
  assert.equal(testoRitardo(-7, false), 'In anticipo di 7 min');
  assert.equal(testoRitardo(null, true), 'Cancellato');
  assert.equal(testoRitardo(null, false), '');
});

test('aereo senza volo di linea: scheda come prima', () => {
  const v = voceVolo(AEREO);
  assert.equal(v.gruppi.length, 1);
  assert.ok(v.fonte.includes('adsb.lol') && !v.fonte.includes('Gesap'));
  assert.equal(modelloPopupVolo(AEREO).sottotitolo, 'In partenza');
});

test('aereo con volo di linea: ritardo, città, orari e gate, e fonte Gesap', () => {
  const p = { ...AEREO, ...LINEA };
  const v = voceVolo(p);
  const righe = Object.fromEntries(v.gruppi[0].righe.map(r => [r.etichetta, r.valore]));
  assert.equal(v.gruppi[0].titolo, 'Volo di linea');
  assert.equal(righe['Volo di linea'], 'EC 03512 · EasyJet Europe');
  assert.equal(righe.Ritardo, 'In ritardo di 21 min');
  assert.equal(righe.Destinazione, 'MILANO Malpensa');
  assert.equal(righe['Orario stimato'], '00:06 (giorno dopo)');
  assert.equal(righe.Gate, 'A14');
  assert.ok(v.fonte.includes('Gesap'));
  assert.equal(modelloPopupVolo(p).sottotitolo, 'In partenza · In ritardo di 21 min');
  assert.ok(modelloPopupVolo(p).righe.every(r => r.etichetta !== 'Stato'));
});

test('arrivo in orario: «Provenienza» e sottotitolo senza ritardo; cancellato senza orario stimato', () => {
  const p = { ...AEREO, stato: 'In arrivo', ...LINEA, linea_direzione: 'arrivo', linea_ritardo_min: 1, linea_stimato_giorno_dopo: false };
  assert.equal(modelloPopupVolo(p).sottotitolo, 'In arrivo');
  assert.ok(voceVolo(p).gruppi[0].righe.some(r => r.etichetta === 'Provenienza'));
  const c = voceVolo({ ...AEREO, ...LINEA, linea_cancellato: true, linea_ritardo_min: null });
  assert.ok(!c.gruppi[0].righe.some(r => r.etichetta === 'Orario stimato'));
  assert.equal(c.gruppi[0].righe.find(r => r.etichetta === 'Ritardo').valore, 'Cancellato');
});

test('segnale sull\'icona: voli cancellati o in ritardo di 15 minuti o più, non conclusi', () => {
  assert.equal(aeroportoInAllerta(null), false);
  assert.equal(aeroportoInAllerta(DATI), true);
  assert.equal(aeroportoInAllerta({ partenze: [volo(1, { ritardo_min: 14 })], arrivi: [volo(2, { ritardo_min: 40, stato: 'ATTERRATO' })] }), false);
  assert.equal(aeroportoInAllerta({ partenze: [volo(1, { cancellato: true, ritardo_min: null })], arrivi: [] }), true);
});

test('scheda dell\'aeroporto: riepilogo e prossimi voli (senza quelli già conclusi)', () => {
  const g = gruppiAeroporto(DATI);
  assert.deepEqual(g.map(x => x.titolo), ['Oggi', 'Prossime partenze', 'Prossimi arrivi']);
  assert.deepEqual(g[0].griglia.map(c => c.valore), ['2', '1', '25 min']);
  assert.equal(g[1].righe.length, 4); // il volo PARTITO non c'è
  assert.equal(g[1].righe[1].etichetta, '02:05 → 02:35 · FR 04002'); // ritardato: programmato → stimato
  assert.equal(g[1].righe[0].etichetta, '01:05 · FR 04001'); // in orario: solo il programmato
  assert.equal(g[1].righe[2].etichetta, '03:05 · FR 04003'); // cancellato: nessuno stimato
  assert.equal(g[1].righe[3].etichetta, '23:45 → 00:06 +1 · FR 04006');
  assert.equal(g[1].righe[1].valore, 'BOLOGNA · In ritardo di 30 min · gate A12');
  assert.equal(g[1].righe[2].valore, 'BOLOGNA · Cancellato · gate A12');
  assert.equal(g[2].righe[0].valore, 'BOLOGNA · In orario');
  const v = voceAeroporto(DATI);
  assert.equal(v.titolo, 'Aeroporto di Palermo (PMO)');
  assert.equal(v.badge, 'Ritardi o cancellazioni');
  assert.ok(v.fonte.includes('Gesap'));
});

test('aeroporto senza dati di Gesap: la scheda c\'è comunque', () => {
  const v = voceAeroporto(null);
  assert.equal(v.gruppi.length, 1);
  assert.ok(v.gruppi[0].righe.some(r => r.etichetta === 'Orari dei voli'));
  assert.equal(v.badge, undefined);
  assert.equal(modelloPopupAeroporto(null).titolo, 'Aeroporto di Palermo (PMO)');
  const popup = modelloPopupAeroporto(DATI);
  assert.equal(popup.sottotitolo, 'Ritardi o cancellazioni');
  assert.equal(popup.righe.find(r => r.etichetta === 'Prossimo arrivo').valore, '05:05 · FR 04005 · BOLOGNA');
});
