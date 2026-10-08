// Rete anti-regressione: nei file già migrati non devono restare letterali italiani nel codice.
// Un letterale volutamente italiano (messaggio solo per la console, nome proprio, dato) si marca con `// i18n-ok` a fine riga.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Si estende a ogni task di migrazione: percorsi relativi alla radice del repo.
export const MIGRATI = [
  'js/app.js', 'js/core/pannello.js', 'js/core/pannello-riordino.js', 'js/core/pannello-attributo.js',
  'js/core/pannello-comune.js', 'js/core/pannello-tema.js', 'js/core/strumenti.js', 'js/core/stampa.js',
  'js/core/ripristino.js', 'js/core/rail.js', 'js/core/tab-mobile.js', 'js/core/invito.js',
  'js/core/ingrandisci.js', 'js/core/evidenza.js',
  'js/core/scheda.js', 'js/core/scheda-modello.js', 'js/core/scheda-disegno.js', 'js/core/scheda-pannello-preferenze.js',
  'js/core/ricerca.js', 'js/core/ricerca-incidenti.js', 'js/core/luoghi.js', 'js/core/indirizzi.js',
  'js/core/condivisione.js', 'js/core/condivisione-stato.js', 'js/core/condivisione-reti.js', 'js/core/differiti.js',
  'js/core/tema.js', 'js/core/indicatori.js', 'js/core/tema-attributo.js',
  // Task 7: Aggiungi, RNDT (interfaccia nostra, tranne info.js: modello schede, vedi Task 8) e Geoimage (tranne le guide)
  'js/aggiungi/albero.js',
  'js/aggiungi/arcgis.js',
  'js/aggiungi/controllo.js',
  'js/aggiungi/credenziali.js',
  'js/aggiungi/da-url.js',
  'js/aggiungi/index.js',
  'js/aggiungi/migrazione.js',
  'js/aggiungi/salvati.js',
  'js/aggiungi/servizi.js',
  'js/aggiungi/wmts.js',
  'js/rndt/archivio.js',
  'js/rndt/area.js',
  'js/rndt/dati.js',
  'js/rndt/gruppo.js',
  'js/rndt/host.js',
  'js/rndt/importa.js',
  'js/rndt/index.js',
  'js/rndt/librerie.js',
  'js/rndt/pannello.js',
  'js/rndt/proxy.js',
  'js/geoimage/archivio.js',
  'js/geoimage/confronto-clip.js',
  'js/geoimage/confronto.js',
  'js/geoimage/esporta.js',
  'js/geoimage/export-geotiff.js',
  'js/geoimage/export.js',
  'js/geoimage/gcp.js',
  'js/geoimage/geometria.js',
  'js/geoimage/immagine.js',
  'js/geoimage/index.js',
  'js/geoimage/librerie.js',
  'js/geoimage/maniglie.js',
  'js/geoimage/omografia.js',
  'js/geoimage/overlay.js',
  'js/geoimage/pannello.js',
  'js/geoimage/posizione.js',
  'js/geoimage/progetto.js',
  'js/geoimage/richieste.js',
  'js/geoimage/scarica.js',
  'js/geoimage/sessione.js',
  'js/geoimage/sospensione.js',
  'js/geoimage/storico.js',
  'js/geoimage/trasformazioni.js',
  // non in elenco, di proposito: palette.js (copia identica dell'originale, vedi test), scheda-preferenze.js (le etichette
  // sono identità delle preferenze salvate: si traducono al render con tl()), consenso.js (tabella propria, non usa i dizionari)
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

test('i file migrati non hanno letterali italiani residui', () => {
  const radice = new URL('../../', import.meta.url);
  for (const f of MIGRATI) {
    const r = residui(readFileSync(new URL(f, radice), 'utf8'));
    assert.deepEqual(r, [], `${f}: stringhe italiane da portare nei dizionari`);
  }
});
