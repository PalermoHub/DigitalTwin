# «I miei layer»: aggiungere i propri dati e servizi

## Cos'è il tab «I miei layer»

Parole chiave: I miei layer, aggiungere dati, aggiungere un servizio, albero, Browser di QGIS, layer in mappa, file e servizi.

Domande tipiche: Come aggiungo un mio layer? Dove vedo i layer che ho aggiunto? Come funziona l'albero?

Il tab **I miei layer** (da smartphone nel tab «Aggiungi») funziona come il Browser di QGIS. In cima c'è un **albero** con un campo di ricerca (**«Cerca sorgenti dati…»**, che cerca per nome o indirizzo tra i servizi salvati) e due rami: **«I miei dati»** (file) e **«Servizi»**. Sotto l'albero c'è **«Layer in mappa»**, l'elenco dei layer aggiunti, ciascuno con la casella, l'opacità e le frecce per l'ordine; se non ce ne sono dice «Nessun layer in mappa: carica un file o aggiungi un servizio dall'albero qui sopra.» L'albero si costruisce una volta sola: rami aperti e testo digitato restano anche quando il gruppo si ridisegna.

Le descrizioni del gruppo: «File caricati dal computer e servizi XYZ, WMS e WFS aggiunti per indirizzo, anche richiamati dal salvataggio.»

I layer aggiunti compaiono anche nella tabella dei dati (vedi `40-tabella-dei-dati-ed-esportazione.md`) e nella pila degli strati in 3D come «Altri layer». Nel link di «Condividi» entrano solo quelli riaprendibili da un indirizzo pubblico (vedi `43-condividi.md`).

---

## I miei dati: file dal computer e da indirizzo web

Parole chiave: carica file, GeoJSON, KML, KMZ, GPX, Shapefile, zip, CSV, latitudine longitudine, Google Sheets, indirizzo https, foglio condiviso.

Domande tipiche: Quali formati posso caricare? Come carico un foglio Google? Perché vedo solo parte del file?

Formati: **GeoJSON, KML/KMZ, GPX, Shapefile (.zip) e CSV con latitudine e longitudine**.
- **«Carica file dal computer»**: si sceglie il file. L'app lo legge e lo riconduce a GeoJSON in WGS84; se ci sono errori li mostra («Non carico «[file]»: [motivo]»). Uno Shapefile va in un file zip con anche il file .prj; GeoJSON e CSV devono essere in WGS84.
- **«Da indirizzo web (https)»**: si incolla un indirizzo https («Incolla un indirizzo https.») e si preme **Carica**. Il file viene scaricato tramite il proxy dell'app. Il file è una copia che non si aggiorna da sola; massimo 10 MB.
- **Foglio Google Sheets**: va condiviso prima: «In Condividi → Accesso generale scegli «Chiunque abbia il link» con ruolo Lettore. Il foglio diventa un CSV (solo il foglio indicato nel link) e deve avere colonne lat e lon. Massimo 10 MB.»

Di ogni file restano solo gli elementi **dentro il Comune di Palermo**. Un layer da file si salva nel browser (fino a 5 MB); oltre, vale solo finché la pagina è aperta e accanto al nome compare «solo questa sessione». I dati dei file restano nel browser: non vengono inviati a nessuno.

---

## Servizi: XYZ, WMS, WMTS, WFS e ArcGIS REST

Parole chiave: servizio, XYZ, WMS, WMTS, WFS, ArcGIS REST, MapServer, FeatureServer, capabilities, leggi il servizio, dati o immagini, token, utente, password.

Domande tipiche: Come aggiungo un servizio WMS? Cosa vuol dire «Mostra come»? Dove inserisco utente e password?

