import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { voceFontanella, modelloPopupFontanella } from './scheda-fontanelle.js';
import { tl, t } from '../core/i18n.js';
import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';

const COLORE = '#1c7ed6';
const SRC = 'fontanelle';
const ICONA = 'fontanella'; // in mappa è la sagoma dell'icona (vedi core/icone-mappa.js)
const PUNTI = 'fontanelle-punti';
const HIT = 'fontanelle-hit-punti'; // punti trasparenti, sempre presenti: la scheda mostra la fontanella anche a strato spento

const dettagli = new Map(); // id -> proprietà complete
const completo = p => dettagli.get(p.id) ?? p;
let legenda = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function contenutoPopup(p) {
  const m = modelloPopupFontanella(p);
  const radice = el('div', 'monumento-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  for (const r of m.righe) radice.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
  radice.append(el('p', 'monumento-fonte', t('layer.fonte', { fonte: tl(m.fonte) })));
  return radice;
}

function collegaPopup(map) {
  let popup = null;
  map.on('click', e => {
    if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
    const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
    popup?.remove();
    if (!f) return;
    popup = new maplibregl.Popup({ maxWidth: '280px', className: 'monumento-popup-box', offset: 8 })
      .setLngLat(e.lngLat).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
  });
  registraTooltipStrati(map, [{ layers: [PUNTI], icona: 'fontanella', campione: () => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(ICONA, COLORE)]), modello: p => modelloPopupFontanella(completo(p)) }]);
  map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-fontanelle lg-fontanelle');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Fontanelle'));
  legenda.append(voceStrato(simboloGlifo(ICONA, COLORE), 'Fontanella pubblica', 'fontanelle'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'fontanelle',
  titolo: 'Fontanelle',
  argomento: { titolo: 'Fontanelle', descrizione: 'Fontanelle pubbliche di Palermo, con indirizzo e link agli approfondimenti su PalermoHub.' },
  gruppo: 'monumenti', // dentro «Monumenti»
  sezione: 'Fontanelle',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('fontanelle/fontanelle.geojson') });
  },
  aggiungiLayer(map) {
    registraGlifo(map, ICONA);
    map.addLayer(layerGlifo({ id: PUNTI, source: SRC, icona: ICONA, colore: COLORE, layout: { visibility: 'none' } }));
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaPopup(map);
  },
  async avvia() {
    const dati = await (await fetch(urlDati('fontanelle/fontanelle.geojson'))).json(); // già in cache: è il file della sorgente
    for (const f of dati.features) dettagli.set(f.properties.id, f.properties);
  },
  legendaPannello: '.lg-fontanelle', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{ id: 'fontanelle', etichetta: 'Fontanelle pubbliche', layers: [PUNTI], attivo: false, legenda: '.legenda-fontanelle',
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; } }],
  pannello: creaLegenda,
  scheda: {
    vicini: { raggio: 200, max: 5 }, // anche i punti nei dintorni del clic (vedi docs/NUOVO_LAYER.md)
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceFontanella(completo(f.properties))];
      });
    },
  },
};
