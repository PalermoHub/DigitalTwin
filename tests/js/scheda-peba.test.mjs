import test from 'node:test';
import assert from 'node:assert/strict';
import { voceScheda, righeAnagrafica, righeAccessibilita, modelloTooltipPeba, criticita, urlPdf, urlFoto, percorsoMiniatura, dimensioneFile, euro, passoFoto, ruotaGradi, LIVELLI, GRUPPI, COLORE_LIVELLO, COLORE_GRUPPO } from '../../js/layers/scheda-peba.js';
import { unisci } from '../../js/core/scheda-modello.js';

const P = {
  codice: 'U_16', nome: 'DIRETTORE GENERALE', indirizzo: 'Piazza Marina, 46', gruppo: 'Sede amministrativa/istituzionale',
  categoria: 'SERVIZI PUBBLICI', circoscrizione: 'I', quartiere: 'Tribunali-Castellammare', upl: 'Tribunali o Kalsa',
  punteggio: 68, livello: 'Parzialmente inaccessibile', rilevanza: 'Alta', classe: 3, media_circ: 55.4, costo: 161780, n_foto: 7,
  criticita: 'Parcheggio distante; ascensore non funzionante; ', pdf: 'a.pdf', pdf_byte: 4900000, forma: 'edificio',
};
const valore = (righe, e) => righe.find(r => r.etichetta === e)?.valore;

test('palette: 5 livelli e 10 gruppi, ognuno col suo colore', () => {
  assert.equal(LIVELLI.length, 5);
  assert.equal(GRUPPI.length, 10);
  assert.equal(COLORE_LIVELLO['Accessibile'], '#0072b2');
  assert.equal(COLORE_GRUPPO['Scuola'], '#ef9ffc');
});

test('url: foto grandi e PDF stanno su palermohub.github.io/peba, le miniature in locale', () => {
  assert.equal(urlPdf('a b.pdf'), 'https://palermohub.github.io/peba/dati/pdf/a%20b.pdf');
  assert.equal(urlFoto('U_16', 3), 'https://palermohub.github.io/peba/img/foto/U_16/03.jpg');
  assert.equal(percorsoMiniatura('U_16', 12), 'peba/foto/U_16/12_thumb.jpg');
});

test('criticita: voci separate da «;», vuote scartate', () => {
  assert.deepEqual(criticita(P), ['Parcheggio distante', 'ascensore non funzionante']);
  assert.deepEqual(criticita({}), []);
});

test('righeAnagrafica: ordine dell\'originale, costo in euro, valori assenti omessi', () => {
  const r = righeAnagrafica(P);
  assert.deepEqual(r.map(x => x.etichetta), ['Codice', 'Costo stimato', 'Nome', 'Indirizzo', 'Gruppo', 'Categoria']);
  assert.match(valore(r, 'Costo stimato'), /161\.780,00\s?€/);
  assert.deepEqual(righeAnagrafica({ codice: 'X_1' }).map(x => x.etichetta), ['Codice']);
});

test('righeAccessibilita: punteggio su 100, classe priorità, media con scarto', () => {
  const r = righeAccessibilita(P);
  assert.equal(valore(r, 'Livello'), 'Parzialmente inaccessibile');
  assert.equal(valore(r, 'Punteggio di inaccessibilità'), '68 / 100');
  assert.equal(valore(r, 'Rilevanza'), 'Alta');
  assert.equal(valore(r, 'Classe priorità'), 'Classe 3');
  assert.equal(valore(r, 'Media della circoscrizione'), '55 (+13)');
});

test('righeAccessibilita: senza rilevanza né punteggio non compaiono classe, media né punteggio', () => {
  const r = righeAccessibilita({ codice: 'X', livello: 'Non valutabile', non_valutabile: 'Si' });
  assert.equal(valore(r, 'Livello'), 'Non valutabile');
  assert.equal(valore(r, 'Classe priorità'), undefined);
  assert.equal(valore(r, 'Media della circoscrizione'), undefined);
  assert.equal(valore(r, 'Punteggio di inaccessibilità'), 'n/d');
});

test('media sotto la media: scarto negativo con segno meno', () => {
  assert.equal(valore(righeAccessibilita({ ...P, punteggio: 31, media_circ: 55 }), 'Media della circoscrizione'), '55 (-24)');
});

