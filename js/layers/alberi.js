import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { voceAlbero, modelloPopupAlbero } from './scheda-alberi.js';
import { tl, t } from '../core/i18n.js';
import { registraForme, layerForme, stileForma, simboloForma } from '../core/forme.js';

const COLORE = '#2f7d32';
const SRC = 'alberi';
const FORMA = 'triangolo'; // ogni layer ha la sua forma (vedi core/forme.js)
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

function contenutoPopup(p) {
  const m = modelloPopupAlbero(p);
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
  registraTooltipStrati(map, [{ layers: [PUNTI], icona: 'albero', campione: () => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileForma(FORMA, COLORE)]), modello: p => modelloPopupAlbero(completo(p)) }]);
  map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-alberi lg-alberi');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Alberi monumentali'));
  legenda.append(voceStrato(simboloForma(FORMA, COLORE), 'Albero monumentale (MASAF)', 'alberi'));
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
    registraForme(map, [FORMA]);
    map.addLayer(layerForme({ id: PUNTI, source: SRC, forma: FORMA, colore: COLORE, layout: { visibility: 'none' } }));
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
    vicini: { raggio: 200, max: 5 }, // anche i punti nei dintorni del clic (vedi docs/NUOVO_LAYER.md)
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
