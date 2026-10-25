import { urlDati, pmt } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { CLASSI, CONTORNO, classe, chiave, modelloPopup, vociPc, retino } from './scheda-protezione-civile.js';
import { tl } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';
import { creaMiniMappaAree } from './scheda-pc-mappa.js';
import { inModoEmergenza } from '../core/modo-emergenza.js';

// Piano di emergenza della Protezione civile (Comune di Palermo, Portale Open Data dataset 351): 478 aree in un solo PMTiles (zoom 11–17).
// Simbologia dell'Allegato B del Dipartimento della Protezione Civile: tratteggio verde = area di attesa, rosso = ricovero e accoglienza,
// giallo = ammassamento dei soccorritori, con il simbolo blu della classe; ospedali e siti a rischio industriale sono di contesto. Ogni area porta circoscrizione, quartiere e UPL (scripts/protezione_civile.py).
// Il popup è breve; il dettaglio sta nella scheda di destra, anche a strato spento (layer «hit» trasparente, sempre presente).
const SRC = 'protezione-civile';
const FILL = 'protezione-civile-fill';
const BORDO = 'protezione-civile-bordo';
const ICONE = 'protezione-civile-icone';
const HIT = 'protezione-civile-hit';
const MINZOOM = 11;
const COLORE_POPUP = '#1c71b8'; // il blu dei simboli dell'Allegato B
const MAX_NELLA_SCHEDA = 6;

let legenda = null;
let conteggi = {};
let mappa = null;
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

const idRetino = id => `pc-retino-${id}`;
const idIcona = id => `pc-icona-${id}`;
const conIcona = CLASSI.filter(c => c.icona);
const perClasse = (f, altro) => ['match', ['get', 'classe'], ...CLASSI.flatMap(c => [c.id, f(c)]), altro];

function registraImmagini(map) {
  for (const c of CLASSI) if (!map.hasImage(idRetino(c.id))) map.addImage(idRetino(c.id), retino(c.colore), { pixelRatio: 2 });
  for (const c of conIcona) {
    map.loadImage(c.icona).then(({ data }) => { if (!map.hasImage(idIcona(c.id))) map.addImage(idIcona(c.id), data, { pixelRatio: 2 }); }).catch(() => {});
  }
}

// Popup nello stile degli altri strati (scheda scura con intestazione, titolo e righe): mostra l'area cliccata, e quante altre le stanno sotto.
function apriPopup(map, lista, e, precedente) {
  const modello = modelloPopup(lista[0].properties);
  if (lista.length > 1) modello.righe.push({ etichetta: 'Aree sovrapposte', valore: String(lista.length) });
  return apriPopupScheda(map, { precedente, sezione: 'Piano di emergenza', icona: 'protezione-civile', colore: COLORE_POPUP, modello, punto: e.point, lngLat: e.lngLat });
}

function applicaFiltro(map) {
  const f = accesi ? filtroInsieme(['get', 'classe'], accesi, CLASSI.length) : null;
  map.setFilter(FILL, f);
  map.setFilter(BORDO, f);
  map.setFilter(ICONE, f);
}

// Campione di legenda: tratteggio col contorno grigio e, dove l'Allegato B lo prevede, il simbolo blu della classe.
function simbolo(c) {
  const i = el('i', 'pc-campione');
  i.style.setProperty('--pc-colore', c.colore);
  if (c.icona) {
    const img = el('img', 'pc-icona');
    img.src = c.icona;
    img.alt = '';
    img.width = img.height = 16;
    i.append(img);
  }
  return i;
}

function riempiLegenda(map) {
  if (!legenda || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  const tutte = new Set(CLASSI.map(c => c.id));
  for (const c of CLASSI.filter(k => conteggi[k.id] > 0)) {
    legenda.append(voceFiltro(simbolo(c), `${tl(c.etichetta)} (${conteggi[c.id]})`, acceso => {
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
    mappa = map;
    const nascosto = { visibility: 'none' };
    registraImmagini(map);
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, 'source-layer': 'aree', minzoom: MINZOOM, layout: nascosto,
      paint: { 'fill-pattern': perClasse(c => idRetino(c.id), idRetino('rischio')), 'fill-opacity': 0.95 },
    });
    map.addLayer({
      id: BORDO, type: 'line', source: SRC, 'source-layer': 'aree', minzoom: MINZOOM, layout: nascosto,
      paint: { 'line-color': CONTORNO, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 17, 1.4] },
    });
    // simbolo blu della classe, uno per area (strato punti); l'area troppo piccola non lo mostra
    map.addLayer({
      id: ICONE, type: 'symbol', source: SRC, 'source-layer': 'punti', minzoom: MINZOOM,
      layout: {
        ...nascosto,
        'icon-image': ['match', ['get', 'classe'], ...conIcona.flatMap(c => [c.id, idIcona(c.id)]), ''],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 14, 0.6, 17, 0.9],
        'icon-allow-overlap': false, 'symbol-sort-key': ['match', ['get', 'classe'], 'ospedale', 0, 1],
      },
    });
    // poligoni trasparenti sempre presenti: la scheda del luogo mostra le aree anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, 'source-layer': 'aree', minzoom: MINZOOM, paint: { 'fill-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(FILL, 'visibility') !== 'visible') return;
      if (inModoEmergenza()) { popup?.remove(); return; } // telefono in modalità emergenza: niente popup, restano tooltip e scheda
      const lista = distinti(map.queryRenderedFeatures(e.point, { layers: [FILL] }));
      if (!lista.length) { popup?.remove(); return; }
      popup = apriPopup(map, lista, e, popup);
    });
    registraTooltipStrati(map, [{ layers: [FILL], icona: 'protezione-civile', sezione: 'Piano di emergenza', colore: () => COLORE_POPUP, campione: p => campioneTooltip('legenda-pc', simbolo(classe(p.classe) ?? { colore: '#868e96' })), modello: modelloPopup }]);
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
    // a strato acceso la sezione dell'area sta in cima al tab Luogo, per non confonderla con le altre informazioni del punto
    voci: trovati => {
      const aree = distinti(tutti(trovati, HIT)).slice(0, MAX_NELLA_SCHEDA).map(f => f.properties);
      // il riquadro con la mappa delle aree sta nella prima sezione: l'area cliccata è in evidenza
      return vociPc(aree, mappa?.getLayoutProperty(FILL, 'visibility') === 'visible').map((v, i) => (i === 0 ? { ...v, dinamico: () => creaMiniMappaAree(aree) } : v));
    },
  },
  legendaPannello: '.lg-pc', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'protezione-civile', etichetta: 'Piano di emergenza (da zoom 11)', layers: [FILL, BORDO, ICONE], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
};
