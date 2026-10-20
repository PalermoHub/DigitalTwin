// Schermo intero automatico sulla sola pagina della mappa e solo da telefono: nasconde le barre del browser.
// Il browser lo concede solo dopo un gesto dell'utente: scatta al primo tocco. Se l'utente ne esce non si riattiva da solo
// (resta il pulsante dello schermo intero). Dove non esiste (iPhone) non fa nulla.
export function collegaSchermoInteroMobile(doc, win) {
  const telefono = win.matchMedia?.('(max-width: 720px) and (pointer: coarse)').matches;
  if (!telefono || !doc.fullscreenEnabled || !doc.documentElement.requestFullscreen) return null;
  const entra = () => {
    win.removeEventListener('pointerup', entra, true);
    if (!doc.fullscreenElement) doc.documentElement.requestFullscreen().catch(() => { /* rifiutato: resta il pulsante */ });
  };
  win.addEventListener('pointerup', entra, true);
  return entra;
}
