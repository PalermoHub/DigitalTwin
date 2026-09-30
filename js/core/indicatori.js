// Logica pura sugli indicatori di popolazione: nessuna dipendenza dal browser.
// Restano solo gli indicatori che hanno già una rampa di colori nell'app originale
// (palermo_popolazione/js/palette.js): `rampa` è la chiave per densityStops().

const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);

// Campi ISTAT come in palermo_popolazione/js/topics.js (AGE_BANDS): 0-14 e 65+, maschi e femmine.
const SOTTO_15 = ['P30', 'P31', 'P32', 'P67', 'P68', 'P69'];
const SOPRA_64 = ['P43', 'P44', 'P45', 'P80', 'P81', 'P82'];
const somma = (r, campi) => campi.reduce((s, c) => s + (typeof r[c] === 'number' ? r[c] : 0), 0);

export const INDICATORI = {
  densita: {
    etichetta: 'Densità', unita: 'ab/ha', rampa: 'popolazione',
    calcola: r => {
      const p = num(r.P1), a = num(r.Area);
      return p !== null && a ? p / (a / 10000) : null;
    },
  },
  vecchiaia: {
    etichetta: 'Indice di vecchiaia', unita: '', rampa: 'vecchiaia',
    // stessa formula di computeVecchiaiaById: 65+ ogni 100 residenti 0-14, un decimale
    calcola: r => {
      const sotto = somma(r, SOTTO_15);
      return sotto > 0 ? Math.round(somma(r, SOPRA_64) / sotto * 1000) / 10 : null;
    },
  },
};
