import { righe } from '../core/scheda-util.js';
import { t, tl, localeIntl } from '../core/i18n.js';

// Modello puro delle navi attorno alla Sicilia: stesse righe per il popup e per la scheda di destra (tab «Luogo»).
// I dati arrivano dal Worker (/navi), che ascolta AISStream (AIS terrestre): sono le ultime posizioni ricevute, non una traccia continua.

const FONTE = 'AISStream (AIS terrestre) — dati AIS dei transponder delle navi';
const LINK = 'https://www.marinetraffic.com/en/ais/details/ships/mmsi:';
const PESO_LUOGO = 8;
const KT_KMH = 1.852;

export const CATEGORIE = [
  ['Passeggeri', '#7048e8'], ['Merci', '#e8590c'], ['Cisterne', '#c2255c'], ['Pesca', '#1c7ed6'],
  ['Diporto', '#0b7285'], ['Servizio', '#f2b705'], ['Militare', '#495057'], ['Altro', '#868e96'],
];
export const COLORE_ALTRO = '#868e96';
export const coloreCategoria = c => (CATEGORIE.find(([n]) => n === c) ?? [, COLORE_ALTRO])[1];

const num = n => n.toLocaleString(localeIntl(), { maximumFractionDigits: 0 });
const velocita = p => (p.velocita_kt == null ? '' : `${p.velocita_kt.toLocaleString(localeIntl(), { maximumFractionDigits: 1 })} kn (${num(p.velocita_kt * KT_KMH)} km/h)`);
const dati = p => (p.minuti_fa == null ? '' : p.minuti_fa < 1 ? t('navi.pochiSecondi') : t('navi.minutiFa', { n: p.minuti_fa }));

export const titoloNave = p => p.nome || `MMSI ${p.id}`;

function righeNave(p) {
  return righe([
    ['Categoria', p.categoria], ['Stato', p.stato], ['Destinazione', p.destinazione], ['Velocità', velocita(p)],
    ['Rotta', p.rotta == null ? '' : `${p.rotta}°`], ['Lunghezza', p.lunghezza_m ? `${num(p.lunghezza_m)} m` : ''], ['MMSI', p.id], ['Ultimo segnale', dati(p)],
  ]);
}

// Una voce per nave sotto il clic.
export function voceNave(p) {
  return {
    chiave: `nave-${p.id}`, peso: PESO_LUOGO, strato: 'navi', titolo: titoloNave(p), icona: 'nave', badge: p.categoria, sempre: true,
    gruppi: [{ righe: righeNave(p) }],
    link: { testo: 'Segui la nave su MarineTraffic', url: LINK + encodeURIComponent(p.id), icona: 'esterno', suggerimento: 'Scheda della nave su MarineTraffic' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupNave(p) {
  return { titolo: titoloNave(p), sottotitolo: p.categoria, righe: righeNave(p).filter(r => r.etichetta !== 'Categoria') };
}
