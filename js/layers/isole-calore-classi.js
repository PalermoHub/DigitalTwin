// Parti pure delle isole di calore: rampe di colori, espressione MapLibre per la classificazione, etichette di legenda
// e dati del grafico 2019–2025. Le soglie arrivano già calcolate da dati/isole-calore/isole-calore.json (scripts/isole_calore.py).

// ColorBrewer YlOrRd sequenziale (chiaro = fresco, scuro = caldo), come nell'app dello studio.
export const RAMPE = {
  3: ['#ffeda0', '#feb24c', '#f03b20'],
  4: ['#ffffb2', '#fecc5c', '#fd8d3c', '#e31a1c'],
  5: ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
  6: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'],
  7: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
  8: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
  9: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
};
export const NODATA = '#cccccc';

export const coloriClassi = k => RAMPE[Math.min(9, Math.max(3, k))];

// Colore per classe: `step` sui limiti interni (soglie = [minimo, limite 1 … limite k-1, massimo]).
export function espressioneColore(campo, soglie, colori = coloriClassi(soglie.length - 1)) {
  const passi = [];
  for (let i = 1; i < soglie.length - 1; i++) passi.push(soglie[i], colori[i]);
  return ['case', ['==', ['get', campo], null], NODATA, ['step', ['get', campo], colori[0], ...passi]];
}

const it1 = n => n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const etichetteClassi = soglie => soglie.slice(0, -1).map((s, i) => `${it1(s)} – ${it1(soglie[i + 1])}`);

// Serie per il grafico. `sezione` null = solo l'andamento comunale. La scala copre sezione, media e quartili comunali.
export function datiGrafico(p, serie) {
  const sezione = p ? serie.anni.map(a => (p[`LST_${a}`] != null ? Number(p[`LST_${a}`]) : null)) : null;
  const tutti = [...(sezione ?? []), ...serie.media, ...serie.p25, ...serie.p75].filter(v => v != null);
  return { anni: serie.anni, sezione, comune: serie.media, p25: serie.p25, p75: serie.p75, min: Math.min(...tutti), max: Math.max(...tutti) };
}
