# Edificio in 3D per piani: procedura per replicarlo

Appunti di lavoro (per chi rifà il lavoro, Claude compreso) ricavati dal primo caso, l'ex Noviziato dei Crociferi
(`scripts/edificio/crociferi.py`, strato `js/layers/crociferi.js`). Dicono cosa chiedere, in che ordine lavorare, dove
stanno le scelte da rifare per un altro edificio e quali trappole si sono già incontrate.

Il risultato è uno strato dell'app nel gruppo «Edifici»:
- piani georeferenziati, estrusi alle loro quote;
- esploso dei livelli e vista in pianta con i numeri delle stanze, dalla legenda;
- prospetti disegnati sulle facciate;
- tooltip e scheda del luogo che leggono l'oggetto 3D.

---

## 1. File da chiedere (dal più al meno importante)

| # | File | A cosa serve | Senza |
|---|------|--------------|-------|
| 1 | **Piante DWG di tutti i piani**, copertura compresa (anche in un unico DWG con le tavole affiancate) | Murature, stanze, aperture, numeri delle stanze | Non si fa |
| 2 | **Almeno una sezione quotata** (meglio due, ortogonali), DWG o PDF vettoriale | Quote di calpestio e d'interpiano, spessori dei solai, gronda, colmo, cupole e volte | Quote stimate dai prospetti (±1 m) |
| 3 | **Prospetti di tutte le facciate libere**, DWG o immagini in scala | Facciate sul modello, controllo delle quote, sagoma del tetto | Facciate senza disegno |
| 4 | **Riferimento geografico**: 2–3 punti noti in coordinate (spigoli, caposaldo) oppure il DWG già georeferenziato | Georeferenziazione esatta | Si allinea alle unità volumetriche CTC (scarto di qualche decina di cm) |
| 5 | **Legenda dei layer del DWG** (cosa contiene ogni layer) | Si evita di indovinare muri, stanze, testi | Si ricava guardando il disegno |
| 6 | **Destinazioni d'uso aggiornate** delle stanze (tabella numero → uso) | Nomi degli ambienti in scheda (Portineria, Archivio…) | Restano i testi del DWG, spesso superati |
| 7 | **Quote assolute**: quota del piano terra sul livello del mare o rispetto alla strada | Allineare il modello al terreno (DTM) | Zero al pavimento del piano terra |
| 8 | Documentazione fotografica (facciate frontali, alta risoluzione) | Eventuali texture fotografiche | Si usano i prospetti disegnati |
| 9 | Modelli 3D esistenti (3ds Max, SketchUp, IFC/BIM) | Controllo; un IFC sarebbe la fonte migliore di tutte | Nessun problema |

Per il modello più fedele possibile, nell'ordine:
1. **IFC/BIM**: se c'è, sostituisce quasi tutta la procedura.
2. **DWG georeferenziato con sezioni quotate.**
3. **Piante DWG + sezione + prospetti**, come nel caso dei Crociferi.

