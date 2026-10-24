import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moduliStatici, bloccoLink, sostituisciBlocco } from '../../scripts/genera_modulepreload.mjs';

const PAGINA = new URL('../../mappa.html', import.meta.url);

test('mappa.html elenca tutti i moduli raggiunti con import statici', () => {
  const html = readFileSync(PAGINA, 'utf8');
  assert.equal(sostituisciBlocco(html, bloccoLink(moduliStatici())), html, 'lancia node scripts/genera_modulepreload.mjs');
});

test('app.js è in preload subito, gli altri moduli dopo il primo paint', () => {
  const html = readFileSync(PAGINA, 'utf8');
  assert.match(html, /<link rel="modulepreload" href="js\/app\.js">/);
  assert.match(html, /first-contentful-paint/);
  const elenco = JSON.parse(/var m=(\[.*?\]),f=0/.exec(html)[1]);
  assert.deepEqual(elenco, moduliStatici().filter(m => m !== 'js/app.js'));
  assert.ok(!html.includes('<link rel="modulepreload" href="js/layers/base.js">'), 'niente link statici davanti al paint');
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
