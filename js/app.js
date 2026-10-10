import { creaMappa } from './core/mappa.js';
import { impostaCatalogo } from './core/config.js';
import { costruisciPannello, disattivaStrato, segnala } from './core/pannello.js';
import { collegaInvito } from './core/invito.js';
import { caricaCatalogo, commutaCrediti } from './core/catalogo.js';
import { collegaRail, ICONE_RAIL } from './core/rail.js';
import { collegaScheda } from './core/scheda.js';
import { collegaRndt, creaInterrogazione } from './rndt/index.js';
import { creaGruppo, creaGruppoRndt, OPZIONI_MIEI } from './rndt/gruppo.js';
import { collegaAggiungi } from './aggiungi/index.js';
import { migraFileLocali } from './aggiungi/migrazione.js';
import { CHIAVE as CHIAVE_GEOIMAGE } from './geoimage/archivio.js';
import { collegaRicerca, collegaRicercaParticella } from './core/ricerca.js';
import { collegaStrumenti, collegaPannelloFiltri } from './core/strumenti.js';
import { collegaTabella } from './core/tabella/index.js';
import { collegaCursorePunti } from './core/cursore-punti.js';
import { collegaStampa } from './core/stampa.js';
import { collegaZone } from './core/zone.js';
import { collegaRipristino } from './core/ripristino.js';
import { preparaCondivisione, collegaCondivisione } from './core/condivisione.js';
import { creaDifferiti } from './core/differiti.js';
import { collegaTabMobile } from './core/tab-mobile.js';
import { traduciModuli } from './core/traduci-moduli.js';
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
import mefImmobili from './layers/mef-immobili.js';
import pai from './layers/pai.js';
import trasporto from './layers/trasporto.js';
import sicurezza, { STRATI_INCIDENTI, legendaSicurezza } from './layers/sicurezza.js';
import { collegaFiltroIncidenti } from './layers/sicurezza-filtro.js';
import { collegaRicercaTerritorio } from './layers/ricerca-territorio.js';
import { collegaRicercaIncidenti } from './layers/sicurezza-ricerca.js';
import { collegaFiltroLinea } from './layers/trasporto-filtro.js';
import terreno from './layers/terreno.js';
import base from './layers/base.js';
import { t } from './core/i18n.js';

// telefono: barra a quattro tab (Mappa, Strati, Aggiungi, Info) e foglio degli strati; la legenda si può ridurre
let tornaAllaMappa = () => {}; // si completa quando i pannelli laterali esistono
const tab = collegaTabMobile(document, { barraTitolo: document.querySelector('#barra-strati .barra-titolo'), suMappa: () => tornaAllaMappa() });
document.getElementById('corpo').append(tab.barra);
document.getElementById('chiudi-strati').addEventListener('click', () => tab.imposta(null));
const riduciLegenda = document.getElementById('legende-riduci');
riduciLegenda.addEventListener('click', () => {
  const ridotta = document.getElementById('legende-box').classList.toggle('ridotta');
  riduciLegenda.setAttribute('aria-expanded', String(!ridotta));
  riduciLegenda.textContent = ridotta ? t('app.legenda.apri') : t('html.legende.riduci');
});

// ordine = ordine di sovrapposizione dei layer (il primo sta sotto)
const MODULI = [base, terreno, popolazione, territorio, edifici, pai, monumenti, alberi, fontanelle, trasporto, sicurezza, colonnine, uffici, scuole, incendi, isoleCalore, mefImmobili, confini];
traduciModuli(MODULI); // in inglese: titoli, etichette e descrizioni dei layer dai dizionari (lbl.*)

const catalogoPromessa = caricaCatalogo().catch(() => null);
const condivisionePromessa = preparaCondivisione(window); // un link condiviso porta le preferenze del mittente: va letto prima dei pannelli

// Gli strati puntuali nascono spenti, ma la scheda li interroga anche da spenti: i loro dati (GeoJSON) non bloccano l'avvio.
// Partono in secondo piano poco dopo (o alla prima accensione, o al primo clic sulla mappa, se arriva prima): vedi core/differiti.js.
// Il trasporto resta fuori perché il filtro Linea ha bisogno dei suoi dati subito.
const DIFFERITI = new Set(['monumenti', 'alberi', 'fontanelle', 'scuole', 'uffici', 'colonnine']);

