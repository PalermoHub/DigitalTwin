// Modello puro di fermate e linee del trasporto pubblico: le righe fisse della scheda di destra.
// Orari e fermate in sequenza sono interattivi (selettore del giorno): li costruisce `dinamico`, passato da chi disegna.

const righe = coppie => coppie.filter(([, valore]) => valore).map(([etichetta, valore]) => ({ etichetta, valore }));

export function voceFermata(p, dinamico) {
  return {
    chiave: `fermata-${p.id}`, peso: 6, titolo: p.nome, icona: 'fa-bus', badge: 'Fermata', sempre: true,
    gruppi: [{ righe: righe([['Linee', p.linee.join(', ')], ['Accessibile in carrozzina', p.accessibile]]) }],
    dinamico,
  };
}

// Le linee sotto un clic possono essere decine (una strada principale ne ha molte): le due direzioni di una linea
// stanno insieme e tutte le linee in una sola voce, da aprire una per volta.
export function raggruppaLinee(linee) {
  const perRotta = new Map();
  for (const l of linee) {
    if (!perRotta.has(l.route_id)) perRotta.set(l.route_id, { route_id: l.route_id, numero: l.numero, nome: l.nome, tipo: l.tipo, direzioni: [] });
    const g = perRotta.get(l.route_id);
    if (!g.direzioni.some(d => d.direzione === l.direzione)) g.direzioni.push(l);
  }
  const gruppi = [...perRotta.values()];
  for (const g of gruppi) g.direzioni.sort((a, b) => a.direzione - b.direzione);
  return gruppi;
}

// `costruisci(gruppi)` disegna l'elenco delle linee (accordion con gli orari caricati all'apertura).
export function voceLinee(linee, costruisci) {
  const gruppi = raggruppaLinee(linee);
  const una = gruppi.length === 1 ? gruppi[0] : null;
  return {
    chiave: 'linee', peso: 7, titolo: una ? `Linea ${una.numero}` : `Linee (${gruppi.length})`, icona: una?.tipo === 'tram' ? 'fa-train' : 'fa-bus',
    badge: una ? (una.tipo === 'tram' ? 'Tram' : 'Bus') : undefined, sempre: true, gruppi: [],
    dinamico: () => costruisci(gruppi),
  };
}
