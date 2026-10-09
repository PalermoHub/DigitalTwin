// js/aggiungi/controllo.js
// Logica del pannello «Aggiungi layer», senza DOM: legge i servizi, li aggiunge all'host e li ricorda.
import { BBOX_PALERMO } from '../rndt/area.js';
import { TETTO_WFS } from '../rndt/host.js';
import {
  capabilitiesWms, capabilitiesWfs, validaXyz, urlBase, urlCapabilities, urlGetFeature,
} from './servizi.js';
import { capabilitiesWmts } from './wmts.js';
import { leggiUrlArcgis, urlInfo, descriviArcgis, urlExport, urlTileCache, urlQuery } from './arcgis.js';
import { ATTRIBUZIONE_BENI, urlBeneCulturale, baseBeneCulturale } from './beniculturali.js';
import { leggiServizi, salvaServizi, aggiungiServizio, rimuoviServizio, filtraServizi } from './salvati.js';
import { ATTRIBUZIONE_ORTOFOTO, urlOrtofoto } from './ortofoto.js';
import { creaCredenziali, ospiteDi } from './credenziali.js';
import { t as tr } from '../core/i18n.js';

const nomeDaUrl = url => new URL(url.replace(/[{}]/g, '')).hostname;
const messaggio = e => (e instanceof Error ? e.message : String(e));

