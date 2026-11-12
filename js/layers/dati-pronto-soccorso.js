// Letture dei pronto soccorso senza mappa: anagrafica statica + ultima lettura del Worker, unite per id (lo stesso modello dello strato in mappa).
import { urlDati } from '../core/config.js';
import { scegliProxy } from '../rndt/proxy.js';

// Se il Worker non risponde restano i presidi dell'anagrafica con stato «assente» (nessun numero inventato).
export async function caricaPs() {
  const dettagli = new Map();
  try {
    const dati = await (await fetch(urlDati('salute/pronto-soccorso.geojson'))).json();
    for (const f of dati.features) dettagli.set(f.properties.id, { ...f.properties, stato: 'assente', codici: {} });
  } catch { /* senza anagrafica l'elenco resta vuoto */ }
  try {
    const r = await fetch(`${scegliProxy(location.search, location.hostname)}/pronto-soccorso`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`pronto-soccorso: HTTP ${r.status}`);
    for (const p of (await r.json()).ps ?? []) dettagli.set(p.id, { ...(dettagli.get(p.id) ?? {}), ...p });
  } catch { /* si mostrano i presidi senza dato */ }
  return [...dettagli.values()];
}
