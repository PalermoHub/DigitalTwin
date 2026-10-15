import { urlDati } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { tl } from '../core/i18n.js';
import { LIVELLI, RAMPA, modelloTooltipTrend, voceScheda } from './scheda-trend.js';
import { contenutoTrend, graficoConValori } from './scheda-trend-dom.js';
import { costruisciGrafici } from './trend-geometria.js';
import { iconaEtichetta, idEtichetta } from './trend-icone.js';

// Trend della popolazione 2011 → 2021 → 2023 per UPL, quartiere o circoscrizione (ISTAT). Colore = variazione % 2011-2021
// (viola calo, verde crescita); simbolo a scelta: etichetta ▲/▼ con la variazione % oppure Trend Charts (linea 2011-2035). La
// legenda sceglie livello e simbolo; il
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
let simbolo = 'variazione'; // 'variazione' (etichette ▲/▼ con la variazione %) o 'grafico' (Trend Charts: andamento 2011-2035)
let datiTrend = null;
const ICONA_VARIAZIONE = ['concat', 'trend-var-', ['to-string', ['get', 'var1121']]]; // un'etichetta per ogni valore (vedi trend-icone.js)
// Etichetta «▲ +27,3%»: piccola da lontano, più grande da vicino (zoom 10 → 0,7, 13 → piena, 16 → una volta e mezza) e un po' più
// grande quanto più forte è la variazione 2011-2021. I Trend Charts sono geometrie: crescono con lo zoom da sole.
const perVariazione = ['interpolate', ['linear'], ['abs', ['number', ['get', 'var1121']]], 0, 0.8, 5, 0.9, 15, 1, 30, 1.15];
const DIMENSIONE_ETICHETTE = ['interpolate', ['linear'], ['zoom'], 10, ['*', 0.7, perVariazione], 13, perVariazione, 16, ['*', 1.5, perVariazione]];
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

// dati del trend, caricati una volta: servono per i Trend Charts (geometrie) e per le etichette della variazione (icone)
function caricaDati(map) {
  datiTrend ??= fetch(urlDati('trend/trend.geojson')).then(r => r.json());
  datiTrend.then(d => {
    map.getSource(SRC_GRAFICI)?.setData(costruisciGrafici(d));
    for (const v of new Set(d.features.filter(f => f.properties.tipo === 'punto').map(f => f.properties.var1121))) {
      if (!map.hasImage(idEtichetta(v))) map.addImage(idEtichetta(v), iconaEtichetta(v, PR), { pixelRatio: PR });
    }
    map.triggerRepaint();
  }).catch(() => { datiTrend = null; });
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
  for (const [chiave, nome] of [['variazione', 'Variazione'], ['grafico', 'Trend Charts']]) {
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
  legenda.append(scelta, simboli, rampa, estremi, el('p', 'scheda-nota', 'Variazione: ▲ crescita, ▼ calo, con la variazione % 2011-2021 (a zoom basso restano le più forti). Trend Charts: andamento 2011-2035 (tratteggio = scenario). Più ingrandisci, più i simboli crescono.'));
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
    map.addLayer({
      id: FILL, type: 'fill', source: SRC, filter: delLivello('area'), layout: nascosto,
      paint: { 'fill-color': ['interpolate', ['linear'], v, ...RAMPA.flat()], 'fill-opacity': 0.72 },
    });
    map.addLayer({ id: LINEA, type: 'line', source: SRC, filter: delLivello('area'), layout: nascosto, paint: { 'line-color': '#555', 'line-width': 0.8, 'line-opacity': 0.7 } });
    map.addLayer({
      id: FRECCE, type: 'symbol', source: SRC, filter: delLivello('punto'),
      layout: {
        ...nascosto, 'icon-image': ICONA_VARIAZIONE, 'icon-size': DIMENSIONE_ETICHETTE, 'icon-allow-overlap': false,
        'symbol-sort-key': ['-', ['abs', ['number', ['get', 'var1121']]]], // se le etichette si sovrappongono vincono le variazioni più forti
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
      layout: {
        ...nascosto, 'text-font': ['Noto Sans Bold'],
        'text-field': ['format', ['get', 'nome'], {}, '\n', {}, ['get', 'variazione'], { 'text-color': ['get', 'colore'], 'font-scale': 1.2 }],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 8, 15, 12], 'text-anchor': 'top',
      },
      paint: { 'text-color': '#2b2b2b', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.2 },
    });
    caricaDati(map);
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
