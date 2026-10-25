import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { occhio } from '../core/pannello.js';
import { voceFiltro } from '../core/legenda.js';
import { CATEGORIE, COLORE_ALTRO, coloreCategoria, modelloPopupNave, voceNave } from './scheda-navi.js';
import { contenutoPopupTraffico, ancoraPopupTraffico, rifinisciPopupTraffico, centraPopupTraffico } from './popup-traffico.js';
import { tl, t } from '../core/i18n.js';
import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';
import { scegliProxy } from '../rndt/proxy.js';

// Navi attorno alla Sicilia (AIS terrestre). I dati non stanno nel repository: li serve il Worker (/navi), che ogni 5 minuti ascolta
// AISStream e conserva l'ultima posizione di ogni nave vista negli ultimi 30 minuti. Il layer li ricarica ogni 2 minuti finché è acceso.
const SRC = 'navi';
const ICONA = 'nave'; // in mappa è la sagoma dell'icona, ruotata secondo la rotta (vedi core/icone-mappa.js)
const PUNTI = 'navi-punti';
const CLUSTER = 'navi-cluster';
const CLUSTER_N = 'navi-cluster-n';
const CLUSTER_MAX_ZOOM = 12; // dallo zoom 13 ogni nave ha la sua icona; prima le vicine (porti) sono un solo cerchio col numero
const singola = ['!', ['has', 'point_count']];
const HIT = 'navi-hit'; // punti trasparenti, sempre presenti: la scheda mostra la nave sotto il clic anche a strato spento
const INTERVALLO_MS = 2 * 60 * 1000;
const VUOTO = { type: 'FeatureCollection', features: [] };
const urlNavi = () => `${scegliProxy(location.search, location.hostname)}/navi`;

let navi = []; // tutte le navi dell'ultimo scarico, per ricalcolare i gruppi quando la legenda spegne una categoria
const dettagli = new Map(); // id -> proprietà complete
const completo = p => dettagli.get(p.id) ?? p;
let mappa = null;
let legenda = null;
let nota = null;
let timer = null;
let ultimo = 0;
let acceso = false;
const accesi = new Set(CATEGORIE.map(([c]) => c));
const caselle = new Map(); // categoria -> { pannello, legenda }

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function scriviNota(aggiornato) {
  if (!nota) return;
  nota.textContent = aggiornato ? t('navi.aggiornato', { n: dettagli.size }) : t('navi.nonDisponibile');
}

// Scarica le navi dal Worker; se non risponde restano quelle di prima.
async function aggiorna() {
  try {
    const r = await fetch(urlNavi());
    if (!r.ok) throw new Error(String(r.status));
    const fc = await r.json();
    dettagli.clear();
    for (const f of fc.features) dettagli.set(f.properties.id, f.properties);
    navi = fc.features;
    alimenta();
    ultimo = Date.now();
    scriviNota(fc.aggiornato);
  } catch {
    if (!dettagli.size) scriviNota(null);
  }
}

function pianifica() {
  clearInterval(timer);
  timer = null;
  if (acceso && !document.hidden) timer = setInterval(aggiorna, INTERVALLO_MS);
}

// i gruppi contano solo le categorie accese: si rialimenta la sorgente con le navi filtrate
function alimenta() {
  mappa?.getSource(SRC)?.setData({ type: 'FeatureCollection', features: navi.filter(f => accesi.has(f.properties.categoria)) });
}

function impostaFiltro(categoria, on, origine) {
  on ? accesi.add(categoria) : accesi.delete(categoria);
  const c = caselle.get(categoria);
  if (c) for (const [dove, casella] of Object.entries(c)) if (dove !== origine && casella) casella.checked = on;
  alimenta();
}

const pallino = col => simboloGlifo(ICONA, col);

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-navi');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Navi'));
  for (const [categoria, col] of CATEGORIE) {
    const riga = voceFiltro(pallino(col), categoria, on => impostaFiltro(categoria, on, 'legenda'));
    caselle.set(categoria, { ...caselle.get(categoria), legenda: riga._filtro.casella });
    legenda.append(riga);
  }
  nota = el('p', 'uffici-nota');
  legenda.append(nota);
  document.getElementById('legende').append(legenda);
}

// Sotto la voce dello strato: i filtri per categoria, attivi solo con lo strato acceso.
function creaPannello(gruppo) {
  creaLegenda();
  const blocco = el('div', 'colonnine-filtri');
  blocco.append(el('h3', null, 'Categoria'));
  for (const [categoria, col] of CATEGORIE) {
    const label = el('label', 'sotto-voce');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.disabled = true; // si abilita con lo strato acceso
    cb.dataset.filtro = `categoria:${categoria}`;
    cb.addEventListener('change', () => impostaFiltro(categoria, cb.checked, 'pannello'));
    label.append(cb, occhio(), ' ', pallino(col), ' ', tl(categoria));
    blocco.append(label);
    caselle.set(categoria, { ...caselle.get(categoria), pannello: cb });
  }
  gruppo.append(blocco);
}

