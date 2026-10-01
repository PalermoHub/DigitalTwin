"""GTFS AMAT Palermo -> fermate, linee e orari in dati/trasporto/.

  python3 scripts/gtfs.py   legge dati/gtfs/*.txt e scrive
                            fermate.geojson  punti con nome, linee che passano, accessibilità; membro `validita` del feed
                            linee.geojson    un tracciato per linea e direzione, con le fermate in sequenza
                            orari.json       partenze per fermata, linea, direzione e servizio + date di ogni servizio

Il feed non ha calendar.txt: i servizi sono definiti solo da calendar_dates (exception_type 1 = attivo, 2 = rimosso).
Gli orari restano in minuti dalla mezzanotte del giorno di servizio: oltre 1440 sono corse dopo la mezzanotte.
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "dati" / "gtfs"
OUT = ROOT / "dati" / "trasporto"

ACCESSIBILE = {"1": "Sì", "2": "No"}


def leggi(src, nome):
    with open(src / f"{nome}.txt", encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)


def minuti(ora):
    """«07:15:00» -> 435; le ore possono superare 24 (corse dopo la mezzanotte)."""
    h, m, _ = ora.split(":")
    return int(h) * 60 + int(m)


def data_iso(s):
    return f"{s[:4]}-{s[4:6]}-{s[6:]}"


def nome(testo):
    return re.sub(r"\s+", " ", testo).strip().title().replace("'S", "'s")


def ordine_linea(numero):
    return (not numero.isdigit(), int(numero) if numero.isdigit() else 0, numero)


def servizi(src):
    """service_id -> date ISO ordinate in cui il servizio è attivo."""
    attivi = defaultdict(set)
    for r in leggi(src, "calendar_dates"):
        data = data_iso(r["date"])
        if r["exception_type"] == "1":
            attivi[r["service_id"]].add(data)
        elif r["exception_type"] == "2":
            attivi[r["service_id"]].discard(data)
    return {sid: sorted(date) for sid, date in attivi.items() if date}


def costruisci(src=SRC):
    stops = {r["stop_id"]: r for r in leggi(src, "stops")}
    rotte = {r["route_id"]: r for r in leggi(src, "routes")}
    corse = {r["trip_id"]: r for r in leggi(src, "trips")}
    attivi = servizi(src)
    indice = {sid: i for i, sid in enumerate(sorted(attivi))}
    feed = next(leggi(src, "feed_info"))
    validita = {"da": data_iso(feed["feed_start_date"]), "a": data_iso(feed["feed_end_date"])}

    tracciati = defaultdict(list)
    for r in leggi(src, "shapes"):
        tracciati[r["shape_id"]].append((int(r["shape_pt_sequence"]), round(float(r["shape_pt_lon"]), 6), round(float(r["shape_pt_lat"]), 6)))
    soste = defaultdict(list)
    for r in leggi(src, "stop_times"):
        soste[r["trip_id"]].append((int(r["stop_sequence"]), r["stop_id"], minuti(r["departure_time"])))
    for v in soste.values():
        v.sort()

    # corse utilizzabili: hanno fermate e un servizio con almeno una data
    valide = {tid: c for tid, c in corse.items() if soste.get(tid) and c["service_id"] in indice}

    passano = defaultdict(set)  # fermata -> numeri di linea
    gruppi = defaultdict(list)  # (fermata, linea, direzione, servizio) -> minuti
    per_linea = defaultdict(list)  # (linea, direzione) -> corse con tracciato
    for tid, c in valide.items():
        d = int(c["direction_id"] or 0)
        numero = rotte[c["route_id"]]["route_short_name"]
        for _, stop, _m in soste[tid]:
            passano[stop].add(numero)
        for _, stop, m in soste[tid][:-1]:  # all'ultima fermata la corsa termina: non è una partenza
            gruppi[(stop, c["route_id"], d, indice[c["service_id"]])].append(m)
        if c["shape_id"] in tracciati:
            per_linea[(c["route_id"], d)].append(tid)

    orari_fermate = defaultdict(lambda: defaultdict(list))
    for (stop, route, d, s), tempi in sorted(gruppi.items()):
        orari_fermate[stop][route].append({"d": d, "s": s, "t": sorted(tempi)})

    fermate = {"type": "FeatureCollection", "validita": validita, "features": [
        {"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(float(s["stop_lon"]), 6), round(float(s["stop_lat"]), 6)]},
         "properties": {"id": sid, "nome": nome(s["stop_name"]), "linee": sorted(passano.get(sid, ()), key=ordine_linea),
                        "accessibile": ACCESSIBILE.get(s["wheelchair_boarding"], ""),
                        "lon": round(float(s["stop_lon"]), 6), "lat": round(float(s["stop_lat"]), 6)}}
        for sid, s in stops.items()]}

    elementi = []
    for (route, d), tids in sorted(per_linea.items(), key=lambda kv: (ordine_linea(rotte[kv[0][0]]["route_short_name"]), kv[0][1])):
        shape = Counter(valide[t]["shape_id"] for t in tids).most_common(1)[0][0]  # il tracciato con più corse
        modello = next(t for t in tids if valide[t]["shape_id"] == shape)
        sequenza = [stop for _, stop, _m in soste[modello]]
        coord = [[lon, lat] for _, lon, lat in sorted(tracciati[shape])]
        r = rotte[route]
        a, b = stops[sequenza[0]], stops[sequenza[-1]]
        medio = coord[len(coord) // 2]
        elementi.append({"type": "Feature", "geometry": {"type": "LineString", "coordinates": coord}, "properties": {
            "id": f"linea-{route}-{d}", "route_id": route, "numero": r["route_short_name"], "nome": nome(r["route_long_name"]),
            "colore": f"#{r['route_color']}", "tipo": "tram" if r["route_type"] == "0" else "bus", "direzione": d,
            "da": nome(a["stop_name"]), "a": nome(b["stop_name"]), "fermate": sequenza, "lon": medio[0], "lat": medio[1]}})
    linee = {"type": "FeatureCollection", "features": elementi}

    orari = {"validita": validita, "servizi": {str(i): attivi[sid] for sid, i in indice.items()},
             "fermate": {stop: dict(per_rotta) for stop, per_rotta in orari_fermate.items()}}
    return fermate, linee, orari


def scrivi(risultato, out=OUT):
    out.mkdir(parents=True, exist_ok=True)
    for file, dati in zip(("fermate.geojson", "linee.geojson", "orari.json"), risultato):
        (out / file).write_text(json.dumps(dati, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    fermate, linee, orari = risultato = costruisci()
    scrivi(risultato)
    print(f"{len(fermate['features'])} fermate, {len(linee['features'])} tracciati, {len(orari['fermate'])} fermate con orari")
    return 0


if __name__ == "__main__":
    sys.exit(main())
