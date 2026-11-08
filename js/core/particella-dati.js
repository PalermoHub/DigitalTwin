// Statistiche delle superfici delle particelle (dati/catasto/analisi_particelle.json): lette una volta, poi disponibili in modo sincrono
// (la scheda si costruisce senza attese: finché il file non è arrivato, o se manca, le righe di confronto semplicemente non compaiono).
import { urlDati } from './config.js';

let dati = null;
let richiesta = null;

export function precaricaStatisticheParticelle() {
  richiesta ??= fetch(urlDati('catasto/analisi_particelle.json')).then(r => (r.ok ? r.json() : null)).then(d => { dati = d; return d; }).catch(() => null);
  return richiesta;
}

export const statisticheParticelle = () => dati;
