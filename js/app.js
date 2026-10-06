import { creaMappa } from './core/mappa.js';
import { impostaCatalogo } from './core/config.js';
import { costruisciPannello, disattivaStrato, segnala } from './core/pannello.js';
import { collegaInvito } from './core/invito.js';
import { caricaCatalogo, commutaCrediti } from './core/catalogo.js';
import { collegaRail } from './core/rail.js';
import { collegaScheda } from './core/scheda.js';
import { collegaRndt } from './rndt/index.js';
import { creaGruppo, creaGruppoRndt, OPZIONI_MIEI } from './rndt/gruppo.js';
import { collegaAggiungi } from './aggiungi/index.js';
import { migraFileLocali } from './aggiungi/migrazione.js';
import { collegaGeoimage } from './geoimage/index.js';
import { collegaRicerca, collegaRicercaParticella } from './core/ricerca.js';
import { collegaStrumenti, collegaPannelloFiltri } from './core/strumenti.js';
import { collegaStampa } from './core/stampa.js';
import { collegaZone } from './core/zone.js';
import { collegaRipristino } from './core/ripristino.js';
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
import isoleCalore from './layers/isole-calore.js';
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
const MODULI = [base, terreno, popolazione, territorio, edifici, pai, monumenti, alberi, fontanelle, trasporto, sicurezza, colonnine, uffici, scuole, incendi, isoleCalore, confini];

const catalogoPromessa = caricaCatalogo().catch(() => null);

const map = creaMappa('mappa', () => segnala('Base cartografica non disponibile: mappa semplificata'));
window.dt = { map, moduli: Object.fromEntries(MODULI.map(m => [m.id, m])), pronto: false };

// Un errore su una sorgente disattiva solo gli strati che la usano e li nomina nell'avviso
// (con l'etichetta del pannello, non con l'id tecnico).
const STRATI = MODULI.flatMap(m => m.strati);
map.on('error', e => {
  if (!e.sourceId || /^(rndt|miei)-/.test(e.sourceId)) return; // gli errori dei layer RNDT e dei «miei layer» li segnalano gli host
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
  try { migraFileLocali(window.localStorage); } catch { /* storage bloccato: niente da spostare */ }
  const gruppoRndt = creaGruppoRndt(); // ultimi gruppi della barra: i loro layer arrivano a runtime
  const gruppoMiei = creaGruppo(OPZIONI_MIEI);
  costruisciPannello(map, [...MODULI, gruppoRndt.modulo, gruppoMiei.modulo], document.getElementById('pannello'), document.getElementById('barra-gruppi'));
  const rndt = collegaRndt(map, document.getElementById('rndt-pannello'), gruppoRndt);
  const aggiungi = collegaAggiungi(map, gruppoMiei);
  collegaScheda(map, MODULI, document.getElementById('scheda'), { rndt });
  const geoimage = collegaGeoimage(map, document.getElementById('geoimage-pannello'));
  const rail = collegaRail(document.getElementById('rail-pannelli'), [
    { id: 'scheda', etichetta: 'Scheda', pannello: document.getElementById('scheda') },
    { id: 'rndt', etichetta: 'RNDT', pannello: document.getElementById('rndt-pannello'), apri: rndt.apri, chiudi: rndt.chiudi },
    { id: 'geoimage', etichetta: 'Geoimage', pannello: document.getElementById('geoimage-pannello'), apri: geoimage.apri, chiudi: geoimage.chiudi },
  ]);
  document.getElementById('btn-rndt').addEventListener('click', () => rail.commuta('rndt'));
  aggiungi.ripristina(); // i layer aggiunti dall'utente tornano prima, così quelli RNDT restano sopra
  rndt.ripristina(); // i layer RNDT della sessione precedente tornano sopra tutti gli altri
  geoimage.ripristina(); // e la mappa storica di Geoimage, se c'era
  window.dt.geoimage = geoimage;
  const vaiParticella = collegaRicercaParticella(map, document.getElementById('cerca-foglio'), document.getElementById('cerca-numero'),
    document.getElementById('cerca-particella-vai'), document.getElementById('cerca-particella-esito'));
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
  collegaPannelloFiltri(document.getElementById('cerca-filtri'), document.getElementById('cerca-particella-esito'));
  collegaStrumenti(map);
  collegaStampa(map, document.getElementById('btn-stampa'), document.getElementById('stampa-menu'));
  // coordinate del centro mappa e zoom nel piè di pagina
  const piedeCoord = document.getElementById('piede-coord');
  const aggiornaCoord = () => { const c = map.getCenter(); piedeCoord.textContent = `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)} · zoom ${map.getZoom().toFixed(1)}`; };
  map.on('move', aggiornaCoord);
  aggiornaCoord();
  collegaRipristino(document.getElementById('cerca-ripristina'), (() => { try { return window.localStorage; } catch { return null; } })());

  const esiti = await Promise.allSettled(MODULI.filter(m => m.avvia).map(m => m.avvia(map)));
  esiti.forEach(e => { if (e.status === 'rejected') segnala(`Strato non caricato: ${e.reason?.message ?? e.reason}`); });
  // il filtro Linea ha bisogno dei dati del trasporto, caricati da `avvia`
  collegaFiltroLinea(map, { select: document.getElementById('f-linea'), chips: document.getElementById('filtri-linea-chips'), ...trasporto.filtro() });

  const foglio = document.getElementById('crediti');
  const menu = document.getElementById('menu-info');
  const toggle = document.getElementById('menu-info-toggle');
  const chiudiMenu = () => { menu.classList.remove('aperto'); toggle.setAttribute('aria-expanded', 'false'); };
  const commuta = tab => {
    if (tab === 'mappa') return foglio.open && foglio.close();
    if (catalogo) commutaCrediti(foglio, catalogo, [...MODULI, gruppoRndt.modulo, gruppoMiei.modulo], tab);
    else segnala('Fonti non disponibili: catalogo dati assente');
  };
  const segna = tab => menu.querySelectorAll('button').forEach(b => {
    if (b.dataset.scheda === (tab ?? 'mappa')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  menu.addEventListener('click', e => {
    const b = e.target.closest('button[data-scheda]');
    if (!b) return;
    commuta(b.dataset.scheda);
    chiudiMenu();
  });
  toggle.addEventListener('click', () => {
    const aperto = menu.classList.toggle('aperto');
    toggle.setAttribute('aria-expanded', String(aperto));
  });
  document.getElementById('piede-fonti').addEventListener('click', () => commuta('fonti'));
  // ogni sezione ha il suo indirizzo (#fonti, #guida…): si può condividere e si riapre al caricamento
  const indirizzo = id => history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
  foglio.addEventListener('scheda', e => { segna(e.detail); indirizzo(e.detail); });
  foglio.addEventListener('close', () => { segna(null); indirizzo(null); });
  document.getElementById('app-logo').addEventListener('click', e => { if (foglio.open) { e.preventDefault(); foglio.close(); } });
  const iniziale = location.hash.slice(1);
  if (menu.querySelector(`[data-scheda="${iniziale}"]`) && iniziale !== 'mappa') commuta(iniziale);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (foglio.open) foglio.close();
    else chiudiMenu();
  });
  collegaInvito(map, document, (() => { try { return window.localStorage; } catch { return null; } })(), { url: location.search });
  window.dt.pronto = true;
});
