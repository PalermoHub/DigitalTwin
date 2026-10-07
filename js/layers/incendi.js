import { urlDati, pmt } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { modelloPopup, vociIncendi } from './scheda-incendi.js';

// Incendi nel Comune di Palermo dal Censimento Incendi della Regione Siciliana (un layer per anno sul server, un solo PMTiles qui, zoom 12–18).
// Colori e trasparenza di ogni anno sono quelli della simbologia del server e viaggiano dentro ogni feature (`colore`, `bordo`, `opacita`):
// un anno nuovo (dati/incedi/, workflow «Aggiorna incendi») compare in mappa e in legenda senza toccare il codice.
// Il popup è breve; il dettaglio sta nella scheda di destra, anche a strato spento (layer «hit» trasparente, sempre presente).
const SRC = 'incendi';
const FILL = 'incendi-fill';
const BORDO = 'incendi-bordo';
const HIT = 'incendi-hit';
const MAX_NEL_POPUP = 4;
const MAX_NELLA_SCHEDA = 6;

let legenda = null;
let anni = [];
let accesi = null; // anni accesi in legenda (null = tutti)

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Un incendio per anno+id: i tile spezzano le feature. Dal più recente.
function distinti(feature) {
  const visti = new Set();
  return feature.filter(f => {
    const k = `${f.properties.anno}-${f.properties.id}`;
    return visti.has(k) ? false : (visti.add(k), true);
  }).sort((a, b) => b.properties.anno - a.properties.anno || String(b.properties.data ?? '').localeCompare(String(a.properties.data ?? '')));
}

function contenutoPopup(lista) {
  const radice = el('div', 'monumento-popup incendi-popup');
  for (const f of lista.slice(0, MAX_NEL_POPUP)) {
    const m = modelloPopup(f.properties);
    const blocco = el('div', 'incendi-popup-voce');
    blocco.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
    for (const r of m.righe) blocco.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
    radice.append(blocco);
  }
  if (lista.length > MAX_NEL_POPUP) radice.append(el('p', 'monumento-desc', `… e altri ${lista.length - MAX_NEL_POPUP} incendi`));
  radice.append(el('p', 'monumento-desc uffici-suggerimento', 'Tutti i dati nella scheda a destra.'));
  return radice;
}

function applicaFiltro(map) {
  const f = accesi ? filtroInsieme(['get', 'anno'], accesi, anni.length) : null;
  map.setFilter(FILL, f);
  map.setFilter(BORDO, f);
}

function simbolo(a) {
  const i = el('i', 'incendi-campione');
  i.style.background = a.colore;
  i.style.borderColor = a.bordo;
  i.style.opacity = String(Math.max(a.opacita, 0.5));
  return i;
}

function riempiLegenda(map) {
  if (!legenda || !anni.length || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  const tutti = new Set(anni.map(a => a.anno));
  for (const a of anni) {
    legenda.append(voceFiltro(simbolo(a), `${a.anno} (${a.n})`, acceso => {
      accesi ??= new Set(tutti);
      acceso ? accesi.add(a.anno) : accesi.delete(a.anno);
      if (accesi.size >= tutti.size) accesi = null;
      applicaFiltro(map);
    }));
  }
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-uffici legenda-incendi');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Incendi per anno (n. incendi)'));
  legenda.append(el('p', 'uffici-nota', 'Colori della simbologia della Regione Siciliana'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'incendi',
  titolo: 'Incendi',
  argomento: { titolo: 'Incendi', descrizione: 'Aree percorse dal fuoco nel Comune di Palermo dal 2007, anno per anno, dal Censimento Incendi della Regione Siciliana.' },
  gruppo: 'territorio',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'vector', url: pmt('incedi/incendi.pmtiles') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, 'source-layer': 'incendi', minzoom: 12, layout: nascosto,
      paint: { 'fill-color': ['get', 'colore'], 'fill-opacity': ['get', 'opacita'] },
    });
    map.addLayer({
      id: BORDO, type: 'line', source: SRC, 'source-layer': 'incendi', minzoom: 12, layout: nascosto,
      paint: { 'line-color': ['get', 'bordo'], 'line-width': 1, 'line-opacity': ['get', 'opacita'] },
    });
    // poligoni trasparenti sempre presenti: la scheda del luogo mostra gli incendi anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, 'source-layer': 'incendi', minzoom: 12, paint: { 'fill-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(FILL, 'visibility') !== 'visible') return;
      const lista = distinti(map.queryRenderedFeatures(e.point, { layers: [FILL] }));
      popup?.remove();
      if (!lista.length) return;
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(e.lngLat).setDOMContent(contenutoPopup(lista)).addTo(map);
    });
    registraTooltipStrati(map, [{ layers: [FILL], modello: modelloPopup }]);
    map.on('mouseenter', FILL, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', FILL, () => { map.getCanvas().style.cursor = ''; });
  },
  async avvia(map) {
    const dati = await (await fetch(urlDati('incedi/anni.json'))).json();
    anni = dati.anni.filter(a => a.n > 0); // anni senza incendi a Palermo (es. 2024) non hanno nulla da mostrare
    riempiLegenda(map);
  },
  scheda: {
    layers: [HIT],
    voci: trovati => vociIncendi(distinti(tutti(trovati, HIT)).slice(0, MAX_NELLA_SCHEDA).map(f => f.properties)),
  },
  strati: [{
    id: 'incendi', etichetta: 'Incendi (da zoom 12)', layers: [FILL, BORDO], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
};
