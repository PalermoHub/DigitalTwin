import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { t, tl, tn } from '../core/i18n.js';
import { MISSIONI, coloreMissione, nomeSoggetto, voceScheda, voceSintesi, voceTendina } from './scheda-pnrr.js';
import { contenutoDinamico, contenutoTendina, testoCopertura } from './scheda-pnrr-dom.js';
import { conteggiAttuatori, elencoLuogo, firma, modelloTooltipLuogo, nomeProgetto, progettiDa, raggruppa } from './pnrr-luoghi.js';
import { PR, iconaFette } from './marker-fette.js';

// Progetti del PNRR localizzati nella sola città di Palermo (open data di Italia Domani, dati/pnrr/, generati da scripts/pnrr.py).
// Un punto per progetto con un indirizzo trovato nei civici (civico esatto o solo la via), o sulla sede dell'attuatore per le scuole e il
// Comune; gli altri (Università, reti) stanno nel CSV e nel menu a tendina della tab PNRR.
// Sulla mappa i progetti nello stesso luogo sono un solo marker, come le sedi degli uffici: anello a fette colorate (una per missione)
// e numero dei progetti al centro. La legenda fa da filtro (missione, sede delle scuole, soggetto attuatore); lo strato «hit»
// trasparente è sempre presente, così la scheda di destra mostra i progetti anche a strato spento.
const SRC = 'pnrr'; // marker aggregati per luogo (si riempie a strato acceso)
const SRC_HIT = 'pnrr-hit-src'; // un punto per progetto
const PUNTI = 'pnrr-punti';
const HIT = 'pnrr-hit';
const COLORE_NEUTRO = '#868e96';
const COMUNE = 'COMUNE DI PALERMO'; // i18n-ok: valore del campo «soggetto attuatore» nella fonte
const MAX_NELLA_SCHEDA = 60; // una scuola o un palazzo possono avere decine di progetti nello stesso punto
const SOGGETTI_IN_LEGENDA = 8; // oltre questi, il menu «Altro soggetto»
const VUOTO = { type: 'FeatureCollection', features: [] };

let mappa = null;
let legenda = null;
let elenchi = null; // progetti di Comune e Università (dati/pnrr/soggetti.json), per il menu a tendina della scheda
let sintesi = null; // aggregati su tutti i progetti di Palermo (dati/pnrr/sintesi.json), per i grafici della tab PNRR
let progetti = []; // un elemento per progetto in mappa (pnrr-luoghi.js)
let luoghi = new Map(); // id luogo -> luogo (le proprietà annidate non sopravvivono alla mappa)
let stratoAcceso = false;
const immagini = new Set(); // firme delle icone già aggiunte
const accese = new Set(MISSIONI.map(([c]) => c));
let conSede = true; // progetti posizionati sulla sede dell'istituto scolastico (posizione approssimata)
let attuatoreSel = null; // soggetto attuatore scelto (null = tutti)
let radio = []; // [{ valore, input }] delle voci della legenda per soggetto
let menu = null; // <select> degli altri soggetti
let avviso = null; // nota «nessun progetto in mappa»
let copertura = null; // avviso «sulla mappa X progetti su Y»

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

const filtri = () => ({ missioni: accese.size >= MISSIONI.length ? null : accese, conSede, attuatore: attuatoreSel });

// Espressione MapLibre degli stessi filtri, per lo strato «hit» (la scheda mostra solo i progetti non esclusi).
function filtroHit() {
  const f = [
    filtroInsieme(['get', 'missione'], accese, MISSIONI.length),
    !conSede && ['!=', ['get', 'precisione'], 'sede'],
    attuatoreSel && ['==', ['get', 'attuatore'], attuatoreSel],
  ].filter(Boolean);
  return f.length ? ['all', ...f] : null;
}

