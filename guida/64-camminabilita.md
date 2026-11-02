# Camminabilità

## Il layer «Camminabilità»

Parole chiave: camminabilità, walkability, a piedi, città dei 15 minuti, pedonale, punteggio, Walkably, quartiere vivibile, servizi vicini, vivere senza auto, esagoni.

Domande tipiche: Quanto è camminabile il mio quartiere? Dove si vive meglio a piedi? Quanti minuti a piedi servono per arrivare a una farmacia o a una fermata? Cosa significa il punteggio di camminabilità? Perché ci sono zone senza colore?

Nel pannello Layer, nel gruppo **«Territorio»**, sezione **«Camminabilità»**, lo strato **«Camminabilità (da zoom 12)»** colora il comune di Palermo con **celle esagonali di circa 95 m**. A ogni cella è assegnato un **punteggio da 0 a 100**: più è alto, più cose utili si raggiungono bene **a piedi**.

La legenda, sotto lo strato, ha cinque classi (da molto bassa, 0–19, a molto alta, 80–100) e permette di accenderle o spegnerle una per una. Le celle compaiono dallo **zoom 12**. Dove non ci sono strade (mare, colline, campagna) non c'è nessuna cella.

## Come si calcola il punteggio

Parole chiave: punteggio, Reach, qualità della strada, otto bisogni, minuti a piedi, metodo, OpenStreetMap, stima.

Domande tipiche: Come è calcolato il punteggio? Quali servizi conta? Perché il mio quartiere ha un punteggio basso? Il dato è affidabile?

Il punteggio unisce due parti:

- **Reach (60%)**: i **minuti a piedi, sulle strade vere**, fino al luogo più vicino per **otto bisogni quotidiani**: alimentari, cibo e bevande, negozi, salute, scuola, parchi, cultura e trasporto pubblico. Contano anche il secondo e il terzo luogo vicino;
- **qualità della strada (40%)**: traffico, rumore (dove esiste una mappa del rumore), ombra estiva (una stima), strade trafficate vicine e pendenza.

I punteggi sono **stime** costruite su **OpenStreetMap**: un negozio o una farmacia mancante sulla mappa abbassa il punteggio, e una cella può risultare sbagliata. Il punteggio **non descrive sicurezza, criminalità o reddito**. L'autore pubblica anche i controlli di accuratezza falliti: il link «Come si calcola il punteggio (Walkably)» in scheda porta alla pagina.

## La scheda di una cella

Parole chiave: scheda camminabilità, minuti a piedi, luogo più vicino, percentile, area giochi.

Domande tipiche: Quanti minuti servono per arrivare al supermercato? Qual è la farmacia più vicina a piedi? Questa cella è meglio di quante altre?

Un clic sulla mappa, **anche con lo strato spento**, mostra nel tab **Luogo** la sezione **«Camminabilità»** della cella cliccata: **punteggio**, valutazione, **Reach**, **qualità della strada** e la quota di celle della stessa area che hanno un punteggio più basso. Sotto, **«A piedi dalla cella»** elenca per ognuno degli otto bisogni i **minuti a piedi** e il **tipo e nome del luogo più vicino**; se non c'è nulla entro **22 minuti** lo dice. C'è anche l'area giochi più vicina.

## Le strade

Parole chiave: strade, strada trafficata, strada tranquilla, strada mista, qualità della strada, rumore, ombra, pendenza, alberi, traffico, zoom 15.

Domande tipiche: Questa strada è tranquilla o trafficata? Come si capisce quali vie sono più piacevoli a piedi? Quanta ombra ha una strada d'estate? Cosa significano le linee scure e chiare?

Dallo **zoom 15** sopra le celle compaiono le **strade** come linee: **scura e spessa** la **strada trafficata** (qualità sotto 45), **grigia** la **mista** (45–74), **chiara e sottile** la **tranquilla** (75 e oltre). La legenda ha tre voci per accendere o spegnere ogni classe. Un clic **vicino a una strada**, anche con lo strato spento, aggiunge nel tab **Luogo** la sezione della strada: nome, tipo, **qualità**, **rumore** (dove esiste una mappa del rumore), **ombra estiva** (stima), vicinanza a strade trafficate, **pendenza** e alberi ogni 100 m.

## Il grafico «Punteggio per bisogno»

Parole chiave: punteggio per bisogno, barre, otto bisogni, entro 5 minuti, entro 10 minuti, luoghi raggiungibili, Reach, qualità della strada, parco, area giochi, icona i.

Domande tipiche: Quanti negozi o farmacie ho entro 5 minuti a piedi? Quale bisogno abbassa il punteggio della mia zona? Cosa significa il «+» accanto al numero? Come si legge il grafico?

In cima alla sezione, tre riquadri mostrano **punteggio**, **Reach** e **qualità della strada** della cella. Sotto, il grafico **«Punteggio per bisogno»** ha una barra per ognuno degli otto bisogni, da 0 a 100, e, sotto ogni barra, i **luoghi raggiungibili entro 5 e entro 10 minuti** a piedi. Un **«+»** vuol dire che il conteggio è al tetto e i luoghi sono di più. L'icona **«i»** accanto al titolo spiega come funziona. Se la cella è su una rete stradale staccata da quella principale, o dentro un parco, la scheda lo scrive in una nota.

