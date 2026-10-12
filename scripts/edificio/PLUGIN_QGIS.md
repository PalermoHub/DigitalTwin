# Plugin QGIS «Edificio per piani»: progetto di lavoro

Documento per riprendere il lavoro più avanti (Claude compreso). Il plugin porta in QGIS quello che
`scripts/edificio/crociferi.py` fa per l'ex Noviziato dei Crociferi:
1. dal DWG delle piante, un **gruppo di layer per ogni piano**, georeferenziati, da modificare e interrogare in GIS;
2. **sempre** il modello **3D** dell'edificio: vista 3D di QGIS già configurata, esploso dei piani ed export.

Leggere prima `scripts/edificio/PROCEDURA.md`, dove ci sono i passi, le scelte e le trappole del caso Crociferi. Qui c'è
come trasformarli in un plugin.

**Stato.** Da fare. Restano aperte le domande del § 12, da chiedere all'utente prima di cominciare.

---

## 1. Requisiti

### Obbligatori
- **R1** Importare un DWG (o DXF) con più piani, anche affiancati nello spazio modello come tavole.
- **R2** Mappatura guidata dei layer del DWG: murature, perimetri delle stanze, numeri delle stanze, etichette
  degli ambienti, aperture (facoltativo).
- **R3** Definire i piani: riquadro della tavola, id, nome, livello (ordine), quota di calpestio, quota del soffitto,
  piano parziale sì/no.
- **R4** Allineare i piani tra loro: automatico, con correzione manuale.
- **R5** Georeferenziare: con punti di controllo, oppure automatico su un layer di impronte di riferimento (CTC).
- **R6** Generare per ogni piano un gruppo di layer in un GeoPackage di progetto: muri, stanze, varchi (architravi e
  davanzali), solai, vuoti, spazi esterni, numeri.
- **R7 (3D, sempre)** A ogni generazione o aggiornamento il plugin:
  - assegna a ogni layer il renderer 3D con estrusione (base e altezza dagli attributi);
  - crea copertura e cupole, se configurate;
  - apre o aggiorna una vista 3D dedicata;
  - aggiunge il cursore dell'**esploso**.

  Non c'è un'opzione per spegnere il 3D.
- **R8** Esportare:
  - GeoJSON nello schema del Digital Twin (`dati/edificio/<nome>/<nome>.geojson`, vedi § 5.3);
  - modello 3D (OBJ dalla scena 3D di QGIS; glTF se la versione lo permette, altrimenti con trimesh fuori da QGIS);
  - pacchetto per il Digital Twin: GeoJSON, contesto, prospetti.
- **R9** Privacy: dei testi del DWG si tengono solo numeri delle stanze e nomi degli ambienti scelti. I nomi del
  personale non entrano mai nei layer generati.
- **R10** Ripetibilità: tutte le scelte (mappatura, piani, allineamenti, georeferenziazione, quote) stanno in un file
  di configurazione JSON nel progetto. Rigenerare con la stessa configurazione dà lo stesso risultato.

### Desiderati
- Prospetti (immagini) come texture delle facciate nell'export per il Digital Twin. In QGIS 3D le facciate verticali
  con texture non sono native: si fanno solo nell'export.
- Quote proposte da una sezione in immagine: l'utente clicca le righe dei solai e una quota nota, come la gronda.
- Modello di configurazione riusabile per DWG dello stesso studio o ufficio (stessi nomi di layer).
- Algoritmi in un provider Processing, così si usano nel Model Builder e in batch.

### Fuori scopo, per ora
- Muri ricavati da sole linee spezzate senza retini: si tenta con la poligonizzazione, ma va controllato a mano.
- BIM/IFC: se c'è un IFC, conviene un altro strumento.

---

## 2. Compatibilità e dipendenze
- QGIS **3.34 LTR e successive, e QGIS 4 (Qt6)** con lo stesso codice:
  - enum qualificati (`Qt.AlignmentFlag.AlignLeft`, `QgsWkbTypes.GeometryType.PolygonGeometry`…);
  - `exec()` e non `exec_()`;
  - `qgis.PyQt` invece di PyQt5 diretto;
  - `metadata.txt` con `qgisMinimumVersion=3.34` e `qgisMaximumVersion=4.99`.

  Esiste la skill `anthropic-skills:qgis4-port`.
