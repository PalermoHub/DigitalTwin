"""Ultimo feed GTFS di AMAT Palermo dal portale open data del Comune -> dati/trasporto/.

  python3 scripts/gtfs_scarica.py            legge il catalogo DCAT, prende il feed caricato per ultimo e, se è diverso da quello già
                                             in uso, lo scarica, lo verifica e rigenera fermate, linee e orari (scripts/gtfs.py)
  python3 scripts/gtfs_scarica.py --forza    rigenera anche se il feed è già quello in uso

Il portale non ha una pagina leggibile da script, ma pubblica il catalogo DCAT con il downloadURL di ogni zip. Il nome dello zip
(_GGMMAAAAhhmmss.zip) è la data di caricamento: i periodi di validità si sovrappongono, quindi vale il caricamento più recente.
Fallisce (senza toccare i dati) se il feed è scaduto, incompleto o fuori dal comune: meglio un dato vecchio che uno sbagliato.
"""
import argparse
import io
import json
import re
import sys
import tempfile
import urllib.request
import zipfile
from datetime import date, datetime
from pathlib import Path

import gtfs

ROOT = Path(__file__).resolve().parents[1]
OUT = gtfs.OUT
MARCATORE = OUT / "gtfs_origine.json"
CATALOGO = "https://opendata.comune.palermo.it/dcat/dcat.php"
LIMITI = (13.1, 37.9785, 13.55, 38.2919)  # come js/core/config.js: ovest, sud, est, nord
MINIMO_FERMATE = 500  # a ottobre 2026 sono 1668: sotto questa soglia il feed è incompleto
RICHIESTI = ("agency", "calendar_dates", "feed_info", "routes", "shapes", "stop_times", "stops", "trips")
ESTRATTI = RICHIESTI + ("fare_attributes", "fare_rules")

_URL = re.compile(r"dcat:downloadURL\s*<(https?://[^>\s]*/uploads/dataset/gtfs/(_(\d{14})\.zip))>")


def feed_nel_catalogo(testo):
    """Feed GTFS del catalogo DCAT, dal più vecchio al più recente caricamento."""
    feed = {m[1]: {"url": m[1], "nome": m[2], "caricato": datetime.strptime(m[3], "%d%m%Y%H%M%S")} for m in _URL.finditer(testo)}
    return sorted(feed.values(), key=lambda f: f["caricato"])


def piu_recente(testo):
    feed = feed_nel_catalogo(testo)
    if not feed:
        raise ValueError("Catalogo: nessun feed GTFS trovato")
    return feed[-1]


def da_aggiornare(nome, marcatore=MARCATORE):
    try:
        return json.loads(marcatore.read_text(encoding="utf-8")).get("zip") != nome
    except (OSError, ValueError, AttributeError):
        return True


def estrai(dati, dest):
    """Scompatta solo i file GTFS attesi, ignorando cartelle e percorsi: nessuna scrittura fuori da dest."""
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(dati)) as z:
        for info in z.infolist():
            base = Path(info.filename).name
            if Path(base).stem in ESTRATTI and base.endswith(".txt") and not info.is_dir():
                (dest / base).write_bytes(z.read(info))


def verifica(src, oggi=None, minimo=MINIMO_FERMATE):
    src = Path(src)
    for nome in RICHIESTI:
        if not (src / f"{nome}.txt").exists():
            raise ValueError(f"Feed incompleto: manca {nome}.txt")
    fine = datetime.strptime(next(gtfs.leggi(src, "feed_info"))["feed_end_date"], "%Y%m%d").date()
    if fine < (oggi or date.today()):
        raise ValueError(f"Feed scaduto il {fine}")
    fermate = list(gtfs.leggi(src, "stops"))
    if len(fermate) < minimo:
        raise ValueError(f"Feed con troppo poche fermate: {len(fermate)} (minimo {minimo})")
    ovest, sud, est, nord = LIMITI
    for r in fermate:
        lon, lat = float(r["stop_lon"]), float(r["stop_lat"])
        if not (ovest <= lon <= est and sud <= lat <= nord):
            raise ValueError(f"Fermata {r['stop_id']} fuori dal comune: {lon}, {lat}")


def _scarica(url):
    with urllib.request.urlopen(url, timeout=300) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--forza", action="store_true", help="rigenera anche se il feed è già quello in uso")
    a = ap.parse_args()
    feed = piu_recente(_scarica(CATALOGO).decode("utf-8"))
    if not a.forza and not da_aggiornare(feed["nome"]):
        print(f"Già aggiornato: {feed['nome']} (caricato il {feed['caricato']:%d/%m/%Y})")
        return 0
    with tempfile.TemporaryDirectory() as tmp:
        estrai(_scarica(feed["url"]), tmp)
        verifica(tmp)
        risultato = gtfs.costruisci(Path(tmp))
    gtfs.scrivi(risultato)
    fermate = risultato[0]
    MARCATORE.write_text(json.dumps({"zip": feed["nome"], "caricato": feed["caricato"].isoformat(), "validita": fermate["validita"]},
                                    ensure_ascii=False) + "\n", encoding="utf-8")
    v = fermate["validita"]
    print(f"Feed {feed['nome']}: {len(fermate['features'])} fermate, {len(risultato[1]['features'])} tracciati, valido dal {v['da']} al {v['a']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
