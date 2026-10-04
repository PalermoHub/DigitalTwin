// js/rndt/dati.js
// Dati dei layer senza URL (file dal computer): localStorage tiene solo l'elenco, i dati stanno qui, in IndexedDB,
// che regge molto più dei 5 MB di localStorage. Interfaccia asincrona { leggi, scrivi, elimina }.

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
export function archivioIndexedDB(idb = globalThis.indexedDB) {
  if (!idb) return null;
  const apri = () => new Promise((ok, ko) => {
    const r = idb.open('dt-rndt', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('dati');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
  // una transazione per operazione; si chiude il db a fine lavoro
  const transazione = async (modo, operazione) => {
    const db = await apri();
    return new Promise((ok, ko) => {
      const t = db.transaction('dati', modo);
      const richiesta = operazione(t.objectStore('dati'));
      t.oncomplete = () => { db.close(); ok(richiesta.result); };
      t.onerror = t.onabort = () => { db.close(); ko(t.error); };
    });
  };
  return {
    leggi: async id => (await transazione('readonly', s => s.get(id))) ?? null,
    scrivi: async (id, fc) => { await transazione('readwrite', s => s.put(fc, id)); },
    elimina: async id => { await transazione('readwrite', s => s.delete(id)); },
  };
}
