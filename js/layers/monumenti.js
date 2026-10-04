import { urlDati, pmt } from '../core/config.js';
import { voceFiltro } from '../core/legenda.js';
import { voceMonumento, modelloPopup } from './scheda-monumenti.js';
import { voceUsoEdificio } from './scheda-uso.js';

// Un colore per categoria (poligono dell'edificio e marker). palette.js è una copia vincolata
// di quella di palermo_popolazione e non si tocca: questi colori sono specifici del viewer.
const MONUMENTI_CATEGORIE = [
  ['Chiese ed Oratori', '#8e44ad'],
  ['Monumenti', '#c0392b'],
  ['Teatri', '#d35400'],
  ['Dimore e Ville storiche', '#16a085'],
  ['Palazzi', '#2c6fbb'],
  ["Gallerie d'Arte e Musei", '#b8860b'],
  ['Biblioteche', '#6d4c41'],
  ['Giardini e Spazi verdi', '#2e8b57'],
  ['Mercati storici', '#e67e22'],
  ['Zone Archeologiche', '#7f8c8d'],
  ['Rifugi e memoria bellica', '#34495e'],
  ['Altri luoghi', '#a0a7b4'],
];

const SRC = 'monumenti'; // punti, raggruppati in cluster
const SRC_EDIFICI = 'monumenti-edifici'; // poligoni degli edifici (non si raggruppano)
const PUNTI = 'monumenti-punti';
const CLUSTER = 'monumenti-cluster';
const CLUSTER_N = 'monumenti-cluster-n';
const POLI = 'monumenti-poli';
const CONTORNI = 'monumenti-contorni';
const LAYERS = [POLI, CONTORNI, CLUSTER, CLUSTER_N, PUNTI];
const CLUSTER_MAX_ZOOM = 16; // dallo zoom 17 ogni luogo ha il suo punto
const singolo = ['!', ['has', 'point_count']];
let puntiTutti = []; // tutti i punti, per ricalcolare i cluster quando la legenda spegne una categoria
// poligoni e punti trasparenti, sempre presenti: la scheda del luogo mostra il monumento anche a layer spento
const HIT_POLI = 'monumenti-hit-poli';
const HIT_PUNTI = 'monumenti-hit-punti';
let legenda = null;
// dettagli completi per id (stanno solo sul punto: i poligoni portano id, nome e categoria)
const dettagli = new Map();
const completo = p => dettagli.get(p.id) ?? p;

const risolvi = rel => urlDati(`monumenti/${rel}`);
const colore = ['match', ['get', 'categoria'], ...MONUMENTI_CATEGORIE.flat(), '#555'];

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Popup sulla mappa: foto, breve descrizione e pulsante verso il portale del Comune.
function contenutoPopup(p) {
  const m = modelloPopup(p, risolvi);
  const radice = el('div', 'monumento-popup');
  if (m.foto) {
    const img = el('img', 'monumento-foto');
    img.src = m.foto;
    img.alt = m.titolo;
    img.addEventListener('error', () => img.remove());
    radice.append(img);
  }
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.categoria));
  if (m.descrizione) radice.append(el('p', 'monumento-desc', m.descrizione));
  if (m.url) {
    const a = el('a', 'monumento-link', 'Vai al sito del Comune');
    a.href = m.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    radice.append(a);
  } else {
    radice.append(el('p', 'monumento-fonte', `Fonte: ${m.fonte}`));
  }
  return radice;
}

function collegaPopup(map) {
  let popup = null;
  map.on('click', e => {
    if (map.getLayoutProperty(POLI, 'visibility') !== 'visible') return;
    const f = map.queryRenderedFeatures(e.point, { layers: LAYERS.filter(id => map.getLayer(id)) })[0];
    popup?.remove();
    if (!f) return;
    if (f.properties.cluster) { // un cluster si apre zoomando fino a separare i luoghi
      map.getSource(SRC).getClusterExpansionZoom(f.properties.cluster_id)
        .then(zoom => map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 }));
      return;
    }
    popup = new maplibregl.Popup({ maxWidth: '280px', className: 'monumento-popup-box', offset: 8 })
      .setLngLat(e.lngLat).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
  });
  for (const id of LAYERS) {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  }
}

// Caselle delle categorie nel menu del layer e nella legenda: restano allineate (stessa categoria, due caselle).
const caselle = new Map(); // categoria -> { pannello, legenda }

