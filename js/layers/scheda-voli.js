import { righe } from '../core/scheda-util.js';
import { t, tl, localeIntl } from '../core/i18n.js';

// Modello puro degli aerei in volo attorno a Palermo: stesse righe per il popup e per la scheda di destra (tab «Luogo»).
// I dati arrivano dal Worker (/voli), che li prende da adsb.lol: origine e destinazione non sono nella fonte, lo stato è dedotto.
// Il volo di linea (orari, gate, ritardo) viene da Gesap, via Worker (/aeroporto): /voli lo aggiunge agli aerei di cui riconosce il nominativo (campi «linea_»).

const FONTE = 'adsb.lol (ricevitori ADS-B di volontari) — ODbL 1.0';
const LINK = 'https://globe.adsb.lol/?icao=';
const FONTE_GESAP = 'Gesap, Aeroporto di Palermo (aeroportodipalermo.it)';
const LINK_GESAP = 'https://www.aeroportodipalermo.it/voli/';
const PESO_LUOGO = 8;
const SOGLIA_MIN = 5; // come nel Worker: sotto questa differenza il volo è «in orario»
export const SOGLIA_GRAVE_MIN = 15; // ritardo importante: accende il segnale sull'icona dell'aeroporto
const PROSSIMI = 8; // voli per elenco nella scheda dell'aeroporto
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

// Ritardo in parole: «In orario», «In ritardo di 21 min», «In anticipo di 7 min», «Cancellato».
export function testoRitardo(minuti, cancellato) {
  if (cancellato) return t('voli.cancellato');
  if (typeof minuti !== 'number') return '';
  if (minuti >= SOGLIA_MIN) return t('voli.ritardo', { min: minuti });
  if (minuti <= -SOGLIA_MIN) return t('voli.anticipo', { min: -minuti });
  return t('voli.inOrario');
}

const ritardoAereo = p => (p.linea_volo ? testoRitardo(p.linea_ritardo_min, p.linea_cancellato) : '');
const fuoriOrario = p => !!p.linea_volo && (p.linea_cancellato || Math.abs(p.linea_ritardo_min ?? 0) >= SOGLIA_MIN);
const orario = (ora, dopo) => (ora ? (dopo ? `${ora} (${t('voli.giornoDopo')})` : ora) : '');

function righeVolo(p) {
  return righe([
    ['Stato', p.stato], ['Matricola', p.matricola], ['Modello', p.tipo], ['Quota', quota(p)], ['Velocità', velocita(p)],
    ['Rotta', p.rotta == null ? '' : `${p.rotta}°`], ['Velocità verticale', verticale(p)], ['Distanza dall\'aeroporto', distanza(p)],
  ]);
}

// Il volo di linea dell'aereo (solo se il Worker l'ha riconosciuto): numero, ritardo, città, orari e gate.
function righeLinea(p) {
  if (!p.linea_volo) return [];
  return righe([
    ['Volo di linea', `${p.linea_volo} · ${p.linea_compagnia}`], ['Ritardo', ritardoAereo(p)],
    [p.linea_direzione === 'arrivo' ? 'Provenienza' : 'Destinazione', p.linea_citta],
    ['Orario programmato', p.linea_programmato], ['Orario stimato', p.linea_cancellato ? '' : orario(p.linea_stimato, p.linea_stimato_giorno_dopo)],
    ['Gate', p.linea_gate],
  ]);
}

// Una voce per aereo sotto il clic.
export function voceVolo(p) {
  const linea = righeLinea(p);
  return {
    chiave: `volo-${p.id}`, tipo: 'volo', peso: PESO_LUOGO, strato: 'voli', titolo: titoloVolo(p), icona: 'aereo', badge: p.stato, sempre: true,
    gruppi: [...(linea.length ? [{ titolo: 'Volo di linea', righe: linea }] : []), { righe: righeVolo(p) }],
    link: { testo: 'Segui il volo su adsb.lol', url: LINK + encodeURIComponent(p.id), icona: 'esterno', suggerimento: 'Mappa di adsb.lol con la traccia di questo aereo' },
    fonte: t('layer.fonte', { fonte: linea.length ? `${tl(FONTE)}; ${tl(FONTE_GESAP)}` : tl(FONTE) }),
  };
}

