import { tutti } from '../core/scheda-util.js';
import { LIVELLI, coloreLivello, voceAllerta, riassuntoGiorno } from './scheda-allerte.js';
import { tl, t, localeIntl } from '../core/i18n.js';
import { scegliProxy } from '../rndt/proxy.js';

// Meteo di Palermo e della Sicilia: il radar della pioggia (RainViewer, ultime 2 ore a passi di 10 minuti) e l'allerta meteo-idro della Protezione Civile per le 9 zone di allerta siciliane.
// Radar: una sorgente raster per ogni istante, tutti i livelli accesi insieme e distinti dall'opacità, così il passaggio da un'immagine alla successiva non sfarfalla.
// Allerta: il bollettino lo serve il Worker (/allerte, dal repository del DPC, rinnovato ogni 15 minuti); i poligoni delle zone ci sono anche a strato spento per la scheda.
const SRC_ALLERTE = 'allerte';
const FILL = 'allerte-fill';
const BORDO = 'allerte-bordo';
const HIT = 'allerte-hit';
const SLOT = 16; // istanti del radar: 13 passati e, quando ci sono, fino a 3 di previsione
const OPACITA_RADAR = 0.7;
const URL_ELENCO = 'https://api.rainviewer.com/public/weather-maps.json';
const RIFRESCO_RADAR_MS = 5 * 60 * 1000;
const PASSO_MS = 700;
const PAUSA_FINE_MS = 1800;
const VUOTO = { type: 'FeatureCollection', features: [] };
const TRASPARENTE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const slot = i => `radar-${i}`;
const urlProxy = () => `${scegliProxy(location.search, location.hostname)}/allerte`;

let mappa = null;
let radarLegenda = null;
let allerteLegenda = null;
let istanti = []; // [{ time, path }] in ordine di tempo
let host = '';
let corrente = 0;
let radarAcceso = false;
let inCorso = true;
let timerAnimazione = null;
let timerRifresco = null;
let controlli = null;
let zone = []; // proprietà delle zone di allerta siciliane (dal Worker), con `aggiornato`
let giornoAllerta = 'oggi'; // quale giorno colora la mappa

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

const ora = secondi => new Date(secondi * 1000).toLocaleTimeString(localeIntl(), { hour: '2-digit', minute: '2-digit' });

// ---- Radar

function mostra(i) {
  corrente = i;
  for (let k = 0; k < SLOT; k++) mappa?.getLayer(slot(k)) && mappa.setPaintProperty(slot(k), 'raster-opacity', k === i && k < istanti.length ? OPACITA_RADAR : 0);
  if (!controlli) return;
  const s = istanti[i];
  controlli.cursore.value = String(i);
  controlli.ora.textContent = s ? `${ora(s.time)}${s.time * 1000 > Date.now() + 60000 ? ` · ${t('radar.previsione')}` : ''}` : '—';
}

function pianificaAnimazione() {
  clearTimeout(timerAnimazione);
  timerAnimazione = null;
  if (!radarAcceso || !inCorso || !istanti.length || document.hidden) return;
  const prossimo = (corrente + 1) % istanti.length;
  timerAnimazione = setTimeout(() => { mostra(prossimo); pianificaAnimazione(); }, prossimo === 0 ? PAUSA_FINE_MS : PASSO_MS);
}

async function caricaIstanti() {
  try {
    const r = await fetch(URL_ELENCO);
    if (!r.ok) throw new Error(String(r.status));
    const dati = await r.json();
    const lista = [...(dati.radar?.past ?? []), ...(dati.radar?.nowcast ?? [])].filter(f => Number.isFinite(f.time) && typeof f.path === 'string').slice(-SLOT);
    if (!lista.length) throw new Error('no frames');
    host = String(dati.host ?? 'https://tilecache.rainviewer.com');
    istanti = lista;
    lista.forEach((f, i) => mappa?.getSource(slot(i))?.setTiles([`${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`]));
    if (controlli) { controlli.cursore.max = String(lista.length - 1); controlli.nota.textContent = ''; }
    mostra(Math.min(corrente, lista.length - 1) || lista.length - 1);
    pianificaAnimazione(); // all'accensione gli istanti non c'erano ancora: l'animazione parte adesso
  } catch {
    if (controlli && !istanti.length) controlli.nota.textContent = t('radar.nonDisponibile');
  }
}

