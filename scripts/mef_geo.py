"""Geometria e PMTiles per gli script MEF: tile MVT, metri locali, aggancio punto-edificio."""
import gzip
import math
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

SOGLIA_M = 15.0


def a_lonlat(x: int, y: int, z: int, px: float, py: float, estensione: int) -> tuple[float, float]:
    """Punto (px, py) di un tile MVT (y verso il basso) -> (lon, lat) WGS84."""
    n = 2 ** z
    lon = (x + px / estensione) / n * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + py / estensione) / n))))
    return lon, lat


def _converti(coordinate, f):
    if coordinate and isinstance(coordinate[0], (int, float)):
        return list(f(coordinate[0], coordinate[1]))
    return [_converti(c, f) for c in coordinate]


def frammenti_tile(dati: bytes, z: int, x: int, y: int, filtro=None) -> list:
    """(id, geometria WGS84, proprietà) di ogni poligono del tile (`dati` già decompresso).
    `filtro(proprietà) -> bool` salta in anticipo le feature che non servono (risparmia memoria)."""
    import mapbox_vector_tile as mvt
    out = []
    for strato in mvt.decode(dati, default_options={"y_coord_down": True}).values():
        estensione = strato.get("extent", 4096)
        for ft in strato["features"]:
            g = dict(ft["geometry"])
            if g["type"] not in ("Polygon", "MultiPolygon"):
                continue
            proprieta = ft.get("properties", {})
            if filtro is not None and not filtro(proprieta):
                continue
            g["coordinates"] = _converti(g["coordinates"], lambda px, py: a_lonlat(x, y, z, px, py, estensione))
            out.append((ft.get("id"), shape(g), proprieta))
    return out


def ricomponi(frammenti) -> dict:
    """Un edificio spezzato sui bordi dei tile torna un solo poligono: {id: (geometria, proprietà)}."""
    per_id = {}
    for i, g, p in frammenti:
        if i is None:
            continue
        per_id.setdefault(i, ([], p))[0].append(shapely.make_valid(g))
    return {i: (unary_union(gs), p) for i, (gs, p) in per_id.items()}


def tile_xy(lon: float, lat: float, z: int) -> tuple[int, int]:
    n = 2 ** z
    return int((lon + 180) / 360 * n), int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)


def frammenti_pmtiles(percorso: Path, z: int, filtro=None) -> list:
    """Tutti i poligoni dello zoom `z` di un PMTiles, come frammenti (id, geometria WGS84, proprietà)."""
    from pmtiles.reader import MmapSource, Reader
    frammenti = []
    with open(percorso, "rb") as f:
        lettore = Reader(MmapSource(f))
        h = lettore.header()
        x0, y1 = tile_xy(h["min_lon_e7"] / 1e7, h["min_lat_e7"] / 1e7, z)
        x1, y0 = tile_xy(h["max_lon_e7"] / 1e7, h["max_lat_e7"] / 1e7, z)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                d = lettore.get(z, x, y)
                if not d:
                    continue
                if d[:2] == b"\x1f\x8b":
                    d = gzip.decompress(d)
                frammenti += frammenti_tile(d, z, x, y, filtro)
    return frammenti


# Metri locali attorno a Palermo (proiezione equirettangolare): a 20 km dal centro l'errore sta sotto lo 0,5%,
# più che sufficiente per una tolleranza di 15 m e senza dipendere da pyproj.
LAT0, LON0 = 38.12, 13.33
M_LAT = 111200.0
M_LON = 111320.0 * math.cos(math.radians(LAT0))


def punto_m(lon: float, lat: float) -> Point:
    return Point((lon - LON0) * M_LON, (lat - LAT0) * M_LAT)


def in_metri(geom):
    return shapely.transform(geom, lambda c: np.column_stack(((c[:, 0] - LON0) * M_LON, (c[:, 1] - LAT0) * M_LAT)))


def motivo_punto(b: dict) -> str | None:
    """None se il bene può agganciarsi a un edificio; altrimenti perché resta un punto."""
    if b["natura"] == "Terreno":
        return "terreno"
    if b["precisione"] in ("strada", "comune"):
        return b["precisione"]
    return None


def aggancia_uno(b: dict, ids: list, geoms: list, albero) -> tuple:
    """(id edificio, None) oppure (None, motivo) per un bene, con un albero spaziale già costruito."""
    motivo = motivo_punto(b)
    if motivo:
        return None, motivo
    if albero is None:
        return None, "senza-edificio"
    p = punto_m(b["lon"], b["lat"])
    dentro = albero.query(p, predicate="intersects")
    if len(dentro):
        k = min(dentro, key=lambda j: geoms[j].area)  # il più specifico
        return ids[int(k)], None
    k = albero.nearest(p)
    if k is not None and geoms[int(k)].distance(p) <= SOGLIA_M:
        return ids[int(k)], None
    return None, "senza-edificio"


def aggancia(beni, edifici_m: dict) -> dict:
    """{id bene: (id edificio, None)} oppure {id bene: (None, motivo)}. `edifici_m`: {id: geometria in metri}."""
    ids = list(edifici_m)
    geoms = [edifici_m[i] for i in ids]
    albero = STRtree(geoms) if geoms else None
    return {b["id"]: aggancia_uno(b, ids, geoms, albero) for b in beni}
