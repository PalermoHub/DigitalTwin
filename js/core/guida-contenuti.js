// Fonte unica della guida: la leggono il tab Info (guida.js), lo script degli screenshot e quello del video.
// `narrazione` è il testo parlato: niente cifre né sigle (si scrivono per esteso come si pronunciano).
// `scena` dice allo script degli screenshot come preparare la mappa (vedi scripts/guida_screenshot.py).
const TEATRO_MASSIMO = [13.3586, 38.1203];
const CENTRO = [13.3615, 38.1157];

export const PASSI = [
  {
    id: 'cos-e',
    titolo: 'Cos\'è la mappa e a cosa serve',
    paragrafi: [
      'Il Digital Twin di Palermo è una mappa interattiva che riunisce in un solo posto i dati aperti sulla città: catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico, sicurezza stradale e uffici comunali.',
      'Serve a leggere un luogo da più punti di vista: chi cerca una particella, chi vuole capire come è fatto un quartiere, chi studia la mobilità o i servizi. Ogni informazione resta collegata alla fonte da cui proviene.',
    ],
    immagine: { file: 'img/guida/passi/cos-e.webp', alt: 'La mappa di Palermo appena aperta, con la barra di ricerca in basso e i pulsanti degli strumenti a destra.', didascalia: 'La vista iniziale: il centro di Palermo.' },
    narrazione: 'Benvenuto nel Digital Twin di Palermo. È una mappa interattiva che riunisce in un solo posto i dati aperti sulla città: catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico e sicurezza stradale. Serve a leggere un luogo da più punti di vista, sempre con la fonte dei dati a portata di mano.',
    scena: { strati: [], centro: CENTRO, zoom: 12 },
  },
  {
    id: 'dati',
    titolo: 'Con quali dati è realizzata',
    paragrafi: [
      'La mappa usa dati pubblicati da enti pubblici e da progetti di dati aperti: il Comune di Palermo (scuole, uffici, incidenti, carta tecnica), l\'azienda del trasporto pubblico AMAT, il catasto e la zonizzazione del piano regolatore, i dati del censimento e la base cartografica di OpenStreetMap.',
      'L\'elenco completo, con data e licenza di ciascuna fonte, è nella scheda «Fonti e avvisi» di questo stesso foglio.',
    ],
    immagine: { file: 'img/guida/passi/dati.webp', alt: 'La scheda Fonti e avvisi del foglio informazioni, con l\'elenco delle fonti dei dati.', didascalia: 'Le fonti dei dati sono elencate in «Fonti e avvisi».' },
    narrazione: 'I dati arrivano da enti pubblici e da progetti di dati aperti: il Comune di Palermo, l\'azienda del trasporto pubblico, il catasto, la zonizzazione del piano regolatore, il censimento e la cartografia di OpenStreetMap. L\'elenco completo, con data e licenza di ogni fonte, si trova nella scheda Fonti e avvisi.',
    scena: { strati: [], centro: CENTRO, zoom: 12, ritaglio: '#crediti' },
  },
  {
    id: 'strati',
    titolo: 'La barra degli strati',
    paragrafi: [
      'Gli strati sono i temi che si possono sovrapporre alla mappa. Il pulsante «Strati» apre la barra: ogni icona accende o spegne un tema, e quelli accesi compaiono anche come etichette sopra la mappa.',
      'La legenda in alto a sinistra spiega i colori degli strati accesi. Si può accenderne più d\'uno alla volta per confrontare, ad esempio, edifici e catasto.',
    ],
    immagine: { file: 'img/guida/passi/strati.webp', alt: 'La barra degli strati aperta, con le icone dei temi e alcuni strati accesi sulla mappa.', didascalia: 'La barra degli strati con catasto ed edifici accesi.' },
    narrazione: 'Gli strati sono i temi che si sovrappongono alla mappa. Il pulsante Strati apre la barra: ogni icona accende o spegne un tema. Gli strati accesi compaiono anche come etichette sulla mappa, e la legenda ne spiega i colori. Puoi accenderne più di uno per confrontarli.',
    scena: { strati: ['edificato', 'catasto'], centro: TEATRO_MASSIMO, zoom: 16, apriStrati: true },
  },
  {
    id: 'clic',
    titolo: 'Fare clic sulla mappa',
    paragrafi: [
      'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo.',
    ],
    immagine: { file: 'img/guida/passi/clic.webp', alt: 'Un edificio evidenziato sulla mappa dopo il clic, con la scheda del luogo che si apre sul lato.', didascalia: 'Un clic sul Teatro Massimo evidenzia l\'edificio e apre la scheda.' },
    narrazione: 'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo.',
    scena: { strati: ['edificato', 'catasto'], centro: TEATRO_MASSIMO, zoom: 17, clic: TEATRO_MASSIMO },
  },
  {
    id: 'scheda',
    titolo: 'Cosa si legge nella scheda',
    paragrafi: [
      'La scheda raccoglie tutto ciò che la mappa sa del punto scelto, in sezioni: l\'indirizzo, la particella catastale, la zona del piano regolatore con i suoi vincoli, la popolazione della sezione di censimento e le caratteristiche dell\'edificio.',
      'Ogni sezione indica la fonte. I dati catastali, urbanistici e i vincoli sono solo informativi; la popolazione per edificio è una stima.',
    ],
    immagine: { file: 'img/guida/passi/scheda.webp', alt: 'La scheda del luogo aperta, divisa in sezioni con indirizzo, catasto, zona urbanistica, popolazione ed edificio.', didascalia: 'La scheda del luogo, divisa per argomento.' },
    narrazione: 'La scheda raccoglie ciò che la mappa sa del punto scelto, a sezioni: l\'indirizzo, la particella catastale, la zona del piano regolatore con i vincoli, la popolazione della sezione di censimento e le caratteristiche dell\'edificio. Ogni sezione indica la fonte, e i dati urbanistici sono solo informativi.',
    scena: { strati: ['edificato', 'catasto'], centro: TEATRO_MASSIMO, zoom: 17, clic: TEATRO_MASSIMO, ritaglio: '#scheda' },
  },
  {
    id: 'filtri',
    titolo: 'Cercare e filtrare',
    paragrafi: [
      'La barra in basso permette di cercare una via, un civico, un quartiere o una particella. Il pulsante dei filtri apre il pannello per limitare la ricerca a una circoscrizione, a un quartiere o a una zona.',
      'Esempio: scegliendo una circoscrizione e digitando «Maqueda», i risultati si restringono alle vie con quel nome dentro la zona scelta; un clic su un risultato porta la mappa sul posto e apre la scheda.',
    ],
    immagine: { file: 'img/guida/passi/filtri.webp', alt: 'Il pannello dei filtri aperto sopra la barra di ricerca, con una circoscrizione scelta e l\'elenco dei risultati per «Maqueda».', didascalia: 'Una ricerca di esempio: circoscrizione scelta e testo «Maqueda».' },
    narrazione: 'La barra in basso permette di cercare una via, un civico, un quartiere o una particella. Il pulsante dei filtri apre il pannello per limitare la ricerca a una circoscrizione, a un quartiere o a una zona. Per esempio, scegli una circoscrizione e scrivi Maqueda: i risultati si restringono, e un clic su uno di essi porta la mappa sul posto.',
    scena: { strati: [], centro: CENTRO, zoom: 13, ricerca: { testo: 'Maqueda', apriFiltri: true, circ: 1 } },
  },
  {
    id: 'avvertenze',
    titolo: 'Avvertenze',
    paragrafi: [
      'Catasto, zonizzazione e vincoli hanno valore solo informativo e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Il piano regolatore è la variante generale del duemilaquattro: varianti successive potrebbero non essere incluse.',
      'I dati del censimento sono stime campionarie, quindi i valori per sezione non sono conteggi esatti.',
    ],
    immagine: { file: 'img/guida/passi/avvertenze.webp', alt: 'La scheda Fonti e avvisi con le avvertenze sul valore informativo dei dati.', didascalia: 'Le avvertenze sono sempre consultabili in «Fonti e avvisi».' },
    narrazione: 'Un\'ultima avvertenza: catasto, zonizzazione e vincoli hanno valore solo informativo, e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. I dati del censimento sono stime. Per usi legali rivolgiti sempre agli uffici competenti.',
    scena: { strati: [], centro: CENTRO, zoom: 12, ritaglio: '#crediti' },
  },
];
