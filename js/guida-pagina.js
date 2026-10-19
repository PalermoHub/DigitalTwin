// Pagina Guida (guida.html): gli stessi passi del tab «Guida» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom, t as tr } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
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

// Titolo, introduzione e video aprono la pagina; ogni passo è una fascia con il suo titolo h2 e, sopra, il gruppo.
// L'indice del modale resta com'è: su schermi larghi sta fisso a destra, su quelli stretti sotto l'introduzione.
const corpo = document.getElementById('corpo');
corpo.classList.add('pagina-guida');
const intro = fascia('guida', 'home-intro');
const passi = [];
let gruppo = null;
const nodi = [...schedaGuida().children];
for (const n of nodi) {
  if (n.tagName === 'H2' && !n.className) { const h1 = document.createElement('h1'); h1.textContent = n.textContent; intro.dentro.append(h1); }
  else if (n.className === 'pagina-intro' || n.className === 'guida-indice' || n.className === 'guida-media') intro.dentro.append(n);
  else if (n.className === 'guida-gruppo') gruppo = n.textContent;
  else {
    const f = fascia(null);
    const h3 = n.querySelector('h3');
    const h2 = document.createElement('h2');
    h2.textContent = h3.textContent;
    h3.replaceWith(h2);
    if (gruppo && PASSI.find(p => `guida-${p.id}` === n.id)?.gruppo) { // il disclaimer, senza gruppo, non ha l'etichetta
      const k = document.createElement('p');
      k.className = 'guida-kicker';
      k.textContent = gruppo;
      f.dentro.append(k);
    }
    f.dentro.append(n);
    passi.push(f.f);
  }
}
corpo.append(intro.f, ...passi);
traduciAlbero(corpo); // i passi sono scritti in italiano: in inglese si traducono con le voci lbl.* dei dizionari
collegaIngrandimento(corpo);
