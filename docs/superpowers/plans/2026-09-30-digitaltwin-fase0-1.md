# Digital Twin di Palermo — Fase 0 + Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consegnare un catalogo dati validato (fase 0) e un viewer web statico che sovrappone catasto, PRG 2004, vincoli, popolazione 2021/2023 ed edifici 3D, con scheda del luogo al click e ricerca per civico (fase 1).

**Architecture:** Sito statico senza backend né bundler. MapLibre GL JS 4.7.1 + protocollo `pmtiles`, ES modules. Un modulo per tema in `js/layers/` con interfaccia fissa; un nucleo in `js/core/` (mappa, pannello, scheda, ricerca, catalogo). Fase 0 è uno script Python (`scripts/valida_dati.py`) che verifica i dati copiati in `dati/` e genera `dati/catalogo.json`, letto dal viewer per i crediti.

**Tech Stack:** Python 3.13 (GDAL/OGR 3.10 bindings `osgeo`, pytest 9, Playwright/Chromium), Node 22 (`node --test`), CLI `pmtiles`, MapLibre GL JS 4.7.1, pmtiles.js 4.4.1 (vendored), HTML/CSS/JS vanilla.

**Spec:** `docs/superpowers/specs/2026-09-30-digitaltwin-fase0-1-design.md` (leggere prima di iniziare; contesto in `docs/PIANO_DigitalTwin_Palermo.md`).

Tutti i comandi si eseguono dalla radice `/home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin` (qui `.`).

## Global Constraints

- Nessun backend, nessun bundler: ES modules nel browser; le librerie sono in `js/vendor/` come script classici (globali `maplibregl`, `pmtiles`).
- MapLibre GL JS **4.7.1** e pmtiles.js **4.4.1**, copiati in locale (nessuna CDN a runtime).
- UI in italiano.
- Ogni file in `dati/` resta sotto i 100 MB (limite GitHub); il manifesto (`dati/MANIFEST.tsv`) è la fonte di verità su cosa c'è in `dati/`.
- Il catasto è visibile e interrogabile solo da zoom ≥ 15 (precisione dei tile).
- Avviso permanente nel viewer: catasto, PRG e vincoli sono **informativi, senza valore legale**; il PRG 2004 può non includere varianti successive; i dati 2023 sono **stime campionarie** (censimento permanente).
- Un PMTiles mancante o non caricabile disattiva solo il suo strato e mostra un avviso: il viewer continua a funzionare.
- Confronto 2021↔2023 sempre su `SEZ21_ID`; ogni sezione 2023 deve esistere nel 2021 (le 510 sezioni 2021 senza dato 2023 sono mostrate in grigio "senza dato", mai come zero).
- Fuori ambito: GTFS, terreno 3D/ombre, scenari, LiDAR, dati live, dati personali.
- Commit: messaggi in inglese breve (`feat:`, `test:`, `chore:`), con trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

Condizioni che la spec implica ma che nessun flusso "felice" esercita; ognuna ha il test nel task indicato.

1. **Sezione 2021 senza dato 2023** selezionando il 2023: deve restare senza valore (grigia), non colorata come 0 o con il valore 2021 residuo. → Task 5.
2. **Sezione con `P1` nullo o zero** (sezioni non popolate) e indicatori percentuali: nessun `NaN`/`Infinity`, la sezione risulta "senza dato". → Task 3.
3. **Un PMTiles non caricabile** (file bloccato/mancante): compare un avviso con il nome dello strato e il resto del viewer funziona. → Task 4.
4. **Ricerca indirizzo con input scomodi**: maiuscole/minuscole, accenti ("Libertà"), apostrofo ("Bondi"), solo cifre, stringa vuota, civico inesistente. → Task 3.
5. **Click fuori dalla copertura** (mare, zoom troppo basso): la scheda dice "Nessun dato in questo punto", non resta vuota né va in errore. → Task 8.

---

## File Structure

```
DigitalTwin/
  .gitignore  package.json  pytest.ini
  index.html
  css/app.css                      stile dell'interfaccia
  css/vendor/maplibre-gl.css
  js/vendor/{maplibre-gl.js,pmtiles.js}
  js/app.js                        composizione: mappa, moduli, pannello, scheda, ricerca
  js/core/config.js                percorsi, centro mappa, helper pmt()/urlDati()
  js/core/mappa.js                 crea la mappa + protocollo pmtiles
  js/core/indicatori.js            puro: quantili(), INDICATORI (testato con node)
  js/core/indirizzi.js             puro: normalizza(), preparaIndice(), cerca() (testato con node)
  js/core/pannello.js              pannello strati (checkbox) + avvisi
  js/core/catalogo.js              carica catalogo.json, crea la finestra crediti
  js/core/scheda.js                scheda del luogo al click
  js/core/ricerca.js               UI della ricerca per civico
  js/layers/confini.js             circoscrizioni, quartieri, UPL, sezioni (linee)
  js/layers/popolazione.js         coropletico 2021/2023
  js/layers/territorio.js          catasto, PRG, vincoli, OMI, immobili, civici
  js/layers/edifici.js             edifici 3D
  scripts/serve.py                 server statico con HTTP Range
  scripts/valida_dati.py           fase 0
  scripts/fonti.py                 tabella fonte/data/licenza per file
  tests/conftest.py  tests/test_server.py  tests/test_valida_dati.py  tests/test_viewer.py
  tests/js/indicatori.test.mjs  tests/js/indirizzi.test.mjs
  dati/…                           già copiati (MANIFEST.tsv, README.md) + catalogo.json (generato)
  docs/catalogo.md                 generato
```

---

### Task 0: Repository, strumenti e server con Range

**Files:**
- Create: `.gitignore`, `package.json`, `pytest.ini`, `scripts/serve.py`, `tests/conftest.py`, `tests/test_server.py`
- Create (copiati): `js/vendor/maplibre-gl.js`, `js/vendor/pmtiles.js`, `css/vendor/maplibre-gl.css`

**Interfaces:**
- Produces: fixture pytest `server` (scope `session`) → `str` URL base `http://127.0.0.1:<porta>`; `ROOT: pathlib.Path` in `tests/conftest.py`; `scripts/` nel `pythonpath` di pytest.

- [ ] **Step 1: Inizializza git e file di configurazione**

```bash
git init -b main
cat > .gitignore <<'EOF'
__pycache__/
.pytest_cache/
node_modules/
.remember/
# i dati pesanti non vanno in git: restano MANIFEST, README e catalogo
dati/*/
EOF
cat > package.json <<'EOF'
{
  "name": "digitaltwin-palermo",
  "private": true,
  "type": "module",
  "scripts": { "test:js": "node --test tests/js/*.test.mjs" }
}
EOF
cat > pytest.ini <<'EOF'
[pytest]
testpaths = tests
pythonpath = scripts
EOF
```

- [ ] **Step 2: Copia le librerie e verifica le versioni**

```bash
mkdir -p js/vendor css/vendor
cp ../palermo_popolazione/js/maplibre-gl.js js/vendor/maplibre-gl.js
cp ../palermo_popolazione/css/maplibre-gl.css css/vendor/maplibre-gl.css
cp ../Fontanelle/node_modules/pmtiles/dist/pmtiles.js js/vendor/pmtiles.js
head -c 300 js/vendor/maplibre-gl.js | tr '\n' ' '; echo
grep -o '"version": "[^"]*"' ../Fontanelle/node_modules/pmtiles/package.json
```
Expected: l'intestazione di `maplibre-gl.js` cita `MapLibre GL JS` e la versione **4.7.1** (se la versione è diversa, sostituire con `../Fontanelle/node_modules/maplibre-gl/dist/maplibre-gl.js` e `.css`, che sono 4.7.1); pmtiles **4.4.1**.

- [ ] **Step 3: Scrivi il test che fallisce (server con Range)**

`tests/test_server.py`:
```python
import urllib.request


def test_server_risponde_a_range_con_206(server):
    req = urllib.request.Request(
        server + "/dati/catasto/particelle.pmtiles", headers={"Range": "bytes=0-6"}
    )
    with urllib.request.urlopen(req) as r:
        assert r.status == 206
        assert r.read() == b"PMTiles"
        assert r.headers["Access-Control-Allow-Origin"] == "*"
```

`tests/conftest.py`:
```python
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def _porta_libera():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def server():
    porta = _porta_libera()
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "scripts" / "serve.py"), str(porta)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    url = f"http://127.0.0.1:{porta}"
    for _ in range(50):
        try:
            urllib.request.urlopen(url + "/", timeout=0.5)
            break
        except Exception:
            time.sleep(0.1)
    else:
        proc.kill()
        raise RuntimeError("server non partito")
    yield url
    proc.terminate()
    proc.wait(timeout=5)
```

- [ ] **Step 4: Verifica che fallisca**

Run: `python -m pytest tests/test_server.py -v`
Expected: FAIL/ERROR con `RuntimeError: server non partito` (manca `scripts/serve.py`).

- [ ] **Step 5: Crea `scripts/serve.py` dal server esistente**

```bash
mkdir -p scripts
cp ../palermo_dtm_5m/run_server.py scripts/serve.py
python3 - <<'EOF'
from pathlib import Path
p = Path("scripts/serve.py")
s = p.read_text()
i = s.index("if __name__ == '__main__':")
p.write_text(s[:i] + '''if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # serve sempre la radice del progetto, da qualunque cartella venga lanciato
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    print(f"Serving http://127.0.0.1:{port} (HTTP Range + CORS)")
    test(HandlerClass=RangeRequestHandler, port=port, bind='127.0.0.1')
''')
EOF
```

- [ ] **Step 6: Verifica che passi**

Run: `python -m pytest tests/test_server.py -v`
Expected: PASS (1 passed).

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json pytest.ini scripts/serve.py tests js css docs dati/README.md dati/MANIFEST.tsv
git status --short | head
git commit -q -m "chore: init repo, vendored libs, range-capable dev server" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: `git status` non mostra file sotto `dati/<cartelle>/` (ignorati); il commit riesce.

---

### Task 1: Validazione del manifesto e delle sezioni (fase 0, parte 1)

**Files:**
- Create: `scripts/valida_dati.py`, `tests/test_valida_dati.py`

**Interfaces:**
- Produces (in `scripts/valida_dati.py`):
  - `ROOT: Path`, `DATI: Path` (= `ROOT/"dati"`), `DOCS: Path`
  - `sha256_file(path: Path) -> str`
  - `leggi_manifest(dati: Path = DATI) -> list[dict]` (chiavi `percorso_dest`, `dimensione_byte`, `sha256`, `sorgente`)
  - `verifica_manifest(dati: Path = DATI) -> list[str]` (lista errori, vuota se ok)
  - `controlla_sezioni(dati: Path = DATI) -> list[str]`

- [ ] **Step 1: Scrivi i test che falliscono**

`tests/test_valida_dati.py`:
```python
import hashlib
import json

import valida_dati as v

INTESTAZIONE = "percorso_dest\tdimensione_byte\tsha256\tsorgente\n"


def _sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _manifest(dati, righe):
    (dati / "MANIFEST.tsv").write_text(
        INTESTAZIONE + "".join("\t".join(map(str, r)) + "\n" for r in righe),
        encoding="utf-8",
    )


def test_manifest_ok(tmp_path):
    (tmp_path / "t").mkdir()
    (tmp_path / "t" / "a.txt").write_bytes(b"ciao")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x")])
    assert v.verifica_manifest(tmp_path) == []


def test_manifest_file_mancante(tmp_path):
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x")])
    assert v.verifica_manifest(tmp_path) == ["manca: t/a.txt"]


def test_manifest_dimensione_diversa(tmp_path):
    (tmp_path / "t").mkdir()
    (tmp_path / "t" / "a.txt").write_bytes(b"ciaoo")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x")])
    assert v.verifica_manifest(tmp_path) == ["dimensione diversa: t/a.txt"]


def test_manifest_hash_diverso_a_parita_di_dimensione(tmp_path):
    (tmp_path / "t").mkdir()
    (tmp_path / "t" / "a.txt").write_bytes(b"ciau")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x")])
    assert v.verifica_manifest(tmp_path) == ["hash diverso: t/a.txt"]


def _sezioni(dati, ids21, ids23):
    (dati / "popolazione").mkdir(exist_ok=True)
    (dati / "popolazione" / "sezioni_indicatori.json").write_text(
        json.dumps([{"SEZ21_ID": i} for i in ids21])
    )
    (dati / "popolazione" / "sezioni_indicatori_2023.json").write_text(
        json.dumps([{"SEZ21_ID": i} for i in ids23])
    )


def test_sezioni_coerenti(tmp_path):
    _sezioni(tmp_path, [1, 2, 3], [1, 3])
    assert v.controlla_sezioni(tmp_path) == []


def test_sezioni_duplicate(tmp_path):
    _sezioni(tmp_path, [1, 2, 2], [1])
    assert v.controlla_sezioni(tmp_path) == ["SEZ21_ID duplicati nel 2021"]


def test_sezioni_2023_non_nel_2021(tmp_path):
    _sezioni(tmp_path, [1, 2], [1, 9])
    assert v.controlla_sezioni(tmp_path) == ["1 sezioni 2023 assenti nel 2021"]


def test_dati_reali_manifest_integro():
    assert v.verifica_manifest() == []


def test_dati_reali_sezioni_coerenti():
    assert v.controlla_sezioni() == []
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python -m pytest tests/test_valida_dati.py -v`
Expected: ERRORE di collection `ModuleNotFoundError: No module named 'valida_dati'`.

- [ ] **Step 3: Implementa**

