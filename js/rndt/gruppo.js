// js/rndt/gruppo.js
// Gruppo «RNDT» della barra strati: i layer aggiunti dal catalogo (al volo o richiamati dal salvataggio) con
// accensione, rimozione e il pulsante che apre il catalogo. Il gruppo nasce vuoto con la barra e si riempie
// quando l'host RNDT è pronto; resta allineato all'host con suCambio.

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

  function disegna() {
    if (!radice || !host) return;
    const titolo = radice.querySelector('h2');
    const aggiungi = el('button', 'rndt-gruppo-aggiungi', '＋ Aggiungi dati RNDT');
    aggiungi.type = 'button';
    aggiungi.addEventListener('click', () => apriCatalogo());
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
        togli.title = `Rimuovi ${r.nome}`;
        togli.setAttribute('aria-label', `Rimuovi il layer ${r.nome}`);
        togli.addEventListener('click', () => host.elimina(r.id));
        riga.append(label, togli);
        return riga;
      })
      : [el('p', 'rndt-gruppo-vuoto', 'Nessun layer RNDT: cercalo nel catalogo.')];
    radice.replaceChildren(titolo, aggiungi, ...voci);
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
    collega(hostRndt, apri) {
      host = hostRndt;
      apriCatalogo = apri;
      host.suCambio(disegna);
      disegna();
    },
  };
}
