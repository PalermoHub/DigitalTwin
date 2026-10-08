// tests/js/rndt-traduzione.test.mjs
// Il bundle del plugin openrndt-geolibre è tradotto da scripts/traduci_rndt.py: qui si controlla il risultato.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../js/vendor/openrndt-geolibre/index.js', import.meta.url), 'utf8');

test('il bundle tradotto è ancora JavaScript valido', async () => {
  // new Function non esegue il modulo ma ne verifica la sintassi (il bundle è un modulo ES: si toglie solo l'export)
  const corpo = src.replace(/export\s*\{[^}]*\};?\s*$/m, '');
  assert.doesNotThrow(() => new Function(corpo));
});

test('le stringhe dell\'interfaccia sono in italiano', () => {
  for (const it of ['Catalogo RNDT', 'Titoli, descrizioni, parole chiave…', 'Nessuna scheda trovata.',
    'Aggiungi alla mappa', 'Ricerche recenti', 'Pagina successiva', 'Cancella tutto', 'Tutte le parole',
    'Tema INSPIRE', 'Scaricamento delle feature…', 'Impostazioni']) {
    assert.ok(src.includes('`' + it + '`'), `manca «${it}»`);
  }
});

test('le stringhe inglesi dell\'interfaccia sono sparite', () => {
  for (const en of ['No records found.', 'Add to map', 'Recent searches', 'Next page', 'Clear all', 'All words',
    'Search titles, abstracts, keywords…', 'Downloading features…', 'RNDT catalogue', 'Copy URL']) {
    assert.ok(!src.includes('`' + en + '`'), `resta «${en}»`);
  }
});

test('i numeri si formattano all\'italiana', () => {
  assert.ok(!src.includes('toLocaleString(`en`)'));
  assert.ok(src.includes('toLocaleString(`it`)'));
});

test('i confronti sui messaggi d\'errore restano coerenti con i messaggi lanciati', () => {
  // startsWith e Error devono usare la stessa frase, altrimenti il messaggio di rete non viene riconosciuto
  assert.ok(src.includes('startsWith(`impossibile raggiungere`)'));
  assert.ok(src.includes('`impossibile raggiungere ${new URL(t).host}'));
  const cors = 'ma una pagina web non può leggerlo: il server non invia le intestazioni CORS. Il servizio funziona in GeoLibre Desktop';
  assert.ok(src.split(cors).length - 1 >= 3);
});

test('il testo «Copia per un agente» e i tag XML restano in inglese', () => {
  assert.ok(src.includes('## Results on this page'));
  assert.ok(src.includes('`GetCapabilities`') && src.includes('`FeatureCollection`'));
  assert.ok(src.includes('e.key===`ArrowDown`'));
});
