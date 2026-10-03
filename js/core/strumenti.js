import { CENTRO, ZOOM, ZOOM_SLIDER } from './config.js';


// Barra degli strumenti: vista iniziale, schermo intero, slider dello zoom sincronizzato con la mappa.
export function collegaStrumenti(map) {
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
    btn3d.title = attivo ? 'Torna alla vista 2D' : 'Vista 3D';
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

// Il pulsante arancione della barra di ricerca apre/chiude i filtri di zona e i campi foglio e particella.
export function collegaPannelloFiltri(bottone, pannello, esito) {
  bottone.addEventListener('click', () => {
    pannello.hidden = !pannello.hidden;
    bottone.setAttribute('aria-expanded', String(!pannello.hidden));
    if (pannello.hidden) esito.hidden = true;
    else document.getElementById('f-circ').focus();
  });
}
