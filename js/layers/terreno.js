import { urlTileset } from '../core/config.js';
import { ELEVATION_STOPS, HILLSHADE_COLORS } from '../core/palette.js';
import { piuVicino } from '../core/scheda-util.js';
import { voceTerreno } from './scheda-terreno.js';

// Come nell'app palermo_popolazione (map.js): rilievo in codifica Terrarium per il 3D con
// ombreggiatura, raster di elevazione già colorato (legenda = ELEVATION_STOPS) e, dalla griglia
// DTM a passo 50 m, i punti con gli indici morfologici. I tile sono letti dai link del catalogo.

let legenda = null;

export default {
  id: 'terreno',
  titolo: 'Terreno',
  aggiungiSorgenti(map) {
    const dem = urlTileset('terrain-dem');
    const elevazione = urlTileset('elevazione');
    const griglia = urlTileset('griglia');
    if (dem) map.addSource('terrain-dem', { type: 'raster-dem', tiles: [dem], encoding: 'terrarium', tileSize: 256, minzoom: 8, maxzoom: 15 });
    if (elevazione) map.addSource('elevazione', { type: 'raster', tiles: [elevazione], tileSize: 256, minzoom: 8, maxzoom: 15, scheme: 'tms' });
    if (griglia) map.addSource('griglia', { type: 'vector', tiles: [griglia], minzoom: 8, maxzoom: 15 });
  },
  aggiungiLayer(map) {
    if (map.getSource('terrain-dem')) {
      map.addLayer({
        id: 'hillshade-layer', type: 'hillshade', source: 'terrain-dem', layout: { visibility: 'none' },
        paint: {
          'hillshade-exaggeration': 0.35,
          'hillshade-shadow-color': HILLSHADE_COLORS.shadow,
          'hillshade-highlight-color': HILLSHADE_COLORS.highlight,
          'hillshade-accent-color': HILLSHADE_COLORS.accent,
          'hillshade-illumination-direction': 180,
          'hillshade-illumination-anchor': 'map',
        },
      });
    }
    if (map.getSource('elevazione')) {
      map.addLayer({
        id: 'elevazione-raster', type: 'raster', source: 'elevazione', layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.7 },
      });
    }
    if (map.getSource('griglia')) {
      // cerchi trasparenti, abbastanza larghi da coprire la cella da 50 m: servono alla scheda del luogo
      map.addLayer({
        id: 'griglia-hit', type: 'circle', source: 'griglia', 'source-layer': 'griglia', minzoom: 15,
        paint: { 'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 15, 16, 19, 256], 'circle-opacity': 0 },
      });
    }
  },
  strati: [
    {
      id: 'rilievo3d', etichetta: 'Rilievo 3D con ombreggiatura', layers: ['hillshade-layer'], attivo: false,
      suCambio(attivo, map) {
        map.setTerrain(attivo ? { source: 'terrain-dem', exaggeration: 1.5 } : null);
        map.easeTo({ pitch: attivo ? 55 : 0, duration: 300 });
      },
    },
    {
      id: 'elevazione', etichetta: 'Elevazione (raster colorato)', layers: ['elevazione-raster'], attivo: false,
      suCambio(attivo, map) {
        if (legenda) legenda.hidden = !attivo;
        if (attivo && map.getLayer('elevazione-raster')) map.moveLayer('elevazione-raster'); // come nell'app originale
      },
    },
  ],
  pannello(el) {
    legenda = document.createElement('div');
    legenda.className = 'legenda legenda-elevazione';
    legenda.hidden = true;
    legenda.replaceChildren(...ELEVATION_STOPS.map(({ value, color }) => {
      const riga = document.createElement('div');
      const chip = document.createElement('i');
      chip.style.background = color;
      riga.append(chip, value);
      return riga;
    }));
    el.append(legenda);
  },
  scheda: {
    layers: ['griglia-hit'],
    // il punto di griglia più vicino al clic (i cerchi si sovrappongono)
    voci(trovati, lngLat) {
      const f = piuVicino(trovati, 'griglia-hit', lngLat);
      return f ? [voceTerreno(f.properties)] : [];
    },
  },
};