Cose da sapere sui materiali:
- Le foto di scorcio a bassa risoluzione non servono come texture. Le abbiamo provate (raddrizzate con un'omografia) e
  l'utente le ha scartate.
- Il file 3ds Max dei Crociferi era una scena d'esploso con murature estruse di 1 m, senza quote vere. Si può leggere
  (contenitore OLE, catene di chunk; nodi, posizioni e Extrude ParamBlock), ma va controllato prima di fidarsene.

**Privacy.** Nei DWG di uffici ci sono spesso nomi del personale, scrivanie e postazioni. Non si esportano: dei testi
restano solo i numeri delle stanze (più i nomi degli ambienti scelti a mano). Il test JS controlla che non ci siano
proprietà inattese.

---

## 2. Ambiente

- **LibreDWG ≥ 0.13** compilato da sorgente (non c'è in apt su Ubuntu 24.04):
  ```bash
  curl -sSL -o libredwg.tar.xz https://github.com/LibreDWG/libredwg/releases/download/0.13.3/libredwg-0.13.3.tar.xz
  tar xJf libredwg.tar.xz && cd libredwg-0.13.3
  ./configure --disable-bindings --disable-python --disable-shared --prefix=$HOME/redwg && make -j8 && make install
  ```
- Python: `pip install ezdxf shapely pyproj trimesh numpy scipy pillow mapbox_earcut matplotlib pmtiles mapbox-vector-tile`
  - `ezdxf` serve solo per tentare il DXF.
  - `matplotlib` serve per le tavole di controllo.
  - `pmtiles` e `mapbox-vector-tile` servono per scaricare il riferimento CTC.
- **Non usare il DXF di LibreDWG**: per questi file è malformato (handle duplicati, ENDBLK mancanti, ezdxf non lo apre
  nemmeno in recover). Si usa `dwgread -O JSON -o file.json file.dwg` e si legge con `scripts/edificio/dwg_json.py`. Il
  lettore gestisce:
  - INSERT annidati con scala, rotazione e punto base;
  - LWPOLYLINE con bulge;
  - HATCH con anelli e archi;
  - TEXT e MTEXT;
  - layer «0» ereditato dal blocco;
  - `entmode` (2 = spazio modello, 0 = dentro un blocco, 1 = spazio carta, che si scarta).
- Controlli visivi: Chromium con Playwright (`/opt/pw-browsers`). Il proxy dell'agente non lascia passare 127.0.0.1:
  servire i file con `page.route('http://dt.local/**', …)` che legge dal disco.

---

## 3. Procedura passo per passo

### 3.1 Capire il DWG
1. `dwgread -O JSON` e conteggio di entità per layer e tipo.
2. Disegnare tutta la tavola (matplotlib) con colori per layer.
3. Individuare le cornici delle tavole (un piano per riquadro) → `CORNICI` (unità del disegno, di solito cm: un
   ufficio di ~4 m misura ~400).
4. Riconoscere i layer chiave:
   - murature **a retino** (poligoni pieni, la base di tutto) → `LAYER_MURI`;
   - perimetri d'area delle stanze → `LAYER_AREE`;
   - numeri delle stanze → `LAYER_NUMERI`. **Attenzione**: c'erano due layer di numeri. Quello «grande» era spostato di
     ~2,5 m dal centro della stanza, quello piccolo era al centro. Verificare dove cadono, non fidarsi del nome;
   - etichette di luoghi (chiesa, portineria…) → `LAYER_LUOGHI`, solo per il riconoscimento, non si esportano.
5. Retini: gli anelli si combinano **pari-dispari** (differenza simmetrica), altrimenti i fori (es. il vano ottagonale
   della cupola) si riempiono.

### 3.2 Allineare i piani tra loro
- I piani sono tavole affiancate: si portano tutti sul piano di riferimento (`RIFERIMENTO`, uno completo, es. il primo).
- Si fa per correlazione di fase (FFT) delle murature rasterizzate a 10 cm, con rotazioni da −3° a +3° a passi di 0,25°
  (`allinea`). Il terzo piano dei Crociferi era ruotato di 0,5°.
- Controllo: sovrapposizione delle murature di ogni piano su quelle di riferimento (tavola PNG).
- I piani parziali (ammezzato) si allineano male (score basso) ma correttamente: controllare a vista.

### 3.3 Georeferenziare
- Se ci sono punti noti: rototraslazione sui punti, scala 1:100 (cm → m), e basta.
- Altrimenti: riferimento sulle **unità volumetriche CTC** (`buildings_wgs84.pmtiles`, catalogo dell'app):
  1. scaricare i poligoni entro ~70 m e salvarli in `<edificio>/ctc_riferimento.geojson` (resta in git, così lo script
     non dipende dalla rete);
  2. trovare un **elemento d'ancoraggio** riconoscibile in pianta e nel CTC (per i Crociferi l'ottagono della cupola:
     foro più grande delle murature del terzo piano ↔ poligono CTC a 8 lati);
  3. cercare la rotazione su tutto il giro a passi di 2° e rifinire con Nelder-Mead. La misura dello scarto è: «ogni unità
     CTC tutta dentro o tutta fuori dall'impronta» più l'area d'impronta fuori dal CTC (`georeferenzia`);
  4. tenere la **scala 1:1** del rilievo: la scala libera migliorava lo scarto di poco ma deformava le misure.
- In UTM 33N (EPSG 32633) i conti, in WGS84 l'output.
- Lavorare con `set_precision(make_valid(g).buffer(0), 0.001)` dopo la trasformazione, altrimenti GEOS dà errori di
  topologia (non-noded intersection).

### 3.4 Stanze, varchi, impronta
- **Impronta del piano** = chiusura morfologica (buffer + / −) di murature ∪ perimetri d'area, solo l'anello esterno.
  Raggio 3 m: con 1,5 m le grandi aperture su un vuoto (la chiesa) lasciavano rientranze e il secondo piano perdeva un
  terzo dell'area.
- **Stanze** = impronta − murature con i varchi chiusi (`CHIUSURA` 75 cm, chiude passaggi fino a 1,5 m). Dove il DWG ha
  perimetri d'area disegnati, si usano quelli: sono più esatti.
- **Varchi** = (murature chiuse − murature): architravi da circa 2,4–3 m al soffitto, davanzali di 0,9 m se il varco dà
  sull'esterno.
- **Numeri**: ogni numero va alla faccia che lo contiene. Se cade su un muro, va alla faccia più vicina (entro 1,5 m)
  ancora senza numero (`assegna_numeri`). Obiettivo da verificare: tutti i numeri, ognuno una volta.
- **Vuoti** a doppia altezza (aula di una chiesa, scaloni): una faccia senza numero, sopra il piano terra, che cade
  per più di metà nell'aula riconosciuta al piano terra, diventa `vuoto` (niente solaio).
- **Spazi esterni** (cortili, giardini): facce per più di metà fuori dal CTC → `esterno`. I muri fuori dal CTC sono
  recinzioni basse (`MURO_GIARDINO`).
- **Nomi degli ambienti**: un corpo intero (es. chiesa con servizi e magazzini) si trova sottraendo gli spazi esterni
  dall'impronta del piano terra, poi con un'apertura morfologica di 1,5 m per staccare i vani uniti solo da fasce di
  muro (`corpo_chiesa`). Eccezioni a mano con `NOMI_PER_ETICHETTA` e `NOMI_PER_NUMERO`, quando il testo del DWG è
  superato: chiedere all'utente le destinazioni vere.

### 3.5 Quote
- Fonte migliore: sezione quotata.
- Dalla sezione in immagine:
  1. scala orizzontale presa da ambienti misurabili in pianta (stanza 4,52 m = 63 px);
  2. righe dei solai trovate con i profili di pixel scuri dentro le stanze;
  3. scala verificata sulla gronda CTC (`QUOTA_GRON − QUOTA_PIED`, cioè `height`).
- I prospetti confermano le proporzioni (rapporti piano/gronda entro il 2–3%), meno la scala assoluta.
- Ancorare la scala alla gronda CTC sopra la strada e dichiarare l'incertezza (±1 m) nella nota della legenda.
- `PIANI`: `quota` = calpestio, `cielo` = estradosso del solaio sopra. I piani parziali (ammezzato) fanno abbassare il
  cielo del piano sotto, solo dove ci sono.
- `COPERTURA`: falde a gradoni (MapLibre estrude solo in verticale) dalla gronda al colmo; tamburo, calotta a anelli
  ottagonali, lanterna. Le viste 3D di Google aiutano a capire la forma vera (lì la cupola era a otto spicchi di coppi).

### 3.6 Prospetti sulle facciate
- Per ogni prospetto:
  - riquadro in pixel della facciata (x da spigolo a spigolo, y da cima a terra);
  - lato della pianta e fili esterni (`FILI`, in cm del piano di riferimento).
- Verifica: la posizione di un elemento (asse della cupola, portale) in percentuale della larghezza deve tornare con la
  pianta.
- Scala verticale = scala orizzontale (larghezza in pianta / pixel). Il bianco diventa trasparente e le linee si posano
  5 cm fuori dal filo dei muri. Texture WebP per il web.
- Esclusione da notare: le facciate cieche contro altri edifici non hanno prospetto.

### 3.7 Integrazione nell'app
- Dati in `dati/edificio/<nome>/`:
  - `<nome>.geojson`, con proprietà ammesse: piano, nome_piano, livello, tipo, nome, numero, area, quota, h;
  - `contesto.geojson`;
  - `ctc_riferimento.geojson`;
  - `prospetti.json` più `prospetti/*.webp`.

  `.gitignore` esclude `dati/*/`: ci sono già le eccezioni `!dati/edificio/` e `!scripts/edificio/`.
- Strato: copiare `js/layers/crociferi.js` (modulo con `gruppo: 'edifici'`, legenda in `#legende`, `strati[].suCambio`
  per aprirla e volare sull'edificio, `scheda.voci`, `scheda.puntoAlClic`, tooltip `esclusivo`) e registrarlo in
  `MODULI` di `js/app.js` dopo `edifici`.
- Riusa `js/edificio/modello.js` (esploso, filtri, colori, scheda, stanze del clic) e `js/edificio/prospetti.js` (layer
  custom three.js).
- Generalizzazioni già fatte nel nucleo, da non rifare:
  - `js/core/tooltip.js`: una sezione `esclusivo: true` nasconde le altre;
  - `js/core/scheda.js`: `m.scheda.puntoAlClic(map, e)` restituisce il punto a terra dell'oggetto 3D cliccato e tutta la
    scheda si apre lì;
  - `js/core/mappa.js` → `aggiorna3D`: aggiungere l'id dello strato all'elenco che attiva l'inclinazione;
  - `aggiorna3D` va chiamato **prima** del `flyTo`, perché la sua animazione interromperebbe il volo.
- i18n:
  - testi letterali dei moduli → voci `lbl.<testo>` in `it.json` (uguale al testo) ed `en.json`;
  - testi dell'interfaccia → chiavi `edificio.*`;
  - i dizionari crescono **in coda**: niente riordino.
- Crediti: una `voce(...)` in `js/core/catalogo.js` (con la licenza, se nota).
- Legenda: nota apri/chiudi con la classe `peba-nota` (aperta all'inizio); interruttori con `voceFiltro(…, false)`;
  etichette `ic-etichetta`. Lo strato si chiama «… (in sviluppo)» finché è un test.
- Scheda: `peso` 3 (subito dopo l'edificio), badge col piano, `sempre: true`.

### 3.8 Verifiche prima del commit
1. Tavola di controllo per piano (stanze colorate, numeri, vuoti, esterni, muri) e tavola del corpo con i nomi.
2. `npm run test:js`. In `tests/js/edificio-modello.test.mjs` ci sono i test su dati (numeri tutti e una volta,
   proprietà ammesse, posizione, quote), filtri, scheda e prospetti: adattarli al nuovo edificio.
3. App nel browser: accendere lo strato, esploso, «pianta» di un piano, clic su stanza e muro, tooltip, tema scuro,
   inglese.
4. Niente download dei dati nella pagina (scelta dell'utente); il GLB si genera solo con `--glb`, fuori da git.

---

## 4. Per il prossimo edificio: cosa cambiare nello script

Oggi `crociferi.py` contiene costanti specifiche. Per un secondo edificio conviene estrarle in un file di configurazione
(`dati/edificio/<nome>/config.json`) e passare `--config`. Le voci da riempire:

- percorso del DWG, cartella di output, nome e indirizzo;
- `CORNICI` per piano e `RIFERIMENTO`;
- layer: `LAYER_MURI`, `LAYER_NUMERI` (in ordine di preferenza), `LAYER_AREE`, `LAYER_LUOGHI`;
- georeferenziazione: punti noti, oppure elemento d'ancoraggio (cosa cercare in pianta e nel CTC);
- `PIANI` (id, nome, livello, quota, cielo) e `COPERTURA` (gronda, colmo, eventuali cupole o torrini);
- vuoti a doppia altezza: etichetta del DWG che identifica l'ambiente al piano terra;
- nomi degli ambienti: corpo (etichetta di partenza), eccezioni per etichetta e per numero;
- `FILI` e `FACCIATE` (immagini dei prospetti, riquadri, lato);
- parametri: `CHIUSURA`, `STANZA_MIN`, `SOLAIO`, `MURO_GIARDINO`.

Le parti legate alla forma dei Crociferi (cupola ottagonale come ancora, falde a gradoni su un rettangolo, chiesa come
vuoto) vanno rese opzionali o riscritte caso per caso.

## 5. Tempi e limiti osservati

- Il DWG dei Crociferi era ordinato (murature a retino, numeri su layer propri): circa mezza giornata di lavoro. Con
  murature a sole linee spezzate servono la poligonizzazione e molto più controllo a vista.
- Precisioni: allineamento tra piani ~10 cm; georeferenziazione sul CTC ~0,3–0,5 m; quote ±1 m senza sezione quotata.
- Forme non verticali (falde, volte, cupole) sono approssimate a gradoni in MapLibre; il GLB con trimesh le può avere
  vere, se le si costruisce.
