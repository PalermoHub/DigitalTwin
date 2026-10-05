import { piuVicino } from './scheda-util.js';
import { voceFiltro } from './legenda.js';
import { registraTooltip } from './tooltip.js';
import { svgIcona } from './icone.js';

// Evidenziazione sulla mappa delle aree da cui vengono i dati della scheda del luogo.
// Ogni layer "hit" ha un'etichetta (mostrata nella scheda) e un colore (usato sulla mappa).
export const FONTI = {
  'edifici-hit': { etichetta: 'Edificio', colore: '#e8590c' },
  'pop-hit': { etichetta: 'Sezione di censimento', colore: '#1c7ed6' },
  'catasto-hit': { etichetta: 'Particella catastale', colore: '#2f9e44' },
  'prg-zto-hit': { etichetta: 'Zona PRG', colore: '#9c36b5' },
  'prg-ns-hit': { etichetta: 'Netto storico PRG', colore: '#9c36b5' },
  'prg-cs-hit': { etichetta: 'Centro storico PRG', colore: '#9c36b5' },
  'prg-va-hit': { etichetta: 'Vincolo PRG (area)', colore: '#c2255c' },
  'prg-vl-hit': { etichetta: 'Vincolo PRG (linea)', colore: '#c2255c' },
  'omi-hit': { etichetta: 'Zona OMI', colore: '#e67700' },
  'immobili-hit': { etichetta: 'Immobile comunale', colore: '#0b7285' },
  'civici-hit': { etichetta: 'Numero civico', colore: '#d6336c' },
  'monumenti-hit-poli': { etichetta: 'Monumento', colore: '#862e9c' },
  'monumenti-hit-punti': { etichetta: 'Monumento', colore: '#862e9c' },
  'alberi-hit-punti': { etichetta: 'Albero monumentale', colore: '#2f7d32' },
  'fontanelle-hit-punti': { etichetta: 'Fontanella', colore: '#1c7ed6' },
  'scuole-hit-poli': { etichetta: 'Scuola o asilo', colore: '#1971c2' },
  'scuole-hit-punti': { etichetta: 'Scuola o asilo', colore: '#1971c2' },
  'seggi-hit-poli': { etichetta: 'Sede di sezioni elettorali', colore: '#0c8599' },
  'seggi-hit-punti': { etichetta: 'Sede di sezioni elettorali', colore: '#0c8599' },
  'colonnine-hit': { etichetta: 'Colonnina di ricarica', colore: '#2b8a3e' },
  'uffici-hit': { etichetta: 'Sede di uffici comunali', colore: '#a61e4d' },
  'trasporto-hit-fermate': { etichetta: 'Fermata', colore: '#364fc7' },
  'trasporto-hit-linee': { etichetta: 'Linea', colore: '#e03131' },
  'griglia-hit': { etichetta: 'Punto di griglia del terreno (50 m)', colore: '#5c940d' },
};

// Attributo che identifica la feature (mostrato nel tooltip accanto al nome del layer); undefined se non ce n'è uno.
const pulito = v => (v == null ? '' : String(v).replace(/^'|'$/g, '').trim());
const unisciTesti = (...parti) => parti.map(pulito).filter(Boolean).join(' — ') || undefined;
const ATTRIBUTI = {
  'pop-hit': p => unisciTesti(p.SEZ21_ID),
  'catasto-hit': p => (p.Foglio != null ? `Fg. ${p.Foglio} · P. ${p.Paricella}` : undefined),
  'prg-zto-hit': p => unisciTesti(p.ZTO, p.DESCRIZION),
  'prg-ns-hit': p => unisciTesti(p.ZTO, p.DESCRIZION),
  'prg-va-hit': p => unisciTesti(p.tipo, p.descrizone),
  'prg-vl-hit': p => unisciTesti(p.TIPO, p.DESCRIZION),
  'omi-hit': p => unisciTesti(p.Zona_Descr, p.Fascia),
  'immobili-hit': p => unisciTesti(p.TIPO, p.INDIRIZZO),
  'civici-hit': p => unisciTesti(p.Odonimo, p.Esponente ? `${p.Civico}/${p.Esponente}` : p.Civico),
  'trasporto-hit-fermate': p => unisciTesti(p.nome),
};
export const attributoDi = (id, proprieta = {}) => (ATTRIBUTI[id]?.(proprieta) ?? pulito(proprieta.attributo)) || undefined;

