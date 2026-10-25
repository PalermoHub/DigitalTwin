import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { coloriMef, modelloTooltipMef, voceMef } from './scheda-mef.js';
import { coloraEdifici3d, volumi3dAcceso } from '../core/colori-3d.js';
import { tl } from '../core/i18n.js';
import { voceFiltro } from '../core/legenda.js';
import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';

// Beni immobili del Comune di Palermo dichiarati al censimento del MEF (dati/mef-immobili/, workflow «Aggiorna MEF»).
// Gli edifici con almeno un bene sono poligoni (un colore se i beni sono più d'uno); terreni e beni georiferiti solo dalla strada o
// dal comune restano punti. L'elenco dei beni sta nella proprietà `beni` (JSON) ed è letto dalla scheda di destra, anche a strato
// spento (layer «hit» trasparenti, sempre presenti). Stile provvisorio, come per gli immobili comunali.
const SRC = 'mef-immobili';
const FILL = 'mef-immobili-fill';
const LINEA = 'mef-immobili-linea';
const ICONA = 'euro'; // in mappa il bene puntuale è la sagoma dell'icona (vedi core/icone-mappa.js)
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

// Le quattro voci della legenda sono filtri: ognuna accende o spegne una categoria di elementi (il clic ne isola una).
const CATEGORIE = [
  { chiave: 'uno', colore: COLORE_UNO, testo: 'Edificio con un bene', tondo: false },
  { chiave: 'piu', colore: COLORE_PIU, testo: 'Edificio con più beni', tondo: false },
  { chiave: 'terreno', colore: COLORE_TERRENO, testo: 'Terreno (particella catastale)', tondo: false },
  { chiave: 'punto', colore: COLORE_PUNTO, testo: 'Bene senza poligono', tondo: true },
];
const accese = new Set(CATEGORIE.map(c => c.chiave));
const NESSUNO = ['==', 1, 0];
let mappa = null;
let fidPerPoligono = {}; // id poligono -> {n beni, fid degli edifici} (id del tile edificato), da edifici_fid.json
let stratoAcceso = false;

// Filtro dei layer di ogni forma secondo le categorie accese.
function applicaFiltri() {
  if (!mappa) return;
  const edifici = [accese.has('uno') && ['<=', ['get', 'n_beni'], 1], accese.has('piu') && ['>', ['get', 'n_beni'], 1]].filter(Boolean);
  const filtroEdifici = edifici.length === 2 ? EDIFICIO : edifici.length ? ['all', EDIFICIO, edifici[0]] : NESSUNO;
  const imposta = (ids, filtro) => { for (const id of ids) if (mappa.getLayer(id)) mappa.setFilter(id, filtro); };
  // con i volumi 3D accesi l'edificio si colora nel volume (stesso fid del tile edificato): il poligono piatto sparisce
  const nelVolume = volumi3dAcceso(mappa) && Object.keys(fidPerPoligono).length > 0;
  imposta([FILL, LINEA], nelVolume ? NESSUNO : filtroEdifici);
  coloraEdifici3d(mappa, 'mef-immobili', stratoAcceso ? coloriMef(fidPerPoligono, accese, { uno: COLORE_UNO, piu: COLORE_PIU }) : null);
  imposta([FILL_TERRENO, LINEA_TERRENO], accese.has('terreno') ? TERRENO : NESSUNO);
  imposta([PUNTI], accese.has('punto') ? PUNTO : NESSUNO);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-mef lg-mef-immobili');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Immobili dichiarati al MEF'));
  for (const { chiave, colore, testo, tondo } of CATEGORIE) {
    const simbolo = tondo ? simboloGlifo(ICONA, colore) : el('i', 'mef-campione');
    if (!tondo) simbolo.style.background = colore;
    legenda.append(voceFiltro(simbolo, testo, acceso => { acceso ? accese.add(chiave) : accese.delete(chiave); applicaFiltri(); }));
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
  sezione: '', // nessun titolo proprio: lo strato sta nel sottogruppo «Immobili comunali», che apre lo strato «Immobili comunali» di territorio.js
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('mef-immobili/mef_immobili.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
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
    registraGlifo(map, ICONA);
    map.addLayer({ ...layerGlifo({ id: PUNTI, source: SRC, icona: ICONA, colore: COLORE_PUNTO, layout: nascosto }), filter: PUNTO });
    // trasparenti e sempre presenti: la scheda del luogo mostra i beni anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, filter: POLIGONO, paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: HIT_PUNTI, type: 'circle', source: SRC, filter: PUNTO, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [FILL, FILL_TERRENO, PUNTI], icona: 'monumento', sezione: 'Immobili dichiarati al MEF', colore: () => COLORE_UNO, modello: modelloTooltipMef,
      campione: (p, id) => {
        const col = id === FILL ? (p.n_beni > 1 ? COLORE_PIU : COLORE_UNO) : id === FILL_TERRENO ? COLORE_TERRENO : COLORE_PUNTO;
        return campioneTooltip('legenda-mef', id === PUNTI ? ['monumenti-pallino', stileGlifo(ICONA, col)] : ['mef-campione', { background: col }]);
      } }]);
    for (const id of [FILL, FILL_TERRENO, PUNTI]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  legendaPannello: '.lg-mef-immobili', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'mef-immobili', etichetta: 'Immobili dichiarati al MEF', layers: [FILL, LINEA, FILL_TERRENO, LINEA_TERRENO, PUNTI], attivo: false,
    suCambio(attivo) {
      stratoAcceso = attivo;
      applicaFiltri();
      if (legenda) legenda.hidden = !attivo;
    },
  }],
  async avvia() {
    try {
      fidPerPoligono = await (await fetch(urlDati('mef-immobili/edifici_fid.json'))).json();
    } catch { fidPerPoligono = {}; } // senza il file gli edifici restano poligoni piatti
    document.addEventListener('vista3d', applicaFiltri); // i volumi 3D si accendono e spengono
    applicaFiltri();
  },
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
