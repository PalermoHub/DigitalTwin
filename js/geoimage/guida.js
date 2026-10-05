// js/geoimage/guida.js
// Tab «Guida Geoimage» del foglio Info: costruisce la guida da guida-contenuti.js.
import { SEZIONI } from './guida-contenuti.js';

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

export function schedaGeoimage(doc = document, sezioni = SEZIONI) {
  const radice = el(doc, 'div');
  radice.append(el(doc, 'h2', 'Guida Geoimage'));
  for (const s of sezioni) {
    const sezione = el(doc, 'section');
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
        ol.append(li);
      }
      sezione.append(ol);
    }
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
  }
  return radice;
}
