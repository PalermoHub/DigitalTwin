// js/aggiungi/pannello.js
// Pannello «Aggiungi layer»: albero con «I miei dati» (file) e «Servizi» (XYZ, WMS, WFS), ognuno col suo «＋» e l'elenco dei servizi salvati.
import { ESTENSIONI } from '../rndt/importa.js';
import { TETTO_SERVIZI } from './salvati.js';

const TIPI = [
  { id: 'xyz', titolo: 'XYZ', esempio: 'https://tile.example.org/{z}/{x}/{y}.png' },
  { id: 'wms', titolo: 'WMS', esempio: 'https://servizio.example.org/geoserver/ows' },
  { id: 'wfs', titolo: 'WFS', esempio: 'https://servizio.example.org/geoserver/ows' },
];

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}
function campo(etichetta, segnaposto, tipo = 'text') {
  const label = el('label', 'agg-campo');
  label.append(el('span', null, etichetta));
  const input = el('input');
  input.type = tipo;
  input.placeholder = segnaposto;
  input.autocomplete = 'off';
  input.spellcheck = false;
  label.append(input);
  return { label, input };
}
const bottone = (testo, classe = 'agg-bottone') => Object.assign(el('button', classe, testo), { type: 'button' });
const esito = (p, testo, errore = false) => { p.textContent = testo; p.dataset.errore = String(errore); p.hidden = !testo; };
const nuovoEsito = () => Object.assign(el('p', 'agg-esito'), { hidden: true });

