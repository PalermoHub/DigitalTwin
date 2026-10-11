import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { voceFiltro } from '../core/legenda.js';
import { tl } from '../core/i18n.js';
import { COLORE_ENTRATA, COLORE_USCITA, COLORE_PALERMO, modelloTooltipPendolarismo, voceScheda } from './scheda-pendolarismo.js';
import { contenutoDinamico } from './scheda-pendolarismo-dom.js';

// Pendolarismo per lavoro da e verso Palermo (ISTAT 2021): archi curvi tra Palermo e i comuni collegati (arancio = uscita,
// blu = entrata, spessore secondo i pendolari) e un punto per comune. La legenda filtra la direzione e sceglie se mostrare
// solo i collegamenti principali o tutti; il layer «hit» è sempre presente, così la scheda mostra i dati anche a strato spento.
const SRC = 'pendolarismo';
const ARCHI = 'pendolarismo-archi';
const NODI = 'pendolarismo-nodi';
const PALERMO = 'pendolarismo-palermo';
const HIT = 'pendolarismo-hit';
const ARCO = ['==', ['get', 'tipo'], 'arco'];
const COMUNE = ['==', ['get', 'tipo'], 'comune'];

let mappa = null;
let legenda = null;
let nodi = []; // proprietà di Palermo e dei comuni collegati, per la scheda
const direzioni = new Set(['uscita', 'entrata']);
let tuttiICollegamenti = false;

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

function applicaFiltri() {
  if (!mappa?.getLayer(ARCHI)) return;
  const filtri = [ARCO, ['in', ['get', 'direzione'], ['literal', [...direzioni]]]];
  if (!tuttiICollegamenti) filtri.push(['==', ['get', 'evidenza'], true]);
  mappa.setFilter(ARCHI, ['all', ...filtri]);
  // i comuni seguono gli archi: senza «tutti i collegamenti» restano quelli con almeno un arco principale
  mappa.setFilter(NODI, tuttiICollegamenti ? COMUNE : ['all', COMUNE, ['==', ['get', 'evidenza'], true]]);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-pendolarismo');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Pendolarismo da e verso Palermo 2021'));
  for (const [chiave, colore, testo] of [['uscita', COLORE_USCITA, 'Uscita (residenti che lavorano fuori)'], ['entrata', COLORE_ENTRATA, 'Entrata (lavoratori da fuori)']]) {
    const simbolo = el('i', 'pend-linea');
    simbolo.style.background = colore;
    legenda.append(voceFiltro(simbolo, testo, acceso => { acceso ? direzioni.add(chiave) : direzioni.delete(chiave); applicaFiltri(); }));
  }
  const tutti = el('label', 'monumenti-cat');
  const casella = document.createElement('input');
  casella.type = 'checkbox';
  casella.addEventListener('change', () => { tuttiICollegamenti = casella.checked; applicaFiltri(); });
  tutti.append(casella, tl('Mostra tutti i collegamenti'));
  legenda.append(tutti, el('p', 'scheda-nota', 'Di default i primi 25 collegamenti per direzione, con quota di almeno l\'1%.'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'pendolarismo',
  titolo: 'Pendolarismo da e verso Palermo 2021',
  argomento: {
    titolo: 'Pendolarismo da e verso Palermo 2021',
    descrizione: 'Spostamenti casa-lavoro tra Palermo e gli altri comuni (ISTAT, Censimento 2021): chi esce, chi entra e quanti vivono e lavorano in città, con classifiche dei comuni collegati.',
  },
  gruppo: 'popolazione',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('pendolarismo/pendolarismo.geojson') });
    fetch(urlDati('pendolarismo/pendolarismo.geojson')).then(r => r.json())
      .then(d => { nodi = d.features.map(f => f.properties).filter(p => p.tipo !== 'arco'); })
      .catch(() => { nodi = []; });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    const colore = ['match', ['get', 'direzione'], 'entrata', COLORE_ENTRATA, COLORE_USCITA];
    map.addLayer({
      id: ARCHI, type: 'line', source: SRC, filter: ['all', ARCO, ['==', ['get', 'evidenza'], true]], layout: { ...nascosto, 'line-cap': 'round' },
      paint: { 'line-color': colore, 'line-opacity': 0.7, 'line-width': ['interpolate', ['linear'], ['sqrt', ['get', 'pendolari']], 1, 0.6, 20, 1.6, 60, 4, 140, 8] },
    });
    map.addLayer({
      id: NODI, type: 'circle', source: SRC, filter: ['all', COMUNE, ['==', ['get', 'evidenza'], true]], layout: nascosto,
      paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 2, 12, 5], 'circle-color': ['case', ['>=', ['get', 'saldo'], 0], COLORE_ENTRATA, COLORE_USCITA], 'circle-stroke-color': '#fff', 'circle-stroke-width': 1 },
    });
    map.addLayer({
      id: PALERMO, type: 'circle', source: SRC, filter: ['==', ['get', 'tipo'], 'palermo'], layout: nascosto,
      paint: { 'circle-radius': 9, 'circle-color': COLORE_PALERMO, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    });
    // trasparente e sempre presente: la scheda del luogo mostra il pendolarismo anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC, filter: ['!=', ['get', 'tipo'], 'arco'], paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [NODI, PALERMO], modello: modelloTooltipPendolarismo }]);
    for (const id of [NODI, PALERMO]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  strati: [{
    id: 'pendolarismo', etichetta: 'Pendolarismo da e verso Palermo 2021', layers: [ARCHI, NODI, PALERMO], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const f = tutti(trovati, HIT)[0];
      return nodi.length ? [voceScheda(nodi, contenutoDinamico, f?.properties)] : [];
    },
  },
};
