import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { tl } from '../core/i18n.js';
import { LIVELLI, RAMPA, COLORE_CALO, COLORE_CRESCITA, modelloTooltipTrend, voceScheda } from './scheda-trend.js';
import { contenutoTrend, graficoConValori } from './scheda-trend-dom.js';
import { costruisciGrafici } from './trend-geometria.js';

// Trend della popolazione 2011 → 2021 → 2023 per UPL, quartiere o circoscrizione (ISTAT). Colore = variazione % 2011-2021
// (viola calo, verde crescita), freccia su/giù = segno, dimensione = abitanti 2023. La legenda sceglie il livello; il
// layer «hit» è sempre presente, così la scheda mostra il trend anche a strato spento.
const SRC = 'trend-popolazione';
const SRC_GRAFICI = 'trend-grafici';
const FILL = 'trend-popolazione-fill';
const LINEA = 'trend-popolazione-linea';
const FRECCE = 'trend-popolazione-frecce';
const HIT = 'trend-popolazione-hit';
const GRAFICO = ['linea', 'proiezione', 'punta', 'nome'].map(tipo => ({ tipo, id: `trend-grafico-${tipo}` }));
const IDS_GRAFICO = GRAFICO.map(g => g.id);
const PR = 2;

let mappa = null;
let legenda = null;
let livello = 'upl';
let simbolo = 'frecce'; // 'frecce' (segno e intensità della variazione) o 'grafico' (Trend Charts: andamento 2011-2035)
let datiGrafici = null;
const ICONA_FRECCIA = ['case', ['>=', ['number', ['get', 'var1121']], 0], 'trend-su', 'trend-giu'];
// Freccia: piccola da lontano, grande da vicino (zoom 10 → metà, 13 → piena, 16 → quasi il doppio) e tanto più grande quanto
// più forte è la variazione 2011-2021 (±0% minima, ±30% o più massima). I Trend Charts sono geometrie: crescono con lo zoom da sole.
const perVariazione = ['interpolate', ['linear'], ['abs', ['number', ['get', 'var1121']]], 0, 0.3, 5, 0.55, 15, 0.9, 30, 1.3];
const DIMENSIONE_FRECCE = ['interpolate', ['linear'], ['zoom'], 10, ['*', 0.5, perVariazione], 13, perVariazione, 16, ['*', 1.8, perVariazione]];
const NESSUNO = ['==', ['get', 'livello'], '']; // filtro che non seleziona nulla

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

const delLivello = tipo => ['all', ['==', ['get', 'tipo'], tipo], ['==', ['get', 'livello'], livello]];
const delGrafico = tipo => ['all', ['==', ['get', 'tipo'], tipo], ['==', ['get', 'livello'], livello]];

// Livello e simbolo si applicano ai filtri: i layer dell'altro simbolo non selezionano nulla (restano tutti nello strato,
// così visibilità, opacità e ordine seguono lo strato).
function applicaFiltri() {
  if (!mappa?.getLayer(FILL)) return;
  for (const id of [FILL, LINEA]) mappa.setFilter(id, delLivello('area'));
  const grafico = simbolo === 'grafico';
  mappa.setFilter(FRECCE, grafico ? NESSUNO : delLivello('punto'));
  for (const { tipo, id } of GRAFICO) mappa.setFilter(id, grafico ? delGrafico(tipo) : NESSUNO);
}

// i Trend Charts si costruiscono una volta dai punti del trend e si caricano nella loro sorgente
function caricaGrafici(map) {
  datiGrafici ??= fetch(urlDati('trend/trend.geojson')).then(r => r.json()).then(costruisciGrafici);
  datiGrafici.then(d => map.getSource(SRC_GRAFICI)?.setData(d)).catch(() => { datiGrafici = null; });
}