// Ridisegna i marker secondo i filtri. Le icone (una per combinazione di fette) servono solo a strato acceso.
function aggiorna() {
  if (!mappa?.getLayer(HIT)) return;
  mappa.setFilter(HIT, filtroHit());
  if (!stratoAcceso || !progetti.length) return;
  luoghi = new Map();
  const features = [];
  for (const l of raggruppa(progetti, filtri())) {
    luoghi.set(l.id, l);
    const icona = `pnrr-${firma(l.fette)}`;
    if (!immagini.has(icona)) { mappa.addImage(icona, iconaFette(l.fette), { pixelRatio: PR }); immagini.add(icona); }
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: l.coordinates }, properties: { id: l.id, icona, n: l.n } });
  }
  mappa.getSource(SRC)?.setData({ type: 'FeatureCollection', features });
  if (avviso) avviso.hidden = !(attuatoreSel && !features.length);
}

// «Solo questa» cambia più voci insieme: si ridisegna una volta sola.
let inCoda = false;
function programma() {
  if (inCoda) return;
  inCoda = true;
  queueMicrotask(() => { inCoda = false; aggiorna(); });
}

function sincronizzaSoggetti() {
  for (const { valore, input } of radio) input.checked = valore === attuatoreSel;
  if (menu) menu.value = radio.some(r => r.valore === attuatoreSel) ? '' : (attuatoreSel ?? '');
}

// Sceglie il soggetto attuatore (null = tutti): dalla legenda, dal menu o dal clic nella scheda e nel grafico.
function selezionaSoggetto(nome) {
  attuatoreSel = nome ?? null;
  sincronizzaSoggetti();
  programma();
}

// Dalla scheda: accende lo strato (se spento) e filtra sul soggetto; un secondo clic sullo stesso soggetto toglie il filtro.
function suFiltroDaScheda(e) {
  const d = e.detail;
  if (d?.strato !== 'pnrr' || d.campo !== 'attuatore') return;
  const casella = document.getElementById('strato-pnrr');
  if (casella && !casella.checked) { casella.checked = true; casella.dispatchEvent(new Event('change', { bubbles: true })); }
  selezionaSoggetto(attuatoreSel === d.valore ? null : d.valore);
}

// «43 di 448»: i progetti del soggetto in mappa e quelli totali (gli altri non hanno un punto e si aprono dal menu della scheda)
const conteggio = (voce, n) => {
  const tot = sintesi?.totali_attuatore?.[voce];
  return tot > n ? t('pnrr.inMappaDi', { n, tot }) : String(n);
};

function rigaSoggetto(valore, testo, n) {
  const riga = el('label', 'monumenti-cat');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'pnrr-attuatore';
  input.checked = valore === attuatoreSel;
  input.addEventListener('change', () => selezionaSoggetto(valore));
  riga.append(input, el('i', 'monumenti-pallino'), `${tl(testo)}${n != null ? ` (${valore ? conteggio(valore, n) : n})` : ''}`);
  radio.push({ valore, input });
  return riga;
}

