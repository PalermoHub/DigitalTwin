import { pmt } from '../core/config.js';
import { registraTooltip } from '../core/tooltip.js';
import { CONFINI_LEVEL_KEYS, confiniStyle, sezioniColors } from '../core/palette.js';

export const SRC_SEZIONI = 'sezioni';

const RIGHE = [['upl', 'UPL', 'UPL'], ['quartieri', 'Quartiere', 'Quartiere'], ['circoscrizioni', 'Circoscrizione', 'Circoscrizione']];

// Tooltip con i livelli di confine attivi, come nell'app palermo_popolazione (sezione di quello condiviso, in fondo).
function collegaTooltip(map) {
  registraTooltip(map, e => {
    const props = map.queryRenderedFeatures(e.point, { layers: ['confini-upl-fill'] })[0]?.properties;
    const righe = [];
    for (const [livello, campo, nome] of RIGHE) {
      if (props?.[campo] && map.getLayoutProperty(`confini-${livello}`, 'visibility') === 'visible') {
        righe.push([nome, props[campo]]);
      }
    }
    if (!righe.length) return null;
    const html = document.createElement('div');
    html.className = 'confini-tooltip';
    righe.forEach(([nome, valore], i) => {
      if (i) html.append(document.createElement('br'));
      const b = document.createElement('strong');
      b.textContent = nome;
      html.append(b, valore);
    });
    return { contenuto: html };
  }, 10);
}

const ATTIVI = { circoscrizioni: true, quartieri: false, upl: false };

export default {
  id: 'confini',
  titolo: 'Confini',
  argomento: { titolo: 'Confini amministrativi', descrizione: 'Circoscrizioni, quartieri, UPL e sezioni di censimento.' },
  aggiungiSorgenti(map) {
    map.addSource('confini', { type: 'vector', url: pmt('popolazione/confini_amministrativi.pmtiles') });
    map.addSource(SRC_SEZIONI, {
      type: 'vector',
      url: pmt('popolazione/geo_sezioni_2021.pmtiles'),
      promoteId: { sezioni: 'SEZ21_ID' },
    });
  },
  aggiungiLayer(map) {
    // maschera dei filtri di zona: schiarisce tutto fuori dalla zona scelta (filtro impostato da core/zone.js)
    map.addLayer({
      id: 'filtro-maschera', type: 'fill', source: 'confini', 'source-layer': 'upl',
      layout: { visibility: 'none' }, paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.72 },
    });
    // stessi colori, spessori e tratti dell'app palermo_popolazione (tema chiaro);
    // l'ordine delle chiavi è l'ordine dei layer (l'ultimo sta sopra)
    for (const livello of CONFINI_LEVEL_KEYS) {
      const stile = confiniStyle(livello, false);
      const paint = { 'line-color': stile.color, 'line-width': stile.width };
      if (stile.dash) paint['line-dasharray'] = stile.dash;
      map.addLayer({
        id: `confini-${livello}`, type: 'line', source: 'confini', 'source-layer': livello,
        layout: { visibility: ATTIVI[livello] ? 'visible' : 'none' }, paint,
      });
    }
    // fill invisibile per il tooltip (come nell'app palermo_popolazione)
    map.addLayer({ id: 'confini-upl-fill', type: 'fill', source: 'confini', 'source-layer': 'upl', paint: { 'fill-opacity': 0 } });
    collegaTooltip(map);
    map.addLayer({
      id: 'confini-sezioni', type: 'line', source: SRC_SEZIONI, 'source-layer': 'sezioni', minzoom: 13,
      layout: { visibility: 'none' },
      paint: { 'line-color': sezioniColors(false).border, 'line-width': 0.5 },
    });
  },
  strati: [
    { id: 'circoscrizioni', etichetta: 'Circoscrizioni', layers: ['confini-circoscrizioni'], attivo: true },
    { id: 'quartieri', etichetta: 'Quartieri', layers: ['confini-quartieri'], attivo: false },
    { id: 'upl', etichetta: 'UPL (unità di primo livello)', layers: ['confini-upl'], attivo: false },
    { id: 'sezioni', etichetta: 'Sezioni di censimento (da zoom 13)', layers: ['confini-sezioni'], attivo: false },
  ],
};
