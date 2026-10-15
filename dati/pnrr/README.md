# Progetti PNRR localizzati a Palermo

Generato da `scripts/pnrr.py` (workflow «Aggiorna PNRR»). Non modificare a mano.

- **Fonte**: Italia Domani — Struttura di missione PNRR, Sogei (catalogo open data), <https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html>
- **Licenza**: CC BY 4.0, con citazione della fonte
- **Data di estrazione dei dati**: 13/06/2026
- **Progetti** localizzati solo a Palermo: 2633 (finanziamento PNRR complessivo 921.364.867 €)
- **Sulla mappa**: 1277 (di cui 882 con l'indirizzo scritto nella descrizione del progetto; civico 1077, solo la via 167, sede dell'istituto scolastico 33, di cui 1 con le coordinate del layer Scuole dell'app); gli altri sono in `pnrr_palermo.csv`
- **Sede degli istituti scolastici**: Indice delle Pubbliche Amministrazioni (IPA, AgID), <https://indicepa.gov.it/ipa-dati/dataset/amministrazioni>, CC BY 4.0; indirizzi posizionati con i numeri civici ANNCSU
- Progetti localizzati anche in altri comuni: esclusi

## File

| File | Contenuto |
|---|---|
| `pnrr.geojson` | un punto per progetto con posizione; `precisione` è «civico», «via» o «sede» (le ultime due approssimate) |
| `pnrr_palermo.csv` | tutti i progetti, con o senza posizione |
| `sintesi.json` | aggregati su tutti i progetti, per i grafici della scheda |
| `riepilogo.json` | conteggi dell'ultima esecuzione |

Regole di selezione, fonti e limiti: intestazione di `scripts/pnrr.py`. Per aggiornare: workflow «Aggiorna PNRR» (avvio manuale).
