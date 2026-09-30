// Logica pura sugli indicatori di popolazione: nessuna dipendenza dal browser.

const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);

function quota(r, campi) {
  const p = num(r.P1);
  if (!p) return null; // null o 0 residenti: nessuna percentuale
  let somma = 0;
  for (const c of campi) {
    const v = num(r[c]);
    if (v === null) return null;
    somma += v;
  }
  return 100 * somma / p;
}

export const INDICATORI = {
  residenti: { etichetta: 'Residenti', unita: 'ab.', calcola: r => num(r.P1) },
  densita: {
    etichetta: 'Densità', unita: 'ab/ha',
    calcola: r => {
      const p = num(r.P1), a = num(r.Area);
      return p !== null && a ? p / (a / 10000) : null;
    },
  },
  under15: { etichetta: 'Under 15', unita: '%', calcola: r => quota(r, ['P14', 'P15', 'P16']) },
  over74: { etichetta: 'Over 74', unita: '%', calcola: r => quota(r, ['P29']) },
};

// Soglie interne (n-1) per n classi a quantili, crescenti e senza duplicati.
export function quantili(valori, n) {
  const v = valori.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return [];
  const soglie = [];
  for (let i = 1; i < n; i++) {
    const s = v[Math.floor(i * v.length / n)];
    if (!soglie.length || s > soglie[soglie.length - 1]) soglie.push(s);
  }
  return soglie;
}
