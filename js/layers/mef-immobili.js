import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { modelloTooltipMef, voceMef } from './scheda-mef.js';
import { tl } from '../core/i18n.js';

// Beni immobili del Comune di Palermo dichiarati al censimento del MEF (dati/mef-immobili/, workflow «Aggiorna MEF»).
// Gli edifici con almeno un bene sono poligoni (un colore se i beni sono più d'uno); terreni e beni georiferiti solo dalla strada o
// dal comune restano punti. L'elenco dei beni sta nella proprietà `beni` (JSON) ed è letto dalla scheda di destra, anche a strato
// spento (layer «hit» trasparenti, sempre presenti). Stile provvisorio, come per gli immobili comunali.
const SRC = 'mef-immobili';
const FILL = 'mef-immobili-fill';
const LINEA = 'mef-immobili-linea';
const PUNTI = 'mef-immobili-punti';
const FILL_TERRENO = 'mef-immobili-terreno';
const LINEA_TERRENO = 'mef-immobili-terreno-linea';
const HIT = 'mef-immobili-hit';
const HIT_PUNTI = 'mef-immobili-hit-punti';
const MAX_NELLA_SCHEDA = 6;

const COLORE_UNO = '#d9822b';
const COLORE_PIU = '#a4501a';
const COLORE_TERRENO = '#6a994e';
const COLORE_PUNTO = '#7a7a7a';
const EDIFICIO = ['==', ['get', 'forma'], 'edificio'];
const PUNTO = ['==', ['get', 'forma'], 'punto'];
const TERRENO = ['==', ['get', 'forma'], 'terreno'];
const POLIGONO = ['!=', ['get', 'forma'], 'punto'];

let legenda = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-mef');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Immobili dichiarati al MEF'));
  for (const [colore, testo, tondo] of [
    [COLORE_UNO, 'Edificio con un bene', false],
    [COLORE_PIU, 'Edificio con più beni', false],
    [COLORE_TERRENO, 'Terreno (particella catastale)', false],
    [COLORE_PUNTO, 'Bene senza poligono', true],
  ]) {
    const riga = el('div', 'mef-legenda-riga');
    const simbolo = el('i', tondo ? 'monumenti-pallino' : 'mef-campione');
    simbolo.style.background = colore;
    riga.append(simbolo, tl(testo));
    legenda.append(riga);
  }
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'mef-immobili',
  titolo: 'Immobili dichiarati al MEF',
  argomento: {
    titolo: 'Immobili dichiarati al MEF',
    descrizione: 'Beni immobili del Comune di Palermo dichiarati al censimento del Ministero dell’economia e delle finanze, agganciati agli edifici in base alla posizione.',
  },
  gruppo: 'territorio',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('mef-immobili/mef_immobili.geojson') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, filter: EDIFICIO, layout: nascosto,
      paint: { 'fill-color': ['case', ['>', ['get', 'n_beni'], 1], COLORE_PIU, COLORE_UNO], 'fill-opacity': 0.65 },
    });
    map.addLayer({
      id: LINEA, type: 'line', source: SRC, filter: EDIFICIO, layout: nascosto,
      paint: { 'line-color': '#5c2e0b', 'line-width': 0.8 },
    });
    map.addLayer({
      id: FILL_TERRENO, type: 'fill', source: SRC, filter: TERRENO, layout: nascosto,
      paint: { 'fill-color': COLORE_TERRENO, 'fill-opacity': 0.4 },
    });
    map.addLayer({
      id: LINEA_TERRENO, type: 'line', source: SRC, filter: TERRENO, layout: nascosto,
      paint: { 'line-color': '#386641', 'line-width': 1, 'line-dasharray': [3, 2] },
    });
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, filter: PUNTO, layout: nascosto,
      paint: {
        'circle-color': COLORE_PUNTO, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 17, 7],
      },
    });
    // trasparenti e sempre presenti: la scheda del luogo mostra i beni anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, filter: POLIGONO, paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: HIT_PUNTI, type: 'circle', source: SRC, filter: PUNTO, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [FILL, FILL_TERRENO, PUNTI], modello: modelloTooltipMef }]);
    for (const id of [FILL, FILL_TERRENO, PUNTI]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  strati: [{
    id: 'mef-immobili', etichetta: 'Immobili dichiarati al MEF', layers: [FILL, LINEA, FILL_TERRENO, LINEA_TERRENO, PUNTI], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT, HIT_PUNTI],
    voci(trovati) {
      const visti = new Set();
      return [...tutti(trovati, HIT_PUNTI), ...tutti(trovati, HIT)]
        .map(f => voceMef(f.properties))
        .filter(v => !visti.has(v.chiave) && visti.add(v.chiave))
        .slice(0, MAX_NELLA_SCHEDA);
    },
  },
};
