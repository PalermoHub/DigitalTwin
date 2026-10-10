import { pmt, urlTileset } from '../core/config.js';
import { piuVicino, presente, primo, righe, tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro, voceStrato } from '../core/legenda.js';
import { STILE_OMI } from './stile-omi.js';
import { vociOmi } from './scheda-omi.js';
import { t, tl } from '../core/i18n.js';
import { registraTooltipStrati } from '../core/tooltip.js';

// Come nell'app originale (catasto-app): la vestizione di PRG, PPE e vincoli è fatta di tile
// raster già pubblicati; i poligoni vettoriali restano trasparenti e servono solo ai dati
// (scheda del luogo). Zone OMI, particelle e civici sono invece vettoriali con il loro stile.

const ATTRIBUZIONE_PRG = tl('Comune di Palermo - Variante Generale al P.R.G. 2004 - Rielaborazione di OpenDataSicilia');
const NOTA_PRG = 'Il PRG vigente è la Variante generale 2004: varianti successive potrebbero non essere incluse.';
const vuoto = { 'fill-opacity': 0 };

// Legenda delle zone OMI in #legende: la fascia è la lettera del codice zona (B1, C3, D8…) e ogni zona ha una tonalità
// propria in STILE_OMI; qui il colore è quello rappresentativo della fascia. Compare solo a strato acceso.
const FASCE_OMI = [['B', 'Centrale', '#b3243b'], ['C', 'Semicentrale', '#f2f23d'], ['D', 'Periferica', '#0029f2'], ['E', 'Suburbana', '#a89ab8'], ['R', 'Rurale', '#00ff00']];
let legendaOmi = null;
// i codici zona di ogni fascia, ricavati da STILE_OMI (coppie codice, colore dopo ['match', ['get', …])
const CODICI_OMI = STILE_OMI.slice(2, -1).filter((_, i) => i % 2 === 0);
function creaLegendaOmi(_gruppo, map) {
  legendaOmi = document.createElement('div');
  legendaOmi.className = 'legenda legenda-omi';
  legendaOmi.hidden = true;
  const titolo = document.createElement('strong');
  titolo.textContent = tl('Zone OMI 2025 (fascia)');
  legendaOmi.append(titolo);
  const accese = new Set(FASCE_OMI.map(([lettera]) => lettera));
  for (const [lettera, nome, colore] of FASCE_OMI) {
    const campione = document.createElement('i');
    campione.style.background = colore;
    legendaOmi.append(voceFiltro(campione, `${lettera} · ${tl(nome)}`, acceso => {
      acceso ? accese.add(lettera) : accese.delete(lettera);
      const codici = new Set(CODICI_OMI.filter(c => accese.has(c[0])));
      const filtro = filtroInsieme(['get', 'Zona_OMI'], codici, CODICI_OMI.length);
      for (const id of ['omi', 'omi-line', 'omi-hit']) map.setFilter(id, filtro);
    }));
  }
  const nota = document.createElement('div');
  nota.className = 'nota-omi';
  nota.textContent = tl('Ogni zona ha una tonalità propria nella fascia.');
  legendaOmi.append(nota);
  document.getElementById('legende').append(legendaOmi);
}
// Legenda del catasto in #legende, a strato acceso: la particella è lo strato stesso, le etichette e la particella cercata
// si accendono e si spengono a parte.
let legendaCatasto = null;
function creaLegendaCatasto(_gruppo, map) {
  legendaCatasto = document.createElement('div');
  legendaCatasto.className = 'legenda legenda-catasto';
  legendaCatasto.hidden = true;
  const titolo = document.createElement('strong');
  titolo.textContent = tl('Catasto');
  const simbolo = (classe, testo) => {
    const i = document.createElement('i');
    i.className = classe;
    if (testo) i.textContent = testo;
    return i;
  };
  const suStrato = id => acceso => map.setLayoutProperty(id, 'visibility', acceso ? 'visible' : 'none');
  legendaCatasto.append(
    titolo,
    voceStrato(simbolo('catasto-particella'), 'Particella (da zoom 12)', 'catasto'),
    voceFiltro(simbolo('catasto-etichetta', 'Aa'), 'Foglio e particella (da zoom 15)', suStrato('catasto-etichette'), true, false),
    voceFiltro(simbolo('catasto-cercata'), 'Particella cercata', suStrato('catasto-evidenza'), true, false),
  );
  document.getElementById('legende').append(legendaCatasto);
}
const nascosto = { visibility: 'none' };

