"""Distributori di carburante di Palermo -> dati/distributori/distributori.geojson.

  python3 scripts/distributori.py                  scarica da MIMIT anagrafica degli impianti attivi e prezzi comunicati (aggiornati ogni mattina),
                                                   tiene gli impianti del comune di Palermo, unisce i prezzi e scrive il GeoJSON
  python3 scripts/distributori.py --anagrafica F --prezzi G   legge i due CSV da file locali invece che dalla rete

Fonte: MIMIT, Osservaprezzi carburanti (open data, IODL 2.0).
Fallisce (senza toccare il file) se gli impianti sono pochi, cadono fuori dal comune o mancano i prezzi: meglio un dato vecchio che uno sbagliato.
"""
import argparse
import csv
import io
import json
import re
import sys
import time
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "distributori" / "distributori.geojson"
BASE = "https://www.mimit.gov.it/images/exportCSV/"
ANAGRAFICA = BASE + "anagrafica_impianti_attivi.csv"
PREZZI = BASE + "prezzo_alle_8.csv"
FONTE = "MIMIT - Osservaprezzi carburanti, anagrafica degli impianti e prezzi comunicati - IODL 2.0"
COMUNE = "PALERMO"
LIMITI = (13.1, 37.9785, 13.55, 38.2919)  # come js/core/config.js: ovest, sud, est, nord
MINIMO = 100  # a ottobre 2026 sono 218: sotto questa soglia l'anagrafica è sicuramente incompleta
MINIMO_CON_PREZZI = 50  # a ottobre 2026 sono 198: senza prezzi il file dei prezzi è sicuramente rotto
PREZZO_MIN, PREZZO_MAX = 0.3, 5.0  # €/l (o €/kg): fuori da qui è un errore di battitura del gestore

# marchi con un colore proprio sulla mappa; tutti gli altri finiscono in «Altre»
MARCHI = ["Agip Eni", "Api-Ip", "Esso", "Q8", "Pompe Bianche", "EOS", "Tamoil"]
ALTRE = "Altre"
# carburanti principali (filtro e prezzo in scheda); gli altri (Blue Diesel, HVO, ...) restano nell'elenco dei prezzi
CARBURANTI = ["Benzina", "Gasolio", "GPL", "Metano"]


def _righe(testo):
    """Il CSV MIMIT ha una riga di intestazione 'Estrazione del AAAA-MM-GG', poi i campi separati da '|'."""
    righe = list(csv.reader(io.StringIO(testo), delimiter="|", quoting=csv.QUOTE_NONE))
    m = re.search(r"\d{4}-\d{2}-\d{2}", righe[0][0] if righe and righe[0] else "")
    return (m.group(0) if m else ""), righe[1:]


def leggi_anagrafica(testo):
    """-> (data estrazione, impianti di Palermo). Un '|' non protetto nel nome sposta i campi: si legge da destra."""
    data, righe = _righe(testo)
    if not righe or righe[0][:3] != ["idImpianto", "Gestore", "Bandiera"]:
        raise ValueError("Anagrafica: intestazione inattesa")
    impianti = {}
    for r in righe[1:]:
        if len(r) < 10:
            continue
        # id, gestore, bandiera, tipo, nome (anche con '|'), indirizzo, comune, provincia, lat, lon
        id_, gestore, bandiera, tipo = (c.strip() for c in r[:4])
        nome, indirizzo, comune, _prov, lat, lon = "|".join(r[4:-5]).strip(), *(c.strip() for c in r[-5:])
        if comune.upper() != COMUNE:
            continue
        try:
            lat, lon = float(lat), float(lon)
        except ValueError:
            continue  # senza coordinate non si disegna
        ovest, sud, est, nord = LIMITI
        if not (ovest <= lon <= est and sud <= lat <= nord):
            continue  # qualche impianto ha il comune giusto ma le coordinate sbagliate (es. 53773, in realtà ad Alcamo)
        impianti[id_] = {"id": id_, "gestore": gestore, "bandiera": bandiera, "tipo": tipo, "nome": nome,
                         "indirizzo": indirizzo, "lat": lat, "lon": lon}
    return data, impianti


