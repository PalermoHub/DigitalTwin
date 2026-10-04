// worker/rndt-proxy.js
// Punto d'ingresso del Worker: Cloudflare accetta come esportazione solo il gestore. La logica (e i test) sta in proxy-core.js.
import { gestisci } from './proxy-core.js';

export default { fetch: (richiesta, env) => gestisci(richiesta, env, fetch) };