Il ramo **Servizi** ha un sotto-ramo per tipo: **XYZ, WMS, WMTS, WFS e ArcGIS REST**. Con il pulsante **«+»** («Aggiungi un servizio [tipo]») si apre un modulo:
- **Nome (facoltativo)** («Come lo chiami»).
- **Indirizzo del servizio**: per XYZ un indirizzo con `{z}/{x}/{y}`; per ArcGIS REST l'indirizzo di un MapServer o FeatureServer (con `?token=…` se serve); per gli altri l'indirizzo del servizio. Il proxy dell'app accetta solo indirizzi **https**.
- **Utente (se serve)** e **Password (se serve)**: la password «resta solo finché la pagina è aperta».
- Per ArcGIS, un campo **Token del servizio**.
- **Leggi il servizio** («Leggo il servizio…»): legge l'elenco dei layer e la scelta da fare: si spuntano i layer e si preme **«Aggiungi selezionati»** («Scegli almeno un elemento.» se non c'è niente). Se il servizio ha una cache a tile, come «Immagini» si aggiunge un solo layer con tutti i livelli.
- **Mostra come**: **«Dati (elementi che si possono interrogare)»** oppure **«Immagini (come una mappa)»**, quando il servizio permette entrambi.

Alcuni servizi non sono supportati: «(non supportato: serve EPSG:3857)» e, per il WMTS, «(non supportato: serve EPSG:3857, tile 256)». Gli errori compaiono come «Non riesco a leggere il servizio: [motivo]» o «Non riesco a caricare: [motivo]». Alla fine: «Aggiunto alla mappa.»

---

## Servizi salvati, lucchetto e limite

Parole chiave: servizi salvati, 50 servizi, lucchetto, password richiesta, cestino, ricordare il servizio, token, credenziali.

Domande tipiche: I servizi restano salvati? La password viene salvata? Quanti servizi posso salvare?

I servizi aggiunti restano **salvati nel browser** (solo indirizzo e scelte, mai dati) **fino a 50**; oltre il limite il servizio entra in mappa ma non si salva («Hai raggiunto il limite di [n] servizi salvati: questo non si salva.»). Un clic su un servizio salvato lo rimette in mappa com'era, senza rileggere le capabilities; il cestino lo toglie dall'elenco.

**Credenziali.** Utente e password sono tenuti **solo in memoria, per la sessione**: mai in localStorage, IndexedDB o nell'indirizzo. Del servizio si ricorda il nome utente, mai la password. Alla riapertura il servizio mostra un **lucchetto** e il suo layer non parte finché non si inserisce di nuovo la password («Serve la password di «[utente]»»); per un servizio con token compare «Serve il token». Ogni sito ha la sua intestazione di accesso e passa dal proxy.

---

## Elenchi pronti: ortofoto, basi Esri, carte storiche del Comune, beni culturali

Parole chiave: ortofoto, Regione Siciliana, Esri, carte storiche Sispi, SAS 1981, beni culturali, siti archeologici, parchi archeologici, pronto da accendere.

Domande tipiche: Ci sono servizi già pronti? Dove trovo le ortofoto?

Nel ramo Servizi ci sono gruppi di servizi già pronti: un clic li mette in mappa (i tile partono solo allora, e solo per l'area che si vede).
- **Regione Siciliana - Ortofoto**: immagini aeree messe **sotto i dati**, con i layer sopra. Tra le voci: Ortofoto 2022 (20 cm), 2019 (20 cm, AGEA), 2013 (15 cm per Enna, Messina, Palermo, Ragusa, Trapani; 25 cm), 2008 (25 cm).
- **Esri - Basi cartografiche**: basi stradale e topografica di Esri, messe sotto i dati (tra le voci Esri Standard e Esri Topo).
- **Comune di Palermo - Carte storiche**: carte storiche, rilievi e ortofoto del Comune (Sispi), per esempio SAS 1981 (centro storico, carta dei tetti), Ortofoto del centro storico 2000, Carta tecnica comunale 1989-91, SAS 1973 (piano quotato).
- **Regione Siciliana - Beni culturali**: servizi dei beni culturali (SITR) messi in mappa come **dati interrogabili** sull'area di Palermo, per esempio Beni isolati, Beni paesaggistici (D.Lgs. 42/04), Parchi archeologici (2016), Siti archeologici.

Sono anche già caricati, come esempio, alcuni servizi XYZ, i WMS del Comune di Palermo (Sispi) e gli ArcGIS REST del SITR della Regione Siciliana.
