import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { tl } from '../core/i18n.js';
import { MISSIONI, coloreMissione, modelloTooltipPnrr, voceScheda } from './scheda-pnrr.js';

// Progetti del PNRR localizzati nella sola città di Palermo (open data di Italia Domani, dati/pnrr/, workflow «Aggiorna PNRR»).
// Un punto per progetto con un indirizzo trovato nei civici (civico esatto o solo la via); gli altri stanno solo nel CSV.
// La legenda fa da filtro e sceglie il colore per missione; lo strato «hit» trasparente è sempre presente, così la scheda di destra
// mostra i progetti anche a strato spento.
const SRC = 'pnrr';
const PUNTI = 'pnrr-punti';
const HIT = 'pnrr-hit';

let mappa = null;
let legenda = null;
const accese = new Set(MISSIONI.map(([c]) => c));

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

const colore = () => ['match', ['get', 'missione'], ...MISSIONI.flatMap(([c, , col]) => [c, col]), '#868e96'];

function applicaFiltri() {
  if (!mappa?.getLayer(PUNTI)) return;
  const f = filtroInsieme(['get', 'missione'], accese, MISSIONI.length);
  mappa.setFilter(PUNTI, f);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-pnrr lg-pnrr');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'PNRR – Progetti a Palermo'));
  for (const [codice, nome, col] of MISSIONI) {
    const simbolo = el('i', 'monumenti-pallino');
    simbolo.style.background = col;
    legenda.append(voceFiltro(simbolo, `${codice} · ${tl(nome)}`, acceso => { acceso ? accese.add(codice) : accese.delete(codice); applicaFiltri(); }));
  }
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'pnrr',
  titolo: 'PNRR – Progetti a Palermo',
  argomento: {
    titolo: 'PNRR – Progetti a Palermo',
    descrizione: 'Progetti del Piano nazionale di ripresa e resilienza localizzati nella sola città di Palermo (open data di Italia Domani): missione, stato di avanzamento, importi e soggetto attuatore. Sulla mappa i progetti con un indirizzo; l’elenco completo si scarica in CSV.',
  },
  gruppo: 'territorio',
  sezione: 'PNRR', // sottogruppo a sé in Territorio
  sezioniFisse: true, // il titolo non viaggia con lo strato nel riordino
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('pnrr/pnrr.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, layout: { visibility: 'none' },
      paint: {
        'circle-color': colore(), 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 17, 8],
        // la posizione «solo via» è approssimata: cerchio più trasparente
        'circle-opacity': ['case', ['==', ['get', 'precisione'], 'via'], 0.6, 0.95],
      },
    });
    // trasparente e sempre presente: la scheda del luogo mostra i progetti anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{
      layers: [PUNTI], icona: 'euro', modello: modelloTooltipPnrr,
      campione: p => campioneTooltip('legenda-pnrr', ['monumenti-pallino', { background: coloreMissione(p.missione) }]),
    }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
  },
  legendaPannello: '.lg-pnrr', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'pnrr', etichetta: 'Progetti PNRR', layers: [PUNTI], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return tutti(trovati, HIT)
        .map(f => voceScheda(f.properties))
        .filter(v => !visti.has(v.chiave) && visti.add(v.chiave))
        .slice(0, 6);
    },
  },
};
