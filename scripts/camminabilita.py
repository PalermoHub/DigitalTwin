"""Camminabilità di Palermo (Walkably) → dati/camminabilita/.

Fonte: Walkably, https://walkably.org (Raian Pollock), release `europe.pmtiles` — dati ODbL 1.0 su base OpenStreetMap.
Non fa scraping: ritaglia l'area del comune dal file ufficiale con `pmtiles extract` (richieste a intervalli, pochi MB),
legge le celle a zoom 14 (esagoni di ~95 m con punteggio 0–100), tiene quelle dentro il confine comunale e riscrive un
PMTiles locale con il solo strato `celle` (nessun tratto di strada).
Scrive:
  celle.geojson           celle in WGS84 con punteggio, Reach, qualità stradale, minuti a piedi per bisogno
  camminabilita.json      conteggi per classe di punteggio, versione e data della release, usati da legenda e scheda
  strade.geojson          tratti di strada con qualità (0–100), tipo, rumore, ombra, pendenza, alberi
  camminabilita.pmtiles   strati `celle` (zoom 12–16) e `strade` (zoom 15–16) (richiede tippecanoe e pmtiles)
  edifici_fid.json        {classe: [fid]}: gli edifici (id del tile edificato) per classe della cella sotto il centroide,
                          per colorarli nel viewer (2D e volumi 3D); solo con --edifici, parte da celle.geojson e edificato.gpkg
Uso: python3 scripts/camminabilita.py [--release 2026-10-31 --versione 2026.10-m5] [--sorgente file.pmtiles] [--senza-pmtiles]
     python3 scripts/camminabilita.py --edifici      (rigenera solo edifici_fid.json dalle celle già scritte)
Se i dati sono rotti (troppo poche celle, fuori dal comune) non tocca nessun file.
"""
import argparse
import gzip
import json
import math
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
OUT = RADICE / "dati" / "camminabilita"
CONFINE = RADICE / "dati" / "monumenti" / "confine_comunale.geojson"
URL_RELEASE = "https://data.walkably.org/download/{release}/europe.pmtiles"
ZOOM_TILE = 14
ZOOM_MIN, ZOOM_MAX = 12, 16
MIN_CELLE = 8000      # il comune ne ha circa 17.000: sotto questa soglia qualcosa non va
MIN_DENTRO = 0.9      # almeno il 90% delle celle tenute deve cadere nel comune (controllo di coerenza)
# campi tenuti: punteggio, Reach, qualità, percentile, punteggi, minuti e luoghi entro 5/10 minuti per bisogno, luogo più vicino, parco e area giochi
CAMPI = ["s", "r", "q", "p", "pg", "pc", "isl_m"] + [f"{k}{i}" for i in range(8) for k in ("r", "m", "n", "kd", "v")]
# classi di punteggio per la legenda (estremi inclusi); le etichette stanno nel layer
SOGLIE = [0, 20, 40, 60, 80]
# classi delle strade, come nella legenda di Walkably (sul valore `q` di qualità della strada): sotto 45 trafficata, 45–74 mista, 75 e oltre tranquilla
SOGLIE_STRADA = [0, 45, 75]
CAMPI_STRADA = ["q", "hw", "name", "nz", "sh", "bz", "sl", "tr"]
MIN_STRADE = 8000     # nel comune ce ne sono circa 20.000


def classe_punteggio(s):
    return max(i for i, soglia in enumerate(SOGLIE) if s >= soglia)


def classe_strada(q):
    return max(i for i, soglia in enumerate(SOGLIE_STRADA) if q >= soglia)


def a_lonlat(px, py, x, y, z, extent):
    n = 2 ** z
    lon = (x + px / extent) / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + py / extent) / n))))
    return round(lon, 6), round(lat, 6)


def tile_xy(lon, lat, z):
    n = 2 ** z
    return int((lon + 180) / 360 * n), int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)


