"""Colonnine di ricarica per veicoli elettrici di Palermo -> dati/colonnine/colonnine.geojson.

  python3 scripts/colonnine.py              scarica l'ultimo snapshot di PalermoHub/evcharginglogsicilia (serie storica della
                                            Piattaforma Unica Nazionale, GSE), tiene le colonnine del comune di Palermo e scrive il GeoJSON
  python3 scripts/colonnine.py --src FILE   legge lo snapshot da un file locale invece che dalla rete

Fallisce (senza toccare il file) se i punti sono pochi o cadono fuori dal comune: meglio un dato vecchio che uno sbagliato.
"""
import argparse
import json
import sys
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "colonnine" / "colonnine.geojson"
SNAPSHOT = "https://raw.githubusercontent.com/PalermoHub/evcharginglogsicilia/main/docs/evcharging_snapshot.json"
FONTE = "GSE - Piattaforma Unica Nazionale (PUN), tramite PalermoHub/evcharginglogsicilia - CC BY 4.0"
LIMITI = (13.1, 37.9785, 13.55, 38.2919)  # come js/core/config.js: ovest, sud, est, nord
MINIMO = 100  # a ottobre 2026 sono 248: sotto questa soglia lo snapshot è sicuramente incompleto

CONNETTORI = {"IEC_62196_T2": "Tipo 2", "IEC_62196_T2_COMBO": "CCS Combo 2", "CHADEMO": "CHAdeMO", "IEC_62196_T3A": "Tipo 3A"}


def stato(p):
    """Tre classi per la mappa: la PUN ne ha sette (AVAILABLE, CHARGING, OUTOFORDER, BLOCKED, REMOVED, ...)."""
    if p.get("stato") != "Attivo":
        return "Non attiva"
    return "In ricarica" if p.get("stato_raw") == "CHARGING" else "Disponibile"


def _feature(p):
    connettore = p.get("standard_connettore") or ""
    pr = {
        "id": p["id_evse"], "stato": stato(p), "operatore": p.get("cpo") or "", "indirizzo": (p.get("indirizzo") or "").strip(),
        "cap": p.get("cap") or "", "potenza_kw": round((p.get("potenza_w") or 0) / 1000, 1), "corrente": p.get("corrente") or "",
        "connettore": CONNETTORI.get(connettore, connettore), "n_connettori": p.get("n_connettori") or 1,
        "h24": bool(p.get("open_24h7")), "tempo_reale": bool(p.get("real_time")),
    }
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [p["lon"], p["lat"]]}, "properties": pr}


def estrai(snapshot):
    punti = [p for p in snapshot["points"]
             if (p.get("citta") or "").strip().lower() == "palermo" and p.get("lat") is not None and p.get("lon") is not None]
    return {"type": "FeatureCollection", "aggiornato": snapshot.get("generated_at", ""), "fonte": FONTE,
            "features": [_feature(p) for p in sorted(punti, key=lambda p: p["id_evse"])]}


def verifica(fc, minimo=MINIMO):
    n = len(fc["features"])
    if n < minimo:
        raise ValueError(f"Colonnine: troppo pochi punti: {n} (minimo {minimo})")
    ovest, sud, est, nord = LIMITI
    for f in fc["features"]:
        lon, lat = f["geometry"]["coordinates"]
        if not (ovest <= lon <= est and sud <= lat <= nord):
            raise ValueError(f"Colonnina {f['properties']['id']} fuori dal comune: {lon}, {lat}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", help="snapshot locale (default: scarica da GitHub)")
    a = ap.parse_args()
    if a.src:
        snapshot = json.loads(Path(a.src).read_text(encoding="utf-8"))
    else:
        with urllib.request.urlopen(SNAPSHOT, timeout=120) as r:
            snapshot = json.load(r)
    fc = estrai(snapshot)
    verifica(fc)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    stati = Counter(f["properties"]["stato"] for f in fc["features"])
    print(f"{len(fc['features'])} colonnine ({dict(stati)}), snapshot del {fc['aggiornato']}")


if __name__ == "__main__":
    sys.exit(main())
