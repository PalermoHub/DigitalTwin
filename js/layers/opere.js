import { apriPopupScheda } from './popup-traffico.js';
import { urlDati } from '../core/config.js';
import { quotaIcone } from '../core/quota-icone.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { t, tl, tn } from '../core/i18n.js';
import { EVENTO_IMPORTO, descriviImporto, espressioneImporto } from '../core/filtri-parole.js';
import { SETTORI, coloreSettore, nomeSettore, nomeSoggetto, titoloOpera, voceScheda, voceSintesi, voceTendina } from './scheda-opere.js';
import { contenutoDinamico, contenutoTendina, testoCopertura } from './scheda-opere-dom.js';
import { conteggiTitolari, elencoLuogo, firma, modelloTooltipLuogo, opereDa, raggruppa } from './opere-luoghi.js';
import { PR, iconaFette } from './marker-fette.js';

// Opere pubbliche localizzate nella sola città di Palermo (open data BDAP-MOP della Ragioneria generale dello Stato, dati/opere/, generati da
// scripts/opere.py): Comune, Città Metropolitana, ANAS, IACP, aziende sanitarie, Università…
// Un punto per opera con un indirizzo trovato nei civici (civico esatto o solo la via); le altre stanno nel CSV e nel menu a tendina della tab Opere.
// Sulla mappa le opere nello stesso luogo sono un solo marker, come i progetti PNRR: anello a fette colorate (una per settore) e numero delle
// opere al centro. La legenda fa da filtro (settore, opere chiuse, titolare); lo strato «hit» trasparente è sempre presente, così la scheda di
// destra mostra le opere anche a strato spento.
const SRC = 'opere'; // marker aggregati per luogo (si riempie a strato acceso)
const SRC_HIT = 'opere-hit-src'; // un punto per opera
const PUNTI = 'opere-punti';
const HIT = 'opere-hit';
const COMUNE = 'COMUNE DI PALERMO'; // i18n-ok: valore del campo «titolare» nella fonte
const MAX_NELLA_SCHEDA = 60; // una scuola o un palazzo possono avere decine di opere nello stesso punto
const TITOLARI_IN_LEGENDA = 8; // oltre questi, il menu «Altro titolare»
const VUOTO = { type: 'FeatureCollection', features: [] };

let mappa = null;
let legenda = null;
let elenchi = null; // opere senza punto per titolare (dati/opere/elenco.json), per il menu a tendina della scheda
let sintesi = null; // aggregati su tutte le opere (dati/opere/sintesi.json), per i grafici della tab Opere
let opere = []; // un elemento per opera in mappa (opere-luoghi.js)
let luoghi = new Map(); // id luogo -> luogo (le proprietà annidate non sopravvivono alla mappa)
let stratoAcceso = false;
const immagini = new Set(); // firme delle icone già aggiunte
const accesi = new Set(SETTORI.map(([c]) => c));
let chiuse = true; // opere con CUP chiuso
let titolareSel = null; // titolare scelto (null = tutti)
let radio = []; // [{ valore, input }] delle voci della legenda per titolare
let menu = null; // <select> degli altri titolari
let avviso = null; // nota «nessuna opera in mappa»
let copertura = null; // avviso «sulla mappa X opere su Y»

let importo = { min: null, max: null }; // filtro per importo, dal Chat bot (core/filtri-parole.js)
let notaImporto = null; // riga «Filtro attivo» nella legenda
function mostraImporto() {
  const testo = descriviImporto(importo);
  notaImporto.hidden = !testo;
  notaImporto.replaceChildren();
  if (!testo) return;
  const togli = Object.assign(document.createElement('button'), { type: 'button', textContent: t('filtroImporto.togli') });
  togli.addEventListener('click', () => document.dispatchEvent(new CustomEvent(EVENTO_IMPORTO, { detail: { strato: 'opere', min: null, max: null } })));
  notaImporto.append(t('filtroImporto.legenda', { testo }), ' ', togli);
}
// l'ascolto parte con il modulo: il filtro vale anche se i dati del layer arrivano dopo
globalThis.document?.addEventListener(EVENTO_IMPORTO, e => {
  if (e.detail?.strato !== 'opere') return;
  importo = { min: e.detail.min ?? null, max: e.detail.max ?? null };
  if (notaImporto) mostraImporto();
  programma();
});

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

const filtri = () => ({ settori: accesi.size >= SETTORI.length ? null : accesi, chiuse, titolare: titolareSel, importo });

