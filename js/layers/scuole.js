import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { filtroInsieme, voceFiltro, voceStrato } from '../core/legenda.js';
import { voceScuola, voceSeggio, voceIndirizzo, modelloPopupScuola } from './scheda-scuole.js';
import { voceUsoEdificio } from './scheda-uso.js';
import { coloraEdifici3d, coloriPerFid, senzaVolume, volumi3dAcceso } from '../core/colori-3d.js';
import { tl } from '../core/i18n.js';
import { registraForme, layerForme, stileForma, simboloForma } from '../core/forme.js';

// Due strati con la stessa struttura: punto della sede + poligono dell'edificio abbinato in dati/scuole/.
// I colori sono propri del viewer (palette.js è una copia vincolata e non si tocca).
const TIPI_SCUOLA = [['Asilo nido', '#f08c00'], ['Plesso scolastico', '#1971c2'], ["Sede dell'istituto", '#2b8a3e']];
const SEGGI_COLORE = '#0c8599';
// Ogni layer ha la sua forma (vedi core/forme.js): quadrato per le scuole, rombo per le sedi elettorali.
const FORMA_SCUOLE = 'quadrato';
const FORMA_SEGGI = 'rombo';
const formaDi = k => (k === 'seggi' ? FORMA_SEGGI : FORMA_SCUOLE);

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

const fidPerBene = { scuole: {}, seggi: {} }; // id -> fid degli edifici (stesso id del tile edificato), da <strato>_fid.json
const accesi = { scuole: false, seggi: false }; // strato acceso
let tipiAccesi = new Set(TIPI_SCUOLA.map(([nome]) => nome));

// Filtri dei poligoni e colore dei volumi 3D: con edifici-3d acceso l'edificio col fid si colora nel volume e il poligono piatto sparisce.
function aggiorna3d(map, s) {
  const i = ids(s.chiave);
  const tipo = s.chiave === 'scuole';
  const filtro = tipo ? filtroInsieme(['get', 'tipo'], tipiAccesi, TIPI_SCUOLA.length) : null;
  const volume = volumi3dAcceso(map);
  for (const id of [i.poli, i.contorni]) map.setFilter(id, volume ? senzaVolume(filtro) : filtro);
  for (const id of [i.punti, i.hitPoli, i.hitPunti]) map.setFilter(id, filtro);
  const colori = tipo
    ? coloriPerFid(fidPerBene.scuole, id => dettagli.get(id)?.tipo, Object.fromEntries(TIPI_SCUOLA), [...tipiAccesi])
    : coloriPerFid(fidPerBene.seggi, () => 'seggi', { seggi: SEGGI_COLORE }, ['seggi']);
  coloraEdifici3d(map, s.chiave, accesi[s.chiave] ? colori : null);
}

const dettagli = new Map(); // id -> proprietà complete (stanno solo sul punto; i poligoni portano id, nome e tipo)
const completo = p => dettagli.get(p.id) ?? p;
let legenda = null;

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
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
  registraTooltipStrati(map, [{ layers: [punti, poli], icona: 'scuola', campione: p => { const col = s.chiave === 'seggi' ? SEGGI_COLORE : TIPI_SCUOLA.find(([n]) => n === p.tipo)?.[1]; return col ? campioneTooltip('legenda-monumenti', ['monumenti-pallino', stileForma(formaDi(s.chiave), col)]) : null; }, modello: p => modelloPopupScuola(completo(p)) }]);
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
    const box = el('div', `legenda legenda-monumenti lg-${s.chiave}`);
    box.hidden = true;
    box.append(el('strong', null, s.titolo));
    if (s.chiave === 'scuole') {
      for (const [nome, col] of TIPI_SCUOLA) {
        box.append(voceFiltro(simboloForma(FORMA_SCUOLE, col), nome, acceso => {
          acceso ? tipiAccesi.add(nome) : tipiAccesi.delete(nome);
          aggiorna3d(map, s);
        }));
      }
    } else {
      box.append(voceStrato(simboloForma(FORMA_SEGGI, SEGGI_COLORE), 'Sede di sezioni elettorali', s.chiave));
    }
    legenda[s.chiave] = box;
    document.getElementById('legende').append(box);
  }
}

export default {
  id: 'scuole',
  titolo: 'Scuole e sezioni elettorali',
  argomento: { titolo: 'Scuole e sezioni elettorali', descrizione: 'Scuole e asili comunali e sedi delle sezioni elettorali.' },
  gruppo: 'colonnine', // dentro «Servizi su strada»
  sezione: 'Scuole e sezioni elettorali',
  sezioniFisse: true, // il titolo non viaggia con lo strato nel riordino
  aggiungiSorgenti(map) {
    for (const { chiave } of STRATI) {
      map.addSource(chiave, { type: 'geojson', data: urlDati(`scuole/${chiave}.geojson`) });
      map.addSource(`${chiave}-edifici`, { type: 'geojson', data: urlDati(`scuole/${chiave}_edifici.geojson`) });
    }
  },
  aggiungiLayer(map) {
    registraForme(map, [FORMA_SCUOLE, FORMA_SEGGI]);
    const nascosto = { visibility: 'none' };
    for (const s of STRATI) {
      const i = ids(s.chiave);
      const edifici = `${s.chiave}-edifici`;
      map.addLayer({ id: i.poli, type: 'fill', source: edifici, layout: nascosto, paint: { 'fill-color': s.colore, 'fill-opacity': 0.85 } });
      map.addLayer({ id: i.contorni, type: 'line', source: edifici, layout: nascosto, paint: { 'line-color': '#222', 'line-width': 1 } });
      map.addLayer(layerForme({ id: i.punti, source: s.chiave, forma: formaDi(s.chiave), colore: s.colore, layout: nascosto }));
      // poligoni e punti trasparenti, sempre presenti: la scheda mostra i dati anche a strato spento
      map.addLayer({ id: i.hitPoli, type: 'fill', source: edifici, paint: { 'fill-opacity': 0 } });
      map.addLayer({ id: i.hitPunti, type: 'circle', source: s.chiave, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
      collegaPopup(map, s);
    }
  },
  async avvia(map) {
    await Promise.all(STRATI.map(async s => {
      const dati = await (await fetch(urlDati(`scuole/${s.chiave}.geojson`))).json(); // già in cache: è il file della sorgente
      for (const f of dati.features) dettagli.set(f.properties.id, f.properties);
      try {
        fidPerBene[s.chiave] = await (await fetch(urlDati(`scuole/${s.chiave}_fid.json`))).json();
      } catch { fidPerBene[s.chiave] = {}; } // senza il file gli edifici restano poligoni piatti
    }));
    document.addEventListener('vista3d', () => STRATI.forEach(s => aggiorna3d(map, s))); // i volumi 3D si accendono e spengono
    STRATI.forEach(s => aggiorna3d(map, s));
  },
  strati: STRATI.map(s => ({
    id: s.chiave, legendaPannello: `.lg-${s.chiave}`, etichetta: s.etichetta, layers: visibili(s.chiave), attivo: false,
    suCambio(attivo, map) {
      accesi[s.chiave] = attivo;
      aggiorna3d(map, s);
      if (legenda) legenda[s.chiave].hidden = !attivo;
    },
  })),
  pannello: creaLegenda,
  scheda: {
    vicini: { raggio: 300, max: 5 }, // anche i punti nei dintorni del clic (vedi docs/NUOVO_LAYER.md)
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
