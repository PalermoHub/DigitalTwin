// Grafico della scheda del trend: abitanti 2011, 2021, 2023 (linea piena) e scenario al 2030 e 2035 (tratteggio con fascia).
import { localeIntl, tl } from '../core/i18n.js';
import { serie, nomeLivello, NOTA, COLORE_CALO, COLORE_CRESCITA } from './scheda-trend.js';

const NS = 'http://www.w3.org/2000/svg';
const L = 300, ALTEZZA_BASE = 140, M = { s: 8, d: 10, su: 10, giu: 22 };
const M_VALORI = { s: 24, d: 24, su: 26, giu: 22 }; // con i valori serve spazio ai lati e in alto

const svg = (tag, attr) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  return e;
};
const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

// `conValori`: più alto, con il numero di abitanti sopra ogni punto (per il tooltip della mappa)
export function grafico(p, { conValori = false } = {}) {
  const H = conValori ? 150 : ALTEZZA_BASE;
  const punti = serie(p);
  const valori = punti.flatMap(d => [d.valore, d.min ?? d.valore, d.max ?? d.valore]);
  const lo = Math.min(...valori), hi = Math.max(...valori), margine = (hi - lo || hi * 0.1) * 0.1;
  const m = conValori ? M_VALORI : M;
  const x = anno => m.s + ((anno - 2011) / (2035 - 2011)) * (L - m.s - m.d);
  const y = v => m.su + (1 - (v - (lo - margine)) / (hi - lo + 2 * margine)) * (H - m.su - m.giu);
  const colore = p.var1121 >= 0 ? COLORE_CRESCITA : COLORE_CALO;
  const radice = svg('svg', { viewBox: `0 0 ${L} ${H}`, class: 'trend-grafico', role: 'img', 'aria-label': tl('Andamento della popolazione 2011-2035') });
  const proiettati = punti.filter(d => !d.osservato);
  const ultimo = punti.find(d => d.anno === 2023);
  if (proiettati.length) {
    const sopra = [ultimo, ...proiettati].map(d => `${x(d.anno)},${y(d.max ?? d.valore)}`);
    const sotto = [ultimo, ...proiettati].map(d => `${x(d.anno)},${y(d.min ?? d.valore)}`).reverse();
    radice.append(svg('polygon', { points: [...sopra, ...sotto].join(' '), fill: colore, 'fill-opacity': 0.15 }));
    radice.append(svg('polyline', { points: [ultimo, ...proiettati].map(d => `${x(d.anno)},${y(d.valore)}`).join(' '), fill: 'none', stroke: colore, 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
  }
  radice.append(svg('polyline', { points: punti.filter(d => d.osservato).map(d => `${x(d.anno)},${y(d.valore)}`).join(' '), fill: 'none', stroke: colore, 'stroke-width': 2.5 }));
  for (const d of punti) {
    radice.append(svg('circle', { cx: x(d.anno), cy: y(d.valore), r: d.osservato ? 3.5 : 2.5, fill: d.osservato ? colore : '#fff', stroke: colore, 'stroke-width': 1.5 }));
    const et = svg('text', { x: x(d.anno), y: H - 6, 'text-anchor': 'middle', 'font-size': 10, fill: 'currentColor' });
    et.textContent = String(d.anno);
    radice.append(et);
    if (conValori) {
      const num = svg('text', { x: x(d.anno), y: y(d.valore) - 7, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: colore, stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' });
      num.textContent = Math.round(d.valore).toLocaleString(localeIntl());
      radice.append(num);
    }
  }
  return radice;
}

// Il grafico con i valori, per il tooltip: titolo di sezione e i tre dati osservati più lo scenario (tratteggio).
export function graficoConValori(p) {
  const g = grafico(p, { conValori: true });
  g.classList.add('trend-grafico-tip');
  return g;
}

function dettaglio(p, aperto) {
  const f = n => Math.round(n).toLocaleString(localeIntl());
  const blocco = el('details', 'trend-livello-dettaglio');
  blocco.open = aperto;
  blocco.append(el('summary', null, `${tl(nomeLivello(p.livello))}: ${p.nome}`));
  const righe = el('div', 'trend-numeri');
  for (const [anno, v] of [[2011, p.p11], [2021, p.p21], [2023, p.p23]]) righe.append(el('span', null, `${anno}: ${f(v)}`));
  blocco.append(righe, grafico(p));
  if (p.p2035_centrale != null) {
    blocco.append(el('p', 'scheda-nota', `${tl('Scenario di tendenza al 2035')}: ${f(p.p2035_centrale)} (${f(p.p2035_min)}–${f(p.p2035_max)})`));
  }
  return blocco;
}

export function contenutoTrend(aree) {
  const radice = el('div', 'trend-dinamico');
  aree.forEach((p, i) => radice.append(dettaglio(p, i === 0)));
  const nota = el('details', 'peba-nota');
  nota.append(el('summary', null, tl('Nota sulla qualità dei dati')), el('p', null, tl(NOTA)));
  radice.append(nota);
  return radice;
}
