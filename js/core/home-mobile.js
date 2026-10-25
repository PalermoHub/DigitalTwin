// Home su telefono (fino a 720 px): solo impaginazione. Le fasce «Emergenze», «Percorsi guidati», «Catalogo degli strati» e «Statistiche»
// diventano quattro pulsanti grandi che aprono la tendina (tema, lingua e condivisione: impostazioni-mobile.js).
// Contenuti e funzioni sono quelli di sempre: qui si spostano soltanto i nodi, e oltre i 720 px tutto torna com'era.
import { t as tr } from './i18n.js';
import { svgIcona } from './icone.js';
import { MEDIA_TELEFONO } from './modo-emergenza.js';

export const MEDIA_HOME_MOBILE = MEDIA_TELEFONO; // in piedi o ruotato

const el = (tag, props = {}, ...figli) => { const e = Object.assign(document.createElement(tag), props); e.append(...figli); return e; };
const icona = d => `<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true"><path d="${d}"/></svg>`;

// id della fascia, tono del colore, icona, chiave del testo
const SCHEDE = [
  { id: 'emergenze', tono: 'emergenza', chiave: 'home.acc.emergenze', sotto: 'home.acc.sotto.emergenze', svg: icona('M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z') },
  { id: 'strati', tono: 'percorsi', chiave: 'home.percorsi.titolo', sotto: 'home.acc.sotto.percorsi', svg: icona('M21.71 11.29l-9-9a1 1 0 0 0-1.41 0l-9 9a1 1 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a1 1 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z') },
  { id: 'catalogo', tono: 'catalogo', chiave: 'home.catalogo.titolo', sotto: 'home.acc.sotto.catalogo', svg: svgIcona('base', 26) },
  { id: 'numeri', tono: 'info', chiave: 'home.acc.informazioni', sotto: 'home.acc.sotto.informazioni', svg: icona('M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z') },
];
const PC = '800840840'; // Protezione civile regionale (stesso numero della scheda del piano di emergenza)

// «Numeri utili»: 112 e Protezione civile a un tocco, nel pannello «Emergenze» subito dopo la scheda del Piano di emergenza
function creaNumeriUtili() {
  const tel = (num, testo, aria) => el('a', { className: 'numeri-tel', href: `tel:${num}`, textContent: testo, ariaLabel: aria });
  const li = el('li', { className: 'numeri-utili' }, el('span', { className: 'numeri-nome', textContent: tr('home.banda.numeri') }), tel('112', '112', tr('home.banda.chiama112')), tel(PC, tr('home.banda.pc'), tr('home.banda.chiamaPc')));
  return li;
}
const CHEVRON = '<svg class="acc-freccia" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

