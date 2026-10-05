import { urlDati, pmt } from '../core/config.js';
import { tutti } from '../core/scheda-util.js';
import { coloriClassi, espressioneColore, etichetteClassi, NODATA } from './isole-calore-classi.js';
import { graficoAndamento } from './isole-calore-grafico.js';
import { voceIsolaCalore } from './scheda-isole-calore.js';

// Isole di calore: temperatura superficiale estiva (LST, Landsat 8/9) per sezione censuaria. La mappa mostra l'ultimo anno,
// il grafico 2019–2025 sta nella scheda del luogo (anche a strato spento: layer «hit» trasparente) e nella legenda (media comunale).
// Le soglie dei tre metodi di classificazione (3–9 classi) sono già calcolate in dati/isole-calore/isole-calore.json.
// Lo studio completo (altri anni, bivariata, «isola vera») è un'app a parte: il link sta in legenda e in scheda.
const SRC = 'isole-calore';
const FILL = 'isole-calore-fill';
const BORDO = 'isole-calore-bordo';
const HIT = 'isole-calore-hit';
const MINZOOM = 10;
// Icona = istogramma con le linee di rottura tipiche del metodo (posizioni x delle linee)
const METODI = [
  ['jenks', 'Jenks', 'Jenks (rotture naturali): i limiti cadono dove i dati hanno salti', [9, 19]],
  ['quantile', 'Quantili', 'Quantili: stesso numero di sezioni in ogni classe', [7, 15, 23]],
  ['equal', 'Intervalli', 'Intervalli uguali: classi di ampiezza identica', [8, 16, 24]],
];
const BARRE = [[1, 10, 9], [6, 6, 13], [11, 12, 7], [16, 3, 16], [21, 8, 11], [26, 14, 5]]; // x, y, altezza
const iconaMetodo = linee => '<svg viewBox="0 0 32 20" class="ic-icona" aria-hidden="true">'
  + BARRE.map(([x, y, h]) => `<rect x="${x}" y="${y}" width="4" height="${h}" fill="currentColor"/>`).join('')
  + linee.map(x => `<line x1="${x}" y1="0" x2="${x}" y2="20" class="ic-rottura"/>`).join('') + '</svg>';

let dati = null;
let legenda = null;
let metodo = 'jenks';
let classi = 5;
let mappa = null;

const soglie = () => dati.soglie[metodo][classi];

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Una sezione per `sez`: i tile spezzano le feature.
function distinte(feature) {
  const visti = new Set();
  return feature.filter(f => (visti.has(f.properties.sez) ? false : (visti.add(f.properties.sez), true)));
}

function applicaClassi() {
  if (!mappa || !dati) return;
  mappa.setPaintProperty(FILL, 'fill-color', espressioneColore(`LST_${dati.anno}`, soglie()));
  disegnaScala();
}

