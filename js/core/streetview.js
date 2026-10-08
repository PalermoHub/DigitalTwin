import { t } from './i18n.js';

export const SOGLIA_TRASCINAMENTO = 6; // px: sotto questa distanza il gesto è un clic semplice, senza heading
const RAGGIO_PX = 60;
const RAGGIO_PX_MOBILE = 44; // su schermi stretti il cono più piccolo non copre la mappa
const raggioPx = () => (window.matchMedia?.('(max-width: 720px)').matches ? RAGGIO_PX_MOBILE : RAGGIO_PX);
const SORGENTE = 'streetview-visuale';

// Gradi da nord in senso orario (0 = nord, 90 = est) del vettore origine→cursore; `bearing` è la rotazione della mappa.
export function calcolaHeading(origine, punto, bearing = 0) {
  const gradi = Math.atan2(punto.x - origine.x, origine.y - punto.y) * 180 / Math.PI + bearing;
  return ((gradi % 360) + 360) % 360;
}

// Link a Street View di Google Maps: nessuna API key, apre la panoramica più vicina al punto.
export function urlStreetView({ lat, lng }, heading) {
  const h = heading == null ? '' : `&heading=${Math.round(heading) % 360}`;
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}${h}&pitch=0&fov=90`;
}

// Versione incorporabile in un iframe (senza API key): panoramica al punto, con direzione di vista `heading`.
export function urlIncorporato({ lat, lng }, heading = 0) {
  return `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,${Math.round(heading) % 360},0,0,0&output=svembed`;
}

// Settore (cono di visuale) centrato su `heading`, ampio `fov` gradi, come poligono GeoJSON.
export function settoreVisuale({ lat, lng }, heading, raggioM, fov = 90) {
  const mLat = 111320;
  const mLng = 111320 * Math.cos(lat * Math.PI / 180);
  const anello = [[lng, lat]];
  const passi = 12;
  for (let i = 0; i <= passi; i++) {
    const a = (heading - fov / 2 + fov * i / passi) * Math.PI / 180;
    anello.push([lng + raggioM * Math.sin(a) / mLng, lat + raggioM * Math.cos(a) / mLat]);
  }
  anello.push([lng, lat]);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [anello] } };
}

// Street View dentro l'app: finestra flottante (non modale) che si sposta trascinando la barra e si ridimensiona dall'angolo.
let posizione = null; // { left, top } dell'ultima finestra, riusata alla successiva
function apriFinestra(lngLat, heading, href) {
  document.querySelector('dialog.streetview-finestra')?.close();
  const d = document.createElement('dialog');
  d.className = 'streetview-finestra';
  d.setAttribute('aria-label', t('strumenti.streetviewTitolo'));
  const barra = document.createElement('div');
  barra.className = 'streetview-barra';
  const ext = document.createElement('a');
  ext.href = href; ext.target = '_blank'; ext.rel = 'noopener noreferrer';
  ext.textContent = t('strumenti.streetviewGoogle');
  const x = document.createElement('button');
  x.type = 'button'; x.textContent = '✕'; x.title = x.ariaLabel = t('strumenti.streetviewChiudi');
  x.addEventListener('click', () => d.close());
  barra.append(ext, x);
  const f = document.createElement('iframe');
  f.src = urlIncorporato(lngLat, heading ?? 0);
  f.title = t('strumenti.streetviewTitolo');
  f.allowFullscreen = true;
  f.referrerPolicy = 'no-referrer';
  d.append(barra, f);
  d.addEventListener('close', () => d.remove());
  document.body.append(d);
  d.show();
  const r = d.getBoundingClientRect();
  const pos = posizione ?? { left: Math.max(8, innerWidth - r.width - 24), top: 76 };
  d.style.left = `${pos.left}px`; d.style.top = `${pos.top}px`;
  collegaTrascinamento(d, barra);
}

function collegaTrascinamento(d, barra) {
  barra.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button') || e.button > 0) return;
    const r = d.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    barra.setPointerCapture(e.pointerId);
    d.classList.add('trascinata'); // l'iframe non deve rubare i puntatori durante il gesto
    const muovi = ev => {
      const left = Math.min(Math.max(0, ev.clientX - dx), innerWidth - 80);
      const top = Math.min(Math.max(0, ev.clientY - dy), innerHeight - 40);
      d.style.left = `${left}px`; d.style.top = `${top}px`;
      posizione = { left, top };
    };
    const rilascia = () => {
      d.classList.remove('trascinata');
      barra.removeEventListener('pointermove', muovi);
      barra.removeEventListener('pointerup', rilascia);
      barra.removeEventListener('pointercancel', rilascia);
    };
    barra.addEventListener('pointermove', muovi);
    barra.addEventListener('pointerup', rilascia);
    barra.addEventListener('pointercancel', rilascia);
  });
}

const vuoto = { type: 'FeatureCollection', features: [] };

// Pulsante «omino»: pressione sul punto, trascinamento per ruotare il cono, rilascio per aprire Street View.
export function collegaStreetView(map, btn) {
  let attivo = false;
  let partenza = null; // { punto, lngLat }
  let heading = null;

  const assicuraLayer = () => {
    if (map.getSource(SORGENTE)) return;
    map.addSource(SORGENTE, { type: 'geojson', data: vuoto });
    map.addLayer({ id: `${SORGENTE}-fill`, type: 'fill', source: SORGENTE, paint: { 'fill-color': '#1a73e8', 'fill-opacity': 0.35 } });
    map.addLayer({ id: `${SORGENTE}-line`, type: 'line', source: SORGENTE, paint: { 'line-color': '#1a73e8', 'line-width': 2 } });
  };
  const disegna = features => map.getSource(SORGENTE)?.setData({ type: 'FeatureCollection', features });
  const pulisci = () => disegna([]);

  const raggioMetri = lat => raggioPx() * 156543.03 * Math.cos(lat * Math.PI / 180) / 2 ** map.getZoom();

  const imposta = on => {
    attivo = on;
    btn.setAttribute('aria-pressed', String(on));
    btn.title = btn.ariaLabel = t(on ? 'strumenti.streetviewAttivo' : 'html.btn.streetview');
    map.getCanvas().style.cursor = on ? 'crosshair' : '';
    if (on) { assicuraLayer(); map.dragPan.disable(); } else { map.dragPan.enable(); partenza = null; pulisci(); }
  };

  const inizio = e => {
    if (!attivo || e.originalEvent?.touches?.length > 1 || e.originalEvent?.button > 0) return;
    pulisci();
    partenza = { punto: e.point, lngLat: e.lngLat };
    heading = null;
    disegna([{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] } }]);
  };
  const muovi = e => {
    if (!partenza) return;
    if (Math.hypot(e.point.x - partenza.punto.x, e.point.y - partenza.punto.y) < SOGLIA_TRASCINAMENTO) return;
    heading = calcolaHeading(partenza.punto, e.point, map.getBearing());
    disegna([settoreVisuale(partenza.lngLat, heading, raggioMetri(partenza.lngLat.lat), 90)]);
  };
  const fine = () => {
    if (!partenza) return;
    const { lngLat } = partenza;
    partenza = null;
    apriFinestra(lngLat, heading, urlStreetView(lngLat, heading));
  };

  map.on('mousedown', inizio);
  map.on('touchstart', inizio);
  map.on('mousemove', muovi);
  map.on('touchmove', muovi);
  map.on('mouseup', fine);
  map.on('touchend', fine);
  btn.addEventListener('click', () => imposta(!attivo));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && attivo) imposta(false); });
}