// la mappa (hash: true) riscrive subito l'hash con la vista: la scheda richiesta dall'indirizzo (#guida, #fonti…) va letta prima
const SCHEDA_INDIRIZZO = location.hash.slice(1);
const map = creaMappa('mappa', () => segnala(t('app.basemap.errore')));
const differiti = creaDifferiti(map, { segnala });
const caricaDifferiti = () => differiti.tutti().then(() => { window.dt.differitiPronti = true; });
window.dt = { map, moduli: Object.fromEntries(MODULI.map(m => [m.id, m])), pronto: false, differitiPronti: false, differiti: caricaDifferiti };

// Un errore su una sorgente disattiva solo gli strati che la usano e li nomina nell'avviso
// (con l'etichetta del pannello, non con l'id tecnico).
const STRATI = MODULI.flatMap(m => m.strati);
map.on('error', e => {
  if (!e.sourceId || /^(rndt|miei)-/.test(e.sourceId)) return; // gli errori dei layer RNDT e dei «miei layer» li segnalano gli host
  if (e.error?.name === 'AbortError') return; // richiesta annullata di proposito (es. setData() durante il primo caricamento): non è un errore dello strato
  const colpiti = STRATI.filter(s => s.layers.some(id => map.getLayer(id)?.source === e.sourceId));
  if (!colpiti.length) return segnala(t('avviso.stratoNonCaricato.dettaglio', { nome: e.sourceId }));
  segnala(t('avviso.stratoNonCaricato.dettaglio', { nome: colpiti.map(s => s.etichetta).join(', ') }));
  colpiti.forEach(s => disattivaStrato(map, s));
});

