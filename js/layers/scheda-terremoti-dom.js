// Parti disegnate dei terremoti: i due menu del filtro (legenda e scheda) e l'elenco «Gli altri terremoti» della scheda.
import { disegnaAccordion } from '../core/scheda-disegno.js';
import { t } from '../core/i18n.js';
import { SCELTE_GIORNI, SCELTE_MAGNITUDO, filtro, altriTerremoti, accordionTerremoti } from './scheda-terremoti.js';

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
