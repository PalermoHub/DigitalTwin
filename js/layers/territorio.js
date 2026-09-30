import { pmt, urlTileset } from '../core/config.js';
import { piuVicino, presente, primo, righe, tutti } from '../core/scheda-util.js';
import { STILE_OMI } from './stile-omi.js';
import { vociOmi } from './scheda-omi.js';

// Come nell'app originale (catasto-app): la vestizione di PRG, PPE e vincoli è fatta di tile
// raster già pubblicati; i poligoni vettoriali restano trasparenti e servono solo ai dati
// (scheda del luogo). Zone OMI, particelle e civici sono invece vettoriali con il loro stile.

const ATTRIBUZIONE_PRG = 'Comune di Palermo - Variante Generale al P.R.G. 2004 - Rielaborazione di OpenDataSicilia';
const vuoto = { 'fill-opacity': 0 };
const nascosto = { visibility: 'none' };

// id dei tileset nel catalogo (stesso id del layer), dal più basso al più alto
const RASTER = ['prg-zto', 'prg-ppe', 'prg-vl', 'prg-va'];

export default {
  id: 'territorio',
  titolo: 'Regole del suolo',
  aggiungiSorgenti(map) {
    map.addSource('catasto', { type: 'vector', url: pmt('catasto/particelle.pmtiles') });
    map.addSource('prg', { type: 'vector', url: pmt('prg-vincoli/prg.pmtiles') });
    map.addSource('omi', { type: 'vector', url: pmt('civici-omi/Zone_OMI_2025_II.pmtiles') });
    map.addSource('immobili', { type: 'vector', url: pmt('civici-omi/immobili_comunali_2024.pmtiles') });
    map.addSource('civici', { type: 'vector', url: pmt('civici-omi/civici_0226.pmtiles') });
    for (const id of RASTER) {
      const url = urlTileset(id);
      if (!url) continue; // senza catalogo non si conosce il link: lo strato manca, il resto funziona
      map.addSource(`${id}-r`, {
        type: 'raster', tiles: [url], tileSize: 256, minzoom: 12, maxzoom: 19, attribution: ATTRIBUZIONE_PRG,
      });
    }
  },
  aggiungiLayer(map) {
    // vestizione raster (sotto ai vettoriali)
    for (const id of RASTER) {
      if (map.getSource(`${id}-r`)) map.addLayer({ id, type: 'raster', source: `${id}-r`, layout: nascosto });
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
    map.addLayer({ id: 'prg-vl-hit', type: 'line', source: 'prg', 'source-layer': 'vl', paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({
      id: 'civici-hit', type: 'circle', source: 'civici', 'source-layer': 'civici_wgs84', minzoom: 16,
      paint: { 'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 16, 12, 19, 96], 'circle-opacity': 0 },
    });
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
    layers: ['catasto-hit', 'prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit', 'prg-va-hit', 'prg-vl-hit',
             'omi-hit', 'immobili-hit', 'civici-hit'],
    voci(trovati, lngLat) {
      const voci = [];

      const civico = piuVicino(trovati, 'civici-hit', lngLat);
      if (civico) {
        const p = civico.properties;
        const numero = presente(p.Esponente) ? `${p.Civico}/${p.Esponente}` : p.Civico;
        voci.push({ chiave: 'indirizzo', peso: 10, titolo: 'Indirizzo', icona: 'fa-map-marker-alt', gruppi: [{ righe: righe([['Via', p.Odonimo], ['Civico', numero]]) }] });
      }

      const particella = primo(trovati, 'catasto-hit');
      if (particella) {
        const p = particella.properties;
        voci.push({
          chiave: 'particella', peso: 20, titolo: 'Particella catastale', icona: 'fa-table-cells',
          gruppi: [{ righe: righe([['Foglio', p.Foglio], ['Particella', p.Paricella]]) }],
          link: {
            testo: 'Visura su SISTER', icona: 'fa-external-link-alt', url: 'https://sister3.agenziaentrate.gov.it/', etichetta: `Fg.${p.Foglio} · P.${p.Paricella}`,
            suggerimento: `Accedi a SISTER con SPID — inserisci Foglio ${p.Foglio} e Particella ${p.Paricella}`,
          },
        });
      }

      // Zonizzazione: una sola sezione (zona, ambito, strumento) invece di tre carte separate
      const zto = primo(trovati, 'prg-zto-hit'), ns = primo(trovati, 'prg-ns-hit'), cs = primo(trovati, 'prg-cs-hit');
      if (zto || ns || cs) {
        const zona = (zto ?? ns)?.properties;
        const gruppo = zona ? righe([['Zona', zona.ZTO], ['Descrizione', zona.DESCRIZION]]) : [];
        if (ns) gruppo.push({ etichetta: 'Ambito', valore: 'Netto storico' });
        if (cs) gruppo.push({ etichetta: 'Ambito', valore: 'Centro storico' }, { etichetta: 'Strumento', valore: 'PPE' });
        voci.push({ chiave: 'zonizzazione', peso: 40, titolo: 'Zonizzazione (PRG 2004)', icona: 'fa-map', gruppi: [{ righe: gruppo }] });
      }

      // Vincoli: un gruppo per vincolo (areali e lineari)
      const vincoli = [
        ...tutti(trovati, 'prg-va-hit').map(f => ['Vincolo areale', righe([['Tipo', f.properties.tipo], ['Descrizione', f.properties.descrizone], ['Note', f.properties.note]])]),
        ...tutti(trovati, 'prg-vl-hit').map(f => ['Vincolo lineare', righe([['Tipo', f.properties.TIPO], ['Descrizione', f.properties.DESCRIZION], ['Note', f.properties.NOTE]])]),
      ];
      const visti = new Set();
      const gruppi = [];
      for (const [nome, rr] of vincoli) {
        const chiave = nome + JSON.stringify(rr);
        if (visti.has(chiave)) continue; // la stessa feature può arrivare da più tile
        visti.add(chiave);
        gruppi.push({ nome, righe: rr });
      }
      if (gruppi.length) {
        voci.push({
          chiave: 'vincoli', peso: 50, titolo: 'Vincoli', icona: 'fa-shield-alt',
          gruppi: gruppi.map((g, i) => ({ titolo: gruppi.length > 1 ? `${g.nome} ${i + 1}` : g.nome, righe: g.righe })),
        });
      }

      const immobile = primo(trovati, 'immobili-hit');
      if (immobile) {
        const p = immobile.properties;
        voci.push({ chiave: 'immobile', peso: 55, titolo: 'Immobile comunale', icona: 'fa-landmark',
          gruppi: [{ righe: righe([['Tipo', p.TIPO], ['Categoria', p.CATEGORIA], ['Indirizzo', p.INDIRIZZO]]) }] });
      }

      voci.push(...vociOmi(tutti(trovati, 'omi-hit').map(f => f.properties)));
      return voci;
    },
  },
};
