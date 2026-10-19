import { t as tr, tl } from './i18n.js';
import { el, titoloPagina, blocco } from './pagina-info.js';

// Testo del post LinkedIn «Palermo Digital Twin… work in progress», con le immagini del carosello a seguire.
export function schedaDigitalTwin() {
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
