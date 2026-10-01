import { pmt } from '../core/config.js';
import { primo, tutti } from '../core/scheda-util.js';
import { voceArco, voceHotspot, voceIncidente, tooltipArco, GRAVITA } from './scheda-sicurezza.js';

// Sicurezza stradale (studio «Rete stradale», fase 2): tasso di incidenti per km sugli archi, hotspot Gi* a griglia da 250 m
// e incidenti puntuali 2015–2023 (il 2019 non è nel dataset pulito). Strati spenti di default; i layer «hit» sono sempre
// presenti così la scheda di destra mostra i dati anche a strato spento, come per trasporto, scuole e monumenti.
const ZOOM_MIN_ARCHI = 12;
const ZOOM_MIN_PUNTI = 14;
const ANNI = [2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023];
const COLORI_TASSO = ['#fee08b', '#fdae61', '#f46d43', '#a50026']; // classe 0-3 = quartili del tasso (in scripts/sicurezza_stradale.py)
const ETICHETTE_TASSO = ['basso', 'medio-basso', 'medio-alto', 'alto'];
const COLORE_PERICOLOSE = '#67000d';
const COLORI_HOTSPOT = [['#a50026', '99%'], ['#f46d43', '95%'], ['#fdae61', '90%']];
const L = {
  archi: 'sicurezza-archi', pericolose: 'sicurezza-pericolose', hotspot: 'sicurezza-hotspot', incidenti: 'sicurezza-incidenti',
  hitArchi: 'sicurezza-hit-archi', hitHotspot: 'sicurezza-hit-hotspot', hitIncidenti: 'sicurezza-hit-incidenti',
};

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function creaLegenda(gruppo, map) {
  const box = el('div', 'legenda legenda-sicurezza');
  const riga = (simbolo, testo) => { const r = el('div', 'sicurezza-legenda-riga'); r.append(simbolo, testo); box.append(r); };
  const tratto = (colore, extra = '') => { const i = el('i', `sicurezza-tratto ${extra}`.trim()); i.style.background = colore; return i; };
  box.append(el('div', 'sicurezza-legenda-titolo', 'Incidenti per km (tratti ≥ 20 m)'));
  COLORI_TASSO.forEach((c, i) => riga(tratto(c), `Tasso ${ETICHETTE_TASSO[i]}`));
  riga(tratto(COLORE_PERICOLOSE, 'sicurezza-tratto--spesso'), 'Le 20 vie più pericolose (gravità per km)');
  box.append(el('div', 'sicurezza-legenda-titolo', 'Hotspot (confidenza)'));
  COLORI_HOTSPOT.forEach(([c, t]) => riga(tratto(c), t));
  box.append(el('div', 'sicurezza-legenda-titolo', 'Incidenti (da zoom 14)'));
  for (const g of Object.values(GRAVITA)) {
    const p = el('i', 'sicurezza-pallino');
    p.style.background = g.colore;
    riga(p, g.nome);
  }
  const sel = el('select', 'sicurezza-anno');
  sel.id = 'sicurezza-anno';
  sel.setAttribute('aria-label', 'Anno degli incidenti');
  sel.append(new Option('Tutti gli anni', ''), ...ANNI.map(a => new Option(String(a), String(a))));
  sel.addEventListener('change', () => {
    const filtro = sel.value ? ['==', ['get', 'anno'], Number(sel.value)] : null;
    for (const id of [L.incidenti, L.hitIncidenti]) map.setFilter(id, filtro);
  });
  box.append(el('div', 'sicurezza-legenda-titolo', 'Anno'), sel);
  gruppo.append(box);
}

// Tooltip sugli archi, solo a strato acceso. Sta sotto il cursore: quello dei confini sta sopra e i due possono comparire insieme.
function collegaTooltip(map) {
  let popup = null;
  let mioCursore = false; // il cursore lo tocchiamo solo se l'abbiamo messo noi
  const nascondi = () => {
    popup?.remove();
    popup = null;
    if (mioCursore) { map.getCanvas().style.cursor = ''; mioCursore = false; }
  };
  map.on('mousemove', e => {
    if (![L.archi, L.pericolose].some(id => map.getLayoutProperty(id, 'visibility') === 'visible')) return nascondi();
    const riquadro = [[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]];
    const f = map.queryRenderedFeatures(riquadro, { layers: [L.hitArchi] })[0];
    if (!f) return nascondi();
    map.getCanvas().style.cursor = 'pointer';
    mioCursore = true;
    const t = tooltipArco(f.properties);
    const corpo = el('div', 'sicurezza-tooltip-corpo');
    corpo.append(el('strong', null, t.titolo), el('div', null, t.dettaglio));
    popup ??= new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'sicurezza-tooltip', anchor: 'top', offset: 14 });
    popup.setLngLat(e.lngLat).setDOMContent(corpo).addTo(map);
  });
  map.on('mouseout', nascondi);
}

export default {
  id: 'sicurezza',
  titolo: 'Sicurezza stradale',
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
    { id: 'sicurezza-archi', etichetta: 'Incidenti per km sulle strade', layers: [L.archi], attivo: false },
    { id: 'sicurezza-pericolose', etichetta: 'Le 20 strade più pericolose', layers: [L.pericolose], attivo: false },
    { id: 'sicurezza-hotspot', etichetta: 'Hotspot degli incidenti', layers: [L.hotspot], attivo: false },
    { id: 'sicurezza-incidenti', etichetta: 'Incidenti (da zoom 14)', layers: [L.incidenti], attivo: false },
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
