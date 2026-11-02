import { urlDati, pmt } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { CLASSI, CLASSI_STRADA, classe, classePerPunteggio, coloriEdifici, espressioneEdifici2d, modelloPopup, voceCamminabilita, voceStrada, chiave } from './scheda-camminabilita.js';
import { coloraEdifici3d, volumi3dAcceso } from '../core/colori-3d.js';
import { t, tl } from '../core/i18n.js';

// Camminabilità (Walkably, Raian Pollock, ODbL su dati OpenStreetMap): punteggio 0–100 di ogni cella esagonale di ~95 m del comune.
// 11.790 celle in un solo PMTiles (scripts/camminabilita.py, zoom 12–16). Il clic apre la scheda del luogo, anche a strato spento
// (strato «hit» trasparente sempre presente).
const SRC = 'camminabilita';
const FILL = 'camminabilita-fill';
const HIT = 'camminabilita-hit';
const STRADE = 'camminabilita-strade';
const HIT_STRADE = 'camminabilita-strade-hit';
const MINZOOM_STRADE = 15;
const MINZOOM = 12;
const SRC_EDIFICI = 'camminabilita-edifici-src';
const EDIFICI = 'camminabilita-edifici';
const MINZOOM_EDIFICI = 15; // da qui gli edifici colorati prendono il posto degli esagoni
const COLORE_POPUP = '#2c7fb8';

let legenda = null;
let conteggi = {};
let accesi = null; // classi accese in legenda (null = tutte)
let stradeAccese = null; // classi di strada accese (null = tutte)
let mappa = null;
let acceso = false;
let edificiPerClasse = null; // {classe: [fid]} da edifici_fid.json, caricato alla prima accensione

// Edifici colorati col punteggio della cella: poligono piatto in 2D, volume di edifici-3d in 3D. Dove ci sono gli edifici
// (zoom 15+, dati caricati) l'esagono sparisce. Senza il file degli edifici gli esagoni restano a ogni zoom.
function aggiornaEdifici() {
  const map = mappa;
  if (!map?.getLayer(EDIFICI)) return;
  const attivi = acceso && edificiPerClasse;
  map.setLayoutProperty(EDIFICI, 'visibility', attivi && !volumi3dAcceso(map) ? 'visible' : 'none');
  if (attivi) map.setPaintProperty(EDIFICI, 'fill-color', espressioneEdifici2d(edificiPerClasse, accesi));
  map.setLayerZoomRange(FILL, MINZOOM, attivi ? MINZOOM_EDIFICI : 24);
  coloraEdifici3d(map, 'camminabilita', attivi ? coloriEdifici(edificiPerClasse, accesi) : null);
}

async function caricaEdifici() {
  if (edificiPerClasse) return;
  try {
    edificiPerClasse = await (await fetch(urlDati('camminabilita/edifici_fid.json'))).json();
  } catch { edificiPerClasse = null; }
  aggiornaEdifici();
}

function el(tag, cls, testo) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

const colorePerClasse = ['match', ['get', 'classe'], ...CLASSI.flatMap(c => [c.id, c.colore]), '#cccccc'];

function simbolo(c) {
  const i = el('i');
  i.style.background = c.colore;
  return i;
}

const perStrada = (campo, altro) => ['match', ['get', 'cl'], ...CLASSI_STRADA.flatMap(c => [c.id, campo(c)]), altro];

function lineaStrada(c) {
  const i = el('i');
  i.style.cssText = `display:inline-block;width:22px;height:${Math.max(2, Math.round(c.spessore))}px;border:0;border-radius:2px;background:${c.colore};vertical-align:middle`;
  return i;
}

