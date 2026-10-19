// Pagina Guida (guida.html): gli stessi passi del tab «Guida» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom, t as tr } from './core/i18n.js';
import { avviaTestata, costruisciIndice } from './core/testata-pagina.js';
import { schedaGuida } from './core/guida.js';
import { PASSI } from './core/guida-contenuti.js';
import { collegaIngrandimento } from './core/ingrandisci.js';
import { traduciAlbero } from './core/pagina-info.js';

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

// Titolo, introduzione e video aprono la pagina; ogni gruppo di passi è una fascia con i passi come h3.
// Il passo senza gruppo (Disclaimer) ha la sua fascia. L'indice laterale del modale qui non serve: c'è la barra a pillole.
const SENZA_GRUPPO = new Set(PASSI.filter(p => !p.gruppo).map(p => `guida-${p.id}`));
const corpo = document.getElementById('corpo');
const intro = fascia('guida', 'home-intro');
const pillole = [];
let gruppo = null;
for (const n of [...schedaGuida().children]) {
  if (n.tagName === 'H2' && !n.className) { const h1 = document.createElement('h1'); h1.textContent = n.textContent; intro.dentro.append(h1); }
  else if (n.className === 'pagina-intro' || n.className === 'guida-media') intro.dentro.append(n);
  else if (n.className === 'guida-indice') continue;
  else if (n.className === 'guida-gruppo') {
    const id = PASSI.find(p => tr(`guida.gruppo.${p.gruppo}`) === n.textContent)?.gruppo;
    gruppo = fascia(id);
    n.removeAttribute('class');
    gruppo.dentro.append(n);
    corpo.append(gruppo.f);
    pillole.push({ id, testo: n.textContent });
  } else if (SENZA_GRUPPO.has(n.id)) {
    const f = fascia(n.id);
    const h2 = document.createElement('h2');
    h2.textContent = n.querySelector('h3').textContent;
    n.querySelector('h3').replaceWith(h2);
    f.dentro.append(...n.childNodes);
    corpo.append(f.f);
    pillole.push({ id: n.id, testo: h2.textContent });
    gruppo = null;
  } else gruppo.dentro.append(n);
}
corpo.prepend(intro.f);
traduciAlbero(corpo); // i passi sono scritti in italiano: in inglese si traducono con le voci lbl.* dei dizionari
collegaIngrandimento(corpo);
costruisciIndice(pillole);
