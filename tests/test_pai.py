"""Script dei vincoli PAI (funzioni pure) e coerenza dei dati scaricati in dati/pai/."""
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
pai = pytest.importorskip("pai")
PAI = ROOT / "dati" / "pai"
LAVORO = ROOT / "lavoro" / "pai"


def test_data_iso():
    assert pai.data_iso(1175817600000) == "2007-04-06"
    assert pai.data_iso("05/03/2019") == "2019-03-05"
    assert pai.data_iso(None) is None


def test_classi_con_la_stessa_etichetta_si_fondono_e_il_prefisso_si_applica():
    layer = {"drawingInfo": {"transparency": 0, "renderer": {"type": "uniqueValue", "uniqueValueInfos": [
        {"value": "4", "label": "4", "symbol": {"type": "esriSFS", "color": [168, 0, 0, 255], "outline": {"color": [168, 0, 0, 255], "width": 1}}},
        {"value": "5", "label": "4", "symbol": {"type": "esriSFS", "color": [168, 0, 0, 255], "outline": {"color": [168, 0, 0, 255], "width": 1}}},
    ]}}}
    classi = pai.simbologia(layer, {"id": "x", "titolo": "X"}, "P")
    assert len(classi) == 1
    assert classi[0]["label"] == "P4" and classi[0]["valori"] == ["4", "5"] and classi[0]["colore"] == "#a80000"


def test_comune_dal_campo_o_dalla_geometria():
    shapely = pytest.importorskip("shapely.geometry")
    palermo = shapely.box(0, 0, 10, 10)
    nucleo = palermo.buffer(-1)
    dentro, sfiora = shapely.box(4, 4, 5, 5), shapely.box(9.5, 4, 11, 5)
    assert pai.e_di_palermo({"COMUNE": "Palermo"}, sfiora, palermo, nucleo)
    assert pai.e_di_palermo({"COMUNE": " "}, dentro, palermo, nucleo)  # campo vuoto: decide la geometria
    assert pai.e_di_palermo({"Altri_comu": "Palermo"}, sfiora, palermo, nucleo)
    assert not pai.e_di_palermo({"COMUNE": "Monreale"}, sfiora, palermo, nucleo)


@pytest.mark.skipif(not (PAI / "pai.json").exists(), reason="dati PAI non scaricati")
def test_manifest_coerente_con_i_file():
    m = json.loads((PAI / "pai.json").read_text(encoding="utf-8"))
    assert (PAI / "pai.pmtiles").stat().st_size > 0
    for d in m["dataset"]:
        f = LAVORO / f"{d['id']}.geojson"
        if not LAVORO.exists() or not d["n"]:
            continue
        feats = json.loads(f.read_text(encoding="utf-8"))["features"]
        assert len(feats) == d["n"]
        for t in d["temi"]:
            assert all(f"cls_{t['id']}" in x["properties"] for x in feats)
            assert sum(c["n"] for c in t["classi"]) <= d["n"]
