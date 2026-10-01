# Trasporto pubblico AMAT (GTFS): design

Data: 2026-10-01. Fonte: `dati/gtfs/` (feed AMAT Palermo, valido 2026-08-25 → 2026-10-31).

## Obiettivo

Aggiungere al viewer un layer «Trasporto pubblico» con linee bus e tram, fermate cliccabili, orari completi per fermata e schede di fermata e di linea. Utente: chi esplora il gemello digitale di Palermo e vuole sapere cosa passa, dove e quando.

Fuori scope: tempo reale, calcolo percorsi, tariffe (`fare_*`).

## Dati (`scripts/gtfs.py` → `dati/trasporto/`)

Il feed ha 1.668 fermate, 71 linee (67 bus `route_type=3`, 4 tram `route_type=0`), 21.015 corse, 522.974 `stop_times`. Manca `calendar.txt`: i servizi sono definiti solo da `calendar_dates` (`exception_type=1` = attivo in quella data).

| File | Contenuto |
|---|---|
| `fermate.geojson` | Punti: `id`, `nome`, `linee[]`, `accessibile` (`wheelchair_boarding`). |
| `linee.geojson` | LineString per linea e direzione (shape più usato tra le corse): `route_id`, `numero`, `nome`, `colore`, `tipo` (`bus`/`tram`), `direzione`, capolinea. |
| `orari.json` | `{validita:{da,a}, servizi:{<idx>:[date]}, fermate:{<stop_id>:{<route_id>:[{d:<direzione>, s:<servizio>, t:[minuti dalla mezzanotte]}]}}}`. Orari oltre 24:00 mantenuti (minuti > 1440). |

Stima `orari.json`: 2–3 MB (≈1 MB gzip). Caricato una sola volta, alla prima apertura di una fermata o linea.

Vincoli: coordinate a 6 decimali; `Zone.Identifier` ignorati; `README` dati e crediti (`js/core/catalogo.js`) aggiornati con AMAT e la validità del feed. I file generati in `dati/trasporto/` non stanno in git (come `dati/scuole/`: `dati/*/` è ignorato) e non entrano nel `MANIFEST.tsv`; `fermate.geojson` porta il membro `validita` per l'avviso di feed scaduto senza scaricare `orari.json`.

## Viewer

- **Modulo `js/layers/trasporto.js`** registrato in `MODULI` (`js/app.js`), tre strati: «Linee bus», «Linee tram», «Fermate». Spenti di default, con le fermate visibili da zoom ≥ 14. Colore linea = `route_color` AMAT; tram con tratto più spesso.
- **Pannello di destra: le voci dei tre strati sono sempre visibili, anche con lo strato spento.** Checkbox e legenda (colori, bus/tram, simbolo fermata) restano nel pannello a prescindere dallo stato; nessuna legenda viene nascosta allo spegnimento. L'accensione mostra solo il layer in mappa.
- **Scheda del luogo (pannello di destra) anche a strato spento:** come per scuole e seggi, layer trasparenti sempre presenti (`trasporto-hit-fermate`, `trasporto-hit-linee`, da zoom ≥ 13) fanno comparire fermata e linea nella scheda a prescindere dall'interruttore dello strato. Vale insieme alla regola sulle voci del pannello a barra, qui sopra.
- **Scheda fermata** (`scheda-trasporto.js`, stesso schema di `scheda-scuole.js`): nome, linee con colore, accessibilità, selettore giorno (default oggi; se oggi è fuori da `validita`, il primo giorno valido, con avviso), prossime partenze da ora per linea e direzione, orari completi espandibili.
- **Scheda linea:** numero, nome, capolinea, tracciato evidenziato con `evidenza.js`, fermate in sequenza, primo/ultimo passaggio e frequenza media.
- **Ricerca** (`ricerca.js`): linee per numero o nome, fermate per nome.
- Se il feed è scaduto, il viewer mostra un avviso via `segnala()` e continua a mostrare layer e schede.
- I click gestiti da `evidenza.js`: nuove voci per `trasporto-hit-*`.

## Test

- `tests/test_gtfs.py`: 71 linee, 1.668 fermate, nessuna fermata orfana, ogni orario riferisce un servizio esistente, tempi > 24:00 gestiti.
- Test JS: modello scheda, selezione servizio per data, prossime partenze, fuori validità.
- `tests/test_viewer.py` (browser): le voci del pannello di destra esistono con layer spento; click su fermata e linea aprono la scheda; ricerca trova linea e fermata.
- Dopo la modifica: `graphify update .`.

## Rischi

- Dimensione di `orari.json`: se supera ≈4 MB, dividerlo per fascia di `stop_id`.
- Shape multiple per linea: si usa lo shape con più corse per direzione; varianti minori non mostrate.
