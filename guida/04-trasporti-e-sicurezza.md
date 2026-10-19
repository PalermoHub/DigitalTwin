# Trasporti e sicurezza stradale

## Trasporto pubblico: bus, tram, metro e ferrovia

Parole chiave: bus, tram, metro, ferrovia, AMAT, RFI, Trenitalia, fermate, linee, GTFS, passante ferroviario, anello ferroviario.

Domande tipiche: Quali linee passano da qui? Dove sono le fermate? Che strati ci sono per i trasporti?

Il gruppo «Trasporti» ha cinque strati: **Linee bus**, **Linee tram** e **Fermate** (sezione AMAT) e **Linea metro** e **Stazioni metro** (sezione RFI). I dati sono i feed GTFS di AMAT (circa 71 linee: 67 bus e 4 tram; oltre 1.600 fermate) e di Trenitalia per la ferrovia urbana (Passante ferroviario, Anello ferroviario e altri servizi). Due stazioni (Politeama e Porto) sono segnate «in apertura».

Per aprire una linea si accendono gli strati e si clicca sul tracciato o su una fermata. Nel riquadro «Linee» si sceglie la linea e, nel suo blocco, si apre «Fermate»: compaiono in sequenza come uno schema a striscia, con la linea nel suo colore, un pallino per fermata e i capolinea più grandi. I riquadri colorati accanto a ogni fermata sono le altre linee che vi passano (cambi). Un clic sul riquadro porta la mappa sulla fermata e mostra il percorso di quella linea; un clic sul nome apre la scheda della fermata con le prossime partenze. Un capolinea di sola arrivo lo dice: da lì non partono corse e gli orari sono alla fermata di partenza.

Cliccando sulla mappa la scheda mostra anche le fermate vicine, entro il raggio regolabile dalla legenda «Selezione in mappa».

---

## Orari e aggiornamento dei feed

Parole chiave: orari, prossime partenze, feed scaduto, aggiornamento, validità, GTFS.

Domande tipiche: Gli orari sono aggiornati? Perché la mappa dice che il feed è scaduto?

Gli orari si aggiornano da soli. Ogni giorno il sito controlla il portale open data del Comune e, quando AMAT pubblica un nuovo feed, fermate, linee e orari vengono sostituiti. Lo stesso vale per la ferrovia urbana con il feed GTFS di Trenitalia (convertito da NeTEx da Clément Desouche, CC BY 4.0). Se il feed in uso è scaduto, la mappa lo segnala. Gli orari sono quelli dei feed GTFS. Al momento della stesura (ottobre 2026) il feed AMAT è valido dal 25/08/2026 al 31/10/2026 e quello della ferrovia urbana dal 26/09/2026 al 12/12/2026; le date cambiano a ogni aggiornamento.

---

## Sicurezza stradale: incidenti 2015-2023

Parole chiave: incidenti, sicurezza stradale, strade pericolose, hotspot, sinistri, mortali, Polizia Municipale, incidenti per km.

Domande tipiche: Quali sono le strade più pericolose? Dove avvengono più incidenti? Come filtro per anno?

Il gruppo «Sicurezza» ha quattro strati:
- **Incidenti per km sulle strade**: tasso di incidenti per tratto stradale.
- **Le 20 strade più pericolose**: le vie con più gravità pesata per km (vie di almeno 3 km e 30 incidenti).
- **Hotspot degli incidenti**: celle da 250 m con concentrazione statisticamente significativa (Getis-Ord Gi*).
- **Incidenti** (da zoom 14): i singoli eventi, circa 23.500, dal 2015 al 2023 (il 2019 non è nel dataset). Il filtro per anno e gravità sta nel tab «Filtri».

La scheda del luogo riporta il rischio di incidenti del punto («Sicurezza»), la zona a incidenti concentrati e, per le vie più pericolose, rango, gravità, mortali e chilometri. Fonte degli incidenti: Comune di Palermo (Polizia Municipale); elaborazione PalermoHub / OpenDataSicilia. Il dato è un'analisi statistica, non una valutazione tecnica di pericolosità di una strada.
