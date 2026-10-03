import { chiaveLuogo } from '../core/scheda-modello.js';

// Modello puro del monumento: stessi campi per la voce della scheda di destra e per il popup sulla mappa.
// `risolvi` trasforma il percorso relativo della foto (dentro dati/monumenti/) in URL; le foto già assolute
// (luoghi della Mappa monumentale, ospitate altrove) restano come sono.

const FONTE_COMUNE = 'Portale del Turismo — Comune di Palermo';
const urlFoto = (rel, risolvi) => (/^https?:/.test(rel) ? rel : risolvi(rel));

export function voceMonumento(p, risolvi) {
  const voce = {
    chiave: `monumento-${p.id}`,
    peso: 5,
    luogo: chiaveLuogo(p.nome),
    titolo: p.nome,
    icona: 'monumento',
    badge: p.categoria,
    gruppi: [],
    fonte: `Fonte: ${p.fonte ?? FONTE_COMUNE}`,
  };
  if (p.url) voce.link = { testo: 'Vai al sito del Comune', url: p.url, icona: 'esterno', suggerimento: 'Portale del Turismo del Comune di Palermo' };
  if (p.foto) voce.immagine = { url: urlFoto(p.foto, risolvi), alt: p.nome };
  if (p.descrizione) voce.testo = p.descrizione;
  return voce;
}

export function modelloPopup(p, risolvi) {
  return {
    titolo: p.nome,
    categoria: p.categoria,
    foto: p.foto ? urlFoto(p.foto, risolvi) : null,
    descrizione: p.descrizione || null,
    url: p.url || null,
    fonte: p.fonte ?? FONTE_COMUNE,
  };
}
