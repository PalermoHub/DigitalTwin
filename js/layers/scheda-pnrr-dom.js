// Parti disegnate della tab PNRR della scheda: riquadri con i totali e barre per missione, stato, anno di fine, settore e soggetto
// attuatore, calcolati su tutti i progetti di Palermo (anche quelli senza posizione, che non hanno un punto sulla mappa).
// Gli stili sono quelli delle barre del pendolarismo (.pend-*).
import { urlDati } from '../core/config.js';
import { disegnaSezione } from '../core/scheda-disegno.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';
import { MISSIONI, barre, coloreMissione, euroCompatto, filtroAttuatore, frase, nomeSoggetto, quotaConclusi, voceScheda } from './scheda-pnrr.js';
import { etichettaOpzione } from './pnrr-luoghi.js';

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
    let nome;
    if (r.filtro) { // la voce è un filtro della mappa (soggetto attuatore)
      nome = el('button', 'scheda-filtro', r.etichetta);
      nome.type = 'button';
      nome.addEventListener('click', () => document.dispatchEvent(new CustomEvent('dt:filtro', { detail: r.filtro })));
      nome.title = t('scheda.filtro.titolo');
    } else {
      nome = el('span', null, r.etichetta);
      nome.title = r.etichetta;
    }
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

// «Sulla mappa 1.284 progetti su 2.633»: chi non sa che molti progetti non hanno un luogo crede che siano solo quelli
export const testoCopertura = s => (s?.n ? t('pnrr.copertura', { n: num(s.su_mappa), tot: num(s.n), altri: num(s.n - s.su_mappa) }) : t('pnrr.coperturaGenerica'));

// Contenuto della sezione «Tutti i progetti di Comune e Università» (voceTendina): scelto il soggetto e poi il progetto, la scheda completa compare qui sotto, anche per i
// progetti che non hanno un punto sulla mappa. `soggetti` = [{ voce, n, progetti }] da dati/pnrr/soggetti.json.
export function contenutoTendina(soggetti, sintesi = null) {
  const blocco = el('div', 'pnrr-tendina');
  blocco.append(el('p', 'pnrr-copertura', testoCopertura(sintesi)), el('p', 'scheda-nota', t('pnrr.tendinaNota')));
  const scelteSoggetto = document.createElement('select');
  scelteSoggetto.setAttribute('aria-label', t('pnrr.scegliSoggetto'));
  scelteSoggetto.append(new Option(t('pnrr.scegliSoggetto'), ''), ...soggetti.map((s, i) => new Option(`${nomeSoggetto(s.voce)} (${num(s.n)})`, String(i))));
  const scelteProgetto = document.createElement('select');
  scelteProgetto.setAttribute('aria-label', t('pnrr.scegliProgetto'));
  scelteProgetto.disabled = true;
  scelteProgetto.append(new Option(t('pnrr.scegliProgetto'), ''));
  const carta = el('div', 'pnrr-tendina-carta');
  let corrente = [];
  scelteSoggetto.addEventListener('change', () => {
    corrente = soggetti[Number(scelteSoggetto.value)]?.progetti ?? [];
    scelteProgetto.replaceChildren(new Option(t('pnrr.scegliProgetto'), ''), ...corrente.map((p, i) => new Option(etichettaOpzione(p), String(i))));
    scelteProgetto.disabled = !corrente.length;
    carta.replaceChildren();
  });
  scelteProgetto.addEventListener('change', () => {
    const p = corrente[Number(scelteProgetto.value)];
    if (!p) return carta.replaceChildren();
    // la scheda del progetto, come quella cliccata sulla mappa ma senza i link ripetuti (stanno già in fondo alla tab)
    const sezione = disegnaSezione({ ...voceScheda(p), link: undefined, fonte: undefined }, 0);
    sezione.dataset.tab = 'pnrr'; // segue la tab: scheda.js nasconde le sezioni delle altre
    carta.replaceChildren(sezione);
  });
  const campo = (testo, select) => { // etichetta sopra il menu: si capisce che sono i due passi per aprire una scheda
    const c = el('label', 'pnrr-scelta');
    c.append(el('span', 'pnrr-scelta-et', testo), select);
    return c;
  };
  blocco.append(campo(t('pnrr.passo1'), scelteSoggetto), campo(t('pnrr.passo2'), scelteProgetto), carta);
  return blocco;
}

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
  radice.append(grafico(t('pnrr.perAttuatore'), barre(s.per_attuatore, 'n').map(g => ({
    etichetta: nomeSoggetto(g.voce), filtro: filtroAttuatore(g.voce), quota: g.quota,
    testo: g.n_mappa != null && g.n_mappa < g.n ? t('pnrr.nSullaMappa', { n: progetti(g.n), m: num(g.n_mappa) }) : progetti(g.n),
  }))), el('p', 'scheda-nota', t('pnrr.filtraSoggetto')));

  const csv = el('a', 'scheda-link', t('pnrr.scarica'));
  csv.href = urlDati('pnrr/pnrr_palermo.csv');
  csv.download = 'pnrr_palermo.csv';
  radice.append(csv, el('p', 'scheda-nota', t('pnrr.nota', { data: s.estrazione ?? '' })));
  return radice;
}
