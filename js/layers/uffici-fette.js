// Modello puro del marker delle sedi degli uffici: una fetta per area, grande quanto gli uffici dell'area in quella sede.
// `accese` = insieme delle aree attive nella legenda (null = tutte).

const R_MIN = 9;
const R_MAX = 28;

// Aree della sede con colore e numero di uffici, la più numerosa per prima.
export function fette(uffici, accese = null) {
  const per = new Map();
  for (const u of uffici ?? []) {
    if (accese && !accese.has(u.area)) continue;
    const f = per.get(u.area) ?? { area: u.area, colore: u.colore, n: 0 };
    f.n += 1;
    per.set(u.area, f);
  }
  return [...per.values()].sort((a, b) => b.n - a.n || a.area.localeCompare(b.area, 'it'));
}

// Raggio in pixel: cresce con il logaritmo degli uffici, così 1 e 95 uffici restano entrambi leggibili.
export const raggio = n => Math.min(R_MAX, Math.round(R_MIN + 3 * Math.log2(Math.max(1, n))));

// Archi dell'anello in radianti, dalle ore 12 in senso orario; una sola fetta = cerchio intero.
export function archi(lista) {
  const tot = lista.reduce((s, f) => s + f.n, 0);
  let da = -Math.PI / 2;
  return lista.map(f => {
    const a = da + (2 * Math.PI * f.n) / tot;
    const arco = { colore: f.colore, area: f.area, da, a };
    da = a;
    return arco;
  });
}

// Aree distinte dell'intero elenco di sedi, con colore e totale uffici (per la legenda), ordinate per nome.
export function areeDaSedi(sedi) {
  const per = new Map();
  for (const s of sedi) for (const f of fette(s.uffici)) {
    const x = per.get(f.area) ?? { area: f.area, colore: f.colore, n: 0 };
    x.n += f.n;
    per.set(f.area, x);
  }
  return [...per.values()].sort((a, b) => a.area.localeCompare(b.area, 'it'));
}
