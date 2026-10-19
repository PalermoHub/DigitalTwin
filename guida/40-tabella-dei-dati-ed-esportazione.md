# Tabella dei dati ed esportazione

## Cos'è la tabella dei dati e come si apre

Parole chiave: tabella dei dati, tabella attributi, righe, colonne, cassetto, layer acceso, feature in vista, aprire la tabella.

Domande tipiche: Dove vedo i dati di un layer in forma di tabella? Perché la tabella è vuota? Che righe mostra?

Il pulsante **«Tabella dei dati»** della barra degli strumenti (da smartphone nel foglio «Strati») apre dal basso un cassetto con le righe dei layer accesi, in stile tabella attributi. Ogni layer acceso ha una sua scheda (una linguetta). La tabella legge **solo le feature caricate nella vista corrente**: spostando o avvicinando la mappa si aggiorna (dopo una breve pausa dal movimento). Per questo l'app avvisa «Solo le feature caricate in vista.»

Messaggi quando non c'è nulla da mostrare:
- «Nessun layer acceso: accendine uno per vederne le righe.»
- «Nessuna feature in vista. Accendi un layer della scheda e avvicina la mappa.»

**Altezza del cassetto**: si cambia trascinando la maniglia «Ridimensiona la tabella» (anche con la tastiera); l'altezza scelta resta salvata nel browser (all'inizio 280 px). Si chiude con «Chiudi la tabella».

---

## Quali layer si possono vedere in tabella

Parole chiave: layer in tabella, quali layer, elenco layer tabella, layer aggiunti, PAI.

Domande tipiche: Il mio layer ha una tabella? Quali layer ci sono?

