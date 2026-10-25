// Pagina iniziale (index.html): slider «in evidenza» e card degli strati, ciascuna con il link che apre la mappa con lo strato acceso.
import { caricaDizionari, applicaDom, lingua, t as tr, tl } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { codifica, costruisciLink, PARAMETRO } from './core/condivisione-codec.js';
import { svgIcona } from './core/icone.js';
import { leggiCesto, salvaCesto, apreSubito } from './core/cesto-home.js';
import { MEDIA_TELEFONO } from './core/modo-emergenza.js';
import { precaricaMappaARiposo } from './core/precarica-mappa.js';
import { avviaHomeMobile } from './core/home-mobile.js';
import { scegliProxy } from './rndt/proxy.js';
import { livelloMassimo, nomeLivello, riassuntoGiorno, LINK as LINK_BOLLETTINO } from './layers/scheda-allerte.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const el = (tag, props = {}, ...figli) => { const e = Object.assign(document.createElement(tag), props); e.append(...figli); return e; };
const normalizza = s => s.toLocaleLowerCase(lingua()).normalize('NFD').replace(/\p{Diacritic}/gu, '');

const radice = document.documentElement;
// Link alla mappa: lo stato condiviso con i soli strati voluti (senza vista, la mappa resta dov'è di default).
const MAPPA = new URL('mappa.html', location.href).href;
async function linkMappa(strati, legendeSuMappa = false, vista = null) {
  try {
    const { testo } = await codifica({ a: strati, ...(legendeSuMappa && { m: 1 }), ...(vista && { c: vista }) });
    return costruisciLink(MAPPA, testo);
  } catch {
    return MAPPA;
  }
}

// ---- strati scelti ("aggiunti alla mappa"): restano in sessionStorage finché non si apre la mappa ----
const archivioCesto = (() => { try { return window.sessionStorage; } catch { return null; } })();
const cesto = new Set(leggiCesto(archivioCesto));
const bottoniStrato = []; // { bottone, strati } da tenere allineati al cesto

function aggiornaBottone(bottone, strati) {
  const dentro = strati.length > 0 && strati.every(id => cesto.has(id));
  bottone.setAttribute('aria-pressed', String(dentro));
  bottone.classList.toggle('aggiunto', dentro);
  bottone.textContent = dentro ? tr('home.aggiunto') : tr(bottone.dataset.tutti ? 'home.aggiungi.tutti' : 'home.aggiungi');
}

function aggiornaCesto() {
  salvaCesto(archivioCesto, cesto);
  for (const { bottone, strati } of bottoniStrato) aggiornaBottone(bottone, strati);
  const barra = document.getElementById('home-cesto');
  barra.hidden = cesto.size === 0;
  document.getElementById('home-cesto-conta').textContent = tr(cesto.size === 1 ? 'home.cesto.uno' : 'home.cesto.altri', { n: cesto.size });
  linkMappa([...cesto]).then(href => { document.getElementById('home-cesto-apri').href = href; });
}

// Pulsante che mette (o toglie) gli strati dal cesto; `etichetta` dà il nome accessibile.
function bottoneAggiungi(strati, etichetta, classe = 'strato-aggiungi') {
  const bottone = el('button', { type: 'button', className: classe });
  bottone.setAttribute('aria-label', `${etichetta}`);
  bottone.addEventListener('click', e => {
    e.stopPropagation();
    if (strati.every(id => cesto.has(id))) for (const id of strati) cesto.delete(id);
    else {
      for (const id of strati) cesto.add(id);
      if (apreSubito(strati, matchMedia(MEDIA_TELEFONO).matches)) { aggiornaCesto(); linkMappa([...cesto]).then(href => location.assign(href)); return; }
    }
    aggiornaCesto();
  });
  bottoniStrato.push({ bottone, strati });
  aggiornaBottone(bottone, strati); // l'etichetta c'è subito: se arrivasse dopo, il pulsante farebbe crescere la diapositiva (CLS)
  return bottone;
}

document.getElementById('home-cesto-svuota').addEventListener('click', () => { cesto.clear(); aggiornaCesto(); });

