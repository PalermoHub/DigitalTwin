# Opere pubbliche nella città di Palermo

Generato da `scripts/opere.py`. Non modificare a mano.

- **Fonte**: Open BDAP, Ragioneria generale dello Stato: Progetti Opere Pubbliche MOP - Sicilia, <https://bdap-opendata.rgs.mef.gov.it/>; localizzazione: dataset «Localizzazione Geografica Opere Pubbliche MOP»
- **Licenza**: CC BY - Libero riuso citando la fonte
- **Dati osservati al**: 30/09/2026
- **Opere** localizzate solo a Palermo, di qualunque titolare: 1352 (di cui 337 del Comune; costo dei lavori previsto 2.121.262.261 €); stato: ATTIVO 1052, CHIUSO 300
- **Sulla mappa**: 705 (civico 370, solo la via 335); le altre hanno un indirizzo non trovato nei civici (422) o generico/assente (225) e sono in `opere_palermo.csv`
- Confronto per il Comune: <https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#opere> (stessi dati BDAP-MOP; conta 347 progetti, qui 337 CUP perché 10 CUP hanno due codici locali)

## File

| File | Contenuto |
|---|---|
| `opere.geojson` | un punto per opera con posizione; `precisione` è «civico» o «via» (la seconda approssimata) |
| `opere_palermo.csv` | tutte le opere, con o senza posizione |
| `elenco.json` | le opere senza punto sulla mappa, per titolare, per il menu a tendina della scheda |
| `sintesi.json` | aggregati su tutte le opere, per i grafici della scheda |
| `riepilogo.json` | conteggi dell'ultima esecuzione |

`stato` è quello del CUP (ATTIVO o CHIUSO); `fase` è ricavata dalle date effettive dichiarate. Gli importi sono quelli dichiarati dai titolari e i
finanziamenti hanno valori anomali: non vanno sommati. Regole e limiti: intestazione di `scripts/opere.py`. Aggiornamento: `AGGIORNAMENTO.md`.
