import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { voceFiltro } from '../core/legenda.js';
import { tl, t } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';
import { scegliProxy } from '../rndt/proxy.js';
import { registraBadge, layerBadge, stileBadge, simboloBadge } from '../core/icone-mappa.js';
import { idPin, registraPin } from './pronto-soccorso-pin.js';
import { LIVELLI, COLORE_LIVELLO, COLORE_CODICE, NOME_CODICE, livello, vocePs, modelloPopupPs, pannelloPs, quando } from './scheda-pronto-soccorso.js';

// Pronto soccorso di Palermo: 8 presidi (adulti e pediatrici), colorati per affollamento. I conteggi arrivano dal Worker (/pronto-soccorso, dati
// dell'app palermo-ps, rinnovati ogni 2 minuti); l'anagrafica sta anche in dati/salute/pronto-soccorso.geojson, così i punti ci sono comunque.
const SRC = 'pronto-soccorso';
const PUNTI = 'pronto-soccorso-punti';
const HIT = 'pronto-soccorso-hit-punti'; // punti trasparenti, sempre presenti: la scheda mostra il presidio anche a strato spento
const ICONA = 'ospedale';
const COLORE = '#e03131';
const RIFRESCO_MS = 60 * 1000; // quanto la cache del Worker: la fonte si rinnova ogni ~2 minuti, così il ritardo massimo resta sotto i 3
let ultimaLettura = 0; // ms dell'ultima lettura riuscita
const urlProxy = () => `${scegliProxy(location.search, location.hostname)}/pronto-soccorso`;

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
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: { ...p, livello: livello(p), pin: idPin(p, livello(p)), off: [n * 44, 0] } };
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
// Presidi con l'ultima lettura (per il foglio della modalità emergenza su telefono).
export const elencoPs = () => [...dettagli.values()];

export async function caricaLettura(map = mappa) {
  if (inLettura) return inLettura;
  inLettura = (async () => {
    try {
      const r = await fetch(urlProxy(), { cache: 'no-cache' });
      if (!r.ok) throw new Error(`pronto-soccorso: HTTP ${r.status}`);
      const dati = await r.json();
      for (const p of dati.ps ?? []) dettagli.set(p.id, { ...(dettagli.get(p.id) ?? {}), ...p });
      aggiornato = dati.aggiornato ?? '';
      ultimaLettura = Date.now();
      if (map) scrivi(map);
      scriviLegenda();
    } catch { /* senza Worker restano anagrafica e ultima lettura: la scheda dice che il dato non c'è */ } finally { inLettura = null; }
  })();
  return inLettura;
}

// Pannello grafico di popup (completo: una riga per codice colore) e tooltip (compatto: una griglia di cinque caselle), come nell'app d'origine.
function pannello(p, completo) {
  const d = pannelloPs(p);
  const radice = el('div', `ps-pannello ${completo ? 'ps-pop' : 'ps-tip'}`);
  const riga = (etichetta, valore, classe) => {
    const r = el('div', 'ps-riga');
    r.append(el('span', null, etichetta), valore instanceof Node ? valore : el('b', classe, valore));
    return r;
  };
  const stato = el('em', `ps-stato ps-lv-${d.stato.livello}`, d.stato.testo);
  stato.style.setProperty('--colore', d.stato.colore);
  radice.append(riga('Tipo', d.tipo), riga('In attesa', d.inAttesa, 'ps-grande'), riga('Stato', stato));
  if (completo) {
    for (const c of d.codici) {
      const n = el('span', 'ps-n');
      const q = el('i', 'ps-q');
      q.style.background = c.colore;
      n.append(q, document.createTextNode(c.attesa));
      radice.append(riga(c.nome, n));
    }
  } else {
    const griglia = el('div', 'ps-griglia');
    for (const c of d.codici) {
      const x = el('span', 'ps-c', c.attesa);
      x.style.setProperty('--colore', c.colore);
      x.title = tl(c.nome);
      griglia.append(x);
    }
    radice.append(griglia);
  }
  if (d.aggiornato) radice.append(el('p', 'ps-quando', `${tl('Aggiornato alle')} ${d.aggiornato}`));
  return radice;
}

