import { descriviAggiornamento } from './colonnine-live.js';

// Modello puro delle colonnine di ricarica: stesse righe per il popup e per la scheda di destra.
const FONTE = 'Fonte: GSE, Piattaforma Unica Nazionale (PUN), tramite PalermoHub/evcharginglogsicilia — CC BY 4.0';

// Peso 90 = tab «Servizi su strada» della scheda (colonnine, e in futuro distributori e altri servizi lungo la strada), una card per servizio.
export const PESO_SERVIZI = 90;
const APPROFONDISCI = 'https://palermohub.github.io/evcharginglogsicilia/';

const righe = coppie => coppie.filter(([, valore]) => valore).map(([etichetta, valore]) => ({ etichetta, valore }));
const kw = p => (p.potenza_kw ? `${String(p.potenza_kw).replace('.', ',')} kW${p.corrente ? ` (${p.corrente})` : ''}` : '');

export function modelloPopupColonnina(p) {
  return {
    titolo: p.operatore || 'Colonnina di ricarica', sottotitolo: p.stato,
    righe: righe([['Indirizzo', p.indirizzo], ['Potenza', kw(p)], ['Connettore', p.connettore], ['Connettori', String(p.n_connettori)]]),
  };
}

const piu = (n, uno, molti) => (n === 1 ? `1 ${uno}` : `${n} ${molti}`);

function righeColonnina(p) {
  return righe([
    ['Operatore', p.operatore], ['Indirizzo', p.indirizzo], ['Potenza', kw(p)], ['Connettore', p.connettore], ['Connettori', String(p.n_connettori)],
    ['Orario', p.h24 ? 'Sempre aperta (24 ore su 24)' : ''],
    ['Stato', p.tempo_reale ? '' : 'Non aggiornato in tempo reale dall\'operatore'],
  ]);
}

// Una sola sezione «Colonnine di ricarica» (come i vincoli PAI sovrapposti): una card a fisarmonica per colonnina, con stato a destra
// e pulsante «Mappa» per accendere lo strato; sopra l'elenco i grafici (`grafici`: funzione che costruisce il contenuto). Sta nel tab «Servizi su strada».
export function vociColonnine(punti, aggiornato = '', grafici = null) {
  if (!punti.length) return [];
  const quando = descriviAggiornamento(aggiornato).replace(',', '');
  const disponibili = punti.filter(p => p.stato === 'Disponibile').length;
  return [{
    chiave: 'colonnine:gruppo', peso: PESO_SERVIZI, titolo: 'Colonnine di ricarica', icona: 'colonnina', badge: piu(punti.length, 'colonnina', 'colonnine'), sempre: true,
    gruppi: [],
    ...(grafici && { dinamico: grafici }), // grafici di tutte le colonnine del comune, sopra l'elenco
    accordion: {
      icona: 'colonnina', suggerimento: 'Seleziona una colonnina per vedere i dettagli',
      riassunto: `${piu(punti.length, 'colonnina', 'colonnine')}${disponibili ? ` · ${piu(disponibili, 'disponibile', 'disponibili')}` : ''}`,
      elementi: punti.map(p => ({ strato: 'colonnine', titolo: p.indirizzo || p.operatore || 'Colonnina di ricarica', anteprima: p.stato, righe: righeColonnina(p) })),
    },
    link: { testo: 'Statistiche e serie storica', url: APPROFONDISCI, icona: 'esterno', suggerimento: 'EVChargingLogSicilia (PalermoHub): uso, trend e previsioni delle colonnine' },
    fonte: quando ? `${FONTE}\nStato aggiornato al ${quando}` : FONTE,
  }];
}
