import { PASSI } from './guida-contenuti.js';

// Tab «Guida» del foglio Info: indice, poi un passo per sezione con testo e figura.
export function schedaGuida(doc = document, passi = PASSI) {
  const radice = doc.createElement('div');
  const sezioni = {};
  const h = doc.createElement('h2');
  h.textContent = 'Guida';
  radice.append(h);

  const indice = doc.createElement('nav');
  indice.className = 'guida-indice';
  indice.setAttribute('aria-label', 'Indice della guida');
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
  const video = doc.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('preload', 'metadata');
  video.setAttribute('poster', passi[0].immagine.file);
  video.setAttribute('aria-label', 'Video guida: panoramica della mappa');
  const sv = doc.createElement('source');
  sv.setAttribute('src', 'media/guida/guida.mp4');
  sv.setAttribute('type', 'video/mp4');
  const tr = doc.createElement('track');
  tr.setAttribute('kind', 'captions');
  tr.setAttribute('srclang', 'it');
  tr.setAttribute('label', 'Italiano');
  tr.setAttribute('src', 'media/guida/guida.vtt');
  tr.setAttribute('default', '');
  sv.onerror = () => media.remove(); // deploy senza i media: niente player nero e rotto
  video.append(sv, tr);
  const audio = doc.createElement('audio');
  audio.setAttribute('controls', '');
  audio.setAttribute('preload', 'none');
  audio.setAttribute('aria-label', 'Versione solo audio della guida');
  const sa = doc.createElement('source');
  sa.setAttribute('src', 'media/guida/guida.mp3');
  sa.setAttribute('type', 'audio/mpeg');
  sa.onerror = () => media.remove();
  audio.append(sa);
  media.append(video, audio);
  radice.append(media);

  for (const p of passi) {
    const sez = doc.createElement('section');
    sez.className = 'guida-passo';
    sez.id = `guida-${p.id}`;
    sezioni[p.id] = sez;
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
    img.src = p.immagine.file;
    img.alt = p.immagine.alt;
    img.loading = 'lazy';
    img.width = 1280;
    img.height = 720;
    img.onerror = () => fig.remove(); // deploy senza gli screenshot: niente icona rotta
    const cap = doc.createElement('figcaption');
    cap.textContent = p.immagine.didascalia;
    fig.append(img, cap);
    sez.append(fig);
    radice.append(sez);
  }
  return radice;
}
