// Posizione della superficie di una particella nella distribuzione delle altre (dati di dati/catasto/analisi_particelle.json).
// Modulo puro. Percentile per interpolazione lineare in log(m²) tra p5..p95 (fuori intervallo: 2,5 / 97,5); su Palermo dall'istogramma.
const PQ = [5, 25, 50, 75, 95];

export function percentile(x, q) {
  if (!(x > 0) || !Array.isArray(q) || q.length < 5) return null;
  const l = Math.log(x), k = q.map(Math.log);
  if (l <= k[0]) return 2.5;
  if (l >= k[4]) return 97.5;
  const i = k.findIndex((v, j) => l < k[j + 1]);
  return PQ[i] + (PQ[i + 1] - PQ[i]) * (l - k[i]) / (k[i + 1] - k[i]);
}

export function percentileIstogramma(x, { edges, n }) {
  if (!(x > 0) || !edges || !n) return null;
  const tot = n.reduce((a, b) => a + b, 0);
  if (!tot) return null;
  let acc = 0;
  for (let i = 0; i < n.length; i++) {
    if (x >= edges[i + 1]) { acc += n[i]; continue; }
    return (acc + n[i] * Math.max(0, Math.log(x / edges[i]) / Math.log(edges[i + 1] / edges[i]))) / tot * 100;
  }
  return 100;
}

/* mq: superficie della particella; dati: il JSON; { foglio, zto: [codici], omi: [codici] }.
   Ritorna { foglio, palermo, zto: [{ codice, n, mediana, p }], omi: [...] }; mancano le parti senza dato. */
export function dimensioneRispetto(mq, dati, { foglio, zto = [], omi = [] } = {}) {
  if (!(mq > 0) || !dati) return null;
  const f = dati.fogli?.find(r => String(r.f) === String(foglio));
  const daClasse = (tab, codici) => codici.filter((c, i) => tab?.[c] && codici.indexOf(c) === i)
    .map(codice => ({ codice, n: tab[codice][0], mediana: tab[codice][3], p: percentile(mq, tab[codice].slice(1)) })).filter(r => r.p != null);
  const pf = f ? percentile(mq, f.q) : null;
  const pp = dati.hist ? percentileIstogramma(mq, dati.hist) : null;
  return {
    foglio: pf != null ? { foglio: String(foglio), n: f.n, mediana: f.q[2], p: pf } : null,
    palermo: pp != null ? { mediana: dati.mediana, p: pp } : null,
    zto: daClasse(dati.q_zto, zto),
    omi: daClasse(dati.q_omi, omi),
  };
}
