"""Scarica i vincoli del PAI (Piano di Assetto Idrogeologico) del Comune di Palermo dal SITR della Regione Siciliana.

Uso: python3 scripts/pai.py            (richiede tippecanoe per il PMTiles)
     python3 scripts/pai.py --senza-pmtiles

Fonte: https://map.sitr.regione.sicilia.it/gis/rest/services/pai  (un servizio MapServer per tema, ognuno con la sua simbologia)
Si tengono solo gli elementi del comune di Palermo (campo «comune» del servizio oppure geometria dentro il confine comunale).
La tematizzazione è quella del server (colori, bordi, spessori, retini dei dissesti): viaggia nel manifest e dentro ogni feature.

Scrive in dati/pai/ (usati dalla webapp):
  pai.json                 manifest: per tema i campi, le classi con simbologia del server, numero di elementi
  pai.pmtiles              tutti i temi, un solo file con uno strato per dataset, zoom 12–18
Scrive in lavoro/pai/ (non versionato):
  <dataset>.geojson        elementi di Palermo di un tema (WGS84, campi con nome breve)
"""
import base64
import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://map.sitr.regione.sicilia.it/gis/rest/services/pai"
RADICE = Path(__file__).resolve().parent.parent
OUT = RADICE / "dati" / "pai"  # solo ciò che serve alla webapp: pai.json e pai.pmtiles
LAVORO = RADICE / "lavoro" / "pai"  # dati di lavoro (un GeoJSON per tema): non versionati
CONFINE = RADICE / "dati" / "incedi" / "confine_comunale.geojson"  # confine del Comune, già versionato con gli incendi
ZOOM_MIN, ZOOM_MAX = 12, 18
MARGINE = 0.0006  # ~60 m in gradi: il confine ha +50 m di tolleranza, gli elementi dei comuni vicini lo sfiorano soltanto
PAGINA = 1000

