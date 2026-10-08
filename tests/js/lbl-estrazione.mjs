// Estrae dai moduli i testi italiani «del modello dati» (etichette, titoli, note, valori fissi) che si traducono al
// momento di mostrarli con tl(): per ognuno serve una voce `lbl.<testo>` nei dizionari. Non è un test: lo usano
// i-18n-lbl.test.mjs e, a mano, gli strumenti di lavoro.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ACCENTATE = /[àèéìòùÀÈÉÌÒÙ]/;
const PAROLE = /\b(il|lo|la|le|gli|dei|del|della|delle|nel|nella|per|con|non|che|una|uno|di|da|sul|sulla|più|solo|tutti|nessun[oa]?|su|giù|sposta|apri|chiudi|aggiungi|elimina|salva|cerca|mostra|nascondi|accendi|spegni|tutto|tutte|nessuna|ordine|valori|colori|strato|strati|mappa|scheda|dati|fonte|fonti|vista|errore|ripristina|scegli|carica|leggi|seleziona|apre|sopra|sotto|dal|dalla|alle|agli|degli|sono|anche|oppure|quando|come|dopo|prima|oltre|entro|senza|tra|fra|molto|poco|ogni|quale|quali)\b/i;
// contesti in cui anche una parola sola è testo mostrato: chiavi del modello, righe `['Etichetta', valore]`, riga('Etichetta', …)
const CONTESTI = [
  /\b(?:etichetta|titolo|badge|nota|testo|suggerimento|riassunto|stato|anteprima|descrizione|sottotitolo|dettaglio|label|valore)\s*:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g,
  /\briga\(\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g,
  /\[\s*'([A-ZÀ-Ý][^'\\]*(?:\\.[^'\\]*)*)'\s*,/g,
];

function letterali(riga) {
  const out = [];
  let i = 0;
  while (i < riga.length) {
    const c = riga[i];
    if (c === '/' && riga[i + 1] === '/') break;
    if (c === '/' && riga[i + 1] === '*') { const f = riga.indexOf('*/', i + 2); if (f < 0) break; i = f + 2; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < riga.length && riga[j] !== c) j += riga[j] === '\\' ? 2 : 1;
      out.push(riga.slice(i + 1, j).replace(/\\(.)/g, '$1'));
      i = j + 1;
    } else if (c === '`') {
      let j = i + 1;
      while (j < riga.length && riga[j] !== c) j += riga[j] === '\\' ? 2 : 1;
      const corpo = riga.slice(i + 1, j);
      if (!corpo.includes('${')) out.push(corpo.replace(/\\(.)/g, '$1')); // i template con variabili si traducono alla fonte con t()
      i = j + 1;
    } else i++;
  }
  return out;
}

export function daTradurre(sorgente) {
  const trovati = new Set();
  for (const riga of sorgente.split('\n')) {
    const s = riga.trim();
    if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*') || riga.includes('// i18n-ok') || /^\s*import\b/.test(riga)) continue;
    for (const l of letterali(riga)) {
      if (/^(https?:|\.{0,2}\/|#|[\w-]+\.[a-z]{2,4}$)/.test(l)) continue;
      if (/^[^A-ZÀ-Ý]/.test(l) && /[.:#[\]>=_-]/.test(l)) continue;
      if (ACCENTATE.test(l) || (/\s/.test(l.trim()) && PAROLE.test(l))) trovati.add(l);
    }
    const senzaCommento = riga.replace(/\s\/\/.*$/, '');
    for (const re of CONTESTI) {
      re.lastIndex = 0;
      for (const m of senzaCommento.matchAll(re)) {
        const l = m[1].replace(/\\(.)/g, '$1');
        if (/^[A-ZÀ-Ý]/.test(l) && l.length > 1 && /[A-Za-zÀ-ÿ]{2}/.test(l) && !/^[\w-]+\.[a-z]{2,4}$/.test(l)) trovati.add(l);
      }
    }
  }
  return [...trovati];
}

export function fileModelli(radice) {
  const out = [];
  for (const dir of ['js/layers']) for (const n of readdirSync(join(radice, dir))) if (n.endsWith('.js')) out.push(`${dir}/${n}`);
  out.push('js/rndt/info.js', 'js/core/scheda-preferenze.js');
  return out;
}

export const leggiFile = (radice, f) => readFileSync(join(radice, f), 'utf8');
