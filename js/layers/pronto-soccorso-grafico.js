// js/layers/pronto-soccorso-grafico.js
// Grafico «pazienti in attesa, ultime 24 ore» nella scheda di un pronto soccorso: una riga ogni 30 minuti, i buchi (nessuna lettura) restano buchi.
// Dati dal Worker /pronto-soccorso-storico (media dei pazienti in attesa per mezz'ora, già ripulita).
import { scegliProxy } from '../rndt/proxy.js';
import { localeIntl, t } from '../core/i18n.js';
import { titoloConInfo } from '../core/info-grafico.js';

const NS = 'http://www.w3.org/2000/svg';
const L = 300, A = 90, SX = 4, SUP = 8, SOT = 16; // viewBox, margine laterale, margine alto e basso (ore sotto)
const RINNOVO_MS = 5 * 60 * 1000;
let cache = null, inCorso = null, quando = 0;

export const urlStorico = () => `${scegliProxy(location.search, location.hostname)}/pronto-soccorso-storico`;

export async function caricaStorico(fetchFn = fetch) {
  if (cache && Date.now() - quando < RINNOVO_MS) return cache;
  inCorso ??= (async () => {
    try {
      const r = await fetchFn(urlStorico());
      if (!r.ok) throw new Error(`storico: HTTP ${r.status}`);
      cache = await r.json(); quando = Date.now();
    } catch { /* senza storico la scheda resta senza grafico */ } finally { inCorso = null; }
    return cache;
  })();
  return inCorso;
}

// Serie delle 24 ore del presidio (numeri o null) o null se i punti sono troppo pochi per un grafico.
export function serieDi(storico, id) {
  const s = storico?.ps?.[id];
  return Array.isArray(s) && s.filter(v => Number.isFinite(v)).length >= 6 ? s : null;
}

// Geometria pura (testabile): tratti continui della linea e dell'area, e coordinate dei punti.
export function tracciato(serie) {
  const n = serie.length, validi = serie.filter(Number.isFinite);
  const max = Math.max(4, Math.ceil(Math.max(...validi) / 4) * 4);
  const x = i => SX + (i / (n - 1)) * (L - 2 * SX);
  const y = v => SUP + (1 - v / max) * (A - SUP - SOT);
  let linea = '', area = '', inizio = null;
  serie.forEach((v, i) => {
    if (!Number.isFinite(v)) { if (inizio != null) area += `L${x(i - 1).toFixed(1)} ${A - SOT}Z`; inizio = null; return; }
    linea += `${inizio == null ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
    area += inizio == null ? `M${x(i).toFixed(1)} ${A - SOT}L${x(i).toFixed(1)} ${y(v).toFixed(1)}` : `L${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
    inizio = i;
  });
  if (inizio != null) area += `L${x(n - 1).toFixed(1)} ${A - SOT}Z`;
  return { linea, area, max, x, y };
}

const s = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };

function disegna(serie, da, passo) {
  const { linea, area, max, x, y } = tracciato(serie);
  const ora = new Intl.DateTimeFormat(localeIntl(), { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
  const svg = s('svg', { viewBox: `0 0 ${L} ${A}`, class: 'ps-grafico-svg', role: 'img' });
  for (const g of [0, max / 2, max]) { // linee guida con il valore a sinistra
    svg.append(s('line', { x1: SX, x2: L - SX, y1: y(g), y2: y(g), class: 'ps-grafico-guida' }));
    const et = s('text', { x: SX + 1, y: y(g) - 2, class: 'ps-grafico-asse' }); et.textContent = String(Math.round(g)); svg.append(et);
  }
  [0, 12, 24, 36, 47].forEach(i => { // ore ogni 6 ore
    const et = s('text', { x: x(i), y: A - 3, class: 'ps-grafico-asse', 'text-anchor': i === 0 ? 'start' : i === 47 ? 'end' : 'middle' });
    et.textContent = ora.format(new Date((da + i * passo) * 1000)); svg.append(et);
  });
  svg.append(s('path', { d: area, class: 'ps-grafico-area' }), s('path', { d: linea, class: 'ps-grafico-linea', 'vector-effect': 'non-scaling-stroke' }));
  const ultimo = serie.map((v, i) => [v, i]).filter(([v]) => Number.isFinite(v)).at(-1);
  svg.append(s('circle', { cx: x(ultimo[1]), cy: y(ultimo[0]), r: 2.8, class: 'ps-grafico-punto' }));
  svg.setAttribute('aria-label', t('ps.grafico.aria', { picco: Math.round(Math.max(...serie.filter(Number.isFinite))), ora: Math.round(ultimo[0]) }));
  return { svg, x, y, ora };
}

// Contenuto dinamico della scheda: titolo con «i», poi il grafico appena arrivano i dati. Se mancano non resta nulla.
export function graficoAttese(p, { carica = caricaStorico } = {}) {
  const radice = document.createElement('div');
  radice.className = 'ps-grafico';
  radice.hidden = true;
  carica().then(storico => {
    const serie = serieDi(storico, p.id);
    if (!serie) return;
    const { svg, x, y, ora } = disegna(serie, storico.da, storico.passo);
    const didascalia = document.createElement('small');
    didascalia.className = 'ps-grafico-didascalia';
    didascalia.textContent = t('ps.grafico.didascalia');
    const cursore = s('line', { y1: SUP, y2: A - SOT, class: 'ps-grafico-cursore', visibility: 'hidden' });
    const punto = s('circle', { r: 3.4, class: 'ps-grafico-punto', visibility: 'hidden' });
    svg.append(cursore, punto);
    const muovi = e => { // ora e valore del punto più vicino al dito o al mouse
      const r = svg.getBoundingClientRect(); const n = serie.length;
      let i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * L - SX) / (L - 2 * SX) * (n - 1))));
      let k = 0; while (!Number.isFinite(serie[i + k]) && !Number.isFinite(serie[i - k]) && k < n) k++;
      const j = Number.isFinite(serie[i + k]) ? i + k : i - k;
      if (!Number.isFinite(serie[j])) return;
      cursore.setAttribute('x1', x(j)); cursore.setAttribute('x2', x(j)); punto.setAttribute('cx', x(j)); punto.setAttribute('cy', y(serie[j]));
      cursore.setAttribute('visibility', 'visible'); punto.setAttribute('visibility', 'visible');
      didascalia.textContent = t('ps.grafico.punto', { ora: ora.format(new Date((storico.da + j * storico.passo) * 1000)), n: Math.round(serie[j]) });
    };
    const fine = () => { cursore.setAttribute('visibility', 'hidden'); punto.setAttribute('visibility', 'hidden'); didascalia.textContent = t('ps.grafico.didascalia'); };
    for (const ev of ['pointermove', 'pointerdown']) svg.addEventListener(ev, muovi);
    for (const ev of ['pointerleave', 'pointercancel']) svg.addEventListener(ev, fine);
    radice.append(titoloConInfo('h4', 'ps-grafico-titolo', t('ps.grafico.titolo'), 'ps-attese'), svg, didascalia);
    radice.hidden = false;
  }).catch(() => {});
  return radice;
}
