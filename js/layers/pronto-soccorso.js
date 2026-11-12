import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { voceFiltro } from '../core/legenda.js';
import { tl, t } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';
import { scegliProxy } from '../rndt/proxy.js';
import { registraBadge, layerBadge, espressioneBadge, stileBadge, simboloBadge } from '../core/icone-mappa.js';
import { LIVELLI, COLORE_LIVELLO, livello, vocePs, modelloPopupPs, quando } from './scheda-pronto-soccorso.js';

// Pronto soccorso di Palermo: 8 presidi (adulti e pediatrici), colorati per affollamento. I conteggi arrivano dal Worker (/pronto-soccorso, dati
// dell'app palermo-ps, rinnovati ogni 2 minuti); l'anagrafica sta anche in dati/salute/pronto-soccorso.geojson, così i punti ci sono comunque.
const SRC = 'pronto-soccorso';
const PUNTI = 'pronto-soccorso-punti';
const HIT = 'pronto-soccorso-hit-punti'; // punti trasparenti, sempre presenti: la scheda mostra il presidio anche a strato spento
const ICONA = 'ospedale';
const COLORE = '#e03131';
const RIFRESCO_MS = 2 * 60 * 1000;
const urlProxy = () => `${scegliProxy(location.search, location.hostname)}/pronto-soccorso`;
const immagine = espressioneBadge(ICONA, 'livello', LIVELLI.map(([k, , c]) => [k, c]), COLORE_LIVELLO.nd);

const dettagli = new Map(); // id -> proprietà complete (anagrafica + ultima lettura)
const completo = p => dettagli.get(p.id) ?? p;
let mappa = null;
let legenda = null;
let timer = null;
let aggiornato = '';
let inLettura = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Due presidi nello stesso punto (Cervello adulti e pediatrico): il secondo si affianca di un'icona, senza spostare le coordinate.
function featureDi(p, usati) {
  const chiave = `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`;
  const n = usati.get(chiave) ?? 0;
  usati.set(chiave, n + 1);
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: { ...p, livello: livello(p), off: [n * 26, 0] } };
}

function scrivi(map) {
  const usati = new Map();
  map.getSource(SRC)?.setData({ type: 'FeatureCollection', features: [...dettagli.values()].map(p => featureDi(p, usati)) });
}

// Dati statici: solo anagrafica, nessuna lettura (livello «non disponibile»).
async function caricaAnagrafica() {
  const dati = await (await fetch(urlDati('salute/pronto-soccorso.geojson'))).json();
  for (const f of dati.features) {
    const [lng, lat] = f.geometry.coordinates;
    dettagli.set(f.properties.id, { ...f.properties, lng, lat, stato: 'assente', codici: {} });
  }
}

// Letture dal Worker; se non risponde restano i dati precedenti (con l'avviso «non aggiornato» se erano vecchi).
export async function caricaLettura(map = mappa) {
  if (inLettura) return inLettura;
  inLettura = (async () => {
    try {
      const r = await fetch(urlProxy(), { cache: 'no-cache' });
      if (!r.ok) throw new Error(`pronto-soccorso: HTTP ${r.status}`);
      const dati = await r.json();
      for (const p of dati.ps ?? []) dettagli.set(p.id, { ...(dettagli.get(p.id) ?? {}), ...p });
      aggiornato = dati.aggiornato ?? '';
      if (map) scrivi(map);
      scriviLegenda();
    } catch { /* senza Worker restano anagrafica e ultima lettura: la scheda dice che il dato non c'è */ } finally { inLettura = null; }
  })();
  return inLettura;
}

function corpoPopup(m) { return [el('p', 'monumento-fonte', t('layer.fonte', { fonte: tl(m.fonte) }))]; }

function collegaPopup(map) {
  let popup = null;
  map.on('click', e => {
    if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
    const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
    if (!f) { popup?.remove(); return; }
    const modello = modelloPopupPs(completo(f.properties));
    popup = apriPopupScheda(map, { precedente: popup, sezione: 'Pronto soccorso', icona: ICONA, colore: COLORE, modello, corpo: corpoPopup(modello), punto: e.point, lngLat: e.lngLat });
  });
  registraTooltipStrati(map, [{ layers: [PUNTI], icona: ICONA, sezione: 'Pronto soccorso', colore: p => COLORE_LIVELLO[livello(completo(p))] ?? COLORE,
    campione: () => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileBadge(ICONA, COLORE)]), modello: p => modelloPopupPs(completo(p)) }]);
  map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
}

let elencoLegenda = null;
let notaLegenda = null;

function scriviLegenda() {
  if (!notaLegenda) return;
  const q = aggiornato ? quando({ acquisitaAlle: aggiornato }) : '';
  notaLegenda.textContent = q ? t('ps.legenda.aggiornato', { quando: q }) : t('ps.legenda.nonDisponibile');
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-pronto-soccorso lg-pronto-soccorso');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Pronto soccorso: affollamento'));
  elencoLegenda = el('div', 'ps-legenda-livelli');
  for (const [k, nome, colore] of LIVELLI) {
    const riga = voceFiltro(simboloBadge(ICONA, colore), nome, () => {}, true, false);
    riga.querySelector('input').hidden = true; // voce solo informativa: i livelli non si filtrano
    riga.dataset.livello = k;
    elencoLegenda.append(riga);
  }
  notaLegenda = el('p', 'uffici-nota');
  legenda.append(elencoLegenda, notaLegenda, el('p', 'uffici-nota', 'Indice dell\'ospedale: pazienti presenti rispetto ai posti tecnici. Non è un tempo di attesa. In emergenza chiama il 112.'));
  document.getElementById('legende').append(legenda);
  scriviLegenda();
}

export default {
  id: 'pronto-soccorso',
  titolo: 'Pronto soccorso',
  argomento: { titolo: 'Pronto soccorso', descrizione: 'I pronto soccorso di Palermo (adulti e pediatrici) con i pazienti in attesa, l\'affollamento e i codici colore, letti ogni 2 minuti dai dati pubblici degli ospedali.' },
  gruppo: 'salute', // dentro «Salute»
  sezioniFisse: true,
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  },
  aggiungiLayer(map) {
    mappa = map;
    registraBadge(map, ICONA, LIVELLI.map(([, , c]) => c));
    map.addLayer(layerBadge({ id: PUNTI, source: SRC, immagine, layout: { visibility: 'none', 'icon-offset': ['get', 'off'], 'symbol-sort-key': ['-', 0, ['get', 'off']] } }));
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 12, 'circle-opacity': 0 } });
    collegaPopup(map);
  },
  async avvia(map) {
    await caricaAnagrafica();
    scrivi(map);
    await caricaLettura(map);
  },
  legendaPannello: '.lg-pronto-soccorso', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{ id: 'pronto-soccorso', etichetta: 'Pronto soccorso (attese)', layers: [PUNTI], attivo: false, legenda: '.legenda-pronto-soccorso',
    suCambio(attivo) {
      if (legenda) legenda.hidden = !attivo;
      clearInterval(timer);
      timer = null;
      if (attivo) { caricaLettura(); timer = setInterval(() => { if (!document.hidden) caricaLettura(); }, RIFRESCO_MS); }
    } }],
  pannello: creaLegenda,
  scheda: {
    vicini: { max: 5 }, // anche i presidi nei dintorni del clic (vedi docs/NUOVO_LAYER.md)
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [vocePs(completo(f.properties))];
      });
    },
  },
};