// Legenda delle categorie in #legende: compare solo a layer attivo e ogni voce accende/spegne la categoria.
// Le stesse categorie compaiono come sottovoci nel menu del layer.
function creaLegenda(gruppo, map) {
  const attive = new Set(MONUMENTI_CATEGORIE.map(([nome]) => nome));
  const applica = () => {
    const filtro = ['in', ['get', 'categoria'], ['literal', [...attive]]];
    for (const id of [POLI, CONTORNI, HIT_POLI]) map.setFilter(id, filtro);
    // i cluster contano solo le categorie accese: si rialimenta la sorgente con i punti filtrati
    if (!puntiTutti.length) return; // dati non ancora caricati
    map.getSource(SRC).setData({ type: 'FeatureCollection', features: puntiTutti.filter(f => attive.has(f.properties.categoria)) });
  };
  const imposta = (nome, acceso, origine) => {
    acceso ? attive.add(nome) : attive.delete(nome);
    for (const [dove, casella] of Object.entries(caselle.get(nome))) if (dove !== origine) casella.checked = acceso;
    applica();
  };
  legenda = el('div', 'legenda legenda-monumenti');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Monumenti'));
  const blocco = el('div', 'colonnine-filtri');
  for (const [nome, col] of MONUMENTI_CATEGORIE) {
    const pallino = el('i', 'monumenti-pallino');
    pallino.style.background = col;
    const riga = voceFiltro(pallino, nome, acceso => imposta(nome, acceso, 'legenda'));
    legenda.append(riga);
    const label = el('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.disabled = true; // si abilita con lo strato acceso
    cb.dataset.filtro = `categoria:${nome}`;
    cb.addEventListener('change', () => imposta(nome, cb.checked, 'pannello'));
    const p = pallino.cloneNode();
    label.append(cb, ' ', p, ' ', nome);
    blocco.append(label);
    caselle.set(nome, { pannello: cb, legenda: riga._filtro.casella });
  }
  gruppo.append(blocco);
  document.getElementById('legende').append(legenda);
}

export default {
  id: 'monumenti',
  titolo: 'Monumenti',
  argomento: { titolo: 'Monumenti', descrizione: 'Monumenti e luoghi di interesse storico-culturale, con foto e scheda del Portale del Turismo.' },
  aggiungiSorgenti(map) {
    map.addSource(SRC, {
      type: 'geojson', data: urlDati('monumenti/monumenti.geojson'),
      cluster: true, clusterMaxZoom: CLUSTER_MAX_ZOOM, clusterRadius: 45,
    });
    map.addSource(SRC_EDIFICI, { type: 'vector', url: pmt('monumenti/monumenti_edifici.pmtiles') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    // edificio del monumento colorato sopra l'edificato (solo dove l'abbinamento ha trovato un poligono)
    map.addLayer({ id: POLI, type: 'fill', source: SRC_EDIFICI, 'source-layer': 'edifici', layout: nascosto, paint: { 'fill-color': colore, 'fill-opacity': 0.85 } });
    map.addLayer({ id: CONTORNI, type: 'line', source: SRC_EDIFICI, 'source-layer': 'edifici', layout: nascosto, paint: { 'line-color': '#222', 'line-width': 1 } });
    // gruppi di luoghi vicini: cerchio col numero, più grande dove sono di più
    map.addLayer({
      id: CLUSTER, type: 'circle', source: SRC, filter: ['has', 'point_count'], layout: nascosto,
      paint: {
        'circle-color': '#4a5d8a', 'circle-opacity': 0.85, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2,
        'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 23, 200, 29],
      },
    });
    map.addLayer({
      id: CLUSTER_N, type: 'symbol', source: SRC, filter: ['has', 'point_count'],
      layout: {
        visibility: 'none', 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#fff' },
    });
    // luogo singolo: unico segno per giardini/aree archeologiche e riferimento sopra il poligono
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, filter: singolo, layout: nascosto,
      paint: {
        'circle-color': colore, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 7],
      },
    });
    // poligoni e punti trasparenti, sempre presenti: la scheda mostra il monumento anche a layer spento
    map.addLayer({ id: HIT_POLI, type: 'fill', source: SRC_EDIFICI, 'source-layer': 'edifici', paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: HIT_PUNTI, type: 'circle', source: SRC, filter: singolo, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaPopup(map);
  },
  async avvia() {
    const dati = await (await fetch(urlDati('monumenti/monumenti.geojson'))).json(); // già in cache: è il file della sorgente
    puntiTutti = dati.features;
    for (const f of puntiTutti) dettagli.set(f.properties.id, f.properties);
  },
  strati: [{ id: 'monumenti', etichetta: 'Monumenti (Portale del Turismo)', layers: LAYERS, attivo: false,
    sottovoci: [{ titolo: 'Categorie', voci: MONUMENTI_CATEGORIE.map(([nome]) => ({ id: `categoria:${nome}`, etichetta: nome })) }],
    suCambio(attivo) {
      if (legenda) legenda.hidden = !attivo;
      for (const { pannello } of caselle.values()) pannello.disabled = !attivo;
    },
  }],
  pannello: creaLegenda,
  scheda: {
    layers: [HIT_POLI, HIT_PUNTI],
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        if (visti.has(f.properties.id)) return [];
        visti.add(f.properties.id);
        return [voceMonumento(completo(f.properties), risolvi)];
      }).concat(trovati.some(f => f.layer.id === HIT_POLI) ? [voceUsoEdificio('monumento')] : []); // clic sul poligono: l'edificio è un monumento
    },
  },
};
