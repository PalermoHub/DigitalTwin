// js/geoimage/immagine.js
// Sezione «Immagine storica»: scelta o trascinamento del file, informazioni, rimozione e opacità.
import { preparaSchermo } from './overlay.js';
import { angoliIniziali } from './geometria.js';
import { t } from '../core/i18n.js';

const leggiFile = file => new Promise((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => ko(new Error(t('err.fileNonLeggibile')));
  r.readAsDataURL(file);
});

export function collegaImmagine(ctx) {
  const { $, map, stato } = ctx;

  async function carica(file) {
    if (!file?.type.startsWith('image/')) return ctx.avvisa(t('gi.errore.tipoFile'));
    const id = ctx.prenota();
    try {
      const dataUrl = await leggiFile(file);
      const schermo = await preparaSchermo(dataUrl);
      if (!ctx.attuale(id)) return; // nel frattempo ne è stata scelta un'altra
      const immagine = { dataUrl, nome: file.name, larghezza: schermo.originaleL, altezza: schermo.originaleA };
      const b = map.getBounds();
      const c = map.getCenter();
      const angoli = angoliIniziali({ centro: { lat: c.lat, lng: c.lng }, nord: b.getNorth(), sud: b.getSouth(), est: b.getEast(), ovest: b.getWest() }, immagine.larghezza, immagine.altezza);
      ctx.caricaImmagine(immagine, schermo, angoli);
      ctx.inquadra(angoli);
      ctx.messaggio(t('gi.immagine.caricata'));
    } catch (errore) {
      ctx.avvisa(t('gi.errore.nonCarico', { file: file.name, msg: errore.message }));
    }
  }

  const zona = $('zona');
  zona.addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', e => { carica(e.target.files[0]); e.target.value = ''; });
  zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('trascina'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('trascina'));
  zona.addEventListener('drop', e => { e.preventDefault(); zona.classList.remove('trascina'); carica(e.dataTransfer.files[0]); });
  $('rimuovi').addEventListener('click', () => { ctx.rimuoviImmagine(); ctx.messaggio(t('gi.immagine.rimossa')); });

  $('opacita').addEventListener('input', () => {
    stato.opacita = Number($('opacita').value) / 100;
    ctx.overlay.opacita(stato.opacita);
    $('opacita-val').textContent = `${$('opacita').value}%`;
    ctx.cambiato();
  });

  ctx.sulCaricamento(() => {
    const c = !!stato.immagine;
    zona.classList.toggle('ha-immagine', c);
    zona.querySelector('strong').textContent = c ? stato.immagine.nome : t('gi.zona');
    $('info').textContent = c ? `${stato.immagine.larghezza}×${stato.immagine.altezza} px` : '';
    $('rimuovi').hidden = !c;
    const pct = Math.round(stato.opacita * 100);
    $('opacita').value = String(pct);
    $('opacita-val').textContent = `${pct}%`;
  });
}
