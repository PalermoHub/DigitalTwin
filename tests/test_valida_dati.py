import functools
import hashlib
import http.server
import json
import threading

import pytest

import valida_dati as v

INTESTAZIONE = "percorso_dest\tdimensione_byte\tsha256\tsorgente\turl\n"


def _sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _manifest(dati, righe):
    righe = [tuple(r) + ("",) * (5 - len(r)) for r in righe]  # url facoltativo
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


def _server(tmp_path, cors):
    www = tmp_path / "www"
    www.mkdir(exist_ok=True)

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(www), **kwargs)

        def end_headers(self):
            if cors:
                self.send_header("Access-Control-Allow-Origin", "*")
            super().end_headers()

        def log_message(self, *args):
            pass

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, www, f"http://127.0.0.1:{srv.server_address[1]}"


@pytest.fixture
def web(tmp_path):
    """Piccolo server HTTP locale con CORS: (cartella servita, url base)."""
    srv, www, base = _server(tmp_path, cors=True)
    yield www, base
    srv.shutdown()


@pytest.fixture
def web_senza_cors(tmp_path):
    srv, www, base = _server(tmp_path, cors=False)
    yield www, base
    srv.shutdown()


def test_manifest_remoto_ok(tmp_path, web):
    www, base = web
    (www / "a.txt").write_bytes(b"ciao")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/a.txt")])
    assert v.verifica_manifest(tmp_path) == []  # nessun file locale: basta il link


def test_manifest_remoto_dimensione_diversa(tmp_path, web):
    www, base = web
    (www / "a.txt").write_bytes(b"ciaoo")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/a.txt")])
    assert v.verifica_manifest(tmp_path) == ["dimensione remota diversa: t/a.txt"]


def test_manifest_remoto_stesso_peso_ma_contenuto_diverso(tmp_path, web):
    www, base = web
    (www / "a.txt").write_bytes(b"ciau")  # 4 byte come "ciao", ma contenuto diverso
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/a.txt")])
    # il controllo veloce guarda solo la dimensione: non se ne accorge
    assert v.verifica_manifest(tmp_path) == []
    # il controllo completo scarica e confronta l'hash
    assert v.verifica_manifest(tmp_path, completo=True) == ["contenuto remoto diverso: t/a.txt"]


def test_manifest_remoto_completo_ok_se_il_contenuto_coincide(tmp_path, web):
    www, base = web
    (www / "a.txt").write_bytes(b"ciao")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/a.txt")])
    assert v.verifica_manifest(tmp_path, completo=True) == []


def test_manifest_remoto_senza_cors_non_e_leggibile_dal_browser(tmp_path, web_senza_cors):
    www, base = web_senza_cors
    (www / "a.txt").write_bytes(b"ciao")
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/a.txt")])
    assert v.verifica_manifest(tmp_path) == ["CORS assente: t/a.txt"]


def test_manifest_remoto_con_redirect_non_e_accettato(tmp_path, web):
    www, base = web
    (www / "dir").mkdir()
    (www / "dir" / "a.txt").write_bytes(b"ciao")
    # SimpleHTTPRequestHandler risponde 301 a /dir (senza slash finale)
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/dir")])
    assert v.verifica_manifest(tmp_path) == ["remoto non raggiungibile: t/a.txt"]


def test_manifest_remoto_non_raggiungibile(tmp_path, web):
    _, base = web
    _manifest(tmp_path, [("t/a.txt", 4, _sha(b"ciao"), "x", f"{base}/non-esiste.txt")])
    assert v.verifica_manifest(tmp_path) == ["remoto non raggiungibile: t/a.txt"]


