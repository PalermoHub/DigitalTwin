// Fonte unica della guida: la leggono il tab Info (guida.js), lo script degli screenshot e quello del video.
// `narrazione` è il testo parlato: niente cifre né sigle (si scrivono per esteso come si pronunciano).
// `scena` dice allo script degli screenshot come preparare la mappa (vedi scripts/guida_screenshot.py).
const PUNTO_CLIC = [13.3586, 38.1203];
const CENTRO = [13.3615, 38.1157];
const TEATRO = [13.3571944, 38.1201711]; // Teatro Massimo (strato Monumenti)
const PALAGONIA = [13.370036, 38.1167363]; // Palazzo Palagonia, sede comunale (strato Uffici)

export const PASSI = [
  {
    id: 'cos-e',
    titolo: 'Cos\'è la mappa e a cosa serve',
    paragrafi: [
      'Il Digital Twin di Palermo, realizzato da Open Data Sicilia, è una mappa interattiva che mette a disposizione di tutti i cittadini i dati della nostra città: catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico, sicurezza stradale e uffici comunali.',
      'Serve a leggere un luogo da più punti di vista: chi cerca una particella, chi vuole capire come è fatto un quartiere, chi studia la mobilità o i servizi. Ogni informazione resta collegata alla fonte da cui proviene.',
    ],
    immagine: { file: 'img/guida/passi/cos-e.webp', alt: 'La mappa di Palermo appena aperta, con la barra di ricerca in basso e i pulsanti degli strumenti a destra.', didascalia: 'La vista iniziale: il centro di Palermo.' },
    narrazione: 'Benvenuti nel Digital Twin di Palermo, realizzato da Open Data Sicilia: una mappa interattiva che mette a disposizione di tutti i cittadini i dati della nostra città. Qui trovi insieme catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico e sicurezza stradale, e puoi leggere un luogo da più punti di vista, sempre con la fonte dei dati a portata di mano.',
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
      'Gli strati sono i temi che si possono sovrapporre alla mappa. La barra a sinistra li raggruppa (Rilievo, Popolazione, Territorio, Edifici, Trasporti, Sicurezza e altri): da telefono si apre con il pulsante «Strati». Ogni gruppo è un tab: scegliendolo si apre accanto alla barra un pannello con l\'elenco dei suoi strati, con una casella per accenderli o spegnerli e un campo per cercarli. Il pannello resta aperto finché non si preme di nuovo il tab o Esc.',
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
    id: 'tutto-in-un-punto',
    titolo: 'Tutto in un punto',
    statico: true,
    paragrafi: [
      'Un solo clic interroga insieme tutti gli strati: catasto, vincoli del piano regolatore, sicurezza stradale, beni culturali e trasporto pubblico. Il risultato è la scheda del luogo, che mette in fila ciò che si sovrappone in quel punto.',
    ],
    immagine: { file: 'img/guida/passi/intersezione.svg', alt: 'Schema: un clic su via Maqueda 435 restituisce catasto (particella 180, foglio 128), vincoli (zonizzazione PRG 2004, centro storico), sicurezza (zona a incidenti concentrati), cultura (chiesa delle Francescane, non più esistente) e trasporti (fermata a 130 metri).', didascalia: 'Un clic, cinque letture dello stesso luogo.' },
  },
  {
    id: 'scheda',
    titolo: 'Cosa si legge nella scheda',
    paragrafi: [
      'La scheda è organizzata in sezioni, che si scelgono dalle linguette in alto: Luogo, Strumenti urbanistici, Mercato, Popolazione e altre. «Luogo» riassume ciò che c\'è nel punto scelto: indirizzo, circoscrizione e quartiere, monumenti, rischio di incidenti e fermate vicine.',
      'La sezione «Strumenti urbanistici» comincia dall\'edificio e mostra poi la particella con foglio e numero e il collegamento alla visura. Ogni sezione indica la fonte: i dati catastali, urbanistici e i vincoli sono solo informativi.',
    ],
    immagine: { file: 'img/guida/passi/scheda.webp', alt: 'La scheda del luogo aperta sulla sezione Strumenti urbanistici, con i dati della particella.', didascalia: 'La scheda del luogo, qui sulla sezione «Strumenti urbanistici».' },
    narrazione: 'La scheda è divisa in sezioni, che scegli dalle linguette in alto: luogo, catasto, vincoli, mercato, popolazione e altre. La prima riassume ciò che c\'è nel punto scelto: l\'indirizzo, i monumenti, il rischio di incidenti e le fermate vicine. La sezione catasto mostra la particella, e ogni sezione indica la fonte dei dati.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC, schedaTab: 'Strumenti urbanistici' },
  },
  {
    id: 'monumenti',
    titolo: 'Monumenti e luoghi storici',
    paragrafi: [
      'Lo strato «Monumenti» (gruppo Territorio) mostra i luoghi di interesse storico e culturale: chiese, palazzi, fontane, teatri. Dove è stato possibile abbinarli, anche l\'edificio è colorato sulla mappa.',
      'Un clic su un monumento apre la sua scheda, con foto, descrizione, categoria e il collegamento al Portale del Turismo del Comune di Palermo, da cui provengono i testi.',
    ],
    immagine: { file: 'img/guida/passi/monumenti.webp', alt: 'Lo strato Monumenti acceso e la scheda del Teatro Massimo aperta, con foto, categoria e descrizione.', didascalia: 'La scheda di un monumento: il Teatro Massimo.' },
    narrazione: 'Lo strato Monumenti mostra i luoghi di interesse storico e culturale: chiese, palazzi, fontane e teatri. Dove è stato possibile, anche l\'edificio è colorato sulla mappa. Un clic su un monumento apre la sua scheda, con foto, descrizione e il collegamento al Portale del Turismo del Comune di Palermo.',
    scena: { strati: ['monumenti'], centro: TEATRO, zoom: 16.5, clic: TEATRO },
  },
  {
    id: 'uffici',
    titolo: 'Uffici comunali',
    paragrafi: [
      'Lo strato «Uffici comunali (sedi)» mostra dove si trovano gli uffici del Comune di Palermo, raggruppati per sede.',
      'La scheda di una sede elenca le aree e gli uffici che vi hanno sede, con responsabili e contatti, quando pubblicati. I dati provengono dal sito istituzionale del Comune.',
    ],
    immagine: { file: 'img/guida/passi/uffici.webp', alt: 'Lo strato Uffici comunali acceso e la scheda di Palazzo Palagonia, con l\'elenco di aree e uffici della sede.', didascalia: 'La scheda di una sede comunale: Palazzo Palagonia.' },
    narrazione: 'Lo strato Uffici comunali mostra dove si trovano gli uffici del Comune di Palermo, raggruppati per sede. La scheda di una sede elenca le aree e gli uffici che vi hanno sede, con responsabili e contatti, quando sono pubblicati.',
    scena: { strati: ['uffici'], centro: PALAGONIA, zoom: 16.5, clic: PALAGONIA, schedaApri: 'Uffici e responsabili' },
  },
  {
    id: 'pai',
    titolo: 'Pericolosità e rischio idrogeologico (PAI)',
    paragrafi: [
      'Il gruppo «Piano PAI» riporta il Piano di Assetto Idrogeologico della Regione Siciliana: pericolosità e rischio idraulico e geomorfologico, dissesti, siti di attenzione ed erosione costiera, con la simbologia ufficiale.',
      'Un clic su un\'area apre la scheda: nella sezione «Strumenti urbanistici» compare il riquadro «Vincoli PAI», con la classe più grave tra quelle sovrapposte, accanto alla zonizzazione e ai vincoli del piano regolatore. Sono dati informativi: per usi legali vale la cartografia ufficiale dell\'Autorità di Bacino.',
    ],
    immagine: { file: 'img/guida/passi/pai.webp', alt: 'Lo strato Pericolosità idraulica acceso sulla mappa e, nella scheda, la sezione Strumenti urbanistici con zonizzazione, vincoli e il riquadro Vincoli PAI.', didascalia: 'Clic su un\'area PAI: la scheda, sezione «Strumenti urbanistici».' },
    narrazione: 'Il gruppo Piano P A I riporta il Piano di Assetto Idrogeologico della Regione Siciliana: pericolosità e rischio idraulico e geomorfologico, dissesti ed erosione costiera, con la simbologia ufficiale. Un clic su un\'area apre la scheda: nella sezione vincoli trovi il riquadro dei vincoli P A I, con la classe più grave. Sono dati informativi.',
    scena: { strati: ['idraulica_pericolosita'], centro: [13.40, 38.08], zoom: 13, clicSu: { layer: 'pai-idraulica_pericolosita-hit' }, schedaTab: 'Strumenti urbanistici' },
  },
  {
    id: 'incendi',
    titolo: 'Incendi',
    paragrafi: [
      'Lo strato «Incendi» mostra le aree percorse dal fuoco nel Comune di Palermo dal duemilasette, anno per anno, dal Censimento Incendi della Regione Siciliana. Il colore indica l\'anno.',
      'La scheda di un incendio riporta data, località, superficie totale e boscata e, quando disponibili, le squadre intervenute. Se più incendi si sovrappongono, la scheda li elenca tutti.',
    ],
    immagine: { file: 'img/guida/passi/incendi.webp', alt: 'Lo strato Incendi acceso, con le aree bruciate colorate per anno, e la scheda di un incendio con data, località e superfici.', didascalia: 'La scheda di un incendio: Bellolampo, duemilaventitré.' },
    narrazione: 'Lo strato Incendi mostra le aree percorse dal fuoco nel Comune di Palermo dal duemilasette, anno per anno, dal Censimento Incendi della Regione Siciliana. Il colore indica l\'anno. La scheda di un incendio riporta data, località e superfici bruciate.',
    scena: { strati: ['incendi'], centro: [13.33, 38.10], zoom: 12, clicSu: { layer: 'incendi-hit', filtro: { anno: 2023 } } },
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
  // I passi RNDT sono «statici»: immagini fatte con scripts/guida_screenshot_rndt.py, non fanno parte del video (che andrebbe rigenerato con la voce).
  {
    id: 'rndt-catalogo',
    titolo: 'Cercare nel catalogo RNDT',
    statico: true,
    paragrafi: [
      'Il pulsante con la nuvola e la freccia, nella barra degli strumenti in alto a destra, apre il catalogo del Repertorio Nazionale dei Dati Territoriali (RNDT): l\'elenco dei dati geografici pubblicati dagli enti di tutta Italia. Il pannello si affianca alla scheda del luogo nella barra verticale a destra: i tab «Scheda» e «RNDT» passano dall\'uno all\'altro, il tasto Esc chiude il catalogo.',
      'Si cerca per testo, tema o ente, sempre entro l\'area di Palermo. Un servizio WMS si aggiunge come livello di immagini; un servizio WFS come elementi geografici che si possono interrogare. Il catalogo usa il plugin openrndt-geolibre di Andrea Borruso (onData).',
    ],
    immagine: { file: 'img/guida/passi/rndt-catalogo.webp', alt: 'Il pannello del catalogo RNDT aperto sul lato destro della mappa, con il campo di ricerca e l\'elenco dei risultati.', didascalia: 'Il catalogo RNDT, limitato all\'area di Palermo.' },
  },
  {
    id: 'rndt-gruppo',
    titolo: 'Il gruppo RNDT e i tuoi file',
    statico: true,
    paragrafi: [
      'I dati aggiunti compaiono nel gruppo «RNDT» della barra degli strati, e anche tra gli Argomenti del foglio Info. Ogni layer ha una casella per accenderlo o spegnerlo e una × per rimuoverlo. Si salvano da soli e, riaprendo la mappa, tornano al loro posto, accesi o spenti come li avevi lasciati. Accanto al nome, «solo questa sessione» avverte che quel layer non si è potuto salvare.',
      'I tuoi file non stanno più qui: si caricano dall’albero del gruppo «I miei layer» (icona di caricamento accanto a «I miei dati») e compaiono nello stesso gruppo, insieme ai servizi XYZ, WMS, WMTS, WFS e ArcGIS REST aggiunti per indirizzo, anche con utente e password. «Carica file dal computer» accetta: GeoJSON, KML, KMZ, GPX, Shapefile (un file zip con anche il .prj) e CSV con le colonne di latitudine e longitudine. GeoJSON e CSV devono essere in WGS84. Di ogni file restano solo gli elementi dentro il Comune di Palermo, e un layer si salva fino a 5 MB: oltre, vale solo finché la pagina è aperta.',
    ],
    immagine: { file: 'img/guida/passi/rndt-gruppo.webp', alt: 'Il gruppo RNDT aperto nella barra degli strati, con i pulsanti «Dal catalogo RNDT» e «Carica file dal computer» e un layer in elenco con la sua casella.', didascalia: 'Il gruppo RNDT: i layer aggiunti e i due modi per aggiungerne.' },
  },
  {
    id: 'rndt-info',
    titolo: 'Interrogare i layer RNDT',
    statico: true,
    paragrafi: [
      'Un clic sulla mappa interroga anche i layer RNDT accesi. Le risposte arrivano nella linguetta «Altri dati (RNDT)» della scheda, con un riquadro per ogni layer. Per i dati in formato GeoJSON, e per i servizi WFS, la scheda mostra gli attributi dell\'elemento cliccato, per esempio nome, specie e località di un albero monumentale: bisogna cliccare proprio sul punto.',
      'Per i servizi WMS la scheda chiede al servizio le informazioni sul punto (GetFeatureInfo) e riporta la risposta; se il livello è solo grafico, lo dice. I dati dei servizi esterni hanno valore informativo: la fonte è indicata sotto ogni riquadro.',
    ],
    immagine: { file: 'img/guida/passi/rndt-info.webp', alt: 'La scheda del luogo sulla linguetta «Altri dati (RNDT)», con gli attributi di un albero monumentale: nome, specie, località e circonferenza.', didascalia: 'Clic su un albero monumentale: gli attributi del layer RNDT.' },
  },
  {
    id: 'avvertenze',
    titolo: 'Avvertenze',
    paragrafi: [
      'Catasto, zonizzazione e vincoli hanno valore solo informativo e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Il piano regolatore è la variante generale del duemilaquattro: varianti successive potrebbero non essere incluse.',
      'I dati del censimento sono stime campionarie, quindi i valori per sezione non sono conteggi esatti.',
    ],
    immagine: { file: 'img/guida/passi/avvertenze.webp', alt: 'La sezione Strumenti urbanistici della scheda del luogo, con in fondo l\'avviso: dato informativo, senza valore legale.', didascalia: 'In fondo a ogni scheda, l\'avviso sul valore informativo dei dati.' },
    narrazione: 'Un\'ultima avvertenza: catasto, zonizzazione e vincoli hanno valore solo informativo, e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. I dati del censimento sono stime. Per usi legali rivolgiti sempre agli uffici competenti.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC, schedaTab: 'Strumenti urbanistici' },
  },
];
