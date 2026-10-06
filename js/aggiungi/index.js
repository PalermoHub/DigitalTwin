// js/aggiungi/index.js
// «Aggiungi layer»: assembla host (prefisso «miei», memoria propria), controllo, pannello e caricamento dei file.
import { creaHost } from '../rndt/host.js';
import { creaControllo } from './controllo.js';
import { creaPannello } from './pannello.js';
import { leggi, salva, CHIAVE_MIEI } from '../rndt/archivio.js';
import { anelliDaZone } from '../rndt/area.js';
import { importaFile, ESTENSIONI } from '../rndt/importa.js';
import { librerie } from '../rndt/librerie.js';
import { archivioIndexedDB } from '../rndt/dati.js';
import { PROXY_RNDT } from '../rndt/index.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';

export function collegaAggiungi(map, elementoPannello, gruppo) {
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  let anelli = [];
  // il confine comunale serve al filtro sui file e sui WFS; è lo stesso file delle zone, già in cache del browser
  const anelliPronti = fetch(urlDati('popolazione/confini_zone.json')).then(r => r.json()).then(z => { anelli = anelliDaZone(z); }).catch(() => {});

  const host = creaHost({
    map, proxy: PROXY_RNDT, prefisso: 'miei', etichetta: 'aggiunti', stato: leggi(storage, CHIAVE_MIEI),
    scrivi: s => salva(storage, s, CHIAVE_MIEI), anelli: () => anelli, notifica: segnala, archivioDati: archivioIndexedDB(),
  });
  const controllo = creaControllo({ host, storage });

  // Un file dal computer: legge, riconduce a GeoJSON WGS84 e lo aggiunge come layer. Gli errori si mostrano, non si lanciano.
  async function carica(file) {
    try {
      await anelliPronti; // il filtro sul confine di Palermo ha bisogno del confine
      const { nome, fc, avvisi } = await importaFile(file, librerie);
      for (const a of avvisi) segnala(`${file.name}: ${a}`);
      host.addFileLayer(nome, fc);
    } catch (errore) {
      segnala(`Non carico «${file.name}»: ${errore.message}`);
    }
  }

  const selettore = Object.assign(document.createElement('input'), { type: 'file', multiple: true, accept: ESTENSIONI.join(','), hidden: true });
  selettore.addEventListener('change', async () => {
    const files = [...selettore.files];
    selettore.value = ''; // permette di riscegliere lo stesso file
    for (const file of files) await carica(file);
  });
  document.body.append(selettore);

  const pannello = creaPannello(elementoPannello, controllo, { selezionaFile: () => selettore.click(), avvisa: segnala });
  gruppo?.collega(host, pannello.apri, carica);

  return {
    apri: pannello.apri,
    chiudi: pannello.chiudi,
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}