`scripts/valida_dati.py`:
```python
#!/usr/bin/env python3
"""Fase 0: verifica i dati in dati/ e genera dati/catalogo.json e docs/catalogo.md."""
import csv
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATI = ROOT / "dati"
DOCS = ROOT / "docs"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for blocco in iter(lambda: f.read(1 << 20), b""):
            h.update(blocco)
    return h.hexdigest()


def leggi_manifest(dati: Path = DATI) -> list[dict]:
    with open(dati / "MANIFEST.tsv", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def verifica_manifest(dati: Path = DATI) -> list[str]:
    errori = []
    for r in leggi_manifest(dati):
        rel = r["percorso_dest"]
        p = dati / rel
        if not p.is_file():
            errori.append(f"manca: {rel}")
        elif p.stat().st_size != int(r["dimensione_byte"]):
            errori.append(f"dimensione diversa: {rel}")
        elif sha256_file(p) != r["sha256"]:
            errori.append(f"hash diverso: {rel}")
    return errori


def _ids(path: Path) -> list:
    return [r["SEZ21_ID"] for r in json.loads(path.read_text(encoding="utf-8"))]


def controlla_sezioni(dati: Path = DATI) -> list[str]:
    errori = []
    a = _ids(dati / "popolazione" / "sezioni_indicatori.json")
    b = _ids(dati / "popolazione" / "sezioni_indicatori_2023.json")
    for nome, ids in (("2021", a), ("2023", b)):
        if len(ids) != len(set(ids)):
            errori.append(f"SEZ21_ID duplicati nel {nome}")
    extra = set(b) - set(a)
    if extra:
        errori.append(f"{len(extra)} sezioni 2023 assenti nel 2021")
    return errori
```

- [ ] **Step 4: Verifica che passino**

Run: `python -m pytest tests/test_valida_dati.py -v`
Expected: PASS (9 passed). Il test sui dati reali calcola l'hash di ~600 MB: può richiedere qualche secondo.

- [ ] **Step 5: Commit**

```bash
git add scripts/valida_dati.py tests/test_valida_dati.py
git commit -q -m "feat: validate data manifest and census section keys" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Catalogo, regole CRS/layer e report

**Files:**
- Modify: `scripts/valida_dati.py` (import + nuove funzioni + `main`)
- Create: `scripts/fonti.py`
- Modify: `tests/test_valida_dati.py` (nuovi test in coda)
- Modify (dati): copia `civici_index.json` in `dati/civici-omi/` e aggiungi la riga al manifesto
- Generate: `dati/catalogo.json`, `docs/catalogo.md`

**Interfaces:**
- Consumes: `leggi_manifest`, `verifica_manifest`, `controlla_sezioni`, `DATI`, `DOCS` (Task 1).
- Produces:
  - `info_pmtiles(path) -> {"layers": [{"nome","campi":[...],"minzoom","maxzoom"}]}`
  - `info_vettoriale(path) -> {"layers": [{"nome","geometria","n","epsg","campi"}], "epsg": int|None}`
  - `info_raster(path) -> {"dimensioni":[w,h],"epsg":int|None,"passo":[px,py],"nodata":float|None}`
  - `costruisci_catalogo(dati=DATI) -> list[dict]` con chiavi `percorso, tema, formato, byte, sha256` + dettagli + (se nota) `fonte, data, licenza`
  - `controlla_regole(catalogo) -> list[str]`
  - `scrivi_report(catalogo, percorso=DOCS/"catalogo.md")`, `main() -> int`
  - `CRS_ATTESI: dict[str,int]`, `LAYER_ATTESI: dict[str, dict[str, set[str]]]`
- Formato di `dati/catalogo.json`: lista di voci; il viewer usa `fonte`, `data`, `licenza`, `percorso`.

- [ ] **Step 1: Copia l'indice civici e registrarlo nel manifesto**

```bash
python3 - <<'EOF'
import hashlib, shutil
from pathlib import Path
src = Path("/mnt/d/GitHub - Clone/SiciliaHub/palermohub/pmtiles/civici_index.json")
dst = Path("dati/civici-omi/civici_index.json")
shutil.copy2(src, dst)
h = hashlib.sha256(dst.read_bytes()).hexdigest()
with open("dati/MANIFEST.tsv", "a", encoding="utf-8") as f:
    f.write(f"civici-omi/civici_index.json\t{dst.stat().st_size}\t{h}\t{src}\n")
print(dst.stat().st_size, "byte")
EOF
```
Expected: stampa circa `4492134 byte`.

- [ ] **Step 2: Scrivi i test che falliscono**

Aggiungere in coda a `tests/test_valida_dati.py`:
```python
import pytest
from pathlib import Path

DATI_REALI = Path(v.DATI)


@pytest.fixture(scope="session")
def catalogo():
    return v.costruisci_catalogo()


def test_raster_dtm():
    info = v.info_raster(DATI_REALI / "terreno" / "palermo_dtm5m.tif")
    assert info["epsg"] == 6875
    assert info["dimensioni"] == [3680, 3871]
    assert abs(info["passo"][0] - 5.0) < 0.01
    assert info["nodata"] == -9999


def test_pmtiles_catasto():
    info = v.info_pmtiles(DATI_REALI / "catasto" / "particelle.pmtiles")
    layer = {l["nome"]: l for l in info["layers"]}["particelle"]
    assert {"Foglio", "Paricella"} <= set(layer["campi"])
    assert layer["minzoom"] == 12 and layer["maxzoom"] == 18


def test_vettoriale_edifici():
    info = v.info_vettoriale(DATI_REALI / "edifici" / "edificato.gpkg")
    assert info["epsg"] == 4326
    assert info["layers"][0]["n"] == 111844


def test_catalogo_reale_rispetta_le_regole(catalogo):
    assert v.controlla_regole(catalogo) == []


def test_catalogo_non_contiene_percorsi_locali(catalogo):
    assert "/mnt/" not in json.dumps(catalogo)


def _voce(percorso, **extra):
    return {"percorso": percorso, "byte": 10, **extra}


def test_regole_segnala_crs_sbagliato():
    cat = [_voce("edifici/edificato.gpkg", epsg=3857)]
    errori = v.controlla_regole(cat)
    assert "edifici/edificato.gpkg: EPSG 3857 invece di 4326" in errori


def test_regole_segnala_layer_e_campi_mancanti():
    cat = [
        _voce("catasto/particelle.pmtiles", layers=[{"nome": "altro", "campi": []}]),
        _voce("prg-vincoli/prg.pmtiles", layers=[{"nome": "zto", "campi": ["ZTO"]}]),
    ]
    errori = v.controlla_regole(cat)
    assert "catasto/particelle.pmtiles: layer particelle assente" in errori
    assert "prg-vincoli/prg.pmtiles/zto: campi mancanti ['DESCRIZION']" in errori


def test_regole_segnala_file_oltre_100mb():
    cat = [_voce("x/grande.bin", byte=101 * 1024 * 1024)]
    assert "x/grande.bin: oltre 100 MB" in v.controlla_regole(cat)
```

- [ ] **Step 3: Verifica che falliscano**

Run: `python -m pytest tests/test_valida_dati.py -v -k "raster or pmtiles or vettoriale or catalogo or regole"`
Expected: FAIL `AttributeError: module 'valida_dati' has no attribute 'info_raster'` (e simili).

- [ ] **Step 4: Crea `scripts/fonti.py`**

```python
"""Fonte, data e licenza dei file usati dal viewer (chiave = percorso in dati/).

La licenza è indicata solo dove è documentata nei progetti di origine;
altrove resta assente e va verificata prima di ogni ripubblicazione.
"""

FONTI = {
    "catasto/particelle.pmtiles": {
        "fonte": "S.I.T.R. Regione Siciliana e Agenzia delle Entrate — particelle catastali",
        "data": "2026-09",
    },
    "prg-vincoli/prg.pmtiles": {
        "fonte": "Comune di Palermo — Variante generale al PRG 2004: zonizzazione e vincoli",
        "data": "2004",
    },
    "civici-omi/civici_0226.pmtiles": {
        "fonte": "Comune di Palermo — numeri civici",
        "data": "2026-02",
    },
    "civici-omi/civici_index.json": {
        "fonte": "Comune di Palermo — numeri civici (indice per la ricerca)",
        "data": "2026-02",
    },
    "civici-omi/Zone_OMI_2025_II.pmtiles": {
        "fonte": "Agenzia delle Entrate — Osservatorio del Mercato Immobiliare, zone OMI",
        "data": "2025-S2",
    },
    "civici-omi/immobili_comunali_2024.pmtiles": {
        "fonte": "Comune di Palermo — immobili comunali",
        "data": "2024",
    },
    "edifici/edificato_pop.pmtiles": {
        "fonte": "Comune di Palermo — unità volumetriche CTC; popolazione per edificio: stima",
        "data": "2026",
    },
    "popolazione/geo_sezioni_2021.pmtiles": {
        "fonte": "ISTAT — sezioni di censimento 2021",
        "data": "2021",
    },
    "popolazione/sezioni_indicatori.json": {
        "fonte": "ISTAT — Censimento permanente della popolazione e delle abitazioni 2021",
        "data": "2021",
    },
    "popolazione/sezioni_indicatori_2023.json": {
        "fonte": "ISTAT — Censimento permanente 2023 (stime campionarie), via Cruscotto Statistico Comunale",
        "data": "2023",
        "licenza": "CC BY 4.0",
    },
    "popolazione/confini_amministrativi.pmtiles": {
        "fonte": "ISTAT / Comune di Palermo — circoscrizioni, quartieri, UPL",
        "data": "2021",
    },
}
```

- [ ] **Step 5: Implementa in `scripts/valida_dati.py`**

Sostituire le righe di import in testa con:
```python
import csv
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

from osgeo import gdal, ogr, osr

from fonti import FONTI

gdal.UseExceptions()
ogr.UseExceptions()
```
Dopo `DOCS = ROOT / "docs"` aggiungere:
```python
MAX_BYTE = 100 * 1024 * 1024
ESTENSIONI_VETTORIALI = {".gpkg", ".geojson"}

CRS_ATTESI = {
    "edifici/edificato.gpkg": 4326,
    "prg-vincoli/Variente_Generale_PRG_2004.gpkg": 4326,
    "terreno/palermo_dtm5m.tif": 6875,
    "terreno/dsm.tif": 6875,
}

# layer e campi su cui il viewer fa affidamento
LAYER_ATTESI = {
    "catasto/particelle.pmtiles": {"particelle": {"Foglio", "Paricella"}},
    "prg-vincoli/prg.pmtiles": {
        "zto": {"ZTO", "DESCRIZION"},
        "va": {"tipo", "descrizone"},
        "vl": {"TIPO"},
    },
    "popolazione/geo_sezioni_2021.pmtiles": {
        "sezioni": {"SEZ21_ID", "POP21", "FAM21", "ABI21", "Quartiere", "UPL", "Circoscrizione"}
    },
    "popolazione/confini_amministrativi.pmtiles": {
        "circoscrizioni": {"Circoscrizione"},
        "quartieri": {"Quartiere"},
        "upl": {"UPL"},
    },
    "edifici/edificato_pop.pmtiles": {"edificato": {"altezza", "pop_stim", "SEZ21_ID", "occupancy"}},
    "civici-omi/civici_0226.pmtiles": {"civici_wgs84": {"Odonimo", "Civico"}},
    "civici-omi/Zone_OMI_2025_II.pmtiles": {"Zone_OMI_2025_II": {"Zona", "Fascia"}},
    "civici-omi/immobili_comunali_2024.pmtiles": {
        "immobili_comunali_2024": {"TIPO", "INDIRIZZO"}
    },
}
```
In coda al file:
```python
def info_pmtiles(path: Path) -> dict:
    exe = shutil.which("pmtiles") or str(Path.home() / ".local/bin/pmtiles")
    out = subprocess.run(
        [exe, "show", str(path), "--metadata"], capture_output=True, text=True, check=True
    ).stdout
    meta = json.loads(out)
    return {
        "layers": [
            {
                "nome": l["id"],
                "campi": sorted(l.get("fields", {})),
                "minzoom": l.get("minzoom"),
                "maxzoom": l.get("maxzoom"),
            }
            for l in meta.get("vector_layers", [])
        ]
    }


def epsg_di(srs) -> int | None:
    if srs is None:
        return None
    code = srs.GetAuthorityCode(None)
    if code is None:
        try:
            srs = srs.Clone()
            srs.AutoIdentifyEPSG()
            code = srs.GetAuthorityCode(None)
        except RuntimeError:
            return None
    return int(code) if code else None


def info_vettoriale(path: Path) -> dict:
    ds = ogr.Open(str(path))
    layers = []
    for i in range(ds.GetLayerCount()):
        lyr = ds.GetLayerByIndex(i)
        defn = lyr.GetLayerDefn()
        layers.append(
            {
                "nome": lyr.GetName(),
                "geometria": ogr.GeometryTypeToName(lyr.GetGeomType()),
                "n": lyr.GetFeatureCount(),
                "epsg": epsg_di(lyr.GetSpatialRef()),
                "campi": [defn.GetFieldDefn(j).GetName() for j in range(defn.GetFieldCount())],
            }
        )
    return {"layers": layers, "epsg": layers[0]["epsg"] if layers else None}


def info_raster(path: Path) -> dict:
    ds = gdal.Open(str(path))
    gt = ds.GetGeoTransform()
    return {
        "dimensioni": [ds.RasterXSize, ds.RasterYSize],
        "epsg": epsg_di(osr.SpatialReference(wkt=ds.GetProjection())),
        "passo": [round(gt[1], 3), round(-gt[5], 3)],
        "nodata": ds.GetRasterBand(1).GetNoDataValue(),
    }


