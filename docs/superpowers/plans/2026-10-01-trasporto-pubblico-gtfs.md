# Trasporto pubblico AMAT (GTFS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer «Trasporto pubblico» con linee bus/tram, fermate, orari completi per fermata e schede di fermata e di linea, ricerca per linea e fermata.

**Architecture:** `scripts/gtfs.py` trasforma `dati/gtfs/` in `dati/trasporto/{fermate,linee}.geojson` + `orari.json`. Il viewer aggiunge il modulo `js/layers/trasporto.js` (stesso schema di `scuole.js`: strati spenti di default, layer «hit» trasparenti sempre presenti per la scheda), la logica pura degli orari in `trasporto-orari.js`, il modello scheda in `scheda-trasporto.js` e il DOM interattivo in `trasporto-ui.js`. `orari.json` si scarica solo alla prima apertura di una scheda.

**Tech Stack:** Python 3 (csv, json, pytest), JavaScript ES modules (node --test), MapLibre GL, Playwright (test browser esistenti in `tests/test_viewer.py`).

**Spec:** `docs/superpowers/specs/2026-10-01-trasporto-pubblico-gtfs-design.md`

## Global Constraints

- Lingua dei testi in UI, commenti e messaggi: italiano, con tutti gli accenti.
- Commenti e nomi nello stile del codice circostante (italiano, commenti brevi che spiegano il perché).
- Nessuna libreria nuova (né Python né JS).
- `dati/*/` è ignorato da git: i file generati in `dati/trasporto/` non si committano e non entrano in `MANIFEST.tsv`.
- Coordinate a 6 decimali. File `*:Zone.Identifier` ignorati.
- Strati spenti di default; voci del pannello a barra sempre visibili anche a strato spento (legenda inclusa); scheda del luogo (pannello di destra) attiva anche a strato spento, con layer hit da zoom ≥ 13.
- Feed AMAT: validità 2026-08-25 → 2026-10-31; manca `calendar.txt` (solo `calendar_dates`, `exception_type` 1 = attivo, 2 = rimosso). Orari in minuti dalla mezzanotte del giorno di servizio; > 1440 = dopo la mezzanotte.
- **Albero di lavoro già sporco (lavoro dell'utente non committato):** `js/app.js`, `js/core/{pannello,scheda,ricerca,catalogo,scheda-modello}.js`, `css/app.css`, `tests/test_viewer.py`, `dati/README.md` sono già modificati; `js/core/{evidenza,luoghi}.js`, `js/layers/{scuole,scheda-scuole,monumenti}.js`, `tests/js/{evidenza,luoghi}.test.mjs` sono non tracciati. Perciò **ogni commit di questo piano include solo i file creati dal piano** (`scripts/gtfs.py`, `tests/test_gtfs.py`, `js/layers/trasporto*.js`, `js/layers/scheda-trasporto.js`, `tests/js/trasporto-orari.test.mjs`, `tests/js/scheda-trasporto.test.mjs`). Le modifiche ai file condivisi restano nell'albero di lavoro per il commit dell'utente: non usare `git add` su di essi né `git add -A`/`-a`. Alla fine si elencano all'utente.
- Dopo la modifica del codice: `graphify update .` (CLAUDE.md del progetto).
- Esecuzione test: `python3 -m pytest -q tests/test_gtfs.py` (pytest.ini ha `pythonpath = scripts`), `npm run test:js`, browser `python3 -m pytest -q tests/test_viewer.py -k trasporto`.

## Review Focus

- Corse dopo la mezzanotte (orari ≥ 24:00, es. 25:30): nella data di servizio compaiono come `01:30 (+1)`; il giorno dopo le stesse corse compaiono alle 01:30 tra le partenze del mattino. Testato in Task 2.
- Data fuori dalla validità del feed (oggi dopo il 31/10/2026): si mostra il primo giorno valido con avviso, la scheda non resta vuota. Testato in Task 2 (`giornoIniziale`) e Task 4 (avviso `segnala`).
- Giorno o fermata senza corse: messaggio «Nessuna corsa in questa data.», nessuna eccezione. Testato in Task 2 (lista vuota) e Task 3 (modello).
- Fermata senza linee (`linee: []`) o senza accessibilità: la scheda mostra solo ciò che c'è. Testato in Task 1 e Task 3.
- `orari.json` non scaricabile: la scheda mostra «Orari non disponibili: …» e il viewer resta vivo. Testato in Task 4 (browser).
- Clic su una strada dove passano molte linee (71 linee, due direzioni): una sola voce «Linee (N)» con le linee raggruppate e chiuse; gli orari di una linea si scaricano solo quando la si apre. Testato in Task 3 (`raggruppaLinee`, `voceLinee`).
- Ricerca numerica «100»: oggi `cercaLuoghi` la tratta come numero di sezione elettorale e non trova linee. Testato in Task 5.

---

### Task 1: Script `scripts/gtfs.py` e dati generati

**Files:**
- Create: `scripts/gtfs.py`
- Create: `tests/test_gtfs.py`

**Interfaces:**
- Produces (Python):
  - `minuti(ora: str) -> int` («07:15:00» → 435, «25:30:00» → 1530)
  - `servizi(src: Path) -> dict[str, list[str]]` (service_id → date ISO ordinate)
  - `costruisci(src: Path = SRC) -> tuple[dict, dict, dict]` = `(fermate_fc, linee_fc, orari)`
  - `scrivi(risultato, out: Path = OUT) -> None`, `main() -> int`
- Produces (file in `dati/trasporto/`):
  - `fermate.geojson`: `FeatureCollection` con membro extra `"validita": {"da","a"}` (ISO) e Point con properties `id, nome, linee[], accessibile ("Sì"|"No"|""), lon, lat`
  - `linee.geojson`: LineString con properties `id ("linea-<route_id>-<dir>"), route_id, numero, nome, colore ("#RRGGBB"), tipo ("bus"|"tram"), direzione (0|1), da, a, fermate[stop_id], lon, lat`
  - `orari.json`: `{"validita":{"da","a"},"servizi":{"<idx>":[date ISO]},"fermate":{"<stop_id>":{"<route_id>":[{"d":dir,"s":idx,"t":[minuti ordinati]}]}}}`; l'ultima fermata di ogni corsa non conta come partenza.

- [ ] **Step 1: Scrivere i test (feed sintetico + dati reali)**

Creare `tests/test_gtfs.py`:

```python
import csv
import json
from pathlib import Path

import pytest

import gtfs as g

ROOT = Path(__file__).resolve().parents[1]


def _scrivi(src, nome, intestazione, righe):
    with open(src / f"{nome}.txt", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(intestazione)
        w.writerows(righe)


@pytest.fixture
def feed(tmp_path):
    """Feed minimo: due linee (bus 100 a due direzioni, TRAM1), 4 fermate, due servizi, una corsa dopo la mezzanotte."""
    _scrivi(tmp_path, "stops", ["stop_id", "stop_name", "stop_lat", "stop_lon", "location_type", "parent_station", "wheelchair_boarding"], [
        ["S1", "PIAZZA INDIPENDENZA", "38.1", "13.3", "0", "", "1"],
        ["S2", "VIA ROMA", "38.11", "13.31", "0", "", "2"],
        ["S3", "STAZIONE CENTRALE", "38.12", "13.32", "0", "", ""],
        ["S4", "FERMATA ORFANA", "38.13", "13.33", "0", "", ""],
    ])
    _scrivi(tmp_path, "routes", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_url", "route_color", "route_text_color"], [
        ["100", "AMAT", "100", "JOHN LENNON - ORETO", "3", "", "7B263E", "FFFFFF"],
        ["TRAM1", "AMAT", "TRAM1", "LINEA 1", "0", "", "4F3881", "FFFFFF"],
    ])
    _scrivi(tmp_path, "trips", ["route_id", "service_id", "trip_id", "trip_headsign", "direction_id", "shape_id", "wheelchair_accessible", "bikes_allowed"], [
        ["100", "A", "t1", "", "0", "SH1", "", ""],
        ["100", "A", "t2", "", "0", "SH1", "", ""],
        ["100", "B", "t3", "", "1", "SH2", "", ""],
        ["TRAM1", "A", "t4", "", "0", "SH1", "", ""],
    ])
    _scrivi(tmp_path, "shapes", ["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"], [
        ["SH1", "38.12", "13.32", "3"], ["SH1", "38.1", "13.3", "1"], ["SH1", "38.11", "13.31", "2"],
        ["SH2", "38.12", "13.32", "1"], ["SH2", "38.1", "13.3", "2"],
    ])
    _scrivi(tmp_path, "stop_times", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"], [
        ["t1", "07:00:00", "07:00:00", "S1", "1"], ["t1", "07:10:00", "07:10:00", "S2", "2"], ["t1", "07:20:00", "07:20:00", "S3", "3"],
        ["t2", "25:30:00", "25:30:00", "S1", "1"], ["t2", "25:40:00", "25:40:00", "S2", "2"], ["t2", "25:50:00", "25:50:00", "S3", "3"],
        ["t3", "08:00:00", "08:00:00", "S3", "1"], ["t3", "08:10:00", "08:10:00", "S2", "2"], ["t3", "08:20:00", "08:20:00", "S1", "3"],
        ["t4", "09:00:00", "09:00:00", "S1", "1"], ["t4", "09:10:00", "09:10:00", "S3", "2"],
    ])
    _scrivi(tmp_path, "calendar_dates", ["service_id", "date", "exception_type"], [
        ["A", "20260825", "1"], ["A", "20260826", "1"], ["A", "20260827", "1"], ["A", "20260827", "2"],
        ["B", "20260825", "1"],
    ])
    _scrivi(tmp_path, "feed_info", ["feed_publisher_name", "feed_start_date", "feed_end_date"], [["AMAT", "20260825", "20261031"]])
    return tmp_path


def test_minuti_anche_oltre_mezzanotte():
    assert g.minuti("07:15:00") == 435
    assert g.minuti("25:30:00") == 1530


def test_servizi_aggiunge_e_toglie_date(feed):
    assert g.servizi(feed) == {"A": ["2026-08-25", "2026-08-26"], "B": ["2026-08-25"]}


def test_fermate_nome_linee_accessibilita_e_validita(feed):
    fermate, _, _ = g.costruisci(feed)
    assert fermate["validita"] == {"da": "2026-08-25", "a": "2026-10-31"}
    p = {f["properties"]["id"]: f["properties"] for f in fermate["features"]}
    assert p["S1"]["nome"] == "Piazza Indipendenza"
    assert p["S1"]["linee"] == ["100", "TRAM1"]
    assert (p["S1"]["accessibile"], p["S2"]["accessibile"], p["S3"]["accessibile"]) == ("Sì", "No", "")
    assert p["S4"]["linee"] == []  # fermata senza corse: resta, senza linee
    assert (p["S1"]["lon"], p["S1"]["lat"]) == (13.3, 38.1)


def test_linee_una_per_direzione_con_tracciato_ordinato(feed):
    _, linee, _ = g.costruisci(feed)
    per_id = {f["properties"]["id"]: f for f in linee["features"]}
    assert sorted(per_id) == ["linea-100-0", "linea-100-1", "linea-TRAM1-0"]
    f = per_id["linea-100-0"]
    assert f["geometry"]["coordinates"] == [[13.3, 38.1], [13.31, 38.11], [13.32, 38.12]]  # ordinati per sequenza
    p = f["properties"]
    assert (p["numero"], p["nome"], p["colore"], p["tipo"], p["direzione"]) == ("100", "John Lennon - Oreto", "#7B263E", "bus", 0)
    assert (p["da"], p["a"]) == ("Piazza Indipendenza", "Stazione Centrale")  # capolinea dalla prima e ultima fermata
    assert p["fermate"] == ["S1", "S2", "S3"]
    assert per_id["linea-TRAM1-0"]["properties"]["tipo"] == "tram"


def test_orari_per_fermata_senza_ultima_fermata_e_con_corse_oltre_mezzanotte(feed):
    _, _, orari = g.costruisci(feed)
    assert orari["validita"] == {"da": "2026-08-25", "a": "2026-10-31"}
    assert orari["servizi"] == {"0": ["2026-08-25", "2026-08-26"], "1": ["2026-08-25"]}
    assert orari["fermate"]["S1"]["100"] == [{"d": 0, "s": 0, "t": [420, 1530]}]  # t3 finisce qui: non è una partenza
    assert orari["fermate"]["S1"]["TRAM1"] == [{"d": 0, "s": 0, "t": [540]}]
    assert orari["fermate"]["S3"]["100"] == [{"d": 1, "s": 1, "t": [480]}]
    assert "S4" not in orari["fermate"]


def test_scrivi_produce_i_tre_file(feed, tmp_path):
    out = tmp_path / "out"
    g.scrivi(g.costruisci(feed), out)
    assert json.loads((out / "fermate.geojson").read_text(encoding="utf-8"))["validita"]["a"] == "2026-10-31"
    assert len(json.loads((out / "linee.geojson").read_text(encoding="utf-8"))["features"]) == 3
    assert "fermate" in json.loads((out / "orari.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def reale():
    if not (ROOT / "dati" / "gtfs" / "stop_times.txt").exists():
        pytest.skip("dati/gtfs assente")
    return g.costruisci()


def test_feed_reale_coerente(reale):
    fermate, linee, orari = reale
    ids = {f["properties"]["id"] for f in fermate["features"]}
    assert len(ids) == 1668
    route = {f["properties"]["route_id"] for f in linee["features"]}
    assert len(route) == 71
    tipi = {f["properties"]["route_id"]: f["properties"]["tipo"] for f in linee["features"]}
    assert sum(t == "tram" for t in tipi.values()) == 4 and sum(t == "bus" for t in tipi.values()) == 67
    assert set(orari["fermate"]) <= ids  # nessun orario per una fermata sconosciuta
    for f in linee["features"]:
        assert set(f["properties"]["fermate"]) <= ids and len(f["geometry"]["coordinates"]) >= 2
    servizi_usati = {g_["s"] for rotte in orari["fermate"].values() for gruppi in rotte.values() for g_ in gruppi}
    assert {str(s) for s in servizi_usati} <= set(orari["servizi"])
    assert max(t for rotte in orari["fermate"].values() for gruppi in rotte.values() for g_ in gruppi for t in g_["t"]) > 1440
    assert orari["validita"] == {"da": "2026-08-25", "a": "2026-10-31"}
```

- [ ] **Step 2: Verificare che falliscano**

Run: `python3 -m pytest -q tests/test_gtfs.py`
Expected: FAIL/ERROR con `ModuleNotFoundError: No module named 'gtfs'`.

- [ ] **Step 3: Implementare `scripts/gtfs.py`**

```python
"""GTFS AMAT Palermo -> fermate, linee e orari in dati/trasporto/.

  python3 scripts/gtfs.py   legge dati/gtfs/*.txt e scrive
                            fermate.geojson  punti con nome, linee che passano, accessibilità; membro `validita` del feed
                            linee.geojson    un tracciato per linea e direzione, con le fermate in sequenza
                            orari.json       partenze per fermata, linea, direzione e servizio + date di ogni servizio

Il feed non ha calendar.txt: i servizi sono definiti solo da calendar_dates (exception_type 1 = attivo, 2 = rimosso).
Gli orari restano in minuti dalla mezzanotte del giorno di servizio: oltre 1440 sono corse dopo la mezzanotte.
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "dati" / "gtfs"
OUT = ROOT / "dati" / "trasporto"

ACCESSIBILE = {"1": "Sì", "2": "No"}


def leggi(src, nome):
    with open(src / f"{nome}.txt", encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)


def minuti(ora):
    """«07:15:00» -> 435; le ore possono superare 24 (corse dopo la mezzanotte)."""
    h, m, _ = ora.split(":")
    return int(h) * 60 + int(m)


def data_iso(s):
    return f"{s[:4]}-{s[4:6]}-{s[6:]}"


def nome(testo):
    return re.sub(r"\s+", " ", testo).strip().title().replace("'S", "'s")


def ordine_linea(numero):
    return (not numero.isdigit(), int(numero) if numero.isdigit() else 0, numero)


def servizi(src):
    """service_id -> date ISO ordinate in cui il servizio è attivo."""
    attivi = defaultdict(set)
    for r in leggi(src, "calendar_dates"):
        data = data_iso(r["date"])
        if r["exception_type"] == "1":
            attivi[r["service_id"]].add(data)
        elif r["exception_type"] == "2":
            attivi[r["service_id"]].discard(data)
    return {sid: sorted(date) for sid, date in attivi.items() if date}


def costruisci(src=SRC):
    stops = {r["stop_id"]: r for r in leggi(src, "stops")}
    rotte = {r["route_id"]: r for r in leggi(src, "routes")}
    corse = {r["trip_id"]: r for r in leggi(src, "trips")}
    attivi = servizi(src)
    indice = {sid: i for i, sid in enumerate(sorted(attivi))}
    feed = next(leggi(src, "feed_info"))
    validita = {"da": data_iso(feed["feed_start_date"]), "a": data_iso(feed["feed_end_date"])}

    tracciati = defaultdict(list)
    for r in leggi(src, "shapes"):
        tracciati[r["shape_id"]].append((int(r["shape_pt_sequence"]), round(float(r["shape_pt_lon"]), 6), round(float(r["shape_pt_lat"]), 6)))
    soste = defaultdict(list)
    for r in leggi(src, "stop_times"):
        soste[r["trip_id"]].append((int(r["stop_sequence"]), r["stop_id"], minuti(r["departure_time"])))
    for v in soste.values():
        v.sort()

    # corse utilizzabili: hanno fermate e un servizio con almeno una data
    valide = {tid: c for tid, c in corse.items() if soste.get(tid) and c["service_id"] in indice}

    passano = defaultdict(set)  # fermata -> numeri di linea
    gruppi = defaultdict(list)  # (fermata, linea, direzione, servizio) -> minuti
    per_linea = defaultdict(list)  # (linea, direzione) -> corse con tracciato
    for tid, c in valide.items():
        d = int(c["direction_id"] or 0)
        numero = rotte[c["route_id"]]["route_short_name"]
        for _, stop, _m in soste[tid]:
            passano[stop].add(numero)
        for _, stop, m in soste[tid][:-1]:  # all'ultima fermata la corsa termina: non è una partenza
            gruppi[(stop, c["route_id"], d, indice[c["service_id"]])].append(m)
        if c["shape_id"] in tracciati:
            per_linea[(c["route_id"], d)].append(tid)

    orari_fermate = defaultdict(lambda: defaultdict(list))
    for (stop, route, d, s), tempi in sorted(gruppi.items()):
        orari_fermate[stop][route].append({"d": d, "s": s, "t": sorted(tempi)})

    fermate = {"type": "FeatureCollection", "validita": validita, "features": [
        {"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(float(s["stop_lon"]), 6), round(float(s["stop_lat"]), 6)]},
         "properties": {"id": sid, "nome": nome(s["stop_name"]), "linee": sorted(passano.get(sid, ()), key=ordine_linea),
                        "accessibile": ACCESSIBILE.get(s["wheelchair_boarding"], ""),
                        "lon": round(float(s["stop_lon"]), 6), "lat": round(float(s["stop_lat"]), 6)}}
        for sid, s in stops.items()]}

    elementi = []
    for (route, d), tids in sorted(per_linea.items(), key=lambda kv: (ordine_linea(rotte[kv[0][0]]["route_short_name"]), kv[0][1])):
        shape = Counter(valide[t]["shape_id"] for t in tids).most_common(1)[0][0]  # il tracciato con più corse
        modello = next(t for t in tids if valide[t]["shape_id"] == shape)
        sequenza = [stop for _, stop, _m in soste[modello]]
        coord = [[lon, lat] for _, lon, lat in sorted(tracciati[shape])]
        r = rotte[route]
        a, b = stops[sequenza[0]], stops[sequenza[-1]]
        medio = coord[len(coord) // 2]
        elementi.append({"type": "Feature", "geometry": {"type": "LineString", "coordinates": coord}, "properties": {
            "id": f"linea-{route}-{d}", "route_id": route, "numero": r["route_short_name"], "nome": nome(r["route_long_name"]),
            "colore": f"#{r['route_color']}", "tipo": "tram" if r["route_type"] == "0" else "bus", "direzione": d,
            "da": nome(a["stop_name"]), "a": nome(b["stop_name"]), "fermate": sequenza, "lon": medio[0], "lat": medio[1]}})
    linee = {"type": "FeatureCollection", "features": elementi}

    orari = {"validita": validita, "servizi": {str(i): attivi[sid] for sid, i in indice.items()},
             "fermate": {stop: dict(per_rotta) for stop, per_rotta in orari_fermate.items()}}
    return fermate, linee, orari


def scrivi(risultato, out=OUT):
    out.mkdir(parents=True, exist_ok=True)
    for file, dati in zip(("fermate.geojson", "linee.geojson", "orari.json"), risultato):
        (out / file).write_text(json.dumps(dati, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    fermate, linee, orari = risultato = costruisci()
    scrivi(risultato)
    print(f"{len(fermate['features'])} fermate, {len(linee['features'])} tracciati, {len(orari['fermate'])} fermate con orari")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Eseguire i test**

Run: `python3 -m pytest -q tests/test_gtfs.py`
Expected: tutti PASS (il test sul feed reale richiede qualche secondo).

- [ ] **Step 5: Generare i dati e controllare le dimensioni**

Run: `python3 scripts/gtfs.py && ls -l dati/trasporto && gzip -c dati/trasporto/orari.json | wc -c`
Expected: «1668 fermate, ~140 tracciati, … fermate con orari»; `orari.json` ≈ 2–4 MB (≈ 1 MB gzip). Se supera 4 MB, fermarsi e riferirlo (rischio previsto dalla spec: divisione per fascia di `stop_id`).

- [ ] **Step 6: Commit**

```bash
git add scripts/gtfs.py tests/test_gtfs.py
git commit -m "feat: script gtfs.py (fermate, linee, orari da GTFS AMAT)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Logica pura degli orari (`trasporto-orari.js`)

**Files:**
- Create: `js/layers/trasporto-orari.js`
- Test: `tests/js/trasporto-orari.test.mjs`

**Interfaces:**
- Consumes: formato `orari.json` del Task 1 (`servizi`, `fermate`, `validita`).
- Produces (tutte pure, senza DOM):
  - `formatoOra(minuti) -> string` («07:15», oltre mezzanotte «01:30 (+1)»)
  - `oggiISO(d = new Date()) -> 'YYYY-MM-DD'` (data locale), `minutoAdesso(d = new Date()) -> number`
  - `giornoIniziale(orari, oggi) -> { data, fuori }`
  - `serviziAttivi(orari, data) -> Set<number>`
  - `partenzeFermata(orari, stopId, data) -> [{ route, dir, t }]` ordinate per `t` (include le corse del giorno prima oltre mezzanotte, riportate al mattino)
  - `prossime(partenze, minuto, n = 8) -> [...]`
  - `riepilogoLinea(orari, linea, data) -> { n, primo, ultimo, frequenza } | null` (`linea.route_id`, `linea.direzione`, `linea.fermate[0]`)
  - `colorePerTesto('#RRGGBB') -> '#000000' | '#ffffff'`

- [ ] **Step 1: Scrivere il test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatoOra, oggiISO, minutoAdesso, giornoIniziale, serviziAttivi, partenzeFermata, prossime, riepilogoLinea, colorePerTesto,
} from '../../js/layers/trasporto-orari.js';

