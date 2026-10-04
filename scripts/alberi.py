"""Alberi monumentali di Palermo (elenco MASAF, Sicilia) -> dati/alberi_monumentali/alberi.geojson.

  python3 scripts/alberi.py   legge l'Excel scaricato dal sito del MASAF (lavoro/alberi_monumentali/),
                              tiene le righe del comune di Palermo e scrive un punto per albero

Fonte: Ministero dell'agricoltura, della sovranita' alimentare e delle foreste (MASAF), «Elenco degli alberi monumentali d'Italia»,
https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/11260
"""
import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "lavoro" / "alberi_monumentali" / "OK_IX_agg_Sicilia176_1__0_.xls"
OUT = ROOT / "dati" / "alberi_monumentali" / "alberi.geojson"
LIMITI = (13.1, 37.9, 13.6, 38.4)  # lon min, lat min, lon max, lat max: scarta coordinate errate

# lettera del criterio -> testo (come nell'elenco; l'apostrofo al posto dell'accento e' un artefatto dell'Excel)
CRITERI = {
    "a": "età e/o dimensioni", "b": "forma e portamento", "c": "valore ecologico", "d": "rarità botanica",
    "e": "architettura vegetale", "f": "pregio paesaggistico", "g": "valore storico, culturale, religioso",
}


def gradi(testo):
    """«38° 7' 58,02''» -> 38.13278 (gradi decimali); None se non e' una coordinata."""
    r = re.match(r"\s*(\d+)\D+(\d+)\D+([\d,.]+)", str(testo))
    if not r:
        return None
    g, m, s = int(r.group(1)), int(r.group(2)), float(r.group(3).replace(",", "."))
    return round(g + m / 60 + s / 3600, 6)


def numero(testo):
    """«291» -> 291; «150 (med)\\n160 (max)» -> 160 (il massimo); vuoto -> None. Decimali con la virgola."""
    t = str(testo).replace(",", ".")
    m = re.search(r"([\d.]+)\s*\(max\)", t) or re.search(r"[\d.]+", t)
    if not m:
        return None
    v = float(m.group(1) if m.lastindex else m.group(0))
    return int(v) if v == int(v) else v


def criteri(testo):
    """«a) eta` e/o dimensioni\\nc) valore ecologico» -> ['età e/o dimensioni', 'valore ecologico']."""
    return [CRITERI[l] for l in re.findall(r"(?m)^\s*([a-g])\)", str(testo)) if l in CRITERI]


def _t(v):
    return re.sub(r"\s+", " ", str(v)).strip() if pd.notna(v) else ""


def feature(r):
    """Feature GeoJSON dell'albero, o None se la riga non ha coordinate valide a Palermo."""
    lat, lon = gradi(r["LATITUDINE SU GIS"]), gradi(r["LONGITUDINE SU GIS"])
    if lat is None or lon is None or not (LIMITI[0] <= lon <= LIMITI[2] and LIMITI[1] <= lat <= LIMITI[3]):
        return None
    nome = _t(r["SPECIE NOME VOLGARE"])
    scientifico = _t(r["SPECIE NOME SCIENTIFICO"])
    props = {
        "id": "albero-" + _t(r["ID SCHEDA"]).split("/")[0],
        "scheda": _t(r["ID SCHEDA"]),
        "nome": nome,
        "specie": re.sub(r"^Insieme omogeneo di\s+", "", scientifico),
        "insieme": scientifico.startswith("Insieme omogeneo"),
        "localita": _t(r["LOCALITÀ"]),
        "altitudine": numero(r["ALTITUDINE (m s.l.m.)"]),
        "circonferenza": numero(r["CIRCONFERENZA FUSTO (cm)"]),
        "altezza": numero(r["ALTEZZA (m)"]),
        "criteri": criteri(r["CRITERI DI MONUMENTALITÀ"]),
        "dichiarato": _t(r["PROPOSTA DICHIARAZIONE NOTEVOLE INTERESSE PUBBLICO"]).startswith("si"),
    }
    return {"type": "Feature", "properties": props, "geometry": {"type": "Point", "coordinates": [lon, lat]}}


def costruisci(tabella):
    p = tabella[tabella["COMUNE"].str.strip().str.lower() == "palermo"]
    return [f for f in (feature(r) for _, r in p.iterrows()) if f]


def main():
    feats = costruisci(pd.read_excel(SRC))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(feats), "alberi monumentali di Palermo ->", OUT.relative_to(ROOT))


if __name__ == "__main__":
    sys.exit(main())