export function modelloPopupVolo(p) {
  return {
    titolo: titoloVolo(p), sottotitolo: fuoriOrario(p) ? `${tl(p.stato)} · ${ritardoAereo(p)}` : p.stato,
    righe: [...righeLinea(p), ...righeVolo(p)].filter(r => r.etichetta !== 'Stato'),
  };
}

// ---- Aeroporto: arrivi e partenze di oggi da Gesap (risposta di /aeroporto)

const CONCLUSO = /ATTERRAT|PARTIT|DECOLLAT/i;
const prossimi = voli => voli.filter(v => !CONCLUSO.test(v.stato)).slice(0, PROSSIMI);
const gravi = voli => voli.filter(v => v.cancellato || (v.ritardo_min ?? 0) >= SOGLIA_GRAVE_MIN);

// Segnale sull'icona: c'è almeno un volo cancellato o in ritardo di 15 minuti o più, tra quelli non ancora conclusi.
export const aeroportoInAllerta = dati => !!dati && gravi([...dati.arrivi, ...dati.partenze].filter(v => !CONCLUSO.test(v.stato))).length > 0;

const rigaElenco = v => ({
  etichetta: `${v.programmato} · ${v.volo}`,
  valore: [v.citta, testoRitardo(v.ritardo_min, v.cancellato), v.gate ? `${t('voli.gate')} ${v.gate}` : ''].filter(Boolean).join(' · '),
});

const oraAgg = dati => (dati.aggiornato ? dati.aggiornato.slice(11, 16) : '');

export function gruppiAeroporto(dati) {
  const r = dati.riepilogo;
  return [
    {
      titolo: 'Oggi', righe: righe([['Aggiornato alle', oraAgg(dati)]]),
      griglia: [{ valore: String(r.ritardati), chiave: 'Voli in ritardo' }, { valore: String(r.cancellati), chiave: 'Cancellati' }, { valore: r.ritardati ? `${r.ritardo_medio_min} min` : '—', chiave: 'Ritardo medio' }],
    },
    { titolo: 'Prossime partenze', righe: prossimi(dati.partenze).map(rigaElenco) },
    { titolo: 'Prossimi arrivi', righe: prossimi(dati.arrivi).map(rigaElenco) },
  ].filter(g => g.griglia || g.righe.length);
}

// Scheda dell'aeroporto: i dati di Gesap (se arrivati) e le informazioni fisse. `dati` = null se /aeroporto non risponde.
export function voceAeroporto(dati) {
  return {
    chiave: 'volo-aeroporto', tipo: 'volo', peso: PESO_LUOGO, strato: 'voli', titolo: 'Aeroporto di Palermo (PMO)', icona: 'aereo', sempre: true,
    badge: dati && aeroportoInAllerta(dati) ? t('voli.conRitardi') : undefined,
    gruppi: [
      { righe: righe([['Aeroporto', 'Falcone e Borsellino, Punta Raisi'], ['Codice IATA / ICAO', 'PMO / LICJ'], ['Orari dei voli', dati ? '' : t('voli.aeroportoNonDisponibile')]]) },
      ...(dati ? gruppiAeroporto(dati) : []),
    ],
    link: { testo: 'Tutti i voli sul sito dell\'aeroporto', url: LINK_GESAP, icona: 'esterno', suggerimento: 'Arrivi e partenze sul sito di Gesap' },
    fonte: t('layer.fonte', { fonte: tl(FONTE_GESAP) }),
  };
}

export function modelloPopupAeroporto(dati) {
  const base = [['Codice IATA / ICAO', 'PMO / LICJ']];
  if (!dati) return { titolo: 'Aeroporto di Palermo (PMO)', sottotitolo: t('voli.aeroportoNonDisponibile'), righe: righe(base) };
  const r = dati.riepilogo;
  const prossimo = v => (v ? `${v.programmato} · ${v.volo} · ${v.citta}` : '');
  return {
    titolo: 'Aeroporto di Palermo (PMO)', sottotitolo: aeroportoInAllerta(dati) ? t('voli.conRitardi') : t('voli.regolare'),
    righe: righe([...base, ['Voli in ritardo', String(r.ritardati)], ['Cancellati', String(r.cancellati)], ['Ritardo medio', r.ritardati ? `${r.ritardo_medio_min} min` : ''],
      ['Prossima partenza', prossimo(prossimi(dati.partenze)[0])], ['Prossimo arrivo', prossimo(prossimi(dati.arrivi)[0])]]),
  };
}
