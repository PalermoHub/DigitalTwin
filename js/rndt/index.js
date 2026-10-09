// js/rndt/index.js
// Catalogo RNDT: assembla shim, pannello e plugin (caricato solo al primo uso) e offre alla scheda l'interrogazione dei layer.
import { creaHost } from './host.js';
import { creaPannello } from './pannello.js';
import { interrogaTutti, segnaposto } from './info.js';
import { leggi, salva } from './archivio.js';
import { anelliDaZone } from './area.js';
import { archivioIndexedDB } from './dati.js';
import { scegliProxy } from './proxy.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';
import { t, lingua } from '../core/i18n.js';

// Indirizzo del Worker (vedi docs/RNDT.md e proxy.js): in produzione è fisso
export const PROXY_RNDT = scegliProxy(location.search, location.hostname);
// due bundle dello stesso plugin: l'originale in inglese e la traduzione italiana (scripts/traduci_rndt.py)
const PLUGIN = `js/vendor/openrndt-geolibre/index.${lingua()}.js`;
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

  let plugin = null;
  async function apri() {
    pannello.apri(); // subito visibile, con «Caricamento…» finché il plugin non è pronto
    if (plugin) return;
    try {
      await anelliPronti;
      document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: new URL(STILE, document.baseURI).href }));
      const modulo = await import(new URL(PLUGIN, document.baseURI).href);
      plugin = modulo.default;
      if (plugin.activate(host) === false) throw new Error(t('err.pluginIncompatibile'));
    } catch (errore) {
      plugin = null;
      pannello.errore(t('rndt.nonDisponibileMsg', { msg: errore.message }));
    }
  }

  gruppo?.collega(host, apri); // gruppo «RNDT» della barra strati

  return {
    apri,
    chiudi: pannello.chiudi,
    host,
    ...creaInterrogazione([host]),
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}

const dentro = (l, { lng, lat }) => {
  const b = l.sorgente?.bounds;
  return !b || (lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3]);
};

// Cosa la scheda chiede ai layer aggiunti: quelli accesi sotto il clic, di uno o più host (RNDT e «miei layer»), e le loro risposte.
// Ogni layer si interroga con l'host a cui appartiene (rete, credenziali, feature in mappa).
export function creaInterrogazione(host) {
  const hosts = Array.isArray(host) ? host : [host];
  return {
    segnaposto,
    layerAlPunto: lngLat => hosts.flatMap(h => h.elenco().filter(l => l.visibile && !l.indisponibile && dentro(l, lngLat)).map(l => ({ ...l, host: h }))),
    async interroga(layers, lngLat, point, zoom) {
      const risposte = await Promise.all(hosts.map(h => interrogaTutti({
        layers: layers.filter(l => l.host === h), lngLat: [lngLat.lng, lngLat.lat], zoom,
        leggiTesto: async url => new TextDecoder().decode(await h.fetchArrayBuffer(url)),
        featureAlPunto: l => h.featureAlPunto(l.id, point),
      })));
      return risposte.flat();
    },
  };
}
