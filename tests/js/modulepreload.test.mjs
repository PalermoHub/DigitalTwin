import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moduliStatici, bloccoLink, sostituisciBlocco } from '../../scripts/genera_modulepreload.mjs';

const PAGINA = new URL('../../mappa.html', import.meta.url);

test('mappa.html elenca tutti i moduli raggiunti con import statici', () => {
  const html = readFileSync(PAGINA, 'utf8');
  assert.equal(sostituisciBlocco(html, bloccoLink(moduliStatici())), html, 'lancia node scripts/genera_modulepreload.mjs');
});

test('i moduli caricati a richiesta (import dinamici) non sono nell\'elenco', () => {
  const moduli = moduliStatici();
  assert.ok(moduli.includes('js/app.js') && moduli.includes('js/layers/base.js'));
  assert.ok(!moduli.includes('js/core/ricerca-guide.js'), 'ricerca-guide si carica alla prima ricerca');
  assert.ok(!moduli.includes('js/geoimage/index.js'), 'geoimage si carica al primo clic sul tab');
});

test('senza marcatori la sostituzione si ferma', () => {
  assert.throws(() => sostituisciBlocco('<html></html>', 'x'), /marcatori/);
});
