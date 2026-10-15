import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { occhio } from '../core/pannello.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { modelloPopupDistributore, voceDistributore, distributoriVicini, CARBURANTI } from './scheda-distributori.js';
import { tl } from '../core/i18n.js';

// Distributori di carburante di Palermo (dati/distributori/distributori.geojson, rigenerato ogni giorno da un workflow dai CSV del MIMIT:
// anagrafica degli impianti e prezzi comunicati dai gestori). Un punto per impianto, colorato per bandiera (marchio).
const SRC = 'distributori';
const PUNTI = 'distributori-punti';
const HIT = 'distributori-hit';
const ALTRE = 'Altre';
const MARCHI = [
  ['Agip Eni', '#f2b705'], ['Api-Ip', '#1971c2'], ['Esso', '#e03131'], ['Q8', '#c2255c'],
  ['Pompe Bianche', '#868e96'], ['EOS', '#7048e8'], ['Tamoil', '#2f9e44'], [ALTRE, '#343a40'],
];

const RAGGIO_VICINO = 400; // metri: la scheda mostra anche i distributori nei dintorni del punto cliccato
const MAX_VICINI = 5;
const dettagli = new Map(); // id -> proprietà complete (l'elenco dei prezzi, annidato, non sopravvive alla mappa)
const coordinate = new Map(); // id -> [lon, lat]
const completo = p => dettagli.get(p.id) ?? p;
let mappa = null;
let legenda = null;
const accesi = { marchio: new Set(MARCHI.map(([m]) => m)), carburante: new Set(CARBURANTI) };

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

function contenutoPopup(p) {
  const m = modelloPopupDistributore(p);
  const radice = el('div', 'monumento-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  for (const r of m.righe) radice.append(el('p', 'monumento-desc', `${tl(r.etichetta)}: ${r.valore}`));
  return radice;
}

function applicaFiltri() {
  const carburanti = accesi.carburante.size >= CARBURANTI.length ? null
    : ['any', ...[...accesi.carburante].map(c => ['in', c, ['get', 'carburanti']])];
  const filtri = [filtroInsieme(['get', 'marchio'], accesi.marchio, MARCHI.length), carburanti].filter(Boolean);
  const filtro = filtri.length ? ['all', ...filtri] : null;
  for (const id of [PUNTI, HIT]) mappa?.getLayer(id) && mappa.setFilter(id, filtro);
}

// Ogni filtro (marchio, carburante) ha due caselle sincronizzate: nel pannello sotto la voce dello strato e nella legenda.
const caselle = new Map(); // «tipo:chiave» -> { pannello, legenda }

function impostaFiltro(tipo, chiave, acceso, origine) {
  acceso ? accesi[tipo].add(chiave) : accesi[tipo].delete(chiave);
  const c = caselle.get(`${tipo}:${chiave}`);
  if (c) for (const [dove, casella] of Object.entries(c)) if (dove !== origine && casella) casella.checked = acceso;
  applicaFiltri();
}

function pannelloFiltri(gruppo, tipo, titolo, voci, pallino) {
  const blocco = el('div', 'colonnine-filtri');
  blocco.append(el('h3', null, titolo));
  for (const [chiave, colore] of voci) {
    const label = el('label', 'sotto-voce');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.disabled = true; // si abilita con lo strato acceso
    cb.dataset.filtro = `${tipo}:${chiave}`;
    cb.addEventListener('change', () => impostaFiltro(tipo, chiave, cb.checked, 'pannello'));
    label.append(cb, occhio(), ' ');
    if (pallino) label.append(pallino(colore), ' ');
    label.append(tl(chiave));
    blocco.append(label);
    caselle.set(`${tipo}:${chiave}`, { ...caselle.get(`${tipo}:${chiave}`), pannello: cb });
  }
  gruppo.append(blocco);
}

const pallino = col => { const p = el('i', 'monumenti-pallino'); p.style.background = col; return p; };

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-distributori');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Distributori di carburante'));
  const riga = (tipo, chiave, simbolo) => {
    const r = voceFiltro(simbolo, chiave, acceso => impostaFiltro(tipo, chiave, acceso, 'legenda'));
    caselle.set(`${tipo}:${chiave}`, { ...caselle.get(`${tipo}:${chiave}`), legenda: r._filtro.casella });
    return r;
  };
  for (const [nome, col] of MARCHI) legenda.append(riga('marchio', nome, pallino(col)));
  const carburanti = el('div');
  for (const c of CARBURANTI) carburanti.append(riga('carburante', c, pallino('#fff')));
  legenda.append(carburanti);
  legenda.append(el('p', 'uffici-nota', 'Prezzi comunicati dai gestori al MIMIT (aggiornati ogni giorno)'));
  document.getElementById('legende').append(legenda);
}

