# Aggiornare i dati del Piano triennale

Il Programma si approva una volta l'anno: i dati si rigenerano a mano, non c'è un workflow.

1. Aggiornare nel progetto `piano_triennale_26_28` le tabelle e le geometrie (vedi il suo `README.md`) e copiare in `sorgenti/` i file nuovi:
   `data/interventi.json`, `dati_lavoro/interventi_oopp_2026_2028_v2.gpkg`, `dati_lavoro/csv_definitivi/5_allegato_I_quadro_risorse.csv` (come `quadro_risorse.csv`)
   e `0_tutto_unificato.csv` (come `../piano_triennale_2026_2028.csv`).
2. `python3 scripts/piano_triennale.py` (serve `ogr2ogr`). Lo script non scrive nulla se i conteggi sono fuori soglia o il totale non torna.
3. Aggiornare i numeri nei testi se cambiano (548 interventi, 454 localizzati, 4,37 miliardi): `js/layers/piano-triennale.js`, `js/locales/*.json`, `guida/56-*.md`.
4. `npm run test:js`, poi `git add -f dati/piano-triennale` e bump di `VERSIONE` in `sw.js`.
