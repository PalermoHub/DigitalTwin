import { creaMappa } from './core/mappa.js';
import { impostaCatalogo } from './core/config.js';
import { costruisciPannello, disattivaStrato, segnala } from './core/pannello.js';
import { caricaCatalogo, commutaCrediti } from './core/catalogo.js';
import { collegaRail } from './core/rail.js';
import { collegaScheda } from './core/scheda.js';
import { collegaRndt } from './rndt/index.js';
import { creaGruppoRndt } from './rndt/gruppo.js';
import { collegaRicerca, collegaRicercaParticella } from './core/ricerca.js';
import { collegaStrumenti, collegaPannelloFiltri } from './core/strumenti.js';
import { collegaZone } from './core/zone.js';
import confini from './layers/confini.js';
import popolazione from './layers/popolazione.js';
import territorio from './layers/territorio.js';
import edifici from './layers/edifici.js';
import monumenti from './layers/monumenti.js';
import alberi from './layers/alberi.js';
import fontanelle from './layers/fontanelle.js';
import scuole from './layers/scuole.js';
import uffici from './layers/uffici.js';
import colonnine from './layers/colonnine.js';
import incendi from './layers/incendi.js';
import pai from './layers/pai.js';
import trasporto from './layers/trasporto.js';
import sicurezza, { STRATI_INCIDENTI, legendaSicurezza } from './layers/sicurezza.js';
import { collegaFiltroIncidenti } from './layers/sicurezza-filtro.js';
import { collegaRicercaTerritorio } from './layers/ricerca-territorio.js';
import { collegaRicercaIncidenti } from './layers/sicurezza-ricerca.js';
import { collegaFiltroLinea } from './layers/trasporto-filtro.js';
import terreno from './layers/terreno.js';
import base from './layers/base.js';

// strati (mobile) e legenda riducibile
const apriStrati = document.getElementById('apri-strati');
const impostaStrati = on => { document.body.classList.toggle('strati-aperti', on); apriStrati.setAttribute('aria-expanded', String(on)); };
apriStrati.addEventListener('click', () => impostaStrati(true));
document.getElementById('chiudi-strati').addEventListener('click', () => impostaStrati(false));
const riduciLegenda = document.getElementById('legende-riduci');
riduciLegenda.addEventListener('click', () => {
  const ridotta = document.getElementById('legende-box').classList.toggle('ridotta');
  riduciLegenda.setAttribute('aria-expanded', String(!ridotta));
  riduciLegenda.textContent = ridotta ? '▸ Legenda' : '▾ Riduci';
});

// ordine = ordine di sovrapposizione dei layer (il primo sta sotto)
const MODULI = [base, terreno, popolazione, territorio, edifici, pai, monumenti, alberi, fontanelle, trasporto, sicurezza, colonnine, uffici, scuole, incendi, confini];

const catalogoPromessa = caricaCatalogo().catch(() => null);

const map = creaMappa('mappa', () => segnala('Base cartografica non disponibile: mappa semplificata'));
window.dt = { map, moduli: Object.fromEntries(MODULI.map(m => [m.id, m])), pronto: false };

// Un errore su una sorgente disattiva solo gli strati che la usano e li nomina nell'avviso
// (con l'etichetta del pannello, non con l'id tecnico).
const STRATI = MODULI.flatMap(m => m.strati);
map.on('error', e => {
  if (!e.sourceId || e.sourceId.startsWith('rndt-')) return; // gli errori dei layer RNDT li segnala lo shim
  const colpiti = STRATI.filter(s => s.layers.some(id => map.getLayer(id)?.source === e.sourceId));
  if (!colpiti.length) return segnala(`Strato non caricato: ${e.sourceId}`);
  segnala(`Strato non caricato: ${colpiti.map(s => s.etichetta).join(', ')}`);
  colpiti.forEach(s => disattivaStrato(map, s));
});