// id dei tileset nel catalogo (stesso id del layer), dal più basso al più alto
const RASTER = ['prg-zto', 'prg-ppe', 'prg-vl', 'prg-va'];

export default {
  id: 'territorio',
  titolo: 'Layer',
  argomento: { titolo: 'Territorio, catasto e urbanistica', descrizione: 'Particelle catastali, zonizzazione e vincoli del PRG 2004, zone OMI, immobili comunali e numeri civici.' },
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
    map.addLayer({ id: 'catasto', type: 'fill', source: 'catasto', 'source-layer': 'particelle', minzoom: 12,
      layout: nascosto, paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.6, 'fill-outline-color': '#000' } });
    // etichette "F. foglio - P. particella" come nell'app originale (più rade da mobile)
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    map.addLayer({
      id: 'catasto-etichette', type: 'symbol', source: 'catasto', 'source-layer': 'particelle',
      minzoom: mobile ? 16 : 15,
      layout: {
        visibility: 'none',
        'text-field': ['concat', 'F. ', ['get', 'Foglio'], ' - ', 'P. ', ['get', 'Paricella']],
        'text-size': ['interpolate', ['linear'], ['zoom'], 15, mobile ? 4 : 5, 19, mobile ? 10 : 12],
        'text-font': ['Noto Sans Regular'],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-anchor': 'center',
        'text-offset': [0, 0.5],
      },
      paint: { 'text-color': '#000000', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
    });
    // particella trovata dalla ricerca per foglio e particella (filtro impostato da ricerca.js)
    map.addLayer({ id: 'catasto-evidenza', type: 'line', source: 'catasto', 'source-layer': 'particelle',
      filter: ['==', ['get', 'Paricella'], ''], paint: { 'line-color': '#e6007e', 'line-width': 3 } });
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
    registraTooltipStrati(map, [{ layers: ['immobili'], modello: p => ({ titolo: tl('Immobile comunale'), sottotitolo: p.INDIRIZZO || p.TIPO || '' }) }]);
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
  sezioniFisse: true, // «Immobili comunali» (con lo strato MEF di mef-immobili.js) resta una sezione a sé: il riordino non attraversa le intestazioni
  strati: [
    { id: 'catasto', etichetta: 'Catasto: particelle (da zoom 12)', layers: ['catasto', 'catasto-etichette'], attivo: false,
      suCambio(attivo) { if (legendaCatasto) legendaCatasto.hidden = !attivo; } },
    { id: 'prg', etichetta: 'PRG 2004: zonizzazione e PPE', layers: ['prg-zto', 'prg-ppe'], attivo: false },
    { id: 'vincoli', etichetta: 'PRG 2004: vincoli', layers: ['prg-va', 'prg-vl'], attivo: false },
    { id: 'omi', etichetta: 'Zone OMI 2025', layers: ['omi', 'omi-line'], attivo: false,
      suCambio(attivo) { if (legendaOmi) legendaOmi.hidden = !attivo; } },
    { id: 'civici', etichetta: 'Numeri civici (da zoom 14)', layers: ['civici'], attivo: false },
    // ultimo del modulo: il sottogruppo prosegue con lo strato «Immobili dichiarati al MEF» (js/layers/mef-immobili.js, che segue in MODULI)
    { id: 'immobili', etichetta: 'Immobili comunali', sezione: 'Immobili comunali', nota: 'I layer sono il risultato di una georeferenziazione automatica e hanno carattere puramente dimostrativo', layers: ['immobili'], attivo: false },
  ],
  pannello(gruppo, map) { creaLegendaCatasto(gruppo, map); creaLegendaOmi(gruppo, map); },
  scheda: {
    layers: ['catasto-hit', 'prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit', 'prg-va-hit', 'prg-vl-hit',
             'omi-hit', 'immobili-hit', 'civici-hit'],
    voci(trovati, lngLat) {
      const voci = [];

      const civico = piuVicino(trovati, 'civici-hit', lngLat);
      if (civico) {
        const p = civico.properties;
        const numero = presente(p.Esponente) ? `${p.Civico}/${p.Esponente}` : p.Civico;
        voci.push({ chiave: 'indirizzo', peso: 10, strato: 'civici', titolo: 'Indirizzo', icona: 'indirizzo', gruppi: [{ righe: righe([['Via', p.Odonimo], ['Civico', numero]]) }] });
      }

      const particella = primo(trovati, 'catasto-hit');
      if (particella) {
        const p = particella.properties;
        voci.push({
          chiave: 'particella', peso: 20, strato: 'catasto', titolo: 'Particella catastale', icona: 'particella',
          gruppi: [{ righe: righe([['Foglio', p.Foglio], ['Particella', p.Paricella]]) }],
          legale: true,
          link: [{
            testo: 'Visura su SISTER', icona: 'esterno', url: 'https://sister3.agenziaentrate.gov.it/', etichetta: `Fg.${p.Foglio} · P.${p.Paricella}`,
            suggerimento: t('territorio.sister', { foglio: p.Foglio, particella: p.Paricella }),
          }, { testo: 'Catasto, PRG e vincoli su mappa', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/prg_part_catastali.html' }],
        });
      }

      // Zonizzazione: una sola sezione (zona, ambito, strumento) invece di tre carte separate
      const zto = primo(trovati, 'prg-zto-hit'), ns = primo(trovati, 'prg-ns-hit'), cs = primo(trovati, 'prg-cs-hit');
      if (zto || ns || cs) {
        const zona = (zto ?? ns)?.properties;
        const gruppo = zona ? righe([['Zona', zona.ZTO], ['Descrizione', zona.DESCRIZION]]) : [];
        if (ns) gruppo.push({ etichetta: 'Ambito', valore: 'Netto storico' });
        if (cs) gruppo.push({ etichetta: 'Ambito', valore: 'Centro storico' }, { etichetta: 'Strumento', valore: 'PPE' });
        voci.push({ chiave: 'zonizzazione', peso: 40, strato: 'prg', titolo: 'Zonizzazione (PRG 2004)', icona: 'mappa', gruppi: [{ righe: gruppo }],
          legale: true, nota: NOTA_PRG, link: { testo: 'Catasto, PRG e vincoli su mappa', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/prg_part_catastali.html' } });
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
          chiave: 'vincoli', peso: 50, strato: 'vincoli', titolo: 'Vincoli', icona: 'vincolo', legale: true, link: { testo: 'Catasto, PRG e vincoli su mappa', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/prg_part_catastali.html' },
          gruppi: gruppi.map((g, i) => ({ titolo: gruppi.length > 1 ? `${g.nome} ${i + 1}` : g.nome, righe: g.righe })),
        });
      }

      const immobile = primo(trovati, 'immobili-hit');
      if (immobile) {
        const p = immobile.properties;
        voci.push({ chiave: 'immobile', peso: 55, strato: 'immobili', titolo: 'Immobile comunale', icona: 'monumento',
          gruppi: [{ righe: righe([['Tipo', p.TIPO], ['Categoria', p.CATEGORIA], ['Indirizzo', p.INDIRIZZO]]) }] });
      }

      voci.push(...vociOmi(tutti(trovati, 'omi-hit').map(f => f.properties)));
      return voci;
    },
  },
};
