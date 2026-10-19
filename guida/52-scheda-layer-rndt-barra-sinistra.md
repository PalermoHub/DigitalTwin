# Scheda: gestire i layer RNDT nel pannello di sinistra

## Dove sono i layer del catalogo RNDT

Parole chiave: layer RNDT, tab RNDT, barra di sinistra, pannello di sinistra, gruppo RNDT, layer aggiunti dal catalogo, Argomenti, Dal catalogo RNDT.

Domande tipiche: Dove trovo i layer che ho aggiunto dal catalogo RNDT? Come gestisco i layer RNDT nel pannello di sinistra? Cosa c'è nel tab RNDT della barra di sinistra?

I layer aggiunti dal **Catalogo RNDT** si gestiscono nel tab **RNDT** della barra verticale di sinistra (gli altri tab sono «Base cartografica», «Layer», «I miei layer» e «Filtri»). Il gruppo si intitola **RNDT** e dice: «Dati aggiunti dal catalogo RNDT, anche richiamati dal salvataggio. Si aggiungono dal pulsante del catalogo nella barra strumenti.» Gli stessi layer compaiono anche tra gli **Argomenti**. Se non ne hai aggiunti, il gruppo dice «Nessun layer RNDT: cercalo nel catalogo.» In cima al gruppo c'è il pulsante **«＋ Dal catalogo RNDT»**, che apre il catalogo nella barra di destra (stesso effetto del pulsante «Catalogo RNDT: aggiungi dati alla mappa» nella barra degli strumenti).

---

## I comandi di ogni layer RNDT

Parole chiave: accendere, spegnere, occhio, casella, opacità, cursore, rimuovere, cestino, frecce, ordine, trascinare, alfabetico.

Domande tipiche: Come accendo o spengo un layer RNDT? Come cambio la trasparenza di un layer RNDT? Come rimuovo un layer RNDT? Come cambio l'ordine dei layer RNDT?

Ogni layer del gruppo è una riga con:
- la **casella con l'occhio** per accendere e spegnere il layer sulla mappa (è la stessa casella che pilota la tab Argomenti);
- il cursore **«Opacità»** (da 0 a 1, a passi di 0,05) sotto la riga, per renderlo più o meno trasparente; il valore scelto resta anche se il gruppo si ridisegna;
- il cestino **«Rimuovi il layer [nome]»**, che toglie il layer dalla mappa e dall'elenco;
- le **frecce** e il **trascinamento** per cambiare l'ordine di sovrapposizione, come negli altri gruppi (l'ordine è salvato nel browser). In più, la scheda **«Ordine layer in mappa»** nel tab Layer elenca tutti gli strati accesi, anche quelli di RNDT e di «I miei layer» (vedi `45-barra-strati-legende-e-ordine.md`).

I layer del gruppo sono sempre elencati in **ordine alfabetico** per nome; le frecce e il trascinamento riguardano l'ordine sulla mappa, non l'elenco.

---

## Note accanto al nome e salvataggio

Parole chiave: solo questa sessione, errori di caricamento, non disponibile, salvataggio, riapertura, 5 MB, layer persi.

Domande tipiche: Cosa vuol dire «solo questa sessione»? Perché un layer RNDT è «non disponibile»? I layer RNDT restano alla riapertura?

Accanto al nome può comparire una nota tra parentesi:
- **«(solo questa sessione)»**: il layer non si è potuto salvare nel browser e resta finché la pagina è aperta;
- **«(errori di caricamento)»**: il servizio ha dato errori durante il caricamento;
- **«(non disponibile)»**: il layer non è disponibile; la casella è disattivata.

I layer si salvano da soli nel browser e tornano alla riapertura, accesi o spenti come erano. Un layer di cui si conosce l'indirizzo si salva con l'indirizzo; i dati senza indirizzo noto si salvano nel browser fino a 5 MB per layer. Il pulsante «Ripristina» dei filtri chiede conferma e dice che «I layer RNDT aggiunti restano».

---

## Il contatore sull'icona del gruppo

Parole chiave: pallino, contatore, layer accesi, icona RNDT, chip.

Domande tipiche: Cosa indica il pallino sul tab RNDT? Come vedo quanti layer RNDT sono accesi?

L'icona del gruppo RNDT mostra un pallino con il **numero dei layer accesi** del gruppo; il pallino segue gli accendi e spegni e resta corretto anche quando togli layer. I layer RNDT accesi compaiono anche tra i chip degli strati accesi in alto sulla mappa.

---

## Interrogare e leggere i layer RNDT accesi

Parole chiave: Altri dati (RNDT), scheda, legenda, fumetto, attributi.

Domande tipiche: Come vedo gli attributi di un layer RNDT? Dove trovo la legenda di un layer RNDT?

Con il layer acceso, un clic sulla mappa mostra le sue informazioni nel tab **«Altri dati (RNDT)»** della scheda di destra; la legenda e i fumetti seguono il layer. Dettagli in `49-catalogo-rndt.md`.
