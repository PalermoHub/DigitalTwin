// tests/js/aggiungi-host.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaHost, TETTO_WFS } from '../../js/rndt/host.js';
import { archivioInMemoria } from '../../js/rndt/dati.js';

const PROXY = 'https://proxy.test';
const RICHIESTA = 'https://wfs.example.org/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typeNames=ns%3Astrade&outputFormat=application%2Fjson&count=5001&bbox=37.9785%2C13.1%2C38.2919%2C13.55%2Curn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A4326';

function mappaFinta() {
  const sorgenti = new Map(), strati = new Map();
  return {
    sorgenti, strati,
    addSource: (id, s) => sorgenti.set(id, s), removeSource: id => sorgenti.delete(id), getSource: id => sorgenti.get(id),
    addLayer: l => strati.set(l.id, l), removeLayer: id => strati.delete(id), getLayer: id => strati.get(id),
    setLayoutProperty() {}, getBounds: () => ({ getWest: () => 13, getSouth: () => 38, getEast: () => 13.4, getNorth: () => 38.2 }),
    fitBounds() {}, queryRenderedFeatures: () => [], on() {},
  };
}
const corpo = testo => ({ ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(testo).buffer });
const punti = n => JSON.stringify({ type: 'FeatureCollection', features: Array.from({ length: n }, () => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [13.36, 38.11] } })) });
const costruisci = (testoRisposta, extra = {}) => {
  const map = mappaFinta(), scritti = [], chiamate = [], avvisi = [];
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return true; },
    notifica: m => avvisi.push(m), archivioDati: archivioInMemoria(), prefisso: 'miei', etichetta: 'aggiunti',
    fetchFn: async u => { chiamate.push(u); return corpo(testoRisposta); },
  });
  return { host, map, scritti, chiamate, avvisi };
};

test('il prefisso dà gli id di sorgenti e layer in mappa', () => {
  const { host, map } = costruisci('{}');
  const id = host.addTileLayer('XYZ', 'https://a.it/{z}/{x}/{y}.png', {});
  assert.ok(id.startsWith('miei-'));
  assert.ok(map.sorgenti.has(id) && map.strati.has(id));
});

test('addWfsLayer: scarica dal proxy, mette il layer in mappa e lo salva con l’URL', async () => {
  const { host, map, scritti, chiamate } = costruisci(punti(3));
  const id = await host.addWfsLayer('Strade', RICHIESTA);
  assert.ok(id.startsWith('miei-'));
  assert.ok(chiamate[0].startsWith('https://proxy.test/t/wfs.example.org/ows?'));
  assert.equal(map.sorgenti.get(id).data.features.length, 3);
  const salvato = scritti.at(-1).layers[0];
  assert.deepEqual([salvato.tipo, salvato.nome, salvato.sorgente.url], ['geojson', 'Strade', RICHIESTA]);
});

test('addWfsLayer: lo stesso servizio due volte non scarica né duplica', async () => {
  const { host, map, chiamate } = costruisci(punti(2));
  const a = await host.addWfsLayer('Strade', RICHIESTA);
  const b = await host.addWfsLayer('Strade', RICHIESTA);
  assert.equal(a, b);
  assert.equal(chiamate.length, 1);
  assert.equal(host.elenco().length, 1);
  assert.equal(map.sorgenti.size, 1);
});

test('addWfsLayer: oltre il tetto, risposta non JSON o vuota → errore e niente in mappa né salvato', async () => {
  const grande = costruisci(punti(TETTO_WFS + 1));
  await assert.rejects(() => grande.host.addWfsLayer('G', RICHIESTA), /più di 5000/);
  const xml = costruisci('<ows:ExceptionReport/>');
  await assert.rejects(() => xml.host.addWfsLayer('X', RICHIESTA), /non produce GeoJSON/);
  const vuoto = costruisci(punti(0));
  await assert.rejects(() => vuoto.host.addWfsLayer('V', RICHIESTA), /nessun elemento/);
  for (const c of [grande, xml, vuoto]) {
    assert.equal(c.map.sorgenti.size, 0);
    assert.equal(c.scritti.length, 0);
    assert.equal(c.host.elenco().length, 0);
  }
});

test('un WFS salvato torna con ripristina, riscaricando dall’URL', async () => {
  const stato = { v: 1, layers: [{ id: 'miei-xyz', tipo: 'geojson', nome: 'Strade', visibile: true, sorgente: { url: RICHIESTA } }] };
  const { host, map, chiamate } = costruisci(punti(4), { stato });
  await host.ripristina();
  assert.equal(chiamate.length, 1);
  assert.equal(host.elenco().length, 1);
  assert.equal(host.elenco()[0].indisponibile, false);
  assert.equal([...map.sorgenti.values()][0].data.features.length, 4);
});

test('un WFS che non risponde più resta nell’elenco come non disponibile', async () => {
  const stato = { v: 1, layers: [{ id: 'miei-xyz', tipo: 'geojson', nome: 'Strade', visibile: true, sorgente: { url: RICHIESTA } }] };
  const map = mappaFinta();
  const host = creaHost({ map, proxy: PROXY, stato, scrivi: () => true, prefisso: 'miei', archivioDati: archivioInMemoria(), fetchFn: async () => ({ ok: false, status: 502 }) });
  await host.ripristina();
  assert.equal(host.elenco()[0].indisponibile, true);
});
