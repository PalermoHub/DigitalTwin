import { posizioneSole, localeInData, hhmm, ZH, MAX_OMBRA_M, ORA_MIN, ORA_MAX } from './ombre-sole.js';
import { titoloConInfo } from './info-grafico.js';
import { t } from './i18n.js';

// «Ombra sulla giornata»: area d'ombra proiettata dagli edifici a ogni ora, in sincronia con lo slider delle ombre.
// Per ogni spigolo di muro sul lato in ombra (stessi record 16 byte di ombre-layer.js) l'area spazzata è |d × spostamento|;
// la somma conta due volte le sovrapposizioni fra edifici vicini, quindi è una stima per eccesso: serve a confrontare le ore, non a misurare ettari.
const RAD = Math.PI / 180;
export const PASSO = 30; // minuti

// buf: record da 16 byte (ax i32, ay i32, dx i16, dy i16, h u16, pad u16), n record. Area in ettari.
export function areaOmbraHa(buf, n, az, el) {
  if (el <= 0) return 0;
  const i16 = new Int16Array(buf, 0, n * 8), u16 = new Uint16Array(buf, 0, n * 8);
  const k = ZH / Math.tan(Math.max(el, 0.3) * RAD);
  const ox = -Math.sin(az * RAD) * k, oy = -Math.cos(az * RAD) * k; // metri Mercator per metro d'altezza, opposto al sole
  const lung = Math.hypot(ox, oy);
  let area = 0;
  for (let i = 0; i < n; i++) {
    const dx = i16[i * 8 + 4] * 0.01, dy = i16[i * 8 + 5] * 0.01;
    const c = dy * ox - dx * oy; // > 0 solo per gli spigoli sul lato in ombra
    if (c <= 0) continue;
    const h = u16[i * 8 + 6] * 0.1;
    area += c * h * Math.min(1, MAX_OMBRA_M / (h * lung));
  }
  return area / (ZH * ZH) / 1e4; // da metri Mercator quadrati a metri veri, poi ettari
}

export function serieGiorno(buf, n, giorno) {
  const serie = [];
  for (let m = ORA_MIN; m <= ORA_MAX; m += PASSO) {
    const { az, el } = posizioneSole(localeInData(giorno, m));
    serie.push({ minuti: m, ha: areaOmbraHa(buf, n, az, el) });
  }
  return serie;
}

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attr = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e; };
const LARG = 276, ALT = 96, M = { s: 30, d: 6, su: 6, giu: 16 };

function massimoLeggibile(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v)), f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

// Grafico a SVG dentro `radice`. salta(minuti) è chiamata al clic. Restituisce { aggiorna(serie), cursore(minuti) }.
export function creaGrafico(radice, salta) {
  const titolo = titoloConInfo('h4', 'ombre-grafico-titolo', t('ombre.grafico.titolo'), 'ombre');
  const s = svg('svg', { viewBox: `0 0 ${LARG} ${ALT}`, class: 'ombre-grafico', role: 'img', 'aria-label': t('ombre.grafico.titolo') });
  const nota = document.createElement('div');
  nota.className = 'ombre-grafico-nota';
  nota.textContent = t('ombre.grafico.nota');
  radice.append(titolo, s, nota);
  let serie = [], minuti = 12 * 60;
  const x = m => M.s + (m - ORA_MIN) / (ORA_MAX - ORA_MIN) * (LARG - M.s - M.d);

  function disegna() {
    s.replaceChildren();
    const top = massimoLeggibile(Math.max(0, ...serie.map(p => p.ha)));
    const y = ha => M.su + (1 - ha / top) * (ALT - M.su - M.giu);
    const base = y(0);
    if (serie.length) {
      s.append(svg('path', { class: 'ombre-grafico-area', d: `M${x(serie[0].minuti)},${base} ${serie.map(p => `L${x(p.minuti).toFixed(1)},${y(p.ha).toFixed(1)}`).join(' ')} L${x(serie.at(-1).minuti)},${base} Z` }));
    }
    s.append(svg('line', { class: 'ombre-grafico-asse', x1: M.s, x2: LARG - M.d, y1: base, y2: base }));
    for (const [testo, px, ancora] of [[hhmm(ORA_MIN), x(ORA_MIN), 'start'], [hhmm(12 * 60 + 30), x(12 * 60 + 30), 'middle'], [hhmm(ORA_MAX), x(ORA_MAX), 'end']]) {
      const e = svg('text', { class: 'ombre-grafico-testo', x: px, y: ALT - 3, 'text-anchor': ancora });
      e.textContent = testo; s.append(e);
    }
    for (const [testo, py] of [['0', base], [`${top} ha`, y(top)]]) {
      const e = svg('text', { class: 'ombre-grafico-testo', x: M.s - 4, y: py + 3, 'text-anchor': 'end' });
      e.textContent = testo; s.append(e);
    }
    const cur = svg('line', { class: 'ombre-grafico-cursore', x1: x(minuti), x2: x(minuti), y1: M.su, y2: base });
    cur.dataset.cursore = '1';
    s.append(cur);
    const clic = svg('rect', { x: M.s, y: 0, width: LARG - M.s - M.d, height: ALT - M.giu, fill: 'transparent', style: 'cursor:pointer' });
    clic.addEventListener('click', ev => {
      const r = s.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width * LARG;
      const m = ORA_MIN + (px - M.s) / (LARG - M.s - M.d) * (ORA_MAX - ORA_MIN);
      salta(Math.min(ORA_MAX, Math.max(ORA_MIN, Math.round(m / 10) * 10)));
    });
    s.append(clic);
  }

  return {
    aggiorna(nuova) { serie = nuova; disegna(); },
    cursore(m) {
      minuti = m;
      const c = s.querySelector('[data-cursore]');
      if (c) { c.setAttribute('x1', x(m)); c.setAttribute('x2', x(m)); }
    },
  };
}
