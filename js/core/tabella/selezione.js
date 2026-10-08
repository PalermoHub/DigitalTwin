// Quali righe e quali colonne finiscono nel file esportato. Funzioni pure: restituiscono sempre un nuovo stato.

export const nuovoStato = () => ({ sel: new Set(), ultimo: null });

export function commutaRiga(stato, chiave, ordine, maiusc = false) {
  const sel = new Set(stato.sel);
  const spuntare = !sel.has(chiave);
  const applica = k => (spuntare ? sel.add(k) : sel.delete(k));
  const da = ordine.indexOf(stato.ultimo);
  const a = ordine.indexOf(chiave);
  if (maiusc && stato.ultimo != null && da >= 0 && a >= 0) {
    for (let i = Math.min(da, a); i <= Math.max(da, a); i++) applica(ordine[i]);
  } else applica(chiave);
  return { sel, ultimo: chiave };
}

export const tutte = (stato, ordine) => ({ sel: new Set([...stato.sel, ...ordine]), ultimo: stato.ultimo });

export function nessuna(stato, ordine) {
  const sel = new Set(stato.sel);
  for (const k of ordine) sel.delete(k);
  return { sel, ultimo: stato.ultimo };
}

export function inverti(stato, ordine) {
  const sel = new Set(stato.sel);
  for (const k of ordine) { if (sel.has(k)) sel.delete(k); else sel.add(k); }
  return { sel, ultimo: stato.ultimo };
}

export function statoTutte(stato, ordine) {
  const n = ordine.filter(k => stato.sel.has(k)).length;
  if (n === 0) return 'nessuna';
  return n === ordine.length ? 'tutte' : 'parziale';
}

export function righeDaEsportare(righe, stato) {
  const scelte = righe.filter(r => stato.sel.has(r.chiave));
  return scelte.length ? scelte : righe;
}

// «visibile» e «esporta» partono uguali: nascondere una colonna la toglie dal file, mostrarla la rimette; «esporta» da solo no.
export function commutaColonna(colonne, campo, chiave) {
  return colonne.map(c => {
    if (c.campo !== campo) return c;
    if (chiave === 'visibile') { const v = !c.visibile; return { ...c, visibile: v, esporta: v }; }
    return { ...c, esporta: !c.esporta };
  });
}

export function spostaColonna(colonne, campo, delta) {
  const i = colonne.findIndex(c => c.campo === campo);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= colonne.length) return colonne;
  const fuori = [...colonne];
  [fuori[i], fuori[j]] = [fuori[j], fuori[i]];
  return fuori;
}

export const colonneDaEsportare = colonne => colonne.filter(c => c.esporta);
