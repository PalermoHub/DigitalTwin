import { pmt } from '../core/config.js';

// Colore per lettera di zona territoriale omogenea (A… V)
const COLORI_ZTO = ['match', ['slice', ['get', 'ZTO'], 0, 1],
  'A', '#d95f02', 'B', '#e6ab02', 'C', '#f4a582', 'D', '#7570b3', 'E', '#8c6d31',
  'F', '#e7298a', 'I', '#666666', 'P', '#999999', 'S', '#1b9e77', 'V', '#33a02c',
  '#cccccc'];

const COLORI_OMI = ['match', ['get', 'Fascia'],
  'B', '#2c7bb6', 'C', '#abd9e9', 'D', '#ffffbf', 'E', '#fdae61', 'R', '#d7191c',
  '#cccccc'];

const vuoto = { 'fill-opacity': 0 };
const val = v => (v == null || v === '' ? '—' : String(v));

export default {
  id: 'territorio',
  titolo: 'Regole del suolo',
  aggiungiSorgenti(map) {
    map.addSource('catasto', { type: 'vector', url: pmt('catasto/particelle.pmtiles') });
    map.addSource('prg', { type: 'vector', url: pmt('prg-vincoli/prg.pmtiles') });
    map.addSource('omi', { type: 'vector', url: pmt('civici-omi/Zone_OMI_2025_II.pmtiles') });
    map.addSource('immobili', { type: 'vector', url: pmt('civici-omi/immobili_comunali_2024.pmtiles') });
    map.addSource('civici', { type: 'vector', url: pmt('civici-omi/civici_0226.pmtiles') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    // visibili su richiesta
    map.addLayer({ id: 'omi', type: 'fill', source: 'omi', 'source-layer': 'Zone_OMI_2025_II',
      layout: nascosto, paint: { 'fill-color': COLORI_OMI, 'fill-opacity': 0.45 } });
    map.addLayer({ id: 'prg-zto', type: 'fill', source: 'prg', 'source-layer': 'zto',
      layout: nascosto, paint: { 'fill-color': COLORI_ZTO, 'fill-opacity': 0.5 } });
    map.addLayer({ id: 'prg-va', type: 'fill', source: 'prg', 'source-layer': 'va',
      layout: nascosto, paint: { 'fill-color': '#b2182b', 'fill-opacity': 0.35 } });
    map.addLayer({ id: 'prg-vl', type: 'line', source: 'prg', 'source-layer': 'vl',
      layout: nascosto, paint: { 'line-color': '#b2182b', 'line-width': 1.5 } });
    map.addLayer({ id: 'immobili', type: 'fill', source: 'immobili', 'source-layer': 'immobili_comunali_2024',
      layout: nascosto, paint: { 'fill-color': '#6a3d9a', 'fill-opacity': 0.5 } });
    map.addLayer({ id: 'catasto', type: 'line', source: 'catasto', 'source-layer': 'particelle', minzoom: 15,
      layout: nascosto, paint: { 'line-color': '#444', 'line-width': 0.6 } });
    map.addLayer({ id: 'civici', type: 'circle', source: 'civici', 'source-layer': 'civici_wgs84', minzoom: 17,
      layout: nascosto, paint: { 'circle-radius': 3, 'circle-color': '#c2185b' } });
    // sempre presenti e invisibili: servono alla scheda del luogo
    map.addLayer({ id: 'catasto-hit', type: 'fill', source: 'catasto', 'source-layer': 'particelle', minzoom: 15, paint: vuoto });
    map.addLayer({ id: 'prg-zto-hit', type: 'fill', source: 'prg', 'source-layer': 'zto', paint: vuoto });
    map.addLayer({ id: 'prg-va-hit', type: 'fill', source: 'prg', 'source-layer': 'va', paint: vuoto });
    map.addLayer({ id: 'omi-hit', type: 'fill', source: 'omi', 'source-layer': 'Zone_OMI_2025_II', paint: vuoto });
    map.addLayer({ id: 'immobili-hit', type: 'fill', source: 'immobili', 'source-layer': 'immobili_comunali_2024', paint: vuoto });
  },
  strati: [
    { id: 'catasto', etichetta: 'Catasto: particelle (da zoom 15)', layers: ['catasto'], attivo: false },
    { id: 'prg', etichetta: 'PRG 2004: zonizzazione', layers: ['prg-zto'], attivo: false },
    { id: 'vincoli', etichetta: 'PRG 2004: vincoli', layers: ['prg-va', 'prg-vl'], attivo: false },
    { id: 'omi', etichetta: 'Zone OMI 2025', layers: ['omi'], attivo: false },
    { id: 'immobili', etichetta: 'Immobili comunali', layers: ['immobili'], attivo: false },
    { id: 'civici', etichetta: 'Numeri civici (da zoom 17)', layers: ['civici'], attivo: false },
  ],
  scheda: {
    layers: ['catasto-hit', 'prg-zto-hit', 'prg-va-hit', 'omi-hit', 'immobili-hit'],
    voce(f) {
      const p = f.properties;
      switch (f.layer.id) {
        case 'catasto-hit':
          return { peso: 10, titolo: 'Particella catastale', righe: [['Foglio', val(p.Foglio)], ['Particella', val(p.Paricella)]] };
        case 'prg-zto-hit':
          return { peso: 40, titolo: 'Zona PRG 2004', righe: [['Zona', val(p.ZTO)], ['Descrizione', val(p.DESCRIZION)]] };
        case 'prg-va-hit':
          return { peso: 50, titolo: 'Vincolo (PRG 2004)', righe: [['Tipo', val(p.tipo)], ['Descrizione', val(p.descrizone)]] };
        case 'omi-hit':
          return { peso: 60, titolo: 'Zona OMI', righe: [['Zona', val(p.Zona)], ['Fascia', val(p.Fascia_Descr ?? p.Fascia)]] };
        default:
          return { peso: 70, titolo: 'Immobile comunale', righe: [['Tipo', val(p.TIPO)], ['Categoria', val(p.CATEGORIA)], ['Indirizzo', val(p.INDIRIZZO)]] };
      }
    },
  },
};
