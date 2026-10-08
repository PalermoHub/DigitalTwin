// Rete anti-regressione: nei file già migrati non devono restare letterali italiani nel codice.
// Un letterale volutamente italiano (messaggio solo per la console, nome proprio, dato) si marca con `// i18n-ok` a fine riga.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

// Tutti i file di js/ sono controllati, tranne queste eccezioni (motivate). I file nuovi sono quindi controllati da soli.
export const ECCEZIONI = [
  'js/vendor/', // librerie di terzi (il plugin RNDT ha la sua traduzione, vedi rndt-traduzione.test.mjs)
  'js/locales/', // i dizionari
  'js/layers/', // i testi del modello dati si traducono al render con tl(): li controlla i18n-lbl.test.mjs
  'js/core/catalogo.js', 'js/core/guida-contenuti.js', 'js/geoimage/guida-contenuti.js', 'js/rndt/info.js', 'js/core/scheda-preferenze.js', // idem
  'js/core/palette.js', // copia identica dell'originale (vedi il test «palette.js è la copia identica…»)
  'js/consenso.js', // script classico con la propria tabella IT/EN
  'js/core/gerarchia.js', 'js/core/zone.js', // nomi propri di circoscrizioni, quartieri e UPL (dati)
];

const ACCENTATE = /[àèéìòùÀÈÉÌÒÙ]/;
const PAROLE = /\b(il|lo|la|le|gli|dei|del|della|delle|nel|nella|per|con|non|che|una|uno|di|da|sul|sulla|più|solo|tutti|nessun[oa]?|su|giù|sposta|apri|chiudi|aggiungi|elimina|salva|cerca|mostra|nascondi|accendi|spegni|tutto|tutte|nessuna|ordine|valori|colori|strato|strati|mappa|scheda|dati|fonte|fonti|vista|errore|ripristina|scegli|carica|leggi|seleziona|apre|sopra|sotto|dal|dalla|alle|agli|degli|sono|anche|oppure|quando|come|dopo|prima|oltre|entro|senza|tra|fra|più|molto|poco|ogni|quale|quali)\b/i;

// selettori CSS e nomi di classe (non prosa): ogni parola è un selettore, una classe con trattini o un combinatore
const SOLO_CSS = l => /^\s*</.test(l) || l.trim().split(/\s+/).map(tok => tok.replace(/,$/, '')).every(tok => /^[.#:[>~+*]/.test(tok) || /^[a-z][\w-]*([.#:[][\w\-[\]=*"'^$|~.]+)+$/.test(tok) || /^[a-z]+(-{1,2}[a-z0-9]*)+$/.test(tok));

// estrae i letterali di una riga ignorando il commento a fine riga
function letterali(riga) {
  const out = [];
  let i = 0;
  while (i < riga.length) {
    const c = riga[i];
    if (c === '/' && riga[i + 1] === '/') break;
    if (c === '/' && riga[i + 1] === '*') { const f = riga.indexOf('*/', i + 2); if (f < 0) break; i = f + 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < riga.length && riga[j] !== c) j += riga[j] === '\\' ? 2 : 1;
      out.push(c === '`' ? riga.slice(i + 1, j).replace(/\$\{[^}]*\}/g, '') : riga.slice(i + 1, j)); // nei template contano solo i testi fuori dalle espressioni
      i = j + 1;
    } else i++;
  }
  return out;
}

export function residui(sorgente) {
  const trovati = [];
  sorgente.split('\n').forEach((riga, n) => {
    const s = riga.trim();
    if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*') || riga.includes('// i18n-ok') || /^\s*import\b/.test(riga)) return;
    for (const l of letterali(riga)) {
      if (/^(https?:|\.{0,2}\/|#|[\w-]+\.[a-z]{2,4}$)/.test(l)) continue;
      if (/^[^A-ZÀ-Ý]/.test(l) && /[.:#[\]>=_-]/.test(l) && SOLO_CSS(l)) continue; // selettori CSS e nomi di classe
      if (ACCENTATE.test(l) || (/\s/.test(l.trim()) && PAROLE.test(l))) trovati.push(`${n + 1}: ${l.slice(0, 60)}`);
    }
  });
  return trovati;
}

test('residui: riconosce italiano, ignora commenti, url, import e i18n-ok', () => {
  assert.equal(residui("el.textContent = 'Nessun risultato per la ricerca';").length, 1);
  assert.equal(residui("const x = 'città';").length, 1);
  assert.equal(residui("el.textContent = t('ricerca.vuoto'); // niente di italiano qui").length, 0);
  assert.equal(residui("// 'Nessun risultato' è un commento").length, 0);
  assert.equal(residui("console.warn('Errore di rete per il tile'); // i18n-ok").length, 0);
  assert.equal(residui("import { a } from './core/città.js';").length, 0);
  assert.equal(residui("const u = 'https://example.org/più';").length, 0);
});

function tuttiIFile(radice, dir = 'js', out = []) {
  for (const n of readdirSync(new URL(`${dir}/`, radice))) {
    const p = `${dir}/${n}`;
    if (statSync(new URL(p, radice)).isDirectory()) { if (!ECCEZIONI.includes(`${p}/`)) tuttiIFile(radice, p, out); }
    else if (n.endsWith('.js') && !ECCEZIONI.includes(p)) out.push(p);
  }
  return out;
}

test('nessun file di js/ ha letterali italiani residui (salvo le eccezioni motivate)', () => {
  const radice = new URL('../../', import.meta.url);
  const trovati = [];
  for (const f of tuttiIFile(radice)) for (const r of residui(readFileSync(new URL(f, radice), 'utf8'))) trovati.push(`${f} ${r}`);
  assert.deepEqual(trovati, [], 'stringhe italiane da portare nei dizionari (o da marcare // i18n-ok se sono messaggi di console)');
});
