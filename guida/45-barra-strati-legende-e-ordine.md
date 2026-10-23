# Barra degli strati, legende e ordine dei layer

## La barra degli strati e i suoi tab

Parole chiave: barra degli strati, tab Layer, Base cartografica, RNDT, I miei layer, Filtri, gruppi di layer, sezioni, accendere uno strato, occhio.

Domande tipiche: Come accendo un layer? Dove trovo i gruppi? Cosa sono i numeri sul tab Layer?

La barra verticale a sinistra ha cinque tab: **Base cartografica**, **Layer**, **RNDT**, **I miei layer** e **Filtri**. Solo questi hanno un tab proprio; tutti gli altri gruppi di strati (Confini, Edifici, Eventi, Monumenti, Piano PAI, Popolazione, Rilievo, Servizi su strada, Sicurezza, Territorio, Trasporti) sono **sezioni del tab Layer**. Le sezioni sono in **ordine alfabetico** (senza distinguere maiuscole e accenti), anche quelle che arrivano dopo; ognuna si apre e si chiude con un clic sul titolo e la scelta viene ricordata nel browser. Dentro una sezione i titoli di sottogruppo (per esempio «Colonnine di ricarica» in «Servizi su strada») sono pieghevoli a loro volta; chiuso un titolo, gli strati sotto di lui sono nascosti, e una sezione chiusa nasconde anche i suoi sottogruppi.

Ogni strato ha un **interruttore a occhio** (la casella c'è, ma si vede l'icona) per accenderlo o spegnerlo. Il tab Layer segna se ci sono strati accesi e quanti. Un clic sul tab attivo ripiega il pannello; il pannello resta aperto finché non si preme di nuovo il tab o Esc.

Se uno strato non riesce a caricarsi compare per qualche secondo un avviso «Strato non caricato: [nome]» (o «[n] strati non caricati: dati non raggiungibili»), che si chiude con la X.

---

## I pulsanti accanto a uno strato

Parole chiave: spostare su e giù, zoom su, tavolozza, colori, opacità, cursore, centrare lo strato.

Domande tipiche: Come inquadro i dati di un layer? Come rendo un layer trasparente?

Accanto a ogni strato (quando serve) ci sono:
- **Sposta su / Sposta giù** per cambiare l'ordine di disegno.
- **«Zoom su [nome]»**: inquadra la mappa sull'area dei dati dello strato (l'estensione delle sue sorgenti, ristretta all'area di lavoro).
- **Tavolozza** («Colori di [nome]»): vedi `38-tema-dell-interfaccia.md`.
- **Opacità**: un cursore «Opacità di [nome]» che **moltiplica l'opacità originale** di tutti i layer dello strato (riempimenti, linee, punti, immagini, icone e testi). Riportandolo al massimo si ripristinano i valori originali. L'opacità scelta entra nel link di «Condividi».

---

## Cerca strato e overlay informativi

Parole chiave: cerca strato, filtrare l'elenco, tooltip sulla mappa, legende sulla mappa, overlay informativi.

Domande tipiche: Come trovo un layer in mezzo a tanti? Come spengo i fumetti? Dove sono finite le legende?

Il campo **«Cerca strato…»** filtra l'elenco; mentre la ricerca è in corso niente resta nascosto nei sottogruppi chiusi, così lo strato trovato si vede.

Sotto c'è il menu **«Overlay informativi»** con due interruttori:
- **«Tooltip sulla mappa»**: il fumetto con i dati principali al passaggio del mouse.
- **«Legende sulla mappa»**: se acceso, tutte le legende restano sulla mappa; se spento, ogni legenda passa **sotto il proprio strato** nel pannello Layer, come nei programmi GIS.

---

## Le legende

Parole chiave: legenda, filtro dalla legenda, riduci, voce di legenda, solo questa, secondo clic, tutte le voci.

Domande tipiche: Come filtro dalla legenda? Come nascondo le legende? Cosa succede se clicco una voce?

