import { tl, lingua } from './i18n.js';

export const PLUGIN_URL = 'https://github.com/ondata/openrndt-geolibre';
export const AUTORE_URL = 'https://www.linkedin.com/in/andreaborruso/';

// Costruttori delle pagine informative: li usano il modale Info (catalogo.js) e le pagine a sé (about.html).
// Traduce in place i nodi di testo e gli attributi alt/title di un albero DOM già costruito (in italiano non fa nulla).
export function traduciAlbero(radice) {
  if (lingua() === 'it') return;
  const w = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeValue = tl(n.nodeValue);
  for (const e of radice.querySelectorAll('[alt],[title],[aria-label]')) {
    for (const a of ['alt', 'title', 'aria-label']) if (e.hasAttribute(a)) e.setAttribute(a, tl(e.getAttribute(a)));
  }
}

export function el(tag, testo, attr = {}) {
  return Object.assign(document.createElement(tag), testo != null ? { textContent: testo } : {}, attr);
}

// Pagina informativa uniforme: titolo, frase introduttiva, poi blocchi (una scheda per argomento).
export function titoloPagina(titolo, introduzione) {
  return [el('h2', titolo), ...(introduzione ? [el('p', introduzione, { className: 'pagina-intro' })] : [])];
}

export function blocco(titolo, ...contenuto) {
  const s = el('section', null, { className: 'info-blocco' });
  s.append(el('h3', titolo), ...contenuto);
  return s;
}

export function link(testo, href) {
  return el('a', testo, { href, target: '_blank', rel: 'noopener' });
}

export function elenco(voci) {
  const ul = document.createElement('ul');
  for (const t of voci) {
    const li = document.createElement('li');
    li.append(...[t].flat()); // una voce è una stringa o un elenco di stringhe e nodi (per i link)
    ul.append(li);
  }
  return ul;
}