# Un dataset = un insieme di elementi (un layer del server). `temi` = come viene colorato: ogni tema legge la simbologia di un
# layer del server (i dissesti hanno due layer sugli stessi dati: per tipologia e per attività).
DATASETS = [
    {"id": "idraulica_pericolosita", "gruppo": "Idraulica", "titolo": "Pericolosità idraulica", "servizio": "PAI_Idraulica_Pericolosita", "layer": 0,
     "temi": [{"id": "idraulica_pericolosita", "titolo": "Pericolosità idraulica", "campo": "PERICOLO", "riga": "Pericolosità", "layer": 0}]},
    {"id": "idraulica_rischio", "gruppo": "Idraulica", "titolo": "Rischio idraulico", "servizio": "PAI_Idraulica_Rischio", "layer": 0,
     "temi": [{"id": "idraulica_rischio", "titolo": "Rischio idraulico", "campo": "RISCHIO", "riga": "Rischio", "layer": 0}]},
    {"id": "idraulica_siti", "gruppo": "Idraulica", "titolo": "Siti di attenzione idraulica", "servizio": "PAI_Idraulica_SitiAttenzione", "layer": 0,
     "temi": [{"id": "idraulica_siti", "titolo": "Siti di attenzione idraulica", "campo": None, "riga": None, "layer": 0}]},
    {"id": "idraulica_esondazioni_manovra", "gruppo": "Idraulica", "titolo": "Esondazioni: manovra di scarico", "servizio": "PAI_Idraulica_Esondazioni", "layer": 0,
     "temi": [{"id": "idraulica_esondazioni_manovra", "titolo": "Esondazioni: manovra di scarico", "campo": None, "riga": None, "layer": 0}]},
    {"id": "idraulica_esondazioni_collasso", "gruppo": "Idraulica", "titolo": "Esondazioni: collasso", "servizio": "PAI_Idraulica_Esondazioni", "layer": 1,
     "temi": [{"id": "idraulica_esondazioni_collasso", "titolo": "Esondazioni: collasso", "campo": None, "riga": None, "layer": 1}]},
    {"id": "geo_pericolosita", "gruppo": "Geomorfologia", "titolo": "Pericolosità geomorfologica", "servizio": "PAI_Geomorfologia_Pericolosita", "layer": 0, "prefisso": "P",
     "temi": [{"id": "geo_pericolosita", "titolo": "Pericolosità geomorfologica", "campo": "PERICOLO", "riga": "Pericolosità", "layer": 0}]},
    {"id": "geo_rischio", "gruppo": "Geomorfologia", "titolo": "Rischio geomorfologico", "servizio": "PAI_Geomorfologia_Rischio", "layer": 0, "prefisso": "R",
     "temi": [{"id": "geo_rischio", "titolo": "Rischio geomorfologico", "campo": "RISCHIO", "riga": "Rischio", "layer": 0}]},
    {"id": "geo_siti", "gruppo": "Geomorfologia", "titolo": "Siti di attenzione geomorfologica", "servizio": "PAI_Geomorfologia_SitiAttenzione", "layer": 0,
     "temi": [{"id": "geo_siti", "titolo": "Siti di attenzione geomorfologica", "campo": None, "riga": None, "layer": 0}]},
    {"id": "geo_fascia_p3p4", "gruppo": "Geomorfologia", "titolo": "Fascia di rispetto P3 e P4", "servizio": "PAI_Geomorfologia_FasciaRispettoP3P4", "layer": 0,
     "temi": [{"id": "geo_fascia_p3p4", "titolo": "Fascia di rispetto P3 e P4", "campo": None, "riga": None, "layer": 0}]},
    {"id": "dissesti", "gruppo": "Geomorfologia", "titolo": "Dissesti", "servizio": "PAI_Geomorfologia_Dissesti", "layer": 0,
     "temi": [{"id": "dissesti_attivita", "titolo": "Dissesti per attività", "campo": "COD_ATT", "riga": "Attività", "layer": 1},
              {"id": "dissesti_tipologia", "titolo": "Dissesti per tipologia", "campo": "COD_TIP", "riga": "Tipologia", "layer": 0}]},
    {"id": "coste_pericolosita", "gruppo": "Erosione costiera", "titolo": "Pericolosità erosione costiera", "servizio": "PAI_Erosione_Costa_Pericolosita", "layer": 0,
     "temi": [{"id": "coste_pericolosita", "titolo": "Pericolosità erosione costiera", "campo": "PERICOLO", "riga": "Pericolosità", "layer": 0}]},
    {"id": "coste_rischio", "gruppo": "Erosione costiera", "titolo": "Rischio erosione costiera", "servizio": "PAI_Erosione_Costa_Rischio", "layer": 0,
     "temi": [{"id": "coste_rischio", "titolo": "Rischio erosione costiera", "campo": "RISCHIO", "riga": "Rischio", "layer": 0}]},
]

# Servizi che rimettono insieme layer di altri servizi (stessi dati, nessun elemento in più)
SERVIZI_COMBINATI = {"PAI_Erosione_Costa_Pericolosita_Rischio"}

# Campi senza interesse per chi legge la scheda (geometria, chiavi interne, doppioni del tema)
SCARTA = {"objectid", "shape", "shape_length", "shape_leng", "shape_area", "st_area_shape_", "st_length_shape_", "opacity", "id",
          "cod_tip", "cod_att"}
COMUNI = ("comune", "altri_comu", "altri_com2", "altro_comu", "altro_com2")
ETICHETTE = {
    "pai_nmr": "Numero PAI", "bcn_nmr": "Numero bacino", "bacino": "Bacino", "provincia": "Provincia", "comune": "Comune",
    "altri_comu": "Altro comune", "altro_comu": "Altro comune", "altri_com2": "Altro comune (2)", "altro_com2": "Altro comune (2)",
    "localita": "Località", "sigla": "Sigla", "sigla_p": "Sigla", "n_dpr": "Decreto del Presidente della Regione n.", "data_dpr": "Data del decreto",
    "ngurs": "Numero GURS", "dgurs": "Data GURS", "n_gurs": "Numero GURS", "data_gurs": "Data GURS", "data_event": "Data dell'evento",
    "coll_diss": "Dissesto collegato", "elemento_r": "Elemento a rischio", "elemento": "Elemento a rischio", "elemento_1": "Elemento a rischio (2)",
    "tipologia": "Tipologia", "nuova_sigl": "Nuova sigla", "codice": "Codice", "uf": "Unità fisiografica", "confini_uf": "Confini dell'unità fisiografica",
    "fenomeno": "Fenomeno", "magnitudo": "Magnitudo", "ctr": "Numero/i CTR", "e": "Classe dell'elemento a rischio", "n_bac": "Numero bacino",
    "pericolo": "Pericolo", "rischio": "Rischio", "aggiunto": "Aggiunto", "modificato": "Modificato", "eliminato": "Eliminato",
}