def leggi_prezzi(testo, ids):
    """-> {idImpianto: [[carburante, self (0/1), prezzo, 'GG/MM/AAAA HH:MM:SS'], ...]} solo per gli impianti richiesti."""
    _data, righe = _righe(testo)
    if not righe or righe[0][:3] != ["idImpianto", "descCarburante", "prezzo"]:
        raise ValueError("Prezzi: intestazione inattesa")
    prezzi = {}
    for r in righe[1:]:
        if len(r) < 5 or r[0] not in ids:
            continue
        try:
            prezzo = float(r[2])
        except ValueError:
            continue
        if not PREZZO_MIN <= prezzo <= PREZZO_MAX:
            continue
        prezzi.setdefault(r[0], []).append([r[1].strip(), int(r[3] == "1"), round(prezzo, 3), r[4].strip()])
    for lista in prezzi.values():
        lista.sort(key=lambda p: (p[0] not in CARBURANTI, CARBURANTI.index(p[0]) if p[0] in CARBURANTI else 0, p[0], p[1]))
    return prezzi


def marchio(bandiera):
    return bandiera if bandiera in MARCHI else ALTRE


def _migliore(lista, carburante):
    """Prezzo più basso del carburante (self o servito); None se non lo vende."""
    v = [p[2] for p in lista if p[0] == carburante]
    return min(v) if v else None


def _feature(imp, prezzi):
    lista = prezzi.get(imp["id"], [])
    pr = {
        "id": imp["id"], "nome": imp["nome"], "gestore": imp["gestore"], "bandiera": imp["bandiera"], "marchio": marchio(imp["bandiera"]),
        "indirizzo": imp["indirizzo"], "carburanti": "|".join(c for c in CARBURANTI if any(p[0] == c for p in lista)),
        "prezzi": lista,
    }
    for c in CARBURANTI:
        m = _migliore(lista, c)
        if m is not None:
            pr[c.lower()] = m  # prezzo più basso, per l'anteprima e per la tabella
    if lista:
        pr["prezzi_del"] = max(p[3] for p in lista)
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [imp["lon"], imp["lat"]]}, "properties": pr}


def costruisci(data, impianti, prezzi):
    ordine = sorted(impianti.values(), key=lambda i: int(i["id"]) if i["id"].isdigit() else 0)
    return {"type": "FeatureCollection", "aggiornato": data, "fonte": FONTE, "features": [_feature(i, prezzi) for i in ordine]}


def verifica(fc, minimo=MINIMO, minimo_prezzi=MINIMO_CON_PREZZI):
    n = len(fc["features"])
    if n < minimo:
        raise ValueError(f"Distributori: troppo pochi impianti: {n} (minimo {minimo})")
    con_prezzi = sum(1 for f in fc["features"] if f["properties"]["prezzi"])
    if con_prezzi < minimo_prezzi:
        raise ValueError(f"Distributori: troppo pochi impianti con prezzi: {con_prezzi} (minimo {minimo_prezzi})")
    ovest, sud, est, nord = LIMITI
    for f in fc["features"]:
        lon, lat = f["geometry"]["coordinates"]
        if not (ovest <= lon <= est and sud <= lat <= nord):
            raise ValueError(f"Distributore {f['properties']['id']} fuori dal comune: {lon}, {lat}")  # non dovrebbe succedere: li scarta già la lettura


def scarica(url, tentativi=3):
    """Il sito del MIMIT ogni tanto risponde male: si riprova qualche volta prima di arrendersi."""
    for n in range(1, tentativi + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "DigitalTwin-Palermo/1.0 (+https://github.com/coseerobe/DigitalTwin)"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8-sig", errors="replace")
        except OSError:
            if n == tentativi:
                raise
            time.sleep(10 * n)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anagrafica", help="CSV dell'anagrafica locale (default: scarica da MIMIT)")
    ap.add_argument("--prezzi", help="CSV dei prezzi locale (default: scarica da MIMIT)")
    a = ap.parse_args()
    leggi = lambda f, url: Path(f).read_text(encoding="utf-8-sig", errors="replace") if f else scarica(url)
    data, impianti = leggi_anagrafica(leggi(a.anagrafica, ANAGRAFICA))
    fc = costruisci(data, impianti, leggi_prezzi(leggi(a.prezzi, PREZZI), set(impianti)))
    verifica(fc)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    marchi = Counter(f["properties"]["marchio"] for f in fc["features"])
    con = sum(1 for f in fc["features"] if f["properties"]["prezzi"])
    print(f"{len(fc['features'])} distributori ({con} con prezzi; {dict(marchi.most_common())}), estrazione del {data}")


if __name__ == "__main__":
    sys.exit(main())
