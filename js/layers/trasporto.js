import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';
import { decodificaOrari } from '../core/compatto.js';
import { voceFermata, voceLinee, tooltipFermata, tooltipLinee } from './scheda-trasporto.js';
import { orariFermata, elencoLinee, elencoFermateVicine } from './trasporto-ui.js';
import { percorsoLinea } from './trasporto-percorso.js';
import { evidenzia } from '../core/evidenza.js';
import { fermateVicine, voceTrasportoVicino } from './trasporto-vicino.js';
import { registraTooltip } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { giornoIniziale, oggiISO, colorePerTesto, uniscimOrari } from './trasporto-orari.js';
import { t as tr, tl } from '../core/i18n.js';
import { creaStrati } from './trasporto-strati.js';

// Linee bus/tram e fermate AMAT (GTFS) e linee e stazioni della ferrovia urbana (GTFS Trenitalia, file ferrovia-*): stesso schema,
// stesse mappe in memoria (id con prefisso: stazioni «f…», rotte «ferrovia-…»). Strati spenti di default; i layer «hit» trasparenti sono sempre presenti
// (da zoom 13) così la scheda di destra mostra fermate e linee anche a strato spento, come per scuole e seggi.
// I colori delle linee sono quelli ufficiali del feed (route_color).
const COLORE_FERMATA = '#364fc7';
const ZOOM_MIN = 13;
const ZOOM_FERMATA = 17.5;
const RAGGIO_VICINO = 300; // m, in linea d'aria
const COLORE_STAZIONE = '#B7282E'; // come il colore predefinito dei servizi in scripts/gtfs_trenitalia.py
const ZOOM_STAZIONE = 11; // le stazioni sono poche e distanti: si vedono da più lontano delle fermate
const L = {
  bus: 'trasporto-bus', tram: 'trasporto-tram', fermate: 'trasporto-fermate', hitLinee: 'trasporto-hit-linee', hitFermate: 'trasporto-hit-fermate',
  metro: 'trasporto-metro', stazioni: 'trasporto-stazioni', hitMetro: 'trasporto-hit-metro', hitStazioni: 'trasporto-hit-stazioni',
};
const STRATI_TRASPORTO = [L.bus, L.tram, L.fermate, L.metro, L.stazioni];
// strato delle linee di un tipo (bus, tram, ferrovia)
const stratoLinea = tipo => (tipo === 'tram' ? L.tram : tipo === 'ferrovia' ? L.metro : L.bus);

const fermate = new Map(); // id -> proprietà complete (le feature di MapLibre trasformano gli array in testo)
const linee = new Map();
const rottaPerNumero = new Map(); // numero di linea -> route_id
const perNumero = new Map(); // numero di linea -> { tipo, colore }, per le linee vicine a un punto
const geometrie = new Map(); // id linea -> geometria del tracciato
const limitiRotta = new Map(); // route_id -> [[o, s], [e, n]] per l'inquadratura del filtro Linea

// orari.json (compatto, ≈ 150 KB compresso) si scarica alla prima scheda aperta e poi resta in memoria
let promessaOrari = null;
function caricaOrari() {
  promessaOrari ??= Promise.all([
    fetch(urlDati('trasporto/orari.json')).then(r => {
      if (!r.ok) throw new Error(tr('err.orariNonRaggiungibili'));
      return r.json();
    }).then(decodificaOrari),
    // gli orari ferroviari sono facoltativi: se mancano restano quelli di AMAT
    fetch(urlDati('trasporto/ferrovia-orari.json')).then(r => (r.ok ? r.json() : null)).then(o => (o ? decodificaOrari(o) : null)).catch(() => null),
  ]).then(([amat, ferrovia]) => uniscimOrari(amat, ferrovia))
    .catch(err => { promessaOrari = null; throw err; }); // un errore non resta in cache: si riprova
  return promessaOrari;
}

let mappa = null;
// porta la mappa sulla fermata: il margine segue già la scheda aperta, quindi la fermata resta nella parte visibile
const vaiAFermata = f => mappa?.easeTo({ center: [f.lon, f.lat], zoom: Math.max(mappa.getZoom(), ZOOM_FERMATA), duration: 600 });

