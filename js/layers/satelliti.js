import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { occhio } from '../core/pannello.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { GRUPPI, NOME_GRUPPO, coloreGruppo, voceSatellite, modelloPopupSatellite, testoPassaggio, testoPassaggioIss } from './scheda-satelliti.js';
import { creaSatelliti, posizione, daPalermo, prossimoPassaggio, dettaglioPassaggio, arcoCielo, proiezioneCielo, elementiVecchi, traccia, CENTRO_CIELO } from './satelliti-orbite.js';
import { creaMondo } from './satelliti-mondo.js';
import { contenutoPopupTraffico, ancoraPopupTraffico, rifinisciPopupTraffico, centraPopupTraffico } from './popup-traffico.js';
import { tl, t } from '../core/i18n.js';
import { registraGlifo, layerGlifo, stileGlifo, simboloGlifo } from '../core/icone-mappa.js';
import { scegliProxy } from '../rndt/proxy.js';

// Il cielo di Palermo come un radar: centro = Palermo (zenit), cerchio esterno = orizzonte, nord in alto. I satelliti sopra l'orizzonte
// (stazioni spaziali e i più luminosi) sono disegnati dove li si vede nel cielo; l'arco tratteggiato è il prossimo passaggio dell'ISS.
// Gli elementi orbitali li serve il Worker (/satelliti, da CelesTrak, rinnovati ogni 2 ore); le posizioni le calcola il browser (SGP4) ogni secondo.
// Un satellite si muove a ~7 km/s: a strato spento non si tengono posizioni vecchie, quindi la scheda (e il clic) c'è solo a strato acceso.
const SRC = 'satelliti';
const SRC_CIELO = 'satelliti-cielo';
const SRC_ARCO = 'satelliti-arco';
const ICONA = 'satellite';
const PUNTI = 'satelliti-punti';
const HIT = 'satelliti-hit';
const CIELO = 'satelliti-cielo-linee';
const ETICHETTE = 'satelliti-cielo-etichette';
const ARCO = 'satelliti-arco-linea';
const COLORE_CIELO = '#495057';
const ISS = 25544;
const INTERVALLO_MS = 1000;
const RIFRESCO_ELEMENTI_MS = 2 * 60 * 60 * 1000;
const TRACCIA_MS = 30 * 1000;
const VUOTO = { type: 'FeatureCollection', features: [] };
const urlSatelliti = () => `${scegliProxy(location.search, location.hostname)}/satelliti`;

let satelliti = []; // creaSatelliti() degli elementi scaricati
const perId = new Map(); // id -> satellite
const dettagli = new Map(); // id -> proprietà del satellite sopra l'orizzonte, ricalcolate a ogni secondo
let passaggioIss = null; // prossimo passaggio dell'ISS (calcolato quando serve)
let mondo = null; // mini-mappa del mondo
let riquadroIss = null; // riquadro «Prossimo passaggio dell'ISS» sulla mappa
let dettaglioIss = null;
let riquadroMondo = null; // il suo riquadro sulla mappa (la legenda del layer sta nel pannello, che di solito è chiuso)
let tracciaIss = []; // traccia a terra dell'ISS (±45 minuti), ricalcolata ogni TRACCIA_MS
let tracciaDel = 0;
let mappa = null;
let legenda = null;
let nota = null;
let timer = null;
let ultimoScarico = 0;
let acceso = false;
const accesi = new Set(GRUPPI.map(([g]) => g));
const caselle = new Map(); // gruppo -> { pannello, legenda }

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Orizzonte, anello a 30° e 60°, e i punti cardinali appena fuori dal cerchio
function costruisciCielo() {
  const cerchio = elev => {
    const c = [];
    for (let az = 0; az <= 360; az += 5) c.push(proiezioneCielo(az, elev));
    return { type: 'Feature', geometry: { type: 'LineString', coordinates: c }, properties: { orizzonte: elev === 0 } };
  };
  const croce = [0, 90].map(az => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: [proiezioneCielo(az, 0), proiezioneCielo(az + 180, 0)] }, properties: { orizzonte: false } }));
  const punti = [['N', 0], ['E', 90], ['S', 180], ['O', 270]].map(([n, az]) => ({
    type: 'Feature', geometry: { type: 'Point', coordinates: proiezioneCielo(az, -4.5) }, properties: { nome: n },
  }));
  return { type: 'FeatureCollection', features: [cerchio(0), cerchio(30), cerchio(60), ...croce, ...punti] };
}

