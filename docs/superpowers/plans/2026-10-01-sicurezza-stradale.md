# Sicurezza stradale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare nel Digital Twin la viabilità pericolosa (tasso incidenti/km, hotspot Gi*, incidenti) dello studio `Rete-Stradale 01`, con scheda per tratto.

**Architecture:** Gli script dello studio hanno già prodotto tre GeoJSON. Uno script nostro (`scripts/sicurezza_stradale.py`) li riduce, aggiunge `classe` (quartile del tasso) e `anno`, e li converte in PMTiles con tippecanoe. Un modulo layer (`js/layers/sicurezza.js`) li mostra come gli altri moduli (strati spenti, layer «hit», legenda), con un modello di scheda puro (`scheda-sicurezza.js`).

**Tech Stack:** Python 3 + pytest, tippecanoe 2.53, MapLibre GL + PMTiles, moduli ES + `node --test`, Playwright (tests/test_viewer.py).

**Spec:** `docs/superpowers/specs/2026-10-01-sicurezza-stradale-design.md`

## Global Constraints

- Dati pesanti in `dati/*/` NON vanno in git (`.gitignore`): restano MANIFEST, README, catalogo.
- Strati spenti di default; layer «hit» trasparenti sempre presenti (come `trasporto.js`).
- Tasso/km mostrato solo per archi con `tasso_affidabile = true` (lunghezza ≥ 20 m).
- Incidenti con `snap_affidabile = false` (snap > 60 m) esclusi dai PMTiles.
- Hotspot: solo celle `hotspot 90%|95%|99%` (scartati coldspot e «non significativo»).
- Testi in italiano con accenti corretti; identificatori nello stile del repo (italiano).
- Nota sui limiti dei dati sempre in scheda: geocoding degli incidenti; il 2019 non è nel dataset pulito (anni presenti: 2015–2018 e 2020–2023).

## Review Focus

- Arco con `n_incidenti` 0 o nullo: la scheda non mostra «0 incidenti/km» ma «nessun incidente registrato».
- Arco non affidabile (<20 m) con incidenti: conteggio sì, tasso «non significativo».
- Campi PAI nulli (`None`): nessuna riga vuota, nessun «null» a schermo.
- Feature spezzate in più tile (stesso `arco_id`): una sola voce nella scheda.
- Filtro anno su 2019 o anno assente: nessun errore, nessun punto (il 2019 non esiste).

---

## File structure

- Create `scripts/sicurezza_stradale.py` — riduce i GeoJSON e produce i 3 PMTiles.
- Create `tests/test_sicurezza_stradale.py` — pipeline su dati minimi.
- Create `js/layers/scheda-sicurezza.js` — modello puro: voci arco / hotspot / incidente + tooltip.
- Create `tests/js/scheda-sicurezza.test.mjs`.
- Create `js/layers/sicurezza.js` — sorgenti, layer, strati, legenda, filtro anno, scheda.
- Modify `js/app.js` — aggiungere il modulo a `MODULI`.
- Modify `css/app.css` — legenda sicurezza.
- Modify `tests/test_viewer.py` — test del viewer.
- Modify `dati/MANIFEST.tsv`, `dati/README.md`, `index.html` (crediti), `docs/superpowers/specs/...-design.md` (nota 2019).

---

### Task 1: Pipeline dati (script + PMTiles)

**Files:**
- Create: `scripts/sicurezza_stradale.py`
- Test: `tests/test_sicurezza_stradale.py`
- Copia sorgenti in `dati/mobilita/sicurezza/` (non in git)

**Interfaces:**
- Produces (`sicurezza_stradale.py`):
  - `ridotti_archi(fc: dict) -> dict` FeatureCollection con proprietà `CAMPI_ARCHI` + `classe` (int 0–3 o `None`)
  - `ridotti_hotspot(fc) -> dict`
  - `ridotti_incidenti(fc) -> dict`
  - `scrivi(src: Path = SRC, out: Path = OUT) -> dict[str, int]` scrive i GeoJSON ridotti in `out/` e i PMTiles; ritorna `{nome: n_feature}`
  - file prodotti: `archi.pmtiles` (source-layer `archi`), `hotspot.pmtiles` (`hotspot`), `incidenti.pmtiles` (`incidenti`)
- Classe tasso: `classe = 0..3` per quartili (soglie 25/50/75° percentile) calcolati sui soli archi con `tasso_affidabile` e `n_incidenti > 0`; `None` altrimenti.

- [ ] **Step 1: Copiare i sorgenti**

```bash
mkdir -p dati/mobilita/sicurezza
for f in rete_rischio hotspot_griglia incidenti_snap; do
  cp "../Rete-Stradale 01/dati/geojson/$f.geojson" dati/mobilita/sicurezza/
done
ls -la dati/mobilita/sicurezza
```

- [ ] **Step 2: Scrivere i test (falliscono)**

