import { svgIcona } from './icone.js';
import { collegaIngrandimento } from './ingrandisci.js';
import { schedaGuida, passiRndt, indiceLaterale } from './guida.js';
import { schedaGeoimage } from '../geoimage/guida.js';
import { t as tr, tl, lingua } from './i18n.js';
import { el, titoloPagina, blocco, link, traduciAlbero, AUTORE_URL, PLUGIN_URL } from './pagina-info.js';
import { schedaComunita } from './scheda-about.js';
import { schedaFonti } from './scheda-fonti.js';
import { schedaPrivacy } from './scheda-privacy.js';

export { caricaCatalogo } from './scheda-fonti.js';


// Testo del post LinkedIn «Palermo Digital Twin… work in progress», con le immagini del carosello a seguire.
function schedaDigitalTwin() {
  const fig = (n, alt) => el('img', null, { className: 'dt-fig', src: `img/dt/dt-${n}.jpg`, alt, title: tr('catalogo.ingrandisci', { alt: tl(alt) }), loading: 'lazy', width: 1920, height: 1072 });
  const sezione = (titolo, testi, ...figure) => blocco(titolo, ...testi.map(t => el('p', t)), ...figure);
  return [
    ...titoloPagina('Digital Twin', 'La città a strati: catasto, popolazione, edifici, trasporti, sicurezza e molto altro.'),
    sezione('Cos\u2019è per noi un Digital Twin, in parole semplici', [
      'Il Digital Twin di Palermo è una copia digitale della città, costruita con dati pubblici e consultabile da chiunque. Non richiede competenze tecniche.',
      'Non è una semplice mappa, riunisce in un unico spazio informazioni che di solito sono sparse in archivi diversi.',
    ], fig('01', 'Palermo in Trasparenza: il gemello digitale della città, una guida visiva ai dati aperti di Open Data Sicilia')),
    sezione('Come è organizzato', [
      'La città è rappresentata a strati, sovrapposti come i fogli trasparenti di un atlante. Alla base c\u2019è la mappa di Palermo. Sopra si trovano il catasto, il piano regolatore, la popolazione, gli edifici e i monumenti, i trasporti la sicurezza stradale e tanto altro.',
    ], fig('02', 'La città stratificata: Palermo, Catasto e PRG, Popolazione, Edifici e Monumenti, Trasporto e Sicurezza'),
    fig('03', 'L\u2019anatomia della piattaforma: strati, legenda e scheda di dettaglio')),
    sezione('Le fonti', [
      'Ogni strato proviene da una fonte aperta, Comune di Palermo, Regione Siciliana, ISTAT, Agenzia delle Entrate, OpenStreetMap. Singolarmente, sono file e tabelle di difficile lettura. Messi insieme sulla stessa mappa, diventano comprensibili. \u{1F601}',
    ], fig('05', 'L\u2019ecosistema dei dati pubblici: Comune di Palermo, Regione Siciliana, ISTAT, Agenzia delle Entrate, OpenStreetMap')),
    sezione('Come si utilizza', [
      'La consultazione può partire dall\u2019intera città oppure da una via, da un numero civico o da una particella catastale. Si possono attivare soltanto gli strati di interesse, così da avere una mappa chiara e non sovraccarica.',
      'Selezionando un punto, si apre una scheda con tutte le informazioni che lo riguardano, la particella catastale, vincoli, zonizzazione, gli incidenti avvenuti nelle vicinanze, la fermata del trasporto pubblico più vicina, l\u2019eventuale presenza di un monumento, una colonnina di ricarica per auto elettrica, etc etc.',
    ], fig('04', 'Dall\u2019intera città al singolo civico: ricerca libera, filtri geografici, risultato mirato'),
    fig('09', 'La potenza dell\u2019intersezione: un clic su Via Maqueda 435 mostra catasto, vincoli, sicurezza, cultura e trasporti')),
    sezione('A cosa serve', [
      'Un singolo clic non restituisce un solo dato, ma l\u2019insieme di ciò che si sovrappone in quel luogo. Per ottenere lo stesso quadro, è necessario rivolgersi a più uffici e/o consultare più siti.',
    ], fig('06', 'Le lenti a confronto: urbanistica, sicurezza, servizi e rischi, con strato principale e caso d\u2019uso civico'),
    fig('07', 'Esplorare il patrimonio: monumenti e uffici comunali'),
    fig('08', 'Mappare la vulnerabilità: rischio idrogeologico e storico incendi dal 2007')),
    sezione('Quali sono i limiti', [
      'Il Digital Twin è uno strumento per informarsi, studiare e capire la città. Non sostituisce i documenti ufficiali. Catasto, Piano Regolatore e vincoli hanno qui valore puramente informativo e non hanno valore legale. Per una visura o per un certificato di destinazione urbanistica occorre rivolgersi a SISTER o agli uffici competenti.',
      'Anche i dati sulla popolazione per singolo edificio sono stime campionarie e vanno letti come indicazioni, non come conteggi esatti.',
    ], fig('10', 'Oltre la mappa, il perimetro di utilizzo: valore informativo e valore legale')),
  ];
}

