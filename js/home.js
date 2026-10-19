// Pagina iniziale (home.html): slider «in evidenza» e card degli strati, ciascuna con il link che apre la mappa con lo strato acceso.
import { caricaDizionari, applicaDom, creaInterruttoreLingua, lingua, t as tr } from './core/i18n.js';
import { codifica, costruisciLink, PARAMETRO } from './core/condivisione-codec.js';
import { svgIcona } from './core/icone.js';
import { leggiCesto, salvaCesto } from './core/cesto-home.js';

await caricaDizionari();
applicaDom(document);
// le etichette dei tab si risolvono quando il modulo si carica: va importato dopo i dizionari
const { TAB } = await import('./core/tab-mobile.js');
document.getElementById('switch-tema').after(creaInterruttoreLingua(document));

const el = (tag, props = {}, ...figli) => { const e = Object.assign(document.createElement(tag), props); e.append(...figli); return e; };
const normalizza = s => s.toLocaleLowerCase(lingua()).normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Tema scuro e menu: gli stessi gesti dell'app, senza la mappa.
const radice = document.documentElement;
const interruttoreTema = document.getElementById('switch-tema');
const mostraTema = () => interruttoreTema.setAttribute('aria-checked', String(radice.dataset.tema === 'scuro'));
mostraTema();
interruttoreTema.addEventListener('click', () => {
  const scuro = radice.dataset.tema !== 'scuro';
  if (scuro) radice.dataset.tema = 'scuro'; else delete radice.dataset.tema;
  try { localStorage.setItem('dt-tema', scuro ? 'scuro' : 'chiaro'); } catch { /* storage non disponibile */ }
  mostraTema();
});
const menu = document.getElementById('menu-info');
const tendine = [...menu.querySelectorAll('.menu-tendina')];
const chiudiTendine = salvo => tendine.forEach(t => {
  if (t === salvo) return;
  t.classList.remove('aperta');
  t.querySelector('.menu-tendina-toggle').setAttribute('aria-expanded', 'false');
});
const chiudiMenu = () => { document.body.classList.remove('info-aperto'); chiudiTendine(); };
tendine.forEach(t => t.querySelector('.menu-tendina-toggle').addEventListener('click', () => {
  chiudiTendine(t); // una sola tendina aperta alla volta
  t.querySelector('.menu-tendina-toggle').setAttribute('aria-expanded', String(t.classList.toggle('aperta')));
}));
document.addEventListener('click', e => chiudiTendine(e.target.closest('.menu-tendina')));
document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudiMenu(); });

// Telefono: la stessa barra a tab dell'app (Mappa, Strati, Aggiungi, Menu); il CSS la mostra solo fino a 720 px.
// Mappa, Strati e Aggiungi aprono l'app (con il foglio giusto), Menu apre lo stesso menù a comparsa.
const barraTab = el('nav', { id: 'barra-tab' });
barraTab.setAttribute('aria-label', tr('tab.sezioni'));
const DESTINAZIONE = { mappa: 'index.html', strati: 'index.html#strati', aggiungi: 'index.html#aggiungi' };
for (const t of TAB) {
  const b = el('button', { type: 'button', innerHTML: `${svgIcona(t.icona, 22)}<span></span>` });
  b.querySelector('span').textContent = t.etichetta;
  b.dataset.tab = t.id;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    if (t.id === 'info') {
      const aperto = document.body.classList.toggle('info-aperto');
      b.setAttribute('aria-pressed', String(aperto));
      if (!aperto) chiudiTendine();
    } else {
      location.href = DESTINAZIONE[t.id];
    }
  });
  barraTab.append(b);
}
document.body.append(barraTab);
const tabMenu = barraTab.querySelector('[data-tab="info"]');
const sincronizzaTabMenu = () => tabMenu.setAttribute('aria-pressed', String(document.body.classList.contains('info-aperto')));
document.addEventListener('pointerdown', e => {
  if (document.body.classList.contains('info-aperto') && !e.target.closest('#menu-info, #barra-tab')) { chiudiMenu(); sincronizzaTabMenu(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') sincronizzaTabMenu(); });

// Link alla mappa: lo stato condiviso con i soli strati voluti (senza vista, la mappa resta dov'è di default).
const MAPPA = new URL('index.html', location.href).href;
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

function aggiornaCesto() {
  salvaCesto(archivioCesto, cesto);
  for (const { bottone, strati } of bottoniStrato) {
    const dentro = strati.length > 0 && strati.every(id => cesto.has(id));
    bottone.setAttribute('aria-pressed', String(dentro));
    bottone.classList.toggle('aggiunto', dentro);
    bottone.textContent = dentro ? tr('home.aggiunto') : tr(bottone.dataset.tutti ? 'home.aggiungi.tutti' : 'home.aggiungi');
  }
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
    else for (const id of strati) cesto.add(id);
    aggiornaCesto();
  });
  bottoniStrato.push({ bottone, strati });
  return bottone;
}

document.getElementById('home-cesto-svuota').addEventListener('click', () => { cesto.clear(); aggiornaCesto(); });

// ---- indice delle sezioni: barra fissa sotto l'intestazione, evidenzia la sezione in vista ----
const SEZIONI = ['in-evidenza', 'numeri', 'strati', 'perche', 'tavolo'];
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

// ---- numeri: conteggi ricavati dall'elenco stesso, ogni tessera porta alla sezione giusta ----
function costruisciNumeri(argomenti, tutte) {
  const distinti = valori => new Set(valori.filter(Boolean)).size;
  const dati = [
    ['strati', tutte.length, '#strati'],
    ['argomenti', argomenti.length, '#home-argomenti'],
    ['fonti', distinti(argomenti.flatMap(a => a.enti ?? [])), 'index.html#fonti'],
  ];
  const nf = new Intl.NumberFormat(lingua());
  document.getElementById('home-numeri').append(...dati.map(([chiave, n, dest]) => {
    const a = el('a', { href: dest, className: 'numero' },
      el('strong', { textContent: nf.format(n) }), el('span', { textContent: tr(`home.numeri.${chiave}`) }));
    // le tessere che puntano a un'altra pagina (il tab «Fonti e note» della mappa) seguono il link
    if (dest.startsWith('#')) a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(dest).scrollIntoView({ behavior: riduci ? 'auto' : 'smooth' });
    });
    return el('li', {}, a);
  }));
}

