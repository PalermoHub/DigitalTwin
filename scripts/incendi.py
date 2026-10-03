"""Scarica gli incendi del Comune di Palermo dal Censimento Incendi della Regione Siciliana (SIF, Corpo Forestale).

Uso: python3 scripts/incendi.py            (richiede tippecanoe per il PMTiles)
     python3 scripts/incendi.py --senza-pmtiles

Fonte: https://sifweb.regione.sicilia.it/arcgis/rest/services/Censimento_Incendi/MapServer
Ogni anno è un layer del servizio («Incendi AAAA»): i nuovi anni si scoprono da soli, non serve toccare lo script.

Scrive in dati/incedi/:
  incendi_AAAA.geojson   incendi dell'anno nel comune di Palermo (WGS84, campi normalizzati)
  confine_comunale.geojson  confine del Comune (per riconoscere gli incendi di Palermo)
  anni.json              un elemento per anno: colori della simbologia del server, numero di incendi, ettari
  incendi.pmtiles        tutti gli anni in un solo strato «incendi», zoom 12–18 (colori e anno dentro ogni feature)
"""
import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SERVIZIO = "https://sifweb.regione.sicilia.it/arcgis/rest/services/Censimento_Incendi/MapServer"
RADICE = Path(__file__).resolve().parent.parent
OUT = RADICE / "dati" / "incedi"
CONFINE = OUT / "confine_comunale.geojson"  # copia del confine del comune: serve anche al workflow, dove dati/monumenti/ non c'è
ISTAT_PALERMO = "082053"
ZOOM_MIN, ZOOM_MAX = 12, 18


def chiedi(url, **parametri):
    q = urllib.parse.urlencode({"f": "json", **parametri})
    for tentativo in range(3):
        try:
            with urllib.request.urlopen(f"{url}?{q}", timeout=120) as r:
                d = json.load(r)
            if "error" in d:
                raise RuntimeError(d["error"])
            return d
        except Exception:
            if tentativo == 2:
                raise


def corto(chiave):
    """Campo di una tabella unita («DATI_WEB.DBO.X.CAMPO») -> «CAMPO»."""
    return chiave.rsplit(".", 1)[-1]


def proprieta_piatte(p):
    """Un layer unisce due tabelle con campi omonimi: vince la prima (la tabella denormalizzata)."""
    out = {}
    for k, v in p.items():
        out.setdefault(corto(k), v)
    return out


def data_iso(v):
    """Epoch ms (campi data ArcGIS), «gg/mm/aaaa» o «aaaa/mm/gg hh:mm:ss» -> «aaaa-mm-gg»."""
    if v in (None, "", " "):
        return None
    if isinstance(v, (int, float)):
        return datetime.fromtimestamp(v / 1000, timezone.utc).strftime("%Y-%m-%d")
    s = str(v).strip()
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", s)
    if m:
        return f"{m[3]}-{m[2]}-{m[1]}"
    m = re.match(r"(\d{4})/(\d{2})/(\d{2})", s)
    return f"{m[1]}-{m[2]}-{m[3]}" if m else None


def numero(v, cifre=4):
    return None if v in (None, "") else round(float(v), cifre)


def testo(v):
    v = None if v is None else str(v).strip()
    return v or None


def e_palermo(p):
    """Il comune sta in campi diversi a seconda dell'anno: nome (DESCRIPTION, Comune) o codice ISTAT (COM)."""
    nome = str(p.get("DESCRIPTION") or p.get("Comune") or "").strip().upper()
    return nome == "PALERMO" or str(p.get("COM") or "").strip() == ISTAT_PALERMO


def normalizza(p, anno):
    """Schema comune a tutti gli anni. Superfici in ettari; i campi che l'anno non ha restano assenti."""
    if "Area" in p:  # 2009: area in m²
        sup, sup_boscata, sup_non_boscata = numero(p["Area"] / 10000), None, None
        data = data_iso(p.get("D_Incendio"))
    elif anno == 2007:  # 2007: SUP_CALC / AREA_TOT in m² (verificato sull'area della geometria); dal 2008 in ettari
        sup, sup_boscata, sup_non_boscata = numero(p["SUP_CALC"] / 10000), None, None
        data = data_iso(p.get("DATA_INC"))
    else:  # TOTSUP = ettari; 2008: SUP_CALC / AREA_TOT
        sup = numero(p.get("TOTSUP", p.get("SUP_CALC", p.get("AREA_TOT"))))
        sup_boscata, sup_non_boscata = numero(p.get("TOTSUPBOSCATA")), numero(p.get("TOTSUPNNBOSCATA"))
        data = data_iso(p.get("DTAINIZIOFUOCO") or p.get("DTAINIZIOFUOCO1") or p.get("DATA_INC"))
    campi = {
        "anno": anno,
        "id": p.get("ID") if p.get("ID") is not None else p.get("OBJECTID"),
        "data": data,
        "localita": testo(p.get("LOCALITA") or p.get("Localita") or p.get("LOC")),
        "sup_ha": sup,
        "sup_boscata_ha": sup_boscata,
        "sup_non_boscata_ha": sup_non_boscata,
        "altre_sup_forestali_ha": numero(p.get("ALTRESUPFORESTALI")),
        "altezza_scottatura": testo(p.get("ALTEZZASCOTT")),
        "luogo_inizio": testo(p.get("LUOGOINIZIOINC")),
        "uso": testo(p.get("USO")),
        "squadre_aib": p.get("TOTSQAIB"),
        "fine_intervento": data_iso(p.get("DTAFINEINTE") or p.get("DTAFINEINTERV") or p.get("DATAFINEINTERV")),
        "durata_min": p.get("MINDURATAI"),
        "tipo_evento": testo(p.get("SOTTO_EVEN")),
        "costo_spegnimento_eur": numero(p.get("COSTOSPEGN"), 2),
        "feriti": p.get("NUME_FERIT"),
        "periti": p.get("NUME_PERIT"),
    }
    return {k: v for k, v in campi.items() if v not in (None, "")}


