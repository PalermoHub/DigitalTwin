// Luoghi quotidiani da OpenStreetMap: alimentari, cibo e bevande, negozi, salute, parchi e giardini.
// Sono i bisogni di Walkably (layer Camminabilità) che non hanno un layer nostro; il file lo scrive scripts/luoghi_osm.py.
// Una sola sorgente GeoJSON, un livello per bisogno (forma e colore propri), uno strato acceso/spento per bisogno.
import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';
import { tl, t } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';
import { BISOGNI, featureDaLuoghi, voceLuogoOsm, modelloPopupLuogoOsm } from './scheda-luoghi-osm.js';

const SRC = 'luoghi-osm';
const punti = b => `luoghi-osm-${b.id}`;
const HIT = 'luoghi-osm-hit-punti'; // punti trasparenti, sempre presenti: la scheda mostra il luogo anche a strato spento
const VUOTO = { type: 'FeatureCollection', features: [] };
let legenda = null;
let mappa = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function collegaPopup(map) {
  let popup = null;
  const strati = BISOGNI.map(punti);
  map.on('click', e => {
    const f = map.queryRenderedFeatures(e.point, { layers: strati.filter(id => map.getLayoutProperty(id, 'visibility') === 'visible') })[0];
    if (!f) { popup?.remove(); return; }
    const b = BISOGNI.find(x => x.k === Number(f.properties.k));
    const modello = modelloPopupLuogoOsm(f.properties);
    popup = apriPopupScheda(map, {
      precedente: popup, sezione: 'Luoghi quotidiani', icona: b.icona, colore: b.colore, modello,
      corpo: [el('p', 'monumento-fonte', t('layer.fonte', { fonte: tl('OpenStreetMap') }))], punto: e.point, lngLat: e.lngLat,
    });
  });
  registraTooltipStrati(map, BISOGNI.map(b => ({
    layers: [punti(b)], icona: b.icona, sezione: 'Luoghi quotidiani', colore: () => b.colore,
    campione: () => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(b.icona, b.colore)]), modello: modelloPopupLuogoOsm,
  })));
  for (const id of strati) {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  }
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-luoghi-osm lg-luoghi-osm');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Luoghi quotidiani (OpenStreetMap)'));
  for (const b of BISOGNI) legenda.append(voceStrato(simboloGlifo(b.icona, b.colore), b.etichetta, `luoghi-osm-${b.id}`));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'luoghi-osm',
  titolo: 'Luoghi quotidiani',
  argomento: { titolo: 'Luoghi quotidiani (OpenStreetMap)', descrizione: 'Alimentari, bar e ristoranti, negozi, farmacie e servizi sanitari, parchi e giardini di Palermo da OpenStreetMap, con le stesse categorie del punteggio di camminabilità di Walkably.' },
  gruppo: 'territorio',
  sezione: 'Camminabilità',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO }); // si riempie in avvia(), quando il file è arrivato
  },
  aggiungiLayer(map) {
    mappa = map;
    for (const b of BISOGNI) {
      registraGlifo(map, b.icona);
      map.addLayer(layerGlifo({ id: punti(b), source: SRC, icona: b.icona, colore: b.colore, layout: { visibility: 'none' }, paint: {} }));
      map.setFilter(punti(b), ['==', ['get', 'k'], b.k]);
    }
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaPopup(map);
  },
  async avvia(map) {
    try {
      const dati = await (await fetch(urlDati('camminabilita/luoghi_osm.json'))).json();
      map.getSource(SRC)?.setData(featureDaLuoghi(dati.bisogni));
    } catch { /* senza il file i livelli restano vuoti: il resto della mappa funziona */ }
  },
  legendaPannello: '.lg-luoghi-osm', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: BISOGNI.map(b => ({
    id: `luoghi-osm-${b.id}`, etichetta: b.etichetta, layers: [punti(b)], attivo: false, legenda: '.legenda-luoghi-osm',
    suCambio() { if (legenda) legenda.hidden = !BISOGNI.some(x => mappa?.getLayoutProperty(punti(x), 'visibility') === 'visible'); },
  })),
  pannello: creaLegenda,
  scheda: {
    vicini: { max: 5 }, // anche i punti nei dintorni del clic (raggio: regolabile dalla legenda, core/raggio-vicini.js) (vedi docs/NUOVO_LAYER.md)
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceLuogoOsm(f.properties)];
      });
    },
  },
};
