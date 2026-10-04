import { urlDati } from '../core/config.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { modelloPopupColonnina, vociColonnine } from './scheda-colonnine.js';
import { graficiColonnine } from './colonnine-grafici.js';
import { applicaSnapshot, scaricaSnapshot } from './colonnine-live.js';

// Colonnine di ricarica di Palermo (dati/colonnine/colonnine.geojson, rigenerato ogni ora da un workflow dalla serie storica
// PalermoHub/evcharginglogsicilia). All'apertura lo stato si aggiorna dallo snapshot remoto: se non risponde resta quello del file.
const SRC = 'colonnine';
const PUNTI = 'colonnine-punti';
const HIT = 'colonnine-hit';
const STATI = [['Disponibile', '#2b8a3e'], ['In ricarica', '#1971c2'], ['Non attiva', '#868e96']];
const CORRENTI = [['AC', 'Corrente alternata (AC, lenta)'], ['DC', 'Corrente continua (DC, veloce)']];

const dettagli = new Map(); // id -> proprietà
const geometrie = new Map();
const completo = p => dettagli.get(p.id) ?? p;
let mappa = null;
let aggiornato = '';
let legenda = null;
const accesi = { stato: new Set(STATI.map(([s]) => s)), corrente: new Set(CORRENTI.map(([c]) => c)) };

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function contenutoPopup(p) {
  const m = modelloPopupColonnina(p);
  const radice = el('div', 'monumento-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  for (const r of m.righe) radice.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
  return radice;
}

function dati() {
  return {
    type: 'FeatureCollection',
    features: [...dettagli].map(([id, p]) => ({ type: 'Feature', geometry: geometrie.get(id), properties: p })),
  };
}

function applicaFiltri() {
  const filtri = [
    filtroInsieme(['get', 'stato'], accesi.stato, STATI.length),
    filtroInsieme(['get', 'corrente'], accesi.corrente, CORRENTI.length),
  ].filter(Boolean);
  const filtro = filtri.length ? ['all', ...filtri] : null;
  for (const id of [PUNTI, HIT]) mappa?.getLayer(id) && mappa.setFilter(id, filtro);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Colonnine di ricarica'));
  const pallino = col => { const p = el('i', 'monumenti-pallino'); p.style.background = col; return p; };
  for (const [nome, col] of STATI) {
    legenda.append(voceFiltro(pallino(col), nome, acceso => { acceso ? accesi.stato.add(nome) : accesi.stato.delete(nome); applicaFiltri(); }));
  }
  const tipi = el('div');
  for (const [sigla, nome] of CORRENTI) {
    tipi.append(voceFiltro(pallino('#fff'), nome, acceso => { acceso ? accesi.corrente.add(sigla) : accesi.corrente.delete(sigla); applicaFiltri(); }));
  }
  legenda.append(tipi);
  legenda.append(el('p', 'uffici-nota', 'Stato dal vivo dalla Piattaforma Unica Nazionale (GSE)'));
  document.getElementById('legende').append(legenda);
}

// Stato aggiornato dallo snapshot remoto: errori di rete non toccano il ripiego del file.
async function aggiornaDalVivo() {
  try {
    const r = applicaSnapshot(dettagli, await scaricaSnapshot());
    if (!r) return;
    aggiornato = r.aggiornato || aggiornato;
    mappa?.getSource(SRC)?.setData(dati());
  } catch (e) {
    console.warn('Colonnine: stato dal vivo non disponibile, uso il file del repository.', e);
  }
}

export default {
  id: 'colonnine',
  titolo: 'Colonnine di ricarica',
  argomento: { titolo: 'Colonnine di ricarica', descrizione: 'Colonnine per veicoli elettrici di Palermo, con stato dal vivo, potenza e operatore.' },
  gruppo: 'territorio',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('colonnine/colonnine.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, layout: { visibility: 'none' },
      paint: {
        'circle-color': ['match', ['get', 'stato'], ...STATI.flat(), '#555'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 8],
      },
    });
    // punti trasparenti sempre presenti: la scheda del luogo mostra le colonnine vicine anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      popup?.remove();
      if (!f) return;
      popup = new maplibregl.Popup({ maxWidth: '280px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(f.geometry.coordinates).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
    });
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
  },
  async avvia() {
    const fc = await (await fetch(urlDati('colonnine/colonnine.geojson'))).json(); // già in cache: è il file della sorgente
    aggiornato = fc.aggiornato ?? '';
    for (const f of fc.features) {
      dettagli.set(f.properties.id, { ...f.properties });
      geometrie.set(f.properties.id, f.geometry);
    }
    aggiornaDalVivo(); // senza attendere: la mappa parte subito con il file
  },
  scheda: {
    layers: [HIT],
    voci(trovati) { // tutte le colonnine sotto il clic in una sola sezione
      const viste = new Map();
      for (const f of trovati) { const p = completo(f.properties); viste.set(p.id, p); }
      return vociColonnine([...viste.values()], aggiornato, () => graficiColonnine([...dettagli.values()]));
    },
  },
  strati: [{
    id: 'colonnine', etichetta: 'Colonnine di ricarica', layers: [PUNTI], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
};