- Solo API di QGIS più numpy, che è incluso in QGIS su tutte le piattaforme. **Niente shapely, scipy, opencv, trimesh**
  nel plugin: su Windows (OSGeo4W o installer) installarli è un ostacolo.
  - Correlazione FFT → `numpy.fft`.
  - Ottimizzazione → Nelder-Mead scritto a mano (50 righe), oppure ricerca a griglia più raffinamento.
  - Geometrie → `QgsGeometry`: `buffer`, `difference`, `combine`, `unaryUnion`, `polygonize`,
    `makeValid`, `snappedToGrid`.
- Lettura del DWG: in ordine di preferenza
  1. **importatore DWG nativo di QGIS** (`QgsDwgImporter`, menu Progetto → Importa/Esporta → Importa layer da DWG/DXF):
     crea un GeoPackage con layer per layer DWG, blocchi risolti, retini come poligoni.
     **Da verificare per prima cosa** con `dati/edificio/Noviziato planimetrie complete e PLT.dwg` (AC1018 = 2004):
     ci sono i retini con i fori? I testi con posizione e contenuto? Gli INSERT annidati?
  2. DXF importato con OGR (`ogr:DXF`), se l'utente lo esporta da CAD;
  3. ODA File Converter, se installato (percorso nelle impostazioni del plugin), per convertire in DXF;
  4. LibreDWG `dwgread -O JSON` più il lettore `dwg_json.py`, solo se `dwgread` è nel PATH. È la via del Digital Twin:
     va tenuta come ripiego, non come strada principale.

---

## 3. Architettura

```
edificio_per_piani/
  metadata.txt            nome, versione, qgis min/max, about, tracker, repository
  __init__.py             classFactory
  plugin.py               menu, toolbar, registrazione del provider Processing, dock
  config.py               dataclass della configurazione + lettura/scrittura JSON (R10)
  dwg/
    importa.py            QgsDwgImporter → GeoPackage di lavoro; ripieghi DXF/ODA/LibreDWG
    layer_dwg.py          elenco layer DWG, statistiche (entità per tipo), anteprima
  nucleo/                 logica pura, testabile senza GUI
    retini.py             poligoni pari-dispari dai retini
    piani.py              ritaglio per riquadro, impronta (chiusura 3 m), stanze/varchi (chiusura 75 cm)
    allinea.py            raster numpy + FFT + rotazioni ±3°
    georef.py             Helmert da punti; automatico su impronte di riferimento (scarto CTC)
    numeri.py             assegnazione dei numeri alle stanze (contenuto, poi più vicina senza numero)
    ambienti.py           vuoti a doppia altezza, spazi esterni, corpi con nome
    quote.py              quote dei piani, proposte da sezione + gronda nota
    copertura.py          falde a gradoni, tamburo, calotta, lanterna
  genera/
    gpkg.py               schema dei layer per piano (§ 5), scrittura
    stili.py              stili 2D (qml) per tipo e per piano (palette del Digital Twin)
    tre_d.py              renderer 3D, vista 3D, esploso (§ 6) — sempre eseguito
    esporta.py            GeoJSON Digital Twin, OBJ/glTF, prospetti
  gui/
    dock.py               procedura guidata in schede (§ 4)
    strumenti_mappa.py    disegno dei riquadri, punti di controllo, clic sulle righe della sezione
    anteprima.py          anteprima piano per piano (colori per tipo, numeri)
  processing/
    provider.py           «Edificio per piani»
    alg_*.py              un algoritmo per passo (§ 7)
  i18n/                   it (base), en
  test/                   pytest con qgis (headless), dati di prova
  resources/icone
```

La configurazione (`<progetto>.edificio.json`) è la fonte di verità. La GUI la modifica; ogni passo legge la
configurazione e scrive i suoi risultati nel GeoPackage di progetto.

---

## 4. Procedura guidata (dock a schede)

1. **DWG**
   - Scelta del file e importazione.
   - Elenco dei layer DWG con conteggi per tipo (retini, linee, testi).
   - Tavola complessa mostrata in mappa con un colore per layer.
