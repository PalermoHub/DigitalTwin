// Ogni testo italiano rimasto nei moduli del modello dati (layer, schede, RNDT info) deve avere la sua traduzione
// `lbl.<testo>` in it.json e en.json: tl() la usa al render. Un testo che non va tradotto (nome proprio, dato) si
// marca con `// i18n-ok` a fine riga.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { daTradurre, fileModelli, leggiFile } from './lbl-estrazione.mjs';

const RADICE = new URL('../../', import.meta.url).pathname;
const leggi = f => JSON.parse(readFileSync(`${RADICE}js/locales/${f}`, 'utf8'));
const it = leggi('it.json');
const en = leggi('en.json');

test('daTradurre: trova testi con parole o accenti e le etichette di una parola nei contesti del modello', () => {
  assert.deepEqual(daTradurre("riga('Gradi', x), riga('Corse al giorno', y)"), ['Gradi', 'Corse al giorno']);
  assert.deepEqual(daTradurre("{ etichetta: 'Fascia', valore: 'Centrale' }"), ['Fascia', 'Centrale']);
  assert.deepEqual(daTradurre("righe([['Via', p.via], ['Civico', n]])"), ['Via', 'Civico']);
  assert.deepEqual(daTradurre("const x = 'città';"), ['città']);
  assert.deepEqual(daTradurre("titolo: `Linea ${n}`"), [], 'i template con variabili sono tradotti alla fonte');
  assert.deepEqual(daTradurre("const a = 'Nessun dato'; // i18n-ok"), []);
  assert.deepEqual(daTradurre("map.setFilter(['get', 'Foglio'])"), []);
});

test('ogni testo del modello ha la sua voce lbl.* in italiano e in inglese', () => {
  const mancano = [];
  for (const f of fileModelli(RADICE)) {
    for (const l of daTradurre(leggiFile(RADICE, f))) {
      if (!(`lbl.${l}` in it) || !(`lbl.${l}` in en)) mancano.push(`${f}: ${l}`);
    }
  }
  assert.deepEqual(mancano, [], `${mancano.length} testi senza voce lbl.*`);
});

test('in it.json ogni lbl.<testo> vale il testo stesso (l\'italiano non si altera)', () => {
  for (const [k, v] of Object.entries(it)) if (k.startsWith('lbl.')) assert.equal(v, k.slice(4), k);
});
