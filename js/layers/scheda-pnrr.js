// Modello puro dei progetti PNRR di Palermo (Italia Domani, open data): colori e nomi delle missioni, sezione della scheda di destra e
// tooltip. Una feature per CUP (dati/pnrr/pnrr.geojson, generato da scripts/pnrr.py).
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';

export const FONTE = 'Italia Domani — Struttura di missione PNRR, Sogei: catalogo open data (CC BY 4.0)';
const LINK = 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html';

// [codice, nome, colore]
export const MISSIONI = [
  ['M1', 'Digitalizzazione, innovazione, competitività, cultura e turismo', '#1c7ed6'],
  ['M2', 'Rivoluzione verde e transizione ecologica', '#2f9e44'],
  ['M3', 'Infrastrutture per una mobilità sostenibile', '#f08c00'],
  ['M4', 'Istruzione e ricerca', '#7048e8'],
  ['M5', 'Inclusione e coesione', '#d6336c'],
  ['M6', 'Salute', '#e03131'],
  ['M7', 'REPowerEU', '#0c8599'],
];
export const coloreMissione = codice => MISSIONI.find(([c]) => c === codice)?.[2] ?? '#868e96';

const PRECISIONE = {
  civico: 'Indirizzo (civico)',
  via: 'Solo la via: posizione approssimata',
};

const euro = v => (v != null && Number.isFinite(Number(v))
  ? Number(v).toLocaleString(localeIntl(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  : null);

// «LAVORI DI RIQUALIFICAZIONE…» è in maiuscolo nella fonte: si porta a frase per leggerlo meglio
export function frase(testo) {
  if (!testo) return null;
  const s = String(testo).trim();
  if (s !== s.toUpperCase() || s.length < 4) return s;
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function titoloProgetto(p) {
  return frase(p.titolo) ?? frase(p.submisura_nome) ?? p.cup;
}

export function righeProgetto(p) {
  return righe([
    ['Missione', p.missione ? `${p.missione} — ${tl(MISSIONI.find(([c]) => c === p.missione)?.[1] ?? p.missione_nome ?? '')}` : null],
    ['Componente', p.componente_nome],
    ['Misura', p.submisura_nome ?? p.misura],
    ['Stato', p.stato], ['Soggetto attuatore', p.attuatore],
    ['Finanziamento PNRR', euro(p.pnrr)], ['Costo totale', euro(p.totale)],
    ['Inizio previsto', p.inizio_previsto], ['Inizio effettivo', p.inizio_effettivo],
    ['Fine prevista', p.fine_prevista], ['Fine effettiva', p.fine_effettiva],
    ['Natura', frase(p.natura)], ['Tipologia', frase(p.tipologia)], ['Settore', frase(p.settore)],
    ['Indirizzo', p.indirizzo], ['Posizione', PRECISIONE[p.precisione] ? tl(PRECISIONE[p.precisione]) : null],
    ['CUP', p.cup],
  ]);
}

export function voceScheda(p) {
  return {
    chiave: `pnrr-${p.cup}`,
    peso: 57,
    strato: 'pnrr',
    titolo: titoloProgetto(p),
    icona: 'euro',
    badge: p.missione ? `PNRR ${p.missione}` : 'PNRR',
    sempre: true,
    gruppi: [{ righe: righeProgetto(p) }],
    testo: p.sintesi ? frase(p.sintesi) : undefined,
    link: { testo: 'Open data di Italia Domani', icona: 'esterno', url: LINK },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

const MAX_TITOLO_TOOLTIP = 90;
const accorcia = s => (s.length > MAX_TITOLO_TOOLTIP ? `${s.slice(0, MAX_TITOLO_TOOLTIP).replace(/\s+\S*$/, '')}…` : s);

export function modelloTooltipPnrr(p) {
  return {
    titolo: accorcia(titoloProgetto(p)),
    sottotitolo: p.missione ? `${p.missione} · ${p.stato ?? ''}`.replace(/ · $/, '') : (p.stato ?? ''),
    righe: righe([['Finanziamento PNRR', euro(p.pnrr)], ['Soggetto attuatore', p.attuatore], ['Indirizzo', p.indirizzo]]),
  };
}
