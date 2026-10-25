// Parti disegnate dei terremoti: i due menu del filtro (legenda e scheda) e l'elenco «Gli altri terremoti» della scheda.
import { disegnaAccordion } from '../core/scheda-disegno.js';
import { t, tn, localeIntl } from '../core/i18n.js';
import { titoloConInfo } from '../core/info-grafico.js';
import { barraNavigazione } from '../core/scheda-navigazione.js';
import { SCELTE_GIORNI, SCELTE_MAGNITUDO, UNITA, MAG_STORICO, filtro, altriTerremoti, accordionTerremoti, posizioneEvento, urlStorico, eventiDaTesto, serieEventi, puntiMagnitudo, curvaCumulativa, omori, rilascioCumulativo, tempiTraEventi, spazioTempo, etichettaBarra, periodoSequenza } from './scheda-terremoti.js';

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
  if (campo === 'giorni') filtro.finestra = null; // il menu «Periodo» sostituisce l'intervallo dello slider
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
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.mt.titolo'), 'mt'));
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
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.cum.titolo'), 'cum'));
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

// Legge di Omori: repliche per giorno dopo la mainshock, assi logaritmici (decadimento ≈ retta)
function disegnaOmori(g) {
  const o = omori(g);
  const v = o.giorni.filter(d => d.n > 0);
  if (!o.mainshock || !v.length) return el('div');
  const blocco = el('div', 'terremoti-serie');
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.omori.titolo'), 'omori'));
  const tMax = Math.max(10, o.giorni.length + 0.5), nMax = Math.max(10, ...v.map(d => d.n));
  const decT = Math.ceil(Math.log10(tMax)), decN = Math.ceil(Math.log10(nMax));
  const x0 = Math.log10(0.5), px = tt => MS + (Math.log10(tt) - x0) / (decT - x0) * (L - MS - MD);
  const py = n => A - MB - Math.log10(n) / decN * (A - MB - MA);
  const svg = nodoSvg('svg', { viewBox: `0 0 ${L} ${A}`, class: 'terremoti-mt terremoti-omori', role: 'img', 'aria-label': t('terremoti.omori.titolo') });
  for (let k = 0; k <= decN; k++) {
    svg.append(nodoSvg('line', { x1: MS, x2: L - MD, y1: py(10 ** k), y2: py(10 ** k), class: 'asse' }));
    const e = nodoSvg('text', { x: MS - 4, y: py(10 ** k) + 3, 'text-anchor': 'end', class: 'et' });
    e.textContent = num(10 ** k);
    svg.append(e);
  }
  for (let k = 0; k <= decT; k++) {
    const e = nodoSvg('text', { x: px(10 ** k), y: A - 4, 'text-anchor': 'middle', class: 'et' });
    e.textContent = t('terremoti.omori.giorno', { n: num(10 ** k) });
    svg.append(e);
  }
  if (o.fit) {
    const f = tt => py(10 ** (o.fit.logK - o.fit.p * Math.log10(tt)));
    const [a, b] = [0.5, tMax];
    svg.append(nodoSvg('line', { x1: px(a), x2: px(b), y1: Math.max(f(a), MA), y2: Math.min(f(b), A - MB), class: 'fit' }));
  }
  for (const d of v) svg.append(nodoSvg('circle', { cx: px(d.t), cy: py(d.n), r: 2.5, class: 'punto' }, `${t('terremoti.omori.giorno', { n: Math.ceil(d.t) })}: ${tn('terremoti.nEventi', d.n, { n: num(d.n) })}`));
  blocco.append(svg, el('p', 'scheda-nota', t(o.fit ? 'terremoti.omori.nota' : 'terremoti.omori.notaPoca', { forte: o.mainshock.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 }), data: dataEvento(o.mainshock.ts), p: o.fit ? o.fit.p.toLocaleString(localeIntl(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '' })));
  return blocco;
}

// Rilascio cumulativo di energia (momento sismico): quota del totale, dominata dagli eventi grandi
function disegnaRilascio(g) {
  const r = rilascioCumulativo(g);
  if (!r.totale) return el('div');
  const blocco = el('div', 'terremoti-serie');
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.energia.titolo'), 'energia'));
  const px = x => MS + x * (L - MS - MD), py = f => A - MB - f * (A - MB - MA);
  const svg = nodoSvg('svg', { viewBox: `0 0 ${L} ${A}`, class: 'terremoti-mt terremoti-cum terremoti-energia', role: 'img', 'aria-label': t('terremoti.energia.titolo') });
  for (const f of [0, 0.5, 1]) {
    svg.append(nodoSvg('line', { x1: MS, x2: L - MD, y1: py(f), y2: py(f), class: 'asse' }));
    const e = nodoSvg('text', { x: MS - 4, y: py(f) + 3, 'text-anchor': 'end', class: 'et' });
    e.textContent = `${f * 100}%`;
    svg.append(e);
  }
  [g.da, g.a].forEach((ts, i) => {
    const e = nodoSvg('text', { x: i ? L - MD : MS, y: A - 4, 'text-anchor': i ? 'end' : 'start', class: 'et' });
    e.textContent = new Date(ts).toLocaleDateString(localeIntl(), { day: 'numeric', month: 'short', year: '2-digit' });
    svg.append(e);
  });
  const vertici = r.passi.map(p => `${px(p.x).toFixed(1)},${py(p.f).toFixed(1)}`);
  svg.append(nodoSvg('polygon', { points: `${px(0)},${py(0)} ${vertici.join(' ')} ${px(1)},${py(0)}`, class: 'area' }), nodoSvg('polyline', { points: vertici.join(' '), class: 'curva' }));
  blocco.append(svg, el('p', 'scheda-nota', t('terremoti.energia.nota', { mag: r.magEquiv.toLocaleString(localeIntl(), { maximumFractionDigits: 1 }), forte: g.mainshock.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 }), quota: Math.round(r.quotaMax * 100), n: num(g.punti.length) })));
  return blocco;
}

