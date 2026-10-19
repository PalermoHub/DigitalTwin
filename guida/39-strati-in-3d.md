# Strati in 3D e vista 3D della mappa

## Cos'è «Strati in 3D»

Parole chiave: strati in 3D, pila, layer separati, esplodi, vista 3D degli strati, in sviluppo, beta, strati sovrapposti.

Domande tipiche: Cosa fa il pulsante «Strati in 3D»? Posso vedere i layer separati uno sopra l'altro? Perché è «In sviluppo»?

«Strati in 3D» prende i layer **accesi** della mappa, li "fotografa" uno per uno nell'inquadratura corrente e li separa in una **pila** di piani sovrapposti, che si gira con il mouse o con il dito. Le immagini vengono dalla mappa stessa: stili, filtri e colori sono quelli dell'app. La funzione porta l'etichetta **«In sviluppo»**: «Funzione in fase di sviluppo: può cambiare e avere qualche imperfezione».

Il pulsante «Strati in 3D» è nella barra degli strumenti (da smartphone nel foglio «Strati»). È spento finché non c'è almeno un layer acceso; in quel caso il suggerimento dice «Accendi almeno un layer per vederlo in 3D». Mentre prepara la pila compare «Preparo gli strati in 3D… [n] di [tot]». Se qualcosa non va dice «La vista 3D degli strati non si è aperta: riprova».

---

## Quali strati finiscono nella pila

Parole chiave: piani, numero massimo di strati, troppi layer accesi, terreno 3D, mappa di base, altri layer.

Domande tipiche: Perché non vedo tutti i miei layer? Quanti strati posso mettere? Cosa sono «Mappa di base» e «Altri layer»?

- Un piano per ogni **strato acceso**, nell'ordine di disegno della mappa (il primo sta sotto).
- La **mappa di base** sta sempre sotto a tutto.
- **«Altri layer»**: i layer visibili che non appartengono a un modulo dell'app, come quelli del catalogo RNDT, di «I miei layer» o le mappe aggiunte.
- Il **rilievo 3D** e l'**elevazione** diventano un solo piano **«Terreno 3D»** in fondo alla pila, perché l'elevazione colorata va appoggiata sul rilievo.
- Un piano senza nulla da mostrare (strato fuori inquadratura, layer di servizio) non entra nella pila.

**Limite**: al massimo **14 piani da computer e 8 da smartphone**. Se i layer accesi sono di più, restano la base, il terreno e quelli più in alto nell'ordine di disegno, e l'app avvisa: «Troppi layer accesi: in 3D si vedono i [n] più in alto».

---

## La schermata «Strati in 3D»: elenco e comandi

Parole chiave: elenco della pila, occhio, spegni nella pila, esplodi, gira, dall'alto, in 3D, torna alla mappa, scheda del punto.

Domande tipiche: Come spengo uno strato nella pila? Cosa fanno Esplodi, Gira e Dall'alto? Come torno alla mappa?

Quando si apre la schermata, la pila nasce sopra la mappa alla stessa scala (sembra che sia la mappa a sollevarsi). In alto ci sono il titolo «Strati in 3D», l'etichetta «In sviluppo» e il pulsante **«Torna alla mappa»**. Si esce anche con **Esc**.

**Elenco degli strati della pila**: una fila di chip numerati, in cima l'ultimo strato come nella pila. Ogni chip ha:
- un **occhio** per spegnere o riaccendere lo strato **solo nella pila** («Spegni [nome] nella pila» / «Riaccendi [nome] nella pila»); finché la schermata è aperta lo strato spento è nascosto anche sulla mappa sotto, quindi non dà né fumetto né scheda; alla chiusura torna com'era;
- il **nome**: un clic lo mette in evidenza.

**Comandi** sotto l'elenco:
- **Esplodi**: cursore che regola la distanza tra i piani (da 0 a 1,6; parte da 1).
- **Gira**: accende o spegne la rotazione automatica. Parte accesa, salvo che il sistema chieda di ridurre le animazioni; si ferma quando si usa la pila e riprende dopo circa due secondi e mezzo senza gesti.
- **Dall'alto** / **In 3D**: porta la pila vista dall'alto (piatta) e poi di nuovo inclinata; il pulsante cambia nome di conseguenza.
- **Entra tra gli strati** / **Esci dalla pila**: vedi sotto.

In basso compare il suggerimento: «Trascina per girare, rotella per lo zoom, tasto destro per spostare. Oppure usa bussola e joystick in basso a sinistra, o i tasti W A S D. Premi ? per la guida.» La **guida «Come muoversi»** si apre da sola solo la prima volta; poi si richiama con il pulsante «Come muoversi (?)» o con il tasto ?. Si chiude con «Ho capito» o Esc.

---

## Scheda e fumetti dentro la pila

Parole chiave: clic su un punto, scheda dentro la pila, tooltip, bordo di uno strato, spillo, tutto quello che c'è sotto un punto.

Domande tipiche: Posso aprire la scheda di un punto dalla pila? Cosa si vede passando il mouse? Come scelgo uno strato?

