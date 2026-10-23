// Parti disegnate dei terremoti: i due menu del filtro (legenda e scheda) e l'elenco «Gli altri terremoti» della scheda.
import { disegnaAccordion } from '../core/scheda-disegno.js';
import { t, tn, localeIntl } from '../core/i18n.js';
import { barraNavigazione } from '../core/scheda-navigazione.js';
import { SCELTE_GIORNI, SCELTE_MAGNITUDO, UNITA, MAG_STORICO, filtro, altriTerremoti, accordionTerremoti, posizioneEvento, urlStorico, eventiDaTesto, serieEventi, etichettaBarra, periodoSequenza } from './scheda-terremoti.js';

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
  sel.addEventListener('change', () => suCambio(typeof scelte[0] === 'number' ? Number(sel.value) : sel.value));
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

// Frecce sotto all'evento scelto: passano all'evento più recente (‹) o meno recente (›) tra quelli in mappa; `visibili()` = eventi che passano filtri e legenda
export const barraEventi = (id, visibili, vai) => barraNavigazione({
  posizione: () => posizioneEvento(visibili(), id), vai, evento: EVENTO_FILTRO,
  etichette: { gruppo: t('terremoti.nav.gruppo'), prec: t('terremoti.nav.recente'), succ: t('terremoti.nav.vecchio') },
});

// ---------- serie temporale a barre (sezione «Terremoti nel tempo») ----------
// Lo storico (5 anni, M ≥ 2) si scarica una volta sola, alla prima apertura della sezione, e si tiene per un'ora.
const VALIDITA_STORICO_MS = 3600 * 1000;
let storico = null; // { promessa, quando }
function caricaStorico(area) {
  if (!storico || Date.now() - storico.quando > VALIDITA_STORICO_MS) {
    const promessa = fetch(urlStorico(area)).then(r => {
      if (!r.ok && r.status !== 204) throw new Error(String(r.status));
      return r.status === 204 ? [] : r.text().then(eventiDaTesto);
    });
    storico = { promessa, quando: Date.now() };
    promessa.catch(() => { storico = null; }); // un errore non si ricorda: si riprova alla prossima apertura
  }
  return storico.promessa;
}

const testoUnita = u => t(`terremoti.unita.${u}`);
const num = n => n.toLocaleString(localeIntl());
let unita = 'giorno';

function disegnaSerie(serie) {
  const blocco = el('div', 'terremoti-serie');
  const barre = el('div', 'terremoti-barre');
  const ogni = serie.unita === 'giorno' ? 5 : serie.unita === 'mese' ? 3 : 1; // etichette sotto una barra ogni tanto: lo spazio è poco
  serie.barre.forEach((b, i) => {
    const { breve, lunga } = etichettaBarra(b, serie.unita);
    const colonna = el('div', 'terremoti-barra');
    colonna.title = `${lunga}: ${tn('terremoti.nEventi', b.n, { n: num(b.n) })}${b.magMax == null ? '' : ` · ${t('terremoti.magMax', { mag: b.magMax.toLocaleString(localeIntl(), { minimumFractionDigits: 1 }) })}`}`;
    const asta = el('i', b.sciame ? 'sciame' : null);
    asta.style.height = `${b.n ? Math.max(b.quota, 3) : 0}%`;
    colonna.append(asta, el('span', null, (serie.barre.length - 1 - i) % ogni === 0 ? breve : ''));
    barre.append(colonna);
  });
  blocco.append(barre);
  const nota = serie.totale
    ? t('terremoti.serie.totale', { n: num(serie.totale), mag: Math.max(filtro.magMin, MAG_STORICO), soglia: serie.soglia, unita: testoUnita(serie.unita) })
    : t('terremoti.serie.vuota');
  blocco.append(el('p', 'scheda-nota', nota));
  if (serie.sequenze.length) {
    const elenco = el('div', 'terremoti-sequenze');
    elenco.append(el('h4', null, t('terremoti.sequenze')));
    for (const s of serie.sequenze.slice(0, 5)) {
      const riga = el('div', 'terremoti-sequenza');
      riga.append(
        el('strong', null, periodoSequenza(s, serie.unita)),
        el('span', null, `${s.barre > 1 ? t('terremoti.sequenza') : t('terremoti.sciame')} · ${tn('terremoti.nEventi', s.n, { n: num(s.n) })} · ${t('terremoti.magMax', { mag: s.magMax.toLocaleString(localeIntl(), { minimumFractionDigits: 1 }) })}`),
      );
      elenco.append(riga);
    }
    blocco.append(elenco);
  } else if (serie.totale) blocco.append(el('p', 'scheda-nota', t('terremoti.nessunaSequenza')));
  return blocco;
}

// Contenuto della sezione: menu giorno/mese/anno e barre; si ridisegna al cambio di unità e di magnitudo minima. `area` = riquadro per il servizio INGV.
export function graficoSerie(area) {
  const radice = el('div', 'terremoti-elenco');
  const corpo = el('div');
  let eventi = null;
  const disegna = () => {
    if (eventi) corpo.replaceChildren(disegnaSerie(serieEventi(eventi, unita, filtro.magMin)));
  };
  const carica = () => {
    corpo.replaceChildren(el('p', 'scheda-nota', t('terremoti.serie.carico')));
    caricaStorico(area).then(e => { eventi = e; disegna(); }, () => {
      const riprova = el('button', 'scheda-filtro', t('terremoti.serie.riprova'));
      riprova.type = 'button';
      riprova.addEventListener('click', carica);
      corpo.replaceChildren(el('p', 'scheda-nota', t('terremoti.serie.errore')), riprova);
    });
  };
  const scelta = el('div', 'terremoti-filtri');
  scelta.append(menu(t('terremoti.perUnita'), UNITA, () => unita, testoUnita, v => { unita = v; disegna(); }));
  radice.append(scelta, corpo);
  const segui = () => (radice.isConnected ? disegna() : document.removeEventListener(EVENTO_FILTRO, segui));
  document.addEventListener(EVENTO_FILTRO, segui);
  carica();
  return radice;
}