function creaLegendaRadar() {
  radarLegenda = el('div', 'legenda legenda-monumenti lg-radar');
  radarLegenda.hidden = true;
  radarLegenda.append(el('strong', null, 'Radar della pioggia'));
  const barra = el('div', 'radar-scala');
  barra.setAttribute('role', 'img');
  barra.setAttribute('aria-label', t('radar.scalaAlt'));
  const scala = el('div', 'uffici-nota radar-scala-testo');
  scala.append(el('span', null, 'debole'), el('span', null, 'forte'));
  const riga = el('div', 'radar-riga');
  const bottone = document.createElement('button');
  bottone.type = 'button';
  bottone.className = 'radar-bottone';
  const aggiornaBottone = () => { bottone.textContent = inCorso ? '❚❚' : '▶'; bottone.setAttribute('aria-label', t(inCorso ? 'radar.pausa' : 'radar.avvia')); };
  aggiornaBottone();
  bottone.addEventListener('click', () => { inCorso = !inCorso; aggiornaBottone(); pianificaAnimazione(); });
  const cursore = document.createElement('input');
  cursore.type = 'range';
  cursore.min = '0';
  cursore.max = '0';
  cursore.value = '0';
  cursore.className = 'radar-cursore';
  cursore.setAttribute('aria-label', t('radar.istante'));
  cursore.addEventListener('input', () => { inCorso = false; aggiornaBottone(); mostra(Number(cursore.value)); pianificaAnimazione(); });
  const oraEl = el('span', 'radar-ora');
  riga.append(bottone, cursore, oraEl);
  const nota = el('p', 'uffici-nota');
  const credito = el('p', 'uffici-nota');
  const link = document.createElement('a');
  link.href = 'https://www.rainviewer.com/';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'RainViewer';
  credito.append(`${t('radar.dati')} `, link);
  radarLegenda.append(barra, scala, riga, nota, credito);
  controlli = { cursore, ora: oraEl, nota };
  document.getElementById('legende').append(radarLegenda);
}

// ---- Allerta

const coloreZona = (p, giorno) => coloreLivello(p[giorno]?.livello ?? 0);

function colora() {
  for (const id of [FILL, BORDO]) mappa?.getLayer(id) && mappa.setPaintProperty(id, id === FILL ? 'fill-color' : 'line-color', ['get', giornoAllerta === 'oggi' ? 'colore_oggi' : 'colore_domani']);
}

function scriviLegendaAllerte() {
  if (!allerteLegenda) return;
  allerteLegenda.replaceChildren(el('strong', null, 'Allerta meteo-idro in Sicilia'));
  if (!zone.length) { allerteLegenda.append(el('p', 'uffici-nota', t('allerte.nonDisponibile'))); return; }
  const giorni = el('div', 'allerta-giorni');
  for (const g of ['oggi', 'domani']) {
    const b = el('button', 'allerta-giorno');
    b.type = 'button';
    b.textContent = t(`allerte.${g}`);
    b.setAttribute('aria-pressed', String(g === giornoAllerta));
    b.addEventListener('click', () => { giornoAllerta = g; colora(); scriviLegendaAllerte(); });
    giorni.append(b);
  }
  allerteLegenda.append(giorni);
  for (const r of riassuntoGiorno(zone, giornoAllerta)) {
    const riga = el('p', 'allerta-riga');
    const chip = el('i', 'incendi-campione');
    chip.style.background = coloreLivello(r.livello);
    riga.append(chip, ` ${r.testo}`);
    allerteLegenda.append(riga);
  }
  const chiave = el('p', 'uffici-nota allerta-chiave');
  for (const l of LIVELLI) { const c = el('i', 'incendi-campione'); c.style.background = l.colore; c.title = tl(l.nome); chiave.append(c, ' '); }
  allerteLegenda.append(chiave, el('p', 'uffici-nota', t('allerte.cliccaZona')), el('p', 'uffici-nota', zone[0].bollettino));
}

function creaLegendaAllerte() {
  allerteLegenda = el('div', 'legenda legenda-monumenti lg-allerte');
  allerteLegenda.hidden = true;
  document.getElementById('legende').append(allerteLegenda);
  scriviLegendaAllerte();
}

