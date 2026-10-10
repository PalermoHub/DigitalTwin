// Fonte unica della guida: la leggono il tab Info (guida.js), lo script degli screenshot e quello del video.
// `narrazione` è il testo parlato: niente cifre né sigle (si scrivono per esteso come si pronunciano).
// `scena` dice allo script degli screenshot come preparare la mappa (vedi scripts/guida_screenshot.py).
const PUNTO_CLIC = [13.3586, 38.1203];
const CENTRO = [13.3615, 38.1157];
const TEATRO = [13.3571944, 38.1201711]; // Teatro Massimo (strato Monumenti)
const PALAGONIA = [13.370036, 38.1167363]; // Palazzo Palagonia, sede comunale (strato Uffici)

// Testo semplice della sezione «Un lavoro di Andrea Borruso» del tab «Plugin RNDT» (la scheda in catalogo.js ha gli stessi
// paragrafi con i link): è la voce del video. Se cambi uno dei due, cambia anche l'altro.
export const MERITO_PLUGIN = [
  'Il catalogo RNDT di questa mappa si basa interamente sul plugin openrndt-geolibre, ideato e scritto da Andrea Borruso (onData). Senza il suo lavoro questa funzione non esisterebbe: l’ho solo adattata a questo progetto.',
  'Grazie alla sua ottima architettura è stato possibile adattarlo con pochissimi interventi: il plugin nasceva per un’altra applicazione di mappe, ma è pensato così bene da poter essere ospitato anche qui senza riscriverlo.',
];

