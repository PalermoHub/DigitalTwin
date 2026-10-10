// Tema dell'interfaccia scelto dall'utente: cinque colori di base (più cinque facoltativi, «avanzati») da cui si ricavano
// le variabili CSS di css/app.css, e la tipografia (dimensione del testo e carattere).
// Parte pura (validazione, calcolo dei colori derivati, contrasto, file JSON, memoria del browser); il pannello sta in pannello-interfaccia.js.
import { t as tr } from './i18n.js';

export const CHIAVE = 'dt-tema-ui';
export const VERSIONE = 2; // 1: solo cinque colori; 2: colori avanzati e tipografia (la 1 si legge ancora)
export const CAMPI = ['sfondo', 'testo', 'accento', 'link', 'bordo'];
// Colori semantici facoltativi: se l'utente non li sceglie valgono quelli standard del tema chiaro o scuro
export const CAMPI_EXTRA = ['positivo', 'pericolo', 'avviso', 'evidenza', 'dati'];
const VARIABILE_EXTRA = { positivo: '--positivo', pericolo: '--pericolo', avviso: '--avviso', evidenza: '--evidenza', dati: '--blu-dati' };
const EXTRA_STANDARD = {
  chiaro: { positivo: '#22a55a', pericolo: '#b42318', avviso: '#fff4ce', evidenza: '#e6007e', dati: '#1971c2' },
  scuro: { positivo: '#22a55a', pericolo: '#f87171', avviso: '#4a3d12', evidenza: '#e6007e', dati: '#74a7f0' },
};