function scriviNota(adesso) {
  if (!nota) return;
  if (!satelliti.length) { nota.textContent = t('satelliti.nonDisponibile'); return; }
  const sopra = dettagli.size;
  const iss = perId.get(ISS);
  const riga = iss ? `${tl('Prossimo passaggio')} ISS: ${testoPassaggio(passaggioIss, adesso)}` : '';
  nota.textContent = [t('satelliti.sopraPalermo', { n: sopra }), riga].filter(Boolean).join(' · ');
}

// Il riquadro dell'ISS: il conto alla rovescia cambia a ogni secondo, le direzioni solo a ogni nuovo passaggio
function scriviRiquadroIss(adesso) {
  if (!riquadroIss) return;
  const { titolo, righe } = testoPassaggioIss(dettaglioIss, adesso);
  riquadroIss.replaceChildren(el('strong', null, titolo), ...righe.map(r => { const p = document.createElement('p'); p.className = 'uffici-nota'; p.textContent = r; return p; }));
}

// Posizione di ogni satellite oggi: tiene solo quelli sopra l'orizzonte di Palermo
function calcola() {
  const adesso = new Date();
  dettagli.clear();
  const features = [];
  const sulMondo = [];
  for (const s of satelliti) {
    const p = posizione(s, adesso);
    if (!p) continue;
    const v = daPalermo(s, adesso);
    const sopra = !!v && v.elevazione >= 0;
    const gruppo = NOME_GRUPPO[s.gruppo] ?? s.gruppo;
    if (accesi.has(gruppo)) sulMondo.push({ lng: p.lng, lat: p.lat, gruppo, sopra, iss: s.id === ISS });
    if (!sopra) continue;
    const props = {
      id: s.id, nome: s.nome, gruppo: NOME_GRUPPO[s.gruppo] ?? s.gruppo, designazione: s.designazione,
      elevazione: v.elevazione, azimut: v.azimut, distanza_km: v.distanzaKm,
      quota_km: p.quotaKm, velocita_kms: p.velocitaKmS, lat: p.lat, lng: p.lng, elementi_vecchi: elementiVecchi(s, adesso),
    };
    dettagli.set(s.id, props);
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: proiezioneCielo(v.azimut, v.elevazione) }, properties: props });
  }
  mappa?.getSource(SRC)?.setData({ type: 'FeatureCollection', features });
  const iss = perId.get(ISS);
  if (iss && Date.now() - tracciaDel > TRACCIA_MS) { tracciaIss = traccia(iss, adesso, 45, 45, 60); tracciaDel = Date.now(); }
  mondo?.disegna({ satelliti: sulMondo, traccia: accesi.has(NOME_GRUPPO.stations) ? tracciaIss : [], palermo: CENTRO_CIELO });
  if (iss && (!passaggioIss || (passaggioIss.fine && passaggioIss.fine < adesso))) {
    passaggioIss = prossimoPassaggio(iss, adesso);
    dettaglioIss = dettaglioPassaggio(iss, passaggioIss);
    mappa?.getSource(SRC_ARCO)?.setData(passaggioIss?.fine ? { type: 'Feature', geometry: { type: 'LineString', coordinates: arcoCielo(iss, passaggioIss) }, properties: {} } : VUOTO);
  }
  scriviRiquadroIss(adesso);
  scriviNota(adesso);
}

async function scarica() {
  try {
    const r = await fetch(urlSatelliti());
    if (!r.ok) throw new Error(String(r.status));
    const dati = await r.json();
    satelliti = creaSatelliti(dati.satelliti);
    perId.clear();
    for (const s of satelliti) perId.set(s.id, s);
    passaggioIss = null;
    ultimoScarico = Date.now();
  } catch { /* restano gli elementi di prima; senza nessun elemento la nota dice «non disponibile» */ }
}