const orari = {
  validita: { da: '2026-08-25', a: '2026-10-31' },
  servizi: { 0: ['2026-09-01', '2026-09-02'], 1: ['2026-09-02'] },
  fermate: { S1: { 100: [{ d: 0, s: 0, t: [420, 1530] }, { d: 1, s: 1, t: [600] }], 200: [{ d: 0, s: 0, t: [480] }] } },
};

test('formatoOra: orari normali e dopo la mezzanotte', () => {
  assert.equal(formatoOra(0), '00:00');
  assert.equal(formatoOra(435), '07:15');
  assert.equal(formatoOra(1530), '01:30 (+1)');
});

test('data e minuto locali', () => {
  assert.equal(oggiISO(new Date(2026, 8, 1, 23, 59)), '2026-09-01');
  assert.equal(minutoAdesso(new Date(2026, 8, 1, 7, 15)), 435);
});

test('giornoIniziale: oggi se nel feed, altrimenti il primo giorno valido con avviso', () => {
  assert.deepEqual(giornoIniziale(orari, '2026-10-01'), { data: '2026-10-01', fuori: false });
  assert.deepEqual(giornoIniziale(orari, '2026-11-15'), { data: '2026-08-25', fuori: true });
  assert.deepEqual(giornoIniziale(orari, '2026-08-01'), { data: '2026-08-25', fuori: true });
});

