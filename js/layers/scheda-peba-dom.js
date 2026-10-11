// Parti interattive della scheda PEBA: barra del punteggio, elenco delle criticità, miniature delle foto del sopralluogo.
import { urlDati } from '../core/config.js';
import { collegamento } from '../core/url-sicuro.js';
import { t, tl } from '../core/i18n.js';
import { apriVisore } from './peba-visore.js';
import { COLORE_LIVELLO, NOTA_QUALITA, criticita, percorsoMiniatura, urlFoto, testoBadge } from './scheda-peba.js';

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function barra(p) {
  const traccia = el('div', 'peba-barra');
  const riempi = el('div', 'peba-barra-riempi');
  riempi.style.width = `${Math.max(0, Math.min(100, p.punteggio))}%`;
  riempi.style.background = testoBadge(COLORE_LIVELLO[p.livello] ?? '#999999');
  traccia.append(riempi);
  traccia.setAttribute('role', 'img');
  traccia.setAttribute('aria-label', t('peba.punteggioAria', { valore: p.punteggio }));
  return traccia;
}

function elencoCriticita(voci) {
  const wrap = el('div', 'peba-criticita');
  wrap.append(el('h4', null, tl('Criticità rilevate')));
  const ul = el('ul');
  for (const v of voci) ul.append(el('li', null, v));
  wrap.append(ul);
  return wrap;
}

// Miniatura locale; se manca ripiega sulla foto grande del sito, se manca anche quella toglie il riquadro.
function foto(p, i) {
  const grande = urlFoto(p.codice, i);
  const a = el('a', 'peba-foto');
  collegamento(a, grande);
  const img = el('img');
  img.loading = 'lazy';
  img.alt = t('peba.fotoAlt', { n: i, tot: p.n_foto, nome: p.nome ?? p.codice });
  let provata = false;
  img.addEventListener('error', () => { if (provata) a.remove(); else { provata = true; img.src = grande; } });
  img.src = urlDati(percorsoMiniatura(p.codice, i));
  a.append(img);
  a.addEventListener('click', e => { if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); apriVisore(p, i - 1); } });
  return a;
}

// «Nota sulla qualità dei dati»: chiusa all'apertura, come nell'app originale
function notaQualita() {
  const nota = el('details', 'peba-nota');
  nota.append(el('summary', null, tl('Nota sulla qualità dei dati')), el('p', null, tl(NOTA_QUALITA)));
  return nota;
}

export function contenutoDinamico(p) {
  const radice = el('div', 'peba-dinamico');
  if (p.punteggio != null) radice.append(barra(p));
  const voci = criticita(p);
  if (voci.length) radice.append(elencoCriticita(voci));
  if (p.n_foto > 0) {
    const sezione = el('div', 'peba-foto-sez');
    sezione.append(el('h4', null, t('peba.foto', { n: p.n_foto })));
    const griglia = el('div', 'peba-foto-griglia');
    for (let i = 1; i <= p.n_foto; i++) griglia.append(foto(p, i));
    sezione.append(griglia);
    radice.append(sezione);
  }
  radice.append(notaQualita());
  return radice;
}