// ---- indice delle sezioni: barra fissa sotto l'intestazione, evidenzia la sezione in vista ----
const SEZIONI = ['in-evidenza', 'numeri', 'strati', 'catalogo', 'perche', 'tavolo'];
const riduci = matchMedia('(prefers-reduced-motion: reduce)').matches;
function costruisciIndice() {
  const indice = document.getElementById('home-indice');
  const voci = SEZIONI.map(id => {
    const a = el('a', { href: `#${id}`, textContent: tr(`home.indice.${id === 'in-evidenza' ? 'evidenza' : id}`) });
    a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(id).scrollIntoView({ behavior: riduci ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${id}`);
    });
    indice.append(a);
    return a;
  });
  // il CSS usa l'altezza reale di intestazione e indice per l'aggancio dei titoli
  const header = document.getElementById('app-header');
  const misura = () => {
    radice.style.setProperty('--home-header', `${header.offsetHeight}px`);
    radice.style.setProperty('--home-sticky', `${header.offsetHeight + indice.offsetHeight}px`);
  };
  new ResizeObserver(misura).observe(header);
  misura();
  const visibili = new Map();
  const evidenzia = () => {
    const attiva = SEZIONI.filter(id => visibili.get(id)).at(-1) ?? SEZIONI[0];
    voci.forEach((a, i) => { if (SEZIONI[i] === attiva) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  // una sezione è «corrente» quando ha superato la fascia alta dello schermo
  const osserva = new IntersectionObserver(voce => {
    for (const v of voce) visibili.set(v.target.id, v.boundingClientRect.top < innerHeight * .4);
    evidenzia();
  }, { rootMargin: '0px 0px -60% 0px', threshold: [0, 1] });
  for (const id of SEZIONI) osserva.observe(document.getElementById(id));
  window.addEventListener('scroll', () => {
    for (const id of SEZIONI) visibili.set(id, document.getElementById(id).getBoundingClientRect().top < innerHeight * .4);
    evidenzia();
  }, { passive: true });
  evidenzia();
}

const conteggi = {}; // numeri per le pastiglie dei pulsanti su telefono: id fascia → quanti
let homeMobile = null; // impaginazione a tendine su telefono (core/home-mobile.js)
let creaCardEmergenza = null; // nuova card dello strato di emergenza, per il pannello «Emergenze» del telefono

// ---- numeri: conteggi ricavati dall'elenco stesso, ogni tessera porta alla sezione giusta ----
function costruisciNumeri(argomenti, tutte) {
  const distinti = valori => new Set(valori.filter(Boolean)).size;
  const dati = [
    ['strati', tutte.length, '#catalogo'],
    ['argomenti', argomenti.length, '#home-argomenti'],
    ['fonti', distinti(argomenti.flatMap(a => a.enti ?? [])), 'mappa.html#fonti'],
  ];
  const nf = new Intl.NumberFormat(lingua());
  conteggi.catalogo = tutte.length;
  conteggi.numeri = dati[2][1];
  document.getElementById('home-numeri').append(...dati.map(([chiave, n, dest]) => {
    const a = el('a', { href: dest, className: 'numero' },
      el('strong', { textContent: nf.format(n) }), el('span', { textContent: tr(`home.numeri.${chiave}`) }));
    // le tessere che puntano a un'altra pagina (il tab «Fonti e note» della mappa) seguono il link
    if (dest.startsWith('#')) a.addEventListener('click', e => {
      e.preventDefault();
      const bersaglio = document.querySelector(dest);
      homeMobile?.apriPerElemento(bersaglio); // su telefono la tendina del catalogo è chiusa: va aperta prima di scorrere
      bersaglio.scrollIntoView({ behavior: riduci ? 'auto' : 'smooth' });
    });
    return el('li', {}, a);
  }));
}

// ---- slider ----
// le ultime cinque novità, la più recente per prima: quando si aggiunge uno strato nuovo, entra in testa al posto del più vecchio
const SLIDE = [
  { id: 'protezione-civile', img: 'img/home/strati/protezione-civile.webp', strati: ['protezione-civile'] },
  { id: 'terremoti', img: 'img/home/strati/terremoti.webp', strati: ['terremoti'] },
  { id: 'traffico', img: 'img/home/strati/traffico.webp', strati: ['traffico'] },
  { id: 'radar-allerte', img: 'img/home/strati/radar-allerte.webp', strati: ['allerte', 'radar'] },
  { id: 'satelliti', img: 'img/home/strati/satelliti.webp', strati: ['satelliti'] },
];

function costruisciSlider() {
  const pista = document.getElementById('slide-pista');
  const punti = document.getElementById('slide-punti');
  const diapositive = SLIDE.map((s, i) => {
    const vai = bottoneAggiungi(s.strati, tr(`home.slide.${s.id}.titolo`), 'slide-vai');
    const slide = el('div', { className: 'slide', role: 'group' },
      el('img', { src: s.img, alt: tr(`home.slide.${s.id}.alt`), width: 1600, height: 700, loading: i === 0 ? 'eager' : 'lazy' }),
      el('div', { className: 'slide-testo' }, el('h3', { textContent: tr(`home.slide.${s.id}.titolo`) }), el('p', { textContent: tr(`home.slide.${s.id}.testo`) }), vai));
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} / ${SLIDE.length}`);
    return slide;
  });
  pista.append(...diapositive);
  const bottoni = SLIDE.map((s, i) => {
    const b = el('button', { type: 'button' });
    b.setAttribute('aria-label', tr('home.slider.vai', { n: i + 1 }));
    b.addEventListener('click', () => vaiA(i, true));
    return b;
  });
  punti.append(...bottoni);

  let corrente = 0;
  let timer = null;
  const vaiA = (i, manuale = false) => {
    corrente = (i + SLIDE.length) % SLIDE.length;
    pista.style.transform = `translateX(${-100 * corrente}%)`;
    diapositive.forEach((d, k) => { d.inert = k !== corrente; });
    bottoni.forEach((b, k) => { if (k === corrente) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    if (manuale) ferma();
  };
  const ferma = () => { clearInterval(timer); timer = null; };
  const avvia = () => {
    if (timer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = setInterval(() => vaiA(corrente + 1), 6000);
  };
  document.getElementById('slide-prec').addEventListener('click', () => vaiA(corrente - 1, true));
  document.getElementById('slide-succ').addEventListener('click', () => vaiA(corrente + 1, true));
  const box = document.getElementById('home-slider');
  box.addEventListener('mouseenter', ferma);
  box.addEventListener('focusin', ferma);
  box.addEventListener('mouseleave', avvia);
  document.addEventListener('visibilitychange', () => (document.hidden ? ferma() : avvia()));
  vaiA(0);
  avvia();
}

// ---- elenco degli strati ----
const NUOVO_GIORNI = 7; // una scheda è «Nuova» per una settimana dopo l'aggiunta alla mappa
const GIORNO = 86400000;
const STRATI_EMERGENZA = new Set(['protezione-civile']); // scheda col badge «Emergenza» e bordo rosso, come il percorso «Aree di emergenza»
const isNuovo = data => !!data && Date.now() - new Date(data).getTime() <= NUOVO_GIORNI * GIORNO;
const formatoData = data => new Date(data).toLocaleDateString(lingua(), { day: 'numeric', month: 'long', year: 'numeric' });

// Card a due facce: davanti immagine, titolo, descrizione e pulsante; dietro i dettagli. Si gira col clic sulla card.
function costruisciCard(s, a) {
  const li = el('li', { className: 'strato-card' });
  li.classList.toggle('emerg', STRATI_EMERGENZA.has(s.id));
  const interno = el('div', { className: 'card-interno' });
  const chip = [a.titolo, s.sezione].filter(Boolean);
  // sul fronte: ultimo aggiornamento dei dati, o la data di aggiunta se non sono mai stati aggiornati
  // uno strato con data propria (aggiunto dopo gli altri dell'argomento) mostra quella, non l'aggiornamento dei dati dell'argomento
  const data = s.data ?? a.data;
  const dataCard = a.aggiornati && !s.data ? tr('home.card.aggiornato', { data: formatoData(a.aggiornati) }) : data ? tr('home.card.aggiunto', { data: formatoData(data) }) : '';
  const fronte = el('div', { className: 'card-faccia card-fronte' },
    ...(STRATI_EMERGENZA.has(s.id) ? [el('span', { className: 'card-emergenza', textContent: tr('home.emergenza') })] : []),
    ...(isNuovo(data) ? [el('span', { className: 'card-nuovo', textContent: tr('home.nuovo') })] : []),
    el('img', { className: 'card-img', src: `img/home/strati/${s.id}.webp`, alt: '', title: s.etichetta, width: 640, height: 360, loading: 'lazy' }),
    el('div', { className: 'card-corpo' },
      el('h4', { textContent: s.etichetta }),
      el('p', { className: 'card-testo', textContent: s.nota || a.descrizione }),
      ...(dataCard ? [el('p', { className: 'card-data', textContent: dataCard })] : []),
      el('div', { className: 'card-chip' }, ...chip.map(c => el('span', { textContent: c })))));
  const dettagli = el('button', { type: 'button', className: 'card-gira', textContent: `↻ ${tr('home.dettagli')}` });
  fronte.append(el('div', { className: 'card-piede' }, dettagli, bottoneAggiungi([s.id], s.etichetta)));

  const riga = (k, v) => (v ? [el('dt', { textContent: tr(k) }), el('dd', { textContent: v })] : []);
  const retro = el('div', { className: 'card-faccia card-retro' },
    el('h4', { textContent: s.etichetta }),
    el('dl', {}, ...riga('home.retro.argomento', a.titolo), ...riga('home.retro.ambito', s.sezione), ...riga('home.retro.fonte', a.fonte), ...riga('home.retro.aggiunto', data && formatoData(data)), ...riga('home.retro.aggiornati', !s.data && a.aggiornati && formatoData(a.aggiornati)), ...(a.link?.length ? [el('dt', { textContent: tr('home.retro.risorse') }), el('dd', {}, el('ul', { className: 'card-risorse' }, ...a.link.map(([testo, href]) => el('li', {}, el('a', { href, textContent: testo, target: '_blank', rel: 'noopener' })))))] : []), ...riga('home.retro.nota', s.nota)),
    el('div', { className: 'card-piede' },
      bottoneAggiungi([s.id], s.etichetta)));
  interno.append(fronte, retro);
  li.append(interno);

  const gira = girata => {
    li.classList.toggle('girata', girata);
    fronte.inert = girata;
    retro.inert = !girata;
  };
  gira(false);
  li.addEventListener('click', e => { if (!e.target.closest('a')) gira(!li.classList.contains('girata')); });
  return li;
}

async function costruisciElenco() {
  const elenco = document.getElementById('home-elenco');
  let argomenti;
  try {
    argomenti = (await (await fetch(new URL('./core/home-strati.json', import.meta.url))).json())[lingua()];
  } catch {
    elenco.textContent = tr('home.errore');
    return;
  }
  // un solo elenco di card, in ordine alfabetico; gli argomenti servono da filtro
  const tutte = argomenti.flatMap(a => a.strati.map(s => ({ s, a }))).sort((x, y) => x.s.etichetta.localeCompare(y.s.etichetta, lingua(), { sensitivity: 'base' }));
  const card = tutte.map(({ s, a }, i) => {
    const li = costruisciCard(s, a);
    li.dataset.ordine = i;
    li.dataset.data = s.data ?? a.data ?? '';
    li.dataset.testo = normalizza(`${s.etichetta} ${a.titolo} ${s.sezione ?? ''}`);
    li.dataset.argomento = a.id;
    li.dataset.enti = (a.enti ?? []).join('|');
    li.dataset.strato = s.id;
    return li;
  });
  costruisciNumeri(argomenti, tutte);
  const emergenza = tutte.find(({ s }) => STRATI_EMERGENZA.has(s.id));
  if (emergenza) creaCardEmergenza = () => costruisciCard(emergenza.s, emergenza.a);
  const ul = el('ul', { className: 'home-card-elenco' }, ...card);
  elenco.append(ul);

  // filtri a menu a tendina (argomento, ente) a scalare: più voci = strati di una qualsiasi, ogni menu offre solo le voci compatibili con l'altro e con la ricerca
  const scelti = new Set();
  const entiScelti = new Set();
  const conteEnti = new Set(argomenti.flatMap(a => a.enti ?? []));
  const menu = [
    { id: 'argomenti', chiave: 'home.menu.argomenti', set: scelti, voci: argomenti.map(a => ({ id: a.id, nome: a.titolo })) },
    // gli enti sono dichiarati per argomento, non per strato: niente conteggio, sarebbe sovrastimato
    { id: 'enti', chiave: 'home.menu.enti', set: entiScelti, voci: [...conteEnti].sort((x, y) => x.localeCompare(y, lingua(), { sensitivity: 'base' })).map(e => ({ id: e, nome: e })) },
  ].map(m => {
    const det = document.getElementById(`home-menu-${m.id}`);
    const caselle = m.voci.map(v => {
      const input = el('input', { type: 'checkbox', value: v.id });
      input.addEventListener('change', () => { input.checked ? m.set.add(v.id) : m.set.delete(v.id); filtra(); });
      const testo = el('span', { textContent: v.nome });
      return { v, input, testo, label: el('label', { className: 'home-menu-voce' }, input, testo) };
    });
    det.querySelector('.home-menu-pannello').append(...caselle.map(c => c.label));
    det.addEventListener('toggle', () => { if (det.open) for (const d of document.querySelectorAll('.home-menu[open]')) if (d !== det) d.open = false; });
    return { ...m, det, caselle, titolo: det.querySelector('summary') };
  });
  // si chiude con Esc o cliccando fuori
  document.addEventListener('click', e => { for (const d of document.querySelectorAll('.home-menu[open]')) if (!d.contains(e.target)) d.open = false; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') for (const d of document.querySelectorAll('.home-menu[open]')) { d.open = false; d.querySelector('summary').focus(); } });
  const scelteBox = document.getElementById('home-scelte');
  // voci ancora selezionabili: argomenti con strati per la ricerca e con un ente scelto; enti degli argomenti scelti. Le scelte non più compatibili cadono
  function disponibili(q) {
    const strati = new Map(argomenti.map(a => [a.id, 0]));
    for (const li of card) if (!q || li.dataset.testo.includes(q)) strati.set(li.dataset.argomento, strati.get(li.dataset.argomento) + 1);
    let arg, enti;
    do {
      arg = argomenti.filter(a => strati.get(a.id) && (!entiScelti.size || (a.enti ?? []).some(e => entiScelti.has(e))));
      enti = new Set(argomenti.filter(a => strati.get(a.id) && (!scelti.size || scelti.has(a.id))).flatMap(a => a.enti ?? []));
      const cadute = [...scelti].filter(id => !arg.some(a => a.id === id)).length + [...entiScelti].filter(e => !enti.has(e)).length;
      for (const id of [...scelti]) if (!arg.some(a => a.id === id)) scelti.delete(id);
      for (const e of [...entiScelti]) if (!enti.has(e)) entiScelti.delete(e);
      if (!cadute) break;
    } while (true);
    return { strati, arg: new Set(arg.map(a => a.id)), enti };
  }
  function aggiornaMenu(disp) {
    scelteBox.replaceChildren();
    for (const m of menu) {
      const ammesse = m.id === 'argomenti' ? disp.arg : disp.enti;
      for (const { v, label, testo } of m.caselle) {
        label.hidden = !ammesse.has(v.id);
        if (m.id === 'argomenti') testo.textContent = `${v.nome} (${disp.strati.get(v.id)})`;
      }
      m.titolo.textContent = tr(m.chiave) + (m.set.size ? ` (${m.set.size})` : '');
      m.det.classList.toggle('con-scelte', m.set.size > 0);
      for (const { v, input } of m.caselle) {
        input.checked = m.set.has(v.id);
        if (!input.checked) continue;
        const b = el('button', { type: 'button', className: 'filtro-chip', textContent: `${v.nome} ×`, title: tr('home.menu.togli', { voce: v.nome }) });
        b.setAttribute('aria-label', tr('home.menu.togli', { voce: v.nome }));
        b.addEventListener('click', () => { m.set.delete(v.id); filtra(); });
        scelteBox.append(b);
      }
    }
    if (scelteBox.children.length) {
      const azzera = el('button', { type: 'button', className: 'home-azzera', textContent: tr('home.menu.azzera') });
      azzera.addEventListener('click', () => { scelti.clear(); entiScelti.clear(); filtra(); });
      scelteBox.append(azzera);
    }
  }

  // ordine delle card: per nome o per data, crescente o decrescente; a parità resta l'ordine alfabetico
  const ordinaBox = document.getElementById('home-ordina');
  const criteri = {
    az: { confronta: (x, y) => x.dataset.ordine - y.dataset.ordine, verso: 1 },
    data: { confronta: (x, y) => x.dataset.data.localeCompare(y.dataset.data) || x.dataset.ordine - y.dataset.ordine, verso: -1 },
  };
  let criterio = 'data';
  let verso = criteri.data.verso;
  const bottoniOrdine = Object.keys(criteri).map(chiave => {
    const b = el('button', { type: 'button', className: 'filtro-chip', textContent: tr(`home.ordina.${chiave}`) });
    b.dataset.criterio = chiave;
    b.addEventListener('click', () => { criterio = chiave; verso = criteri[chiave].verso; ordina(); });
    return b;
  });
  const bottoneVerso = el('button', { type: 'button', className: 'filtro-chip' });
  bottoneVerso.addEventListener('click', () => { verso = -verso; ordina(); });
  function ordina() {
    // la scheda di emergenza resta sempre in cima, qualunque sia l'ordine scelto
    const emerg = li => (STRATI_EMERGENZA.has(li.dataset.strato) ? 0 : 1);
    ul.append(...[...card].sort((x, y) => emerg(x) - emerg(y) || verso * criteri[criterio].confronta(x, y)));
    bottoniOrdine.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.criterio === criterio)));
    bottoneVerso.textContent = tr(verso > 0 ? 'home.ordina.cresc' : 'home.ordina.decresc');
  }
  ordinaBox.append(...bottoniOrdine, bottoneVerso);
  ordina();

  const campo = document.getElementById('home-cerca');
  const conteggio = document.getElementById('home-conteggio');
  const vuoto = document.getElementById('home-vuoto');
  const descBox = document.getElementById('home-argomento-desc');
  const visibiliIds = [];
  const tutti = bottoneAggiungi(visibiliIds, tr('home.aggiungi.tutti'), 'argomento-tutti');
  tutti.dataset.tutti = '1';
  document.getElementById('home-filtri-riga').append(tutti);
  const totale = card.length;
  function filtra() {
    const q = normalizza(campo.value.trim());
    const disp = disponibili(q);
    visibiliIds.length = 0;
    for (const li of card) {
      const si = (!scelti.size || scelti.has(li.dataset.argomento)) && (!entiScelti.size || li.dataset.enti.split('|').some(e => entiScelti.has(e))) && (!q || li.dataset.testo.includes(q));
      li.hidden = !si;
      if (si) visibiliIds.push(li.dataset.strato);
    }
    aggiornaMenu(disp);
    const desc = argomenti.filter(a => scelti.has(a.id)).map(a => a.descrizione).filter(Boolean).join(' ');
    descBox.textContent = desc;
    descBox.hidden = !desc;
    vuoto.hidden = visibiliIds.length > 0;
    tutti.hidden = visibiliIds.length === 0 || visibiliIds.length === totale;
    conteggio.textContent = visibiliIds.length === totale ? '' : tr(visibiliIds.length === 1 ? 'home.conteggio.uno' : 'home.conteggio.altri', { n: visibiliIds.length });
    aggiornaCesto();
  }
  campo.addEventListener('input', filtra);
  filtra();
}

async function costruisciPercorsi() {
  const box = document.getElementById('home-percorsi');
  let percorsi;
  let argomenti;
  try {
    percorsi = await (await fetch(new URL('./core/home-percorsi.json', import.meta.url))).json();
    argomenti = (await (await fetch(new URL('./core/home-strati.json', import.meta.url))).json())[lingua()];
  } catch {
    box.closest('.home-percorsi-fascia').hidden = true;
    return;
  }
  const nomi = new Map(argomenti.flatMap(a => a.strati.map(s => [s.id, s.etichetta])));
  conteggi.strati = percorsi.length;
  // il percorso di emergenza sta sempre per primo, a prescindere dall'ordine del file
  const emerg = p => (p.strati.some(id => STRATI_EMERGENZA.has(id)) ? 0 : 1);
  for (const p of [...percorsi].sort((x, y) => emerg(x) - emerg(y))) {
    const testi = p[lingua()] ?? p.it;
    const apri = el('a', { className: 'percorso-apri', href: MAPPA, textContent: tr('home.percorsi.apri') });
    linkMappa(p.strati, true, p.vista).then(href => { apri.href = href; });
    box.append(el('li', { className: 'percorso', ...(p.strati.some(id => STRATI_EMERGENZA.has(id)) && { id: 'percorso-emergenza' }) },
      ...(testi.badge ? [el('span', { className: 'percorso-badge', textContent: testi.badge })] : []),
      el('h4', { textContent: testi.titolo }),
      el('p', { textContent: testi.testo }),
      el('p', { className: 'percorso-strati', textContent: p.strati.map(id => nomi.get(id) ?? id).join(' · ') }),
      apri));
  }
}

// Telefono: il percorso e la scheda di emergenza (prima) stanno nel pannello «Emergenze»; sullo schermo largo il percorso torna in testa all'elenco.
function riempiEmergenze(ul, mobile) {
  const percorso = document.getElementById('percorso-emergenza');
  const copia = ul.querySelector('.strato-card');
  if (mobile) {
    if (!copia && creaCardEmergenza) ul.prepend(creaCardEmergenza());
    if (percorso) ul.append(percorso);
  } else {
    if (percorso) document.getElementById('home-percorsi').prepend(percorso);
    copia?.remove();
  }
}

costruisciIndice();
costruisciSlider();
await costruisciPercorsi();
await costruisciElenco();
homeMobile = avviaHomeMobile({ riempiEmergenze });
homeMobile.mostraConteggi(conteggi);
// Riquadro con i testi del bollettino (oggi e domani, zona di Palermo e zone in allerta) e il link al sito della Protezione Civile
function creaBollettino(zone, p) {
  const giorno = g => [el('h4', { textContent: tr(`allerte.${g}`) }), ...riassuntoGiorno(zone, g).map(r => el('p', { className: 'allerta-riga', textContent: r.testo }))];
  return el('div', { className: 'allerta-bollettino' },
    el('h3', { textContent: tr('home.allerta.titolo') }), ...giorno('oggi'), ...giorno('domani'),
    ...(p.bollettino ? [el('p', { className: 'allerta-fonte', textContent: p.bollettino })] : []),
    el('a', { className: 'allerta-link', href: LINK_BOLLETTINO, target: '_blank', rel: 'noopener', textContent: tr('home.allerta.sito') }));
}
// allerta meteo-idro della zona di Palermo (oggi o domani): accende il pulsante «Emergenze»; senza rete o senza bollettino resta spento
fetch(`${scegliProxy(location.search, location.hostname)}/allerte`).then(r => (r.ok ? r.json() : Promise.reject(r.status)))
  .then(dati => {
    const zone = dati.features.map(f => f.properties);
    const p = zone.find(z => z.palermo);
    const livello = livelloMassimo(p);
    if (livello > 0) homeMobile.segnalaAllerta(tr('home.allerta.attiva', { livello: tl(nomeLivello(livello)) }), creaBollettino(zone, p));
  }).catch(() => {});
document.documentElement.classList.add('home-pronta');
aggiornaCesto();

// tornando indietro dalla mappa (pagina dalla cache del browser) il cesto va riletto: la mappa può averlo cambiato
window.addEventListener('pageshow', e => {
  if (!e.persisted) return;
  cesto.clear();
  for (const id of leggiCesto(archivioCesto)) cesto.add(id);
  aggiornaCesto();
});

// a pagina caricata e ferma, i file leggeri della mappa vanno in cache: il clic su «Apri la mappa» è più rapido
precaricaMappaARiposo(window, lingua());
