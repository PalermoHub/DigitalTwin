// worker/rndt-proxy.js
// Punto d'ingresso del Worker: Cloudflare accetta come esportazione solo il gestore. La logica (e i test) sta in proxy-core.js e voli-core.js.
import { gestisci } from './proxy-core.js';
import { gestisciVoli } from './voli-core.js';

export default {
  fetch: (richiesta, env) => (new URL(richiesta.url).pathname === '/voli'
    ? gestisciVoli(richiesta, env, fetch, caches.default)
    : gestisci(richiesta, env, fetch)),
};
