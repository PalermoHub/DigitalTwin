// tests/js/aggiungi-controllo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaControllo } from '../../js/aggiungi/controllo.js';
import { leggiServizi, TETTO_SERVIZI } from '../../js/aggiungi/salvati.js';

const WMS = `<WMS_Capabilities version="1.3.0"><Capability><Request><GetMap><Format>image/png</Format></GetMap></Request>
<Layer><CRS>EPSG:3857</CRS><Layer><Name>pai</Name><Title>Piano PAI</Title></Layer><Layer><Name>rischio</Name><Title>Rischio</Title></Layer></Layer></Capability></WMS_Capabilities>`;
const WFS = '<WFS_Capabilities version="2.0.0"><FeatureTypeList><FeatureType><Name>ns:strade</Name><Title>Strade</Title></FeatureType></FeatureTypeList></WFS_Capabilities>';

const finto = () => { const m = new Map(); return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } }; };
function costruisci({ testo = WMS, wfsEsito = async () => 'miei-id', storage = finto() } = {}) {
  const chiamate = { tile: [], wms: [], wfs: [], fetch: [] };
  const host = {
    fetchArrayBuffer: async u => { chiamate.fetch.push(u); return new TextEncoder().encode(testo).buffer; },
    addTileLayer: (n, u) => { chiamate.tile.push([n, u]); return 'miei-t'; },
    addWmsLayer: (n, o) => { chiamate.wms.push([n, o]); return 'miei-w'; },
    addWfsLayer: async (n, r) => { chiamate.wfs.push([n, r]); return wfsEsito(n, r); },
  };
  return { c: creaControllo({ host, storage }), chiamate, storage };
}

test('leggiServizio WMS: chiede le capabilities e dà layer, versione e URL pulito', async () => {
  const { c, chiamate } = costruisci();
  const r = await c.leggiServizio('wms', 'https://x.it/ows?map=a&request=GetCapabilities');
  assert.equal(r.url, 'https://x.it/ows?map=a');
  assert.equal(r.versione, '1.3.0');
  assert.deepEqual(r.layer.map(l => l.nome), ['pai', 'rischio']);
  assert.match(chiamate.fetch[0], /REQUEST=GetCapabilities/);
  await assert.rejects(() => c.leggiServizio('wms', 'http://x.it/ows'), /https/);
});

test('aggiungiXyz: layer in mappa e servizio salvato; URL non valido → errore e niente salvato', () => {
  const { c, chiamate, storage } = costruisci();
  assert.deepEqual(c.aggiungiXyz({ nome: 'Ortofoto', url: 'https://t.it/{z}/{x}/{y}.png' }), { pieno: false });
  assert.deepEqual(chiamate.tile, [['Ortofoto', 'https://t.it/{z}/{x}/{y}.png']]);
  assert.equal(leggiServizi(storage).servizi[0].tipo, 'xyz');
  assert.throws(() => c.aggiungiXyz({ nome: 'X', url: 'https://t.it/tile.png' }), /\{z\}/);
  assert.equal(chiamate.tile.length, 1);
  assert.equal(leggiServizi(storage).servizi.length, 1);
});

test('aggiungiXyz senza nome: vale il nome dell’host', () => {
  const { c, chiamate } = costruisci();
  c.aggiungiXyz({ nome: '  ', url: 'https://t.it/{z}/{x}/{y}.png' });
  assert.equal(chiamate.tile[0][0], 't.it');
});

