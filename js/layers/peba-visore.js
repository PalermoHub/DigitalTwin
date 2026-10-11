// Visore a tutto schermo delle foto del sopralluogo PEBA, come quello dell'app originale: contatore, frecce, striscia di
// miniature, rotazione e salvataggio. La foto grande viene dal sito del PEBA, le miniature sono locali.
import { urlDati } from '../core/config.js';
import { t } from '../core/i18n.js';
import { fuocoDopoTab, passoFoto, percorsoMiniatura, ruotaGradi, urlFoto } from './scheda-peba.js';

let chiudiAttivo = null; // chiusura del visore aperto: ne vive uno solo

function bottone(classe, simbolo, titolo) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = classe;
  b.textContent = simbolo;
  b.title = titolo;
  b.setAttribute('aria-label', titolo);
  return b;
}

function costruisci() {
  const r = document.createElement('div');
  r.className = 'peba-visore';
  r.hidden = true;
  r.setAttribute('role', 'dialog');
  r.setAttribute('aria-modal', 'true');
  r.setAttribute('aria-label', t('peba.visore.titolo'));
  const palco = document.createElement('div');
  palco.className = 'peba-visore-palco';
  const img = document.createElement('img');
  img.className = 'peba-visore-img';
  palco.append(img);
  const contatore = document.createElement('div');
  contatore.className = 'peba-visore-contatore';
  const strisce = document.createElement('div');
  strisce.className = 'peba-visore-miniature';
  const chiudi = bottone('peba-visore-chiudi', '✕', t('peba.visore.chiudi'));
  const prec = bottone('peba-visore-nav peba-visore-prec', '‹', t('peba.visore.prec'));
  const succ = bottone('peba-visore-nav peba-visore-succ', '›', t('peba.visore.succ'));
  const gruppo = document.createElement('div');
  gruppo.className = 'peba-visore-strumenti';
  const sx = bottone('peba-visore-tondo', '⟲', t('peba.visore.ruotaSx'));
  const dx = bottone('peba-visore-tondo', '⟳', t('peba.visore.ruotaDx'));
  const salva = document.createElement('a');
  salva.className = 'peba-visore-tondo';
  salva.textContent = '⭳';
  salva.title = t('peba.visore.salva');
  salva.setAttribute('aria-label', t('peba.visore.salva'));
  salva.target = '_blank';
  salva.rel = 'noopener noreferrer';
  gruppo.append(sx, dx, salva);
  r.append(chiudi, contatore, prec, palco, succ, gruppo, strisce);
  return { r, img, contatore, strisce, chiudi, prec, succ, sx, dx, salva };
}

// Apre il visore sulla foto `inizio` (indice da 0) della scheda `p` (campi `codice`, `nome`, `n_foto`).
export function apriVisore(p, inizio = 0) {
  const n = p.n_foto;
  if (!(n > 0)) return;
  const v = costruisci();
  const rotazioni = Array(n).fill(0);
  const precedente = document.activeElement;
  let i = Math.max(0, Math.min(n - 1, inizio));
  const alt = k => t('peba.fotoAlt', { n: k + 1, tot: n, nome: p.nome ?? p.codice });
  const miniature = [];
  for (let k = 0; k < n; k++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'peba-visore-mini';
    const m = document.createElement('img');
    m.loading = 'lazy';
    m.alt = alt(k);
    m.src = urlDati(percorsoMiniatura(p.codice, k + 1));
    // miniatura mancante: ripiega sulla foto grande; se manca anche quella il riquadro si nasconde (gli indici restano allineati)
    m.addEventListener('error', () => { if (m.src !== urlFoto(p.codice, k + 1)) m.src = urlFoto(p.codice, k + 1); else b.hidden = true; });
    b.append(m);
    b.addEventListener('click', () => { i = k; mostra(); });
    v.strisce.append(b);
    miniature.push(b);
  }
  function mostra() {
    v.img.src = urlFoto(p.codice, i + 1);
    v.img.alt = v.img.title = alt(i);
    v.img.style.transform = `rotate(${rotazioni[i]}deg)`;
    v.contatore.textContent = `${i + 1} / ${n}`;
    v.salva.href = urlFoto(p.codice, i + 1);
    miniature.forEach((b, k) => b.classList.toggle('attiva', k === i));
    miniature[i].scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  function vai(delta) { i = passoFoto(i, delta, n); mostra(); }
  function ruota(delta) { rotazioni[i] = ruotaGradi(rotazioni[i], delta); v.img.style.transform = `rotate(${rotazioni[i]}deg)`; }
  function chiudi() {
    document.removeEventListener('keydown', tasti, true);
    v.r.remove();
    chiudiAttivo = null;
    precedente?.focus?.();
  }
  // in fase di cattura e fermando l'evento: Esc e frecce non devono chiudere la scheda o muovere la mappa sotto il visore
  function tasti(e) {
    if (e.key === 'Tab') { // il visore è modale: il fuoco non esce verso la scheda sotto
      const dentro = [...v.r.querySelectorAll('button:not([hidden]), a[href]')];
      const j = fuocoDopoTab(dentro.indexOf(document.activeElement), dentro.length, e.shiftKey);
      if (j >= 0) { e.preventDefault(); dentro[j].focus(); }
      return;
    }
    const azione = { Escape: chiudi, ArrowLeft: () => vai(-1), ArrowRight: () => vai(1), '[': () => ruota(-90), ']': () => ruota(90) }[e.key];
    if (!azione) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    azione();
  }
  chiudiAttivo?.(); // un solo visore alla volta: l'altro toglie anche il suo ascoltatore dei tasti
  chiudiAttivo = chiudi;
  v.chiudi.addEventListener('click', chiudi);
  v.prec.addEventListener('click', () => vai(-1));
  v.succ.addEventListener('click', () => vai(1));
  v.sx.addEventListener('click', () => ruota(-90));
  v.dx.addEventListener('click', () => ruota(90));
  v.r.addEventListener('click', e => { if (e.target === v.r || e.target.classList.contains('peba-visore-palco')) chiudi(); });
  document.addEventListener('keydown', tasti, true);
  document.body.append(v.r);
  v.r.hidden = false;
  mostra();
  v.chiudi.focus();
}
