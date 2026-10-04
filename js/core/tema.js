// Colore uniforme dei poligoni per strato: parte pura (validazione, applicazione alla mappa, salvataggio e file JSON).
// Il pannello che lo usa sta in pannello-tema.js.
const CHIAVE = 'dt-temi-strati';
const VERSIONE = 1;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MAX_SPESSORE = 10;
const MAX_CATEGORIE = 200;

// Colore nel formato #rrggbb richiesto da <input type=color>; `ripiego` se il valore non è un colore semplice
// (espressione MapLibre, nome, assente).
export function comeEsadecimale(valore, ripiego = '#888888') {
  if (typeof valore !== 'string') return ripiego;
  const v = valore.trim();
  if (HEX.test(v)) return (v.length === 4 ? '#' + [...v.slice(1)].map(c => c + c).join('') : v).toLowerCase();
  const m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(v);
  if (m) return '#' + m.slice(1, 4).map(n => Math.min(255, Number(n)).toString(16).padStart(2, '0')).join('');
  return ripiego;
}

// Tema ripulito: solo campi validi; null se non resta nulla. { riempimento?, bordo?, spessore? }
export function validaTema(t) {
  if (!t || typeof t !== 'object') return null;
  const r = {};
  if (typeof t.riempimento === 'string' && HEX.test(t.riempimento)) r.riempimento = comeEsadecimale(t.riempimento);
  if (typeof t.bordo === 'string' && HEX.test(t.bordo)) r.bordo = comeEsadecimale(t.bordo);
  if (typeof t.spessore === 'number' && Number.isFinite(t.spessore) && t.spessore >= 0 && t.spessore <= MAX_SPESSORE) r.spessore = t.spessore;
  if (t.categorie && typeof t.categorie === 'object') {
    const c = Object.fromEntries(Object.entries(t.categorie).slice(0, MAX_CATEGORIE)
      .filter(([k, v]) => k.length <= 100 && typeof v === 'string' && HEX.test(v)).map(([k, v]) => [k, comeEsadecimale(v)]));
    if (Object.keys(c).length) r.categorie = c;
  }
  return Object.keys(r).length ? r : null;
}

// Colori per categoria: espressione `['match', ['get', campo], valore, colore, ..., ripiego]` con valori testuali e colori semplici.
// Restituisce { campo, voci: [[valore, colore]], ripiego } oppure null se il colore non è di questo tipo.
export function leggiMatch(espressione) {
  if (!Array.isArray(espressione) || espressione[0] !== 'match') return null;
  const [, input, ...resto] = espressione;
  if (!Array.isArray(input) || input[0] !== 'get' || typeof input[1] !== 'string' || resto.length % 2 !== 1) return null;
  const voci = [];
  for (let i = 0; i < resto.length - 1; i += 2) {
    if (typeof resto[i] === 'string' && typeof resto[i + 1] === 'string') voci.push([resto[i], resto[i + 1]]);
  }
  return voci.length ? { campo: input[1], voci, ripiego: resto.at(-1) } : null;
}

// La stessa espressione con i colori sostituiti da `sostituti` ({ valore: #rrggbb }).
export function riscriviMatch(espressione, sostituti) {
  const copia = [...espressione];
  for (let i = 2; i < copia.length - 1; i += 2) {
    if (typeof copia[i] === 'string' && sostituti[copia[i]]) copia[i + 1] = sostituti[copia[i]];
  }
  return copia;
}

const PROPRIETA_COLORE = { fill: 'fill-color', circle: 'circle-color' };

// Layer dello strato che il tema colora:
// - riempimenti: poligoni (esclusi quelli trasparenti di sola selezione), per il bordo;
// - uniformi: i riempimenti con un colore semplice, su cui vale «Riempimento»; gli altri (per categoria o dato)
//   non si sovrascrivono con un colore solo, per non perdere la tematizzazione;
// - categorie: layer con colore per categoria, ciascuno col suo `match`, per colorare ogni categoria;
// - linee: linee dello stesso strato (bordi).
export function partiStrato(map, ids) {
  const p = { riempimenti: [], uniformi: [], categorie: [], linee: [] };
  for (const id of ids) {
    const l = map.getLayer(id);
    if (!l) continue;
    if (l.type === 'line') p.linee.push(id);
    const prop = PROPRIETA_COLORE[l.type];
    if (!prop) continue;
    if (l.type === 'fill' && map.getPaintProperty(id, 'fill-opacity') === 0) continue;
    const colore = map.getPaintProperty(id, prop);
    const m = leggiMatch(colore);
    if (m) p.categorie.push({ id, prop, ...m });
    else if (l.type === 'fill' && (colore == null || typeof colore === 'string')) p.uniformi.push(id);
    if (l.type === 'fill') p.riempimenti.push(id);
  }
  return p;
}

// Applica il tema; un campo assente ripristina il valore originale (ricordato in `originali` alla prima modifica).
export function applicaTema(map, parti, tema, originali) {
  const imposta = (id, prop, valore) => {
    const k = `${id}|${prop}`;
    if (valore === undefined && !originali.has(k)) return;
    if (!originali.has(k)) originali.set(k, map.getPaintProperty(id, prop) ?? null);
    map.setPaintProperty(id, prop, valore === undefined ? originali.get(k) : valore);
  };
  for (const id of parti.uniformi) imposta(id, 'fill-color', tema?.riempimento);
  for (const id of parti.riempimenti) imposta(id, 'fill-outline-color', tema?.bordo);
  for (const id of parti.linee) {
    imposta(id, 'line-color', tema?.bordo);
    imposta(id, 'line-width', tema?.spessore);
  }
  for (const { id, prop } of parti.categorie) {
    const k = `${id}|${prop}`;
    if (!tema?.categorie && !originali.has(k)) continue;
    if (!originali.has(k)) originali.set(k, map.getPaintProperty(id, prop));
    const base = originali.get(k);
    map.setPaintProperty(id, prop, tema?.categorie ? riscriviMatch(base, tema.categorie) : base);
  }
}

// Temi salvati: { idStrato: tema }. Lo storage può mancare o rifiutare la scrittura.
export function leggiTemi(storage) {
  try {
    const grezzo = JSON.parse(storage?.getItem(CHIAVE)) ?? {};
    return Object.fromEntries(Object.entries(grezzo).map(([id, t]) => [id, validaTema(t)]).filter(([, t]) => t));
  } catch { return {}; }
}
export function salvaTemi(storage, temi) {
  try { storage.setItem(CHIAVE, JSON.stringify(temi)); } catch { /* il tema vale per la sessione */ }
}

// File JSON: { versione, strati: { idStrato: tema } }
export function esportaTemi(temi) {
  return JSON.stringify({ versione: VERSIONE, strati: temi }, null, 2);
}
export function importaTemi(testo) {
  let o;
  try { o = JSON.parse(testo); } catch { throw new Error('File non valido: non è un JSON'); }
  if (o?.versione !== VERSIONE || !o.strati || typeof o.strati !== 'object') throw new Error('File non valido: non è un tema di strati');
  const temi = Object.fromEntries(Object.entries(o.strati).map(([id, t]) => [id, validaTema(t)]).filter(([, t]) => t));
  if (!Object.keys(temi).length) throw new Error('Il file non contiene temi validi');
  return temi;
}