export const PRESET = {
  chiaro: { sfondo: '#ffffff', testo: '#1b1f24', accento: '#f5a623', link: '#2f5fc7', bordo: '#d0d7de' },
  scuro: { sfondo: '#1c2128', testo: '#e6e9ed', accento: '#f5a623', link: '#7ea6ff', bordo: '#38414c' },
  contrasto: { sfondo: '#000000', testo: '#ffffff', accento: '#ffd400', link: '#8ab4ff', bordo: '#ffffff' },
  mare: { sfondo: '#f3f8fb', testo: '#12303f', accento: '#0e9ac0', link: '#0b5a8a', bordo: '#b9d3df' },
  bosco: { sfondo: '#f5f7f0', testo: '#1f2a1c', accento: '#5ea232', link: '#2b6a3a', bordo: '#cbd5bd' },
  sepia: { sfondo: '#f6efe0', testo: '#3b2f22', accento: '#c27c2c', link: '#8a4b12', bordo: '#d9cbb0' },
  lavanda: { sfondo: '#f6f3fb', testo: '#2a2140', accento: '#8b5cf6', link: '#5b3fb5', bordo: '#d8d0ec' },
  notte: { sfondo: '#0f1b2d', testo: '#e3ecf8', accento: '#38bdf8', link: '#8fc4ff', bordo: '#26405f' },
  tramonto: { sfondo: '#2a1a1f', testo: '#fbeae3', accento: '#fb7a4a', link: '#ffb48a', bordo: '#523039' },
  grigio: { sfondo: '#f2f2f2', testo: '#222222', accento: '#555555', link: '#1d4ed8', bordo: '#c8c8c8' },
  carta: { sfondo: '#fbf7f2', testo: '#2b2622', accento: '#c8553d', link: '#a63d28', bordo: '#e0d6ca' },
  menta: { sfondo: '#f1faf6', testo: '#12332a', accento: '#19a974', link: '#0b6b4d', bordo: '#bfe0d2' },
  rosa: { sfondo: '#fbf3f5', testo: '#3a1f28', accento: '#d6456f', link: '#a3204a', bordo: '#e8cdd6' },
  alba: { sfondo: '#fff8ec', testo: '#3a2a14', accento: '#f08a24', link: '#b4480a', bordo: '#ecd9b8' },
  grafite: { sfondo: '#181a1b', testo: '#e8e8e6', accento: '#3ecf8e', link: '#7fd1ae', bordo: '#34393b' },
  oceano: { sfondo: '#0b2239', testo: '#e6f1fa', accento: '#ff7a66', link: '#7cc4ff', bordo: '#234a6b' },
  violanotte: { sfondo: '#1a1530', testo: '#ece8fb', accento: '#b388ff', link: '#c4a8ff', bordo: '#3a3160' },
  terminale: { sfondo: '#000000', testo: '#33ff66', accento: '#33ff66', link: '#7dffa0', bordo: '#1f8f3d' },
  // Profili per chi non distingue alcuni colori: palette Okabe-Ito; positivo e pericolo non sono più verde e rosso
  daltonici: { sfondo: '#ffffff', testo: '#1a1a1a', accento: '#d55e00', link: '#0072b2', bordo: '#cfcfcf', positivo: '#0072b2', pericolo: '#d55e00', avviso: '#fff1b8', evidenza: '#cc79a7', dati: '#0072b2' },
  daltonici2: { sfondo: '#ffffff', testo: '#1a1a1a', accento: '#c8102e', link: '#007a87', bordo: '#cfcfcf', positivo: '#007a87', pericolo: '#c8102e', avviso: '#ffe9ea', evidenza: '#6a3d9a', dati: '#007a87' },
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// #rrggbb minuscolo, o null se non è un colore esadecimale
export function normalizza(v) {
  if (typeof v !== 'string' || !HEX.test(v.trim())) return null;
  const s = v.trim().toLowerCase();
  return s.length === 4 ? '#' + [...s.slice(1)].map(c => c + c).join('') : s;
}

const canali = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const comeHex = c => '#' + c.map(n => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('');

// `quota` (0-1) di `b` mescolata ad `a`
export function mescola(a, b, quota) {
  const ca = canali(a), cb = canali(b);
  return comeHex(ca.map((n, i) => n + (cb[i] - n) * quota));
}

export function luminanza(hex) {
  const [r, g, b] = canali(hex).map(n => { const s = n / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrasto(a, b) {
  const [x, y] = [luminanza(a), luminanza(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export const èScuro = colori => luminanza(colori.sfondo) < 0.18;
const inchiostroSu = fondo => (contrasto(fondo, '#000000') >= contrasto(fondo, '#ffffff') ? '#000000' : '#ffffff');

// Accento usato come testo o riempimento forte: si scurisce (o schiarisce) finché si legge sullo sfondo
function accentoForte(accento, sfondo, testo) {
  let c = accento;
  for (let i = 1; i <= 10 && contrasto(c, sfondo) < 4.5; i++) c = mescola(accento, testo, i / 10);
  return c;
}

// Tema ripulito: tutti e cinque i colori di base validi (gli avanzati solo se validi), altrimenti null
export function validaColori(colori) {
  if (!colori || typeof colori !== 'object') return null;
  const fuori = {};
  for (const c of CAMPI) {
    const v = normalizza(colori[c]);
    if (!v) return null;
    fuori[c] = v;
  }
  for (const c of CAMPI_EXTRA) {
    const v = normalizza(colori[c]);
    if (v) fuori[c] = v; // un colore avanzato non valido si scarta: il tema resta valido
  }
  return fuori;
}

// Variabili CSS ricavate dai cinque colori di base: nome → valore
export function variabili(colori) {
  const { sfondo, testo, accento, link, bordo } = colori;
  const forte = accentoForte(accento, sfondo, testo);
  const [r, g, b] = canali(accento);
  const scuro = èScuro(colori);
  const alfa = scuro ? 0.2 : 0.14;
  const extra = { ...EXTRA_STANDARD[scuro ? 'scuro' : 'chiaro'] };
  for (const c of CAMPI_EXTRA) if (colori[c]) extra[c] = colori[c];
  const [sr, sg, sb] = canali(sfondo);
  return {
    '--surface': sfondo,
    '--surface-alt': mescola(sfondo, testo, 0.04),
    '--surface-hover': mescola(sfondo, testo, 0.1),
    '--text': testo,
    '--text-muted': mescola(testo, sfondo, 0.3),
    '--border': bordo,
    '--border-ui': mescola(bordo, testo, 0.1),
    '--accent': accento,
    '--accent-ink': inchiostroSu(accento),
    '--accent-strong': forte,
    '--accent-strong-ink': inchiostroSu(forte),
    '--accent-soft': `rgba(${r}, ${g}, ${b}, ${alfa})`,
    '--link': link,
    '--focus': link,
    '--tooltip-bg': `rgba(${sr}, ${sg}, ${sb}, .97)`,
    '--tooltip-enfasi': forte,
    ...Object.fromEntries(CAMPI_EXTRA.map(c => [VARIABILE_EXTRA[c], extra[c]])),
  };
}

// I cinque colori avanzati in uso: quello scelto, o lo standard del tema chiaro o scuro
export function extraEffettivi(colori) {
  const base = EXTRA_STANDARD[èScuro(colori) ? 'scuro' : 'chiaro'];
  return Object.fromEntries(CAMPI_EXTRA.map(c => [c, colori[c] ?? base[c]]));
}

export const NOMI_VARIABILI = Object.keys(variabili(PRESET.chiaro));

// Tipografia: dimensione del testo in % (scala tutta l'interfaccia, che è in rem) e carattere
export const DIMENSIONE = { min: 85, max: 150, passo: 5, standard: 100 };
export const FONT = {
  montserrat: "'Montserrat', system-ui, sans-serif",
  sistema: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', Consolas, monospace",
  atkinson: "'Atkinson Hyperlegible', system-ui, sans-serif",
};
export const TIPOGRAFIA_STANDARD = { dimensione: DIMENSIONE.standard, font: 'montserrat' };
const VARIABILI_TIPOGRAFIA = ['--scala-testo', '--font-ui'];

export function validaTipografia(t) {
  const d = Math.round(Number(t?.dimensione));
  return {
    dimensione: Number.isFinite(d) ? Math.min(DIMENSIONE.max, Math.max(DIMENSIONE.min, d)) : DIMENSIONE.standard,
    font: Object.hasOwn(FONT, t?.font) ? t.font : 'montserrat',
  };
}
const èStandard = t => t.dimensione === DIMENSIONE.standard && t.font === 'montserrat';

// Solo ciò che si discosta dallo standard: con tipografia standard non si imposta nulla
export function variabiliTipografia(t) {
  const { dimensione, font } = validaTipografia(t);
  const v = {};
  if (dimensione !== DIMENSIONE.standard) v['--scala-testo'] = String(dimensione / 100);
  if (font !== 'montserrat') v['--font-ui'] = FONT[font];
  return v;
}

export function applicaTipografia(radice, t) {
  for (const n of VARIABILI_TIPOGRAFIA) radice.style.removeProperty(n);
  for (const [n, v] of Object.entries(variabiliTipografia(t))) radice.style.setProperty(n, v);
}

// Coppie che devono restare leggibili (soglie WCAG: 4.5 per il testo, 3 per i componenti)
export function controlli(colori) {
  return [
    { id: 'testo', rapporto: contrasto(colori.testo, colori.sfondo), minimo: 4.5 },
    { id: 'link', rapporto: contrasto(colori.link, colori.sfondo), minimo: 4.5 },
    { id: 'accento', rapporto: contrasto(colori.accento, colori.sfondo), minimo: 3 },
  ].map(c => ({ ...c, ok: c.rapporto >= c.minimo }));
}

// Applica (o toglie, con `colori` null) le variabili alla radice del documento. Restituisce true se il tema è scuro.
export function applica(radice, colori) {
  for (const n of NOMI_VARIABILI) radice.style.removeProperty(n);
  if (!colori) return null;
  for (const [n, v] of Object.entries(variabili(colori))) radice.style.setProperty(n, v);
  return èScuro(colori);
}

// Memoria del browser: { versione, colori, tipografia, vars, scuro } — `vars` e `scuro` servono allo script in <head>, che applica
// il tema prima del disegno; `scuro` è null quando non c'è un tema di colori (lo script non tocca allora chiaro/scuro).
function leggiGrezzo(storage) {
  try {
    const o = JSON.parse(storage?.getItem(CHIAVE));
    return o && (o.versione === 1 || o.versione === VERSIONE) ? o : null;
  } catch { return null; }
}
export const leggi = storage => validaColori(leggiGrezzo(storage)?.colori);
export const leggiTipografia = storage => validaTipografia(leggiGrezzo(storage)?.tipografia);
export function salva(storage, colori, tipografia = TIPOGRAFIA_STANDARD) {
  try {
    const t = validaTipografia(tipografia);
    if (!colori && èStandard(t)) storage.removeItem(CHIAVE);
    else {
      storage.setItem(CHIAVE, JSON.stringify({
        versione: VERSIONE,
        colori: colori ?? null,
        tipografia: t,
        vars: { ...(colori ? variabili(colori) : {}), ...variabiliTipografia(t) },
        scuro: colori ? èScuro(colori) : null,
      }));
    }
  } catch { /* il tema vale per la sessione */ }
}

// File JSON sul computer dell'utente: { tipo, versione, colori, tipografia }
const TIPO = 'dt-tema-interfaccia';
export function esporta(colori, tipografia = TIPOGRAFIA_STANDARD) {
  return JSON.stringify({ tipo: TIPO, versione: VERSIONE, colori, tipografia: validaTipografia(tipografia) }, null, 2);
}
export function importa(testo) {
  let o;
  try { o = JSON.parse(testo); } catch { throw new Error(tr('tui.fileNonJson')); }
  if (o?.tipo !== TIPO || (o.versione !== 1 && o.versione !== VERSIONE)) throw new Error(tr('tui.fileNonTema'));
  const colori = validaColori(o.colori);
  if (!colori) throw new Error(tr('tui.fileColori'));
  return { colori, tipografia: validaTipografia(o.tipografia) };
}
