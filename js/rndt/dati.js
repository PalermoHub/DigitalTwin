// js/rndt/dati.js
// Dati dei layer senza URL (file dal computer): localStorage tiene solo l'elenco, i dati stanno qui, in IndexedDB,
// che regge molto più dei 5 MB di localStorage. Interfaccia asincrona { leggi, scrivi, elimina }.
import { t as tr } from '../core/i18n.js';

export function archivioInMemoria() {
  const m = new Map();
  return {
    m,
    leggi: async id => m.get(id) ?? null,
    scrivi: async (id, fc) => { m.set(id, fc); },
    elimina: async id => { m.delete(id); },
  };
}

// null se il browser non ha IndexedDB: chi lo usa tratta i layer come «solo questa sessione»
export function archivioIndexedDB(idb = globalThis.indexedDB, { tempoMassimoMs = 10_000 } = {}) {
  if (!idb) return null;
  const apri = () => new Promise((ok, ko) => {
    const r = idb.open('dt-rndt', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('dati');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
    r.onblocked = () => ko(new Error(tr('err.indexeddbBloccato')));
  });
  // senza risposta entro il tempo massimo si rinuncia: il layer resta solo in sessione invece di restare appeso
  const entro = promessa => new Promise((ok, ko) => {
    const timer = setTimeout(() => ko(new Error(tr('err.indexeddbNoRisposta'))), tempoMassimoMs);
    promessa.then(ok, ko).finally(() => clearTimeout(timer));
  });
  // una transazione per operazione; si chiude il db a fine lavoro
  const transazione = (modo, operazione) => entro((async () => {
    const db = await apri();
    return new Promise((ok, ko) => {
      try {
        const t = db.transaction('dati', modo);
        const richiesta = operazione(t.objectStore('dati'));
        t.oncomplete = () => { db.close(); ok(richiesta.result); };
        t.onerror = t.onabort = () => { db.close(); ko(t.error); };
      } catch (errore) {
        db.close();
        ko(errore);
      }
    });
  })());
  return {
    leggi: async id => (await transazione('readonly', s => s.get(id))) ?? null,
    scrivi: async (id, fc) => { await transazione('readwrite', s => s.put(fc, id)); },
    elimina: async id => { await transazione('readwrite', s => s.delete(id)); },
  };
}
