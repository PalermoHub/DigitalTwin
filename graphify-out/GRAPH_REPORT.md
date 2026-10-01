# Graph Report - DigitalTwin  (2026-10-01)

## Corpus Check
- 47 files · ~170,251 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2567 nodes · 5803 edges · 143 communities (76 shown, 67 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `999d313c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- $
- kt
- .renderLayer
- hi
- ft
- test_viewer.py
- ts
- test_valida_dati.py
- popolazione.js
- oa
- ye
- el
- constructor
- ls
- .push
- de
- pmtiles.js
- app.js
- ru
- ne
- valida_dati.py
- ql
- .get
- an
- dc
- _update
- ba
- ta
- ws
- .easeTo
- Ut
- .preventDefault
- vs
- .evaluate
- h
- o
- xr
- r
- .evaluate
- q
- File Structure
- terreno.js
- territorio.js
- scheda.js
- sendAsync
- ae
- Ya
- Ua
- .fire
- .reset
- T
- Z
- ki
- .constructor
- pe
- is
- ia
- Pa
- es
- se
- resize
- Ma
- ea
- ga
- wi
- A
- .constructor
- w
- Lt
- e
- ms
- indicatori.test.mjs
- .add
- .addLayer
- qi
- ._validate
- Fa
- Ht
- jc
- ps
- us
- zs
- rs
- le
- .pop
- X
- scheda-omi.js
- .setEventedParent
- N
- Ke
- ._checkLoaded
- j
- Digital Twin di Palermo — inventario e piano
- Ss
- .update
- .getRenderableIds
- U
- os
- S
- Digital Twin di Palermo — Fase 0 + Fase 1: design
- .remove
- ._applyUpdatedTransform
- fs
- .replace
- gs
- mo
- ct
- Yc
- na
- Zc
- qe
- za
- Pagina
- L
- Mc
- wa
- cs
- d
- Digital Twin di Palermo
- RangeRequestHandler
- conftest.py
- stile-omi.test.mjs
- b
- remove
- ni
- package.json
- _righe
- Dati del Digital Twin di Palermo
- Tematizzazione: da dove viene ogni stile
- _setupContainer
- ii
- hs
- Ic
- ks
- li
- qc
- qs
- ys
- test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro
- catalogo.md

## God Nodes (most connected - your core abstractions)
1. `$` - 509 edges
2. `ta` - 144 edges
3. `de` - 80 edges
4. `ts` - 67 edges
5. `e()` - 51 edges
6. `Ut()` - 50 edges
7. `constructor()` - 49 edges
8. `va()` - 48 edges
9. `_update()` - 45 edges
10. `apri()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `_righe()` --calls--> `leggi_json()`  [INFERRED]
  tests/test_viewer.py → scripts/valida_dati.py
- `_via_reale()` --calls--> `leggi_json()`  [INFERRED]
  tests/test_viewer.py → scripts/valida_dati.py
- `num()` --indirect_call--> `v()`  [INFERRED]
  js/core/indicatori.js → js/vendor/maplibre-gl.js
- `carica()` --indirect_call--> `rec()`  [INFERRED]
  js/layers/popolazione.js → tests/js/indicatori.test.mjs
- `applica()` --indirect_call--> `rec()`  [INFERRED]
  js/layers/popolazione.js → tests/js/indicatori.test.mjs

## Import Cycles
- None detected.

## Communities (143 total, 67 thin omitted)

### Community 0 - "$"
Cohesion: 0.03
Nodes (28): $, addControl(), ah(), ch, Cu(), da(), dn(), fh() (+20 more)

### Community 1 - "kt"
Cohesion: 0.05
Nodes (11): cn(), gn(), jt(), kt(), oe(), ot, qt(), te (+3 more)

### Community 2 - ".renderLayer"
Cohesion: 0.08
Nodes (4): Bi(), ie(), va(), Yi

### Community 3 - "hi"
Cohesion: 0.06
Nodes (8): Di(), hi(), Hl, oi(), ui(), vc, vn(), Yl()

### Community 5 - "test_viewer.py"
Cohesion: 0.11
Nodes (39): apri(), apri(blocca=None) -> Pagina. `blocca` è un pattern di URL da far fallire (vince…, Porta la mappa al centro, sceglie un punto davvero dentro `layer_hit` e clicca., _scheda_su(), _sezioni_scheda(), test_base_cartografica_irraggiungibile_non_blocca_il_viewer(), test_carica_senza_errori(), test_catasto_carica_particelle_a_zoom_17() (+31 more)

### Community 6 - "ts"
Cohesion: 0.07
Nodes (5): _cancelRenderFrame(), _requestRenderFrame(), setMaxZoom(), setMinZoom(), ts

### Community 7 - "test_valida_dati.py"
Cohesion: 0.10
Nodes (28): catalogo(), _manifest(), fixture, Piccolo server HTTP locale con CORS: (cartella servita, url base)., _server(), _sezioni(), _sha(), test_leggi_json_dal_remoto_e_dalla_cache() (+20 more)

### Community 8 - "popolazione.js"
Cohesion: 0.09
Nodes (29): CONFINI_LABEL_SINGULAR, CONFINI_LEVEL_KEYS, CONFINI_LEVELS, confiniStyle(), DATA_COLORS, DENSITY_LABELS, DENSITY_RAMPS, densityLegendStops() (+21 more)

### Community 9 - "oa"
Cohesion: 0.07
Nodes (3): ds, oa, uc()

### Community 10 - "ye"
Cohesion: 0.06
Nodes (5): Bc(), c(), fc, pc, ye

### Community 11 - "el"
Cohesion: 0.08
Nodes (19): Do(), el(), eo(), fo, Go(), Ho(), Ko(), lo() (+11 more)

### Community 12 - "constructor"
Cohesion: 0.07
Nodes (25): ci(), constructor(), _createButton(), _createCanvas(), _createCloseButton(), _exitFullscreen(), finish(), _focusFirstElement() (+17 more)

### Community 14 - ".push"
Cohesion: 0.11
Nodes (7): ei(), fe, la(), si(), vt(), xn, y()

### Community 16 - "pmtiles.js"
Cohesion: 0.12
Nodes (33): rt(), add(), At(), b(), Be(), bt(), constructor(), $e() (+25 more)

### Community 17 - "app.js"
Cohesion: 0.11
Nodes (26): catalogoPromessa, map, MODULI, apriCrediti(), AVVISI, caricaCatalogo(), CENTRO, DATI (+18 more)

### Community 18 - "ru"
Cohesion: 0.09
Nodes (9): fi, Hu(), i(), ju, Ou, ru(), Ti(), yu() (+1 more)

### Community 19 - "ne"
Cohesion: 0.08
Nodes (7): bt(), ge, me, ne(), we, wt(), xe

### Community 20 - "valida_dati.py"
Cohesion: 0.12
Nodes (30): Path, Fonte, data e licenza dei file usati dal viewer (chiave = percorso in dati/).…, controlla_regole(), controlla_sezioni(), controlla_tileset(), costruisci_catalogo(), _dettagli(), epsg_di() (+22 more)

### Community 21 - "ql"
Cohesion: 0.09
Nodes (3): ql, sl, zl

### Community 22 - ".get"
Cohesion: 0.13
Nodes (7): ac(), gt(), m(), ra, vh(), xh(), xi()

### Community 23 - "an"
Cohesion: 0.10
Nodes (21): an(), bn(), en(), hn(), jn(), kn(), ln(), mn() (+13 more)

### Community 24 - "dc"
Cohesion: 0.11
Nodes (3): cc(), dc, wh()

### Community 25 - "_update"
Cohesion: 0.09
Nodes (25): addLayer(), addSprite(), _lazyInitEmptyStyle(), moveLayer(), removeFeatureState(), removeLayer(), removeSprite(), setFilter() (+17 more)

### Community 27 - "ta"
Cohesion: 0.09
Nodes (4): gl(), ml(), ta, wl()

### Community 28 - "ws"
Cohesion: 0.13
Nodes (4): bs, isZooming(), ws, xs

### Community 31 - ".preventDefault"
Cohesion: 0.13
Nodes (3): Ns, setMaxPitch(), setMinPitch()

### Community 33 - ".evaluate"
Cohesion: 0.15
Nodes (15): cr(), er(), hr(), ir(), Je(), kr(), lr(), nr() (+7 more)

### Community 34 - "h"
Cohesion: 0.15
Nodes (3): h(), _isOutOfMapMaxBounds(), _updateCircleRadius()

### Community 35 - "o"
Cohesion: 0.11
Nodes (12): Ao, bo(), _createDelegatedListener(), jo(), No(), o(), off(), once() (+4 more)

### Community 36 - "xr"
Cohesion: 0.09
Nodes (12): ar(), Cl(), dr(), Fr(), jr(), mr(), Pl(), tr() (+4 more)

### Community 37 - "r"
Cohesion: 0.12
Nodes (4): _down(), getCanvasContainer(), r(), _up()

### Community 38 - ".evaluate"
Cohesion: 0.17
Nodes (5): Gc(), il(), ja(), nl(), sc()

### Community 40 - "File Structure"
Cohesion: 0.10
Nodes (20): Digital Twin di Palermo — Fase 0 + Fase 1 Implementation Plan, File Structure, Global Constraints, poi aprire http://127.0.0.1:8000/index.html, Review Focus, Self-Review (eseguita), Task 0: Repository, strumenti e server con Range, Task 10: Terreno, elevazione e griglia DTM (aggiunto su richiesta dell'utente) (+12 more)

### Community 41 - "terreno.js"
Cohesion: 0.15
Nodes (13): urlTileset(), ELEVATION_STOPS, HILLSHADE_COLORS, classe(), fmt(), ha(), riga(), testo() (+5 more)

### Community 42 - "territorio.js"
Cohesion: 0.20
Nodes (14): pmt(), piuVicino(), presente(), primo(), righe(), tutti(), aggiungiSorgenti(), aggiungiSorgenti() (+6 more)

### Community 43 - "scheda.js"
Cohesion: 0.25
Nodes (15): collegaScheda(), disegnaAccordion(), disegnaGruppo(), disegnaLink(), disegnaRiga(), disegnaSezione(), el(), icona() (+7 more)

### Community 44 - "sendAsync"
Cohesion: 0.13
Nodes (3): k(), Lc(), sendAsync()

### Community 45 - "ae"
Cohesion: 0.10
Nodes (3): ae, ee(), xc

### Community 50 - "T"
Cohesion: 0.16
Nodes (3): getImage(), loadImage(), T()

### Community 52 - "ki"
Cohesion: 0.12
Nodes (7): Ai(), completeTask(), ki(), Mi(), process(), processTask(), receive()

### Community 53 - ".constructor"
Cohesion: 0.17
Nodes (4): isParsed(), removeSource(), setMethods(), ve

### Community 54 - "pe"
Cohesion: 0.12
Nodes (3): Nc, pe, ze()

### Community 57 - "ia"
Cohesion: 0.16
Nodes (5): Aa, ec(), f(), g(), ia

### Community 60 - "se"
Cohesion: 0.13
Nodes (3): gr(), re(), se

### Community 62 - "Ma"
Cohesion: 0.16
Nodes (3): hc(), ji(), Ma()

### Community 65 - "wi"
Cohesion: 0.12
Nodes (3): Gi, Kl, wi()

### Community 68 - "w"
Cohesion: 0.17
Nodes (3): isStyleLoaded(), w(), Zi

### Community 70 - "e"
Cohesion: 0.14
Nodes (3): e(), getCanvas(), Ka()

### Community 72 - "indicatori.test.mjs"
Cohesion: 0.18
Nodes (10): INDICATORI, num(), SOPRA_64, SOTTO_15, leggiJson(), RADICE, sha(), ORIGINALE (+2 more)

### Community 73 - ".add"
Cohesion: 0.16
Nodes (6): addClassName(), Dt(), Mt(), pt, _setErrorState(), trackPointer()

### Community 74 - ".addLayer"
Cohesion: 0.22
Nodes (4): addSource(), getLayer(), getLayoutProperty(), getPaintProperty()

### Community 79 - "jc"
Cohesion: 0.15
Nodes (3): jc, Oc, Rc()

### Community 82 - "zs"
Cohesion: 0.18
Nodes (4): Fl(), setTerrain(), tl(), zs

### Community 85 - ".pop"
Cohesion: 0.18
Nodes (4): hh, Mh, pop(), push()

### Community 87 - "scheda-omi.js"
Cohesion: 0.29
Nodes (9): intervallo(), it(), numero(), pulisci(), SUPERFICIE, voceZona(), vociOmi(), comune (+1 more)

### Community 88 - ".setEventedParent"
Cohesion: 0.17
Nodes (3): addImage(), isSourceLoaded(), nt()

### Community 93 - "Digital Twin di Palermo — inventario e piano"
Cohesion: 0.18
Nodes (10): 1. Obiettivo (da confermare), 2. Inventario dati già disponibili, 2b. Dati fuori da `coseerobe/` (verificati il 2026-09-30), 3. Cosa si potrebbe fare (elenco completo), 4. Approccio consigliato, 5. Architettura proposta, 6. Fasi, 7. Rischi (+2 more)

### Community 101 - "Digital Twin di Palermo — Fase 0 + Fase 1: design"
Cohesion: 0.20
Nodes (9): 1. Obiettivo e ambito, 2. Esito della validazione dati (fase 0, già eseguita in sola lettura), 3. Architettura, 4. Funzioni del viewer (fase 1), 5. Gestione errori e limiti, 6. Test e verifica, 7. Rischi specifici di questa fase, 8. Decisioni da approvare (+1 more)

### Community 102 - ".remove"
Cohesion: 0.27
Nodes (5): addTo(), _clearWatch(), removeClassName(), setLngLat(), trigger()

### Community 105 - ".replace"
Cohesion: 0.20
Nodes (4): getImageCanvasContext(), getImageData(), p(), updateImage()

### Community 109 - "Yc"
Cohesion: 0.25
Nodes (7): draw(), eh(), nh(), rh(), th(), Wc(), Yc

### Community 114 - "Pagina"
Cohesion: 0.28
Nodes (3): Pagina, Sposta la mappa e attende che abbia finito di caricare i tile., Coordinate di un punto che la mappa, così com'è, riconosce dentro `layer_hit`.…

### Community 120 - "Digital Twin di Palermo"
Cohesion: 0.29
Nodes (6): Avvio, Avvisi, Dati, Digital Twin di Palermo, Struttura, Test

### Community 121 - "RangeRequestHandler"
Cohesion: 0.33
Nodes (3): RangeRequestHandler, SimpleHTTPRequestHandler subclass that supports HTTP Range Requests and adds…, SimpleHTTPRequestHandler

### Community 122 - "conftest.py"
Cohesion: 0.38
Nodes (6): _browser(), _png_1x1(), _porta_libera(), fixture, PNG 1x1 grigio valido, con CRC corretti (un PNG malformato fa fallire le tile…, server()

### Community 123 - "stile-omi.test.mjs"
Cohesion: 0.47
Nodes (3): STILE_OMI, DESTINAZIONE, estrai()

### Community 125 - "remove"
Cohesion: 0.40
Nodes (6): clearMetrics(), _diffStyle(), remove(), setStyle(), _updateDiff(), _updateStyle()

### Community 127 - "package.json"
Cohesion: 0.33
Nodes (5): name, private, scripts, test:js, type

### Community 128 - "_righe"
Cohesion: 0.40
Nodes (6): _n_validi(), Quante sezioni hanno un valore per l'indicatore (stessa regola dell'app…, _righe(), test_cambi_rapidi_finiscono_nell_ultimo_stato(), test_popolazione_2021_poi_2023(), test_sezione_2021_senza_dato_2023_resta_senza_valore()

### Community 129 - "Dati del Digital Twin di Palermo"
Cohesion: 0.40
Nodes (4): Contenuto, Cose da verificare (fase 0), Dati del Digital Twin di Palermo, Non copiato, e perché

### Community 130 - "Tematizzazione: da dove viene ogni stile"
Cohesion: 0.40
Nodes (4): Non riprodotto (scelte consapevoli), Scheda del luogo (click sulla mappa), Se uno stile originale cambia, Tematizzazione: da dove viene ogni stile

### Community 131 - "_setupContainer"
Cohesion: 0.40
Nodes (5): _containerDimensions(), _getClampedPixelRatio(), getPixelRatio(), _resizeCanvas(), _setupContainer()

### Community 140 - "test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro"
Cohesion: 0.83
Nodes (4): _contrasto(), _luminanza(), _rgb(), test_pannello_e_scheda_hanno_sfondo_chiaro_e_testo_a_contrasto_anche_con_sistema_scuro()

## Knowledge Gaps
- **84 isolated node(s):** `MODULI`, `catalogoPromessa`, `map`, `AVVISI`, `DATI` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **67 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `kt`, `.renderLayer`, `hi`, `ft`, `ts`, `oa`, `ye`, `el`, `constructor`, `ls`, `.push`, `de`, `pmtiles.js`, `ru`, `ne`, `ql`, `.get`, `an`, `dc`, `_update`, `ba`, `ta`, `ws`, `.easeTo`, `Ut`, `.preventDefault`, `vs`, `.evaluate`, `h`, `o`, `xr`, `r`, `.evaluate`, `q`, `terreno.js`, `sendAsync`, `ae`, `Ya`, `Ua`, `.fire`, `.reset`, `T`, `Z`, `ki`, `.constructor`, `pe`, `is`, `ia`, `Pa`, `es`, `se`, `resize`, `Ma`, `ea`, `ga`, `wi`, `A`, `.constructor`, `w`, `Lt`, `e`, `ms`, `.add`, `.addLayer`, `qi`, `._validate`, `Fa`, `Ht`, `jc`, `ps`, `us`, `zs`, `rs`, `le`, `.pop`, `X`, `.setEventedParent`, `N`, `Ke`, `._checkLoaded`, `j`, `Ss`, `.update`, `.getRenderableIds`, `U`, `os`, `S`, `.remove`, `._applyUpdatedTransform`, `fs`, `.replace`, `gs`, `mo`, `ct`, `Yc`, `na`, `Zc`, `qe`, `za`, `L`, `Mc`, `wa`, `cs`, `d`, `b`, `remove`, `ni`, `_setupContainer`, `ii`, `hs`, `Ic`, `ks`, `li`, `qc`, `qs`, `ys`?**
  _High betweenness centrality (0.692) - this node is a cross-community bridge._
- **Why does `rr()` connect `.evaluate` to `$`, `territorio.js`, `xr`, `.push`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `voci()` connect `territorio.js` to `.evaluate`, `scheda-omi.js`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `MODULI`, `catalogoPromessa`, `map` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.025967540574282147 - nodes in this community are weakly interconnected._
- **Should `kt` be split into smaller, more focused modules?**
  _Cohesion score 0.05279034690799397 - nodes in this community are weakly interconnected._
- **Should `.renderLayer` be split into smaller, more focused modules?**
  _Cohesion score 0.08421985815602837 - nodes in this community are weakly interconnected._