const SORGENTE = 'scheda-evidenza';
const STRATI = ['scheda-evidenza-fill', 'scheda-evidenza-line', 'scheda-evidenza-punti'];

const uguali = (a, b) => JSON.stringify(a.properties) === JSON.stringify(b.properties);

// Tra i risultati di un layer tiene la feature da cui la scheda prende i dati e i suoi frammenti
// (un poligono tagliato dai tile compare in più pezzi con le stesse proprietà).
export function sceltePerLayer(trovati, lngLat) {
  const ids = [...new Set(trovati.map(f => f.layer.id))].filter(id => FONTI[id]);
  return ids.map(id => {
    const prima = id === 'griglia-hit'
      ? piuVicino(trovati, id, lngLat)
      : trovati.find(f => f.layer.id === id);
    const pezzi = prima.geometry.type === 'Point'
      ? [prima]
      : trovati.filter(f => f.layer.id === id && uguali(f, prima));
    return { id, ...FONTI[id], features: pezzi };
  });
}

// GeoJSON da disegnare: ogni geometria porta il colore della propria fonte.
export function collezione(scelte) {
  return {
    type: 'FeatureCollection',
    features: scelte.flatMap(s => s.features.map(f => ({
      type: 'Feature', geometry: f.geometry, properties: { colore: s.colore, etichetta: s.etichetta, attributo: attributoDi(s.id, f.properties) ?? '' },
    }))),
  };
}

// Evidenzia una sola cosa: l'edificio se il clic cade su un edificio (il poligono del monumento,
// scuola o seggio, altrimenti quello dell'edificato), il punto se cade fuori dall'edificato.
// Senza nessuno dei due (es. solo catasto o PRG) restano tutte le aree. La griglia del terreno non conta.
export function soloCliccato(scelte) {
  const poligono = scelte.find(s => /-hit-poli$/.test(s.id)) ?? scelte.find(s => s.id === 'edifici-hit');
  const punto = scelte.find(s => s.id !== 'griglia-hit' && s.features[0].geometry.type === 'Point');
  const scelta = poligono ?? punto;
  return scelta ? [scelta] : scelte;
}

// Tooltip sulle aree evidenziate dal clic: nome di ciò che è disegnato sotto il cursore (una riga per etichetta).
let tooltipAttivo = true; // il pulsante della legenda lo spegne
function tooltipSelezione(map, punto) {
  if (!tooltipAttivo) return null;
  const trovati = map.queryRenderedFeatures(punto, { layers: STRATI.filter(id => map.getLayer(id)) });
  const viste = new Map(trovati.map(f => [`${f.properties.etichetta}\n${f.properties.attributo}`, f.properties]));
  if (!viste.size) return null;
  const contenuto = document.createElement('div');
  contenuto.className = 'legenda';
  for (const { etichetta, colore, attributo } of viste.values()) {
    const riga = document.createElement('div');
    const simbolo = document.createElement('i');
    simbolo.className = 'selezione-simbolo';
    simbolo.style.setProperty('--colore', colore);
    const testo = document.createElement('span');
    testo.className = 'selezione-testo';
    const nome = document.createElement('span');
    nome.textContent = etichetta;
    testo.append(nome);
    if (attributo) {
      const valore = document.createElement('b');
      valore.textContent = attributo;
      testo.append(valore);
    }
    riga.append(simbolo, testo);
    contenuto.append(riga);
  }
  return { contenuto };
}