def chiedi(url, **parametri):
    q = urllib.parse.urlencode({"f": "json", **parametri})
    for tentativo in range(3):
        try:
            with urllib.request.urlopen(f"{url}?{q}", timeout=180) as r:
                d = json.load(r)
            if "error" in d:
                raise RuntimeError(d["error"])
            return d
        except Exception:
            if tentativo == 2:
                raise


def colore(c):
    """[r,g,b,a] ArcGIS -> («#rrggbb», opacità 0-1)."""
    return "#%02x%02x%02x" % tuple(c[:3]), round(c[3] / 255, 2)


def classe_da_simbolo(valore, etichetta, s, trasparenza):
    """Simbologia di una classe del server: poligoni (riempimento, bordo), linee (colore, spessore) o retino (immagine PNG)."""
    c = {"valore": valore, "label": etichetta}
    if s["type"] == "esriPFS":  # retino: il server lo disegna in nero su trasparente
        c["pattern"] = s["imageData"]
        c["colore"], c["opacita"] = "#000000", 1
    elif s["type"] == "esriSLS":
        c["colore"], c["opacita"] = colore(s["color"])
        c["spessore"] = s.get("width", 1)
    else:
        c["colore"], c["opacita"] = colore(s["color"])
    contorno = s.get("outline")
    if contorno and contorno.get("color") and contorno["color"][3]:
        c["bordo"], c["opacita_bordo"] = colore(contorno["color"])
        c["spessore_bordo"] = contorno.get("width", 0.4)
    k = 1 - trasparenza
    c["opacita"] = round(c["opacita"] * k, 2)
    if "opacita_bordo" in c:
        c["opacita_bordo"] = round(c["opacita_bordo"] * k, 2)
    return c


def simbologia(layer, tema, prefisso):
    """Classi del renderer del server. Valori diversi con la stessa etichetta (es. pericolo 4, 5 e 9) diventano una classe sola."""
    di = layer["drawingInfo"]
    r = di["renderer"]
    trasp = (di.get("transparency") or 0) / 100
    if r["type"] == "simple":
        return [classe_da_simbolo(None, tema["titolo"], r["symbol"], trasp)]
    if r["type"] != "uniqueValue":
        sys.exit(f"{tema['id']}: renderer «{r['type']}» non gestito")
    classi, per_etichetta = [], {}
    for info in r["uniqueValueInfos"]:
        etichetta = str(info.get("label") or info["value"])
        if prefisso and etichetta.isdigit():
            etichetta = f"{prefisso}{etichetta}"
        if etichetta in per_etichetta:
            per_etichetta[etichetta]["valori"].append(str(info["value"]))
            continue
        c = classe_da_simbolo(None, etichetta, info["symbol"], trasp)
        c.pop("valore")
        c["valori"] = [str(info["value"])]
        per_etichetta[etichetta] = c
        classi.append(c)
    return classi


def confine():
    from shapely.geometry import shape
    from shapely.ops import unary_union
    g = json.loads(CONFINE.read_text(encoding="utf8"))
    return unary_union([shape(f["geometry"]) for f in g["features"]])


def scarica(url, busta):
    """Tutti gli elementi dentro il rettangolo di Palermo, in WGS84, a pagine (il server ne dà al massimo 1000 per volta)."""
    feats, da = [], 0
    while True:
        d = chiedi(f"{url}/query", where="1=1", geometry=busta, geometryType="esriGeometryEnvelope", inSR=4326,
                   spatialRel="esriSpatialRelIntersects", outFields="*", outSR=4326, orderByFields="OBJECTID",
                   resultOffset=da, resultRecordCount=PAGINA, f="geojson")
        pagina = d.get("features", [])
        feats += pagina
        if not pagina or not d.get("exceededTransferLimit"):
            return feats
        da += len(pagina)


