import { aggiorna3D } from '../core/mappa.js';
import { pmt } from '../core/config.js';
import { EDIFICATO_NEUTRAL } from '../core/palette.js';
import { primo, righe } from '../core/scheda-util.js';
import { rigaUso } from './scheda-uso.js';

export default {
  id: 'edifici',
  titolo: 'Edifici',
  argomento: { titolo: 'Edifici', descrizione: 'Impronte degli edifici, anche in 3D, con stima della popolazione per edificio.' },
  aggiungiSorgenti(map) {
    map.addSource('edificato', { type: 'vector', url: pmt('edifici/edificato_pop.pmtiles') });
  },
  aggiungiLayer(map) {
    map.addLayer({
      id: 'edifici-2d', type: 'fill', source: 'edificato', 'source-layer': 'edificato', minzoom: 12,
      paint: { 'fill-color': EDIFICATO_NEUTRAL, 'fill-opacity': 0.8, 'fill-outline-color': '#9aa0a6' },
    });
    map.addLayer({
      id: 'edifici-3d', type: 'fill-extrusion', source: 'edificato', 'source-layer': 'edificato', minzoom: 12,
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': EDIFICATO_NEUTRAL,
        'fill-extrusion-height': ['coalesce', ['get', 'altezza'], 0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.85,
      },
    });
    map.addLayer({
      id: 'edifici-hit', type: 'fill', source: 'edificato', 'source-layer': 'edificato', minzoom: 12,
      paint: { 'fill-opacity': 0 },
    });
  },
  strati: [{
    id: 'edificato', etichetta: 'Edificato (da zoom 12)', layers: ['edifici-2d'], attivo: true,
  }, {
    id: 'edifici3d', etichetta: 'Edifici 3D (da zoom 12)', layers: ['edifici-3d'], attivo: false,
    suCambio(attivo, map) { aggiorna3D(map); },
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
        icona: 'edificio',
        gruppi: [{ righe: [
          ...righe([['Altezza', p.altezza != null ? `${Number(p.altezza).toFixed(1)} m` : null]]),
          rigaUso(p.occupancy), // UNK è debole: monumenti, scuole e seggi lo migliorano nella stessa scheda
          ...righe([['Residenti (stima)', p.pop_stim != null ? Math.round(p.pop_stim) : null]]),
        ].filter(Boolean) }],
      }];
    },
  },
};
