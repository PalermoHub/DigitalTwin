import { PASSI, PASSI_RNDT } from './guida-contenuti.js';
import { t as tr, tl, immagine } from './i18n.js';
import { collegaTrascinamento } from './streetview.js';

// I tre video della guida (YouTube, id dopo youtu.be/): mappa, plugin RNDT, Geoimage.
export const VIDEO = [
  { id: 'H8oNAYFxHeQ', chiave: 'guida.video1' },
  { id: 'uP7hDqpVDNw', chiave: 'guida.video2' },
  { id: 'CADYohEEGhM', chiave: 'guida.video3' },
];

// Il video si apre in una finestra flottante (come Street View): si sposta dalla barra e si ridimensiona dall'angolo.
let posizioneVideo = null;
function apriVideo(id, titolo) {
  document.querySelector('dialog.video-finestra')?.close();
  const d = document.createElement('dialog');
  d.className = 'streetview-finestra video-finestra';
  d.setAttribute('aria-label', titolo);
  const barra = document.createElement('div');
  barra.className = 'streetview-barra';
  const nome = document.createElement('span');
  nome.className = 'video-finestra-nome';
  nome.textContent = titolo;
  const x = document.createElement('button');
  x.type = 'button'; x.textContent = '✕'; x.title = x.ariaLabel = tr('strumenti.streetviewChiudi');
  x.addEventListener('click', () => d.close());
  barra.append(nome, x);
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  f.title = titolo;
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.allowFullscreen = true;
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  d.append(barra, f);
  d.addEventListener('close', () => d.remove());
  document.body.append(d);
  d.show();
  const r = d.getBoundingClientRect();
  const pos = posizioneVideo ?? { left: Math.max(8, (innerWidth - r.width) / 2), top: 76 };
  d.style.left = `${pos.left}px`; d.style.top = `${pos.top}px`;
  collegaTrascinamento(d, barra, p => { posizioneVideo = p; });
}

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
  let gruppoCorrente;
  for (const p of passi) {
    if (p.gruppo && p.gruppo !== gruppoCorrente) { // intestazione del gruppo nell'indice: il passo senza gruppo (Disclaimer) chiude l'elenco
      const intest = doc.createElement('li');
      intest.className = 'guida-indice-gruppo';
      intest.textContent = tr(`guida.gruppo.${p.gruppo}`);
      ol.append(intest);
    }
    gruppoCorrente = p.gruppo;
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
  for (const v of VIDEO) {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'guida-video';
    const img = doc.createElement('img');
    img.className = 'guida-video-img';
    img.src = immagine(`img/video/${v.id}.webp`);
    img.alt = '';
    img.loading = 'lazy';
    const play = doc.createElement('span');
    play.className = 'guida-video-play';
    play.setAttribute('aria-hidden', 'true');
    const cap = doc.createElement('span');
    cap.className = 'guida-video-titolo';
    cap.textContent = tr(`${v.chiave}.breve`);
    btn.setAttribute('aria-label', tr(`${v.chiave}.titolo`));
    btn.addEventListener('click', () => apriVideo(v.id, tr(`${v.chiave}.titolo`)));
    btn.append(img, play, cap);
    media.append(btn);
  }
  radice.append(media);

  let gruppoPagina;
  for (const p of passi) {
    if (p.gruppo && p.gruppo !== gruppoPagina) {
      const hg = doc.createElement('h2');
      hg.className = 'guida-gruppo';
      hg.textContent = tr(`guida.gruppo.${p.gruppo}`);
      radice.append(hg);
    }
    gruppoPagina = p.gruppo;
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
// `voci` = [{ titolo, sezione }] o [{ gruppo }] per un'intestazione di gruppo; il clic scorre fino alla sezione senza toccare l'indirizzo della pagina.
export function indiceLaterale(doc, radice, voci) {
  radice.className = 'guida-pagina';
  const nav = doc.createElement('nav');
  nav.className = 'guida-indice';
  nav.setAttribute('aria-label', tr('guida.indicePagina'));
  const ol = doc.createElement('ol');
  for (const { titolo, sezione, gruppo } of voci) {
    const li = doc.createElement('li');
    if (gruppo) { // intestazione di gruppo (come nell'indice della Guida): non è un link
      li.className = 'guida-indice-gruppo';
      li.textContent = gruppo;
      ol.append(li);
      continue;
    }
    const a = doc.createElement('a');
    a.href = '#';
    a.addEventListener('click', e => { e.preventDefault(); sezione.scrollIntoView({ block: 'start' }); });
    a.textContent = titolo;
    li.append(a);
    ol.append(li);
  }
  nav.append(ol);
  // prima della prima sezione indicizzata (sotto titolo e introduzione): su schermi stretti l'indice sta in alto, su quelli larghi la griglia lo porta a destra
  const primaSezione = voci.find(v => v.sezione)?.sezione;
  if (primaSezione) radice.insertBefore(nav, primaSezione); else radice.append(nav);
  return nav;
}