def test_leggi_json_dal_remoto_e_dalla_cache(tmp_path, web):
    www, base = web
    (www / "d.json").write_text('[{"SEZ21_ID": 7}]')
    _manifest(tmp_path, [("t/d.json", 17, _sha(b'[{"SEZ21_ID": 7}]'), "x", f"{base}/d.json")])
    cache = tmp_path / "cache"
    assert v.leggi_json("t/d.json", tmp_path, cache) == [{"SEZ21_ID": 7}]
    (www / "d.json").unlink()  # ora il server non ce l'ha più: deve rispondere la cache
    assert v.leggi_json("t/d.json", tmp_path, cache) == [{"SEZ21_ID": 7}]


def test_leggi_json_locale_ha_la_precedenza(tmp_path):
    (tmp_path / "t").mkdir()
    (tmp_path / "t" / "d.json").write_text('{"a": 1}')
    _manifest(tmp_path, [("t/d.json", 8, _sha(b'{"a": 1}'), "x")])
    assert v.leggi_json("t/d.json", tmp_path, tmp_path / "cache") == {"a": 1}


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
    info = v.info_raster(v.sorgente("terreno/palermo_dtm5m.tif"))
    assert info["epsg"] == 6875
    assert info["dimensioni"] == [3680, 3871]
    assert abs(info["passo"][0] - 5.0) < 0.01
    assert info["nodata"] == -9999


def test_pmtiles_catasto():
    info = v.info_pmtiles(v.sorgente("catasto/particelle.pmtiles"))
    layer = {l["nome"]: l for l in info["layers"]}["particelle"]
    assert {"Foglio", "Paricella"} <= set(layer["campi"])
    assert layer["minzoom"] == 12 and layer["maxzoom"] == 18


def test_vettoriale_edifici():
    info = v.info_vettoriale(v.sorgente("edifici/edificato.gpkg"))
    assert info["epsg"] == 4326
    assert info["layers"][0]["n"] == 111844


def test_catalogo_reale_rispetta_le_regole(catalogo):
    assert v.controlla_regole(catalogo) == []


def test_catalogo_non_contiene_percorsi_locali(catalogo):
    assert "/mnt/" not in json.dumps(catalogo)


def test_sorgente_preferisce_la_copia_locale_poi_il_link(tmp_path):
    (tmp_path / "t").mkdir()
    (tmp_path / "t" / "a.bin").write_bytes(b"x")
    _manifest(tmp_path, [("t/a.bin", 1, _sha(b"x"), "x"), ("t/b.bin", 1, _sha(b"y"), "x", "https://esempio.test/b.bin")])
    assert v.sorgente("t/a.bin", tmp_path) == tmp_path / "t" / "a.bin"
    assert v.sorgente("t/b.bin", tmp_path) == "https://esempio.test/b.bin"
    with pytest.raises(FileNotFoundError):
        v.sorgente("t/c.bin", tmp_path)


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


ID_TILESET = {"prg-zto", "prg-ppe", "prg-va", "prg-vl", "terrain-dem", "elevazione", "griglia"}


def test_tileset_nel_catalogo(catalogo):
    tileset = {voce["id"]: voce for voce in catalogo if voce.get("tipo") == "tileset"}
    assert ID_TILESET <= set(tileset)
    for voce in tileset.values():
        assert "{z}/{x}/{y}" in voce["url"], voce["id"]
        assert voce["url"].startswith("https://"), voce["id"]
        assert voce.get("fonte") and voce.get("esempio"), voce["id"]
    assert tileset["terrain-dem"]["licenza"] == "CC BY 4.0"


def test_tileset_reali_raggiungibili(catalogo):
    assert v.controlla_tileset(catalogo) == []


def test_controllo_tileset_segnala_quelli_irraggiungibili(web):
    www, base = web
    (www / "ok.png").write_bytes(b"x")
    cat = [
        {"tipo": "tileset", "id": "bello", "esempio": f"{base}/ok.png"},
        {"tipo": "tileset", "id": "rotto", "esempio": f"{base}/manca.png"},
        {"percorso": "altro/file.bin", "byte": 1},  # non è un tileset: ignorato
    ]
    assert v.controlla_tileset(cat) == ["tileset non raggiungibile: rotto"]