export const PASSI = [
  {
    id: 'cos-e',
    gruppo: 'funzioni',
    titolo: 'Cos\'è la mappa e a cosa serve',
    paragrafi: [
      'Il Digital Twin di Palermo, realizzato da Open Data Sicilia, è una mappa interattiva che mette a disposizione di tutti i cittadini i dati della nostra città: catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico, sicurezza stradale e uffici comunali.',
      'Serve a leggere un luogo da più punti di vista: chi cerca una particella, chi vuole capire come è fatto un quartiere, chi studia la mobilità o i servizi. Ogni informazione resta collegata alla fonte da cui proviene.',
      'In alto, accanto al logo, il menu porta alle altre schede (Digital Twin, Argomenti, Guida, Guida Geoimage, Plugin RNDT, Fonti e note, About); la mappa sta al centro, con la barra degli strati a sinistra e la scheda del luogo a destra. Funziona anche da smartphone, con una barra di quattro tab in basso: vedi il passo «Su smartphone».',
    ],
    immagine: { file: 'img/guida/passi/cos-e.webp', alt: 'La mappa di Palermo appena aperta: in alto il logo, il menu delle schede e i pulsanti degli strumenti; a sinistra la barra verticale degli strati; in basso la ricerca e, a piè di pagina, l\'avviso sul valore legale.', didascalia: 'La vista iniziale: il centro di Palermo.' },
    narrazione: 'Benvenuti nel Digital Twin di Palermo, realizzato da Open Data Sicilia: una mappa interattiva che mette a disposizione di tutti i cittadini i dati della nostra città. Qui trovi insieme catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico e sicurezza stradale, e puoi leggere un luogo da più punti di vista, sempre con la fonte dei dati a portata di mano.',
    scena: { strati: [], centro: CENTRO, zoom: 12 },
  },
  {
    id: 'telefono',
    gruppo: 'funzioni',
    titolo: 'Su smartphone',
    statico: true,
    paragrafi: [
      'Su uno schermo stretto i comandi cambiano. In basso c\'è una barra con quattro tab: «Mappa» riporta alla mappa e chiude ciò che la copre; «Strati» apre i riquadri delle mappe di base, dei layer e dei filtri, con il numero degli strati accesi; «Aggiungi» riunisce «I miei layer», il catalogo RNDT e Geoimage; «Menu» apre le guide e le pagine sul progetto.',
      'La ricerca sta in alto, sotto il logo, con il pulsante «Filtri»; a destra restano gli strumenti della mappa. Il tema scuro si cambia con l\'interruttore accanto al logo. Per conoscere un luogo si tocca la mappa: la scheda sale dal basso e si alza o si abbassa trascinando la maniglia.',
    ],
    immagine: { file: 'img/guida/passi/telefono.webp', alt: 'Tre schermate dello smartphone: la mappa con la ricerca in alto e la barra dei tab in basso; il foglio «Aggiungi» con «I miei layer», «Catalogo RNDT» e «Geoimage»; il menu a comparsa con le guide e le pagine informative.', didascalia: 'Da smartphone: ricerca in alto, quattro tab in basso e menu a comparsa.' },
  },
  {
    id: 'dati',
    gruppo: 'funzioni',
    titolo: 'Con quali dati è realizzata',
    paragrafi: [
      'La mappa usa dati pubblicati da enti pubblici e da progetti di dati aperti: il Comune di Palermo (scuole, uffici, incidenti, carta tecnica), l\'azienda del trasporto pubblico AMAT, i dati ferroviari di Trenitalia, il catasto e la zonizzazione del piano regolatore, i dati del censimento e la base cartografica di OpenStreetMap.',
      'L\'elenco completo è nella scheda «Fonti e note» del menu (in alto; da smartphone nel tab «Menu»): per ogni fonte ci sono la data, il collegamento al dato originale e il collegamento alla licenza (per esempio Creative Commons Attribuzione 4.0).',
      'Gli orari del trasporto pubblico si aggiornano da soli: ogni giorno il sito controlla il portale open data del Comune e, quando AMAT pubblica un nuovo feed, fermate, linee e orari vengono sostituiti. Lo stesso vale per la ferrovia urbana: ogni giorno il sito controlla il feed GTFS di Trenitalia e, quando esce una nuova versione, stazioni, linee e orari vengono sostituiti. Se il feed in uso è scaduto, la mappa lo segnala.',
    ],
    immagine: { file: 'img/guida/passi/dati.webp', alt: 'La scheda Fonti e note, con l\'elenco delle fonti dei dati, i collegamenti ai dati originali e alle licenze.', didascalia: 'Le fonti dei dati sono elencate in «Fonti e note», con i link alle licenze.' },
    narrazione: 'I dati arrivano da enti pubblici e da progetti di dati aperti: il Comune di Palermo, l\'azienda del trasporto pubblico, il catasto, la zonizzazione del piano regolatore, il censimento e la cartografia di OpenStreetMap. L\'elenco completo si trova nella scheda Fonti e note, con il collegamento al dato originale e alla licenza di ogni fonte.',
    scena: { strati: [], centro: CENTRO, zoom: 12, ritaglio: '#crediti' },
  },
  {
    id: 'strati',
    gruppo: 'funzioni',
    titolo: 'La barra degli strati',
    paragrafi: [
      'Gli strati sono i temi che si possono sovrapporre alla mappa. A sinistra una barra verticale ha cinque tab: «Base cartografica», «Layer», «RNDT», «I miei layer» e «Filtri». Il tab «Layer» apre un pannello con i gruppi di strati (Confini, Edifici, Monumenti, Piano PAI, Popolazione, Rilievo, Servizi, Sicurezza, Territorio, Trasporti), sempre in ordine alfabetico: un clic sul gruppo lo apre, e ogni strato ha una casella per accenderlo o spegnerlo. Il pannello resta aperto finché non si preme di nuovo il tab o Esc; da smartphone si apre dal tab «Strati», mentre «I miei layer», il catalogo RNDT e Geoimage stanno nel tab «Aggiungi».',
      'Gli strati accesi compaiono come etichette in alto sulla mappa e la legenda in basso a sinistra ne spiega i colori. Accanto a ogni strato i pulsanti permettono di spostarlo su o giù, centrare la mappa sui suoi dati e cambiare i colori; il campo «Cerca strato» filtra l\'elenco. Se ne possono accendere più d\'uno per confrontarli, ad esempio edifici e catasto.',
    ],
    immagine: { file: 'img/guida/passi/strati.webp', alt: 'La barra verticale a sinistra con il tab Layer aperto: il gruppo Territorio mostra l\'elenco degli strati, tra cui catasto, piano regolatore e incendi.', didascalia: 'Il tab «Layer» con il gruppo «Territorio» aperto e il catasto acceso.' },
    narrazione: 'Gli strati sono i temi che si sovrappongono alla mappa. La barra a sinistra ha cinque tab: base cartografica, layer, catalogo nazionale, i miei layer e filtri. Il tab layer raggruppa gli strati: confini, edifici, monumenti, popolazione, rilievo, servizi, sicurezza, territorio e trasporti. Scegli un gruppo e accendi gli strati con la casella. Gli strati accesi compaiono come etichette in alto, e la legenda in basso ne spiega i colori.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 16, rail: 'btn-gruppo-layer', gruppo: 'Territorio' },
  },
  {
    id: 'ordine-layer',
    gruppo: 'funzioni',
    titolo: 'Mettere un layer sopra o sotto un altro',
    paragrafi: [
      'In cima al tab «Layer», sotto «Cerca strato», la scheda arancione «Ordine layer in mappa» elenca tutti gli strati accesi, di qualsiasi gruppo, con accanto il gruppo di provenienza. Il contatore dice quanti sono, anche a scheda chiusa; servono almeno due strati accesi per cambiare l\'ordine.',
      'In alto nell\'elenco vuol dire sopra sulla mappa. Si riordina con le frecce su e giù oppure trascinando la maniglia. Vale anche per i layer di «I miei layer» e del catalogo RNDT, e un layer appena aggiunto parte in cima a tutto. «Ripristina ordine» riporta l\'ordine di partenza; l\'ordine scelto è salvato nel browser e ritrovato alla visita successiva.',
    ],
    immagine: { file: 'img/guida/passi/ordine-layer.webp', alt: 'Il tab Layer con la scheda arancione «Ordine layer in mappa» aperta: l\'elenco degli strati accesi con le frecce per spostarli e la maniglia per trascinarli.', didascalia: 'La scheda «Ordine layer in mappa», con tre strati accesi.' },
    narrazione: 'In cima al tab layer trovi la scheda ordine layer in mappa: elenca tutti gli strati accesi, di qualsiasi gruppo. In alto significa sopra sulla mappa. Puoi spostare uno strato con le frecce, oppure trascinarlo. Vale anche per i layer che aggiungi tu e per quelli del catalogo nazionale. L\'ordine che scegli viene ricordato alla visita successiva.',
    scena: { strati: ['edificato', 'catasto', 'monumenti'], centro: PUNTO_CLIC, zoom: 16, rail: 'btn-gruppo-layer', macro: 'ordine' },
  },
  {
    id: 'mappe-storiche',
    gruppo: 'funzioni',
    titolo: 'Mappe di base e mappe storiche',
    paragrafi: [
      'Il tab «Base cartografica» cambia la mappa che sta sotto gli strati: mappe stradali (chiara, scura e altre), immagini aeree e topografiche. Il pulsante con la luna, nella barra degli strumenti, passa dal tema chiaro al tema scuro, e la mappa di base cambia di conseguenza.',
      'In fondo c\'è la sezione «Mappe storiche»: quindici carte di Palermo, dal 1580 al 1993, tratte dall\'Atlante delle carte tecniche storiche di Palermo di OpenDataSicilia. Il pallino colorato dice quanto bene la carta si sovrappone alla città di oggi: verde alta, giallo media, rosso bassa. Il pulsante «Apri l\'Atlante storico di Palermo» apre l\'atlante completo, già posizionato sulla zona che stai guardando. Per confrontare una carta con la città di oggi si usa la «Guida Geoimage».',
    ],
    immagine: { file: 'img/guida/passi/mappe-storiche.webp', alt: 'Il tab Base cartografica scorso fino alla sezione Mappe storiche, con le miniature delle carte e il pallino di precisione; sulla mappa la carta del 1891.', didascalia: 'Una mappa storica come base: Palermo nel 1891.' },
    narrazione: 'Il tab base cartografica cambia la mappa che sta sotto gli strati: stradale, aerea o topografica. In fondo trovi le mappe storiche: quindici carte di Palermo, dal millecinquecentoottanta al millenovecentonovantatré, dell\'Atlante delle carte tecniche storiche di Open Data Sicilia. Il pallino colorato indica la precisione della sovrapposizione con la città di oggi.',
    scena: { strati: [], centro: CENTRO, zoom: 14, rail: 'btn-gruppo-base', macro: 'storiche' },
  },
  {
    id: 'miei-layer',
    gruppo: 'funzioni',
    titolo: 'Aggiungere i propri dati e servizi',
    paragrafi: [
      'Il tab «I miei layer» funziona come il Browser di QGIS. Sotto «I miei dati» si caricano file dal computer (GeoJSON, KML, KMZ, GPX, Shapefile in zip, CSV con latitudine e longitudine) o da un indirizzo https, anche un foglio Google Sheets condiviso con «Chiunque abbia il link». Sotto «Servizi» c\'è un ramo per tipo: XYZ, WMS, WMTS, WFS e ArcGIS REST; il pulsante «+» aggiunge un servizio e «Leggi il servizio» ne mostra i layer da spuntare.',
      'I servizi aggiunti restano salvati nel browser (fino a cinquanta): un clic su una riga li rimette in mappa, il cestino li toglie dall\'elenco. Per i servizi protetti ci sono i campi utente e password, che restano in memoria solo finché la pagina è aperta: alla riapertura il servizio mostra un lucchetto e la password va inserita di nuovo. Per ArcGIS REST si può incollare un token nell\'indirizzo. I dati si vedono entro l\'area di Palermo e i layer aggiunti compaiono sotto «Layer in mappa», con casella, opacità e frecce per l\'ordine.',
      'Per provare subito il tab, sono già caricati a titolo di esempio alcuni servizi XYZ, i servizi WMS del Comune di Palermo (Sispi) e i servizi ArcGIS REST del SITR della Regione Siciliana.',
    ],
    immagine: { file: 'img/guida/passi/miei-layer.webp', alt: 'Il tab I miei layer: il campo di ricerca, la voce I miei dati con il campo per l\'indirizzo web, i rami dei servizi XYZ, WMS, WMTS, WFS e ArcGIS REST con il pulsante più, e l\'elenco dei layer in mappa.', didascalia: 'Il tab «I miei layer»: file, indirizzi web e servizi.' },
    narrazione: 'Nel tab i miei layer puoi aggiungere i tuoi dati. Carichi un file dal computer o da un indirizzo web, oppure aggiungi un servizio: X Y Z, W M S, W M T S, W F S o Arc G I S. I servizi restano salvati nel browser, e per quelli protetti utente e password restano in memoria solo finché la pagina è aperta.',
    scena: { strati: [], centro: CENTRO, zoom: 13, rail: 'btn-gruppo-miei' },
  },
  {
    id: 'colori',
    gruppo: 'funzioni',
    titolo: 'Cambiare i colori di uno strato',
    paragrafi: [
      'Il pulsante con la tavolozza, accanto a uno strato, apre il pannello dei colori: riempimento e bordo, e «Colora per attributo», che colora gli elementi secondo un campo dei dati. Il tipo «Per categorie» dà un colore a ogni valore; il tipo «Graduata» divide un campo numerico in classi (da tre a nove, a quantili o a intervalli uguali).',
      'La rampa si sceglie da un elenco con l\'anteprima dei colori: oltre alle cinque di ColorBrewer ci sono le scale scientifiche di Fabio Crameri, uniformi per percezione e leggibili anche con il daltonismo e in bianco e nero. Le sequenziali vanno dal chiaro allo scuro; le divergenti vanno usate solo con dati che hanno un valore di riferimento. La casella «Inverti la scala dei colori» la legge dal fondo. In basso a sinistra compare la legenda del tema, con le classi e i colori scelti; «Ripristina» riporta i colori originali, «Esporta JSON» salva il tema.',
    ],
    immagine: { file: 'img/guida/passi/colori.webp', alt: 'Il pannello dei colori dello strato Edificato: campo di densità di popolazione, tipo Graduata e rampa Batlow, con la legenda del tema e gli edifici colorati sulla mappa.', didascalia: 'Edificato colorato per densità di popolazione con la scala Batlow.' },
    narrazione: 'Il pulsante con la tavolozza, accanto a ogni strato, apre il pannello dei colori. Con colora per attributo scegli un campo dei dati e la mappa si colora di conseguenza, per categorie oppure in classi. La rampa si sceglie da un elenco con l\'anteprima, e comprende le scale scientifiche di Fabio Crameri, leggibili anche con il daltonismo. In basso a sinistra compare la legenda del tema.',
    scena: { strati: ['edificato'], centro: CENTRO, zoom: 15, rail: 'btn-gruppo-layer', gruppo: 'Edifici', macro: 'colori' },
  },
  {
    id: 'tema-interfaccia',
    gruppo: 'funzioni',
    titolo: 'Personalizzare i colori e il testo dell\'interfaccia',
    paragrafi: [
      'Nella barra di destra il tab «Tema» (la tavolozza) apre il pannello che cambia l\'aspetto di tutta l\'applicazione, non solo della mappa. In alto ci sono i «Temi pronti», ciascuno con la sua miniatura: Chiaro, Scuro, Alto contrasto e molti altri. Un clic li applica subito, con l\'anteprima dal vivo, e il tema scelto resta salvato in questo browser.',
      'Sotto i temi si regolano a mano i cinque colori di base: sfondo, testo, accento, link e bordi. Se un colore si legge male sullo sfondo, un avviso indica il contrasto misurato e quello minimo consigliato. «Colori avanzati» permette di scegliere anche i colori di stato (esito positivo, errore e allarme, fondo degli avvisi), quello della particella cercata e quello dei valori nei grafici. La sezione «Testo» cambia la dimensione e il carattere, compreso Atkinson Hyperlegible, pensato per l\'alta leggibilità.',
      '«Salva su file» scrive il tema in un file sul tuo computer, che «Carica da file» rilegge anche su un altro dispositivo: non viene inviato a nessuno. «Ripristina colori standard» toglie il tema personalizzato, come fa il pulsante chiaro/scuro della barra degli strumenti.',
    ],
    evidenza: 'Per chi non distingue bene alcuni colori ci sono due temi pronti: «Daltonici: rosso-verde», per chi confonde il rosso con il verde, e «Daltonici: blu-giallo», per chi confonde il blu con il giallo.',
    immagine: { file: 'img/guida/passi/tema-interfaccia.webp', alt: 'Il pannello Tema nella barra di destra, scorso fino ai Temi pronti: in evidenza i due temi Daltonici, rosso-verde e blu-giallo, con le miniature; sotto, i colori di base e la sezione Testo.', didascalia: 'Il tab «Tema»: temi pronti, tra cui i due per daltonici.' },
    narrazione: 'Il tab tema, nella barra di destra, cambia i colori e il testo di tutta l\'applicazione. Scegli un tema pronto, oppure regola a mano sfondo, testo, accento, link e bordi: un avviso ti dice se il contrasto è troppo basso. Puoi anche ingrandire il testo e usare un carattere ad alta leggibilità. Ci sono poi due temi pensati per chi non distingue bene i colori, uno per il rosso e il verde e uno per il blu e il giallo. Il tema si può salvare su file e ricaricare quando vuoi.',
    scena: { strati: [], centro: CENTRO, zoom: 13, macro: 'tema' },
  },
  {
    id: 'clic',
    gruppo: 'funzioni',
    titolo: 'Fare clic sulla mappa',
    paragrafi: [
      'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da smartphone: all\'apertura un invito a tutto schermo lo ricorda, sparisce al primo clic e, con «Non mostrare più», non si ripresenta (il pulsante «Ripristina» accanto alla ricerca lo riaccende). Il punto scelto viene evidenziato e si apre la scheda del luogo.',
      'Le aree evidenziate (edificio, particella, fermate vicine e altro) hanno in basso una legenda «Selezione in mappa» con un colore per ogni voce: un clic su una voce lascia in mappa solo quella, un secondo clic le riaccende tutte. Passando con il mouse su un\'area compare un fumetto con il nome del layer e il dato che identifica l\'elemento; il pulsante a fumetto della legenda li accende e li spegne.',
    ],
    immagine: { file: 'img/guida/passi/clic.webp', alt: 'Un punto scelto sulla mappa in via Maqueda con le aree evidenziate, la legenda Selezione in mappa in basso e la scheda del luogo aperta sul lato destro.', didascalia: 'Un clic in via Maqueda evidenzia il punto, mostra la legenda della selezione e apre la scheda.' },
    narrazione: 'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo. Le aree evidenziate hanno una legenda con un colore per ogni voce: un clic su una voce lascia in mappa solo quella. Passando con il mouse compare un fumetto con il nome del layer.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC },
  },
  {
    id: 'tutto-in-un-punto',
    gruppo: 'funzioni',
    titolo: 'Tutto in un punto',
    statico: true,
    paragrafi: [
      'Un solo clic interroga insieme tutti gli strati: catasto, vincoli del piano regolatore, sicurezza stradale, beni culturali e trasporto pubblico. Il risultato è la scheda del luogo, che mette in fila ciò che si sovrappone in quel punto.',
    ],
    immagine: { file: 'img/guida/passi/intersezione.svg', alt: 'Schema: un clic su via Maqueda 435 restituisce catasto (particella 180, foglio 128), vincoli (zonizzazione PRG 2004, centro storico), sicurezza (zona a incidenti concentrati), cultura (chiesa delle Francescane, non più esistente) e trasporti (fermata a 130 metri).', didascalia: 'Un clic, cinque letture dello stesso luogo.' },
  },
  {
    id: 'scheda',
    gruppo: 'funzioni',
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
    id: 'filtri',
    gruppo: 'funzioni',
    titolo: 'Cercare e filtrare',
    paragrafi: [
      'Il campo di ricerca in basso permette di cercare una via, un civico, un quartiere o una particella. Il tab «Filtri» della barra a sinistra apre il pannello per limitare la ricerca a una circoscrizione, a un quartiere o a una UPL, per scegliere una linea del trasporto pubblico, l\'anno e la gravità degli incidenti, o per cercare una particella catastale da foglio e numero. Un numero sul tab dice quanti filtri sono attivi.',
      'Esempio: scegliendo una circoscrizione e digitando «Maqueda», i risultati si restringono alle vie con quel nome dentro la zona scelta; un clic su un risultato porta la mappa sul posto e apre la scheda. Il pulsante con la freccia circolare, accanto alla ricerca, ripristina colori, schede e ordine degli strati.',
    ],
    immagine: { file: 'img/guida/passi/filtri.webp', alt: 'Il tab Filtri aperto a sinistra, con una circoscrizione scelta, e sulla mappa l\'elenco dei risultati della ricerca per «Maqueda».', didascalia: 'Una ricerca di esempio: circoscrizione scelta e testo «Maqueda».' },
    narrazione: 'Il campo di ricerca in basso permette di cercare una via, un civico, un quartiere o una particella. Il tab filtri della barra a sinistra limita la ricerca a una circoscrizione, a un quartiere o a una zona, e permette di scegliere una linea del trasporto pubblico o cercare una particella catastale. Per esempio, scegli una circoscrizione e scrivi Maqueda: i risultati si restringono, e un clic su uno di essi porta la mappa sul posto.',
    scena: { strati: [], centro: CENTRO, zoom: 13, rail: 'btn-gruppo-filtri', ricerca: { testo: 'Maqueda' } },
  },
  {
    id: 'strumenti',
    gruppo: 'funzioni',
    titolo: 'Stampare la mappa',
    paragrafi: [
      'Il pulsante con la stampante, nella barra degli strumenti in alto a destra, prepara un foglio con il titolo, l\'immagine della mappa che stai guardando, le legende dei soli strati accesi e le attribuzioni delle fonti. Prima di stampare si sceglie il formato, da A4 ad A0, l\'orientamento, orizzontale o verticale, e la scala, da 1:1.000 a 1:25.000, con la barra grafica in metri e chilometri; «Vista attuale» stampa la mappa com\'è.',
      'Negli altri pulsanti della barra: la casa riporta alla vista iniziale, le frecce agli angoli attivano lo schermo intero e la luna passa dal tema chiaro al tema scuro (da smartphone si usa l\'interruttore accanto al logo, e stampa, vista iniziale e schermo intero stanno in colonna a destra).',
    ],
    immagine: { file: 'img/guida/passi/strumenti.webp', alt: 'La barra degli strumenti con il pulsante di stampa premuto e il menu aperto: formato, orientamento, scala e il pulsante Stampa.', didascalia: 'Il menu di stampa: formato, orientamento e scala.' },
    narrazione: 'Il pulsante con la stampante prepara un foglio con il titolo, la mappa che stai guardando, le legende degli strati accesi e le fonti. Scegli il formato, da A quattro ad A zero, l\'orientamento e la scala. Gli altri pulsanti della barra riportano alla vista iniziale, attivano lo schermo intero o passano al tema scuro.',
    scena: { strati: ['edificato'], centro: PUNTO_CLIC, zoom: 16, macro: 'stampa' },
  },
  {
    id: 'tabella-dati',
    gruppo: 'funzioni',
    titolo: 'La tabella dei dati',
    statico: true,
    paragrafi: [
      'Il pulsante con la tabella, nella barra degli strumenti in alto a destra, apre dal basso la «Tabella dei dati»: le righe degli strati accesi, uno per scheda, in stile tabella attributi. Mostra le informazioni caricate nella vista corrente, quindi basta spostare o avvicinare la mappa per aggiornarla; da smartphone il pulsante sta nel foglio «Strati». Un layer spento non ha scheda.',
      'Per scegliere cosa vedere ci sono quattro strumenti di selezione: «Clic» sceglie un elemento, «Riquadro» e «Poligono» quelli dentro l\'area disegnata, «Area» quelli dentro una circoscrizione, un quartiere o una UPL. «Torna alla vista» riporta alle righe visibili in mappa. Il campo «Filtra le righe» cerca nel testo, l\'intestazione ordina e il menu «Colonne» mostra, nasconde e sposta le colonne.',
      'Le caselle scelgono righe e colonne da esportare; il pulsante CSV o GeoJSON indica quante righe e colonne usciranno (per esempio «33 × 15») e aggiunge la fonte e la licenza del layer. L\'esportazione è attiva per i dati aperti del Comune con licenza che la consente, come incidenti e sicurezza stradale; per gli altri layer, e per quelli aggiunti da te, il pulsante resta spento. La geometria dei layer a tile è semplificata: per dati precisi conviene il CSV.',
    ],
    immagine: { file: 'img/guida/passi/tabella-dati.webp', alt: 'La mappa con lo strato Scuole e asili acceso e, in basso, la Tabella dei dati: scheda Scuole e asili, strumenti di selezione, filtro, colonne, pulsanti CSV e GeoJSON e le prime righe selezionate.', didascalia: 'La Tabella dei dati con lo strato Scuole e asili: righe selezionate e pulsanti di esportazione.' },
  },
  {
    id: 'street-view',
    gruppo: 'funzioni',
    titolo: 'Street View',
    statico: true,
    paragrafi: [
      'Il pulsante con l\'omino, nella barra degli strumenti in alto a destra, attiva Street View: il cursore diventa un mirino. Si preme sul punto della mappa che interessa e, tenendo premuto, si trascina per scegliere la direzione di sguardo; un cono azzurro mostra verso dove guarderà la panoramica.',
      'Al rilascio si apre una finestra con la panoramica di Google Street View del punto: si sposta trascinando la barra in alto, si ridimensiona dall\'angolo e si chiude con la croce. «Apri su Google Maps» la apre a tutto schermo in una nuova scheda. Esc spegne lo strumento. Dove Google non ha immagini la finestra resta vuota; la panoramica è un servizio esterno di Google e non fa parte dei dati della mappa.',
    ],
    immagine: { file: 'img/guida/passi/street-view.webp', alt: 'La mappa con il cono azzurro di Street View vicino al Teatro Massimo e, a destra, la finestra con la panoramica di Via Maqueda.', didascalia: 'Street View: il cono sceglie la direzione e la panoramica si apre in una finestra.' },
  },
  {
    id: 'monumenti',
    gruppo: 'casi',
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
    gruppo: 'casi',
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
    gruppo: 'casi',
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
    gruppo: 'casi',
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
    id: 'isole-calore',
    gruppo: 'casi',
    titolo: 'Isole di calore',
    paragrafi: [
      'Lo strato «Isole di calore» (gruppo Territorio) mostra la temperatura superficiale estiva ricavata dai satelliti Landsat 8 e 9 (USGS) per ognuna delle 3600 sezioni di censimento del 2021; in mappa c\'è l\'anno 2025. È la temperatura della superficie, non quella dell\'aria che si misura con il termometro.',
      'La legenda permette di scegliere il metodo di classificazione (Jenks, quantili, intervalli uguali) e da tre a nove classi, e mostra il grafico dell\'andamento comunale dal 2019 al 2025. Un clic su una sezione apre la scheda con la voce «Isola di calore»: temperatura estiva, differenza rispetto alla media comunale e variazione dal 2019. Il link porta allo studio completo di PalermoHub.',
    ],
    immagine: { file: 'img/guida/passi/isole-calore.webp', alt: 'Lo strato Isole di calore acceso: le sezioni di censimento colorate per temperatura superficiale e la legenda a classi con il metodo di classificazione, il cursore delle classi e il grafico dell\'andamento comunale.', didascalia: 'Isole di calore: temperatura superficiale estiva per sezione di censimento.' },
    narrazione: 'Lo strato isole di calore mostra la temperatura superficiale estiva, ricavata dai satelliti Landsat, per ogni sezione di censimento. Nella legenda scegli il metodo di classificazione e il numero di classi, e vedi il grafico dell\'andamento dal duemiladiciannove al duemilaventicinque. Attenzione: è la temperatura della superficie, non quella dell\'aria.',
    scena: { strati: ['isole-calore'], centro: [13.3615, 38.1157], zoom: 13 },
  },
  {
    id: 'trasporto-strip',
    gruppo: 'casi',
    titolo: 'Fermate di bus, tram e metro',
    statico: true,
    paragrafi: [
      'Ogni linea del trasporto pubblico (bus e tram AMAT, metro della ferrovia urbana) si apre dalla scheda: si accendono gli strati «Linee bus», «Linee tram» o «Linea metro» e si clicca sul tracciato o su una fermata. Nel riquadro «Linee» si sceglie la linea e, nel suo blocco, si apre «Fermate»: le fermate compaiono in sequenza come uno schema a striscia, con la linea nel suo colore, un pallino per ogni fermata e i capolinea più grandi e in grassetto.',
      'Accanto al nome di ogni fermata, i riquadri colorati con il numero sono le altre linee che vi passano: i cambi. Un clic sul riquadro porta la mappa sulla fermata e mostra il percorso di quella linea; un clic sul nome porta la mappa sulla fermata e apre la sua scheda, con le prossime partenze. Cliccando su una fermata e non sul tracciato, le sue linee si aprono comunque con lo stesso schema. Un capolinea di sola arrivo lo dice: da lì non partono corse e gli orari sono alla fermata di partenza.',
    ],
    immagine: { file: 'img/guida/passi/trasporto-strip.webp', alt: 'La mappa con il tracciato e le fermate della linea 442 e, nella scheda, il blocco «Fermate (19)»: le fermate in sequenza su una striscia colorata, con a fianco i riquadri delle altre linee che vi passano.', didascalia: 'La linea 442 nella scheda: le fermate in sequenza e i cambi con le altre linee.' },
  },
  {
    id: 'avvertenze',
    titolo: 'Disclaimer',
    paragrafi: [
      'Catasto, zonizzazione e vincoli hanno valore solo informativo e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Il piano regolatore è la variante generale del duemilaquattro: varianti successive potrebbero non essere incluse.',
      'I dati del censimento sono stime campionarie, quindi i valori per sezione non sono conteggi esatti.',
    ],
    immagine: { file: 'img/guida/passi/avvertenze.webp', alt: 'La sezione Strumenti urbanistici della scheda del luogo, con in fondo l\'avviso: dato informativo, senza valore legale; a piè di pagina lo stesso avviso e la licenza.', didascalia: 'In fondo a ogni scheda, l\'avviso sul valore informativo dei dati.' },
    narrazione: 'Un\'ultima avvertenza: catasto, zonizzazione e vincoli hanno valore solo informativo, e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. I dati del censimento sono stime. Per usi legali rivolgiti sempre agli uffici competenti.',
    scena: { strati: ['edificato', 'catasto'], centro: PUNTO_CLIC, zoom: 17, clic: PUNTO_CLIC, schedaTab: 'Strumenti urbanistici' },
  },
];