def arrotonda(coord, cifre=6):
    return [arrotonda(c, cifre) for c in coord] if isinstance(coord[0], list) else [round(x, cifre) for x in coord]


def data_iso(v):
    if v in (None, "", " "):
        return None
    if isinstance(v, (int, float)):
        return datetime.fromtimestamp(v / 1000, timezone.utc).strftime("%Y-%m-%d")
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", str(v).strip())
    return f"{m[3]}-{m[2]}-{m[1]}" if m else str(v).strip() or None


def pulisci(v):
    if isinstance(v, str):
        v = v.strip()
        return None if v in ("", "NULL", "<Null>") else v
    return v


def e_di_palermo(p, g, palermo, nucleo):
    """Il comune sta nel campo del servizio; senza campo (esondazioni) o con campo vuoto decide la geometria."""
    nomi = [str(p.get(k) or "").strip().lower() for k in p if k.lower() in COMUNI]
    if any("palermo" in n for n in nomi):
        return True
    return g.intersects(nucleo)


def costruisci(ds, palermo, nucleo, busta):
    from shapely.geometry import shape
    url = f"{BASE}/{ds['servizio']}/MapServer/{ds['layer']}"
    meta = chiedi(url)
    campi_server = {f["name"].lower(): f for f in meta["fields"]}
    gtipo = "linea" if meta["geometryType"] == "esriGeometryPolyline" else "poligono"
    temi = []
    for t in ds["temi"]:
        lay = meta if t["layer"] == ds["layer"] else chiedi(f"{BASE}/{ds['servizio']}/MapServer/{t['layer']}")
        temi.append({**t, "classi": simbologia(lay, t, ds.get("prefisso"))})
    campi_tema = {t["campo"].lower() for t in temi if t["campo"]}  # il valore del tema sta già nella classe
    grezzi = scarica(url, busta)
    feats, fuori = [], 0
    usati = {}
    for f in grezzi:
        if not f.get("geometry"):
            continue
        g = shape(f["geometry"])
        if not e_di_palermo(f["properties"], g, palermo, nucleo):
            fuori += 1
            continue
        p = {}
        grandezza = lambda nome: next((v for k, v in f["properties"].items() if k.lower() == nome and v), 0)
        for k, v in f["properties"].items():
            kl = k.lower()
            v = pulisci(v)
            if kl in SCARTA or kl in campi_tema or v is None:
                continue
            if campi_server.get(kl, {}).get("type") == "esriFieldTypeDate":
                v = data_iso(v)
            if v is not None:
                p[kl] = v
                usati.setdefault(kl, campi_server.get(kl, {}).get("alias") or k)
        for t in temi:  # la classe di ogni tema, con la simbologia, dentro la feature
            valore = None if t["campo"] is None else str(f["properties"].get(t["campo"])).strip().rstrip(".")  # «2.» è un refuso di «2»
            c = next((c for c in t["classi"] if t["campo"] is None or valore in c["valori"]), None)
            if c is None:  # valore senza simbolo sul server (es. pericolo 0): il server non lo disegna, qui resta in scheda
                p[f"cls_{t['id']}"] = f"Altro ({valore})"
                continue
            p[f"cls_{t['id']}"] = c["label"]
            p[f"col_{t['id']}"] = c["colore"]
            if "bordo" in c:
                p[f"bor_{t['id']}"] = c["bordo"]
            if "pattern" in c:
                p[f"pat_{t['id']}"] = f"pai-{t['id']}-{t['classi'].index(c)}"
        if gtipo == "poligono":
            p["sup_ha"] = round(float(grandezza("shape_area")) / 10000, 4) or None
        else:
            p["lung_m"] = round(float(grandezza("shape_length")), 1) or None
        p = {k: v for k, v in p.items() if v is not None}
        feats.append({"type": "Feature", "geometry": {"type": f["geometry"]["type"], "coordinates": arrotonda(f["geometry"]["coordinates"])}, "properties": p})
    # i valori più gravi in coda: a parità di posizione si disegnano sopra
    t0 = temi[0]
    ordine = {c["label"]: i for i, c in enumerate(t0["classi"])}
    feats.sort(key=lambda f: ordine.get(f["properties"].get(f"cls_{t0['id']}"), -1))
    for t in temi:
        for c in t["classi"]:
            c["n"] = sum(1 for f in feats if f["properties"].get(f"cls_{t['id']}") == c["label"])
    campi = [{"k": k, "label": ETICHETTE.get(k) or usati[k], **({"data": True} if campi_server.get(k, {}).get("type") == "esriFieldTypeDate" else {})} for k in usati]
    return feats, {
        "id": ds["id"], "gruppo": ds["gruppo"], "titolo": ds["titolo"], "geometria": gtipo, "n": len(feats),
        "servizio": f"{BASE}/{ds['servizio']}/MapServer/{ds['layer']}", "campi": campi,
        "temi": [{k: v for k, v in t.items() if k != "layer"} for t in temi],
        **({"sup_ha": round(sum(f["properties"].get("sup_ha") or 0 for f in feats), 2)} if gtipo == "poligono"
           else {"lung_km": round(sum(f["properties"].get("lung_m") or 0 for f in feats) / 1000, 2)}),
    }, fuori


