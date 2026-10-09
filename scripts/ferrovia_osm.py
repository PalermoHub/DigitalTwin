"""Tracciato reale delle linee ferroviarie urbane di Palermo da OpenStreetMap (© OpenStreetMap contributors, ODbL).

  python3 scripts/ferrovia_osm.py   scarica da Overpass i binari (railway=rail) nel perimetro di gtfs_trenitalia.BBOX
                                    e li salva in scripts/ferrovia_osm.json (cache versionata: gtfs_trenitalia.py non usa la rete)

Si tengono tutti i binari, ma quelli di servizio (scali, raccordi, binari di sosta) con un costo maggiorato: il percorso li usa solo per
passare da un binario di linea all'altro, dove le comunicazioni non sono mappate. Di ciascun binario si salvano solo peso e coordinate.
`instrada(a, b)` dà il percorso più breve sul binario tra due punti; senza percorso restituisce None e il chiamante
ripiega sul tracciato schematico.
"""
import heapq
import json
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from math import cos, hypot, radians
from pathlib import Path

CACHE = Path(__file__).resolve().parent / "ferrovia_osm.json"
CACHE_COSTRUZIONE = Path(__file__).resolve().parent / "ferrovia_osm_costruzione.json"
FERMATE = Path(__file__).resolve().parents[1] / "dati" / "trasporto" / "ferrovia-fermate.geojson"
APERTURA = Path(__file__).resolve().parents[1] / "dati" / "trasporto" / "ferrovia-apertura.geojson"
# tratto dell'Anello non ancora aperto: stazioni in ordine (id nel feed o `osm-…` da ferrovia_in_apertura.json)
TRATTO_APERTURA = ("f830012138", "fosm-10248861761", "fosm-10248861760", "f830012134")  # Giachery, Porto, Politeama, Notarbartolo
OVERPASS = "https://overpass-api.de/api/interpreter"
BBOX = (38.07, 13.105, 38.25, 13.50)  # sud, ovest, nord, est (ordine Overpass); come gtfs_trenitalia.BBOX
SERVIZIO = {"yard", "siding", "spur"}
PESO_SERVIZIO = 4  # un metro di binario di servizio costa come 4 di binario di linea
SNAP_MAX = 80  # metri: oltre questa distanza una stazione non è sul binario
MARGINE = 25  # metri: si agganciano anche i vertici di altri binari entro questo margine dal più vicino
M_LAT = 111_320.0


def scarica(filtro='["railway"="rail"]', tentativi=4):
    query = f'[out:json][timeout:90];way{filtro}({",".join(map(str, BBOX))});out geom tags;'
    req = urllib.request.Request(OVERPASS, urllib.parse.urlencode({"data": query}).encode(),
                                 headers={"User-Agent": "DigitalTwinPalermo/1.0 (https://github.com/coseerobe/DigitalTwin)"})
    for n in range(tentativi):
        try:
            with urllib.request.urlopen(req, timeout=150) as r:
                return json.load(r)["elements"]
        except Exception as e:  # Overpass risponde spesso con timeout del dispatcher: si riprova
            print(f"tentativo {n + 1}: {e}", file=sys.stderr)
            time.sleep(20)
    raise SystemExit("Overpass non risponde")


def costruzione(elementi):
    """Tracciati [[lon, lat], ...] dell'Anello ferroviario in costruzione (railway=construction, name «Anello ferroviario»)."""
    return [[[round(p["lon"], 6), round(p["lat"], 6)] for p in w["geometry"]]
            for w in elementi if w.get("type") == "way" and w.get("tags", {}).get("name") == "Anello ferroviario"]


def binari(elementi):
    """Elenco di [peso, [[lon, lat], ...]]: un binario per elemento, con peso 1 (linea) o PESO_SERVIZIO (scali, raccordi, sosta)."""
    return [[PESO_SERVIZIO if w["tags"].get("service") in SERVIZIO else 1, [[round(p["lon"], 6), round(p["lat"], 6)] for p in w["geometry"]]]
            for w in elementi
            if w.get("type") == "way" and not w.get("tags", {}).get("disused")]


def _d(a, b):
    """Distanza in metri (piana: basta alla scala urbana)."""
    return hypot((a[0] - b[0]) * cos(radians((a[1] + b[1]) / 2)), a[1] - b[1]) * M_LAT