```python
# tests/test_sicurezza_stradale.py
import json

import pytest

import sicurezza_stradale as s


def _arco(i, tasso, n, affidabile=True, **extra):
    props = {"arco_id": i, "nome": f"Via {i}", "highway": "tertiary", "lunghezza_m": 100.0, "n_incidenti": n,
             "tasso_km": tasso, "tasso_affidabile": affidabile, "u_node": 1, "v_node": 2, "osm_id": "9",
             "betweenness_edge": 0.1, "pendenza_media_pct": 2.0, "accessibilita": "agevole", "Quartiere": "Libertà",
             "Circoscrizione": "VIII", "UPL": "Vittorio Veneto", "rischio_geomorf_label": None,
             "rischio_idraul_label": None, "priorita_geomorf": "nessun rischio PAI",
             "priorita_idraul": "nessun rischio idraulico", **extra}
    return {"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": [[13.3, 38.1], [13.31, 38.1]]}}


def _fc(*feature):
    return {"type": "FeatureCollection", "features": list(feature)}


def test_archi_scarta_campi_tecnici_e_classifica_a_quartili():
    fc = _fc(*[_arco(i, t, 2) for i, t in enumerate([10, 20, 30, 40, 50, 60, 70, 80])])
    out = s.ridotti_archi(fc)
    p = out["features"][0]["properties"]
    assert "u_node" not in p and "osm_id" not in p and "betweenness_edge" not in p
    assert [f["properties"]["classe"] for f in out["features"]] == [0, 0, 1, 1, 2, 2, 3, 3]


def test_archi_non_affidabili_o_senza_incidenti_non_hanno_classe():
    fc = _fc(_arco(0, 500.0, 1, affidabile=False), _arco(1, 0.0, 0), _arco(2, 5.0, 1), _arco(3, 9.0, 1))
    classi = [f["properties"]["classe"] for f in s.ridotti_archi(fc)["features"]]
    assert classi[0] is None and classi[1] is None
    assert classi[2] is not None and classi[3] is not None


def _cella(i, etichetta):
    return {"type": "Feature", "properties": {"cell_id": i, "n_incidenti": 4, "gravita_tot": 3.0, "hotspot_count": etichetta,
                                              "hotspot_gravita": etichetta, "gi_z_count": 2.0},
            "geometry": {"type": "Polygon", "coordinates": [[[13.3, 38.1], [13.31, 38.1], [13.31, 38.11], [13.3, 38.1]]]}}


def test_hotspot_tiene_solo_le_celle_significative_con_livello():
    fc = _fc(_cella(0, "hotspot 99%"), _cella(1, "coldspot 99%"), _cella(2, "non significativo"), _cella(3, "hotspot 90%"))
    out = s.ridotti_hotspot(fc)["features"]
    assert [f["properties"]["cell_id"] for f in out] == [0, 3]
    assert [f["properties"]["livello_gravita"] for f in out] == [99, 90]
    assert "gi_z_count" not in out[0]["properties"]


def _inc(data, aff=True, tip="F"):
    return {"type": "Feature", "properties": {"Data": data, "Luogo": "VIA X", "Tipologia": tip, "feriti_n": 1, "gravita": 1.0,
                                              "dist_snap_m": 2.0, "snap_affidabile": aff, "arco_id": 7},
            "geometry": {"type": "Point", "coordinates": [13.3, 38.1]}}


def test_incidenti_anno_derivato_e_snap_non_affidabili_esclusi():
    out = s.ridotti_incidenti(_fc(_inc("01/01/2015"), _inc("31/12/2023", tip="M"), _inc("05/05/2020", aff=False)))["features"]
    assert [f["properties"]["anno"] for f in out] == [2015, 2023]
    assert set(out[0]["properties"]) == {"anno", "Tipologia", "feriti_n", "Luogo", "arco_id"}


def test_incidenti_data_malformata_non_rompe_e_scarta_il_punto():
    assert s.ridotti_incidenti(_fc(_inc("boh"), _inc("01/02/2016")))["features"][0]["properties"]["anno"] == 2016


def test_scrivi_produce_tre_pmtiles(tmp_path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "rete_rischio.geojson").write_text(json.dumps(_fc(_arco(0, 10, 1), _arco(1, 20, 2))))
    (src / "hotspot_griglia.geojson").write_text(json.dumps(_fc(_cella(0, "hotspot 95%"))))
    (src / "incidenti_snap.geojson").write_text(json.dumps(_fc(_inc("01/01/2015"))))
    out = tmp_path / "out"
    n = s.scrivi(src, out)
    assert n == {"archi": 2, "hotspot": 1, "incidenti": 1}
    for nome in ("archi", "hotspot", "incidenti"):
        assert (out / f"{nome}.pmtiles").stat().st_size > 0
```

Run: `python3 -m pytest tests/test_sicurezza_stradale.py -v`
Expected: FAIL (`ModuleNotFoundError: sicurezza_stradale`).

- [ ] **Step 3: Implementare lo script**