// Gli strati si aggiungono appena lo stile è pronto, senza aspettare i tile della base:
// così una base lenta o irraggiungibile non blocca il viewer.
map.once('style.load', async () => {
  const catalogo = await catalogoPromessa;
  if (catalogo) impostaCatalogo(catalogo);
  else segnala('Catalogo dati non disponibile: uso le copie locali dei dati');

  for (const m of MODULI) m.aggiungiSorgenti(map);
  for (const m of MODULI) m.aggiungiLayer(map);
  const gruppoRndt = creaGruppoRndt(); // ultimo gruppo della barra: i suoi layer arrivano a runtime
  costruisciPannello(map, [...MODULI, gruppoRndt.modulo], document.getElementById('pannello'), document.getElementById('barra-gruppi'));
  const rndt = collegaRndt(map, document.getElementById('rndt-pannello'), gruppoRndt);
  collegaScheda(map, MODULI, document.getElementById('scheda'), { rndt });
  const rail = collegaRail(document.getElementById('rail-pannelli'), [
    { id: 'scheda', etichetta: 'Scheda', pannello: document.getElementById('scheda') },
    { id: 'rndt', etichetta: 'RNDT', pannello: document.getElementById('rndt-pannello'), apri: rndt.apri, chiudi: rndt.chiudi },
  ]);
  document.getElementById('btn-rndt').addEventListener('click', () => rail.commuta('rndt'));
  rndt.ripristina(); // i layer RNDT della sessione precedente tornano sopra tutti gli altri
  const vaiParticella = collegaRicercaParticella(map, document.getElementById('cerca-foglio'), document.getElementById('cerca-numero'),
    document.getElementById('cerca-particella-vai'), document.getElementById('cerca-particella-esito'),
    document.getElementById('pannello-filtri'));
  const zone = collegaZone(map, {
    selezioni: { circ: document.getElementById('f-circ'), quart: document.getElementById('f-quart'), upl: document.getElementById('f-upl') },
    chips: document.getElementById('filtri-chips'),
  });
  const filtroIncidenti = collegaFiltroIncidenti(map, {
    annoSelect: document.getElementById('sicurezza-anno'), gravitaSelect: document.getElementById('sicurezza-gravita'),
    chips: document.getElementById('filtri-incidenti-chips'), layers: STRATI_INCIDENTI, strato: 'sicurezza-incidenti',
  });
  legendaSicurezza.suTipologie = tipologie => filtroIncidenti.imposta({ tipologie }); // la legenda degli incidenti filtra per gravità
  collegaRicerca(map, document.getElementById('cerca'),
    document.getElementById('cerca-testo'), document.getElementById('cerca-risultati'), vaiParticella, zone,
    collegaRicercaTerritorio(map, collegaRicercaIncidenti(map, filtroIncidenti)));
  collegaPannelloFiltri(document.getElementById('cerca-filtri'), document.getElementById('pannello-filtri'),
    document.getElementById('cerca-particella-esito'));
  collegaStrumenti(map);

  const esiti = await Promise.allSettled(MODULI.filter(m => m.avvia).map(m => m.avvia(map)));
  esiti.forEach(e => { if (e.status === 'rejected') segnala(`Strato non caricato: ${e.reason?.message ?? e.reason}`); });
  // il filtro Linea ha bisogno dei dati del trasporto, caricati da `avvia`
  collegaFiltroLinea(map, { select: document.getElementById('f-linea'), chips: document.getElementById('filtri-linea-chips'), ...trasporto.filtro() });

  const foglio = document.getElementById('crediti');
  const commuta = () => {
    if (catalogo) commutaCrediti(foglio, catalogo, [...MODULI, gruppoRndt.modulo]);
    else segnala('Fonti non disponibili: catalogo dati assente');
  };
  const linguetta = document.getElementById('linguetta-info');
  document.getElementById('apri-crediti').addEventListener('click', commuta);
  linguetta.addEventListener('click', commuta);
  // la linguetta esterna si vede solo a foglio chiuso
  foglio.addEventListener('close', () => { linguetta.hidden = false; });
  foglio.addEventListener('toggle', () => { linguetta.hidden = foglio.open; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && foglio.open) foglio.close(); });
  window.dt.pronto = true;
});
