import { ordineLinea } from './trasporto-orari.js';

// Filtro «Linea» del pannello Filtri: restringe tracciati e fermate a una sola linea. La logica dei filtri MapLibre è pura
// (testabile); `collegaFiltroLinea` la lega al menu e al chip. I filtri di base sono quelli messi da trasporto.js.
const BASE = {
  'trasporto-bus': ['==', ['get', 'tipo'], 'bus'],
  'trasporto-tram': ['==', ['get', 'tipo'], 'tram'],
  'trasporto-fermate': null,
  'trasporto-hit-linee': null,
  'trasporto-hit-fermate': null,
};

// Una voce per linea (le due direzioni unite): bus prima dei tram, numeri in ordine numerico.
export function opzioniLinee(linee) {
  const perRotta = new Map();
  for (const x of linee) if (!perRotta.has(x.route_id)) perRotta.set(x.route_id, { route_id: x.route_id, numero: x.numero, nome: x.nome, tipo: x.tipo });
  return [...perRotta.values()].sort((a, b) => (a.tipo === 'tram') - (b.tipo === 'tram') || ordineLinea(a.numero, b.numero));
}

// Filtri per layer: con `linea` solo quella linea e le fermate dove passa; senza, i filtri di base.
export function filtriPerLinea(linea) {
  if (!linea) return { ...BASE };
  const rotta = ['==', ['get', 'route_id'], linea.route_id];
  const fermate = ['in', linea.numero, ['get', 'linee']];
  return {
    'trasporto-bus': ['all', BASE['trasporto-bus'], rotta],
    'trasporto-tram': ['all', BASE['trasporto-tram'], rotta],
    'trasporto-fermate': fermate,
    'trasporto-hit-linee': rotta,
    'trasporto-hit-fermate': fermate,
  };
}

export const stratiDaAccendere = linea => [linea.tipo === 'tram' ? 'trasporto-tram' : 'trasporto-bus', 'trasporto-fermate'];

// `limiti(route_id)` dà [[o, s], [e, n]] del tracciato. Il chip sta in un contenitore proprio: quello delle zone si riscrive a ogni scelta.
export function collegaFiltroLinea(map, { select, chips, linee, limiti }) {
  const opzioni = opzioniLinee(linee);
  const gruppo = tipo => {
    const g = document.createElement('optgroup');
    g.label = tipo === 'tram' ? 'Tram' : 'Bus';
    for (const o of opzioni.filter(x => x.tipo === tipo)) g.append(new Option(`${o.numero} — ${o.nome}`, o.route_id));
    return g;
  };
  select.replaceChildren(new Option('— Tutte —', ''), gruppo('bus'), gruppo('tram'));

  function scegli(routeId, zoom = true) {
    const linea = opzioni.find(o => o.route_id === routeId) ?? null;
    select.value = linea ? routeId : '';
    for (const [id, filtro] of Object.entries(filtriPerLinea(linea))) if (map.getLayer(id)) map.setFilter(id, filtro);
    if (linea) {
      for (const id of stratiDaAccendere(linea)) { // gli strati spenti si accendono, come dalla ricerca
        const casella = document.getElementById(`strato-${id}`);
        if (casella && !casella.checked && !casella.disabled) { casella.checked = true; casella.dispatchEvent(new Event('change')); }
      }
      if (zoom && limiti(routeId)) map.fitBounds(limiti(routeId), { padding: 60, maxZoom: 16 });
    }
    chips.hidden = !linea;
    chips.replaceChildren(...(linea ? [chip(linea)] : []));
  }

  function chip(linea) {
    const c = document.createElement('span');
    c.className = 'chip-zona';
    c.append(`Linea ${linea.numero}: ${linea.nome} `);
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Rimuovi filtro Linea');
    x.addEventListener('click', () => scegli('', false));
    c.append(x);
    return c;
  }

  select.addEventListener('change', () => scegli(select.value));
  return { scegli };
}