def costruisci_catalogo(dati: Path = DATI) -> list[dict]:
    voci = []
    for r in leggi_manifest(dati):
        rel = r["percorso_dest"]
        p = dati / rel
        suffisso = p.suffix.lower()
        voce = {
            "percorso": rel,
            "tema": rel.split("/")[0],
            "formato": suffisso.lstrip("."),
            "byte": int(r["dimensione_byte"]),
            "sha256": r["sha256"],
        }
        if suffisso == ".pmtiles":
            voce.update(info_pmtiles(p))
        elif suffisso in ESTENSIONI_VETTORIALI:
            voce.update(info_vettoriale(p))
        elif suffisso == ".tif":
            voce.update(info_raster(p))
        voce.update(FONTI.get(rel, {}))
        voci.append(voce)
    return voci


def controlla_regole(catalogo: list[dict]) -> list[str]:
    per_percorso = {v["percorso"]: v for v in catalogo}
    errori = []
    for voce in catalogo:
        if voce["byte"] > MAX_BYTE:
            errori.append(f"{voce['percorso']}: oltre 100 MB")
    for rel, epsg in CRS_ATTESI.items():
        voce = per_percorso.get(rel)
        if voce is None:
            errori.append(f"manca nel catalogo: {rel}")
        elif voce.get("epsg") != epsg:
            errori.append(f"{rel}: EPSG {voce.get('epsg')} invece di {epsg}")
    for rel, attesi in LAYER_ATTESI.items():
        voce = per_percorso.get(rel)
        if voce is None:
            errori.append(f"manca nel catalogo: {rel}")
            continue
        trovati = {l["nome"]: set(l["campi"]) for l in voce.get("layers", [])}
        for nome, campi in attesi.items():
            if nome not in trovati:
                errori.append(f"{rel}: layer {nome} assente")
            elif campi - trovati[nome]:
                errori.append(f"{rel}/{nome}: campi mancanti {sorted(campi - trovati[nome])}")
    return errori


def _dettagli(voce: dict) -> str:
    if "layers" in voce:
        return ", ".join(
            f"{l['nome']}" + (f" ({l['n']})" if "n" in l else "") for l in voce["layers"]
        )
    if "dimensioni" in voce:
        return f"{voce['dimensioni'][0]}×{voce['dimensioni'][1]} px, EPSG:{voce['epsg']}"
    return ""


def scrivi_report(catalogo: list[dict], percorso: Path = DOCS / "catalogo.md") -> None:
    righe = [
        "# Catalogo dati",
        "",
        "Generato da `scripts/valida_dati.py`. Non modificare a mano.",
        "",
        "| File | MB | Dettagli | Fonte |",
        "|---|---:|---|---|",
    ]
    for v in catalogo:
        righe.append(
            f"| `{v['percorso']}` | {v['byte'] / 1e6:.1f} | {_dettagli(v)} | {v.get('fonte', '')} |"
        )
    percorso.write_text("\n".join(righe) + "\n", encoding="utf-8")


