import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { occhio } from '../core/pannello.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { STATI, COLORE_ALTRO, coloreStato, modelloPopupVolo, voceVolo, voceAeroporto, modelloPopupAeroporto, aeroportoInAllerta } from './scheda-voli.js';
import { contenutoPopupTraffico, ancoraPopupTraffico, rifinisciPopupTraffico, centraPopupTraffico } from './popup-traffico.js';
import { tl, t } from '../core/i18n.js';
import { registraGlifo, registraBadge, layerBadge, idBadge, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';
import { scegliProxy } from '../rndt/proxy.js';

// Aerei in volo attorno a Palermo (100 miglia nautiche da Punta Raisi). I dati non stanno nel repository: li serve il Worker (/voli),
// che interroga adsb.lol al massimo ogni 5 minuti per tutti gli utenti. Il layer li ricarica ogni 5 minuti finché è acceso.
// Insieme agli aerei scarica gli arrivi e le partenze di oggi (/aeroporto, da Gesap): servono alla scheda dell'aeroporto e al segnale rosso sull'icona.
const SRC = 'voli';
const ICONA = 'aereo'; // in mappa è la sagoma dell'icona, ruotata secondo la rotta (vedi core/icone-mappa.js)
const PUNTI = 'voli-punti';
const HIT = 'voli-hit'; // punti trasparenti, sempre presenti: la scheda mostra l'aereo sotto il clic anche a strato spento
const SRC_AEROPORTO = 'voli-aeroporto';
const AEROPORTO = 'voli-aeroporto-punto'; // l'aeroporto di Palermo Falcone e Borsellino (PMO), acceso e spento insieme agli aerei
const HIT_AEROPORTO = 'voli-aeroporto-hit'; // area di clic dell'aeroporto, sempre presente (come HIT per gli aerei)
const SEGNALE = 'voli-aeroporto-segnale'; // pallino rosso sull'icona: voli cancellati o molto in ritardo
const COLORE_AEROPORTO = '#0b3d91';
const COLORE_SEGNALE = '#e03131';
const COORDINATE_AEROPORTO = [13.0910, 38.1759];
const INTERVALLO_MS = 5 * 60 * 1000;
const VUOTO = { type: 'FeatureCollection', features: [] };
const urlVoli = () => `${scegliProxy(location.search, location.hostname)}/voli`;
const urlAeroporto = () => `${scegliProxy(location.search, location.hostname)}/aeroporto`;

const dettagli = new Map(); // id -> proprietà complete
let aeroporto = null; // risposta di /aeroporto (arrivi, partenze, riepilogo); null finché non arriva
const completo = p => dettagli.get(p.id) ?? p;
let mappa = null;
let legenda = null;
let nota = null;
let timer = null;
let ultimo = 0;
let acceso = false;
const accesi = new Set(STATI.map(([s]) => s));
const caselle = new Map(); // stato -> { pannello, legenda }

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function scriviNota(aggiornato) {
  if (!nota) return;
  const ora = aggiornato ? new Date(aggiornato * 1000).toLocaleTimeString(document.documentElement.lang || undefined, { hour: '2-digit', minute: '2-digit' }) : null;
  nota.textContent = ora ? t('voli.aggiornato', { ora, n: dettagli.size }) : t('voli.nonDisponibile');
}

async function scarica(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

const puntoAeroporto = () => ({
  type: 'Feature', geometry: { type: 'Point', coordinates: COORDINATE_AEROPORTO },
  properties: { nome: tl('Aeroporto di Palermo (PMO)'), allerta: aeroportoInAllerta(aeroporto) },
});

// Scarica gli aerei e gli orari dell'aeroporto dal Worker, ciascuno per conto suo; se uno non risponde restano i dati di prima
// (il Worker, adsb.lol o Gesap possono essere giù).
async function aggiorna() {
  const [voli, orari] = await Promise.allSettled([scarica(urlVoli()), scarica(urlAeroporto())]);
  if (voli.status === 'fulfilled') {
    const fc = voli.value;
    dettagli.clear();
    for (const f of fc.features) dettagli.set(f.properties.id, f.properties);
    mappa?.getSource(SRC)?.setData(fc);
    ultimo = Date.now();
    scriviNota(fc.aggiornato);
  } else if (!dettagli.size) scriviNota(null);
  if (orari.status === 'fulfilled') {
    aeroporto = orari.value;
    mappa?.getSource(SRC_AEROPORTO)?.setData(puntoAeroporto());
  }
}

// Il ciclo gira solo con lo strato acceso e la scheda del browser in primo piano: niente richieste inutili.
function pianifica() {
  clearInterval(timer);
  timer = null;
  if (acceso && !document.hidden) timer = setInterval(aggiorna, INTERVALLO_MS);
}

function applicaFiltri() {
  const filtro = filtroInsieme(['get', 'stato'], accesi, STATI.length);
  for (const id of [PUNTI, HIT]) mappa?.getLayer(id) && mappa.setFilter(id, filtro);
}

function impostaFiltro(stato, on, origine) {
  on ? accesi.add(stato) : accesi.delete(stato);
  const c = caselle.get(stato);
  if (c) for (const [dove, casella] of Object.entries(c)) if (dove !== origine && casella) casella.checked = on;
  applicaFiltri();
}

const pallino = col => simboloGlifo(ICONA, col);

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-voli');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Aerei in volo'));
  for (const [stato, col] of STATI) {
    const riga = voceFiltro(pallino(col), stato, on => impostaFiltro(stato, on, 'legenda'));
    caselle.set(stato, { ...caselle.get(stato), legenda: riga._filtro.casella });
    legenda.append(riga);
  }
  nota = el('p', 'uffici-nota');
  legenda.append(nota);
  document.getElementById('legende').append(legenda);
}