export default {
  id: 'navi',
  titolo: 'Traffico navale',
  gruppo: 'trasporto', // dentro «Trasporti», in una sezione propria
  sezione: 'Traffico navale',
  argomento: { titolo: 'Traffico navale', descrizione: 'Navi attorno alla Sicilia da dati AIS, con categoria, destinazione, velocità e rotta, aggiornate ogni pochi minuti.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO, cluster: true, clusterMaxZoom: CLUSTER_MAX_ZOOM, clusterRadius: 40 });
  },
  aggiungiLayer(map) {
    mappa = map;
    registraGlifo(map, ICONA);
    const colori = ['match', ['get', 'categoria'], ...CATEGORIE.flatMap(([c, col]) => [c, col]), COLORE_ALTRO];
    // navi vicine (porti): cerchio col numero, più grande dove sono di più
    map.addLayer({
      id: CLUSTER, type: 'circle', source: SRC, filter: ['has', 'point_count'], layout: { visibility: 'none' },
      paint: { 'circle-color': '#4a5d8a', 'circle-opacity': 0.85, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2, 'circle-radius': ['step', ['get', 'point_count'], 12, 10, 16, 50, 21] },
    });
    map.addLayer({
      id: CLUSTER_N, type: 'symbol', source: SRC, filter: ['has', 'point_count'],
      layout: { visibility: 'none', 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
      paint: { 'text-color': '#fff' },
    });
    map.addLayer({ ...layerGlifo({
      id: PUNTI, source: SRC, icona: ICONA, colore: colori,
      layout: { visibility: 'none', 'icon-rotate': ['coalesce', ['get', 'rotta'], 0], 'icon-rotation-alignment': 'map', 'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 14, 2.1] },
      paint: { 'icon-halo-width': 1.2 },
    }), filter: singola });
    map.addLayer({ id: HIT, type: 'circle', source: SRC, filter: singola, paint: { 'circle-radius': 15, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [CLUSTER, PUNTI] })[0];
      popup?.remove();
      if (!f) return;
      if (f.properties.cluster) { // un gruppo si apre zoomando fino a separare le navi
        map.getSource(SRC).getClusterExpansionZoom(f.properties.cluster_id)
          .then(zoom => map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 }));
        return;
      }
      const p = completo(f.properties);
      const { anchor, offset } = ancoraPopupTraffico(e.point, map.getContainer());
      const colore = coloreCategoria(p.categoria);
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'traffico-popup-box', anchor, offset, closeButton: false })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(contenutoPopupTraffico({
          sezione: 'Marittimo', icona: 'nave', colore,
          modello: modelloPopupNave(p), coordinate: f.geometry.coordinates, chiudi: () => popup.remove(),
        }))
        .addTo(map);
      rifinisciPopupTraffico(popup, anchor, colore);
      centraPopupTraffico(map, popup, anchor, f.geometry.coordinates);
    });
    registraTooltipStrati(map, [{
      layers: [PUNTI], icona: ICONA, sezione: 'Marittimo', colore: p => coloreCategoria(completo(p).categoria),
      campione: p => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(ICONA, coloreCategoria(completo(p).categoria))]),
      modello: p => modelloPopupNave(completo(p)),
    }]);
    for (const id of [CLUSTER, PUNTI]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
    document.addEventListener('visibilitychange', () => {
      if (acceso && !document.hidden && Date.now() - ultimo > INTERVALLO_MS) aggiorna();
      pianifica();
    });
  },
  avvia: aggiorna,
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceNave(completo(f.properties))];
      });
    },
  },
  legendaPannello: '.lg-navi', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'navi', etichetta: 'Navi', layers: [CLUSTER, CLUSTER_N, PUNTI], attivo: false,
    sottovoci: [{ titolo: 'Categoria', voci: CATEGORIE.map(([c]) => ({ id: `categoria:${c}`, etichetta: c })) }],
    suCambio(attivo) {
      acceso = attivo;
      if (legenda) legenda.hidden = !attivo;
      for (const { pannello } of caselle.values()) pannello.disabled = !attivo;
      if (attivo && Date.now() - ultimo > INTERVALLO_MS) aggiorna();
      pianifica();
    },
  }],
  pannello: creaPannello,
};