export function creaControllo({ host, storage, credenziali = creaCredenziali() }) {
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

  async function leggiServizio(tipo, urlUtente, { utente, password } = {}) {
    const url = urlBase(urlUtente);
    if (utente) credenziali.imposta(ospiteDi(urlUtente), utente, password);
    if (tipo === 'arcgis') {
      const p = leggiUrlArcgis(urlUtente);
      // il token incollato nell'indirizzo è una credenziale di sessione: si tiene in memoria e non resta in nessun URL
      if (p.token) credenziali.impostaToken(ospiteDi(p.base), p.token);
      const grezzo = new TextDecoder().decode(await host.fetchArrayBuffer(urlInfo(p)));
      let json;
      try { json = JSON.parse(grezzo); } catch { throw new Error(tr('err.noArcgis')); }
      return { url: p.base, conToken: credenziali.token(ospiteDi(p.base)) !== null, ...descriviArcgis(json, p) };
    }
    const testo = new TextDecoder().decode(await host.fetchArrayBuffer(urlCapabilities(urlUtente, tipo)));
    if (tipo === 'wmts') return { url, ...capabilitiesWmts(testo, urlUtente) };
    return { url, ...(tipo === 'wms' ? capabilitiesWms(testo) : capabilitiesWfs(testo)) };
  }

  function aggiungiXyz({ nome, url, utente, password }) {
    const valido = validaXyz(url);
    if (utente) credenziali.imposta(ospiteDi(valido), utente, password);
    const titolo = nome.trim() || nomeDaUrl(valido);
    host.addTileLayer(titolo, valido, {});
    return memorizza({ tipo: 'xyz', nome: titolo, url: valido, utente });
  }

  const opzioniWms = (servizio, layer) => ({ url: servizio.url, layers: layer.nome, version: servizio.versione, format: servizio.formato, transparent: true, bounds: layer.bbox ?? undefined });
  const richiestaWfs = (servizio, tipo) => urlGetFeature(servizio.url, { tipo: tipo.nome, versione: servizio.versione, bbox: BBOX_PALERMO, max: TETTO_WFS + 1 });

  async function aggiungiWms({ nome, url, servizio, scelti, utente }) {
    const errori = [];
    const voci = [];
    for (const l of scelti) {
      if (l.supportato === false) { errori.push({ nome: l.titolo, messaggio: tr('err.noEpsg3857') }); continue; }
      try {
        const opz = opzioniWms(servizio, l);
        host.addWmsLayer(l.titolo, opz);
        voci.push({ chiave: l.nome, nome: l.titolo, opz });
      } catch (e) { errori.push({ nome: l.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wms', nome: nome.trim() || nomeDaUrl(url), url, utente, voci }) : { pieno: false };
    return { ...r, errori };
  }

  async function aggiungiWfs({ nome, url, servizio, scelti, utente }) {
    const errori = [];
    const voci = [];
    for (const t of scelti) {
      try {
        const richiesta = richiestaWfs(servizio, t);
        await host.addWfsLayer(t.titolo, richiesta);
        voci.push({ chiave: t.nome, nome: t.titolo, richiesta });
      } catch (e) { errori.push({ nome: t.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wfs', nome: nome.trim() || nomeDaUrl(url), url, utente, voci }) : { pieno: false };
    return { ...r, errori };
  }

  // Un servizio salvato torna in mappa com'era, senza rileggere le capabilities.
  async function aggiungiWmts({ nome, url, servizio, scelti, utente }) {
    const errori = [];
    const voci = [];
    for (const l of scelti) {
      if (!l.supportato || !l.tile) { errori.push({ nome: l.titolo, messaggio: tr('err.noPiramide') }); continue; }
      try {
        host.addTileLayer(l.titolo, l.tile, {});
        voci.push({ chiave: l.nome, nome: l.titolo, tile: l.tile });
      } catch (e) { errori.push({ nome: l.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wmts', nome: nome.trim() || nomeDaUrl(url), url, utente, voci }) : { pieno: false };
    return { ...r, errori };
  }

  async function aggiungiArcgis({ nome, url, servizio, scelti, modo, utente, conToken }) {
    const errori = [];
    const voci = [];
    const aggiungiRaster = (titolo, chiave, tile) => {
      try { host.addTileLayer(titolo, tile, {}); voci.push({ chiave, nome: titolo, tile }); } catch (e) { errori.push({ nome: titolo, messaggio: messaggio(e) }); }
    };
    if (modo === 'dati') {
      for (const l of scelti) {
        try {
          const richiesta = urlQuery(url, l.id, BBOX_PALERMO, TETTO_WFS + 1);
          await host.addWfsLayer(l.nome, richiesta);
          voci.push({ chiave: `dati:${l.id}`, nome: l.nome, richiesta });
        } catch (e) { errori.push({ nome: l.nome, messaggio: messaggio(e) }); }
      }
    } else if (servizio.cache) {
      aggiungiRaster(nome.trim() || nomeDaUrl(url), 'cache', urlTileCache(url));
    } else {
      for (const l of scelti) aggiungiRaster(l.nome, `immagine:${l.id}`, urlExport(url, l.id));
    }
    const r = voci.length ? memorizza({ tipo: 'arcgis', nome: nome.trim() || nomeDaUrl(url), url, utente, conToken, voci }) : { pieno: false };
    return { ...r, errori };
  }

  // Un'ortofoto pronta: tile diretti dal server, sotto i dati, con lo zoom massimo che il servizio ha davvero
  function aggiungiOrtofoto(o) {
    try { host.addTileLayer(o.nome, urlOrtofoto(o), { attribution: ATTRIBUZIONE_ORTOFOTO, maxzoom: o.max, sotto: true, diretto: true }); return { errori: [] }; } catch (e) { return { errori: [{ nome: o.nome, messaggio: messaggio(e) }] }; }
  }

  // Un servizio dei beni culturali (SITR): immagini dal server, il server ammette già il CORS, quindi senza proxy
  function aggiungiBeneCulturale(o) {
    try { host.addTileLayer(o.nome, urlBeneCulturale(o), { attribution: ATTRIBUZIONE_BENI, diretto: true }); return { errori: [] }; } catch (e) { return { errori: [{ nome: o.nome, messaggio: messaggio(e) }] }; }
  }

  // Gli stessi dati come vettori interrogabili (query ArcGIS sull'area di Palermo, come il modo «dati» del ramo)
  async function aggiungiBeneCulturaleDati(o) {
    const nome = `${o.nome} (${tr('aggiungi.pronto.dati')})`;
    try { await host.addWfsLayer(nome, urlQuery(baseBeneCulturale(o), o.layer, BBOX_PALERMO, TETTO_WFS + 1)); return { errori: [] }; } catch (e) { return { errori: [{ nome: o.nome, messaggio: messaggio(e) }] }; }
  }

  const serveCredenziali = id => {
    const s = stato.servizi.find(x => x.id === id);
    return Boolean(s?.utente || s?.conToken) && !credenziali.ha(ospiteDi(s.url));
  };
  // l'host lo chiede al ripristino: un layer di un servizio con utente e senza password in sessione non deve partire
  const protetto = url => {
    const o = ospiteDi(url);
    return !credenziali.ha(o) && stato.servizi.some(s => (s.utente || s.conToken) && ospiteDi(s.url) === o);
  };

  async function riaggiungi(id, { password } = {}) {
    const s = stato.servizi.find(x => x.id === id);
    const errori = [];
    if (!s) return { errori };
    if (serveCredenziali(id)) {
      if (password === undefined) return { errori: [{ nome: s.nome, messaggio: 'servono utente e password' }], serve: true };
      if (s.conToken) credenziali.impostaToken(ospiteDi(s.url), password);
      else credenziali.imposta(ospiteDi(s.url), s.utente, password);
    }
    if (s.tipo === 'xyz') { host.addTileLayer(s.nome, s.url, {}); return { errori }; }
    for (const v of s.voci) {
      try {
        if (v.opz) host.addWmsLayer(v.nome, v.opz);
        else if (v.richiesta) await host.addWfsLayer(v.nome, v.richiesta);
        else if (v.tile) host.addTileLayer(v.nome, v.tile, {});
      } catch (e) { errori.push({ nome: v.nome, messaggio: messaggio(e) }); }
    }
    // password sbagliata: si dimenticano le credenziali, così torna il lucchetto e si può riprovare
    if (errori.some(e => /utente e password|token/i.test(e.messaggio))) credenziali.togli(ospiteDi(s.url));
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
    credenziali, serveCredenziali, protetto, cerca: testo => filtraServizi(stato.servizi, testo),
    leggiServizio, aggiungiOrtofoto, aggiungiBeneCulturale, aggiungiBeneCulturaleDati, aggiungiXyz, aggiungiWms, aggiungiWfs, aggiungiWmts, aggiungiArcgis, riaggiungi, rimuovi,
  };
}
