// js/aggiungi/index.js
// «I miei layer»: assembla host (prefisso «miei», memoria propria), controllo, credenziali in memoria e albero.
import { creaHost } from '../rndt/host.js';
import { creaControllo } from './controllo.js';
import { creaCredenziali, ospiteDi } from './credenziali.js';
import { creaAlbero } from './albero.js';
import { leggi, salva, CHIAVE_MIEI } from '../rndt/archivio.js';
import { anelliDaZone } from '../rndt/area.js';
import { importaFile } from '../rndt/importa.js';
import { scaricaComeFile } from './da-url.js';
import { librerie } from '../rndt/librerie.js';
import { archivioIndexedDB } from '../rndt/dati.js';
import { PROXY_RNDT } from '../rndt/index.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';
import { t } from '../core/i18n.js';
import { sopraLeBasi } from '../layers/base.js';

export function collegaAggiungi(map, gruppo) {
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  let anelli = [];
  // il confine comunale serve al filtro sui file e sui WFS; è lo stesso file delle zone, già in cache del browser
  const anelliPronti = fetch(urlDati('popolazione/confini_zone.json')).then(r => r.json()).then(z => { anelli = anelliDaZone(z); }).catch(() => {});

  const credenziali = creaCredenziali(); // solo in memoria: spariscono con la pagina
  let controllo = null;
  const host = creaHost({
    map, proxy: PROXY_RNDT, prefisso: 'miei', etichetta: 'aggiunti', sopraBasi: () => sopraLeBasi(map), stato: leggi(storage, CHIAVE_MIEI),
    scrivi: s => salva(storage, s, CHIAVE_MIEI), anelli: () => anelli, notifica: segnala, archivioDati: archivioIndexedDB(),
    autorizzazione: url => credenziali.intestazione(ospiteDi(url)),
    protetto: url => controllo?.protetto(url) ?? false,
    riscrivi: url => credenziali.conToken(url), // il token ArcGIS si aggiunge alla richiesta, mai all'URL del layer
  });
  controllo = creaControllo({ host, storage, credenziali });
  // i tile (WMS, XYZ) li chiede MapLibre: l'intestazione si aggiunge solo alle richieste dirette al nostro proxy
  map.setTransformRequest(url => {
    const auth = credenziali.perUrlProxy(PROXY_RNDT, url);
    const finale = credenziali.riscriviPerProxy(PROXY_RNDT, url);
    return auth ? { url: finale, headers: { authorization: auth } } : { url: finale };
  });

  // Un file dal computer: legge, riconduce a GeoJSON WGS84 e lo aggiunge come layer. Gli errori si mostrano, non si lanciano.
  async function carica(file) {
    try {
      await anelliPronti; // il filtro sul confine di Palermo ha bisogno del confine
      const { nome, fc, avvisi } = await importaFile(file, librerie);
      for (const a of avvisi) segnala(`${file.name}: ${a}`);
      host.addFileLayer(nome, fc);
    } catch (errore) {
      segnala(t('aggiungi.nonCarico', { file: file.name, msg: errore.message }));
    }
  }

  // Un file da un indirizzo https: gli errori di rete tornano al modulo, quelli di lettura li mostra carica()
  const caricaDaUrl = async testo => carica(await scaricaComeFile(testo, PROXY_RNDT));

  gruppo.collega(host, () => {}, carica, () => creaAlbero({ controllo, carica, caricaDaUrl, avvisa: segnala }));

  return {
    host,
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}
