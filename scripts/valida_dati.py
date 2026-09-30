#!/usr/bin/env python3
"""Fase 0: verifica i dati in dati/ e genera dati/catalogo.json e docs/catalogo.md."""
import csv
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

from osgeo import gdal, ogr, osr

from fonti import FONTI

gdal.UseExceptions()
ogr.UseExceptions()

ROOT = Path(__file__).resolve().parents[1]
DATI = ROOT / "dati"
DOCS = ROOT / "docs"

MAX_BYTE = 100 * 1024 * 1024
ESTENSIONI_VETTORIALI = {".gpkg", ".geojson"}

CRS_ATTESI = {
    "edifici/edificato.gpkg": 4326,
    "prg-vincoli/Variente_Generale_PRG_2004.gpkg": 4326,
    "terreno/palermo_dtm5m.tif": 6875,
    "terreno/dsm.tif": 6875,
}

# layer e campi su cui il viewer fa affidamento
LAYER_ATTESI = {
    "catasto/particelle.pmtiles": {"particelle": {"Foglio", "Paricella"}},
    "prg-vincoli/prg.pmtiles": {
        "zto": {"ZTO", "DESCRIZION"},
        "va": {"tipo", "descrizone"},
        "vl": {"TIPO"},
        "ns": {"ZTO", "DESCRIZION"},
        "cs": {"Comune"},
    },
    "popolazione/geo_sezioni_2021.pmtiles": {
        "sezioni": {"SEZ21_ID", "POP21", "FAM21", "ABI21", "Quartiere", "UPL", "Circoscrizione"}
    },
    "popolazione/confini_amministrativi.pmtiles": {
        "circoscrizioni": {"Circoscrizione"},
        "quartieri": {"Quartiere"},
        "upl": {"UPL"},
    },
    "edifici/edificato_pop.pmtiles": {"edificato": {"altezza", "pop_stim", "SEZ21_ID", "occupancy"}},
    "civici-omi/civici_0226.pmtiles": {"civici_wgs84": {"Odonimo", "Civico"}},
    "civici-omi/Zone_OMI_2025_II.pmtiles": {"Zone_OMI_2025_II": {"Zona", "Fascia"}},
    "civici-omi/immobili_comunali_2024.pmtiles": {
        "immobili_comunali_2024": {"TIPO", "INDIRIZZO"}
    },
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for blocco in iter(lambda: f.read(1 << 20), b""):
            h.update(blocco)
    return h.hexdigest()


def leggi_manifest(dati: Path = DATI) -> list[dict]:
    with open(dati / "MANIFEST.tsv", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def verifica_manifest(dati: Path = DATI) -> list[str]:
    errori = []
    for r in leggi_manifest(dati):
        rel = r["percorso_dest"]
        p = dati / rel
        if not p.is_file():
            errori.append(f"manca: {rel}")
        elif p.stat().st_size != int(r["dimensione_byte"]):
            errori.append(f"dimensione diversa: {rel}")
        elif sha256_file(p) != r["sha256"]:
            errori.append(f"hash diverso: {rel}")
    return errori


def _ids(path: Path) -> list:
    return [r["SEZ21_ID"] for r in json.loads(path.read_text(encoding="utf-8"))]


def controlla_sezioni(dati: Path = DATI) -> list[str]:
    errori = []
    a = _ids(dati / "popolazione" / "sezioni_indicatori.json")
    b = _ids(dati / "popolazione" / "sezioni_indicatori_2023.json")
    for nome, ids in (("2021", a), ("2023", b)):
        if len(ids) != len(set(ids)):
            errori.append(f"SEZ21_ID duplicati nel {nome}")
    extra = set(b) - set(a)
    if extra:
        errori.append(f"{len(extra)} sezioni 2023 assenti nel 2021")
    return errori


def info_pmtiles(path: Path) -> dict:
    exe = shutil.which("pmtiles") or str(Path.home() / ".local/bin/pmtiles")
    out = subprocess.run(
        [exe, "show", str(path), "--metadata"], capture_output=True, text=True, check=True
    ).stdout
    meta = json.loads(out)
    return {
        "layers": [
            {
                "nome": l["id"],
                "campi": sorted(l.get("fields", {})),
                "minzoom": l.get("minzoom"),
                "maxzoom": l.get("maxzoom"),
            }
            for l in meta.get("vector_layers", [])
        ]
    }


def epsg_di(srs) -> int | None:
    if srs is None:
        return None
    code = srs.GetAuthorityCode(None)
    if code is None:
        try:
            srs = srs.Clone()
            srs.AutoIdentifyEPSG()
            code = srs.GetAuthorityCode(None)
        except RuntimeError:
            return None
    return int(code) if code else None


def info_vettoriale(path: Path) -> dict:
    ds = ogr.Open(str(path))
    layers = []
    for i in range(ds.GetLayerCount()):
        lyr = ds.GetLayerByIndex(i)
        defn = lyr.GetLayerDefn()
        layers.append(
            {
                "nome": lyr.GetName(),
                "geometria": ogr.GeometryTypeToName(lyr.GetGeomType()),
                "n": lyr.GetFeatureCount(),
                "epsg": epsg_di(lyr.GetSpatialRef()),
                "campi": [defn.GetFieldDefn(j).GetName() for j in range(defn.GetFieldCount())],
            }
        )
    return {"layers": layers, "epsg": layers[0]["epsg"] if layers else None}


def info_raster(path: Path) -> dict:
    ds = gdal.Open(str(path))
    gt = ds.GetGeoTransform()
    return {
        "dimensioni": [ds.RasterXSize, ds.RasterYSize],
        "epsg": epsg_di(osr.SpatialReference(wkt=ds.GetProjection())),
        "passo": [round(gt[1], 3), round(-gt[5], 3)],
        "nodata": ds.GetRasterBand(1).GetNoDataValue(),
    }


def costruisci_catalogo(dati: Path = DATI) -> list[dict]:
    voci = []
    for r in leggi_manifest(dati):
        rel = r["percorso_dest"]
        p = dati / rel
        suffisso = p.suffix.lower()
        voce = {
            "percorso": rel,
            "tema": rel.split("/")[0],
            "formato": suffisso.lstrip("."),
            "byte": int(r["dimensione_byte"]),
            "sha256": r["sha256"],
        }
        if suffisso == ".pmtiles":
            voce.update(info_pmtiles(p))
        elif suffisso in ESTENSIONI_VETTORIALI:
            voce.update(info_vettoriale(p))
        elif suffisso == ".tif":
            voce.update(info_raster(p))
        voce.update(FONTI.get(rel, {}))
        voci.append(voce)
    return voci


def controlla_regole(catalogo: list[dict]) -> list[str]:
    per_percorso = {v["percorso"]: v for v in catalogo}
    errori = []
    for voce in catalogo:
        if voce["byte"] > MAX_BYTE:
            errori.append(f"{voce['percorso']}: oltre 100 MB")
    for rel, epsg in CRS_ATTESI.items():
        voce = per_percorso.get(rel)
        if voce is None:
            errori.append(f"manca nel catalogo: {rel}")
        elif voce.get("epsg") != epsg:
            errori.append(f"{rel}: EPSG {voce.get('epsg')} invece di {epsg}")
    for rel, attesi in LAYER_ATTESI.items():
        voce = per_percorso.get(rel)
        if voce is None:
            errori.append(f"manca nel catalogo: {rel}")
            continue
        trovati = {l["nome"]: set(l["campi"]) for l in voce.get("layers", [])}
        for nome, campi in attesi.items():
            if nome not in trovati:
                errori.append(f"{rel}: layer {nome} assente")
            elif campi - trovati[nome]:
                errori.append(f"{rel}/{nome}: campi mancanti {sorted(campi - trovati[nome])}")
    return errori


def _dettagli(voce: dict) -> str:
    if "layers" in voce:
        return ", ".join(
            f"{l['nome']}" + (f" ({l['n']})" if "n" in l else "") for l in voce["layers"]
        )
    if "dimensioni" in voce:
        return f"{voce['dimensioni'][0]}×{voce['dimensioni'][1]} px, EPSG:{voce['epsg']}"
    return ""


def scrivi_report(catalogo: list[dict], percorso: Path = DOCS / "catalogo.md") -> None:
    righe = [
        "# Catalogo dati",
        "",
        "Generato da `scripts/valida_dati.py`. Non modificare a mano.",
        "",
        "| File | MB | Dettagli | Fonte |",
        "|---|---:|---|---|",
    ]
    for v in catalogo:
        righe.append(
            f"| `{v['percorso']}` | {v['byte'] / 1e6:.1f} | {_dettagli(v)} | {v.get('fonte', '')} |"
        )
    percorso.write_text("\n".join(righe) + "\n", encoding="utf-8")


def main() -> int:
    errori = verifica_manifest() + controlla_sezioni()
    catalogo = costruisci_catalogo()
    errori += controlla_regole(catalogo)
    (DATI / "catalogo.json").write_text(
        json.dumps(catalogo, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    scrivi_report(catalogo)
    for e in errori:
        print("ERRORE:", e, file=sys.stderr)
    print(f"{len(catalogo)} file catalogati, {len(errori)} errori")
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
