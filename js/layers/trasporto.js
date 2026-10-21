import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';
import { decodificaOrari } from '../core/compatto.js';
import { voceFermata, voceLinee, tooltipFermata, tooltipLinee } from './scheda-trasporto.js';
import { orariFermata, elencoLinee, elencoFermateVicine } from './trasporto-ui.js';
import { percorsoLinea } from './trasporto-percorso.js';
import { evidenzia } from '../core/evidenza.js';
import { fermateVicine, voceTrasportoVicino } from './trasporto-vicino.js';
import { registraTooltip, disegnaVoceTooltip } from '../core/tooltip.js';
import { voceStrato } from '../core/legenda.js';
import { giornoIniziale, oggiISO, colorePerTesto, uniscimOrari } from './trasporto-orari.js';
import { t as tr, tl } from '../core/i18n.js';
import { creaStrati, stratoLinea } from './trasporto-strati.js';
import { immagineStazione, urlStazione } from './trasporto-logo.js';
import { raggioVicini } from '../core/raggio-vicini.js';
import { mezziAl, volumi, fattoreZoom, geojsonMezzi, preparaRotte } from './trasporto-simulazione.js';
import { decodificaCorse } from '../core/compatto.js';
import { MEZZI } from './trasporto-strati.js';

// Linee bus/tram e fermate AMAT (GTFS) e linee e stazioni della ferrovia urbana (GTFS Trenitalia, file ferrovia-*): stesso schema,
// stesse mappe in memoria (id con prefisso: stazioni «f…», rotte «ferrovia-…»). Strati spenti di default; i layer «hit» trasparenti sono sempre presenti
// (da zoom 13) così la scheda di destra mostra fermate e linee anche a strato spento, come per scuole e seggi.
// I colori delle linee sono quelli ufficiali del feed (route_color).
const COLORE_FERMATA = '#364fc7';
const ZOOM_MIN = 13;
const ZOOM_FERMATA = 17.5;
const IMMAGINE_STAZIONE = 'stazione-metro';
const ZOOM_PUNTI_STAZIONE = 8; // sotto ZOOM_STAZIONE le stazioni sono piccoli puntini
const ZOOM_STAZIONE = 11; // le stazioni sono poche e distanti: si vedono da più lontano delle fermate
const L = {
  bus: 'trasporto-bus', tram: 'trasporto-tram', fermate: 'trasporto-fermate', hitLinee: 'trasporto-hit-linee', hitFermate: 'trasporto-hit-fermate',
  metro: 'trasporto-metro', metroTratti: 'trasporto-metro-tratti', metroApertura: 'trasporto-metro-apertura', stazioni: 'trasporto-stazioni', stazioniPunti: 'trasporto-stazioni-punti', hitMetro: 'trasporto-hit-metro', hitStazioni: 'trasporto-hit-stazioni',
};
const STRATI_TRASPORTO = [L.bus, L.tram, L.fermate, L.metro, L.stazioni, L.stazioniPunti, ...MEZZI.map(m => m.id)];


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

