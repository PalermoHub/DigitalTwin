# Pagine informative, privacy, lingua e uso offline

## Il menu in alto e le pagine informative

Parole chiave: menu, pagine, Home, Mappa, Digital Twin, Argomenti, Guida, Guida Geoimage, Plugin RNDT, Fonti e note, Privacy, About, Presentazione, indice della pagina.

Domande tipiche: Cosa c'è nel menu in alto? Come chiudo una pagina? Dove trovo le fonti e le note?

Il menu è accanto al logo ed è lo stesso in tutte le pagine del sito (da smartphone sta nel tab «Menu»). Ha le voci **Home**, **Mappa**, **Digital Twin**, **Guida generale** (con, nella tendina accanto, **Plugin RNDT** e **Guida Geoimage**), **Fonti e note** e **About** (con, nella tendina accanto, **Presentazione** e **Privacy**). La voce della pagina in cui ci si trova è evidenziata.

**Home** (`index.html`) è la pagina dove si scelgono e si aggiungono gli strati della mappa; qui c'è il filtro per **argomento**. **Mappa** riporta alla mappa.

Digital Twin, Guida, Plugin RNDT, Guida Geoimage, Fonti e note, About e Privacy sono **pagine a sé** (`digitaltwin.html`, `guida.html`, `plugin.html`, `geoimage.html`, `fonti.html`, `about.html`, `privacy.html`), a **tutta larghezza**, divise in fasce, e molte hanno un **indice laterale** («Indice della pagina», «Indice della guida»). Per tornare alla mappa si sceglie **Mappa** nel menu. Dalla mappa, le stesse voci aprono invece i fogli informativi sopra la mappa, che si chiudono premendo di nuovo la voce o con **Esc**.

- **Digital Twin**: «La città a strati: catasto, popolazione, edifici, trasporti, sicurezza e molto altro.» Sezioni: «Cos'è per noi un Digital Twin, in parole semplici», «Come è organizzato», «Le fonti», «Come si utilizza», «A cosa serve».
- **Argomenti**: «Di cosa parla il Digital Twin, argomento per argomento.» Un riquadro per ogni argomento, con la descrizione e l'elenco degli strati e il pulsante **«Mostra in mappa»** che accende gli strati dell'argomento e chiude la pagina (spento se gli strati non sono ancora disponibili). Non è più una voce del menu: gli argomenti si scelgono dal filtro della Home.
- **Guida**: «Come usare la mappa, passo dopo passo.» Ha due gruppi, **Funzioni** e **Casi d'uso**, passi con immagini e video (il video «Palermo Digital Twin: come usare la mappa con i dati aperti di Palermo»).
- **Guida Geoimage**: «Come sovrapporre una mappa storica alla cartografia e georeferenziarla.» (vedi `50-geoimage.md`)
- **Plugin RNDT**: spiega il catalogo RNDT e dà il merito a Andrea Borruso (vedi `49-catalogo-rndt.md`), con casi d'uso.
- **Fonti e note**: «Da dove vengono i dati e cosa tenere presente quando li si usa.» Ha le sezioni **«Fonti dei dati»** (una voce per fonte, con la data, i collegamenti al dato originale e la licenza) e **«Da sapere»** (le avvertenze).
- **Privacy**: vedi sotto.
- **About**: «La comunità OpenDataSicilia, che promuove i dati aperti in Sicilia.» Sezioni: Che cos'è, Chi siamo, Dove siamo (mailing list, Facebook, Twitter, Telegram, GitHub Discussions), **Collabora e segnala** (il pulsante «Apri una segnalazione su GitHub» per errori nei dati o idee), Credits (Sviluppo, Strumenti usati). La web app è progettata e sviluppata da @gbvitrano in collaborazione con Claude AI (Anthropic).

**Presentazione.** È una pagina a parte (`presentazione.html`) con sezioni come «Perché?», «Cosa trovi sulla mappa», «Dati aperti, con le fonti», «Il tour dell'app» (video), «Funziona anche su smartphone e tablet», «Tutti gli strati, in 3D» (vedi `39-strati-in-3d.md`) e «Collabora e segnala».

---

## Invito all'avvio

Parole chiave: invito, clicca sulla mappa, non mostrare più, schema tutto in un punto, primo avvio.

Domande tipiche: Cos'è il messaggio «Clicca sulla mappa»? Come lo tolgo per sempre?

All'apertura compare un pulsante informativo (**«Clicca sulla mappa per scoprire tutto su un punto»**) con, sui soli schermi larghi, lo schema «Tutto in un punto». **Compare a ogni apertura** e scompare al primo clic (o tocco) sulla mappa. Solo **«Non mostrare più»** lo spegne per sempre (scelta salvata nel browser). Il pulsante «Ripristina» accanto alla ricerca lo riaccende (vedi `44-ricerca-e-filtri.md`). Non compare se l'indirizzo apre già una scheda.

---

## Privacy e consenso alle statistiche