test('serviziAttivi: solo quelli che hanno la data', () => {
  assert.deepEqual([...serviziAttivi(orari, '2026-09-01')], [0]);
  assert.deepEqual([...serviziAttivi(orari, '2026-09-02')].sort(), [0, 1]);
  assert.equal(serviziAttivi(orari, '2026-12-25').size, 0);
});

test('partenzeFermata: ordinate, con le corse dopo la mezzanotte alla fine del giorno', () => {
  assert.deepEqual(partenzeFermata(orari, 'S1', '2026-09-01'), [
    { route: '100', dir: 0, t: 420 }, { route: '200', dir: 0, t: 480 }, { route: '100', dir: 0, t: 1530 },
  ]);
});

test('partenzeFermata: la corsa di ieri dopo la mezzanotte compare al mattino di oggi', () => {
  const p = partenzeFermata(orari, 'S1', '2026-09-02');
  assert.deepEqual(p[0], { route: '100', dir: 0, t: 90 }); // 25:30 di ieri = 01:30 di oggi
  assert.deepEqual(p.map(x => x.t), [90, 420, 480, 600, 1530]);
});

test('partenzeFermata: data senza servizio o fermata sconosciuta → lista vuota', () => {
  assert.deepEqual(partenzeFermata(orari, 'S1', '2026-12-25'), []);
  assert.deepEqual(partenzeFermata(orari, 'S999', '2026-09-01'), []);
});

test('prossime: dal minuto indicato in poi, al massimo n', () => {
  const p = partenzeFermata(orari, 'S1', '2026-09-02');
  assert.deepEqual(prossime(p, 450, 2).map(x => x.t), [480, 600]);
  assert.deepEqual(prossime(p, 2000), []);
});

test('riepilogoLinea: corse, primo, ultimo e frequenza media al capolinea', () => {
  const linea = { route_id: '100', direzione: 0, fermate: ['S1', 'S2'] };
  assert.deepEqual(riepilogoLinea(orari, linea, '2026-09-01'), { n: 2, primo: 420, ultimo: 1530, frequenza: 1110 });
  assert.equal(riepilogoLinea(orari, linea, '2026-12-25'), null);
  assert.deepEqual(riepilogoLinea(orari, { ...linea, direzione: 1 }, '2026-09-02'), { n: 1, primo: 600, ultimo: 600, frequenza: null });
});