function riempiLegenda(map) {
  if (!legenda || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  const tutte = new Set(CLASSI.map(c => c.id));
  for (const c of [...CLASSI].reverse().filter(k => conteggi[k.id] > 0)) {
    legenda.append(voceFiltro(simbolo(c), `${tl(c.etichetta)} (${c.da}–${c.a})`, acceso => {
      accesi ??= new Set(tutte);
      acceso ? accesi.add(c.id) : accesi.delete(c.id);
      if (accesi.size >= tutte.size) accesi = null;
      map.setFilter(FILL, accesi ? filtroInsieme(['get', 'classe'], accesi, CLASSI.length) : null);
      aggiornaEdifici();
    }));
  }
  legenda.append(el('strong', null, 'Strade (da zoom 15)'));
  const tutteS = new Set(CLASSI_STRADA.map(c => c.id));
  for (const c of CLASSI_STRADA) {
    legenda.append(voceFiltro(lineaStrada(c), c.etichetta, acceso => {
      stradeAccese ??= new Set(tutteS);
      acceso ? stradeAccese.add(c.id) : stradeAccese.delete(c.id);
      if (stradeAccese.size >= tutteS.size) stradeAccese = null;
      const f = stradeAccese ? filtroInsieme(['get', 'cl'], stradeAccese, CLASSI_STRADA.length) : null;
      map.setFilter(STRADE, f);
    }, true, false));
  }
  legenda.append(el('p', 'uffici-nota', 'Stime da OpenStreetMap, per celle di circa 95 m. Dati: Walkably (ODbL)'));
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-camminabilita legenda-monumenti legenda-uffici lg-camminabilita');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Camminabilità (punteggio 0–100)'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'camminabilita',
  titolo: 'Camminabilità',
  argomento: { titolo: 'Camminabilità', descrizione: 'Quanto si vive a piedi: punteggio 0–100 per celle di circa 95 m, dalla raggiungibilità a piedi di negozi, salute, scuole, parchi, cultura e trasporto pubblico e dalla qualità della strada. Dati Walkably su OpenStreetMap.' },
  gruppo: 'territorio',
  sezione: 'Camminabilità',
  sezioniFisse: true, // sezione a sé dentro Territorio: il riordino non attraversa le intestazioni
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'vector', url: pmt('camminabilita/camminabilita.pmtiles'), attribution: '<a href="https://walkably.org" target="_blank" rel="noopener">Walkably</a> (ODbL)' });
    // stessi tile dell'edificato (il layer Edifici può non essere caricato): il browser li riusa dalla cache
    map.addSource(SRC_EDIFICI, { type: 'vector', url: pmt('edifici/edificato_pop.pmtiles') });
  },
  aggiungiLayer(map) {
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, 'source-layer': 'celle', minzoom: MINZOOM, layout: { visibility: 'none' },
      paint: { 'fill-color': colorePerClasse, 'fill-opacity': 0.68, 'fill-outline-color': 'rgba(255,255,255,0.35)' },
    });
    map.addLayer({
      id: EDIFICI, type: 'fill', source: SRC_EDIFICI, 'source-layer': 'edificato', minzoom: MINZOOM_EDIFICI, layout: { visibility: 'none' },
      paint: { 'fill-color': 'rgba(0,0,0,0)', 'fill-opacity': 0.85 },
    });
    mappa = map;
    document.addEventListener('vista3d', aggiornaEdifici); // i volumi 3D si accendono e spengono
    // tratti di strada, colorati e spessi per classe di qualità (trafficata, mista, tranquilla), dallo zoom 15
    map.addLayer({
      id: STRADE, type: 'line', source: SRC, 'source-layer': 'strade', minzoom: MINZOOM_STRADE, layout: { visibility: 'none', 'line-cap': 'round' },
      paint: {
        'line-color': perStrada(c => c.colore, '#7a8394'),
        'line-width': ['interpolate', ['linear'], ['zoom'], MINZOOM_STRADE, perStrada(c => c.spessore * 0.6, 1), 18, perStrada(c => c.spessore * 1.8, 2)],
        'line-opacity': 0.9,
      },
    });
    // linee trasparenti larghe, sempre presenti: il clic vicino a una strada ne mostra la scheda anche a strato spento
    map.addLayer({ id: HIT_STRADE, type: 'line', source: SRC, 'source-layer': 'strade', minzoom: MINZOOM_STRADE, paint: { 'line-opacity': 0, 'line-width': 12 } });
    // esagoni trasparenti sempre presenti: la scheda del luogo mostra il punteggio anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, 'source-layer': 'celle', minzoom: MINZOOM, paint: { 'fill-opacity': 0 } });
    registraTooltipStrati(map, [{
      layers: [FILL], icona: 'camminabilita', sezione: 'Camminabilità', colore: () => COLORE_POPUP,
      campione: p => campioneTooltip('legenda-camminabilita', simbolo(classe(p.classe) ?? classePerPunteggio(Number(p.s)))), modello: modelloPopup,
    }]);
  },
  async avvia(map) {
    try {
      conteggi = (await (await fetch(urlDati('camminabilita/camminabilita.json'))).json()).per_classe ?? {};
    } catch {
      conteggi = Object.fromEntries(CLASSI.map(c => [c.id, 1])); // senza conteggi la legenda resta usabile
    }
    riempiLegenda(map);
  },
  scheda: {
    layers: [HIT, HIT_STRADE],
    voci: trovati => {
      const celle = tutti(trovati, HIT);
      const strade = tutti(trovati, HIT_STRADE);
      // contorno dell'esagono cliccato (tutti i pezzi di tile della stessa cella), anche con gli edifici sopra
      const pezzi = celle.filter(c => chiave(c.properties) === chiave(celle[0]?.properties));
      const evidenza = pezzi.length ? [{ id: 'camminabilita-cella', etichetta: t('evidenza.cellaCamminabilita'), colore: '#111111', soloBordo: true, features: pezzi }] : [];
      return [...(celle.length ? [{ ...voceCamminabilita(celle[0].properties), evidenza }] : []), ...(strade.length ? [voceStrada(strade[0].properties)] : [])];
    },
  },
  legendaPannello: '.lg-camminabilita', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'camminabilita', etichetta: 'Camminabilità (da zoom 12)', layers: [FILL, STRADE], attivo: false,
    suCambio(attivo) {
      if (legenda) legenda.hidden = !attivo;
      acceso = attivo;
      if (attivo) caricaEdifici();
      aggiornaEdifici();
    },
  }],
  pannello: creaLegenda,
};