function assicuraStrati(map) {
  if (map.getSource(SORGENTE)) return;
  registraTooltip(map, e => tooltipSelezione(map, e.point), 5);
  map.addSource(SORGENTE, { type: 'geojson', data: collezione([]) });
  const colore = ['get', 'colore'];
  map.addLayer({ id: STRATI[0], type: 'fill', source: SORGENTE, filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': colore, 'fill-opacity': 0.2 } });
  map.addLayer({ id: STRATI[1], type: 'line', source: SORGENTE, filter: ['!=', ['geometry-type'], 'Point'],
    paint: { 'line-color': colore, 'line-width': 3 } });
  map.addLayer({ id: STRATI[2], type: 'circle', source: SORGENTE, filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-color': colore, 'circle-opacity': 0.35, 'circle-radius': 9, 'circle-stroke-color': colore, 'circle-stroke-width': 3 } });
}

// Voci della legenda «Selezione in mappa»: una per etichetta (es. Edificio, Fermata vicina) con il colore col quale è disegnata;
// `punto` = la voce è un punto (si disegna un cerchio), altrimenti un'area.
export function vociLegenda(scelte) {
  const viste = new Map();
  for (const s of scelte) if (!viste.has(s.etichetta)) viste.set(s.etichetta, { colore: s.colore, punto: s.features[0]?.geometry.type === 'Point' });
  return [...viste].map(([etichetta, v]) => ({ etichetta, ...v }));
}

// Scelte da disegnare dopo il filtro della legenda: restano solo quelle con le etichette accese.
export const scelteAccese = (scelte, accese) => scelte.filter(s => accese.has(s.etichetta));

// Legenda in #legende: compare finché c'è una selezione sulla mappa; come le altre legende fa da filtro
// (il clic su una voce lascia in mappa solo quella, un secondo clic le riaccende tutte).
function aggiornaLegenda(map, scelte) {
  const contenitore = typeof document !== 'undefined' && document.getElementById('legende');
  if (!contenitore) return;
  let legenda = document.getElementById('legenda-selezione');
  const voci = vociLegenda(scelte);
  if (!voci.length) { if (legenda) legenda.hidden = true; return; }
  if (!legenda) {
    legenda = document.createElement('div');
    legenda.id = 'legenda-selezione';
    legenda.className = 'legenda legenda-selezione';
    contenitore.append(legenda);
  }
  legenda.replaceChildren();
  const testa = document.createElement('div');
  testa.className = 'selezione-testa';
  const titolo = document.createElement('strong');
  titolo.textContent = 'Selezione in mappa';
  const interruttore = document.createElement('button');
  interruttore.type = 'button';
  interruttore.className = 'selezione-tooltip';
  interruttore.innerHTML = svgIcona('fumetto', 16);
  const aggiorna = () => {
    const testo = tooltipAttivo ? 'Dettagli al passaggio del mouse: attivi (clic per nasconderli)' : 'Dettagli al passaggio del mouse: nascosti (clic per mostrarli)';
    interruttore.setAttribute('aria-pressed', String(tooltipAttivo));
    interruttore.setAttribute('aria-label', testo);
    interruttore.title = testo;
  };
  interruttore.addEventListener('click', () => { tooltipAttivo = !tooltipAttivo; aggiorna(); });
  aggiorna();
  testa.append(titolo, interruttore);
  legenda.append(testa);
  const accese = new Set(voci.map(v => v.etichetta));
  const gruppo = document.createElement('div');
  gruppo.className = 'selezione-voci';
  for (const v of voci) {
    const simbolo = document.createElement('i');
    simbolo.className = `selezione-simbolo${v.punto ? ' selezione-simbolo--punto' : ''}`;
    simbolo.style.setProperty('--colore', v.colore);
    gruppo.append(voceFiltro(simbolo, v.etichetta, acceso => {
      if (acceso) accese.add(v.etichetta); else accese.delete(v.etichetta);
      map.getSource(SORGENTE)?.setData(collezione(scelteAccese(scelte, accese)));
    }));
  }
  legenda.append(gruppo);
  legenda.hidden = false;
}

export function evidenzia(map, scelte) {
  aggiornaLegenda(map, scelte);
  assicuraStrati(map);
  map.getSource(SORGENTE).setData(collezione(scelte));
  // sempre sopra agli strati aggiunti dopo (es. riaccensioni dei layer dei dati)
  for (const id of STRATI) map.moveLayer(id);
}

export function cancellaEvidenza(map) {
  aggiornaLegenda(map, []);
  if (map.getSource(SORGENTE)) map.getSource(SORGENTE).setData(collezione([]));
}
