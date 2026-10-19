import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

// sw.js è uno script classico (non un modulo): si carica in un contesto isolato, come fa il browser.
const sorgente = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
// Cache API e fetch finti: salvano copie dei byte, come fa il browser, e contano le chiamate alla rete.
function nuovaCacheFinta() {
  const voci = new Map();
  return {
    async match(chiave) {
      const v = voci.get(String(chiave.url ?? chiave));
      return v ? new Response(v.corpo.slice(0), { status: v.stato, headers: v.intestazioni }) : undefined;
    },
    async put(chiave, risposta) { voci.set(String(chiave.url ?? chiave), { corpo: await risposta.arrayBuffer(), stato: risposta.status, intestazioni: [...risposta.headers] }); },
    async keys() { return [...voci.keys()].map(url => ({ url })); },
    async delete(chiave) { return voci.delete(String(chiave.url ?? chiave)); },
  };
}
const cacheFinte = new Map();
const rete = { chiamate: 0, prossima: null };
const contesto = {
  module: { exports: {} }, URL, Request, Headers, Response,
  caches: { open: async nome => { if (!cacheFinte.has(nome)) cacheFinte.set(nome, nuovaCacheFinta()); return cacheFinte.get(nome); } },
  fetch: async (...a) => { rete.chiamate++; return rete.prossima(...a); },
};
vm.createContext(contesto);
vm.runInContext(sorgente, contesto);
const { strategia, VERSIONE, PRECACHE, leggiIntervallo, intervalliPoiRete } = contesto.module.exports;

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
  assert.equal(strategia(r('dati/pai/pai.pmtiles'), ORIGINE), 'ignora', 'senza Range: file intero, sempre dalla rete');
  assert.equal(strategia(r('media/guida/guida.mp4'), ORIGINE), 'ignora');
  assert.equal(strategia(r('media/guida/guida.mp4', { intestazioni: { Range: 'bytes=0-999' } }), ORIGINE), 'ignora', 'i video non sono PMTiles');
  assert.equal(strategia(r('https://gbvitrano.github.io/palermo_popolazione/data/edificato.pmtiles'), ORIGINE), 'ignora');
  assert.equal(strategia(r('https://tiles.openfreemap.org/planet/x.pbf'), ORIGINE), 'ignora');
});

test('precache: i file elencati esistono (o sono la radice)', () => {
  assert.match(VERSIONE, /^dt-v\d+$/);
  for (const f of PRECACHE) if (f !== './') assert.ok(existsSync(new URL(`../../${f}`, import.meta.url)), `manca ${f}`);
});

test('strategia: i PMTiles a intervalli di byte dei nostri host si tengono in cache', () => {
  const range = { Range: 'bytes=0-16383' };
  assert.equal(strategia(r('dati/pai/pai.pmtiles', { intestazioni: range }), ORIGINE), 'intervalli');
  assert.equal(strategia(r('https://gbvitrano.github.io/palermo_popolazione/data/edificato.pmtiles', { intestazioni: range }), ORIGINE), 'intervalli');
  assert.equal(strategia(r('https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles', { intestazioni: range }), ORIGINE), 'intervalli');
  assert.equal(strategia(r('https://altro.example.org/x.pmtiles', { intestazioni: range }), ORIGINE), 'ignora', 'host non nostro');
  assert.equal(strategia(r('https://tiles.openfreemap.org/planet/x.pbf', { intestazioni: range }), ORIGINE), 'ignora');
  assert.equal(strategia(r('dati/pai/pai.pmtiles', { intestazioni: { Range: 'bytes=100-' } }), ORIGINE), 'ignora', 'intervallo aperto: non si sa quanto pesa');
});

test('leggiIntervallo: solo intervalli chiusi e singoli', () => {
  assert.deepEqual({ ...leggiIntervallo('bytes=0-16383') }, { inizio: 0, fine: 16383 });
  assert.deepEqual({ ...leggiIntervallo('bytes=500-999') }, { inizio: 500, fine: 999 });
  for (const x of ['bytes=5-', 'bytes=-5', 'bytes=0-9,20-29', 'bytes=9-3', 'items=0-9', '', null]) assert.equal(leggiIntervallo(x), null, String(x));
});

