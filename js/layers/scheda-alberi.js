import { righe } from '../core/scheda-util.js';

// Modello puro dell'albero monumentale: stesse righe per la voce della scheda di destra e per il popup sulla mappa.

const FONTE = 'MASAF — Elenco degli alberi monumentali d\'Italia';
const LINK = 'https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/11260';

// Negli insiemi omogenei (filari, gruppi di palme) circonferenza e altezza sono il valore massimo.
function righeAlbero(p) {
  const max = p.insieme ? ' (max)' : '';
  return righe([
    ['Specie', p.specie], ['Località', p.localita],
    [`Circonferenza fusto${max}`, p.circonferenza != null ? `${p.circonferenza} cm` : null],
    [`Altezza${max}`, p.altezza != null ? `${p.altezza} m` : null],
    ['Altitudine', p.altitudine != null ? `${p.altitudine} m s.l.m.` : null],
    ['Criteri di monumentalità', p.criteri?.join(', ')],
    ['Proposta di dichiarazione di notevole interesse pubblico', p.dichiarato ? 'sì' : 'no'],
    ['Scheda MASAF', p.scheda],
  ]);
}

export function voceAlbero(p) {
  return {
    chiave: `albero-${p.id}`,
    peso: 5,
    strato: 'alberi',
    titolo: p.nome || p.specie,
    icona: 'albero',
    badge: p.insieme ? 'Insieme omogeneo' : 'Albero monumentale',
    sempre: true,
    gruppi: [{ righe: righeAlbero(p) }],
    link: { testo: 'Elenco MASAF degli alberi monumentali', url: LINK, icona: 'esterno', suggerimento: 'Ministero dell\'agricoltura, della sovranità alimentare e delle foreste' },
    fonte: `Fonte: ${FONTE}`,
  };
}

export function modelloPopupAlbero(p) {
  return { titolo: p.nome || p.specie, sottotitolo: p.insieme ? 'Insieme omogeneo' : 'Albero monumentale', righe: righeAlbero(p), url: LINK, fonte: FONTE };
}