async function aggiorna() {
  if (!satelliti.length || Date.now() - ultimoScarico > RIFRESCO_ELEMENTI_MS) await scarica();
  if (acceso) calcola();
}

// Il ciclo gira solo con lo strato acceso e la scheda del browser in primo piano.
function pianifica() {
  clearInterval(timer);
  timer = null;
  if (acceso && !document.hidden) timer = setInterval(() => aggiorna(), INTERVALLO_MS);
}

function applicaFiltri() {
  const filtro = filtroInsieme(['get', 'gruppo'], accesi, GRUPPI.length);
  for (const id of [PUNTI, HIT]) mappa?.getLayer(id) && mappa.setFilter(id, filtro);
}

function impostaFiltro(gruppo, on, origine) {
  on ? accesi.add(gruppo) : accesi.delete(gruppo);
  const c = caselle.get(gruppo);
  if (c) for (const [dove, casella] of Object.entries(c)) if (dove !== origine && casella) casella.checked = on;
  applicaFiltri();
}

const pallino = col => simboloGlifo(ICONA, col);

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-satelliti');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Satelliti nel cielo di Palermo'));
  for (const [gruppo, col] of GRUPPI) {
    const riga = voceFiltro(pallino(col), gruppo, on => impostaFiltro(gruppo, on, 'legenda'));
    caselle.set(gruppo, { ...caselle.get(gruppo), legenda: riga._filtro.casella });
    legenda.append(riga);
  }
  mondo = creaMondo(Object.fromEntries(GRUPPI));
  mondo.elemento.setAttribute('aria-label', t('satelliti.mondoAlt'));
  riquadroIss = el('div', 'legenda legenda-monumenti lg-satelliti-iss');
  riquadroIss.hidden = true;
  document.getElementById('legende').append(riquadroIss);
  riquadroMondo = el('div', 'legenda legenda-monumenti lg-satelliti-mondo');
  riquadroMondo.hidden = true;
  riquadroMondo.append(el('strong', null, 'Satelliti nel mondo'), mondo.elemento);
  document.getElementById('legende').append(riquadroMondo);
  const come = el('p', 'uffici-nota');
  come.textContent = t('satelliti.comeLeggere');
  nota = el('p', 'uffici-nota');
  legenda.append(come, nota);
  document.getElementById('legende').append(legenda);
}

function creaPannello(gruppo) {
  creaLegenda();
  const blocco = el('div', 'colonnine-filtri');
  blocco.append(el('h3', null, 'Gruppo'));
  for (const [g, col] of GRUPPI) {
    const label = el('label', 'sotto-voce');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.disabled = true; // si abilita con lo strato acceso
    cb.dataset.filtro = `gruppo:${g}`;
    cb.addEventListener('change', () => impostaFiltro(g, cb.checked, 'pannello'));
    label.append(cb, occhio(), ' ', pallino(col), ' ', tl(g));
    blocco.append(label);
    caselle.set(g, { ...caselle.get(g), pannello: cb });
  }
  gruppo.append(blocco);
}

