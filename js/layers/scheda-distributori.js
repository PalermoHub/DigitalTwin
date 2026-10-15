import { righe } from '../core/scheda-util.js';
import { t, tn, tl, localeIntl } from '../core/i18n.js';
import { distanzaM, metri } from './trasporto-vicino.js';

// Modello puro dei distributori di carburante: stesse righe per il popup e per la scheda di destra (tab «Servizi su strada»).
// Prezzi: `prezzi` = [carburante, self (0/1), €/l, data comunicazione]; i prezzi più bassi per carburante sono già nei campi piatti `benzina`, `gasolio`…

const FONTE = 'MIMIT, Osservaprezzi carburanti (anagrafica degli impianti e prezzi comunicati dai gestori) — IODL 2.0';
const LINK = 'https://carburanti.mise.gov.it/ospzSearch/zona';
// Peso 8 = tab «Luogo» della scheda, accanto al trasporto pubblico vicino: si vede subito, senza cercare il tab dei servizi.
const PESO_LUOGO = 8;
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

function righeDistributore(p) {
  return righe([
    ['Gestore', p.gestore], ['Indirizzo', p.indirizzo],
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

// Sezione unica «Distributori di carburante» nel tab «Luogo» (come «Trasporto pubblico vicino»), a fisarmonica: una card per distributore,
// con la distanza dal punto cliccato e il pulsante «Mappa» per accendere lo strato. `elenco` = [{ p, distanza, coordinate }], dal più vicino.
// L'evidenza porta gli stessi distributori sulla mappa, anche a strato spento.
export function vociDistributori(elenco) {
  if (!elenco.length) return [];
  const n = elenco.length;
  return [{
    chiave: 'distributori:gruppo', peso: PESO_LUOGO, titolo: 'Distributori di carburante', icona: 'distributori', badge: tn('distributori.distributore', n), sempre: true,
    gruppi: [],
    accordion: {
      icona: 'distributori', suggerimento: 'Seleziona un distributore per vedere i prezzi',
      riassunto: tn('distributori.distributore', n),
      elementi: elenco.map(({ p, distanza }) => ({ strato: 'distributori', titolo: titolo(p), anteprima: distanza != null ? metri(distanza) : '', righe: righeDistributore(p) })),
    },
    evidenza: [{
      id: 'distributori-vicini', etichetta: t('evidenza.distributore'), colore: '#f2b705',
      features: elenco.filter(x => x.coordinate).map(({ p, coordinate }) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: coordinate }, properties: { attributo: titolo(p) } })),
    }],
    link: { testo: 'Cerca i prezzi più bassi su Osservaprezzi carburanti', url: LINK, icona: 'esterno', suggerimento: 'Sito del MIMIT con i prezzi dei carburanti per zona' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  }];
}

export function modelloPopupDistributore(p) {
  return {
    titolo: titolo(p), sottotitolo: p.indirizzo,
    righe: righe([...CARBURANTI.map(c => [c, prezziCarburante(p, c)]), ['Prezzi del', giorno(p)]]),
  };
}
