# Graph Report - DigitalTwin  (2026-10-02)

## Corpus Check
- 107 files · ~216,006 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3257 nodes · 7299 edges · 150 communities (90 shown, 60 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 246 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38e72d7a`
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
- oa
- va
- _update
- Ss
- ls
- scheda-sicurezza.js
- de
- pmtiles.js
- app.js
- ._checkLoaded
- monumenti_kml.py
- valida_dati.py
- .pop
- us
- constructor
- U
- pe
- ba
- ta
- ws
- kt
- .addLayer
- trasporto.js
- ds
- .wrap
- .getSouthEast
- monumenti.js
- el
- ru
- .constructor
- _scheda_su
- File Structure
- terreno.js
- territorio.js
- trasporto-filtro.js
- .bind
- r
- xr
- Ua
- test_sicurezza_stradale.py
- .reset
- T
- Z
- palette.js
- .constructor
- L
- hi
- c
- .recalculate
- Mc
- .get
- le
- resize
- sicurezza.js
- popolazione.js
- la
- gtfs.py
- .preventDefault
- ga
- Lt
- .getZoom
- ms
- X
- .possiblyEvaluate
- .equals
- ql
- test_monumenti.py
- .evaluate
- jc
- w
- Ya
- .push
- Ma
- scuole.js
- fc
- ct
- scheda-omi.js
- to
- Ut
- Analisi design — Digital Twin Palermo
- e
- j
- Digital Twin di Palermo — inventario e piano
- sendAsync
- ricerca.js
- Pa
- Ht
- os
- ye
- hs
- Digital Twin di Palermo — Fase 0 + Fase 1: design
- fs
- es
- i
- mo
- qe
- dc
- .loadMatchingFeature
- conftest.py
- za
- RIPARTENZA.md
- _cerca_e_vai
- .concat
- cs
- Digital Twin di Palermo
- RangeRequestHandler
- A
- wa
- Pagina
- et
- package.json
- _primo_luogo
- Dati del Digital Twin di Palermo
- Tematizzazione: da dove viene ogni stile
- N
- Ic
- sicurezza-filtro.js
- _righe
- as
- _legenda_filtro
- File structure
- catalogo.md
- test_scuole.py
- Sicurezza stradale (viabilità pericolosa) — design
- ki
- S
- ks
- ys
- _dati_trasporto
- .fire
- Review Focus
- ee
- _dati_sicurezza
- Trasporto pubblico AMAT (GTFS): design
- is
- Audit dati e caricamento — 2026-10-02
- qc

## God Nodes (most connected - your core abstractions)
1. `$` - 509 edges
2. `ta` - 144 edges
3. `apri()` - 113 edges
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
- `Z` --indirect_call--> `l()`  [INFERRED]
  js/vendor/maplibre-gl.js → tests/js/trasporto-filtro.test.mjs
- `X()` --references--> `K`  [EXTRACTED]
  js/vendor/maplibre-gl.js → tests/js/monumenti.test.mjs
- `X()` --indirect_call--> `l()`  [INFERRED]
  js/vendor/maplibre-gl.js → tests/js/trasporto-filtro.test.mjs

## Import Cycles
- None detected.

## Communities (150 total, 60 thin omitted)

### Community 0 - "$"
Cohesion: 0.02
Nodes (51): $, ah(), clearMetrics(), completeTask(), _containerDimensions(), Cu(), da(), _diffStyle() (+43 more)

### Community 1 - "monumenti.py"
Cohesion: 0.07
Nodes (50): abbina(), abbina_edifici(), abbina_edificio(), applica_correzioni(), _civico_di(), correggi(), costruisci_feature(), Indice (+42 more)

### Community 2 - ".renderLayer"
Cohesion: 0.10
Nodes (9): Aa, ac(), ea, f(), g(), getPaintProperty(), ia, qi (+1 more)

### Community 3 - "o"
Cohesion: 0.10
Nodes (13): Ao, bo(), _createDelegatedListener(), jo(), No(), o(), off(), once() (+5 more)

### Community 5 - "test_viewer.py"
Cohesion: 0.07
Nodes (54): apri(), apri(blocca=None) -> Pagina. `blocca` è un pattern di URL da far fallire (vince…, Uso «UNK» dell'edificato: dove l'edificio coincide con un poligono di scuola,…, test_avvisi_sopra_la_ricerca_si_chiudono_e_spariscono(), test_avviso_sul_valore_legale_e_sempre_visibile(), test_barra_ricerca_riconosce_il_riferimento_catastale(), test_barra_strumenti_zoom_home_e_schermo_intero(), test_base_cartografica_irraggiungibile_non_blocca_il_viewer() (+46 more)

### Community 6 - "ts"
Cohesion: 0.06
Nodes (5): _cancelRenderFrame(), project(), _requestRenderFrame(), ts, unproject()

### Community 7 - "test_valida_dati.py"
Cohesion: 0.10
Nodes (30): catalogo(), _manifest(), fixture, Piccolo server HTTP locale con CORS: (cartella servita, url base)., _server(), _sezioni(), _sha(), test_leggi_json_dal_remoto_e_dalla_cache() (+22 more)

### Community 8 - "scheda.js"
Cohesion: 0.06
Nodes (67): assicuraStrati(), cancellaEvidenza(), collezione(), evidenzia(), FONTI, sceltePerLayer(), soloCliccato(), STRATI (+59 more)

### Community 10 - "va"
Cohesion: 0.07
Nodes (3): Bi(), va(), xe

### Community 11 - "_update"
Cohesion: 0.05
Nodes (24): addLayer(), addSprite(), _getUIString(), _lazyInitEmptyStyle(), moveLayer(), removeLayer(), removeSprite(), setFilter() (+16 more)

### Community 12 - "Ss"
Cohesion: 0.12
Nodes (9): addImage(), draw(), Dt(), getImageCanvasContext(), getImageData(), Mt(), p(), Ss (+1 more)

### Community 14 - "scheda-sicurezza.js"
Cohesion: 0.23
Nodes (18): GRAVITA, gruppoVia(), ha(), NOTA_CLASSIFICA, NOTA_DATI, num(), pai(), rigaIncidenti() (+10 more)

### Community 15 - "de"
Cohesion: 0.08
Nodes (5): de, getGlyphs(), _getMapId(), getSource(), removeFeatureState()

### Community 16 - "pmtiles.js"
Cohesion: 0.12
Nodes (32): rt(), add(), At(), b(), Be(), bt(), constructor(), $e() (+24 more)

### Community 17 - "app.js"
Cohesion: 0.09
Nodes (30): catalogoPromessa, map, MODULI, STRATI, apriCrediti(), AVVISI, caricaCatalogo(), commutaCrediti() (+22 more)

### Community 19 - "monumenti_kml.py"
Cohesion: 0.09
Nodes (25): abbina_portale(), _chiavi(), classifica(), _corrispondenza(), deduplica(), _file_foto(), foto(), leggi_kml() (+17 more)

### Community 20 - "valida_dati.py"
Cohesion: 0.10
Nodes (35): Path, lonlat(), main(), Genera js/core/gerarchia.js: gerarchia circoscrizione > quartiere > UPL con il…, tessera(), Fonte, data e licenza dei file usati dal viewer (chiave = percorso in dati/).…, controlla_regole(), controlla_sezioni() (+27 more)

### Community 21 - ".pop"
Cohesion: 0.18
Nodes (4): hh, Mh, pop(), push()

### Community 23 - "constructor"
Cohesion: 0.05
Nodes (29): addClassName(), addTo(), _clearWatch(), constructor(), _createButton(), _createCanvas(), _createCloseButton(), _exitFullscreen() (+21 more)

### Community 25 - "pe"
Cohesion: 0.07
Nodes (23): ar(), cr(), dr(), er(), Fr(), gr(), hr(), ir() (+15 more)

### Community 27 - "ta"
Cohesion: 0.06
Nodes (4): d(), gl(), ml(), ta

### Community 28 - "ws"
Cohesion: 0.14
Nodes (4): bs, isZooming(), ws, xs

### Community 29 - "kt"
Cohesion: 0.06
Nodes (8): cn(), jt(), kt(), ot, qt(), Xt, Yt, Zt()

### Community 30 - ".addLayer"
Cohesion: 0.16
Nodes (6): addControl(), getDefaultPosition(), getLayer(), getLayoutProperty(), setLayoutProperty(), setPaintProperty()

### Community 31 - "trasporto.js"
Cohesion: 0.11
Nodes (42): segnala(), raggruppaLinee(), righe(), tooltipFermata(), tooltipLinee(), voceFermata(), voceLinee(), aggiungiLayer() (+34 more)

### Community 32 - "ds"
Cohesion: 0.09
Nodes (5): ds, Fa(), hc(), ji(), Sa

### Community 35 - "monumenti.js"
Cohesion: 0.10
Nodes (29): pmt(), urlDati(), aggiungiSorgenti(), aggiungiSorgenti(), aggiungiLayer(), aggiungiSorgenti(), avvia(), collegaPopup() (+21 more)

### Community 36 - "el"
Cohesion: 0.12
Nodes (11): el(), eo(), fo, Go(), Ho(), Ko(), Oo(), po() (+3 more)

### Community 37 - "ru"
Cohesion: 0.15
Nodes (5): ju, Ou, ru(), yu(), Zu()

### Community 38 - ".constructor"
Cohesion: 0.21
Nodes (3): Ns, setMaxPitch(), setMinPitch()

### Community 39 - "_scheda_su"
Cohesion: 0.08
Nodes (29): _attendi_fermo(), _contrasto(), _luminanza(), Porta la mappa al centro, sceglie un punto davvero dentro `layer_hit` e clicca., _rgb(), _scheda_su(), _sezioni_scheda(), test_clic_sulla_mappa_avvicina_lo_zoom_e_centra_il_punto() (+21 more)

### Community 40 - "File Structure"
Cohesion: 0.10
Nodes (20): Digital Twin di Palermo — Fase 0 + Fase 1 Implementation Plan, File Structure, Global Constraints, poi aprire http://127.0.0.1:8000/index.html, Review Focus, Self-Review (eseguita), Task 0: Repository, strumenti e server con Range, Task 10: Terreno, elevazione e griglia DTM (aggiunto su richiesta dell'utente) (+12 more)

### Community 41 - "terreno.js"
Cohesion: 0.14
Nodes (14): urlTileset(), ELEVATION_STOPS, HILLSHADE_COLORS, classe(), fmt(), ha(), riga(), testo() (+6 more)

### Community 42 - "territorio.js"
Cohesion: 0.12
Nodes (19): piuVicino(), presente(), primo(), righe(), tutti(), voci(), rigaUso(), USI (+11 more)

### Community 43 - "trasporto-filtro.js"
Cohesion: 0.18
Nodes (11): GRUPPI, idPositron, miniatura(), pannello(), scegli(), BASE, collegaFiltroLinea(), filtriPerLinea() (+3 more)

### Community 44 - ".bind"
Cohesion: 0.10
Nodes (3): Ke, pn(), Yi

### Community 45 - "r"
Cohesion: 0.12
Nodes (3): _down(), r(), _up()

### Community 46 - "xr"
Cohesion: 0.13
Nodes (4): Cl(), Pl(), Tu, xr()

### Community 48 - "test_sicurezza_stradale.py"
Cohesion: 0.13
Nodes (37): classifica_vie(), _con_tasso(), _fc(), _livello(), main(), _pmtiles(), Una riga per via con nome: incidenti (solo snap affidabile), mortali, km, punto…, {nome via: {rango, gravita_km, mortali, incidenti, km}} per le `top` vie con… (+29 more)

### Community 50 - "T"
Cohesion: 0.14
Nodes (4): getImage(), loadImage(), T(), updateImage()

### Community 52 - "palette.js"
Cohesion: 0.12
Nodes (19): CONFINI_LABEL_SINGULAR, CONFINI_LEVEL_KEYS, CONFINI_LEVELS, confiniStyle(), DATA_COLORS, DENSITY_LABELS, DENSITY_RAMPS, EDIFICATO_NEUTRAL (+11 more)

### Community 53 - ".constructor"
Cohesion: 0.17
Nodes (4): isParsed(), removeSource(), setMethods(), ve

### Community 55 - "hi"
Cohesion: 0.06
Nodes (10): ci(), Di(), fi, hi(), li(), oi(), pi(), Ti() (+2 more)

### Community 59 - ".get"
Cohesion: 0.11
Nodes (5): at, gt(), vh(), vt(), xi()

### Community 62 - "sicurezza.js"
Cohesion: 0.18
Nodes (16): filtroInsieme(), voceFiltro(), voceStrato(), creaLegenda(), aggiungiLayer(), collegaTooltip(), COLORI_HOTSPOT, COLORI_TASSO (+8 more)

### Community 63 - "popolazione.js"
Cohesion: 0.08
Nodes (28): INDICATORI, num(), SOPRA_64, SOTTO_15, densityLegendStops(), densityStops(), applica(), avvia() (+20 more)

### Community 65 - "la"
Cohesion: 0.29
Nodes (3): getCanvasContainer(), getContainer(), la()

### Community 66 - "gtfs.py"
Cohesion: 0.06
Nodes (37): codifica_civici(), codifica_orari(), codifica_popolazione(), main(), Versioni compatte dei dati tabellari, che il viewer scarica al posto dei JSON…, Lista di record -> un array per campo (null dove il campo manca), solo i campi…, Ogni gruppo {d, s, t} diventa [d, s, primo orario, differenze successive]: gli…, {via: {civico: [lon, lat]}} -> {via: [civici, lon, lat]}, coordinate in micro-… (+29 more)

### Community 68 - "ga"
Cohesion: 0.11
Nodes (3): ga, Ha(), na

### Community 76 - "ql"
Cohesion: 0.09
Nodes (3): ql, sl, zl

### Community 78 - ".evaluate"
Cohesion: 0.07
Nodes (11): ae, Gc(), ie(), il(), ja(), ne(), nl(), oe() (+3 more)

### Community 79 - "jc"
Cohesion: 0.20
Nodes (3): jc, Oc, Rc()

### Community 80 - "w"
Cohesion: 0.17
Nodes (3): isStyleLoaded(), w(), Zi

### Community 82 - ".push"
Cohesion: 0.08
Nodes (17): bt(), ch, finish(), h(), m(), oh(), re(), ro() (+9 more)

### Community 83 - "Ma"
Cohesion: 0.07
Nodes (5): ge, Ma(), me, wi(), ze()

### Community 84 - "scuole.js"
Cohesion: 0.16
Nodes (23): chiaveLuogo(), GENERICHE, modelloPopupScuola(), righe(), righeScuola(), righeSeggio(), righeSeggioInScuola(), viaCivico() (+15 more)

### Community 87 - "scheda-omi.js"
Cohesion: 0.29
Nodes (9): intervallo(), it(), numero(), pulisci(), SUPERFICIE, voceZona(), vociOmi(), comune (+1 more)

### Community 88 - "to"
Cohesion: 0.11
Nodes (5): Do(), Hl, to(), vc, Yl()

### Community 90 - "Analisi design — Digital Twin Palermo"
Cohesion: 0.22
Nodes (8): 1. Uniformità: token e sistema visivo, 2. Usabilità, 3. Accessibilità, 4. Prestazioni, Analisi design — Digital Twin Palermo, Cosa funziona bene, Impressione generale, Priorità consigliate

### Community 91 - "e"
Cohesion: 0.15
Nodes (3): e(), getCanvas(), getSky()

### Community 93 - "Digital Twin di Palermo — inventario e piano"
Cohesion: 0.18
Nodes (10): 1. Obiettivo (da confermare), 2. Inventario dati già disponibili, 2b. Dati fuori da `coseerobe/` (verificati il 2026-09-30), 3. Cosa si potrebbe fare (elenco completo), 4. Approccio consigliato, 5. Architettura proposta, 6. Fasi, 7. Rischi (+2 more)

### Community 95 - "ricerca.js"
Cohesion: 0.06
Nodes (45): daColonne(), decodificaCivici(), decodificaOrari(), GERARCHIA, cerca(), conCivico(), normalizza(), preparaIndice() (+37 more)

### Community 101 - "Digital Twin di Palermo — Fase 0 + Fase 1: design"
Cohesion: 0.20
Nodes (9): 1. Obiettivo e ambito, 2. Esito della validazione dati (fase 0, già eseguita in sola lettura), 3. Architettura, 4. Funzioni del viewer (fase 1), 5. Gestione errori e limiti, 6. Test e verifica, 7. Rischi specifici di questa fase, 8. Decisioni da approvare (+1 more)

### Community 109 - "dc"
Cohesion: 0.10
Nodes (5): cc(), dc, ec(), ph(), wh()

### Community 112 - "conftest.py"
Cohesion: 0.38
Nodes (6): _browser(), _png_1x1(), _porta_libera(), fixture, PNG 1x1 grigio valido, con CRC corretti (un PNG malformato fa fallire le tile…, server()

### Community 116 - "_cerca_e_vai"
Cohesion: 0.33
Nodes (7): _cerca_e_vai(), _civico_reale(), test_ricerca_civico_inesistente_lo_dice_e_nessun_risultato_e_esplicito(), test_ricerca_per_numero_di_sezione_elettorale(), test_ricerca_porta_la_mappa_sul_civico(), test_ricerca_trova_fermata_e_linea_e_accende_lo_strato(), test_ricerca_trova_i_civici_con_lettera()

### Community 117 - ".concat"
Cohesion: 0.05
Nodes (33): an(), bn(), dn(), ei(), en(), fe, fn(), gn() (+25 more)

### Community 120 - "Digital Twin di Palermo"
Cohesion: 0.29
Nodes (6): Avvio, Avvisi, Dati, Digital Twin di Palermo, Struttura, Test

### Community 121 - "RangeRequestHandler"
Cohesion: 0.33
Nodes (3): RangeRequestHandler, SimpleHTTPRequestHandler subclass that supports HTTP Range Requests and adds…, SimpleHTTPRequestHandler

### Community 124 - "Pagina"
Cohesion: 0.22
Nodes (4): Pagina, Coordinate di un punto che la mappa, così com'è, riconosce dentro `layer_hit`.…, Apre il sotto-pannello della barra che contiene l'elemento (se è chiuso)., Sposta la mappa e attende che abbia finito di caricare i tile.

### Community 127 - "package.json"
Cohesion: 0.33
Nodes (5): name, private, scripts, test:js, type

### Community 128 - "_primo_luogo"
Cohesion: 0.22
Nodes (9): _primo_luogo(), parametrize, Punto e nome del primo luogo di dati/scuole/<nome>.geojson che ha anche un…, Il pannello di destra mostra i dati del luogo anche se lo strato è spento…, Il tooltip del trasporto resettava il cursore a ogni mousemove, anche con i…, test_ricerca_trova_scuole_seggi_e_monumenti_e_accende_lo_strato(), test_scheda_scuole_e_seggi_anche_a_strato_spento(), test_strato_scuole_mostra_i_poligoni() (+1 more)

### Community 129 - "Dati del Digital Twin di Palermo"
Cohesion: 0.22
Nodes (8): Contenuto, Cose da verificare (fase 0), Dati del Digital Twin di Palermo, Monumenti (`monumenti/`), Non copiato, e perché, Scuole e sezioni elettorali (`scuole/`), Sicurezza stradale (`mobilita/sicurezza/`), Trasporto pubblico (`gtfs/` → `trasporto/`)

### Community 130 - "Tematizzazione: da dove viene ogni stile"
Cohesion: 0.40
Nodes (4): Non riprodotto (scelte consapevoli), Scheda del luogo (click sulla mappa), Se uno stile originale cambia, Tematizzazione: da dove viene ogni stile

### Community 135 - "sicurezza-filtro.js"
Cohesion: 0.38
Nodes (8): ANNI, etichetteChip(), filtroIncidenti(), NOME_GRAVITA_CHIP, pieno(), ZOOM_BASE, ZOOM_FILTRATO, zoomMinimo()

### Community 137 - "_righe"
Cohesion: 0.40
Nodes (6): _n_validi(), Quante sezioni hanno un valore per l'indicatore (stessa regola dell'app…, _righe(), test_cambi_rapidi_finiscono_nell_ultimo_stato(), test_popolazione_2021_poi_2023(), test_sezione_2021_senza_dato_2023_resta_senza_valore()

### Community 139 - "_legenda_filtro"
Cohesion: 0.40
Nodes (5): _legenda_filtro(), Accende lo strato, spegne la voce di legenda e restituisce il filtro del layer;…, test_legende_omi_ogni_fascia_filtra_le_zone(), test_legende_scuole_tipo_filtra_i_punti(), test_legende_sicurezza_tasso_hotspot_e_gravita()

### Community 140 - "File structure"
Cohesion: 0.20
Nodes (9): File structure, Global Constraints, Review Focus, Self-review, Sicurezza stradale Implementation Plan, Task 1: Pipeline dati (script + PMTiles), Task 2: Modello della scheda, Task 3: Layer, legenda e viewer (+1 more)

### Community 146 - "Sicurezza stradale (viabilità pericolosa) — design"
Cohesion: 0.20
Nodes (9): Dati, Errori e casi limite, Layer (`js/layers/sicurezza.js`), Obiettivo, Perimetro, Rischi, Scheda (`js/layers/scheda-sicurezza.js`), Sicurezza stradale (viabilità pericolosa) — design (+1 more)

### Community 147 - "ki"
Cohesion: 0.15
Nodes (3): Ai(), ki(), Mi()

### Community 153 - "_dati_trasporto"
Cohesion: 0.14
Nodes (15): _dati_trasporto(), _fermata_con_orari(), _muovi_su(), Genera dati/trasporto/ se manca (come per scuole e monumenti: non sta in git);…, Coordinate, nome e id della prima fermata che ha orari., Confini e sicurezza sotto lo stesso cursore: un solo riquadro con due sezioni,…, test_filtro_linea_mostra_solo_quella_linea_e_le_sue_fermate_e_si_toglie_col_chip(), test_legende_trasporto_voce_spegne_lo_strato() (+7 more)

### Community 154 - ".fire"
Cohesion: 0.11
Nodes (6): addSource(), ce, getFeatureState(), hasImage(), q, ue()

### Community 156 - "Review Focus"
Cohesion: 0.20
Nodes (9): Global Constraints, Review Focus, Task 1: Script `scripts/gtfs.py` e dati generati, Task 2: Logica pura degli orari (`trasporto-orari.js`), Task 3: Modello scheda e hook `dinamico` in `scheda.js`, Task 4: Layer, DOM degli orari, pannello, evidenza e test browser, Task 5: Ricerca di linee e fermate, Task 6: Crediti, README, grafo e verifica finale (+1 more)

### Community 162 - "_dati_sicurezza"
Cohesion: 0.12
Nodes (20): _apri_scheda_arco(), _arco_con_incidenti(), _arco_della_via_in_classifica(), _dati_sicurezza(), Genera dati/mobilita/sicurezza/*.pmtiles se mancano; salta se non ci sono i…, Punto medio e proprietà di un arco con tasso affidabile e almeno un incidente…, Punto medio e proprietà di un arco della via al posto `rango` della classifica…, test_scheda_personalizza_nasconde_una_riga_e_la_scelta_resta_dopo_la_ricarica() (+12 more)

### Community 163 - "Trasporto pubblico AMAT (GTFS): design"
Cohesion: 0.29
Nodes (6): Dati (`scripts/gtfs.py` → `dati/trasporto/`), Obiettivo, Rischi, Test, Trasporto pubblico AMAT (GTFS): design, Viewer

### Community 166 - "Audit dati e caricamento — 2026-10-02"
Cohesion: 0.50
Nodes (3): Audit dati e caricamento — 2026-10-02, Audit di caricamento, Spostamento dei dati non usati

## Knowledge Gaps
- **185 isolated node(s):** `MODULI`, `catalogoPromessa`, `map`, `STRATI`, `AVVISI` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `.renderLayer`, `o`, `ft`, `ts`, `oa`, `va`, `_update`, `Ss`, `ls`, `de`, `pmtiles.js`, `._checkLoaded`, `.pop`, `us`, `constructor`, `U`, `pe`, `ba`, `ta`, `ws`, `kt`, `.addLayer`, `ds`, `.wrap`, `.getSouthEast`, `el`, `ru`, `.constructor`, `.bind`, `r`, `xr`, `Ua`, `.reset`, `T`, `Z`, `.constructor`, `L`, `hi`, `c`, `.recalculate`, `Mc`, `.get`, `le`, `resize`, `la`, `.preventDefault`, `ga`, `Lt`, `.getZoom`, `ms`, `X`, `.possiblyEvaluate`, `.equals`, `ql`, `.evaluate`, `jc`, `w`, `Ya`, `.push`, `Ma`, `fc`, `ct`, `to`, `Ut`, `e`, `j`, `sendAsync`, `Pa`, `Ht`, `os`, `ye`, `hs`, `fs`, `es`, `i`, `mo`, `qe`, `dc`, `.loadMatchingFeature`, `za`, `.concat`, `cs`, `A`, `wa`, `et`, `N`, `Ic`, `as`, `ki`, `S`, `ks`, `ys`, `.fire`, `ee`, `is`, `qc`?**
  _High betweenness centrality (0.485) - this node is a cross-community bridge._
- **Why does `v()` connect `.push` to `$`, `.renderLayer`, `ru`, `scheda.js`, `terreno.js`, `scheda-sicurezza.js`, `.evaluate`, `w`, `Ya`, `pmtiles.js`, `scheda-omi.js`, `popolazione.js`, `ricerca.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `l()` connect `.push` to `ds`, `.renderLayer`, `N`, `X`, `trasporto-filtro.js`, `.bind`, `.evaluate`, `pmtiles.js`, `Z`, `.concat`, `U`, `pe`, `.fire`, `resize`, `ricerca.js`, `trasporto.js`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 110 inferred relationships involving `apri()` (e.g. with `test_avvisi_sopra_la_ricerca_si_chiudono_e_spariscono()` and `test_avviso_sul_valore_legale_e_sempre_visibile()`) actually correct?**
  _`apri()` has 110 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MODULI`, `catalogoPromessa`, `map` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.02307206068268015 - nodes in this community are weakly interconnected._
- **Should `monumenti.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06568832983927324 - nodes in this community are weakly interconnected._