import { righe } from '../core/scheda-util.js';
import { tl, t, localeIntl } from '../core/i18n.js';

// Modello puro del traffico a flusso di Palermo (TomTom): stato del tratto di strada cliccato, per il popup e la legenda.
// I dati li serve il Worker (/traffico/segmento): velocità attuale e senza traffico (km/h), tempi di percorrenza del tratto (s), affidabilità 0-1.

export const FONTE = 'TomTom Traffic Flow';
export const LINK = 'https://www.tomtom.com/products/traffic-apis/';

// Stati dal rapporto tra velocità attuale e velocità senza traffico; i colori sono quelli delle tile di TomTom
export const STATI = [
  { nome: 'Scorrevole', colore: '#2f9e44', da: 0.8 },
  { nome: 'Rallentato', colore: '#f08c00', da: 0.5 },
  { nome: 'Intenso', colore: '#e03131', da: 0.25 },
  { nome: 'Quasi fermo', colore: '#8b1a1a', da: 0 },
];
export const CHIUSA = { nome: 'Strada chiusa', colore: '#212529' };

export function statoFlusso(s) {
  if (s?.chiusa) return CHIUSA;
  const rapporto = s?.velocitaLibera > 0 ? s.velocita / s.velocitaLibera : 1;
  return STATI.find(x => rapporto >= x.da) ?? STATI.at(-1);
}

const num = n => n.toLocaleString(localeIntl(), { maximumFractionDigits: 0 });
const durata = sec => (sec < 90 ? `${num(sec)} s` : `${num(Math.round(sec / 60))} min`);

// Il ritardo rispetto alla strada libera, solo se si nota (almeno 15 secondi)
function ritardo(s) {
  const d = (s.tempo ?? 0) - (s.tempoLibero ?? 0);
  return Number.isFinite(d) && d >= 15 ? `+${durata(d)}` : '';
}

const kmh = v => (Number.isFinite(v) ? `${num(v)} km/h` : '');

// `s` = risposta di /traffico/segmento → { titolo, sottotitolo, righe }
export function modelloPopupFlusso(s) {
  const stato = statoFlusso(s);
  return {
    titolo: stato.nome,
    sottotitolo: s.chiusa ? '' : t('traffico.sottotitolo'),
    righe: righe([
      ['Velocità attuale', s.chiusa ? '' : kmh(s.velocita)],
      ['Velocità senza traffico', kmh(s.velocitaLibera)],
      ['Ritardo sul tratto', s.chiusa ? '' : ritardo(s)],
      ['Affidabilità', Number.isFinite(s.confidenza) ? `${num(s.confidenza * 100)}%` : ''],
      ['Fonte', tl(FONTE)],
    ]),
  };
}
