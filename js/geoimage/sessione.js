// js/geoimage/sessione.js
// Il progetto si ricorda (archivio.js) e si scambia come file JSON (progetto.js, formato di Geoimage).
import { leggi, salva, elimina, ID_IMMAGINE } from './archivio.js';
import { serializza, daTesto } from './progetto.js';
import { preparaSchermo } from './overlay.js';
import { nomeBase } from './export.js';
import { scarica } from './scarica.js';
import { archivioIndexedDB } from '../rndt/dati.js';
import { t } from '../core/i18n.js';

const storageSicuro = () => { try { return window.localStorage; } catch { return null; } };

export function collegaSessione(ctx) {
  const { $, stato } = ctx;
  const storage = storageSicuro();
  const dati = archivioIndexedDB(); // null senza IndexedDB: il progetto vale solo per questa sessione
  let avvisato = false;
  const avvisaUnaVolta = testo => { if (!avvisato) { avvisato = true; ctx.avvisa(testo); } };

  const parametri = () => ({
    nome: stato.immagine.nome, larghezza: stato.immagine.larghezza, altezza: stato.immagine.altezza,
    angoli: stato.angoli, angoliIniziali: stato.angoliIniziali, opacita: stato.opacita, tipo: stato.tipo, gcp: stato.gcp,
  });

  // i parametri si salvano solo se l'immagine che descrivono è in archivio: altrimenti, al riavvio, si accoppierebbero a un'altra
  let immagineInArchivio = false;

  function salvaOra() {
    if (!stato.immagine || !immagineInArchivio) return;
    if (!salva(storage, parametri())) avvisaUnaVolta(t('gi.sessione.nonSalva'));
  }

  let timer = null;
  ctx.sulCambio(() => { clearTimeout(timer); timer = setTimeout(salvaOra, 300); });

  ctx.sulCaricamento(origine => {
    if (origine === 'ripristino') { immagineInArchivio = true; return; }
    immagineInArchivio = false;
    if (!stato.immagine) {
      elimina(storage);
      dati?.elimina(ID_IMMAGINE).catch(() => {});
      return;
    }
    if (!dati) return avvisaUnaVolta(t('gi.sessione.grande'));
    const questa = stato.immagine;
    dati.scrivi(ID_IMMAGINE, questa.dataUrl).then(() => {
      if (stato.immagine !== questa) return; // nel frattempo è cambiata: ci pensa il suo caricamento
      immagineInArchivio = true;
      salvaOra();
    }).catch(() => {
      // l'archivio può ancora contenere l'immagine precedente: meglio dimenticare tutto che ripristinare un'accoppiata sbagliata
      elimina(storage);
      dati.elimina(ID_IMMAGINE).catch(() => {});
      avvisaUnaVolta(t('gi.sessione.nonSalvaImmagine'));
    });
  });

  ctx.sulTasto(e => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's' || !stato.immagine) return false;
    salvaOra();
    ctx.messaggio(t('gi.sessione.salvato'));
    return true;
  });

  $('json-esporta').addEventListener('click', () => {
    if (!stato.immagine) return;
    scarica(new Blob([JSON.stringify(serializza(stato), null, 2)], { type: 'application/json' }), `${nomeBase(stato.immagine.nome)}_geoimage.json`);
    ctx.messaggio(t('gi.sessione.esportato'));
  });
  $('json-importa').addEventListener('click', () => $('json-file').click());
  $('json-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const id = ctx.prenota();
    try {
      const p = daTesto(await file.text());
      const schermo = await preparaSchermo(p.immagine.dataUrl);
      if (!ctx.attuale(id)) return;
      ctx.caricaImmagine({ ...p.immagine, larghezza: schermo.originaleL, altezza: schermo.originaleA }, schermo, p.angoli, { gcp: p.gcp, opacita: p.opacita, tipo: p.tipo, iniziali: p.angoliIniziali, origine: 'progetto' });
      ctx.inquadra(p.angoli, 17);
      ctx.messaggio(t('gi.sessione.caricato'));
    } catch (errore) {
      ctx.avvisa(t('gi.errore.nonApro', { file: file.name, msg: errore.message }));
    }
  });

  // all'avvio: se c'è un progetto salvato e la sua immagine, torna sulla mappa
  async function ripristina() {
    const p = leggi(storage);
    if (!p || !dati) return;
    const id = ctx.prenota();
    try {
      const dataUrl = await dati.leggi(ID_IMMAGINE);
      if (typeof dataUrl !== 'string') return elimina(storage); // i parametri senza immagine non servono
      const schermo = await preparaSchermo(dataUrl);
      if (!ctx.attuale(id)) return; // l'utente ha già caricato, importato o tolto un'immagine
      ctx.caricaImmagine({ dataUrl, nome: p.nome, larghezza: p.larghezza, altezza: p.altezza }, schermo, p.angoli, { gcp: p.gcp, opacita: p.opacita, tipo: p.tipo, iniziali: p.angoliIniziali, origine: 'ripristino' });
    } catch {
      /* immagine rovinata o archivio non raggiungibile: si riparte vuoti, il progetto vecchio non blocca nulla */
    }
  }

  return { ripristina, salvaOra };
}
