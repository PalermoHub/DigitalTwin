// Modello puro di fermate e linee del trasporto pubblico: le righe fisse della scheda di destra.
// Orari e fermate in sequenza sono interattivi (selettore del giorno): li costruisce `dinamico`, passato da chi disegna.
import { t } from '../core/i18n.js';

const ICONA = { tram: 'tram', ferrovia: 'treno' };
const BADGE = { tram: 'Tram', ferrovia: 'Metro' };

const righe = coppie => coppie.filter(([, valore]) => valore).map(([etichetta, valore]) => ({ etichetta, valore }));

export function voceFermata(p, dinamico) {
  const stazione = p.tipo === 'ferrovia';
  return {
    chiave: `fermata-${p.id}`, peso: 6, strato: stazione ? 'trasporto-stazioni' : 'trasporto-fermate', titolo: p.nome,
    icona: stazione ? 'treno' : 'bus', badge: stazione ? 'Stazione' : 'Fermata', sempre: true,
    gruppi: [{ righe: righe([['Stato', p.stato && 'In apertura'], ['Linee', p.linee.join(', ')], ['Accessibile in carrozzina', p.accessibile]]) }],
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
    chiave: 'linee', peso: 7, titolo: una ? t('trasporto.linea', { numero: una.numero }) : t('trasporto.lineeN', { n: gruppi.length }), icona: ICONA[una?.tipo] ?? 'bus',
    badge: una ? BADGE[una.tipo] ?? 'Bus' : undefined, sempre: true, gruppi: [],
    dinamico: () => costruisci(gruppi),
  };
}

// Tooltip al passaggio del mouse: stesse informazioni essenziali della scheda.
export function tooltipFermata(p) {
  return { titolo: p.nome, dettaglio: p.linee.length ? t('trasporto.lineeElenco', { elenco: p.linee.join(', ') }) : p.stato ? t('trasporto.inApertura') : 'Nessuna corsa nel feed' };
}

// Una riga per linea (le due direzioni insieme), al massimo `max`: su una strada principale ne passano molte.
export function tooltipLinee(linee, max = 4) {
  const gruppi = raggruppaLinee(linee);
  return {
    linee: gruppi.slice(0, max).map(g => ({ numero: g.numero, nome: g.nome, colore: g.direzioni[0].colore })),
    altre: Math.max(0, gruppi.length - max),
  };
}