async function caricaAllerte() {
  try {
    const r = await fetch(urlProxy());
    if (!r.ok) throw new Error(String(r.status));
    const dati = await r.json();
    if (!dati.features?.length) throw new Error('no zones');
    zone = dati.features.map(f => ({ ...f.properties, aggiornato: dati.aggiornato }));
    mappa?.getSource(SRC_ALLERTE)?.setData({
      type: 'FeatureCollection',
      features: dati.features.map(f => ({ ...f, properties: { ...f.properties, colore_oggi: coloreZona(f.properties, 'oggi'), colore_domani: coloreZona(f.properties, 'domani') } })),
    });
  } catch { /* senza bollettino la scheda non mostra la card e la legenda dice «non disponibile» */ }
  scriviLegendaAllerte();
}

export default {
  id: 'radar-allerte',
  titolo: 'Radar pioggia e allerte',
  gruppo: 'eventi',
  sezioniFisse: true, // ogni layer di Eventi resta una sezione a sé: il riordino non attraversa le intestazioni
  argomento: { titolo: 'Radar pioggia e allerte', descrizione: 'Dove sta piovendo adesso (radar degli ultimi 120 minuti) e l\'allerta meteo-idro della Protezione Civile per oggi e domani nelle zone di allerta della Sicilia.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC_ALLERTE, { type: 'geojson', data: VUOTO });
    for (let i = 0; i < SLOT; i++) {
      map.addSource(slot(i), { type: 'raster', tiles: [TRASPARENTE], tileSize: 256, maxzoom: 7, attribution: '<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>' });
    }
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    map.addLayer({ id: FILL, type: 'fill', source: SRC_ALLERTE, layout: nascosto, paint: { 'fill-color': ['get', 'colore_oggi'], 'fill-opacity': 0.3 } });
    map.addLayer({ id: BORDO, type: 'line', source: SRC_ALLERTE, layout: nascosto, paint: { 'line-color': ['get', 'colore_oggi'], 'line-width': 2, 'line-opacity': 0.9 } });
    for (let i = 0; i < SLOT; i++) map.addLayer({ id: slot(i), type: 'raster', source: slot(i), layout: nascosto, paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 } });
    // poligono trasparente sempre presente: la scheda del luogo mostra l'allerta anche a strato spento
    map.addLayer({ id: HIT, type: 'fill', source: SRC_ALLERTE, paint: { 'fill-opacity': 0 } });
    document.addEventListener('visibilitychange', () => pianificaAnimazione());
  },
  avvia: caricaAllerte,
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return tutti(trovati, HIT).flatMap(f => {
        const p = zone.find(z => z.zona === f.properties.zona);
        if (!p || visti.has(p.zona)) return [];
        visti.add(p.zona);
        return [voceAllerta(p)];
      });
    },
    // le zone sono più grandi del Comune: il clic su una zona apre la scheda anche fuori da Palermo
    apertoFuoriComune(map, e) {
      return map.getLayoutProperty(FILL, 'visibility') === 'visible' && map.queryRenderedFeatures(e.point, { layers: [HIT] }).length > 0;
    },
  },
  legendaPannello: '.lg-allerte',
  strati: [
    {
      id: 'allerte', etichetta: 'Allerta meteo-idro in Sicilia', layers: [FILL, BORDO], attivo: false, legendaPannello: '.lg-allerte',
      suCambio(attivo) { if (allerteLegenda) allerteLegenda.hidden = !attivo; if (attivo) caricaAllerte(); },
    },
    {
      id: 'radar', etichetta: 'Radar della pioggia', layers: Array.from({ length: SLOT }, (_, i) => slot(i)), attivo: false, legendaPannello: '.lg-radar',
      suCambio(attivo) {
        radarAcceso = attivo;
        if (radarLegenda) radarLegenda.hidden = !attivo;
        clearInterval(timerRifresco);
        timerRifresco = null;
        if (attivo) { caricaIstanti(); timerRifresco = setInterval(caricaIstanti, RIFRESCO_RADAR_MS); }
        pianificaAnimazione();
      },
    },
  ],
  pannello() { creaLegendaRadar(); creaLegendaAllerte(); },
};
