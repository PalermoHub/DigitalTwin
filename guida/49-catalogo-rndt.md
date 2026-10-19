# Catalogo RNDT

## Cos'è il catalogo RNDT e come si apre

Parole chiave: RNDT, catalogo, Repertorio Nazionale dei Dati Territoriali, plugin openrndt-geolibre, Andrea Borruso, onData, cercare dati, aggiungere dati dal catalogo.

Domande tipiche: Cos'è il catalogo RNDT? Come lo apro? Chi ha scritto il plugin?

Il pulsante **«Catalogo RNDT: aggiungi dati alla mappa»** (icona dei due layer) nella barra degli strumenti in alto a destra apre il catalogo del **Repertorio Nazionale dei Dati Territoriali**: l'elenco dei dati geografici pubblicati dagli enti di tutta Italia. Il titolo del pannello è **«Catalogo RNDT · Palermo»**. Il pannello si affianca alla scheda del luogo nella barra di destra (su smartphone si sovrappone al foglio basso) e il tab **RNDT** passa dal catalogo alla scheda. Mentre si carica dice «Caricamento del catalogo…». Si chiude con «Chiudi il catalogo RNDT» o con **Esc**: il primo Esc chiude il catalogo, il secondo la scheda.

Il catalogo si basa interamente sul plugin **openrndt-geolibre**, ideato e scritto da **Andrea Borruso (onData)**, licenza MIT; nel pannello compare «Plugin openrndt-geolibre di …». Il progetto l'ha solo adattato (il plugin è caricato solo al primo uso e ne esiste una traduzione italiana). La pagina «Plugin RNDT» del menu spiega l'uso e riporta il merito.

---

## Cercare e aggiungere dati

Parole chiave: cercare nel catalogo, tema, ente, WMS, WFS, limite Palermo, scaricare, elementi fuori dal Comune.

Domande tipiche: Come cerco un dato? Perché vedo solo Palermo? Cosa succede ai dati fuori dal Comune?

Si cerca per **testo, tema o ente**, sempre entro l'**area di Palermo**: «Il download è sempre limitato all'area di Palermo». I controlli di ricerca del plugin sono limitati dall'app a quell'area. Un servizio **WMS** si aggiunge come livello di immagini; un servizio **WFS** come elementi geografici che si possono interrogare.

I dati scaricati vengono filtrati sul Comune di Palermo: l'app tiene le feature intere che toccano il Comune (senza tagliarle), e avvisa quando ne scarta: ««[nome]»: [n] elementi su [tot] sono fuori dal Comune di Palermo e non vengono mostrati.» Per i file con righe senza coordinate dice «[n] righe senza coordinate valide sono state saltate».

Gli accessi al servizio esterno passano da un **Worker proxy** dell'app: in produzione l'indirizzo è fisso (un link con un proxy diverso non può portare i dati degli utenti su un proxy altrui).

---

## Il gruppo «RNDT» nella barra degli strati

Parole chiave: gruppo RNDT, layer aggiunti dal catalogo, rimuovi, accendi, solo questa sessione, salvataggio.

Domande tipiche: Dove trovo i layer che ho aggiunto dal catalogo? Come li tolgo? Restano alla riapertura?

I layer aggiunti compaiono nel gruppo **«RNDT»** (tab RNDT della barra di sinistra) e tra gli **Argomenti**. Il gruppo spiega: «Dati aggiunti dal catalogo RNDT, anche richiamati dal salvataggio. Si aggiungono dal pulsante del catalogo nella barra strumenti.» e, se è vuoto: «Nessun layer RNDT: cercalo nel catalogo.» C'è il pulsante **«＋ Dal catalogo RNDT»**. Ogni layer ha: l'**occhio** per accenderlo e spegnerlo, il cursore dell'**opacità**, il cestino **«Rimuovi il layer [nome]»**, e le frecce per l'ordine (vedi `45-barra-strati-legende-e-ordine.md`). I layer sono in **ordine alfabetico**; compare un pallino con il contatore dei layer accesi.

I layer si **salvano da soli** nel browser e tornano alla riapertura, accesi o spenti come erano. Un layer di cui si conosce l'indirizzo si salva con l'indirizzo; i dati senza indirizzo noto si salvano nel browser fino a **5 MB per layer**: oltre, o se il browser blocca l'archivio, valgono per la sessione e un avviso lo dice. Accanto al nome, **«(solo questa sessione)»** avverte che quel layer non si è potuto salvare (per esempio perché «è troppo grande per essere salvato»); **«(errori di caricamento)»** e **«(non disponibile)»** segnalano problemi.

---

## Interrogare i layer RNDT: scheda, fumetti e legende

Parole chiave: Altri dati (RNDT), GetFeatureInfo, attributi, interrogare un WMS, tooltip remoto, legenda del servizio, GetLegendGraphic.

Domande tipiche: Come vedo le informazioni di un layer RNDT? Perché il WMS non mi mostra attributi? Dove trovo la legenda?

- **Scheda**: un clic sulla mappa interroga i layer RNDT (e quelli di «I miei layer») accesi. Le risposte sono nel tab **«Altri dati (RNDT)»**, con un riquadro per ogni layer e la fonte indicata («Fonte: [host] (catalogo RNDT)»). Per i **WFS** la scheda mostra gli attributi dell'elemento cliccato (bisogna cliccare proprio sull'elemento); per i **WMS** l'app chiede al servizio le informazioni sul punto (`GetFeatureInfo`, su una finestra di ±50 pixel attorno al clic) e riporta la risposta; per gli **ArcGIS** fa una query sul punto. Se il livello è solo grafico lo dice. I dati dei servizi esterni hanno valore informativo.
- **Fumetti**: i layer **vettoriali** aggiunti mostrano, passando il mouse, il nome, la prima proprietà con il colore del layer e un paio di righe. Per i servizi **WMS e ArcGIS a immagine** la richiesta al server parte solo quando il mouse si ferma (altrimenti ogni movimento sarebbe una richiesta). Le estensioni dei dati del catalogo compaiono nel tooltip unico della mappa, dalla più piccola alla più grande.
- **Legende**: un blocco per ogni layer acceso. Per i WMS è l'immagine `GetLegendGraphic` del servizio; per gli ArcGIS MapServer le classi con il loro simbolo; per i dati vettoriali un quadratino del colore con cui sono disegnati. XYZ e WMTS non hanno legenda. Se il servizio non risponde dice «Legenda non disponibile» e non riprova a ogni clic.
