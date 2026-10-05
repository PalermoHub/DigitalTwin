import { svgIcona } from '../core/icone.js';

// Basi cartografiche alternative: Positron (stile di partenza), basi raster classiche (OSM, Esri, Google,
// OpenTopoMap), carte tecniche comunali e regionali e sfondi neutri. Una sola è visibile alla volta.

// Basi raster (tile XYZ): una sorgente e un layer 'base-<id>' per ciascuna, generati da questa tabella.
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
const RASTER = {
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', max: 19, attr: '© OpenStreetMap contributors' },
  'osm-fr': { url: 'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', max: 20, attr: '© OpenStreetMap contributors, tiles OSM France' },
  'esri-scura': { url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, max: 16, attr: '© Esri' },
  'osm-hot': { url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', max: 19, attr: '© OpenStreetMap contributors, Humanitarian OpenStreetMap Team' },
  'esri-strade': { url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`, max: 19, attr: '© Esri' },
  grigio: { url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, max: 16, attr: '© Esri' },
  'google-strade': { url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', max: 20, attr: '© Google' },
  satellite: { url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', max: 20, attr: '© Google' },
  'esri-satellite': { url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, max: 19, attr: '© Esri, Maxar, Earthstar Geographics' },
  ibrido: { url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', max: 20, attr: '© Google' },
  'google-terreno': { url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', max: 20, attr: '© Google' },
  opentopo: { url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', max: 17, attr: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)' },
  'esri-topo': { url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`, max: 19, attr: '© Esri' },
  'ctr-1989': { url: 'https://palermohub.github.io/PRG2004/CSG/{z}/{x}/{y}.png', max: 18, min: 13, attr: '© Carta Tecnica Comunale CSG 2k 1989/91' },
  ctr: { url: 'https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png', max: 19, min: 12, attr: '© Carta Tecnica Comunale 2k 2007/09' },
  'ctr-2012': { url: 'https://siciliahub.github.io/Tiles/ctr_pa_10k/{z}/{x}/{y}.png', max: 18, min: 13, attr: '© Carta Tecnica Regionale 10k 2012/13' },
};
// Mappe storiche dell'Atlante delle carte tecniche storiche di Palermo (OpenDataSicilia): tile georeferenziate su Map Warper.
// `precisione` è il giudizio editoriale dell'atlante: alta (rilievo aerofotogrammetrico), media (pre-aerofotogrammetria), bassa (incisioni).
const ATLANTE = 'https://palermohub.opendatasicilia.it/index_atlante_iframe.html';
const STORICHE = [
  { id: 1580, mw: 60119, max: 17, precisione: 'bassa', etichetta: '1580', titolo: 'Città di Palermo 1580 | Fonte: gallica.bnf.fr / BnF', attr: 'Palermo 1580, Maiocco e Bonifacio (BnF Gallica)' },
  { id: 1754, mw: 60176, max: 17, precisione: 'bassa', etichetta: '1754', titolo: 'Città di Palermo 1754 | Fonte: Library of Congress Geography and Map Division Washington', attr: 'Palermo 1754-59, G. Vasi (Library of Congress)' },
  { id: 1860, mw: 60203, max: 17, precisione: 'bassa', etichetta: '1860', titolo: 'Pianta topografica | Palermo 1860 circa | Fonte: Harvard Map Collection, Harvard University', attr: 'Palermo 1860 circa (Harvard Map Collection)' },
  { id: 1877, mw: 60399, max: 17, precisione: 'media', etichetta: '1877', titolo: 'Costa nord, Baia di Palermo 1877 | 1:36,417 | Fonte: Wisconsin-Milwaukee University', attr: 'Baia di Palermo 1877 (Univ. Wisconsin-Milwaukee)' },
  { id: 1882, mw: 33126, max: 17, precisione: 'media', etichetta: '1882', titolo: 'Città di Palermo 1882 | 1:1k Fonte: gallica.bnf.fr / BnF', attr: 'Nuova pianta di Palermo 1882, L. Pedone Laurieri (BnF Gallica)' },
  { id: 1891, mw: 60209, max: 17, precisione: 'media', etichetta: '1891', titolo: 'Nuova pianta della Città di Palermo 1891 1:10k | Fonte: Harvard Map Collection, Harvard University', attr: 'Nuova pianta di Palermo 1891, C. Clausen (Harvard Map Collection)' },
  { id: 1893, mw: 19658, max: 16, precisione: 'media', etichetta: '1893', titolo: 'Carta tecnica 1893 | 1:13k (max zoom 16)', attr: 'Carta tecnica di Palermo 1893' },
  { id: 1908, mw: 25750, max: 18, precisione: 'media', etichetta: '1908', titolo: 'Carta tecnica Municipale 1908 | 1:8k', attr: 'Carta tecnica di Palermo, Ufficio Tecnico Comunale 1908' },
  { id: 1935, mw: 19706, max: 18, precisione: 'alta', etichetta: '1935', titolo: 'Carta tecnica Omira 1935 | 1:5k', attr: 'Carta tecnica di Palermo, OMIRA 1935' },
  { id: 1941, mw: 45321, max: 17, precisione: 'media', etichetta: '1941', titolo: 'U.S. Army Map Service, 1941 Series 4229 | Palermo 1:50k', attr: 'U.S. Army Map Service 1941, Series 4229' },
  { id: 1943, mw: 45304, max: 17, precisione: 'media', etichetta: '1943', titolo: 'U.S. Army Map Service, 1943-1944 | City Plans Palermo 1:10k', attr: 'U.S. Army Map Service 1943-1944, City Plans' },
  { id: 1956, mw: 19792, max: 18, precisione: 'alta', etichetta: '1956', titolo: 'Carta tecnica Irta 1956 | 1:5k', attr: 'Carta tecnica di Palermo, IRTA 1956' },
  { id: 1962, mw: 52666, max: 18, precisione: 'alta', etichetta: '1962', titolo: 'Piano Regolatore Generale 1962 | 1:5k', attr: 'Comune di Palermo, PRG 1962' },
  { id: 1987, mw: 19785, max: 18, precisione: 'alta', etichetta: '1987', titolo: 'Carta tecnica Sas 1987 | 1:5k', attr: 'Carta tecnica di Palermo, SAS 1987' },
  { id: 1993, mw: 52867, max: 18, precisione: 'alta', etichetta: '1993', titolo: 'P.P.E. del centro storico 1993 | 1:500', attr: 'Comune di Palermo, PPE del centro storico 1993' },
];
for (const s of STORICHE) {
  RASTER[`st-${s.id}`] = {
    url: `https://mapwarper.net/maps/tile/${s.mw}/{z}/{x}/{y}.png`, max: s.max, min: 13,
    attr: `${s.attr} · Atlante storico OpenDataSicilia, georeferenziazione su Map Warper`,
  };
}
// Basi vettoriali OpenFreeMap: stessi sprite, font e sorgenti dello stile di partenza, quindi se ne aggiungono solo i layer.
const VETTORIALI = {
  'ofm-dark': 'https://tiles.openfreemap.org/styles/dark',
  'ofm-bright': 'https://tiles.openfreemap.org/styles/bright',
};
// Raggruppate come nel selettore dell'atlante: mappe stradali, immagini aeree, topografiche, cartografia tecnica, sfondi neutri.
const GRUPPI = [
  { titolo: 'Mappe stradali', basi: [
    { id: 'positron', etichetta: 'Mappa chiara', titolo: 'Mappa chiara (OpenFreeMap)' },
    { id: 'ofm-dark', etichetta: 'Scura', titolo: 'Mappa scura (OpenFreeMap)' },
    { id: 'ofm-bright', etichetta: 'Luminosa', titolo: 'Mappa luminosa (OpenFreeMap Bright)' },
    { id: 'osm', etichetta: 'OpenStreetMap', titolo: 'OpenStreetMap standard' },
    { id: 'osm-fr', etichetta: 'OSM Francia', titolo: 'OpenStreetMap Francia' },
    { id: 'osm-hot', etichetta: 'OSM Umanitaria', titolo: 'OpenStreetMap Humanitarian' },
    { id: 'esri-strade', etichetta: 'Esri Strade', titolo: 'Esri World Street Map' },
    { id: 'google-strade', etichetta: 'Google', titolo: 'Google Mappe (strade)' },
    { id: 'esri-scura', etichetta: 'Esri Scura', titolo: 'Esri Dark Gray Canvas' },
  ] },
  { titolo: 'Immagini aeree', basi: [
    { id: 'satellite', etichetta: 'Satellite', titolo: 'Google Satellite' },
    { id: 'esri-satellite', etichetta: 'Esri', titolo: 'Esri World Imagery' },
    { id: 'ibrido', etichetta: 'Ibrido', titolo: 'Google Satellite con strade e nomi' },
  ] },
  { titolo: 'Topografiche', basi: [
    { id: 'google-terreno', etichetta: 'Terreno', titolo: 'Google Terreno (rilievo)' },
    { id: 'opentopo', etichetta: 'OpenTopo', titolo: 'OpenTopoMap (curve di livello)' },
    { id: 'esri-topo', etichetta: 'Esri Topo', titolo: 'Esri World Topographic Map' },
  ] },
  { titolo: 'Mappe storiche', nota: true, basi: STORICHE.map(s => ({
    id: `st-${s.id}`, etichetta: s.etichetta, titolo: `${s.titolo} (precisione della sovrapposizione: ${s.precisione})`, precisione: s.precisione,
  })) },
  { titolo: 'Cartografia tecnica', basi: [
    { id: 'ctr-1989', etichetta: 'CSG 1989', titolo: 'Carta Tecnica Comunale CSG 2k (1989/91)' },
    { id: 'ctr', etichetta: 'CTC 2k', titolo: 'Carta Tecnica Comunale 2k (2007/09)' },
    { id: 'ctr-2012', etichetta: 'CTR 10k', titolo: 'Carta Tecnica Regionale 10k (2012/13)' },
  ] },
  { titolo: 'Sfondo neutro', basi: [
    { id: 'grigio', etichetta: 'Grigio', titolo: 'Esri Light Gray Canvas' },
    { id: 'bianco', etichetta: 'Bianco', titolo: 'Sfondo bianco' },
  ] },
];
const miniatura = id => new URL(`img/basi/${id}.jpg`, document.baseURI).href; // assoluto: la variabile CSS si risolve rispetto a css/

let idPositron = [];
let baseCorrente = 'positron';
const stiliVettoriali = {}; // id -> promessa del JSON dello stile, scaricato una volta sola

function scegli(map, base) {
  baseCorrente = base;
  for (const l of map.getStyle().layers) {
    const v = Object.keys(VETTORIALI).find(id => l.id.startsWith(`base-${id}-`));
    if (v) map.setLayoutProperty(l.id, 'visibility', base === v ? 'visible' : 'none');
  }
  for (const id of idPositron) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', base === 'positron' ? 'visible' : 'none');
  }
  map.setLayoutProperty('base-bianco', 'visibility', base === 'bianco' ? 'visible' : 'none');
  for (const id of Object.keys(RASTER)) map.setLayoutProperty(`base-${id}`, 'visibility', base === id ? 'visible' : 'none');
}

