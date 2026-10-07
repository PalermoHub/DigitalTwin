import test from 'node:test';
import assert from 'node:assert/strict';
import { creaDifferiti } from '../../js/core/differiti.js';

// Mappa finta: tiene sorgenti ed eventi, e carica i dati solo quando si chiama `completa(id)`.
function mappaFinta() {
  const sorgenti = new Map();
  const caricate = new Set();
  const ascoltatori = new Set();
  return {
    sorgenti, caricate,
    addSource(id, spec) { sorgenti.set(id, { spec, setData(d) { this.spec = { ...this.spec, data: d }; caricate.delete(id); } }); },
    getSource: id => sorgenti.get(id),
    isSourceLoaded: id => caricate.has(id),
    on(ev, f) { if (ev === 'sourcedata') ascoltatori.add(f); },
    off(ev, f) { ascoltatori.delete(f); },
    completa(id) { caricate.add(id); for (const f of [...ascoltatori]) f(); },
    ascoltatori,
  };
}

function modulo(id, urlGeojson, extra = {}) {
  const chiamate = { avvia: 0 };
  return {
    chiamate,
    id,
    strati: [{ id, suCambio() { chiamate.suCambio = (chiamate.suCambio ?? 0) + 1; } }],
    aggiungiSorgenti(map) {
      map.addSource(id, { type: 'geojson', data: urlGeojson });
      map.addSource(`${id}-tile`, { type: 'vector', url: 'pmtiles://x' });
    },
    avvia() { chiamate.avvia++; return extra.avvia?.(); },
  };
}

test('le sorgenti GeoJSON nascono vuote e le altre restano com\'erano', () => {
  const map = mappaFinta();
  creaDifferiti(map).aggiungi(modulo('alberi', 'dati/alberi.geojson'));
  assert.deepEqual(map.sorgenti.get('alberi').spec.data, { type: 'FeatureCollection', features: [] });
  assert.equal(map.sorgenti.get('alberi-tile').spec.url, 'pmtiles://x');
  assert.equal(Object.hasOwn(map, 'addSource'), true);
  assert.equal(map.addSource.name, 'addSource'); // la mappa non è stata sostituita né modificata
});

test('i dati partono una volta sola, alla prima accensione dello strato', () => {
  const map = mappaFinta();
  const m = modulo('alberi', 'dati/alberi.geojson');
  creaDifferiti(map).aggiungi(m);
  m.strati[0].suCambio(false, map);
  assert.equal(m.chiamate.avvia, 0);
  m.strati[0].suCambio(true, map);
  m.strati[0].suCambio(true, map);
  assert.equal(m.chiamate.avvia, 1);
  assert.equal(map.sorgenti.get('alberi').spec.data, 'dati/alberi.geojson');
  assert.equal(m.chiamate.suCambio, 3); // il suCambio originale continua a funzionare
});

test('tutti(): attende l\'evento sourcedata, una promessa sola per tutti i chiamanti', async () => {
  const map = mappaFinta();
  const d = creaDifferiti(map, { attesaMax: 5000 });
  d.aggiungi(modulo('alberi', 'a.geojson'));
  d.aggiungi(modulo('scuole', 'b.geojson'));
  const p1 = d.tutti(), p2 = d.tutti();
  assert.equal(p1, p2);
  let finita = false;
  p1.then(() => { finita = true; });
  await new Promise(r => setTimeout(r, 250));
  map.completa('alberi');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(finita, false, 'manca ancora una sorgente');
  map.completa('scuole');
  await p1;
  assert.equal(map.ascoltatori.size, 0, 'l\'ascoltatore viene tolto');
});

test('tutti(): dopo il tempo massimo risponde comunque', async () => {
  const map = mappaFinta();
  const d = creaDifferiti(map, { attesaMax: 80 });
  d.aggiungi(modulo('alberi', 'a.geojson'));
  await d.tutti();
  assert.equal(map.ascoltatori.size, 0);
});

test('un errore in avvia() viene segnalato e non blocca gli altri', async () => {
  const map = mappaFinta();
  const messaggi = [];
  const d = creaDifferiti(map, { segnala: m => messaggi.push(m), attesaMax: 50 });
  d.aggiungi(modulo('alberi', 'a.geojson', { avvia: () => Promise.reject(new Error('rete')) }));
  d.aggiungi(modulo('scuole', 'b.geojson'));
  await d.tutti();
  assert.deepEqual(messaggi, ['Strato non caricato: rete']);
});
