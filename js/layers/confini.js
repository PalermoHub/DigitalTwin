import { pmt } from '../core/config.js';

export const SRC_SEZIONI = 'sezioni';

// [sorgente-layer, colore, spessore, attivo]
const LINEE = [
  ['circoscrizioni', '#1f3a5f', 2.2, true],
  ['quartieri', '#4a6fa5', 1.2, false],
  ['upl', '#7d93b8', 1, false],
];

export default {
  id: 'confini',
  titolo: 'Confini',
  aggiungiSorgenti(map) {
    map.addSource('confini', { type: 'vector', url: pmt('popolazione/confini_amministrativi.pmtiles') });
    map.addSource(SRC_SEZIONI, {
      type: 'vector',
      url: pmt('popolazione/geo_sezioni_2021.pmtiles'),
      promoteId: { sezioni: 'SEZ21_ID' },
    });
  },
  aggiungiLayer(map) {
    for (const [id, colore, spessore, attivo] of LINEE) {
      map.addLayer({
        id: `confini-${id}`, type: 'line', source: 'confini', 'source-layer': id,
        layout: { visibility: attivo ? 'visible' : 'none' },
        paint: { 'line-color': colore, 'line-width': spessore },
      });
    }
    map.addLayer({
      id: 'confini-sezioni', type: 'line', source: SRC_SEZIONI, 'source-layer': 'sezioni', minzoom: 13,
      layout: { visibility: 'none' },
      paint: { 'line-color': '#888', 'line-width': 0.6 },
    });
  },
  strati: [
    { id: 'circoscrizioni', etichetta: 'Circoscrizioni', layers: ['confini-circoscrizioni'], attivo: true },
    { id: 'quartieri', etichetta: 'Quartieri', layers: ['confini-quartieri'], attivo: false },
    { id: 'upl', etichetta: 'UPL (unità di primo livello)', layers: ['confini-upl'], attivo: false },
    { id: 'sezioni', etichetta: 'Sezioni di censimento (da zoom 13)', layers: ['confini-sezioni'], attivo: false },
  ],
};