def main() -> int:
    errori = verifica_manifest() + controlla_sezioni()
    catalogo = costruisci_catalogo()
    errori += controlla_regole(catalogo)
    (DATI / "catalogo.json").write_text(
        json.dumps(catalogo, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    scrivi_report(catalogo)
    for e in errori:
        print("ERRORE:", e, file=sys.stderr)
    print(f"{len(catalogo)} file catalogati, {len(errori)} errori")
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 6: Verifica che i test passino**

Run: `python -m pytest tests/test_valida_dati.py -v`
Expected: PASS (tutti). Se `test_raster_dtm` o `test_vettoriale_edifici` fallisce per `epsg` `None`, correggere `epsg_di` (per i raster/proiettati usare `srs.GetAuthorityCode("PROJCS")`) prima di proseguire. Se `test_catalogo_reale_rispetta_le_regole` elenca campi mancanti, **non allentare la regola**: verificare con `pmtiles show <file> --metadata` il nome reale del campo e correggere `LAYER_ATTESI` *e* il codice del viewer che lo usa.

- [ ] **Step 7: Genera catalogo e report sui dati reali**

Run: `python scripts/valida_dati.py`
Expected: stampa `162 file catalogati, 0 errori` e crea `dati/catalogo.json` e `docs/catalogo.md`.

- [ ] **Step 8: Commit**

```bash
git add scripts/valida_dati.py scripts/fonti.py tests/test_valida_dati.py dati/MANIFEST.tsv dati/catalogo.json docs/catalogo.md
git commit -q -m "feat: data catalog with CRS/layer rules and report" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
(`dati/civici-omi/civici_index.json` resta fuori da git come gli altri dati.)

---

### Task 3: Logica pura in JS — indicatori, quantili, indirizzi

**Files:**
- Create: `js/core/indicatori.js`, `js/core/indirizzi.js`
- Test: `tests/js/indicatori.test.mjs`, `tests/js/indirizzi.test.mjs`

**Interfaces:**
- Produces (`js/core/indicatori.js`):
  - `quantili(valori: number[], n: number) -> number[]` (soglie interne, crescenti, senza duplicati; `[]` se nessun valore finito)
  - `INDICATORI: { [chiave]: { etichetta: string, unita: string, calcola(record) -> number|null } }` con chiavi `residenti`, `densita`, `under15`, `over74`
- Produces (`js/core/indirizzi.js`):
  - `normalizza(s: string) -> string` (maiuscolo, senza accenti, solo `A-Z0-9' `, spazi singoli)
  - `preparaIndice(indice: {[via]: {[civico]: [lon,lat]}}) -> Voce[]`
  - `cerca(voci, testo: string, max = 8) -> {etichetta: string, lon: number, lat: number}[]`

- [ ] **Step 1: Scrivi i test che falliscono**

`tests/js/indicatori.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { quantili, INDICATORI } from '../../js/core/indicatori.js';

test('quantili: cinque classi su 1..10', () => {
  assert.deepEqual(quantili([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5), [3, 5, 7, 9]);
});

test('quantili: valori ripetuti non producono soglie duplicate', () => {
  assert.deepEqual(quantili([1, 1, 1, 1, 1, 1, 1, 1, 1, 2], 5), [1]);
});

test('quantili: nessun valore valido', () => {
  assert.deepEqual(quantili([], 5), []);
  assert.deepEqual(quantili([NaN, Infinity], 5), []);
});

test('residenti: P1 nullo o assente = senza dato', () => {
  assert.equal(INDICATORI.residenti.calcola({ P1: null }), null);
  assert.equal(INDICATORI.residenti.calcola({}), null);
  assert.equal(INDICATORI.residenti.calcola({ P1: '' }), null);
});

test('residenti: P1 = 0 è un dato valido', () => {
  assert.equal(INDICATORI.residenti.calcola({ P1: 0 }), 0);
});

test('percentuali: P1 nullo o zero = senza dato, mai NaN', () => {
  for (const k of ['under15', 'over74']) {
    assert.equal(INDICATORI[k].calcola({ P1: 0, P14: 0, P15: 0, P16: 0, P29: 0 }), null);
    assert.equal(INDICATORI[k].calcola({ P1: null, P14: 1, P15: 1, P16: 1, P29: 1 }), null);
  }
});

test('percentuali: componente mancante = senza dato', () => {
  assert.equal(INDICATORI.under15.calcola({ P1: 100, P14: 5, P15: null, P16: 5 }), null);
});

test('under15 e over74', () => {
  assert.equal(INDICATORI.under15.calcola({ P1: 100, P14: 5, P15: 5, P16: 5 }), 15);
  assert.equal(INDICATORI.over74.calcola({ P1: 200, P29: 50 }), 25);
});

test('densità: ab/ha da Area in m²; Area nulla o zero = senza dato', () => {
  assert.equal(INDICATORI.densita.calcola({ P1: 50, Area: 10000 }), 50);
  assert.equal(INDICATORI.densita.calcola({ P1: 50, Area: 0 }), null);
  assert.equal(INDICATORI.densita.calcola({ P1: null, Area: 10000 }), null);
});
```

`tests/js/indirizzi.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizza, preparaIndice, cerca } from '../../js/core/indirizzi.js';

const voci = preparaIndice({
  'VIA MAQUEDA': { '1': [13.36, 38.11], '100': [13.361, 38.112] },
  'VIA ROMA': { '5': [13.37, 38.12] },
  "ARCO BONDI'": { '1': [13.3678, 38.1148] },
  'VIA DELLA LIBERTA': { '7': [13.35, 38.13] },
  'CORSO VITTORIO EMANUELE': { '2': [13.365, 38.115] },
});

test('normalizza: maiuscole, accenti, punteggiatura, spazi', () => {
  assert.equal(normalizza('  Via  della Libertà!  '), 'VIA DELLA LIBERTA');
  assert.equal(normalizza("Arco Bondi'"), "ARCO BONDI'");
});

test('via e civico esistente', () => {
  const r = cerca(voci, 'via maqueda 100');
  assert.deepEqual(r[0], { etichetta: 'VIA MAQUEDA 100', lon: 13.361, lat: 38.112 });
});

test('via senza civico: primo civico disponibile', () => {
  const r = cerca(voci, 'via roma');
  assert.equal(r[0].etichetta, 'VIA ROMA');
  assert.equal(r[0].lon, 13.37);
});

test('accenti nella query', () => {
  assert.equal(cerca(voci, 'via della Libertà 7')[0].etichetta, 'VIA DELLA LIBERTA 7');
});

test('apostrofo opzionale nella query', () => {
  assert.equal(cerca(voci, 'arco bondi')[0].etichetta, "ARCO BONDI'");
  assert.equal(cerca(voci, "arco bondi' 1")[0].etichetta, "ARCO BONDI' 1");
});

test('civico inesistente: ripiega sulla via', () => {
  const r = cerca(voci, 'via roma 999');
  assert.equal(r[0].etichetta, 'VIA ROMA');
});

test('input scomodi: vuoto, spazi, solo cifre, nessuna corrispondenza', () => {
  assert.deepEqual(cerca(voci, ''), []);
  assert.deepEqual(cerca(voci, '   '), []);
  assert.deepEqual(cerca(voci, '100'), []);
  assert.deepEqual(cerca(voci, 'xyzxyz'), []);
});

test('ordina prima le vie che iniziano con il testo', () => {
  const v2 = preparaIndice({
    'PIAZZA VERDI': { '1': [1, 1] },
    'VIA VERDI': { '1': [2, 2] },
    'VERDI': { '1': [3, 3] },
  });
  assert.equal(cerca(v2, 'verdi')[0].etichetta, 'VERDI');
});

test('rispetta il numero massimo di risultati', () => {
  const tante = preparaIndice(Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [`VIA ${i} TEST`, { '1': [0, i] }])
  ));
  assert.equal(cerca(tante, 'test', 5).length, 5);
});
```

- [ ] **Step 2: Verifica che falliscano**

Run: `node --test tests/js/*.test.mjs`
Expected: FAIL `ERR_MODULE_NOT_FOUND` per `js/core/indicatori.js` e `indirizzi.js`.

- [ ] **Step 3: Implementa `js/core/indicatori.js`**

```js
// Logica pura sugli indicatori di popolazione: nessuna dipendenza dal browser.

const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);

function quota(r, campi) {
  const p = num(r.P1);
  if (!p) return null; // null o 0 residenti: nessuna percentuale
  let somma = 0;
  for (const c of campi) {
    const v = num(r[c]);
    if (v === null) return null;
    somma += v;
  }
  return 100 * somma / p;
}

export const INDICATORI = {
  residenti: { etichetta: 'Residenti', unita: 'ab.', calcola: r => num(r.P1) },
  densita: {
    etichetta: 'Densità', unita: 'ab/ha',
    calcola: r => {
      const p = num(r.P1), a = num(r.Area);
      return p !== null && a ? p / (a / 10000) : null;
    },
  },
  under15: { etichetta: 'Under 15', unita: '%', calcola: r => quota(r, ['P14', 'P15', 'P16']) },
  over74: { etichetta: 'Over 74', unita: '%', calcola: r => quota(r, ['P29']) },
};

// Soglie interne (n-1) per n classi a quantili, crescenti e senza duplicati.
export function quantili(valori, n) {
  const v = valori.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return [];
  const soglie = [];
  for (let i = 1; i < n; i++) {
    const s = v[Math.floor(i * v.length / n)];
    if (!soglie.length || s > soglie[soglie.length - 1]) soglie.push(s);
  }
  return soglie;
}
```

- [ ] **Step 4: Implementa `js/core/indirizzi.js`**

```js
// Ricerca per via e civico su un indice {VIA: {civico: [lon, lat]}}. Logica pura.

export function normalizza(s) {
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function preparaIndice(indice) {
  return Object.entries(indice).map(([via, civici]) => ({ via, norm: normalizza(via), civici }));
}

export function cerca(voci, testo, max = 8) {
  const m = normalizza(testo).match(/^(.*?)(?:\s+(\d+))?$/);
  const viaTesto = m[1];
  const civico = m[2];
  const token = viaTesto.split(' ').filter(Boolean);
  if (!token.length) return [];
  return voci
    .filter(v => token.every(t => v.norm.includes(t)))
    .sort((a, b) =>
      (b.norm.startsWith(viaTesto) - a.norm.startsWith(viaTesto)) || (a.norm.length - b.norm.length))
    .slice(0, max)
    .map(v => {
      if (civico && v.civici[civico]) {
        const [lon, lat] = v.civici[civico];
        return { etichetta: `${v.via} ${civico}`, lon, lat };
      }
      const [lon, lat] = Object.values(v.civici)[0];
      return { etichetta: v.via, lon, lat };
    });
}
```

- [ ] **Step 5: Verifica che passino**

Run: `node --test tests/js/*.test.mjs`
Expected: PASS (tutti i test, 0 fail).

- [ ] **Step 6: Commit**

```bash
git add js/core/indicatori.js js/core/indirizzi.js tests/js
git commit -q -m "feat: pure logic for indicators, quantiles and address search" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Guscio del viewer (mappa, pannello, avvisi, crediti)

**Files:**
- Create: `index.html`, `css/app.css`, `js/app.js`, `js/core/config.js`, `js/core/mappa.js`, `js/core/pannello.js`, `js/core/catalogo.js`
- Modify: `tests/conftest.py` (fixture Playwright), Create: `tests/test_viewer.py`

**Interfaces:**
- Consumes: fixture `server` (Task 0), `dati/catalogo.json` (Task 2).
- Produces (`js/core/config.js`): `DATI = 'dati/'`, `CENTRO = [13.3614, 38.1157]`, `ZOOM = 12`, `pmt(rel) -> 'pmtiles://<url assoluto>'`, `urlDati(rel) -> url assoluto`.
- Produces (`js/core/mappa.js`): `creaMappa(idContenitore: string) -> maplibregl.Map` (stile con solo base OSM id `osm`; registra il protocollo `pmtiles`).
- Produces (`js/core/pannello.js`): `costruisciPannello(map, moduli, contenitore)`, `segnala(testo: string)` (scrive in `#avvisi`, senza duplicati).
- Produces (`js/core/catalogo.js`): `caricaCatalogo() -> Promise<object[]>`, `apriCrediti(dialog, catalogo)`.
- **Interfaccia di un modulo tema** (usata da Task 5–8):
  ```js
  {
    id: 'confini',
    titolo: 'Confini',
    aggiungiSorgenti(map) {},        // solo addSource
    aggiungiLayer(map) {},           // solo addLayer, nell'ordine di sovrapposizione
    strati: [{ id, etichetta, layers: [idLayer], attivo: bool, suCambio?(attivo, map) }],
    pannello?(elemento, map) {},     // controlli extra
    avvia?(map) -> Promise,          // caricamenti asincroni dopo aggiungiLayer
    scheda?: { layers: [idLayerHit], voce(feature) -> { peso, titolo, righe: [[etichetta, valore]] } }
  }
  ```
- `window.dt = { map, moduli, pronto: boolean }` per i test. Gli id delle checkbox sono `strato-<id strato>`.

- [ ] **Step 1: Estendi `tests/conftest.py` con i fixture del browser**

Aggiungere in coda a `tests/conftest.py`:
```python
import struct
import zlib


def _png_1x1():
    """PNG 1x1 grigio valido, con CRC corretti (un PNG malformato fa fallire le tile in modo intermittente)."""
    def blocco(tipo, dati):
        crc = zlib.crc32(tipo + dati) & 0xFFFFFFFF
        return struct.pack(">I", len(dati)) + tipo + dati + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 0, 0, 0, 0)  # 1x1, 8 bit, scala di grigi
    idat = zlib.compress(b"\x00\x80")  # filtro 0 + un pixel grigio
    return b"\x89PNG\r\n\x1a\n" + blocco(b"IHDR", ihdr) + blocco(b"IDAT", idat) + blocco(b"IEND", b"")


PNG_1X1 = _png_1x1()


class Pagina:
    def __init__(self, page, errori):
        self.page = page
        self.errori = errori

    def attendi_pronto(self):
        self.page.wait_for_function("window.dt && window.dt.pronto === true", timeout=60000)

    def js(self, espressione):
        return self.page.evaluate(espressione)

    def vai(self, lon, lat, zoom):
        """Sposta la mappa e attende che abbia finito di caricare i tile."""
        self.page.evaluate(
            """([lon, lat, zoom]) => new Promise(r => {
                const m = window.dt.map;
                m.once('idle', r);
                m.jumpTo({ center: [lon, lat], zoom });
            })""",
            [lon, lat, zoom],
        )

    def clic(self, lon, lat):
        x, y = self.js(
            f"""(() => {{
                const m = window.dt.map, p = m.project([{lon}, {lat}]);
                const r = m.getCanvas().getBoundingClientRect();
                return [r.left + p.x, r.top + p.y];
            }})()"""
        )
        self.page.mouse.click(x, y)


@pytest.fixture(scope="session")
def _browser():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture
def apri(server, _browser):
    """apri(blocca=None) -> Pagina. `blocca` è un pattern di URL da far fallire."""
    contesti = []

    def _apri(blocca=None):
        ctx = _browser.new_context(viewport={"width": 1280, "height": 800})
        contesti.append(ctx)
        page = ctx.new_page()
        errori = []
        page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errori.append(str(e)))
        page.route(
            "https://tile.openstreetmap.org/**",
            lambda r: r.fulfill(status=200, content_type="image/png", body=PNG_1X1),
        )
        if blocca:
            page.route(blocca, lambda r: r.abort())
        page.goto(server + "/index.html")
        return Pagina(page, errori)

    yield _apri
    for c in contesti:
        c.close()
```

- [ ] **Step 2: Scrivi i test che falliscono**

`tests/test_viewer.py`:
```python
def test_carica_senza_errori(apri):
    v = apri()
    v.attendi_pronto()
    assert v.errori == []
    assert v.js("window.dt.map.getLayer('osm') !== undefined")


def test_strato_non_caricabile_mostra_avviso_e_il_viewer_resta_vivo(apri):
    v = apri(blocca="**/dati/catasto/**")
    v.attendi_pronto()
    # Il catasto viene aggiunto nel Task 6: qui verifichiamo il meccanismo generale
    # forzando il caricamento di una sorgente bloccata.
    v.js(
        """() => window.dt.map.addSource('prova-catasto',
            { type: 'vector', url: 'pmtiles://' + new URL('dati/catasto/particelle.pmtiles', document.baseURI).href })"""
    )
    v.page.wait_for_function(
        "document.getElementById('avvisi').textContent.includes('prova-catasto')", timeout=30000
    )
    assert v.js("window.dt.pronto") is True
    assert v.js("window.dt.map.getLayer('osm') !== undefined")


def test_crediti_mostrano_fonti_e_avvisi(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")  # il dialog si apre dopo il fetch del catalogo
    testo = v.page.inner_text("#crediti")
    assert "valore legale" in testo
    assert "stime campionarie" in testo
    assert "ISTAT" in testo
    assert "S.I.T.R." in testo
```

- [ ] **Step 3: Verifica che falliscano**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: FAIL (timeout su `window.dt`, manca `index.html`).

- [ ] **Step 4: Crea `index.html`**

```html
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digital Twin Palermo</title>
<link rel="stylesheet" href="css/vendor/maplibre-gl.css">
<link rel="stylesheet" href="css/app.css">
</head>
<body>
<div id="mappa"></div>

<aside id="pannello" aria-label="Strati della mappa">
  <h1>Digital Twin Palermo</h1>
  <div id="strati"></div>
  <button id="apri-crediti" type="button">Fonti e avvisi</button>
</aside>

<form id="cerca" role="search" autocomplete="off">
  <input id="cerca-testo" type="search" placeholder="Via e civico, es. via Maqueda 100" aria-label="Cerca indirizzo">
  <ul id="cerca-risultati" hidden></ul>
</form>

<aside id="scheda" hidden aria-live="polite"></aside>
<div id="avvisi" role="status"></div>
<dialog id="crediti"></dialog>

<script src="js/vendor/maplibre-gl.js"></script>
<script src="js/vendor/pmtiles.js"></script>
<script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Crea `css/app.css`**

```css
:root { --bg: #fff; --fg: #1b1f24; --muted: #5b6570; --bordo: #d0d7de; --acc: #0b5fff; --avviso: #fff4ce; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #161b22; --fg: #e6edf3; --muted: #9aa4af; --bordo: #30363d; --acc: #58a6ff; --avviso: #3d3318; }
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; font: 14px/1.4 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
#mappa { position: absolute; inset: 0; }
#pannello, #scheda, #cerca, #avvisi {
  position: absolute; z-index: 2; background: var(--bg); border: 1px solid var(--bordo); border-radius: 8px;
}
#pannello { top: 8px; left: 8px; width: 280px; max-height: calc(100% - 16px); overflow: auto; padding: 10px; }
#pannello h1 { font-size: 16px; margin: 0 0 8px; }
fieldset { border: 1px solid var(--bordo); border-radius: 6px; margin: 0 0 8px; padding: 6px 8px; }
legend { font-weight: 600; padding: 0 4px; }
label { display: block; padding: 2px 0; }
select { width: 100%; margin: 2px 0 6px; }
.legenda div { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.legenda i { width: 14px; height: 14px; border: 1px solid var(--bordo); display: inline-block; }
button { cursor: pointer; }
#cerca { top: 8px; left: 300px; width: 320px; padding: 4px; }
#cerca input { width: 100%; padding: 6px; }
#cerca-risultati { list-style: none; margin: 4px 0 0; padding: 0; max-height: 240px; overflow: auto; }
#cerca-risultati button { width: 100%; text-align: left; border: 0; background: none; color: var(--fg); padding: 6px; }
#cerca-risultati button:hover, #cerca-risultati button:focus { background: var(--bordo); }
#scheda { top: 8px; right: 8px; width: 300px; max-height: calc(100% - 16px); overflow: auto; padding: 10px; }
#scheda h2 { font-size: 15px; margin: 0 0 6px; }
#scheda h3 { font-size: 13px; margin: 10px 0 2px; color: var(--muted); }
#scheda dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; }
#scheda dt { color: var(--muted); }
#scheda dd { margin: 0; }
#avvisi { bottom: 8px; left: 50%; transform: translateX(-50%); padding: 0; border: 0; background: none; display: flex; flex-direction: column; gap: 4px; }
#avvisi div { background: var(--avviso); border: 1px solid var(--bordo); border-radius: 6px; padding: 4px 10px; }
dialog { max-width: 640px; width: calc(100% - 32px); background: var(--bg); color: var(--fg); border: 1px solid var(--bordo); border-radius: 8px; }
dialog li { margin: 4px 0; }
@media (max-width: 720px) {
  #pannello { width: calc(100% - 16px); max-height: 38%; }
  #cerca { top: auto; bottom: 8px; left: 8px; right: 8px; width: auto; }
  #scheda { top: auto; bottom: 64px; right: 8px; left: 8px; width: auto; max-height: 35%; }
  #avvisi { bottom: 110px; }
}
```

- [ ] **Step 6: Crea i moduli del nucleo**

`js/core/config.js`:
```js
export const DATI = 'dati/';
export const CENTRO = [13.3614, 38.1157];
export const ZOOM = 12;

export function urlDati(rel) {
  return new URL(DATI + rel, document.baseURI).href;
}

export function pmt(rel) {
  return 'pmtiles://' + urlDati(rel);
}
```

`js/core/mappa.js`:
```js
import { CENTRO, ZOOM } from './config.js';

export function creaMappa(idContenitore) {
  const protocollo = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocollo.tile);
  return new maplibregl.Map({
    container: idContenitore,
    center: CENTRO,
    zoom: ZOOM,
    maxZoom: 19,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© OpenStreetMap',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.6, 'raster-saturation': -0.6 } }],
    },
  });
}
```

`js/core/pannello.js`:
```js
const mostrati = new Set();

export function segnala(testo) {
  if (mostrati.has(testo)) return;
  mostrati.add(testo);
  const d = document.createElement('div');
  d.textContent = testo;
  document.getElementById('avvisi').append(d);
}

function imposta(map, ids, visibile) {
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibile ? 'visible' : 'none');
  }
}

export function costruisciPannello(map, moduli, contenitore) {
  for (const m of moduli) {
    const gruppo = document.createElement('fieldset');
    const legenda = document.createElement('legend');
    legenda.textContent = m.titolo;
    gruppo.append(legenda);
    for (const s of m.strati) {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `strato-${s.id}`;
      cb.checked = s.attivo;
      cb.addEventListener('change', () => {
        imposta(map, s.layers, cb.checked);
        if (s.suCambio) s.suCambio(cb.checked, map);
      });
      label.append(cb, ' ', s.etichetta);
      gruppo.append(label);
    }
    if (m.pannello) m.pannello(gruppo, map);
    contenitore.append(gruppo);
  }
}
```

`js/core/catalogo.js`:
```js
import { urlDati } from './config.js';

const AVVISI = [
  'Catasto, zonizzazione PRG e vincoli sono solo informativi e non hanno valore legale: per usi legali servono il certificato di destinazione urbanistica e le visure ufficiali.',
  'Il PRG vigente è la Variante generale 2004: varianti puntuali successive potrebbero non essere incluse.',
  'I dati del censimento 2023 sono stime campionarie (censimento permanente): i valori per sezione non sono conteggi esatti.',
  'La popolazione per edificio è una stima.',
];

export async function caricaCatalogo() {
  const r = await fetch(urlDati('catalogo.json'));
  if (!r.ok) throw new Error('catalogo.json non disponibile');
  return r.json();
}

