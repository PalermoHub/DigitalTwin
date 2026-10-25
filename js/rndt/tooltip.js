// js/rndt/tooltip.js
// Le estensioni dei dati del catalogo RNDT (il plugin le disegna come riquadri) finiscono nel tooltip unico della mappa,
// una sezione sotto le altre, dalla più piccola alla più grande. Il tooltip proprio del plugin è spento (vedi vendor).
import { registraTooltip, campioneTooltip, disegnaVoceTooltip } from '../core/tooltip.js';
import { proprieta } from './info.js';
import { origineLayer } from './legenda.js';

const COLORE = '#495057';
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
      corpo.append(disegnaVoceTooltip({ titolo: v.titolo, icona: 'mappa', sezione: 'Catalogo RNDT', colore: COLORE }));
    }
    if (voci.length > MAX_VOCI) {
      const altre = document.createElement('div');
      altre.className = 'strati-tooltip-altre';
      altre.textContent = `+ altri ${voci.length - MAX_VOCI}`;
      corpo.append(altre);
    }
    return { contenuto: corpo, cursore: true, colore: COLORE };
  }, 3);
}

const MAX_RIGHE = 3;
const MAX_LAYER = 3;

// Tooltip dei layer vettoriali aggiunti (file, WFS, ArcGIS): sotto il cursore, per ogni layer acceso, il nome, la prima
// proprietà con il colore del layer (come in legenda) e un paio di righe. I WMS no: ogni movimento del mouse sarebbe una richiesta al server.
export function collegaTooltipLayerEsterni(map, hosts) {
  registraTooltip(map, e => {
    const voci = [];
    for (const host of hosts) {
      for (const layer of host.elenco()) {
        if (layer.tipo !== 'geojson' || !layer.visibile || layer.indisponibile) continue;
        const f = host.featureAlPunto(layer.id, e.point)[0];
        const righe = f ? proprieta(f.properties) : [];
        if (!righe.length) continue;
        const [prima, ...altre] = righe;
        const voce = disegnaVoceTooltip({
          titolo: layer.nome, icona: 'mappa', sezione: 'Layer aggiunto', colore: layer.colore ?? COLORE, sottotitolo: `${prima.etichetta}: ${prima.valore}`,
          campione: layer.colore ? campioneTooltip('legenda-esterna', ['', { background: layer.colore }]) : undefined,
        });
        for (const r of altre.slice(0, MAX_RIGHE - 1)) {
          const riga = document.createElement('div');
          riga.className = 'tooltip-riga';
          const etichetta = document.createElement('span');
          etichetta.textContent = r.etichetta;
          const valore = document.createElement('b');
          valore.textContent = r.valore;
          riga.append(etichetta, valore);
          voce.append(riga);
        }
        const { servizio, server } = origineLayer(layer);
        if (servizio) {
          const origine = document.createElement('small');
          origine.className = 'tooltip-origine';
          origine.textContent = `${servizio} · ${server}`;
          voce.append(origine);
        }
        voci.push(voce);
      }
    }
    if (!voci.length) return null;
    const corpo = document.createElement('div');
    corpo.className = 'strati-tooltip-corpo';
    corpo.append(...voci.slice(0, MAX_LAYER));
    return { contenuto: corpo, cursore: true, colore: COLORE };
  }, 3);
}
