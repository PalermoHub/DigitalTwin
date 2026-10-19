// Menu del sito: una sola definizione (js/core/menu-sito.js), le pagine statiche hanno solo il <nav> vuoto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { menuHtml, paginaCorrente } from '../../js/core/menu-sito.js';

const PAGINE = ['home', 'about', 'guida', 'fonti', 'privacy', 'plugin', 'geoimage', 'digitaltwin', 'presentazione'];

test('il menu elenca tutte le pagine del sito', () => {
  const href = [...menuHtml().matchAll(/<a [^>]*href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(href, ['home.html', 'index.html', 'digitaltwin.html', 'guida.html', 'plugin.html', 'geoimage.html', 'fonti.html', 'about.html', 'presentazione.html', 'privacy.html']);
});

test('ogni voce è traducibile', () => {
  for (const m of menuHtml().matchAll(/<a [^>]*>/g)) assert.match(m[0], /data-i18n="[^"]+"/);
});

test('la pagina corrente si ricava dall’URL', () => {
  assert.equal(paginaCorrente('/DigitalTwin/guida.html'), 'guida.html');
  assert.equal(paginaCorrente('/DigitalTwin/'), 'index.html');
});

test('le pagine hanno il <nav id="menu-info"> vuoto: le voci non si copiano negli HTML', () => {
  for (const p of PAGINE) {
    const html = readFileSync(new URL(`../../${p}.html`, import.meta.url), 'utf8');
    assert.match(html, /<nav id="menu-info"[^>]*><\/nav>/, p);
  }
});
