// Sui punti il puntatore diventa una mano, come sui poligoni: così si capisce che sono cliccabili.
// Vale per tutti i cerchi visibili, compresi quelli dei layer aggiunti dall'utente. Un solo gestore
// invece di uno per strato: quelli già presenti nei moduli (monumenti, scuole…) restano e vanno d'accordo.
const RAGGIO = 4; // tolleranza in pixel attorno al puntatore

// I cerchi «hit» (opacità 0) sono sempre presenti ma invisibili: non devono cambiare il puntatore.
export function ePuntoVisibile(tipo, visibilita, opacita) {
  return tipo === 'circle' && visibilita !== 'none' && opacita !== 0;
}

// I poligoni e le linee dei layer aggiunti dall'utente (file, WFS, ArcGIS, RNDT) non hanno un gestore proprio: la mano la mette questo.
const ESTERNO_AREA = /^(?:miei|rndt)-.+-(?:fill|line)$/;
export const eEsternoCliccabile = (id, tipo, visibilita) => (tipo === 'fill' || tipo === 'line') && ESTERNO_AREA.test(id) && visibilita !== 'none';

export function collegaCursorePunti(map) {
  let cerchi = null; // id di tutti i layer circle; si rifà quando lo stile cambia (layer aggiunti a runtime)
  map.on('styledata', () => { cerchi = null; });
  let mio = false;
  map.on('mousemove', e => {
    const canvas = map.getCanvas();
    if (canvas.style.cursor === 'crosshair') return; // modalità di posizionamento (Geoimage): non si tocca
    cerchi ??= map.getStyle().layers.filter(l => l.type === 'circle' || ESTERNO_AREA.test(l.id)).map(l => ({ id: l.id, tipo: l.type }));
    const ids = cerchi.filter(({ id, tipo }) => map.getLayer(id) && (tipo === 'circle'
      ? ePuntoVisibile('circle', map.getLayoutProperty(id, 'visibility'), map.getPaintProperty(id, 'circle-opacity'))
      : eEsternoCliccabile(id, tipo, map.getLayoutProperty(id, 'visibility')))).map(c => c.id);
    const sopra = ids.length > 0 && map.queryRenderedFeatures([[e.point.x - RAGGIO, e.point.y - RAGGIO], [e.point.x + RAGGIO, e.point.y + RAGGIO]], { layers: ids }).length > 0;
    if (sopra) { canvas.style.cursor = 'pointer'; mio = true; } else if (mio) { canvas.style.cursor = ''; mio = false; }
  });
  map.on('mouseout', () => { if (mio) { map.getCanvas().style.cursor = ''; mio = false; } });
}
