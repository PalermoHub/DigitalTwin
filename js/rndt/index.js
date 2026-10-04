// js/rndt/index.js
// Catalogo RNDT: assembla shim, pannello e plugin (caricato solo al primo uso) e offre alla scheda l'interrogazione dei layer.
import { creaHost } from './host.js';
import { creaPannello } from './pannello.js';
import { interrogaTutti, segnaposto } from './info.js';
import { leggi, salva } from './archivio.js';
import { anelliDaZone } from './area.js';
import { importaFile } from './importa.js';
import { librerie } from './librerie.js';
import { archivioIndexedDB } from './dati.js';
import { scegliProxy } from './proxy.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';

// Indirizzo del Worker (vedi docs/RNDT.md e proxy.js): in produzione è fisso
export const PROXY_RNDT = scegliProxy(location.search, location.hostname);
const PLUGIN = 'js/vendor/openrndt-geolibre/index.js';
const STILE = 'js/vendor/openrndt-geolibre/style.css';

export function collegaRndt(map, elementoPannello, gruppo) {
  const archivio = (() => { try { return window.localStorage; } catch { return null; } })();
  let anelli = [];
  // il confine comunale serve al filtro dei download; è lo stesso file delle zone, già in cache del browser
  const anelliPronti = fetch(urlDati('popolazione/confini_zone.json')).then(r => r.json()).then(z => { anelli = anelliDaZone(z); }).catch(() => {});

  const archivioDati = archivioIndexedDB();
  const pannello = creaPannello(elementoPannello);
  const host = creaHost({
    map, proxy: PROXY_RNDT, stato: leggi(archivio), scrivi: s => salva(archivio, s), anelli: () => anelli, notifica: segnala, pannello, archivioDati,
  });
  host.suCambio(() => pannello.disegnaElenco(host));

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

  let plugin = null;
  async function apri() {
    pannello.apri(); // subito visibile, con «Caricamento…» finché il plugin non è pronto
    if (plugin) return;
    try {
      await anelliPronti;
      document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: new URL(STILE, document.baseURI).href }));
      const modulo = await import(new URL(PLUGIN, document.baseURI).href);
      plugin = modulo.default;
      if (plugin.activate(host) === false) throw new Error('il plugin non è compatibile con questa mappa');
    } catch (errore) {
      plugin = null;
      pannello.errore(`Catalogo RNDT non disponibile: ${errore.message}`);
    }
  }

  gruppo?.collega(host, apri, carica); // gruppo «RNDT» della barra strati

  const dentro = (l, { lng, lat }) => {
    const b = l.sorgente?.bounds;
    return !b || (lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3]);
  };

  return {
    apri,
    segnaposto,
    layerAlPunto: lngLat => host.elenco().filter(l => l.visibile && !l.indisponibile && dentro(l, lngLat)),
    interroga: (layers, lngLat, point, zoom) => interrogaTutti({
      layers, lngLat: [lngLat.lng, lngLat.lat], zoom,
      leggiTesto: async url => new TextDecoder().decode(await host.fetchArrayBuffer(url)),
      featureAlPunto: l => host.featureAlPunto(l.id, point),
    }),
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}