2. **Layer**
   - Assegnazione dei ruoli: murature (retini), perimetri d'area, numeri (più layer in ordine di preferenza),
     etichette degli ambienti, layer da **escludere sempre** (personale, arredi).
   - Anteprima: i numeri del layer scelto mostrati sulle stanze, per accorgersi subito di un layer spostato (come i
     numeri «grandi» dei Crociferi, ~2,5 m fuori).
3. **Piani**
   - Strumento per disegnare il riquadro di ogni tavola.
   - Tabella: id, nome, livello, quota, soffitto, parziale, riferimento (uno solo).
   - Riconoscimento automatico proposto: blocchi di murature separati da spazi vuoti.
4. **Allineamento**
   - Pulsante «Allinea» (FFT); per piano mostra rotazione, traslazione e punteggio.
   - Sovrapposizione colorata del piano sul riferimento.
   - Correzione manuale: spostamento e rotazione con il mouse, oppure 2+ punti omologhi.
5. **Georeferenziazione**, con due modi:
   - **Punti**: clic sul disegno e sulla mappa (base OSM/ortofoto/catasto), Helmert, residui in tabella.
   - **Automatico**: layer di impronte di riferimento più elemento d'ancoraggio (poligono scelto in pianta e nel
     riferimento). Ricerca della rotazione, poi raffinamento.

   In entrambi i casi scala 1:1 bloccata di default (sbloccabile), SR di lavoro metrico (es. EPSG:32633), scarto
   mostrato in m².
6. **Quote**
   - Tabella delle quote.
   - Aiuto da sezione: si carica l'immagine, si cliccano le righe dei solai e due punti a distanza nota (o la
     gronda nota) e il plugin propone le quote.
   - Copertura: gronda, colmo, eventuali cupole (centro = vuoto scelto, quote).
7. **Ambienti**
   - Vuoti a doppia altezza (ambiente di riferimento al piano terra).
   - Riferimento per gli spazi esterni (layer impronte o disegno a mano).
   - Corpi con nome; eccezioni per numero e per etichetta.
8. **Genera**
   - Scrive il GeoPackage e i gruppi per piano con stili 2D e **3D**, poi apre la vista 3D.
   - Rapporto: numeri trovati o mancanti o doppi, stanze senza numero, piani vuoti.
9. **Esporta**
   - GeoJSON Digital Twin, OBJ/glTF, pacchetto prospetti.

Ogni scheda è rieseguibile. Cambiando un passo si invalidano solo i successivi, e il plugin lo segnala.

---

## 5. Dati generati

### 5.1 GeoPackage di progetto (`<nome>.gpkg`)

Un layer per tipo e per piano, nominato `<piano>__<tipo>`, nel gruppo «<Nome piano>». Campi comuni:

| campo | tipo | note |
|---|---|---|
| `piano` | text | id del piano |
| `nome_piano` | text | |
| `livello` | int | 0 = terra; serve all'esploso |
| `tipo` | text | muro, architrave, davanzale, solaio, stanza, vuoto, esterno, numero, tetto, tamburo, cupola, lanterna |
| `quota` | real | m, base dell'oggetto |
| `h` | real | m, cima dell'oggetto |
| `numero` | text | stanze |
| `nome` | text | ambienti con nome |
| `uso` | text | destinazione d'uso, compilabile in GIS |
| `area` | real | m², stanze |
| `fonte` | text | layer DWG d'origine (tracciabilità) |

Inoltre:
- layer `copertura__*`;
- layer di lavoro: impronte per piano, riquadri delle tavole, punti di controllo;
- tabella `config` con la configurazione JSON per la ripetibilità.

### 5.2 Modifica in GIS
- L'utente può correggere stanze, numeri, nomi, usi e quote direttamente nei layer.
- «Rigenera» non deve cancellare le modifiche fatte a mano. Strategia: i campi modificabili (`uso`, `nome`, `numero`)
  si conservano per corrispondenza geometrica. Si prende la stanza nuova con il maggior overlap (>50%) con la vecchia.
  Le geometrie modificate a mano vanno segnate con un campo `manuale=1` e non si rigenerano.

### 5.3 GeoJSON per il Digital Twin

Stesso schema di `dati/edificio/crociferi/crociferi.geojson`:
- proprietà ammesse: piano, nome_piano, livello, tipo, nome, numero, area, quota, h;
- `metadata` con nome, indirizzo, fonte, georeferenziazione, quote, piani, centro, rotazione;
- anche `contesto.geojson` e `prospetti.json` più le immagini `prospetti/*.webp`.

