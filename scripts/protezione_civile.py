"""Piano di emergenza della Protezione civile (Comune di Palermo) → dati/protezione-civile/.

Fonte: https://opendata.comune.palermo.it/opendata-dataset.php?dataset=351 (GeoJSON `pc_palermo.geojson`, 478 poligoni).
A ogni area aggiunge circoscrizione, quartiere e UPL (join spaziale col punto interno dell'area sulle sezioni di
lavoro/isole-calore/sezioni_lst_years.geojson, che portano i tre nomi) e la superficie in m².
Scrive:
  aree.geojson              aree in WGS84 (senza quota), con classe, circoscrizione, quartiere, upl
  protezione-civile.json    conteggi per classe e per circoscrizione, usati da legenda e scheda
  protezione-civile.pmtiles strato `aree`, zoom 11–17 (richiede tippecanoe)
Uso: python3 scripts/protezione_civile.py [--sorgente lavoro/ppc/pc_palermo.geojson] [--senza-pmtiles]
"""
import argparse
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
OUT = RADICE / "dati" / "protezione-civile"
SEZIONI = RADICE / "lavoro" / "isole-calore" / "sezioni_lst_years.geojson"
ZOOM_MIN, ZOOM_MAX = 11, 17
MIN_AREE = 400   # soglia: il file ha 478 aree; sotto questa cifra qualcosa non va
# tipo del file → classe (le prime tre sono le aree del piano; ospedali e rischio industriale restano come contesto)
CLASSE = {"AT": "attesa", "AC": "accoglienza", "AM": "ammassamento", "AM VV.F.": "ammassamento", "H": "ospedale", "RI": "rischio"}
CAMPI_ZONA = ("circoscrizione", "quartiere", "upl")


def arrotonda(c):
    return round(c, 6) if isinstance(c, float) else [arrotonda(x) for x in c]


def senza_quota(c):
    return c[:2] if isinstance(c[0], float) else [senza_quota(x) for x in c]


def main():
    from pyproj import Transformer
    from shapely.geometry import shape
    from shapely.ops import transform
    from shapely.strtree import STRtree

    ap = argparse.ArgumentParser()
    ap.add_argument("--sorgente", default=str(RADICE / "lavoro" / "ppc" / "pc_palermo.geojson"))
    ap.add_argument("--senza-pmtiles", action="store_true")
    a = ap.parse_args()

    aree = json.loads(Path(a.sorgente).read_text(encoding="utf-8"))["features"]
    if len(aree) < MIN_AREE:
        sys.exit(f"Solo {len(aree)} aree (soglia {MIN_AREE}): non scrivo nulla.")
    sez = json.loads(SEZIONI.read_text(encoding="utf-8"))["features"]
    geo_sez = [shape(f["geometry"]) for f in sez]
    albero = STRtree(geo_sez)
    metri = Transformer.from_crs(4326, 32633, always_xy=True).transform

    feats, senza_zona = [], 0
    for i, f in enumerate(aree, 1):
        p = f["properties"]
        g = shape(f["geometry"])
        if not g.is_valid:
            g = g.buffer(0)
        punto = g.representative_point()
        dentro = [k for k in albero.query(punto) if geo_sez[k].contains(punto)]
        k = dentro[0] if dentro else int(albero.nearest(punto))   # area al margine di una sezione: la più vicina
        zona = sez[k]["properties"]
        if not dentro:
            senza_zona += 1
        tipo = (p.get("Tipo") or "").strip()
        if tipo not in CLASSE:
            sys.exit(f"Tipo sconosciuto: {tipo!r}")
        geom = json.loads(json.dumps(f["geometry"]))
        geom["coordinates"] = arrotonda(senza_quota(geom["coordinates"]))
        props = {
            "id": i, "numero": (p.get("Numero") or "").strip() or None, "tipo": tipo, "classe": CLASSE[tipo],
            "descrizione": (p.get("descrizion") or "").strip(), "nota": (p.get("Note") or "").strip() or None,
            "sup_m2": round(transform(metri, g).area),
            "circoscrizione": zona["circoscrizione"], "quartiere": zona["Quartiere"], "upl": zona["UPL_nome"],
        }
        feats.append({"type": "Feature", "properties": {k2: v for k2, v in props.items() if v is not None}, "geometry": geom})

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "aree.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    per_classe = Counter(f["properties"]["classe"] for f in feats)
    per_circ = {}
    for f in feats:
        c = per_circ.setdefault(f["properties"]["circoscrizione"], Counter())
        c[f["properties"]["classe"]] += 1
    manifest = {
        "n": len(feats), "per_classe": dict(per_classe), "per_circoscrizione": {c: dict(v) for c, v in sorted(per_circ.items())},
        "sup_m2": {c: sum(f["properties"]["sup_m2"] for f in feats if f["properties"]["classe"] == c) for c in per_classe},
    }
    (OUT / "protezione-civile.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"aree.geojson: {len(feats)} aree {dict(per_classe)}, {senza_zona} agganciate alla sezione più vicina")
    if a.senza_pmtiles:
        return
    cmd = ["tippecanoe", "-o", str(OUT / "protezione-civile.pmtiles"), "-q", "-f", f"-Z{ZOOM_MIN}", f"-z{ZOOM_MAX}",
           "--no-feature-limit", "--no-tile-size-limit", "--no-simplification-of-shared-nodes", "--no-tiny-polygon-reduction",
           "-L", f"aree:{OUT / 'aree.geojson'}"]
    subprocess.run(cmd, check=True)
    print(f"protezione-civile.pmtiles: zoom {ZOOM_MIN}-{ZOOM_MAX}, {(OUT / 'protezione-civile.pmtiles').stat().st_size} byte")


if __name__ == "__main__":
    main()
