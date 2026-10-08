// js/geoimage/guida.js
// Tab «Guida Geoimage» del foglio Info: costruisce la guida da guida-contenuti.js.
import { SEZIONI } from './guida-contenuti.js';
import { indiceLaterale } from '../core/guida.js';
import { t as tr, tl } from '../core/i18n.js';

const el = (doc, tag, testo) => {
  const e = doc.createElement(tag);
  if (testo != null) e.textContent = testo;
  return e;
};
const elenco = (doc, voci) => {
  const ul = el(doc, 'ul');
  for (const v of voci) ul.append(el(doc, 'li', v));
  return ul;
};

// Screenshot di un passo: se il file manca (deploy senza immagini) la figura sparisce, niente icona rotta.
function figura(doc, immagine) {
  const fig = el(doc, 'figure');
  fig.className = 'guida-figura';
  const img = el(doc, 'img');
  Object.assign(img, { src: immagine.file, alt: immagine.alt, title: tr('catalogo.ingrandisci', { alt: tl(immagine.didascalia) }), loading: 'lazy', width: 1280, height: 720 });
  img.onerror = () => fig.remove();
  fig.append(img, el(doc, 'figcaption', immagine.didascalia));
  return fig;
}

export function schedaGeoimage(doc = document, sezioni = SEZIONI) {
  const radice = el(doc, 'div');
  radice.append(el(doc, 'h2', tr('guida.geoimage.titolo')), Object.assign(el(doc, 'p', tr('guida.geoimage.intro')), { className: 'pagina-intro' }));
  const voci = [];
  for (const s of sezioni) {
    const sezione = el(doc, 'section');
    sezione.className = 'info-blocco';
    sezione.id = `guida-geoimage-${s.id}`;
    sezione.append(el(doc, 'h3', s.titolo));
    for (const t of s.paragrafi ?? []) sezione.append(el(doc, 'p', t));
    if (s.passi) {
      const ol = el(doc, 'ol');
      for (const p of s.passi) {
        const li = el(doc, 'li');
        const titolo = el(doc, 'strong', p.titolo);
        li.append(titolo, ' — ', p.testo);
        if (p.elenco) li.append(elenco(doc, p.elenco));
        if (p.immagine) li.append(figura(doc, p.immagine));
        ol.append(li);
      }
      sezione.append(ol);
    }
    if (s.immagine) sezione.append(figura(doc, s.immagine));
    if (s.elenco) sezione.append(elenco(doc, s.elenco));
    if (s.link) {
      const p = el(doc, 'p');
      const a = el(doc, 'a', s.link.testo);
      a.href = s.link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      p.append(a);
      sezione.append(p);
    }
    radice.append(sezione);
    voci.push({ titolo: s.titolo, sezione });
  }
  indiceLaterale(doc, radice, voci);
  return radice;
}
