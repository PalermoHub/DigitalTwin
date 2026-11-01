// Aree amministrative come selettori dell'area di stampa: Comune, circoscrizioni, quartieri e UPL
// (popolazione/confini_zone.json, lo stesso file della ricerca per zona). Scegliendone una il riquadro si porta sulla sua estensione.
const SORGENTE = 'stampa-area';
const STRATI = ['stampa-area-riempimento', 'stampa-area-linea'];
const M_PER_GRADO = 111320;
let promessa = null;

// Unità con nome, anello, centro e misure in metri del rettangolo che la contiene (nord in alto)
export function areaDaAnello(nome, anello) {
  const xs = anello.map(p => p[0]);
  const ys = anello.map(p => p[1]);
  const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const centro = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  return {
    nome, anello, bbox, centro,
    larghezza: (bbox[2] - bbox[0]) * Math.cos(centro[1] * Math.PI / 180) * M_PER_GRADO,
    altezza: (bbox[3] - bbox[1]) * M_PER_GRADO,
  };
}

// [{ id: 'comune'|'circoscrizioni'|'quartieri'|'upl', unita: [area…] }]: il Comune è l'unione delle circoscrizioni, le altre per nome
export function gruppiDaZone(zone) {
  const per = chiave => (zone?.[chiave] ?? []).filter(z => Array.isArray(z.ring) && z.ring.length > 3);
  const circ = per('circoscrizioni');
  const gruppi = [];
  if (circ.length) {
    const comune = areaDaAnello('Palermo', circ.flatMap(c => c.ring));
    const [o, s, e, n] = comune.bbox;
    comune.anello = [[o, n], [e, n], [e, s], [o, s], [o, n]]; // le circoscrizioni sono anelli separati: si disegna il rettangolo che le contiene
    gruppi.push({ id: 'comune', unita: [comune] });
  }
  for (const id of ['circoscrizioni', 'quartieri', 'upl']) {
    const unita = per(id).map(z => areaDaAnello(z.name, z.ring)).sort((a, b) => a.nome.localeCompare(b.nome, 'it', { numeric: true }));
    if (unita.length) gruppi.push({ id, unita });
  }
  return gruppi;
}

export function caricaAree() {
  promessa ??= import('./config.js').then(({ urlDati }) => fetch(urlDati('popolazione/confini_zone.json'))).then(r => r.json()).then(gruppiDaZone).catch(() => { promessa = null; return []; });
  return promessa;
}

// Contorno dell'area scelta (il Comune non ha un anello unico: si disegna il rettangolo che lo contiene)
export function mostraArea(map, area) {
  const dati = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [area.anello] } };
  if (map.getSource(SORGENTE)) { map.getSource(SORGENTE).setData(dati); return; }
  map.addSource(SORGENTE, { type: 'geojson', data: dati });
  map.addLayer({ id: STRATI[0], type: 'fill', source: SORGENTE, paint: { 'fill-color': '#0b4f7a', 'fill-opacity': 0.08 } });
  map.addLayer({ id: STRATI[1], type: 'line', source: SORGENTE, paint: { 'line-color': '#0b4f7a', 'line-width': 2.5, 'line-dasharray': [4, 2] } });
}

export function nascondiArea(map) {
  for (const id of STRATI) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(SORGENTE)) map.removeSource(SORGENTE);
}

export const STRATI_AREA = STRATI;