const percorso = routeId => percorsoLinea(routeId, linee, geometrie, fermate);
// il punto cliccato e le fermate vicine restano sulla mappa quando si mostra una linea: è il punto di riferimento
let riferimento = null; // { lngLat, evidenza, base } dell'ultimo clic: base = evidenza del luogo cliccato (edificio, particella…)
const COLORE_PUNTO = '#d9480f';
const puntoCliccato = ({ lng, lat }) => ({ id: 'trasporto-punto-cliccato', etichetta: 'Punto cliccato', colore: COLORE_PUNTO, features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }] });

// un clic su una linea la mostra intera, con le sue fermate, e inquadra il percorso insieme al punto cliccato
function mostraLinea(routeId) {
  const p = percorso(routeId);
  if (!p || !mappa) return;
  evidenzia(mappa, [...(riferimento?.base ?? []), p, ...(riferimento ? [...riferimento.evidenza, puntoCliccato(riferimento.lngLat)] : [])]);
  const limiti = limitiRotta.get(routeId);
  if (!limiti) return;
  const { lng, lat } = riferimento?.lngLat ?? {};
  const [[o, s], [e, n]] = limiti;
  const comprende = lng == null ? limiti : [[Math.min(o, lng), Math.min(s, lat)], [Math.max(e, lng), Math.max(n, lat)]];
  mappa.fitBounds(comprende, { padding: 40, duration: 600 });
}

const ctx = {
  mostraLinea,
  orari: caricaOrari,
  info: (route, dir) => linee.get(`linea-${route}-${dir}`) ?? { numero: route, colore: '#555555', a: '' },
  nomeFermata: id => fermate.get(id)?.nome ?? id,
};

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Legenda in #legende (sulla mappa): compare se almeno uno strato è acceso. Ogni voce è la casella del suo strato:
// accende e spegne bus, tram o fermate (a filtro Linea attivo, il filtro resta quello scelto nel pannello).
let legenda = null;
function creaLegenda() {
  legenda = el('div', 'legenda legenda-trasporto');
  legenda.hidden = true;
  const tratto = (classe, colore = '#7B263E') => { const i = el('i', `trasporto-tratto ${classe}`); i.style.background = colore; return i; };
  legenda.append(
    el('strong', null, 'Trasporto pubblico'),
    voceStrato(tratto(''), 'Linea bus (colore AMAT)', L.bus),
    voceStrato(tratto('trasporto-tratto--tram'), 'Linea tram', L.tram),
    voceStrato(el('i', 'trasporto-pallino'), 'Fermata (da zoom 13)', L.fermate),
    voceStrato(tratto('trasporto-tratto--tram', COLORE_STAZIONE), 'Linea metro (RFI)', L.metro),
    voceStrato(el('i', 'trasporto-pallino trasporto-pallino--stazione'), 'Stazione (RFI)', L.stazioni),
  );
  document.getElementById('legende').append(legenda);
}
function aggiornaLegenda() {
  if (legenda) legenda.hidden = !STRATI_TRASPORTO.some(id => document.getElementById(`strato-${id}`)?.checked);
}

// Tooltip al passaggio del mouse, solo sugli strati accesi (a strato spento sulla mappa non c'è nulla da indicare):
// sezione del tooltip condiviso.
function collegaTooltip(map) {
  const acceso = id => map.getLayoutProperty(id, 'visibility') === 'visible';
  registraTooltip(map, e => {
    if (!STRATI_TRASPORTO.some(acceso)) return null; // nessuno strato acceso: niente da cercare sotto il cursore
    const riquadro = [[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]];
    const fermata = ['fermate', 'stazioni'].flatMap(k => (acceso(L[k]) ? map.queryRenderedFeatures(riquadro, { layers: [k === 'fermate' ? L.hitFermate : L.hitStazioni] }) : []))[0];
    const sotto = fermata ? [] : map.queryRenderedFeatures(riquadro, { layers: [L.hitLinee, L.hitMetro] })
      .map(f => linee.get(f.properties.id)).filter(l => l && acceso(stratoLinea(l.tipo)));
    if (!fermata && !sotto.length) return null;
    const html = el('div', 'trasporto-tooltip-corpo');
    if (fermata) {
      const t = tooltipFermata(fermate.get(fermata.properties.id) ?? { ...fermata.properties, linee: [] });
      html.append(el('strong', null, t.titolo), el('div', null, t.dettaglio));
    } else {
      const t = tooltipLinee(sotto);
      for (const l of t.linee) {
        const riga = el('div', 'trasporto-tooltip-linea');
        const chip = el('span', 'trasporto-chip', l.numero);
        chip.style.background = l.colore;
        chip.style.color = colorePerTesto(l.colore);
        riga.append(chip, ` ${l.nome}`);
        html.append(riga);
      }
      if (t.altre) html.append(el('div', 'trasporto-tooltip-altre', `+ altre ${t.altre} linee`));
    }
    return { contenuto: html, cursore: true };
  }, 0);
}

