import { urlDati, pmt } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { modelloPopup, vociIncendi } from './scheda-incendi.js';
import { tl } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';

// Incendi nel Comune di Palermo dal Censimento Incendi della Regione Siciliana (un layer per anno sul server, un solo PMTiles qui, zoom 12–18).
// Colori e trasparenza di ogni anno sono quelli della simbologia del server e viaggiano dentro ogni feature (`colore`, `bordo`, `opacita`):
// un anno nuovo (dati/incedi/, workflow «Aggiorna incendi») compare in mappa e in legenda senza toccare il codice.
// Il popup è breve; il dettaglio sta nella scheda di destra, anche a strato spento (layer «hit» trasparente, sempre presente).
const SRC = 'incendi';
const FILL = 'incendi-fill';
const BORDO = 'incendi-bordo';
const HIT = 'incendi-hit';
const MAX_NELLA_SCHEDA = 6;

let legenda = null;
let anni = [];
let accesi = null; // anni accesi in legenda (null = tutti)

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
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

// Il popup unico mostra l'incendio più recente sotto il clic; se ce ne sono altri sovrapposti lo dice in una riga (il resto sta nella scheda).
function apriPopup(map, lista, e, precedente) {
  const p = lista[0].properties;
  const modello = modelloPopup(p);
  if (lista.length > 1) modello.righe.push({ etichetta: 'Altri incendi', valore: String(lista.length - 1) });
  return apriPopupScheda(map, { precedente, sezione: 'Incendi', icona: 'incendio', colore: p.colore, modello, punto: e.point, lngLat: e.lngLat });
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
  legenda = el('div', 'legenda legenda-monumenti legenda-uffici legenda-incendi lg-incendi');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Incendi per anno (n. incendi)'));
  legenda.append(el('p', 'uffici-nota', 'Colori della simbologia della Regione Siciliana'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'incendi',
  titolo: 'Incendi',
  argomento: { titolo: 'Incendi', descrizione: 'Aree percorse dal fuoco nel Comune di Palermo dal 2007, anno per anno, dal Censimento Incendi della Regione Siciliana.' },
  gruppo: 'eventi',
  sezioniFisse: true, // ogni layer di Eventi resta una sezione a sé: il riordino non attraversa le intestazioni
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
      if (!lista.length) { popup?.remove(); return; }
      popup = apriPopup(map, lista, e, popup);
    });
    registraTooltipStrati(map, [{ layers: [FILL], icona: 'incendio', campione: p => campioneTooltip('legenda-incendi', simbolo({ colore: p.colore, bordo: p.bordo, opacita: p.opacita })), modello: modelloPopup }]);
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
  legendaPannello: '.lg-incendi', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'incendi', etichetta: 'Incendi (da zoom 12)', layers: [FILL, BORDO], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
};