export function apriCrediti(dialog, catalogo) {
  const titolo = document.createElement('h2');
  titolo.textContent = 'Fonti e avvisi';
  const avvisi = document.createElement('ul');
  for (const a of AVVISI) {
    const li = document.createElement('li');
    li.textContent = a;
    avvisi.append(li);
  }
  const fonti = document.createElement('ul');
  for (const v of catalogo.filter(v => v.fonte)) {
    const li = document.createElement('li');
    li.textContent = `${v.fonte} (${v.data})` + (v.licenza ? ` — ${v.licenza}` : ' — licenza da verificare');
    fonti.append(li);
  }
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.textContent = 'Chiudi';
  chiudi.addEventListener('click', () => dialog.close());
  dialog.replaceChildren(titolo, avvisi, fonti, chiudi);
  dialog.showModal();
}
```

`js/app.js`:
```js
import { creaMappa } from './core/mappa.js';
import { costruisciPannello, segnala } from './core/pannello.js';
import { caricaCatalogo, apriCrediti } from './core/catalogo.js';

const MODULI = [];

const map = creaMappa('mappa');
window.dt = { map, moduli: Object.fromEntries(MODULI.map(m => [m.id, m])), pronto: false };

// Un errore su una sorgente disattiva solo quello strato e lo segnala.
map.on('error', e => {
  if (e.sourceId) segnala(`Strato non caricato: ${e.sourceId}`);
});

map.on('load', async () => {
  for (const m of MODULI) m.aggiungiSorgenti(map);
  for (const m of MODULI) m.aggiungiLayer(map);
  costruisciPannello(map, MODULI, document.getElementById('strati'));

  const esiti = await Promise.allSettled(MODULI.filter(m => m.avvia).map(m => m.avvia(map)));
  esiti.forEach(e => { if (e.status === 'rejected') segnala(`Strato non caricato: ${e.reason?.message ?? e.reason}`); });

  document.getElementById('apri-crediti').addEventListener('click', async () => {
    try {
      apriCrediti(document.getElementById('crediti'), await caricaCatalogo());
    } catch (err) {
      segnala(String(err.message));
    }
  });
  window.dt.pronto = true;
});
```

- [ ] **Step 7: Verifica che passino**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: PASS (3 passed). Se `test_carica_senza_errori` mostra errori in console, leggerli (`print(v.errori)`) e correggere: un errore tipico è il protocollo `pmtiles` non registrato (verificare che `js/vendor/pmtiles.js` definisca `pmtiles.Protocol`).

- [ ] **Step 8: Commit**

```bash
git add index.html css/app.css js/app.js js/core tests/conftest.py tests/test_viewer.py
git commit -q -m "feat: viewer shell with panel, warnings and credits" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Confini e popolazione 2021/2023

**Files:**
- Create: `js/layers/confini.js`, `js/layers/popolazione.js`
- Modify: `js/app.js` (import + `MODULI`), `tests/test_viewer.py`

**Interfaces:**
- Consumes: interfaccia modulo e `window.dt` (Task 4); `pmt`, `urlDati` (config); `INDICATORI`, `quantili` (Task 3).
- Produces (`js/layers/confini.js`): `export const SRC_SEZIONI = 'sezioni'`; modulo default `id 'confini'`; sorgenti `confini` (PMTiles confini) e `sezioni` (PMTiles sezioni, `promoteId` su `SEZ21_ID`); layer `confini-circoscrizioni|quartieri|upl|sezioni`; strati `circoscrizioni` (attivo), `quartieri`, `upl`, `sezioni`.
- Produces (`js/layers/popolazione.js`): modulo default `id 'popolazione'`; layer `pop-fill` (visibile) e `pop-hit` (opacità 0, per la scheda); strato `coropletico` (attivo); metodi `imposta({anno?, indicatore?}) -> Promise<void>` e `stato() -> {anno:number, indicatore:string, nValori:number, breaks:number[]}`; `scheda.layers = ['pop-hit']` con `peso 30`.
- I valori sono in feature-state `v` su `{source:'sezioni', sourceLayer:'sezioni', id: SEZ21_ID}`.

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungere a `tests/test_viewer.py`:
```python
import json

from conftest import ROOT

POP = ROOT / "dati" / "popolazione"


def _righe(nome):
    return json.loads((POP / nome).read_text(encoding="utf-8"))


def _n_residenti(righe):
    return sum(1 for r in righe if r.get("P1") not in (None, ""))


def test_popolazione_2021_poi_2023(apri):
    v = apri()
    v.attendi_pronto()
    s = v.js("window.dt.moduli.popolazione.stato()")
    assert s["anno"] == 2021 and s["indicatore"] == "residenti"
    assert s["nValori"] == _n_residenti(_righe("sezioni_indicatori.json"))

    v.js("window.dt.moduli.popolazione.imposta({anno: 2023})")
    v.page.wait_for_function(
        "window.dt.moduli.popolazione.stato().anno === 2023 && window.dt.moduli.popolazione.stato().nValori > 0"
    )
    s = v.js("window.dt.moduli.popolazione.stato()")
    assert s["nValori"] == _n_residenti(_righe("sezioni_indicatori_2023.json"))


def test_sezione_2021_senza_dato_2023_resta_senza_valore(apri):
    r21, r23 = _righe("sezioni_indicatori.json"), _righe("sezioni_indicatori_2023.json")
    ids23 = {r["SEZ21_ID"] for r in r23}
    solo21 = next(r["SEZ21_ID"] for r in r21 if r["SEZ21_ID"] not in ids23 and r.get("P1"))
    v = apri()
    v.attendi_pronto()
    stato21 = v.js(
        f"window.dt.map.getFeatureState({{source:'sezioni', sourceLayer:'sezioni', id:{solo21}}})"
    )
    assert stato21.get("v") is not None  # nel 2021 ha un valore
    v.js("window.dt.moduli.popolazione.imposta({anno: 2023})")
    v.page.wait_for_function("window.dt.moduli.popolazione.stato().anno === 2023")
    v.page.wait_for_function(
        f"window.dt.map.getFeatureState({{source:'sezioni', sourceLayer:'sezioni', id:{solo21}}}).v === undefined"
    )


def test_cambi_rapidi_finiscono_nell_ultimo_stato(apri):
    v = apri()
    v.attendi_pronto()
    v.js(
        """() => { const p = window.dt.moduli.popolazione;
            p.imposta({anno: 2023}); p.imposta({anno: 2021, indicatore: 'densita'}); }"""
    )
    r21 = _righe("sezioni_indicatori.json")
    atteso = sum(1 for r in r21 if r.get("P1") not in (None, "") and (r.get("Area") or 0) > 0)
    v.page.wait_for_function(
        f"(() => {{ const s = window.dt.moduli.popolazione.stato();"
        f" return s.anno === 2021 && s.indicatore === 'densita' && s.nValori === {atteso}; }})()",
        timeout=30000,
    )


def test_strati_iniziali_e_attivabili(apri):
    v = apri()
    v.attendi_pronto()
    strati = v.js(
        "Object.values(window.dt.moduli).flatMap(m => m.strati.map(s => ({id: s.id, layers: s.layers, attivo: s.attivo})))"
    )
    assert {"circoscrizioni", "quartieri", "upl", "sezioni", "coropletico"} <= {s["id"] for s in strati}
    for s in strati:
        for layer in s["layers"]:
            assert v.js(f"window.dt.map.getLayer('{layer}') !== undefined"), layer
        visibile = v.js(
            f"window.dt.map.getLayoutProperty('{s['layers'][0]}', 'visibility') !== 'none'"
        )
        assert visibile == s["attivo"], s["id"]
        v.page.set_checked(f"#strato-{s['id']}", not s["attivo"])
        nuova = v.js(
            f"window.dt.map.getLayoutProperty('{s['layers'][0]}', 'visibility') !== 'none'"
        )
        assert nuova == (not s["attivo"]), s["id"]
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python -m pytest tests/test_viewer.py -v -k "popolazione or sezione or cambi or strati_iniziali"`
Expected: FAIL (`window.dt.moduli.popolazione` undefined).

- [ ] **Step 3: Implementa `js/layers/confini.js`**

```js
import { pmt } from '../core/config.js';

export const SRC_SEZIONI = 'sezioni';

// [sorgente-layer, colore, spessore, attivo]
const LINEE = [
  ['circoscrizioni', '#1f3a5f', 2.2, true],
  ['quartieri', '#4a6fa5', 1.2, false],
  ['upl', '#7d93b8', 1, false],
];

export default {
  id: 'confini',
  titolo: 'Confini',
  aggiungiSorgenti(map) {
    map.addSource('confini', { type: 'vector', url: pmt('popolazione/confini_amministrativi.pmtiles') });
    map.addSource(SRC_SEZIONI, {
      type: 'vector',
      url: pmt('popolazione/geo_sezioni_2021.pmtiles'),
      promoteId: { sezioni: 'SEZ21_ID' },
    });
  },
  aggiungiLayer(map) {
    for (const [id, colore, spessore, attivo] of LINEE) {
      map.addLayer({
        id: `confini-${id}`, type: 'line', source: 'confini', 'source-layer': id,
        layout: { visibility: attivo ? 'visible' : 'none' },
        paint: { 'line-color': colore, 'line-width': spessore },
      });
    }
    map.addLayer({
      id: 'confini-sezioni', type: 'line', source: SRC_SEZIONI, 'source-layer': 'sezioni', minzoom: 13,
      layout: { visibility: 'none' },
      paint: { 'line-color': '#888', 'line-width': 0.6 },
    });
  },
  strati: [
    { id: 'circoscrizioni', etichetta: 'Circoscrizioni', layers: ['confini-circoscrizioni'], attivo: true },
    { id: 'quartieri', etichetta: 'Quartieri', layers: ['confini-quartieri'], attivo: false },
    { id: 'upl', etichetta: 'UPL (unità di primo livello)', layers: ['confini-upl'], attivo: false },
    { id: 'sezioni', etichetta: 'Sezioni di censimento (da zoom 13)', layers: ['confini-sezioni'], attivo: false },
  ],
};
```

- [ ] **Step 4: Implementa `js/layers/popolazione.js`**

```js
import { urlDati } from '../core/config.js';
import { INDICATORI, quantili } from '../core/indicatori.js';
import { SRC_SEZIONI } from './confini.js';

const FILE = { 2021: 'popolazione/sezioni_indicatori.json', 2023: 'popolazione/sezioni_indicatori_2023.json' };
const PALETTE = ['#fff5eb', '#fdd0a2', '#fdae6b', '#e6550d', '#a63603'];
const GRIGIO = '#d9d9d9';
const fmt = v => v.toLocaleString('it-IT', { maximumFractionDigits: 1 });

const cache = {};
const indici = {};
let stato = { anno: 2021, indicatore: 'residenti', nValori: 0, breaks: [] };
let sequenza = 0;
let legenda = null;

async function carica(anno) {
  if (!cache[anno]) {
    const r = await fetch(urlDati(FILE[anno]));
    if (!r.ok) throw new Error(`popolazione ${anno}`);
    cache[anno] = await r.json();
    indici[anno] = new Map(cache[anno].map(rec => [rec.SEZ21_ID, rec]));
  }
  return cache[anno];
}

function espressione(breaks) {
  const e = ['step', ['coalesce', ['feature-state', 'v'], -1], GRIGIO, 0, PALETTE[0]];
  breaks.forEach((b, i) => e.push(b, PALETTE[i + 1]));
  return e;
}

function disegnaLegenda(breaks) {
  if (!legenda) return;
  const unita = INDICATORI[stato.indicatore].unita;
  const voci = [[GRIGIO, 'senza dato']];
  const limiti = [0, ...breaks];
  limiti.forEach((b, i) => {
    const prossimo = limiti[i + 1];
    voci.push([PALETTE[i], prossimo === undefined ? `≥ ${fmt(b)} ${unita}` : `${fmt(b)} – ${fmt(prossimo)} ${unita}`]);
  });
  legenda.replaceChildren(...voci.map(([c, t]) => {
    const riga = document.createElement('div');
    const chip = document.createElement('i');
    chip.style.background = c;
    riga.append(chip, t);
    return riga;
  }));
}

async function applica(map) {
  const mia = ++sequenza;
  const { anno, indicatore } = stato;
  const dati = await carica(anno);
  if (mia !== sequenza) return; // è partita una richiesta più recente
  const ind = INDICATORI[indicatore];
  const src = { source: SRC_SEZIONI, sourceLayer: 'sezioni' };
  map.removeFeatureState(src);
  const valori = [];
  for (const rec of dati) {
    const v = ind.calcola(rec);
    if (v === null) continue;
    valori.push(v);
    map.setFeatureState({ ...src, id: rec.SEZ21_ID }, { v });
  }
  const breaks = quantili(valori, 5).filter(b => b > 0);
  map.setPaintProperty('pop-fill', 'fill-color', espressione(breaks));
  stato = { anno, indicatore, nValori: valori.length, breaks };
  disegnaLegenda(breaks);
}

export default {
  id: 'popolazione',
  titolo: 'Popolazione',
  aggiungiSorgenti() {},
  aggiungiLayer(map) {
    this._map = map; // serve a imposta(), chiamato anche dall'esterno (test, pannello)
    map.addLayer({
      id: 'pop-fill', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni',
      paint: { 'fill-color': GRIGIO, 'fill-opacity': 0.65 },
    });
    // sempre presente e invisibile: serve alla scheda del luogo anche con il coropletico spento
    map.addLayer({
      id: 'pop-hit', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni',
      paint: { 'fill-opacity': 0 },
    });
  },
  strati: [{
    id: 'coropletico', etichetta: 'Popolazione per sezione', layers: ['pop-fill'], attivo: true,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello(el, map) {
    const anno = document.createElement('select');
    anno.id = 'pop-anno';
    anno.setAttribute('aria-label', 'Anno');
    anno.innerHTML = '<option value="2021">Censimento 2021</option><option value="2023">Censimento permanente 2023 (stime)</option>';
    const ind = document.createElement('select');
    ind.id = 'pop-indicatore';
    ind.setAttribute('aria-label', 'Indicatore');
    for (const [k, v] of Object.entries(INDICATORI)) ind.add(new Option(`${v.etichetta} (${v.unita})`, k));
    legenda = document.createElement('div');
    legenda.className = 'legenda';
    const cambia = () => this.imposta({ anno: Number(anno.value), indicatore: ind.value }).catch(() => {});
    anno.addEventListener('change', cambia);
    ind.addEventListener('change', cambia);
    el.append(anno, ind, legenda);
  },
  avvia(map) {
    return applica(map);
  },
  async imposta({ anno, indicatore } = {}) {
    stato = { ...stato, anno: anno ?? stato.anno, indicatore: indicatore ?? stato.indicatore };
    return applica(this._map);
  },
  stato: () => stato,
  scheda: {
    layers: ['pop-hit'],
    voce(f) {
      const p = f.properties;
      const righe = [
        ['Sezione', String(p.SEZ21_ID)],
        ['Quartiere', p.Quartiere ?? '—'],
        ['UPL', p.UPL ?? '—'],
        ['Circoscrizione', p.Circoscrizione ?? '—'],
        ['Residenti 2021', p.POP21 != null ? fmt(p.POP21) : '—'],
        ['Famiglie 2021', p.FAM21 != null ? fmt(p.FAM21) : '—'],
        ['Abitazioni 2021', p.ABI21 != null ? fmt(p.ABI21) : '—'],
      ];
      const r23 = indici[2023]?.get(p.SEZ21_ID);
      if (r23 && r23.P1 != null) righe.push(['Residenti 2023 (stima)', fmt(Number(r23.P1))]);
      return { peso: 30, titolo: 'Sezione di censimento', righe };
    },
  },
};
```
- [ ] **Step 5: Registra i moduli in `js/app.js`**

