import { GRAVITA } from './scheda-sicurezza.js';

// Filtro «Incidenti» del pannello Filtri: anno, gravità e via (quest'ultima scelta dalla ricerca), in AND. La logica dei filtri
// MapLibre è pura (testabile); `collegaFiltroIncidenti` la lega ai menu e ai chip, come il filtro Linea del trasporto.
export const ANNI = [2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023]; // il 2019 non è nel dataset pulito
export const ZOOM_BASE = 14;
export const ZOOM_FILTRATO = 12; // con un filtro attivo la città non deve sembrare vuota: i tile degli incidenti partono da zoom 12

const pieno = v => v != null && v !== '';

// `tipologie` (elenco di gravità accese) viene dalla legenda sulla mappa; null/assente = tutte
export function filtroIncidenti({ anno, gravita, via, tipologie }) {
  const condizioni = [];
  if (pieno(anno)) condizioni.push(['==', ['get', 'anno'], Number(anno)]);
  if (pieno(gravita)) condizioni.push(['==', ['get', 'Tipologia'], gravita]);
  if (pieno(via)) condizioni.push(['==', ['get', 'via'], via]);
  if (Array.isArray(tipologie)) condizioni.push(['in', ['get', 'Tipologia'], ['literal', tipologie]]);
  if (!condizioni.length) return null;
  return condizioni.length === 1 ? condizioni[0] : ['all', ...condizioni];
}

export const zoomMinimo = filtro => (filtro ? ZOOM_FILTRATO : ZOOM_BASE);

const NOME_GRAVITA_CHIP = { M: 'mortali', R: 'con prognosi riservata', F: 'con feriti', C: 'solo danni a cose' };

export function etichetteChip({ anno, gravita, via }) {
  return [
    pieno(anno) && { chiave: 'anno', testo: `Incidenti ${anno}` },
    pieno(gravita) && { chiave: 'gravita', testo: `Incidenti ${NOME_GRAVITA_CHIP[gravita] ?? gravita}` },
    pieno(via) && { chiave: 'via', testo: `Incidenti: ${via}` },
  ].filter(Boolean);
}

// `layers`: gli strati dei punti (visibile e «hit»); `strato`: id dello strato da accendere quando un filtro si attiva.
export function collegaFiltroIncidenti(map, { annoSelect, gravitaSelect, chips, layers, strato }) {
  annoSelect.replaceChildren(new Option('Tutti gli anni', ''), ...ANNI.map(a => new Option(String(a), String(a))));
  gravitaSelect.replaceChildren(new Option('Tutte', ''), ...Object.entries(GRAVITA).map(([k, g]) => new Option(g.nome, k)));
  const stato = { anno: '', gravita: '', via: '', tipologie: null };

  function chip({ chiave, testo }) {
    const c = document.createElement('span');
    c.className = 'chip-zona';
    c.append(`${testo} `);
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = '✕';
    x.setAttribute('aria-label', `Rimuovi filtro: ${testo}`);
    x.addEventListener('click', () => imposta({ [chiave]: '' }));
    c.append(x);
    return c;
  }

  function imposta(parziale) {
    Object.assign(stato, parziale);
    const filtro = filtroIncidenti(stato);
    const filtroPannello = filtroIncidenti({ ...stato, tipologie: null }); // la legenda non cambia lo zoom minimo né accende lo strato
    for (const id of layers) {
      if (!map.getLayer(id)) continue;
      map.setFilter(id, filtro);
      map.setLayerZoomRange(id, zoomMinimo(filtroPannello), 24);
    }
    annoSelect.value = stato.anno ? String(stato.anno) : '';
    gravitaSelect.value = stato.gravita ?? '';
    const etichette = etichetteChip(stato);
    chips.hidden = !etichette.length;
    chips.replaceChildren(...etichette.map(chip));
    if (filtroPannello) { // lo strato spento si accende, come per la ricerca
      const casella = document.getElementById(`strato-${strato}`);
      if (casella && !casella.checked && !casella.disabled) { casella.checked = true; casella.dispatchEvent(new Event('change')); }
    }
  }

  annoSelect.addEventListener('change', () => imposta({ anno: annoSelect.value }));
  gravitaSelect.addEventListener('change', () => imposta({ gravita: gravitaSelect.value }));
  return { imposta };
}
