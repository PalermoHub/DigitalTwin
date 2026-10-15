import { righe } from '../core/scheda-util.js';
import { PESO_SERVIZI } from './scheda-colonnine.js';
import { t, tl, localeIntl } from '../core/i18n.js';
import { distanzaM, metri } from './trasporto-vicino.js';

// Modello puro dei distributori di carburante: stesse righe per il popup e per la scheda di destra (tab «Servizi su strada»).
// Prezzi: `prezzi` = [carburante, self (0/1), €/l, data comunicazione]; i prezzi più bassi per carburante sono già nei campi piatti `benzina`, `gasolio`…

const FONTE = 'MIMIT, Osservaprezzi carburanti (anagrafica degli impianti e prezzi comunicati dai gestori) — IODL 2.0';
const LINK = 'https://carburanti.mise.gov.it/ospzSearch/zona';
export const CARBURANTI = ['Benzina', 'Gasolio', 'GPL', 'Metano'];

const euro = n => n.toLocaleString(localeIntl(), { minimumFractionDigits: 3, maximumFractionDigits: 3 });

// «1,988 € self · 2,388 € servito» per un carburante; vuoto se non si vende
function prezziCarburante(p, carburante) {
  const di = self => (p.prezzi ?? []).find(x => x[0] === carburante && x[1] === self)?.[2];
  const [s, v] = [di(1), di(0)];
  return [s != null && t('distributori.self', { prezzo: euro(s) }), v != null && t('distributori.servito', { prezzo: euro(v) })].filter(Boolean).join(' · ');
}

// carburanti diversi dai quattro principali (Blue Diesel, HVO, …): «Blue Diesel 2,300 € · HVO 2,290 €» col prezzo più basso
function altriCarburanti(p) {
  const minimi = new Map();
  for (const [nome, , prezzo] of p.prezzi ?? []) if (!CARBURANTI.includes(nome)) minimi.set(nome, Math.min(prezzo, minimi.get(nome) ?? Infinity));
  return [...minimi].map(([nome, prezzo]) => `${nome} ${euro(prezzo)} €`).join(' · ');
}

// «14/10/2026» dalla data più recente comunicata dai gestori («GG/MM/AAAA HH:MM:SS»)
const giorno = p => (p.prezzi_del ?? '').slice(0, 10);

function righeDistributore(p, distanza) {
  return righe([
    ['Distanza', distanza != null ? metri(distanza) : ''], ['Gestore', p.gestore], ['Indirizzo', p.indirizzo],
    ...CARBURANTI.map(c => [c, prezziCarburante(p, c)]),
    ['Altri carburanti', altriCarburanti(p)],
    ['Prezzi del', giorno(p)],
  ]);
}

const titolo = p => p.bandiera || p.gestore || 'Distributore di carburante';

// I distributori entro `raggio` metri dal punto [lon, lat], dal più vicino; `geometrie` = Map id -> coordinate [lon, lat].
// `obbligati` = id sempre inclusi (quelli cliccati), anche oltre `raggio` o `max`.
export function distributoriVicini(punto, proprieta, geometrie, raggio, max, obbligati = new Set()) {
  const tutti = [...proprieta.values()].flatMap(p => (geometrie.has(p.id) ? [{ p, distanza: distanzaM(punto, geometrie.get(p.id)) }] : []))
    .sort((a, b) => a.distanza - b.distanza);
  const vicini = tutti.filter(x => x.distanza <= raggio).slice(0, max);
  return [...vicini, ...tutti.filter(x => obbligati.has(x.p.id) && !vicini.includes(x))].sort((a, b) => a.distanza - b.distanza);
}

export function voceDistributore(p, distanza = null, coordinate = null) {
  return {
    chiave: `distributore-${p.id}`,
    peso: PESO_SERVIZI,
    strato: 'distributori',
    titolo: titolo(p),
    icona: 'distributori',
    badge: 'Distributore di carburante',
    sempre: true,
    gruppi: [{ righe: righeDistributore(p, distanza) }],
    // a strato spento il punto non si vede: la scheda lo porta sulla mappa come gli altri luoghi
    ...(coordinate && { evidenza: [{ id: 'distributori-vicini', etichetta: t('evidenza.distributore'), colore: '#f2b705', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: coordinate }, properties: { attributo: titolo(p) } }] }] }),
    link: { testo: 'Cerca i prezzi più bassi su Osservaprezzi carburanti', url: LINK, icona: 'esterno', suggerimento: 'Sito del MIMIT con i prezzi dei carburanti per zona' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupDistributore(p) {
  return {
    titolo: titolo(p), sottotitolo: p.indirizzo,
    righe: righe([...CARBURANTI.map(c => [c, prezziCarburante(p, c)]), ['Prezzi del', giorno(p)]]),
  };
}