export default {
  id: 'satelliti',
  titolo: 'Satelliti e ISS',
  gruppo: 'trasporto', // accanto al traffico aereo e marittimo
  sezione: 'Traffico spaziale',
  argomento: { titolo: 'Satelliti e ISS', descrizione: 'Il cielo di Palermo in tempo reale: la Stazione Spaziale Internazionale e i satelliti più luminosi sopra l\'orizzonte, con altezza, direzione e prossimo passaggio.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: VUOTO });
    map.addSource(SRC_CIELO, { type: 'geojson', data: costruisciCielo() });
    map.addSource(SRC_ARCO, { type: 'geojson', data: VUOTO });
  },
  aggiungiLayer(map) {
    mappa = map;
    registraGlifo(map, ICONA);
    map.addLayer({
      id: CIELO, type: 'line', source: SRC_CIELO, filter: ['==', ['geometry-type'], 'LineString'], layout: { visibility: 'none' },
      paint: { 'line-color': COLORE_CIELO, 'line-opacity': 0.55, 'line-width': ['case', ['get', 'orizzonte'], 2, 1], 'line-dasharray': [2, 3] },
    });
    map.addLayer({
      id: ETICHETTE, type: 'symbol', source: SRC_CIELO, filter: ['==', ['geometry-type'], 'Point'],
      layout: { visibility: 'none', 'text-field': ['get', 'nome'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true },
      paint: { 'text-color': COLORE_CIELO, 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
    });
    map.addLayer({
      id: ARCO, type: 'line', source: SRC_ARCO, layout: { visibility: 'none' },
      paint: { 'line-color': coloreGruppo('Stazioni spaziali'), 'line-width': 2.5, 'line-opacity': 0.8, 'line-dasharray': [1, 2] },
    });
    map.addLayer(layerGlifo({
      id: PUNTI, source: SRC, icona: ICONA,
      colore: ['match', ['get', 'gruppo'], ...GRUPPI.flatMap(([g, c]) => [g, c]), '#1971c2'],
      layout: { visibility: 'none', 'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 1.1, 14, 1.8], 'text-field': ['get', 'nome'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 1.2], 'text-optional': true },
      paint: { 'icon-halo-width': 1.2, 'text-color': '#212529', 'text-halo-color': '#fff', 'text-halo-width': 1.2 },
    }));
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 14, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      popup?.remove();
      if (!f) return;
      const p = dettagli.get(f.properties.id) ?? f.properties;
      const { anchor, offset } = ancoraPopupTraffico(e.point, map.getContainer());
      const colore = coloreGruppo(p.gruppo);
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'traffico-popup-box', anchor, offset, closeButton: false })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(contenutoPopupTraffico({
          sezione: 'Spazio', icona: ICONA, colore,
          modello: modelloPopupSatellite(p, passaggioDi(p.id)), chiudi: () => popup.remove(),
        }))
        .addTo(map);
      rifinisciPopupTraffico(popup, anchor, colore);
      centraPopupTraffico(map, popup, anchor, f.geometry.coordinates);
    });
    registraTooltipStrati(map, [{
      layers: [PUNTI], icona: ICONA, sezione: 'Spazio', colore: p => coloreGruppo(p.gruppo),
      campione: p => campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileGlifo(ICONA, coloreGruppo(p.gruppo))]),
      modello: p => modelloPopupSatellite(dettagli.get(p.id) ?? p, passaggioDi(p.id)),
    }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
    document.addEventListener('visibilitychange', () => {
      if (acceso && !document.hidden) aggiorna();
      pianifica();
    });
  },
  avvia: scarica,
  scheda: {
    layers: [HIT],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        const p = dettagli.get(f.properties.id) ?? f.properties;
        return [voceSatellite(p, passaggioDi(p.id))];
      });
    },
    // il cerchio dell'orizzonte esce dai confini del Comune: il clic su un satellite apre comunque la scheda
    apertoFuoriComune(map, e) {
      return map.getLayoutProperty(PUNTI, 'visibility') === 'visible' && map.queryRenderedFeatures(e.point, { layers: [HIT] }).length > 0;
    },
  },
  legendaPannello: '.lg-satelliti', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'satelliti', etichetta: 'Satelliti e ISS', layers: [CIELO, ETICHETTE, ARCO, PUNTI], attivo: false,
    sottovoci: [{ titolo: 'Gruppo', voci: GRUPPI.map(([g]) => ({ id: `gruppo:${g}`, etichetta: g })) }],
    suCambio(attivo) {
      acceso = attivo;
      if (legenda) legenda.hidden = !attivo;
      if (riquadroMondo) riquadroMondo.hidden = !attivo;
      if (riquadroIss) riquadroIss.hidden = !attivo;
      for (const { pannello } of caselle.values()) pannello.disabled = !attivo;
      if (attivo) aggiorna();
      else { dettagli.clear(); mappa?.getSource(SRC)?.setData(VUOTO); }
      pianifica();
    },
  }],
  pannello: creaPannello,
};

// Il passaggio dell'ISS è già calcolato; per gli altri si calcola al clic (24 ore, pochi millisecondi)
function passaggioDi(id) {
  if (id === ISS) return passaggioIss;
  const s = perId.get(id);
  return s ? prossimoPassaggio(s, new Date()) : null;
}
