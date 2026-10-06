// js/aggiungi/salvati.js
// Servizi (XYZ, WMS, WFS) incollati dall'utente e salvati nel browser: solo URL e scelte, nessun dato.
// Lo storage arriva dal chiamante; se è bloccato o pieno l'app funziona lo stesso, senza memoria.
import { hash } from '../rndt/host.js';

export const CHIAVE_SERVIZI = 'dt:miei:servizi:v1';
export const TETTO_SERVIZI = 50;
const TIPI = ['xyz', 'wms', 'wfs'];
const vuoto = () => ({ v: 1, servizi: [] });

export const idServizio = (tipo, url) => `srv-${hash(`${tipo}|${url}`)}`;

const valido = s => s && typeof s.id === 'string' && TIPI.includes(s.tipo) && typeof s.nome === 'string'
  && typeof s.url === 'string' && Array.isArray(s.voci);

export function leggiServizi(storage) {
  try {
    const grezzo = storage?.getItem(CHIAVE_SERVIZI);
    if (!grezzo) return vuoto();
    const s = JSON.parse(grezzo);
    if (s?.v !== 1 || !Array.isArray(s.servizi)) return vuoto();
    return { v: 1, servizi: s.servizi.filter(valido) };
  } catch {
    return vuoto();
  }
}

export function salvaServizi(storage, stato) {
  try {
    storage.setItem(CHIAVE_SERVIZI, JSON.stringify(stato));
    return true;
  } catch {
    return false;
  }
}

// Aggiunge o aggiorna (stesso tipo e URL → stesso servizio, voci unite per `chiave`). A tetto raggiunto un servizio nuovo non entra.
export function aggiungiServizio(stato, { tipo, nome, url, voci = [] }) {
  const id = idServizio(tipo, url);
  const presente = stato.servizi.find(s => s.id === id);
  if (!presente && stato.servizi.length >= TETTO_SERVIZI) return { stato, pieno: true };
  const unite = new Map([...(presente?.voci ?? []), ...voci].map(v => [v.chiave, v]));
  const nuovo = { id, tipo, nome: presente?.nome ?? nome, url, voci: [...unite.values()] };
  return { stato: { ...stato, servizi: [...stato.servizi.filter(s => s.id !== id), nuovo] }, pieno: false };
}

export const rimuoviServizio = (stato, id) => ({ ...stato, servizi: stato.servizi.filter(s => s.id !== id) });
