// Decodifica dei dati tabellari compatti (scripts/compatta_dati.py): restituiscono la forma dei JSON originali.

// { campo: [valori…] } -> [{ campo: valore, … }, …]
export function daColonne(colonne) {
  const campi = Object.keys(colonne);
  const n = campi.length ? colonne[campi[0]].length : 0;
  return Array.from({ length: n }, (_, i) => Object.fromEntries(campi.map(c => [c, colonne[c][i]])));
}

// Gruppi di orari [d, s, primo, differenze…] -> { d, s, t: [orari crescenti] }
export function decodificaOrari(orari) {
  const gruppo = ([d, s, primo, ...diff]) => {
    let t = primo;
    return { d, s, t: [primo, ...diff.map(x => (t += x))] };
  };
  const fermate = {};
  for (const [stop, rotte] of Object.entries(orari.fermate)) {
    fermate[stop] = Object.fromEntries(Object.entries(rotte).map(([route, gruppi]) => [route, gruppi.map(gruppo)]));
  }
  return { ...orari, fermate };
}

// { via: [civici, lon, lat] } (micro-gradi in differenze) -> { via: { civico: [lon, lat] } }
export function decodificaCivici(indice) {
  const somma = diff => { let acc = 0; return diff.map(x => (acc += x)); };
  const indiceVie = {};
  for (const [via, [civici, lon, lat]] of Object.entries(indice)) {
    const x = somma(lon), y = somma(lat);
    indiceVie[via] = Object.fromEntries(civici.map((c, i) => [c, [x[i] / 1e6, y[i] / 1e6]]));
  }
  return indiceVie;
}

// File dei civici in cui sta una via: hash FNV-1a del nome su 32 file (per iniziale quasi tutte le vie finirebbero sotto «V» di «Via»).
// Stessa regola di scripts/compatta_dati.py (chiave_sezione).
export const SEZIONI_CIVICI = 32;
export function chiaveSezione(via) {
  let h = 0x811c9dc5;
  for (let i = 0; i < via.length; i++) h = Math.imul(h ^ via.charCodeAt(i), 0x01000193) >>> 0;
  return String(h % SEZIONI_CIVICI).padStart(2, '0');
}
