import { pmt } from '../core/config.js';
import { primo, tutti } from '../core/scheda-util.js';
import { voceArco, voceHotspot, voceIncidente, tooltipArco, GRAVITA } from './scheda-sicurezza.js';
import { ZOOM_BASE } from './sicurezza-filtro.js';
import { registraTooltip } from '../core/tooltip.js';
import { filtroInsieme, voceFiltro, voceStrato } from '../core/legenda.js';

// Sicurezza stradale (studio «Rete stradale», fase 2): tasso di incidenti per km sugli archi, hotspot Gi* a griglia da 250 m
// e incidenti puntuali 2015–2023 (il 2019 non è nel dataset pulito). Strati spenti di default; i layer «hit» sono sempre
// presenti così la scheda di destra mostra i dati anche a strato spento, come per trasporto, scuole e monumenti.
const ZOOM_MIN_ARCHI = 12;
const ZOOM_MIN_PUNTI = ZOOM_BASE; // con un filtro attivo scende a 12 (sicurezza-filtro.js)
const COLORI_TASSO = ['#fee08b', '#fdae61', '#f46d43', '#a50026']; // classe 0-3 = quartili del tasso (in scripts/sicurezza_stradale.py)
const ETICHETTE_TASSO = ['basso', 'medio-basso', 'medio-alto', 'alto'];
const COLORE_PERICOLOSE = '#67000d';
const COLORI_HOTSPOT = [['#a50026', '99%'], ['#f46d43', '95%'], ['#fdae61', '90%']];
const L = {
  archi: 'sicurezza-archi', pericolose: 'sicurezza-pericolose', hotspot: 'sicurezza-hotspot', incidenti: 'sicurezza-incidenti',
  hitArchi: 'sicurezza-hit-archi', hitHotspot: 'sicurezza-hit-hotspot', hitIncidenti: 'sicurezza-hit-incidenti',
};
// gli strati dei punti, per il filtro Incidenti del pannello Filtri
export const STRATI_INCIDENTI = [L.incidenti, L.hitIncidenti];

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Legenda in #legende (sulla mappa, come monumenti e scuole): una sezione per strato, visibile solo a strato acceso.
// Ogni voce è un filtro: tasso, hotspot e gravità restringono i tratti, i poligoni e i punti disegnati.
// Il filtro degli incidenti passa da quello del pannello (sicurezza-filtro.js), collegato da app.js.
export const legendaSicurezza = { suTipologie: () => {} };
const sezioni = {};
function creaLegenda(_gruppo, map) {
  const box = el('div', 'legenda legenda-sicurezza');
  const tratto = (colore, extra = '') => { const i = el('i', `sicurezza-tratto ${extra}`.trim()); i.style.background = colore; return i; };
  const sezione = (chiave, titolo, voci) => {
    const s = el('div', 'sicurezza-sezione');
    s.hidden = true;
    s.append(el('div', 'sicurezza-legenda-titolo', titolo), ...voci);
    sezioni[chiave] = s;
    box.append(s);
  };
  // un insieme di voci con una casella ciascuna; `applica` riceve l'insieme dei valori accesi
  const gruppoFiltri = (voci, applica) => {
    const accesi = new Set(voci.map(([valore]) => valore));
    return voci.map(([valore, simbolo, testo]) => voceFiltro(simbolo, testo, acceso => {
      acceso ? accesi.add(valore) : accesi.delete(valore);
      applica(accesi, voci.length);
    }));
  };
  sezione(L.archi, 'Incidenti per km (tratti ≥ 20 m)', gruppoFiltri(
    COLORI_TASSO.map((c, i) => [i, tratto(c), `Tasso ${ETICHETTE_TASSO[i]}`]),
    (accesi, n) => {
      const sel = filtroInsieme(['get', 'classe'], accesi, n);
      map.setFilter(L.archi, sel ? ['all', ['has', 'classe'], sel] : ['has', 'classe']);
    }));
  sezione(L.pericolose, 'Vie più pericolose', [voceStrato(tratto(COLORE_PERICOLOSE, 'sicurezza-tratto--spesso'), 'Le 20 vie con più gravità per km', 'sicurezza-pericolose')]);
  sezione(L.hotspot, 'Hotspot (confidenza)', gruppoFiltri(
    COLORI_HOTSPOT.map(([c, t]) => [Number.parseInt(t, 10), tratto(c), t]),
    (accesi, n) => { for (const id of [L.hotspot, L.hitHotspot]) map.setFilter(id, filtroInsieme(['get', 'livello_gravita'], accesi, n)); }));
  sezione(L.incidenti, 'Incidenti (da zoom 14)', gruppoFiltri(
    Object.entries(GRAVITA).map(([k, g]) => {
      const p = el('i', 'sicurezza-pallino');
      p.style.background = g.colore;
      return [k, p, g.nome];
    }),
    (accesi, n) => legendaSicurezza.suTipologie(accesi.size >= n ? null : [...accesi])));
  box.hidden = true;
  document.getElementById('legende').append(box);
  legenda = box;
}
let legenda = null;
// il box compare se c'è almeno una sezione accesa
function mostraSezione(chiave, attivo) {
  if (!legenda) return;
  sezioni[chiave].hidden = !attivo;
  legenda.hidden = Object.values(sezioni).every(x => x.hidden);
}