Così il modulo `js/layers/crociferi.js` si riusa per un altro edificio cambiando solo cartella e nomi. Andrebbe
generalizzato in `js/layers/edificio-3d.js` con un elenco di edifici.

---

## 6. 3D, sempre generato

- **Renderer.** Per ogni layer poligonale `QgsVectorLayer3DRenderer` con `QgsPolygon3DSymbol`:
  - `extrusionHeight` data-defined = `"h" - "quota"`;
  - `offset` (base) data-defined = `"quota" + "livello" * @edificio_esploso`;
  - altitudine assoluta o relativa al terreno a scelta. Default: relativa, con terreno piatto o DEM se presente.
- **Esploso.** Variabile di progetto `edificio_esploso` (metri per livello), con un cursore nel dock che la aggiorna
  e ridisegna la vista 3D.
- **Materiali.** Colori per tipo e per piano, la stessa palette del Digital Twin (`js/edificio/modello.js`:
  `COLORI_PIANI`, `COLORI_TIPI`). Phong per muri e solai, tetto in cotto.
- **Vista 3D.** All'avvio della generazione si apre una «Nuova vista 3D» centrata sull'edificio, inclinata, dal lato
  dei prospetti, con le luci impostate. Se esiste già, si aggiorna.
- **Copertura.**
  - Falde a gradoni come nel web (anelli via via più interni, `buffer` negativi). In alternativa, in QGIS 3D si può
    usare una mesh TIN della copertura dal tetto «straight skeleton», da valutare.
  - Cupole ad anelli ottagonali o circolari.
- **Prospetti.** Non in QGIS 3D (nessuna parete verticale con texture). Il plugin li prepara solo per l'export (Digital
  Twin e glTF), con la logica di `facciate()`:
  - riquadro dell'immagine;
  - lato della pianta;
  - scala verticale uguale all'orizzontale;
  - bianco trasparente.
- **Export 3D.**
  - OBJ: `Qgs3DSceneExporter` (dalla vista 3D).
  - glTF: dalla 3.40 circa, se l'API lo espone, altrimenti con uno script esterno con trimesh (`scrivi_glb` di
    `crociferi.py`).
  - Ci vuole sempre almeno un export 3D riuscito per chiudere la generazione: se fallisce, errore chiaro nel rapporto.

---

## 7. Algoritmi Processing (uno per passo)

| id | input | output |
|---|---|---|
| `edificio:importadwg` | DWG/DXF | GeoPackage di lavoro |
| `edificio:allineapiani` | configurazione, layer murature | trasformazioni per piano (in config) + punteggi |
| `edificio:georeferenzia` | configurazione, punti o impronte di riferimento | trasformazione (in config) + scarto |
| `edificio:generapiani` | configurazione | GeoPackage di progetto + rapporto |
| `edificio:genera3d` | GeoPackage di progetto | renderer 3D, vista, copertura (richiamato sempre da generapiani) |
| `edificio:esportadigitaltwin` | GeoPackage di progetto, prospetti | cartella per `dati/edificio/<nome>/` |
| `edificio:esporta3d` | vista o GeoPackage | OBJ / glTF |

---

## 8. Porting dalla pipeline web (cosa riusare)

| `crociferi.py` / `dwg_json.py` | Nel plugin |
|---|---|
| `poligono_retino` (pari-dispari) | `QgsGeometry.symDifference` sugli anelli; se l'importatore QGIS dà già poligoni con fori, verificarlo e saltare |
| `allinea` (FFT, ±3°) | uguale con numpy; raster con `QImage`/`QPainter` o numpy puro (scanline) invece di PIL |
| `georeferenzia` (ancora + scarto CTC + Nelder-Mead) | uguale; `QgsCoordinateTransform` per UTM ↔ WGS84 |
| `impronta_di` (chiusura 3 m), `stanze_e_varchi` (chiusura 75 cm) | `buffer(+r).buffer(-r)` con join mitre; attenzione alle prestazioni su retini grandi: semplificare prima |
| `assegna_numeri` | uguale |
| `corpo_chiesa` | generalizzato: «corpo con nome» = componente dell'impronta meno gli esterni, apertura di 1,5 m |
| copertura e cupola | uguale |
| `texture_facciata`, `facciate` | uguale, ma con `QImage` per la trasparenza |
| `set_precision(make_valid(…), 0.001)` | `makeValid()` + `snappedToGrid(0.001, 0.001)`: indispensabile, altrimenti errori GEOS di topologia |