function lista(voci) {
  const ul = el('ul');
  for (const v of voci) ul.append(el('li', v));
  return ul;
}

// Avvolge una pagina di blocchi in un contenitore con l'indice laterale (un voce per ogni blocco con titolo h3).
// Un h2.guida-gruppo è anche intestazione di gruppo nell'indice; un {gruppo} semplice (non un nodo) è un'intestazione solo dell'indice,
// per un gruppo che nella pagina sarebbe una ripetizione del titolo.
function paginaConIndice(nodi) {
  const radice = el('div');
  const voci = [];
  for (const n of nodi) {
    if (!n.nodeType) { voci.push({ gruppo: n.gruppo }); continue; }
    radice.append(n);
    if (n.tagName === 'H2' && n.className === 'guida-gruppo') voci.push({ gruppo: n.textContent });
    else if (n.tagName === 'SECTION' && n.querySelector('h3')) voci.push({ titolo: n.querySelector('h3').textContent, sezione: n });
  }
  indiceLaterale(document, radice, voci);
  return radice;
}

// Tab «Plugin RNDT» (il testo di «Un lavoro di Andrea Borruso» è anche in MERITO_PLUGIN, guida-contenuti.js): spiega in parole semplici cosa fa il catalogo e dà il merito all'autore del plugin.
function schedaPlugin() {
  const merito = blocco('Un lavoro di Andrea Borruso',
    (() => {
      const p = el('p');
      p.append('Il catalogo RNDT di questa mappa si basa interamente sul plugin ', link('openrndt-geolibre', PLUGIN_URL),
        ', ideato e scritto da ', link('Andrea Borruso', AUTORE_URL), ' (', link('onData', 'https://github.com/ondata'), '). ',
        'Senza il suo lavoro questa funzione non esisterebbe: l’ho solo adattata a questo progetto.');
      return p;
    })(),
    el('p', 'Grazie alla sua ottima architettura è stato possibile adattarlo con pochissimi interventi: il plugin nasceva per un’altra applicazione di mappe, ma è pensato così bene da poter essere ospitato anche qui senza riscriverlo.'),
  );
  return [
    ...titoloPagina('Plugin RNDT', 'Il catalogo nazionale dei dati territoriali, direttamente sulla mappa.'),
    { gruppo: 'Plugin' }, // solo nell'indice: nella pagina sarebbe una ripetizione del titolo «Plugin RNDT»
    merito,
    blocco('Cos’è l’RNDT', el('p', 'Il Repertorio Nazionale dei Dati Territoriali (RNDT) è il catalogo ufficiale italiano dei dati geografici: raccoglie le schede di migliaia di mappe e dati pubblicati da Comuni, Regioni, ministeri, enti parco, agenzie e altri enti. È un po’ come una biblioteca: dice che cosa esiste, chi lo ha prodotto e dove si può consultare.')),
    blocco('Cosa fa questo plugin', lista([
      'Cerca nel catalogo nazionale per parola, tema, ente che ha pubblicato il dato, data e tipo di dato.',
      'Per ogni risultato mostra la scheda: titolo, descrizione, ente responsabile e servizi disponibili.',
      'Aggiunge alla mappa i servizi di mappe che trova: WMS (immagini della mappa, come un livello da sovrapporre) e WFS (i dati veri e propri, con le informazioni sugli oggetti).',
      'Scarica i dati WFS in formato GeoJSON, così si possono vedere e interrogare direttamente sulla mappa.',
    ])),
    blocco('Come si usa', lista([
      'Apri la scheda di un luogo e premi l’icona del catalogo RNDT, in alto accanto all’ingranaggio: il pannello si sovrappone alla scheda.',
      'Scrivi cosa cerchi (per esempio «idrografia», «rischio frane», «zone protette») e, se vuoi, filtra per tipo o per ente.',
      'Scegli un risultato, poi il servizio (WMS o WFS) e premi per aggiungerlo: compare come nuovo strato sulla mappa.',
      'Con il tab «Scheda» nella barra a destra (o con il tasto Esc) chiudi il catalogo e torni alla scheda: gli strati aggiunti restano sulla mappa.',
    ])),
    blocco('Strati aggiunti', lista([
      'In cima al pannello c’è l’elenco «Layer aggiunti»: puoi mostrarli, nasconderli o rimuoverli.',
      'Gli strati si ricordano da una visita all’altra, in questo browser. Se un servizio non risponde più, resta nell’elenco segnato come «non disponibile» e non viene cancellato.',
      'Cliccando un punto della mappa, la scheda mostra anche le informazioni degli strati RNDT attivi in quel punto, nel tab «Altri dati (RNDT)».',
    ])),
    blocco('Cosa è stato adattato per Palermo', lista([
      'La ricerca e i download sono sempre limitati all’area di Palermo: non si può cercare «in tutta Italia».',
      'I servizi pubblici spesso non permettono l’uso da altri siti web: un piccolo servizio intermedio (proxy) li rende raggiungibili, con controlli di sicurezza su indirizzi e dimensioni.',
      'Gli strati molto densi (come le particelle catastali) si vedono meglio con il WMS: il download WFS ha un tetto di 10.000 oggetti.',
    ])),
    blocco('Dove saperne di più', (() => {
      const p = el('p');
      p.append('Codice, istruzioni e segnalazioni: ', link('github.com/ondata/openrndt-geolibre', PLUGIN_URL),
        '. Autore: ', link('Andrea Borruso su LinkedIn', AUTORE_URL), '.');
      return p;
    })()),
  ];
}

