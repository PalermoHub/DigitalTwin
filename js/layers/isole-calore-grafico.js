// Grafico a linee 2019–2025 (SVG): temperatura della sezione e media comunale con i quartili (fascia).
// Senza sezione mostra solo l'andamento comunale (legenda del layer). I dati arrivano da `datiGrafico`.
import { datiGrafico } from './isole-calore-classi.js';
import { t as tr, tl, localeIntl } from '../core/i18n.js';

const COLORE_SEZIONE = '#d9480f';
const L = 300, H = 150, M = { s: 8, d: 10, t: 12, b: 22 }; // viewBox e margini (sinistra con l'asse dei gradi)
const it = (n, d = 1) => n.toLocaleString(localeIntl(), { minimumFractionDigits: d, maximumFractionDigits: d });

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
}

// Percorso SVG che salta gli anni senza dato (nuovo segmento «M» dopo ogni buco).
const percorso = (valori, x, y) => {
  let d = '', penna = false;
  valori.forEach((v, i) => { if (v == null) { penna = false; return; } d += `${penna ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; penna = true; });
  return d;
};

export function graficoAndamento(p, serie, titolo) {
  const g = datiGrafico(p, serie);
  const sinistra = 30;
  const x = i => sinistra + (i / (g.anni.length - 1)) * (L - sinistra - M.d);
  const margine = (g.max - g.min) * 0.12 || 0.5;
  const lo = Math.floor((g.min - margine) * 2) / 2, hi = Math.ceil((g.max + margine) * 2) / 2;
  const y = v => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const fascia = g.anni.map((_, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(g.p75[i]).toFixed(1)}`).join('')
    + [...g.anni.keys()].reverse().map(i => `L${x(i).toFixed(1)} ${y(g.p25[i]).toFixed(1)}`).join('') + 'Z';
  const passoY = (hi - lo) > 4 ? 2 : 1;
  const assi = [];
  for (let v = Math.ceil(lo / passoY) * passoY; v <= hi; v += passoY) {
    assi.push(`<line x1="${sinistra}" x2="${L - M.d}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--border)" stroke-width=".6"/>`
      + `<text x="${sinistra - 4}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" class="ic-asse">${v}°</text>`);
  }
  const anni = g.anni.map((a, i) => `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ic-asse">${a}</text>`);
  const punti = g.sezione ? g.sezione.map((v, i) => (v == null ? '' : `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.6" fill="${COLORE_SEZIONE}"><title>${g.anni[i]}: ${it(v)} °C</title></circle>`)).join('') : '';
  const etichetta = g.sezione
    ? tr('isole.grafico.sezione', { da: g.anni[0], a: g.anni.at(-1), valori: g.sezione.map((v, i) => (v == null ? '' : `${g.anni[i]} ${it(v)} °C`)).filter(Boolean).join(', ') })
    : tr('isole.grafico.comune', { da: g.anni[0], a: g.anni.at(-1), valori: g.comune.map((v, i) => `${g.anni[i]} ${it(v)} °C`).join(', ') });

  const box = el('div', 'col-graf ic-graf');
  box.append(el('h4', 'col-graf-titolo', titolo));
  const svg = el('div', 'ic-svg');
  svg.innerHTML = `<svg viewBox="0 0 ${L} ${H}" role="img" aria-label="${etichetta}">${assi.join('')}${anni.join('')}`
    + `<path d="${fascia}" fill="var(--text-muted)" opacity=".14"/>`
    + `<path d="${percorso(g.comune, x, y)}" fill="none" stroke="var(--text-muted)" stroke-width="1.6" stroke-dasharray="4 3"/>`
    + (g.sezione ? `<path d="${percorso(g.sezione, x, y)}" fill="none" stroke="${COLORE_SEZIONE}" stroke-width="2"/>${punti}` : '')
    + '</svg>';
  box.append(svg);
  const legenda = el('div', 'col-legenda');
  if (g.sezione) {
    const a = el('span'); const ia = el('i'); ia.style.background = COLORE_SEZIONE; a.append(ia, tl('Sezione')); legenda.append(a);
  }
  const b = el('span'); const ib = el('i', 'ic-tratteggio'); b.append(ib, tl('Media comunale')); legenda.append(b);
  const c = el('span'); const ic = el('i', 'ic-fascia'); c.append(ic, 'Quartili comunali (25°–75°)'); legenda.append(c);
  box.append(legenda);
  return box;
}
