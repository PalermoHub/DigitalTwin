// js/aggiungi/ispra.js
// Carte geologiche ISPRA (Servizio Geologico d'Italia): WMS pronti da accendere dal ramo «ArcGIS REST».
// Server ArcGIS con WMSServer, https, CORS aperto, EPSG:3857 (anche il raster 1:50.000, che nelle capabilities dichiara solo 4326).
// `bbox` = estensione del servizio. Modulo puro, senza DOM né rete.
const SINA = 'https://sinacloud.isprambiente.it/arcgisgeo/services/geo';
const GEO_25K = `${SINA}/SGI_ISPRA_Geologia25k/MapServer/WMSServer`;
const RISORSE_25K = `${SINA}/SGI_ISPRA_Prospezioni_e_risorse25k/MapServer/WMSServer`;
const GEO_50K = 'https://sgi2.isprambiente.it/arcgis/services/raster/geo_50k_italia/ImageServer/WMSServer';

const BBOX_25K = [6.33, 35.49, 18.67, 47.2];
const BBOX_50K = [6.61, 36.58, 18.7, 46.81];
const BBOX_RISORSE = [6.63, 37.2, 18.67, 47.2];

export const ATTRIBUZIONE_ISPRA = '© ISPRA, Servizio Geologico d\'Italia (CARG)';

const voce = (id, nome, url, layers, bbox) => ({ id, nome, url, layers, version: '1.3.0', format: 'image/png', bbox });
const geo25 = (id, nome, layer) => voce(`geo25k-${id}`, `Geologia 1:25.000 - ${nome}`, GEO_25K, layer, BBOX_25K);
const risorse = (id, nome, layer) => voce(`risorse25k-${id}`, `Risorse e prospezioni 1:25.000 - ${nome}`, RISORSE_25K, layer, BBOX_RISORSE);

export const WMS_ISPRA = [
  voce('geo50k', 'Carta geologica 1:50.000 (raster)', GEO_50K, '0', BBOX_50K),
  geo25('unita', 'Unità geologiche', '0'), // i18n-ok: tradotto con lbl.* in tl()
  geo25('quaternari', 'Depositi quaternari', '1'),
  geo25('limiti', 'Limiti geologici', '2'),
  geo25('tettonici', 'Elementi tettonici', '3'),
  geo25('strutturali', 'Elementi strutturali e plicativi', '4'),
  geo25('livelli', 'Livelli guida, fossiliferi e dicchi', '5'),
  geo25('campioni', 'Campioni geologici', '6'),
  geo25('giaciture', 'Giaciture', '7'),
  risorse('strutture', 'Strutture antropiche', '0'),
  risorse('lineari', 'Elementi antropici (lineari)', '1'),
  risorse('discariche', 'Discariche', '2'),
  risorse('risorse', 'Risorse e prospezioni (cave, sorgenti, pozzi, sondaggi)', '3'),
]; // i18n-ok: nomi dei servizi, come sono sul server