// Tempi tra eventi successivi: istogramma delle attese, da brevissime (sciame) a lunghe (attività di fondo)
const nomeAttesa = min => (min < 60 ? `${min}${t('terremoti.attesa.min')}` : min < 1440 ? `${min / 60}${t('terremoti.attesa.ore')}` : min < 525600 ? `${min / 1440}${t('terremoti.attesa.giorni')}` : `1${t('terremoti.attesa.anni')}`);
const intervalloAttesa = c => (c.a === Infinity ? `> ${nomeAttesa(c.da)}` : c.da ? `${nomeAttesa(c.da)} – ${nomeAttesa(c.a)}` : `< ${nomeAttesa(c.a)}`);
function disegnaAttese(g) {
  const a = tempiTraEventi(g);
  if (!a) return el('div');
  const blocco = el('div', 'terremoti-serie');
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.attese.titolo'), 'attese'));
  const barre = el('div', 'terremoti-barre');
  for (const c of a.classi) {
    const colonna = el('div', 'terremoti-barra');
    colonna.title = `${intervalloAttesa(c)}: ${num(c.n)}`;
    const asta = el('i', c.da < 1440 && c.n ? 'sciame' : null); // attese sotto un giorno = eventi ravvicinati
    asta.style.height = `${c.n ? Math.max(c.n / a.max * 100, 3) : 0}%`;
    colonna.append(asta, el('span', null, c.da ? nomeAttesa(c.da) : `<${nomeAttesa(c.a)}`));
    barre.append(colonna);
  }
  const med = a.mediana < 60 ? `${num(Math.round(a.mediana))} ${t('terremoti.attesa.min')}` : a.mediana < 1440 ? `${num(Math.round(a.mediana / 60))} ${t('terremoti.attesa.ore')}` : `${num(Math.round(a.mediana / 1440))} ${t('terremoti.attesa.giorni')}`;
  blocco.append(barre, el('p', 'scheda-nota', t('terremoti.attese.nota', { n: num(a.n), mediana: med, cv: a.cv.toLocaleString(localeIntl(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })));
  return blocco;
}

// Diagramma spazio-tempo: latitudine contro tempo, un cerchio per evento
function disegnaSpazioTempo(g, apri) {
  const st = spazioTempo(g);
  if (!st) return el('div');
  const blocco = el('div', 'terremoti-serie');
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.st.titolo'), 'spaziotempo'));
  const px = x => MS + x * (L - MS - MD), py = y => A - MB - y * (A - MB - MA);
  const svg = nodoSvg('svg', { viewBox: `0 0 ${L} ${A}`, class: 'terremoti-mt terremoti-st', role: 'img', 'aria-label': t('terremoti.st.titolo') });
  for (const y of [0, 0.5, 1]) {
    svg.append(nodoSvg('line', { x1: MS, x2: L - MD, y1: py(y), y2: py(y), class: 'asse' }));
    const e = nodoSvg('text', { x: MS - 4, y: py(y) + 3, 'text-anchor': 'end', class: 'et' });
    e.textContent = `${(st.latMin + y * (st.latMax - st.latMin)).toLocaleString(localeIntl(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°`;
    svg.append(e);
  }
  [g.da, g.a].forEach((ts, i) => {
    const e = nodoSvg('text', { x: i ? L - MD : MS, y: A - 4, 'text-anchor': i ? 'end' : 'start', class: 'et' });
    e.textContent = new Date(ts).toLocaleDateString(localeIntl(), { day: 'numeric', month: 'short', year: '2-digit' });
    svg.append(e);
  });
  for (const p of st.punti) {
    const forte = p === st.mainshock;
    const gruppo = nodoSvg('g', { class: forte ? 'forte' : 'evento' }, `M ${p.mag.toLocaleString(localeIntl(), { minimumFractionDigits: 1 })} · ${dataEvento(p.ts)}`);
    gruppo.append(nodoSvg('circle', { cx: px(p.x), cy: py(p.y), r: Math.max(1.5, (p.mag - 1) * 1.6), class: 'pt' }));
    if (apri && Number.isFinite(p.lon)) {
      gruppo.classList.add('apribile');
      gruppo.setAttribute('tabindex', '0');
      gruppo.setAttribute('role', 'button');
      gruppo.addEventListener('click', () => apri(p));
      gruppo.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); apri(p); } });
    }
    svg.append(gruppo);
  }
  blocco.append(svg, el('p', 'scheda-nota', t('terremoti.st.nota', { n: num(st.punti.length) })));
  return blocco;
}

function disegnaSerie(serie) {
  const blocco = el('div', 'terremoti-serie');
  blocco.append(titoloConInfo('h4', 'terremoti-titolo', t('terremoti.barre.titolo'), 'barre'));
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
    if (eventi) corpo.replaceChildren(disegnaSerie(serieEventi(eventi, unita, filtro.magMin)), disegnaMagnitudoTempo(g, apri), disegnaCurva(g), disegnaRilascio(g), disegnaOmori(g), disegnaAttese(g), disegnaSpazioTempo(g, apri));
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
