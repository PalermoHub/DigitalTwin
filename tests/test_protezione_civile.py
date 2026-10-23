"""Piano di emergenza della Protezione civile: coerenza dei dati in dati/protezione-civile/ generati da scripts/protezione_civile.py."""
import json
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DATI = ROOT / "dati" / "protezione-civile"
CLASSI = {"attesa", "accoglienza", "ammassamento", "ospedale", "rischio"}


@pytest.fixture(scope="module")
def aree():
    return json.loads((DATI / "aree.geojson").read_text(encoding="utf-8"))["features"]


def test_ogni_area_ha_classe_e_zona(aree):
    assert len(aree) >= 400
    for f in aree:
        p = f["properties"]
        assert p["classe"] in CLASSI
        assert p["circoscrizione"] and p["quartiere"] and p["upl"]
        assert p["sup_m2"] > 0


def test_geometrie_senza_quota_nel_comune(aree):
    def punti(c):
        return [c] if isinstance(c[0], float) else [q for x in c for q in punti(x)]
    for f in aree:
        for q in punti(f["geometry"]["coordinates"]):
            assert len(q) == 2 and 13.2 < q[0] < 13.5 and 38.0 < q[1] < 38.3


def test_manifest_coerente_con_le_aree(aree):
    m = json.loads((DATI / "protezione-civile.json").read_text(encoding="utf-8"))
    assert m["n"] == len(aree) == sum(m["per_classe"].values())
    assert sum(sum(v.values()) for v in m["per_circoscrizione"].values()) == len(aree)


def test_pmtiles_zoom_11_17():
    out = subprocess.run(["pmtiles", "show", str(DATI / "protezione-civile.pmtiles")], capture_output=True, text=True)
    if out.returncode != 0:
        pytest.skip("pmtiles non disponibile")
    assert "min zoom: 11" in out.stdout and "max zoom: 17" in out.stdout
