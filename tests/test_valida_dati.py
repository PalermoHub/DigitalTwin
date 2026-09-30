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
