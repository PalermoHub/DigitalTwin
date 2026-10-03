// Basi cartografiche alternative: Positron (stile di partenza), sfondo bianco (come nell'app
// catasto originale a base spenta), Carta Tecnica Comunale 2k (2007/09) e Google Satellite. Una sola è visibile alla volta.

const SATELLITE_URL = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
const CTR_URL = 'https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png';
// Raggruppate come nel selettore dell'atlante: basi moderne e cartografia tecnica.
const GRUPPI = [
  { titolo: 'Basi moderne', basi: [
    { id: 'positron', etichetta: 'Mappa chiara', titolo: 'Mappa chiara (OpenFreeMap)' },
    { id: 'satellite', etichetta: 'Satellite', titolo: 'Google Satellite' },
  ] },
  { titolo: 'Cartografia tecnica', basi: [
    { id: 'ctr', etichetta: 'CTR 2k', titolo: 'Carta Tecnica Comunale 2k (2007/09)' },
  ] },
  { titolo: 'Sfondo neutro', basi: [
    { id: 'bianco', etichetta: 'Bianco', titolo: 'Sfondo bianco' },
  ] },
];
const miniatura = id => new URL(`img/basi/${id}.jpg`, document.baseURI).href; // assoluto: la variabile CSS si risolve rispetto a css/

let idPositron = [];

function scegli(map, base) {
  for (const id of idPositron) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', base === 'positron' ? 'visible' : 'none');
  }
  map.setLayoutProperty('base-bianco', 'visibility', base === 'bianco' ? 'visible' : 'none');
  map.setLayoutProperty('base-ctr', 'visibility', base === 'ctr' ? 'visible' : 'none');
  map.setLayoutProperty('base-satellite', 'visibility', base === 'satellite' ? 'visible' : 'none');
}

export default {
  id: 'base',
  titolo: 'Base cartografica',
  strati: [],
  aggiungiSorgenti(map) {
    map.addSource('ctr-r', {
      type: 'raster', tiles: [CTR_URL], tileSize: 256, minzoom: 12, maxzoom: 19, attribution: '© Carta Tecnica Comunale',
    });
    map.addSource('satellite-r', {
      type: 'raster', tiles: [SATELLITE_URL], tileSize: 256, maxzoom: 20, attribution: '© Google',
    });
  },
  aggiungiLayer(map) {
    const stile = map.getStyle().layers;
    idPositron = stile.filter(l => !l.id.startsWith('base-')).map(l => l.id);
    const sotto = stile[0]?.id; // le basi stanno sotto a tutto
    const nascosto = { visibility: 'none' };
    map.addLayer({ id: 'base-bianco', type: 'background', layout: nascosto, paint: { 'background-color': '#ffffff' } }, sotto);
    map.addLayer({ id: 'base-ctr', type: 'raster', source: 'ctr-r', layout: nascosto }, sotto);
    map.addLayer({ id: 'base-satellite', type: 'raster', source: 'satellite-r', layout: nascosto }, sotto);
  },
  pannello(el, map) {
    const bottone = document.getElementById('btn-gruppo-base');
    const icona = bottone?.querySelector('svg');
    const suggerimento = document.createElement('p');
    suggerimento.className = 'base-suggerimento';
    suggerimento.textContent = 'Seleziona la cartografia da usare come base.';
    el.append(suggerimento);
    for (const g of GRUPPI) {
      const h = document.createElement('h3');
      h.textContent = g.titolo;
      const riga = document.createElement('div');
      riga.className = 'base-griglia';
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
        label.append(r, cerchio, et);
        riga.append(label);
      }
      el.append(h, riga);
    }
    // l'icona della barra mostra la base in uso, come nell'atlante
    if (icona) icona.replaceWith(Object.assign(document.createElement('span'), { className: 'base-mini' }));
    bottone?.style.setProperty('--miniatura', `url(${miniatura('positron')})`);
  },
};
