// js/rndt/tooltip.js
// Le estensioni dei dati del catalogo RNDT (il plugin le disegna come riquadri) finiscono nel tooltip unico della mappa,
// una sezione sotto le altre, dalla più piccola alla più grande. Il tooltip proprio del plugin è spento (vedi vendor).
import { registraTooltip } from '../core/tooltip.js';

const MAX_VOCI = 5;
const LAYER_ESTENSIONI = /-footprints-fill$/;

// Estremi (ovest, sud, est, nord) delle coordinate di una geometria
function area(geometria) {
  let o = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const visita = c => {
    if (typeof c[0] === 'number') { o = Math.min(o, c[0]); e = Math.max(e, c[0]); s = Math.min(s, c[1]); n = Math.max(n, c[1]); }
    else c.forEach(visita);
  };
  if (geometria?.coordinates) visita(geometria.coordinates);
  return Number.isFinite(o) ? (e - o) * (n - s) : Infinity;
}

// Estensioni sotto il cursore, senza doppioni e dalla più piccola: [{ id, titolo }]
export function estensioniDa(features) {
  const viste = new Map();
  for (const f of features ?? []) {
    const id = f.properties?.id;
    if (typeof id !== 'string' || viste.has(id)) continue;
    viste.set(id, { id, titolo: String(f.properties?.title ?? id), area: area(f.geometry) });
  }
  return [...viste.values()].sort((a, b) => a.area - b.area);
}

export function collegaTooltipEstensioni(map) {
  registraTooltip(map, e => {
    const layers = (map.getStyle()?.layers ?? []).filter(l => LAYER_ESTENSIONI.test(l.id) && map.getLayoutProperty(l.id, 'visibility') !== 'none').map(l => l.id);
    if (!layers.length) return null;
    const voci = estensioniDa(map.queryRenderedFeatures(e.point, { layers }));
    if (!voci.length) return null;
    const corpo = document.createElement('div');
    corpo.className = 'strati-tooltip-corpo';
    for (const v of voci.slice(0, MAX_VOCI)) {
      const riga = document.createElement('div');
      const titolo = document.createElement('strong');
      titolo.textContent = v.titolo;
      riga.append(titolo);
      corpo.append(riga);
    }
    if (voci.length > MAX_VOCI) {
      const altre = document.createElement('div');
      altre.className = 'strati-tooltip-altre';
      altre.textContent = `+ altri ${voci.length - MAX_VOCI}`;
      corpo.append(altre);
    }
    return { contenuto: corpo, cursore: true };
  }, 3);
}
