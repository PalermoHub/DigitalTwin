// js/geoimage/confronto.js
// Confronto con la base: Swipe (linea verticale trascinabile) e Spotlight (cerchio che scopre la mappa sotto l'immagine).
// Sono ritagli CSS del contenitore dell'immagine (confronto-clip.js); i due modi si escludono a vicenda.
import { clipSwipe, clipSpotlight } from './confronto-clip.js';
import { t } from '../core/i18n.js';

const el = (classe, tag = 'div') => Object.assign(document.createElement(tag), { className: classe });

export function collegaConfronto(ctx) {
  const { $, map, overlay, stato } = ctx;
  const mappa = map.getContainer();
  const divisore = el('gi-divisore');
  const maniglia = el('gi-divisore-maniglia', 'button');
  maniglia.type = 'button';
  maniglia.title = t('gi.confronto.trascina');
  maniglia.setAttribute('aria-label', t('gi.confronto.linea'));
  maniglia.textContent = '↔';
  divisore.append(maniglia);
  divisore.hidden = true;
  const cerchio = el('gi-cerchio');
  cerchio.hidden = true;
  mappa.append(divisore, cerchio);

  let modo = null; // 'swipe' | 'spotlight' | null
  let percentuale = 50;
  let raggio = 125;
  let invertito = false;
  let puntatore = null; // { x, y } in pixel della mappa

  function applica() {
    const c = overlay.contenitore;
    if (modo === 'swipe') c.style.clipPath = clipSwipe(percentuale);
    else if (modo === 'spotlight' && puntatore) c.style.clipPath = clipSpotlight({ ...puntatore, raggio, invertito, larghezza: mappa.clientWidth, altezza: mappa.clientHeight });
    else c.style.clipPath = '';
    divisore.hidden = modo !== 'swipe';
    divisore.style.left = `${percentuale}%`;
    cerchio.hidden = !(modo === 'spotlight' && puntatore);
    if (puntatore) Object.assign(cerchio.style, { left: `${puntatore.x}px`, top: `${puntatore.y}px`, width: `${raggio * 2}px`, height: `${raggio * 2}px` });
    $('swipe').setAttribute('aria-pressed', String(modo === 'swipe'));
    $('spotlight').setAttribute('aria-pressed', String(modo === 'spotlight'));
    $('inverti').setAttribute('aria-pressed', String(invertito));
  }

  function imposta(nuovo) {
    modo = nuovo;
    puntatore = null;
    applica();
  }

  $('swipe').addEventListener('click', () => { if (stato.immagine) imposta(modo === 'swipe' ? null : 'swipe'); });
  $('spotlight').addEventListener('click', () => {
    if (!stato.immagine) return;
    imposta(modo === 'spotlight' ? null : 'spotlight');
    if (modo === 'spotlight') ctx.messaggio(t('gi.confronto.spotlight'));
  });
  $('inverti').addEventListener('click', () => { invertito = !invertito; applica(); });
  $('raggio').addEventListener('input', () => {
    raggio = Math.round(Number($('raggio').value) / 2);
    $('raggio-val').textContent = String(raggio * 2);
    applica();
  });

  map.on('mousemove', e => {
    if (modo !== 'spotlight') return;
    puntatore = { x: e.point.x, y: e.point.y };
    applica();
  });
  mappa.addEventListener('mouseleave', () => { if (modo === 'spotlight') { puntatore = null; applica(); } });
  map.on('resize', applica);

  // trascinamento della linea dello Swipe: il divisore non sta nel contenitore del canvas, quindi la mappa non si sposta
  let trascina = false;
  maniglia.addEventListener('pointerdown', e => { trascina = true; maniglia.setPointerCapture(e.pointerId); e.preventDefault(); });
  maniglia.addEventListener('pointermove', e => {
    if (!trascina) return;
    const r = mappa.getBoundingClientRect();
    percentuale = Math.max(2, Math.min(98, (e.clientX - r.left) / r.width * 100));
    applica();
  });
  const fine = () => { trascina = false; };
  maniglia.addEventListener('pointerup', fine);
  maniglia.addEventListener('pointercancel', fine);

  // un'altra immagine, o nessuna: il confronto riparte spento
  ctx.sulCaricamento(() => imposta(null));
  // pannello chiuso o ripiegato: i controlli non si vedono, quindi la mappa torna senza ritagli
  ctx.suVisibilita(aperto => { if (!aperto) imposta(null); });
}
