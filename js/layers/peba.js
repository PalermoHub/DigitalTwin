import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { coloraEdifici3d, coloriPerFid, volumi3dAcceso } from '../core/colori-3d.js';
import { tl } from '../core/i18n.js';
import { clicSu } from '../core/scheda-navigazione.js';
import { GRUPPI, LIVELLI, modelloTooltipPeba, voceScheda, puntoInterno } from './scheda-peba.js';
import { contenutoDinamico, barraSchede, EVENTO_FILTRI_PEBA } from './scheda-peba-dom.js';
import { registraGlifo, layerGlifo, espressioneGlifo, simboloGlifo } from '../core/icone-mappa.js';

// PEBA (Piano di Eliminazione delle Barriere Architettoniche, Comune di Palermo): edifici e aree verdi sono poligoni, vie, percorsi
// e piazze punti. La legenda fa da filtro (livello di accessibilità e gruppo) e sceglie il colore della mappa; i layer «hit»
// trasparenti sono sempre presenti, così la scheda di destra mostra i dati anche a strato spento.
const SRC = 'peba';
const FILL = 'peba-fill';
const LINEA = 'peba-linea';
// Un'icona per ogni gruppo (vedi core/icone-mappa.js): in mappa la portano i punti (percorsi, vie, piazze), in legenda tutti i gruppi.
const ICONE_GRUPPI = [
  ['Percorso storico', 'monumento'], ['Via cittadina', 'camminata'], ['Scuola', 'scuola'], ['Asilo', 'popolazione'],
  ['Sede amministrativa/istituzionale', 'uffici'], ['Area verde', 'parco'], ['Sito UNESCO (edificio)', 'vincolo'],
  ['Percorso UNESCO', 'mappa'], ['Piazza', 'indirizzo'], ['Museo', 'tavolozza'],
];
const ICONA_ALTRI = 'indirizzo';
const iconaGruppo = nome => ICONE_GRUPPI.find(([n]) => n === nome)?.[1] ?? ICONA_ALTRI;
const PUNTI = 'peba-punti';
const HIT = 'peba-hit';
const HIT_PUNTI = 'peba-hit-punti';
const PUNTO = ['==', ['get', 'forma'], 'punto'];
const POLIGONO = ['!=', ['get', 'forma'], 'punto'];

let mappa = null;
let legenda = null;
let stratoAcceso = false;
let fidPerCodice = {}; // codice PEBA -> fid degli edifici (id del tile edificato), da edifici_fid.json
const schede = new Map(); // codice -> proprietà (livello e gruppo colorano il volume 3D)
const centri = new Map(); // codice -> punto su cui cliccare per aprirne la scheda
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

// Con i volumi 3D accesi gli edifici si colorano nel volume (stesso fid del tile edificato) e il poligono piatto resta solo per le aree verdi.
function colora3d() {
  if (!mappa) return;
  const [propr, palette] = modo === 'gruppo' ? ['gruppo', GRUPPI] : ['livello', LIVELLI];
  const fuori = Object.keys(fidPerCodice).filter(c => {
    const p = schede.get(c);
    return !p || !livelliAccesi.has(p.livello) || !gruppiAccesi.has(p.gruppo);
  });
  coloraEdifici3d(mappa, 'peba', stratoAcceso
    ? coloriPerFid(fidPerCodice, c => schede.get(c)?.[propr], Object.fromEntries(palette), palette.map(([n]) => n), fuori) : null);
}

function applicaFiltri() {
  if (!mappa) return;
  const filtri = [filtroInsieme(['get', 'livello'], livelliAccesi, LIVELLI.length), filtroInsieme(['get', 'gruppo'], gruppiAccesi, GRUPPI.length)].filter(Boolean);
  const con = forma => (filtri.length ? ['all', forma, ...filtri] : forma);
  const nelVolume = volumi3dAcceso(mappa) && Object.keys(fidPerCodice).length > 0;
  const poligoni = nelVolume ? ['==', ['get', 'forma'], 'area_verde'] : POLIGONO;
  for (const id of [FILL, LINEA]) if (mappa.getLayer(id)) mappa.setFilter(id, con(poligoni));
  if (mappa.getLayer(PUNTI)) mappa.setFilter(PUNTI, con(PUNTO));
  colora3d();
  document.dispatchEvent(new CustomEvent(EVENTO_FILTRI_PEBA)); // le frecce della scheda contano solo le schede rimaste in mappa
}

