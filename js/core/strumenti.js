import { CENTRO, ZOOM, ZOOM_SLIDER } from './config.js';
import { t } from './i18n.js';
import { collegaStreetView } from './streetview.js';


// Barra degli strumenti: vista iniziale, schermo intero, slider dello zoom sincronizzato con la mappa.
export function collegaStrumenti(map) {
  collegaTema(document.getElementById('btn-tema'));
  const btnSv = document.getElementById('btn-streetview');
  if (btnSv) collegaStreetView(map, btnSv);
  const slider = document.getElementById('zoom-slider');
  const badge = document.getElementById('zoom-badge');
  const mostra = z => {
    slider.value = z;
    badge.textContent = Number.isInteger(z) ? String(z) : z.toFixed(1);
  };

  document.getElementById('btn-home').addEventListener('click', () => {
    map.flyTo({ center: CENTRO, zoom: ZOOM, bearing: 0, pitch: 0 });
  });
  document.getElementById('btn-fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  });
  const btn3d = document.getElementById('btn-3d');
  const segna3d = attivo => {
    btn3d.setAttribute('aria-pressed', String(attivo));
    btn3d.title = attivo ? t('strumenti.vista2d') : t('html.btn.3d');
  };
  document.addEventListener('vista3d', e => segna3d(e.detail));
  btn3d.addEventListener('click', () => {
    const casella = document.getElementById('strato-edifici3d');
    casella.checked = !btn3d.getAttribute('aria-pressed').includes('true');
    casella.dispatchEvent(new Event('change'));
  });
  [slider.min, slider.max] = ZOOM_SLIDER;
  slider.addEventListener('input', () => map.setZoom(+slider.value));
  map.on('zoom', () => mostra(map.getZoom()));
  mostra(map.getZoom());
  // un permalink con inclinazione riapre direttamente in 3D
  if (map.getPitch() > 0) {
    const casella = document.getElementById('strato-edifici3d');
    casella.checked = true;
    casella.dispatchEvent(new Event('change'));
  }
}

// Il pulsante arancione della barra di ricerca apre/chiude il tab «Filtri» della barra a sinistra (zona, linea, incidenti,
// foglio e particella). Sul tab compare il numero di filtri attivi, letto dalle chip sulla mappa.
export function collegaPannelloFiltri(bottone, esito) {
  const tab = document.getElementById('btn-gruppo-filtri');
  const sezione = document.getElementById('gruppo-filtri');
  if (!tab || !sezione) { bottone.hidden = true; return; }
  const chips = ['filtri-chips', 'filtri-linea-chips', 'filtri-incidenti-chips'].map(id => document.getElementById(id)).filter(Boolean);
  const aggiorna = () => {
    const aperto = !sezione.hidden;
    bottone.setAttribute('aria-expanded', String(aperto));
    if (!aperto) esito.hidden = true;
    const n = chips.reduce((tot, c) => tot + (c.hidden ? 0 : c.children.length), 0);
    for (const b of [tab, bottone]) { b.dataset.attivo = String(n > 0); b.dataset.n = String(n); }
  };
  new MutationObserver(aggiorna).observe(sezione, { attributes: true, attributeFilter: ['hidden'] });
  for (const c of chips) new MutationObserver(aggiorna).observe(c, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  bottone.addEventListener('click', () => {
    tab.click();
    if (!sezione.hidden) document.getElementById('f-circ').focus();
  });
  aggiorna();
}

// Tema chiaro (predefinito) o scuro dell'interfaccia: la scelta resta nel browser; lo script in <head> la applica prima del disegno.
function collegaTema(btn) {
  const radice = document.documentElement;
  const mostra = scuro => {
    btn.setAttribute('aria-pressed', String(scuro));
    btn.title = btn.ariaLabel = scuro ? t('strumenti.temaChiaro') : t('html.tema');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', scuro ? '#1c2128' : '#ffffff');
  };
  mostra(radice.dataset.tema === 'scuro');
  btn.addEventListener('click', () => {
    const scuro = radice.dataset.tema !== 'scuro';
    if (scuro) radice.dataset.tema = 'scuro'; else delete radice.dataset.tema;
    try { localStorage.setItem('dt-tema', scuro ? 'scuro' : 'chiaro'); } catch { /* storage non disponibile */ }
    mostra(scuro);
    document.dispatchEvent(new CustomEvent('tema', { detail: scuro }));
  });
}