// Mette fermate (o stazioni) e linee di un feed nelle mappe in memoria, con i limiti di ogni rotta per l'inquadratura.
function registra(f, l) {
  for (const x of f.features) fermate.set(x.properties.id, x.properties);
  for (const x of l.features) {
    linee.set(x.properties.id, x.properties);
    rottaPerNumero.set(x.properties.numero, x.properties.route_id);
    geometrie.set(x.properties.id, x.geometry);
    perNumero.set(x.properties.numero, { tipo: x.properties.tipo, colore: x.properties.colore });
    const [o, s, e, n] = x.geometry.coordinates.reduce(([o, s, e, n], [lon, lat]) => [Math.min(o, lon), Math.min(s, lat), Math.max(e, lon), Math.max(n, lat)], [Infinity, Infinity, -Infinity, -Infinity]);
    const prima = limitiRotta.get(x.properties.route_id);
    limitiRotta.set(x.properties.route_id, prima ? [[Math.min(prima[0][0], o), Math.min(prima[0][1], s)], [Math.max(prima[1][0], e), Math.max(prima[1][1], n)]] : [[o, s], [e, n]]);
  }
}

export default {
  id: 'trasporto',
  titolo: 'Trasporto pubblico',
  argomento: { titolo: 'Trasporto pubblico', descrizione: 'Linee bus e tram e fermate AMAT, linee e stazioni della metro (RFI), con gli orari dai feed GTFS.' },
  aggiungiSorgenti(map) {
    map.addSource('trasporto-linee', { type: 'geojson', data: urlDati('trasporto/linee.geojson') });
    map.addSource('trasporto-fermate', { type: 'geojson', data: urlDati('trasporto/fermate.geojson') });
    map.addSource('ferrovia-linee', { type: 'geojson', data: urlDati('trasporto/ferrovia-linee.geojson') });
    map.addSource('ferrovia-fermate', { type: 'geojson', data: urlDati('trasporto/ferrovia-fermate.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    const spessore = (z1, z2) => ['interpolate', ['linear'], ['zoom'], 11, z1, 17, z2];
    const lineaDi = (id, tipo, min, max) => map.addLayer({
      id, type: 'line', source: 'trasporto-linee', filter: ['==', ['get', 'tipo'], tipo], layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'colore'], 'line-width': spessore(min, max), 'line-opacity': 0.9 },
    });
    lineaDi(L.bus, 'bus', 1.5, 4);
    lineaDi(L.tram, 'tram', 3, 7);
    map.addLayer({
      id: L.fermate, type: 'circle', source: 'trasporto-fermate', minzoom: ZOOM_MIN, layout: nascosto,
      paint: { 'circle-color': '#fff', 'circle-stroke-color': COLORE_FERMATA, 'circle-stroke-width': 2, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 17, 6] },
    });
    // strati trasparenti sempre presenti: la scheda mostra i dati anche a strato spento
    map.addLayer({ id: L.hitLinee, type: 'line', source: 'trasporto-linee', minzoom: ZOOM_MIN, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitFermate, type: 'circle', source: 'trasporto-fermate', minzoom: ZOOM_MIN, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    // ferrovia urbana: sopra bus e tram
    map.addLayer({
      id: L.metro, type: 'line', source: 'ferrovia-linee', layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'colore'], 'line-width': spessore(3, 7), 'line-opacity': 0.9 },
    });
    map.addLayer({
      id: L.stazioni, type: 'circle', source: 'ferrovia-fermate', minzoom: ZOOM_STAZIONE, layout: nascosto,
      paint: { 'circle-color': '#fff', 'circle-stroke-color': COLORE_STAZIONE, 'circle-stroke-width': 2.5, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 8] },
    });
    map.addLayer({ id: L.hitMetro, type: 'line', source: 'ferrovia-linee', minzoom: ZOOM_STAZIONE, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitStazioni, type: 'circle', source: 'ferrovia-fermate', minzoom: ZOOM_STAZIONE, paint: { 'circle-radius': 12, 'circle-opacity': 0 } });
    collegaTooltip(map);
  },
  async avvia() {
    const leggi = prefisso => Promise.all(['fermate', 'linee'].map(async n => {
      const file = `trasporto/${prefisso}${n}.geojson`;
      const r = await fetch(urlDati(file)); // già in cache: è il file della sorgente
      if (!r.ok) throw new Error(`${file} non raggiungibile`);
      return r.json();
    }));
    // la ferrovia è facoltativa: se i suoi file mancano restano bus, tram e fermate di AMAT
    const [[f, l], ferrovia] = await Promise.all([leggi(''), leggi('ferrovia-').catch(() => null)]);
    registra(f, l);
    if (ferrovia) registra(...ferrovia);
    if (giornoIniziale({ validita: f.validita }, oggiISO()).fuori) {
      segnala(tr('trasporto.orariFuori', { da: f.validita.da, a: f.validita.a }));
    }
    if (ferrovia && giornoIniziale({ validita: ferrovia[0].validita }, oggiISO()).fuori) {
      segnala(tr('trasporto.orariFuoriRfi', { da: ferrovia[0].validita.da, a: ferrovia[0].validita.a }));
    }
  },
  strati: creaStrati(aggiornaLegenda),
  pannello: creaLegenda,
  // per il filtro Linea del pannello Filtri (valido dopo `avvia`)
  filtro: () => ({ linee: [...linee.values()], limiti: id => limitiRotta.get(id) }),
  scheda: {
    layers: [L.hitFermate, L.hitStazioni, L.hitLinee, L.hitMetro],
    suEvidenza(base) { if (riferimento) riferimento.base = base; },
    voci(trovati, lngLat) {
      const visti = new Set();
      const voci = [];
      const sotto = [];
      for (const f of trovati) {
        const id = f.properties.id;
        if (visti.has(id)) continue; // i tile spezzano i tracciati in più frammenti
        visti.add(id);
        if (f.layer.id === L.hitFermate || f.layer.id === L.hitStazioni) {
          const p = fermate.get(id) ?? { ...f.properties, linee: [] };
          voci.push(voceFermata(p, orariFermata(id, ctx)));
        } else if (linee.has(id)) sotto.push(linee.get(id));
      }
      // tutte le linee del clic in una sola voce: su una strada principale sono decine
      if (sotto.length) {
        const voce = voceLinee(sotto, gruppi => elencoLinee(gruppi, ctx));
        // le linee sotto il clic si vedono intere, con le fermate (al massimo 6: su una strada principale sono decine)
        voce.evidenza = [...new Set(sotto.map(l => l.route_id))].slice(0, 6).map(percorso).filter(Boolean);
        voci.push(voce);
      }
      // in ogni punto della mappa: le linee con una fermata nei dintorni, anche senza aver colpito fermate o tracciati
      riferimento = lngLat ? { lngLat, evidenza: [], base: [] } : null;
      if (lngLat && fermate.size) {
        const vicine = fermateVicine([lngLat.lng, lngLat.lat], fermate.values(), n => perNumero.get(n), RAGGIO_VICINO);
        const vicino = voceTrasportoVicino(vicine, RAGGIO_VICINO, mostrate => elencoFermateVicine(mostrate, vaiAFermata, numero => mostraLinea(rottaPerNumero.get(numero))));
        if (vicino) { voci.push(vicino); riferimento.evidenza = vicino.evidenza; }
      }
      return voci;
    },
  },
};