// Legenda per soggetto attuatore: «Tutti», il Comune, i soggetti con più progetti e un menu per gli altri. Si compila a dati letti.
function riempiSoggetti(contenitore) {
  if (!contenitore || !progetti.length) return;
  radio = [];
  const elenco = conteggiAttuatori(progetti);
  const comune = elenco.find(x => x.voce === COMUNE);
  const principali = [...(comune ? [comune] : []), ...elenco.filter(x => x.voce !== COMUNE)].slice(0, SOGGETTI_IN_LEGENDA);
  const righe = [rigaSoggetto(null, 'Tutti i soggetti', progetti.length), ...principali.map(x => rigaSoggetto(x.voce, nomeSoggetto(x.voce), x.n))];
  menu = document.createElement('select');
  menu.setAttribute('aria-label', t('pnrr.altroSoggetto'));
  menu.append(new Option(t('pnrr.altroSoggetto'), ''), ...elenco.filter(x => !principali.includes(x)).map(x => new Option(`${nomeSoggetto(x.voce)} (${conteggio(x.voce, x.n)})`, x.voce)));
  menu.addEventListener('change', () => selezionaSoggetto(menu.value || null));
  const etichetta = el('label', 'pnrr-scelta');
  etichetta.append(el('span', 'pnrr-scelta-et', 'Cerca tra tutti i soggetti'), menu);
  contenitore.replaceChildren(...righe, etichetta);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-pnrr lg-pnrr');
  legenda.hidden = true;
  copertura = el('p', 'pnrr-copertura');
  copertura.textContent = testoCopertura(sintesi);   // i numeri arrivano con la sintesi: prima, il testo senza numeri
  legenda.append(el('strong', null, 'PNRR – Progetti a Palermo'), copertura, el('p', 'uffici-nota', 'Anello: più missioni nello stesso luogo; il numero indica i progetti'));
  for (const [codice, nome, col] of MISSIONI) {
    const simbolo = el('i', 'monumenti-pallino');
    simbolo.style.background = col;
    legenda.append(voceFiltro(simbolo, `${codice} · ${tl(nome)}`, acceso => { acceso ? accese.add(codice) : accese.delete(codice); programma(); }));
  }
  legenda.append(el('em', 'peba-legenda-titolo', 'Posizione'));
  const anello = el('i', 'monumenti-pallino');
  anello.style.cssText = `background: transparent; border: 2px solid ${COLORE_NEUTRO}`;
  legenda.append(voceFiltro(anello, 'Sede del soggetto attuatore (posizione approssimata)', acceso => { conSede = acceso; programma(); }, true, false));
  legenda.append(el('em', 'peba-legenda-titolo', 'Soggetto attuatore'));
  const soggetti = el('div', 'pnrr-soggetti');
  const nota = el('p', 'uffici-nota', 'Tra parentesi i progetti sulla mappa e, se sono di più, quelli totali.');
  avviso = el('p', 'scheda-nota', 'Nessun progetto di questo soggetto è sulla mappa: non ha un indirizzo (vedi l’elenco completo nella scheda).');
  avviso.hidden = true;
  // l'avviso sta in un contenitore: un figlio diretto `hidden` farebbe sparire l'intera legenda dal pannello (css/app.css)
  const sezione = el('div', 'pnrr-sezione-soggetti');
  sezione.append(soggetti, nota, avviso);
  legenda.append(sezione);
  document.getElementById('legende').append(legenda);
  riempiSoggetti(soggetti);
  document.addEventListener('dt:filtro', suFiltroDaScheda);
}

// Tooltip del marker: i dettagli del luogo stanno in `luoghi`, la mappa conserva solo id, icona e numero.
const luogoDi = p => luoghi.get(p.id) ?? { n: p.n ?? 1, progetti: [], fette: [] };

// Popup al clic sul marker: tutti i progetti del luogo, raggruppati per missione, con il titolo e il soggetto attuatore.
// Il dettaglio di ogni progetto è nella scheda di destra (tab PNRR).
function contenutoPopup(luogo) {
  const radice = el('div', 'monumento-popup pnrr-popup');
  radice.append(el('h3', null, tn('pnrr.luogo', luogo.n)));
  const indirizzi = [...new Set(luogo.progetti.map(p => p.indirizzo).filter(Boolean))];
  if (indirizzi.length === 1) radice.append(el('p', 'monumento-cat', indirizzi[0]));
  const elenco = el('ul', 'pnrr-popup-elenco');
  for (const p of elencoLuogo(luogo)) {
    const voce = el('li');
    const pallino = el('i', 'monumenti-pallino');
    pallino.style.background = coloreMissione(p.missione);
    pallino.title = p.missione;
    const testo = el('span');
    testo.append(el('b', null, p.missione), ' ', document.createTextNode(nomeProgetto(p)));
    if (p.attuatore) testo.append(el('small', null, nomeSoggetto(p.attuatore)));
    voce.append(pallino, testo);
    elenco.append(voce);
  }
  radice.append(elenco, el('p', 'monumento-desc uffici-suggerimento', t('pnrr.popupSuggerimento')));
  return radice;
}
const campioneLuogo = p => {
  const l = luogoDi(p);
  return l.fette.length === 1 && l.n > 1 ? campioneTooltip('legenda-pnrr', ['monumenti-pallino', { background: coloreMissione(l.fette[0].area) }]) : null;
};

