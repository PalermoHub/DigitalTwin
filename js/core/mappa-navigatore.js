import { creaNavigatore, creaGuida } from './strati-3d-navigatore.js';

// Navigatore della vista 3D della mappa: lo stesso di «Strati in 3D» (bussola, joystick, zoom, inclinazione, centra, guida)
// ma pilota MapLibre. Compare in basso a sinistra, accanto al pannello, solo quando la vista è 3D (evento `vista3d`).

export const PITCH_MAX = 85;
const VEL = { sposta: 600, gira: 60, inclina: 45, zoom: 1.5 }; // px/s, gradi/s, gradi/s, livelli/s con l'asse a fondo corsa
const PITCH_3D = 55;

// per codice del tasto; le frecce no: le gestisce già MapLibre
const TASTI = {
  KeyW: ['avanti', 1], KeyS: ['avanti', -1], KeyD: ['lato', 1], KeyA: ['lato', -1],
  KeyE: ['gira', 1], KeyQ: ['gira', -1], KeyR: ['inclina', 1], KeyF: ['inclina', -1],
};
export function assiDaTastiMappa(premuti) {
  const assi = { avanti: 0, lato: 0, gira: 0, inclina: 0, zoom: 0 };
  for (const code of premuti) { const [a, v] = TASTI[code] ?? []; if (a) assi[a] += v; }
  return assi;
}

const tra = (v, min, max) => Math.min(max, Math.max(min, v));

// Dagli assi (-1..1) e dal tempo trascorso al prossimo passo di camera; null se fermi.
// dx, dy: spostamento del centro in px sullo schermo (dy < 0 = verso l'alto).
export function passoNavigatore(assi, dt, { pitch, zoom, bearing, zoomMin, zoomMax }) {
  if (!Object.values(assi).some(Boolean)) return null;
  return {
    dx: assi.lato * VEL.sposta * dt,
    dy: -assi.avanti * VEL.sposta * dt,
    bearing: bearing + assi.gira * VEL.gira * dt,
    pitch: tra(pitch + assi.inclina * VEL.inclina * dt, 0, PITCH_MAX),
    zoom: tra(zoom + assi.zoom * VEL.zoom * dt, zoomMin, zoomMax),
  };
}

const inCampo = ev => ev.target instanceof Element && !!ev.target.closest('input, textarea, select, [contenteditable]');

export function collegaNavigatoreMappa(map) {
  const assiUI = { avanti: 0, lato: 0, gira: 0, inclina: 0, zoom: 0 };
  const premuti = new Set();
  map.setMaxPitch?.(PITCH_MAX);
  const guida = creaGuida(() => { guida.hidden = true; }, 'mappa3d.guida');
  guida.classList.add('mappa-guida');
  const nav = creaNavigatore({
    assi: assiUI,
    gira: d => map.setBearing(map.getBearing() - d), // la rosa segue la mappa: girare l'anello in un verso gira il nord nell'altro
    nord: () => map.easeTo({ bearing: 0, duration: 300 }),
    centra: async () => { const { CENTRO, ZOOM } = await import('./config.js'); map.easeTo({ center: CENTRO, zoom: ZOOM, bearing: 0, pitch: PITCH_3D, duration: 600 }); }, // config.js legge `window`: caricato solo qui
    guida: () => { guida.hidden = !guida.hidden; },
    gesto: () => {},
  });
  nav.radice.classList.add('mappa-nav');
  nav.radice.hidden = guida.hidden = true;
  document.body.append(nav.radice, guida);

  const orienta = () => nav.orienta(-map.getBearing());
  map.on('rotate', orienta);
  orienta();

  let ciclo = 0, tPrima = 0;
  const passo = ora => {
    const dt = Math.min(0.05, (ora - tPrima) / 1000);
    tPrima = ora;
    const tasti = assiDaTastiMappa(premuti);
    const assi = Object.fromEntries(Object.keys(assiUI).map(a => [a, tra(assiUI[a] + tasti[a], -1, 1)]));
    const p = passoNavigatore(assi, dt, {
      pitch: map.getPitch(), zoom: map.getZoom(), bearing: map.getBearing(), zoomMin: map.getMinZoom(), zoomMax: map.getMaxZoom(),
    });
    if (p) {
      const c = map.project(map.getCenter());
      map.jumpTo({ center: map.unproject([c.x + p.dx, c.y + p.dy]), bearing: p.bearing, pitch: p.pitch, zoom: p.zoom });
    }
    ciclo = requestAnimationFrame(passo);
  };

  const avvia = () => { if (!ciclo) { tPrima = performance.now(); ciclo = requestAnimationFrame(passo); } };
  const ferma = () => { cancelAnimationFrame(ciclo); ciclo = 0; premuti.clear(); Object.keys(assiUI).forEach(a => { assiUI[a] = 0; }); };

  document.addEventListener('keydown', ev => {
    if (nav.radice.hidden || inCampo(ev) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (document.querySelector('.strati3d.aperta')) return; // la scena «Strati in 3D» ha i suoi tasti
    if (ev.key === '?') { guida.hidden = !guida.hidden; return; }
    if (ev.key === 'Escape' && !guida.hidden) { guida.hidden = true; return; }
    if (ev.code in TASTI) { ev.preventDefault(); premuti.add(ev.code); }
  });
  document.addEventListener('keyup', ev => premuti.delete(ev.code));
  window.addEventListener('blur', () => premuti.clear());

  document.addEventListener('vista3d', ev => {
    nav.radice.hidden = !ev.detail;
    document.body.classList.toggle('nav3d', !!ev.detail);
    if (ev.detail) avvia(); else { ferma(); guida.hidden = true; }
  });
  return nav;
}
