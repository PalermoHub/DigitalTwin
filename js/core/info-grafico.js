// Icona «i» accanto al titolo di un grafico: apre un popup che spiega cosa rappresenta e come funziona.
// I testi stanno in js/locales/*.json come `info.<id>.titolo|cosa|come|leggere`; la stessa spiegazione va anche nella guida di Talia.
import { t } from './i18n.js';

const SEZIONI = ['cosa', 'come', 'leggere'];

function apriPopup(id) {
  const finestra = document.createElement('dialog');
  finestra.className = 'info-grafico-popup';
  finestra.setAttribute('aria-label', t(`info.${id}.titolo`));
  const titolo = document.createElement('h3');
  titolo.textContent = t(`info.${id}.titolo`);
  finestra.append(titolo);
  for (const s of SEZIONI) {
    const p = document.createElement('p');
    const et = document.createElement('strong');
    et.textContent = t(`info.sezione.${s}`);
    p.append(et, document.createElement('br'), t(`info.${id}.${s}`));
    finestra.append(p);
  }
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'info-grafico-chiudi';
  chiudi.textContent = t('info.chiudi');
  chiudi.addEventListener('click', () => finestra.close());
  finestra.append(chiudi);
  finestra.addEventListener('click', e => { if (e.target === finestra) finestra.close(); }); // clic sullo sfondo
  finestra.addEventListener('close', () => finestra.remove());
  document.body.append(finestra);
  finestra.showModal();
}

// Pulsante «i» per il grafico `id`
export function iconaInfo(id) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'info-grafico';
  b.textContent = 'i';
  const et = t('info.apri', { grafico: t(`info.${id}.titolo`) });
  b.title = et;
  b.setAttribute('aria-label', et);
  b.addEventListener('click', e => { e.stopPropagation(); apriPopup(id); });
  return b;
}

// Intestazione di un grafico: testo e icona sulla stessa riga. `tag`/`classe` = elemento da usare.
export function titoloConInfo(tag, classe, testo, id) {
  const h = document.createElement(tag);
  h.className = `${classe ?? ''} titolo-con-info`.trim();
  const s = document.createElement('span');
  s.textContent = testo;
  h.append(s, iconaInfo(id));
  return h;
}
