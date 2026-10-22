# Piano triennale dei lavori pubblici 2026-2028 (Comune di Palermo)

Generato da `scripts/piano_triennale.py`. Non modificare a mano.

- **Fonte**: Comune di Palermo, Programma triennale dei lavori pubblici 2026-2028 (schede e allegati, Delibera di Consiglio comunale n. 553/2026). Tabelle estratte dai PDF e geometrie ricavate dalle tavole da OpenDataSicilia con Claude AI (progetto `piano_triennale_26_28`, <https://opendatasicilia.github.io/piano_triennale_26_28/>)
- **Natura dei dati**: informativa, senza valore legale; per la documentazione ufficiale fanno fede gli atti del Comune. Licenza dei dati: da chiarire (atti pubblici del Comune)
- **Interventi**: 548 per 4.373.410.918,53 € nel triennio (91 nel 2026, 294 nel 2027, 163 nel 2028)
- **Sulla mappa**: 454 interventi con almeno una geometria (457 punti, 26 linee, 79 poligoni = 562 geometrie assegnate); gli altri 94 (2,04 miliardi di euro, tra cui la metropolitana) sono solo nella scheda, tab Piano triennale, e nel CSV
- Le geometrie senza codice intervento (441: 42 punti, 330 linee, 69 poligoni) non sono assegnabili e si scartano, come nella mappa originale

## File

| File | Contenuto |
|---|---|
| `interventi.geojson` | punti, linee e poligoni assegnati a un intervento (WGS84); `cod` può avere più codici separati da «;» |
| `elenco.json` | tutti gli interventi con scheda D, fonti di finanziamento, elenco annuale, CUP candidati |
| `sintesi.json` | aggregati per i grafici della tab (anno, settore, tipologia, circoscrizione, risorse) |
| `piano_triennale_2026_2028.csv` | tabella unificata (548 righe × 41 colonne, chiave `Cod_Int_Amm`), scaricabile dalla tab |
| `riepilogo.json` | conteggi dell'ultima esecuzione |
| `sorgenti/` | file di partenza: `interventi.json`, `interventi_oopp_2026_2028_v2.gpkg`, `quadro_risorse.csv`, note di estrazione e copertura |

## Avvertenze

- Gli importi sono quelli delle schede: «triennio» è la somma dei tre anni (totale ufficiale), «complessivo» comprende le annualità successive.
- Due CUI compaiono su due interventi ciascuno già nel PDF del Comune (`01-01_033`/`05-09_019`, `01-01_188`/`02-05_020`): dati lasciati invariati, la chiave è il codice intervento.
- I CUP «candidati» (ricerca nel dataset OpenCUP per descrizione e importo) sono proposte da verificare: il CUP ufficiale non è stato modificato.
- Il quadro delle risorse del 2027 per i capitali privati è ricostruito (la cella del PDF è sovrapposta): vedi `sorgenti/NOTE_estrazione.md`.

Aggiornamento: `AGGIORNAMENTO.md`.
