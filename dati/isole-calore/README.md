# Isole di calore · temperatura superficiale estiva per sezione censuaria

Studio completo (mappe per anno 2019–2025, bivariata, «isola vera» depurata dal territorio):
<https://palermohub.opendatasicilia.it/isole_di_calore.html> — qui è presa solo la mappa 2025 con i metodi di classificazione e i grafici dell'andamento.

Fonte: Landsat 8/9 (USGS), temperatura superficiale terrestre (LST) estiva, media per sezione censuaria ISTAT 2021. **Non è la temperatura dell'aria.**
Generato da `scripts/isole_calore.py` a partire da `lavoro/isole-calore/` (copia dei file di lavoro dello studio).

| File | Contenuto |
|---|---|
| `sezioni.pmtiles` | Strato `sezioni`, zoom 10–14: una feature per sezione (3600) con `sez`, `circoscrizione`, `Quartiere`, `UPL_nome`, `LST_2019` … `LST_2025` (°C; assente se senza dato) |
| `isole-calore.json` | `anno` e `anni`; `serie` comunale (media, mediana, quartili, n. sezioni) per anno; `soglie` 2025 per metodo (`jenks`, `quantile`, `equal`) e numero di classi (3–9); `link` allo studio |

**Soglie.** `[minimo, limite 1, …, limite k-1, massimo]`: un valore sta nella classe i se `limite i <= valore < limite i+1` (come `step` di MapLibre).
Quantili e intervalli uguali sono quelli dell'app dello studio; Jenks è il k-means ottimo in una dimensione (come `ckmeans` di simple-statistics), ma il limite è il primo valore della classe successiva, così nessuna sezione cade nella classe sbagliata.
Precalcolate qui: il browser non ricalcola nulla.

**Aggiornare un anno.** Aggiungere la colonna `LST_AAAA` al GeoJSON di `lavoro/isole-calore/`, aggiornare `ANNI` in `scripts/isole_calore.py` e rilanciarlo (serve `tippecanoe`).
