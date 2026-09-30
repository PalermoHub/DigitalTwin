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
