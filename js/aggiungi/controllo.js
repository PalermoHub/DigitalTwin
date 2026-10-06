// js/aggiungi/controllo.js
// Logica del pannello «Aggiungi layer», senza DOM: legge i servizi, li aggiunge all'host e li ricorda.
import { BBOX_PALERMO } from '../rndt/area.js';
import { TETTO_WFS } from '../rndt/host.js';
import {
  capabilitiesWms, capabilitiesWfs, validaXyz, urlBase, urlCapabilities, urlGetFeature,
} from './servizi.js';
import { leggiServizi, salvaServizi, aggiungiServizio, rimuoviServizio } from './salvati.js';

const nomeDaUrl = url => new URL(url.replace(/[{}]/g, '')).hostname;
const messaggio = e => (e instanceof Error ? e.message : String(e));

export function creaControllo({ host, storage }) {
  let stato = leggiServizi(storage);
  const ascoltatori = new Set();
  const cambio = () => { for (const f of ascoltatori) f(); };

  // Ricorda il servizio; a tetto raggiunto (o storage bloccato) il layer resta in mappa e `pieno` lo dice.
  function memorizza(servizio) {
    const r = aggiungiServizio(stato, servizio);
    if (r.pieno) return { pieno: true };
    stato = r.stato;
    salvaServizi(storage, stato);
    cambio();
    return { pieno: false };
  }

  async function leggiServizio(tipo, urlUtente) {
    const url = urlBase(urlUtente);
    const testo = new TextDecoder().decode(await host.fetchArrayBuffer(urlCapabilities(urlUtente, tipo)));
    return { url, ...(tipo === 'wms' ? capabilitiesWms(testo) : capabilitiesWfs(testo)) };
  }

  function aggiungiXyz({ nome, url }) {
    const valido = validaXyz(url);
    const titolo = nome.trim() || nomeDaUrl(valido);
    host.addTileLayer(titolo, valido, {});
    return memorizza({ tipo: 'xyz', nome: titolo, url: valido });
  }

  const opzioniWms = (servizio, layer) => ({ url: servizio.url, layers: layer.nome, version: servizio.versione, format: servizio.formato, transparent: true, bounds: layer.bbox ?? undefined });
  const richiestaWfs = (servizio, tipo) => urlGetFeature(servizio.url, { tipo: tipo.nome, versione: servizio.versione, bbox: BBOX_PALERMO, max: TETTO_WFS + 1 });

  async function aggiungiWms({ nome, url, servizio, scelti }) {
    const errori = [];
    const voci = [];
    for (const l of scelti) {
      if (l.supportato === false) { errori.push({ nome: l.titolo, messaggio: 'non offre EPSG:3857, la proiezione della mappa' }); continue; }
      try {
        const opz = opzioniWms(servizio, l);
        host.addWmsLayer(l.titolo, opz);
        voci.push({ chiave: l.nome, nome: l.titolo, opz });
      } catch (e) { errori.push({ nome: l.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wms', nome: nome.trim() || nomeDaUrl(url), url, voci }) : { pieno: false };
    return { ...r, errori };
  }

  async function aggiungiWfs({ nome, url, servizio, scelti }) {
    const errori = [];
    const voci = [];
    for (const t of scelti) {
      try {
        const richiesta = richiestaWfs(servizio, t);
        await host.addWfsLayer(t.titolo, richiesta);
        voci.push({ chiave: t.nome, nome: t.titolo, richiesta });
      } catch (e) { errori.push({ nome: t.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wfs', nome: nome.trim() || nomeDaUrl(url), url, voci }) : { pieno: false };
    return { ...r, errori };
  }

  // Un servizio salvato torna in mappa com'era, senza rileggere le capabilities.
  async function riaggiungi(id) {
    const s = stato.servizi.find(x => x.id === id);
    const errori = [];
    if (!s) return { errori };
    if (s.tipo === 'xyz') { host.addTileLayer(s.nome, s.url, {}); return { errori }; }
    for (const v of s.voci) {
      try {
        if (s.tipo === 'wms') host.addWmsLayer(v.nome, v.opz);
        else await host.addWfsLayer(v.nome, v.richiesta);
      } catch (e) { errori.push({ nome: v.nome, messaggio: messaggio(e) }); }
    }
    return { errori };
  }

  function rimuovi(id) {
    stato = rimuoviServizio(stato, id);
    salvaServizi(storage, stato);
    cambio();
  }

  return {
    stato: () => stato,
    suCambio(fn) { ascoltatori.add(fn); return () => ascoltatori.delete(fn); },
    leggiServizio, aggiungiXyz, aggiungiWms, aggiungiWfs, riaggiungi, rimuovi,
  };
}
