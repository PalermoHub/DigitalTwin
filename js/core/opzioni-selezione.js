// Opzioni della «Selezione in mappa» (le aree evidenziate dal clic): dettagli al passaggio del mouse e voci accese o spente.
// Si cambiano dal tab Opzioni del pannello sinistro e durano finché l'utente non cancella i dati del browser (localStorage).
// Un solo stato per tutta l'app; il browser (storage) arriva come parametro, così nei test basta un finto storage.

export const CHIAVE_TOOLTIP_SELEZIONE = 'dt-selezione-tooltip';
export const CHIAVE_VOCI_SPENTE = 'dt-selezione-spente';
export const CHIAVE_TOOLTIP_MAPPA = 'dt-tooltip-mappa';
export const EVENTO_SELEZIONE = 'dt:selezione-opzioni'; // sul document a ogni cambio: mappa e pannello si allineano

let tooltip = true;
let spente = new Set();
export const tooltipSelezioneAttivo = () => tooltip;
export const vociSpente = () => spente;
export const vocePresente = etichetta => !spente.has(etichetta);

const avvisa = () => { if (typeof document !== 'undefined') document.dispatchEvent(new Event(EVENTO_SELEZIONE)); };
const scrivi = (storage, chiave, valore) => { try { storage?.setItem(chiave, valore); } catch { /* storage bloccato: vale la sessione */ } };

export function caricaOpzioniSelezione(storage) {
  try { tooltip = storage?.getItem(CHIAVE_TOOLTIP_SELEZIONE) !== '0'; } catch { tooltip = true; }
  try {
    const letto = JSON.parse(storage?.getItem(CHIAVE_VOCI_SPENTE) ?? '[]');
    spente = new Set(Array.isArray(letto) ? letto.filter(e => typeof e === 'string') : []);
  } catch { spente = new Set(); }
}

export function impostaTooltipSelezione(v, storage = null) {
  tooltip = Boolean(v);
  scrivi(storage, CHIAVE_TOOLTIP_SELEZIONE, tooltip ? '1' : '0');
  avvisa();
}

// Accende o spegne una voce (per etichetta, es. «Edificio»); `etichette` + `acceso` agiscono su più voci insieme.
export function impostaVoci(etichette, acceso, storage = null) {
  for (const e of etichette) { if (acceso) spente.delete(e); else spente.add(e); }
  scrivi(storage, CHIAVE_VOCI_SPENTE, JSON.stringify([...spente]));
  avvisa();
}

// Tooltip sulla mappa (quello dei layer): acceso all'inizio; lo legge il pannello all'avvio e lo salva a ogni cambio.
export function leggiTooltipMappa(storage) {
  try { return storage?.getItem(CHIAVE_TOOLTIP_MAPPA) !== '0'; } catch { return true; }
}
export function salvaTooltipMappa(v, storage = null) { scrivi(storage, CHIAVE_TOOLTIP_MAPPA, v ? '1' : '0'); }