Sostituire `const MODULI = [];` con:
```js
import confini from './layers/confini.js';
import popolazione from './layers/popolazione.js';

// ordine = ordine di sovrapposizione dei layer (il primo sta sotto)
const MODULI = [popolazione, confini];
```
(Spostare i due `import` in testa al file, insieme agli altri.)

- [ ] **Step 6: Verifica che passino**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: PASS (tutti). Se `test_popolazione_2021_poi_2023` fallisce per `nValori`, confrontare il conteggio con `json` (le righe con `P1` non nullo) e non modificare il test prima di aver capito la differenza.

- [ ] **Step 7: Commit**

```bash
git add js/layers js/app.js tests/test_viewer.py
git commit -q -m "feat: boundaries and 2021/2023 population choropleth" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Territorio — catasto, PRG, vincoli, OMI, immobili, civici

**Files:**
- Create: `js/layers/territorio.js`
- Modify: `js/app.js`, `tests/test_viewer.py`

**Interfaces:**
- Consumes: interfaccia modulo (Task 4), `pmt` (config).
- Produces: modulo default `id 'territorio'`; sorgenti `catasto`, `prg`, `omi`, `immobili`, `civici`; layer visibili `catasto` (linea, minzoom 15), `prg-zto`, `prg-va`, `prg-vl`, `omi`, `immobili`, `civici` (minzoom 17); layer invisibili per la scheda `catasto-hit` (minzoom 15), `prg-zto-hit`, `prg-va-hit`, `omi-hit`, `immobili-hit`; strati `catasto`, `prg`, `vincoli`, `omi`, `immobili`, `civici` (tutti `attivo: false`); `scheda.layers` = i cinque layer `*-hit`, con pesi catasto 10, PRG 40, vincolo 50, OMI 60, immobili 70.

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungere a `tests/test_viewer.py`:
```python
def test_territorio_strati_e_sorgenti(apri):
    v = apri()
    v.attendi_pronto()
    for sorgente in ["catasto", "prg", "omi", "immobili", "civici"]:
        assert v.js(f"window.dt.map.getSource('{sorgente}') !== undefined"), sorgente
    for layer in ["catasto", "prg-zto", "prg-va", "prg-vl", "omi", "immobili", "civici",
                  "catasto-hit", "prg-zto-hit", "prg-va-hit", "omi-hit", "immobili-hit"]:
        assert v.js(f"window.dt.map.getLayer('{layer}') !== undefined"), layer
    assert v.js("window.dt.map.getLayer('catasto').minzoom") == 15


def test_catasto_carica_particelle_a_zoom_17(apri):
    v = apri()
    v.attendi_pronto()
    v.page.check("#strato-catasto")
    v.vai(13.3568, 38.1204, 17)  # piazza Verdi, Teatro Massimo
    n = v.js(
        "window.dt.map.querySourceFeatures('catasto', {sourceLayer: 'particelle'}).length"
    )
    assert n > 0


def test_prg_carica_zonizzazione_a_zoom_15(apri):
    v = apri()
    v.attendi_pronto()
    v.page.check("#strato-prg")
    v.vai(13.3568, 38.1204, 15)
    n = v.js("window.dt.map.querySourceFeatures('prg', {sourceLayer: 'zto'}).length")
    assert n > 0
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python -m pytest tests/test_viewer.py -v -k "territorio or catasto or prg"`
Expected: FAIL (sorgente `catasto` non definita / checkbox `#strato-catasto` assente).

- [ ] **Step 3: Implementa `js/layers/territorio.js`**

```js
import { pmt } from '../core/config.js';

// Colore per lettera di zona territoriale omogenea (A… V)
const COLORI_ZTO = ['match', ['slice', ['get', 'ZTO'], 0, 1],
  'A', '#d95f02', 'B', '#e6ab02', 'C', '#f4a582', 'D', '#7570b3', 'E', '#8c6d31',
  'F', '#e7298a', 'I', '#666666', 'P', '#999999', 'S', '#1b9e77', 'V', '#33a02c',
  '#cccccc'];

const COLORI_OMI = ['match', ['get', 'Fascia'],
  'B', '#2c7bb6', 'C', '#abd9e9', 'D', '#ffffbf', 'E', '#fdae61', 'R', '#d7191c',
  '#cccccc'];

const vuoto = { 'fill-opacity': 0 };
const val = v => (v == null || v === '' ? '—' : String(v));

export default {
  id: 'territorio',
  titolo: 'Regole del suolo',
  aggiungiSorgenti(map) {
    map.addSource('catasto', { type: 'vector', url: pmt('catasto/particelle.pmtiles') });
    map.addSource('prg', { type: 'vector', url: pmt('prg-vincoli/prg.pmtiles') });
    map.addSource('omi', { type: 'vector', url: pmt('civici-omi/Zone_OMI_2025_II.pmtiles') });
    map.addSource('immobili', { type: 'vector', url: pmt('civici-omi/immobili_comunali_2024.pmtiles') });
    map.addSource('civici', { type: 'vector', url: pmt('civici-omi/civici_0226.pmtiles') });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    // visibili su richiesta
    map.addLayer({ id: 'omi', type: 'fill', source: 'omi', 'source-layer': 'Zone_OMI_2025_II',
      layout: nascosto, paint: { 'fill-color': COLORI_OMI, 'fill-opacity': 0.45 } });
    map.addLayer({ id: 'prg-zto', type: 'fill', source: 'prg', 'source-layer': 'zto',
      layout: nascosto, paint: { 'fill-color': COLORI_ZTO, 'fill-opacity': 0.5 } });
    map.addLayer({ id: 'prg-va', type: 'fill', source: 'prg', 'source-layer': 'va',
      layout: nascosto, paint: { 'fill-color': '#b2182b', 'fill-opacity': 0.35 } });
    map.addLayer({ id: 'prg-vl', type: 'line', source: 'prg', 'source-layer': 'vl',
      layout: nascosto, paint: { 'line-color': '#b2182b', 'line-width': 1.5 } });
    map.addLayer({ id: 'immobili', type: 'fill', source: 'immobili', 'source-layer': 'immobili_comunali_2024',
      layout: nascosto, paint: { 'fill-color': '#6a3d9a', 'fill-opacity': 0.5 } });
    map.addLayer({ id: 'catasto', type: 'line', source: 'catasto', 'source-layer': 'particelle', minzoom: 15,
      layout: nascosto, paint: { 'line-color': '#444', 'line-width': 0.6 } });
    map.addLayer({ id: 'civici', type: 'circle', source: 'civici', 'source-layer': 'civici_wgs84', minzoom: 17,
      layout: nascosto, paint: { 'circle-radius': 3, 'circle-color': '#c2185b' } });
    // sempre presenti e invisibili: servono alla scheda del luogo
    map.addLayer({ id: 'catasto-hit', type: 'fill', source: 'catasto', 'source-layer': 'particelle', minzoom: 15, paint: vuoto });
    map.addLayer({ id: 'prg-zto-hit', type: 'fill', source: 'prg', 'source-layer': 'zto', paint: vuoto });
    map.addLayer({ id: 'prg-va-hit', type: 'fill', source: 'prg', 'source-layer': 'va', paint: vuoto });
    map.addLayer({ id: 'omi-hit', type: 'fill', source: 'omi', 'source-layer': 'Zone_OMI_2025_II', paint: vuoto });
    map.addLayer({ id: 'immobili-hit', type: 'fill', source: 'immobili', 'source-layer': 'immobili_comunali_2024', paint: vuoto });
  },
  strati: [
    { id: 'catasto', etichetta: 'Catasto: particelle (da zoom 15)', layers: ['catasto'], attivo: false },
    { id: 'prg', etichetta: 'PRG 2004: zonizzazione', layers: ['prg-zto'], attivo: false },
    { id: 'vincoli', etichetta: 'PRG 2004: vincoli', layers: ['prg-va', 'prg-vl'], attivo: false },
    { id: 'omi', etichetta: 'Zone OMI 2025', layers: ['omi'], attivo: false },
    { id: 'immobili', etichetta: 'Immobili comunali', layers: ['immobili'], attivo: false },
    { id: 'civici', etichetta: 'Numeri civici (da zoom 17)', layers: ['civici'], attivo: false },
  ],
  scheda: {
    layers: ['catasto-hit', 'prg-zto-hit', 'prg-va-hit', 'omi-hit', 'immobili-hit'],
    voce(f) {
      const p = f.properties;
      switch (f.layer.id) {
        case 'catasto-hit':
          return { peso: 10, titolo: 'Particella catastale', righe: [['Foglio', val(p.Foglio)], ['Particella', val(p.Paricella)]] };
        case 'prg-zto-hit':
          return { peso: 40, titolo: 'Zona PRG 2004', righe: [['Zona', val(p.ZTO)], ['Descrizione', val(p.DESCRIZION)]] };
        case 'prg-va-hit':
          return { peso: 50, titolo: 'Vincolo (PRG 2004)', righe: [['Tipo', val(p.tipo)], ['Descrizione', val(p.descrizone)]] };
        case 'omi-hit':
          return { peso: 60, titolo: 'Zona OMI', righe: [['Zona', val(p.Zona)], ['Fascia', val(p.Fascia_Descr ?? p.Fascia)]] };
        default:
          return { peso: 70, titolo: 'Immobile comunale', righe: [['Tipo', val(p.TIPO)], ['Categoria', val(p.CATEGORIA)], ['Indirizzo', val(p.INDIRIZZO)]] };
      }
    },
  },
};
```

- [ ] **Step 4: Registra in `js/app.js`**

Aggiungere `import territorio from './layers/territorio.js';` e cambiare `MODULI`:
```js
const MODULI = [popolazione, territorio, confini];
```

- [ ] **Step 5: Verifica che passino**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: PASS. Se compare un errore di stile in console su `slice`, sostituire l'espressione `COLORI_ZTO` con `['match', ['get','ZTO'], [...]]` esplicito per le sigle esistenti (A1, A2, B0a, …) verificandole con `ogrinfo` su `Variente_Generale_PRG_2004.gpkg`.

- [ ] **Step 6: Commit**