// Sotto la voce dello strato: i filtri per bandiera e per carburante venduto, attivi solo con lo strato acceso.
function creaPannello(gruppo) {
  creaLegenda();
  pannelloFiltri(gruppo, 'marchio', 'Bandiera', MARCHI, pallino);
  pannelloFiltri(gruppo, 'carburante', 'Carburante', CARBURANTI.map(c => [c]));
}

export default {
  id: 'distributori',
  titolo: 'Distributori di carburante',
  argomento: { titolo: 'Distributori di carburante', descrizione: 'Distributori di carburante di Palermo, con bandiera e prezzi comunicati dai gestori (benzina, gasolio, GPL, metano).' },
  gruppo: 'colonnine', // dentro «Servizi su strada»
  sezione: '', // nessun titolo proprio: lo strato sta nella sezione «Servizi su strada» aperta da colonnine.js
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('distributori/distributori.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, layout: { visibility: 'none' },
      paint: {
        'circle-color': ['match', ['get', 'marchio'], ...MARCHI.flat(), '#555'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 8],
      },
    });
    // punti trasparenti sempre presenti: la scheda del luogo mostra i distributori vicini anche a strato spento
    map.addLayer({ id: HIT, type: 'circle', source: SRC, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    let popup = null;
    map.on('click', e => {
      if (map.getLayoutProperty(PUNTI, 'visibility') !== 'visible') return;
      const f = map.queryRenderedFeatures(e.point, { layers: [PUNTI] })[0];
      popup?.remove();
      if (!f) return;
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(f.geometry.coordinates).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
    });
    registraTooltipStrati(map, [{
      layers: [PUNTI], icona: 'distributori',
      campione: p => { const col = MARCHI.find(([m]) => m === completo(p).marchio)?.[1]; return col ? campioneTooltip('legenda-monumenti', ['monumenti-pallino', { background: col }]) : null; },
      modello: p => modelloPopupDistributore(completo(p)),
    }]);
    map.on('mouseenter', PUNTI, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', PUNTI, () => { map.getCanvas().style.cursor = ''; });
  },
  async avvia() {
    const fc = await (await fetch(urlDati('distributori/distributori.geojson'))).json(); // già in cache: è il file della sorgente
    for (const f of fc.features) {
      dettagli.set(f.properties.id, f.properties);
      coordinate.set(f.properties.id, f.geometry.coordinates);
    }
  },
  scheda: {
    layers: [HIT],
    // cliccare un distributore apre subito il tab «Servizi su strada», anche a strato spento (i punti si interrogano comunque)
    tabAlClic: () => 'servizi',
    // i distributori sotto il clic e quelli entro RAGGIO_VICINO, anche a strato spento: una card ciascuno, con la distanza
    voci(trovati, lngLat) {
      const cliccati = new Set(trovati.map(f => f.properties.id));
      const punto = lngLat ? [lngLat.lng, lngLat.lat] : null;
      const vicini = punto ? distributoriVicini(punto, dettagli, coordinate, RAGGIO_VICINO, MAX_VICINI, cliccati) : [];
      const ids = new Set(vicini.map(x => x.p.id));
      const voci = vicini.map(({ p, distanza }) => voceDistributore(p, distanza, coordinate.get(p.id)));
      // senza posizione (o con i dati non ancora caricati) restano almeno quelli sotto il clic
      for (const id of cliccati) if (!ids.has(id) && dettagli.has(id)) voci.push(voceDistributore(dettagli.get(id), null, coordinate.get(id)));
      return voci;
    },
  },
  legendaPannello: '.lg-distributori', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'distributori', etichetta: 'Distributori di carburante', sottosezione: 'Distributori di carburante', layers: [PUNTI], attivo: false,
    sottovoci: [
      { titolo: 'Bandiera', voci: MARCHI.map(([m]) => ({ id: `marchio:${m}`, etichetta: m })) },
      { titolo: 'Carburante', voci: CARBURANTI.map(c => ({ id: `carburante:${c}`, etichetta: c })) },
    ],
    suCambio(attivo) {
      if (legenda) legenda.hidden = !attivo;
      for (const { pannello } of caselle.values()) pannello.disabled = !attivo;
    },
  }],
  pannello: creaPannello,
};
