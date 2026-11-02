"""Luoghi quotidiani di Palermo da OpenStreetMap → dati/camminabilita/luoghi_osm.json.

Per i bisogni di Walkably che non hanno un layer nostro: alimentari (0), cibo e bevande (1), negozi (2), salute (3), parchi (5).
Le categorie ricalcano il README della release Walkably («What each need counts»), che a sua volta si basa su OpenStreetMap:
la stessa definizione rende il confronto con i conteggi di Walkably sensato. Un punto per luogo (il centro, se è un poligono),
tenuto solo se cade nel confine comunale. Licenza ODbL 1.0, © OpenStreetMap contributors.
Estrazione manuale (non c'è un cron): gli stessi dati cambiano piano. Overpass è spesso pieno, quindi prova più server.
Uso: python3 scripts/luoghi_osm.py [--cache cartella]   (con --cache salva e riusa le risposte Overpass grezze, una per bisogno)
Se un bisogno ha meno luoghi della sua soglia non scrive nulla.
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
USCITA = RADICE / "dati" / "camminabilita" / "luoghi_osm.json"
BBOX = "38.049,13.241,38.226,13.453"
SERVER = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter",
          "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]

ALIMENTARI = "supermarket|convenience|greengrocer|bakery|pastry|butcher|deli|seafood|cheese|dairy|frozen_food|health_food|farm"
# k → (nome, [filtri Overpass], soglia minima di luoghi nel comune)
BISOGNI = {
    0: ("Alimentari", [f'nwr["shop"~"^({ALIMENTARI})$"]', 'nwr["amenity"="marketplace"]'], 150),
    1: ("Cibo e bevande", ['nwr["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"]'], 300),
    2: ("Negozi", [f'nwr["shop"]["shop"!~"^({ALIMENTARI}|vacant|yes|no|optician|hearing_aids|medical_supply)$"]', 'nwr["amenity"~"^(bank|post_office)$"]'], 300),
    3: ("Salute", ['nwr["amenity"~"^(pharmacy|doctors|clinic|hospital|dentist)$"]', 'nwr["healthcare"]',
                   'nwr["shop"~"^(optician|hearing_aids)$"]'], 100),
    5: ("Parchi", ['nwr["leisure"~"^(park|garden|playground)$"]'], 80),  # le riserve naturali e i giardini privati non contano per Walkably
}
PRIVATO = ("private", "no", "customers", "permit")


def query(k):
    corpi = "".join(f"{f}({BBOX});" for f in BISOGNI[k][1])
    return f"[out:json][timeout:90];({corpi});out center tags;"


def scarica(k, cache):
    f = cache / f"bisogno{k}.json" if cache else None
    if f and f.exists():
        return json.loads(f.read_text())
    corpo = urllib.parse.urlencode({"data": query(k)}).encode()
    for url in SERVER:
        try:
            req = urllib.request.Request(url, corpo, {"User-Agent": "PalermoDigitalTwin/1.0 (gbvitrano@gmail.com)"})
            with urllib.request.urlopen(req, timeout=120) as r:
                dati = json.load(r)
            if f:
                f.write_text(json.dumps(dati))
            return dati
        except Exception as e:  # server pieno o lento: si passa al prossimo
            print(f"bisogno {k}, {url}: {e}", file=sys.stderr)
    sys.exit(f"nessun server Overpass ha risposto per il bisogno {k}")


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


def tipo_osm(tag):
    """Il valore del tag che ha fatto entrare il luogo: è il «tipo» che Walkably chiama kd (supermarket, pharmacy…)."""
    for chiave in ("shop", "amenity", "healthcare", "leisure"):
        if tag.get(chiave) and tag[chiave] != "yes":
            return tag[chiave]
    return next(iter(tag.values()), "")


def luoghi(dati, anelli):
    visti, out = set(), []
    for e in dati.get("elements", []):
        c = (e["lon"], e["lat"]) if e["type"] == "node" else ((e.get("center") or {}).get("lon"), (e.get("center") or {}).get("lat"))
        if None in c or not any(dentro(c[0], c[1], an) for an in anelli):
            continue
        tag = e.get("tags", {})
        if tag.get("access") in PRIVATO or "veterinary" in (tag.get("amenity"), tag.get("healthcare")):
            continue  # i veterinari non contano come salute per Walkably
        chiave = (e["type"], e["id"])
        if chiave in visti:
            continue
        visti.add(chiave)
        out.append([round(c[0], 6), round(c[1], 6), tag.get("name", ""), tipo_osm(tag)])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", help="cartella dove salvare e riusare le risposte Overpass grezze")
    a = ap.parse_args()
    cache = Path(a.cache) if a.cache else None
    if cache:
        cache.mkdir(parents=True, exist_ok=True)
    anelli = anelli_confine()
    risultato = {}
    for k, (nome, _, minimo) in BISOGNI.items():
        punti = luoghi(scarica(k, cache), anelli)
        if len(punti) < minimo:
            sys.exit(f"{nome}: solo {len(punti)} luoghi (minimo {minimo}): non scrivo nulla")
        risultato[str(k)] = punti
        print(f"{k} {nome}: {len(punti)} luoghi ({sum(1 for p in punti if p[2])} con nome)")
    USCITA.write_text(json.dumps({"fonte": "© OpenStreetMap contributors, ODbL 1.0", "data": date.today().isoformat(),
                                  "campi": ["lon", "lat", "nome", "tipo"], "bisogni": risultato}, ensure_ascii=False, separators=(",", ":")))
    print(f"scritto {USCITA} ({USCITA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