class Rete:
    def __init__(self, tracciati):
        self.vicini = defaultdict(dict)
        for peso, t in tracciati:
            for a, b in zip(t, t[1:]):
                a, b = tuple(a), tuple(b)
                if a != b:
                    self.vicini[a][b] = self.vicini[b][a] = min(self.vicini[a].get(b, float("inf")), peso * _d(a, b))

    def aggancia(self, p):
        """{vertice: distanza in metri} dei vertici del binario vicini a `p`: il più vicino e quelli entro MARGINE da esso
        (una stazione su doppio binario si aggancia a entrambi). Vuoto se il più vicino è oltre SNAP_MAX."""
        dist = {v: _d(v, p) for v in self.vicini if abs(v[0] - p[0]) < 0.003 and abs(v[1] - p[1]) < 0.003}
        if not dist or min(dist.values()) > SNAP_MAX:
            return {}
        minimo = min(dist.values())
        return {v: d for v, d in dist.items() if d <= minimo + MARGINE}

    def instrada(self, a, b):
        """Coordinate del percorso più breve sul binario tra `a` e `b` (punti [lon, lat]), con `a` e `b` agli estremi; None se manca.
        Parte da tutti i vertici agganciati ad `a` e arriva al primo di quelli agganciati a `b`, contando la distanza di aggancio."""
        partenze, arrivi = self.aggancia(a), self.aggancia(b)
        if not partenze or not arrivi:
            return None
        coda, precedente, costi = [(d, v) for v, d in partenze.items()], {}, dict(partenze)
        heapq.heapify(coda)
        migliore, fine = float("inf"), None
        while coda:
            costo, nodo = heapq.heappop(coda)
            if costo >= migliore:
                break
            if costo > costi[nodo]:
                continue
            if nodo in arrivi and costo + arrivi[nodo] < migliore:
                migliore, fine = costo + arrivi[nodo], nodo
            for v, peso in self.vicini[nodo].items():
                nuovo = costo + peso
                if nuovo < costi.get(v, float("inf")):
                    costi[v], precedente[v] = nuovo, nodo
                    heapq.heappush(coda, (nuovo, v))
        if fine is None:
            return None
        percorso = [fine]
        while percorso[-1] in precedente:
            percorso.append(precedente[percorso[-1]])
        return [list(a)] + [list(v) for v in reversed(percorso)] + [list(b)]


def carica(cache=CACHE):
    return Rete(json.loads(cache.read_text(encoding="utf-8"))) if cache.exists() else None


def tratto_in_apertura(rete, fermate=FERMATE):
    """Linea (GeoJSON LineString) del tratto in apertura: percorso sul binario, comprese le gallerie in costruzione, tra le stazioni in ordine."""
    pos = {f["properties"]["id"]: f["geometry"]["coordinates"] for f in json.loads(fermate.read_text(encoding="utf-8"))["features"]}
    coord = [pos[TRATTO_APERTURA[0]]]
    for da, a in zip(TRATTO_APERTURA, TRATTO_APERTURA[1:]):
        coord += (rete.instrada(pos[da], pos[a]) or [pos[da], pos[a]])[1:]
    return {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "LineString", "coordinates": coord},
                                                       "properties": {"nome": "Anello ferroviario (tratto in apertura)", "stato": "in apertura"}}]}


def main():
    tracciati = binari(scarica())
    CACHE.write_text(json.dumps(tracciati, separators=(",", ":")), encoding="utf-8")
    print(f"{len(tracciati)} binari, {sum(map(len, tracciati))} vertici -> {CACHE.name} ({CACHE.stat().st_size // 1024} KB)")
    cantiere = costruzione(scarica('["railway"="construction"]'))
    CACHE_COSTRUZIONE.write_text(json.dumps(cantiere, separators=(",", ":")), encoding="utf-8")
    rete = Rete(tracciati + [[1, t] for t in cantiere])
    APERTURA.write_text(json.dumps(tratto_in_apertura(rete), separators=(",", ":")), encoding="utf-8")
    print(f"{len(cantiere)} tratti in costruzione -> {CACHE_COSTRUZIONE.name}, {APERTURA.name}")


if __name__ == "__main__":
    main()
