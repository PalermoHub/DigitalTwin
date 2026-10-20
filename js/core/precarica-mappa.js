// Dalla home, a pagina ferma, scalda la cache con i file leggeri della mappa: aprendola poi parte quasi subito.
// Niente dati pesanti (i geojson degli strati restano pigri) e niente se la rete è lenta o il risparmio dati è acceso.
export const FILE_MAPPA = ['css/vendor/maplibre-gl.css', 'css/app.css', 'js/vendor/maplibre-gl.js', 'js/vendor/pmtiles.js'];
export const MODULI_MAPPA = ['js/avvio.js', 'js/app.js'];

export const reteLenta = connessione => !!connessione && (connessione.saveData === true || /(^|-)2g$/.test(connessione.effectiveType ?? ''));

export function risorseMappa(lingua) {
  return [
    ...MODULI_MAPPA.map(href => ({ rel: 'modulepreload', href })),
    ...FILE_MAPPA.map(href => ({ rel: 'prefetch', href, as: href.endsWith('.css') ? 'style' : 'script' })),
    { rel: 'prefetch', href: `js/locales/${lingua}.json`, as: 'fetch', crossOrigin: 'anonymous' },
  ];
}

// `finestra` è window (o un suo doppione nei test); torna il numero di link aggiunti.
export function precaricaMappa(finestra, lingua) {
  if (reteLenta(finestra.navigator?.connection)) return 0;
  const risorse = risorseMappa(lingua);
  const doc = finestra.document;
  for (const r of risorse) doc.head.append(Object.assign(doc.createElement('link'), r));
  return risorse.length;
}

export function precaricaMappaARiposo(finestra, lingua) {
  const parti = () => (finestra.requestIdleCallback ?? (f => finestra.setTimeout(f, 1500)))(() => precaricaMappa(finestra, lingua));
  if (finestra.document.readyState === 'complete') parti(); else finestra.addEventListener('load', parti, { once: true });
}
