// Percorso intero di una linea (tutte le direzioni) con le sue fermate, nel formato dell'evidenza sulla mappa.
// `linee` = proprietà delle linee per id, `geometrie` = id -> geometria del tracciato, `fermate` = id -> proprietà.
import { t } from '../core/i18n.js';
export function percorsoLinea(routeId, linee, geometrie, fermate) {
  const direzioni = [...linee.values()].filter(l => l.route_id === routeId);
  if (!direzioni.length) return null;
  const features = direzioni.flatMap(l => geometrie.has(l.id) ? [{ type: 'Feature', geometry: geometrie.get(l.id), properties: {} }] : []);
  const viste = new Set();
  for (const l of direzioni) {
    for (const id of l.fermate ?? []) {
      const f = fermate.get(id);
      if (!f || viste.has(id)) continue;
      viste.add(id);
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [f.lon, f.lat] }, properties: {} });
    }
  }
  return { id: `trasporto-percorso-${routeId}`, etichetta: t('trasporto.percorso', { numero: direzioni[0].numero }), colore: direzioni[0].colore, features };
}
