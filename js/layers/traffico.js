import { tl, t } from '../core/i18n.js';
import { scegliProxy } from '../rndt/proxy.js';
import { STATI, LINK, statoFlusso, modelloPopupFlusso } from './scheda-traffico.js';
import { contenutoPopupTraffico, ancoraPopupTraffico, rifinisciPopupTraffico } from './popup-traffico.js';

// Traffico a flusso di Palermo (TomTom): le strade colorate secondo la velocità di scorrimento rispetto a quella senza traffico, aggiornate circa ogni 2 minuti.
// Le tile e la velocità del tratto cliccato le serve il Worker (/traffico/…): tiene la chiave TomTom e una cache condivisa da tutti gli utenti (piano gratuito).
const SRC = 'traffico';
const LAYER = 'traffico-flusso';
const ZOOM_MIN = 10; // il Worker serve da zoom 8 a 17; sotto zoom 10 le strade sono troppo piccole per essere utili
const ZOOM_MAX = 17;
const RINNOVO_MS = 2 * 60 * 1000;
const urlProxy = () => scegliProxy(location.search, location.hostname);

let mappa = null;
let legenda = null;
let acceso = false;
let timer = null;
let popup = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Rinnova le tile: la sorgente raster ricarica da zero quando si cambia l'elenco degli indirizzi, quindi si aggiunge un parametro che cambia ogni 2 minuti
const indirizzoTile = () => `${urlProxy()}/traffico/tile/{z}/{x}/{y}?t=${Math.floor(Date.now() / RINNOVO_MS)}`;

function rinnova() {
  if (acceso && !document.hidden) mappa?.getSource(SRC)?.setTiles([indirizzoTile()]);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-traffico');
  legenda.hidden = true;
  legenda.append(el('strong', null, tl('Traffico a flusso')));
  for (const s of STATI) {
    const riga = el('p', 'allerta-riga');
    const chip = el('i', 'incendi-campione');
    chip.style.background = s.colore;
    riga.append(chip, ` ${tl(s.nome)}`);
    legenda.append(riga);
  }
  legenda.append(el('p', 'uffici-nota', t('traffico.clicca')));
  const credito = el('p', 'uffici-nota');
  const link = el('a', null, 'TomTom');
  link.href = LINK;
  link.target = '_blank';
  link.rel = 'noopener';
  credito.append(`${t('traffico.dati')} `, link);
  legenda.append(credito);
  document.getElementById('legende').append(legenda);
}

async function apriPopup(e) {
  popup?.remove();
  popup = null;
  const { lng, lat } = e.lngLat;
  try {
    const r = await fetch(`${urlProxy()}/traffico/segmento?lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`);
    if (!r.ok) return; // nessuna strada vicino al clic: niente popup
    const s = await r.json();
    if (!acceso) return;
    const colore = statoFlusso(s).colore;
    const { anchor, offset } = ancoraPopupTraffico(e.point, mappa.getContainer());
    popup = new maplibregl.Popup({ maxWidth: '300px', className: 'traffico-popup-box', anchor, offset, closeButton: false })
      .setLngLat([lng, lat])
      .setDOMContent(contenutoPopupTraffico({ sezione: 'Traffico a flusso', icona: 'trasporto', colore, modello: modelloPopupFlusso(s), coordinate: [lng, lat], chiudi: () => popup?.remove() }))
      .addTo(mappa);
    rifinisciPopupTraffico(popup, anchor, colore);
  } catch { /* senza risposta del Worker il clic non fa nulla */ }
}

export default {
  id: 'traffico',
  titolo: 'Traffico a flusso',
  gruppo: 'trasporto',
  sezione: 'Traffico stradale',
  argomento: { titolo: 'Traffico a flusso', descrizione: 'Le strade di Palermo colorate dal verde al rosso secondo quanto scorre il traffico in questo momento (dati TomTom, aggiornati ogni 2 minuti), con la velocità del tratto cliccato.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'raster', tiles: [indirizzoTile()], tileSize: 256, minzoom: ZOOM_MIN, maxzoom: ZOOM_MAX, attribution: '<a href="https://www.tomtom.com/" target="_blank" rel="noopener">© TomTom</a>' });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({ id: LAYER, type: 'raster', source: SRC, minzoom: ZOOM_MIN, layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 0 } });
    map.on('click', e => {
      if (!acceso || map.getZoom() < ZOOM_MIN) return;
      apriPopup(e);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) rinnova(); });
  },
  legendaPannello: '.lg-traffico',
  strati: [{
    id: 'traffico', etichetta: 'Traffico a flusso', layers: [LAYER], attivo: false, legendaPannello: '.lg-traffico',
    suCambio(attivo) {
      acceso = attivo;
      if (legenda) legenda.hidden = !attivo;
      clearInterval(timer);
      timer = null;
      if (attivo) { rinnova(); timer = setInterval(rinnova, RINNOVO_MS); } else { popup?.remove(); popup = null; }
    },
  }],
  pannello: creaLegenda,
};
