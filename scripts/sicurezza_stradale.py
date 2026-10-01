#!/usr/bin/env python3
"""Studio «Rete stradale» (Rete-Stradale 01) -> PMTiles della sicurezza stradale in dati/mobilita/sicurezza/.

  python3 scripts/sicurezza_stradale.py   legge rete_rischio, hotspot_griglia e incidenti_snap (.geojson) e scrive
                                          archi.pmtiles, hotspot.pmtiles, incidenti.pmtiles (+ i GeoJSON ridotti)

archi:     tutti gli archi con i campi usati dal viewer; `classe` (0-3) = quartile del tasso incidenti/km, solo per archi con
           tasso affidabile (>= 20 m) e almeno un incidente; `via_*` = posto in classifica e dati della via (le 20 più pericolose:
           gravità pesata per km, vie di almeno 3 km e 30 incidenti; gli archi senza nome in OSM restano fuori)
hotspot:   solo celle Gi* significative (90/95/99%), con il livello numerico
incidenti: punti con snap affidabile (<= 60 m), con l'anno ricavato dalla data
"""
import json
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "mobilita" / "sicurezza"
SRC = OUT

CAMPI_ARCHI = ["arco_id", "nome", "highway", "lunghezza_m", "n_incidenti", "tasso_km", "tasso_affidabile",
               "pendenza_media_pct", "accessibilita", "Quartiere", "Circoscrizione", "UPL",
               "rischio_geomorf_label", "rischio_idraul_label", "priorita_geomorf", "priorita_idraul"]
CAMPI_INCIDENTI = ["Tipologia", "feriti_n", "Luogo", "arco_id"]
PESI_GRAVITA = {"M": 5, "R": 3, "F": 1, "C": 0.2}  # come per gli hotspot Gi* dello studio


def _fc(features):
    return {"type": "FeatureCollection", "features": features}


def _tiene(props, campi):
    return {c: props.get(c) for c in campi if props.get(c) is not None}


def _con_tasso(p):
    return bool(p.get("tasso_affidabile")) and (p.get("n_incidenti") or 0) > 0


def classifica_vie(archi, incidenti, top=20, min_km=3, min_incidenti=30):
    """{nome via: {rango, gravita_km, mortali, incidenti, km}} per le `top` vie con più gravità pesata per km.

    Le vie sono gli archi con lo stesso nome; contano solo gli incidenti con snap affidabile. Restano fuori gli archi
    senza nome e le vie sotto soglia (corte o con pochi incidenti: il rapporto sarebbe instabile).
    """
    nome_di, km = {}, {}
    for f in archi["features"]:
        p = f["properties"]
        if p.get("nome"):
            nome_di[p["arco_id"]] = p["nome"]
            km[p["nome"]] = km.get(p["nome"], 0) + p["lunghezza_m"] / 1000
    gravita, conteggio, mortali = {}, {}, {}
    for f in incidenti["features"]:
        p = f["properties"]
        nome = nome_di.get(p.get("arco_id"))
        if not nome or not p.get("snap_affidabile"):
            continue
        gravita[nome] = gravita.get(nome, 0) + PESI_GRAVITA.get(p.get("Tipologia"), 0)
        conteggio[nome] = conteggio.get(nome, 0) + 1
        mortali[nome] = mortali.get(nome, 0) + (p.get("Tipologia") == "M")
    ammesse = [n for n in conteggio if km[n] >= min_km and conteggio[n] >= min_incidenti]
    ammesse.sort(key=lambda n: (-gravita[n] / km[n], n))
    return {n: {"rango": i, "gravita_km": round(gravita[n] / km[n], 1), "mortali": mortali[n],
                "incidenti": conteggio[n], "km": round(km[n], 1)}
            for i, n in enumerate(ammesse[:top], 1)}


def ridotti_archi(fc, classifica=None):
    classifica = classifica or {}
    validi = [f["properties"]["tasso_km"] for f in fc["features"] if _con_tasso(f["properties"])]
    soglie = statistics.quantiles(validi, n=4, method="inclusive") if len(validi) >= 2 else []
    out = []
    for f in fc["features"]:
        p = f["properties"]
        props = _tiene(p, CAMPI_ARCHI)
        if _con_tasso(p) and soglie:
            props["classe"] = sum(p["tasso_km"] > t for t in soglie)
        via = classifica.get(p.get("nome"))
        if via:
            props.update({f"via_{k}": v for k, v in via.items()})
        out.append({"type": "Feature", "properties": props, "geometry": f["geometry"]})
    return _fc(out)


def _livello(etichetta):
    """'hotspot 95%' -> 95; None per coldspot e «non significativo»."""
    if not (etichetta or "").startswith("hotspot "):
        return None
    return int(etichetta.split()[1].rstrip("%"))


def ridotti_hotspot(fc):
    out = []
    for f in fc["features"]:
        p = f["properties"]
        liv = _livello(p.get("hotspot_gravita"))
        if liv is None:
            continue
        props = {"cell_id": p["cell_id"], "n_incidenti": p["n_incidenti"], "gravita_tot": p["gravita_tot"], "livello_gravita": liv}
        conteggio = _livello(p.get("hotspot_count"))
        if conteggio is not None:
            props["livello_conteggio"] = conteggio
        out.append({"type": "Feature", "properties": props, "geometry": f["geometry"]})
    return _fc(out)


def ridotti_incidenti(fc):
    out = []
    for f in fc["features"]:
        p = f["properties"]
        if not p.get("snap_affidabile"):
            continue
        try:
            anno = int(str(p["Data"])[-4:])
        except (KeyError, ValueError):
            continue
        out.append({"type": "Feature", "properties": {"anno": anno, **_tiene(p, CAMPI_INCIDENTI)}, "geometry": f["geometry"]})
    return _fc(out)


def _pmtiles(geojson, pmtiles, strato, zoom_min, zoom_max):
    subprocess.run(
        ["tippecanoe", "-o", str(pmtiles), "-f", "-l", strato, f"-Z{zoom_min}", f"-z{zoom_max}",
         "--no-tile-size-limit", "--drop-densest-as-needed", "--no-feature-limit", str(geojson)],
        check=True, capture_output=True,
    )


def scrivi(src=SRC, out=OUT):
    out.mkdir(parents=True, exist_ok=True)
    leggi = lambda nome: json.loads((src / f"{nome}.geojson").read_text(encoding="utf-8"))
    classifica = classifica_vie(leggi("rete_rischio"), leggi("incidenti_snap"))
    lavori = [("archi", "rete_rischio", lambda fc: ridotti_archi(fc, classifica), 10, 16),
              ("hotspot", "hotspot_griglia", ridotti_hotspot, 10, 15),
              ("incidenti", "incidenti_snap", ridotti_incidenti, 12, 16)]
    n = {}
    for nome, sorgente, riduci, zmin, zmax in lavori:
        fc = riduci(leggi(sorgente))
        ridotto = out / f"{nome}.geojson"
        ridotto.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        _pmtiles(ridotto, out / f"{nome}.pmtiles", nome, zmin, zmax)
        n[nome] = len(fc["features"])
    return n


def main():
    n = scrivi()
    print(", ".join(f"{k}: {v}" for k, v in n.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
