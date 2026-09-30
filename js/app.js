import { creaMappa } from './core/mappa.js';
import { impostaCatalogo } from './core/config.js';
import { costruisciPannello, segnala } from './core/pannello.js';
import { caricaCatalogo, apriCrediti } from './core/catalogo.js';
import { collegaScheda } from './core/scheda.js';
import { collegaRicerca } from './core/ricerca.js';
import confini from './layers/confini.js';
import popolazione from './layers/popolazione.js';
import territorio from './layers/territorio.js';
import edifici from './layers/edifici.js';
import terreno from './layers/terreno.js';

// ordine = ordine di sovrapposizione dei layer (il primo sta sotto)
const MODULI = [terreno, popolazione, territorio, edifici, confini];

const catalogoPromessa = caricaCatalogo().catch(() => null);

const map = creaMappa('mappa', () => segnala('Base cartografica non disponibile: mappa semplificata'));
window.dt = { map, moduli: Object.fromEntries(MODULI.map(m => [m.id, m])), pronto: false };

// Un errore su una sorgente disattiva solo quello strato e lo segnala.
map.on('error', e => {
  if (e.sourceId) segnala(`Strato non caricato: ${e.sourceId}`);
});

// Gli strati si aggiungono appena lo stile è pronto, senza aspettare i tile della base:
// così una base lenta o irraggiungibile non blocca il viewer.
map.once('style.load', async () => {
  const catalogo = await catalogoPromessa;
  if (catalogo) impostaCatalogo(catalogo);
  else segnala('Catalogo dati non disponibile: uso le copie locali dei dati');

  for (const m of MODULI) m.aggiungiSorgenti(map);
  for (const m of MODULI) m.aggiungiLayer(map);
  costruisciPannello(map, MODULI, document.getElementById('strati'));
  collegaScheda(map, MODULI, document.getElementById('scheda'));
  collegaRicerca(map, document.getElementById('cerca'),
    document.getElementById('cerca-testo'), document.getElementById('cerca-risultati'));

  const esiti = await Promise.allSettled(MODULI.filter(m => m.avvia).map(m => m.avvia(map)));
  esiti.forEach(e => { if (e.status === 'rejected') segnala(`Strato non caricato: ${e.reason?.message ?? e.reason}`); });

  document.getElementById('apri-crediti').addEventListener('click', () => {
    if (catalogo) apriCrediti(document.getElementById('crediti'), catalogo);
    else segnala('Fonti non disponibili: catalogo dati assente');
  });
  window.dt.pronto = true;
});
