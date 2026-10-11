// Parti disegnate della scheda del pendolarismo, come nel pannello della mappa originale: tre riquadri in percentuale,
// tre numeri chiave e le classifiche dei comuni di destinazione (uscita) e di origine (entrata) con le barre.
import { localeIntl, t, tl } from '../core/i18n.js';
import { riepilogo, classifica, conSegno, percentuale, NOTA, COLORE_ENTRATA, COLORE_USCITA } from './scheda-pendolarismo.js';

const num = v => Number(v).toLocaleString(localeIntl());

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function cella(classe, valore, etichetta, extra) {
  const c = el('div', classe);
  c.append(el('div', `pend-val${extra ? ` ${extra}` : ''}`, valore), el('div', 'pend-et', etichetta));
  return c;
}

function riquadri(r) {
  const radice = el('div', 'pend-riepilogo');
  const quote = el('div', 'pend-riquadri');
  quote.append(
    cella('pend-riquadro', percentuale(r.quotaViveQui), t('pendolarismo.viveQui')),
    cella('pend-riquadro', percentuale(r.quotaAltrove), t('pendolarismo.altrove')),
    cella('pend-riquadro', percentuale(r.quotaPostiDaFuori), t('pendolarismo.postiDaFuori')),
  );
  const numeri = el('div', 'pend-numeri');
  numeri.append(
    cella('pend-numero', num(r.residenti), t('pendolarismo.attiva')),
    cella('pend-numero', num(r.posti), t('pendolarismo.posti')),
    cella('pend-numero', conSegno(r.saldo), t('pendolarismo.saldo'), r.saldo >= 0 ? 'pend-pos' : 'pend-neg'),
  );
  radice.append(quote, numeri);
  return radice;
}

// Una riga per comune: nome, numero e quota, e sotto la barra lunga quanto la quota (0-100% della direzione).
function classificaDisegnata(titolo, elenco, colore) {
  const blocco = el('div', 'pend-classifica');
  blocco.append(el('h4', null, titolo));
  for (const d of elenco) {
    const riga = el('div', 'pend-riga');
    const testa = el('div', 'pend-riga-testa');
    testa.append(el('span', null, d.nome), el('span', 'pend-riga-val', `${num(d.valore)} (${percentuale(d.quota)})`));
    const traccia = el('div', 'pend-barra');
    const riempi = el('i');
    riempi.style.width = `${Math.min(100, d.quota).toFixed(1)}%`;
    riempi.style.background = colore;
    traccia.append(riempi);
    riga.append(testa, traccia);
    blocco.append(riga);
  }
  return blocco;
}

// «Nota sulla qualità dei dati»: chiusa all'apertura, come nella scheda PEBA
function notaQualita() {
  const nota = el('details', 'peba-nota');
  nota.append(el('summary', null, tl('Nota sulla qualità dei dati')), el('p', null, tl(NOTA)));
  return nota;
}

export function contenutoDinamico(nodi) {
  const radice = el('div', 'pend-dinamico');
  const r = riepilogo(nodi);
  radice.append(riquadri(r), el('p', 'scheda-nota', t('pendolarismo.suggerimento')));
  radice.append(
    classificaDisegnata(t('pendolarismo.topUscita'), classifica(nodi, 'uscita'), COLORE_USCITA),
    classificaDisegnata(t('pendolarismo.topEntrata'), classifica(nodi, 'entrata'), COLORE_ENTRATA),
    notaQualita(),
  );
  return radice;
}