// Simulazione dei mezzi dagli orari programmati (ferrovia-corse.json e corse.json, scaricati alla prima accensione di uno strato dei mezzi): un volume
// per mezzo in viaggio (parallelepipedo orientato come la marcia, nel colore della linea) e il numero della linea, aggiornati ogni secondo.
// Sono estrusioni: con la mappa piatta (2D) si vedono come rettangoli, inclinata (3D) come volumi. Da lontano si ingrandiscono (`fattoreZoom`).
const VELOCITA = [1, 10, 60];
const sim = { dati: new Map(), caricamento: new Map(), rotte: null, stazioni: null, timer: null, velocita: 1, base: Date.now(), partenza: new Date(), controllo: null };
const SORGENTE_MEZZI = 'trasporto-mezzi';
const SORGENTE_NOMI = 'trasporto-mezzi-nomi';
const casellaMezzi = m => document.getElementById(`strato-${m.id}`);
function preparaSimulazione() {
  if (sim.rotte) return;
  const features = [...linee.values()].map(l => ({ type: 'Feature', properties: l, geometry: geometrie.get(l.id) }));
  sim.rotte = preparaRotte(features);
  sim.stazioni = new Map([...fermate.values()].filter(f => f.lon != null).map(f => [f.id, [f.lon, f.lat]]));
}
function caricaCorse(file) {
  if (!sim.caricamento.has(file)) {
    sim.caricamento.set(file, fetch(urlDati(`trasporto/${file}`)).then(r => {
      if (!r.ok) throw new Error(tr('err.corseNonRaggiungibili'));
      return r.json();
    }).then(dati => { sim.dati.set(file, decodificaCorse(dati)); preparaSimulazione(); })
      .catch(err => { sim.caricamento.delete(file); throw err; })); // un errore non resta in cache: si riprova
  }
  return sim.caricamento.get(file);
}
function orologioSimulato() {
  return new Date(sim.partenza.getTime() + (Date.now() - sim.base) * sim.velocita);
}
function aggiornaMezzi() {
  if (!mappa || !sim.rotte) return;
  const ora = orologioSimulato();
  const data = oggiISO(ora);
  const minuto = ora.getHours() * 60 + ora.getMinutes() + ora.getSeconds() / 60;
  const mezzi = [];
  for (const file of new Set(MEZZI.map(m => m.file))) {
    const tipi = new Set(MEZZI.filter(m => m.file === file && casellaMezzi(m)?.checked).map(m => m.tipo));
    if (tipi.size && sim.dati.has(file)) mezzi.push(...mezziAl(sim.dati.get(file), [], sim.stazioni, data, minuto, sim.rotte, tipi));
  }
  for (const f of mezzi) f.properties.testo = colorePerTesto(f.properties.colore);
  mappa.getSource(SORGENTE_MEZZI)?.setData(geojsonMezzi(volumi(mezzi, fattoreZoom(mappa.getZoom()), sim.rotte)));
  mappa.getSource(SORGENTE_NOMI)?.setData(geojsonMezzi(mezzi));
  if (sim.controllo) sim.controllo.querySelector('output').textContent = ora.toTimeString().slice(0, 8);
}
function aggiornaSimulazione() {
  const accesi = MEZZI.filter(m => casellaMezzi(m)?.checked);
  if (!accesi.length) {
    clearInterval(sim.timer);
    sim.timer = null;
    aggiornaMezzi(); // svuota la mappa
    return;
  }
  Promise.all([...new Set(accesi.map(m => m.file))].map(caricaCorse)).then(() => {
    aggiornaMezzi();
    if (!sim.timer && MEZZI.some(m => casellaMezzi(m)?.checked)) sim.timer = setInterval(() => { if (!document.hidden) aggiornaMezzi(); }, 1000);
  }).catch(err => segnala(err.message));
}
function impostaVelocita(v) {
  sim.partenza = orologioSimulato();
  sim.base = Date.now();
  sim.velocita = v;
  for (const b of sim.controllo.querySelectorAll('button')) b.setAttribute('aria-pressed', String(Number(b.dataset.velocita) === v));
}

