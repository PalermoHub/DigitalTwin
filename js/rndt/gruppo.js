// js/rndt/gruppo.js
// Gruppo «RNDT» della barra strati: i layer aggiunti dal catalogo (al volo o richiamati dal salvataggio) con
// accensione, rimozione e il pulsante che apre il catalogo. Il gruppo nasce vuoto con la barra e si riempie
// quando l'host RNDT è pronto; resta allineato all'host con suCambio.

import { ESTENSIONI } from './importa.js';
import { occhio, sliderOpacita, abilitaRiordino } from '../core/pannello.js';
import { t } from '../core/i18n.js';

const ordina = (a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' });

// Modello delle righe (puro, testabile): ordine alfabetico, stato e nota di ogni layer
export function righeGruppo(elenco) {
  return [...elenco].sort(ordina).map(l => ({
    id: l.id,
    nome: l.nome,
    layers: l.idMappa ?? [],
    acceso: l.visibile && !l.indisponibile,
    disabilitato: l.indisponibile,
    nota: l.indisponibile ? t('rndt.nonDisponibile') : !l.salvato ? t('rndt.soloSessione') : l.errore ? t('rndt.erroriCaricamento') : '',
  }));
}

// Pallino e contatore dell'icona del gruppo: seguono i layer accesi, anche quando il gruppo si svuota
export const statoBottone = righe => {
  const n = righe.filter(r => r.acceso).length;
  return { attivo: n > 0, n };
};

// Dopo il ridisegno il focus torna sul controllo che l'aveva; se è sparito (layer rimosso), sul pulsante di ripiego
export const idDaFocalizzare = (idAttivo, idPresenti, ripiego) => (!idAttivo ? null : idPresenti.includes(idAttivo) ? idAttivo : ripiego);

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

export const OPZIONI_RNDT = {
  id: 'rndt',
  titolo: 'RNDT',
  argomento: { titolo: 'RNDT', descrizione: t('rndt.gruppo.descrizione') },
  vuoto: t('rndt.gruppo.vuoto'),
  azioni: [{ id: 'rndt-catalogo-apri', testo: t('rndt.gruppo.dalCatalogo'), tipo: 'apri' }],
};

export const OPZIONI_MIEI = {
  id: 'miei',
  titolo: t('gruppo.miei'),
  argomento: { titolo: t('gruppo.miei'), descrizione: t('miei.gruppo.descrizione') },
  vuoto: t('miei.gruppo.vuoto'),
  azioni: [],
  ripiego: 'miei-cerca',
};

// Un gruppo della barra strati alimentato da un host: layer con accensione, rimozione e pulsanti d'aggiunta
export function creaGruppo({ id, titolo, argomento, vuoto, azioni, ripiego }) {
  let radice = null;
  let host = null;
  let apri = () => {};
  let caricaFile = async () => {};
  let intestazione = null; // funzione che crea il contenuto fisso del gruppo (l'albero), chiamata una volta
  let fissa = null;

  const opacita = new Map(); // id → { originali, valore }: sopravvive al ridisegno del gruppo
  let selettore = null;
  // selettore dei file del computer: creato al primo disegno (serve il DOM), poi si sposta nel gruppo a ogni ridisegno
  function creaSelettore() {
    const input = el('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = ESTENSIONI.join(',');
    input.hidden = true;
    input.addEventListener('change', async () => {
      const files = [...input.files];
      input.value = ''; // permette di riscegliere lo stesso file
      for (const file of files) await caricaFile(file);
    });
    return input;
  }

  function disegna() {
    if (!radice || !host) return;
    selettore ??= azioni.some(a => a.tipo === 'file') ? creaSelettore() : el('span');
    fissa ??= intestazione?.() ?? null; // creato una volta e rimesso a ogni ridisegno: rami aperti e testo digitato restano
    const h2 = radice.querySelector('h2');
    const gruppoAzioni = el('div', 'rndt-gruppo-azioni');
    gruppoAzioni.append(...azioni.map(a => {
      const b = el('button', 'rndt-gruppo-aggiungi', a.testo);
      b.type = 'button';
      b.id = a.id;
      if (a.titolo) b.title = a.titolo;
      b.addEventListener('click', () => (a.tipo === 'file' ? selettore.click() : apri()));
      return b;
    }));
    const righe = righeGruppo(host.elenco());
    const voci = righe.length
      ? righe.flatMap(r => {
        const riga = el('div', 'rndt-gruppo-riga');
        const label = el('label', 'strato');
        const casella = el('input');
        casella.type = 'checkbox';
        casella.id = `strato-${r.id}`; // come gli altri strati: la tab Argomenti pilota queste caselle
        casella.checked = r.acceso;
        casella.disabled = r.disabilitato;
        casella.addEventListener('change', () => host.mostra(r.id, casella.checked));
        label.append(casella, occhio(), ' ', r.nome);
        if (r.nota) label.append(' ', el('em', null, `(${r.nota})`));
        const togli = el('button', 'rndt-gruppo-togli');
        togli.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>';
        togli.type = 'button';
        togli.id = `${id}-togli-${r.id}`;
        togli.title = t('rndt.rimuoviNome', { nome: r.nome });
        togli.setAttribute('aria-label', t('rndt.rimuoviLayer', { nome: r.nome }));
        togli.addEventListener('click', () => { opacita.delete(r.id); host.elimina(r.id); });
        riga.append(label, togli);
        if (!opacita.has(r.id)) opacita.set(r.id, { originali: new Map(), valore: 1 });
        const slider = sliderOpacita(host.getMap(), { id: r.id, etichetta: r.nome, layers: r.layers }, casella, opacita.get(r.id));
        return [riga, slider];
      })
      : [el('p', 'rndt-gruppo-vuoto', vuoto)];
    const idAttivo = radice.contains(document.activeElement) ? document.activeElement.id : null;
    radice.replaceChildren(h2, ...(azioni.length ? [gruppoAzioni] : []), selettore, ...(fissa ? [fissa] : []), ...voci);
    // stessi controlli degli altri gruppi: frecce, trascinamento, albero, ordine salvato
    let storage = null;
    try { storage = window.localStorage; } catch { /* storage bloccato: l'ordine vale per la sessione */ }
    const mappa = host.getMap?.();
    if (mappa?.getStyle) abilitaRiordino(mappa, radice, new Map(righe.map(r => [r.id, r.layers])), storage, { daElenco: true });
    const vai = idDaFocalizzare(idAttivo, [...radice.querySelectorAll('[id]')].map(e => e.id), ripiego ?? azioni[0]?.id);
    if (vai) document.getElementById(vai)?.focus();
    if (radice.bottone) {
      const { attivo, n } = statoBottone(righe);
      radice.bottone.dataset.attivo = String(attivo);
      radice.bottone.dataset.n = String(n);
    }
    // il pannello conta le caselle accese (pallino dell'icona, «Strati · N», chip): lo avvisiamo del cambio
    radice.dispatchEvent(new Event('change'));
  }

  return {
    // modulo da dare a costruisciPannello (solo il gruppo: senza strati propri né sorgenti)
    modulo: {
      id,
      titolo,
      argomento: { ...argomento },
      // vuoto finché non c'è l'host: così costruisciPannello non crea caselle (le disegna disegna()); la tab Argomenti
      // si ricostruisce a ogni apertura e legge l'elenco aggiornato
      get strati() { return host ? righeGruppo(host.elenco()).map(r => ({ id: r.id, etichetta: r.nome, layers: r.layers })) : []; },
      pannello(gruppo) { radice = gruppo; disegna(); },
    },
    collega(hostCollegato, apriPannello, carica = async () => {}, intestazioneDelContenuto = null) {
      intestazione = intestazioneDelContenuto;
      host = hostCollegato;
      apri = apriPannello;
      caricaFile = carica;
      host.suCambio(disegna);
      disegna();
    },
  };
}

export const creaGruppoRndt = () => creaGruppo(OPZIONI_RNDT);