// Espressione MapLibre degli stessi filtri, per lo strato «hit» (la scheda mostra solo le opere non escluse).
function filtroHit() {
  const f = [
    filtroInsieme(['get', 'settore'], accesi, SETTORI.length),
    !chiuse && ['!=', ['get', 'stato'], 'CHIUSO'],
    titolareSel && ['==', ['get', 'titolare'], titolareSel],
    espressioneImporto('costo_previsto', importo),
  ].filter(Boolean);
  return f.length ? ['all', ...f] : null;
}

// Ridisegna i marker secondo i filtri. Le icone (una per combinazione di fette) servono solo a strato acceso.
function aggiorna() {
  if (!mappa?.getLayer(HIT)) return;
  mappa.setFilter(HIT, filtroHit());
  if (!stratoAcceso || !opere.length) return;
  luoghi = new Map();
  const features = [];
  for (const l of raggruppa(opere, filtri())) {
    luoghi.set(l.id, l);
    const icona = `opere-${firma(l.fette)}`;
    if (!immagini.has(icona)) { mappa.addImage(icona, iconaFette(l.fette), { pixelRatio: PR }); immagini.add(icona); }
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: l.coordinates }, properties: { id: l.id, icona, n: l.n } });
  }
  mappa.getSource(SRC)?.setData({ type: 'FeatureCollection', features });
  if (avviso) avviso.hidden = !(titolareSel && !features.length);
}

// «Solo questa» cambia più voci insieme: si ridisegna una volta sola.
let inCoda = false;
function programma() {
  if (inCoda) return;
  inCoda = true;
  queueMicrotask(() => { inCoda = false; aggiorna(); });
}

function sincronizzaTitolari() {
  for (const { valore, input } of radio) input.checked = valore === titolareSel;
  if (menu) menu.value = radio.some(r => r.valore === titolareSel) ? '' : (titolareSel ?? '');
}

// Sceglie il titolare (null = tutti): dalla legenda, dal menu o dal clic nella scheda e nel grafico.
function selezionaTitolare(nome) {
  titolareSel = nome ?? null;
  sincronizzaTitolari();
  programma();
}

// Dalla scheda: accende lo strato (se spento) e filtra sul titolare; un secondo clic sullo stesso titolare toglie il filtro.
function suFiltroDaScheda(e) {
  const d = e.detail;
  if (d?.strato !== 'opere' || d.campo !== 'titolare') return;
  const casella = document.getElementById('strato-opere');
  if (casella && !casella.checked) { casella.checked = true; casella.dispatchEvent(new Event('change', { bubbles: true })); }
  selezionaTitolare(titolareSel === d.valore ? null : d.valore);
}

// «43 di 189»: le opere del titolare in mappa e quelle totali (le altre non hanno un punto e si aprono dal menu della scheda)
const conteggio = (voce, n) => {
  const tot = sintesi?.totali_titolare?.[voce];
  return tot > n ? t('opere.inMappaDi', { n, tot }) : String(n);
};

function rigaTitolare(valore, testo, n) {
  const riga = el('label', 'monumenti-cat');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'opere-titolare';
  input.checked = valore === titolareSel;
  input.addEventListener('change', () => selezionaTitolare(valore));
  riga.append(input, el('i', 'monumenti-pallino'), `${tl(testo)}${n != null ? ` (${valore ? conteggio(valore, n) : n})` : ''}`);
  radio.push({ valore, input });
  return riga;
}

// Legenda per titolare: «Tutti», il Comune, i titolari con più opere e un menu per gli altri. Si compila a dati letti.
function riempiTitolari(contenitore) {
  if (!contenitore || !opere.length) return;
  radio = [];
  const elenco = conteggiTitolari(opere);
  const comune = elenco.find(x => x.voce === COMUNE);
  const principali = [...(comune ? [comune] : []), ...elenco.filter(x => x.voce !== COMUNE)].slice(0, TITOLARI_IN_LEGENDA);
  const righe = [rigaTitolare(null, 'Tutti i titolari', opere.length), ...principali.map(x => rigaTitolare(x.voce, nomeSoggetto(x.voce), x.n))];
  menu = document.createElement('select');
  menu.setAttribute('aria-label', t('opere.altroTitolare'));
  menu.append(new Option(t('opere.altroTitolare'), ''), ...elenco.filter(x => !principali.includes(x)).map(x => new Option(`${nomeSoggetto(x.voce)} (${conteggio(x.voce, x.n)})`, x.voce)));
  menu.addEventListener('change', () => selezionaTitolare(menu.value || null));
  const etichetta = el('label', 'pnrr-scelta');
  etichetta.append(el('span', 'pnrr-scelta-et', 'Cerca tra tutti i titolari'), menu);
  contenitore.replaceChildren(...righe, etichetta);
}

