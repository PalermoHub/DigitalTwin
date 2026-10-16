# Come aggiornare i dati delle opere pubbliche

I file di questa cartella sono **generati** da `scripts/opere.py` a partire dagli open data della Ragioneria generale dello Stato (Open BDAP,
Monitoraggio Opere Pubbliche). **Non si aggiornano da soli**: si rigenerano a mano, da un computer, quando BDAP pubblica dati nuovi
(il catalogo li aggiorna circa ogni mese: `dati osservati al …` nella descrizione del dataset).

```bash
cd percorso/della/cartella/DigitalTwin
python3 scripts/opere.py            # scarica i due CSV (circa 90 MB, in .cache/opere/), rigenera dati/opere/
python3 scripts/opere.py --riscarica   # ignora i CSV già in .cache/ e li scarica di nuovo
python3 -m pytest tests/test_opere.py
```

Servono solo Python 3 e internet (circa 1-2 minuti). Poi commit di `dati/opere/` e, se cambiano i file dell'app, il bump di `VERSIONE` in `sw.js`.
Lo script non scrive nulla se le opere trovate sono fuori soglia (1.000-1.800 in totale, 250-450 del Comune): meglio dati vecchi che sbagliati.

Perché non c'è un workflow GitHub: come per il PNRR, uno scarico dai server di GitHub non è stato verificato (il sito di Italia Domani li blocca);
se BDAP li accetta si può copiare `aggiorna-colonnine.yml` come modello.

I dataset (cercati per nome nel catalogo CKAN `https://bdap-opendata.rgs.mef.gov.it/SpodCkanApi/api/3/action/package_search?q=MOP`):
`spd_mop_prg_mon_reg19_01_9999` (progetti, Sicilia) e `spd_mop_loc_mon_local_01_9999` (localizzazione nazionale: regione, provincia, comune).
Il server ignora l'intestazione `Range`: i file si scaricano interi.
