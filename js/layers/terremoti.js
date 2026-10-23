import { tl, t, localeIntl } from '../core/i18n.js';
import { LIMITI } from '../core/config.js';
import { FASCE, URL_SERVIZIO, eventoDaIngv, modelloPopupTerremoto, voceTerremoto, riassuntoTerremoti } from './scheda-terremoti.js';
import { contenutoPopupTraffico, ancoraPopupTraffico, rifinisciPopupTraffico } from './popup-traffico.js';

// Terremoti in tempo reale attorno a Palermo: gli eventi degli ultimi 7 giorni dal servizio FDSN dell'INGV, chiesto direttamente dal browser (CORS aperto, nessun Worker).
// Cerchio = un evento: più grande è la magnitudo, più grande il cerchio; il colore dice da quanto è successo. Si rinnova ogni 2 minuti finché lo strato è acceso.
const SRC = 'terremoti';
const PUNTI = 'terremoti-punti';
const HIT = 'terremoti-hit'; // cerchi trasparenti, sempre presenti: la scheda mostra l'evento sotto il clic
const GIORNI = 7;
const MAGNITUDO_MIN = 1;
const AREA = { minlon: LIMITI[0][0], minlat: LIMITI[0][1], maxlon: LIMITI[1][0], maxlat: LIMITI[1][1] }; // l'area che la mappa permette di vedere: Sicilia nord-occidentale e Tirreno meridionale
const LIMITE = 1000;
const INTERVALLO_MS = 2 * 60 * 1000;
const VUOTO = { type: 'FeatureCollection', features: [] };

let mappa = null;
let legenda = null;
let nota = null;
let timer = null;
let ultimo = 0;
let acceso = false;
let popup = null;
let eventi = []; // proprietà degli eventi in mappa

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

const urlEventi = (adesso = Date.now()) => {
  const q = new URLSearchParams({ format: 'geojson', starttime: new Date(adesso - GIORNI * 86400000).toISOString().slice(0, 19), orderby: 'time', minmag: String(MAGNITUDO_MIN), limit: String(LIMITE), ...Object.fromEntries(Object.entries(AREA).map(([k, v]) => [k, v.toFixed(3)])) });
  return `${URL_SERVIZIO}?${q}`;
};

function scriviNota(ok) {
  if (!nota) return;
  const r = riassuntoTerremoti(eventi);
  if (!ok && !r) { nota.textContent = t('terremoti.nonDisponibile'); return; }
  const ora = new Date(ultimo).toLocaleTimeString(localeIntl(), { hour: '2-digit', minute: '2-digit' });
  nota.textContent = r ? t('terremoti.riassunto', { n: r.n, ora, mag: r.forte.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 }), luogo: r.forte.luogo }) : t('terremoti.nessuno', { ora });
}

async function aggiorna() {
  try {
    const r = await fetch(urlEventi());
    if (!r.ok && r.status !== 204) throw new Error(String(r.status)); // 204 = nessun evento nella finestra
    const dati = r.status === 204 ? { features: [] } : await r.json();
    const adesso = Date.now();
    const features = (dati.features ?? []).map(f => eventoDaIngv(f, adesso)).filter(Boolean);
    eventi = features.map(f => ({ ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }));
    mappa?.getSource(SRC)?.setData({ type: 'FeatureCollection', features });
    ultimo = adesso;
    scriviNota(true);
  } catch { scriviNota(false); } // senza risposta restano gli eventi di prima
}