function applicaColore() {
  for (const [simbolo, c] of simboliGruppo) simbolo.style.background = modo === 'gruppo' ? c : '#c7ccd6';
  if (!mappa) return;
  mappa.setPaintProperty(FILL, 'fill-color', colore());
  mappa.setPaintProperty(PUNTI, 'icon-color', colore());
  colora3d();
}

// Schede che i filtri della legenda lasciano in mappa
const visibili = () => [...schede.values()].filter(p => livelliAccesi.has(p.livello ?? 'Non valutabile') && gruppiAccesi.has(p.gruppo));

// Le frecce della scheda scelgono la scheda da aprire: il clic simulato, dove ce ne sono di sovrapposte, mette la scelta per prima
const FINESTRA_SCELTA_MS = 1500;
let scelto = null;
function vaiAScheda(p) {
  const c = centri.get(p.codice);
  if (c && mappa) clicSu(mappa, c, () => { scelto = { codice: p.codice, fino: Date.now() + FINESTRA_SCELTA_MS }; });
}
const inTesta = codice => (scelto && Date.now() < scelto.fino && scelto.codice === codice ? 0 : 1);

function famiglia(titolo, voci, accesi, perGruppo) {
  const blocco = el('div', 'peba-famiglia'); // un contenitore per famiglia: il clic isola solo dentro la propria
  blocco.append(el('em', 'peba-legenda-titolo', titolo));
  for (const [nome, c] of voci) {
    const simbolo = perGruppo ? simboloGlifo(iconaGruppo(nome), c) : el('i', 'mef-campione');
    if (!perGruppo) simbolo.style.background = c;
    if (perGruppo) simboliGruppo.push([simbolo, c]);
    blocco.append(voceFiltro(simbolo, nome, acceso => { acceso ? accesi.add(nome) : accesi.delete(nome); applicaFiltri(); }));
  }
  return blocco;
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-peba lg-peba');
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
    for (const icona of new Set([...ICONE_GRUPPI.map(([, i]) => i), ICONA_ALTRI])) registraGlifo(map, icona);
    map.addLayer({ ...layerGlifo({ id: PUNTI, source: SRC, immagine: espressioneGlifo('gruppo', ICONE_GRUPPI, ICONA_ALTRI), colore: colore(), layout: nascosto }), filter: PUNTO });
    // trasparenti e sempre presenti: la scheda del luogo mostra le schede PEBA anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, filter: POLIGONO, paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: HIT_PUNTI, type: 'circle', source: SRC, filter: PUNTO, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [FILL, PUNTI], icona: 'casa', modello: p => modelloTooltipPeba(p, modo) }]);
    for (const id of [FILL, PUNTI]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  legendaPannello: '.lg-peba', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'peba', etichetta: 'Barriere architettoniche', layers: [FILL, LINEA, PUNTI], attivo: false,
    suCambio(attivo) {
      stratoAcceso = attivo;
      applicaFiltri();
      if (legenda) legenda.hidden = !attivo;
    },
  }],
  async avvia() {
    try {
      const dati = await (await fetch(urlDati('peba/peba.geojson'))).json(); // già in cache: è il file della sorgente
      for (const f of dati.features) {
        schede.set(f.properties.codice, f.properties);
        const c = puntoInterno(f.geometry);
        if (c) centri.set(f.properties.codice, c);
      }
      fidPerCodice = await (await fetch(urlDati('peba/edifici_fid.json'))).json();
    } catch { fidPerCodice = {}; } // senza i dati gli edifici restano poligoni piatti
    document.addEventListener('vista3d', applicaFiltri); // i volumi 3D si accendono e spengono
    applicaFiltri();
  },
  pannello: creaLegenda,
  scheda: {
    layers: [HIT, HIT_PUNTI],
    voci(trovati) {
      const visti = new Set();
      return [...tutti(trovati, HIT_PUNTI), ...tutti(trovati, HIT)]
        .sort((a, b) => inTesta(a.properties.codice) - inTesta(b.properties.codice))
        .map(f => voceScheda(f.properties, p => { const radice = contenutoDinamico(p); radice.prepend(barraSchede(p.codice, visibili, vaiAScheda)); return radice; }))
        .filter(v => !visti.has(v.chiave) && visti.add(v.chiave))
        .slice(0, 6);
    },
  },
};
