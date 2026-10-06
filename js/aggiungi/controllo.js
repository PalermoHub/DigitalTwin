// js/aggiungi/controllo.js
// Logica del pannello «Aggiungi layer», senza DOM: legge i servizi, li aggiunge all'host e li ricorda.
import { BBOX_PALERMO } from '../rndt/area.js';
import { TETTO_WFS } from '../rndt/host.js';
import {
  capabilitiesWms, capabilitiesWfs, validaXyz, urlBase, urlCapabilities, urlGetFeature,
} from './servizi.js';
import { leggiServizi, salvaServizi, aggiungiServizio, rimuoviServizio, filtraServizi } from './salvati.js';
import { creaCredenziali, ospiteDi } from './credenziali.js';

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
    const testo = new TextDecoder().decode(await host.fetchArrayBuffer(urlCapabilities(urlUtente, tipo)));
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
      if (l.supportato === false) { errori.push({ nome: l.titolo, messaggio: 'non offre EPSG:3857, la proiezione della mappa' }); continue; }
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
  const serveCredenziali = id => {
    const s = stato.servizi.find(x => x.id === id);
    return Boolean(s?.utente) && !credenziali.ha(ospiteDi(s.url));
  };
  // l'host lo chiede al ripristino: un layer di un servizio con utente e senza password in sessione non deve partire
  const protetto = url => {
    const o = ospiteDi(url);
    return !credenziali.ha(o) && stato.servizi.some(s => s.utente && ospiteDi(s.url) === o);
  };

  async function riaggiungi(id, { password } = {}) {
    const s = stato.servizi.find(x => x.id === id);
    const errori = [];
    if (!s) return { errori };
    if (serveCredenziali(id)) {
      if (password === undefined) return { errori: [{ nome: s.nome, messaggio: 'servono utente e password' }], serve: true };
      credenziali.imposta(ospiteDi(s.url), s.utente, password);
    }
    if (s.tipo === 'xyz') { host.addTileLayer(s.nome, s.url, {}); return { errori }; }
    for (const v of s.voci) {
      try {
        if (s.tipo === 'wms') host.addWmsLayer(v.nome, v.opz);
        else await host.addWfsLayer(v.nome, v.richiesta);
      } catch (e) { errori.push({ nome: v.nome, messaggio: messaggio(e) }); }
    }
    // password sbagliata: si dimenticano le credenziali, così torna il lucchetto e si può riprovare
    if (errori.some(e => /utente e password/.test(e.messaggio))) credenziali.togli(ospiteDi(s.url));
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
    leggiServizio, aggiungiXyz, aggiungiWms, aggiungiWfs, riaggiungi, rimuovi,
  };
}