La tabella conosce questi layer: Colonnine di ricarica, Distributori di carburante, Scuole e asili, Uffici comunali, Fermate del trasporto pubblico, Catasto: particelle, Incidenti stradali, Circoscrizioni, Quartieri, UPL, Distretti idrici AMAP, Sezioni di censimento, Monumenti, Alberi monumentali, Fontanelle pubbliche, Sezioni elettorali (sedi), Immobili comunali, Incidenti per km sulle strade, Le 20 strade più pericolose, Hotspot degli incidenti, Linee bus, Linee tram, Incendi, Numeri civici, Zone OMI 2025, PRG 2004 (zonizzazione, centro storico PPE, vincoli areali, vincoli lineari), Isole di calore, Immobili dichiarati al MEF, PEBA, PNRR, Opere pubbliche, Pendolarismo da e verso Palermo 2021 e Popolazione per sezione. Ci sono inoltre i **temi del PAI** (registrati all'avvio) e i **layer aggiunti da te** (file, WFS, ArcGIS, RNDT): per questi la fonte è «Layer aggiunto da te: fonte e licenza sono quelle del file o del servizio di origine».

Per ogni layer la tabella parte con le **colonne principali** (per esempio per il catasto foglio e particella); gli altri campi sono nel menu «Colonne».

---

## Filtrare, ordinare e scegliere le colonne

Parole chiave: filtra le righe, ordina, colonne, mostra la colonna, sposta colonna, esporta la colonna, intestazione.

Domande tipiche: Come cerco un testo nella tabella? Come ordino per una colonna? Come nascondo o riordino le colonne?

- **«Filtra le righe»**: cerca il testo in tutti i campi della riga.
- **Ordinare**: un clic sull'intestazione («Ordina per [colonna]»). I numeri sono ordinati come numeri, il testo in ordine alfabetico italiano; le celle vuote restano in fondo in entrambi i versi.
- **Menu «Colonne»**: per ogni colonna ci sono la casella «Mostra la colonna [nome]», la casella «Esporta la colonna [nome]» e le frecce ◀ ▶ per spostarla a sinistra o a destra. Nascondere una colonna la toglie anche dal file esportato; riattivarla la rimette; la casella «Esporta» da sola agisce solo sull'esportazione.
- Le scelte sulle colonne sono salvate nel browser **per ogni layer**.
- Quando spostando la vista compaiono campi nuovi, si aggiungono in coda.
- Le celle con elenchi (array) sono mostrate separate da punto e virgola.

**Limiti**: se le righe sono più di **20.000** la tabella chiede di restringere la vista o la selezione («Più di 20000 righe»). Nella pagina si mostrano al massimo **2.000** righe («Mostrate le prime 2000 righe: filtra o restringi per vedere le altre»).

---

## Scegliere le righe: strumenti di selezione

Parole chiave: selezione, clic, riquadro, poligono, area, circoscrizione, quartiere, UPL, torna alla vista, svuota la selezione, seleziona tutte le righe, inverti.

Domande tipiche: Come seleziono solo gli elementi dentro un'area? Come disegno un poligono? Come aggiungo alla selezione?

I quattro **strumenti di selezione** sono nella barra della tabella. Quando uno è attivo il cursore diventa un mirino; si disattiva premendo di nuovo il pulsante o con **Esc**.
- **Clic**: sceglie l'elemento sotto il clic (tolleranza di circa 6 pixel).
- **Riquadro**: si trascina un rettangolo (un trascinamento troppo breve viene ignorato). Durante il trascinamento la mappa non si sposta.
- **Poligono**: un clic per ogni vertice, un **doppio clic** chiude la figura. Servono almeno 3 vertici diversi, altrimenti dice «Servono almeno 3 vertici diversi.»
- **Area**: un clic dentro una circoscrizione, un quartiere o una UPL; il menu «Tipo di area» sceglie quale. Se sotto il clic non c'è nessuna area dice «Nessuna area sotto il clic: accendi i confini e riprova.»

Tenendo premuto **Ctrl (o Cmd)** durante il clic la nuova scelta si **aggiunge** a quella precedente. Con una selezione attiva la tabella mostra solo le righe che cadono nelle aree scelte; **«Torna alla vista»** riporta alle righe visibili in mappa. Su smartphone gli strumenti Riquadro e Poligono sono nascosti.

Le singole righe si spuntano con la casella di riga; con **Maiusc** si spunta un intervallo. Ci sono «Seleziona tutte le righe», **Inverti** e «Svuota la selezione». Un annuncio per gli screen reader dice quante righe sono selezionate.

---

## Esportare in CSV e GeoJSON

Parole chiave: esporta, CSV, GeoJSON, scaricare, righe × colonne, file esportato, fonte e licenza, geometria approssimata, conferma, nome del file.

Domande tipiche: Come scarico i dati? Cosa contiene il file? Perché il GeoJSON chiede conferma? Posso esportare tutti i layer?

I pulsanti **«CSV»** e **«GeoJSON»** mostrano quante righe e colonne usciranno (per esempio «33 × 15»). Escono le **righe selezionate**; se non ne è selezionata nessuna escono **tutte le righe della tabella**. Escono le colonne con la casella «Esporta» attiva. Il pulsante è spento se non ci sono righe o colonne.

**Tutti i layer elencati hanno l'esportazione attiva**, compresi quelli aggiunti da te. Se per un layer non fosse abilitata il pulsante dice «Per questo layer l'esportazione non è ancora abilitata.» (Per i layer di terzi valgono le condizioni di licenza della fonte, indicate nel file.)

- **CSV**: la prima riga ha i nomi originali dei campi (non le etichette tradotte, così restano gli stessi in tutte le lingue); separatore virgola; l'ultima colonna **«fonte»** riporta la fonte e la licenza del layer. Il file inizia con un marcatore che permette a Excel di leggere bene le lettere accentate.
- **GeoJSON**: una FeatureCollection con le proprietà delle colonne scelte e la geometria di ogni riga. Un blocco `metadata` riporta layer, fonte, se la geometria è approssimata e la data dell'esportazione.
- **Geometria semplificata**: per alcuni layer la geometria arriva già semplificata dai tile (catasto, incidenti, confini e sezioni, immobili comunali, sicurezza stradale, incendi, OMI, PRG e vincoli, isole di calore, popolazione per sezione, layer aggiunti da te). La tabella avvisa «Geometria semplificata dai tile: per dati precisi usa il CSV.» e, prima di esportare il GeoJSON, chiede «Questo layer ha geometria semplificata dai tile. Esportare lo stesso il GeoJSON?» Quando una feature è tagliata dai tile in più pezzi, la riga ha comunque una sola geometria unita.
- **Nome del file**: `[layer]-AAAA-MM-GG.csv` oppure `.geojson`.

Il pendolarismo usa il file intero (non solo ciò che è in vista) e le colonne dei link CUP di PNRR e opere puntano a OpenCUP.
