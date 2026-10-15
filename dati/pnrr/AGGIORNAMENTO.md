# Come aggiornare i dati dei progetti PNRR

I file di questa cartella (`pnrr.geojson`, `pnrr_palermo.csv`, `sintesi.json`, `soggetti.json`, `riepilogo.json`, `README.md`) sono **generati** da
`scripts/pnrr.py` a partire dai dati aperti di Italia Domani. **Non si aggiornano da soli**: vanno rigenerati a mano, da un computer, quando
Italia Domani pubblica una nuova estrazione.

> Perché a mano: il sito di Italia Domani risponde «HTTP 403» ai server di GitHub, quindi un workflow automatico non può scaricare i file
> (provato il 15/10/2026). Dal proprio computer lo scarico funziona.

## Quando aggiornare

I file di Italia Domani portano la data dell'estrazione (colonna `Data di Estrazione`). I dati attuali sono quelli del **13/06/2026**
(`estrazione` in `riepilogo.json`). Aggiorna quando:
- sai che Italia Domani ha pubblicato dati nuovi (la pagina del catalogo dice «aggiornati periodicamente»), oppure
- vuoi controllare: lancia lo script (passo 2) e guarda se `estrazione` è cambiata. Se è uguale i file non cambiano e non c'è nulla da pubblicare.

## Procedura

Servono Python 3 (solo libreria standard), una connessione internet e circa 400 MB liberi per i file scaricati.

**1. Parti da `main` aggiornato**
```bash
git switch main
git pull
```

**2. Rigenera i dati**
```bash
python3 scripts/pnrr.py --riscarica
```
Scarica i file di localizzazione e dei progetti (M1–M7, circa 330 MB) e l'elenco IPA (8,6 MB), li elabora e riscrive i file in `dati/pnrr/`.
Dura circa un minuto. I file scaricati restano in `.cache/pnrr/` (non finiscono in git); senza `--riscarica` lo script riusa quelli già presenti.
Alla fine stampa il riepilogo.

**3. Controlla i numeri**
```bash
git diff dati/pnrr/riepilogo.json
```
- `estrazione` deve essere la data nuova.
- `cup` (progetti di Palermo, oggi 2633), `su_mappa` (oggi 1284) e `importo_pnrr_eur` possono cambiare di poco; **una variazione grande**
  (più del 10–20%) è sospetta: guarda i punti «Se qualcosa non torna».
- `file_progetti_mancanti` deve essere vuoto (`[]`).
- Se compare «ATTENZIONE: elenco IPA non scaricato», i progetti delle scuole e del Comune senza indirizzo restano senza punto sulla mappa
  (`su_mappa` scende di circa 40): vedi più sotto.

**4. Prova i test**
```bash
npm run test:js
python3 -m pytest tests/test_pnrr.py
```
(Facoltativo, più lento: `python3 -m pytest tests/test_pnrr_browser.py`, apre l'app in un browser.)

**5. Guarda l'app**
```bash
python3 scripts/serve.py        # poi apri http://localhost:8000
```
Accendi il layer «Progetti PNRR» (gruppo Territorio), clicca su un marker e apri la tab «PNRR» della scheda: l'avviso in cima deve riportare i
numeri nuovi e il menu a tendina deve elencare i progetti del Comune e dell'Università.

**6. Pubblica**
```bash
git add -f dati/pnrr/pnrr.geojson dati/pnrr/pnrr_palermo.csv dati/pnrr/sintesi.json dati/pnrr/soggetti.json dati/pnrr/riepilogo.json dati/pnrr/README.md
git commit -m "dati: aggiornamento progetti PNRR (estrazione del gg/mm/aaaa)"
git fetch origin
git rebase origin/main      # altri workflow committano i loro dati su main
git push origin main
```
`git add -f` serve perché la cartella `dati/` è ignorata da git, tranne l'eccezione per questa. Il sito si aggiorna con il push su `main`.
Non serve cambiare la versione del service worker (`sw.js`) se cambiano solo i dati.

In alternativa puoi chiedere a Claude: «aggiorna i dati PNRR» (si ferma prima del push per chiedere conferma).

## Se qualcosa non torna

| Sintomo | Causa probabile | Cosa fare |
|---|---|---|
| `ERRORE: impossibile scaricare … HTTP 403` | il sito blocca la tua rete (o un VPN/ufficio) | riprova da casa o da un'altra rete; oppure scarica i file con il browser dal [catalogo](https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html), mettili in `.cache/pnrr/` con gli stessi nomi (`PNRR_Localizzazione.csv`, `PNRR_Progetti_M1.csv` … `M7`) e rilancia **senza** `--riscarica` |
| `HTTP 404` su un file | Italia Domani ha rinominato il file | cerca i nuovi nomi nel catalogo (cerca «Localizzazione» o «Progetti del PNRR»), poi aggiorna `LOCALIZZAZIONE` / `PROGETTI` in `scripts/pnrr.py` |
| «elenco IPA non scaricato» | l'indirizzo del file dell'Indice PA contiene due codici che possono cambiare | apri la [pagina IPA](https://indicepa.gov.it/ipa-dati/dataset/amministrazioni), copia il link di `amministrazioni.txt` e aggiorna `IPA_URL` in `scripts/pnrr.py` |
| `su_mappa` molto più basso di prima | scarico IPA fallito, o il formato degli indirizzi è cambiato | controlla il punto precedente; guarda `indirizzo_non_trovato` e `senza_indirizzo` in `riepilogo.json` |
| `cup` molto diverso | cambiato il formato dei file o i codici ISTAT di Palermo (`019`, `082`, `053`) | confronta le intestazioni dei CSV con quelle descritte nell'intestazione di `scripts/pnrr.py` |
| Nuova missione (M8…) | Italia Domani ha aggiunto un file | aggiungila all'elenco `PROGETTI` e a `MISSIONI` in `js/layers/scheda-pnrr.js` (nome e colore) |
| `con_dati_progetto` falso per alcuni progetti | il CUP non è in nessun file dei progetti | di solito è un'incoerenza della fonte: i progetti restano con i soli dati di localizzazione |
| Il Comune non è più sulla sede | il codice fiscale o il nome del Comune sono cambiati nell'IPA | aggiorna `ENTI_SULLA_SEDE` in `scripts/pnrr.py` |

## Cosa fa lo script (in breve)

1. Tiene i progetti **localizzati solo a Palermo** (codici ISTAT 019/082/053), escludendo quelli diffusi su più comuni.
2. Li unisce per CUP ai file dei progetti e trova la posizione dall'indirizzo (localizzazione, poi descrizione del progetto, poi sede della scuola
   o del Comune), usando i civici già nel repository.
3. Scrive i sei file e il riepilogo con i conteggi.

Le regole complete, le fonti e le trappole sono nell'intestazione di `scripts/pnrr.py`.
