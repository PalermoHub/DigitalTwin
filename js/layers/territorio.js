import { pmt, RASTER_PRG } from '../core/config.js';
import { STILE_OMI } from './stile-omi.js';

// Come nell'app originale (catasto-app): la vestizione di PRG, PPE e vincoli è fatta di tile
// raster già pubblicati; i poligoni vettoriali restano trasparenti e servono solo ai dati
// (scheda del luogo). Zone OMI, particelle e civici sono invece vettoriali con il loro stile.

const ATTRIBUZIONE_PRG = 'Comune di Palermo - Variante Generale al P.R.G. 2004 - Rielaborazione di OpenDataSicilia';
const vuoto = { 'fill-opacity': 0 };
const nascosto = { visibility: 'none' };
const val = v => (v == null || v === '' ? '—' : String(v));

// [id, cartella dei tile]
const RASTER = [['prg-zto', 'ZTO'], ['prg-ppe', 'ppe'], ['prg-vl', 'VL'], ['prg-va', 'VA']];

export default {
  id: 'territorio',
  titolo: 'Regole del suolo',
  aggiungiSorgenti(map) {
    map.addSource('catasto', { type: 'vector', url: pmt('catasto/particelle.pmtiles') });
    map.addSource('prg', { type: 'vector', url: pmt('prg-vincoli/prg.pmtiles') });
    map.addSource('omi', { type: 'vector', url: pmt('civici-omi/Zone_OMI_2025_II.pmtiles') });
    map.addSource('immobili', { type: 'vector', url: pmt('civici-omi/immobili_comunali_2024.pmtiles') });
    map.addSource('civici', { type: 'vector', url: pmt('civici-omi/civici_0226.pmtiles') });
    for (const [id, cartella] of RASTER) {
      map.addSource(`${id}-r`, {
        type: 'raster', tiles: [`${RASTER_PRG}${cartella}/{z}/{x}/{y}.png`], tileSize: 256,
        minzoom: 12, maxzoom: 19, attribution: ATTRIBUZIONE_PRG,
      });
    }
  },
  aggiungiLayer(map) {
    // vestizione raster (sotto ai vettoriali)
    for (const [id] of RASTER) {
      map.addLayer({ id, type: 'raster', source: `${id}-r`, layout: nascosto });
    }
    // vettoriali con stile proprio
    map.addLayer({ id: 'omi', type: 'fill', source: 'omi', 'source-layer': 'Zone_OMI_2025_II',
      layout: nascosto, paint: { 'fill-color': STILE_OMI, 'fill-opacity': 0.15 } });
    map.addLayer({ id: 'omi-line', type: 'line', source: 'omi', 'source-layer': 'Zone_OMI_2025_II',
      layout: nascosto, paint: { 'line-color': '#232323', 'line-width': 0.5 } });
    // Nessuno stile originale per gli immobili comunali: aspetto provvisorio (vedi docs/STILI.md)
    map.addLayer({ id: 'immobili', type: 'fill', source: 'immobili', 'source-layer': 'immobili_comunali_2024',
      layout: nascosto, paint: { 'fill-color': '#6a3d9a', 'fill-opacity': 0.5 } });
    map.addLayer({ id: 'catasto', type: 'fill', source: 'catasto', 'source-layer': 'particelle', minzoom: 15,
      layout: nascosto, paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.6, 'fill-outline-color': '#000' } });
    // poligoni dei dati: sempre presenti e trasparenti, servono alla scheda del luogo
    map.addLayer({ id: 'catasto-hit', type: 'fill', source: 'catasto', 'source-layer': 'particelle', minzoom: 15, paint: vuoto });
    map.addLayer({ id: 'prg-zto-hit', type: 'fill', source: 'prg', 'source-layer': 'zto', paint: vuoto });
    map.addLayer({ id: 'prg-ns-hit', type: 'fill', source: 'prg', 'source-layer': 'ns', paint: vuoto });
    map.addLayer({ id: 'prg-cs-hit', type: 'fill', source: 'prg', 'source-layer': 'cs', paint: vuoto });
    map.addLayer({ id: 'prg-va-hit', type: 'fill', source: 'prg', 'source-layer': 'va', paint: vuoto });
    map.addLayer({ id: 'omi-hit', type: 'fill', source: 'omi', 'source-layer': 'Zone_OMI_2025_II', paint: vuoto });
    map.addLayer({ id: 'immobili-hit', type: 'fill', source: 'immobili', 'source-layer': 'immobili_comunali_2024', paint: vuoto });
    // numeri civici: testo come nell'app originale (font forniti dallo stile della base)
    map.addLayer({
      id: 'civici', type: 'symbol', source: 'civici', 'source-layer': 'civici_wgs84', minzoom: 14,
      layout: {
        visibility: 'none',
        'text-field': ['case',
          ['all', ['has', 'Esponente'], ['!=', ['get', 'Esponente'], null],
            ['!=', ['get', 'Esponente'], 'NULL'], ['!=', ['get', 'Esponente'], '']],
          ['concat', ['get', 'Civico'], '/', ['get', 'Esponente']],
          ['get', 'Civico']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 8, 16, 11, 18, 13, 20, 15],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-anchor': 'center',
      },
      paint: { 'text-color': '#c0392b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    });
  },
  strati: [
    { id: 'catasto', etichetta: 'Catasto: particelle (da zoom 15)', layers: ['catasto'], attivo: false },
    { id: 'prg', etichetta: 'PRG 2004: zonizzazione e PPE', layers: ['prg-zto', 'prg-ppe'], attivo: false },
    { id: 'vincoli', etichetta: 'PRG 2004: vincoli', layers: ['prg-va', 'prg-vl'], attivo: false },
    { id: 'omi', etichetta: 'Zone OMI 2025', layers: ['omi', 'omi-line'], attivo: false },
    { id: 'immobili', etichetta: 'Immobili comunali', layers: ['immobili'], attivo: false },
    { id: 'civici', etichetta: 'Numeri civici (da zoom 14)', layers: ['civici'], attivo: false },
  ],
  scheda: {
    layers: ['catasto-hit', 'prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit', 'prg-va-hit', 'omi-hit', 'immobili-hit'],
    voce(f) {
      const p = f.properties;
      switch (f.layer.id) {
        case 'catasto-hit':
          return { peso: 10, titolo: 'Particella catastale', righe: [['Foglio', val(p.Foglio)], ['Particella', val(p.Paricella)]] };
        case 'prg-zto-hit':
          return { peso: 40, titolo: 'Zona PRG 2004', righe: [['Zona', val(p.ZTO)], ['Descrizione', val(p.DESCRIZION)]] };
        case 'prg-ns-hit':
          return { peso: 41, titolo: 'Netto storico (PRG 2004)', righe: [['Zona', val(p.ZTO)], ['Descrizione', val(p.DESCRIZION)]] };
        case 'prg-cs-hit':
          return { peso: 45, titolo: 'Centro storico (PRG 2004)', righe: [
            ['Perimetro', 'il punto ricade nel perimetro del centro storico'],
            ['Zonizzazione di dettaglio', 'vedi lo strato «PRG 2004: zonizzazione e PPE»']] };
        case 'prg-va-hit':
          return { peso: 50, titolo: 'Vincolo (PRG 2004)', righe: [['Tipo', val(p.tipo)], ['Descrizione', val(p.descrizone)]] };
        case 'omi-hit':
          return { peso: 60, titolo: 'Zona OMI', righe: [['Zona', val(p.Zona_OMI ?? p.Zona)], ['Fascia', val(p.Fascia_Descr ?? p.Fascia)]] };
        default:
          return { peso: 70, titolo: 'Immobile comunale', righe: [['Tipo', val(p.TIPO)], ['Categoria', val(p.CATEGORIA)], ['Indirizzo', val(p.INDIRIZZO)]] };
      }
    },
  },
};
