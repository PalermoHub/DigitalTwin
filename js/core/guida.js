import { PASSI, PASSI_RNDT } from './guida-contenuti.js';
import { t as tr, tl, immagine } from './i18n.js';

// Tab «Guida» del foglio Info: indice, poi un passo per sezione con testo e figura.
export function schedaGuida(doc = document, passi = PASSI) {
  const radice = doc.createElement('div');
  radice.className = 'guida-pagina'; // su schermi larghi l'indice sta a destra e resta in vista
  const sezioni = {};
  const h = doc.createElement('h2');
  h.textContent = tr('guida.titolo');
  const intro = doc.createElement('p');
  intro.className = 'pagina-intro';
  intro.textContent = tr('guida.intro');
  radice.append(h, intro);

  const indice = doc.createElement('nav');
  indice.className = 'guida-indice';
  indice.setAttribute('aria-label', tr('guida.indice'));
  const ol = doc.createElement('ol');
  for (const p of passi) {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.href = `#guida-${p.id}`;
    // dentro il foglio un'ancora cambierebbe l'hash dell'URL (e il tasto Indietro): si scorre e basta
    a.addEventListener('click', e => { e.preventDefault(); sezioni[p.id]?.scrollIntoView({ block: 'start' }); });
    a.textContent = p.titolo;
    li.append(a);
    ol.append(li);
  }
  indice.append(ol);
  radice.append(indice);

  const media = doc.createElement('div');
  media.className = 'guida-media';
  const video = doc.createElement('iframe');
  Object.assign(video, { src: 'https://www.youtube-nocookie.com/embed/5kSHNPcjeQc', title: tr('guida.video'), loading: 'lazy', allowFullscreen: true });
  video.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture; fullscreen');
  video.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  media.append(video);
  radice.append(media);

  for (const p of passi) {
    const sez = creaPasso(doc, p);
    sezioni[p.id] = sez;
    radice.append(sez);
  }
  return radice;
}

// Una sezione con titolo, paragrafi e figura: la usano la Guida e il tab «Plugin RNDT».
function creaPasso(doc, p) {
  const sez = doc.createElement('section');
  sez.className = 'guida-passo info-blocco';
  sez.id = `guida-${p.id}`;
  const t = doc.createElement('h3');
  t.textContent = p.titolo;
  sez.append(t);
  for (const testo of p.paragrafi) {
    const par = doc.createElement('p');
    par.textContent = testo;
    sez.append(par);
  }
  const fig = doc.createElement('figure');
  fig.className = 'guida-figura';
  const img = doc.createElement('img');
  img.src = immagine(p.immagine.file);
  img.alt = p.immagine.alt;
  img.title = tr('catalogo.ingrandisci', { alt: tl(p.immagine.didascalia) });
  img.loading = 'lazy';
  img.width = 1280;
  img.height = 720;
  img.onerror = () => fig.remove(); // deploy senza gli screenshot: niente icona rotta
  const cap = doc.createElement('figcaption');
  cap.textContent = p.immagine.didascalia;
  fig.append(img, cap);
  sez.append(fig);
  return sez;
}

// Passi RNDT da mettere in coda al tab «Plugin RNDT».
export function passiRndt(doc = document, passi = PASSI_RNDT) {
  return passi.map(p => creaPasso(doc, p));
}

// Indice laterale per le pagine fatte di blocchi (Guida Geoimage, Plugin RNDT): su schermi larghi sta a destra e resta in vista.
// `voci` = [{ titolo, sezione }]; il clic scorre fino alla sezione senza toccare l'indirizzo della pagina.
export function indiceLaterale(doc, radice, voci) {
  radice.className = 'guida-pagina';
  const nav = doc.createElement('nav');
  nav.className = 'guida-indice';
  nav.setAttribute('aria-label', tr('guida.indicePagina'));
  const ol = doc.createElement('ol');
  for (const { titolo, sezione } of voci) {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.href = '#';
    a.addEventListener('click', e => { e.preventDefault(); sezione.scrollIntoView({ block: 'start' }); });
    a.textContent = titolo;
    li.append(a);
    ol.append(li);
  }
  nav.append(ol);
  // prima della prima sezione indicizzata (sotto titolo e introduzione): su schermi stretti l'indice sta in alto, su quelli larghi la griglia lo porta a destra
  const primaSezione = voci[0]?.sezione;
  if (primaSezione) radice.insertBefore(nav, primaSezione); else radice.append(nav);
  return nav;
}