test('dimensioneFile: MB con una cifra decimale', () => {
  assert.equal(dimensioneFile(4_900_000), '4,7 MB');
  assert.equal(dimensioneFile(150_000), '146 kB');
  assert.equal(dimensioneFile(undefined), '');
});

test('voceScheda: una sola sezione per codice, contesto in testata, badge del livello e link', () => {
  const v = voceScheda(P, () => null);
  assert.equal(v.chiave, 'peba-U_16');
  assert.equal(v.strato, 'peba');
  assert.deepEqual(v.contesto, { circoscrizione: 'I', quartiere: 'Tribunali-Castellammare', upl: 'Tribunali o Kalsa' });
  assert.equal(v.badge, 'Parzialmente inaccessibile');
  assert.equal(typeof v.dinamico, 'function');
  const urls = [].concat(v.link).map(l => l.url);
  assert.ok(urls.includes('https://palermohub.github.io/peba/dati/pdf/a.pdf'));
  assert.ok(urls.includes('https://palermohub.opendatasicilia.it/peba.html'));
  const { sezioni } = unisci([v, v]);
  assert.equal(sezioni.length, 1);
});

test('voceScheda: senza PDF c\'è solo il link al sito del piano', () => {
  const v = voceScheda({ ...P, pdf: undefined, pdf_byte: undefined }, () => null);
  assert.deepEqual([].concat(v.link).map(l => l.url), ['https://palermohub.opendatasicilia.it/peba.html']);
});

test('tooltip: «Codice – Nome» con pallino e badge, per livello o per gruppo', () => {
  const l = modelloTooltipPeba(P, 'livello');
  assert.equal(l.titolo, 'U_16 – DIRETTORE GENERALE');
  assert.equal(l.pallino, COLORE_LIVELLO['Parzialmente inaccessibile']);
  assert.equal(l.badge.testo, 'Parzialmente inaccessibile');
  const g = modelloTooltipPeba(P, 'gruppo');
  assert.equal(g.pallino, COLORE_GRUPPO['Sede amministrativa/istituzionale']);
  assert.equal(g.badge.testo, 'Sede amministrativa/istituzionale');
  assert.equal(modelloTooltipPeba({ codice: 'X_1' }, 'livello').titolo, 'X_1');
});

test('euro: formato italiano', () => {
  assert.match(euro(161780), /161\.780,00\s?€/);
});

test('passoFoto: scorre in modo circolare, anche all\'indietro dalla prima', () => {
  assert.equal(passoFoto(0, 1, 7), 1);
  assert.equal(passoFoto(6, 1, 7), 0);
  assert.equal(passoFoto(0, -1, 7), 6);
  assert.equal(passoFoto(0, 1, 1), 0);
  assert.equal(passoFoto(0, 1, 0), 0);
});

test('ruotaGradi: multipli di 90 tra 0 e 270', () => {
  assert.equal(ruotaGradi(0, 90), 90);
  assert.equal(ruotaGradi(270, 90), 0);
  assert.equal(ruotaGradi(0, -90), 270);
  assert.equal(ruotaGradi(undefined, 90), 90);
});

test('badge come nell\'originale: codice col colore del gruppo, costo verde, livello e classe col colore del livello, rilevanza rossa se alta', () => {
  const colore = (righe, e) => righe.find(r => r.etichetta === e)?.colore;
  const a = righeAnagrafica(P);
  assert.equal(colore(a, 'Codice'), COLORE_GRUPPO['Sede amministrativa/istituzionale']);
  assert.equal(colore(a, 'Costo stimato'), '#16a34a');
  assert.equal(colore(a, 'Nome'), undefined);
  const x = righeAccessibilita(P);
  assert.equal(colore(x, 'Livello'), COLORE_LIVELLO['Parzialmente inaccessibile']);
  assert.equal(colore(x, 'Classe priorità'), COLORE_LIVELLO['Parzialmente inaccessibile']);
  assert.equal(colore(x, 'Rilevanza'), '#dc2626');
  assert.equal(colore(righeAccessibilita({ ...P, rilevanza: 'Bassa' }), 'Rilevanza'), '#6b7280');
  assert.equal(colore(x, 'Punteggio di inaccessibilità'), undefined);
});

test('badge: un gruppo sconosciuto non rompe, il codice resta senza colore', () => {
  assert.equal(righeAnagrafica({ codice: 'X_1', gruppo: 'Altro' })[0].colore, undefined);
});