---

## 9. Prove e accettazione

**Caso di prova:** i Crociferi (`dati/edificio/Noviziato planimetrie complete e PLT.dwg`, sezione `img/sezione.jpg`,
prospetti `img/nov_crocif_01-03`). Il plugin deve riprodurre il risultato attuale:
- 5 piani più copertura;
- 39 stanze numerate, ognuna una volta;
- terzo piano ruotato di circa 0,5° rispetto al primo;
- georeferenziazione automatica sul CTC con scarto ≤ 50 m² su ~1140 m², rotazione ~31,5°;
- quote: terra 0; ammezzato 2,8; primo 6,3; secondo 11,8; terzo 17,3; gronda 20,4; colmo 23,5; cupola 27,9;
  lanterna 31,7 (dalla sezione con gronda CTC 21,6 m dalla strada);
- piano terra: corpo della chiesa con nome, Portineria (46,9 m²), Archivio (38);
- vista 3D aperta con esploso funzionante;
- export GeoJSON confrontabile con `dati/edificio/crociferi/crociferi.geojson` (stesse proprietà; geometrie entro
  qualche cm).

**Test automatici:** pytest con `qgis.testing` headless.
- I moduli `nucleo/` sono senza GUI.
- Test di non regressione sui numeri sopra.
- Test sui dati personali: nessun testo diverso da numeri e nomi scelti.

**Su Windows:** QGIS 3.34 LTR da installer e OSGeo4W; su QGIS 4 nightly almeno l'avvio e l'import.

---

## 10. Fasi

1. **Spike (½ giornata).** Verificare `QgsDwgImporter` sul DWG dei Crociferi:
   - retini con fori, testi, blocchi;
   - prestazioni su 50.000 linee del layer «retini copertura» (da escludere in fase di import, se possibile).

   Se non regge, la via principale diventa DXF/ODA.
2. **Nucleo (2–3 giorni).** Porting di retini, piani, allineamento, georeferenziazione, numeri, ambienti, quote e
   copertura, con test sui Crociferi.
3. **Generazione 2D + 3D (1–2 giorni).** GeoPackage, stili, renderer 3D, vista, esploso, rapporto.
4. **GUI (2–3 giorni).** Dock a schede, strumenti di mappa, anteprime.
5. **Export (1 giorno).** GeoJSON Digital Twin, prospetti, OBJ/glTF.
6. **Rigenerazione con le modifiche manuali (1 giorno)** (§ 5.2).
7. **Pacchetto.** i18n, documentazione utente, zip per il repository dei plugin QGIS, compatibilità QGIS 4.

---

## 11. Rischi
- **Qualità dei DWG.** Murature non a retino, layer misti, testi esplosi in linee. Mitigazioni:
  - anteprima e rapporto;
  - poligonizzazione delle linee come ripiego;
  - ruoli dei layer scelti dall'utente.
- **Prestazioni.** I buffer di chiusura su geometrie con migliaia di vertici sono lenti in Python. Mitigazioni:
  - semplificare a 1–2 cm;
  - lavorare per piano;
  - eseguire in `QgsTask` in background con barra di avanzamento.
- **Importatore DWG di QGIS.** Versioni DWG molto recenti potrebbero non essere supportate → ripiego DXF/ODA.
- **Quote.** Restano un input umano. Il plugin le propone ma non le inventa, e nel rapporto e nella nota segna da
  dove vengono.

---

## 12. Domande aperte (da chiedere prima di iniziare)
1. Versione di QGIS e sistema operativo degli utenti.
2. Repository: separato (consigliato, es. `PalermoHub/qgis-edificio-per-piani`) o dentro DigitalTwin?
3. Prima versione essenziale (fasi 1–3 + export GeoJSON) o tutto subito? Il 3D in ogni caso c'è sempre (R7).
4. Lingua dell'interfaccia: solo italiano o italiano e inglese.
5. Licenza del plugin (GPL-2.0+ è la norma per i plugin QGIS).