// Pagina informativa a tutta larghezza (non modale): ogni voce del menu in testata ne apre una sezione;
// la stessa voce premuta di nuovo, o Esc, la chiude.
export function commutaCrediti(dialog, catalogo, moduli = [], tab = 'fonti') {
  if (dialog.open && dialog.dataset.tab === tab) return dialog.close();
  apriCrediti(dialog, catalogo, moduli, tab);
}

export function apriCrediti(dialog, catalogo, moduli = [], tab = 'fonti') {
  if (dialog.open && dialog.vaiA) return dialog.vaiA(tab);
  const guida = schedaGuida();
  const schede = [
    ['digitaltwin', 'Digital Twin', [paginaConIndice(schedaDigitalTwin())]],
    ['guida', 'Guida', [guida]],
    ['geoimage', 'Guida Geoimage', [schedaGeoimage()]],
    ['plugin', 'Plugin RNDT', [paginaConIndice([...schedaPlugin(), el('h2', 'Casi d\'uso', { className: 'guida-gruppo' }), ...passiRndt()])]],
    ['fonti', 'Fonti e note', schedaFonti(catalogo)],
    ['privacy', 'Privacy', schedaPrivacy()],
    ['about', 'About', schedaComunita()],
  ];

  const pannelli = schede.map(([id, , contenuto]) => {
    const p = document.createElement('div');
    p.id = `tabpanel-${id}`;
    p.className = 'info-sezione';
    p.append(...contenuto);
    return p;
  });
  const vaiA = id => {
    const i = Math.max(0, schede.findIndex(([k]) => k === id));
    pannelli.forEach((p, k) => { p.hidden = k !== i; });
    dialog.dataset.tab = schede[i][0];
    dialog.dispatchEvent(new CustomEvent('scheda', { detail: schede[i][0] }));
    corpo.scrollTop = 0;
  };

  const corpo = document.createElement('div');
  corpo.className = 'tab-corpo';
  corpo.append(...pannelli);
  traduciAlbero(corpo); // le pagine sono scritte in italiano: in inglese ogni testo si traduce con le voci lbl.* dei dizionari
  const inCima = document.createElement('button');
  inCima.type = 'button';
  inCima.className = 'in-cima';
  inCima.hidden = true;
  inCima.setAttribute('aria-label', tr('catalogo.inCima'));
  inCima.title = tr('catalogo.inCima');
  inCima.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  inCima.addEventListener('click', () => corpo.scrollTo({ top: 0, behavior: 'smooth' }));
  corpo.addEventListener('scroll', () => { inCima.hidden = corpo.scrollTop < 40; });
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'crediti-x';
  chiudi.setAttribute('aria-label', tr('comune.chiudi'));
  chiudi.title = tr('comune.chiudi');
  chiudi.innerHTML = svgIcona('chiudi', 18);
  chiudi.addEventListener('click', () => dialog.close());
  dialog.replaceChildren(corpo, chiudi, inCima);
  collegaIngrandimento(corpo);
  dialog.vaiA = vaiA;
  if (!dialog.open) {
    // chi chiude il foglio torna dove era (il menu in testata): il focus non si perde nel nulla
    const apertoDa = document.activeElement;
    dialog.addEventListener('close', () => { if (apertoDa?.isConnected) apertoDa.focus?.({ preventScroll: true }); }, { once: true });
    dialog.show();
  }
  vaiA(tab);
}
