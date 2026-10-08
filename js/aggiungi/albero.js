// js/aggiungi/albero.js
// L'albero di «I miei layer», come il Browser di QGIS: ricerca, «I miei dati» (file) e «Servizi» (XYZ, WMS, WFS) con i
// servizi salvati e un modulo per aggiungerne. Si crea una volta sola: il gruppo lo rimette a ogni ridisegno, quindi
// rami aperti e testo digitato restano.
import { ESTENSIONI } from '../rndt/importa.js';
import { TETTO_SERVIZI } from './salvati.js';

const SVG = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
// icone dei servizi, nello spirito del Browser di QGIS: tratto colorato, un colore per tipo (leggibile su tema chiaro e scuro)
const LINEE = (colore, interno) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${colore}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${interno}</svg>`;
const GLOBO = '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18"/>';
export const ICONE = {
  cartella: SVG('M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'),
  carica: SVG('M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z'),
  piu: SVG('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'),
  cestino: SVG('M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'),
  xyz: LINEE('#2e9a57', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
  wms: LINEE('#2f7fd0', GLOBO),
  wmts: LINEE('#7b61c9', `${GLOBO.replace('M3 12h18', 'M4 8h16M4 16h16')}`),
  wfs: LINEE('#e08a1e', '<path d="M5 17 10 6l9 5-3 8z"/><g fill="currentColor"><rect x="3" y="15" width="4" height="4"/><rect x="8" y="4" width="4" height="4"/><rect x="17" y="9" width="4" height="4"/><rect x="14" y="17" width="4" height="4"/></g>'),
  arcgis: LINEE('#1f9bb5', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/>'),
  lucchetto: SVG('M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'),
};
export const TIPI = [
  { id: 'xyz', titolo: 'XYZ', esempio: 'https://tile.example.org/{z}/{x}/{y}.png' },
  { id: 'wms', titolo: 'WMS', esempio: 'https://servizio.example.org/geoserver/ows' },
  { id: 'wmts', titolo: 'WMTS', esempio: 'https://servizio.example.org/wmts' },
  { id: 'wfs', titolo: 'WFS', esempio: 'https://servizio.example.org/geoserver/ows' },
  { id: 'arcgis', titolo: 'ArcGIS REST', esempio: 'https://server.example.org/arcgis/rest/services/Cartella/Servizio/MapServer' },
];

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}
const bottone = (testo, classe = 'agg-bottone') => Object.assign(el('button', classe, testo), { type: 'button' });
const esito = (p, testo, errore = false) => { p.textContent = testo; p.dataset.errore = String(errore); p.hidden = !testo; };
const nuovoEsito = () => Object.assign(el('p', 'agg-esito'), { hidden: true });
function campo(etichetta, segnaposto, { tipo = 'text', complete = 'off' } = {}) {
  const label = el('label', 'agg-campo');
  label.append(el('span', null, etichetta));
  const input = el('input');
  input.type = tipo;
  input.placeholder = segnaposto;
  input.autocomplete = complete;
  input.spellcheck = false;
  label.append(input);
  return { label, input };
}

// Un nodo dell'albero: <details> con icona, nome, conteggio e (facoltativa) un'azione a destra
function nodo(titolo, { icona, apri = true, azione = null, classe = '' } = {}) {
  const det = el('details', `agg-nodo ${classe}`.trim());
  det.open = apri;
  const sommario = el('summary');
  const ico = el('span', 'agg-ico');
  ico.innerHTML = ICONE[icona] ?? '';
  const conteggio = el('span', 'agg-conteggio');
  sommario.append(ico, el('span', 'agg-nome', titolo), conteggio);
  if (azione) {
    const b = bottone('', 'agg-azione');
    b.innerHTML = ICONE[azione.icona];
    b.title = azione.titolo;
    b.setAttribute('aria-label', azione.titolo);
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); azione.suClic(); });
    sommario.append(b);
  }
  const figli = el('div', 'agg-figli');
  det.append(sommario, figli);
  return { det, figli, conteggio };
}

export function creaAlbero({ controllo, carica, caricaDaUrl, avvisa }) {
  const radice = el('div', 'agg-albero');

  const cerca = el('input', 'agg-cerca');
  cerca.id = 'miei-cerca';
  cerca.type = 'search';
  cerca.placeholder = 'Cerca sorgenti dati…';
  cerca.setAttribute('aria-label', 'Cerca tra i servizi salvati');

  // file dal computer
  const selettore = Object.assign(el('input'), { type: 'file', multiple: true, accept: ESTENSIONI.join(','), hidden: true });
  selettore.addEventListener('change', async () => {
    const files = [...selettore.files];
    selettore.value = ''; // permette di riscegliere lo stesso file
    for (const file of files) await carica(file);
  });
  const dati = nodo('I miei dati', { icona: 'cartella', azione: { icona: 'carica', titolo: 'Carica file dal computer', suClic: () => selettore.click() } });
  dati.figli.append(el('p', 'agg-nota', 'GeoJSON, KML/KMZ, GPX, Shapefile (.zip) e CSV con latitudine e longitudine.'), selettore);

  // file da un indirizzo https, anche un foglio Google condiviso con «chiunque abbia il link» (copia al momento del caricamento)
  const web = campo('Da indirizzo web (https)', 'https://docs.google.com/spreadsheets/d/…', { tipo: 'url' });
  const scarica = bottone('Carica', 'agg-bottone agg-primario');
  const esitoWeb = nuovoEsito();
  const inviaWeb = async () => {
    const testo = web.input.value.trim();
    if (!testo) return esito(esitoWeb, 'Incolla un indirizzo https.', true);
    scarica.disabled = true;
    esito(esitoWeb, 'Scarico il file…');
    try {
      await caricaDaUrl(testo);
      web.input.value = '';
      esito(esitoWeb, '');
    } catch (errore) { esito(esitoWeb, `Non riesco a caricare: ${errore.message}.`, true); } finally { scarica.disabled = false; }
  };
  scarica.addEventListener('click', inviaWeb);
  web.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inviaWeb(); } });
  const moduloWeb = el('div', 'agg-modulo agg-da-web');
  moduloWeb.append(web.label, scarica, esitoWeb);
  const infoSheets = el('details', 'agg-info');
  infoSheets.append(el('summary', null, 'Come condividere un foglio Google'),
    el('p', 'agg-nota', 'In Condividi → Accesso generale scegli «Chiunque abbia il link» con ruolo Lettore. Il foglio diventa un CSV (solo il foglio indicato nel link) e deve avere colonne lat e lon. Massimo 10 MB.'));
  dati.figli.append(moduloWeb, infoSheets);

  const servizi = nodo('Servizi', { icona: 'cartella' });
  const rami = new Map();

  function riferisci(p, { pieno = false, errori = [] }, totale) {
    const ok = totale - errori.length;
    const parti = [];
    if (ok) parti.push(`${ok} ${ok === 1 ? 'layer aggiunto' : 'layer aggiunti'} alla mappa.`);
    if (pieno) parti.push(`Limite di ${TETTO_SERVIZI} servizi salvati raggiunto: questo non si salva.`);
    for (const e of errori) parti.push(`«${e.nome}»: ${e.messaggio}.`);
    esito(p, parti.join(' '), errori.length > 0 && !ok);
  }

  function mostraScelta(tipo, scelta, servizio, dati, esitoForm) {
    const voci = tipo === 'wms' || tipo === 'wmts' ? servizio.layer : tipo === 'wfs' ? servizio.tipi : servizio.layer.map(l => ({ ...l, titolo: l.nome }));
    // ArcGIS: lo stesso servizio si può vedere come immagini o come dati
    let modo = null;
    if (tipo === 'arcgis') {
      modo = el('select', 'agg-modo');
      for (const [v, t] of [['immagini', 'Immagini (come una mappa)'], ['dati', 'Dati (elementi che si possono interrogare)']]) modo.append(Object.assign(el('option', null, t), { value: v }));
      if (servizio.tipo === 'FeatureServer') { modo.value = 'dati'; modo.querySelector('[value=immagini]').disabled = true; }
      const etichetta = el('label', 'agg-campo');
      etichetta.append(el('span', null, 'Mostra come'), modo);
      scelta.append(etichetta);
      if (servizio.cache) scelta.append(el('p', 'agg-nota', 'Il servizio ha una cache a tile: come «Immagini» si aggiunge un solo layer con tutti i livelli.'));
    }
    const righe = voci.map(v => {
      const label = el('label', 'agg-voce');
      const casella = el('input');
      casella.type = 'checkbox';
      casella.disabled = v.supportato === false;
      label.append(casella, ' ', v.titolo);
      if (v.supportato === false) label.append(' ', el('em', null, tipo === 'wmts' ? '(non supportato: serve EPSG:3857, tile 256)' : '(non supportato: serve EPSG:3857)'));
      return { v, casella, label };
    });
    const vai = bottone('Aggiungi selezionati', 'agg-bottone agg-primario');
    scelta.append(...righe.map(r => r.label), vai);
    scelta.hidden = false;
    vai.addEventListener('click', async () => {
      const scelti = righe.filter(r => r.casella.checked).map(r => r.v);
      if (!scelti.length) return esito(esitoForm, 'Scegli almeno un elemento.', true);
      vai.disabled = true;
      esito(esitoForm, 'Aggiungo alla mappa…');
      const comune = { ...dati, servizio, scelti };
      const r = await (tipo === 'wms' ? controllo.aggiungiWms(comune)
        : tipo === 'wmts' ? controllo.aggiungiWmts(comune)
          : tipo === 'wfs' ? controllo.aggiungiWfs(comune)
            : controllo.aggiungiArcgis({ ...comune, modo: modo.value, conToken: servizio.conToken }));
      vai.disabled = false;
      riferisci(esitoForm, r, tipo === 'arcgis' && modo.value === 'immagini' && servizio.cache ? 1 : scelti.length);
    });
  }

  function creaModulo(tipo) {
    const form = el('form', 'agg-modulo');
    form.noValidate = true;
    form.hidden = true;
    const nome = campo('Nome (facoltativo)', 'Come lo chiami');
    const url = campo(tipo.id === 'xyz' ? 'Indirizzo con {z}/{x}/{y}' : tipo.id === 'arcgis' ? 'Indirizzo del servizio (MapServer o FeatureServer; con ?token=… se serve)' : 'Indirizzo del servizio', tipo.esempio, { tipo: 'url' });
    const utente = campo('Utente (se serve)', 'Nome utente', { complete: 'off' });
    const password = campo('Password (se serve)', 'Resta solo finché la pagina è aperta', { tipo: 'password', complete: 'new-password' });
    const esitoForm = nuovoEsito();
    const credenziali = () => ({ utente: utente.input.value.trim() || undefined, password: password.input.value });
    form.append(nome.label, url.label, utente.label, password.label);
    if (tipo.id === 'xyz') {
      const vai = bottone('Aggiungi', 'agg-bottone agg-primario');
      vai.type = 'submit';
      form.append(vai, esitoForm);
      form.addEventListener('submit', e => {
        e.preventDefault();
        try {
          const { pieno } = controllo.aggiungiXyz({ nome: nome.input.value, url: url.input.value, ...credenziali() });
          esito(esitoForm, pieno ? `Aggiunto alla mappa. Hai raggiunto il limite di ${TETTO_SERVIZI} servizi salvati: questo non si salva.` : 'Aggiunto alla mappa.');
          password.input.value = '';
          if (!pieno) { url.input.value = ''; nome.input.value = ''; }
        } catch (errore) { esito(esitoForm, errore.message, true); }
      });
      return form;
    }
    const leggi = bottone('Leggi il servizio', 'agg-bottone agg-primario');
    leggi.type = 'submit';
    const scelta = el('div', 'agg-scelta');
    scelta.hidden = true;
    form.append(leggi, esitoForm, scelta);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      scelta.hidden = true;
      scelta.replaceChildren();
      esito(esitoForm, 'Leggo il servizio…');
      leggi.disabled = true;
      try {
        const { utente: u, password: p } = credenziali();
        const servizio = await controllo.leggiServizio(tipo.id, url.input.value, { utente: u, password: p });
        password.input.value = ''; // la password è già in memoria nel controllo: non resta nel campo
        esito(esitoForm, '');
        mostraScelta(tipo.id, scelta, servizio, { nome: nome.input.value, url: servizio.url, utente: u }, esitoForm);
      } catch (errore) { esito(esitoForm, `Non riesco a leggere il servizio: ${errore.message}`, true); } finally { leggi.disabled = false; }
    });
    return form;
  }

  for (const tipo of TIPI) {
    const modulo = creaModulo(tipo);
    const ramo = nodo(tipo.titolo, {
      icona: tipo.id, apri: false, classe: 'agg-tipo',
      azione: { icona: 'piu', titolo: `Aggiungi un servizio ${tipo.titolo}`, suClic: () => { ramo.det.open = true; modulo.hidden = !modulo.hidden; if (!modulo.hidden) modulo.querySelector('input')?.focus(); } },
    });
    const elenco = el('div', 'agg-elenco');
    ramo.figli.append(modulo, elenco);
    rami.set(tipo.id, { ramo, elenco });
    servizi.figli.append(ramo.det);
  }

  // un servizio salvato: clic = in mappa; con il lucchetto chiede prima la password
  function rigaServizio(s) {
    const riga = el('div', 'agg-salvato');
    const serve = controllo.serveCredenziali(s.id);
    const apri = bottone('', 'agg-salvato-nome');
    const tipoIco = el('span', 'agg-ico');
    tipoIco.innerHTML = ICONE[s.tipo] ?? '';
    apri.append(tipoIco);
    if (serve) { const l = el('span', 'agg-ico'); l.innerHTML = ICONE.lucchetto; apri.append(l); }
    apri.append(el('span', null, s.nome));
    apri.title = serve ? (s.conToken ? `Serve il token — ${s.url}` : `Serve la password di «${s.utente}» — ${s.url}`) : `Metti in mappa — ${s.url}`;
    const togli = bottone('', 'agg-azione');
    togli.innerHTML = ICONE.cestino;
    togli.title = `Togli «${s.nome}» dai servizi salvati`;
    togli.setAttribute('aria-label', togli.title);
    togli.addEventListener('click', () => controllo.rimuovi(s.id));
    const esitoRiga = nuovoEsito();
    riga.append(apri, togli, esitoRiga);
    const fatto = ({ errori }) => (errori.length
      ? esito(esitoRiga, errori.map(e => `«${e.nome}»: ${e.messaggio}.`).join(' '), true)
      : avvisa(`«${s.nome}» è in mappa.`));
    apri.addEventListener('click', async () => {
      if (!serve) { apri.disabled = true; fatto(await controllo.riaggiungi(s.id)); apri.disabled = false; return; }
      if (riga.querySelector('form')) return;
      const form = el('form', 'agg-modulo');
      const pw = campo(s.conToken ? 'Token del servizio' : `Password di ${s.utente}`, 'Resta solo finché la pagina è aperta', { tipo: 'password', complete: 'new-password' });
      const entra = bottone('Entra', 'agg-bottone agg-primario');
      entra.type = 'submit';
      form.append(pw.label, entra);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        entra.disabled = true;
        const r = await controllo.riaggiungi(s.id, { password: pw.input.value });
        pw.input.value = '';
        entra.disabled = false;
        if (!r.errori.length) form.remove();
        fatto(r);
      });
      riga.append(form);
      pw.input.focus();
    });
    return riga;
  }

  function disegna() {
    const testo = cerca.value;
    const tutti = controllo.stato().servizi;
    const visibili = controllo.cerca(testo);
    for (const tipo of TIPI) {
      const { ramo, elenco } = rami.get(tipo.id);
      const suoi = tutti.filter(s => s.tipo === tipo.id);
      const mostrati = visibili.filter(s => s.tipo === tipo.id);
      ramo.conteggio.textContent = suoi.length ? String(suoi.length) : '';
      elenco.replaceChildren(...mostrati.map(rigaServizio));
      if (testo.trim() && mostrati.length) ramo.det.open = true;
    }
  }
  cerca.addEventListener('input', disegna);
  controllo.suCambio(disegna);
  disegna();

  const titoloLayer = el('p', 'agg-titolo-layer', 'Layer in mappa');
  radice.append(cerca, dati.det, servizi.det, titoloLayer);
  return radice;
}
