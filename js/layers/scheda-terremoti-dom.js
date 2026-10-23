// Parti disegnate dei terremoti: i due menu del filtro (legenda e scheda) e l'elenco «Gli altri terremoti» della scheda.
import { disegnaAccordion } from '../core/scheda-disegno.js';
import { t, tn, localeIntl } from '../core/i18n.js';
import { barraNavigazione } from '../core/scheda-navigazione.js';
import { SCELTE_GIORNI, SCELTE_MAGNITUDO, UNITA, MAG_STORICO, filtro, altriTerremoti, accordionTerremoti, posizioneEvento, urlStorico, eventiDaTesto, serieEventi, puntiMagnitudo, curvaCumulativa, etichettaBarra, periodoSequenza } from './scheda-terremoti.js';

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

// Magnitudo-tempo: uno stelo per evento, alto quanto la magnitudo; la mainshock è in rosso con l'etichetta.
const SVG = 'http://www.w3.org/2000/svg';
const L = 320, A = 150, MS = 28, MD = 8, MA = 8, MB = 18; // viewBox e margini (sinistro, destro, alto, basso)
function nodoSvg(tag, attributi, titolo) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attributi)) n.setAttribute(k, v);
  if (titolo) n.append(Object.assign(document.createElementNS(SVG, 'title'), { textContent: titolo }));
  return n;
}
const dataEvento = ts => new Date(ts).toLocaleString(localeIntl(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function disegnaMagnitudoTempo(g, apri) {
  const blocco = el('div', 'terremoti-serie');
  blocco.append(el('h4', 'terremoti-titolo', t('terremoti.mt.titolo')));
  if (!g.punti.length) {
    blocco.append(el('p', 'scheda-nota', t('terremoti.serie.vuota')));
    return blocco;
  }
  const px = x => MS + x * (L - MS - MD), py = y => A - MB - y * (A - MB - MA);
  const svg = nodoSvg('svg', { viewBox: `0 0 ${L} ${A}`, class: 'terremoti-mt', role: 'img', 'aria-label': t('terremoti.mt.titolo') });
  for (const m of g.livelli) {
    svg.append(nodoSvg('line', { x1: MS, x2: L - MD, y1: py((m - g.base) / (g.cima - g.base)), y2: py((m - g.base) / (g.cima - g.base)), class: 'asse' }));
    const e = nodoSvg('text', { x: MS - 4, y: py((m - g.base) / (g.cima - g.base)) + 3, 'text-anchor': 'end', class: 'et' });
    e.textContent = `M${m}`;
    svg.append(e);
  }
  const date = [g.da, g.a];
  date.forEach((ts, i) => {
    const e = nodoSvg('text', { x: i ? L - MD : MS, y: A - 4, 'text-anchor': i ? 'end' : 'start', class: 'et' });
    e.textContent = new Date(ts).toLocaleDateString(localeIntl(), { day: 'numeric', month: 'short', year: '2-digit' });
    svg.append(e);
  });
  for (const p of g.punti) {
    const forte = p === g.mainshock;
    const x = px(p.x), y = py(p.y);
    const gruppo = nodoSvg('g', { class: forte ? 'forte' : 'evento' }, `M ${p.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 })} · ${dataEvento(p.ts)}`);
    gruppo.append(nodoSvg('line', { x1: x, x2: x, y1: py(0), y2: y }), nodoSvg('circle', { cx: x, cy: y, r: forte ? 4 : 2 }));
    if (apri && Number.isFinite(p.lon)) { // clic su uno stelo: l'evento si apre in mappa (la zona sensibile è larga 8 px)
      gruppo.classList.add('apribile');
      gruppo.setAttribute('tabindex', '0');
      gruppo.setAttribute('role', 'button');
      gruppo.append(nodoSvg('line', { x1: x, x2: x, y1: py(0), y2: y - 3, class: 'zona' }));
      gruppo.addEventListener('click', () => apri(p));
      gruppo.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); apri(p); } });
    }
    svg.append(gruppo);
  }
  const m = g.mainshock;
  const dx = px(m.x);
  const et = nodoSvg('text', { x: dx > L / 2 ? dx - 7 : dx + 7, y: py(m.y) + 3, 'text-anchor': dx > L / 2 ? 'end' : 'start', class: 'et forte' });
  et.textContent = `M ${m.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 })}`;
  svg.append(et);
  blocco.append(svg, el('p', 'scheda-nota', t('terremoti.mt.nota', { n: num(g.punti.length), mag: g.base, forte: m.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 }), data: dataEvento(m.ts), repliche: num(g.repliche) })));
  return blocco;
}

// Curva cumulativa: scala degli eventi accumulati; l'asse verticale va da 0 al totale
function disegnaCurva(g) {
  const c = curvaCumulativa(g);
  if (!c.totale) return el('div'); // senza eventi la nota del grafico precedente basta
  const blocco = el('div', 'terremoti-serie');
  blocco.append(el('h4', 'terremoti-titolo', t('terremoti.cum.titolo')));
  const px = x => MS + x * (L - MS - MD), py = n => A - MB - n / c.totale * (A - MB - MA);
  const svg = nodoSvg('svg', { viewBox: `0 0 ${L} ${A}`, class: 'terremoti-mt terremoti-cum', role: 'img', 'aria-label': t('terremoti.cum.titolo') });
  for (const n of [0, c.totale]) {
    svg.append(nodoSvg('line', { x1: MS, x2: L - MD, y1: py(n), y2: py(n), class: 'asse' }));
    const e = nodoSvg('text', { x: MS - 4, y: py(n) + 3, 'text-anchor': 'end', class: 'et' });
    e.textContent = num(n);
    svg.append(e);
  }
  [g.da, g.a].forEach((ts, i) => {
    const e = nodoSvg('text', { x: i ? L - MD : MS, y: A - 4, 'text-anchor': i ? 'end' : 'start', class: 'et' });
    e.textContent = new Date(ts).toLocaleDateString(localeIntl(), { day: 'numeric', month: 'short', year: '2-digit' });
    svg.append(e);
  });
  const vertici = c.passi.map(p => `${px(p.x).toFixed(1)},${py(p.n).toFixed(1)}`);
  svg.append(
    nodoSvg('polygon', { points: `${px(0)},${py(0)} ${vertici.join(' ')} ${px(1)},${py(0)}`, class: 'area' }),
    nodoSvg('polyline', { points: vertici.join(' '), class: 'curva' }),
  );
  blocco.append(svg, el('p', 'scheda-nota', t('terremoti.cum.nota', { n: num(c.totale), mag: g.base })));
  return blocco;
}

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
export function graficoSerie(area, apri) {
  const radice = el('div', 'terremoti-elenco');
  const corpo = el('div');
  let eventi = null;
  const disegna = () => {
    const g = eventi && puntiMagnitudo(eventi, unita, filtro.magMin);
    if (eventi) corpo.replaceChildren(disegnaSerie(serieEventi(eventi, unita, filtro.magMin)), disegnaMagnitudoTempo(g, apri), disegnaCurva(g));
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