const corpoPopup = p => [pannello(p, true), el('p', 'monumento-fonte', t('layer.fonte', { fonte: tl(modelloPopupPs(p).fonte) }))];
// tooltip e popup mostrano il pannello al posto di indirizzo e righe: il titolo resta quello del modello
const modelloTooltipPs = p => ({ ...modelloPopupPs(p), sottotitolo: undefined, righe: [], dom: pannello(p, false) });

function collegaPopup(map) {
  let popup = null;
  map.on('click', e => {
    if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
    const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
    if (!f) { popup?.remove(); return; }
    const p = completo(f.properties);
    const modello = { ...modelloPopupPs(p), sottotitolo: undefined, righe: [] };
    popup = apriPopupScheda(map, { precedente: popup, sezione: 'Pronto soccorso', icona: ICONA, colore: COLORE_LIVELLO[livello(p)] ?? COLORE, modello, corpo: corpoPopup(p), punto: e.point, lngLat: e.lngLat });
  });
  registraTooltipStrati(map, [{ layers: [PUNTI], icona: ICONA, sezione: 'Pronto soccorso', colore: p => COLORE_LIVELLO[livello(completo(p))] ?? COLORE,
    campione: () => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileBadge(ICONA, COLORE)]), modello: p => modelloTooltipPs(completo(p)) }]);
  map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
}

// Tornando sulla scheda del browser (in background i timer rallentano) i dati si rinfrescano subito se sono vecchi.
function alRitorno() {
  if (!document.hidden && Date.now() - ultimaLettura > RIFRESCO_MS) caricaLettura();
}

let elencoLegenda = null;
let notaLegenda = null;

function scriviLegenda() {
  if (!notaLegenda) return;
  const q = aggiornato ? quando({ acquisitaAlle: aggiornato }) : '';
  notaLegenda.textContent = q ? t('ps.legenda.aggiornato', { quando: q }) : t('ps.legenda.nonDisponibile');
}

// Voce di legenda: un campione (anello o quadratino) e il testo, una per riga, allineate a sinistra.
function voceLegenda(campione, testo) {
  const riga = el('div', 'ps-leg-riga');
  riga.append(campione, el('span', null, testo));
  return riga;
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-pronto-soccorso lg-pronto-soccorso');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Anello: affollamento'));
  elencoLegenda = el('div', 'ps-legenda-livelli');
  for (const [k, nome, colore] of LIVELLI) {
    const anello = el('i', 'ps-leg-anello');
    anello.style.borderColor = colore;
    const riga = voceLegenda(anello, nome);
    riga.dataset.livello = k;
    elencoLegenda.append(riga);
  }
  const codici = el('div', 'ps-legenda-livelli ps-legenda-codici');
  for (const c of Object.keys(COLORE_CODICE)) {
    const q = el('i', 'ps-leg-quadro');
    q.style.background = COLORE_CODICE[c];
    codici.append(voceLegenda(q, NOME_CODICE[c]));
  }
  notaLegenda = el('p', 'uffici-nota');
  legenda.append(elencoLegenda, el('strong', 'ps-leg-titolo', 'Ciambella: pazienti in attesa per codice colore'), codici,
    el('p', 'uffici-nota', 'Al centro il totale dei pazienti in attesa.'), notaLegenda,
    el('p', 'uffici-nota', 'Indice dell\'ospedale: pazienti presenti rispetto ai posti tecnici. Non è un tempo di attesa. In emergenza chiama il 112.'));
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
    registraBadge(map, ICONA, LIVELLI.map(([, , c]) => c)); // per il tooltip e la legenda
    registraPin(map);
    map.addLayer(layerBadge({ id: PUNTI, source: SRC, immagine: ['get', 'pin'], layout: { visibility: 'none', 'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.7, 17, 1], 'icon-offset': ['get', 'off'], 'symbol-sort-key': ['-', 0, ['get', 'off']] } }));
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
      document.removeEventListener('visibilitychange', alRitorno);
      if (attivo) document.addEventListener('visibilitychange', alRitorno);
    } }],
  pannello: creaLegenda,
  scheda: {
    vicini: { max: 5 }, // anche i presidi nei dintorni del clic (vedi docs/NUOVO_LAYER.md)
    layers: [HIT],
    voci(trovati) {
      if (trovati.length && Date.now() - ultimaLettura > RIFRESCO_MS) caricaLettura(); // la scheda si apre anche a strato spento: si rinfrescano i dati per la prossima apertura e per il pannello
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [vocePs(completo(f.properties))];
      });
    },
  },
};
