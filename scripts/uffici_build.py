"""Costruisce dati/uffici/{uffici.json,uffici.geojson,sedi.geojson,uffici.csv,ELENCO.md} da grezzo.json.

Gerarchia: Area -> Settore (ufficio/capo area) -> Unita operativa (U.O.).
Coordinate: prese dalla mappa Leaflet della pagina "luogo" (sede principale) sul sito del Comune.
"""
import csv
import json
import re
import sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from uffici_scrape import OUT, get  # noqa: E402

# 25 colori distinti, assegnati alle aree in ordine alfabetico (stabile finché l'elenco delle aree non cambia)
PALETTE = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#00a6a6", "#d4a017", "#f032e6", "#7a9a01", "#8c564b",
           "#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#17becf", "#c2185b", "#5d4037", "#455a64", "#ff6f61", "#00796b",
           "#6a1b9a", "#827717", "#0277bd", "#ad1457", "#546e7a"]

BBOX = (13.20, 38.03, 13.50, 38.25)  # lon/lat comune di Palermo (largo)


def coord_luogo(url):
    t = get(url)
    m = re.search(r"L\.marker\(\[\s*(3[0-9]\.\d+)\s*,\s*(1[0-9]\.\d+)", t)
    return (float(m.group(2)), float(m.group(1))) if m else None


