# Glossario italiano → inglese per la guida di Talia

Strumento di lavoro per tradurre i file di `guida/` in `guida/en/`. Non è indicizzato (lo script `scripts/guida_indice.py` lo esclude).

Le colonne «Italiano» e «English» sono i valori esatti di `js/locales/it.json` e `js/locales/en.json` per la chiave indicata (tabella generata dai file, non scritta a mente). Nella guida inglese i nomi dei controlli restano tra `«...»` come nel file italiano, ma con il testo della colonna «English».

Regole d'uso:

- Se un controllo non è in questa tabella, cercare il suo testo italiano in `it.json` con `grep -F` e leggere il valore inglese con la stessa chiave in `en.json`. Non tradurre a mente.
- Le chiavi `lbl.*` contengono frasi intere (testi dell'app): usarle come riferimento di tono, ma la guida dice solo ciò che dice l'italiano.
- L'ortografia dei nomi dell'interfaccia è quella di `en.json` (es. «Colours», «Catalogue», inglese britannico). Nel testo corrente della guida usare la stessa ortografia, per coerenza con l'app.
- `en.json` non è uniforme: «Scheda» è «Profile» nei tab e nella scheda del luogo (`app.rail.scheda`, `scheda.titoloGenerico`), ma «card» nelle azioni di Talia (`chatbot.apriScheda`, `chatbot.sunto.apri`). Quando si cita il tab usare «Profile»; quando si cita il pulsante di Talia usare il testo del pulsante.
- Nomi propri, sigle e fonti dati non si traducono: Talia, Geoimage, Street View, RNDT, PNRR, ANNCSU, Open Data Sicilia, AMAT, GTFS.
- Segnaposto come `{nome}`, `{n}`, `{titolo}` sono variabili dell'app: non fanno parte del nome del controllo.

## Termini ricorrenti

| Italiano | English | Chiave in `en.json` |
|---|---|---|
| Layer | Layers | `gruppo.layer` |
| Strati | Layers | `html.strati.titolo` |
| Edificio | Building | `evidenza.edificio` |
| Particella catastale | Cadastral parcel | `evidenza.particella` |
| Sezione di censimento | Census section | `evidenza.sezioneCensimento` |
| Particella | Parcel | `html.filtri.particella` |
| Scheda | Profile | `app.rail.scheda` |
| Scheda del luogo | Place profile | `html.scheda.aria` |
| Scheda del luogo | Place profile | `scheda.titoloGenerico` |
| Apri la scheda: {nome} | Open the card: {nome} | `chatbot.apriScheda` |
| Apri scheda | Open card | `chatbot.sunto.apri` |
| Fonte: {fonte} | Source: {fonte} | `layer.fonte` |
| Immagine storica | Historical image | `gi.sez.immagine` |

## Tab, barre e pulsanti principali

| Italiano | English | Chiave in `en.json` |
|---|---|---|
| Mappa | Map | `tab.mappa` |
| Strati | Layers | `tab.strati` |
| Aggiungi | Add | `tab.aggiungi` |
| Tabella | Table | `tab.tabella` |
| Strati 3D | 3D layers | `tab.strati3d` |
| Talia | Talia | `app.rail.chatbot` |
| Tema | Theme | `app.rail.tema` |
| Geoimage | Geoimage | `app.rail.geoimage` |
| Condividi questa vista | Share this view | `html.btn.condividi` |
| Stampa la mappa visualizzata | Print the current map | `html.btn.stampa` |
| Stampa | Print | `html.stampa.vai` |
| Catalogo RNDT: aggiungi dati alla mappa | RNDT catalogue: add data to the map | `html.btn.rndt` |
| Tabella dei dati | Data table | `html.btn.tabella` |
| Filtri | Filters | `html.cerca.filtri.et` |
| Cerca luogo, particella o guida… | Search place, parcel or guide… | `html.cerca.placeholder` |
| Guida generale | General guide | `html.menu.guida` |
| Fonti e note | Sources and notes | `html.menu.fonti` |
| Privacy | Privacy | `html.menu.privacy` |
| Guida Geoimage | Geoimage guide | `html.menu.geoimage` |
| Tema scuro | Dark theme | `html.tema` |
| Tema chiaro | Light theme | `strumenti.temaChiaro` |
| Tema dell'interfaccia | Interface theme | `html.temaUi.aria` |
| Street View | Street View | `strumenti.streetviewTitolo` |
| Apri in Street View | Open in Street View | `strumenti.streetviewApri` |
| Cerca strato | Search layer | `pannello.cerca` |
| Opacità | Opacity | `pannello.opacita` |
| Legenda | Legend | `legenda.pannello.titolo` |
| Ordine layer in mappa | Layer order on the map | `riordino.titolo` |
| Mappa di base | Base map | `strati3d.base` |
| Percorsi guidati | Guided paths | `home.percorsi.titolo` |
| I miei layer | My layers | `gruppo.miei` |
| Aggiungi | Add | `aggiungi.aggiungi` |
| Aggiungi selezionati | Add selected | `aggiungi.aggiungiSelezionati` |
| Servizi | Services | `aggiungi.servizi` |
| Esporta JSON | Export JSON | `tema.esporta` |
| Fonti e attribuzioni | Sources and attributions | `stampa.fonti` |

## Chiusura e azioni generiche

| Italiano | English | Chiave in `en.json` |
|---|---|---|
| Chiudi | Close | `comune.chiudi` |
| Chiudi la scheda | Close the profile | `scheda.chiudi` |
| Chiudi la tabella | Close the table | `tabella.chiudi` |
| Chiudi l'avviso | Close the notice | `avviso.chiudi` |
| Annulla | Undo | `gi.annulla` |
| Rimuovi | Remove | `rndt.rimuovi` |
| Rimuovi immagine | Remove image | `gi.rimuovi` |
| Filtra le righe | Filter the rows | `tabella.filtro` |
| Salva foto | Save photo | `peba.visore.salva` |
| Scarica l’elenco completo (CSV) | Download the full list (CSV) | `pnrr.scarica` |

## Talia, il chat bot

| Italiano | English | Chiave in `en.json` |
|---|---|---|
| Talia | Talia | `chatbot.titolo` |
| Invia | Send | `chatbot.invia` |
| Leggi tutto | Read more | `chatbot.leggiTutto` |
| Mostra meno | Show less | `chatbot.mostraMeno` |
| Pulisci la chat | Clear the chat | `chatbot.pulisci` |
| Riprova | Try again | `chatbot.riprova` |
| Prova a chiedere: | Try asking: | `chatbot.suggerite` |
| Scrivi una domanda… | Write a question… | `chatbot.segnaposto` |
| Forse cercavi una di queste: | Maybe you meant one of these: | `chatbot.vicine` |
| Percorsi guidati: | Guided paths: | `chatbot.percorsi` |

## Gruppi e argomenti

| Italiano | English | Chiave in `en.json` |
|---|---|---|
| Territorio | Territory | `gruppo.territorio` |
| Trasporti | Transport | `gruppo.trasporto` |
| Popolazione | Population | `gruppo.popolazione` |
| Edifici | Buildings | `gruppo.edifici` |
| Incendi | Fires | `gruppo.incendi` |
| Monumenti | Monuments | `gruppo.monumenti` |
| Scuole | Schools | `gruppo.scuole` |
| Servizi su strada | Roadside services | `scheda.tab.servizi` |
| Linee bus | Bus lines | `tabella.layer.bus` |
| Linee tram | Tram lines | `tabella.layer.tram` |
| Fermate del trasporto pubblico | Public transport stops | `tabella.layer.fermate` |
| Pendolarismo da e verso Palermo 2021 | Commuting to and from Palermo 2021 | `tabella.layer.pendolarismo` |
| Pendolarismo | Commuting | `home.slide.pendolarismo.titolo` |
| Progetti | Projects | `pnrr.progetti` |
| Catalogo degli strati | Layer catalogue | `home.catalogo.titolo` |
| Home | Home | `home.menu.home` |

## Geoimage e catalogo RNDT

| Italiano | English | Chiave in `en.json` |
|---|---|---|
| Geoimage · mappe storiche | Geoimage · historical maps | `gi.titolo` |
| Raggio | Radius | `gi.raggio` |
| Aggiungi GCP (G) | Add GCP (G) | `gi.gcp.aggiungi` |
| Esporta GeoTIFF | Export GeoTIFF | `gi.gtiff.esporta` |
| Catalogo RNDT · Palermo | RNDT catalogue · Palermo | `rndt.titolo` |
| Chiudi il catalogo RNDT | Close the RNDT catalogue | `rndt.chiudi` |