def colore(c):
    """[r,g,b,a] ArcGIS -> («#rrggbb», opacità 0-1)."""
    return "#%02x%02x%02x" % tuple(c[:3]), round(c[3] / 255, 2)


def simbologia(layer):
    """Colori del renderer del server: riempimento, bordo, spessore del bordo, trasparenza del layer."""
    di = layer["drawingInfo"]
    sim = di["renderer"]["symbol"]
    fill, a_fill = colore(sim["color"])
    bordo, a_bordo = colore(sim["outline"]["color"])
    trasp = (di.get("transparency") or 0) / 100
    return {
        "colore": fill, "bordo": bordo, "spessore_bordo": sim["outline"].get("width", 0.4),
        "opacita": round(a_fill * (1 - trasp), 2), "opacita_bordo": round(a_bordo * (1 - trasp), 2),
    }


def confine():
    from shapely.geometry import shape
    from shapely.ops import unary_union
    g = json.loads(CONFINE.read_text(encoding="utf8"))
    return unary_union([shape(f["geometry"]) for f in g["features"]])


def scarica(layer_id, busta):
    """Tutte le feature dentro il rettangolo di Palermo, in WGS84 (il server non pagina: se supera il limite è un errore)."""
    d = chiedi(f"{SERVIZIO}/{layer_id}/query", where="1=1", geometry=busta, geometryType="esriGeometryEnvelope",
               inSR=4326, spatialRel="esriSpatialRelIntersects", outFields="*", outSR=4326, f="geojson")
    if d.get("exceededTransferLimit"):
        sys.exit(f"Layer {layer_id}: oltre il limite di record del server, restringere la ricerca")
    return d["features"]


def main():
    senza_pmtiles = "--senza-pmtiles" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    palermo = confine()
    busta = ",".join(str(x) for x in palermo.bounds)
    layers = [(int(m[1]), l["id"]) for l in chiedi(SERVIZIO)["layers"] if (m := re.fullmatch(r"Incendi (\d{4})", l["name"]))]
    if not layers:
        sys.exit("Nessun layer «Incendi AAAA» nel servizio: struttura cambiata?")
    anni, tutte = [], []
    print(f"{len(layers)} anni nel servizio: {min(a for a, _ in layers)}-{max(a for a, _ in layers)}")
    for anno, lid in sorted(layers, reverse=True):
        sim = simbologia(chiedi(f"{SERVIZIO}/{lid}"))
        from shapely.geometry import shape
        feats, fuori = [], 0
        for f in scarica(lid, busta):
            p = proprieta_piatte(f["properties"])
            if not f.get("geometry"):
                continue
            if not e_palermo(p):
                fuori += 1
                continue
            if not shape(f["geometry"]).intersects(palermo):
                print(f"  attenzione {anno}: incendio {p.get('ID') or p.get('OBJECTID')} dato come Palermo ma fuori dal confine comunale")
            feats.append({"type": "Feature", "geometry": f["geometry"], "properties": normalizza(p, anno)})
        feats.sort(key=lambda f: (f["properties"].get("data") or "", f["properties"].get("id") or 0))
        (OUT / f"incendi_{anno}.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False), encoding="utf8")
        ettari = round(sum(f["properties"].get("sup_ha") or 0 for f in feats), 2)
        anni.append({"anno": anno, "layer": lid, "n": len(feats), "ettari": ettari, **sim})
        for f in feats:  # la simbologia viaggia dentro ogni feature: il layer della mappa non deve conoscere gli anni
            f["properties"].update(colore=sim["colore"], bordo=sim["bordo"], opacita=sim["opacita"])
        tutte += feats
        print(f"{anno}: {len(feats)} incendi a Palermo ({ettari} ha), {fuori} di altri comuni scartati")
    if not tutte:
        sys.exit("Nessun incendio a Palermo in nessun anno: i campi del servizio sono cambiati?")
    (OUT / "anni.json").write_text(json.dumps({"servizio": SERVIZIO, "aggiornato": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "anni": anni},
                                              ensure_ascii=False, indent=1), encoding="utf8")
    if senza_pmtiles:
        return
    tmp = OUT / "_tutti.geojson"
    tmp.write_text(json.dumps({"type": "FeatureCollection", "features": tutte}, ensure_ascii=False), encoding="utf8")
    try:
        subprocess.run(["tippecanoe", "-o", str(OUT / "incendi.pmtiles"), "-q", "-f", "-l", "incendi", f"-Z{ZOOM_MIN}", f"-z{ZOOM_MAX}",
                        "--no-feature-limit", "--no-tile-size-limit", "--no-simplification-of-shared-nodes", str(tmp)], check=True)
    finally:
        tmp.unlink(missing_ok=True)
    print(f"incendi.pmtiles: {len(tutte)} incendi, zoom {ZOOM_MIN}-{ZOOM_MAX}")


if __name__ == "__main__":
    main()
