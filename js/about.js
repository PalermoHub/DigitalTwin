// Pagina About (about.html): lo stesso contenuto del tab «About» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { schedaComunita } from './core/scheda-about.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

// Una fascia a tutta larghezza (sfondo alternato) con il suo contenitore centrato.
let conta = 0;
const fascia = (id, classe = '') => {
  const f = document.createElement('section');
  f.className = `fascia home-perche ${conta++ % 2 ? 'fascia--alt' : ''} ${classe}`.replace(/\s+/g, ' ').trim();
  if (id) f.id = id;
  const dentro = document.createElement('div');
  dentro.className = 'fascia-in';
  f.append(dentro);
  return { f, dentro };
};

// Titolo e frase introduttiva aprono la pagina; ogni scheda diventa una fascia con il titolo h2.
// I gruppi (h2 «Credits», «Strumenti usati») sono una fascia sola, con le schede come sotto-titoli h3.
const nodi = schedaComunita();
const corpo = document.getElementById('corpo');
let gruppo = null;
const intro = fascia('about', 'home-intro');
for (const n of nodi) {
  if (n.tagName === 'H2' && !n.className) { const h1 = document.createElement('h1'); h1.textContent = n.textContent; intro.dentro.append(h1); }
  else if (n.className === 'pagina-intro') { intro.dentro.append(n); }
  else if (n.tagName === 'H2') { gruppo = fascia(null); n.removeAttribute('class'); gruppo.dentro.append(n); corpo.append(gruppo.f); }
  else if (gruppo) { gruppo.dentro.append(n); }
  else {
    const f = fascia(null);
    const h3 = n.querySelector('h3');
    const h2 = document.createElement('h2');
    h2.textContent = h3.textContent;
    h3.replaceWith(h2);
    f.dentro.append(...n.childNodes);
    corpo.append(f.f);
  }
}
corpo.prepend(intro.f);
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