// ---- slider ----
// le ultime cinque novità: quando si aggiunge uno strato nuovo, entra qui al posto del più vecchio
const SLIDE = [
  { id: 'opere', img: 'img/home/strati/opere.webp', strati: ['opere'] },
  { id: 'distributori', img: 'img/home/strati/distributori.webp', strati: ['distributori'] },
  { id: 'trend-popolazione', img: 'img/home/strati/trend-popolazione.webp', strati: ['trend-popolazione'] },
  { id: 'pnrr', img: 'img/home/strati/pnrr.webp', strati: ['pnrr'] },
  { id: 'pendolarismo', img: 'img/home/strati/pendolarismo.webp', strati: ['pendolarismo'] },
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
const isNuovo = data => !!data && Date.now() - new Date(data).getTime() <= NUOVO_GIORNI * GIORNO;
const formatoData = data => new Date(data).toLocaleDateString(lingua(), { day: 'numeric', month: 'long', year: 'numeric' });

// Card a due facce: davanti immagine, titolo, descrizione e pulsante; dietro i dettagli. Si gira col clic sulla card.
function costruisciCard(s, a) {
  const li = el('li', { className: 'strato-card' });
  const interno = el('div', { className: 'card-interno' });
  const chip = [a.titolo, s.sezione].filter(Boolean);
  const fronte = el('div', { className: 'card-faccia card-fronte' },
    ...(isNuovo(a.data) ? [el('span', { className: 'card-nuovo', textContent: tr('home.nuovo') })] : []),
    el('img', { className: 'card-img', src: `img/home/strati/${s.id}.webp`, alt: '', title: s.etichetta, width: 640, height: 360, loading: 'lazy' }),
    el('div', { className: 'card-corpo' },
      el('h4', { textContent: s.etichetta }),
      el('p', { className: 'card-testo', textContent: s.nota || a.descrizione }),
      el('div', { className: 'card-chip' }, ...chip.map(c => el('span', { textContent: c })))));
  const dettagli = el('button', { type: 'button', className: 'card-gira', textContent: `↻ ${tr('home.dettagli')}` });
  fronte.append(el('div', { className: 'card-piede' }, dettagli, bottoneAggiungi([s.id], s.etichetta)));

  const riga = (k, v) => (v ? [el('dt', { textContent: tr(k) }), el('dd', { textContent: v })] : []);
  const retro = el('div', { className: 'card-faccia card-retro' },
    el('h4', { textContent: s.etichetta }),
    el('dl', {}, ...riga('home.retro.argomento', a.titolo), ...riga('home.retro.ambito', s.sezione), ...riga('home.retro.fonte', a.fonte), ...riga('home.retro.aggiunto', a.data && formatoData(a.data)), ...riga('home.retro.aggiornati', a.aggiornati && formatoData(a.aggiornati)), ...(a.link?.length ? [el('dt', { textContent: tr('home.retro.risorse') }), el('dd', {}, el('ul', { className: 'card-risorse' }, ...a.link.map(([testo, href]) => el('li', {}, el('a', { href, textContent: testo, target: '_blank', rel: 'noopener' })))))] : []), ...riga('home.retro.nota', s.nota)),
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
    li.dataset.data = a.data ?? '';
    li.dataset.testo = normalizza(`${s.etichetta} ${a.titolo} ${s.sezione ?? ''}`);
    li.dataset.argomento = a.id;
    li.dataset.enti = (a.enti ?? []).join('|');
    li.dataset.strato = s.id;
    return li;
  });
  costruisciNumeri(argomenti, tutte);
  const ul = el('ul', { className: 'home-card-elenco' }, ...card);
  elenco.append(ul);

  // filtro per argomento: «Tutti» azzera, ogni argomento si accende/spegne e se ne possono scegliere più d'uno
  const filtroBox = document.getElementById('home-argomenti');
  const scelti = new Set();
  const chip = [{ id: '', titolo: tr('home.filtro.tutti') }, ...argomenti].map(a => {
    const n = a.id ? a.strati.length : card.length;
    const b = el('button', { type: 'button', className: 'filtro-chip', textContent: tr('home.filtro.conta', { titolo: a.titolo, n }) });
    b.dataset.argomento = a.id;
    b.addEventListener('click', () => {
      if (!a.id) { scelti.clear(); entiScelti.clear(); }
      else if (!scelti.delete(a.id)) scelti.add(a.id);
      filtra();
    });
    return b;
  });
  filtroBox.append(...chip);

  // filtro per ente: più enti = strati di uno qualsiasi; si combina con quello per argomento
  const entiScelti = new Set();
  const conteEnti = new Map();
  for (const a of argomenti) for (const e of a.enti ?? []) conteEnti.set(e, (conteEnti.get(e) ?? 0) + a.strati.length);
  const chipEnti = [...conteEnti].sort(([x], [y]) => x.localeCompare(y, lingua(), { sensitivity: 'base' })).map(([ente, n]) => {
    const b = el('button', { type: 'button', className: 'filtro-chip', textContent: tr('home.filtro.conta', { titolo: ente, n }) });
    b.dataset.ente = ente;
    b.addEventListener('click', () => { if (!entiScelti.delete(ente)) entiScelti.add(ente); filtra(); });
    return b;
  });
  document.getElementById('home-enti').append(...chipEnti);
  document.getElementById('home-enti-titolo').textContent = tr('home.filtro.enti', { n: chipEnti.length });

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
    ul.append(...[...card].sort((x, y) => verso * criteri[criterio].confronta(x, y)));
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
    visibiliIds.length = 0;
    for (const li of card) {
      const si = (!scelti.size || scelti.has(li.dataset.argomento)) && (!entiScelti.size || li.dataset.enti.split('|').some(e => entiScelti.has(e))) && (!q || li.dataset.testo.includes(q));
      li.hidden = !si;
      if (si) visibiliIds.push(li.dataset.strato);
    }
    for (const b of chipEnti) b.setAttribute('aria-pressed', String(entiScelti.has(b.dataset.ente)));
    for (const b of chip) b.setAttribute('aria-pressed', String(b.dataset.argomento ? scelti.has(b.dataset.argomento) : !scelti.size));
    document.getElementById('home-enti').closest('details').classList.toggle('con-scelte', entiScelti.size > 0);
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
  for (const p of percorsi) {
    const testi = p[lingua()] ?? p.it;
    const apri = el('a', { className: 'percorso-apri', href: MAPPA, textContent: tr('home.percorsi.apri') });
    linkMappa(p.strati, true, p.vista).then(href => { apri.href = href; });
    box.append(el('li', { className: 'percorso' },
      el('h4', { textContent: testi.titolo }),
      el('p', { textContent: testi.testo }),
      el('p', { className: 'percorso-strati', textContent: p.strati.map(id => nomi.get(id) ?? id).join(' · ') }),
      apri));
  }
}

costruisciIndice();
costruisciSlider();
await costruisciPercorsi();
await costruisciElenco();
aggiornaCesto();

// ---- porta in cima ----
const cima = document.getElementById('home-cima');
const mostraCima = () => { cima.hidden = window.scrollY < 400; };
window.addEventListener('scroll', mostraCima, { passive: true });
cima.addEventListener('click', () => window.scrollTo({ top: 0, behavior: riduci ? 'auto' : 'smooth' }));
mostraCima();

// tornando indietro dalla mappa (pagina dalla cache del browser) il cesto va riletto: la mappa può averlo cambiato
window.addEventListener('pageshow', e => {
  if (!e.persisted) return;
  cesto.clear();
  for (const id of leggiCesto(archivioCesto)) cesto.add(id);
  aggiornaCesto();
});
