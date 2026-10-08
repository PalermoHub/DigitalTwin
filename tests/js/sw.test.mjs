import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

// sw.js è uno script classico (non un modulo): si carica in un contesto isolato, come fa il browser.
const sorgente = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
const contesto = { module: { exports: {} }, URL, Request, Headers };
vm.createContext(contesto);
vm.runInContext(sorgente, contesto);
const { strategia, VERSIONE, PRECACHE } = contesto.module.exports;

const ORIGINE = 'https://esempio.it';
const r = (percorso, { metodo = 'GET', modo = 'no-cors', intestazioni = {} } = {}) => {
  const q = new Request(percorso.startsWith('http') ? percorso : `${ORIGINE}/${percorso}`, { method: metodo, headers: intestazioni });
  return Object.defineProperty(q, 'mode', { value: modo });
};

test('strategia: la pagina si chiede alla rete prima', () => {
  assert.equal(strategia(r('', { modo: 'navigate' }), ORIGINE), 'pagina');
  assert.equal(strategia(r('?scheda=38.1,13.3', { modo: 'navigate' }), ORIGINE), 'pagina');
});

test('strategia: i dati dell\'app rete prima, i file statici copia salvata', () => {
  assert.equal(strategia(r('dati/colonnine/colonnine.geojson'), ORIGINE), 'dati');
  assert.equal(strategia(r('dati/catalogo.json'), ORIGINE), 'dati');
  assert.equal(strategia(r('js/locales/en.json'), ORIGINE), 'dati', 'i dizionari delle lingue: rete prima, così non restano indietro rispetto al codice');
  for (const f of ['js/app.js', 'css/app.css', 'img/logo-palermo-digital-twin.svg', 'manifest.webmanifest']) assert.equal(strategia(r(f), ORIGINE), 'statico', f);
});

test('strategia: non si tocca ciò che la cache non sa gestire', () => {
  assert.equal(strategia(r('dati/x.json', { metodo: 'POST' }), ORIGINE), 'ignora');
  assert.equal(strategia(r('dati/pai/pai.pmtiles', { intestazioni: { Range: 'bytes=0-16383' } }), ORIGINE), 'ignora');
  assert.equal(strategia(r('dati/pai/pai.pmtiles'), ORIGINE), 'ignora');
  assert.equal(strategia(r('media/guida/guida.mp4'), ORIGINE), 'ignora');
  assert.equal(strategia(r('https://gbvitrano.github.io/palermo_popolazione/data/edificato.pmtiles'), ORIGINE), 'ignora');
  assert.equal(strategia(r('https://tiles.openfreemap.org/planet/x.pbf'), ORIGINE), 'ignora');
});

test('precache: i file elencati esistono (o sono la radice)', () => {
  assert.match(VERSIONE, /^dt-v\d+$/);
  for (const f of PRECACHE) if (f !== './') assert.ok(existsSync(new URL(`../../${f}`, import.meta.url)), `manca ${f}`);
});