// Il ciclo gira solo con lo strato acceso e la scheda del browser in primo piano
function pianifica() {
  clearInterval(timer);
  timer = null;
  if (acceso && !document.hidden) timer = setInterval(aggiorna, INTERVALLO_MS);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-terremoti');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Terremoti in tempo reale'));
  for (const f of FASCE) {
    const riga = el('p', 'allerta-riga');
    const chip = el('i', 'incendi-campione');
    chip.style.background = f.colore;
    riga.append(chip, ` ${tl(f.nome)}`);
    legenda.append(riga);
  }
  legenda.append(el('p', 'uffici-nota', t('terremoti.clicca')));
  nota = el('p', 'uffici-nota');
  const credito = el('p', 'uffici-nota');
  const link = el('a', null, 'INGV');
  link.href = 'https://terremoti.ingv.it/';
  link.target = '_blank';
  link.rel = 'noopener';
  credito.append(`${t('terremoti.dati')} `, link);
  legenda.append(nota, credito);
  document.getElementById('legende').append(legenda);
}

const proprieta = f => ({ ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] });

export default {
  id: 'terremoti',
  titolo: 'Terremoti in tempo reale',
  gruppo: 'eventi',
  sezione: 'Terremoti',
  sezioniFisse: true,
  argomento: { titolo: 'Terremoti in tempo reale', descrizione: 'I terremoti degli ultimi 7 giorni attorno a Palermo, in Sicilia nord-occidentale e nel Tirreno meridionale, dal servizio dell\'INGV: magnitudo, profondità, zona e distanza da Palermo, aggiornati ogni 2 minuti.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO, attribution: '<a href="https://terremoti.ingv.it/" target="_blank" rel="noopener">INGV</a>' });
  },
  aggiungiLayer(map) {
    mappa = map;
    // i più recenti e i più forti sopra gli altri
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, layout: { visibility: 'none', 'circle-sort-key': ['+', ['*', ['get', 'mag'], 1000], ['/', ['get', 'ts'], 1e13]] },
      paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, ['*', ['get', 'raggio'], 0.8], 12, ['*', ['get', 'raggio'], 1.6]], 'circle-color': ['get', 'colore'], 'circle-opacity': 0.55, 'circle-stroke-color': ['get', 'colore'], 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.95 },
    });
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': ['max', 10, ['get', 'raggio']], 'circle-opacity': 0 } });
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      popup?.remove();
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] }).sort((a, b) => b.properties.mag - a.properties.mag)[0];
      if (!f) return;
      const { anchor, offset } = ancoraPopupTraffico(e.point, map.getContainer());
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'traffico-popup-box', anchor, offset, closeButton: false })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(contenutoPopupTraffico({ sezione: 'Terremoti', icona: 'terremoto', colore: f.properties.colore, modello: modelloPopupTerremoto(proprieta(f)), coordinate: f.geometry.coordinates, chiudi: () => popup?.remove() }))
        .addTo(map);
      rifinisciPopupTraffico(popup, anchor, f.properties.colore);
    });
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
    document.addEventListener('visibilitychange', () => {
      if (acceso && !document.hidden && Date.now() - ultimo > INTERVALLO_MS) aggiorna();
      pianifica();
    });
  },
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.filter(f => f.layer.id === HIT).sort((a, b) => b.properties.mag - a.properties.mag).flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceTerremoto(proprieta(f))];
      });
    },
    // gli eventi stanno in mare e fuori dal Comune: il clic su un cerchio apre la scheda (solo a strato acceso: i dati si scaricano all'accensione)
    apertoFuoriComune(map, e) {
      return map.getLayoutProperty(PUNTI, 'visibility') === 'visible' && map.queryRenderedFeatures(e.point, { layers: [HIT] }).length > 0;
    },
  },
  legendaPannello: '.lg-terremoti',
  strati: [{
    id: 'terremoti', etichetta: 'Terremoti in tempo reale', layers: [PUNTI], attivo: false, legendaPannello: '.lg-terremoti',
    suCambio(attivo) {
      acceso = attivo;
      if (legenda) legenda.hidden = !attivo;
      if (attivo && Date.now() - ultimo > INTERVALLO_MS) aggiorna();
      if (!attivo) { popup?.remove(); popup = null; }
      pianifica();
    },
  }],
  pannello: creaLegenda,
};