- Un **clic su un punto** di uno strato apre la scheda di quel punto, sopra la scena, restando nel 3D. Gli strati vengono interrogati in ordine: quello toccato, poi quelli sotto, poi quelli sopra. La scheda si apre sul tab dello strato toccato.
- Un **clic sul bordo di uno strato** lo sceglie («[nome]: clic per sceglierlo, di nuovo per entrarci (da dentro: per andarci)»).
- Sul punto cliccato compare uno **spillo** che attraversa la pila, con un pallino su ogni strato.
- Passando il mouse compare un **fumetto** come sulla mappa 2D, con gli stessi modelli di tooltip dell'app: per ogni strato che ha qualcosa in quel punto il titolo e gli attributi. Mostra al massimo 3 voci per strato e poi «+ altri [n]». Lo strato sotto il mouse è in cima ed evidenziato. Per le particelle catastali scrive «Foglio [n], particella [n]».

---

## Entrare tra gli strati e camminare

Parole chiave: entra tra gli strati, varco, camminare, sul piano, guarda su, guarda giù, scendi di uno strato, sali di uno strato, PagSu PagGiù.

Domande tipiche: Cosa vuol dire «Entra tra gli strati»? Come passo da uno strato all'altro? Come cammino sul piano?

Con **«Entra tra gli strati»** l'occhio va in un **varco** tra due piani e si può guardare in giù, in su e attorno. L'etichetta dice dove si è: «Tra [strato sotto] e [strato sopra]».

Comandi da dentro:
- **Scendi di uno strato** / **Sali di uno strato** (anche PagGiù e PagSu).
- **Guarda giù** / **Guarda su**.
- **Cammina**: «Cammina sul piano sotto di te, con lo sguardo in avanti». Si sta sul piano («Sul piano [n]») e con i comandi **Scendi sul piano sotto** / **Sali sul piano sopra** si cambia piano.
- Il tasto Esc o **«Esci dalla pila»** riportano fuori.

I suggerimenti dell'app: «Sei tra due strati: trascina di lato per girare il modello, in su o in giù per guardare sopra o sotto. Joystick o W/S per muoverti, rotella per lo zoom, PagSu e PagGiù per cambiare varco.» e, camminando: «Cammini sul piano: tieni premuti W/S (o il joystick) per andare avanti e indietro, A/D per girarti, Q/E di lato. Trascina per guardarti attorno, rotella per lo zoom.»

---

## Comandi: mouse, tastiera, tocco

Parole chiave: comandi 3D, W A S D, rotella, tasto destro, bussola, joystick, zoom, inclina, tocco, due dita.

Domande tipiche: Con quali tasti mi muovo? Come sposto la pila? Come uso il 3D col telefono?

**Mouse**
- Trascinare: gira il modello; camminando ci si guarda attorno.
- Tasto destro, o Maiusc + trascinamento: sposta.
- Rotella: zoom; da dentro, indietro fino a uscire.
- Clic su un punto: la sua scheda; sul bordo di uno strato: lo sceglie.

**Tastiera**
- W S o ↑ ↓: avanti e indietro, finché sono premuti.
- A D o ← →: girano; Q E: di lato.
- R F o Maiusc + ↑ ↓: inclinano; + e −: zoom.
- PagSu / PagGiù: strato sopra o sotto; ? guida; Esc esce.

**Tocco e navigatore**
- Un dito gira; due dita zoom e spostamento.
- **Bussola** (in basso a sinistra): si trascina l'anello per girare, un clic riporta a nord.
- **Joystick**: si trascina la manopola per muoversi, più lontano dal centro più veloce.
- Pulsanti **+ / −** (avvicina e allontana) e inclinazione su/giù: si tengono premuti. «Rimetti al centro» ripristina la vista. «Come muoversi (?)» apre la guida.

---

## La vista 3D della mappa (pulsante «Vista 3D»)

Parole chiave: vista 3D, inclinare la mappa, navigatore 3D, bussola, joystick, W A S D, Q E, R F, tasto destro.

Domande tipiche: Come inclino la mappa? Cosa cambia con la vista 3D? Come mi muovo?

Il pulsante **«Vista 3D»** della barra degli strumenti inclina la mappa vera (non la pila). Solo in questa vista compare in basso a sinistra il **navigatore** con bussola, joystick, zoom e inclinazione, gli stessi della pila. L'inclinazione arriva fino a 65°.

Comandi della guida «Come muoversi nella vista 3D»:
- **Mouse**: trascinare sposta la mappa; tasto destro + trascinamento gira e inclina; rotella zoom; clic su un elemento apre la sua scheda.
- **Tastiera**: W A S D spostano la mappa, finché premuti; Q E girano a sinistra e a destra; R F inclinano; + e − zoom; ? apre la guida, Esc la chiude.
- **Tocco**: un dito sposta; due dita zoom, rotazione e inclinazione; bussola e joystick come sopra.

In vista 3D lo strato **«Edifici 3D»** estrude gli edifici e il **rilievo 3D** mostra il terreno (vedi `03-edifici-e-popolazione.md` e `02-territorio-e-urbanistica.md`).

---

## Gli strati in 3D nella pagina di presentazione

Parole chiave: presentazione 3D, tutti gli strati in 3D, quindici strati, modello dimostrativo.

Domande tipiche: C'è una demo degli strati in 3D? Dove la trovo?

La pagina **Presentazione** del menu ha una sezione «Tutti gli strati, in 3D»: «I quindici strati della mappa, separati uno sopra l'altro: girali con il mouse o con il dito, tocca uno strato nell'elenco per metterlo in evidenza. Nell'app lo fai con i tuoi layer accesi, dal pulsante «Strati in 3D».» Ha i comandi Esplodi, Gira, Dall'alto / In 3D, Avvicina e Allontana. Trascinando si gira, la rotella con Ctrl fa lo zoom, le frecce da tastiera ruotano e inclinano. Serve JavaScript.
