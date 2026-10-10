
# Digital Twin di Palermo

Viewer web statico che sovrappone sulla stessa mappa catasto (S.I.T.R. 2026-09), PRG 2004 con PPE e vincoli, zone OMI,
popolazione ISTAT 2021 e 2023, edifici 3D, rilievo 3D, elevazione e civici. Un clic restituisce la **scheda del luogo**
(indirizzo, particella con link a SISTER, edificio, zonizzazione, vincoli, quotazioni OMI, sezione di censimento e terreno
DTM 5 m); la casella di ricerca porta su una via e un civico.

Nessun backend, nessun bundler.


<img width="1280" height="720" alt="monumenti" src="https://github.com/user-attachments/assets/1d97ea02-c75a-4b98-acd3-caf30a9fd7be" />


## Avvio

```bash
python3 scripts/serve.py 8000     # server con HTTP Range (necessario ai PMTiles)
# poi aprire http://127.0.0.1:8000/index.html
```

Serve la rete: base cartografica (OpenFreeMap), tile PRG/terreno e PMTiles sono letti dai link pubblicati.

## Dati

`dati/catalogo.json` è la fonte unica per il viewer e per i crediti. In git stanno solo i dati leggeri usati dall'app; i sorgenti pesanti restano fuori.

## Avvisi

<img width="1280" height="720" alt="rndt-catalogo" src="https://github.com/user-attachments/assets/d7a5be47-43cc-4b79-bccd-a583abf8a1f1" />

---

<img width="1280" height="720" alt="tabella-dati" src="https://github.com/user-attachments/assets/33690269-032c-4bc8-a04f-a3b6a5d0f13d" />

Catasto, PRG e vincoli sono informativi e senza valore legale; il PRG vigente è la Variante generale 2004. I dati 2023 sono
stime campionarie (censimento permanente).

## Struttura

`js/core/` nucleo (mappa, catalogo, pannello, scheda, ricerca) · `js/layers/` un modulo per tema · `js/geoimage/` mappe storiche georeferenziate sulla base · `worker/` proxy CORS (Cloudflare Worker) · `scripts/` server locale e aggiornamento automatico dei dati · `tests/js/` test (eseguiti dalla CI).

## Licenza

Codice sotto [EUPL-1.2](LICENSE). Dati e documentazione prodotti dal progetto sotto [CC BY 4.0](LICENSE-DATA.md). I dati di terzi mantengono la licenza della fonte: vedi [NOTICE.md](NOTICE.md).
