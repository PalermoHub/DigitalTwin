// Foglio «Pronto soccorso» della modalità emergenza su telefono: in cima i pazienti in attesa in tutti i presidi, sotto una scheda sintetica per ospedale.
// Il modello (riepilogo e schede) sta in layers/scheda-pronto-soccorso.js; qui c'è solo il disegno.
import { t, tl } from './i18n.js';
import { riepilogoPs, schedaSinteticaPs, ordinaPs } from '../layers/scheda-pronto-soccorso.js';

const el = (doc, tag, classe, testo) => {
  const e = doc.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

function riquadroTotale(doc, r) {
  const q = el(doc, 'section', 'eps-totale');
  q.append(el(doc, 'p', 'eps-etichetta', t('eps.inAttesa')), el(doc, 'p', 'eps-numero', r.conDato ? String(r.inAttesa) : '–'),
    el(doc, 'p', 'eps-sotto', r.conDato ? t('eps.sintesi', { presidi: r.conDato, totale: r.presidi, affollati: r.affollati }) : t('eps.nessunDato')));
  if (r.aggiornato) q.append(el(doc, 'p', 'eps-quando', `${tl('Aggiornato alle')} ${r.aggiornato}`));
  return q;
}

function scheda(doc, s) {
  const c = el(doc, 'article', 'eps-scheda');
  c.style.setProperty('--colore', s.stato.colore);
  const testa = el(doc, 'header', 'eps-testa');
  const nome = el(doc, 'div', 'eps-nome');
  nome.append(el(doc, 'h3', null, s.nome), el(doc, 'span', 'eps-tipo', tl(s.tipo)));
  const attesa = el(doc, 'div', 'eps-attesa');
  attesa.append(el(doc, 'b', null, s.inAttesa), el(doc, 'span', null, tl('in attesa')));
  testa.append(nome, attesa);
  c.append(testa);
  if (s.indice) c.append(el(doc, 'p', 'eps-indice', `${s.indice} · ${tl(s.stato.testo)}`));
  else c.append(el(doc, 'p', 'eps-indice eps-nd', tl(s.stato.testo)));
  const codici = el(doc, 'div', 'eps-codici');
  for (const k of s.codici) {
    const x = el(doc, 'span', `eps-codice eps-${k.chiave}`);
    x.style.setProperty('--codice', k.colore);
    x.append(el(doc, 'small', null, tl(k.nome)), el(doc, 'b', null, k.attesa));
    codici.append(x);
  }
  c.append(codici);
  return c;
}

// Totale, schede e nota: i nodi che stanno nel foglio della mappa e nel pannello «Emergenze» della home.
export const contenutoPs = (doc, lista) => [riquadroTotale(doc, riepilogoPs(lista)), ...ordinaPs(lista).map(p => scheda(doc, schedaSinteticaPs(p))), el(doc, 'p', 'eps-nota', t('eps.nota'))];

// `leggi()` restituisce i presidi (anagrafica + ultima lettura), `aggiorna()` chiede una lettura fresca al Worker.
export function creaFoglioPs(doc, { leggi, aggiorna = async () => {} }) {
  const foglio = el(doc, 'aside', 'eps-foglio');
  foglio.id = 'eps-foglio';
  foglio.hidden = true;
  foglio.setAttribute('aria-label', t('eps.titolo'));
  const testa = el(doc, 'header', 'eps-barra');
  const chiudi = el(doc, 'button', 'eps-x');
  chiudi.type = 'button';
  chiudi.setAttribute('aria-label', t('eps.chiudi'));
  chiudi.textContent = '×';
  testa.append(el(doc, 'h2', null, t('eps.titolo')), chiudi);
  const corpo = el(doc, 'div', 'eps-corpo');
  foglio.append(testa, corpo);
  doc.body.append(foglio);

  const disegna = () => corpo.replaceChildren(...contenutoPs(doc, leggi()));
  const chiudiFoglio = () => { foglio.hidden = true; doc.body.classList.remove('eps-aperto'); };
  const apri = () => { disegna(); foglio.hidden = false; doc.body.classList.add('eps-aperto'); foglio.scrollTop = 0; corpo.scrollTop = 0; aggiorna().then(() => { if (!foglio.hidden) disegna(); }); };
  chiudi.addEventListener('click', chiudiFoglio);
  return { apri, chiudi: chiudiFoglio, aperto: () => !foglio.hidden, disegna };
}
