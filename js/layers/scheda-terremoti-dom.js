// Parti disegnate dei terremoti: i due menu del filtro (legenda e scheda) e l'elenco «Gli altri terremoti» della scheda.
import { disegnaAccordion } from '../core/scheda-disegno.js';
import { t } from '../core/i18n.js';
import { SCELTE_GIORNI, SCELTE_MAGNITUDO, filtro, altriTerremoti, accordionTerremoti, posizioneEvento } from './scheda-terremoti.js';

export const EVENTO_FILTRO = 'terremoti:filtro';

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function menu(etichetta, scelte, valore, testoScelta, suCambio) {
  const lab = el('label', 'terremoti-filtro');
  const sel = el('select');
  for (const v of scelte) {
    const o = el('option', null, testoScelta(v));
    o.value = String(v);
    sel.append(o);
  }
  sel.value = String(valore());
  sel.addEventListener('change', () => suCambio(Number(sel.value)));
  // altri menu uguali (legenda e scheda) seguono la scelta
  const segui = () => (lab.isConnected ? sel.value = String(valore()) : document.removeEventListener(EVENTO_FILTRO, segui));
  document.addEventListener(EVENTO_FILTRO, segui);
  lab.append(el('span', null, etichetta), sel);
  return lab;
}

const cambia = campo => v => {
  filtro[campo] = v;
  document.dispatchEvent(new CustomEvent(EVENTO_FILTRO));
};

export const testoGiorni = g => (g === 1 ? t('terremoti.ultime24') : t('terremoti.ultimiGiorni', { n: g }));

// Periodo e magnitudo minima: valgono per la mappa e per l'elenco
export function menuFiltro() {
  const riga = el('div', 'terremoti-filtri');
  riga.append(
    menu(t('terremoti.periodo'), SCELTE_GIORNI, () => filtro.giorni, testoGiorni, cambia('giorni')),
    menu(t('terremoti.magMin'), SCELTE_MAGNITUDO, () => filtro.magMin, m => `≥ ${m}`, cambia('magMin')),
  );
  return riga;
}

// Contenuto della sezione «Gli altri terremoti»: filtro e fisarmonica che si ridisegna a ogni cambio; `eventi()` = eventi in mappa
export function elencoAltri(eventi, esclusi) {
  const radice = el('div', 'terremoti-elenco');
  const corpo = el('div');
  const disegna = () => {
    const elenco = altriTerremoti(eventi(), esclusi);
    corpo.replaceChildren(elenco.n ? disegnaAccordion(accordionTerremoti(elenco)) : el('p', 'scheda-nota', t('terremoti.nessunAltro')));
  };
  radice.append(menuFiltro(), corpo);
  const aggiorna = () => (radice.isConnected ? disegna() : document.removeEventListener(EVENTO_FILTRO, aggiorna)); // la scheda chiusa non ascolta più
  disegna();
  document.addEventListener(EVENTO_FILTRO, aggiorna);
  return radice;
}

// Barra con le frecce sotto all'evento scelto: passa all'evento più recente (‹) o meno recente (›) tra quelli in mappa.
// `visibili()` = eventi che passano filtri e legenda; `vai(evento)` apre la scheda su quell'evento. Si ridisegna al cambio dei filtri.
export function barraEventi(id, visibili, vai) {
  const radice = el('div', 'terremoti-nav');
  radice.setAttribute('role', 'group');
  radice.setAttribute('aria-label', t('terremoti.nav.gruppo'));
  const bottone = (testo, etichetta, evento) => {
    const b = el('button', 'terremoti-nav-freccia', testo);
    b.type = 'button';
    b.title = b.ariaLabel = etichetta;
    b.disabled = !evento;
    if (evento) b.addEventListener('click', () => vai(evento));
    return b;
  };
  const disegna = () => {
    const q = posizioneEvento(visibili(), id);
    radice.hidden = !q;
    if (!q) return;
    const conta = el('span', 'terremoti-nav-conta', t('terremoti.nav.posto', { n: q.pos, tot: q.tot }));
    conta.setAttribute('aria-live', 'polite');
    radice.replaceChildren(bottone('‹', t('terremoti.nav.recente'), q.prec), conta, bottone('›', t('terremoti.nav.vecchio'), q.succ));
  };
  radice.addEventListener('keydown', e => {
    const freccia = { ArrowLeft: 0, ArrowRight: 2 }[e.key];
    const b = freccia == null ? null : radice.children[freccia];
    if (b && !b.disabled) { e.preventDefault(); e.stopPropagation(); b.click(); }
  });
  const aggiorna = () => (radice.isConnected ? disegna() : document.removeEventListener(EVENTO_FILTRO, aggiorna));
  disegna();
  document.addEventListener(EVENTO_FILTRO, aggiorna);
  return radice;
}
