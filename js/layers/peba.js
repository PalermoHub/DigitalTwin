import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { tl } from '../core/i18n.js';
import { GRUPPI, LIVELLI, modelloTooltipPeba, voceScheda } from './scheda-peba.js';
import { contenutoDinamico } from './scheda-peba-dom.js';

// PEBA (Piano di Eliminazione delle Barriere Architettoniche, Comune di Palermo): edifici e aree verdi sono poligoni, vie, percorsi
// e piazze punti. La legenda fa da filtro (livello di accessibilità e gruppo) e sceglie il colore della mappa; i layer «hit»
// trasparenti sono sempre presenti, così la scheda di destra mostra i dati anche a strato spento.
const SRC = 'peba';
const FILL = 'peba-fill';
const LINEA = 'peba-linea';
const PUNTI = 'peba-punti';
const HIT = 'peba-hit';
const HIT_PUNTI = 'peba-hit-punti';
const PUNTO = ['==', ['get', 'forma'], 'punto'];
const POLIGONO = ['!=', ['get', 'forma'], 'punto'];

let mappa = null;
let legenda = null;
let modo = 'livello'; // colore della mappa e del tooltip: 'livello' | 'gruppo'
const livelliAccesi = new Set(LIVELLI.map(([n]) => n));
const gruppiAccesi = new Set(GRUPPI.map(([n]) => n));
const simboliGruppo = []; // [elemento, colore]: in modo «livello» le voci dei gruppi restano neutre

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

// espressione di colore secondo la modalità
function colore() {
  const [propr, palette] = modo === 'gruppo' ? ['gruppo', GRUPPI] : ['livello', LIVELLI];
  return ['match', ['get', propr], ...palette.flatMap(([nome, c]) => [nome, c]), '#999999'];
}

function applicaFiltri() {
  if (!mappa) return;
  const filtri = [filtroInsieme(['get', 'livello'], livelliAccesi, LIVELLI.length), filtroInsieme(['get', 'gruppo'], gruppiAccesi, GRUPPI.length)].filter(Boolean);
  const con = forma => (filtri.length ? ['all', forma, ...filtri] : forma);
  for (const id of [FILL, LINEA]) if (mappa.getLayer(id)) mappa.setFilter(id, con(POLIGONO));
  if (mappa.getLayer(PUNTI)) mappa.setFilter(PUNTI, con(PUNTO));
}

function applicaColore() {
  for (const [simbolo, c] of simboliGruppo) simbolo.style.background = modo === 'gruppo' ? c : '#c7ccd6';
  if (!mappa) return;
  mappa.setPaintProperty(FILL, 'fill-color', colore());
  mappa.setPaintProperty(PUNTI, 'circle-color', colore());
}

function famiglia(titolo, voci, accesi, perGruppo) {
  const blocco = el('div', 'peba-famiglia'); // un contenitore per famiglia: il clic isola solo dentro la propria
  blocco.append(el('em', 'peba-legenda-titolo', titolo));
  for (const [nome, c] of voci) {
    const simbolo = el('i', 'mef-campione');
    simbolo.style.background = c;
    if (perGruppo) simboliGruppo.push([simbolo, c]);
    blocco.append(voceFiltro(simbolo, nome, acceso => { acceso ? accesi.add(nome) : accesi.delete(nome); applicaFiltri(); }));
  }
  return blocco;
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-peba');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'PEBA – Barriere architettoniche'));
  const scelta = el('div', 'peba-modo');
  scelta.append(el('span', null, 'Colora per'));
  for (const [chiave, testo] of [['livello', 'Accessibilità'], ['gruppo', 'Gruppo']]) {
    const b = el('button', null, testo);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(chiave === modo));
    b.addEventListener('click', () => {
      modo = chiave;
      for (const x of scelta.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
      applicaColore();
    });
    scelta.append(b);
  }
  legenda.append(scelta, famiglia('Accessibilità', LIVELLI, livelliAccesi, false), famiglia('Gruppo', GRUPPI, gruppiAccesi, true));
  applicaColore();
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'peba',
  titolo: 'PEBA – Barriere architettoniche',
  argomento: {
    titolo: 'PEBA – Barriere architettoniche',
    descrizione: 'Piano di Eliminazione delle Barriere Architettoniche del Comune di Palermo: sedi, scuole, asili, aree verdi, percorsi e siti UNESCO con livello di accessibilità, criticità riscontrate, foto del sopralluogo e scheda PDF.',
  },
  gruppo: 'territorio',
  sezione: 'PEBA', // sottogruppo a sé in Territorio, distinto dagli immobili comunali
  sezioniFisse: true, // il titolo non viaggia con lo strato nel riordino
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('peba/peba.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    map.addLayer({ id: FILL, type: 'fill', source: SRC, filter: POLIGONO, layout: nascosto, paint: { 'fill-color': colore(), 'fill-opacity': 0.7 } });
    map.addLayer({ id: LINEA, type: 'line', source: SRC, filter: POLIGONO, layout: nascosto, paint: { 'line-color': '#1f2937', 'line-width': 0.8 } });
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, filter: PUNTO, layout: nascosto,
      paint: { 'circle-color': colore(), 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 17, 8] },
    });
    // trasparenti e sempre presenti: la scheda del luogo mostra le schede PEBA anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, filter: POLIGONO, paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: HIT_PUNTI, type: 'circle', source: SRC, filter: PUNTO, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [FILL, PUNTI], icona: 'casa', modello: p => modelloTooltipPeba(p, modo) }]);
    for (const id of [FILL, PUNTI]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  strati: [{
    id: 'peba', etichetta: 'Barriere architettoniche', layers: [FILL, LINEA, PUNTI], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT, HIT_PUNTI],
    voci(trovati) {
      const visti = new Set();
      return [...tutti(trovati, HIT_PUNTI), ...tutti(trovati, HIT)]
        .map(f => voceScheda(f.properties, contenutoDinamico))
        .filter(v => !visti.has(v.chiave) && visti.add(v.chiave))
        .slice(0, 6);
    },
  },
};
