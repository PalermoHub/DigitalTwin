// Fonte unica della guida: la leggono il tab Info (guida.js), lo script degli screenshot e quello del video.
// `narrazione` è il testo parlato: niente cifre né sigle (si scrivono per esteso come si pronunciano).
// `scena` dice allo script degli screenshot come preparare la mappa (vedi scripts/guida_screenshot.py).
const PUNTO_CLIC = [13.3586, 38.1203];
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
      'Gli strati sono i temi che si possono sovrapporre alla mappa. La barra a sinistra li raggruppa (Rilievo, Popolazione, Territorio, Edifici, Trasporti, Sicurezza e altri): da telefono si apre con il pulsante «Strati». Scegliendo un gruppo si apre l\'elenco dei suoi strati, con una casella per accenderli o spegnerli e un campo per cercarli.',
      'Gli strati accesi compaiono come etichette in alto sulla mappa, e la legenda in basso a sinistra ne spiega i colori. Se ne possono accendere più d\'uno per confrontarli, ad esempio edifici e catasto.',
    ],
    immagine: { file: 'img/guida/passi/strati.webp', alt: 'La barra degli strati con il gruppo Territorio aperto: un elenco di strati con caselle, tra cui catasto, piano regolatore, monumenti e uffici comunali.', didascalia: 'Il gruppo «Territorio» aperto, con il catasto acceso.' },
    narrazione: 'Gli strati sono i temi che si sovrappongono alla mappa. La barra a sinistra li raggruppa: rilievo, popolazione, territorio, edifici, trasporti e sicurezza. Scegli un gruppo per vedere l\'elenco dei suoi strati e accendili con la casella. Gli strati accesi compaiono come etichette in alto, e la legenda in basso ne spiega i colori. Puoi accenderne più di uno per confrontarli.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 16, gruppo: 'Territorio' },
  },
  {
    id: 'clic',
    titolo: 'Fare clic sulla mappa',
    paragrafi: [
      'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo.',
    ],
    immagine: { file: 'img/guida/passi/clic.webp', alt: 'Un punto scelto sulla mappa in via Maqueda, evidenziato in viola, con la scheda del luogo aperta sul lato destro.', didascalia: 'Un clic in via Maqueda evidenzia il punto e apre la scheda.' },
    narrazione: 'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC },
  },
  {
    id: 'scheda',
    titolo: 'Cosa si legge nella scheda',
    paragrafi: [
      'La scheda è organizzata in sezioni, che si scelgono dalle linguette in alto: Luogo, Catasto, Vincoli, Mercato, Popolazione e altre. «Luogo» riassume ciò che c\'è nel punto scelto: indirizzo, circoscrizione e quartiere, monumenti, rischio di incidenti e fermate vicine.',
      'La sezione «Catasto» mostra la particella con foglio e numero e il collegamento alla visura. Ogni sezione indica la fonte: i dati catastali, urbanistici e i vincoli sono solo informativi.',
    ],
    immagine: { file: 'img/guida/passi/scheda.webp', alt: 'La scheda del luogo aperta sulla sezione Catasto, con i dati della particella.', didascalia: 'La scheda del luogo, qui sulla sezione «Catasto».' },
    narrazione: 'La scheda è divisa in sezioni, che scegli dalle linguette in alto: luogo, catasto, vincoli, mercato, popolazione e altre. La prima riassume ciò che c\'è nel punto scelto: l\'indirizzo, i monumenti, il rischio di incidenti e le fermate vicine. La sezione catasto mostra la particella, e ogni sezione indica la fonte dei dati.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC, schedaTab: 'Catasto' },
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
    immagine: { file: 'img/guida/passi/avvertenze.webp', alt: 'La sezione Vincoli della scheda del luogo, con in fondo l\'avviso: dato informativo, senza valore legale.', didascalia: 'In fondo a ogni scheda, l\'avviso sul valore informativo dei dati.' },
    narrazione: 'Un\'ultima avvertenza: catasto, zonizzazione e vincoli hanno valore solo informativo, e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. I dati del censimento sono stime. Per usi legali rivolgiti sempre agli uffici competenti.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC, schedaTab: 'Vincoli' },
  },
];
