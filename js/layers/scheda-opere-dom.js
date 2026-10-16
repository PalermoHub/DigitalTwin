// Parti disegnate della tab Opere della scheda: riquadri con i totali e barre per settore, fase, stato, anno di fine lavori, tipologia e titolare,
// calcolati su tutte le opere di Palermo (anche quelle senza posizione, che non hanno un punto sulla mappa). Stili delle barre: .pend-*.
import { urlDati } from '../core/config.js';
import { disegnaSezione } from '../core/scheda-disegno.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';
import { COLORI_FASE, COLORI_STATO, barre, coloreSettore, euroCompatto, filtroTitolare, frase, nomeSettore, nomeSoggetto, voceScheda } from './scheda-opere.js';
import { etichettaOpzione } from './opere-luoghi.js';

const num = v => Number(v).toLocaleString(localeIntl());
const COLORE = '#e8590c';

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
    if (r.filtro) { // la voce è un filtro della mappa (titolare)
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

const opere = n => tn('opere.nOpere', n, { n: num(n) });
const conCosto = g => `${opere(g.n)} · ${euroCompatto(g.costo) ?? '0 €'}`;

// «Sulla mappa 705 opere su 1.352»: chi non sa che molte opere non hanno un luogo crede che siano solo quelle
export const testoCopertura = s => (s?.n ? t('opere.copertura', { n: num(s.su_mappa), tot: num(s.n), altre: num(s.n - s.su_mappa) }) : t('opere.coperturaGenerica'));

// Contenuto della sezione «Opere senza un punto sulla mappa» (voceTendina): scelto il titolare e poi l'opera, la scheda completa compare qui sotto.
// `titolari` = [{ voce, n, progetti }] da dati/opere/elenco.json.
export function contenutoTendina(titolari, sintesi = null) {
  const blocco = el('div', 'pnrr-tendina');
  blocco.append(el('p', 'pnrr-copertura', testoCopertura(sintesi)), el('p', 'scheda-nota', t('opere.tendinaNota')));
  const scelteTitolare = document.createElement('select');
  scelteTitolare.setAttribute('aria-label', t('opere.scegliTitolare'));
  scelteTitolare.append(new Option(t('opere.scegliTitolare'), ''), ...titolari.map((s, i) => new Option(`${nomeSoggetto(s.voce)} (${num(s.n)})`, String(i))));
  const scelteOpera = document.createElement('select');
  scelteOpera.setAttribute('aria-label', t('opere.scegliOpera'));
  scelteOpera.disabled = true;
  scelteOpera.append(new Option(t('opere.scegliOpera'), ''));
  const carta = el('div', 'pnrr-tendina-carta');
  let corrente = [];
  scelteTitolare.addEventListener('change', () => {
    corrente = titolari[Number(scelteTitolare.value)]?.progetti ?? [];
    scelteOpera.replaceChildren(new Option(t('opere.scegliOpera'), ''), ...corrente.map((p, i) => new Option(etichettaOpzione(p), String(i))));
    scelteOpera.disabled = !corrente.length;
    carta.replaceChildren();
  });
  scelteOpera.addEventListener('change', () => {
    const p = corrente[Number(scelteOpera.value)];
    if (!p) return carta.replaceChildren();
    // la scheda dell'opera, come quella cliccata sulla mappa ma senza i link ripetuti (stanno già in fondo alla tab)
    const sezione = disegnaSezione({ ...voceScheda(p), link: undefined, fonte: undefined }, 0);
    sezione.dataset.tab = 'opere'; // segue la tab: scheda.js nasconde le sezioni delle altre
    carta.replaceChildren(sezione);
  });
  const campo = (testo, select) => { // etichetta sopra il menu: si capisce che sono i due passi per aprire una scheda
    const c = el('label', 'pnrr-scelta');
    c.append(el('span', 'pnrr-scelta-et', testo), select);
    return c;
  };
  blocco.append(campo(t('opere.passo1'), scelteTitolare), campo(t('opere.passo2'), scelteOpera), carta);
  return blocco;
}

const quotaFinite = s => {
  const f = n => s.per_fase?.find(g => g.voce === n)?.n ?? 0;
  return s.n > 0 ? Math.round(((f('In funzione') + f('Lavori conclusi')) / s.n) * 1000) / 10 : 0;
};

export function contenutoDinamico(s) {
  const radice = el('div', 'pend-dinamico');
  const riquadri = el('div', 'pend-riquadri');
  riquadri.append(cella(num(s.n), t('opere.opere')), cella(euroCompatto(s.costo_previsto), t('opere.costoPrevisto')), cella(`${quotaFinite(s).toLocaleString(localeIntl())}%`, t('opere.concluse')));
  radice.append(riquadri, el('p', 'scheda-nota', t('opere.sullaMappa', { n: num(s.su_mappa), tot: num(s.n) })));

  radice.append(grafico(t('opere.perSettore'), barre(s.per_settore, 'n').map(g => ({
    etichetta: tl(nomeSettore(g.voce)), testo: conCosto(g), quota: g.quota, colore: coloreSettore(g.voce),
  }))));
  radice.append(grafico(t('opere.perFase'), barre(s.per_fase, 'n').map(g => ({
    etichetta: tl(g.voce), testo: conCosto(g), quota: g.quota, colore: COLORI_FASE[g.voce],
  }))), el('p', 'scheda-nota', t('opere.notaFase')));
  radice.append(grafico(t('opere.perStato'), barre(s.per_stato, 'n').map(g => ({
    etichetta: tl(frase(g.voce)), testo: conCosto(g), quota: g.quota, colore: COLORI_STATO[g.voce],
  }))));
  radice.append(grafico(t('opere.perAnno'), barre(s.per_anno_fine, 'n').map(g => ({ etichetta: g.voce, testo: opere(g.n), quota: g.quota }))));
  if (s.senza_anno_fine) radice.append(el('p', 'scheda-nota', t('opere.senzaData', { n: num(s.senza_anno_fine) })));
  radice.append(grafico(t('opere.perTipologia'), barre(s.per_tipologia, 'n').map(g => ({ etichetta: frase(g.voce), testo: opere(g.n), quota: g.quota }))));
  radice.append(grafico(t('opere.perTitolare'), barre(s.per_titolare, 'n').map(g => ({
    etichetta: nomeSoggetto(g.voce), filtro: filtroTitolare(g.voce), quota: g.quota,
    testo: g.n_mappa != null && g.n_mappa < g.n ? t('opere.nSullaMappa', { n: opere(g.n), m: num(g.n_mappa) }) : opere(g.n),
  }))), el('p', 'scheda-nota', t('opere.filtraTitolare')));

  const csv = el('a', 'scheda-link', t('opere.scarica'));
  csv.href = urlDati('opere/opere_palermo.csv');
  csv.download = 'opere_palermo.csv';
  radice.append(csv, el('p', 'scheda-nota', t('opere.nota', { data: s.estrazione ?? '' })));
  return radice;
}