export default {
  id: 'base',
  titolo: 'Base cartografica',
  strati: [],
  aggiungiSorgenti(map) {
    for (const [id, r] of Object.entries(RASTER)) {
      map.addSource(`${id}-r`, {
        type: 'raster', tiles: [r.url], tileSize: 256, minzoom: r.min ?? 0, maxzoom: r.max, attribution: r.attr,
      });
    }
  },
  aggiungiLayer(map) {
    const stile = map.getStyle().layers;
    idPositron = stile.filter(l => !l.id.startsWith('base-')).map(l => l.id);
    const sotto = stile[0]?.id; // le basi stanno sotto a tutto
    const nascosto = { visibility: 'none' };
    map.addLayer({ id: 'base-bianco', type: 'background', layout: nascosto, paint: { 'background-color': '#ffffff' } }, sotto);
    for (const id of Object.keys(RASTER)) map.addLayer({ id: `base-${id}`, type: 'raster', source: `${id}-r`, layout: nascosto }, sotto);
    for (const [id, url] of Object.entries(VETTORIALI)) {
      stiliVettoriali[id] ??= fetch(url).then(r => r.json());
      stiliVettoriali[id].then(stile => {
        for (const l of stile.layers) {
          if (!map.getSource(l.source) && l.type !== 'background') continue;
          map.addLayer({ ...l, id: `base-${id}-${l.id}`, layout: { ...l.layout, visibility: 'none' } }, sotto);
        }
        scegli(map, baseCorrente);
      }).catch(() => {}); // senza rete resta disponibile il resto delle basi
    }
  },
  pannello(el, map) {
    const bottone = document.getElementById('btn-gruppo-base');
    const icona = bottone?.querySelector('svg');
    const suggerimento = document.createElement('p');
    suggerimento.className = 'base-suggerimento';
    suggerimento.textContent = 'Seleziona la cartografia da usare come base.';
    // pulsante ben visibile, sotto il titolo «Mappe storiche»: apre l'atlante in un'altra scheda, sulla zona che si sta guardando (hash `#zoom/lat/lng` di leaflet-hash)
    const atlante = Object.assign(document.createElement('a'), {
      className: 'base-atlante', href: ATLANTE, target: '_blank', rel: 'noopener',
      title: 'Atlante delle carte tecniche storiche di Palermo (OpenDataSicilia): sovrapposizioni, confronto con cursore e cartoline storiche',
    });
    atlante.innerHTML = `<span>Apri l'Atlante storico di Palermo</span>${svgIcona('esterno', 16)}`;
    atlante.addEventListener('click', () => {
      const c = map.getCenter();
      atlante.href = `${ATLANTE}#${Math.min(Math.max(Math.round(map.getZoom()), 13), 18)}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`;
    });
    el.append(suggerimento);
    for (const g of GRUPPI) {
      const h = document.createElement('h3');
      h.textContent = g.titolo;
      const riga = document.createElement('div');
      riga.className = 'base-griglia';
      let nota = null;
      if (g.nota) {
        nota = document.createElement('p');
        nota.className = 'base-suggerimento';
        const a = Object.assign(document.createElement('a'), { href: ATLANTE, target: '_blank', rel: 'noopener', textContent: 'Atlante delle carte tecniche storiche' });
        nota.append('Mappe georeferenziate dell\'', a, ' (OpenDataSicilia). Il pallino indica quanto è affidabile la sovrapposizione: verde alta, giallo media, rosso bassa.');
      }
      for (const b of g.basi) {
        const label = document.createElement('label');
        label.className = 'base-scelta';
        label.title = b.titolo;
        const r = document.createElement('input');
        r.type = 'radio';
        r.name = 'base';
        r.id = `base-${b.id}`;
        r.checked = b.id === 'positron';
        r.setAttribute('aria-label', b.titolo);
        const cerchio = document.createElement('span');
        cerchio.className = 'base-cerchio';
        cerchio.style.backgroundImage = `url(${miniatura(b.id)})`;
        const et = document.createElement('span');
        et.className = 'base-et';
        et.textContent = b.etichetta;
        r.addEventListener('change', () => {
          if (!r.checked) return;
          scegli(map, b.id);
          if (bottone) bottone.style.setProperty('--miniatura', `url(${miniatura(b.id)})`);
        });
        if (b.precisione) {
          const p = document.createElement('span');
          p.className = `base-precisione base-precisione-${b.precisione}`;
          label.append(p);
        }
        label.append(r, cerchio, et);
        riga.append(label);
      }
      el.append(h);
      if (nota) el.append(atlante, nota);
      el.append(riga);
    }
    // l'icona della barra mostra la base in uso, come nell'atlante
    if (icona) icona.replaceWith(Object.assign(document.createElement('span'), { className: 'base-mini' }));
    bottone?.style.setProperty('--miniatura', `url(${miniatura('positron')})`);
  },
};
