import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONI, coloreMissione, frase, titoloProgetto, righeProgetto, voceScheda, modelloTooltipPnrr } from '../../js/layers/scheda-pnrr.js';

const P = {
  cup: 'B71C23000340006', titolo: 'LAVORI DI RIQUALIFICAZIONE DELLA SCUOLA', sintesi: 'MIGRAZIONE AL CLOUD DEI SERVIZI', missione: 'M4',
  componente_nome: 'Potenziamento dell\'offerta dei servizi di istruzione', submisura_nome: 'Scuola 4.0', stato: 'In Corso', attuatore: 'COMUNE DI PALERMO',
  pnrr: 1000000, totale: 1200000, inizio_previsto: '08/02/2022', fine_prevista: '30/06/2026', indirizzo: 'Via Roma 3', precisione: 'civico',
};
const valore = (righe, e) => righe.find(r => r.etichetta === e)?.valore;

test('MISSIONI: sette missioni con codice, nome e colore distinti', () => {
  assert.deepEqual(MISSIONI.map(([c]) => c), ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']);
  assert.equal(new Set(MISSIONI.map(([, , col]) => col)).size, 7);
  assert.equal(coloreMissione('M4'), MISSIONI[3][2]);
  assert.equal(coloreMissione('M9'), '#868e96');
});

test('frase: porta a frase solo i testi tutti maiuscoli', () => {
  assert.equal(frase('LAVORI DI PROVA'), 'Lavori di prova');
  assert.equal(frase('Lavori di Prova'), 'Lavori di Prova');
  assert.equal(frase(''), null);
  assert.equal(frase(undefined), null);
  assert.equal(frase('PA'), 'PA');
});

test('titoloProgetto: titolo, poi misura, poi CUP', () => {
  assert.equal(titoloProgetto(P), 'Lavori di riqualificazione della scuola');
  assert.equal(titoloProgetto({ cup: 'X', submisura_nome: 'Scuola 4.0' }), 'Scuola 4.0');
  assert.equal(titoloProgetto({ cup: 'X' }), 'X');
});

test('righeProgetto: importi in euro, righe assenti omesse, ordine stabile', () => {
  const r = righeProgetto(P);
  assert.match(valore(r, 'Finanziamento PNRR'), /1\.000\.000\s*€/);
  assert.match(valore(r, 'Costo totale'), /1\.200\.000\s*€/);
  assert.equal(valore(r, 'Indirizzo'), 'Via Roma 3');
  assert.equal(valore(r, 'CUP'), P.cup);
  assert.match(valore(r, 'Missione'), /^M4 — /);
  assert.equal(valore(r, 'Fine effettiva'), undefined);
  assert.equal(r[0].etichetta, 'Missione');
  assert.equal(r.at(-1).etichetta, 'CUP');
});

test('righeProgetto: la posizione approssimata alla via è dichiarata', () => {
  assert.equal(valore(righeProgetto({ ...P, precisione: 'via' }), 'Posizione'), 'Solo la via: posizione approssimata');
});

test('voceScheda: chiave dal CUP, strato, badge e testo di sintesi', () => {
  const v = voceScheda(P);
  assert.equal(v.chiave, 'pnrr-B71C23000340006');
  assert.equal(v.strato, 'pnrr');
  assert.equal(v.badge, 'PNRR M4');
  assert.equal(v.testo, 'Migrazione al cloud dei servizi');
  assert.match(v.link.url, /^https:\/\/www\.italiadomani\.gov\.it\//);
  assert.equal(voceScheda({ cup: 'X' }).badge, 'PNRR');
});

test('modelloTooltipPnrr: titolo, missione e stato, tre righe al massimo', () => {
  const m = modelloTooltipPnrr(P);
  assert.equal(m.titolo, 'Lavori di riqualificazione della scuola');
  assert.equal(m.sottotitolo, 'M4 · In Corso');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Finanziamento PNRR', 'Soggetto attuatore', 'Indirizzo']);
  assert.equal(modelloTooltipPnrr({ cup: 'X', missione: 'M1' }).sottotitolo, 'M1');
});

test('modelloTooltipPnrr: un titolo lungo viene accorciato, la scheda lo tiene intero', () => {
  const lungo = { ...P, titolo: 'parola '.repeat(60) };
  const m = modelloTooltipPnrr(lungo);
  assert.ok(m.titolo.length <= 91 && m.titolo.endsWith('…'));
  assert.ok(titoloProgetto(lungo).length > 300);
});
