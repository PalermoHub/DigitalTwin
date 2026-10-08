// Modello puro della scheda «Isola di calore»: temperatura superficiale estiva 2025 della sezione censuaria,
// scarto dalla media comunale, variazione dal 2019 e, sotto, il grafico 2019–2025 (costruito dal layer).
import { righe } from '../core/scheda-util.js';
import { localeIntl } from '../core/i18n.js';

export const FONTE = 'Fonte: Landsat 8/9 (USGS), temperatura superficiale terrestre estiva, elaborata per sezione censuaria ISTAT. Non è la temperatura dell\'aria.';
export const PESO_ISOLA_CALORE = 80; // tab «Terreno» della scheda

const gradi = v => `${v.toLocaleString(localeIntl(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
// i dati hanno due decimali: si arrotonda la differenza prima, così l'errore dei decimali binari non sposta il decimo mostrato
const conSegno = d => { const v = Math.round(d * 100) / 100; return `${v > 0 ? '+' : v < 0 ? '−' : ''}${gradi(Math.abs(v))}`; };

// `grafico`: funzione che costruisce il grafico (DOM) per questa sezione; assente nei test.
export function voceIsolaCalore(p, dati, grafico = null) {
  const ultimo = dati.anno;
  const t = p[`LST_${ultimo}`];
  if (t == null) return null;
  const primo = dati.anni[0];
  const mediaComune = dati.serie.media[dati.serie.anni.indexOf(ultimo)];
  const prima = p[`LST_${primo}`];
  return {
    chiave: `isolacalore-${p.sez}`, peso: PESO_ISOLA_CALORE, strato: 'isole-calore', titolo: 'Isola di calore', icona: 'caldo', badge: gradi(t), sempre: true,
    gruppi: [{ righe: righe([
      ['Temperatura estiva', `${gradi(t)} (${ultimo})`],
      ['Rispetto alla media comunale', conSegno(t - mediaComune)],
      [`Variazione dal ${primo}`, prima != null ? conSegno(t - prima) : null],
    ]) }],
    ...(grafico && { dinamico: grafico }),
    link: { testo: 'Studio completo sulle isole di calore', url: dati.link, icona: 'esterno', suggerimento: 'Mappe per anno, bivariata e «isola vera» depurata dal territorio' },
    fonte: FONTE,
  };
}
