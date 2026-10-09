// js/aggiungi/beniculturali.js
// Beni culturali della Regione Siciliana (SITR): quattro MapServer con un solo layer vettoriale ciascuno, pronti da accendere dal ramo
// «ArcGIS REST» come immagini (export). Modulo puro, senza DOM né rete.
import { urlExport } from './arcgis.js';
const SITR = 'https://map.sitr.regione.sicilia.it/gis/rest/services/beni_culturali';
export const ATTRIBUZIONE_BENI = '© Regione Siciliana, SITR';

export const BENI_CULTURALI = [
  { id: 'beni_isolati', nome: 'Beni isolati', layer: 0 },
  { id: 'beni_paesaggistici', nome: 'Beni paesaggistici (D.Lgs. 42/04)', layer: 0 },
  { id: 'parchi_archeologici', nome: 'Parchi archeologici (2016)', layer: 1 },
  { id: 'siti_archeologici', nome: 'Siti archeologici', layer: 0 },
]; // i18n-ok: nomi dei servizi, come sono sul server

export const baseBeneCulturale = b => `${SITR}/${b.id}/MapServer`;
export const urlBeneCulturale = b => urlExport(baseBeneCulturale(b), b.layer);