Parole chiave: privacy, GDPR, cookie, Google Analytics, consenso, accetta, rifiuta, dati personali, titolare del trattamento, diritti.

Domande tipiche: Il sito raccoglie dati personali? Cosa succede se rifiuto i cookie? Cosa resta sul mio dispositivo? Chi è il titolare?

**Banner di consenso.** Il sito usa **Google Analytics** (con cookie) per contare le visite in forma aggregata, **solo se si accetta**: nulla viene caricato prima. Il banner dice «Usiamo Google Analytics, con cookie, per contare le visite in forma aggregata. Parte solo se acconsenti; puoi cambiare idea in ogni momento.» con **Informativa privacy**, **Rifiuta** e **Accetta**. La scelta è salvata nel browser; rifiutando, i cookie `_ga` vengono cancellati. Nella pagina Privacy il pulsante **«Gestisci il consenso alle statistiche»** riapre la scelta.

**La pagina Privacy** (informativa sintetica ai sensi del Regolamento UE 2016/679 e della direttiva ePrivacy) dice che:
- la mappa **non richiede registrazione** e non raccoglie dati personali con moduli; i dati mostrati (catasto, popolazione, uffici…) sono pubblici;
- per le statistiche si usa Google Analytics (Google Ireland Ltd., UE) solo con il consenso; Google può impostare cookie e trattare indirizzo IP e informazioni sul dispositivo, con possibili trasferimenti fuori dall'UE secondo il Data Privacy Framework;
- **sul dispositivo restano** solo la scelta del tema, la cache offline dell'app (service worker) e, per chi li usa, gli strati caricati dal proprio computer o da un servizio indicato (IndexedDB): nulla viene inviato ai titolari;
- **utente e password** dei servizi protetti si tengono solo in memoria, per la sessione;
- **servizi esterni contattati dal browser**: la base cartografica OpenFreeMap, i video su YouTube in modalità «privacy avanzata» (solo se si preme Play) e un proxy su Cloudflare Workers per interrogare i cataloghi RNDT; ognuno vede l'indirizzo IP di chi si collega;
- **diritti** (artt. 15–22 GDPR): accesso, rettifica, cancellazione, limitazione, opposizione; reclami al Garante per la protezione dei dati personali;
- **titolare del trattamento**: OpenDataSicilia, contattabile dalle discussioni su GitHub o dal sito opendatasicilia.it.

Altri servizi esterni citati altrove: la panoramica di Street View è di Google (vedi `41-street-view.md`); alcune mappe di base sono servite da Google, Esri e OpenStreetMap (vedi `47-mappe-di-base-e-storiche.md`).

---

## Cambiare lingua: italiano e inglese

Parole chiave: lingua, inglese, italiano, IT EN, globo, tradotto, English.

Domande tipiche: C'è una versione in inglese? Come cambio lingua?

L'app è in **italiano e inglese**. In testata c'è il pulsante con il globo e la sigla della lingua corrente (**IT** o **EN**): un clic passa all'altra lingua («Passa all'inglese») e **ricarica la pagina**. All'avvio la lingua è quella salvata nel browser, altrimenti quella del browser (italiano se comincia per «it», inglese altrimenti). L'italiano è la lingua base: dove un testo non è tradotto in inglese resta in italiano. Schemi e screenshot con testo scritto nell'immagine hanno una variante inglese. Anche il banner dei cookie è nelle due lingue.

---

## Uso offline e installazione come app

Parole chiave: offline, senza rete, installare, PWA, service worker, cache, aggiornamenti, schermata iniziale.

Domande tipiche: Funziona senza internet? Posso installarla sul telefono? Perché i dati si aggiornano?

L'app ha un **service worker** che rende immediate le visite ripetute e tiene l'**interfaccia disponibile anche senza rete**:
- la **pagina** e i **dati dell'app** (cartella dati: colonnine ogni ora, distributori ogni giorno, incendi, PAI…) si chiedono prima alla rete, con la copia salvata come ripiego;
- i **file statici** (script, stili, immagini, caratteri) si servono subito dalla copia e si aggiornano in secondo piano;
- i **file PMTiles** letti a intervalli si conservano per 24 ore, così non si riscaricano a ogni visita;
- tutto il resto (altri siti, richieste di invio) non viene toccato.

Quindi offline si vede ciò che è già stato aperto; i servizi esterni (mappe di base, ortofoto, Street View, cataloghi) hanno bisogno della rete.

Il sito ha un **manifest** («Palermo Digital Twin», nome breve «Palermo DT», schermo intero standalone, con le icone) che permette di installarlo come app dal browser.

---

## Piè di pagina

Parole chiave: footer, avviso valore legale, coordinate del cursore, logo OpenDataSicilia, copyright.

Domande tipiche: Cosa c'è in fondo alla pagina?

Il piè di pagina ha il copyright, l'avviso **«Catasto, PRG e vincoli sono dati informativi, senza valore legale»**, le coordinate e il logo di **Open Data Sicilia** (collegamento al sito opendatasicilia.it).