```python
#!/usr/bin/env python3
"""Studio «Rete stradale» (Rete-Stradale 01) -> PMTiles della sicurezza stradale in dati/mobilita/sicurezza/.

  python3 scripts/sicurezza_stradale.py   legge rete_rischio, hotspot_griglia e incidenti_snap (.geojson) e scrive
                                          archi.pmtiles, hotspot.pmtiles, incidenti.pmtiles (+ i GeoJSON ridotti)

archi:     tutti gli archi con i campi usati dal viewer; `classe` (0-3) = quartile del tasso incidenti/km, solo per archi con
           tasso affidabile (>= 20 m) e almeno un incidente
hotspot:   solo celle Gi* significative (90/95/99%), con il livello numerico
incidenti: punti con snap affidabile (<= 60 m), con l'anno ricavato dalla data
"""
import json
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "mobilita" / "sicurezza"
SRC = OUT

CAMPI_ARCHI = ["arco_id", "nome", "highway", "lunghezza_m", "n_incidenti", "tasso_km", "tasso_affidabile",
               "pendenza_media_pct", "accessibilita", "Quartiere", "Circoscrizione", "UPL",
               "rischio_geomorf_label", "rischio_idraul_label", "priorita_geomorf", "priorita_idraul"]
CAMPI_INCIDENTI = ["Tipologia", "feriti_n", "Luogo", "arco_id"]


def _fc(features):
    return {"type": "FeatureCollection", "features": features}


def _tiene(props, campi):
    return {c: props.get(c) for c in campi if props.get(c) is not None}


def ridotti_archi(fc):
    validi = [f["properties"]["tasso_km"] for f in fc["features"]
              if f["properties"].get("tasso_affidabile") and (f["properties"].get("n_incidenti") or 0) > 0]
    soglie = statistics.quantiles(validi, n=4, method="inclusive") if len(validi) >= 2 else []
    out = []
    for f in fc["features"]:
        p = f["properties"]
        props = _tiene(p, CAMPI_ARCHI)
        if p.get("tasso_affidabile") and (p.get("n_incidenti") or 0) > 0 and soglie:
            props["classe"] = sum(p["tasso_km"] > t for t in soglie)
        out.append({"type": "Feature", "properties": props, "geometry": f["geometry"]})
    return _fc(out)


def ridotti_hotspot(fc):
    out = []
    for f in fc["features"]:
        e = f["properties"].get("hotspot_gravita") or ""
        if not e.startswith("hotspot "):
            continue
        p = f["properties"]
        props = {"cell_id": p["cell_id"], "n_incidenti": p["n_incidenti"], "gravita_tot": p["gravita_tot"],
                 "livello_gravita": int(e.split()[1].rstrip("%"))}
        c = p.get("hotspot_count") or ""
        if c.startswith("hotspot "):
            props["livello_conteggio"] = int(c.split()[1].rstrip("%"))
        out.append({"type": "Feature", "properties": props, "geometry": f["geometry"]})
    return _fc(out)


def ridotti_incidenti(fc):
    out = []
    for f in fc["features"]:
        p = f["properties"]
        if not p.get("snap_affidabile"):
            continue
        try:
            anno = int(str(p["Data"])[-4:])
        except (KeyError, ValueError):
            continue
        out.append({"type": "Feature", "properties": {"anno": anno, **_tiene(p, CAMPI_INCIDENTI)}, "geometry": f["geometry"]})
    return _fc(out)


def _pmtiles(geojson, pmtiles, strato, zoom_min, zoom_max):
    subprocess.run(
        ["tippecanoe", "-o", str(pmtiles), "-f", "-l", strato, f"-Z{zoom_min}", f"-z{zoom_max}",
         "--no-tile-size-limit", "--drop-densest-as-needed", "--no-feature-limit", str(geojson)],
        check=True, capture_output=True,
    )


def scrivi(src=SRC, out=OUT):
    out.mkdir(parents=True, exist_ok=True)
    lavori = [("archi", "rete_rischio", ridotti_archi, 10, 16), ("hotspot", "hotspot_griglia", ridotti_hotspot, 10, 15),
              ("incidenti", "incidenti_snap", ridotti_incidenti, 12, 16)]
    n = {}
    for nome, sorgente, riduci, zmin, zmax in lavori:
        fc = riduci(json.loads((src / f"{sorgente}.geojson").read_text(encoding="utf-8")))
        ridotto = out / f"{nome}.geojson"
        ridotto.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        _pmtiles(ridotto, out / f"{nome}.pmtiles", nome, zmin, zmax)
        n[nome] = len(fc["features"])
    return n


def main():
    n = scrivi()
    print(", ".join(f"{k}: {v}" for k, v in n.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Test**

Run: `python3 -m pytest tests/test_sicurezza_stradale.py -v`
Expected: PASS (6 test).

- [ ] **Step 5: Generare i dati veri e controllare le dimensioni**

Run: `python3 scripts/sicurezza_stradale.py && ls -la dati/mobilita/sicurezza/*.pmtiles`
Expected: `archi: 18736, hotspot: 448, incidenti: 23457`; PMTiles totali ≲ 20 MB. Se `archi.pmtiles` > 15 MB, abbassare lo zoom massimo a 15 e rilanciare.

- [ ] **Step 6: Commit**

```bash
git add scripts/sicurezza_stradale.py tests/test_sicurezza_stradale.py
git commit -m "feat: pipeline PMTiles della sicurezza stradale (archi, hotspot, incidenti)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Modello della scheda

**Files:**
- Create: `js/layers/scheda-sicurezza.js`
- Test: `tests/js/scheda-sicurezza.test.mjs`

**Interfaces:**
- Consumes: `righe` da `../core/scheda-util.js`; formato voce di `scheda-modello.js` (`{chiave, peso, titolo, icona, badge, gruppi, nota}`).
- Produces:
  - `NOTA_DATI: string`
  - `voceArco(p) -> voce`, `voceHotspot(p) -> voce`, `voceIncidente(p) -> voce`
  - `tooltipArco(p) -> {titolo, dettaglio}`
  - `GRAVITA: {M, R, F, C}` → `{nome, colore}`

- [ ] **Step 1: Test (falliscono)**

```js
// tests/js/scheda-sicurezza.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import { voceArco, voceHotspot, voceIncidente, tooltipArco, GRAVITA, NOTA_DATI } from '../../js/layers/scheda-sicurezza.js';

const arco = {
  arco_id: 1, nome: 'Viale Croce Rossa', highway: 'tertiary', lunghezza_m: 216.1, n_incidenti: 5, tasso_km: 23.137,
  tasso_affidabile: true, pendenza_media_pct: 1.69, accessibilita: 'agevole', Quartiere: 'Libertà', Circoscrizione: 'VIII',
  UPL: 'Vittorio Veneto', priorita_geomorf: 'nessun rischio PAI', priorita_idraul: 'nessun rischio idraulico',
};
const valori = v => Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(r => [r.etichetta, r.valore]));

test('arco: titolo, incidenti e tasso arrotondato', () => {
  const v = voceArco(arco);
  assert.equal(v.titolo, 'Viale Croce Rossa');
  assert.equal(v.badge, 'Tratto stradale');
  const r = valori(v);
  assert.equal(r['Incidenti 2015–2023'], '5');
  assert.equal(r['Incidenti per km'], '23,1');
  assert.equal(r['Pendenza media'], '1,7%');
});

test('arco senza incidenti: lo dice, niente tasso', () => {
  const r = valori(voceArco({ ...arco, n_incidenti: 0, tasso_km: 0 }));
  assert.equal(r['Incidenti 2015–2023'], 'nessun incidente registrato');
  assert.equal(r['Incidenti per km'], undefined);
});

test('arco non affidabile (<20 m): conteggio sì, tasso «non significativo»', () => {
  const r = valori(voceArco({ ...arco, lunghezza_m: 12, tasso_affidabile: false, tasso_km: 400 }));
  assert.equal(r['Incidenti 2015–2023'], '5');
  assert.equal(r['Incidenti per km'], 'non significativo (tratto < 20 m)');
});

test('arco: PAI nulli o «nessun rischio» non producono righe', () => {
  const v = voceArco({ ...arco, rischio_geomorf_label: null, rischio_idraul_label: undefined });
  const et = v.gruppi.flatMap(g => g.righe).map(r => r.etichetta);
  assert.ok(!et.includes('Rischio frane') && !et.includes('Rischio alluvioni'));
  assert.ok(!JSON.stringify(v).includes('null') && !JSON.stringify(v).includes('undefined'));
});

test('arco: rischio e priorità PAI compaiono se presenti', () => {
  const r = valori(voceArco({ ...arco, rischio_geomorf_label: 'R4 - molto elevato', priorita_geomorf: "priorita' massima" }));
  assert.equal(r['Rischio frane'], 'R4 - molto elevato');
  assert.equal(r['Priorità frane'], "priorita' massima");
});

test('hotspot: livello di confidenza e gravità', () => {
  const v = voceHotspot({ cell_id: 3, n_incidenti: 40, gravita_tot: 55.4, livello_gravita: 99, livello_conteggio: 95 });
  assert.equal(v.badge, 'Hotspot incidenti');
  const r = valori(v);
  assert.equal(r['Confidenza (gravità)'], '99%');
  assert.equal(r['Incidenti nella cella'], '40');
});

test('incidente: gravità decodificata, feriti', () => {
  const v = voceIncidente({ anno: 2018, Tipologia: 'M', feriti_n: 0, Luogo: 'VIA ROMA' });
  assert.equal(v.titolo, 'VIA ROMA');
  assert.equal(valori(v)['Gravità'], 'Mortale');
  assert.equal(valori(v)['Anno'], '2018');
  assert.equal(GRAVITA.F.nome, 'Con feriti');
});

test('tooltip arco: via e dato sintetico, anche senza incidenti', () => {
  assert.deepEqual(tooltipArco(arco), { titolo: 'Viale Croce Rossa', dettaglio: '5 incidenti · 23,1 per km' });
  assert.equal(tooltipArco({ ...arco, n_incidenti: 0 }).dettaglio, 'Nessun incidente registrato');
  assert.equal(tooltipArco({ ...arco, nome: undefined }).titolo, 'Strada senza nome');
});

test('unisci: la nota sui limiti dei dati è nella voce arco', () => {
  const { sezioni } = unisci([voceArco(arco)]);
  assert.ok(JSON.stringify(sezioni).includes(NOTA_DATI.slice(0, 30)));
});
```

Run: `node --test tests/js/scheda-sicurezza.test.mjs`
Expected: FAIL (modulo mancante).

- [ ] **Step 2: Implementare il modello**

```js
// js/layers/scheda-sicurezza.js
// Modello puro della sicurezza stradale (studio «Rete stradale»): le righe fisse della scheda di destra.
import { righe } from '../core/scheda-util.js';

export const NOTA_DATI = 'Incidenti 2015–2023 del Comune di Palermo, agganciati alla rete stradale di OpenStreetMap: il 2019 non è nel dataset pulito '
  + 'e la posizione di alcuni incidenti è approssimata. Il tasso per km vale solo per tratti di almeno 20 m. Indicatore di supporto, non una graduatoria ufficiale.';

export const GRAVITA = {
  M: { nome: 'Mortale', colore: '#7f0000' },
  R: { nome: 'Feriti con prognosi riservata', colore: '#d7301f' },
  F: { nome: 'Con feriti', colore: '#fc8d59' },
  C: { nome: 'Solo danni a cose', colore: '#9e9e9e' },
};

const num = (v, d = 1) => Number(v).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: d });
const ha = v => v != null && Number.isFinite(Number(v));
const NESSUN = /^nessun/i;

function rigaIncidenti(p) {
  if (!ha(p.n_incidenti) || Number(p.n_incidenti) === 0) return ['Incidenti 2015–2023', 'nessun incidente registrato'];
  return ['Incidenti 2015–2023', num(p.n_incidenti, 0)];
}

function rigaTasso(p) {
  if (!ha(p.n_incidenti) || Number(p.n_incidenti) === 0) return ['Incidenti per km', null];
  if (!p.tasso_affidabile) return ['Incidenti per km', 'non significativo (tratto < 20 m)'];
  return ['Incidenti per km', num(p.tasso_km)];
}

const pai = v => (v && !NESSUN.test(v) ? v : null);

export function voceArco(p) {
  return {
    chiave: `arco-${p.arco_id}`, peso: 8, titolo: p.nome || 'Strada senza nome', icona: 'strada', badge: 'Tratto stradale', sempre: true,
    contesto: { Quartiere: p.Quartiere, Circoscrizione: p.Circoscrizione, UPL: p.UPL },
    gruppi: [
      { titolo: 'Sicurezza', righe: righe([rigaIncidenti(p), rigaTasso(p)]) },
      { titolo: 'Tratto', righe: righe([
        ['Lunghezza', ha(p.lunghezza_m) ? `${num(p.lunghezza_m, 0)} m` : null],
        ['Pendenza media', ha(p.pendenza_media_pct) ? `${num(p.pendenza_media_pct)}%` : null],
        ['Accessibilità per pendenza', p.accessibilita],
      ]) },
      { titolo: 'Rischio idrogeologico', righe: righe([
        ['Rischio frane', pai(p.rischio_geomorf_label)], ['Priorità frane', pai(p.priorita_geomorf)],
        ['Rischio alluvioni', pai(p.rischio_idraul_label)], ['Priorità alluvioni', pai(p.priorita_idraul)],
      ]) },
    ],
    nota: NOTA_DATI,
  };
}

export function voceHotspot(p) {
  return {
    chiave: `hotspot-${p.cell_id}`, peso: 7, titolo: 'Zona a incidenti concentrati', icona: 'strada', badge: 'Hotspot incidenti', sempre: true,
    gruppi: [{ righe: righe([
      ['Confidenza (gravità)', ha(p.livello_gravita) ? `${p.livello_gravita}%` : null],
      ['Confidenza (conteggio)', ha(p.livello_conteggio) ? `${p.livello_conteggio}%` : null],
      ['Incidenti nella cella', ha(p.n_incidenti) ? num(p.n_incidenti, 0) : null],
      ['Gravità pesata', ha(p.gravita_tot) ? num(p.gravita_tot) : null],
    ]) }],
    nota: 'Celle di 250 m, statistica Getis-Ord Gi* (contiguità Queen, 999 permutazioni). La gravità pesa mortali 5, prognosi riservata 3, feriti 1, solo cose 0,2.',
  };
}

export function voceIncidente(p) {
  return {
    chiave: `incidente-${p.arco_id}-${p.anno}-${p.Luogo}`, peso: 6, titolo: p.Luogo || 'Incidente', icona: 'strada', badge: 'Incidente', sempre: true,
    gruppi: [{ righe: righe([
      ['Anno', p.anno], ['Gravità', GRAVITA[p.Tipologia]?.nome], ['Feriti', ha(p.feriti_n) ? num(p.feriti_n, 0) : null],
    ]) }],
  };
}

export function tooltipArco(p) {
  const titolo = p.nome || 'Strada senza nome';
  if (!ha(p.n_incidenti) || Number(p.n_incidenti) === 0) return { titolo, dettaglio: 'Nessun incidente registrato' };
  const n = Number(p.n_incidenti);
  const inc = `${num(n, 0)} ${n === 1 ? 'incidente' : 'incidenti'}`;
  return { titolo, dettaglio: p.tasso_affidabile ? `${inc} · ${num(p.tasso_km)} per km` : inc };
}
```

- [ ] **Step 3: Eseguire**

Run: `node --test tests/js/scheda-sicurezza.test.mjs`
Expected: PASS. Se `icona: 'strada'` non esiste in `js/core/icone.js`, aggiungerla (path SVG Material «route» o «add_road») seguendo il formato delle altre voci, oppure usare `'bus'` solo se l'icona richiesta manca e non è critica; verificare con `grep -n "strada" js/core/icone.js`.

- [ ] **Step 4: Commit**

```bash
git add js/layers/scheda-sicurezza.js tests/js/scheda-sicurezza.test.mjs js/core/icone.js
git commit -m "feat: modello scheda sicurezza stradale (arco, hotspot, incidente)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Layer, legenda e viewer

**Files:**
- Create: `js/layers/sicurezza.js`
- Modify: `js/app.js` (import + `MODULI`), `css/app.css` (legenda)
- Test: `tests/test_viewer.py`

**Interfaces:**
- Consumes: `pmt` da `../core/config.js`; `segnala` da `../core/pannello.js`; `primo, tutti` da `../core/scheda-util.js`; `voceArco, voceHotspot, voceIncidente, tooltipArco, GRAVITA` (Task 2); PMTiles e source-layer `archi|hotspot|incidenti` (Task 1).
- Produces: modulo default `{ id: 'sicurezza', titolo: 'Sicurezza stradale', aggiungiSorgenti, aggiungiLayer, strati, pannello, scheda }`; id layer: `sicurezza-archi`, `sicurezza-hotspot`, `sicurezza-incidenti`, `sicurezza-hit-archi`, `sicurezza-hit-hotspot`, `sicurezza-hit-incidenti`; id strati: `sicurezza-archi`, `sicurezza-hotspot`, `sicurezza-incidenti`.
- Filtro anno: `<select id="sicurezza-anno">` nella legenda; opzioni «Tutti gli anni», 2015…2023 senza 2019.

- [ ] **Step 1: Test viewer (falliscono)**

Aggiungere in fondo a `tests/test_viewer.py` (stesso stile dei test trasporto):

```python
def _dati_sicurezza():
    """Genera dati/mobilita/sicurezza/*.pmtiles se mancano; salta se non ci sono i sorgenti dello studio."""
    cartella = ROOT / "dati" / "mobilita" / "sicurezza"
    if not (cartella / "archi.pmtiles").exists():
        if not (cartella / "rete_rischio.geojson").exists():
            pytest.skip("dati/mobilita/sicurezza assenti")
        import sicurezza_stradale
        sicurezza_stradale.scrivi()
    return cartella


def test_sicurezza_strati_presenti_e_spenti_di_default(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-archi")
    for strato in ("sicurezza-archi", "sicurezza-hotspot", "sicurezza-incidenti"):
        assert v.page.is_visible(f"#strato-{strato}"), strato
        assert not v.page.is_checked(f"#strato-{strato}"), strato
        assert v.js(f"window.dt.map.getLayoutProperty('{strato}', 'visibility')") == "none", strato
    assert v.page.is_visible("#gruppo-sicurezza .legenda-sicurezza")


def test_sicurezza_accendere_archi_li_disegna(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-archi")
    v.page.check("#strato-sicurezza-archi")
    v.vai(13.3606, 38.1157, 14)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-archi']}).length > 0")
    assert not any("sicurezza" in e.lower() for e in v.errori)


def test_sicurezza_scheda_arco_anche_a_strato_spento(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.vai(13.3606, 38.1157, 15)
    v.page.wait_for_function("window.dt.map.queryRenderedFeatures({layers: ['sicurezza-hit-archi']}).length > 0")
    x, y = v.js("""() => {
        const m = window.dt.map;
        const f = m.queryRenderedFeatures({layers: ['sicurezza-hit-archi']})[0];
        const c = f.geometry.coordinates; const p = m.project(Array.isArray(c[0]) ? c[Math.floor(c.length / 2)] : c);
        return [p.x, p.y];
    }""")
    v.page.mouse.click(x, y)
    v.page.wait_for_selector("#scheda .scheda-badge, #scheda [class*=badge]")
    assert "Tratto stradale" in v.page.inner_text("#scheda")


def test_sicurezza_filtro_anno_applica_filtro_agli_incidenti(apri):
    _dati_sicurezza()
    v = apri()
    v.attendi_pronto()
    v.mostra("#strato-sicurezza-incidenti")
    v.page.select_option("#sicurezza-anno", "2018")
    assert v.js("JSON.stringify(window.dt.map.getFilter('sicurezza-incidenti'))") == '["==",["get","anno"],2018]'
    v.page.select_option("#sicurezza-anno", "")
    assert v.js("window.dt.map.getFilter('sicurezza-incidenti')") is None
    assert [o for o in v.js("[...document.querySelectorAll('#sicurezza-anno option')].map(o => o.value)")] == [
        "", "2015", "2016", "2017", "2018", "2020", "2021", "2022", "2023"]
```

Run: `python3 -m pytest tests/test_viewer.py -k sicurezza -v`
Expected: FAIL (strati assenti).

- [ ] **Step 2: Implementare il modulo layer**

```js
// js/layers/sicurezza.js
import { pmt } from '../core/config.js';
import { primo, tutti } from '../core/scheda-util.js';
import { voceArco, voceHotspot, voceIncidente, tooltipArco, GRAVITA } from './scheda-sicurezza.js';

// Sicurezza stradale (studio «Rete stradale», fase 2): tasso di incidenti per km sugli archi, hotspot Gi* a griglia da 250 m
// e incidenti puntuali 2015–2023 (il 2019 non è nel dataset pulito). Strati spenti di default; i layer «hit» sono sempre
// presenti così la scheda di destra mostra i dati anche a strato spento, come per trasporto, scuole e monumenti.
const ZOOM_MIN_ARCHI = 12;
const ZOOM_MIN_PUNTI = 14;
const ANNI = [2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023];
const COLORI_TASSO = ['#fee08b', '#fdae61', '#f46d43', '#a50026']; // classe 0-3 = quartili del tasso (in scripts/sicurezza_stradale.py)
const ETICHETTE_TASSO = ['basso', 'medio-basso', 'medio-alto', 'alto'];
const COLORI_HOTSPOT = ['match', ['get', 'livello_gravita'], 99, '#a50026', 95, '#f46d43', '#fdae61'];
const L = {
  archi: 'sicurezza-archi', hotspot: 'sicurezza-hotspot', incidenti: 'sicurezza-incidenti',
  hitArchi: 'sicurezza-hit-archi', hitHotspot: 'sicurezza-hit-hotspot', hitIncidenti: 'sicurezza-hit-incidenti',
};

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function creaLegenda(gruppo, map) {
  const box = el('div', 'legenda legenda-sicurezza');
  const riga = (simbolo, testo) => { const r = el('div', 'sicurezza-legenda-riga'); r.append(simbolo, testo); box.append(r); };
  const chip = colore => { const i = el('i', 'sicurezza-tratto'); i.style.background = colore; return i; };
  box.append(el('div', 'sicurezza-legenda-titolo', 'Incidenti per km (tratti ≥ 20 m)'));
  COLORI_TASSO.forEach((c, i) => riga(chip(c), `Tasso ${ETICHETTE_TASSO[i]}`));
  box.append(el('div', 'sicurezza-legenda-titolo', 'Hotspot (confidenza)'));
  [['#a50026', '99%'], ['#f46d43', '95%'], ['#fdae61', '90%']].forEach(([c, t]) => riga(chip(c), t));
  box.append(el('div', 'sicurezza-legenda-titolo', 'Incidenti (da zoom 14)'));
  for (const g of Object.values(GRAVITA)) {
    const p = el('i', 'sicurezza-pallino');
    p.style.background = g.colore;
    riga(p, g.nome);
  }
  const sel = el('select', 'sicurezza-anno');
  sel.id = 'sicurezza-anno';
  sel.setAttribute('aria-label', 'Anno degli incidenti');
  sel.append(new Option('Tutti gli anni', ''), ...ANNI.map(a => new Option(String(a), String(a))));
  sel.addEventListener('change', () => {
    const filtro = sel.value ? ['==', ['get', 'anno'], Number(sel.value)] : null;
    for (const id of [L.incidenti, L.hitIncidenti]) map.setFilter(id, filtro);
  });
  box.append(el('div', 'sicurezza-legenda-titolo', 'Anno'), sel);
  gruppo.append(box);
}

function collegaTooltip(map) {
  let popup = null;
  let mioCursore = false;
  const nascondi = () => {
    popup?.remove();
    popup = null;
    if (mioCursore) { map.getCanvas().style.cursor = ''; mioCursore = false; }
  };
  map.on('mousemove', e => {
    if (map.getLayoutProperty(L.archi, 'visibility') !== 'visible') return nascondi();
    const riquadro = [[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]];
    const f = map.queryRenderedFeatures(riquadro, { layers: [L.hitArchi] })[0];
    if (!f) return nascondi();
    map.getCanvas().style.cursor = 'pointer';
    mioCursore = true;
    const t = tooltipArco(f.properties);
    const corpo = el('div', 'sicurezza-tooltip-corpo');
    corpo.append(el('strong', null, t.titolo), el('div', null, t.dettaglio));
    popup ??= new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'sicurezza-tooltip', anchor: 'top', offset: 14 });
    popup.setLngLat(e.lngLat).setDOMContent(corpo).addTo(map);
  });
  map.on('mouseout', nascondi);
}

export default {
  id: 'sicurezza',
  titolo: 'Sicurezza stradale',
  aggiungiSorgenti(map) {
    for (const n of ['archi', 'hotspot', 'incidenti']) map.addSource(`sicurezza-${n}`, { type: 'vector', url: pmt(`mobilita/sicurezza/${n}.pmtiles`) });
  },
  aggiungiLayer(map) {
    const nascosto = { visibility: 'none' };
    const spessore = (a, b) => ['interpolate', ['linear'], ['zoom'], ZOOM_MIN_ARCHI, a, 17, b];
    map.addLayer({
      id: L.archi, type: 'line', source: 'sicurezza-archi', 'source-layer': 'archi', minzoom: ZOOM_MIN_ARCHI,
      filter: ['has', 'classe'], layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['match', ['get', 'classe'], 0, COLORI_TASSO[0], 1, COLORI_TASSO[1], 2, COLORI_TASSO[2], COLORI_TASSO[3]], 'line-width': spessore(1.2, 5), 'line-opacity': 0.9 },
    });
    map.addLayer({
      id: L.hotspot, type: 'fill', source: 'sicurezza-hotspot', 'source-layer': 'hotspot', minzoom: 10, layout: nascosto,
      paint: { 'fill-color': COLORI_HOTSPOT, 'fill-opacity': 0.45, 'fill-outline-color': '#7f0000' },
    });
    map.addLayer({
      id: L.incidenti, type: 'circle', source: 'sicurezza-incidenti', 'source-layer': 'incidenti', minzoom: ZOOM_MIN_PUNTI, layout: nascosto,
      paint: {
        'circle-color': ['match', ['get', 'Tipologia'], 'M', GRAVITA.M.colore, 'R', GRAVITA.R.colore, 'F', GRAVITA.F.colore, GRAVITA.C.colore],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2.5, 18, 6], 'circle-stroke-color': '#fff', 'circle-stroke-width': 0.8, 'circle-opacity': 0.9,
      },
    });
    // strati trasparenti sempre presenti: la scheda mostra i dati anche a strato spento
    map.addLayer({ id: L.hitArchi, type: 'line', source: 'sicurezza-archi', 'source-layer': 'archi', minzoom: 13, paint: { 'line-width': 12, 'line-opacity': 0 } });
    map.addLayer({ id: L.hitHotspot, type: 'fill', source: 'sicurezza-hotspot', 'source-layer': 'hotspot', minzoom: 10, paint: { 'fill-opacity': 0 } });
    map.addLayer({ id: L.hitIncidenti, type: 'circle', source: 'sicurezza-incidenti', 'source-layer': 'incidenti', minzoom: ZOOM_MIN_PUNTI, paint: { 'circle-radius': 9, 'circle-opacity': 0 } });
    collegaTooltip(map);
  },
  strati: [
    { id: 'sicurezza-archi', etichetta: 'Incidenti per km sulle strade', layers: [L.archi], attivo: false },
    { id: 'sicurezza-hotspot', etichetta: 'Hotspot degli incidenti', layers: [L.hotspot], attivo: false },
    { id: 'sicurezza-incidenti', etichetta: 'Incidenti (da zoom 14)', layers: [L.incidenti], attivo: false },
  ],
  pannello: creaLegenda,
  scheda: {
    layers: [L.hitIncidenti, L.hitArchi, L.hitHotspot],
    voci(trovati) {
      const voci = [];
      const visti = new Set();
      const unico = (chiave, voce) => { if (!visti.has(chiave)) { visti.add(chiave); voci.push(voce); } }; // i tile spezzano le feature
      const a = primo(trovati, L.hitArchi);
      if (a) unico(`arco-${a.properties.arco_id}`, voceArco(a.properties));
      const h = primo(trovati, L.hitHotspot);
      if (h) unico(`hotspot-${h.properties.cell_id}`, voceHotspot(h.properties));
      for (const i of tutti(trovati, L.hitIncidenti).slice(0, 3)) unico(`inc-${i.properties.arco_id}-${i.properties.anno}-${i.properties.Luogo}`, voceIncidente(i.properties));
      return voci;
    },
  },
};
```

- [ ] **Step 3: Verificare come `pannello` è chiamato e adattare**

Run: `grep -n "pannello(" js/core/*.js js/app.js`
Se `pannello` riceve solo `(gruppo)` e non `map`, fare in `aggiungiLayer` `mappa = map` in una variabile di modulo (`let mappa;`) e usarla nel listener del select invece del secondo parametro. Aggiornare il codice di conseguenza prima di proseguire.

- [ ] **Step 4: Registrare il modulo e lo stile**

In `js/app.js`: aggiungere `import sicurezza from './layers/sicurezza.js';` sotto l'import di trasporto e inserire `sicurezza` in `MODULI` prima di `confini`:

```js
const MODULI = [base, terreno, popolazione, territorio, edifici, monumenti, scuole, trasporto, sicurezza, confini];
```

In `css/app.css`, dopo le regole `.legenda-trasporto`:

```css
.legenda-sicurezza { margin-top: 8px; }
.legenda-sicurezza .sicurezza-legenda-titolo { margin: 8px 0 3px; font-weight: 600; font-size: 12px; }
.legenda i.sicurezza-tratto { width: 22px; height: 5px; border: 0; border-radius: 2px; }
.legenda i.sicurezza-pallino { width: 10px; height: 10px; border: 1px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px #888; }
.legenda-sicurezza select { width: 100%; margin-top: 2px; }
```

- [ ] **Step 5: Eseguire i test**

Run: `python3 -m pytest tests/test_viewer.py -k sicurezza -v` e `npm run test:js`
Expected: PASS. Se il click del test scheda non centra l'arco, usare `v.punto_in('sicurezza-archi', 'archi', 'sicurezza-hit-archi')` come negli altri test al posto del calcolo manuale.

- [ ] **Step 6: Commit**

```bash
git add js/layers/sicurezza.js js/app.js css/app.css tests/test_viewer.py
git commit -m "feat: layer sicurezza stradale (tasso/km, hotspot, incidenti) con scheda e filtro anno

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Documentazione, catalogo, crediti e verifica finale

**Files:**
- Modify: `dati/MANIFEST.tsv`, `dati/README.md`, `index.html` (modale Credits/Fonti), `docs/superpowers/specs/2026-10-01-sicurezza-stradale-design.md`

- [ ] **Step 1: Registrare i sorgenti in MANIFEST**

Aggiungere tre righe (stesso formato delle esistenti: `percorso_dest, dimensione_byte, sha256, sorgente, url` separati da tab; `url` vuoto):

```bash
cd dati
for f in rete_rischio hotspot_griglia incidenti_snap; do
  p="mobilita/sicurezza/$f.geojson"
  printf '%s\t%s\t%s\t%s\t\n' "$p" "$(stat -c %s "$p")" "$(sha256sum "$p" | cut -d' ' -f1)" "/home/coseerobe/GitHub-Clone/coseerobe/Rete-Stradale 01/dati/geojson/$f.geojson" >> MANIFEST.tsv
done
cd .. && python3 scripts/valida_dati.py
```

Expected: `N file catalogati, 0 errori` (`catalogo.json` e `docs/catalogo.md` rigenerati).

- [ ] **Step 2: README dei dati**

In `dati/README.md`, dopo la sezione «Trasporto pubblico», aggiungere:

```markdown
## Sicurezza stradale (`mobilita/sicurezza/`)

Dallo studio «Rete stradale» (cartella `Rete-Stradale 01`, fase 2 sicurezza + contesto pendenza/PAI): `rete_rischio.geojson` (18.736 archi OSM con incidenti, tasso/km, pendenza, TWI,
rischio PAI), `hotspot_griglia.geojson` (celle 250 m, Getis-Ord Gi*) e `incidenti_snap.geojson` (23.490 incidenti 2015–2023 agganciati alla rete; il 2019 non è nel dataset pulito).
`python3 scripts/sicurezza_stradale.py` produce `archi.pmtiles`, `hotspot.pmtiles` e `incidenti.pmtiles` (campi ridotti, `classe` = quartile del tasso per i tratti ≥ 20 m,
solo celle significative, solo incidenti con snap ≤ 60 m). Come `trasporto/`, i PMTiles non stanno in git: si rigenerano con lo script.
Fonte incidenti: Comune di Palermo (Polizia Municipale); elaborazione PalermoHub / OpenDataSicilia.
```

- [ ] **Step 3: Crediti**

Run: `grep -n -i "scuole\|AMAT\|Credits" index.html | head`
Aggiungere nella scheda Fonti/Credits, accanto alla voce del trasporto, una riga analoga: «Sicurezza stradale: incidenti 2015–2023 del Comune di Palermo, rete OpenStreetMap, elaborazione PalermoHub / OpenDataSicilia (studio Rete stradale)». Aggiornare anche la `description` meta se cita i temi (opzionale: aggiungere «sicurezza stradale»).

- [ ] **Step 4: Correggere la spec sul 2019**

In `docs/superpowers/specs/2026-10-01-sicurezza-stradale-design.md` sostituire «Nota esplicita su geocoding e 2019 (11,3% senza coordinate)» con «Nota esplicita su geocoding; il 2019 non è nel dataset pulito (anni presenti: 2015–2018 e 2020–2023)» e, nel layer Incidenti, «filtro anno (2015–2018, 2020–2023)».

- [ ] **Step 5: Suite completa**

Run: `npm run test:js && python3 -m pytest -q`
Expected: tutto verde (i test del viewer sicurezza richiedono i dati generati nel Task 1).

- [ ] **Step 6: Verifica nel browser**

Avviare `python3 scripts/serve.py`, aprire l'app, accendere i tre strati, controllare: archi colorati da zoom 12, hotspot visibili, punti da zoom 14, filtro anno, tooltip su un arco, scheda al clic con la nota. Fare uno screenshot con Playwright MCP e verificare che non ci siano errori in console.

- [ ] **Step 7: Aggiornare il grafo e committare**

```bash
graphify update .
git add dati/MANIFEST.tsv dati/README.md dati/catalogo.json docs/catalogo.md index.html docs/superpowers/specs/2026-10-01-sicurezza-stradale-design.md
git commit -m "docs: sicurezza stradale nei dati, nel catalogo e nei crediti

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review

- **Copertura spec:** dati (T1), layer a tre strati + filtro anno + hit (T3), scheda + limiti (T2), tooltip (T2/T3), MANIFEST/README/crediti (T4), test JS/pytest/viewer (T1–T3). Fuori perimetro rispettato.
- **Deviazioni dalla spec:** il 2019 non esiste nel dataset pulito (verificato: anni 2015–2018, 2020–2023), quindi niente «avviso 2019» ma una nota; le soglie del tasso sono quartili calcolati dallo script nel campo `classe` invece che in `config`.
- **Coerenza tipi:** id layer/strati e source-layer (`archi`, `hotspot`, `incidenti`) identici in T1/T3; funzioni di T2 usate in T3 con gli stessi nomi.
- **Rischi noti:** `pannello` potrebbe non ricevere `map` (step 3 di T3); icona `strada` potenzialmente assente in `icone.js` (step 3 di T2).