// risposta della «rete» per un file di 100 byte: ogni byte vale il suo indice
const rispostaRete = (richiesta, etag = '"v1"') => {
  const { inizio, fine } = leggiIntervallo(richiesta.headers.get('range'));
  const corpo = Uint8Array.from({ length: fine - inizio + 1 }, (_, i) => inizio + i);
  return new Response(corpo, { status: 206, headers: { 'content-range': `bytes ${inizio}-${fine}/100`, etag, 'content-type': 'application/octet-stream' } });
};
const intervallo = (url, range) => new Request(url, { headers: { Range: range } });
const URL_PM = 'https://gbvitrano.github.io/palermo_popolazione/data/edificato.pmtiles';
const nuovoScenario = () => { cacheFinte.clear(); rete.chiamate = 0; rete.prossima = rispostaRete; };

test('intervalli: la seconda richiesta uguale non va in rete e rifà una 206 corretta', async () => {
  nuovoScenario();
  const a = await intervalliPoiRete(intervallo(URL_PM, 'bytes=10-14'));
  assert.equal(a.status, 206);
  assert.equal(rete.chiamate, 1);
  const b = await intervalliPoiRete(intervallo(URL_PM, 'bytes=10-14'));
  assert.equal(rete.chiamate, 1, 'servita dalla copia');
  assert.equal(b.status, 206);
  assert.equal(b.headers.get('content-range'), 'bytes 10-14/100');
  assert.equal(b.headers.get('content-length'), '5');
  assert.equal(b.headers.get('etag'), '"v1"');
  assert.deepEqual([...new Uint8Array(await b.arrayBuffer())], [10, 11, 12, 13, 14]);
});

test('intervalli: intervalli diversi sono voci diverse', async () => {
  nuovoScenario();
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'));
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=4-7'));
  assert.equal(rete.chiamate, 2);
});

test('intervalli: oltre le 24 ore si chiede di nuovo alla rete', async () => {
  nuovoScenario();
  const t0 = Date.now();
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'), { ora: t0 });
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'), { ora: t0 + 23 * 3600e3 });
  assert.equal(rete.chiamate, 1);
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'), { ora: t0 + 25 * 3600e3 });
  assert.equal(rete.chiamate, 2);
});

test('intervalli: se il file cambia (ETag nuovo) le copie vecchie dello stesso file si buttano', async () => {
  nuovoScenario();
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'));
  rete.prossima = q => rispostaRete(q, '"v2"');
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=4-7'));
  const prima = rete.chiamate;
  const c = await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'));
  assert.equal(rete.chiamate, prima + 1, 'la copia «v1» non c\'è più');
  assert.equal(c.headers.get('etag'), '"v2"');
});

test('intervalli: senza rete si usa anche una copia scaduta', async () => {
  nuovoScenario();
  const t0 = Date.now();
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'), { ora: t0 });
  rete.prossima = () => { throw new TypeError('offline'); };
  const r2 = await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'), { ora: t0 + 48 * 3600e3 });
  assert.equal(r2.status, 206);
  assert.deepEqual([...new Uint8Array(await r2.arrayBuffer())], [0, 1, 2, 3]);
  await assert.rejects(() => intervalliPoiRete(intervallo(URL_PM, 'bytes=50-53'), { ora: t0 }), /offline/, 'senza copia l\'errore resta');
});

test('intervalli: una risposta che non è 206 non si salva', async () => {
  nuovoScenario();
  rete.prossima = () => new Response('tutto il file', { status: 200 });
  const a = await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'));
  assert.equal(a.status, 200);
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'));
  assert.equal(rete.chiamate, 2);
});

test('intervalli: oltre il limite si tolgono le copie più vecchie, mai la voce dell\'ETag', async () => {
  nuovoScenario();
  const opzioni = { max: 2 };
  for (const r of ['bytes=0-3', 'bytes=4-7', 'bytes=8-11']) await intervalliPoiRete(intervallo(URL_PM, r), opzioni);
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=8-11'), opzioni);
  assert.equal(rete.chiamate, 3, 'le due più recenti restano');
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=0-3'), opzioni);
  assert.equal(rete.chiamate, 4, 'la più vecchia è stata tolta');
  rete.prossima = q => rispostaRete(q, '"v2"');
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=20-23'), opzioni);
  const prima = rete.chiamate;
  await intervalliPoiRete(intervallo(URL_PM, 'bytes=8-11'), opzioni);
  assert.equal(rete.chiamate, prima + 1, 'con l\'ETag cambiato anche le vecchie sono scartate: l\'ETag non era stato eliminato');
});

test('strategia: l\'indice della guida del Chat bot è un file statico (anche offline dopo il primo uso)', () => {
  assert.equal(strategia(r('guida/indice.json'), ORIGINE), 'statico');
  assert.equal(strategia(r('guida/indice.en.json'), ORIGINE), 'statico');
});
