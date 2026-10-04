// Riordino degli strati nel pannello: in alto nell'elenco = sopra sulla mappa. Qui la parte pura (testabile);
// il collegamento al DOM sta in pannello.js.
export const CHIAVE = 'dt-ordine-strati';

// Copia di `a` con l'elemento in `da` portato in `a_` (limitato ai bordi).
export function sposta(a, da, a_) {
  const r = [...a];
  const [x] = r.splice(da, 1);
  r.splice(Math.max(0, Math.min(r.length, a_)), 0, x);
  return r;
}

// `ids` nell'ordine salvato; quelli non salvati (strati nuovi) vanno in coda nell'ordine originale.
export function ordina(ids, salvato) {
  if (!Array.isArray(salvato)) return [...ids];
  const posto = id => { const i = salvato.indexOf(id); return i < 0 ? Infinity : i; };
  return ids.map((id, i) => ({ id, i })).sort((a, b) => posto(a.id) - posto(b.id) || a.i - b.i).map(x => x.id);
}

// Mosse `[id, prima]` (come map.moveLayer) per far disegnare gli strati nell'ordine dell'elenco.
// `stack` = id dei layer della mappa dal basso; `strati` = layer di ogni strato, dal primo dell'elenco (sopra) in giù.
// I layer del gruppo si compattano nella posizione del più alto; dentro uno strato resta l'ordine che hanno già.
export function mosseMappa(stack, strati) {
  const indice = new Map(stack.map((id, i) => [id, i]));
  return mosseSequenza(stack, [...strati].reverse().flatMap(ids => ids.filter(id => indice.has(id)).sort((a, b) => indice.get(a) - indice.get(b))));
}

// Le stesse mosse per una sequenza di layer data dal basso verso l'alto (usata anche per tornare all'ordine iniziale).
export function mosseSequenza(stack, bersaglio) {
  const indice = new Map(stack.map((id, i) => [id, i]));
  bersaglio = bersaglio.filter(id => indice.has(id));
  if (!bersaglio.length) return [];
  const insieme = new Set(bersaglio);
  const cima = Math.max(...bersaglio.map(id => indice.get(id)));
  const rif = stack[cima + 1]; // sopra al più alto non c'è nessun layer del gruppo
  const resto = stack.filter(id => !insieme.has(id));
  const dopo = [...resto.slice(0, rif === undefined ? resto.length : resto.indexOf(rif)), ...bersaglio, ...(rif === undefined ? [] : resto.slice(resto.indexOf(rif)))];
  if (dopo.every((id, i) => id === stack[i])) return [];
  return bersaglio.map((id, k) => [id, k === bersaglio.length - 1 ? rif : bersaglio[k + 1]]).reverse();
}

export function applicaMosse(map, mosse) {
  for (const [id, prima] of mosse) map.moveLayer(id, prima);
}

// Ordine salvato per gruppo: { gruppo: [idStrato, ...] }. Lo storage può mancare o rifiutare la scrittura.
export function leggiOrdine(storage) {
  try { return JSON.parse(storage?.getItem(CHIAVE)) ?? {}; } catch { return {}; }
}
export function salvaOrdine(storage, gruppo, ids) {
  try { storage.setItem(CHIAVE, JSON.stringify({ ...leggiOrdine(storage), [gruppo]: ids })); } catch { /* ordine solo per la sessione */ }
}
export function azzeraOrdine(storage, gruppo) {
  try {
    const { [gruppo]: _, ...resto } = leggiOrdine(storage);
    storage.setItem(CHIAVE, JSON.stringify(resto));
  } catch { /* niente da azzerare */ }
}