// `riempiEmergenze(ul)` mette nel pannello «Emergenze» ciò che in home è già di emergenza (percorso e scheda dello strato).
export function avviaHomeMobile({ riempiEmergenze }) {
  const mq = matchMedia(MEDIA_HOME_MOBILE);
  const riduci = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ---- tendine ----
  const fasce = SCHEDE.map(s => ({ ...s, fascia: document.getElementById(s.id) }));
  const bottoni = new Map();
  // barra a tab e «Apri la mappa» compaiono con un pulsante aperto, tranne «Informazioni» (solo testo)
  const conBarra = () => fasce.some(f => f.id !== 'numeri' && f.fascia.classList.contains('aperta'));
  function imposta(fascia, aperta) {
    fascia.classList.toggle('aperta', aperta);
    const b = bottoni.get(fascia);
    if (b) b.setAttribute('aria-expanded', String(aperta));
    document.body.classList.toggle('acc-aperto', conBarra());
  }
  function apri(fascia, scorri = true) {
    for (const f of fasce) imposta(f.fascia, f.fascia === fascia);
    if (scorri) bottoni.get(fascia)?.scrollIntoView({ behavior: riduci ? 'auto' : 'smooth', block: 'start' });
  }
  for (const s of fasce) {
    const b = el('button', { type: 'button', className: `acc-toggle acc-${s.tono}`, innerHTML: `<span class="acc-icona">${s.svg}</span><span class="acc-testo"><span class="acc-nome"></span><span class="acc-sotto"></span></span>${CHEVRON}` });
    b.querySelector('.acc-nome').textContent = tr(s.chiave);
    b.querySelector('.acc-sotto').textContent = tr(s.sotto);
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', `${s.id}-pannello`);
    s.fascia.querySelector('.fascia-in').id = `${s.id}-pannello`;
    b.addEventListener('click', () => (s.fascia.classList.contains('aperta') ? imposta(s.fascia, false) : apri(s.fascia)));
    bottoni.set(s.fascia, b);
  }

  // un'àncora che punta dentro una tendina chiusa (le tessere delle statistiche, i vecchi link) la apre prima di scorrere
  const apriPerElemento = elemento => {
    let fascia = elemento?.closest?.('.fascia');
    while (fascia && !bottoni.has(fascia)) fascia = fascia.parentElement?.closest('.fascia'); // le sezioni di testo stanno dentro «Informazioni»
    if (mq.matches && fascia) apri(fascia, false);
  };

  // ---- passaggio telefono ⇄ schermo largo ----
  function adatta() {
    const mobile = mq.matches;
    document.body.classList.toggle('home-mobile', mobile);
    for (const s of fasce) {
      const b = bottoni.get(s.fascia);
      if (mobile) s.fascia.prepend(b); else b.remove();
      s.fascia.classList.toggle('acc', mobile);
      if (!mobile) imposta(s.fascia, false);
    }
    // il testo in fondo («Perché una nuova mappa…») sta dentro «Informazioni»; sullo schermo largo torna in fondo alla pagina
    const info = document.querySelector('#numeri > .fascia-in');
    for (const id of ['perche', 'tavolo']) {
      const sezione = document.getElementById(id);
      if (mobile) info.append(sezione); else document.getElementById('corpo').append(sezione);
    }
    const ul = document.getElementById('home-emergenze');
    riempiEmergenze(ul, mobile);
    ul.querySelector('.numeri-utili')?.remove();
    if (mobile) ul.firstElementChild?.after(creaNumeriUtili());
    document.body.classList.toggle('acc-aperto', mobile && conBarra());
  }
  mq.addEventListener('change', adatta);
  adatta();

  // un vecchio link con àncora (#catalogo, #numeri…) apre la tendina giusta
  const daAncora = () => {
    const bersaglio = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (bersaglio) apriPerElemento(bersaglio);
  };
  daAncora();
  window.addEventListener('hashchange', daAncora);
  // con un'allerta attiva a Palermo il pulsante «Emergenze» si accende di rosso e il sottotitolo dice quale (senza allerta resta bianco con bordo rosso)
  // `bollettino` (nodo con i testi del bollettino) sta in cima al pannello «Emergenze»
  const segnalaAllerta = (testo, bollettino) => {
    document.querySelector('#emergenze-pannello .allerta-bollettino')?.remove();
    if (bollettino) document.getElementById('emergenze-pannello').prepend(bollettino);
    const b = bottoni.get(document.getElementById('emergenze'));
    b.classList.toggle('in-allerta', !!testo);
    b.querySelector('.acc-sotto').textContent = testo || tr('home.acc.sotto.emergenze');
  };
  // pastiglia col numero accanto al nome («124 strati», «8 itinerari»): conteggi = { id fascia: n }
  const CONTA = { catalogo: 'home.acc.conta.catalogo', strati: 'home.acc.conta.percorsi', numeri: 'home.acc.conta.informazioni' };
  const mostraConteggi = conteggi => {
    const nf = new Intl.NumberFormat(document.documentElement.lang || undefined);
    for (const [id, chiave] of Object.entries(CONTA)) {
      const nome = bottoni.get(document.getElementById(id))?.querySelector('.acc-nome');
      if (!nome || !conteggi[id]) continue;
      nome.querySelector('.acc-conta')?.remove();
      nome.append(el('span', { className: 'acc-conta', textContent: tr(chiave, { n: nf.format(conteggi[id]) }) }));
    }
  };
  return { apriPerElemento, segnalaAllerta, mostraConteggi };
}
