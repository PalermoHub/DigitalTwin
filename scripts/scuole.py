"""Scuole/asili comunali e sedi delle sezioni elettorali -> punti + poligoni degli edifici in dati/scuole/.

  python3 scripts/scuole.py   legge i due GeoJSON originali (solo punti), abbina ogni punto a un poligono di
                              edifici/edificato.gpkg e scrive scuole.geojson, scuole_edifici.geojson,
                              seggi.geojson, seggi_edifici.geojson

Come per i monumenti il punto porta tutti i dettagli, il poligono solo id, nome e tipo (il viewer ritrova i
dettagli dal punto con lo stesso id).
"""
import json
import re
import sys
from pathlib import Path

from shapely.geometry import Point, mapping
from shapely import set_precision

sys.path.insert(0, str(Path(__file__).resolve().parent))
from monumenti import EDIFICATO, Indice, abbina_edifici  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "scuole"
SCUOLE_SRC = OUT / "scuole_asili_comunali.geojson"
SEZIONE_MAX = 650  # le sezioni di Palermo vanno da 1 a circa 600
SEGGI_SRC = OUT / "sezioni_elettorali_di_palermo_ac.geojson"

TIPI = {"Asilo Nido": "Asilo nido", "Plesso": "Plesso scolastico", "Sede": "Sede dell'istituto"}
CATEGORIE = {"IC": "Istituto comprensivo", "DD": "Direzione didattica", "SMS": "Scuola media statale"}


def _t(v):
    return re.sub(r"\s+", " ", v).strip() if isinstance(v, str) else ""


def indirizzo(tipo_via, via, civico, barrato=""):
    """«VIA» «DELL'ALLODOLA» 36 'A' -> «Via Dell'Allodola 36/A»."""
    parti = [_t(tipo_via).capitalize(), _t(via).title().replace("'S", "'s")]
    numero = _t(civico) + (f"/{_t(barrato)}" if _t(barrato) else "")
    return " ".join(p for p in [*parti, numero] if p)


def scuola(props, lon, lat, n):
    """n: progressivo (gli ID originali si ripetono tra asili e plessi)."""
    p = {k: _t(v) for k, v in props.items()}
    cat = p.get("CATEGORIA") or p.get("SEDE_CATEGORIA", "")
    d = {
        "id": f"scuola-{n}", "nome": p["DENOMINAZIONE"], "tipo": TIPI.get(p["TIPO"], p["TIPO"]),
        "categoria": CATEGORIE.get(cat, cat),
        "indirizzo": indirizzo(p.get("VIA_TIPO"), p.get("VIA_DENOMINAZIONE"), p.get("CIVICO"), p.get("BARRATO")),
        "quartiere": p.get("QUARTIERE", "").title().replace("- ", "-"), "lon": lon, "lat": lat,
    }
    if p.get("SEDE_DENOMINAZIONE"):  # il plesso dipende da un istituto: nome e indirizzo della sede
        d["sede"] = p["SEDE_DENOMINAZIONE"]
        d["sede_indirizzo"] = indirizzo(p.get("SEDE_VIA_TIPO"), p.get("SEDE_VIA_DENOMINAZIONE"),
                                        p.get("SEDE_CIVICO"), p.get("SEDE_BARRATO"))
    return d


def seggio(props, lon, lat, n):
    # «2 73» nell'originale è «273»; «570 593» è invece due sezioni senza la virgola (i numeri arrivano a ~600)
    sezioni = re.sub(r"(\d+) (\d+)", lambda m: m[1] + m[2] if int(m[1] + m[2]) <= SEZIONE_MAX else f"{m[1]}, {m[2]}", _t(props.get("sezioni")))
    elenco = [s for s in (x.strip() for x in sezioni.split(",")) if s]
    return {
        "id": f"seggio-{n}", "nome": _t(props.get("name")), "tipo": "Sede di sezioni elettorali",
        "indirizzo": _t(props.get("indirizzo")), "circoscrizione": _t(props.get("circoscrizione")),
        "sezioni": ", ".join(elenco), "n_sezioni": len(elenco), "lon": lon, "lat": lat,
    }


ARTICOLI = {"via", "viale", "corso", "piazza", "piazzale", "largo", "vicolo", "dei", "del", "della", "delle", "di", "da", "dello", "degli"}


