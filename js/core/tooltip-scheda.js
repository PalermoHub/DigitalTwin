// Tooltip «di riserva» dai dati della scheda: ogni strato con una scheda (poligoni «hit» trasparenti) e senza un tooltip
// proprio mostra, a strato acceso, titolo e prime righe della sua voce di scheda. Così il tooltip descrive tutti gli strati aperti.
import { registraTooltip } from './tooltip.js';

const MAX_VOCI = 3;
const MAX_RIGHE = 3;
const R = 4; // riquadro di ±R pixel attorno al cursore, come per i clic

// Voci di scheda → modelli di tooltip {titolo, righe}, solo per gli strati accesi e non esclusi
export function modelliDaVoci(voci, { acceso, escludi = [] }) {
  const visti = new Set();
  const modelli = [];
  for (const v of voci) {
    if (!v?.titolo || escludi.includes(v.strato) || !acceso(v.strato)) continue;
    const chiave = v.chiave ?? v.titolo;
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    const rr = (v.gruppi ?? []).flatMap(g => g.righe ?? []).filter(r => r?.etichetta && r?.valore != null).slice(0, MAX_RIGHE);
    modelli.push({ titolo: v.titolo, badge: v.badge, righe: rr });
  }
  return modelli;
}

function disegna(modelli) {
  const corpo = document.createElement('div');
  corpo.className = 'strati-tooltip-corpo';
  for (const m of modelli.slice(0, MAX_VOCI)) {
    const voce = document.createElement('div');
    const titolo = document.createElement('strong');
    titolo.textContent = m.titolo;
    voce.append(titolo);
    for (const r of m.righe) {
      const riga = document.createElement('div');
      riga.textContent = `${r.etichetta}: ${r.valore}`;
      voce.append(riga);
    }
    corpo.append(voce);
  }
  if (modelli.length > MAX_VOCI) {
    const altre = document.createElement('div');
    altre.className = 'strati-tooltip-altre';
    altre.textContent = `+ altri ${modelli.length - MAX_VOCI}`;
    corpo.append(altre);
  }
  return corpo;
}

// moduli con `scheda.tooltip: true` (e, se serve, `scheda.senzaTooltip: [id di strato già coperti da un tooltip proprio]`)
export function collegaTooltipScheda(map, moduli) {
  const strati = moduli.flatMap(m => m.strati ?? []);
  const acceso = id => {
    const layer = strati.find(s => s.id === id)?.layers?.[0];
    return !!layer && !!map.getLayer(layer) && map.getLayoutProperty(layer, 'visibility') === 'visible';
  };
  const conTooltip = moduli.filter(m => m.scheda?.tooltip);
  registraTooltip(map, e => {
    const modelli = [];
    for (const m of conTooltip) {
      const layers = m.scheda.layers.filter(id => map.getLayer(id));
      if (!layers.length) continue;
      const riquadro = [[e.point.x - R, e.point.y - R], [e.point.x + R, e.point.y + R]];
      const trovati = map.queryRenderedFeatures(riquadro, { layers });
      if (!trovati.length) continue;
      modelli.push(...modelliDaVoci(m.scheda.voci(trovati, e.lngLat), { acceso, escludi: m.scheda.senzaTooltip }));
    }
    return modelli.length ? { contenuto: disegna(modelli) } : null;
  }, 2);
}
