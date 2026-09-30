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
