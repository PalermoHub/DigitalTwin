// js/aggiungi/ortofoto.js
// Ortofoto della Regione Siciliana (SITR): cache a tile ArcGIS REST in Web Mercator standard, pronte da accendere dal ramo
// «ArcGIS REST». `max` è l'ultimo livello con tile veri sul server (oltre, MapLibre ingrandisce). Modulo puro, senza DOM né rete.
const SITR = 'https://map.sitr.regione.sicilia.it/gis/rest/services/ortofoto';
export const ATTRIBUZIONE_ORTOFOTO = '© Regione Siciliana, SITR';

export const ORTOFOTO = [
  { id: '2022', nome: 'Ortofoto 2022, 20 cm', servizio: 'ortofoto_2022_20cm_sicilia/ImageServer', max: 20 },
  { id: '2019', nome: 'Ortofoto 2019, 20 cm (AGEA)', servizio: 'ortofoto_2019_20cm_sicilia/ImageServer', max: 20 },
  { id: '2013-comuni', nome: 'Ortofoto 2013, 15 cm (Enna, Messina, Palermo, Ragusa, Trapani)', servizio: 'ortofoto_2013_15cm_comuni/MapServer', max: 20 },
  { id: '2013', nome: 'Ortofoto 2013, 25 cm', servizio: 'ortofoto_2013_25cm_sicilia/MapServer', max: 19 },
  { id: '2008', nome: 'Ortofoto 2008, 25 cm', servizio: 'ortofoto_2008_25cm_sicilia/MapServer', max: 19 },
]; // i18n-ok: nomi dei servizi, come sono sul server

export const urlOrtofoto = o => `${SITR}/${o.servizio}/tile/{z}/{y}/{x}`;
