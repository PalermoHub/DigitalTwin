import { righe } from '../core/scheda-util.js';
import { t, tl, localeIntl } from '../core/i18n.js';

// Modello puro degli aerei in volo attorno a Palermo: stesse righe per il popup e per la scheda di destra (tab «Luogo»).
// I dati arrivano dal Worker (/voli), che li prende da adsb.lol: origine e destinazione non sono nella fonte, lo stato è dedotto.

const FONTE = 'adsb.lol (ricevitori ADS-B di volontari) — ODbL 1.0';
const LINK = 'https://globe.adsb.lol/?icao=';
const PESO_LUOGO = 8;
const FT_M = 0.3048;
const KT_KMH = 1.852;

export const STATI = [['In arrivo', '#2b8a3e'], ['In partenza', '#e8590c'], ['In transito', '#1971c2'], ['A terra', '#868e96']];
export const COLORE_ALTRO = '#1971c2';
export const coloreStato = stato => (STATI.find(([s]) => s === stato) ?? [, COLORE_ALTRO])[1];

const num = n => n.toLocaleString(localeIntl(), { maximumFractionDigits: 0 });
const quota = p => (p.stato === 'A terra' ? '' : p.quota_ft == null ? '' : `${num(p.quota_ft)} ft (${num(p.quota_ft * FT_M)} m)`);
const velocita = p => (p.velocita_kt == null ? '' : `${num(p.velocita_kt)} kn (${num(p.velocita_kt * KT_KMH)} km/h)`);
const verticale = p => (p.rateo_fpm == null || Math.abs(p.rateo_fpm) < 100 ? '' : `${p.rateo_fpm > 0 ? '+' : '−'}${num(Math.abs(p.rateo_fpm))} ft/min`);
const distanza = p => (p.distanza_nm == null ? '' : `${p.distanza_nm.toLocaleString(localeIntl(), { maximumFractionDigits: 1 })} mn (${num(p.distanza_nm * KT_KMH)} km)`);

export const titoloVolo = p => p.volo || p.matricola || p.id;

function righeVolo(p) {
  return righe([
    ['Stato', p.stato], ['Matricola', p.matricola], ['Modello', p.tipo], ['Quota', quota(p)], ['Velocità', velocita(p)],
    ['Rotta', p.rotta == null ? '' : `${p.rotta}°`], ['Velocità verticale', verticale(p)], ['Distanza dall\'aeroporto', distanza(p)],
  ]);
}

// Una voce per aereo sotto il clic.
export function voceVolo(p) {
  return {
    chiave: `volo-${p.id}`, tipo: 'volo', peso: PESO_LUOGO, strato: 'voli', titolo: titoloVolo(p), icona: 'aereo', badge: p.stato, sempre: true,
    gruppi: [{ righe: righeVolo(p) }],
    link: { testo: 'Segui il volo su adsb.lol', url: LINK + encodeURIComponent(p.id), icona: 'esterno', suggerimento: 'Mappa di adsb.lol con la traccia di questo aereo' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupVolo(p) {
  return { titolo: titoloVolo(p), sottotitolo: p.stato, righe: righeVolo(p).filter(r => r.etichetta !== 'Stato') };
}
