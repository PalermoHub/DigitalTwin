import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { occhio } from '../core/pannello.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { CATEGORIE, COLORE_ALTRO, coloreCategoria, modelloPopupNave, voceNave } from './scheda-navi.js';
import { tl, t } from '../core/i18n.js';
import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';
import { scegliProxy } from '../rndt/proxy.js';

// Navi nel golfo di Palermo (AIS terrestre). I dati non stanno nel repository: li serve il Worker (/navi), che ogni 5 minuti ascolta
// AISStream e conserva l'ultima posizione di ogni nave vista negli ultimi 30 minuti. Il layer li ricarica ogni 2 minuti finché è acceso.
const SRC = 'navi';
const ICONA = 'nave'; // in mappa è la sagoma dell'icona, ruotata secondo la rotta (vedi core/icone-mappa.js)
const PUNTI = 'navi-punti';
const HIT = 'navi-hit'; // punti trasparenti, sempre presenti: la scheda mostra la nave sotto il clic anche a strato spento
const INTERVALLO_MS = 2 * 60 * 1000;
const VUOTO = { type: 'FeatureCollection', features: [] };
const urlNavi = () => `${scegliProxy(location.search, location.hostname)}/navi`;

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

function contenutoPopup(p) {
  const m = modelloPopupNave(p);
  const radice = el('div', 'monumento-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  for (const r of m.righe) radice.append(el('p', 'monumento-desc', `${tl(r.etichetta)}: ${r.valore}`));
  return radice;
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
    mappa?.getSource(SRC)?.setData(fc);
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

function applicaFiltri() {
  const filtro = filtroInsieme(['get', 'categoria'], accesi, CATEGORIE.length);
  for (const id of [PUNTI, HIT]) mappa?.getLayer(id) && mappa.setFilter(id, filtro);
}

function impostaFiltro(categoria, on, origine) {
  on ? accesi.add(categoria) : accesi.delete(categoria);
  const c = caselle.get(categoria);
  if (c) for (const [dove, casella] of Object.entries(c)) if (dove !== origine && casella) casella.checked = on;
  applicaFiltri();
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
  argomento: { titolo: 'Traffico navale', descrizione: 'Navi nel golfo di Palermo da dati AIS, con categoria, destinazione, velocità e rotta, aggiornate ogni pochi minuti.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO });
  },
  aggiungiLayer(map) {
    mappa = map;
    registraGlifo(map, ICONA);
    const colori = ['match', ['get', 'categoria'], ...CATEGORIE.flatMap(([c, col]) => [c, col]), COLORE_ALTRO];
    map.addLayer(layerGlifo({
      id: PUNTI, source: SRC, icona: ICONA, colore: colori,
      layout: { visibility: 'none', 'icon-rotate': ['coalesce', ['get', 'rotta'], 0], 'icon-rotation-alignment': 'map', 'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.9, 14, 1.6] },
      paint: { 'icon-halo-width': 1.2 },
    }));
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 12, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      popup?.remove();
      if (!f) return;
      popup = new maplibregl.Popup({ maxWidth: '280px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(f.geometry.coordinates).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
    });
    registraTooltipStrati(map, [{
      layers: [PUNTI], icona: ICONA,
      campione: p => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(ICONA, coloreCategoria(completo(p).categoria))]),
      modello: p => modelloPopupNave(completo(p)),
    }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
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
    id: 'navi', etichetta: 'Navi', layers: [PUNTI], attivo: false,
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
