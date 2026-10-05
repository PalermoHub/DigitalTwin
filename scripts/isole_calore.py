#!/usr/bin/env python3
"""Isole di calore di Palermo: temperatura superficiale (LST) estiva per sezione censuaria, 2019–2025.

Uso: python3 scripts/isole_calore.py            (richiede tippecanoe per il PMTiles)
     python3 scripts/isole_calore.py --senza-pmtiles

Legge da lavoro/isole-calore/ (copiati dallo studio completo, https://palermohub.opendatasicilia.it/isole_di_calore.html):
  sezioni_lst_years.geojson   3600 sezioni con LST_2019 … LST_2025 (°C), quartiere, UPL, circoscrizione
Scrive in dati/isole-calore/:
  sezioni.pmtiles     strato «sezioni» (zoom 10–14), una feature per sezione con tutti gli anni (la mappa mostra il 2025, il grafico della scheda tutti)
  isole-calore.json   anni, serie comunale (media, mediana, quartili) e soglie 2025 per ogni metodo di classificazione (3–9 classi)

Le soglie sono precalcolate qui: il browser non ricalcola nulla (Jenks, quantili e intervalli uguali come nell'app dello studio).
Soglie = [minimo, limite 1, …, limite k-1, massimo]: un valore sta nella classe i se limite i <= valore < limite i+1 (come `step` di MapLibre).
"""
import json
import statistics
import subprocess
import sys
from math import ceil
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
LAVORO = RADICE / "lavoro" / "isole-calore"
OUT = RADICE / "dati" / "isole-calore"
LINK = "https://palermohub.opendatasicilia.it/isole_di_calore.html"
FONTE = "Landsat 8/9 (USGS), temperatura superficiale terrestre estiva, elaborata per sezione censuaria ISTAT"
ANNI = list(range(2019, 2026))
CLASSI = range(3, 10)
METODI = ("jenks", "quantile", "equal")


def soglie_uguali(valori, k):
    lo, hi = min(valori), max(valori)
    return [lo + (hi - lo) * i / k for i in range(k + 1)]


def quantile(ordinati, p):
    """Come `quantile` di simple-statistics (usato dall'app dello studio): niente interpolazione."""
    n = len(ordinati)
    if p <= 0:
        return ordinati[0]
    if p >= 1:
        return ordinati[-1]
    idx = n * p
    if idx % 1:
        return ordinati[ceil(idx) - 1]
    idx = int(idx)
    return (ordinati[idx - 1] + ordinati[idx]) / 2 if n % 2 == 0 else ordinati[idx]


def soglie_quantili(valori, k):
    v = sorted(valori)
    return [v[0]] + [quantile(v, i / k) for i in range(1, k)] + [v[-1]]


def soglie_naturali(valori, k):
    """Jenks (rotture naturali) = k-means ottimo in una dimensione, per programmazione dinamica sui valori distinti (pesati)."""
    import numpy as np

    v = np.array(sorted(valori), dtype=float)
    u, w = np.unique(v, return_counts=True)
    k = min(k, len(u))
    s_w = np.concatenate([[0], np.cumsum(w)])
    s_x = np.concatenate([[0], np.cumsum(w * u)])
    s_xx = np.concatenate([[0], np.cumsum(w * u * u)])

    def costo(j, i):  # somma dei quadrati degli scarti dei valori distinti j..i-1 (i array)
        n = s_w[i] - s_w[j]
        return (s_xx[i] - s_xx[j]) - (s_x[i] - s_x[j]) ** 2 / n

    m = len(u)
    # prec[i] = costo minimo dei primi i valori distinti nelle classi finora considerate; padre[c][i] = dove inizia l'ultima classe
    prec = np.full(m + 1, np.inf)
    prec[1:] = costo(0, np.arange(1, m + 1))
    padre = np.zeros((k, m + 1), dtype=int)
    for c in range(1, k):
        cur = np.full(m + 1, np.inf)
        for i in range(c + 1, m + 1):
            j = np.arange(c, i)
            tot = prec[j] + costo(j, i)
            best = int(np.argmin(tot))
            cur[i], padre[c, i] = tot[best], j[best]
        prec = cur
    # costo/indici: ricostruisce i punti di taglio all'indietro
    tagli, i = [], m
    for c in range(k - 1, 0, -1):
        i = int(padre[c, i])
        tagli.append(i)
    tagli.reverse()
    return [float(u[0])] + [float(u[t]) for t in tagli] + [float(u[-1])]


def classe_di(valore, soglie):
    """Indice di classe (0…k-1) di un valore, secondo `step` di MapLibre."""
    i = 0
    for limite in soglie[1:-1]:
        if valore >= limite:
            i += 1
    return i


def serie_comunale(righe, anni):
    out = {"anni": list(anni), "media": [], "mediana": [], "p25": [], "p75": [], "n": []}
    for a in anni:
        v = sorted(r[f"LST_{a}"] for r in righe if r.get(f"LST_{a}") is not None)
        out["n"].append(len(v))
        out["media"].append(round(statistics.fmean(v), 2))
        out["mediana"].append(round(statistics.median(v), 2))
        out["p25"].append(round(quantile(v, 0.25), 2))
        out["p75"].append(round(quantile(v, 0.75), 2))
    return out


def costruisci(senza_pmtiles=False):
    sorgente = LAVORO / "sezioni_lst_years.geojson"
    feats = json.loads(sorgente.read_text(encoding="utf-8"))["features"]
    righe = [f["properties"] for f in feats]
    anno = ANNI[-1]
    v = [r[f"LST_{anno}"] for r in righe if r.get(f"LST_{anno}") is not None]
    funzioni = {"jenks": soglie_naturali, "quantile": soglie_quantili, "equal": soglie_uguali}
    soglie = {m: {str(k): [round(x, 2) for x in funzioni[m](v, k)] for k in CLASSI} for m in METODI}
    # gli estremi sono quelli dei dati arrotondati: la legenda e il test li confrontano con min/max
    lo, hi = round(min(v), 2), round(max(v), 2)
    for m in METODI:
        for k in CLASSI:
            soglie[m][str(k)][0], soglie[m][str(k)][-1] = lo, hi
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "anno": anno, "anni": ANNI, "n_sezioni": len(feats), "n_con_dato": len(v), "min": lo, "max": hi,
        "serie": serie_comunale(righe, ANNI), "soglie": soglie, "link": LINK, "fonte": FONTE,
    }
    (OUT / "isole-calore.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"isole-calore.json: {len(feats)} sezioni, {len(v)} con dato {anno}, min {lo} max {hi}")
    if senza_pmtiles:
        return
    campi = [f"LST_{a}" for a in ANNI]
    cmd = ["tippecanoe", "-o", str(OUT / "sezioni.pmtiles"), "-L", f"sezioni:{sorgente}", "-Z", "10", "-z", "14",
           "--drop-densest-as-needed", "--force", "--quiet"]
    for c in ("sez", "circoscrizione", "Quartiere", "UPL_nome", *campi):
        cmd += ["-y", c]
    subprocess.run(cmd, check=True)
    print(f"sezioni.pmtiles: {(OUT / 'sezioni.pmtiles').stat().st_size} byte")


if __name__ == "__main__":
    costruisci("--senza-pmtiles" in sys.argv)