// Sotto la voce dello strato: i filtri per stato, attivi solo con lo strato acceso.
function creaPannello(gruppo) {
  creaLegenda();
  const blocco = el('div', 'colonnine-filtri');
  blocco.append(el('h3', null, 'Stato'));
  for (const [stato, col] of STATI) {
    const label = el('label', 'sotto-voce');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.disabled = true; // si abilita con lo strato acceso
    cb.dataset.filtro = `stato:${stato}`;
    cb.addEventListener('change', () => impostaFiltro(stato, cb.checked, 'pannello'));
    label.append(cb, occhio(), ' ', pallino(col), ' ', tl(stato));
    blocco.append(label);
    caselle.set(stato, { ...caselle.get(stato), pannello: cb });
  }
  gruppo.append(blocco);
}

export default {
  id: 'voli',
  titolo: 'Traffico aereo',
  gruppo: 'trasporto', // dentro «Trasporti», in una sezione propria accanto a RFI e AMAT
  sezione: 'Traffico aereo',
  argomento: { titolo: 'Traffico aereo', descrizione: 'Aerei in volo attorno all\'aeroporto di Palermo, con quota, velocità e stato (in arrivo, in partenza, in transito), aggiornati ogni 5 minuti.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO });
    map.addSource(SRC_AEROPORTO, { type: 'geojson', data: puntoAeroporto() });
  },
  aggiungiLayer(map) {
    mappa = map;
    registraGlifo(map, ICONA);
    const colori = ['match', ['get', 'stato'], ...STATI.flatMap(([s, c]) => [s, c]), COLORE_ALTRO];
    map.addLayer(layerGlifo({
      id: PUNTI, source: SRC, icona: ICONA, colore: colori,
      layout: { visibility: 'none', 'icon-rotate': ['coalesce', ['get', 'rotta'], 0], 'icon-rotation-alignment': 'map', 'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 1.1, 14, 1.9] },
      paint: { 'icon-halo-width': 1.2 },
    }));
    registraBadge(map, ICONA, [COLORE_AEROPORTO]);
    map.addLayer(layerBadge({
      id: AEROPORTO, source: SRC_AEROPORTO, immagine: idBadge(ICONA, COLORE_AEROPORTO),
      layout: {
        visibility: 'none', 'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 1.5],
        'text-field': ['get', 'nome'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-anchor': 'top', 'text-offset': [0, 1.3], 'text-optional': true,
      },
      paint: { 'text-color': COLORE_AEROPORTO, 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
    }));
    // pallino rosso in alto a destra dell'icona, acceso dal Worker/dati (`allerta`): c'è almeno un volo cancellato o in ritardo di 15 minuti o più
    map.addLayer({
      id: SEGNALE, type: 'circle', source: SRC_AEROPORTO, filter: ['==', ['get', 'allerta'], true],
      layout: { visibility: 'none' },
      paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.5, 14, 6.5], 'circle-color': COLORE_SEGNALE, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5, 'circle-translate': [11, -11] },
    });
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 12, 'circle-opacity': 0 } });
    map.addLayer({ id: HIT_AEROPORTO, type: 'circle', source: SRC_AEROPORTO, paint: { 'circle-radius': 16, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI, AEROPORTO] })[0];
      popup?.remove();
      if (!f) return;
      const scalo = f.layer.id === AEROPORTO;
      const p = scalo ? null : completo(f.properties);
      const { anchor, offset } = ancoraPopupTraffico(e.point, map.getContainer());
      const colore = scalo ? (aeroportoInAllerta(aeroporto) ? COLORE_SEGNALE : COLORE_AEROPORTO) : coloreStato(p.stato);
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'traffico-popup-box', anchor, offset, closeButton: false })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(contenutoPopupTraffico({
          sezione: 'Aviazione', icona: 'aereo', colore,
          modello: scalo ? modelloPopupAeroporto(aeroporto) : modelloPopupVolo(p), coordinate: f.geometry.coordinates, chiudi: () => popup.remove(),
        }))
        .addTo(map);
      rifinisciPopupTraffico(popup, anchor, colore);
      centraPopupTraffico(map, popup, anchor, f.geometry.coordinates);
    });
    registraTooltipStrati(map, [{
      layers: [PUNTI], icona: ICONA, sezione: 'Aviazione', colore: p => coloreStato(completo(p).stato),
      campione: p => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(ICONA, coloreStato(completo(p).stato))]),
      modello: p => modelloPopupVolo(completo(p)),
    }]);
    for (const id of [PUNTI, AEROPORTO]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
    document.addEventListener('visibilitychange', () => {
      if (acceso && !document.hidden && Date.now() - ultimo > INTERVALLO_MS) aggiorna();
      pianifica();
    });
  },
  avvia: aggiorna,
  scheda: {
    layers: [HIT, HIT_AEROPORTO],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (f.layer.id === HIT_AEROPORTO) {
          if (visti.has(HIT_AEROPORTO)) return [];
          visti.add(HIT_AEROPORTO);
          return [voceAeroporto(aeroporto)];
        }
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceVolo(completo(f.properties))];
      });
    },
    // L'aeroporto di Punta Raisi e gli aerei in volo stanno fuori dal Comune: il clic su di loro apre comunque la scheda (gli aerei solo a strato acceso).
    apertoFuoriComune(map, e) {
      const su = layers => map.queryRenderedFeatures(e.point, { layers }).length > 0;
      return su([HIT_AEROPORTO]) || (map.getLayoutProperty(PUNTI, 'visibility') === 'visible' && su([HIT]));
    },
  },
  legendaPannello: '.lg-voli', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'voli', etichetta: 'Aerei in volo', layers: [AEROPORTO, SEGNALE, PUNTI], attivo: false,
    sottovoci: [{ titolo: 'Stato', voci: STATI.map(([s]) => ({ id: `stato:${s}`, etichetta: s })) }],
    suCambio(attivo) {
      acceso = attivo;
      if (legenda) legenda.hidden = !attivo;
      for (const { pannello } of caselle.values()) pannello.disabled = !attivo;
      if (attivo && Date.now() - ultimo > INTERVALLO_MS) aggiorna();
      pianifica();
    },
  }],
  pannello: creaPannello,
};
