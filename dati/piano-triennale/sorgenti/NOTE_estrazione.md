# Estrazione tabelle PDF – Programma triennale OO.PP. 2026-2028 (DCC 553/2026)

## Metodo
- Tabelle estratte dai 5 PDF con `pdfplumber`, una CSV per tabella e pagina in `csv/<nome_pdf>/`.
- Confronto con gli `.xlsx` in `xlsx/`:
  - **Elenco Interventi**: identico (568 righe, codici, descrizioni e tavole coincidono; le righe includono 20 intestazioni ripetute).
  - **Fonti di Finanziamento**: coincide dopo normalizzazione del formato (xlsx numerico, CSV testo `1.234,00 €`). Nel CSV da PDF mancavano 4 importi (interventi 41, 51, 53, 55) per celle unite; recuperati dall'xlsx.
- Versione pulita in `csv_definitivi/` (separatore `;`, UTF-8 con BOM).

## File definitivi
| File | Righe | Contenuto |
|---|---|---|
| `1_elenco_interventi.csv` | 548 | codice, descrizione, tavola |
| `2_fonti_finanziamento.csv` | 91 | fonti e importi numerici (da xlsx) |
| `3_allegato_I_scheda_D_programma_triennale.csv` | 548 | CUI, CUP, RUP, localizzazione, costi per annualità |
| `4_allegato_I_elenco_annuale.csv` | 91 | elenco annuale 2026 |
| `5_allegato_I_quadro_risorse.csv` | 8 | risorse per tipologia e anno |
| `6_relazione_totali.csv` | 7 | totali per anno (euro e numero interventi) |
| `7_dcc_presenze_consiglio.csv` | 40 | presenti/assenti in consiglio |

Totali coerenti tra i file: 548 interventi (91 nel 2026, 294 nel 2027, 163 nel 2028), 4.373.410.918,53 €.

## Correzioni e avvertenze
- File 5, «capitali privati», secondo anno: nel PDF la cella è sovrapposta (`112233,,774400,,331144..7777`). Ricostruita come `123,740,314.77`, valore per cui la riga torna al totale 450.666.044,93.
- Formati numerici: file 2 con punto decimale; file 3, 4, 5 come nel PDF (virgola come separatore delle migliaia); file 6 in formato italiano con `€`.
- Esclusi: testo della delibera ruotato/illeggibile (`DCC_553_2026__28col`) e tabelle di 1-2 righe.

## CUI duplicati (scheda D)
Due CUI compaiono su due interventi ciascuno. Il dato è già così nel PDF (verificato con `pdftotext`), non è un errore di estrazione.

| CUI | Cod. Int. Amm. | Intervento | Importo |
|---|---|---|---|
| `80016350821199700006` | `01-01_033` | Via di Fuga, via Nicoletti – Sferracavallo (CUP `D71B00000180001`) | 8.000.000 € |
| `80016350821199700006` | `05-09_019` | Centro di quartiere PEEP N9, Passo di Rigano (senza CUP) | 5.797.227 € |
| `80016350821201600010` | `01-01_188` | Ponte via Rapisardi – via Daidone/Giordano sopra la ferrovia | 5.950.000 € |
| `80016350821201600010` | `02-05_020` | Mitigazione rischio crollo massi, monte Cuccitello – Baida | 850.000 € |

- Interventi, CUP, RUP e settori sono diversi: sembra un errore di compilazione del Comune, non un'unica opera.
- `Cod_Int_Amm` è unico su tutte le 548 righe: usare quello come chiave di join, non il CUI.
- `01-01_033` compare anche in elenco annuale e fonti; `01-01_188` e `02-05_020` non compaiono in nessuno dei due.
- Dati lasciati invariati; da segnalare al Comune.

## Stato
Ordine di lavoro precedente (vettorializzazione tavole, georeferenziazione) documentato in `risultati/STATO_COPERTURA.md`.

## Tabella unificata
`0_tutto_unificato.csv`: 548 righe × 41 colonne, chiave `Cod_Int_Amm`. Elenco (1) + scheda D (3) + colonne `Fonti_*` (2, 91 interventi) + `In_elenco_annuale` e colonne `Annuale_*` (4, join su CUI+CUP, 91 interventi). Vuote le colonne per gli interventi non presenti in fonti/elenco annuale. Esclusi quadro risorse, totali e presenze (non per intervento).
- Corretta in `2_fonti_finanziamento.csv` la riga 91 (`05-12_053`), che aveva CUI, codice, descrizione e RUP fusi in una sola cella.

## Colonna `CUP_stato` (file 0 e 3)
`Presente` se il CUP c'è; altrimenti `CUP assente: sotto soglia 150.000 €, non obbligatorio` (importo complessivo < 150.000 €) o `CUP assente: non ancora richiesto, opera solo programmata` (≥ 150.000 €). Classificazione dedotta dall'importo, non dichiarata nel PDF.

## Flag `CUP_2026_mancante` (file 0 e 3)
`Si` per i 28 interventi con affidamento previsto nel 2026 (`Annualita_avvio_affidamento`), CUP assente e importo ≥ 150.000 €: il CUP dovrebbe già esistere. Altrimenti `No`.

## Colonna `OpenCUP_link` (file 0 e 3)
Link alla scheda OpenCUP (`https://www.opencup.gov.it/portale/progetto/-/cup/<CUP>`) per i 130 interventi con CUP; vuoto per gli altri. Costruito dal CUP, non verificato su OpenCUP (schema URL ricavato dal portale).

## Colonne `CUP_candidato_*` (file 0 e 3)
Per gli interventi senza CUP: ricerca nel dataset open data OpenCUP (area Isole, dati al 01.10.2026; progetti del Comune di Palermo titolare) di un CUP coerente per descrizione e importo. **Il CUP ufficiale (`CUP`) resta vuoto: i candidati sono proposte da verificare.**
- `alta`: importo identico (±1 €) e ≥50% delle parole della descrizione in comune. `media`: importo identico con somiglianza minore, oppure descrizione molto simile ma importo diverso (spesso un solo stralcio/progettazione dell'opera).
- Prova di calibrazione sui 116 interventi con CUP noto: importo identico + ≥50% parole → 67 giusti su 69 (97%); importo diverso + ≥60% parole → 24 su 28 (86%).
- `CUP_candidato_duplicato=Si`: lo stesso CUP è proposto per più interventi (probabile accordo quadro o stralci).
- Nessun candidato per gli interventi senza corrispondenza sufficiente: per molti il CUP probabilmente non è ancora stato richiesto.
