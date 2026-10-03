# Graph Report - DigitalTwin  (2026-10-01)

## Corpus Check
- 92 files · ~233,336 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3107 nodes · 6916 edges · 173 communities (98 shown, 75 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 222 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac4724f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- $
- monumenti.py
- .renderLayer
- o
- ft
- test_viewer.py
- ts
- test_valida_dati.py
- scheda.js
- ds
- i
- _update
- T
- ls
- sicurezza.js
- de
- pmtiles.js
- app.js
- A
- monumenti_kml.py
- valida_dati.py
- .evaluate
- is
- constructor
- ki
- .evaluate
- ba
- ta
- ws
- ot
- es
- trasporto.js
- va
- xr
- h
- monumenti.js
- el
- .easeTo
- r
- _scheda_su
- File Structure
- v
- territorio.js
- ye
- oa
- U
- zl
- Ua
- gtfs.py
- .reset
- w
- Z
- popolazione.js
- .constructor
- Ma
- vs
- Ht
- .enable
- .get
- se
- resize
- gs
- .create
- ga
- ._validate
- Yi
- ru
- sicurezza_stradale.py
- Lt
- evidenza.js
- ms
- indicatori.test.mjs
- X
- ._checkLoaded
- zone.js
- ql
- test_monumenti.py
- .apply
- jc
- .render
- Ya
- .parse
- .preventDefault
- scheda-scuole.js
- .pop
- ct
- scheda-omi.js
- un
- Ut
- Analisi design — Digital Twin Palermo
- l
- j
- Digital Twin di Palermo — inventario e piano
- Ss
- ricerca.js
- urlDati
- .parse
- os
- c
- fe
- Digital Twin di Palermo — Fase 0 + Fase 1: design
- te
- S
- fs
- hi
- ne
- mo
- scheda-uso.js
- .update
- be
- .loadMatchingFeature
- ps
- za
- kt
- RIPARTENZA.md
- .add
- an
- cs
- vi
- Digital Twin di Palermo
- RangeRequestHandler
- scuole.js
- test_scheda_edificio_uno_unk_diventa_scuola_se_il_clic_cade_sul_poligono_della_scuola
- Pagina
- N
- .fire
- package.json
- me
- Dati del Digital Twin di Palermo
- Tematizzazione: da dove viene ogni stile
- wa
- stile-omi.test.mjs
- wi
- Ic
- Yt
- le
- .constructor
- wh
- sl
- File structure
- catalogo.md
- test_scuole.py
- qc
- _righe
- Sicurezza stradale (viabilità pericolosa) — design
- .constructor
- _primo_luogo
- test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro
- .push
- hs
- Fa
- _dati_trasporto
- _cerca_e_vai
- ys
- Review Focus
- scheda-modello.js
- ee
- ks
- .reload
- na
- _arco_con_incidenti
- Trasporto pubblico AMAT (GTFS): design
- conftest.py
- .equals
- la
- ni
- po
- Ou
- _attendi_fermo
- jt

## God Nodes (most connected - your core abstractions)
1. `$` - 509 edges
2. `ta` - 144 edges
3. `apri()` - 96 edges
4. `de` - 80 edges
5. `ts` - 67 edges
6. `e()` - 51 edges
7. `Ut()` - 50 edges
8. `constructor()` - 49 edges
9. `va()` - 48 edges
10. `_update()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `collegaZone()` --indirect_call--> `l()`  [INFERRED]
  js/core/zone.js → tests/js/trasporto-filtro.test.mjs
- `raggruppaLinee()` --indirect_call--> `l()`  [INFERRED]
  js/layers/scheda-trasporto.js → tests/js/trasporto-filtro.test.mjs
- `h()` --indirect_call--> `l()`  [INFERRED]
  js/vendor/maplibre-gl.js → tests/js/trasporto-filtro.test.mjs
- `y()` --indirect_call--> `l()`  [INFERRED]
  js/vendor/maplibre-gl.js → tests/js/trasporto-filtro.test.mjs
- `Z` --indirect_call--> `l()`  [INFERRED]
  js/vendor/maplibre-gl.js → tests/js/trasporto-filtro.test.mjs

## Import Cycles
- None detected.

## Communities (173 total, 75 thin omitted)

### Community 0 - "$"
Cohesion: 0.03
Nodes (36): $, addControl(), ah(), ch, clearMetrics(), Cu(), da(), _diffStyle() (+28 more)

### Community 1 - "monumenti.py"
Cohesion: 0.07
Nodes (48): abbina(), abbina_edifici(), abbina_edificio(), applica_correzioni(), _civico_di(), correggi(), costruisci_feature(), Indice (+40 more)

### Community 2 - ".renderLayer"
Cohesion: 0.14
Nodes (8): Aa, f(), g(), getPaintProperty(), ia, ie(), qi, xi()

### Community 3 - "o"
Cohesion: 0.10
Nodes (13): Ao, bo(), _createDelegatedListener(), jo(), No(), o(), off(), once() (+5 more)

### Community 5 - "test_viewer.py"
Cohesion: 0.08
Nodes (49): apri(), apri(blocca=None) -> Pagina. `blocca` è un pattern di URL da far fallire (vince…, test_avvisi_sopra_la_ricerca_si_chiudono_e_spariscono(), test_avviso_sul_valore_legale_e_sempre_visibile(), test_barra_ricerca_riconosce_il_riferimento_catastale(), test_barra_strumenti_zoom_home_e_schermo_intero(), test_base_cartografica_irraggiungibile_non_blocca_il_viewer(), test_basi_cartografiche_alternative() (+41 more)

### Community 6 - "ts"
Cohesion: 0.05
Nodes (7): calculateCameraOptionsFromTo(), _cancelRenderFrame(), e(), _requestRenderFrame(), setMaxZoom(), setMinZoom(), ts

### Community 7 - "test_valida_dati.py"
Cohesion: 0.10
Nodes (30): catalogo(), _manifest(), fixture, Piccolo server HTTP locale con CORS: (cartella servita, url base)., _server(), _sezioni(), _sha(), test_leggi_json_dal_remoto_e_dalla_cache() (+22 more)

### Community 8 - "scheda.js"
Cohesion: 0.22
Nodes (18): ZOOM_SCHEDA, ICONE, svgIcona(), adattaVistaMappa(), disegnaAccordion(), disegnaGruppo(), disegnaLink(), disegnaRiga() (+10 more)

### Community 11 - "_update"
Cohesion: 0.08
Nodes (26): addLayer(), addSprite(), _lazyInitEmptyStyle(), moveLayer(), removeFeatureState(), removeLayer(), removeSprite(), setFilter() (+18 more)

### Community 12 - "T"
Cohesion: 0.14
Nodes (4): Dt(), getImage(), T(), updateImage()

### Community 14 - "sicurezza.js"
Cohesion: 0.18
Nodes (23): GRAVITA, ha(), NOTA_DATI, num(), pai(), rigaIncidenti(), rigaTasso(), senzaIncidenti() (+15 more)

### Community 15 - "de"
Cohesion: 0.08
Nodes (4): de, getFeatureState(), getSky(), getSource()

### Community 16 - "pmtiles.js"
Cohesion: 0.12
Nodes (33): rt(), add(), At(), b(), Be(), bt(), constructor(), $e() (+25 more)

### Community 17 - "app.js"
Cohesion: 0.12
Nodes (24): catalogoPromessa, map, MODULI, STRATI, CENTRO, DATI, impostaCatalogo(), LIMITI (+16 more)

### Community 18 - "A"
Cohesion: 0.08
Nodes (3): A(), Hl, ul

### Community 19 - "monumenti_kml.py"
Cohesion: 0.09
Nodes (25): abbina_portale(), _chiavi(), classifica(), _corrispondenza(), deduplica(), _file_foto(), foto(), leggi_kml() (+17 more)

### Community 20 - "valida_dati.py"
Cohesion: 0.10
Nodes (35): Path, lonlat(), main(), Genera js/core/gerarchia.js: gerarchia circoscrizione > quartiere > UPL con il…, tessera(), Fonte, data e licenza dei file usati dal viewer (chiave = percorso in dati/).…, controlla_regole(), controlla_sezioni() (+27 more)

### Community 21 - ".evaluate"
Cohesion: 0.13
Nodes (16): cr(), er(), He(), hr(), ir(), Je(), kr(), lr() (+8 more)

### Community 23 - "constructor"
Cohesion: 0.12
Nodes (17): addTo(), _clearWatch(), constructor(), _createCanvas(), _exitFullscreen(), _focusFirstElement(), _getTitle(), _handleFullscreenChange() (+9 more)

### Community 24 - "ki"
Cohesion: 0.09
Nodes (9): Ai(), completeTask(), k(), ki(), Mi(), process(), processTask(), receive() (+1 more)

### Community 27 - "ta"
Cohesion: 0.05
Nodes (5): d(), gl(), L, ml(), ta

### Community 28 - "ws"
Cohesion: 0.08
Nodes (5): bs, isZooming(), us(), ws, xs

### Community 31 - "trasporto.js"
Cohesion: 0.07
Nodes (55): segnala(), GRUPPI, idPositron, miniatura(), pannello(), scegli(), imposta(), pannello() (+47 more)

### Community 33 - "xr"
Cohesion: 0.07
Nodes (13): ar(), Cl(), dr(), Fr(), jr(), mr(), Nc, pe (+5 more)

### Community 34 - "h"
Cohesion: 0.16
Nodes (3): h(), _isOutOfMapMaxBounds(), _updateCircleRadius()

### Community 35 - "monumenti.js"
Cohesion: 0.13
Nodes (20): aggiungiLayer(), avvia(), collegaPopup(), colore, completo(), contenutoPopup(), creaLegenda(), dettagli (+12 more)

### Community 36 - "el"
Cohesion: 0.10
Nodes (18): Do(), el(), eo(), Fl(), fo, Go(), Ho(), Ko() (+10 more)

### Community 38 - "r"
Cohesion: 0.11
Nodes (3): _down(), r(), _up()

### Community 39 - "_scheda_su"
Cohesion: 0.10
Nodes (21): Porta la mappa al centro, sceglie un punto davvero dentro `layer_hit` e clicca., _scheda_su(), _sezioni_scheda(), test_con_scheda_aperta_toolbar_ricerca_e_legenda_non_si_sovrappongono(), test_icone_delle_altre_sezioni(), test_la_scheda_della_sezione_mostra_gli_indicatori_dell_anno_attivo(), test_le_parti_espandibili_si_riconoscono_come_cliccabili(), test_le_schede_di_catasto_prg_e_vincoli_hanno_l_avviso_legale_una_volta_sola() (+13 more)

### Community 40 - "File Structure"
Cohesion: 0.10
Nodes (20): Digital Twin di Palermo — Fase 0 + Fase 1 Implementation Plan, File Structure, Global Constraints, poi aprire http://127.0.0.1:8000/index.html, Review Focus, Self-Review (eseguita), Task 0: Repository, strumenti e server con Range, Task 10: Terreno, elevazione e griglia DTM (aggiunto su richiesta dell'utente) (+12 more)

### Community 41 - "v"
Cohesion: 0.23
Nodes (10): num(), classe(), fmt(), ha(), riga(), testo(), voceTerreno(), Gc() (+2 more)

### Community 42 - "territorio.js"
Cohesion: 0.14
Nodes (21): pmt(), urlTileset(), aggiorna3D(), piuVicino(), presente(), primo(), righe(), tutti() (+13 more)

### Community 43 - "ye"
Cohesion: 0.12
Nodes (3): finish(), mark(), ye

### Community 48 - "gtfs.py"
Cohesion: 0.09
Nodes (22): costruisci(), _d2(), data_iso(), leggi(), main(), minuti(), nome(), ordine_linea() (+14 more)

### Community 50 - "w"
Cohesion: 0.08
Nodes (4): isStyleLoaded(), qe, w(), Zi

### Community 52 - "popolazione.js"
Cohesion: 0.08
Nodes (31): CONFINI_LABEL_SINGULAR, CONFINI_LEVEL_KEYS, CONFINI_LEVELS, confiniStyle(), DATA_COLORS, DENSITY_LABELS, DENSITY_RAMPS, densityLegendStops() (+23 more)

### Community 53 - ".constructor"
Cohesion: 0.16
Nodes (4): isParsed(), removeSource(), setMethods(), ve

### Community 54 - "Ma"
Cohesion: 0.09
Nodes (5): Ca, hc(), ji(), Ma(), Pa

### Community 57 - "Ht"
Cohesion: 0.14
Nodes (3): Ht, nt(), removeControl()

### Community 58 - ".enable"
Cohesion: 0.14
Nodes (4): ci(), Di(), fi, li()

### Community 59 - ".get"
Cohesion: 0.08
Nodes (6): ac(), cc(), dc, gt(), m(), ra

### Community 60 - "se"
Cohesion: 0.12
Nodes (3): gr(), re(), se

### Community 63 - ".create"
Cohesion: 0.21
Nodes (7): _createButton(), _createCloseButton(), getContainer(), setDOMContent(), setHTML(), setText(), _setupUI()

### Community 67 - "ru"
Cohesion: 0.19
Nodes (5): Hu(), ju, ru(), yu(), Zu()

### Community 68 - "sicurezza_stradale.py"
Cohesion: 0.19
Nodes (21): _con_tasso(), _fc(), _livello(), main(), _pmtiles(), hotspot 95%' -> 95; None per coldspot e «non significativo»., ridotti_archi(), ridotti_hotspot() (+13 more)

### Community 70 - "evidenza.js"
Cohesion: 0.24
Nodes (12): assicuraStrati(), cancellaEvidenza(), collezione(), evidenzia(), FONTI, sceltePerLayer(), soloCliccato(), STRATI (+4 more)

### Community 72 - "indicatori.test.mjs"
Cohesion: 0.19
Nodes (9): INDICATORI, SOPRA_64, SOTTO_15, leggiJson(), RADICE, sha(), ORIGINALE, SOPRA (+1 more)

### Community 74 - "._checkLoaded"
Cohesion: 0.12
Nodes (5): addImage(), addSource(), getLayer(), getLayoutProperty(), isSourceLoaded()

### Community 75 - "zone.js"
Cohesion: 0.23
Nodes (9): GERARCHIA, CAMPI, collegaZone(), LIVELLI, MASCHERA, nomeBreve(), NOMI_CIRC, parti() (+1 more)

### Community 79 - "jc"
Cohesion: 0.22
Nodes (3): jc, Oc, Rc()

### Community 82 - ".parse"
Cohesion: 0.20
Nodes (4): bn(), bt(), vt(), wt()

### Community 84 - "scheda-scuole.js"
Cohesion: 0.33
Nodes (12): chiaveLuogo(), modelloPopupScuola(), righe(), righeScuola(), righeSeggio(), righeSeggioInScuola(), viaCivico(), voceIndirizzo() (+4 more)

### Community 85 - ".pop"
Cohesion: 0.12
Nodes (8): fh(), hh, Ih(), Mh, ph(), pop(), push(), zh()

### Community 87 - "scheda-omi.js"
Cohesion: 0.29
Nodes (9): intervallo(), it(), numero(), pulisci(), SUPERFICIE, voceZona(), vociOmi(), comune (+1 more)

### Community 88 - "un"
Cohesion: 0.15
Nodes (9): dn(), fn(), gn(), ii(), mn(), qn(), ri(), un() (+1 more)

### Community 90 - "Analisi design — Digital Twin Palermo"
Cohesion: 0.22
Nodes (8): 1. Uniformità: token e sistema visivo, 2. Usabilità, 3. Accessibilità, 4. Prestazioni, Analisi design — Digital Twin Palermo, Cosa funziona bene, Impressione generale, Priorità consigliate

### Community 91 - "l"
Cohesion: 0.49
Nodes (4): il(), ja(), nl(), l()

### Community 93 - "Digital Twin di Palermo — inventario e piano"
Cohesion: 0.18
Nodes (10): 1. Obiettivo (da confermare), 2. Inventario dati già disponibili, 2b. Dati fuori da `coseerobe/` (verificati il 2026-09-30), 3. Cosa si potrebbe fare (elenco completo), 4. Approccio consigliato, 5. Architettura proposta, 6. Fasi, 7. Rischi (+2 more)

### Community 95 - "ricerca.js"
Cohesion: 0.16
Nodes (18): cerca(), conCivico(), normalizza(), preparaIndice(), punto(), soloVia(), vieCorrispondenti(), cercaLuoghi() (+10 more)

### Community 96 - "urlDati"
Cohesion: 0.16
Nodes (14): apriCrediti(), AVVISI, caricaCatalogo(), commutaCrediti(), CREDITS, elenco(), GUIDA, urlDati() (+6 more)

### Community 97 - ".parse"
Cohesion: 0.19
Nodes (3): cn(), qt(), Zt()

### Community 99 - "c"
Cohesion: 0.11
Nodes (4): Bc(), c(), fc, pc

### Community 101 - "Digital Twin di Palermo — Fase 0 + Fase 1: design"
Cohesion: 0.20
Nodes (9): 1. Obiettivo e ambito, 2. Esito della validazione dati (fase 0, già eseguita in sola lettura), 3. Architettura, 4. Funzioni del viewer (fase 1), 5. Gestione errori e limiti, 6. Test e verifica, 7. Rischi specifici di questa fase, 8. Decisioni da approvare (+1 more)

### Community 102 - "te"
Cohesion: 0.25
Nodes (3): oe(), te, Xt

### Community 106 - "ne"
Cohesion: 0.10
Nodes (4): ae, ne(), vc, ze()

### Community 108 - "scheda-uso.js"
Cohesion: 0.43
Nodes (4): rigaUso(), USI, voceUsoEdificio(), edificio()

### Community 114 - "kt"
Cohesion: 0.16
Nodes (3): kt(), we, xe

### Community 116 - ".add"
Cohesion: 0.18
Nodes (5): addClassName(), _containerDimensions(), pt, _resizeCanvas(), _setupContainer()

### Community 117 - "an"
Cohesion: 0.09
Nodes (18): an(), en(), jn(), kn(), ln(), nn(), oi(), on() (+10 more)

### Community 120 - "Digital Twin di Palermo"
Cohesion: 0.29
Nodes (6): Avvio, Avvisi, Dati, Digital Twin di Palermo, Struttura, Test

### Community 121 - "RangeRequestHandler"
Cohesion: 0.33
Nodes (3): RangeRequestHandler, SimpleHTTPRequestHandler subclass that supports HTTP Range Requests and adds…, SimpleHTTPRequestHandler

### Community 122 - "scuole.js"
Cohesion: 0.26
Nodes (11): aggiungiLayer(), collegaPopup(), completo(), contenutoPopup(), creaLegenda(), dettagli, el(), ids() (+3 more)

### Community 124 - "Pagina"
Cohesion: 0.22
Nodes (4): Pagina, Coordinate di un punto che la mappa, così com'è, riconosce dentro `layer_hit`.…, Apre il sotto-pannello della barra che contiene l'elemento (se è chiuso)., Sposta la mappa e attende che abbia finito di caricare i tile.

### Community 126 - ".fire"
Cohesion: 0.08
Nodes (3): et(), q, tt()

### Community 127 - "package.json"
Cohesion: 0.33
Nodes (5): name, private, scripts, test:js, type

### Community 129 - "Dati del Digital Twin di Palermo"
Cohesion: 0.22
Nodes (8): Contenuto, Cose da verificare (fase 0), Dati del Digital Twin di Palermo, Monumenti (`monumenti/`), Non copiato, e perché, Scuole e sezioni elettorali (`scuole/`), Sicurezza stradale (`mobilita/sicurezza/`), Trasporto pubblico (`gtfs/` → `trasporto/`)

### Community 130 - "Tematizzazione: da dove viene ogni stile"
Cohesion: 0.40
Nodes (4): Non riprodotto (scelte consapevoli), Scheda del luogo (click sulla mappa), Se uno stile originale cambia, Tematizzazione: da dove viene ogni stile

### Community 132 - "stile-omi.test.mjs"
Cohesion: 0.47
Nodes (3): STILE_OMI, DESTINAZIONE, estrai()

### Community 138 - "wh"
Cohesion: 0.12
Nodes (12): draw(), ec(), eh(), getImageCanvasContext(), getImageData(), nh(), p(), rh() (+4 more)

### Community 140 - "File structure"
Cohesion: 0.20
Nodes (9): File structure, Global Constraints, Review Focus, Self-review, Sicurezza stradale Implementation Plan, Task 1: Pipeline dati (script + PMTiles), Task 2: Modello della scheda, Task 3: Layer, legenda e viewer (+1 more)

### Community 145 - "_righe"
Cohesion: 0.40
Nodes (6): _n_validi(), Quante sezioni hanno un valore per l'indicatore (stessa regola dell'app…, _righe(), test_cambi_rapidi_finiscono_nell_ultimo_stato(), test_popolazione_2021_poi_2023(), test_sezione_2021_senza_dato_2023_resta_senza_valore()

### Community 146 - "Sicurezza stradale (viabilità pericolosa) — design"
Cohesion: 0.20
Nodes (9): Dati, Errori e casi limite, Layer (`js/layers/sicurezza.js`), Obiettivo, Perimetro, Rischi, Scheda (`js/layers/scheda-sicurezza.js`), Sicurezza stradale (viabilità pericolosa) — design (+1 more)

### Community 147 - ".constructor"
Cohesion: 0.16
Nodes (4): getCanvas(), Ns, setMaxPitch(), setMinPitch()

### Community 148 - "_primo_luogo"
Cohesion: 0.22
Nodes (9): _primo_luogo(), parametrize, Punto e nome del primo luogo di dati/scuole/<nome>.geojson che ha anche un…, Il pannello di destra mostra i dati del luogo anche se lo strato è spento…, Il tooltip del trasporto resettava il cursore a ogni mousemove, anche con i…, test_ricerca_trova_scuole_seggi_e_monumenti_e_accende_lo_strato(), test_scheda_scuole_e_seggi_anche_a_strato_spento(), test_strato_scuole_mostra_i_poligoni() (+1 more)

### Community 149 - "test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro"
Cohesion: 0.83
Nodes (4): _contrasto(), _luminanza(), _rgb(), test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro()

### Community 150 - ".push"
Cohesion: 0.11
Nodes (10): ei(), hn(), Mt(), ro(), si(), vh(), xh(), xn (+2 more)

### Community 152 - "Fa"
Cohesion: 0.14
Nodes (3): Fa(), Sa, zs

### Community 153 - "_dati_trasporto"
Cohesion: 0.18
Nodes (12): _dati_trasporto(), _fermata_con_orari(), _muovi_su(), Genera dati/trasporto/ se manca (come per scuole e monumenti: non sta in git);…, Coordinate, nome e id della prima fermata che ha orari., test_filtro_linea_mostra_solo_quella_linea_e_le_sue_fermate_e_si_toglie_col_chip(), test_trasporto_accendere_gli_strati_mostra_linee_e_fermate(), test_trasporto_clic_su_strada_con_molte_linee_una_sola_voce_e_orari_solo_all_apertura() (+4 more)

### Community 154 - "_cerca_e_vai"
Cohesion: 0.33
Nodes (7): _cerca_e_vai(), _civico_reale(), test_ricerca_civico_inesistente_lo_dice_e_nessun_risultato_e_esplicito(), test_ricerca_per_numero_di_sezione_elettorale(), test_ricerca_porta_la_mappa_sul_civico(), test_ricerca_trova_fermata_e_linea_e_accende_lo_strato(), test_ricerca_trova_i_civici_con_lettera()

### Community 156 - "Review Focus"
Cohesion: 0.20
Nodes (9): Global Constraints, Review Focus, Task 1: Script `scripts/gtfs.py` e dati generati, Task 2: Logica pura degli orari (`trasporto-orari.js`), Task 3: Modello scheda e hook `dinamico` in `scheda.js`, Task 4: Layer, DOM degli orari, pannello, evidenza e test browser, Task 5: Ricerca di linee e fermate, Task 6: Crediti, README, grafo e verifica finale (+1 more)

### Community 157 - "scheda-modello.js"
Cohesion: 0.23
Nodes (10): aggiungiGruppo(), conContenuto(), GENERICHE, maiuscoleItaliane(), MANCANTE, NOTA_LEGALE, PARTICELLE, pieno() (+2 more)

### Community 162 - "_arco_con_incidenti"
Cohesion: 0.25
Nodes (8): _arco_con_incidenti(), _dati_sicurezza(), Genera dati/mobilita/sicurezza/*.pmtiles se mancano; salta se non ci sono i…, Punto medio e proprietà di un arco con tasso affidabile e almeno un incidente…, test_sicurezza_accendere_archi_li_disegna(), test_sicurezza_filtro_anno_applica_filtro_agli_incidenti(), test_sicurezza_scheda_arco_anche_a_strato_spento(), test_sicurezza_strati_presenti_e_spenti_di_default()

### Community 163 - "Trasporto pubblico AMAT (GTFS): design"
Cohesion: 0.29
Nodes (6): Dati (`scripts/gtfs.py` → `dati/trasporto/`), Obiettivo, Rischi, Test, Trasporto pubblico AMAT (GTFS): design, Viewer

### Community 165 - "conftest.py"
Cohesion: 0.38
Nodes (6): _browser(), _png_1x1(), _porta_libera(), fixture, PNG 1x1 grigio valido, con CRC corretti (un PNG malformato fa fallire le tile…, server()

### Community 171 - "_attendi_fermo"
Cohesion: 0.50
Nodes (4): _attendi_fermo(), test_clic_sulla_mappa_avvicina_lo_zoom_e_centra_il_punto(), test_scheda_aperta_la_mappa_si_centra_nella_parte_visibile_e_home_pure(), test_scheda_mobile_la_mappa_si_centra_sopra_il_foglio_basso()

## Knowledge Gaps
- **167 isolated node(s):** `MODULI`, `catalogoPromessa`, `map`, `STRATI`, `AVVISI` (+162 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **75 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `.renderLayer`, `o`, `ft`, `ts`, `ds`, `i`, `_update`, `T`, `ls`, `de`, `pmtiles.js`, `A`, `.evaluate`, `is`, `constructor`, `ki`, `.evaluate`, `ba`, `ta`, `ws`, `ot`, `es`, `va`, `xr`, `h`, `el`, `.easeTo`, `r`, `v`, `ye`, `oa`, `U`, `zl`, `Ua`, `.reset`, `w`, `Z`, `.constructor`, `Ma`, `vs`, `Ht`, `.enable`, `.get`, `se`, `resize`, `gs`, `.create`, `ga`, `._validate`, `Yi`, `ru`, `Lt`, `ms`, `X`, `._checkLoaded`, `ql`, `.apply`, `jc`, `.render`, `Ya`, `.parse`, `.preventDefault`, `.pop`, `ct`, `un`, `Ut`, `l`, `j`, `Ss`, `.parse`, `os`, `c`, `fe`, `te`, `S`, `fs`, `hi`, `ne`, `mo`, `.update`, `be`, `.loadMatchingFeature`, `ps`, `za`, `kt`, `.add`, `an`, `cs`, `vi`, `N`, `.fire`, `me`, `wa`, `wi`, `Ic`, `Yt`, `le`, `.constructor`, `wh`, `sl`, `qc`, `.constructor`, `.push`, `hs`, `Fa`, `ys`, `ee`, `ks`, `.reload`, `na`, `.equals`, `la`, `ni`, `po`, `Ou`, `jt`?**
  _High betweenness centrality (0.519) - this node is a cross-community bridge._
- **Why does `l()` connect `l` to `$`, `.renderLayer`, `de`, `pmtiles.js`, `.push`, `Fa`, `trasporto.js`, `xr`, `h`, `ye`, `U`, `Z`, `resize`, `._validate`, `X`, `zone.js`, `.render`, `.parse`, `un`, `an`, `N`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `unisci()` connect `scheda-modello.js` to `.renderLayer`, `monumenti.js`, `evidenza.js`, `scheda.js`, `scheda-uso.js`, `sicurezza.js`, `scheda-scuole.js`, `trasporto.js`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 93 inferred relationships involving `apri()` (e.g. with `test_avvisi_sopra_la_ricerca_si_chiudono_e_spariscono()` and `test_avviso_sul_valore_legale_e_sempre_visibile()`) actually correct?**
  _`apri()` has 93 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MODULI`, `catalogoPromessa`, `map` to the rest of the system?**
  _167 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.025036818851251842 - nodes in this community are weakly interconnected._
- **Should `monumenti.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06862745098039216 - nodes in this community are weakly interconnected._