def servizi_nuovi():
    """Servizi del server non ancora previsti qui: avviso, non errore (il PAI si arricchisce nel tempo)."""
    noti = {d["servizio"] for d in DATASETS} | SERVIZI_COMBINATI
    nomi = {s["name"].split("/")[-1] for s in chiedi(BASE)["services"] if s["type"] == "MapServer"}
    return sorted(nomi - noti)


def main():
    senza_pmtiles = "--senza-pmtiles" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    LAVORO.mkdir(parents=True, exist_ok=True)
    palermo = confine()
    nucleo = palermo.buffer(-MARGINE)
    busta = ",".join(str(x) for x in palermo.bounds)
    for nome in servizi_nuovi():
        print(f"attenzione: il servizio «{nome}» è nuovo sul server e non è ancora nell'elenco DATASETS di scripts/pai.py")
    manifest, presenti = [], []
    for ds in DATASETS:
        feats, descr, fuori = costruisci(ds, palermo, nucleo, busta)
        file = LAVORO / f"{ds['id']}.geojson"
        if not feats:
            file.unlink(missing_ok=True)
            print(f"{ds['id']}: nessun elemento a Palermo ({fuori} dei comuni vicini scartati)")
            manifest.append(descr)
            continue
        file.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False), encoding="utf8")
        manifest.append(descr)
        presenti.append((ds["id"], file))
        extra = f"{descr['sup_ha']} ha" if descr["geometria"] == "poligono" else f"{descr['lung_km']} km"
        print(f"{ds['id']}: {len(feats)} elementi a Palermo ({extra}), {fuori} dei comuni vicini scartati")
    if not presenti:
        sys.exit("Nessun vincolo PAI a Palermo: i servizi sono cambiati?")
    (OUT / "pai.json").write_text(json.dumps({"servizio": BASE, "aggiornato": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "dataset": manifest},
                                              ensure_ascii=False, indent=1), encoding="utf8")
    if senza_pmtiles:
        return
    cmd = ["tippecanoe", "-o", str(OUT / "pai.pmtiles"), "-q", "-f", f"-Z{ZOOM_MIN}", f"-z{ZOOM_MAX}", "--no-feature-limit", "--no-tile-size-limit",
           "--no-simplification-of-shared-nodes", "--no-tiny-polygon-reduction"]
    for i, f in presenti:
        cmd += ["-L", f"{i}:{f}"]
    subprocess.run(cmd, check=True)
    print(f"pai.pmtiles: {len(presenti)} strati, zoom {ZOOM_MIN}-{ZOOM_MAX}")


if __name__ == "__main__":
    main()
