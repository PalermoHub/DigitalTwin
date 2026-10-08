// js/core/tabella/icone.js
// Icone del cassetto «Tabella», in stile barra QGIS: tratto monocromo (currentColor), 24 × 24, riempimenti tenui per la feature.
const PUNTATORE = '<path d="M12 11l9 3.5-4 1.5-1.5 4z" fill="currentColor"/>';
const ICONE_TABELLA = {
  click: `<rect x="3" y="3" width="9" height="9" rx="1.5" fill="currentColor" fill-opacity=".25"/>${PUNTATORE}`,
  riquadro: `<rect x="3" y="3" width="14" height="11" rx="1" stroke-dasharray="2.6 2"/><path d="M12 12l9 3.5-4 1.5-1.5 4z" fill="currentColor"/>`,
  poligono: `<path d="M4 8l6-5 7 3-2 7-9 1z"/><g fill="currentColor" stroke="none"><circle cx="4" cy="8" r="1.4"/><circle cx="10" cy="3" r="1.4"/><circle cx="17" cy="6" r="1.4"/><circle cx="15" cy="13" r="1.4"/><circle cx="6" cy="14" r="1.4"/></g><path d="M13 14l8 3-3.5 1.5L16 21z" fill="currentColor"/>`,
  area: `<path d="M3 7l9-4 8 5-2 8-10 1z" fill="currentColor" fill-opacity=".3"/><path d="M12 11l9 3.5-4 1.5-1.5 4z" fill="currentColor"/>`,
  torna: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/>',
  colonne: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16M15 4v16"/>',
  tutte: '<g fill="currentColor" fill-opacity=".3"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></g>',
  svuota: '<rect x="3" y="4" width="12" height="4" rx="1"/><rect x="3" y="10" width="12" height="4" rx="1"/><rect x="3" y="16" width="12" height="4" rx="1"/><path d="M17.5 9.5l4 4M21.5 9.5l-4 4"/>',
  inverti: '<path d="M7 20V5M7 5L3.5 8.5M7 5l3.5 3.5M17 4v15M17 19l-3.5-3.5M17 19l3.5-3.5"/>',
  esporta: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M12 10.5v6M9.5 14l2.5 2.5 2.5-2.5"/>',
};

export const nomiIconeTabella = Object.keys(ICONE_TABELLA);
export const svgTabella = (nome, size = 18) => {
  const corpo = ICONE_TABELLA[nome];
  if (!corpo) return '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
};
