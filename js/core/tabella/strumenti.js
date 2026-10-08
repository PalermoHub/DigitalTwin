// js/core/tabella/strumenti.js
// Strumenti per scegliere le feature con il mouse. Ognuno produce un «criterio» (elenco di poligoni) e lo passa a suCriterio.
import { t } from '../i18n.js';
import { riquadro, chiudiPoligono } from './geom.js';
import { poligoniArea } from './mappa.js';

const RAGGIO_CLIC = 6; // px attorno al clic
const SOGLIA_TRASCINAMENTO = 3; // px sotto i quali il riquadro si ignora
const SORGENTE_BOZZA = 'tabella-bozza';
const STRATO_BOZZA = 'tabella-bozza-linea';

export function collegaStrumenti(map, { suCriterio, suMessaggio }) {
  let modoAttivo = null;
  let livelloArea = 'quartiere';
  let vertici = [];
  let inizio = null;
  let scatola = null;

  const aggiungi = e => Boolean(e.originalEvent?.ctrlKey || e.originalEvent?.metaKey);
  const lngLat = p => { const c = map.unproject([p.x, p.y]); return [c.lng, c.lat]; };

  function disegnaBozza() {
    if (!map.getSource) return;
    const dati = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: vertici } };
    if (!map.getSource(SORGENTE_BOZZA)) {
      if (!map.addSource || !map.addLayer) return;
      map.addSource(SORGENTE_BOZZA, { type: 'geojson', data: dati });
      map.addLayer({ id: STRATO_BOZZA, type: 'line', source: SORGENTE_BOZZA, paint: { 'line-color': '#e8590c', 'line-width': 2, 'line-dasharray': [2, 1] } });
    } else map.getSource(SORGENTE_BOZZA).setData(dati);
  }
  const azzeraBozza = () => { vertici = []; if (map.getSource?.(SORGENTE_BOZZA)) disegnaBozza(); };

  const suClick = e => {
    if (modoAttivo === 'click') {
      const a = lngLat({ x: e.point.x - RAGGIO_CLIC, y: e.point.y + RAGGIO_CLIC });
      const b = lngLat({ x: e.point.x + RAGGIO_CLIC, y: e.point.y - RAGGIO_CLIC });
      suCriterio([riquadro(a, b)], { aggiungi: aggiungi(e) });
    } else if (modoAttivo === 'poligono') {
      vertici.push([e.lngLat.lng, e.lngLat.lat]);
      disegnaBozza();
    } else if (modoAttivo === 'area') {
      const pezzi = poligoniArea(map, e.point, livelloArea);
      if (pezzi.length) suCriterio(pezzi, { aggiungi: aggiungi(e) });
      else suMessaggio(t('tabella.areaNessuna'));
    }
  };

  const suDoppioClic = e => {
    if (modoAttivo !== 'poligono') return;
    e.preventDefault?.();
    const poligono = chiudiPoligono(vertici);
    azzeraBozza();
    if (poligono) suCriterio([poligono], { aggiungi: aggiungi(e) });
    else suMessaggio(t('tabella.poligonoInvalido'));
  };

  const suGiu = e => {
    if (modoAttivo !== 'riquadro') return;
    inizio = e.point;
    scatola = document.createElement('div');
    scatola.className = 'tabella-riquadro';
    map.getCanvasContainer().append(scatola);
  };
  const suMuovi = e => {
    if (!inizio || !scatola) return;
    Object.assign(scatola.style, { left: `${Math.min(inizio.x, e.point.x)}px`, top: `${Math.min(inizio.y, e.point.y)}px`, width: `${Math.abs(e.point.x - inizio.x)}px`, height: `${Math.abs(e.point.y - inizio.y)}px` });
  };
  const suSu = e => {
    if (!inizio) return;
    const da = inizio;
    inizio = null;
    scatola?.remove?.();
    scatola = null;
    if (Math.hypot(e.point.x - da.x, e.point.y - da.y) < SOGLIA_TRASCINAMENTO) return;
    suCriterio([riquadro(lngLat(da), lngLat(e.point))], { aggiungi: aggiungi(e) });
  };
  const suTasto = e => { if (e.key === 'Escape') annulla(); };

  const GESTORI = [['click', suClick], ['dblclick', suDoppioClic], ['mousedown', suGiu], ['mousemove', suMuovi], ['mouseup', suSu]];

  function annulla() {
    azzeraBozza();
    inizio = null;
    scatola?.remove?.();
    scatola = null;
  }

  function imposta(modo) {
    if (modoAttivo) { for (const [ev, f] of GESTORI) map.off(ev, f); document.removeEventListener?.('keydown', suTasto); }
    annulla();
    modoAttivo = modo;
    map.getCanvas().style.cursor = modo ? 'crosshair' : '';
    map.dragPan[modo === 'riquadro' ? 'disable' : 'enable']();
    map.doubleClickZoom[modo === 'poligono' ? 'disable' : 'enable']();
    if (modo) { for (const [ev, f] of GESTORI) map.on(ev, f); document.addEventListener?.('keydown', suTasto); }
  }

  return { imposta, modo: () => modoAttivo, livello: l => { livelloArea = l; }, annulla };
}
