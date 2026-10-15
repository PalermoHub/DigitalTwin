import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { occhio } from '../core/pannello.js';
import { voceFiltro } from '../core/legenda.js';
import { modelloPopupSede, voceUffici } from './scheda-uffici.js';
import { fette, areeDaSedi } from './uffici-fette.js';
import { PR, iconaFette } from './marker-fette.js';
import { tl } from '../core/i18n.js';

// Sedi degli uffici comunali (dati/uffici/sedi.geojson), tematizzate per area. Ogni sede è un'icona disegnata su canvas:
// cerchio pieno se ospita una sola area, anello a fette colorate (una per area) se ne ospita più d'una; al centro il numero degli uffici.
// Il popup è breve; l'elenco completo (responsabili, contatti, link) sta nella scheda a destra, anche a strato spento.
const SRC = 'uffici';
const SRC_HIT = 'uffici-hit-src';
const PUNTI = 'uffici-punti';
const HIT = 'uffici-hit';
const VUOTO = { type: 'FeatureCollection', features: [] };

const dettagli = new Map(); // id sede -> proprietà complete (gli array annidati non sopravvivono alla mappa)
const geometrie = new Map();
const completo = p => dettagli.get(p.id) ?? p;
let mappa = null;
let legenda = null;
let accese = null; // aree attive (null = tutte)
let aree = [];
let blocco = null; // contenitore delle caselle delle aree nel menu del layer
const caselle = new Map(); // area -> { pannello, legenda }

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function contenutoPopup(p) {
  const m = modelloPopupSede(p);
  const radice = el('div', 'monumento-popup uffici-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  if (m.indirizzo) radice.append(el('p', 'monumento-desc', m.indirizzo));
  for (const a of m.aree) radice.append(el('p', 'monumento-desc', `• ${a.area} (${a.n})`));
  if (m.altreAree) radice.append(el('p', 'monumento-desc', `… e altre ${m.altreAree} aree`));
  radice.append(el('p', 'monumento-desc uffici-suggerimento', 'Elenco, responsabili e contatti nella scheda a destra.'));
  return radice;
}

// Ridisegna le sedi in base alle aree accese in legenda (le sedi senza aree accese spariscono).
// Le icone (una per sede, disegnate su canvas) servono solo a strato acceso: a strato spento non si disegnano.
let stratoAcceso = false;
function aggiorna() {
  if (!mappa || !stratoAcceso) return;
  const features = [];
  for (const [id, p] of dettagli) {
    const lista = fette(p.uffici, accese);
    const nome = `uffici-sede-${id}`;
    if (mappa.hasImage(nome)) mappa.removeImage(nome);
    if (!lista.length) continue;
    mappa.addImage(nome, iconaFette(lista), { pixelRatio: PR });
    features.push({ type: 'Feature', geometry: geometrie.get(id), properties: { id, icona: nome, n: lista.reduce((s, f) => s + f.n, 0) } });
  }
  mappa.getSource(SRC)?.setData({ type: 'FeatureCollection', features });
}

// «Solo questa» cambia molte voci insieme: si ridisegna una volta sola.
let inCoda = false;
function programma() {
  if (inCoda) return;
  inCoda = true;
  queueMicrotask(() => { inCoda = false; aggiorna(); });
}

function riempiLegenda() {
  if (!legenda || !aree.length || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  const tutte = new Set(aree.map(a => a.area));
  for (const a of aree) {
    const pallino = el('i', 'monumenti-pallino');
    pallino.style.background = a.colore;
    const imposta = (acceso, origine) => {
      accese ??= new Set(tutte);
      acceso ? accese.add(a.area) : accese.delete(a.area);
      if (accese.size >= tutte.size) accese = null;
      for (const [dove, casella] of Object.entries(caselle.get(a.area) ?? {})) if (dove !== origine) casella.checked = acceso;
      programma();
    };
    const riga = voceFiltro(pallino, `${a.area} (${a.n})`, acceso => imposta(acceso, 'legenda'));
    legenda.append(riga);
    // la stessa area come casella nel menu del layer (con la pallino), abilitata a strato acceso
    const label = el('label', 'sotto-voce');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.disabled = legenda.hidden;
    cb.dataset.filtro = `area:${a.area}`;
    cb.addEventListener('change', () => imposta(cb.checked, 'pannello'));
    label.append(cb, occhio(), ' ', pallino.cloneNode(), ' ', a.area);
    blocco?.append(label);
    caselle.set(a.area, { pannello: cb, legenda: riga._filtro.casella });
  }
}

function creaLegenda(gruppo) {
  blocco = el('div', 'colonnine-filtri');
  gruppo.append(blocco);
  legenda = el('div', 'legenda legenda-monumenti legenda-uffici lg-uffici');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Uffici comunali per area'));
  legenda.append(el('p', 'uffici-nota', 'Anello: più aree nella stessa sede'));
  document.getElementById('legende').append(legenda);
  riempiLegenda();
}

export default {
  id: 'uffici',
  titolo: 'Uffici comunali',
  argomento: { titolo: 'Uffici comunali', descrizione: 'Sedi degli uffici del Comune di Palermo, con responsabili e contatti.' },
  gruppo: 'colonnine', // dentro «Servizi su strada»
  sezione: 'Uffici comunali',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO });
    map.addSource(SRC_HIT, { type: 'geojson', data: urlDati('uffici/sedi.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({
      id: PUNTI, type: 'symbol', source: SRC, layout: {
        visibility: 'none', 'icon-image': ['get', 'icona'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'symbol-sort-key': ['-', 0, ['get', 'n']], // le sedi grandi sotto, le piccole sopra
      },
    });
    // punti trasparenti sempre presenti: la scheda del luogo mostra le sedi vicine anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC_HIT, paint: { 'circle-radius': 12, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      popup?.remove();
      if (!f) return;
      popup = new maplibregl.Popup({ maxWidth: '340px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(f.geometry.coordinates).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
    });
    registraTooltipStrati(map, [{ layers: [PUNTI], icona: 'uffici', campione: p => { const a = modelloPopupSede(completo(p)).aree; const col = a.length === 1 ? aree.find(x => x.area === a[0].area)?.colore : null; return col ? campioneTooltip('legenda-monumenti', ['monumenti-pallino', { background: col }]) : null; }, modello: p => modelloPopupSede(completo(p)) }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
  },
  async avvia() {
    const dati = await (await fetch(urlDati('uffici/sedi.geojson'))).json();
    for (const f of dati.features) {
      dettagli.set(f.properties.id, f.properties);
      geometrie.set(f.properties.id, f.geometry);
    }
    aree = areeDaSedi([...dettagli.values()]);
    aggiorna();
    riempiLegenda();
  },
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        const p = completo(f.properties);
        if (visti.has(p.id)) return [];
        visti.add(p.id);
        return [voceUffici(p)];
      });
    },
  },
  legendaPannello: '.lg-uffici', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'uffici', etichetta: 'Uffici comunali (sedi)', layers: [PUNTI], attivo: false,
    // le aree si conoscono solo a dati caricati: l'elenco si legge quando serve (tab Argomenti)
    get sottovoci() {
      return aree.length ? [{ titolo: 'Aree', voci: aree.map(a => ({ id: `area:${a.area}`, etichetta: a.area })) }] : [];
    },
    suCambio(attivo) {
      const prima = stratoAcceso;
      stratoAcceso = attivo;
      if (attivo && !prima) aggiorna();
      if (legenda) legenda.hidden = !attivo;
      for (const { pannello } of caselle.values()) pannello.disabled = !attivo;
    },
  }],
  pannello: creaLegenda,
};