test('aggiungiWms: un layer per scelta, con le opzioni del servizio; salvato con le voci', async () => {
  const { c, chiamate, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  const r = await c.aggiungiWms({ nome: 'Servizio PAI', url: servizio.url, servizio, scelti: [servizio.layer[0]] });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.equal(chiamate.wms.length, 1);
  assert.deepEqual([chiamate.wms[0][0], chiamate.wms[0][1].layers, chiamate.wms[0][1].version, chiamate.wms[0][1].format], ['Piano PAI', 'pai', '1.3.0', 'image/png']);
  const salvato = leggiServizi(storage).servizi[0];
  assert.deepEqual([salvato.tipo, salvato.nome, salvato.voci.length], ['wms', 'Servizio PAI', 1]);
});

test('aggiungiWms: un layer non supportato (niente EPSG:3857) non si aggiunge ma non rompe gli altri', async () => {
  const { c, chiamate } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  const scelti = [{ ...servizio.layer[0], supportato: false }, servizio.layer[1]];
  const r = await c.aggiungiWms({ nome: '', url: servizio.url, servizio, scelti });
  assert.equal(chiamate.wms.length, 1);
  assert.equal(r.errori.length, 1);
  assert.match(r.errori[0].messaggio, /3857/);
});

test('aggiungiWfs: costruisce il GetFeature con bbox di Palermo e tetto, salva le voci riuscite; un errore non ferma gli altri', async () => {
  const esito = async n => { if (n === 'Rotto') throw new Error('il servizio non produce GeoJSON'); return 'miei-ok'; };
  const { c, chiamate, storage } = costruisci({ testo: WFS, wfsEsito: esito });
  const servizio = await c.leggiServizio('wfs', 'https://x.it/wfs');
  const r = await c.aggiungiWfs({ nome: 'Strade', url: servizio.url, servizio, scelti: [servizio.tipi[0], { nome: 'ns:rotto', titolo: 'Rotto' }] });
  assert.equal(chiamate.wfs.length, 2);
  assert.match(chiamate.wfs[0][1], /typeNames=ns%3Astrade/);
  assert.match(chiamate.wfs[0][1], /count=5001/);
  assert.deepEqual(r.errori, [{ nome: 'Rotto', messaggio: 'il servizio non produce GeoJSON' }]);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 1);
});

test('aggiungiWfs: se tutto fallisce non si salva alcun servizio', async () => {
  const { c, storage } = costruisci({ testo: WFS, wfsEsito: async () => { throw new Error('più di 5000 elementi'); } });
  const servizio = await c.leggiServizio('wfs', 'https://x.it/wfs');
  const r = await c.aggiungiWfs({ nome: 'S', url: servizio.url, servizio, scelti: servizio.tipi });
  assert.equal(r.errori.length, 1);
  assert.equal(leggiServizi(storage).servizi.length, 0);
});

test('riaggiungi: rimette in mappa le voci salvate senza rileggere il servizio; due volte non duplica il servizio', async () => {
  const { c, chiamate, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer });
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer });
  assert.equal(leggiServizi(storage).servizi.length, 1);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 2);
  const fetchPrima = chiamate.fetch.length;
  const id = leggiServizi(storage).servizi[0].id;
  const r = await c.riaggiungi(id);
  assert.deepEqual(r, { errori: [] });
  assert.equal(chiamate.fetch.length, fetchPrima);
  assert.equal(chiamate.wms.length, 2 + 2 + 2);
});

test('rimuovi toglie il servizio dai salvati e avvisa chi ascolta', () => {
  const { c, storage } = costruisci();
  let avvisi = 0;
  c.suCambio(() => { avvisi++; });
  c.aggiungiXyz({ nome: 'A', url: 'https://t.it/{z}/{x}/{y}.png' });
  c.rimuovi(c.stato().servizi[0].id);
  assert.equal(leggiServizi(storage).servizi.length, 0);
  assert.equal(avvisi, 2);
});

test('al 51° servizio il layer entra in mappa ma il servizio non si salva: pieno true', () => {
  const { c, chiamate } = costruisci();
  for (let i = 0; i < TETTO_SERVIZI; i++) c.aggiungiXyz({ nome: `T${i}`, url: `https://t${i}.it/{z}/{x}/{y}.png` });
  assert.deepEqual(c.aggiungiXyz({ nome: 'Extra', url: 'https://extra.it/{z}/{x}/{y}.png' }), { pieno: true });
  assert.equal(chiamate.tile.length, TETTO_SERVIZI + 1);
  assert.equal(c.stato().servizi.length, TETTO_SERVIZI);
});

test('storage bloccato: tutto funziona per la sessione senza eccezioni', () => {
  const rotto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); } };
  const { c, chiamate } = costruisci({ storage: rotto });
  assert.doesNotThrow(() => c.aggiungiXyz({ nome: 'A', url: 'https://t.it/{z}/{x}/{y}.png' }));
  assert.equal(chiamate.tile.length, 1);
  assert.equal(c.stato().servizi.length, 1);
});
