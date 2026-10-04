// js/rndt/gruppo.js
// Gruppo «RNDT» della barra strati: i layer aggiunti dal catalogo (al volo o richiamati dal salvataggio) con
// accensione, rimozione e il pulsante che apre il catalogo. Il gruppo nasce vuoto con la barra e si riempie
// quando l'host RNDT è pronto; resta allineato all'host con suCambio.

import { ESTENSIONI } from './importa.js';

const ordina = (a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' });

// Modello delle righe (puro, testabile): ordine alfabetico, stato e nota di ogni layer
export function righeGruppo(elenco) {
  return [...elenco].sort(ordina).map(l => ({
    id: l.id,
    nome: l.nome,
    acceso: l.visibile && !l.indisponibile,
    disabilitato: l.indisponibile,
    nota: l.indisponibile ? 'non disponibile' : !l.salvato ? 'solo questa sessione' : l.errore ? 'errori di caricamento' : '',
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

export function creaGruppoRndt() {
  let radice = null;
  let host = null;
  let apriCatalogo = () => {};
  let caricaFile = async () => {};

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
    selettore ??= creaSelettore();
    const titolo = radice.querySelector('h2');
    const azioni = el('div', 'rndt-gruppo-azioni');
    const catalogo = el('button', 'rndt-gruppo-aggiungi', '＋ Dal catalogo RNDT');
    const file = el('button', 'rndt-gruppo-aggiungi', '📁 Carica file dal computer');
    file.id = 'rndt-carica-file';
    file.title = `Formati: ${ESTENSIONI.join(' ')}`;
    for (const b of [catalogo, file]) b.type = 'button';
    catalogo.addEventListener('click', () => apriCatalogo());
    file.addEventListener('click', () => selettore.click());
    azioni.append(catalogo, file);
    const righe = righeGruppo(host.elenco());
    const voci = righe.length
      ? righe.map(r => {
        const riga = el('div', 'rndt-gruppo-riga');
        const label = el('label');
        const casella = el('input');
        casella.type = 'checkbox';
        casella.id = `strato-${r.id}`; // come gli altri strati: la tab Argomenti pilota queste caselle
        casella.checked = r.acceso;
        casella.disabled = r.disabilitato;
        casella.addEventListener('change', () => host.mostra(r.id, casella.checked));
        label.append(casella, ' ', r.nome);
        if (r.nota) label.append(' ', el('em', null, `(${r.nota})`));
        const togli = el('button', 'rndt-gruppo-togli', '×');
        togli.type = 'button';
        togli.id = `rndt-togli-${r.id}`;
        togli.title = `Rimuovi ${r.nome}`;
        togli.setAttribute('aria-label', `Rimuovi il layer ${r.nome}`);
        togli.addEventListener('click', () => host.elimina(r.id));
        riga.append(label, togli);
        return riga;
      })
      : [el('p', 'rndt-gruppo-vuoto', 'Nessun layer RNDT: cercalo nel catalogo.')];
    const idAttivo = radice.contains(document.activeElement) ? document.activeElement.id : null;
    radice.replaceChildren(titolo, azioni, selettore, ...voci);
    const vai = idDaFocalizzare(idAttivo, [...radice.querySelectorAll('[id]')].map(e => e.id), 'rndt-carica-file');
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
      id: 'rndt',
      titolo: 'RNDT',
      argomento: { titolo: 'RNDT', descrizione: 'Dati aggiunti dal catalogo RNDT, anche richiamati dal salvataggio. Si aggiungono dal pulsante del catalogo nella barra strumenti.' },
      // vuoto finché non c'è l'host: così costruisciPannello non crea caselle (le disegna disegna()); la tab Argomenti
      // si ricostruisce a ogni apertura e legge l'elenco aggiornato
      get strati() { return host ? righeGruppo(host.elenco()).map(r => ({ id: r.id, etichetta: r.nome })) : []; },
      pannello(gruppo) { radice = gruppo; disegna(); },
    },
    collega(hostRndt, apri, carica = async () => {}) {
      host = hostRndt;
      apriCatalogo = apri;
      caricaFile = carica;
      host.suCambio(disegna);
      disegna();
    },
  };
}
