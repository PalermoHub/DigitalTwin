// worker/rndt-proxy.js
// Punto d'ingresso del Worker: Cloudflare accetta come esportazione solo il gestore (e gli eventi). La logica (e i test) sta in proxy-core.js, voli-core.js e navi-core.js.
import { gestisci } from './proxy-core.js';
import { gestisciVoli } from './voli-core.js';
import { aggiorna, apriWebSocket, gestisciNavi } from './navi-core.js';

export default {
  fetch(richiesta, env) {
    const percorso = new URL(richiesta.url).pathname;
    if (percorso === '/voli') return gestisciVoli(richiesta, env, fetch, caches.default);
    if (percorso === '/navi') return gestisciNavi(richiesta, env, caches.default);
    return gestisci(richiesta, env, fetch);
  },
  // ogni 5 minuti (crons in wrangler.toml): ascolta AISStream e aggiorna il KV
  scheduled(evento, env, ctx) {
    ctx.waitUntil(aggiorna(env, apriWebSocket).then(r => console.log('navi', JSON.stringify(r))));
  },
};
