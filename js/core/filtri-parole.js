import { normalizza } from './indirizzi.js';
import { t, localeIntl } from './i18n.js';

// Filtri scritti a parole, per il Chat bot: «PNRR sopra 1 milione», «opere sotto 500 mila euro», «incidenti mortali 2022».
// `leggiFiltro(testo)` → { strato: 'pnrr' | 'opere' | 'incidenti', min, max, anno, gravita } o null se la frase non ne contiene uno.
// Il filtro per importo lo applicano i layer PNRR e opere all'evento `dt:filtro-importo` ({ strato, min, max }); gli incidenti il pannello Filtri.
export const EVENTO_IMPORTO = 'dt:filtro-importo';

const STRATI = [['pnrr', /\bPNRR\b/], ['opere', /\b(OPERE|LAVORI|WORKS)\b/], ['incidenti', /\b(INCIDENT\w*|SINISTR\w*|CRASH\w*|ACCIDENT\w*)\b/]];
const ANNI = [2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023]; // come ANNI in layers/sicurezza-filtro.js (il 2019 non è nel dataset)
const GRAVITA = [['M', /\b(MORTAL\w*|MORT[IE]|FATAL\w*|DEADLY)\b/], ['R', /\b(PROGNOSI RISERVATA|RISERVATA|SERIOUS\w*)\b/], ['F', /\b(FERIT\w*|INJUR\w*)\b/], ['C', /\b(SOLO DANNI|DANNI A COSE|PROPERTY DAMAGE)\b/]];

const SOPRA = '(?:sopra|oltre|più di|piu di|maggiore di|superiore a|almeno|over|above|more than|at least)'; // i18n-ok: vocabolario di ricerca
const SOTTO = '(?:sotto|meno di|fino a|minore di|inferiore a|al massimo|under|below|less than|up to|at most)'; // i18n-ok: vocabolario di ricerca
const NUMERO = '(\\d[\\d.,]*)\\s*(milion[ei]|mln|mila|migliaia|k|million|thousand|m)?\\b';
const REGOLA_SOPRA = new RegExp(`\\b${SOPRA}\\s+(?:di\\s+)?${NUMERO}`, 'i');
const REGOLA_SOTTO = new RegExp(`\\b${SOTTO}\\s+(?:di\\s+)?${NUMERO}`, 'i');

// «1.500.000», «1,5», «1.5», «1,500,000» → numero. Un gruppo di tre cifre dopo un separatore è un migliaio.
function leggiNumero(s) {
  const migliaia = /^\d{1,3}([.,]\d{3})+$/.test(s);
  return Number(migliaia ? s.replace(/[.,]/g, '') : s.replace(',', '.'));
}
const MOLTIPLICATORE = { milione: 1e6, milioni: 1e6, mln: 1e6, million: 1e6, m: 1e6, mila: 1e3, migliaia: 1e3, k: 1e3, thousand: 1e3 };

function importo(regola, testo) {
  const m = testo.match(regola);
  if (!m) return null;
  const n = leggiNumero(m[1]) * (MOLTIPLICATORE[(m[2] ?? '').toLowerCase()] ?? 1);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function leggiFiltro(testo) {
  const q = normalizza(testo);
  const strato = STRATI.find(([, r]) => r.test(q))?.[0];
  if (!strato) return null;
  if (strato === 'incidenti') {
    const anno = ANNI.find(a => new RegExp(`\\b${a}\\b`).test(q)) ?? null;
    const gravita = GRAVITA.find(([, r]) => r.test(q))?.[0] ?? null;
    return anno || gravita ? { strato, anno, gravita } : null;
  }
  const min = importo(REGOLA_SOPRA, testo);
  const max = importo(REGOLA_SOTTO, testo);
  return min || max ? { strato, min, max } : null;
}

// Importo in euro, per la legenda e per la risposta
const euro = n => `${Math.round(n).toLocaleString(localeIntl())} €`;
export function descriviImporto({ min = null, max = null } = {}) {
  if (min && max) return t('filtroImporto.tra', { min: euro(min), max: euro(max) });
  if (min) return t('filtroImporto.sopra', { n: euro(min) });
  if (max) return t('filtroImporto.sotto', { n: euro(max) });
  return '';
}

// L'importo `valore` rientra nei limiti? Senza limiti ogni voce è ammessa; con limiti, una voce senza importo no.
export function ammessoImporto(valore, { min = null, max = null } = {}) {
  if (!min && !max) return true;
  if (valore == null || !Number.isFinite(Number(valore))) return false;
  return (!min || valore >= min) && (!max || valore <= max);
}

// Espressione MapLibre per lo stesso filtro (null senza limiti)
export function espressioneImporto(campo, { min = null, max = null } = {}) {
  const c = [min && ['>=', ['to-number', ['get', campo], -1], min], max && ['all', ['>=', ['to-number', ['get', campo], -1], 0], ['<=', ['to-number', ['get', campo], -1], max]]].filter(Boolean);
  return c.length ? ['all', ...c] : null;
}
