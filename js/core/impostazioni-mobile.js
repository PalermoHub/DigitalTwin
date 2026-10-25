// Telefono: tema, lingua e «Condividi» della testata stanno dietro l'ingranaggio, in un pannello (home e pagine a fasce).
// Sullo schermo largo i tre comandi tornano al loro posto in testata. Il markup è in index.html; sulle altre pagine lo crea questo modulo.
import { t as tr } from './i18n.js';
import { svgIcona } from './icone.js';
import { MEDIA_TELEFONO } from './modo-emergenza.js';

const el = (tag, props = {}, ...figli) => { const e = Object.assign(document.createElement(tag), props); e.append(...figli); return e; };
const VOCI = [['switch-tema', 'html.tema'], ['switch-lingua', 'home.imp.lingua'], ['btn-condividi', 'html.btn.condividiPagina']];

function creaMarkup() {
  const apri = el('button', { id: 'home-imp-apri', type: 'button', hidden: true, title: tr('home.imp.apri') });
  apri.setAttribute('aria-label', tr('home.imp.apri'));
  apri.setAttribute('aria-haspopup', 'dialog');
  apri.setAttribute('aria-expanded', 'false');
  apri.setAttribute('aria-controls', 'home-impostazioni');
  document.getElementById('app-header').append(apri);
  const chiudi = el('button', { id: 'home-imp-chiudi', type: 'button', title: tr('comune.chiudi') });
  chiudi.setAttribute('aria-label', tr('comune.chiudi'));
  const voci = el('ul', { className: 'home-imp-voci' }, ...VOCI.map(([id, chiave]) => {
    const testo = id === 'btn-condividi' ? document.getElementById(id)?.title || tr(chiave) : tr(chiave); // sulla mappa il pulsante condivide la vista
    const li = el('li', {}, el('span', { textContent: testo }));
    li.dataset.imp = id;
    return li;
  }));
  const scheda = el('div', { className: 'home-imp-scheda' }, el('div', { className: 'home-imp-testa' }, el('h2', { id: 'home-imp-titolo', textContent: tr('home.imp.titolo') }), chiudi), voci);
  scheda.setAttribute('role', 'dialog');
  scheda.setAttribute('aria-modal', 'true');
  scheda.setAttribute('aria-labelledby', 'home-imp-titolo');
  document.getElementById('app-header').after(el('div', { id: 'home-impostazioni', className: 'home-impostazioni', hidden: true }, scheda));
}

let avviato = false;
export function avviaImpostazioni() {
  if (avviato) return;
  avviato = true;
  if (!document.getElementById('home-imp-apri')) creaMarkup();
  const mq = matchMedia(MEDIA_TELEFONO);
  const pannello = document.getElementById('home-impostazioni');
  const apri = document.getElementById('home-imp-apri');
  const chiudi = document.getElementById('home-imp-chiudi');
  apri.innerHTML = svgIcona('ingranaggio', 24);
  chiudi.innerHTML = svgIcona('chiudi', 22);
  const voci = [...pannello.querySelectorAll('[data-imp]')];
  const sedi = new Map(voci.map(v => document.getElementById(v.dataset.imp)).filter(Boolean).map(n => [n, n.previousElementSibling])); // nodo → vicino che lo precedeva in testata

  const chiudiPannello = () => {
    pannello.hidden = true;
    apri.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', suEsc);
    apri.focus({ preventScroll: true });
  };
  const suEsc = e => { if (e.key === 'Escape') chiudiPannello(); };
  apri.addEventListener('click', () => {
    pannello.hidden = false;
    apri.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', suEsc);
    chiudi.focus({ preventScroll: true });
  });
  chiudi.addEventListener('click', chiudiPannello);
  pannello.addEventListener('click', e => {
    // il tocco sullo sfondo chiude; il pulsante «Condividi» apre il suo foglio, che sta sotto il pannello: lo si chiude prima
    if (e.target === pannello || e.target.closest('#btn-condividi')) chiudiPannello();
  });

  function adatta() {
    const mobile = mq.matches;
    apri.hidden = !mobile;
    for (const voce of voci) {
      const nodo = document.getElementById(voce.dataset.imp);
      if (!nodo) continue;
      if (mobile) voce.append(nodo);
      else if (sedi.has(nodo)) sedi.get(nodo).after(nodo); // in ordine: ognuno torna dopo il suo vicino di prima, già rimesso a posto
    }
    if (!mobile) pannello.hidden = true;
  }
  mq.addEventListener('change', adatta);
  adatta();
}
