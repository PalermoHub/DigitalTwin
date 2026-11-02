// Parti disegnate della scheda «Camminabilità»: tre riquadri (punteggio, Reach, qualità della strada) e, per ognuno degli otto
// bisogni, una barra col punteggio 0–100 e i luoghi raggiungibili in 5 e 10 minuti. Il modello puro sta in scheda-camminabilita.js.
import { localeIntl, t, tl } from '../core/i18n.js';
import { titoloConInfo } from '../core/info-grafico.js';
import { classePerPunteggio, tabellaBisogni, dentroParco, stradaIsolataM } from './scheda-camminabilita.js';

const num = v => Number(v).toLocaleString(localeIntl(), { maximumFractionDigits: 1 });

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function riquadro(valore, etichetta, colore) {
  const c = el('div', 'cam-riquadro');
  const v = el('div', 'cam-val', Number.isFinite(Number(valore)) ? num(valore) : '–');
  if (colore) v.style.borderBottomColor = colore;
  c.append(v, el('div', 'cam-et', tl(etichetta)));
  return c;
}

// «3» entro 5 minuti, «12+» se il conteggio è al tetto
const conta = (n, oltre) => `${n}${oltre ? '+' : ''}`;

function rigaBisogno(b) {
  const riga = el('div', 'cam-riga');
  const testa = el('div', 'cam-riga-testa');
  testa.append(el('span', null, tl(b.etichetta)), el('span', 'cam-riga-val', b.punteggio != null ? num(b.punteggio) : '–'));
  const traccia = el('div', 'cam-barra');
  const riempi = el('i');
  riempi.style.width = `${Math.max(0, Math.min(100, b.punteggio ?? 0))}%`;
  riempi.style.background = classePerPunteggio(b.punteggio ?? 0).colore;
  traccia.append(riempi);
  const sotto = el('div', 'cam-riga-sotto', t('camminabilita.entro', { a: conta(b.entro5, b.oltre5), b: conta(b.entro10, b.oltre10) }));
  riga.append(testa, traccia, sotto);
  return riga;
}

export function contenutoDinamico(p) {
  const radice = el('div', 'cam-dinamico');
  const c = classePerPunteggio(Number(p.s));
  const riquadri = el('div', 'cam-riquadri');
  riquadri.append(riquadro(p.s, 'Punteggio', c.colore), riquadro(p.r, 'Reach', null), riquadro(p.q, 'Strada', null));
  radice.append(riquadri);

  const blocco = el('div', 'cam-bisogni');
  blocco.append(titoloConInfo('h4', 'cam-titolo', tl('Punteggio per bisogno'), 'camminabilita-bisogni'));
  for (const b of tabellaBisogni(p)) blocco.append(rigaBisogno(b));
  radice.append(blocco);

  const parco = dentroParco(p);
  if (parco.length) radice.append(el('p', 'scheda-nota', t('camminabilita.parco', { cose: parco.join(', ') })));
  const isola = stradaIsolataM(p);
  if (isola != null) radice.append(el('p', 'scheda-nota', t('camminabilita.isolata', { m: num(isola) })));
  return radice;
}
