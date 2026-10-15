// Parti disegnate della tab PNRR della scheda: riquadri con i totali e barre per missione, stato, anno di fine, settore e soggetto
// attuatore, calcolati su tutti i progetti di Palermo (anche quelli senza posizione, che non hanno un punto sulla mappa).
// Gli stili sono quelli delle barre del pendolarismo (.pend-*).
import { urlDati } from '../core/config.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';
import { MISSIONI, barre, coloreMissione, euroCompatto, frase, quotaConclusi } from './scheda-pnrr.js';

const num = v => Number(v).toLocaleString(localeIntl());
const COLORE = '#7048e8';

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function cella(valore, etichetta) {
  const c = el('div', 'pend-riquadro');
  c.append(el('div', 'pend-val', valore), el('div', 'pend-et', etichetta));
  return c;
}

// Una riga per voce: etichetta e valore, e sotto la barra lunga quanto la quota sul massimo.
function grafico(titolo, righe) {
  const blocco = el('div', 'pend-classifica');
  blocco.append(el('h4', null, titolo));
  for (const r of righe) {
    const riga = el('div', 'pend-riga');
    const testa = el('div', 'pend-riga-testa');
    const nome = el('span', null, r.etichetta);
    nome.title = r.etichetta;
    testa.append(nome, el('span', 'pend-riga-val', r.testo));
    const traccia = el('div', 'pend-barra');
    const riempi = el('i');
    riempi.style.width = `${Math.max(r.quota, 1).toFixed(1)}%`;
    riempi.style.background = r.colore ?? COLORE;
    traccia.append(riempi);
    riga.append(testa, traccia);
    blocco.append(riga);
  }
  return blocco;
}

const progetti = n => tn('pnrr.nProgetti', n, { n: num(n) });

export function contenutoDinamico(s) {
  const radice = el('div', 'pend-dinamico');
  const riquadri = el('div', 'pend-riquadri');
  riquadri.append(cella(num(s.n), t('pnrr.progetti')), cella(euroCompatto(s.pnrr), t('pnrr.finanziamento')), cella(`${quotaConclusi(s).toLocaleString(localeIntl())}%`, t('pnrr.conclusi')));
  radice.append(riquadri, el('p', 'scheda-nota', t('pnrr.sullaMappa', { n: num(s.su_mappa), tot: num(s.n) })));

  const nomeMissione = codice => MISSIONI.find(([c]) => c === codice)?.[1];
  radice.append(grafico(t('pnrr.perMissione'), barre(s.per_missione, 'pnrr').map(g => ({
    etichetta: `${g.voce} · ${tl(nomeMissione(g.voce) ?? '')}`.replace(/ · $/, ''),
    testo: `${euroCompatto(g.pnrr)} · ${progetti(g.n)}`, quota: g.quota, colore: coloreMissione(g.voce),
  }))));
  radice.append(grafico(t('pnrr.perStato'), barre(s.per_stato, 'n').map(g => ({
    etichetta: tl(frase(g.voce)), testo: `${progetti(g.n)} · ${euroCompatto(g.pnrr)}`, quota: g.quota,
  }))));
  radice.append(grafico(t('pnrr.perAnno'), barre(s.per_anno_fine, 'n').map(g => ({ etichetta: g.voce, testo: progetti(g.n), quota: g.quota }))));
  if (s.senza_data_fine) radice.append(el('p', 'scheda-nota', t('pnrr.senzaData', { n: num(s.senza_data_fine) })));
  radice.append(grafico(t('pnrr.perSettore'), barre(s.per_settore, 'n').map(g => ({ etichetta: frase(g.voce), testo: progetti(g.n), quota: g.quota }))));
  radice.append(grafico(t('pnrr.perAttuatore'), barre(s.per_attuatore, 'n').map(g => ({ etichetta: frase(g.voce), testo: progetti(g.n), quota: g.quota }))));

  const csv = el('a', 'scheda-link', t('pnrr.scarica'));
  csv.href = urlDati('pnrr/pnrr_palermo.csv');
  csv.download = 'pnrr_palermo.csv';
  radice.append(csv, el('p', 'scheda-nota', t('pnrr.nota', { data: s.estrazione ?? '' })));
  return radice;
}