```bash
git add js/layers/territorio.js js/app.js tests/test_viewer.py
git commit -q -m "feat: cadastre, PRG 2004, constraints, OMI, municipal assets and address points" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Edifici 3D

**Files:**
- Create: `js/layers/edifici.js`
- Modify: `js/app.js`, `tests/test_viewer.py`

**Interfaces:**
- Consumes: interfaccia modulo, `pmt`.
- Produces: modulo default `id 'edifici'`; sorgente `edificato` (PMTiles `edifici/edificato_pop.pmtiles`, layer `edificato`); layer `edifici-3d` (`fill-extrusion`, minzoom 14, nascosto) e `edifici-hit` (minzoom 14, opacità 0); strato `edifici3d` (attivo false, `suCambio` inclina la mappa a 55° / 0°); `scheda.layers = ['edifici-hit']`, peso 20.

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungere a `tests/test_viewer.py`:
```python
def test_edifici_3d_inclinano_la_mappa_e_hanno_altezza(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("window.dt.map.getSource('edificato') !== undefined")
    v.page.check("#strato-edifici3d")
    v.page.wait_for_function("window.dt.map.getPitch() > 40")
    assert v.js("window.dt.map.getLayoutProperty('edifici-3d', 'visibility')") == "visible"
    v.vai(13.3568, 38.1204, 16)
    feats = v.js(
        "window.dt.map.querySourceFeatures('edificato', {sourceLayer: 'edificato'})"
        ".slice(0, 50).map(f => f.properties.altezza)"
    )
    assert len(feats) > 0
    assert any(isinstance(a, (int, float)) and a > 0 for a in feats)
    v.page.uncheck("#strato-edifici3d")
    v.page.wait_for_function("window.dt.map.getPitch() < 5")
```

- [ ] **Step 2: Verifica che fallisca**

Run: `python -m pytest tests/test_viewer.py -v -k edifici`
Expected: FAIL (`#strato-edifici3d` assente).

- [ ] **Step 3: Implementa `js/layers/edifici.js`**

```js
import { pmt } from '../core/config.js';

const val = v => (v == null || v === '' ? '—' : String(v));

export default {
  id: 'edifici',
  titolo: 'Edifici',
  aggiungiSorgenti(map) {
    map.addSource('edificato', { type: 'vector', url: pmt('edifici/edificato_pop.pmtiles') });
  },
  aggiungiLayer(map) {
    map.addLayer({
      id: 'edifici-3d', type: 'fill-extrusion', source: 'edificato', 'source-layer': 'edificato', minzoom: 14,
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': '#b8b8c8',
        'fill-extrusion-height': ['max', ['coalesce', ['get', 'altezza'], 3], 3],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.85,
      },
    });
    map.addLayer({
      id: 'edifici-hit', type: 'fill', source: 'edificato', 'source-layer': 'edificato', minzoom: 14,
      paint: { 'fill-opacity': 0 },
    });
  },
  strati: [{
    id: 'edifici3d', etichetta: 'Edifici 3D (da zoom 14)', layers: ['edifici-3d'], attivo: false,
    suCambio(attivo, map) { map.easeTo({ pitch: attivo ? 55 : 0, duration: 300 }); },
  }],
  scheda: {
    layers: ['edifici-hit'],
    voce(f) {
      const p = f.properties;
      return {
        peso: 20,
        titolo: 'Edificio',
        righe: [
          ['Altezza', p.altezza != null ? `${Number(p.altezza).toFixed(1)} m` : '—'],
          ['Uso', val(p.occupancy)],
          ['Residenti (stima)', p.pop_stim != null ? String(Math.round(p.pop_stim)) : '—'],
          ['Sezione', val(p.SEZ21_ID)],
        ],
      };
    },
  },
};
```

- [ ] **Step 4: Registra in `js/app.js`**

Aggiungere `import edifici from './layers/edifici.js';` e:
```js
const MODULI = [popolazione, territorio, edifici, confini];
```

- [ ] **Step 5: Verifica che passi**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/layers/edifici.js js/app.js tests/test_viewer.py
git commit -q -m "feat: 3D buildings from height attribute" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Scheda del luogo

**Files:**
- Create: `js/core/scheda.js`
- Modify: `js/app.js`, `tests/test_viewer.py`

**Interfaces:**
- Consumes: `modulo.scheda = { layers, voce(feature) -> {peso, titolo, righe} }` dei Task 5–7; elemento `#scheda`.
- Produces: `collegaScheda(map, moduli, elemento)`: al click interroga prima il punto esatto, poi (solo per i layer senza risultato) un riquadro di ±4 px; una voce per layer, ordinate per `peso`; se non c'è nulla scrive «Nessun dato in questo punto.».

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungere a `tests/test_viewer.py`:
```python
def test_scheda_su_un_punto_con_dati(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.3568, 38.1204, 17)
    # centro di una particella reale, letta dai tile caricati
    lon, lat = v.js(
        """() => {
            const f = window.dt.map.querySourceFeatures('catasto', {sourceLayer: 'particelle'})[0];
            const g = f.geometry;
            const anello = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates[0][0];
            const n = anello.length - 1;
            return anello.slice(0, n).reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
        }"""
    )
    v.vai(lon, lat, 17)
    v.clic(lon, lat)
    v.page.wait_for_selector("#scheda:not([hidden])")
    testo = v.page.inner_text("#scheda")
    assert "Particella catastale" in testo
    assert "Sezione di censimento" in testo
    assert "Zona PRG 2004" in testo
    assert "Foglio" in testo


def test_scheda_fuori_copertura_non_resta_vuota(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.30, 38.30, 9)  # mare a nord, zoom sotto la copertura dei tile
    v.clic(13.30, 38.30)
    v.page.wait_for_selector("#scheda:not([hidden])")
    assert "Nessun dato in questo punto" in v.page.inner_text("#scheda")
    assert v.errori == []


def test_scheda_si_chiude(apri):
    v = apri()
    v.attendi_pronto()
    v.vai(13.30, 38.30, 9)
    v.clic(13.30, 38.30)
    v.page.wait_for_selector("#scheda:not([hidden])")
    v.page.click("#scheda button")
    v.page.wait_for_selector("#scheda", state="hidden")
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python -m pytest tests/test_viewer.py -v -k scheda`
Expected: FAIL (timeout su `#scheda:not([hidden])`).

- [ ] **Step 3: Implementa `js/core/scheda.js`**

```js
const R = 4; // tolleranza in pixel attorno al clic

function riga(dl, etichetta, valore) {
  const dt = document.createElement('dt');
  dt.textContent = etichetta;
  const dd = document.createElement('dd');
  dd.textContent = valore;
  dl.append(dt, dd);
}

function mostra(el, lngLat, voci) {
  const titolo = document.createElement('h2');
  titolo.textContent = `Scheda del luogo · ${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`;
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.textContent = 'Chiudi';
  chiudi.addEventListener('click', () => { el.hidden = true; });
  const parti = [titolo];
  if (!voci.length) {
    const p = document.createElement('p');
    p.textContent = 'Nessun dato in questo punto.';
    parti.push(p);
  }
  for (const v of voci) {
    const h = document.createElement('h3');
    h.textContent = v.titolo;
    const dl = document.createElement('dl');
    for (const [k, val] of v.righe) riga(dl, k, val);
    parti.push(h, dl);
  }
  parti.push(chiudi);
  el.replaceChildren(...parti);
  el.hidden = false;
}

export function collegaScheda(map, moduli, el) {
  const conScheda = moduli.filter(m => m.scheda);
  map.on('click', e => {
    const voci = [];
    for (const m of conScheda) {
      const layers = m.scheda.layers.filter(id => map.getLayer(id));
      if (!layers.length) continue;
      let trovati = map.queryRenderedFeatures(e.point, { layers });
      const mancanti = layers.filter(id => !trovati.some(f => f.layer.id === id));
      if (mancanti.length) {
        const box = [[e.point.x - R, e.point.y - R], [e.point.x + R, e.point.y + R]];
        trovati = trovati.concat(map.queryRenderedFeatures(box, { layers: mancanti }));
      }
      const visti = new Set();
      for (const f of trovati) {
        if (visti.has(f.layer.id)) continue;
        visti.add(f.layer.id);
        voci.push(m.scheda.voce(f));
      }
    }
    voci.sort((a, b) => a.peso - b.peso);
    mostra(el, e.lngLat, voci);
  });
}
```

- [ ] **Step 4: Collega in `js/app.js`**

Aggiungere `import { collegaScheda } from './core/scheda.js';` e, dentro `map.on('load', …)` dopo `costruisciPannello(...)`:
```js
  collegaScheda(map, MODULI, document.getElementById('scheda'));
```

- [ ] **Step 5: Verifica che passino**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: PASS. Se `test_scheda_su_un_punto_con_dati` non trova la sezione, verificare che `pop-hit` sia sopra `pop-fill` e che il punto cada dentro il comune; non abbassare l'asserzione.

- [ ] **Step 6: Commit**

```bash
git add js/core/scheda.js js/app.js tests/test_viewer.py
git commit -q -m "feat: place inspector combining parcel, building, census section, zoning and constraints" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Tematizzazione fedele alle app originali (aggiunto dopo la revisione dell'utente)

**Perché:** ogni dato aggiunto aveva già una sua tematizzazione nelle app di origine; i Task 5–7 avevano usato palette inventate. Questo task sostituisce gli stili con quelli esistenti, **riusandoli da file**, non ricopiandoli a mano.

**Fonti degli stili (verificate):**
- Base cartografica: `https://tiles.openfreemap.org/styles/positron` (da `pmtiles/js/catasto_script.js`); porta anche i font per i numeri civici.
- PRG/PPE/vincoli: **tile raster** per la vestizione — `https://palermohub.github.io/PRG2004/{ZTO,ppe,VA,VL}/{z}/{x}/{y}.png` (z12–19, 1,6 GB e 414.000 file: non copiabili in `dati/`); i poligoni vettoriali restano **trasparenti** e servono solo ai dati (tooltip e scheda).
- Zone OMI: `omiColorMatch` in `catasto_script.js` (da `zone_omi.sld`, per campo `Zona_OMI`), riempimento opacità 0,15, contorno `#232323` 0,5.
- Particelle: riempimento `#ffffff` opacità 0,6, contorno `#000`. Civici: layer `symbol` con testo `Civico[/Esponente]`, colore `#c0392b`, alone bianco 1,5, da zoom 14.
- Popolazione/confini/sezioni/edifici: `palermo_popolazione/js/palette.js` (rampe `densityStops`, `CONFINI_LEVELS`, `sezioniColors`, `EDIFICATO_NEUTRAL`); indice di vecchiaia da `topics.js` (P30–P32 + P67–P69 sotto i 15 anni; P43–P45 + P80–P82 sopra i 65).
- Immobili comunali: nessuno stile originale trovato (l'app `00_immobili_pa_2024_00.html` non lo definisce): resta lo stile provvisorio, dichiarato in `docs/STILI.md`.

**Decisioni (ruling):**
- I raster PRG si leggono dagli URL pubblicati, in un'unica costante `RASTER_PRG` in `js/core/config.js`; se servirà l'uso offline si sostituisce con PMTiles raster locali. Nei test le richieste sono intercettate.
- Solo tema chiaro per la mappa (positron è chiaro): si usano le varianti `light` delle rampe.
- Gli indicatori della scheda/coropletico restano solo quelli con una tematizzazione esistente: `densita` (rampa `popolazione`) e `vecchiaia` (rampa `vecchiaia`); `residenti`, `under15`, `over74` e la funzione `quantili` (senza rampa originale) vengono rimossi.
- Se lo stile base non si carica la mappa passa a uno stile vuoto con avviso (il viewer non deve restare morto).

**Files:**
- Create: `js/core/palette.js` (copia identica di `palermo_popolazione/js/palette.js`), `js/layers/stile-omi.js` (generato da `scripts/estrai_stile_omi.mjs`), `docs/STILI.md`
- Modify: `js/core/config.js`, `js/core/mappa.js`, `js/core/indicatori.js`, `js/layers/{confini,popolazione,territorio,edifici}.js`, `scripts/valida_dati.py` (`Zona_OMI` tra i campi attesi), `tests/conftest.py`, `tests/test_viewer.py`, `tests/js/indicatori.test.mjs`
- Test: `tests/js/stile-omi.test.mjs`, `tests/js/indicatori.test.mjs`, `tests/test_viewer.py`

- [ ] **Step 1: palette.js** — copiare il file originale senza modifiche; il test confronta `densityStops('popolazione', false)` con i valori attesi.
- [ ] **Step 2: stile OMI** — script che legge `omiColorMatch` dal sorgente originale e lo scrive in `js/layers/stile-omi.js`; test: espressione `match` su `['get','Zona_OMI']`, coppie chiave/colore esadecimale, ≥ 40 zone, ultimo elemento = colore di riserva.
- [ ] **Step 3: indicatori** — `densita` e `vecchiaia` (formula di `computeVecchiaiaById`, `Math.round(over/under*1000)/10`, `null` se `under == 0`), con test che confronta i risultati con quelli del modulo originale `topics.js` quando importabile.
- [ ] **Step 4: base cartografica** — test che blocca `tiles.openfreemap.org`: il viewer deve diventare `pronto` e mostrare l'avviso «Base cartografica non disponibile»; poi `creaMappa` con positron e ripiego.
- [ ] **Step 5: layer** — raster PRG/PPE/VA/VL come vestizione; layer vettoriali `*-hit` trasparenti; OMI, catasto, civici, confini, sezioni, edifici e coropletico con gli stili originali; test nel browser che confrontano `getPaintProperty` con i valori esportati da `palette.js` / `stile-omi.js`.
- [ ] **Step 6: documenti e chiusura** — `docs/STILI.md` (per ogni layer: file e riga dello stile originale, oppure «nessuno trovato»), suite completa, commit.

---

### Task 10: Terreno, elevazione e griglia DTM (aggiunto su richiesta dell'utente)

**Perché:** `palermo_popolazione/data` contiene anche `terrain/` (rilievo in codifica Terrarium per il 3D), `elevazione/` (raster colorato) e `griglia_pbf/` (punti a passo 50 m con gli indici morfologici del DTM 5 m); la copia iniziale aveva preso solo i file. Tutto è già pubblicato su `https://gbvitrano.github.io/palermo_popolazione/data/…` (terrain 116 MB, griglia 30 MB): **nessuna copia**.

**Ambito:** nel catalogo entrano i *tileset* (PRG ZTO/ppe/VA/VL e terreno) come voci `tipo: "tileset"` con `url` a modello `{z}/{x}/{y}`, `fonte`, `data`, `licenza` (HR-DTM-5m: CC BY 4.0) e un tile d'esempio per il controllo di raggiungibilità; il viewer prende gli URL dal catalogo (un solo posto). Nuovo modulo `js/layers/terreno.js`: rilievo 3D con ombreggiatura (`setTerrain` + `hillshade`, parametri di `map.js` originale), raster di elevazione con la sua legenda (`ELEVATION_STOPS`), punti della griglia come layer trasparente per la scheda del luogo («Terreno»: quota, pendenza, esposizione, geomorfologia, costruibilità, stabilità, TWI, SVF), scegliendo il punto **più vicino** al clic.

- [ ] **Step 1:** test e implementazione dei tileset nel catalogo e del loro controllo di salute (`controlla_tileset`).
- [ ] **Step 2:** `config.js` legge i tileset dal catalogo (`urlTileset`); `territorio.js` li usa al posto di `RASTER_PRG`.
- [ ] **Step 3:** `scheda.js` accetta `scheda.scegli(trovati, lngLat)`; test del punto più vicino.
- [ ] **Step 4:** `terreno.js` e test (sorgenti/layer/parametri originali, 3D, legenda, scheda).
- [ ] **Step 5:** `docs/STILI.md`, crediti (HR-DTM-5m), suite completa, commit.

---

### Task 11: Ricerca per civico

**Files:**
- Create: `js/core/ricerca.js`
- Modify: `js/app.js`, `tests/test_viewer.py`

**Interfaces:**
- Consumes: `preparaIndice`, `cerca` (Task 3); `urlDati`; elementi `#cerca`, `#cerca-testo`, `#cerca-risultati`; file `dati/civici-omi/civici_index.json` (Task 2).
- Produces: `collegaRicerca(map, form, input, lista)`: digitando ≥ 3 caratteri propone fino a 8 risultati (caricando l'indice la prima volta); clic su un risultato o Invio sul primo → `flyTo` zoom 18 e marcatore; un errore di caricamento dell'indice viene segnalato con `segnala`.

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungere a `tests/test_viewer.py`:
```python
def _via_reale():
    indice = json.loads((ROOT / "dati" / "civici-omi" / "civici_index.json").read_text(encoding="utf-8"))
    via = "VIA MAQUEDA" if "VIA MAQUEDA" in indice else next(iter(indice))
    civico, (lon, lat) = next(iter(indice[via].items()))
    return via, civico, lon, lat


def test_ricerca_porta_la_mappa_sul_civico(apri):
    via, civico, lon, lat = _via_reale()
    v = apri()
    v.attendi_pronto()
    v.page.fill("#cerca-testo", f"{via.lower()} {civico}")
    v.page.wait_for_selector("#cerca-risultati button")
    v.page.press("#cerca-testo", "Enter")
    v.page.wait_for_function(
        f"!window.dt.map.isMoving() && Math.abs(window.dt.map.getCenter().lng - {lon}) < 1e-3"
        f" && Math.abs(window.dt.map.getCenter().lat - {lat}) < 1e-3",
        timeout=30000,
    )
    assert v.js("window.dt.map.getZoom()") > 17


def test_ricerca_input_scomodi_non_rompono_nulla(apri):
    v = apri()
    v.attendi_pronto()
    for testo in ["", "   ", "100", "xyzxyzxyz", "via"]:
        v.page.fill("#cerca-testo", testo)
        v.page.wait_for_timeout(200)
    assert v.errori == []
    assert v.js("window.dt.pronto") is True
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python -m pytest tests/test_viewer.py -v -k ricerca`
Expected: FAIL (timeout su `#cerca-risultati button`).

- [ ] **Step 3: Implementa `js/core/ricerca.js`**

```js
import { urlDati } from './config.js';
import { preparaIndice, cerca } from './indirizzi.js';
import { segnala } from './pannello.js';

let voci = null;

async function indice() {
  if (!voci) {
    const r = await fetch(urlDati('civici-omi/civici_index.json'));
    if (!r.ok) throw new Error('indice civici non disponibile');
    voci = preparaIndice(await r.json());
  }
  return voci;
}

export function collegaRicerca(map, form, input, lista) {
  let marcatore = null;

  function vai(r) {
    lista.hidden = true;
    input.value = r.etichetta;
    if (marcatore) marcatore.remove();
    marcatore = new maplibregl.Marker().setLngLat([r.lon, r.lat]).addTo(map);
    map.flyTo({ center: [r.lon, r.lat], zoom: 18 });
  }

  async function aggiorna() {
    if (input.value.trim().length < 3) { lista.hidden = true; return []; }
    let risultati;
    try {
      risultati = cerca(await indice(), input.value);
    } catch (err) {
      segnala(`Ricerca non disponibile: ${err.message}`);
      return [];
    }
    lista.replaceChildren(...risultati.map(r => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.etichetta;
      b.addEventListener('click', () => vai(r));
      li.append(b);
      return li;
    }));
    lista.hidden = !risultati.length;
    return risultati;
  }

  input.addEventListener('input', aggiorna);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const risultati = await aggiorna();
    if (risultati.length) vai(risultati[0]);
  });
}
```

- [ ] **Step 4: Collega in `js/app.js`**

Aggiungere `import { collegaRicerca } from './core/ricerca.js';` e, dentro `map.on('load', …)` dopo `collegaScheda(...)`:
```js
  collegaRicerca(map, document.getElementById('cerca'),
    document.getElementById('cerca-testo'), document.getElementById('cerca-risultati'));
```

- [ ] **Step 5: Verifica che passino**

Run: `python -m pytest tests/test_viewer.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/core/ricerca.js js/app.js tests/test_viewer.py
git commit -q -m "feat: address search by street and house number" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Scheda del luogo strutturata, senza ripetizioni (richiesta dell'utente dopo la prova)

**Perché:** nella prova la scheda ripeteva le informazioni («Sezione» due volte, Circoscrizione/Quartiere/UPL in più punti) ed era una lista piatta. Gli screenshot delle app originali mostrano l'impianto voluto: terreno a gruppi (Pendenza, Morfologia, Rischio versanti, Indici morfometrici, Idrologia, Energia e clima, Accessibilità ed erosione) con quota in evidenza; catasto con sezioni a schede (Numero civico, Particella + «Visura su SISTER», Zonizzazione, Quotazioni OMI a fisarmonica per tipologia).

**Modello:** ogni modulo restituisce `voci(trovati, lngLat)`; una *voce* è `{chiave, peso, titolo, badge?, contesto?, gruppi:[{titolo?, righe:[{etichetta, valore, classe?}], griglia?}], accordion?, link?, nota?, collassabile?}`. `js/core/scheda-modello.js` (puro) **unisce** le voci con la stessa `chiave`, scarta le righe con la stessa etichetta nella stessa sezione, **porta nell'intestazione** il contesto amministrativo (Circoscrizione · Quartiere · UPL, una volta sola) e ordina per `peso`. Formati ed etichette riusano `palermo_popolazione/js/punto.js` (terreno) e `catasto_script.js` (civico, particella, zonizzazione, OMI).

**Ordine delle sezioni:** Indirizzo 10 · Particella 20 · Edificio 30 · Zonizzazione 40 · Vincoli 50 · Immobile comunale 55 · Quotazioni OMI 60 · Sezione di censimento 70 · Terreno 80.

- [ ] **Step 1:** `scheda-modello.js` + test Node (unione, dedupe nella sezione, contesto in intestazione, ordine, sezioni vuote scartate).
- [ ] **Step 2:** `scheda-terreno.js` e `scheda-omi.js` (puri) + test Node con i valori degli screenshot originali.
- [ ] **Step 3:** `scheda.js` (rendering strutturato) e CSS; i moduli passano al protocollo `voci()`; nuovi layer trasparenti `civici-hit` e `prg-vl-hit`.
- [ ] **Step 4:** test nel browser: titoli e ordine, nessuna etichetta ripetuta, contesto una sola volta, link SISTER.
- [ ] **Step 5:** `docs/STILI.md`, suite completa, commit.

---

### Task 13: Verifica finale, documentazione e rilascio locale

**Files:**
- Create: `README.md`
- Modify: `docs/PIANO_DigitalTwin_Palermo.md` (stato delle fasi)

- [ ] **Step 1: Esegui tutta la suite**

```bash
python -m pytest -q
node --test tests/js/*.test.mjs
python scripts/valida_dati.py
```
Expected: pytest tutti verdi, node 0 fail, `valida_dati.py` stampa `162 file catalogati, 0 errori`.

- [ ] **Step 2: Verifica visiva con lo screenshot**

```bash
python scripts/serve.py 8765 &
SERVER=$!
python3 - <<'EOF'
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch()
    p = b.new_page(viewport={"width": 1280, "height": 800})
    p.goto("http://127.0.0.1:8765/index.html")
    p.wait_for_function("window.dt && window.dt.pronto === true", timeout=60000)
    p.evaluate("window.dt.map.jumpTo({center:[13.3568,38.1204], zoom:16})")
    p.wait_for_timeout(3000)
    p.screenshot(path="docs/schermata-fase1.png")
    b.close()
EOF
kill $SERVER
```
Aprire `docs/schermata-fase1.png` e controllare che si vedano base cartografica, coropletico, pannello strati e campo di ricerca. (Le tile della base OSM richiedono rete: senza rete la base sarà vuota ma il resto deve comparire.)

- [ ] **Step 3: Scrivi `README.md`**

```markdown
# Digital Twin di Palermo

Viewer web statico che sovrappone catasto (S.I.T.R. 2026-09), PRG 2004 con vincoli, popolazione ISTAT 2021 e 2023, edifici 3D, zone OMI, immobili comunali e civici, con scheda del luogo al click e ricerca per civico.

## Avvio

```bash
python scripts/serve.py 8000      # server con HTTP Range (necessario ai PMTiles)
# poi aprire http://127.0.0.1:8000/index.html
```

## Test

```bash
python -m pytest -q       # dati + viewer (Playwright/Chromium)
node --test tests/js/*.test.mjs     # logica pura (indicatori, indirizzi)
python scripts/valida_dati.py   # rigenera dati/catalogo.json e docs/catalogo.md
```

## Dati

I dati stanno in `dati/` (non in git, salvo `MANIFEST.tsv`, `README.md`, `catalogo.json`).
Per ricostruirli seguire `dati/README.md` e verificarli con `valida_dati.py`.
Per pubblicare su GitHub Pages serve ospitare `dati/` a parte (ogni file < 100 MB).

## Avvisi

Catasto, PRG e vincoli sono informativi e senza valore legale. I dati 2023 sono stime campionarie.

## Piano

Vedi `docs/PIANO_DigitalTwin_Palermo.md` (fasi 0–10) e `docs/superpowers/`.
```

- [ ] **Step 4: Aggiorna lo stato nel piano generale**

In `docs/PIANO_DigitalTwin_Palermo.md`, nella tabella delle fasi, aggiungere alla riga **0** e alla riga **1** la dicitura `**fatta (2026-09-30)**` e, sotto la tabella, una riga: «Esito fase 0–1: vedi `docs/catalogo.md` e `docs/superpowers/plans/2026-09-30-digitaltwin-fase0-1.md`.» (Aggiornare solo se i test del Step 1 sono verdi.)

- [ ] **Step 5: Aggiorna il grafo di conoscenza del progetto**

Run: `graphify update . 2>&1 | tail -3`
Expected: aggiornamento completato (AST-only, nessun costo). Se `graphify` non è installato, saltare.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/PIANO_DigitalTwin_Palermo.md docs/schermata-fase1.png
git commit -q -m "docs: readme, phase status and screenshot" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git log --oneline | head -12
```
Expected: 11 commit circa, working tree pulito (`git status --short` vuoto, dati esclusi).

---

## Self-Review (eseguita)

**Copertura della spec**
- §2 validazione dati → Task 1–2 (manifesto, sezioni, CRS, layer, dimensioni, nessun percorso locale nel catalogo).
- §3 architettura (moduli, catalogo, scheda, Range server, hosting < 100 MB) → Task 0, 2, 4–9.
- §4 funzioni 1–7: confini/base (T5), strati catasto/PRG/vincoli/civici/OMI/immobili (T6), edifici 3D (T7; la spec lasciava aperta la sorgente: usata `edificato_pop.pmtiles` perché ha `altezza` e `pop_stim`, verificato), popolazione 2021/2023 con "senza dato" (T5), ricerca (T9; indice `civici_index.json`, necessario perché i PMTiles non permettono ricerca globale), scheda (T8), crediti (T4).
- §5 errori e avvisi → T4 (banner, avvisi nei crediti), T8 (nessun dato).
- §6 test e "fatto" → T1–T10 (pytest, node, Playwright, console senza errori, screenshot).
- §8 decisione 4 (`git init`) → Task 0.

**Placeholder**: nessun TBD/TODO; ogni step di codice contiene il codice. Due note condizionali (Task 2 step 6 e Task 6 step 5) descrivono un'azione precisa da svolgere se un controllo reale fallisce, non un rinvio.

**Coerenza dei tipi**: `SRC_SEZIONI='sezioni'` (T5) usato come `source` nei test e nel modulo; id checkbox `strato-<id>` (T4) coerenti con i test (`strato-catasto`, `strato-prg`, `strato-edifici3d`); `scheda.voce → {peso,titolo,righe}` uguale in T5–T8; `stato()`/`imposta()` di `popolazione` usati dai test come definiti; `imposta` usa `this._map`, impostato in `aggiungiLayer`.

**Review Focus**: i cinque casi hanno test — (1) `test_sezione_2021_senza_dato_2023…` T5; (2) test `percentuali…`/`residenti…` T3; (3) `test_strato_non_caricabile…` T4; (4) test `input scomodi…` T3 e `test_ricerca_input_scomodi…` T9; (5) `test_scheda_fuori_copertura…` T8.