## Luoghi nostri e luoghi di Walkably

Parole chiave: nostri dati, luoghi mancanti, confronto con Walkably, alimentari, bar, negozi, farmacie, scuole, parchi, cultura, fermate, residuo, 80 metri al minuto.

Domande tipiche: Perché Walkably conta più luoghi di quelli che vedo in mappa? Quali luoghi mancano nei nostri dati? Come si fa il confronto?

Sotto la barra di **ognuno degli otto bisogni** la scheda mostra anche **i nostri luoghi**: quanti ne abbiamo entro 5 e entro 10 minuti a piedi, e i **tre più vicini** con la distanza in metri. Per scuola, cultura e trasporto pubblico sono i nostri layer (Scuole, Monumenti e luoghi, Trasporto). Per **alimentari, cibo e bevande, negozi, salute, parchi e giardini** sono i luoghi di **OpenStreetMap** del layer **«Luoghi quotidiani»**, che usa le **stesse categorie di Walkably**.

Se Walkably ne conta di più, la scheda scrive **quanti in più**: sono luoghi che non abbiamo. Se il **conteggio di Walkably è al tetto** (succede spesso in centro), la scheda scrive **«almeno N in più»**: è un minimo. Se il **luogo più vicino secondo Walkably** non ha un nostro punto con lo stesso nome, la scheda lo segnala con il nome e i minuti a piedi; quando Walkably non conosce il nome («an unnamed park») il confronto per nome non si fa.

Il confronto è **approssimato**. Walkably misura i minuti sulle strade vere, noi la distanza in linea d'aria a **80 metri al minuto** (5 minuti sono 400 m, 10 minuti 800 m). Walkably è costruito sullo stato di OpenStreetMap del 29 ottobre 2026 e la nostra estrazione è di novembre: qualche punto percentuale di scarto è normale. Il nome in OpenStreetMap può differire dal nostro, e allora un luogo già presente può risultare mancante. Walkably conta una selezione più stretta di scuole e fermate di quella dei nostri layer, quindi lì noi possiamo averne di più.

## Il layer «Luoghi quotidiani»

Parole chiave: luoghi quotidiani, OpenStreetMap, alimentari, supermercati, bar, caffè, ristoranti, negozi, farmacie, medici, ospedali, parchi, giardini, aree giochi, forme e colori.

Domande tipiche: Dove sono le farmacie vicino a me? Come accendo bar e ristoranti? Da dove vengono questi luoghi? Perché manca un negozio?

Nel pannello **Layer**, nella sezione **Camminabilità**, ci sono cinque strati che si accendono uno per uno, ognuno con la **sua forma e il suo colore**: **alimentari** (carrello, verde oliva), **cibo e bevande** (tazza, arancione), **negozi** (borsa, viola), **salute** (croce, rosso), **parchi e giardini** (albero, verde). Sono i luoghi di **OpenStreetMap** nel comune di Palermo, scelti con le categorie del README di Walkably: i supermercati e le panetterie sono alimentari, i bar e i ristoranti cibo e bevande, banche e uffici postali contano come negozi, i veterinari non contano come salute e le riserve naturali non contano come parchi. Un clic su un luogo, **anche a strato spento**, apre la scheda con nome e tipo; i luoghi nel raggio del clic compaiono anche nella scheda del punto.

La mappa può essere incompleta: un luogo che manca in OpenStreetMap manca anche qui. I dati sono un'estrazione di novembre 2026 con licenza **ODbL 1.0**, © contributori di OpenStreetMap, e si rinnovano a mano con `scripts/luoghi_osm.py`.

## Edifici colorati

Parole chiave: camminabilità, edifici, colore, 3D, esagoni, zoom 15.

Domande tipiche: Perché gli esagoni spariscono avvicinandosi? Come si colorano gli edifici? Funziona anche in 3D?

Da zoom 15, a strato acceso, gli **edifici prendono il colore della cella** in cui cadono (la cella che contiene il centro dell'edificio) e la griglia esagonale non si vede più. Lo stesso colore vale per i volumi in **3D**. Gli edifici fuori dalla griglia restano senza colore. Le caselle della legenda accendono e spengono le classi anche sugli edifici.

## Fonte e licenza

Parole chiave: Walkably, fonte, licenza, ODbL, OpenStreetMap, Raian Pollock, credito, dati aperti.

Domande tipiche: Da dove vengono i dati di camminabilità? Con quale licenza posso riusarli? Chi ha costruito il punteggio?

I dati sono di **Walkably** (Raian Pollock), release 2026.10-m3 del 29 ottobre 2026, su dati **© OpenStreetMap contributors**, con licenza **ODbL 1.0**. Il ritaglio di Palermo è ricavato dal file ufficiale. Il credito compare nella mappa e nella pagina **«Fonti e note»**.
