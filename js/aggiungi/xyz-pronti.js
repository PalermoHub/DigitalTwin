// js/aggiungi/xyz-pronti.js
// Basi XYZ pronte da accendere dal ramo «XYZ» (Esri, tile Web Mercator standard, CORS aperto). Modulo puro, senza DOM né rete.
export const ATTRIBUZIONE_ESRI = 'Esri, HERE, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors';

export const XYZ_PRONTI = [
  { id: 'esri-standard', nome: 'Esri Standard', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', max: 19 },
  { id: 'esri-topo', nome: 'Esri Topo', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', max: 19 },
]; // i18n-ok: nomi dei servizi, come sono sul server