// freccia piena su canvas: punta verso l'alto, o verso il basso se `giu`; bordo bianco per leggerla su ogni colore
function freccia(colore, giu) {
  const d = 40 * PR;
  const c = document.createElement('canvas');
  c.width = c.height = d;
  const g = c.getContext('2d');
  g.translate(d / 2, d / 2);
  if (giu) g.rotate(Math.PI);
  g.beginPath();
  g.moveTo(0, -d * 0.42); g.lineTo(d * 0.36, 0); g.lineTo(d * 0.14, 0); g.lineTo(d * 0.14, d * 0.4);
  g.lineTo(-d * 0.14, d * 0.4); g.lineTo(-d * 0.14, 0); g.lineTo(-d * 0.36, 0); g.closePath();
  g.fillStyle = colore; g.strokeStyle = '#fff'; g.lineWidth = 2.5 * PR; g.lineJoin = 'round';
  g.stroke(); g.fill();
  return g.getImageData(0, 0, d, d);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-trend lg-trend-popolazione');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Trend della popolazione 2011-2021'));
  const scelta = el('div', 'trend-livelli');
  for (const [chiave, nome] of LIVELLI) {
    const et = el('label', 'trend-livello');
    const r = document.createElement('input');
    r.type = 'radio'; r.name = 'trend-livello'; r.checked = chiave === livello;
    r.addEventListener('change', () => { livello = chiave; applicaFiltri(); });
    et.append(r, tl(nome));
    scelta.append(et);
  }
  const simboli = el('div', 'trend-livelli');
  for (const [chiave, nome] of [['frecce', 'Frecce'], ['grafico', 'Trend Charts']]) {
    const et = el('label', 'trend-livello');
    const r = document.createElement('input');
    r.type = 'radio'; r.name = 'trend-simbolo'; r.checked = chiave === simbolo;
    r.addEventListener('change', () => { simbolo = chiave; applicaFiltri(); });
    et.append(r, tl(nome));
    simboli.append(et);
  }
  const rampa = el('div', 'trend-rampa');
  rampa.style.background = `linear-gradient(90deg, ${RAMPA.map(([, c]) => c).join(', ')})`;
  const estremi = el('div', 'trend-rampa-estremi');
  estremi.append(el('span', null, '−15%'), el('span', null, '0'), el('span', null, '+20%'));
  legenda.append(scelta, simboli, rampa, estremi, el('p', 'scheda-nota', 'Frecce: segno e intensità della variazione (più grande = variazione più forte). Trend Charts: andamento 2011-2035 (tratteggio = scenario). Più ingrandisci, più i simboli crescono.'));
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'trend-popolazione',
  titolo: 'Trend della popolazione 2011-2023',
  argomento: {
    titolo: 'Trend della popolazione 2011-2023',
    descrizione: 'Come cambia la popolazione di UPL, quartieri e circoscrizioni tra i censimenti 2011, 2021 e 2023 (ISTAT), con uno scenario di tendenza al 2030 e al 2035.',
  },
  gruppo: 'popolazione',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('trend/trend.geojson') });
    map.addSource(SRC_GRAFICI, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    const v = ['number', ['get', 'var1121']];
    if (!map.hasImage('trend-su')) map.addImage('trend-su', freccia(COLORE_CRESCITA, false), { pixelRatio: PR });
    if (!map.hasImage('trend-giu')) map.addImage('trend-giu', freccia(COLORE_CALO, true), { pixelRatio: PR });
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, filter: delLivello('area'), layout: nascosto,
      paint: { 'fill-color': ['interpolate', ['linear'], v, ...RAMPA.flat()], 'fill-opacity': 0.72 },
    });
    map.addLayer({ id: LINEA, type: 'line', source: SRC, filter: delLivello('area'), layout: nascosto, paint: { 'line-color': '#555', 'line-width': 0.8, 'line-opacity': 0.7 } });
    map.addLayer({
      id: FRECCE, type: 'symbol', source: SRC, filter: delLivello('punto'),
      layout: {
        ...nascosto, 'icon-image': ICONA_FRECCIA, 'icon-allow-overlap': true, 'icon-size': DIMENSIONE_FRECCE,
        'symbol-sort-key': ['-', ['get', 'p23']], // se i simboli si sovrappongono vincono le aree più popolose
      },
    });
    // Trend Charts: linea dei dati, tratteggio dello scenario, freccia in punta e nome (come geometrie in scala con lo zoom)
    const larghezza = ['interpolate', ['linear'], ['zoom'], 11, 2, 14, 3.5, 17, 6];
    const colore = ['get', 'colore'];
    const grafico = () => ({ source: SRC_GRAFICI, filter: NESSUNO, layout: nascosto });
    map.addLayer({ id: 'trend-grafico-linea', type: 'line', ...grafico(), layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colore, 'line-width': larghezza } });
    map.addLayer({ id: 'trend-grafico-proiezione', type: 'line', ...grafico(), layout: { ...nascosto, 'line-cap': 'butt' }, paint: { 'line-color': colore, 'line-width': larghezza, 'line-dasharray': [2, 1.5] } });
    map.addLayer({ id: 'trend-grafico-punta', type: 'fill', ...grafico(), paint: { 'fill-color': colore } });
    map.addLayer({
      id: 'trend-grafico-nome', type: 'symbol', ...grafico(),
      layout: { ...nascosto, 'text-field': ['get', 'nome'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 8, 15, 12], 'text-anchor': 'top' },
      paint: { 'text-color': '#2b2b2b', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.2 },
    });
    caricaGrafici(map);
    applicaFiltri();
    // trasparente e sempre presente: la scheda del luogo mostra il trend anche a strato spento
    // copre tutti i livelli: un clic restituisce UPL, quartiere e circoscrizione del punto
    map.addLayer({ id: HIT, type: 'fill', source: SRC, filter: ['==', ['get', 'tipo'], 'area'], paint: { 'fill-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [FILL], icona: 'popolazione', modello: p => ({ ...modelloTooltipTrend(p), dom: graficoConValori(p) }) }]);
  },
  legendaPannello: '.lg-trend-popolazione', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'trend-popolazione', etichetta: 'Trend della popolazione 2011-2023', layers: [FILL, LINEA, FRECCE, ...IDS_GRAFICO], attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const voce = voceScheda(tutti(trovati, HIT).map(f => f.properties), contenutoTrend);
      return voce ? [voce] : [];
    },
  },
};