def leggi_celle(pm, bounds):
    """Celle zoom 14 del file, in WGS84, una per coppia (q, r): i tile di confine le spezzano e si riuniscono."""
    import mapbox_vector_tile as mvt
    from shapely.geometry import LineString, Polygon
    from shapely.ops import unary_union

    x0, y0 = tile_xy(bounds[0], bounds[3], ZOOM_TILE)
    x1, y1 = tile_xy(bounds[2], bounds[1], ZOOM_TILE)
    pezzi, props = defaultdict(list), {}
    strade, viste = [], set()
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            r = subprocess.run(["pmtiles", "tile", str(pm), str(ZOOM_TILE), str(x), str(y)], capture_output=True)
            if r.returncode or r.stdout[:2] != b"\x1f\x8b":
                continue  # tile vuoto (mare, campagna senza strade)
            tile = mvt.decode(gzip.decompress(r.stdout), default_options={"y_coord_down": True})
            for f in (tile.get("street") or {"features": []})["features"]:
                ext_s = tile["street"].get("extent", 4096)
                g = f["geometry"]
                linee = [g["coordinates"]] if g["type"] == "LineString" else g["coordinates"] if g["type"] == "MultiLineString" else []
                for linea in linee:
                    pts = [a_lonlat(px, py, x, y, ZOOM_TILE, ext_s) for px, py in linea]
                    # i tile si sovrappongono ai bordi: lo stesso tratto compare due volte
                    chiave_s = (tuple(pts), f["properties"].get("q"))
                    if len(pts) < 2 or chiave_s in viste:
                        continue
                    viste.add(chiave_s)
                    strade.append((LineString(pts), f["properties"]))
            strato = tile.get("hex")
            if not strato:
                continue
            ext = strato.get("extent", 4096)
            for f in strato["features"]:
                if f["geometry"]["type"] != "Polygon":
                    continue
                anelli = [[a_lonlat(px, py, x, y, ZOOM_TILE, ext) for px, py in anello] for anello in f["geometry"]["coordinates"]]
                # `q` e `r` sono qualità stradale e Reach, non coordinate: la cella non ha un id. I frammenti di una
                # stessa cella hanno gli stessi attributi: si raggruppano per attributi e si uniscono solo quelli che si toccano.
                chiave = tuple(sorted((k, v) for k, v in f["properties"].items()))
                pezzi[chiave].append(Polygon(anelli[0], anelli[1:]))
                props.setdefault(chiave, f["properties"])
    celle = []
    for chiave, lista in pezzi.items():
        g = unary_union([p.buffer(1e-7) for p in lista]) if len(lista) > 1 else lista[0]
        for parte in (g.geoms if g.geom_type == "MultiPolygon" else [g]):
            celle.append((parte, props[chiave]))
    return celle, strade


def fid_per_classe(celle, edifici):
    """{classe: [fid]}: celle = [(poligono, classe)], edifici = [(poligono, fid)]. Vale la cella che contiene il centroide
    dell'edificio (a cavallo di due celle vince la prima); gli edifici fuori dalla griglia non compaiono."""
    from shapely import STRtree

    albero = STRtree([g for g, _ in celle])
    per_classe = defaultdict(list)
    for geom, fid in edifici:
        trovate = albero.query(geom.centroid, predicate="within")
        if len(trovate):
            per_classe[celle[int(min(trovate))][1]].append(int(fid))
    return {str(k): sorted(per_classe.get(k, [])) for k in range(len(SOGLIE))}


def edifici():
    import pyogrio
    from shapely.geometry import shape

    celle = [(shape(f["geometry"]), f["properties"]["classe"])
             for f in json.loads((OUT / "celle.geojson").read_text(encoding="utf-8"))["features"]]
    bbox = (min(g.bounds[0] for g, _ in celle), min(g.bounds[1] for g, _ in celle),
            max(g.bounds[2] for g, _ in celle), max(g.bounds[3] for g, _ in celle))
    df = pyogrio.read_dataframe(RADICE / "dati" / "edifici" / "edificato.gpkg", bbox=bbox, columns=[], fid_as_index=True)
    risultato = fid_per_classe(celle, list(zip(df.geometry, df.index)))
    (OUT / "edifici_fid.json").write_text(json.dumps(risultato, separators=(",", ":")), encoding="utf-8")
    print("edifici_fid.json:", {k: len(v) for k, v in risultato.items()}, "su", len(df), "edifici")


