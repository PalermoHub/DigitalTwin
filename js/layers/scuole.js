import { urlDati } from '../core/config.js';
import { filtroInsieme, voceFiltro, voceStrato } from '../core/legenda.js';
import { voceScuola, voceSeggio, voceIndirizzo, modelloPopupScuola } from './scheda-scuole.js';
import { voceUsoEdificio } from './scheda-uso.js';

// Due strati con la stessa struttura: punto della sede + poligono dell'edificio abbinato in dati/scuole/.
// I colori sono propri del viewer (palette.js è una copia vincolata e non si tocca).
const TIPI_SCUOLA = [['Asilo nido', '#f08c00'], ['Plesso scolastico', '#1971c2'], ["Sede dell'istituto", '#2b8a3e']];
const SEGGI_COLORE = '#0c8599';

const STRATI = [
  { chiave: 'scuole', etichetta: 'Scuole e asili comunali', titolo: 'Scuole e asili',
    colore: ['match', ['get', 'tipo'], ...TIPI_SCUOLA.flat(), '#555'] },
  { chiave: 'seggi', etichetta: 'Sezioni elettorali (sedi)', titolo: 'Sezioni elettorali',
    colore: SEGGI_COLORE },
];
const ids = k => ({
  punti: `${k}-punti`, poli: `${k}-poli`, contorni: `${k}-contorni`, hitPoli: `${k}-hit-poli`, hitPunti: `${k}-hit-punti`,
});
const visibili = k => [ids(k).poli, ids(k).contorni, ids(k).punti];

const dettagli = new Map(); // id -> proprietà complete (stanno solo sul punto; i poligoni portano id, nome e tipo)
const completo = p => dettagli.get(p.id) ?? p;
let legenda = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function contenutoPopup(p) {
  const m = modelloPopupScuola(p);
  const radice = el('div', 'monumento-popup');
  radice.append(el('h3', null, m.titolo), el('p', 'monumento-cat', m.sottotitolo));
  for (const r of m.righe) radice.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
  return radice;
}

function collegaPopup(map, s) {
  const { punti, poli } = ids(s.chiave);
  let popup = null;
  map.on('click', e => {
    if (map.getLayoutProperty(poli, 'visibility') !== 'visible') return;
    const f = map.queryRenderedFeatures(e.point, { layers: [punti, poli] })[0];
    popup?.remove();
    if (!f) return;
    popup = new maplibregl.Popup({ maxWidth: '280px', className: 'monumento-popup-box', offset: 8 })
      .setLngLat(e.lngLat).setDOMContent(contenutoPopup(completo(f.properties))).addTo(map);
  });
  for (const id of [punti, poli]) {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  }
}

// Legenda in #legende: una voce per strato, visibile solo a strato acceso. Ogni voce è un filtro: i tipi di scuola
// restringono punti, edifici e dati della scheda; la sede delle sezioni elettorali accende e spegne lo strato.
function creaLegenda(_gruppo, map) {
  legenda = {};
  for (const s of STRATI) {
    const box = el('div', 'legenda legenda-monumenti');
    box.hidden = true;
    box.append(el('strong', null, s.titolo));
    const pallino = col => { const p = el('i', 'monumenti-pallino'); p.style.background = col; return p; };
    if (s.chiave === 'scuole') {
      const accesi = new Set(TIPI_SCUOLA.map(([nome]) => nome));
      const i = ids(s.chiave);
      for (const [nome, col] of TIPI_SCUOLA) {
        box.append(voceFiltro(pallino(col), nome, acceso => {
          acceso ? accesi.add(nome) : accesi.delete(nome);
          const filtro = filtroInsieme(['get', 'tipo'], accesi, TIPI_SCUOLA.length);
          for (const id of [i.poli, i.contorni, i.punti, i.hitPoli, i.hitPunti]) map.setFilter(id, filtro);
        }));
      }
    } else {
      box.append(voceStrato(pallino(SEGGI_COLORE), 'Sede di sezioni elettorali', s.chiave));
    }
    legenda[s.chiave] = box;
    document.getElementById('legende').append(box);
  }
}

export default {
  id: 'scuole',
  titolo: 'Scuole e sezioni elettorali',
  argomento: { titolo: 'Scuole e sezioni elettorali', descrizione: 'Scuole e asili comunali e sedi delle sezioni elettorali.' },
  gruppo: 'territorio', // sotto «Layer»
  aggiungiSorgenti(map) {
    for (const { chiave } of STRATI) {
      map.addSource(chiave, { type: 'geojson', data: urlDati(`scuole/${chiave}.geojson`) });
      map.addSource(`${chiave}-edifici`, { type: 'geojson', data: urlDati(`scuole/${chiave}_edifici.geojson`) });
    }
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    for (const s of STRATI) {
      const i = ids(s.chiave);
      const edifici = `${s.chiave}-edifici`;
      map.addLayer({ id: i.poli, type: 'fill', source: edifici, layout: nascosto, paint: { 'fill-color': s.colore, 'fill-opacity': 0.85 } });
      map.addLayer({ id: i.contorni, type: 'line', source: edifici, layout: nascosto, paint: { 'line-color': '#222', 'line-width': 1 } });
      map.addLayer({
        id: i.punti, type: 'circle', source: s.chiave, layout: nascosto,
        paint: {
          'circle-color': s.colore, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 7],
        },
      });
      // poligoni e punti trasparenti, sempre presenti: la scheda mostra i dati anche a strato spento
      map.addLayer({ id: i.hitPoli, type: 'fill', source: edifici, paint: { 'fill-opacity': 0 } });
      map.addLayer({ id: i.hitPunti, type: 'circle', source: s.chiave, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
      collegaPopup(map, s);
    }
  },
  async avvia() {
    await Promise.all(STRATI.map(async s => {
      const dati = await (await fetch(urlDati(`scuole/${s.chiave}.geojson`))).json(); // già in cache: è il file della sorgente
      for (const f of dati.features) dettagli.set(f.properties.id, f.properties);
    }));
  },
  strati: STRATI.map(s => ({
    id: s.chiave, etichetta: s.etichetta, layers: visibili(s.chiave), attivo: false,
    suCambio(attivo) { if (legenda) legenda[s.chiave].hidden = !attivo; },
  })),
  pannello: creaLegenda,
  scheda: {
    layers: STRATI.flatMap(s => [ids(s.chiave).hitPoli, ids(s.chiave).hitPunti]),
    voci(trovati) {
      const visti = new Set();
      return trovati.flatMap(f => {
        const p = completo(f.properties);
        if (visti.has(p.id)) return [];
        visti.add(p.id);
        const seggio = p.id.startsWith('seggio');
        const voci = seggio ? [voceSeggio(p), voceIndirizzo(p, 2)] : [voceScuola(p), voceIndirizzo(p, 1)];
        // clic sul poligono: l'edificio è una scuola o una sede di seggio (migliora l'uso UNK dell'edificato)
        if (f.layer.id.endsWith('-hit-poli')) voci.push(voceUsoEdificio(seggio ? 'seggio' : 'scuola'));
        return voci;
      });
    },
  },
};
