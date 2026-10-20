// Invito a installare il sito come app, solo da telefono: da app il browser non mostra le sue barre e la mappa guadagna spazio.
// Su Chrome/Edge Android usa il prompt nativo (beforeinstallprompt); su iPhone e dove il prompt non arriva spiega i passi a mano.
// Non compare se il sito è già aperto come app; «Non ora» lo spegne per sempre.
import { t } from './i18n.js';
export const CHIAVE_INSTALLA = 'dt.installa.no';
export const RITARDO_INSTALLA = 12000; // dopo l'invito a toccare la mappa, per non sovrapporli

export function collegaInstallazione(doc, win, archivio, { ritardo = RITARDO_INSTALLA, adesso = (f, ms) => win.setTimeout(f, ms) } = {}) {
  let spento = false;
  try { spento = archivio?.getItem(CHIAVE_INSTALLA) === '1'; } catch { /* storage bloccato: l'invito si mostra */ }
  const app = win.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches || win.navigator?.standalone === true;
  const telefono = win.matchMedia?.('(max-width: 720px) and (pointer: coarse)').matches;
  if (spento || app || !telefono) return null;
  let proposta = null;
  win.addEventListener('beforeinstallprompt', e => { e.preventDefault(); proposta = e; });
  const ios = /iPhone|iPad|iPod/.test(win.navigator?.userAgent ?? '');
  adesso(() => {
    const radice = doc.createElement('div');
    radice.className = 'invito-installa';
    radice.setAttribute('role', 'dialog');
    radice.setAttribute('aria-label', t('installa.titolo'));
    const testo = doc.createElement('p');
    testo.textContent = t('installa.perche');
    const passi = doc.createElement('p');
    passi.className = 'invito-installa-passi';
    passi.textContent = t(ios ? 'installa.passi.ios' : 'installa.passi.android');
    const installa = doc.createElement('button');
    installa.type = 'button';
    installa.className = 'invito-installa-si';
    installa.textContent = t('installa.installa');
    const no = doc.createElement('button');
    no.type = 'button';
    no.className = 'invito-installa-no';
    no.textContent = t('installa.no');
    const azioni = doc.createElement('div');
    azioni.append(...(proposta ? [installa, no] : [no]));
    radice.append(testo, ...(proposta ? [] : [passi]), azioni);
    doc.body.append(radice);
    const chiudi = () => radice.remove();
    installa.addEventListener('click', async () => { chiudi(); proposta.prompt(); await proposta.userChoice?.catch(() => {}); });
    no.addEventListener('click', () => {
      chiudi();
      try { archivio?.setItem(CHIAVE_INSTALLA, '1'); } catch { /* si ripresenta al prossimo avvio */ }
    });
    win.addEventListener('appinstalled', chiudi);
  }, ritardo);
  return true;
}
