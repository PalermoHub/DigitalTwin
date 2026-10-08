// Righe, colonne, ordinamento e filtro della tabella. Nessun DOM e nessuna mappa: si prova con node.

// Testo di una cella. MapLibre trasforma array e oggetti delle proprietà in testo JSON: un array serializzato si rilegge.
export function cella(v) {
  if (v == null) return '';
  if (typeof v === 'string' && /^\[[\s\S]*\]$/.test(v)) {
    try { const a = JSON.parse(v); if (Array.isArray(a)) return cella(a); } catch { /* non è JSON: resta il testo */ }
    return v;
  }
  if (Array.isArray(v)) return v.map(cella).join('; ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function chiaveRiga(f, sorgente) {
  const p = f.properties ?? {};
  const k = sorgente.chiave?.(p);
  if (k != null && k !== '') return `${sorgente.id}:${k}`;
  const g = f.geometry;
  const posto = g?.type === 'Point' ? g.coordinates.map(c => c.toFixed(6)).join(',') : '';
  return `${sorgente.id}:${JSON.stringify(p)}@${posto}`;
}

// Feature di MapLibre → righe. Una feature tagliata dai tile arriva in più pezzi: stessa chiave, una riga, più geometrie.
export function normalizza(features, sorgente) {
  const righe = new Map();
  for (const f of features) {
    const chiave = chiaveRiga(f, sorgente);
    const g = f.geometry;
    const gia = righe.get(chiave);
    if (!gia) { righe.set(chiave, { chiave, layer: sorgente.id, proprieta: f.properties ?? {}, geometrie: g ? [g] : [] }); continue; }
    if (g && !gia.geometrie.some(x => uguali(x, g))) gia.geometrie.push(g);
  }
  return [...righe.values()];
}

export function geometriaUnita(riga) {
  const gs = riga.geometrie;
  if (!gs.length) return null;
  if (gs.length === 1) return gs[0];
  const tutte = tipi => gs.every(g => tipi.includes(g.type));
  if (tutte(['Polygon', 'MultiPolygon'])) return { type: 'MultiPolygon', coordinates: gs.flatMap(g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)) };
  if (tutte(['LineString', 'MultiLineString'])) return { type: 'MultiLineString', coordinates: gs.flatMap(g => (g.type === 'LineString' ? [g.coordinates] : g.coordinates)) };
  if (tutte(['Point', 'MultiPoint'])) return { type: 'MultiPoint', coordinates: gs.flatMap(g => (g.type === 'Point' ? [g.coordinates] : g.coordinates)) };
  return { type: 'GeometryCollection', geometries: gs };
}

export function colonneDa(righe) {
  const viste = new Map();
  for (const r of righe) for (const campo of Object.keys(r.proprieta)) if (!viste.has(campo)) viste.set(campo, { campo, visibile: true, esporta: true });
  return [...viste.values()];
}

// Spostando la vista compaiono campi nuovi: si aggiungono in coda, quelli già scelti restano come sono.
export function unisciColonne(attuali, righe) {
  const note = new Set(attuali.map(c => c.campo));
  return [...attuali, ...colonneDa(righe).filter(c => !note.has(c.campo))];
}

export function applicaPreferenze(colonne, pref) {
  if (!Array.isArray(pref)) return colonne;
  const perCampo = new Map(colonne.map(c => [c.campo, c]));
  const scelte = pref.filter(p => perCampo.has(p.campo)).map(p => ({ campo: p.campo, visibile: p.visibile !== false, esporta: p.esporta !== false }));
  const usati = new Set(scelte.map(c => c.campo));
  return [...scelte, ...colonne.filter(c => !usati.has(c.campo))];
}

// Colonne di partenza di una sorgente con `colonne`: quelle elencate in testa e visibili, tutte le altre nascoste.
export function preferenzeIniziali(colonne, campi) {
  if (!Array.isArray(campi)) return null;
  const note = new Set(colonne.map(c => c.campo));
  const scelte = campi.filter(c => note.has(c));
  const altre = colonne.map(c => c.campo).filter(c => !scelte.includes(c));
  return [...scelte.map(campo => ({ campo, visibile: true, esporta: true })), ...altre.map(campo => ({ campo, visibile: false, esporta: false }))];
}

const numerico = v => v !== '' && v != null && Number.isFinite(Number(v));

export function ordina(righe, campo, verso) {
  const segno = verso === 'giu' ? -1 : 1;
  return [...righe].sort((a, b) => {
    const x = a.proprieta[campo];
    const y = b.proprieta[campo];
    const vx = x == null || x === '';
    const vy = y == null || y === '';
    if (vx || vy) return vx === vy ? 0 : vx ? 1 : -1; // i vuoti restano in fondo in entrambi i versi
    if (numerico(x) && numerico(y)) return segno * (Number(x) - Number(y));
    return segno * cella(x).localeCompare(cella(y), 'it', { numeric: true, sensitivity: 'base' });
  });
}

export function filtra(righe, testo) {
  const q = String(testo ?? '').trim().toLowerCase();
  if (!q) return righe;
  return righe.filter(r => Object.values(r.proprieta).some(v => cella(v).toLowerCase().includes(q)));
}
