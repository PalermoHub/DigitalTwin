// Riassunto della scheda del luogo per il Chat bot: per ogni tab della scheda, le sezioni con i loro dati principali.
// Solo dati, nessuna interpretazione. Il modello è quello di scheda-modello.js; i testi restano italiani (identità del
// modello dati) e si traducono con tl() al momento di mostrarli.
import { tabScheda, MANCANTE } from './scheda-modello.js';

export const ORDINE_TAB = ['luogo', 'strumenti', 'mercato', 'popolazione', 'terreno', 'servizi', 'pnrr', 'opere'];
const MAX_VOCI = 4; // sezioni dettagliate per tab: le altre diventano un elenco di titoli
const MAX_DATI = 3; // righe per sezione

const utile = r => r.valore != null && r.valore !== '' && r.valore !== MANCANTE && String(r.valore).length <= 40 && !/codice|^id\b/i.test(r.etichetta);

function voce(s) {
  const dati = s.gruppi.flatMap(g => g.righe).filter(utile).slice(0, MAX_DATI).map(r => ({ etichetta: r.etichetta, valore: String(r.valore) }));
  const v = { chiave: s.chiave, titolo: s.titolo, badges: s.badges ?? (s.badge ? [s.badge] : []), dati };
  if (s.accordion?.elementi?.length) v.conteggio = s.accordion.elementi.length;
  return v;
}

// -> [{ tab, voci: [{ chiave, titolo, badges, dati: [{ etichetta, valore }], conteggio? }], altre: [titolo] }], nell'ordine dei tab della scheda
export function suntoScheda(sezioni) {
  const perTab = new Map();
  for (const s of sezioni) {
    const tab = tabScheda(s.peso, s.chiave);
    if (!ORDINE_TAB.includes(tab)) continue; // l'RNDT arriva dopo, dai servizi esterni: non si riassume
    perTab.set(tab, [...(perTab.get(tab) ?? []), s]);
  }
  return ORDINE_TAB.filter(tab => perTab.has(tab)).map(tab => {
    const lista = perTab.get(tab);
    return { tab, voci: lista.slice(0, MAX_VOCI).map(voce), altre: lista.slice(MAX_VOCI).map(s => s.titolo) };
  });
}

// Il Chat bot si costruisce al primo clic sul suo tab, dopo che la scheda può già essere aperta: l'ultimo riassunto si
// ricorda qui, fin dall'avvio dell'app, e il pannello lo legge quando nasce.
let ultime = [];
export const suntoRicordato = () => suntoScheda(ultime);
export function collegaSunto(bersaglio = document) {
  bersaglio.addEventListener('scheda:sunto', e => { ultime = e.detail?.sezioni ?? []; });
  bersaglio.addEventListener('scheda:chiusa', () => { ultime = []; });
}