// Passi del tab «Plugin RNDT» (non della Guida): stesso formato, immagini statiche.
export const PASSI_RNDT = [
  // Sono «statici»: immagini fatte con scripts/guida_screenshot_rndt.py, non fanno parte del video (che andrebbe rigenerato con la voce).
  {
    id: 'rndt-catalogo',
    titolo: 'Cercare nel catalogo RNDT',
    statico: true,
    paragrafi: [
      'Il pulsante con l\'icona dei due layer, nella barra degli strumenti in alto a destra, apre il catalogo del Repertorio Nazionale dei Dati Territoriali (RNDT): l\'elenco dei dati geografici pubblicati dagli enti di tutta Italia. Il pannello si affianca alla scheda del luogo nella barra verticale a destra: i tab «Scheda» e «RNDT» passano dall\'uno all\'altro, il tasto Esc chiude il catalogo.',
      'Si cerca per testo, tema o ente, sempre entro l\'area di Palermo. Un servizio WMS si aggiunge come livello di immagini; un servizio WFS come elementi geografici che si possono interrogare. Il catalogo usa il plugin openrndt-geolibre, sviluppato da Andrea Borruso di onData.',
    ],
    immagine: { file: 'img/guida/passi/rndt-catalogo.webp', alt: 'Il pannello del catalogo RNDT aperto sul lato destro della mappa, con il campo di ricerca e l\'elenco dei risultati.', didascalia: 'Il catalogo RNDT, limitato all\'area di Palermo.' },
  },
  {
    id: 'rndt-gruppo',
    titolo: 'Il gruppo RNDT e i tuoi file',
    statico: true,
    paragrafi: [
      'I dati aggiunti compaiono nel gruppo «RNDT» della barra degli strati, e anche tra gli Argomenti del foglio Info. Ogni layer ha l\'icona con l\'occhio per accenderlo o spegnerlo e il cestino per rimuoverlo. Si salvano da soli e, riaprendo la mappa, tornano al loro posto, accesi o spenti come li avevi lasciati. Accanto al nome, «solo questa sessione» avverte che quel layer non si è potuto salvare.',
      'I tuoi file non stanno più qui: si caricano dall’albero del gruppo «I miei layer» (icona di caricamento accanto a «I miei dati») e compaiono nello stesso gruppo, insieme ai servizi XYZ, WMS, WMTS, WFS e ArcGIS REST aggiunti per indirizzo, anche con utente e password. «Carica file dal computer» accetta: GeoJSON, KML, KMZ, GPX, Shapefile (un file zip con anche il .prj) e CSV con le colonne di latitudine e longitudine. GeoJSON e CSV devono essere in WGS84. Di ogni file restano solo gli elementi dentro il Comune di Palermo, e un layer si salva fino a 5 MB: oltre, vale solo finché la pagina è aperta. Puoi anche incollare un indirizzo https nel campo «Da indirizzo web» di «I miei dati»: per un foglio Google Sheets condividilo prima con «Chiunque abbia il link» (ruolo Lettore) e ricorda le colonne lat e lon; il file, al massimo 10 MB, è una copia che non si aggiorna da sola.',
    ],
    immagine: { file: 'img/guida/passi/rndt-gruppo.webp', alt: 'Il gruppo RNDT aperto nella barra degli strati, con il pulsante «Dal catalogo RNDT» e un layer in elenco con l\'occhio, il cursore dell\'opacità e il cestino per rimuoverlo; sulla mappa le aree a pericolosità da frana.', didascalia: 'Il gruppo RNDT con un layer aggiunto dal catalogo: le aree PAI da frana.' },
  },
  {
    id: 'rndt-info',
    titolo: 'Interrogare i layer RNDT',
    statico: true,
    paragrafi: [
      'Un clic sulla mappa interroga anche i layer RNDT accesi. Le risposte arrivano nella linguetta «Altri dati (RNDT)» della scheda, con un riquadro per ogni layer. Per i servizi WFS la scheda mostra gli attributi dell\'elemento cliccato, per esempio la classe di pericolosità di un\'area PAI da frana: bisogna cliccare proprio sull\'elemento.',
      'Per i servizi WMS la scheda chiede al servizio le informazioni sul punto (GetFeatureInfo) e riporta la risposta; se il livello è solo grafico, lo dice. I dati dei servizi esterni hanno valore informativo: la fonte è indicata sotto ogni riquadro.',
    ],
    immagine: { file: 'img/guida/passi/rndt-info.webp', alt: 'La scheda del luogo sulla linguetta «Altri dati (RNDT)», con gli attributi di un\'area a pericolosità da frana: classe di pericolosità, lunghezza e superficie, e la fonte.', didascalia: 'Clic su un\'area PAI da frana: gli attributi del layer RNDT.' },
  },
];