def main():
    v = json.load(open(OUT / "grezzo.json", encoding="utf8"))
    by = {x["url"]: x for x in v}
    aree = {x["url"]: x for x in v if x["tipologia"] == "Area"}
    is_uo = lambda x: x["nome"].lower().startswith("u.o")  # noqa: E731

    # sedi
    urls = sorted({s["url"] for x in v for s in x["sedi"]})
    with ThreadPoolExecutor(6) as ex:
        cc = dict(zip(urls, ex.map(coord_luogo, urls)))
    mancanti = [u for u, c in cc.items() if not c or not (BBOX[0] <= c[0] <= BBOX[2] and BBOX[1] <= c[1] <= BBOX[3])]
    print("sedi", len(urls), "senza coordinate valide:", mancanti)

    # area di ogni settore
    area_di = {}
    for a in aree.values():
        for d in a["dipende_da"]:
            area_di.setdefault(d["url"], a["url"])
    for x in v:
        if x["url"] in area_di or x["url"] in aree or is_uo(x):
            continue
        for d in x["dipende_da"]:
            if d["url"] in aree:
                area_di[x["url"]] = d["url"]
                break

    def risali(x, visti=()):
        """Ritorna (area_url, settore_url|None, padre_uo|None) per una U.O."""
        if not x["dipende_da"]:
            return None, None, None
        p = by[x["dipende_da"][0]["url"]]
        if p["url"] in aree:
            return p["url"], None, None
        if is_uo(p) and p["url"] not in visti:
            a, s, _ = risali(p, visti + (x["url"],))
            return a, s, p["url"]
        return area_di.get(p["url"]), p["url"], None

    def scheda(x, livello):
        sede = x["sedi"][0] if x["sedi"] else None
        c = cc.get(sede["url"]) if sede else None
        if c and not (BBOX[0] <= c[0] <= BBOX[2] and BBOX[1] <= c[1] <= BBOX[3]):
            c = None
        return {
            "id": x["url"].rstrip("/").rsplit("/", 1)[-1],
            "livello": livello,
            "nome": x["nome"],
            "url": x["url"],
            "competenze": x["competenze"],
            "responsabili": x["responsabili"],
            "n_persone": len(x["persone"]),
            "sede": ({"nome": sede["nome"], "indirizzo": sede["indirizzo"], "url": sede["url"]} if sede else None),
            "contatti": [{k: c_[k] for k in ("titolo", "indirizzo", "telefoni", "email")} | {"pec": re.findall(r"PEC:\s*(\S+@\S+)", c_["testo"])} for c_ in x["contatti"]],
            "coordinate": list(c) if c else None,
            "aggiornata": x["aggiornata"],
        }

    albero = {}
    def get_area(u):
        if u not in albero:
            a = aree.get(u)
            albero[u] = {"scheda": scheda(a, "area") if a else {"id": "non-collocati", "livello": "area", "nome": "Uffici non collocati", "url": "", "responsabili": [], "contatti": [], "coordinate": None}, "settori": {}}
        return albero[u]

    for u in aree:
        get_area(u)
    for x in v:
        if x["url"] in aree or is_uo(x):
            continue
        a = get_area(area_di.get(x["url"], ""))
        a["settori"].setdefault(x["url"], {"scheda": scheda(x, "settore"), "unita": []})
    for x in v:
        if not is_uo(x):
            continue
        au, se, pu = risali(x)
        a = get_area(au or "")
        if se is None:
            se = "_diretto_" + (au or "")
            a["settori"].setdefault(se, {"scheda": {"id": se, "livello": "settore", "nome": "(unità alle dirette dipendenze dell'Area)", "url": "", "responsabili": [], "contatti": [], "coordinate": None}, "unita": []})
        if se not in a["settori"]:
            a["settori"][se] = {"scheda": scheda(by[se], "settore"), "unita": []}
        s = scheda(x, "unita")
        s["padre_uo"] = pu.rstrip("/").rsplit("/", 1)[-1] if pu else None
        a["settori"][se]["unita"].append(s)

    n_unita = sum(len(s["unita"]) for a in albero.values() for s in a["settori"].values())
    if len(aree) < 15 or n_unita < 300:  # scraping rotto: non sovrascrivere i dati buoni
        sys.exit(f"Struttura anomala (aree={len(aree)}, unita={n_unita}): file non scritti")

    out = []
    for a in albero.values():
        sett = []
        for s in a["settori"].values():
            sett.append({**s["scheda"], "unita": s["unita"]})
        out.append({**a["scheda"], "settori": sett})
    out.sort(key=lambda a: a["nome"])
    (OUT / "uffici.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8")

    # piatto: una riga per ufficio
    piatto = []
    for a in out:
        piatto.append((a, None, a))
        for s in a["settori"]:
            if s["url"]:
                piatto.append((a, s, s))
            for u in s["unita"]:
                piatto.append((a, s if s["url"] else None, u))

    def feat(a, s, n):
        r = "; ".join(f"{p['nome']} ({p['ruolo']})" if p["ruolo"] else p["nome"] for p in n["responsabili"])
        tel = sorted({t.strip() for c in n["contatti"] for t in c["telefoni"]})
        mail = sorted({e for c in n["contatti"] for e in c["email"]})
        pec = sorted({e for c in n["contatti"] for e in c["pec"]})
        return {"type": "Feature", "geometry": {"type": "Point", "coordinates": n["coordinate"]} if n["coordinate"] else None,
                "properties": {"id": n["id"], "livello": n["livello"], "nome": n["nome"], "area": a["nome"], "settore": s["nome"] if s else "", "responsabile": r,
                               "sede": n["sede"]["nome"] if n["sede"] else "", "indirizzo": n["sede"]["indirizzo"] if n["sede"] else "",
                               "telefoni": tel, "email": mail, "pec": pec, "url": n["url"]}}
    feats = [feat(*p) for p in piatto if p[2]["url"]]
    colori = {a: PALETTE[i % len(PALETTE)] for i, a in enumerate(sorted({f["properties"]["area"] for f in feats}))}
    for f in feats:
        f["properties"]["colore"] = colori[f["properties"]["area"]]
    geo = [f for f in feats if f["geometry"]]
    if len(geo) < 0.9 * len(feats):
        sys.exit(f"Troppi uffici senza coordinate ({len(feats) - len(geo)}/{len(feats)})")
    (OUT / "uffici.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": geo}, ensure_ascii=False), encoding="utf8")
    print("uffici", len(feats), "geolocalizzati", len(geo))

    # sedi aggregate
    sedi = defaultdict(lambda: {"uffici": []})
    for f in geo:
        p = f["properties"]
        k = tuple(f["geometry"]["coordinates"])
        s = sedi[k]
        s.update(nome=p["sede"], indirizzo=p["indirizzo"])
        s["uffici"].append({k: p[k] for k in ("nome", "livello", "area", "colore", "settore", "responsabile", "telefoni", "email", "url")})
    sf = [{"type": "Feature", "geometry": {"type": "Point", "coordinates": list(k)},
           "properties": {"id": f"sede-{i}", "n_aree": len({u["area"] for u in s["uffici"]}), "nome": s["nome"], "indirizzo": s["indirizzo"], "n_uffici": len(s["uffici"]), "uffici": s["uffici"]}} for i, (k, s) in enumerate(sedi.items(), 1)]
    (OUT / "sedi.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": sf}, ensure_ascii=False), encoding="utf8")
    print("sedi", len(sf))

    with open(OUT / "uffici.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh, delimiter=";")
        w.writerow(["livello", "area", "settore", "nome", "responsabile", "sede", "indirizzo", "telefoni", "email", "pec", "lon", "lat", "url"])
        for f in feats:
            p = f["properties"]; g = f["geometry"]["coordinates"] if f["geometry"] else ["", ""]
            w.writerow([p["livello"], p["area"], p["settore"], p["nome"], p["responsabile"], p["sede"], p["indirizzo"], " / ".join(p["telefoni"]), " / ".join(p["email"]), " / ".join(p["pec"]), g[0], g[1], p["url"]])

    righe = ["# Struttura degli uffici del Comune di Palermo", "", "Fonte: <https://www.comune.palermo.it/amministrazione/uffici/>. Generato da `scripts/uffici_build.py`.", ""]
    def dett(n, ind):
        r = ", ".join(f"{p['nome']} ({p['ruolo']})" if p["ruolo"] else p["nome"] for p in n["responsabili"]) or "n.d."
        sd = f"{n['sede']['nome']} — {n['sede']['indirizzo']}" if n["sede"] else "n.d."
        tel = ", ".join(sorted({t for c in n["contatti"] for t in c["telefoni"]})) or "n.d."
        em = ", ".join(sorted({e for c in n["contatti"] for e in c["email"]})) or "n.d."
        return f"{ind}- Responsabile: {r}\n{ind}- Sede: {sd}\n{ind}- Tel: {tel} · Email: {em}\n{ind}- Scheda: {n['url']}"
    for a in out:
        righe += [f"## Area: {a['nome']}", dett(a, "") if a["url"] else "", ""]
        for s in a["settori"]:
            righe += [f"### Settore: {s['nome']}", dett(s, "") if s["url"] else "", ""]
            for u in s["unita"]:
                righe += [f"#### U.O.: {u['nome']}", dett(u, ""), ""]
    (OUT / "ELENCO.md").write_text("\n".join(righe), encoding="utf8")
    print("aree", len(out), "settori", sum(len(a["settori"]) for a in out), "unita", sum(len(s["unita"]) for a in out for s in a["settori"]))


main()