// Gli strati si aggiungono appena lo stile è pronto, senza aspettare i tile della base:
// così una base lenta o irraggiungibile non blocca il viewer.
map.once('style.load', async () => {
  const catalogo = await catalogoPromessa;
  const condivisione = await condivisionePromessa;
  if (catalogo) impostaCatalogo(catalogo);
  else segnala(t('app.catalogo.errore'));

  for (const m of MODULI) { if (DIFFERITI.has(m.id)) differiti.aggiungi(m); else m.aggiungiSorgenti(map); }
  for (const m of MODULI) m.aggiungiLayer(map);
  try { migraFileLocali(window.localStorage); } catch { /* storage bloccato: niente da spostare */ }
  const gruppoRndt = creaGruppoRndt(); // ultimi gruppi della barra: i loro layer arrivano a runtime
  const gruppoMiei = creaGruppo(OPZIONI_MIEI);
  costruisciPannello(map, [...MODULI, gruppoRndt.modulo, gruppoMiei.modulo], document.getElementById('pannello'), document.getElementById('barra-gruppi'));
  const rndt = collegaRndt(map, document.getElementById('rndt-pannello'), gruppoRndt);
  const aggiungi = collegaAggiungi(map, gruppoMiei);
  collegaScheda(map, MODULI, document.getElementById('scheda'), { rndt: creaInterrogazione([rndt.host, aggiungi.host]) }); // la scheda interroga i layer RNDT e i «miei layer»
  // Geoimage (circa 100 KB di moduli) si carica al primo clic sul suo tab, o all'avvio solo se c'è un progetto da ripristinare.
  const pannelloGeo = document.getElementById('geoimage-pannello');
  let geoPronto = null;
  const caricaGeoimage = () => geoPronto ??= import('./geoimage/index.js').then(({ collegaGeoimage }) => {
    const g = collegaGeoimage(map, pannelloGeo);
    window.dt.geoimage = g;
    return g;
  });
  const geoimage = {
    async apri() { // il pannello si apre subito, con un segnaposto che il modulo sostituisce appena caricato
      if (!geoPronto) pannelloGeo.textContent = t('app.caricamento');
      pannelloGeo.hidden = false;
      try { await caricaGeoimage(); } catch (e) { geoPronto = null; pannelloGeo.hidden = true; segnala(t('app.geoimage.errore', { msg: e.message })); }
    },
    chiudi() { pannelloGeo.hidden = true; },
    async ripristina() {
      let salvato = null;
      try { salvato = window.localStorage.getItem(CHIAVE_GEOIMAGE); } catch { /* storage bloccato: niente da ripristinare */ }
      if (salvato) (await caricaGeoimage().catch(() => null))?.ripristina();
    },
  };
  const rail = collegaRail(document.getElementById('rail-pannelli'), [
    { id: 'scheda', etichetta: t('app.rail.scheda'), pannello: document.getElementById('scheda') },
    { id: 'rndt', etichetta: 'RNDT', pannello: document.getElementById('rndt-pannello'), apri: rndt.apri, chiudi: rndt.chiudi },
    { id: 'geoimage', etichetta: t('app.rail.geoimage'), pannello: pannelloGeo, apri: geoimage.apri, chiudi: geoimage.chiudi },
  ]);
  // su mobile la barra laterale non c'è: Geoimage si apre dal pannello Strati
  const btnGeo = Object.assign(document.createElement('button'), { type: 'button', id: 'btn-geoimage-m', className: 'btn-pannello-mobile', title: t('html.geoimage.aria') });
  btnGeo.innerHTML = `${ICONE_RAIL.geoimage}<span class="et">Geoimage</span>`;
  btnGeo.addEventListener('click', () => { tab.imposta(null); rail.commuta('geoimage'); });
  // il catalogo RNDT sta tra i riquadri di «Aggiungi»; l'elenco dei layer RNDT aggiunti è in cima al suo pannello
  const btnCatalogo = Object.assign(document.createElement('button'), { type: 'button', id: 'btn-rndt-m', className: 'btn-pannello-mobile', title: t('html.btn.rndt') });
  btnCatalogo.innerHTML = `${ICONE_RAIL.rndt}<span class="et">${t('html.btn.rndt.aria')}</span>`;
  btnCatalogo.addEventListener('click', () => { tab.imposta(null); rail.commuta('rndt'); });
  document.getElementById('barra-gruppi').append(btnCatalogo, btnGeo);
  document.getElementById('btn-rndt').addEventListener('click', () => rail.commuta('rndt'));
  tornaAllaMappa = () => { rail.chiudi('rndt'); rail.chiudi('geoimage'); document.getElementById('crediti').open && document.getElementById('crediti').close(); };
  aggiungi.ripristina(); // i layer aggiunti dall'utente tornano prima, così quelli RNDT restano sopra
  rndt.ripristina(); // i layer RNDT della sessione precedente tornano sopra tutti gli altri
  geoimage.ripristina(); // e la mappa storica di Geoimage, se c'era
  window.dt.geoimage ??= geoimage;
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
  window.dt.tabella = collegaTabella(map, { pulsante: document.getElementById('btn-tabella') });
  // su mobile la barra strumenti non c'è: la tabella si apre dal foglio Strati (riguarda i layer accesi)
  const btnTabella = Object.assign(document.createElement('button'), { type: 'button', id: 'btn-tabella-m', className: 'btn-pannello-mobile', title: t('html.btn.tabella') });
  btnTabella.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/></svg><span class="et">${t('tab.tabella')}</span>`;
  btnTabella.addEventListener('click', () => { tab.imposta(null); window.dt.tabella.apri(); });
  document.getElementById('barra-gruppi').append(btnTabella);
  collegaCursorePunti(map);
  collegaStampa(map, document.getElementById('btn-stampa'), document.getElementById('stampa-menu'));
  const archivioLocale = (() => { try { return window.localStorage; } catch { return null; } })();
  window.dt.condivisione = collegaCondivisione(map, document.getElementById('btn-condividi'), { storage: archivioLocale });
  if (condivisione.invalido) segnala(t('app.link.invalido'));
  // coordinate sotto il puntatore (a mouse fermo fuori dalla mappa, il centro) e zoom nel piè di pagina
  const piedeCoord = document.getElementById('piede-coord');
  let puntatore = null;
  const aggiornaCoord = () => {
    const c = puntatore ?? map.getCenter();
    piedeCoord.textContent = `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)} · zoom ${map.getZoom().toFixed(1)}`;
  };
  map.on('mousemove', e => { puntatore = e.lngLat; aggiornaCoord(); });
  map.getCanvas().addEventListener('mouseleave', () => { puntatore = null; aggiornaCoord(); });
  map.on('move', () => { if (!puntatore) aggiornaCoord(); });
  map.on('zoom', aggiornaCoord);
  aggiornaCoord();
  // scala metrica in basso a destra (segue il pannello via CSS); bussola nella barra strumenti, solo in vista 3D
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-right');
  const btnBussola = document.getElementById('btn-bussola');
  const ago = document.getElementById('bussola-ago');
  map.on('rotate', () => { ago.style.transform = `rotate(${-map.getBearing()}deg)`; });
  btnBussola.addEventListener('click', () => map.easeTo({ bearing: 0, duration: 300 }));
  document.addEventListener('vista3d', e => { btnBussola.hidden = !e.detail; });
  collegaRipristino(document.getElementById('cerca-ripristina'), (() => { try { return window.localStorage; } catch { return null; } })(), undefined, undefined, () => {
    const scheda = document.getElementById('scheda');
    if (scheda.hidden) return false;
    scheda.querySelector('.scheda-x')?.click();
    return true;
  });

  const esiti = await Promise.allSettled(MODULI.filter(m => m.avvia && !DIFFERITI.has(m.id)).map(m => m.avvia(map)));
  esiti.forEach(e => { if (e.status === 'rejected') segnala(t('avviso.stratoNonCaricato.dettaglio', { nome: e.reason?.message ?? e.reason })); });
  // il filtro Linea ha bisogno dei dati del trasporto, caricati da `avvia`
  collegaFiltroLinea(map, { select: document.getElementById('f-linea'), chips: document.getElementById('filtri-linea-chips'), ...trasporto.filtro() });

  const foglio = document.getElementById('crediti');
  const menu = document.getElementById('menu-info');
  const toggle = document.getElementById('menu-info-toggle');
  const chiudiMenu = () => { menu.classList.remove('aperto'); toggle.setAttribute('aria-expanded', 'false'); };
  const commuta = tab => {
    if (tab === 'mappa') return foglio.open && foglio.close();
    if (catalogo) commutaCrediti(foglio, catalogo, [...MODULI, gruppoRndt.modulo, gruppoMiei.modulo], tab);
    else segnala(t('app.fonti.errore'));
  };
  const segna = tab => menu.querySelectorAll('button').forEach(b => {
    if (b.dataset.scheda === (tab ?? 'mappa')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  menu.addEventListener('click', e => {
    const b = e.target.closest('button[data-scheda]');
    if (!b) return;
    commuta(b.dataset.scheda);
    chiudiMenu();
    tab.imposta(null); // sul telefono la pagina scelta si apre sopra la mappa e il foglio Info si chiude
  });
  // interruttore del tema scuro nell'header (sul telefono il pulsante della barra strumenti non c'è): segue lo stesso pulsante
  const interruttoreTema = document.getElementById('switch-tema');
  const mostraInterruttore = scuro => interruttoreTema.setAttribute('aria-checked', String(scuro));
  mostraInterruttore(document.documentElement.dataset.tema === 'scuro');
  interruttoreTema.addEventListener('click', () => document.getElementById('btn-tema').click());
  document.addEventListener('tema', e => mostraInterruttore(e.detail));
  toggle.addEventListener('click', () => {
    const aperto = menu.classList.toggle('aperto');
    toggle.setAttribute('aria-expanded', String(aperto));
  });
  // ogni sezione ha il suo indirizzo (#fonti, #guida…): si può condividere e si riapre al caricamento
  const indirizzo = id => history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
  foglio.addEventListener('scheda', e => { segna(e.detail); indirizzo(e.detail); });
  foglio.addEventListener('close', () => { segna(null); indirizzo(null); });
  document.getElementById('app-logo').addEventListener('click', e => { if (foglio.open) { e.preventDefault(); foglio.close(); } });
  const iniziale = SCHEDA_INDIRIZZO;
  if (menu.querySelector(`[data-scheda="${iniziale}"]`) && iniziale !== 'mappa') commuta(iniziale);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (foglio.open) foglio.close();
    else chiudiMenu();
  });
  collegaInvito(map, document, (() => { try { return window.localStorage; } catch { return null; } })(), { url: location.search });
  if (condivisione.stato) {
    const ignorati = window.dt.condivisione.applica(condivisione.stato);
    if (ignorati.length) segnala(t('app.link.ignorati', { elenco: ignorati.join(', ') }));
  }
  window.dt.pronto = true;
  setTimeout(() => (window.requestIdleCallback ?? (f => f()))(() => caricaDifferiti()), 3000);
});

// Service worker (sw.js): visite ripetute immediate e interfaccia anche senza rete. Si registra solo in HTTPS (produzione) o con ?sw per provarlo:
// in locale no, così lo sviluppo vede sempre i file nuovi.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || /[?&]sw(=|&|$)/.test(location.search))) {
  const registra = () => navigator.serviceWorker.register('sw.js').catch(() => { /* senza service worker l'app funziona uguale */ });
  // i moduli finiscono di caricarsi anche dopo l'evento load: se la pagina è già completa si registra subito
  if (document.readyState === 'complete') registra(); else window.addEventListener('load', registra);
}
