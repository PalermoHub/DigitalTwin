import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';
import { voceFermata, voceLinee } from './scheda-trasporto.js';
import { orariFermata, elencoLinee } from './trasporto-ui.js';
import { giornoIniziale, oggiISO } from './trasporto-orari.js';

// Linee bus/tram e fermate AMAT (GTFS). Strati spenti di default; i layer «hit» trasparenti sono sempre presenti
// (da zoom 13) così la scheda di destra mostra fermate e linee anche a strato spento, come per scuole e seggi.
// I colori delle linee sono quelli ufficiali del feed (route_color).
const COLORE_FERMATA = '#364fc7';
const ZOOM_MIN = 13;
const L = { bus: 'trasporto-bus', tram: 'trasporto-tram', fermate: 'trasporto-fermate', hitLinee: 'trasporto-hit-linee', hitFermate: 'trasporto-hit-fermate' };

const fermate = new Map(); // id -> proprietà complete (le feature di MapLibre trasformano gli array in testo)
const linee = new Map();

// orari.json (≈ 1 MB compresso) si scarica alla prima scheda aperta e poi resta in memoria
let promessaOrari = null;
function caricaOrari() {
  promessaOrari ??= fetch(urlDati('trasporto/orari.json'))
    .then(r => {
      if (!r.ok) throw new Error('file degli orari non raggiungibile');
      return r.json();
    })
    .catch(err => { promessaOrari = null; throw err; }); // un errore non resta in cache: si riprova
  return promessaOrari;
}

const ctx = {
  orari: caricaOrari,
  info: (route, dir) => linee.get(`linea-${route}-${dir}`) ?? { numero: route, colore: '#555555', a: '' },
  nomeFermata: id => fermate.get(id)?.nome ?? id,
};

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Legenda dentro il sotto-pannello del gruppo: sempre visibile, anche a strati spenti.
function creaLegenda(gruppo) {
  const box = el('div', 'legenda legenda-trasporto');
  const voce = (simbolo, testo) => {
    const r = el('div', 'trasporto-legenda-riga');
    r.append(simbolo, testo);
    box.append(r);
  };
  const tratto = classe => { const i = el('i', `trasporto-tratto ${classe}`); i.style.background = '#7B263E'; return i; };
  voce(tratto(''), 'Linea bus (colore AMAT)');
  voce(tratto('trasporto-tratto--tram'), 'Linea tram');
  voce(el('i', 'trasporto-pallino'), 'Fermata (da zoom 13)');
  gruppo.append(box);
}

export default {
  id: 'trasporto',
  titolo: 'Trasporto pubblico',
  aggiungiSorgenti(map) {
    map.addSource('trasporto-linee', { type: 'geojson', data: urlDati('trasporto/linee.geojson') });
    map.addSource('trasporto-fermate', { type: 'geojson', data: urlDati('trasporto/fermate.geojson') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    const spessore = (z1, z2) => ['interpolate', ['linear'], ['zoom'], 11, z1, 17, z2];
    const lineaDi = (id, tipo, min, max) => map.addLayer({
      id, type: 'line', source: 'trasporto-linee', filter: ['==', ['get', 'tipo'], tipo], layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'colore'], 'line-width': spessore(min, max), 'line-opacity': 0.9 },
    });
    lineaDi(L.bus, 'bus', 1.5, 4);
    lineaDi(L.tram, 'tram', 3, 7);
    map.addLayer({
      id: L.fermate, type: 'circle', source: 'trasporto-fermate', minzoom: ZOOM_MIN, layout: nascosto,
      paint: { 'circle-color': '#fff', 'circle-stroke-color': COLORE_FERMATA, 'circle-stroke-width': 2, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 17, 6] },
    });
    // strati trasparenti sempre presenti: la scheda mostra i dati anche a strato spento
    map.addLayer({ id: L.hitLinee, type: 'line', source: 'trasporto-linee', minzoom: ZOOM_MIN, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitFermate, type: 'circle', source: 'trasporto-fermate', minzoom: ZOOM_MIN, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
  },
  async avvia() {
    const [f, l] = await Promise.all(['fermate', 'linee'].map(async n => {
      const r = await fetch(urlDati(`trasporto/${n}.geojson`)); // già in cache: è il file della sorgente
      if (!r.ok) throw new Error(`trasporto/${n}.geojson non raggiungibile`);
      return r.json();
    }));
    for (const x of f.features) fermate.set(x.properties.id, x.properties);
    for (const x of l.features) linee.set(x.properties.id, x.properties);
    if (giornoIniziale({ validita: f.validita }, oggiISO()).fuori) {
      segnala(`Orari del trasporto pubblico validi dal ${f.validita.da} al ${f.validita.a}: oggi sono fuori validità`);
    }
  },
  strati: [
    { id: 'trasporto-bus', etichetta: 'Linee bus', layers: [L.bus], attivo: false },
    { id: 'trasporto-tram', etichetta: 'Linee tram', layers: [L.tram], attivo: false },
    { id: 'trasporto-fermate', etichetta: 'Fermate', layers: [L.fermate], attivo: false },
  ],
  pannello: creaLegenda,
  scheda: {
    layers: [L.hitFermate, L.hitLinee],
    voci(trovati) {
      const visti = new Set();
      const voci = [];
      const sotto = [];
      for (const f of trovati) {
        const id = f.properties.id;
        if (visti.has(id)) continue; // i tile spezzano i tracciati in più frammenti
        visti.add(id);
        if (f.layer.id === L.hitFermate) {
          const p = fermate.get(id) ?? { ...f.properties, linee: [] };
          voci.push(voceFermata(p, orariFermata(id, ctx)));
        } else if (linee.has(id)) sotto.push(linee.get(id));
      }
      // tutte le linee del clic in una sola voce: su una strada principale sono decine
      if (sotto.length) voci.push(voceLinee(sotto, gruppi => elencoLinee(gruppi, ctx)));
      return voci;
    },
  },
};
