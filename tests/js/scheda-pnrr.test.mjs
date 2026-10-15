import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONI, coloreMissione, frase, titoloProgetto, righeProgetto, voceScheda, modelloTooltipPnrr, euroCompatto, barre, quotaConclusi, voceSintesi } from '../../js/layers/scheda-pnrr.js';

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
  assert.ok(v.link.length >= 3 && v.link.every(l => /^https:\/\//.test(l.url)));
  assert.match(v.link[0].url, /^https:\/\/www\.italiadomani\.gov\.it\//);
  assert.ok(v.link.some(l => l.url.includes('cruscotto-italia.dati.gov.it') && l.url.includes('082053')));
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

test('voci PNRR: i pesi mandano progetti e sintesi nella tab PNRR (95 e 96)', () => {
  assert.equal(voceScheda(P).peso, 95);
  assert.equal(voceSintesi({ n: 1, per_stato: [] }, () => null).peso, 96);
});

test('euroCompatto: miliardi, milioni, migliaia e unità', () => {
  assert.equal(euroCompatto(921364866.52), '921,4 M€');
  assert.equal(euroCompatto(1_250_000_000), '1,25 Mld €');
  assert.equal(euroCompatto(128000), '128 k€');
  assert.equal(euroCompatto(950), '950 €');
  assert.equal(euroCompatto('x'), null);
});

test('barre: la quota è rispetto al massimo, senza dati resta 0', () => {
  const b = barre([{ voce: 'a', n: 10 }, { voce: 'b', n: 5 }, { voce: 'c', n: 0 }], 'n');
  assert.deepEqual(b.map(x => x.quota), [100, 50, 0]);
  assert.deepEqual(barre([{ voce: 'a', n: 0 }], 'n')[0].quota, 0);
  assert.deepEqual(barre([], 'n'), []);
});

test('quotaConclusi: percentuale con un decimale', () => {
  assert.equal(quotaConclusi({ n: 2633, per_stato: [{ voce: 'Concluso', n: 380 }, { voce: 'In Corso', n: 2253 }] }), 14.4);
  assert.equal(quotaConclusi({ n: 0, per_stato: [] }), 0);
});

test('voceSintesi: sezione sempre presente, badge con l’anno dell’estrazione e link alla fonte', () => {
  const v = voceSintesi({ n: 2633, estrazione: '13/06/2026', per_stato: [] }, () => null);
  assert.equal(v.chiave, 'pnrr-sintesi');
  assert.equal(v.badge, '2026');
  assert.equal(v.sempre, true);
  assert.equal(typeof v.dinamico, 'function');
  assert.match(v.link[0].url, /^https:\/\/www\.italiadomani\.gov\.it\//);
});

test('nomeSoggetto: nomi propri in forma leggibile, solo se tutti maiuscoli', async () => {
  const { nomeSoggetto } = await import('../../js/layers/scheda-pnrr.js');
  assert.equal(nomeSoggetto("UNIVERSITA' DEGLI STUDI DI PALERMO"), 'Università degli Studi di Palermo');
  assert.equal(nomeSoggetto('COMUNE DI PALERMO'), 'Comune di Palermo');
  assert.equal(nomeSoggetto('REGIONE SICILIANA'), 'Regione Siciliana');
  assert.equal(nomeSoggetto('ISTITUTO COMPRENSIVO - I.C. MICHELANGELO BUONARROTI'), 'Istituto Comprensivo - I.C. Michelangelo Buonarroti');
  assert.equal(nomeSoggetto('Già in forma Corretta'), 'Già in forma Corretta');
  assert.equal(nomeSoggetto(null), null);
});
