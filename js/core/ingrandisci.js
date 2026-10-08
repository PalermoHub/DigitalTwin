// Visore per le immagini della Guida (Guida, Plugin RNDT, Guida Geoimage): un clic sulla figura la apre a tutto schermo
// con didascalia, frecce per passare alla figura precedente/successiva della stessa pagina, un clic sull'immagine per
// ingrandire a doppia dimensione. Chiusura con ×, Esc o clic sullo sfondo.
import { t } from './i18n.js';
const SELETTORE = 'figure.guida-figura img, img.dt-fig';

export function collegaIngrandimento(radice, doc = document) {
  radice.addEventListener('click', e => {
    const img = e.target.closest?.(SELETTORE);
    if (!img) return;
    const pagina = img.closest('.info-sezione') ?? radice;
    apri(doc, [...pagina.querySelectorAll(SELETTORE)], img);
  });
}

function apri(doc, immagini, corrente) {
  let i = immagini.indexOf(corrente);
  const velo = doc.createElement('div');
  velo.className = 'viewer-img';
  velo.setAttribute('role', 'dialog');
  velo.setAttribute('aria-modal', 'true');
  velo.setAttribute('aria-label', t('ingrandisci.aria'));
  const scena = doc.createElement('div');
  scena.className = 'viewer-img-scena';
  const img = doc.createElement('img');
  scena.append(img);
  const cap = doc.createElement('p');
  cap.className = 'viewer-img-cap';
  const bottone = (cls, testo, etichetta) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = testo;
    b.setAttribute('aria-label', etichetta);
    b.title = etichetta;
    return b;
  };
  const chiudi = bottone('viewer-img-x', '×', t('comune.chiudi'));
  const prec = bottone('viewer-img-nav viewer-img-prec', '‹', t('ingrandisci.prec'));
  const succ = bottone('viewer-img-nav viewer-img-succ', '›', t('ingrandisci.succ'));
  velo.append(scena, cap, chiudi, prec, succ);

  const mostra = () => {
    const o = immagini[i];
    img.src = o.currentSrc || o.src;
    img.alt = o.alt;
    img.classList.remove('zoom');
    cap.textContent = o.closest('figure')?.querySelector('figcaption')?.textContent || o.alt;
    prec.hidden = succ.hidden = immagini.length < 2;
    prec.disabled = i === 0;
    succ.disabled = i === immagini.length - 1;
  };
  const vai = d => { i = Math.min(immagini.length - 1, Math.max(0, i + d)); mostra(); };
  const tasti = e => {
    if (e.key === 'Escape') chiudiTutto();
    else if (e.key === 'ArrowLeft') vai(-1);
    else if (e.key === 'ArrowRight') vai(1);
    else return;
    e.preventDefault();
    e.stopImmediatePropagation(); // Esc non deve chiudere anche la pagina sotto
  };
  const chiudiTutto = () => { doc.removeEventListener('keydown', tasti, true); velo.remove(); };
  doc.addEventListener('keydown', tasti, true);
  chiudi.addEventListener('click', chiudiTutto);
  prec.addEventListener('click', () => vai(-1));
  succ.addEventListener('click', () => vai(1));
  velo.addEventListener('click', e => { if (e.target === velo || e.target === scena) chiudiTutto(); });
  img.addEventListener('click', () => img.classList.toggle('zoom'));
  mostra();
  doc.body.append(velo);
  chiudi.focus();
}
