import { urlDati, pmt } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { CLASSI, classe, chiave, modelloPopup, vociPc } from './scheda-protezione-civile.js';
import { t, tl } from '../core/i18n.js';

// Piano di emergenza della Protezione civile (Comune di Palermo, Portale Open Data dataset 351): 478 aree in un solo PMTiles (zoom 11–17).
// Verde = area di attesa della popolazione, rosso = area di ricovero e accoglienza, giallo = area di ammassamento dei soccorritori;
// ospedali e siti a rischio industriale sono di contesto. Ogni area porta circoscrizione, quartiere e UPL (scripts/protezione_civile.py).
// Il popup è breve; il dettaglio sta nella scheda di destra, anche a strato spento (layer «hit» trasparente, sempre presente).
const SRC = 'protezione-civile';
const FILL = 'protezione-civile-fill';
const BORDO = 'protezione-civile-bordo';
const HIT = 'protezione-civile-hit';
const MINZOOM = 11;
const MAX_NEL_POPUP = 4;
const MAX_NELLA_SCHEDA = 6;

let legenda = null;
let conteggi = {};
let accesi = null; // classi accese in legenda (null = tutte)

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Un'area per id: i tile spezzano le feature.
function distinti(feature) {
  const visti = new Set();
  return feature.filter(f => {
    const k = chiave(f.properties);
    return visti.has(k) ? false : (visti.add(k), true);
  });
}

const colore = ['match', ['get', 'classe'], ...CLASSI.flatMap(c => [c.id, c.colore]), '#868e96'];

function contenutoPopup(lista) {
  const radice = el('div', 'monumento-popup pc-popup');
  for (const f of lista.slice(0, MAX_NEL_POPUP)) {
    const m = modelloPopup(f.properties);
    const blocco = el('div', 'pc-popup-voce');
    blocco.append(el('h3', null, m.titolo));
    if (m.sottotitolo) blocco.append(el('p', 'monumento-cat', m.sottotitolo));
    for (const r of m.righe) blocco.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
    radice.append(blocco);
  }
  if (lista.length > MAX_NEL_POPUP) radice.append(el('p', 'monumento-desc', t('pc.altre', { n: lista.length - MAX_NEL_POPUP })));
  radice.append(el('p', 'monumento-desc uffici-suggerimento', 'Tutti i dati nella scheda a destra.'));
  return radice;
}

function applicaFiltro(map) {
  const f = accesi ? filtroInsieme(['get', 'classe'], accesi, CLASSI.length) : null;
  map.setFilter(FILL, f);
  map.setFilter(BORDO, f);
}

function simbolo(colorePieno) {
  const i = el('i', 'pc-campione');
  i.style.background = colorePieno;
  i.style.borderColor = colorePieno;
  return i;
}

function riempiLegenda(map) {
  if (!legenda || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  const tutte = new Set(CLASSI.map(c => c.id));
  for (const c of CLASSI.filter(k => conteggi[k.id] > 0)) {
    legenda.append(voceFiltro(simbolo(c.colore), `${tl(c.etichetta)} (${conteggi[c.id]})`, acceso => {
      accesi ??= new Set(tutte);
      acceso ? accesi.add(c.id) : accesi.delete(c.id);
      if (accesi.size >= tutte.size) accesi = null;
      applicaFiltro(map);
    }));
  }
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-uffici legenda-pc lg-pc');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Piano di emergenza (n. aree)'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'protezione-civile',
  titolo: 'Piano di emergenza',
  argomento: { titolo: 'Piano di emergenza', descrizione: 'Aree di attesa, di ricovero e accoglienza e di ammassamento dei soccorritori del Piano di emergenza della Protezione civile del Comune di Palermo.' },
  gruppo: 'eventi',
  sezione: 'Piano di emergenza',
  sezioniFisse: true, // resta una sezione a sé dentro Eventi: il riordino non attraversa le intestazioni
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'vector', url: pmt('protezione-civile/protezione-civile.pmtiles') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, 'source-layer': 'aree', minzoom: MINZOOM, layout: nascosto,
      paint: { 'fill-color': colore, 'fill-opacity': 0.55 },
    });
    map.addLayer({
      id: BORDO, type: 'line', source: SRC, 'source-layer': 'aree', minzoom: MINZOOM, layout: nascosto,
      paint: { 'line-color': colore, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 17, 1.8], 'line-opacity': 0.95 },
    });
    // poligoni trasparenti sempre presenti: la scheda del luogo mostra le aree anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, 'source-layer': 'aree', minzoom: MINZOOM, paint: { 'fill-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(FILL, 'visibility') !== 'visible') return;
      const lista = distinti(map.queryRenderedFeatures(e.point, { layers: [FILL] }));
      popup?.remove();
      if (!lista.length) return;
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(e.lngLat).setDOMContent(contenutoPopup(lista)).addTo(map);
    });
    registraTooltipStrati(map, [{ layers: [FILL], icona: 'protezione-civile', campione: p => campioneTooltip('legenda-pc', simbolo(classe(p.classe)?.colore ?? '#868e96')), modello: modelloPopup }]);
    map.on('mouseenter', FILL, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', FILL, () => { map.getCanvas().style.cursor = ''; });
  },
  async avvia(map) {
    try {
      conteggi = (await (await fetch(urlDati('protezione-civile/protezione-civile.json'))).json()).per_classe ?? {};
    } catch {
      conteggi = Object.fromEntries(CLASSI.map(c => [c.id, 1])); // senza conteggi la legenda resta usabile
    }
    riempiLegenda(map);
  },
  scheda: {
    layers: [HIT],
    voci: trovati => vociPc(distinti(tutti(trovati, HIT)).slice(0, MAX_NELLA_SCHEDA).map(f => f.properties)),
  },
  legendaPannello: '.lg-pc', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'protezione-civile', etichetta: 'Piano di emergenza (da zoom 11)', layers: [FILL, BORDO], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
};
