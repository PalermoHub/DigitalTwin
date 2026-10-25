import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { voceAlbero, modelloPopupAlbero } from './scheda-alberi.js';
import { tl, t } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';

import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';

const COLORE = '#2f7d32';
const SRC = 'alberi';
const ICONA = 'albero'; // in mappa è la sagoma dell'icona (vedi core/icone-mappa.js)
const PUNTI = 'alberi-punti';
const HIT = 'alberi-hit-punti'; // punti trasparenti, sempre presenti: la scheda mostra l'albero anche a strato spento

const dettagli = new Map(); // id -> proprietà complete
const completo = p => dettagli.get(p.id) ?? p;
let legenda = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Righe nel popup unico; sotto, la fonte dei dati.
const corpoPopup = m => [el('p', 'monumento-fonte', t('layer.fonte', { fonte: tl(m.fonte) }))];

function collegaPopup(map) {
  let popup = null;
  map.on('click', e => {
    if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
    const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
    if (!f) { popup?.remove(); return; }
    const modello = modelloPopupAlbero(completo(f.properties));
    popup = apriPopupScheda(map, { precedente: popup, sezione: 'Alberi monumentali', icona: 'albero', colore: COLORE, modello, corpo: corpoPopup(modello), punto: e.point, lngLat: e.lngLat });
  });
  registraTooltipStrati(map, [{ layers: [PUNTI], icona: 'albero', sezione: 'Alberi monumentali', colore: () => COLORE, campione: () => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(ICONA, COLORE)]), modello: p => modelloPopupAlbero(completo(p)) }]);
  map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-alberi lg-alberi');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Alberi monumentali'));
  legenda.append(voceStrato(simboloGlifo(ICONA, COLORE), 'Albero monumentale (MASAF)', 'alberi'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'alberi',
  titolo: 'Alberi monumentali',
  argomento: { titolo: 'Alberi monumentali', descrizione: 'Alberi monumentali di Palermo dell\'elenco del MASAF, con specie, dimensioni e criteri di monumentalità.' },
  gruppo: 'monumenti', // dentro «Monumenti»
  sezione: 'Alberi monumentali',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('alberi_monumentali/alberi.geojson') });
  },
  aggiungiLayer(map) {
    registraGlifo(map, ICONA);
    map.addLayer(layerGlifo({ id: PUNTI, source: SRC, icona: ICONA, colore: COLORE, layout: { visibility: 'none' } }));
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaPopup(map);
  },
  async avvia() {
    const dati = await (await fetch(urlDati('alberi_monumentali/alberi.geojson'))).json(); // già in cache: è il file della sorgente
    for (const f of dati.features) dettagli.set(f.properties.id, f.properties);
  },
  legendaPannello: '.lg-alberi', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{ id: 'alberi', etichetta: 'Alberi monumentali (MASAF)', layers: [PUNTI], attivo: false, legenda: '.legenda-alberi',
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; } }],
  pannello: creaLegenda,
  scheda: {
    vicini: { max: 5 }, // anche i punti nei dintorni del clic (raggio: regolabile dalla legenda, core/raggio-vicini.js) (vedi docs/NUOVO_LAYER.md)
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceAlbero(completo(f.properties))];
      });
    },
  },
};
