// Pagina «Modalità emergenza» (emergenza.html): come trovare dal telefono l'area di emergenza più vicina, a fasce come la Guida Geoimage.
import { caricaDizionari, applicaDom, t as tr, tl } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { impaginaFasce } from './core/fasce-pagina.js';
import { collegaIngrandimento } from './core/ingrandisci.js';
import { SEZIONI } from './core/emergenza-contenuti.js';

const el = (tag, testo, classe) => {
  const e = document.createElement(tag);
  if (testo != null) e.textContent = testo;
  if (classe) e.className = classe;
  return e;
};

// «**parole**» in grassetto: il testo si traduce per intero (tl) e solo dopo si spezza sui segni.
function conGrassetto(testo) {
  const p = el('p');
  tl(testo).split('**').forEach((parte, i) => p.append(i % 2 ? el('strong', parte) : parte));
  return p;
}

// Schermata di un passo: se il file manca (deploy senza immagini) la figura sparisce, niente icona rotta.
function figura(im, telefono) {
  const fig = el('figure', null, telefono ? 'guida-figura guida-figura--telefono' : 'guida-figura');
  const img = el('img');
  Object.assign(img, { src: im.file, alt: im.alt, title: tr('catalogo.ingrandisci', { alt: tl(im.didascalia) }), loading: 'lazy', width: telefono ? 440 : 1280, height: telefono ? 956 : 720 });
  img.onerror = () => fig.remove();
  fig.append(img, el('figcaption', im.didascalia));
  return fig;
}

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const corpo = document.getElementById('corpo');
const nodi = [el('h2', tr('emergenza.titolo')), el('p', tr('emergenza.intro'), 'pagina-intro')];
SEZIONI.forEach((s, i) => {
  const sezione = el('section', null, 'info-blocco');
  sezione.id = `emergenza-${s.id}`;
  sezione.append(el('h3', s.titolo));
  const testi = el('div', null, 'emergenza-testi');
  for (const p of s.paragrafi) testi.append(conGrassetto(p));
  if (i === 0) sezione.append(testi, figura(s.immagine, false)); // la prima è la schermata d'insieme, larga
  else { // le altre sono schermate del telefono: il testo sta accanto all'immagine
    const passo = el('div', null, 'emergenza-passo');
    passo.append(testi, figura(s.immagine, true));
    sezione.append(passo);
  }
  nodi.push(sezione);
});
impaginaFasce(nodi, corpo, { indice: true });
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
collegaIngrandimento(corpo);