function creaLegenda() {
  // le classi legenda-pnrr / pnrr-* danno gli stessi stili del layer PNRR (legenda a elenco con filtri, menu, popup)
  legenda = el('div', 'legenda legenda-monumenti legenda-pnrr lg-opere');
  legenda.hidden = true;
  copertura = el('p', 'pnrr-copertura');
  copertura.textContent = testoCopertura(sintesi);   // i numeri arrivano con la sintesi: prima, il testo senza numeri
  // la nota sta in un contenitore: un figlio diretto `hidden` farebbe sparire l'intera legenda dal pannello (css/app.css)
  notaImporto = el('p', 'scheda-nota');
  const boxImporto = el('div');
  boxImporto.append(notaImporto);
  mostraImporto();
  legenda.append(el('strong', null, 'Opere pubbliche a Palermo'), copertura, boxImporto, el('p', 'uffici-nota', 'Anello: più settori nello stesso luogo; il numero indica le opere'));
  for (const [codice, nome, col] of SETTORI) {
    const simbolo = el('i', 'monumenti-pallino');
    simbolo.style.background = col;
    legenda.append(voceFiltro(simbolo, nome, acceso => { acceso ? accesi.add(codice) : accesi.delete(codice); programma(); }));
  }
  legenda.append(el('em', 'peba-legenda-titolo', 'Stato'));
  const chiusa = el('i', 'monumenti-pallino');
  chiusa.style.cssText = 'background: transparent; border: 2px solid #868e96';
  legenda.append(voceFiltro(chiusa, 'Anche le opere con CUP chiuso', acceso => { chiuse = acceso; programma(); }, true, false));
  legenda.append(el('em', 'peba-legenda-titolo', 'Titolare'));
  const titolari = el('div', 'pnrr-soggetti');
  const nota = el('p', 'uffici-nota', 'Tra parentesi le opere sulla mappa e, se sono di più, quelle totali.');
  avviso = el('p', 'scheda-nota', 'Nessuna opera di questo titolare è sulla mappa: non ha un indirizzo (vedi l’elenco nella scheda).');
  avviso.hidden = true;
  // l'avviso sta in un contenitore: un figlio diretto `hidden` farebbe sparire l'intera legenda dal pannello (css/app.css)
  const sezione = el('div', 'pnrr-sezione-soggetti');
  sezione.append(titolari, nota, avviso);
  legenda.append(sezione);
  document.getElementById('legende').append(legenda);
  riempiTitolari(titolari);
  document.addEventListener('dt:filtro', suFiltroDaScheda);
}

// Tooltip del marker: i dettagli del luogo stanno in `luoghi`, la mappa conserva solo id, icona e numero.
const luogoDi = p => luoghi.get(p.id) ?? { n: p.n ?? 1, opere: [], fette: [] };

// Popup al clic sul marker: tutte le opere del luogo, raggruppate per settore, con il titolo e il titolare.
// Il dettaglio di ogni opera è nella scheda di destra (tab Opere).
// Corpo del popup unico: l'elenco dei progetti del luogo, con il colore dell'area di ciascuno.
function corpoPopup(luogo) {
  const radice = el('div', 'pnrr-popup');
  const elenco = el('ul', 'pnrr-popup-elenco');
  for (const p of elencoLuogo(luogo)) {
    const voce = el('li');
    const pallino = el('i', 'monumenti-pallino');
    pallino.style.background = coloreSettore(p.settore);
    pallino.title = tl(nomeSettore(p.settore));
    const testo = el('span');
    testo.append(el('b', null, nomeSettore(p.settore)), ' ', document.createTextNode(titoloOpera(p)));
    if (p.titolare) testo.append(el('small', null, nomeSoggetto(p.titolare)));
    voce.append(pallino, testo);
    elenco.append(voce);
  }
  radice.append(elenco, el('p', 'monumento-desc uffici-suggerimento', t('opere.popupSuggerimento')));
  return [radice];
}
// Titolo e indirizzo (se uno solo) del luogo.
function modelloPopupLuogo(luogo) {
  const indirizzi = [...new Set(luogo.opere.map(p => p.indirizzo).filter(Boolean))];
  return { titolo: tn('opere.luogo', luogo.n), sottotitolo: indirizzi.length === 1 ? indirizzi[0] : null };
}
const campioneLuogo = p => {
  const l = luogoDi(p);
  return l.fette.length === 1 && l.n > 1 ? campioneTooltip('legenda-pnrr', ['monumenti-pallino', { background: coloreSettore(l.fette[0].area) }]) : null;
};

