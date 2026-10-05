// Pulsante «Ripristina» nella barra di ricerca: cancella le personalizzazioni salvate nel browser
// (colori degli strati, righe nascoste nella scheda, ordine degli strati) e ricarica la pagina.
// I layer RNDT aggiunti dall'utente non si toccano: sono dati, non preferenze.
import { CHIAVE as CHIAVE_TEMI } from './tema.js';
import { CHIAVE_STORAGE as CHIAVE_SCHEDA } from './scheda-preferenze.js';
import { CHIAVE as CHIAVE_ORDINE } from './riordino.js';
import { CHIAVE_INVITO } from './invito.js';

export const CHIAVI_PERSONALIZZAZIONI = [CHIAVE_TEMI, CHIAVE_SCHEDA, CHIAVE_ORDINE, CHIAVE_INVITO];

// Restituisce quante chiavi erano presenti. Lo storage può mancare o rifiutare l'operazione.
export function ripristinaPersonalizzazioni(storage) {
  let rimosse = 0;
  for (const chiave of CHIAVI_PERSONALIZZAZIONI) {
    try {
      if (storage?.getItem(chiave) != null) rimosse++;
      storage?.removeItem(chiave);
    } catch { /* storage bloccato: niente da ripristinare */ }
  }
  return rimosse;
}

export function collegaRipristino(bottone, storage, ricarica = () => location.reload(), conferma = testo => window.confirm(testo)) {
  bottone?.addEventListener('click', () => {
    if (!conferma('Ripristinare colori, schede, ordine degli strati e invito ai valori iniziali? I layer RNDT aggiunti restano.')) return;
    ripristinaPersonalizzazioni(storage);
    ricarica();
  });
}