Le legende sono nel box in basso a sinistra; il pulsante **«▾ Riduci»** lo ripiega e lo riapre. Una legenda compare solo quando il suo strato è acceso. Molte voci di legenda sono anche **filtri**, con una casella accanto al simbolo (tutte accese all'inizio):
- Un clic su una voce lascia in mappa **solo quella**; se era già l'unica accesa, un secondo clic riaccende tutte. Il clic non spegne una voce da sola: per vederne due o più si sceglie prima «solo questa» e poi si accendono le altre.
- Nelle legende con tante voci (come le zone OMI) il filtro è a **selezione multipla**: con tutto acceso il clic su una voce (o su una fascia) lascia accese solo quelle; poi ogni clic le aggiunge o le toglie; se non resta nulla si torna a tutto acceso.
- Alcune voci coincidono con un intero strato: la casella accende e spegne lo strato.

Le legende del **tema per attributo**, della **selezione in mappa** e dei **servizi esterni** restano sempre sulla mappa. Quelle dei servizi esterni dicono «Caricamento legenda…» o «Legenda non disponibile» o «Colore del layer» (per i vettoriali) / «File caricato».

---

## Chip degli strati accesi e contatore

Parole chiave: chip, strati attivi, spegni dal chip, contatore strati, pallino sul tab.

Domande tipiche: Come vedo quali strati sono accesi? Come ne spengo uno rapidamente?

In alto sulla mappa compaiono i **chip** degli strati accesi (al massimo 4, poi «+[n]»): un clic su un chip spegne lo strato («Spegni: [nome]»). Su smartphone il numero degli strati accesi compare sul pulsante «Strati» e un pallino sul tab.

---

## Ordine dei layer in mappa

Parole chiave: ordine layer in mappa, sopra, sotto, trascinare, ripristina ordine, comprimi tutto, espandi tutto.

Domande tipiche: Come porto un layer sopra un altro? Posso riordinare strati di gruppi diversi?

In cima al tab Layer la scheda **«Ordine layer in mappa»** elenca tutti gli strati accesi, di qualsiasi gruppo: «In alto = sopra sulla mappa. Vale per tutti gli strati accesi, anche di gruppi diversi.» Servono almeno due strati («Accendi almeno due strati per cambiare l'ordine»). Ogni riga ha **«Sposta su [nome]»**, **«Sposta giù [nome]»** e la maniglia **«Trascina per spostare»**. «Ripristina ordine» riporta l'ordine di partenza. L'ordine scelto è salvato nel browser. Vale anche per i layer di RNDT e «I miei layer». Dentro ogni gruppo gli strati si riordinano anche con frecce e trascinamento; i titoli di sezione fissi (come AMAT e RFI nel trasporto) non si muovono e gli strati si riordinano solo dentro la propria sezione. Ci sono anche **«Comprimi tutto»** / **«Espandi tutto»** per i dati ripiegabili sotto ogni strato.

---

## Zoom: badge e cursore

Parole chiave: zoom, cursore dello zoom, livello di zoom, da zoom 12.

Domande tipiche: Come cambio lo zoom? Perché uno strato compare solo da un certo zoom?

C'è un box dello zoom con un **numero** (il livello attuale) e un **cursore** da 12 a 18 a passi di 0,1. Molti strati hanno un livello minimo e lo dicono nel nome, per esempio «Catasto: particelle (da zoom 12)», «Numeri civici (da zoom 14)», «Incidenti (da zoom 14)»: sotto quel livello non si vedono.

---

## Pannelli di destra e uso da smartphone

Parole chiave: barra di destra, rail, scheda, RNDT, Geoimage, Tema, tab in basso, foglio, Mappa Strati Aggiungi Menu.

Domande tipiche: Come si alternano i pannelli di destra? Come funziona la barra su telefono?

**Barra di destra.** Ha un tab per pannello: **Scheda**, **RNDT**, **Geoimage**, **Tema**. Si apre un solo pannello alla volta; cliccando il tab attivo il pannello si ripiega e resta solo la barra. Quando non c'è una scheda aperta il tab Scheda dice «Scheda: tocca la mappa per aprirla».

**Smartphone** (fino a 720 px). Una barra a quattro tab in basso: **Mappa** (chiude tutto), **Strati** (basi, layer, filtri), **Aggiungi** (I miei layer, catalogo RNDT, Geoimage) e **Menu** (guide e pagine sul progetto). Si apre un solo foglio alla volta. Il menu a comparsa si chiude toccando la mappa o con Esc. Se la finestra si allarga oltre i 720 px il foglio si chiude e torna l'interfaccia a barre laterali.
