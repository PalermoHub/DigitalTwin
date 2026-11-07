// Statistiche degli edifici di una particella: tessere, classi di altezza, edifici più grandi.
// Modulo puro: riceve `edifici` di analizzaParticella ([{ area, altezza|null, uso|null, cavallo }]). Classi come in «Palermo ordinata».

// Limite superiore (m) di ogni classe d'altezza; l'ultima è aperta
export const CLASSI_ALTEZZA = [
  { chiave: 'a3', max: 3 }, { chiave: 'a6', max: 6 }, { chiave: 'a12', max: 12 },
  { chiave: 'a18', max: 18 }, { chiave: 'a30', max: 30 }, { chiave: 'oltre', max: Infinity },
];
export const PRIME = 5; // edifici nella classifica

export function mediana(valori) {
  if (!valori.length) return null;
  const v = [...valori].sort((a, b) => a - b), m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

const classeAltezza = h => CLASSI_ALTEZZA.findIndex(c => h <= c.max);
const famiglia = u => (typeof u === 'string' && /^[A-Z]{3}/.test(u) ? u.slice(0, 3) : u);
const usoNoto = u => u != null && u !== '' && !String(u).startsWith('UNK');

export function statisticheEdifici(edifici) {
  const n = edifici.length;
  if (!n) return null;
  const impronta = edifici.reduce((a, e) => a + e.area, 0);
  const alti = edifici.filter(e => e.altezza != null).map(e => e.altezza);
  const usi = new Map();
  for (const e of edifici) if (usoNoto(e.uso)) usi.set(famiglia(e.uso), (usi.get(famiglia(e.uso)) ?? 0) + 1);
  const prevalente = [...usi.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const perAltezza = CLASSI_ALTEZZA.map(c => ({ chiave: c.chiave, n: 0, m2: 0 }));
  let ignote = { n: 0, m2: 0 };
  for (const e of edifici) {
    const c = e.altezza == null ? ignote : perAltezza[classeAltezza(e.altezza)];
    c.n++; c.m2 += e.area;
  }
  return {
    n, impronta, mediaM2: impronta / n, medianaM2: mediana(edifici.map(e => e.area)),
    altezzaMediana: mediana(alti), altezzaMax: alti.length ? Math.max(...alti) : null, conQuota: alti.length,
    usoPrevalente: prevalente ? prevalente[0] : null, conUso: [...usi.values()].reduce((a, v) => a + v, 0),
    classiAltezza: perAltezza.filter(c => c.n), altezzaIgnota: ignote.n ? ignote : null,
    piuGrandi: [...edifici].sort((a, b) => b.area - a.area).slice(0, PRIME),
  };
}
