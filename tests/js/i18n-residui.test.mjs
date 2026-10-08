// Rete anti-regressione: nei file già migrati non devono restare letterali italiani nel codice.
// Un letterale volutamente italiano (messaggio solo per la console, nome proprio, dato) si marca con `// i18n-ok` a fine riga.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Si estende a ogni task di migrazione: percorsi relativi alla radice del repo.
export const MIGRATI = [];

const ACCENTATE = /[àèéìòùÀÈÉÌÒÙ]/;
const PAROLE = /\b(il|lo|la|le|gli|dei|del|della|delle|nel|nella|per|con|non|che|una|uno|di|da|sul|sulla|più|solo|tutti|nessun[oa]?)\b/i;

// estrae i letterali di una riga ignorando il commento a fine riga
function letterali(riga) {
  const out = [];
  let i = 0;
  while (i < riga.length) {
    const c = riga[i];
    if (c === '/' && riga[i + 1] === '/') break;
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < riga.length && riga[j] !== c) j += riga[j] === '\\' ? 2 : 1;
      out.push(riga.slice(i + 1, j));
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
