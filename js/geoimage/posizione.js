// js/geoimage/posizione.js
// Sezione «Posiziona overlay»: frecce, rotazione, scala, adatta, reset, blocco delle maniglie, scala/deforma, Annulla e Ripeti.
import { sposta, ruota, scala, passo } from './geometria.js';
import { t } from '../core/i18n.js';

const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export function collegaPosizione(ctx) {
  const { $, stato, storico, maniglie } = ctx;
  const cambia = f => { if (!stato.angoli) return; ctx.impostaAngoli(f(stato.angoli)); ctx.conferma(); };

  $('su').addEventListener('click', () => cambia(a => sposta(a, passo(a), 0)));
  $('giu').addEventListener('click', () => cambia(a => sposta(a, -passo(a), 0)));
  $('sinistra').addEventListener('click', () => cambia(a => sposta(a, 0, -passo(a))));
  $('destra').addEventListener('click', () => cambia(a => sposta(a, 0, passo(a))));
  $('ruota-sx').addEventListener('click', () => cambia(a => ruota(a, -5)));
  $('ruota-dx').addEventListener('click', () => cambia(a => ruota(a, 5)));
  $('meno').addEventListener('click', () => cambia(a => scala(a, 0.9)));
  $('piu').addEventListener('click', () => cambia(a => scala(a, 1.1)));
  $('adatta').addEventListener('click', () => { if (stato.angoli) ctx.inquadra(stato.angoli, 17); });
  $('reset').addEventListener('click', () => {
    if (!stato.angoliIniziali) return;
    cambia(() => copia(stato.angoliIniziali));
    ctx.inquadra(stato.angoli);
    ctx.messaggio(t('gi.posizione.reset'));
  });

  $('blocca').addEventListener('click', () => { maniglie.blocca(!maniglie.bloccate()); ctx.cambiato(); });
  $('modo').addEventListener('click', () => { maniglie.cambiaModo(maniglie.modo() === 'scala' ? 'deforma' : 'scala'); ctx.cambiato(); });

  const torna = angoli => { if (!angoli) return; ctx.impostaAngoli(angoli); ctx.cambiato(); };
  const annulla = passi => torna(storico.annulla(passi));
  const ripeti = passi => torna(storico.ripeti(passi));
  $('annulla').addEventListener('click', e => annulla(e.shiftKey ? 10 : 1));
  $('ripeti').addEventListener('click', e => ripeti(e.shiftKey ? 10 : 1));

  ctx.sulTasto(e => {
    const tasto = e.key.toLowerCase();
    if (e.ctrlKey && tasto === 'z') { annulla(e.shiftKey ? 10 : 1); return true; }
    if (e.ctrlKey && tasto === 'y') { ripeti(e.shiftKey ? 10 : 1); return true; }
    if (!e.ctrlKey && !e.metaKey && tasto === 'l' && stato.immagine) { $('blocca').click(); return true; }
    return false;
  });

  ctx.sulCambio(() => {
    $('annulla').disabled = !storico.puoAnnullare();
    $('ripeti').disabled = !storico.puoRipetere();
    const bloccate = maniglie.bloccate();
    $('blocca').textContent = bloccate ? t('gi.sblocca') : t('gi.blocca');
    $('blocca').setAttribute('aria-pressed', String(bloccate));
    $('modo').textContent = maniglie.modo() === 'scala' ? t('gi.maniglie.scala') : t('gi.maniglie.deforma');
    $('modo').disabled = bloccate;
  });
}
