"""Caricamento delle fonti di confronto per i beni MEF: particelle, immobili comunali, layer del repository."""
import json
from pathlib import Path

import shapely
from shapely.geometry import shape
from shapely.ops import unary_union

from mef_catasto import chiave, particelle_da_identificativo
from mef_geo import frammenti_pmtiles


def chiavi_richieste(beni) -> set:
    """Tutte le (foglio, particella) citate dai beni."""
    return {k for b in beni for k in particelle_da_identificativo(b.get("catastale", ""), b["natura"])}


def carica_particelle(percorso: Path, chiavi: set, zoom: int = 17) -> dict:
    """{(foglio, particella): geometria WGS84 (unione dei frammenti)}, solo per le chiavi richieste."""
    def voluta(p):
        return chiave(p.get("Foglio"), p.get("Paricella")) in chiavi   # «Paricella» è scritto così nel dato

    per_chiave = {}
    for _, g, p in frammenti_pmtiles(percorso, zoom, voluta):
        per_chiave.setdefault(chiave(p.get("Foglio"), p.get("Paricella")), []).append(shapely.make_valid(g))
    return {k: unary_union(v) for k, v in per_chiave.items()}


def controlla_particelle(trovate: dict, richieste: set) -> None:
    """Un file incompleto o sbagliato non deve produrre un layer senza catasto: almeno metà delle chiavi deve esistere."""
    if len(richieste) >= 100 and len(trovate) < len(richieste) / 2:
        raise SystemExit(f"particelle catastali: trovate solo {len(trovate)} chiavi su {len(richieste)} richieste: file incompleto?")


def carica_immobili(percorso: Path, zoom: int = 16) -> list:
    """Immobili comunali (particelle): [{id, geom WGS84, chiave (foglio, plla) | None, indirizzo, categoria}]."""
    per_fid = {}
    for _, g, p in frammenti_pmtiles(percorso, zoom):
        per_fid.setdefault(p.get("fid"), ([], p))[0].append(shapely.make_valid(g))
    out = []
    for fid, (gs, p) in per_fid.items():
        civico = str(p.get("NUMERO_CIVICO") or "").strip()
        indirizzo = " ".join(x for x in (str(p.get("INDIRIZZO") or "").strip(), civico) if x)
        out.append({"id": fid, "geom": unary_union(gs), "chiave": chiave(p.get("FOGLIO"), p.get("PLLA")),
                    "indirizzo": indirizzo, "categoria": p.get("CATEGORIA")})
    return out


def _features(percorso: Path) -> list:
    return json.loads(percorso.read_text(encoding="utf-8"))["features"]


def carica_riferimenti(radice: Path) -> list:
    """Scuole, seggi, uffici e monumenti già mappati (dati/ del repository):
    [{fonte, id, lon, lat, indirizzo, poligono (WGS84 o None)}]."""
    out = []
    for fonte, punti, poligoni in (("scuole", "scuole/scuole.geojson", "scuole/scuole_edifici.geojson"),
                                   ("seggi", "scuole/seggi.geojson", "scuole/seggi_edifici.geojson")):
        poli = {f["properties"]["id"]: shape(f["geometry"]) for f in _features(radice / poligoni)}
        for f in _features(radice / punti):
            lon, lat = f["geometry"]["coordinates"][:2]
            out.append({"fonte": fonte, "id": f["properties"]["id"], "lon": lon, "lat": lat,
                        "indirizzo": f["properties"].get("indirizzo", "") or "", "poligono": poli.get(f["properties"]["id"])})
    for fonte, percorso in (("uffici", "uffici/sedi.geojson"), ("monumenti", "monumenti/monumenti.geojson")):
        for f in _features(radice / percorso):
            lon, lat = f["geometry"]["coordinates"][:2]
            out.append({"fonte": fonte, "id": f["properties"]["id"], "lon": lon, "lat": lat,
                        "indirizzo": f["properties"].get("indirizzo", "") or "", "poligono": None})
    return out
