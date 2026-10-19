# Fonti, avvertenze e glossario

## Fonti dei dati

Parole chiave: fonti, da dove vengono i dati, enti, dataset, licenza, open data, attribuzione.

Domande tipiche: Da dove arrivano i dati? Dove trovo le fonti? Posso riusare i dati?

La mappa usa dati pubblicati da enti pubblici e progetti di dati aperti:
- Comune di Palermo: scuole, uffici, sedi elettorali, civici, immobili comunali, incidenti, piano regolatore, carta tecnica, portale del turismo.
- Regione Siciliana: catasto (SITR), PAI, Censimento incendi.
- ISTAT: sezioni di censimento, indicatori 2011/2021/2023, pendolarismo 2021, confini.
- Agenzia delle Entrate: zone OMI e catasto.
- AMAT (bus e tram) e Trenitalia (ferrovia urbana): feed GTFS.
- Ministeri e agenzie: MEF (immobili), MIMIT (carburanti), MASAF (alberi monumentali), Ragioneria generale dello Stato (BDAP-MOP), Italia Domani (PNRR), AgID (IPA).
- Progetti di dati aperti: OpenDataSicilia e PalermoHub (PEBA, isole di calore, trend, sicurezza, atlante storico), OpenStreetMap.

L'elenco completo, con data, link al dato originale e link alla licenza, è nella pagina «Fonti e note» del menu (da smartphone nel tab «Menu»).

---

## Licenze e riuso

Parole chiave: licenza, CC BY 4.0, ODbL, IODL, EUPL, riuso, attribuzione, copyright.

Domande tipiche: Posso usare i dati in una pubblicazione? Come cito la fonte?

- Il codice è sotto licenza EUPL-1.2.
- I dati prodotti dal progetto sono CC BY 4.0; attribuzione richiesta: «Digital Twin Palermo, PalermoHub».
- I dati di terzi mantengono la licenza della fonte: la maggior parte è CC BY 4.0 (con citazione della fonte); i carburanti MIMIT sono IODL 2.0; OpenStreetMap è ODbL (attribuzione e share-alike); per le piante dei Crociferi e per alcuni dati del Comune valgono le condizioni del titolare indicate in `NOTICE.md` del repository.
- Prima di riusare un dato di terzi conviene verificare le condizioni presso il titolare. Per testi e foto dei monumenti vale la stessa cautela.
- L'esportazione dalla tabella dei dati è attiva per tutti i layer elencati; ogni file riporta fonte e licenza del layer (vedi `40-tabella-dei-dati-ed-esportazione.md`).

---

## Avvertenze e valore legale

Parole chiave: disclaimer, valore legale, informativo, certificato di destinazione urbanistica, visura, errori, affidabilità.

Domande tipiche: Posso usare questi dati per un atto notarile? I dati sono ufficiali? Posso fidarmi?

Catasto, zonizzazione e vincoli hanno **valore solo informativo** e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Il piano regolatore è la variante generale del 2004: varianti successive potrebbero non essere incluse. I dati del censimento sono stime campionarie, quindi i valori per sezione non sono conteggi esatti. Le posizioni di alcuni layer (immobili comunali, opere, PNRR, PEBA) derivano da georeferenziazione automatica e possono essere imprecise. Per usi legali ci si rivolge sempre agli uffici competenti. In fondo a ogni scheda c'è l'avviso: dato informativo, senza valore legale.

---

## Glossario delle sigle

Parole chiave: sigla, significato, cos'è, glossario, acronimo.

Domande tipiche: Cosa vuol dire UPL? Cos'è l'OMI? Cosa sono PAI, PEBA, RNDT, GTFS?

- **UPL**: Unità di primo livello, suddivisione del Comune più fine del quartiere.
- **PRG**: Piano regolatore generale (qui la variante del 2004). **ZTO**: la sigla delle zone della zonizzazione del PRG (campo «ZTO»). **PPE**: Piano Particolareggiato Esecutivo del centro storico.
- **PAI**: Piano di Assetto Idrogeologico della Regione Siciliana.
- **OMI**: Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate.
- **SITR**: servizio cartografico della Regione Siciliana (map.sitr.regione.sicilia.it).
- **PEBA**: Piano di Eliminazione delle Barriere Architettoniche.
- **PNRR**: Piano nazionale di ripresa e resilienza. **CUP**: il codice di progetto riportato nelle schede PNRR e delle opere pubbliche, con il collegamento a OpenCUP.
- **BDAP / MOP**: Open BDAP della Ragioneria generale dello Stato, «Monitoraggio Opere Pubbliche (MOP)», fonte delle opere pubbliche.
- **MEF**: Ministero dell'economia e delle finanze. **MIMIT**: Ministero delle Imprese e del Made in Italy. **MASAF**: Ministero dell'agricoltura, della sovranità alimentare e delle foreste.
- **RNDT**: Repertorio Nazionale dei Dati Territoriali. **WMS / WMTS / WFS / XYZ**: tipi di servizio di mappe e dati geografici.
- **GTFS**: i feed degli orari da cui vengono fermate, linee e orari di bus, tram e ferrovia urbana. **AMAT**: l'azienda del trasporto pubblico (bus e tram). **RFI**: è il nome della sezione «Linea metro» e «Stazioni metro» del gruppo Trasporti.
- **LST**: temperatura superficiale terrestre (non è la temperatura dell'aria). **DTM**: modello digitale del terreno.
- **GCP**: Ground Control Point, punto di controllo per la georeferenziazione. **RMSE**: errore quadratico medio.
- **ISTAT**: Istituto nazionale di statistica. **ANNCSU**: Archivio nazionale dei numeri civici e delle strade urbane. **AMAP**: AMAP S.p.A., fonte dei distretti idrici e delle fontanelle.
- **IPA**: Indice delle Pubbliche Amministrazioni (AgID).

---

## Domande a cui la guida non risponde

Parole chiave: fuori tema, non so, non risponde, assistenza, segnalare errore.

Domande tipiche: Posso chiedere un permesso edilizio? Quando passa l'autobus in tempo reale? Come segnalo un errore?

La guida spiega come usare la mappa e cosa contengono i dati. Non può:
- dare consulenza legale, urbanistica, fiscale o catastale, né indicare cosa si può costruire;
- dare informazioni che la mappa non contiene, come ritardi dei mezzi;
- rispondere su servizi del Comune non presenti in mappa (tributi, anagrafe, pratiche);
- confermare la correttezza di un dato singolo: ogni scheda indica la fonte, da verificare presso il titolare.

In questi casi si invita a consultare la fonte originale o gli uffici competenti. Per segnalare un errore nei dati, qualcosa che non funziona o un'idea per migliorare il sito si apre una issue su GitHub (basta un account gratuito): il pulsante «Apri una segnalazione su GitHub» è nella sezione «Collabora e segnala» della pagina di presentazione.