test('colorePerTesto: testo scuro sui colori chiari e viceversa', () => {
  assert.equal(colorePerTesto('#FACE2F'), '#000000');
  assert.equal(colorePerTesto('#7B263E'), '#ffffff');
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `node --test tests/js/trasporto-orari.test.mjs`
Expected: FAIL (`Cannot find module .../trasporto-orari.js`).

- [ ] **Step 3: Implementare**

```js
// Logica pura degli orari del trasporto pubblico (nessun DOM): giorni di servizio, partenze di una fermata, riepilogo di una linea.
// Gli orari sono minuti dalla mezzanotte del giorno di servizio: oltre 1440 sono corse dopo la mezzanotte.

const due = n => String(n).padStart(2, '0');

export function formatoOra(minuti) {
  const ora = `${due(Math.floor(minuti / 60) % 24)}:${due(minuti % 60)}`;
  return minuti >= 1440 ? `${ora} (+1)` : ora;
}

export function oggiISO(d = new Date()) {
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
}

export function minutoAdesso(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

// Oggi se rientra nella validità del feed, altrimenti il primo giorno valido (`fuori` fa mostrare l'avviso).
export function giornoIniziale({ validita }, oggi) {
  return oggi >= validita.da && oggi <= validita.a ? { data: oggi, fuori: false } : { data: validita.da, fuori: true };
}

export function serviziAttivi({ servizi }, data) {
  return new Set(Object.entries(servizi).filter(([, date]) => date.includes(data)).map(([indice]) => Number(indice)));
}

function giornoPrima(data) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Partenze di una fermata nel giorno `data`, ordinate. Le corse di ieri che finiscono dopo la mezzanotte
// (orario ≥ 1440) partono di fatto al mattino di oggi e si aggiungono con l'orario riportato a 0–1439.
export function partenzeFermata(orari, stopId, data) {
  const oggi = serviziAttivi(orari, data);
  const ieri = serviziAttivi(orari, giornoPrima(data));
  const partenze = [];
  for (const [route, gruppi] of Object.entries(orari.fermate[stopId] ?? {})) {
    for (const g of gruppi) {
      if (oggi.has(g.s)) for (const t of g.t) partenze.push({ route, dir: g.d, t });
      if (ieri.has(g.s)) for (const t of g.t) if (t >= 1440) partenze.push({ route, dir: g.d, t: t - 1440 });
    }
  }
  return partenze.sort((a, b) => a.t - b.t || a.route.localeCompare(b.route));
}

export function prossime(partenze, minuto, n = 8) {
  return partenze.filter(p => p.t >= minuto).slice(0, n);
}

// Corse, primo e ultimo passaggio e frequenza media (minuti) misurati alla prima fermata della linea.
export function riepilogoLinea(orari, linea, data) {
  const p = partenzeFermata(orari, linea.fermate[0], data).filter(x => x.route === linea.route_id && x.dir === linea.direzione);
  if (!p.length) return null;
  const primo = p[0].t;
  const ultimo = p[p.length - 1].t;
  return { n: p.length, primo, ultimo, frequenza: p.length > 1 ? Math.round((ultimo - primo) / (p.length - 1)) : null };
}

// Testo nero o bianco, a seconda della luminosità dello sfondo (i colori delle linee vanno dal giallo al viola scuro).
export function colorePerTesto(esadecimale) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(esadecimale.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#000000' : '#ffffff';
}
```

- [ ] **Step 4: Eseguire i test**

Run: `node --test tests/js/trasporto-orari.test.mjs`
Expected: tutti PASS.

- [ ] **Step 5: Commit**

```bash
git add js/layers/trasporto-orari.js tests/js/trasporto-orari.test.mjs
git commit -m "feat: logica orari trasporto pubblico (giorni, partenze, riepilogo linea)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Modello scheda e hook `dinamico` in `scheda.js`

**Files:**
- Create: `js/layers/scheda-trasporto.js`
- Modify: `js/core/scheda.js` (funzione `disegnaSezione`, subito dopo `corpo.push(...s.gruppi.map(disegnaGruppo));`)
- Test: `tests/js/scheda-trasporto.test.mjs`

**Interfaces:**
- Consumes: `unisci` di `js/core/scheda-modello.js` (copia i campi sconosciuti della voce in `resto`, quindi `dinamico` sopravvive).
- Produces:
  - `voceFermata(p, dinamico) -> voce` con `p = { id, nome, linee[], accessibile }`; `badge: 'Fermata'`, `peso: 6`, `sempre: true`, `dinamico`.
  - `raggruppaLinee(linee) -> [{ route_id, numero, nome, tipo, direzioni: [linea] }]`: una voce per `route_id` (le due direzioni insieme, ordinate per `direzione`), nell'ordine in cui compaiono; `linea = { id, route_id, numero, nome, tipo, direzione, da, a, fermate[] }`.
  - `voceLinee(linee, costruisci) -> voce`: **una sola** voce per tutte le linee sotto il clic (`chiave: 'linee'`, `peso: 7`, `sempre: true`, `gruppi: []`); `titolo` «Linea 100» se è una sola linea, altrimenti «Linee (N)»; `badge` «Bus»/«Tram» solo se è una sola linea; `dinamico = () => costruisci(raggruppaLinee(linee))`.
  - Nuovo campo di voce `dinamico?: () => Node`, aggiunto da `scheda.js` al corpo della sezione.

- [ ] **Step 1: Scrivere il test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import { voceFermata, raggruppaLinee, voceLinee } from '../../js/layers/scheda-trasporto.js';

const dinamico = () => 'nodo';
const fermata = { id: 'S1', nome: 'Piazza Indipendenza', linee: ['100', 'TRAM1'], accessibile: 'Sì' };
const linea = (route_id, direzione, tipo = 'bus') => ({
  id: `linea-${route_id}-${direzione}`, route_id, numero: route_id, nome: `Nome ${route_id}`, tipo, direzione, da: 'A', a: 'B', fermate: ['S1', 'S2'],
});

test('fermata: titolo, badge, righe e hook dinamico', () => {
  const v = voceFermata(fermata, dinamico);
  assert.equal(v.titolo, 'Piazza Indipendenza');
  assert.equal(v.badge, 'Fermata');
  assert.deepEqual(v.gruppi[0].righe, [
    { etichetta: 'Linee', valore: '100, TRAM1' },
    { etichetta: 'Accessibile in carrozzina', valore: 'Sì' },
  ]);
  assert.equal(v.dinamico, dinamico);
});

test('fermata senza linee né accessibilità: nessuna riga vuota', () => {
  const v = voceFermata({ id: 'S4', nome: 'Fermata orfana', linee: [], accessibile: '' }, dinamico);
  assert.deepEqual(v.gruppi[0].righe, []);
  assert.equal(v.sempre, true);
});

test('raggruppaLinee: una voce per linea con le due direzioni in ordine, senza duplicati', () => {
  const g = raggruppaLinee([linea('101', 1), linea('100', 1), linea('100', 0), linea('100', 0)]);
  assert.deepEqual(g.map(x => x.route_id), ['101', '100']); // ordine di comparsa
  assert.deepEqual(g[1].direzioni.map(d => d.direzione), [0, 1]);
  assert.equal(g[1].numero, '100');
});

test('voceLinee: una sola linea → titolo con numero e badge del tipo', () => {
  const v = voceLinee([linea('100', 0), linea('100', 1)], gruppi => gruppi);
  assert.equal(v.titolo, 'Linea 100');
  assert.equal(v.badge, 'Bus');
  assert.equal(voceLinee([linea('TRAM1', 0, 'tram')], gruppi => gruppi).badge, 'Tram');
});

test('voceLinee: tante linee sotto il clic → una sola voce «Linee (N)», senza badge, che raggruppa quando si disegna', () => {
  const tutte = ['100', '101', '102', '103'].flatMap(r => [linea(r, 0), linea(r, 1)]); // 8 tracciati sulla stessa strada
  const v = voceLinee(tutte, gruppi => gruppi.length);
  assert.equal(v.titolo, 'Linee (4)');
  assert.equal(v.badge, undefined);
  assert.equal(v.chiave, 'linee');
  assert.equal(v.dinamico(), 4);
});

test('unisci: le sezioni senza righe restano e conservano il hook dinamico', () => {
  const { sezioni } = unisci([voceFermata({ id: 'S4', nome: 'Fermata orfana', linee: [], accessibile: '' }, dinamico), voceLinee([linea('100', 0)], () => 'nodo')]);
  assert.equal(sezioni.length, 2);
  assert.equal(sezioni[0].dinamico, dinamico);
  assert.equal(sezioni[1].dinamico(), 'nodo');
  assert.deepEqual(sezioni.map(s => s.badges[0]), ['Fermata', 'Bus']);
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `node --test tests/js/scheda-trasporto.test.mjs`
Expected: FAIL (modulo mancante).

- [ ] **Step 3: Implementare il modello**

Creare `js/layers/scheda-trasporto.js`:

```js
// Modello puro di fermate e linee del trasporto pubblico: le righe fisse della scheda di destra.
// Orari e fermate in sequenza sono interattivi (selettore del giorno): li costruisce `dinamico`, passato da chi disegna.

const righe = coppie => coppie.filter(([, valore]) => valore).map(([etichetta, valore]) => ({ etichetta, valore }));

export function voceFermata(p, dinamico) {
  return {
    chiave: `fermata-${p.id}`, peso: 6, titolo: p.nome, icona: 'fa-bus', badge: 'Fermata', sempre: true,
    gruppi: [{ righe: righe([['Linee', p.linee.join(', ')], ['Accessibile in carrozzina', p.accessibile]]) }],
    dinamico,
  };
}

// Le linee sotto un clic possono essere decine (una strada principale ne ha molte): le due direzioni di una linea
// stanno insieme e tutte le linee in una sola voce, da aprire una per volta.
export function raggruppaLinee(linee) {
  const perRotta = new Map();
  for (const l of linee) {
    if (!perRotta.has(l.route_id)) perRotta.set(l.route_id, { route_id: l.route_id, numero: l.numero, nome: l.nome, tipo: l.tipo, direzioni: [] });
    const g = perRotta.get(l.route_id);
    if (!g.direzioni.some(d => d.direzione === l.direzione)) g.direzioni.push(l);
  }
  const gruppi = [...perRotta.values()];
  for (const g of gruppi) g.direzioni.sort((a, b) => a.direzione - b.direzione);
  return gruppi;
}

// `costruisci(gruppi)` disegna l'elenco delle linee (accordion con gli orari caricati all'apertura).
export function voceLinee(linee, costruisci) {
  const gruppi = raggruppaLinee(linee);
  const una = gruppi.length === 1 ? gruppi[0] : null;
  return {
    chiave: 'linee', peso: 7, titolo: una ? `Linea ${una.numero}` : `Linee (${gruppi.length})`, icona: una?.tipo === 'tram' ? 'fa-train' : 'fa-bus',
    badge: una ? (una.tipo === 'tram' ? 'Tram' : 'Bus') : undefined, sempre: true, gruppi: [],
    dinamico: () => costruisci(gruppi),
  };
}
```

- [ ] **Step 4: Aggiungere il hook in `scheda.js`**

In `disegnaSezione`, dopo `corpo.push(...s.gruppi.map(disegnaGruppo));` aggiungere:

```js
  if (s.dinamico) corpo.push(s.dinamico()); // contenuto interattivo costruito dal layer (es. orari con selettore del giorno)
```

- [ ] **Step 5: Eseguire tutta la suite JS**

Run: `npm run test:js`
Expected: tutti PASS (inclusi i test esistenti).

- [ ] **Step 6: Commit**

```bash
git add js/layers/scheda-trasporto.js tests/js/scheda-trasporto.test.mjs   # scheda.js è un file già sporco dell'utente: resta fuori dal commit
git commit -m "feat: modello scheda trasporto (fermata e linee raggruppate) con hook dinamico

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Layer, DOM degli orari, pannello, evidenza e test browser

**Files:**
- Create: `js/layers/trasporto-ui.js`
- Create: `js/layers/trasporto.js`
- Modify: `js/app.js` (import e `MODULI`)
- Modify: `js/core/pannello.js` (`ICONE`, `ETICHETTE`)
- Modify: `js/core/evidenza.js` (`FONTI`)
- Modify: `css/app.css` (in coda)
- Test: `tests/test_viewer.py` (in coda), `tests/js/evidenza.test.mjs` (un test)

**Interfaces:**
- Consumes: `voceFermata`, `voceLinee` (Task 3); `giornoIniziale, oggiISO, minutoAdesso, partenzeFermata, prossime, riepilogoLinea, formatoOra, colorePerTesto` (Task 2); `urlDati` (`js/core/config.js`); `segnala` (`js/core/pannello.js`); dati del Task 1.
- Produces:
  - `trasporto-ui.js`: `orariFermata(stopId, ctx) -> () => Node`, `orariLinea(linea, ctx) -> () => Node` e `elencoLinee(gruppi, ctx) -> Node` (accordion di `raggruppaLinee`; gli orari di una linea si costruiscono — e scaricano — solo alla prima apertura), con `ctx = { orari: () => Promise<orari>, info: (route, dir) => { numero, colore, a }, nomeFermata: id => string }`.
  - `trasporto.js` (default export, id `trasporto`): strati `trasporto-bus`, `trasporto-tram`, `trasporto-fermate` (checkbox `#strato-<id>`, spenti); layer hit `trasporto-hit-linee` e `trasporto-hit-fermate`; gruppo del pannello `#gruppo-trasporto` con legenda `.legenda-trasporto` sempre visibile.
  - `evidenza.js`: `FONTI['trasporto-hit-fermate']` e `FONTI['trasporto-hit-linee']`.

- [ ] **Step 1: Test di evidenza (JS)**

In coda a `tests/js/evidenza.test.mjs` aggiungere (usare gli helper `f` e `pt` già definiti nel file: se `pt` non è nello scope globale, definire `const punto = { type: 'Point', coordinates: [0, 0] };`):

```js
test('trasporto: fermata e linea hanno etichetta e colore; la fermata è la cosa evidenziata', async () => {
  const { FONTI } = await import('../../js/core/evidenza.js');
  assert.equal(FONTI['trasporto-hit-fermate'].etichetta, 'Fermata');
  assert.equal(FONTI['trasporto-hit-linee'].etichetta, 'Linea');
  const punto = { type: 'Point', coordinates: [0, 0] };
  const linea = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };
  const s = sceltePerLayer([f('trasporto-hit-linee', { id: 'l' }, linea), f('trasporto-hit-fermate', { id: 'S1' }, punto)], { lng: 0, lat: 0 });
  assert.deepEqual(soloCliccato(s).map(x => x.id), ['trasporto-hit-fermate']);
});
```

Run: `node --test tests/js/evidenza.test.mjs`
Expected: FAIL (`FONTI['trasporto-hit-fermate']` non definito). Se `f`/`sceltePerLayer`/`soloCliccato` non sono importati nello scope del test, importarli come fanno gli altri test del file.

- [ ] **Step 2: Aggiungere le fonti di evidenza**

In `js/core/evidenza.js`, dentro `FONTI`, prima di `'griglia-hit'`:

```js
  'trasporto-hit-fermate': { etichetta: 'Fermata', colore: '#364fc7' },
  'trasporto-hit-linee': { etichetta: 'Linea', colore: '#e03131' },
```

Run: `node --test tests/js/evidenza.test.mjs`
Expected: PASS.

- [ ] **Step 3: Scrivere i test browser (RED)** (poi eseguirli: devono fallire)

In coda a `tests/test_viewer.py`:

```python
def _dati_trasporto():
    """Genera dati/trasporto/ se manca (come per scuole e monumenti: non sta in git); salta se non c'è il feed."""
    cartella = ROOT / "dati" / "trasporto"
    if not (cartella / "orari.json").exists():
        if not (ROOT / "dati" / "gtfs" / "stop_times.txt").exists():
            pytest.skip("dati/gtfs assente")
        import gtfs
        gtfs.scrivi(gtfs.costruisci())
    return cartella


def _fermata_con_orari():
    """Coordinate, nome e id della prima fermata che ha orari."""
    base = _dati_trasporto()
    con_orari = set(json.loads((base / "orari.json").read_text(encoding="utf-8"))["fermate"])
    for f in json.loads((base / "fermate.geojson").read_text(encoding="utf-8"))["features"]:
        if f["properties"]["id"] in con_orari:
            return f["geometry"]["coordinates"], f["properties"]
    raise AssertionError("nessuna fermata con orari")


def test_trasporto_voci_del_pannello_sempre_visibili_anche_spente(apri):
    _dati_trasporto()
    v = apri()
    v.mostra("#strato-trasporto-bus")
    for strato in ("trasporto-bus", "trasporto-tram", "trasporto-fermate"):
        assert v.page.is_visible(f"#strato-{strato}")
        assert not v.page.is_checked(f"#strato-{strato}")
    assert v.page.is_visible("#gruppo-trasporto .legenda-trasporto")  # la legenda resta anche a strato spento
    assert v.js("window.dt.map.getLayoutProperty('trasporto-fermate', 'visibility')") == "none"


def test_trasporto_accendere_gli_strati_mostra_linee_e_fermate(apri):
    (lon, lat), _ = _fermata_con_orari()
    v = apri()
    v.mostra("#strato-trasporto-fermate")
    for strato in ("trasporto-bus", "trasporto-tram", "trasporto-fermate"):
        v.page.check(f"#strato-{strato}")
    v.vai(lon, lat, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-fermate']}).length > 0")
    assert not any("trasporto" in e.lower() for e in v.errori)


def test_trasporto_scheda_fermata_anche_a_strato_spento(apri):
    (lon, lat), p = _fermata_con_orari()
    v = apri()
    v.mostra("#strato-trasporto-fermate")
    assert not v.page.is_checked("#strato-trasporto-fermate")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert p["nome"].lower() in v.page.inner_text("#scheda").lower()
    v.page.wait_for_selector("#scheda .trasporto-orari input[type=date]")  # orari scaricati e selettore del giorno disegnato
    assert v.page.locator("#scheda .trasporto-orari input[type=date]").first.input_value()  # più input se c'è anche una linea: basta il primo
    assert v.js("window.dt.map.getLayoutProperty('trasporto-fermate', 'visibility')") == "none"


def test_trasporto_clic_su_strada_con_molte_linee_una_sola_voce_e_orari_solo_all_apertura(apri):
    base = _dati_trasporto()
    linee = json.loads((base / "linee.geojson").read_text(encoding="utf-8"))["features"]
    lon, lat = linee[0]["properties"]["lon"], linee[0]["properties"]["lat"]
    v = apri()
    v.vai(lon, lat, 16)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-linee']}).length > 0")
    richieste = []
    v.page.on("request", lambda r: richieste.append(r.url) if r.url.endswith("orari.json") else None)
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert v.page.locator("#scheda [data-chiave='linee']").count() == 1  # una sola sezione «Linee», non una per tracciato
    if v.page.locator("#scheda [data-chiave='linee'] details.trasporto-linea").count() > 1:
        assert richieste == []  # più linee: chiuse, nessun download degli orari finché non se ne apre una
        v.page.click("#scheda [data-chiave='linee'] details.trasporto-linea >> nth=0 >> summary")
        v.page.wait_for_selector("#scheda [data-chiave='linee'] .trasporto-orari")


def test_trasporto_orari_non_scaricabili_lo_dicono_e_il_viewer_resta_vivo(apri):
    (lon, lat), _ = _fermata_con_orari()
    v = apri(blocca="**/dati/trasporto/orari.json")
    v.vai(lon, lat, 17)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['trasporto-hit-fermate']}).length > 0")
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda .trasporto-orari")
    v.page.wait_for_function("document.querySelector('#scheda .trasporto-orari').textContent.includes('Orari non disponibili')")
    assert v.js("window.dt.pronto") is True
```

Run: `python3 -m pytest -q tests/test_viewer.py -k trasporto`
Expected: FAIL (strati inesistenti).

- [ ] **Step 4: Implementare `trasporto-ui.js`**

```js
import {
  giornoIniziale, oggiISO, minutoAdesso, partenzeFermata, prossime, riepilogoLinea, formatoOra, colorePerTesto,
} from './trasporto-orari.js';

// DOM della scheda del trasporto pubblico: selettore del giorno e orari. Gli orari si scaricano alla prima apertura
// (`ctx.orari()` è una promessa condivisa); finché non arrivano si vede «in caricamento», se falliscono lo si dice.

const dataIt = iso => iso.split('-').reverse().join('/');

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function chip(info) {
  const c = el('span', 'trasporto-chip', info.numero);
  c.style.background = info.colore;
  c.style.color = colorePerTesto(info.colore);
  return c;
}

function riga(etichetta, valore) {
  const r = el('div', 'scheda-riga');
  r.append(typeof etichetta === 'string' ? el('span', 'scheda-et', etichetta) : etichetta, el('span', 'scheda-val', valore));
  return r;
}

const nessunaCorsa = () => el('p', 'scheda-nota', 'Nessuna corsa in questa data.');

// `disegna(orari, data)` restituisce i nodi del corpo, ridisegnati a ogni cambio di giorno.
function conGiorno(ctx, disegna) {
  const radice = el('div', 'trasporto-orari');
  radice.append(el('p', 'scheda-nota', 'Orari in caricamento…'));
  ctx.orari().then(orari => {
    const { data, fuori } = giornoIniziale(orari, oggiISO());
    const scelta = el('input');
    scelta.type = 'date';
    scelta.value = data;
    scelta.min = orari.validita.da;
    scelta.max = orari.validita.a;
    scelta.setAttribute('aria-label', 'Giorno');
    const giorno = el('label', 'trasporto-giorno', 'Giorno ');
    giorno.append(scelta);
    const corpo = el('div');
    const ridisegna = () => { if (scelta.value) corpo.replaceChildren(...disegna(orari, scelta.value)); };
    scelta.addEventListener('change', ridisegna);
    const avviso = fuori
      ? [el('p', 'scheda-nota', `Gli orari valgono dal ${dataIt(orari.validita.da)} al ${dataIt(orari.validita.a)}: mostro il primo giorno valido.`)]
      : [];
    radice.replaceChildren(...avviso, giorno, corpo);
    ridisegna();
  }).catch(err => radice.replaceChildren(el('p', 'scheda-nota', `Orari non disponibili: ${err.message}`)));
  return radice;
}

function tuttiGliOrari(ctx, partenze) {
  const radice = el('details', 'scheda-acc');
  radice.append(el('summary', null, `Tutti gli orari del giorno (${partenze.length})`));
  const gruppi = new Map();
  for (const p of partenze) {
    const k = `${p.route}|${p.dir}`;
    if (!gruppi.has(k)) gruppi.set(k, []);
    gruppi.get(k).push(p);
  }
  for (const lista of gruppi.values()) {
    const info = ctx.info(lista[0].route, lista[0].dir);
    const blocco = el('div', 'scheda-gruppo');
    const testata = el('div', 'trasporto-testata');
    testata.append(chip(info), ` → ${info.a}`);
    blocco.append(testata, el('p', 'trasporto-ore', lista.map(p => formatoOra(p.t)).join(' · ')));
    radice.append(blocco);
  }
  return radice;
}

export function orariFermata(stopId, ctx) {
  return () => conGiorno(ctx, (orari, data) => {
    const tutte = partenzeFermata(orari, stopId, data);
    if (!tutte.length) return [nessunaCorsa()];
    const oggi = data === oggiISO();
    const prime = oggi ? prossime(tutte, minutoAdesso()) : tutte.slice(0, 8);
    const blocco = el('div', 'scheda-gruppo');
    blocco.append(el('h4', null, oggi ? 'Prossime partenze' : 'Prime partenze del giorno'));
    if (!prime.length) blocco.append(el('p', 'scheda-nota', 'Nessun’altra partenza oggi.'));
    for (const p of prime) {
      const info = ctx.info(p.route, p.dir);
      const etichetta = el('span', 'scheda-et');
      etichetta.append(chip(info), ` → ${info.a}`);
      blocco.append(riga(etichetta, formatoOra(p.t)));
    }
    return [blocco, tuttiGliOrari(ctx, tutte)];
  });
}

function fermateInSequenza(linea, ctx) {
  const radice = el('details', 'scheda-acc');
  radice.append(el('summary', null, `Fermate (${linea.fermate.length})`));
  const elenco = el('ol', 'trasporto-fermate');
  for (const id of linea.fermate) elenco.append(el('li', null, ctx.nomeFermata(id)));
  radice.append(elenco);
  return radice;
}

export function orariLinea(linea, ctx) {
  return () => {
    const radice = el('div');
    radice.append(conGiorno(ctx, (orari, data) => {
      const r = riepilogoLinea(orari, linea, data);
      if (!r) return [nessunaCorsa()];
      const blocco = el('div', 'scheda-gruppo');
      blocco.append(
        riga('Corse al giorno', String(r.n)),
        riga('Primo passaggio al capolinea', formatoOra(r.primo)),
        riga('Ultimo passaggio al capolinea', formatoOra(r.ultimo)),
      );
      if (r.frequenza) blocco.append(riga('Frequenza media', `ogni ${r.frequenza} min`));
      return [blocco];
    }), fermateInSequenza(linea, ctx));
    return radice;
  };
}

// Tutte le linee sotto il clic: un accordion per linea (aperto solo se è l'unica). Direzioni e orari si costruiscono
// alla prima apertura, così `orari.json` non si scarica per decine di linee che nessuno ha aperto.
export function elencoLinee(gruppi, ctx) {
  const radice = el('div', 'trasporto-linee');
  for (const g of gruppi) {
    const linea = el('details', 'scheda-acc trasporto-linea');
    const titolo = el('summary');
    titolo.append(chip({ numero: g.numero, colore: ctx.info(g.route_id, g.direzioni[0].direzione).colore }), ` ${g.nome}`);
    const corpo = el('div');
    linea.append(titolo, corpo);
    const riempi = () => {
      if (corpo.hasChildNodes()) return; // già costruito
      for (const d of g.direzioni) {
        corpo.append(el('h4', null, `${d.da} → ${d.a}`), orariLinea(d, ctx)());
      }
    };
    linea.addEventListener('toggle', () => { if (linea.open) riempi(); });
    if (gruppi.length === 1) { linea.open = true; riempi(); }
    radice.append(linea);
  }
  return radice;
}
```

- [ ] **Step 5: Implementare `trasporto.js`**

```js
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';
import { voceFermata, voceLinee } from './scheda-trasporto.js';
import { orariFermata, elencoLinee } from './trasporto-ui.js';
import { giornoIniziale, oggiISO } from './trasporto-orari.js';

// Linee bus/tram e fermate AMAT (GTFS). Strati spenti di default; i layer «hit» trasparenti sono sempre presenti
// (da zoom 13) così la scheda di destra mostra fermate e linee anche a strato spento, come per scuole e seggi.
// I colori delle linee sono quelli ufficiali del feed (route_color).
const COLORE_FERMATA = '#364fc7';
const ZOOM_MIN = 13;
const L = { bus: 'trasporto-bus', tram: 'trasporto-tram', fermate: 'trasporto-fermate', hitLinee: 'trasporto-hit-linee', hitFermate: 'trasporto-hit-fermate' };

const fermate = new Map(); // id -> proprietà complete (le feature di MapLibre trasformano gli array in testo)
const linee = new Map();

// orari.json (≈ 1 MB compresso) si scarica alla prima scheda aperta e poi resta in memoria
let promessaOrari = null;
function caricaOrari() {
  promessaOrari ??= fetch(urlDati('trasporto/orari.json'))
    .then(r => {
      if (!r.ok) throw new Error('file degli orari non raggiungibile');
      return r.json();
    })
    .catch(err => { promessaOrari = null; throw err; }); // un errore non resta in cache: si riprova
  return promessaOrari;
}

const ctx = {
  orari: caricaOrari,
  info: (route, dir) => linee.get(`linea-${route}-${dir}`) ?? { numero: route, colore: '#555555', a: '' },
  nomeFermata: id => fermate.get(id)?.nome ?? id,
};

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Legenda dentro il sotto-pannello del gruppo: sempre visibile, anche a strati spenti.
function creaLegenda(gruppo) {
  const box = el('div', 'legenda legenda-trasporto');
  const voce = (simbolo, testo) => {
    const r = el('div', 'trasporto-legenda-riga');
    r.append(simbolo, testo);
    box.append(r);
  };
  const tratto = classe => { const i = el('i', `trasporto-tratto ${classe}`); i.style.background = '#7B263E'; return i; };
  voce(tratto(''), 'Linea bus (colore AMAT)');
  voce(tratto('trasporto-tratto--tram'), 'Linea tram');
  voce(el('i', 'trasporto-pallino'), 'Fermata (da zoom 13)');
  gruppo.append(box);
}

export default {
  id: 'trasporto',
  titolo: 'Trasporto pubblico',
  aggiungiSorgenti(map) {
    map.addSource('trasporto-linee', { type: 'geojson', data: urlDati('trasporto/linee.geojson') });
    map.addSource('trasporto-fermate', { type: 'geojson', data: urlDati('trasporto/fermate.geojson') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    const spessore = (z1, z2) => ['interpolate', ['linear'], ['zoom'], 11, z1, 17, z2];
    const lineaDi = (id, tipo, min, max) => map.addLayer({
      id, type: 'line', source: 'trasporto-linee', filter: ['==', ['get', 'tipo'], tipo], layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'colore'], 'line-width': spessore(min, max), 'line-opacity': 0.9 },
    });
    lineaDi(L.bus, 'bus', 1.5, 4);
    lineaDi(L.tram, 'tram', 3, 7);
    map.addLayer({
      id: L.fermate, type: 'circle', source: 'trasporto-fermate', minzoom: ZOOM_MIN, layout: nascosto,
      paint: { 'circle-color': '#fff', 'circle-stroke-color': COLORE_FERMATA, 'circle-stroke-width': 2, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 17, 6] },
    });
    // strati trasparenti sempre presenti: la scheda mostra i dati anche a strato spento
    map.addLayer({ id: L.hitLinee, type: 'line', source: 'trasporto-linee', minzoom: ZOOM_MIN, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitFermate, type: 'circle', source: 'trasporto-fermate', minzoom: ZOOM_MIN, paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
  },
  async avvia() {
    const [f, l] = await Promise.all(['fermate', 'linee'].map(async n => {
      const r = await fetch(urlDati(`trasporto/${n}.geojson`)); // già in cache: è il file della sorgente
      if (!r.ok) throw new Error(`trasporto/${n}.geojson non raggiungibile`);
      return r.json();
    }));
    for (const x of f.features) fermate.set(x.properties.id, x.properties);
    for (const x of l.features) linee.set(x.properties.id, x.properties);
    if (giornoIniziale({ validita: f.validita }, oggiISO()).fuori) {
      segnala(`Orari del trasporto pubblico validi dal ${f.validita.da} al ${f.validita.a}: oggi sono fuori validità`);
    }
  },
  strati: [
    { id: 'trasporto-bus', etichetta: 'Linee bus', layers: [L.bus], attivo: false },
    { id: 'trasporto-tram', etichetta: 'Linee tram', layers: [L.tram], attivo: false },
    { id: 'trasporto-fermate', etichetta: 'Fermate', layers: [L.fermate], attivo: false },
  ],
  pannello: creaLegenda,
  scheda: {
    layers: [L.hitFermate, L.hitLinee],
    voci(trovati) {
      const visti = new Set();
      const voci = [];
      const sotto = [];
      for (const f of trovati) {
        const id = f.properties.id;
        if (visti.has(id)) continue; // i tile spezzano i tracciati in più frammenti
        visti.add(id);
        if (f.layer.id === L.hitFermate) {
          const p = fermate.get(id) ?? { ...f.properties, linee: [] };
          voci.push(voceFermata(p, orariFermata(id, ctx)));
        } else if (linee.has(id)) sotto.push(linee.get(id));
      }
      // tutte le linee del clic in una sola voce: su una strada principale sono decine
      if (sotto.length) voci.push(voceLinee(sotto, gruppi => elencoLinee(gruppi, ctx)));
      return voci;
    },
  },
};
```

- [ ] **Step 6: Registrare il modulo, icona e CSS**

`js/app.js`: aggiungere `import trasporto from './layers/trasporto.js';` dopo l'import di `scuole` e cambiare `MODULI` in
`[base, terreno, popolazione, territorio, edifici, monumenti, scuole, trasporto, confini]`.

`js/core/pannello.js`: in `ICONE` aggiungere (Material «directions_bus»)
`trasporto: 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',`
e in `ETICHETTE` aggiungere `trasporto: 'Bus'`.

`css/app.css` (in coda):

```css
/* Trasporto pubblico */
.trasporto-chip { display: inline-block; min-width: 2.2em; padding: 1px 6px; border-radius: 6px; font-weight: 700; font-size: 12px; text-align: center; }
.trasporto-giorno { display: block; margin: 6px 0; font-size: 12px; color: var(--muted); }
.trasporto-giorno input { font: inherit; margin-left: 4px; }
.trasporto-testata { margin: 8px 0 2px; font-size: 12px; }
.trasporto-ore { margin: 0 0 6px; line-height: 1.5; font-variant-numeric: tabular-nums; word-spacing: 1px; }
.trasporto-fermate { margin: 4px 0 0; padding-left: 20px; font-size: 12px; line-height: 1.5; max-height: 220px; overflow-y: auto; }
.legenda-trasporto { margin-top: 8px; }
.trasporto-legenda-riga { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.legenda i.trasporto-tratto { width: 22px; height: 4px; border: 0; border-radius: 2px; }
.legenda i.trasporto-tratto--tram { height: 7px; }
.legenda i.trasporto-pallino { width: 10px; height: 10px; border: 2px solid #364fc7; border-radius: 50%; background: #fff; }
```

- [ ] **Step 7: Eseguire i test**

Run: `npm run test:js && python3 -m pytest -q tests/test_viewer.py -k trasporto`
Expected: tutti PASS. Se un test fallisce per cause di temporizzazione, rieseguirlo una volta; se fallisce di nuovo, indagare (non aggiungere sleep).

- [ ] **Step 8: Verifica visiva**

Avviare `python3 scripts/serve.py 8000`, aprire `http://127.0.0.1:8000`, accendere i tre strati, zoomare a 15 su Palermo, cliccare una fermata e una linea. Controllare: colori linee, chip leggibili (TRAM2 giallo con testo nero), scheda con orari e selettore del giorno, legenda visibile con strati spenti. Riportare ciò che si è visto davvero; se il browser non è disponibile, dirlo.

- [ ] **Step 9: Commit**

```bash
git add js/layers/trasporto.js js/layers/trasporto-ui.js   # app.js, pannello.js, evidenza.js, css/app.css, test_viewer.py, evidenza.test.mjs sono file già sporchi dell'utente: restano fuori dal commit
git commit -m "feat: layer trasporto pubblico con schede di fermata e linea, orari per giorno

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Ricerca di linee e fermate

**Files:**
- Modify: `js/core/luoghi.js` (`FONTI`, `preparaLuoghi`, `cercaLuoghi`)
- Modify: `js/core/ricerca.js` (`vai`)
- Test: `tests/js/luoghi.test.mjs`, `tests/test_viewer.py`

**Interfaces:**
- Consumes: `fermate.geojson` e `linee.geojson` (Task 1, con `lon`/`lat` nelle properties); strati `trasporto-fermate`, `trasporto-bus`, `trasporto-tram` (Task 4).
- Produces: una fonte può avere `strato` stringa **o funzione** `p => string` e un `zoom` opzionale; i risultati di `cercaLuoghi` portano `zoom` (assente per le altre fonti). Un numero puro come «100» cerca anche nei nomi se non è una sezione elettorale.

- [ ] **Step 1: Scrivere i test JS (RED)**

In coda a `tests/js/luoghi.test.mjs`:

```js
const trasporto = preparaLuoghi([
  { strato: 'trasporto-fermate', nota: p => `Fermata, linee ${p.linee.join(', ')}`, campi: p => [p.nome],
    features: [punto('Piazza Indipendenza', { linee: ['100', '101'] })] },
  { strato: p => (p.tipo === 'tram' ? 'trasporto-tram' : 'trasporto-bus'), zoom: 14, nota: p => `${p.tipo}, ${p.da} → ${p.a}`,
    campi: p => [`Linea ${p.numero} ${p.nome}`],
    features: [punto('x', { numero: '100', nome: 'John Lennon - Oreto', tipo: 'bus', da: 'A', a: 'B' }),
      punto('x', { numero: 'TRAM1', nome: 'Linea 1', tipo: 'tram', da: 'C', a: 'D' })] },
]);

test('fermata trovata per nome, con le linee nella nota', () => {
  const [r] = cercaLuoghi(trasporto, 'indipendenza');
  assert.equal(r.etichetta, 'Piazza Indipendenza');
  assert.equal(r.nota, 'Fermata, linee 100, 101');
  assert.equal(r.strato, 'trasporto-fermate');
  assert.equal(r.zoom, undefined);
});

test('linea trovata per numero «100» (non è una sezione) e per nome; lo strato dipende dal tipo', () => {
  const [r] = cercaLuoghi(trasporto, '100');
  assert.equal(r.etichetta, 'Linea 100 John Lennon - Oreto');
  assert.equal(r.strato, 'trasporto-bus');
  assert.equal(r.zoom, 14);
  assert.equal(cercaLuoghi(trasporto, 'linea tram1')[0].strato, 'trasporto-tram');
});

test('un numero che è una sezione elettorale cerca ancora la sede', () => {
  const r = cercaLuoghi([...voci, ...trasporto], '248');
  assert.equal(r[0].strato, 'seggi');
});
```

Run: `node --test tests/js/luoghi.test.mjs`
Expected: FAIL (strato funzione non risolto, «100» non trovato).

- [ ] **Step 2: Implementare in `luoghi.js`**

1. In `FONTI`, dopo la riga dei monumenti, aggiungere:

```js
  { file: 'trasporto/fermate.geojson', strato: 'trasporto-fermate', nota: p => `Fermata${p.linee.length ? `, linee ${p.linee.join(', ')}` : ''}`, campi: p => [p.nome] },
  // le linee si trovano per numero o nome; lo strato da accendere è bus o tram
  { file: 'trasporto/linee.geojson', strato: p => (p.tipo === 'tram' ? 'trasporto-tram' : 'trasporto-bus'), zoom: 14,
    nota: p => `${p.tipo === 'tram' ? 'Tram' : 'Bus'}, ${p.da} → ${p.a}`, campi: p => [`Linea ${p.numero} ${p.nome}`] },
```

2. Aggiornare il commento di `FONTI`: «strato: nome o funzione sulle proprietà; zoom: opzionale». In `preparaLuoghi` destrutturare `zoom` e restituire `strato: typeof strato === 'function' ? strato(p) : strato, zoom,`:

```js
  return fonti.flatMap(({ strato, zoom, nota, campi, sezioni, features }, ordine) => features.map(f => {
    const p = f.properties;
    const [nome, ...altri] = campi(p);
    return {
      etichetta: nome, nota: nota(p), strato: typeof strato === 'function' ? strato(p) : strato, zoom, ordine, lon: p.lon, lat: p.lat,
```

3. In `cercaLuoghi` il ramo `sez` deve cadere sul testo se nessuna sede ha quella sezione:

```js
  if (sez) {
    const n = String(+sez[1]);
    const sedi = voci.filter(v => v.sezioni.includes(n));
    if (sedi.length) {
      return sedi.slice(0, max)
        .map(v => ({ etichetta: `Sezione ${n} — ${v.etichetta}`, nota: v.extra ? `Sede elettorale, ${v.extraOrig}` : 'Sede elettorale', strato: v.strato, lon: v.lon, lat: v.lat, prefisso: true }));
    }
  }
```

4. Nella `.map` finale aggiungere `zoom: v.zoom` ai campi restituiti: `.map(({ v, prefisso }) => ({ etichetta: v.etichetta, nota: v.nota, strato: v.strato, zoom: v.zoom, lon: v.lon, lat: v.lat, prefisso }));`

In `js/core/ricerca.js`, funzione `vai`: sostituire `zoom: 18` con `zoom: r.zoom ?? 18`.

- [ ] **Step 3: Eseguire i test JS**

Run: `npm run test:js`
Expected: tutti PASS (il test esistente `cercaLuoghi(voci, '24') → []` resta valido: meno di 3 caratteri).

- [ ] **Step 4: Test browser**

In coda a `tests/test_viewer.py`:

```python
def test_ricerca_trova_fermata_e_linea_e_accende_lo_strato(apri):
    base = _dati_trasporto()
    fermata = json.loads((base / "fermate.geojson").read_text(encoding="utf-8"))["features"][0]["properties"]
    v = apri()
    v.attendi_pronto()
    assert not v.js("document.getElementById('strato-trasporto-fermate').checked")
    _cerca_e_vai(v, fermata["nome"].lower(), fermata["lon"], fermata["lat"])
    assert v.js("document.getElementById('strato-trasporto-fermate').checked")

    # una linea tram, se c'è: lo strato da accendere dipende dal tipo e il test deve poterlo distinguere
    linee = [f["properties"] for f in json.loads((base / "linee.geojson").read_text(encoding="utf-8"))["features"]]
    linea = next((p for p in linee if p["tipo"] == "tram"), linee[0])
    strato, altro = ("trasporto-tram", "trasporto-bus") if linea["tipo"] == "tram" else ("trasporto-bus", "trasporto-tram")
    v.page.fill("#cerca-testo", f"linea {linea['numero']} {linea['nome']}".lower())  # nome completo: il primo risultato è questa linea (o l'altra sua direzione)
    v.page.wait_for_selector("#cerca-risultati button")
    assert f"Linea {linea['numero']}" in v.page.inner_text("#cerca-risultati button >> nth=0")
    v.page.click("#cerca-risultati button >> nth=0")
    assert v.js(f"document.getElementById('strato-{strato}').checked")
    assert not v.js(f"document.getElementById('strato-{altro}').checked")
```

Verificare prima la firma di `_cerca_e_vai(v, testo, lon, lat)` in `tests/test_viewer.py` (grep) e adattare la chiamata se è diversa. Run: `python3 -m pytest -q tests/test_viewer.py -k "ricerca and (fermata or luoghi or scuole)"`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
# luoghi.js, ricerca.js, luoghi.test.mjs, test_viewer.py sono già sporchi/non tracciati per il lavoro dell'utente: nessun add, nessun commit.
# Verificare con `git diff --stat` che le modifiche siano solo quelle del piano e riferirle all'utente a fine lavoro.
git status --short js/core tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Crediti, README, grafo e verifica finale

**Files:**
- Modify: `js/core/catalogo.js` (riga crediti, accanto a scuole e monumenti, ~r.47)
- Modify: `dati/README.md` (nuova sezione dopo «Scuole e sezioni elettorali»)
- Modify: `docs/RIPARTENZA.md` (una riga di stato)

**Interfaces:**
- Consumes: tutto il lavoro dei Task 1–5.

- [ ] **Step 1: Credito AMAT**

In `js/core/catalogo.js`, subito dopo la riga delle scuole, aggiungere:

```js
    'Trasporto pubblico (linee, fermate, orari): AMAT Palermo S.p.A., feed GTFS valido dal 25/08/2026 al 31/10/2026 — condizioni d\'uso da verificare',
```

- [ ] **Step 2: README dati**

In `dati/README.md`, dopo la sezione «Scuole e sezioni elettorali (`scuole/`)», aggiungere:

```markdown
## Trasporto pubblico (`gtfs/` → `trasporto/`)

Feed GTFS di AMAT Palermo (71 linee: 67 bus e 4 tram; 1.668 fermate; validità 25/08/2026–31/10/2026) in `gtfs/`. `scripts/gtfs.py` lo trasforma in `trasporto/fermate.geojson`
(punti con linee che passano e accessibilità; membro `validita`), `trasporto/linee.geojson` (un tracciato per linea e direzione, con le fermate in sequenza) e `trasporto/orari.json`
(partenze per fermata, linea, direzione e servizio in minuti dalla mezzanotte; le date di ogni servizio vengono da `calendar_dates`: il feed non ha `calendar.txt`).
Come `scuole/`, `trasporto/` non sta in git: si rigenera con `python3 scripts/gtfs.py`. Alla scadenza del feed va sostituito `gtfs/` e rilanciato lo script.
```

- [ ] **Step 3: Suite completa**

Run: `python3 -m pytest -q && npm run test:js`
Expected: tutto PASS. Se qualcosa non passa, riportare l'output e non dichiarare finito.

- [ ] **Step 4: Aggiornare il grafo**

Run: `graphify update .`
Expected: terminato senza errori.

- [ ] **Step 5: Nota di stato e commit**

Aggiungere in `docs/RIPARTENZA.md`, nella sezione di stato, una riga: «Trasporto pubblico AMAT (GTFS): layer, schede, orari e ricerca implementati; dati da rigenerare con `python3 scripts/gtfs.py` (feed valido fino al 31/10/2026)». Poi:

```bash
git add docs/RIPARTENZA.md   # catalogo.js e dati/README.md sono già sporchi dell'utente: restano fuori dal commit
git commit -m "docs: stato del trasporto pubblico in RIPARTENZA

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