// Tooltip sugli archi, solo a strato acceso (sezione di quello condiviso).
function collegaTooltip(map) {
  registraTooltip(map, e => {
    if (![L.archi, L.pericolose].some(id => map.getLayoutProperty(id, 'visibility') === 'visible')) return null;
    const riquadro = [[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]];
    const f = map.queryRenderedFeatures(riquadro, { layers: [L.hitArchi] })[0];
    if (!f) return null;
    const t = tooltipArco(f.properties);
    const corpo = el('div', 'sicurezza-tooltip-corpo');
    corpo.append(el('strong', null, t.titolo), el('div', null, t.dettaglio));
    return { contenuto: corpo, cursore: true };
  }, 1);
}

export default {
  id: 'sicurezza',
  titolo: 'Sicurezza stradale',
  argomento: { titolo: 'Sicurezza stradale', descrizione: 'Incidenti 2015–2023: incidenti per km, strade più pericolose, hotspot e singoli eventi.' },
  aggiungiSorgenti(map) {
    for (const n of ['archi', 'hotspot', 'incidenti']) map.addSource(`sicurezza-${n}`, { type: 'vector', url: pmt(`mobilita/sicurezza/${n}.pmtiles`) });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    const spessore = (a, b) => ['interpolate', ['linear'], ['zoom'], ZOOM_MIN_ARCHI, a, 17, b];
    map.addLayer({
      id: L.archi, type: 'line', source: 'sicurezza-archi', 'source-layer': 'archi', minzoom: ZOOM_MIN_ARCHI,
      filter: ['has', 'classe'], layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['match', ['get', 'classe'], 0, COLORI_TASSO[0], 1, COLORI_TASSO[1], 2, COLORI_TASSO[2], COLORI_TASSO[3]], 'line-width': spessore(1.2, 5), 'line-opacity': 0.9 },
    });
    // le vie della classifica: sopra il tasso, in rosso scuro e più spesse, così si leggono anche a strato archi spento
    map.addLayer({
      id: L.pericolose, type: 'line', source: 'sicurezza-archi', 'source-layer': 'archi', minzoom: 10,
      filter: ['has', 'via_rango'], layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': COLORE_PERICOLOSE, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4, 17, 8], 'line-opacity': 0.95 },
    });
    map.addLayer({
      id: L.hotspot, type: 'fill', source: 'sicurezza-hotspot', 'source-layer': 'hotspot', minzoom: 10, layout: nascosto,
      paint: {
        'fill-color': ['match', ['get', 'livello_gravita'], 99, COLORI_HOTSPOT[0][0], 95, COLORI_HOTSPOT[1][0], COLORI_HOTSPOT[2][0]],
        'fill-opacity': 0.45, 'fill-outline-color': '#7f0000',
      },
    });
    map.addLayer({
      id: L.incidenti, type: 'circle', source: 'sicurezza-incidenti', 'source-layer': 'incidenti', minzoom: ZOOM_MIN_PUNTI, layout: nascosto,
      paint: {
        'circle-color': ['match', ['get', 'Tipologia'], 'M', GRAVITA.M.colore, 'R', GRAVITA.R.colore, 'F', GRAVITA.F.colore, GRAVITA.C.colore],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2.5, 18, 6], 'circle-stroke-color': '#fff', 'circle-stroke-width': 0.8, 'circle-opacity': 0.9,
      },
    });
    // strati trasparenti sempre presenti: la scheda mostra i dati anche a strato spento
    map.addLayer({ id: L.hitArchi, type: 'line', source: 'sicurezza-archi', 'source-layer': 'archi', minzoom: 13, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitHotspot, type: 'fill', source: 'sicurezza-hotspot', 'source-layer': 'hotspot', minzoom: 10, paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: L.hitIncidenti, type: 'circle', source: 'sicurezza-incidenti', 'source-layer': 'incidenti', minzoom: ZOOM_MIN_PUNTI, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaTooltip(map);
  },
  strati: [
    { id: 'sicurezza-archi', etichetta: 'Incidenti per km sulle strade', layers: [L.archi], attivo: false, suCambio: attivo => mostraSezione(L.archi, attivo) },
    { id: 'sicurezza-pericolose', etichetta: 'Le 20 strade più pericolose', layers: [L.pericolose], attivo: false, suCambio: attivo => mostraSezione(L.pericolose, attivo) },
    { id: 'sicurezza-hotspot', etichetta: 'Hotspot degli incidenti', layers: [L.hotspot], attivo: false, suCambio: attivo => mostraSezione(L.hotspot, attivo) },
    { id: 'sicurezza-incidenti', etichetta: 'Incidenti (da zoom 14)', layers: [L.incidenti], attivo: false, suCambio: attivo => mostraSezione(L.incidenti, attivo) },
  ],
  pannello: creaLegenda,
  scheda: {
    layers: [L.hitIncidenti, L.hitArchi, L.hitHotspot],
    voci(trovati) {
      const voci = [];
      const visti = new Set();
      const unico = (chiave, voce) => { if (!visti.has(chiave)) { visti.add(chiave); voci.push(voce); } }; // i tile spezzano le feature
      const a = primo(trovati, L.hitArchi);
      if (a) unico(`arco-${a.properties.arco_id}`, voceArco(a.properties));
      const h = primo(trovati, L.hitHotspot);
      if (h) unico(`hotspot-${h.properties.cell_id}`, voceHotspot(h.properties));
      for (const i of tutti(trovati, L.hitIncidenti).slice(0, 3)) unico(`inc-${i.properties.arco_id}-${i.properties.anno}-${i.properties.Luogo}`, voceIncidente(i.properties));
      return voci;
    },
  },
};
