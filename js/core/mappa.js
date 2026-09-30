import { CENTRO, ZOOM } from './config.js';

export function creaMappa(idContenitore) {
  const protocollo = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocollo.tile);
  return new maplibregl.Map({
    container: idContenitore,
    center: CENTRO,
    zoom: ZOOM,
    maxZoom: 19,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© OpenStreetMap',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.6, 'raster-saturation': -0.6 } }],
    },
  });
}