const gradi = v => `${v.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;

// Barra a classi (una cella per classe, il limite nel suggerimento), estremi sotto e «Nessun dato».
function disegnaScala() {
  const scala = legenda?.querySelector('.ic-scala');
  if (!scala) return;
  const colori = coloriClassi(classi);
  const nomi = etichetteClassi(soglie());
  const barra = el('div', 'ic-barra');
  nomi.forEach((nome, i) => {
    const c = el('div', 'ic-classe');
    c.style.background = colori[i];
    c.title = `${nome} °C`;
    barra.append(c);
  });
  const assi = el('div', 'ic-assi');
  assi.append(el('span', null, gradi(dati.soglie[metodo][classi][0])), el('i', 'ic-freccia'), el('span', null, gradi(dati.soglie[metodo][classi].at(-1))));
  const nd = el('div', 'ic-nd');
  const c = el('i');
  c.style.background = NODATA;
  nd.append(c, 'Nessun dato');
  scala.replaceChildren(barra, assi, nd);
  const n = legenda.querySelector('.ic-n');
  if (n) n.textContent = String(classi);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-isole-calore');
  legenda.hidden = true;
  document.getElementById('legende').append(legenda);
}

function riempiLegenda() {
  if (!legenda || !dati || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  legenda.append(el('strong', null, `Temperatura superficiale estiva ${dati.anno} (°C)`));
  legenda.append(el('p', 'uffici-nota', 'Per sezione censuaria, da satellite Landsat: non è la temperatura dell\'aria'));

  legenda.append(el('span', 'ic-etichetta', 'Metodo di classificazione'));
  const bottoni = el('div', 'ic-metodi');
  bottoni.setAttribute('role', 'group');
  bottoni.setAttribute('aria-label', 'Metodo di classificazione');
  for (const [id, nome, aiuto, linee] of METODI) {
    const b = el('button', 'ic-metodo');
    b.type = 'button';
    b.title = aiuto;
    b.dataset.metodo = id;
    b.innerHTML = iconaMetodo(linee);
    b.append(el('span', null, nome));
    b.setAttribute('aria-pressed', String(id === metodo));
    b.addEventListener('click', () => {
      metodo = id;
      for (const x of bottoni.children) x.setAttribute('aria-pressed', String(x === b));
      applicaClassi();
    });
    bottoni.append(b);
  }
  legenda.append(bottoni);

  const etichetta = el('label', 'ic-etichetta');
  const cursore = el('input');
  Object.assign(cursore, { type: 'range', min: '3', max: '9', step: '1', value: String(classi) });
  cursore.addEventListener('input', () => { classi = Number(cursore.value); applicaClassi(); });
  etichetta.append('Numero di classi: ', el('span', 'ic-n', String(classi)), cursore);
  legenda.append(etichetta, el('div', 'ic-scala'));

  const link = el('a', 'ic-link', 'Approfondisci: studio completo sulle isole di calore ↗');
  link.href = dati.link;
  link.target = '_blank';
  link.rel = 'noopener';
  legenda.append(graficoAndamento(null, dati.serie, `Media comunale ${dati.anni[0]}–${dati.anno}`), link);
  disegnaScala();
}

export default {
  id: 'isole-calore',
  titolo: 'Isole di calore',
  argomento: { titolo: 'Isole di calore', descrizione: 'Temperatura superficiale estiva 2025 per sezione censuaria, da satellite Landsat, con metodi di classificazione a scelta e l\'andamento dal 2019 al 2025. Link allo studio completo.' },
  gruppo: 'territorio',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'vector', url: pmt('isole-calore/sezioni.pmtiles') });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, 'source-layer': 'sezioni', minzoom: MINZOOM, layout: nascosto,
      paint: { 'fill-color': NODATA, 'fill-opacity': 0.75 },
    });
    map.addLayer({
      id: BORDO, type: 'line', source: SRC, 'source-layer': 'sezioni', minzoom: 12, layout: nascosto,
      paint: { 'line-color': '#ffffff', 'line-width': 0.4, 'line-opacity': 0.7 },
    });
    // poligoni trasparenti sempre presenti: la scheda del luogo mostra la temperatura anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC, 'source-layer': 'sezioni', minzoom: MINZOOM, paint: { 'fill-opacity': 0 } });
  },
  async avvia(map) {
    dati = await (await fetch(urlDati('isole-calore/isole-calore.json'))).json();
    mappa = map;
    applicaClassi();
    riempiLegenda();
  },
  scheda: {
    layers: [HIT],
    voci: trovati => {
      if (!dati) return [];
      return distinte(tutti(trovati, HIT)).slice(0, 1).flatMap(f => voceIsolaCalore(f.properties, dati, () => graficoAndamento(f.properties, dati.serie, `Sezione e media comunale ${dati.anni[0]}–${dati.anno}`)) ?? []);
    },
  },
  strati: [{
    id: 'isole-calore', etichetta: 'Isole di calore (da zoom 10)', layers: [FILL, BORDO], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
};