def chiave_indirizzo(testo):
    """«Via Schifani Vito, 3» e «Via Vito Schifani 3» -> stessa chiave (parole della via senza ordine + civico)."""
    parole = re.findall(r"[a-z0-9]+", re.sub(r"[^\w\s]", " ", _t(testo).lower().replace("'", "")))
    return frozenset(p for p in parole if p not in ARTICOLI)


def _parole_nome(nome):
    return {p for p in re.findall(r"[a-z]+", _t(nome).lower()) if len(p) > 3} - {"direzione", "didattica", "circolo", "scuola", "istituto"}


def unisci_seggi(scuole, seggi):
    """Le sedi elettorali che sono anche una scuola/asilo (stesso indirizzo) passano nella scuola come campi `seggio_*`.

    Con più scuole allo stesso indirizzo (plesso + sede) sceglie quella dal nome più simile a quello del seggio.
    Restituisce (scuole aggiornate, seggi rimasti senza scuola).
    """
    per_indirizzo = {}
    for sc in scuole:
        per_indirizzo.setdefault(chiave_indirizzo(sc["indirizzo"]), []).append(sc)
    rimasti = []
    for sg in seggi:
        candidate = per_indirizzo.get(chiave_indirizzo(sg["indirizzo"]), [])
        if not candidate:
            rimasti.append(sg)
            continue
        parole = _parole_nome(sg["nome"])
        sc = max(candidate, key=lambda c: len(parole & _parole_nome(c["nome"])))
        sc.update(seggio_nome=sg["nome"], seggio_circoscrizione=sg["circoscrizione"],
                  seggio_sezioni=sg["sezioni"], seggio_n_sezioni=sg["n_sezioni"])
    return scuole, rimasti


def costruisci_feature(luogo, geom, abbinamento):
    if geom is None:
        props = dict(luogo)
        geometria = {"type": "Point", "coordinates": [luogo["lon"], luogo["lat"]]}
    else:
        props = {k: luogo[k] for k in ("id", "nome", "tipo")}
        geometria = mapping(set_precision(geom, 1e-6))
    props["abbinamento"] = abbinamento
    return {"type": "Feature", "properties": props, "geometry": geometria}


def _scrivi(nome, feats):
    (OUT / nome).write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False,
                                       separators=(",", ":")), encoding="utf-8")


def genera():
    import pyogrio

    def leggi(src, crea):
        return [crea(f["properties"], *f["geometry"]["coordinates"][:2], i)
                for i, f in enumerate(json.loads(src.read_text(encoding="utf-8"))["features"], 1)]

    gruppi = {
        "scuole": leggi(SCUOLE_SRC, lambda p, lon, lat, i: scuola(p, lon, lat, i)),
        "seggi": leggi(SEGGI_SRC, lambda p, lon, lat, i: seggio(p, lon, lat, i)),
    }
    tutti = [l for g in gruppi.values() for l in g]
    xs, ys = [l["lon"] for l in tutti], [l["lat"] for l in tutti]
    marg = 0.002
    edifici = pyogrio.read_dataframe(EDIFICATO, bbox=(min(xs) - marg, min(ys) - marg, max(xs) + marg, max(ys) + marg),
                                     columns=["altezza"])
    indice = Indice(list(zip(edifici.geometry, edifici["altezza"])))
    gruppi["scuole"], gruppi["seggi"] = unisci_seggi(gruppi["scuole"], gruppi["seggi"])
    print("sedi elettorali dentro una scuola:", sum("seggio_nome" in s for s in gruppi["scuole"]))
    for nome, luoghi in gruppi.items():
        punti, poligoni, conteggio = [], [], {}
        for l in luoghi:
            geoms, tipo = abbina_edifici(Point(l["lon"], l["lat"]), indice, l["nome"])
            conteggio[tipo] = conteggio.get(tipo, 0) + 1
            punti.append(costruisci_feature(l, None, tipo))
            poligoni.extend(costruisci_feature(l, g, tipo) for g in geoms)
        _scrivi(f"{nome}.geojson", punti)
        _scrivi(f"{nome}_edifici.geojson", poligoni)
        print(nome, len(luoghi), conteggio)


if __name__ == "__main__":
    genera()
