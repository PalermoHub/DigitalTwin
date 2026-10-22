// Parti disegnate della tab Piano triennale della scheda: menu a tendina per aprire la scheda di ogni intervento (anche quelli senza geometria) e
// riquadri con grafici su tutto il Programma. Stili delle barre: .pend-*.
import { disegnaSezione } from '../core/scheda-disegno.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';
import { SETTORI, barre, coloreClasse, coloreSettore, euro, euroCompatto, nomeSettore, titoloIntervento, voceScheda, COLORE } from './scheda-piano-triennale.js';

const num = v => Number(v).toLocaleString(localeIntl());

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

// Le tipologie di risorsa del quadro (frasi lunghe del modello ministeriale) in nome breve
const NOMI_RISORSE = [
  [/vincolata/, 'Entrate a destinazione vincolata'], [/mutuo/, 'Mutuo'], [/privat/, 'Capitali privati'],
  [/bilancio/, 'Stanziamenti di bilancio'], [/altra/, 'Altra tipologia'],
];
const nomeRisorsa = voce => NOMI_RISORSE.find(([re]) => re.test(voce))?.[1] ?? voce;

const interventi = n => tn('piano.nInterventi', n, { n: num(n) });
const conImporto = g => `${interventi(g.n)} · ${euroCompatto(g.importo) ?? '0 €'}`;

// Etichetta di un intervento nel menu: titolo accorciato, importo e, se manca, l'avviso che non è sulla mappa.
const etichettaOpzione = o => {
  const titolo = titoloIntervento(o);
  return `${o.cod} · ${titolo.length > 70 ? `${titolo.slice(0, 70).replace(/\s+\S*$/, '')}…` : titolo} (${euroCompatto(o.triennio) ?? '0 €'}${o.localizzato ? '' : `, ${t('piano.senzaPosizione')}`})`;
};

// Contenuto della sezione «Cerca un intervento»: scelto il settore e poi l'intervento, la scheda completa compare qui sotto.
export function contenutoTendina(elenco) {
  const blocco = el('div', 'pnrr-tendina');
  blocco.append(el('p', 'scheda-nota', t('piano.tendinaNota', { n: num(elenco.filter(o => !o.localizzato).length) })));
  const perSettore = SETTORI.map(([codice]) => ({ codice, voci: elenco.filter(o => o.settore === codice).sort((a, b) => (b.triennio ?? 0) - (a.triennio ?? 0)) })).filter(g => g.voci.length);
  const scelteSettore = document.createElement('select');
  scelteSettore.setAttribute('aria-label', t('piano.scegliSettore'));
  scelteSettore.append(new Option(t('piano.scegliSettore'), ''), ...perSettore.map((g, i) => new Option(`${tl(nomeSettore(g.codice))} (${num(g.voci.length)})`, String(i))));
  const scelteIntervento = document.createElement('select');
  scelteIntervento.setAttribute('aria-label', t('piano.scegliIntervento'));
  scelteIntervento.disabled = true;
  scelteIntervento.append(new Option(t('piano.scegliIntervento'), ''));
  const carta = el('div', 'pnrr-tendina-carta');
  let corrente = [];
  scelteSettore.addEventListener('change', () => {
    corrente = perSettore[Number(scelteSettore.value)]?.voci ?? [];
    scelteIntervento.replaceChildren(new Option(t('piano.scegliIntervento'), ''), ...corrente.map((o, i) => new Option(etichettaOpzione(o), String(i))));
    scelteIntervento.disabled = !corrente.length;
    carta.replaceChildren();
  });
  scelteIntervento.addEventListener('change', () => {
    const o = corrente[Number(scelteIntervento.value)];
    if (!o) return carta.replaceChildren();
    // la scheda dell'intervento, come quella cliccata sulla mappa ma senza i link ripetuti (stanno già in fondo alla tab)
    const sezione = disegnaSezione({ ...voceScheda(o), link: undefined, fonte: undefined }, 0);
    sezione.dataset.tab = 'piano'; // segue la tab: scheda.js nasconde le sezioni delle altre
    carta.replaceChildren(sezione);
  });
  const campo = (testo, select) => {
    const c = el('label', 'pnrr-scelta');
    c.append(el('span', 'pnrr-scelta-et', testo), select);
    return c;
  };
  blocco.append(campo(t('piano.passo1'), scelteSettore), campo(t('piano.passo2'), scelteIntervento), carta);
  return blocco;
}

export function contenutoDinamico(s) {
  const radice = el('div', 'pend-dinamico');
  const riquadri = el('div', 'pend-riquadri');
  riquadri.append(cella(num(s.n), t('piano.interventi')), cella(euroCompatto(s.importo_triennio), t('piano.importoTriennio')), cella(num(s.in_elenco_annuale), t('piano.elencoAnnuale')));
  radice.append(riquadri, el('p', 'scheda-nota', t('piano.sullaMappa', {
    n: num(s.n_localizzati), tot: num(s.n), altri: num(s.n_non_localizzati), importo: euroCompatto(s.importo_non_localizzati),
  })));

  radice.append(grafico(t('piano.perAnno'), barre(s.per_anno, 'importo').map((g, i) => ({
    etichetta: g.voce, testo: `${interventi(g.n)} · ${euroCompatto(g.importo)}`, quota: g.quota, colore: coloreClasse(i + 1),
  }))), el('p', 'scheda-nota', t('piano.notaAnno')));
  radice.append(grafico(t('piano.perSettore'), barre(s.per_settore, 'importo').map(g => ({
    etichetta: tl(g.voce), testo: conImporto(g), quota: g.quota, colore: coloreSettore(SETTORI.find(([, nome]) => nome === g.voce)?.[0]),
  }))));
  radice.append(grafico(t('piano.perTipologia'), barre(s.per_tipologia, 'importo').map(g => ({
    etichetta: g.voce.replace(/^\d+ - /, ''), testo: conImporto(g), quota: g.quota,
  }))));
  radice.append(grafico(t('piano.perCircoscrizione'), barre(s.per_circoscrizione, 'importo').map(g => ({
    etichetta: g.voce, testo: conImporto(g), quota: g.quota,
  }))), el('p', 'scheda-nota', t('piano.notaCircoscrizione')));
  radice.append(grafico(t('piano.risorse'), barre(s.risorse.filter(r => r.voce !== 'totale' && r.totale > 0).map(r => ({ ...r, importo: r.totale })), 'importo').map(g => ({
    etichetta: tl(nomeRisorsa(g.voce)), testo: euroCompatto(g.importo), quota: g.quota,
  }))));
  radice.append(grafico(t('piano.maggiori'), barre(s.maggiori, 'importo').map(g => ({
    etichetta: `${g.cod} · ${g.titolo.length > 60 ? `${g.titolo.slice(0, 60)}…` : g.titolo}`, testo: euro(g.importo) ?? '', quota: g.quota,
  }))));

  radice.append(el('p', 'scheda-nota', t('piano.nota')));
  return radice;
}