def main():
    from shapely.geometry import mapping, shape
    from shapely.prepared import prep

    ap = argparse.ArgumentParser()
    ap.add_argument("--release", default="2026-10-31", help="cartella della release su data.walkably.org")
    ap.add_argument("--versione", default="2026.10-m5", help="nome della release Walkably (citata in scheda e fonti)")
    ap.add_argument("--sorgente", help="PMTiles già ritagliato o file Walkably locale (salta il download)")
    ap.add_argument("--senza-pmtiles", action="store_true")
    ap.add_argument("--edifici", action="store_true", help="scrive solo edifici_fid.json dalle celle già prodotte")
    a = ap.parse_args()
    if a.edifici:
        return edifici()

    comune = shape(json.loads(CONFINE.read_text(encoding="utf-8"))["features"][0]["geometry"])
    comune_p = prep(comune)
    minx, miny, maxx, maxy = comune.bounds
    bounds = (minx - 0.01, miny - 0.01, maxx + 0.01, maxy + 0.01)

    with tempfile.TemporaryDirectory() as tmp:
        pm = Path(a.sorgente) if a.sorgente else Path(tmp) / "palermo.pmtiles"
        if not a.sorgente:
            box = ",".join(str(round(v, 4)) for v in bounds)
            subprocess.run(["pmtiles", "extract", URL_RELEASE.format(release=a.release), str(pm), f"--bbox={box}"], check=True)
        celle, strade = leggi_celle(pm, bounds)

    tenute = [(g, p) for g, p in celle if comune_p.contains(g.representative_point())]
    if len(tenute) < MIN_CELLE or len(tenute) / max(len(celle), 1) < 0.3:
        sys.exit(f"Solo {len(tenute)} celle nel comune su {len(celle)} (soglia {MIN_CELLE}): non scrivo nulla.")

    strade_nel_comune = [(g, p) for g, p in strade if comune_p.contains(g.interpolate(0.5, normalized=True))]
    if len(strade_nel_comune) < MIN_STRADE:
        sys.exit(f"Solo {len(strade_nel_comune)} tratti di strada nel comune (soglia {MIN_STRADE}): non scrivo nulla.")
    feats_strade, per_strada = [], Counter()
    for g, p in strade_nel_comune:
        prop = {k: p[k] for k in CAMPI_STRADA if k in p}
        prop["cl"] = classe_strada(float(prop.get("q", 0)))
        per_strada[prop["cl"]] += 1
        feats_strade.append({"type": "Feature", "properties": prop, "tippecanoe": {"minzoom": 15},
                             "geometry": {"type": "LineString", "coordinates": [list(c) for c in g.coords]}})

    feats, per_classe = [], Counter()
    for g, p in tenute:
        prop = {k: p[k] for k in CAMPI if k in p}
        prop["s"] = round(float(p["s"]), 1)
        prop["classe"] = classe_punteggio(prop["s"])
        per_classe[prop["classe"]] += 1
        feats.append({"type": "Feature", "properties": prop, "geometry": mapping(g)})
    feats.sort(key=lambda f: (f["properties"]["q"] if "q" in f["properties"] else 0, f["properties"]["s"]))

    punteggi = sorted(f["properties"]["s"] for f in feats)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "fonte": "Walkably, https://walkably.org (Raian Pollock), ODbL 1.0, su dati © OpenStreetMap contributors",
        "release": a.release, "versione": a.versione,
        "celle": len(feats), "per_classe": {str(i): per_classe.get(i, 0) for i in range(len(SOGLIE))},
        "mediana": punteggi[len(punteggi) // 2], "massimo": punteggi[-1],
        "strade": len(feats_strade), "per_strada": {str(i): per_strada.get(i, 0) for i in range(len(SOGLIE_STRADA))},
    }
    (OUT / "celle.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "strade.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats_strade}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "camminabilita.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"celle.geojson: {len(feats)} celle nel comune (su {len(celle)} lette), classi {dict(per_classe)}")
    if a.senza_pmtiles:
        return
    cmd = ["tippecanoe", "-o", str(OUT / "camminabilita.pmtiles"), "-q", "-f", f"-Z{ZOOM_MIN}", f"-z{ZOOM_MAX}",
           "--no-feature-limit", "--no-tile-size-limit", "--no-simplification-of-shared-nodes", "--no-tiny-polygon-reduction",
           "-L", f"celle:{OUT / 'celle.geojson'}", "-L", f"strade:{OUT / 'strade.geojson'}"]
    subprocess.run(cmd, check=True)
    print(f"camminabilita.pmtiles: zoom {ZOOM_MIN}-{ZOOM_MAX}, {(OUT / 'camminabilita.pmtiles').stat().st_size} byte")


if __name__ == "__main__":
    main()
