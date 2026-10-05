"""Isole di calore (LST estiva per sezione censuaria): soglie di classificazione e coerenza dei dati in dati/isole-calore/."""
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
ic = pytest.importorskip("isole_calore")
DATI = ROOT / "dati" / "isole-calore"


def test_intervalli_uguali():
    assert ic.soglie_uguali([0, 3, 10], 5) == [0, 2, 4, 6, 8, 10]


def test_quantili_come_simple_statistics():
    # stessa regola dell'app originale: indice n*p, senza interpolazione (con n pari e indice intero, media dei due vicini)
    v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    assert ic.quantile(v, 0.5) == 5.5
    assert ic.quantile(v, 0.25) == 3
    assert ic.quantile(v, 1) == 10 and ic.quantile(v, 0) == 1
    assert ic.soglie_quantili(v, 2) == [1, 5.5, 10]


def test_naturali_spezzano_dove_c_e_il_salto():
    v = [1, 1.1, 1.2, 10, 10.1, 10.2, 20, 20.1]
    # il limite è il primo valore della classe successiva: nessun valore cade nella classe sbagliata con `step` di MapLibre
    assert ic.soglie_naturali(v, 3) == [1, 10, 20, 20.1]


def test_naturali_con_meno_valori_che_classi():
    assert ic.soglie_naturali([5, 6], 4) == [5, 6, 6]


def test_classe_di_un_valore_coerente_con_step():
    s = [1, 10, 20, 20.1]
    assert [ic.classe_di(x, s) for x in (1, 9.9, 10, 19.9, 20, 20.1)] == [0, 0, 1, 1, 2, 2]


def test_serie_comunale():
    righe = [{"LST_2019": 40.0, "LST_2020": 42.0}, {"LST_2019": 44.0, "LST_2020": None}, {"LST_2019": 42.0, "LST_2020": 44.0}]
    s = ic.serie_comunale(righe, [2019, 2020])
    assert s["anni"] == [2019, 2020]
    assert s["media"] == [42.0, 43.0]
    assert s["n"] == [3, 2]


@pytest.mark.skipif(not (DATI / "isole-calore.json").exists(), reason="dati non generati")
def test_manifest_coerente():
    m = json.loads((DATI / "isole-calore.json").read_text(encoding="utf-8"))
    assert (DATI / "sezioni.pmtiles").stat().st_size > 0
    assert m["anni"][0] == 2019 and m["anni"][-1] == m["anno"] == 2025
    for metodo in ("jenks", "quantile", "equal"):
        for k in range(3, 10):
            s = m["soglie"][metodo][str(k)]
            assert len(s) == k + 1 and s == sorted(s)
            assert s[0] == m["min"] and s[-1] == m["max"]
    assert len(m["serie"]["media"]) == len(m["anni"])
    assert m["link"].startswith("https://palermohub.opendatasicilia.it/")
