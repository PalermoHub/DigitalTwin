// Fermate del trasporto pubblico nei dintorni di un punto cliccato: logica pura, senza mappa né rete.
const R_TERRA = 6371008.8;
const rad = g => g * Math.PI / 180;
const perNumero = (a, b) => a.numero.localeCompare(b.numero, 'it', { numeric: true });

// Distanza in metri tra due punti [lon, lat] (haversine)
export function distanzaM([lon1, lat1], [lon2, lat2]) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R_TERRA * Math.asin(Math.sqrt(a));
}

// Le fermate entro `raggio` metri dal punto, dalla più vicina, con le loro linee (numero, tipo, colore).
// `fermate` = [{ id, nome, lon, lat, linee: [numero] }]; `info(numero)` → { tipo, colore } o undefined (linea fuori dal feed: ignorata).
export function fermateVicine(punto, fermate, info, raggio) {
  const trovate = [];
  for (const f of fermate) {
    const distanza = distanzaM(punto, [f.lon, f.lat]);
    if (distanza > raggio) continue;
    const linee = f.linee.flatMap(numero => { const l = info(numero); return l ? [{ numero, tipo: l.tipo, colore: l.colore }] : []; }).sort(perNumero);
    if (linee.length) trovate.push({ id: f.id, nome: f.nome, lon: f.lon, lat: f.lat, distanza, linee });
  }
  return trovate.sort((a, b) => a.distanza - b.distanza);
}

export const metri = d => `${Math.round(d / 10) * 10} m`;

// Voce della scheda con al massimo `max` fermate (le più vicine). `costruisci(fermate)` disegna l'elenco cliccabile.
// L'evidenza porta le stesse fermate sulla mappa, come per gli altri luoghi della scheda.
export function voceTrasportoVicino(fermate, raggio, costruisci, max = 8) {
  if (!fermate.length) return null;
  const mostrate = fermate.slice(0, max);
  const altre = fermate.length - mostrate.length;
  return {
    chiave: 'trasportovicino', peso: 8, titolo: 'Trasporto pubblico vicino', icona: 'bus', gruppi: [], sempre: true,
    dinamico: () => costruisci(mostrate),
    nota: `Fermate entro ${raggio} m in linea d’aria${altre > 0 ? ` (altre ${altre} più lontane non elencate)` : ''}. Tocca il nome per vederla sulla mappa.`,
    evidenza: [{ id: 'trasporto-vicine', etichetta: 'Fermata vicina', colore: '#364fc7', features: mostrate.map(f => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [f.lon, f.lat] }, properties: {} })) }],
  };
}