let mappa = null;
// Porta la mappa sulla fermata (il margine segue già la scheda aperta, quindi resta nella parte visibile), ne accende lo strato
// (resta acceso: si spegne dalla legenda o dall'interruttore «Mappa» della scheda) e apre la sua scheda come un clic sul cerchio.
// Con `numero` mostra anche il percorso di quella linea, una volta aperta la scheda.
function vaiAFermata(f, numero) {
  if (!mappa) return;
  const casella = document.getElementById(`strato-${fermate.get(f.id)?.tipo === 'ferrovia' ? L.stazioni : L.fermate}`);
  if (casella && !casella.checked && !casella.disabled) {
    casella.checked = true;
    casella.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const map = mappa;
  let fatto = false;
  const apri = () => {
    if (fatto) return;
    fatto = true;
    const prima = riferimento;
    map.fire('click', { point: map.project([f.lon, f.lat]), lngLat: { lng: f.lon, lat: f.lat } });
    if (numero == null) return;
    // il clic è asincrono: il riferimento cambia quando la scheda è pronta (con una scadenza di 2 s)
    const fine = Date.now() + 2000;
    const attendi = () => {
      if (riferimento !== prima) mostraLinea(rottaPerNumero.get(numero));
      else if (Date.now() < fine) requestAnimationFrame(attendi);
    };
    attendi();
  };
  // a movimento finito, appena lo strato è disegnato (con una scadenza: se la mappa è già ferma «idle» potrebbe non arrivare)
  map.once('moveend', () => { map.once('idle', apri); setTimeout(apri, 400); });
  map.easeTo({ center: [f.lon, f.lat], zoom: Math.max(map.getZoom(), ZOOM_FERMATA), duration: 600 });
}

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
  vaiAFermata: (id, numero) => { const f = fermate.get(id); if (f) vaiAFermata(f, numero); },
  // le altre linee che passano per la fermata (cambi), con il loro colore; quelle fuori dal feed si saltano
  cambi: (id, numero) => (fermate.get(id)?.linee ?? []).filter(n => n !== numero && rottaPerNumero.has(n))
    .map(n => ({ numero: n, colore: ctx.info(rottaPerNumero.get(n), 0).colore }))
    .sort((a, b) => a.numero.localeCompare(b.numero, 'it', { numeric: true })),
};

