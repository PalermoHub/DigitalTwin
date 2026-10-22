import { righe } from '../core/scheda-util.js';
import { t, tl, localeIntl } from '../core/i18n.js';
import { puntoCardinale } from './satelliti-orbite.js';

// Modello puro dei satelliti visibili nel cielo di Palermo: stesse righe per il popup e per la scheda di destra (tab «Luogo»).
// Gli elementi orbitali arrivano dal Worker (/satelliti, da CelesTrak); posizioni e passaggi li calcola il browser (SGP4).

const FONTE = 'CelesTrak (elementi orbitali del Space Force, aggiornati più volte al giorno)';
const LINK = 'https://www.n2yo.com/satellite/?s=';
const PESO_LUOGO = 8;

export const GRUPPI = [['Stazioni spaziali', '#e8590c'], ['Più luminosi', '#1971c2']];
export const COLORE_ALTRO = '#1971c2';
export const coloreGruppo = g => (GRUPPI.find(([n]) => n === g) ?? [, COLORE_ALTRO])[1];
// il Worker dà il nome del gruppo di CelesTrak: qui diventa l'etichetta del filtro
export const NOME_GRUPPO = { stations: 'Stazioni spaziali', visual: 'Più luminosi' };

const num = (n, cifre = 0) => n.toLocaleString(localeIntl(), { maximumFractionDigits: cifre });
const ora = d => d.toLocaleTimeString(localeIntl(), { hour: '2-digit', minute: '2-digit' });
const giorno = (d, adesso) => (d.toDateString() === adesso.toDateString() ? '' : `${d.toLocaleDateString(localeIntl(), { day: 'numeric', month: 'short' })} `);
const direzione = p => `${num(p.elevazione)}° · ${puntoCardinale(p.azimut)} (${num(p.azimut)}°)`;

// «21:43 – 21:49 · alt. massima 62°»; con il satellite già in cielo: «in corso, fino alle 21:49 · alt. massima 62°»
export function testoPassaggio(passaggio, adesso = new Date()) {
  if (!passaggio) return t('satelliti.nessunPassaggio');
  const max = t('satelliti.altezzaMassima', { gradi: num(passaggio.elevazioneMax) });
  if (passaggio.in_corso) return `${t('satelliti.inCorso', { ora: passaggio.fine ? ora(passaggio.fine) : '—' })} · ${max}`;
  return `${giorno(passaggio.inizio, adesso)}${ora(passaggio.inizio)}${passaggio.fine ? ` – ${ora(passaggio.fine)}` : ''} · ${max}`;
}

export const sopraOrizzonte = p => p.elevazione >= 0;

function righeSatellite(p, passaggio, adesso) {
  return righe([
    ['Gruppo', NOME_GRUPPO[p.gruppo] ?? p.gruppo],
    ['Altezza sull\'orizzonte', sopraOrizzonte(p) ? direzione(p) : t('satelliti.sottoOrizzonte')],
    ['Distanza da Palermo', `${num(p.distanza_km)} km`],
    ['Quota', `${num(p.quota_km)} km`], ['Velocità', `${num(p.velocita_kms, 2)} km/s (${num(p.velocita_kms * 3600)} km/h)`],
    ['Sorvola', `${num(Math.abs(p.lat), 2)}° ${p.lat >= 0 ? 'N' : 'S'}, ${num(Math.abs(p.lng), 2)}° ${p.lng >= 0 ? 'E' : 'O'}`],
    ['Prossimo passaggio', testoPassaggio(passaggio, adesso)],
    ['Elementi orbitali', p.elementi_vecchi ? t('satelliti.elementiVecchi') : ''],
    ['Designazione', p.designazione],
  ]);
}

// Una voce per satellite sotto il clic. `passaggio` = risultato di prossimoPassaggio() (null: nessuno nelle prossime 24 ore).
export function voceSatellite(p, passaggio, adesso = new Date()) {
  return {
    chiave: `satellite-${p.id}`, tipo: 'satellite', peso: PESO_LUOGO, strato: 'satelliti', titolo: p.nome, icona: 'satellite', badge: NOME_GRUPPO[p.gruppo] ?? p.gruppo, sempre: true,
    gruppi: [{ righe: righeSatellite(p, passaggio, adesso) }],
    link: { testo: 'Segui il satellite su N2YO', url: LINK + encodeURIComponent(p.id), icona: 'esterno', suggerimento: 'Posizione e passaggi del satellite su N2YO' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupSatellite(p, passaggio, adesso = new Date()) {
  return {
    titolo: p.nome, sottotitolo: sopraOrizzonte(p) ? `${tl(NOME_GRUPPO[p.gruppo] ?? p.gruppo)} · ${direzione(p)}` : tl(NOME_GRUPPO[p.gruppo] ?? p.gruppo),
    righe: righeSatellite(p, passaggio, adesso).filter(r => !['Gruppo', 'Designazione'].includes(r.etichetta)),
  };
}