export function creaPannello(elemento, controllo, { selezionaFile, avvisa }) {
  const testata = el('header', 'rndt-testata');
  testata.append(el('h2', null, 'Aggiungi layer'));
  const contenuto = el('div', 'rndt-contenuto agg-contenuto');
  elemento.append(testata, contenuto);

  // «I miei dati»
  const dati = el('details', 'agg-sezione');
  dati.open = true;
  dati.append(el('summary', null, 'I miei dati'));
  const file = bottone('📁 Carica file dal computer', 'rndt-gruppo-aggiungi');
  file.title = `Formati: ${ESTENSIONI.join(' ')}`;
  file.addEventListener('click', selezionaFile);
  dati.append(file, el('p', 'agg-nota', 'GeoJSON, KML/KMZ, GPX, Shapefile (.zip) e CSV con latitudine e longitudine.'));

  // «Servizi»
  const servizi = el('details', 'agg-sezione');
  servizi.open = true;
  servizi.append(el('summary', null, 'Servizi'));
  const cerca = el('input', 'agg-cerca');
  cerca.type = 'search';
  cerca.placeholder = 'Cerca tra i servizi salvati…';
  cerca.setAttribute('aria-label', 'Cerca tra i servizi salvati');
  servizi.append(cerca);

  function riferisci(p, { pieno = false, errori = [] }, totale) {
    const ok = totale - errori.length;
    const parti = [];
    if (ok) parti.push(`${ok} ${ok === 1 ? 'layer aggiunto' : 'layer aggiunti'} alla mappa.`);
    if (pieno) parti.push(`Limite di ${TETTO_SERVIZI} servizi salvati raggiunto: questo non si salva.`);
    for (const e of errori) parti.push(`«${e.nome}»: ${e.messaggio}.`);
    esito(p, parti.join(' '), errori.length > 0 && !ok);
  }

  function mostraScelta(tipo, scelta, servizio, nome, esitoForm) {
    const voci = tipo === 'wms' ? servizio.layer : servizio.tipi;
    const righe = voci.map(v => {
      const label = el('label', 'agg-voce');
      const casella = el('input');
      casella.type = 'checkbox';
      const nonSupportato = v.supportato === false;
      casella.disabled = nonSupportato;
      label.append(casella, ' ', v.titolo);
      if (nonSupportato) label.append(' ', el('em', null, '(non supportato: serve EPSG:3857)'));
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
      const dati = { nome: nome.value, url: servizio.url, servizio, scelti };
      const r = await (tipo === 'wms' ? controllo.aggiungiWms(dati) : controllo.aggiungiWfs(dati));
      vai.disabled = false;
      riferisci(esitoForm, r, scelti.length);
    });
  }

  function creaModulo(tipo) {
    const form = el('form', 'agg-modulo');
    form.noValidate = true;
    const nome = campo('Nome (facoltativo)', 'Come lo chiami');
    const url = campo(tipo.id === 'xyz' ? 'Indirizzo con {z}/{x}/{y}' : 'Indirizzo del servizio', tipo.esempio, 'url');
    const esitoForm = nuovoEsito();
    form.append(nome.label, url.label);
    if (tipo.id === 'xyz') {
      const vai = bottone('Aggiungi', 'agg-bottone agg-primario');
      vai.type = 'submit';
      form.append(vai, esitoForm);
      form.addEventListener('submit', e => {
        e.preventDefault();
        try {
          const { pieno } = controllo.aggiungiXyz({ nome: nome.input.value, url: url.input.value });
          esito(esitoForm, pieno ? `Aggiunto alla mappa. Hai raggiunto il limite di ${TETTO_SERVIZI} servizi salvati: questo non si salva.` : 'Aggiunto alla mappa.');
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
        const servizio = await controllo.leggiServizio(tipo.id, url.input.value);
        esito(esitoForm, '');
        mostraScelta(tipo.id, scelta, servizio, nome.input, esitoForm);
      } catch (errore) { esito(esitoForm, `Non riesco a leggere il servizio: ${errore.message}`, true); } finally { leggi.disabled = false; }
    });
    return form;
  }

  const rami = new Map();
  for (const tipo of TIPI) {
    const ramo = el('details', 'agg-ramo');
    const sommario = el('summary');
    const conteggio = el('span', 'agg-conteggio');
    const piu = bottone('＋', 'agg-piu');
    piu.title = `Aggiungi un servizio ${tipo.titolo}`;
    piu.setAttribute('aria-label', piu.title);
    sommario.append(el('span', null, tipo.titolo), conteggio, piu);
    const modulo = creaModulo(tipo);
    modulo.hidden = true;
    const elenco = el('div', 'agg-elenco');
    ramo.append(sommario, modulo, elenco);
    piu.addEventListener('click', e => {
      e.preventDefault();
      ramo.open = true;
      modulo.hidden = !modulo.hidden;
      if (!modulo.hidden) modulo.querySelector('input')?.focus();
    });
    rami.set(tipo.id, { conteggio, elenco, ramo });
    servizi.append(ramo);
  }
  contenuto.append(dati, servizi);

  // elenco dei servizi salvati, filtrato dalla ricerca
  function disegna() {
    const testo = cerca.value.trim().toLowerCase();
    const { servizi: salvati } = controllo.stato();
    for (const tipo of TIPI) {
      const { conteggio, elenco, ramo } = rami.get(tipo.id);
      const suoi = salvati.filter(s => s.tipo === tipo.id);
      conteggio.textContent = suoi.length ? `(${suoi.length})` : '';
      const visibili = suoi.filter(s => !testo || `${s.nome} ${s.url}`.toLowerCase().includes(testo));
      elenco.replaceChildren(...visibili.map(s => {
        const riga = el('div', 'agg-salvato');
        const apri = bottone(s.nome, 'agg-salvato-nome');
        apri.title = `Rimetti in mappa — ${s.url}`;
        const esitoRiga = nuovoEsito();
        apri.addEventListener('click', async () => {
          apri.disabled = true;
          const { errori } = await controllo.riaggiungi(s.id);
          apri.disabled = false;
          if (errori.length) esito(esitoRiga, errori.map(e => `«${e.nome}»: ${e.messaggio}.`).join(' '), true);
          else avvisa(`«${s.nome}» è in mappa.`);
        });
        const togli = bottone('Rimuovi', 'rndt-rimuovi');
        togli.title = `Togli «${s.nome}» dai servizi salvati`;
        togli.addEventListener('click', () => controllo.rimuovi(s.id));
        riga.append(apri, togli, esitoRiga);
        return riga;
      }));
      if (testo && visibili.length) ramo.open = true;
    }
  }
  cerca.addEventListener('input', disegna);
  controllo.suCambio(disegna);
  disegna();

  return {
    apri() { elemento.hidden = false; },
    chiudi() { elemento.hidden = true; },
  };
}
