import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { voceAlbero, modelloPopupAlbero } from './scheda-alberi.js';

const COLORE = '#2f7d32';
const SRC = 'alberi';
const PUNTI = 'alberi-punti';
const HIT = 'alberi-hit-punti'; // punti trasparenti, sempre presenti: la scheda mostra l'albero anche a strato spento

const dettagli = new Map(); // id -> proprietà complete
const completo = p => dettagli.get(p.id) ?? p;
let legenda = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function contenutoPopup(p) {
  const m = modelloPopupAlbero(p);
  const radice = el('div', 'monumento-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  for (const r of m.righe) radice.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
  radice.append(el('p', 'monumento-fonte', `Fonte: ${m.fonte}`));
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
  registraTooltipStrati(map, [{ layers: [PUNTI], modello: p => modelloPopupAlbero(completo(p)) }]);
  map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-alberi');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Alberi monumentali'));
  const pallino = el('i', 'monumenti-pallino');
  pallino.style.background = COLORE;
  legenda.append(voceStrato(pallino, 'Albero monumentale (MASAF)', 'alberi'));
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
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, layout: { visibility: 'none' },
      paint: {
        'circle-color': COLORE, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 8],
      },
    });
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaPopup(map);
  },
  async avvia() {
    const dati = await (await fetch(urlDati('alberi_monumentali/alberi.geojson'))).json(); // già in cache: è il file della sorgente
    for (const f of dati.features) dettagli.set(f.properties.id, f.properties);
  },
  strati: [{ id: 'alberi', etichetta: 'Alberi monumentali (MASAF)', layers: [PUNTI], attivo: false, legenda: '.legenda-alberi',
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; } }],
  pannello: creaLegenda,
  scheda: {
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
