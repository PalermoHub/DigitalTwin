"""Parchi e giardini di Palermo da OpenStreetMap → dati/camminabilita/parchi_osm.geojson.

Per il bisogno «Parchi» della scheda Camminabilità: Walkably su OpenStreetMap, quindi i parchi si prendono da OpenStreetMap
(leisure = park, garden, nature_reserve; landuse = recreation_ground). Un punto per ogni parco (il centro del poligono),
tenuto solo se cade nel confine comunale. Licenza ODbL 1.0, © OpenStreetMap contributors.
Uso: python3 scripts/parchi_osm.py [--da-file risposta_overpass.json]
Prova più server Overpass (spesso sono pieni). Se la risposta ha meno di MIN_PARCHI parchi non scrive nulla.
"""
import argparse
import json
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
CONFINE = RADICE / "dati" / "monumenti" / "confine_comunale.geojson"
USCITA = RADICE / "dati" / "camminabilita" / "parchi_osm.geojson"
BBOX = "38.049,13.241,38.226,13.453"
QUERY = (f'[out:json][timeout:60];(nwr["leisure"~"^(park|garden|nature_reserve)$"]({BBOX});'
         f'nwr["landuse"="recreation_ground"]({BBOX}););out center tags;')
SERVER = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter",
          "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
MIN_PARCHI = 100  # il comune ne ha alcune centinaia: sotto questa soglia qualcosa non va
TIPI = {"park": "Parco", "garden": "Giardino", "nature_reserve": "Riserva naturale", "recreation_ground": "Area ricreativa"}


def scarica():
    corpo = urllib.parse.urlencode({"data": QUERY}).encode()
    for url in SERVER:
        try:
            req = urllib.request.Request(url, corpo, {"User-Agent": "PalermoDigitalTwin/1.0 (gbvitrano@gmail.com)"})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception as e:  # server pieno o lento: si passa al prossimo
            print(f"{url}: {e}", file=sys.stderr)
    sys.exit("nessun server Overpass ha risposto")


def anelli_confine():
    d = json.loads(CONFINE.read_text())
    g = d["features"][0]["geometry"] if "features" in d else d
    poligoni = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    return [p[0] for p in poligoni]


def dentro(x, y, anello):
    c = False
    for (x1, y1), (x2, y2) in zip(anello, anello[1:] + anello[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--da-file", help="risposta Overpass già scaricata")
    a = ap.parse_args()
    dati = json.loads(Path(a.da_file).read_text()) if a.da_file else scarica()
    anelli = anelli_confine()
    visti, feature = set(), []
    for e in dati.get("elements", []):
        c = (e["lon"], e["lat"]) if e["type"] == "node" else ((e.get("center") or {}).get("lon"), (e.get("center") or {}).get("lat"))
        if None in c or not any(dentro(c[0], c[1], an) for an in anelli):
            continue
        tag = e.get("tags", {})
        if tag.get("access") in ("private", "no"):
            continue
        chiave = (tag.get("name"), round(c[0], 3), round(c[1], 3))  # lo stesso parco può essere due elementi
        if chiave in visti:
            continue
        visti.add(chiave)
        tipo = TIPI.get(tag.get("leisure") or tag.get("landuse"), "Parco")
        feature.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(c[0], 6), round(c[1], 6)]},
                        "properties": {"id": f"{e['type'][0]}{e['id']}", "nome": tag.get("name", ""), "tipo": tipo}})
    if len(feature) < MIN_PARCHI:
        sys.exit(f"solo {len(feature)} parchi: non scrivo nulla")
    USCITA.write_text(json.dumps({"type": "FeatureCollection", "fonte": "© OpenStreetMap contributors, ODbL 1.0",
                                  "data": date.today().isoformat(), "features": feature}, ensure_ascii=False, separators=(",", ":")))
    print(f"{len(feature)} parchi in {USCITA} ({sum(1 for f in feature if f['properties']['nome'])} con nome)")


if __name__ == "__main__":
    main()
