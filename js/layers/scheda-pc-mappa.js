// Riquadro con la mappa delle aree di emergenza dentro la scheda: tutte le aree del Piano colorate per classe e quelle cliccate in evidenza.
// È una seconda mappa MapLibre con la stessa base e lo stesso PMTiles della mappa grande. Gesti «cooperativi»: un dito fa scorrere la scheda,
// due dita (o Ctrl + rotella sul computer) muovono la mappa; i pulsanti + e − servono sempre.
import { STILE_BASE, pmt } from '../core/config.js';
import { t } from '../core/i18n.js';
import { CLASSI, CONTORNO, zoomPerSuperficie, filtroEvidenza, retino } from './scheda-protezione-civile.js';

const SRC = 'pc-mini';
const ALTEZZA = 220;

let corrente = null; // una sola mini-mappa viva: aprendo un'altra scheda la precedente si libera

export function creaMiniMappaAree(aree) {
  const punti = aree.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  const radice = document.createElement('div');
  radice.className = 'pc-mini';
  if (!punti.length) return radice;
  const tela = document.createElement('div');
  tela.className = 'pc-mini-tela';
  tela.style.height = `${ALTEZZA}px`;
  tela.setAttribute('role', 'img');
  tela.setAttribute('aria-label', t('pc.mini.titolo'));
  const legenda = document.createElement('p');
  legenda.className = 'pc-mini-nota';
  legenda.textContent = t('pc.mini.nota');
  radice.append(tela, legenda);
  corrente?.remove();
  // la mappa si crea quando la tela è nel documento (ha una misura)
  requestAnimationFrame(() => {
    if (!tela.isConnected) return;
    const centro = [punti.reduce((s, p) => s + p.lon, 0) / punti.length, punti.reduce((s, p) => s + p.lat, 0) / punti.length];
    const mini = new maplibregl.Map({ container: tela, style: STILE_BASE, center: centro, zoom: zoomPerSuperficie(Math.max(...punti.map(p => Number(p.sup_m2)))), cooperativeGestures: true, attributionControl: false,
      locale: { 'CooperativeGesturesHandler.WindowsHelpText': t('pc.mini.gestiPc'), 'CooperativeGesturesHandler.MacHelpText': t('pc.mini.gestiMac'), 'CooperativeGesturesHandler.MobileHelpText': t('pc.mini.gestiTel') } });
    mini.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    corrente = mini;
    const ids = aree.map(p => p.id).filter(id => id != null);
    mini.on('load', () => {
      mini.addSource(SRC, { type: 'vector', url: pmt('protezione-civile/protezione-civile.pmtiles') });
      // stessa vestizione della mappa grande: retino obliquo del colore della classe, contorno grigio e simbolo blu della classe
      const perClasse = (f, altro) => ['match', ['get', 'classe'], ...CLASSI.flatMap(c => [c.id, f(c)]), altro];
      for (const c of CLASSI) mini.addImage(`pc-retino-${c.id}`, retino(c.colore), { pixelRatio: 2 });
      mini.addLayer({ id: 'pc-mini-fill', type: 'fill', source: SRC, 'source-layer': 'aree', paint: { 'fill-pattern': perClasse(c => `pc-retino-${c.id}`, 'pc-retino-rischio'), 'fill-opacity': 0.95 } });
      mini.addLayer({ id: 'pc-mini-bordo', type: 'line', source: SRC, 'source-layer': 'aree', paint: { 'line-color': CONTORNO, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 17, 1.4] } });
      for (const c of CLASSI.filter(x => x.icona)) {
        mini.loadImage(c.icona).then(({ data }) => { if (!mini.hasImage(`pc-icona-${c.id}`)) mini.addImage(`pc-icona-${c.id}`, data, { pixelRatio: 2 }); }).catch(() => {});
      }
      mini.addLayer({
        id: 'pc-mini-icone', type: 'symbol', source: SRC, 'source-layer': 'punti',
        layout: { 'icon-image': perClasse(c => (c.icona ? `pc-icona-${c.id}` : ''), ''), 'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 14, 0.6, 17, 0.9], 'icon-allow-overlap': false },
      });
      mini.addLayer({ id: 'pc-mini-scelta', type: 'line', source: SRC, 'source-layer': 'aree', filter: filtroEvidenza(ids), paint: { 'line-color': '#d6336c', 'line-width': 3.5 } });
      mini.addLayer({ id: 'pc-mini-scelta-fill', type: 'fill', source: SRC, 'source-layer': 'aree', filter: filtroEvidenza(ids), paint: { 'fill-color': '#d6336c', 'fill-opacity': 0.18 } });
    });
    for (const p of punti) new maplibregl.Marker({ color: '#d6336c', scale: 0.7 }).setLngLat([p.lon, p.lat]).addTo(mini);
  });
  return radice;
}