export default {
  id: 'opere',
  titolo: 'Opere pubbliche a Palermo',
  argomento: {
    titolo: 'Opere pubbliche a Palermo',
    descrizione: 'Opere pubbliche localizzate nella sola città di Palermo (open data BDAP-MOP della Ragioneria generale dello Stato): titolare (Comune, Città Metropolitana, ANAS, IACP, aziende sanitarie…), settore, fase dei lavori, costi e finanziamenti dichiarati. Sulla mappa solo le opere che hanno un indirizzo trovato, raggruppate (circa la metà): le altre si consultano nella scheda, tab Opere, e nell’elenco completo in CSV.',
  },
  gruppo: 'territorio',
  sezione: 'Opere pubbliche', // sottogruppo a sé in Territorio
  sezioniFisse: true, // il titolo non viaggia con lo strato nel riordino
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO });
    quotaIcone(map, SRC);
    map.addSource(SRC_HIT, { type: 'geojson', data: urlDati('opere/opere.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({
      id: PUNTI, type: 'symbol', source: SRC, layout: {
        visibility: 'none', 'icon-image': ['get', 'icona'], 'icon-offset': ['get', 'off'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'symbol-sort-key': ['-', 0, ['get', 'n']], // i luoghi con più opere sotto, quelli piccoli sopra
      },
    });
    // trasparente e sempre presente: la scheda del luogo mostra le opere anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC_HIT, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{ layers: [PUNTI], icona: 'cantiere', modello: p => modelloTooltipLuogo(luogoDi(p)), campione: campioneLuogo }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      const luogo = f && luoghi.get(f.properties.id);
      if (!luogo) { popup?.remove(); return; }
      popup = apriPopupScheda(map, { precedente: popup, sezione: 'Opere pubbliche', icona: 'cantiere', colore: coloreSettore(elencoLuogo(luogo)[0]?.settore) ?? '#495057', modello: modelloPopupLuogo(luogo), corpo: corpoPopup(luogo), punto: e.point, lngLat: f.geometry.coordinates });
    });
  },
  async avvia() {
    // sintesi e elenchi per la legenda e la scheda: arrivano con i dati del layer, non all'avvio
    fetch(urlDati('opere/sintesi.json')).then(r => r.json()).then(d => { sintesi = d; riempiTitolari(legenda?.querySelector('.pnrr-soggetti')); if (copertura) copertura.textContent = testoCopertura(sintesi); }).catch(() => { sintesi = null; });
    fetch(urlDati('opere/elenco.json')).then(r => r.json()).then(d => { elenchi = d.titolari; }).catch(() => { elenchi = null; });
    const dati = await (await fetch(urlDati('opere/opere.geojson'))).json();
    opere = opereDa(dati.features);
    riempiTitolari(legenda?.querySelector('.pnrr-soggetti'));
    aggiorna();
  },
  legendaPannello: '.lg-opere', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'opere', etichetta: 'Opere pubbliche', layers: [PUNTI], attivo: false,
    suCambio(attivo) {
      const prima = stratoAcceso;
      stratoAcceso = attivo;
      if (attivo && !prima) aggiorna();
      if (legenda) legenda.hidden = !attivo;
    },
  }],
  pannello: creaLegenda,
  scheda: {
    vicini: { max: 5 }, // anche i punti nei dintorni del clic (raggio: regolabile dalla legenda, core/raggio-vicini.js) (vedi docs/NUOVO_LAYER.md)
    layers: [HIT],
    // nella tab Opere: le opere cliccate e, sempre, la sintesi con i grafici di tutte le opere di Palermo
    voci(trovati) {
      const visti = new Set();
      const dellaScheda = tutti(trovati, HIT)
        .map(f => voceScheda(f.properties))
        .filter(v => !visti.has(v.chiave) && visti.add(v.chiave))
        .slice(0, MAX_NELLA_SCHEDA);
      // il menu a tendina in testa alla tab (si trova subito), poi le opere cliccate, poi la sintesi con i grafici
      return [...(elenchi?.length ? [voceTendina(elenchi, contenutoTendina, sintesi)] : []), ...dellaScheda, ...(sintesi ? [voceSintesi(sintesi, contenutoDinamico)] : [])];
    },
  },
};
