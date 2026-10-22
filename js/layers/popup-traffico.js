import { svgIcona } from '../core/icone.js';
import { t, tl } from '../core/i18n.js';

// Popup di aerei e navi: scheda scura con intestazione (icona e sezione), titolo, righe etichetta/valore e coordinate.
// Il modello (titolo, sottotitolo, righe) viene da scheda-voli.js / scheda-navi.js, lo stesso della scheda di destra.

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

const gradi = (v, pos, neg) => `${Math.abs(v).toFixed(5)}° ${v >= 0 ? pos : neg}`;

// opzioni: { sezione, icona, colore, modello: { titolo, sottotitolo, righe }, coordinate: [lon, lat], chiudi }
export function contenutoPopupTraffico({ sezione, icona, colore, modello, coordinate, chiudi }) {
  const radice = el('div', 'traffico-popup');
  radice.style.setProperty('--traffico-colore', colore);

  const testa = el('div', 'traffico-testa');
  const marchio = el('span', 'traffico-marchio');
  marchio.innerHTML = svgIcona(icona, 14);
  const chiusura = el('button', 'traffico-chiudi', '×');
  chiusura.type = 'button';
  chiusura.setAttribute('aria-label', t('comune.chiudi'));
  chiusura.addEventListener('click', chiudi);
  testa.append(marchio, el('span', 'traffico-sezione', tl(sezione)), chiusura);

  radice.append(testa, el('h3', 'traffico-titolo', tl(modello.titolo)));
  if (modello.sottotitolo) radice.append(el('p', 'traffico-stato', tl(modello.sottotitolo)));

  const lista = el('dl', 'traffico-righe');
  for (const r of modello.righe) lista.append(el('dt', null, tl(r.etichetta)), el('dd', null, tl(String(r.valore))));
  radice.append(lista);

  if (coordinate) {
    const [lon, lat] = coordinate;
    radice.append(el('p', 'traffico-coordinate', `${gradi(lat, 'N', 'S')} · ${gradi(lon, 'E', 'O')}`));
  }
  return radice;
}
