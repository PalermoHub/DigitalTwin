import { pmt } from '../core/config.js';

const val = v => (v == null || v === '' ? '—' : String(v));

export default {
  id: 'edifici',
  titolo: 'Edifici',
  aggiungiSorgenti(map) {
    map.addSource('edificato', { type: 'vector', url: pmt('edifici/edificato_pop.pmtiles') });
  },
  aggiungiLayer(map) {
    map.addLayer({
      id: 'edifici-3d', type: 'fill-extrusion', source: 'edificato', 'source-layer': 'edificato', minzoom: 14,
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': '#b8b8c8',
        'fill-extrusion-height': ['max', ['coalesce', ['get', 'altezza'], 3], 3],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.85,
      },
    });
    map.addLayer({
      id: 'edifici-hit', type: 'fill', source: 'edificato', 'source-layer': 'edificato', minzoom: 14,
      paint: { 'fill-opacity': 0 },
    });
  },
  strati: [{
    id: 'edifici3d', etichetta: 'Edifici 3D (da zoom 14)', layers: ['edifici-3d'], attivo: false,
    suCambio(attivo, map) { map.easeTo({ pitch: attivo ? 55 : 0, duration: 300 }); },
  }],
  scheda: {
    layers: ['edifici-hit'],
    voce(f) {
      const p = f.properties;
      return {
        peso: 20,
        titolo: 'Edificio',
        righe: [
          ['Altezza', p.altezza != null ? `${Number(p.altezza).toFixed(1)} m` : '—'],
          ['Uso', val(p.occupancy)],
          ['Residenti (stima)', p.pop_stim != null ? String(Math.round(p.pop_stim)) : '—'],
          ['Sezione', val(p.SEZ21_ID)],
        ],
      };
    },
  },
};
