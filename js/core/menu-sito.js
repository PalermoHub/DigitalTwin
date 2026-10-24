// Menu del sito, definito qui una volta sola e usato da tutte le pagine statiche (home, About, Guida, Fonti, Privacy, Plugin, Geoimage, Modalità emergenza, Digital Twin, Presentazione).
// La mappa (mappa.html) ha le stesse voci come pulsanti, pilotati da js/app.js.
import { applicaDom, t, lingua } from './i18n.js';
import { precaricaMappaARiposo } from './precarica-mappa.js';

// Nessun testo italiano qui: etichette e suggerimenti vengono dai dizionari (chiave e chiave + «.tip»).
const voce = (href, chiave, extra = '') =>
  `<a ${extra}href="${href}" data-i18n-title="${chiave}.tip" data-i18n="${chiave}" title="${t(`${chiave}.tip`)}">${t(chiave)}</a>`;
const scheda = (href, nome, extra = '') => voce(href, `html.menu.${nome}`, `${extra}data-scheda="${nome}" `);
const tendina = (id, chiaveAria, principale, voci) => `
  <div id="${id}" class="menu-tendina menu-diviso">
    ${principale}
    <button type="button" id="${id}-toggle" class="menu-tendina-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="${id}-lista" data-i18n-aria="${chiaveAria}" aria-label="${t(chiaveAria)}"></button>
    <div id="${id}-lista" class="menu-tendina-lista">
      ${voci.join('\n      ')}
    </div>
  </div>`;

// Costruito a ogni richiesta, dopo il caricamento dei dizionari (le etichette si risolvono con la lingua scelta).
export const menuHtml = () => `
  <p class="menu-gruppo" data-gruppo="guide" data-i18n="html.menu.gruppo.guide">${t('html.menu.gruppo.guide')}</p>
  <p class="menu-gruppo" data-gruppo="info" data-i18n="html.menu.info">${t('html.menu.info')}</p>
  ${voce('index.html', 'home.menu.home', 'id="link-home" ')}
  ${scheda('mappa.html', 'mappa')}
  ${scheda('digitaltwin.html', 'digitaltwin')}${tendina('menu-guide', 'html.menu.gruppo.altreguide',
    scheda('guida.html', 'guida'), [scheda('plugin.html', 'plugin'), scheda('geoimage.html', 'geoimage'), scheda('emergenza.html', 'emergenza')])}
  ${scheda('fonti.html', 'fonti')}${tendina('menu-altro', 'html.menu.gruppo.altro',
    scheda('about.html', 'about'), [voce('presentazione.html', 'html.menu.presentazione', 'id="link-presentazione" '), scheda('privacy.html', 'privacy')])}`;

// pagina corrente dall'URL: «/DigitalTwin/guida.html» → «guida.html»; la radice del sito è la home
export const paginaCorrente = (percorso = location.pathname) => percorso.split('/').pop() || 'index.html';

// Riempie <nav id="menu-info"> e segna la voce della pagina in cui siamo (aria-current="page").
export function creaMenuSito(menu = document.getElementById('menu-info'), pagina = paginaCorrente()) {
  menu.innerHTML = menuHtml();
  applicaDom(menu);
  menu.querySelector(`a[href="${pagina}"]`)?.setAttribute('aria-current', 'page');
  if (pagina !== 'index.html' && typeof window !== 'undefined') precaricaMappaARiposo(window, lingua()); // la home lo fa da sé
  return menu;
}

// Fino a 1180 px tutta la riga di una tendina apre la lista: la voce principale vi compare come prima sottovoce (copia nascosta su desktop).
export function duplicaPrincipale(tendina) {
  const copia = tendina.firstElementChild.cloneNode(true);
  copia.removeAttribute('id');
  copia.classList.add('menu-solo-stretto');
  tendina.querySelector('.menu-tendina-lista').prepend(copia);
}