// Una stazione non ancora aperta non ha orari: la scheda lo dice al posto delle partenze.
const notaStato = p => () => el('p', 'scheda-nota', tr(p.stato === 'non utilizzata' ? 'trasporto.nonUtilizzataNota' : 'trasporto.inAperturaNota'));

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Legenda in #legende (sulla mappa): compare se almeno uno strato è acceso. Ogni voce è la casella del suo strato:
// accende e spegne bus, tram o fermate (a filtro Linea attivo, il filtro resta quello scelto nel pannello).
let legenda = null;
function logoStazione() {
  const img = el('img', 'trasporto-logo-metro');
  img.src = urlStazione(48);
  img.alt = '';
  return img;
}
function creaLegenda() {
  legenda = el('div', 'legenda legenda-trasporto lg-trasporto');
  legenda.hidden = true;
  const tratto = (classe, colore = '#7B263E') => { const i = el('i', `trasporto-tratto ${classe}`); i.style.background = colore; return i; };
  const voce = (simbolo, testo, id) => { const r = voceStrato(simbolo, testo, id); r.dataset.legendaStrato = id; return r; }; // sotto il suo strato nel pannello
  legenda.append(
    el('strong', null, 'Trasporto pubblico'),
    voce(tratto(''), 'Linea bus (colore AMAT)', L.bus),
    voce(tratto('trasporto-tratto--tram'), 'Linea tram', L.tram),
    voce(el('i', 'trasporto-pallino'), 'Fermata (da zoom 13)', L.fermate),
    voce(el('i', 'trasporto-tratto trasporto-tratto--binario'), 'Linea metro (RFI)', L.metro),
    voce(logoStazione(), 'Stazione (RFI, più chiara se in apertura, trasparente se non utilizzata)', L.stazioni),
    ...MEZZI.map(m => voce(el('i', 'trasporto-pallino'), m.legenda, m.id)),
  );
  sim.controllo = el('div', 'trasporto-simulazione');
  sim.controllo.append(el('span', null, 'Simulazione'), document.createElement('output'));
  for (const v of VELOCITA) {
    const b = el('button', null, `×${v}`);
    b.type = 'button';
    b.dataset.velocita = v;
    b.setAttribute('aria-pressed', String(v === sim.velocita));
    b.addEventListener('click', () => impostaVelocita(v));
    sim.controllo.append(b);
  }
  legenda.append(sim.controllo);
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
    const html = el('div', 'trasporto-tooltip-corpo strati-tooltip-corpo');
    if (fermata) {
      const t = tooltipFermata(fermate.get(fermata.properties.id) ?? { ...fermata.properties, linee: [] });
      html.append(disegnaVoceTooltip({ titolo: t.titolo, icona: t.icona, sottotitolo: t.dettaglio }));
    } else {
      const t = tooltipLinee(sotto);
      html.append(disegnaVoceTooltip({ titolo: t.titolo, icona: t.icona }));
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
    map.addSource('ferrovia-apertura', { type: 'geojson', data: urlDati('trasporto/ferrovia-apertura.geojson') });
    map.addSource('ferrovia-fermate', { type: 'geojson', data: urlDati('trasporto/ferrovia-fermate.geojson') });
    map.addSource(SORGENTE_MEZZI, { type: 'geojson', data: geojsonMezzi([]) });
    map.addSource(SORGENTE_NOMI, { type: 'geojson', data: geojsonMezzi([]) });
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
    // la linea ha l'aspetto del binario sulle carte: tracciato nero con trattini bianchi (le traverse)
    map.addLayer({
      id: L.metro, type: 'line', source: 'ferrovia-linee', layout: { ...nascosto, 'line-cap': 'butt', 'line-join': 'round' },
      paint: { 'line-color': '#1a1a1a', 'line-width': spessore(2.5, 6) },
    });
    map.addLayer({
      id: L.metroTratti, type: 'line', source: 'ferrovia-linee', layout: { ...nascosto, 'line-cap': 'butt', 'line-join': 'round' },
      paint: { 'line-color': '#fff', 'line-width': spessore(1.2, 3.4), 'line-dasharray': [2, 2] },
    });
    // tratto non ancora aperto (Anello: Porto e Politeama): tratteggio grigio sotto la linea in esercizio
    map.addLayer({
      id: L.metroApertura, type: 'line', source: 'ferrovia-apertura', layout: { ...nascosto, 'line-cap': 'butt', 'line-join': 'round' },
      paint: { 'line-color': '#6b6b6b', 'line-width': spessore(2.5, 6), 'line-dasharray': [2, 1.5], 'line-opacity': 0.8 },
    }, L.metro);
    // stazioni: il logo delle metropolitane (quadrato rosso con la M) e, avvicinandosi, il nome
    if (!map.hasImage(IMMAGINE_STAZIONE)) map.addImage(IMMAGINE_STAZIONE, immagineStazione(64), { pixelRatio: 2 });
    map.addLayer({
      id: L.stazioni, type: 'symbol', source: 'ferrovia-fermate', minzoom: ZOOM_STAZIONE,
      layout: {
        ...nascosto, 'icon-image': IMMAGINE_STAZIONE, 'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 14, 0.7, 17, 0.9],
        'icon-allow-overlap': true, 'icon-ignore-placement': true, 'symbol-sort-key': ['case', ['has', 'stato'], 0, 1],
        'text-field': ['step', ['zoom'], '', 13.5, ['get', 'nome']], 'text-font': ['Noto Sans Bold'], 'text-size': 11,
        'text-anchor': 'left', 'text-offset': [1.1, 0], 'text-optional': true,
      },
      paint: { 'icon-opacity': ['case', ['==', ['get', 'stato'], 'non utilizzata'], 0.2, ['has', 'stato'], 0.55, 1], 'text-opacity': ['case', ['==', ['get', 'stato'], 'non utilizzata'], 0.35, ['has', 'stato'], 0.7, 1], 'text-color': '#7f1d18', 'text-halo-color': '#fff', 'text-halo-width': 1.6 },
    });
    map.addLayer({
      id: L.stazioniPunti, type: 'circle', source: 'ferrovia-fermate', minzoom: ZOOM_PUNTI_STAZIONE, maxzoom: ZOOM_STAZIONE, layout: nascosto,
      paint: {
        'circle-color': '#c0261d', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 10.99, 3.5],
        'circle-opacity': ['case', ['==', ['get', 'stato'], 'non utilizzata'], 0.3, ['has', 'stato'], 0.6, 1],
      },
    });
    map.addLayer({ id: L.hitMetro, type: 'line', source: 'ferrovia-linee', minzoom: ZOOM_STAZIONE, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitStazioni, type: 'circle', source: 'ferrovia-fermate', minzoom: ZOOM_PUNTI_STAZIONE, paint: { 'circle-radius': 12, 'circle-opacity': 0 } });
    // mezzi in viaggio: in cima agli altri strati. Volume nel colore della linea; il numero sta sopra (allineato allo schermo: si legge anche inclinando)
    for (const m of MEZZI) {
      const filtro = ['==', ['get', 'tipo'], m.tipo];
      map.addLayer({
        id: m.id, type: 'fill-extrusion', source: SORGENTE_MEZZI, filter: filtro, layout: nascosto,
        paint: { 'fill-extrusion-color': ['get', 'colore'], 'fill-extrusion-height': ['get', 'altezza'], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.95 },
      });
      map.addLayer({
        id: `${m.id}-nome`, type: 'symbol', source: SORGENTE_NOMI, filter: filtro, minzoom: 12.5,
        layout: {
          ...nascosto, 'text-field': ['get', 'numero'], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-offset': [0, -1.1], 'text-allow-overlap': true,
          'text-ignore-placement': true, 'text-pitch-alignment': 'viewport', 'text-rotation-alignment': 'viewport', 'symbol-sort-key': ['get', 'bearing'],
        },
        paint: { 'text-color': ['get', 'testo'], 'text-halo-color': ['get', 'colore'], 'text-halo-width': 2.5 },
      });
    }
    map.on('zoomend', () => { if (sim.timer) aggiornaMezzi(); });
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
  sezioniFisse: true, // AMAT e RFI restano due sezioni: il riordino degli strati non attraversa le intestazioni
  legendaPerStrato: true, // ogni voce della legenda sta sotto il proprio strato (core/legenda-pannello.js)
  strati: creaStrati(() => { aggiornaLegenda(); aggiornaSimulazione(); }),
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
      const dellaFermata = []; // linee delle fermate cliccate: servono se il clic non ha colpito un tracciato
      for (const f of trovati) {
        const id = f.properties.id;
        if (visti.has(id)) continue; // i tile spezzano i tracciati in più frammenti
        visti.add(id);
        if (f.layer.id === L.hitFermate || f.layer.id === L.hitStazioni) {
          const p = fermate.get(id) ?? { ...f.properties, linee: [] };
          voci.push(voceFermata(p, p.stato ? notaStato(p) : orariFermata(id, ctx)));
          dellaFermata.push(...p.linee);
        } else if (linee.has(id)) sotto.push(linee.get(id));
      }
      // tutte le linee del clic in una sola voce: su una strada principale sono decine
      if (sotto.length) {
        const voce = voceLinee(sotto, gruppi => elencoLinee(gruppi, ctx));
        // le linee sotto il clic si vedono intere, con le fermate (al massimo 6: su una strada principale sono decine)
        voce.evidenza = [...new Set(sotto.map(l => l.route_id))].slice(0, 6).map(percorso).filter(Boolean);
        voci.push(voce);
      }
      // un clic sulla fermata e non sul tracciato: le sue linee si aprono comunque, con lo schema delle fermate (senza evidenziarle sulla mappa)
      if (!sotto.length && dellaFermata.length) {
        const numeri = new Set(dellaFermata);
        const sue = [...linee.values()].filter(l => numeri.has(l.numero)).sort((a, b) => a.numero.localeCompare(b.numero, 'it', { numeric: true }));
        if (sue.length) voci.push({ ...voceLinee(sue, gruppi => elencoLinee(gruppi, ctx)), chiave: 'linee-fermata' });
      }
      // in ogni punto della mappa: le linee con una fermata nei dintorni, anche senza aver colpito fermate o tracciati
      riferimento = lngLat ? { lngLat, evidenza: [], base: [] } : null;
      if (lngLat && fermate.size) {
        const raggio = raggioVicini(); // m, in linea d'aria: lo stesso di tutti i layer, regolabile dalla legenda
        const vicine = fermateVicine([lngLat.lng, lngLat.lat], fermate.values(), n => perNumero.get(n), raggio);
        const vicino = voceTrasportoVicino(vicine, raggio, mostrate => elencoFermateVicine(mostrate, vaiAFermata));
        if (vicino) { voci.push(vicino); riferimento.evidenza = vicino.evidenza; }
      }
      return voci;
    },
  },
};
