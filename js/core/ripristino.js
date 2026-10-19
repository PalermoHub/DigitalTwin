// Pulsante «Ripristina» nella barra di ricerca: con una selezione in mappa la toglie (come Esc); altrimenti cancella le personalizzazioni salvate nel browser
// (colori degli strati, righe nascoste nella scheda, ordine degli strati) e ricarica la pagina.
// I layer RNDT aggiunti dall'utente non si toccano: sono dati, non preferenze.
import { CHIAVE as CHIAVE_TEMI } from './tema.js';
import { CHIAVE_STORAGE as CHIAVE_SCHEDA } from './scheda-preferenze.js';
import { CHIAVE as CHIAVE_ORDINE } from './riordino.js';
import { CHIAVE_INVITO } from './invito.js';
import { PARAMETRO } from './condivisione-codec.js';
import { svuotaCesto } from './cesto-home.js';
import { t } from './i18n.js';

export const CHIAVI_PERSONALIZZAZIONI = [CHIAVE_TEMI, CHIAVE_SCHEDA, CHIAVE_ORDINE, CHIAVE_INVITO];

// Dopo il ripristino la pagina riparte senza lo stato del link (?v=…): è da lì che arrivano gli strati scelti nella home.
function ricaricaSenzaLink() {
  const u = new URL(location.href);
  u.searchParams.delete(PARAMETRO);
  u.hash = '';
  location.replace(u);
}

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

// `deseleziona` (se c'è) torna true quando ha tolto una selezione in mappa: il clic finisce lì, come con Esc;
// solo a mappa già libera parte il ripristino vero, con la conferma.
export function collegaRipristino(bottone, storage, ricarica = ricaricaSenzaLink, conferma = testo => window.confirm(testo), deseleziona = () => false) {
  bottone?.addEventListener('click', () => {
    if (deseleziona()) return;
    if (!conferma(t('ripristino.conferma'))) return;
    ripristinaPersonalizzazioni(storage);
    try { svuotaCesto(window.sessionStorage); } catch { /* storage non disponibile */ }
    ricarica();
  });
}
