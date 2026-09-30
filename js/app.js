import { creaMappa } from './core/mappa.js';
import { costruisciPannello, segnala } from './core/pannello.js';
import { caricaCatalogo, apriCrediti } from './core/catalogo.js';
import confini from './layers/confini.js';
import popolazione from './layers/popolazione.js';

// ordine = ordine di sovrapposizione dei layer (il primo sta sotto)
const MODULI = [popolazione, confini];

const map = creaMappa('mappa');
window.dt = { map, moduli: Object.fromEntries(MODULI.map(m => [m.id, m])), pronto: false };

// Un errore su una sorgente disattiva solo quello strato e lo segnala.
map.on('error', e => {
  if (e.sourceId) segnala(`Strato non caricato: ${e.sourceId}`);
});

map.on('load', async () => {
  for (const m of MODULI) m.aggiungiSorgenti(map);
  for (const m of MODULI) m.aggiungiLayer(map);
  costruisciPannello(map, MODULI, document.getElementById('strati'));

  const esiti = await Promise.allSettled(MODULI.filter(m => m.avvia).map(m => m.avvia(map)));
  esiti.forEach(e => { if (e.status === 'rejected') segnala(`Strato non caricato: ${e.reason?.message ?? e.reason}`); });

  document.getElementById('apri-crediti').addEventListener('click', async () => {
    try {
      apriCrediti(document.getElementById('crediti'), await caricaCatalogo());
    } catch (err) {
      segnala(String(err.message));
    }
  });
  window.dt.pronto = true;
});
