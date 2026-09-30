import { pmt } from '../core/config.js';
import { EDIFICATO_NEUTRAL } from '../core/palette.js';
import { primo, righe } from '../core/scheda-util.js';

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
        'fill-extrusion-color': EDIFICATO_NEUTRAL,
        'fill-extrusion-height': ['coalesce', ['get', 'altezza'], 0],
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
    voci(trovati) {
      const f = primo(trovati, 'edifici-hit');
      if (!f) return [];
      const p = f.properties;
      return [{
        chiave: 'edificio',
        peso: 30,
        titolo: 'Edificio',
        icona: 'fa-building',
        gruppi: [{ righe: righe([
          ['Altezza', p.altezza != null ? `${Number(p.altezza).toFixed(1)} m` : null],
          ['Uso', p.occupancy],
          ['Residenti (stima)', p.pop_stim != null ? Math.round(p.pop_stim) : null],
        ]) }],
      }];
    },
  },
};
