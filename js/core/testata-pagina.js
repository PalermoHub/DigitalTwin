// Testata delle pagine a fasce (home.html, about.html, presentazione.html…): switch di lingua e di tema, menu a tendine, barra a tab del telefono.
// Va chiamata dopo caricaDizionari() e applicaDom().
import { creaInterruttoreLingua, t as tr } from './i18n.js';
import { svgIcona } from './icone.js';
import { creaMenuSito, duplicaPrincipale } from './menu-sito.js';

const el = (tag, props = {}, ...figli) => { const e = Object.assign(document.createElement(tag), props); e.append(...figli); return e; };

export async function avviaTestata() {
  // le etichette dei tab si risolvono quando il modulo si carica: va importato dopo i dizionari
  const { TAB } = await import('./tab-mobile.js');
  document.getElementById('switch-tema').after(creaInterruttoreLingua(document));
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
  const menu = creaMenuSito(); // le voci stanno in menu-sito.js, uguali per tutte le pagine
  const tendine = [...menu.querySelectorAll('.menu-tendina')];
  tendine.forEach(duplicaPrincipale);
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

  // pulsante «torna in cima»: compare dopo 400 px di scorrimento (home.html, about.html)
  const cima = document.getElementById('home-cima');
  if (cima) {
    const riduci = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mostraCima = () => { cima.hidden = window.scrollY < 400; };
    window.addEventListener('scroll', mostraCima, { passive: true });
    cima.addEventListener('click', () => window.scrollTo({ top: 0, behavior: riduci ? 'auto' : 'smooth' }));
    mostraCima();
  }
}
