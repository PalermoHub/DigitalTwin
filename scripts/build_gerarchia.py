"""Genera js/core/gerarchia.js: gerarchia circoscrizione > quartiere > UPL con il riquadro di ciascuna zona.

Si legge dal PMTiles dei confini (livello UPL, che porta tutti e tre i nomi), cosi' l'elenco dei filtri
coincide con i confini disegnati in mappa.
Uso: python3 scripts/build_gerarchia.py percorso/confini_amministrativi.pmtiles
Richiede: pip install pmtiles mapbox-vector-tile
"""
import gzip
import json
import math
import sys
from pathlib import Path

import mapbox_vector_tile as mvt
from pmtiles.reader import MmapSource, Reader

Z = 12
LIVELLI = (("circoscrizioni", "circ", 1), ("quartieri", "quart", 2), ("upl", "upl", 3))
CAMPI = ("Circoscrizione", "Quartiere", "UPL")
EXT = 4096


def tessera(lon, lat):
    n = 2 ** Z
    return int((lon + 180) / 360 * n), int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)


def lonlat(x, y, px, py):
    n = 2 ** Z
    return (x + px / EXT) / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + py / EXT) / n))))


def main(sorgente):
    x0, y1 = tessera(13.15, 37.95)
    x1, y0 = tessera(13.55, 38.35)
    zone = {chiave: {} for _, chiave, _ in LIVELLI}
    with open(sorgente, "rb") as f:
        lettore = Reader(MmapSource(f))
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                dati = lettore.get(Z, x, y)
                if not dati:
                    continue
                if dati[:2] == b"\x1f\x8b":
                    dati = gzip.decompress(dati)
                tile = mvt.decode(dati, y_coord_down=True)
                for livello, chiave, n in LIVELLI:
                    for ft in tile.get(livello, {}).get("features", []):
                        nome = "|".join(str(ft["properties"][c]) for c in CAMPI[:n])
                        g = ft["geometry"]
                        poligoni = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
                        bb = zone[chiave].setdefault(nome, [1e9, 1e9, -1e9, -1e9])
                        for poligono in poligoni:
                            for anello in poligono:
                                for px, py in anello:
                                    lon, lat = lonlat(x, y, px, py)
                                    bb[:] = [min(bb[0], lon), min(bb[1], lat), max(bb[2], lon), max(bb[3], lat)]
    for chiave in zone:
        zone[chiave] = {k: [round(v, 5) for v in bb] for k, bb in sorted(zone[chiave].items())}
    out = Path(__file__).resolve().parents[1] / "js/core/gerarchia.js"
    out.write_text(
        "// Generato da scripts/build_gerarchia.py: non modificare a mano.\n"
        "// Chiavi «Circoscrizione|Quartiere|UPL» -> riquadro [ovest, sud, est, nord].\n"
        "export const GERARCHIA = {\n"
        + ",\n".join(
            f" {k}: {{\n"
            + ",\n".join(f"  {json.dumps(n, ensure_ascii=False)}: {json.dumps(bb)}" for n, bb in v.items())
            + "\n }"
            for k, v in zone.items()
        )
        + "\n};\n",
        encoding="utf-8",
    )
    print({k: len(v) for k, v in zone.items()})


if __name__ == "__main__":
    main(sys.argv[1])