export default {
  id: 'pnrr',
  titolo: 'PNRR – Progetti a Palermo',
  argomento: {
    titolo: 'PNRR – Progetti a Palermo',
    descrizione: 'Progetti del Piano nazionale di ripresa e resilienza localizzati nella sola città di Palermo (open data di Italia Domani): missione, stato di avanzamento, importi e soggetto attuatore. Sulla mappa solo i progetti che hanno un luogo, raggruppati (circa la metà): gli altri si consultano nella scheda, tab PNRR, e nell’elenco completo in CSV.',
  },
  gruppo: 'territorio',
  sezione: 'PNRR', // sottogruppo a sé in Territorio
  sezioniFisse: true, // il titolo non viaggia con lo strato nel riordino
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO });
    map.addSource(SRC_HIT, { type: 'geojson', data: urlDati('pnrr/pnrr.geojson') });
    fetch(urlDati('pnrr/sintesi.json')).then(r => r.json()).then(d => { sintesi = d; riempiSoggetti(legenda?.querySelector('.pnrr-soggetti')); if (copertura) copertura.textContent = testoCopertura(sintesi); }).catch(() => { sintesi = null; });
    fetch(urlDati('pnrr/soggetti.json')).then(r => r.json()).then(d => { elenchi = d.soggetti; }).catch(() => { elenchi = null; });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({
      id: PUNTI, type: 'symbol', source: SRC, layout: {
        visibility: 'none', 'icon-image': ['get', 'icona'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'symbol-sort-key': ['-', 0, ['get', 'n']], // i luoghi con più progetti sotto, quelli piccoli sopra
      },
    });
    // trasparente e sempre presente: la scheda del luogo mostra i progetti anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC_HIT, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [PUNTI], icona: 'euro', modello: p => modelloTooltipLuogo(luogoDi(p)), campione: campioneLuogo }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      popup?.remove();
      const luogo = f && luoghi.get(f.properties.id);
      if (!luogo) return;
      popup = new maplibregl.Popup({ maxWidth: '360px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(f.geometry.coordinates).setDOMContent(contenutoPopup(luogo)).addTo(map);
    });
  },
  async avvia() {
    const dati = await (await fetch(urlDati('pnrr/pnrr.geojson'))).json();
    progetti = progettiDa(dati.features);
    riempiSoggetti(legenda?.querySelector('.pnrr-soggetti'));
    aggiorna();
  },
  legendaPannello: '.lg-pnrr', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'pnrr', etichetta: 'Progetti PNRR', layers: [PUNTI], attivo: false,
    suCambio(attivo) {
      const prima = stratoAcceso;
      stratoAcceso = attivo;
      if (attivo && !prima) aggiorna();
      if (legenda) legenda.hidden = !attivo;
    },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT],
    // nella tab PNRR: i progetti cliccati e, sempre, la sintesi con i grafici di tutti i progetti di Palermo
    voci(trovati) {
      const visti = new Set();
      const dellaScheda = tutti(trovati, HIT)
        .map(f => voceScheda(f.properties))
        .filter(v => !visti.has(v.chiave) && visti.add(v.chiave))
        .slice(0, MAX_NELLA_SCHEDA);
      // il menu a tendina in testa alla tab (si trova subito), poi i progetti cliccati, poi la sintesi con i grafici
      return [...(elenchi?.length ? [voceTendina(elenchi, contenutoTendina, sintesi)] : []), ...dellaScheda, ...(sintesi ? [voceSintesi(sintesi, contenutoDinamico)] : [])];
    },
  },
};
