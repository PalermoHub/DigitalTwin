"""Immobili dichiarati al MEF: beni del Comune di Palermo agganciati ai poligoni dell'edificato.

Uso: python3 scripts/mef_immobili.py [--anno 2023] [--zip FILE] [--pmtiles FILE] [--uscita DIR]

Fonte dei beni: Ministero dell'economia e delle finanze, Dipartimento del Tesoro, Censimento degli immobili pubblici
(open data, CC BY 4.0): https://www.de.mef.gov.it/it/attivita_istituzionali/patrimonio_pubblico/censimento_immobili_pubblici/open_data_immobili/
Fonte degli edifici: Comune di Palermo, unità volumetriche CTC (PMTiles pubblicato da PalermoHub).

Scrive in dati/mef-immobili/:
  mef_immobili.geojson  un poligono per edificio con almeno un bene, un punto per ogni bene che non si aggancia
  mef_immobili.csv      una riga per bene, con l'esito dell'aggancio
  riepilogo.json        conteggi
  README.md             anno, fonte, licenza
"""
import argparse
import csv
import gzip
import io
import json
import math
import re
import sys
import tempfile
import urllib.parse
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

from mef_geo import (SOGLIA_M, a_lonlat, aggancia, aggancia_uno, frammenti_pmtiles, frammenti_tile, in_metri,  # noqa: F401
                     motivo_punto, punto_m, ricomponi, tile_xy)
from mef_fonti import (carica_immobili, carica_particelle, carica_riferimenti, chiavi_richieste,
                       controlla_particelle)
from mef_localizza import Contesto, Rif, localizza_tutti

RADICE = Path(__file__).resolve().parent.parent
USCITA = RADICE / "dati" / "mef-immobili"
SITO = "https://www.de.mef.gov.it"
PAGINA = SITO + "/it/attivita_istituzionali/patrimonio_pubblico/censimento_immobili_pubblici/open_data_immobili/"
EDIFICATO = "https://gbvitrano.github.io/palermo_popolazione/data/edificato.pmtiles"
COMUNE = "G273"                          # codice catastale di Palermo
AREA = (13.04, 37.9785, 13.55, 38.2919)  # lon min, lat min, lon max, lat max (LIMITI di js/core/config.js)
ZOOM = 16
MIN_BENI, MAX_BENI = 1000, 50000
MIN_EDIFICI = 50000                      # l'edificato completo ne ha 111.844

COLONNE = [
    "Codice Comune del bene", "ID bene", "Natura del bene", "Latitudine", "Longitudine",
    "Fonte Georeferenziazione", "Precisione Georeferenziazione", "Indirizzo", "Numero Civico",
    "Identificativo catastale", "Tipologia Bene Immobile", "Superficie (mq)", "Cubatura (mc)",
    "Epoca Costruzione", "Vinc. culturale/paesaggistico", "Natura Giuridica del Bene",
    "Utilizzo del bene", "Finalità", "Stato Accatastamento", "Amministrazione Denominazione",
]


def scarica(url: str, tentativi: int = 3) -> bytes:
    ultimo = None
    for _ in range(tentativi):
        try:
            richiesta = urllib.request.Request(url, headers={"User-Agent": "DigitalTwin-Palermo/1.0"})
            with urllib.request.urlopen(richiesta, timeout=180) as r:
                return r.read()
        except Exception as e:  # rete: si riprova, poi si segnala
            ultimo = e
    raise SystemExit(f"download fallito: {url} ({ultimo})")


# --- anno e archivio --------------------------------------------------------

def ultimo_anno(html: str) -> int:
    anni = {int(a) for a in re.findall(r"dati_immobili_(\d{4})\.html", html)}
    if not anni:
        raise SystemExit("nella pagina del MEF non ci sono link «dati_immobili_<anno>.html»: la struttura del sito è cambiata?")
    return max(anni)


def url_archivio(html: str) -> str:
    trovato = re.search(r'href="([^"]*Imm_Amministrazioni_Comunali_SICILIA_\d{4}\.zip)"', html, re.I)
    if not trovato:
        raise SystemExit("nella pagina dell'anno manca lo ZIP «Amministrazioni Comunali» della Sicilia")
    return urllib.parse.urljoin(SITO + "/", trovato.group(1))


def csv_da_zip(dati_zip: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(dati_zip)) as z:
        nomi = [n for n in z.namelist() if n.lower().endswith(".csv")]
        if len(nomi) != 1:
            raise SystemExit(f"lo ZIP del MEF dovrebbe contenere un solo CSV, ne contiene {len(nomi)}")
        return z.read(nomi[0])


# --- lettura e filtro -------------------------------------------------------

def leggi_csv(dati: bytes) -> list[dict]:
    testo = dati.decode("cp1252", errors="replace")
    # newline="" : le righe finiscono solo su \r\n, mai su \x85 (che in cp1252 è «…»)
    lettore = csv.DictReader(io.StringIO(testo, newline=""), delimiter=";")
    mancanti = [c for c in COLONNE if c not in (lettore.fieldnames or [])]
    if mancanti:
        raise SystemExit(f"nel CSV del MEF mancano le colonne: {', '.join(mancanti)}")
    return list(lettore)


def numero(valore) -> float | None:
    v = (valore or "").strip()
    if not v:
        return None
    if "," in v:
        v = v.replace(".", "").replace(",", ".")
    try:
        return float(v)
    except ValueError:
        return None


def beni_del_comune(righe) -> list[dict]:
    visti, out = set(), []
    for r in righe:
        if (r.get("Codice Comune del bene") or "").strip() != COMUNE:
            continue
        i = (r.get("ID bene") or "").strip()
        if not i or i in visti:
            continue
        visti.add(i)
        out.append(r)
    return out


def precisione(r: dict) -> str:
    if (r.get("Fonte Georeferenziazione") or "").strip() == "IDENTIFICATIVI_CATASTALI":
        return "catastale"
    return {"CIVICO": "civico", "STRADA": "strada"}.get((r.get("Precisione Georeferenziazione") or "").strip().upper(), "comune")


def _maiuscola(s: str) -> str:
    return s[:1].upper() + s[1:]


def bene(r: dict) -> dict | None:
    lat, lon = numero(r.get("Latitudine")), numero(r.get("Longitudine"))
    if lat is None or lon is None:
        return None
    indirizzo = " ".join(x for x in ((r.get("Indirizzo") or "").strip(), (r.get("Numero Civico") or "").strip()) if x)
    sup, cub = numero(r.get("Superficie (mq)")), numero(r.get("Cubatura (mc)"))
    campi = {
        "tipologia": (r.get("Tipologia Bene Immobile") or "").strip(),
        "indirizzo": _maiuscola(indirizzo),
        "superficie_mq": round(sup, 1) if sup else None,
        "cubatura_mc": round(cub, 1) if cub else None,
        "epoca": (r.get("Epoca Costruzione") or "").strip(),
        "catastale": (r.get("Identificativo catastale") or "").strip(),
        "utilizzo": (r.get("Utilizzo del bene") or "").strip(),
        "finalita": (r.get("Finalità") or "").strip(),
        "vincolo": (r.get("Vinc. culturale/paesaggistico") or "").strip(),
        "giuridica": (r.get("Natura Giuridica del Bene") or "").strip(),
        "accatastamento": (r.get("Stato Accatastamento") or "").strip(),
        "amministrazione": (r.get("Amministrazione Denominazione") or "").strip(),
    }
    return {
        "id": r["ID bene"].strip(),
        "natura": _maiuscola((r.get("Natura del bene") or "").strip().lower()),
        **{k: v for k, v in campi.items() if v not in (None, "")},
        "precisione": precisione(r),
        "lat": lat,
        "lon": lon,
    }


def nell_area(b: dict) -> bool:
    lon0, lat0, lon1, lat1 = AREA
    return lon0 <= b["lon"] <= lon1 and lat0 <= b["lat"] <= lat1


# --- edificato --------------------------------------------------------------

def leggi_edificato(percorso: Path) -> dict:
    return ricomponi(frammenti_pmtiles(percorso, ZOOM))


def controlla_edifici(edifici: dict) -> None:
    if len(edifici) < MIN_EDIFICI:
        raise SystemExit(f"dall'edificato sono stati letti solo {len(edifici)} edifici (ne servono almeno {MIN_EDIFICI}): file incompleto?")


# --- aggregazione e uscita --------------------------------------------------

def pubblico(b: dict) -> dict:
    return {k: v for k, v in b.items() if k not in ("lat", "lon")}


def _beni_json(lista) -> str:
    return json.dumps([pubblico(b) for b in lista], ensure_ascii=False, separators=(",", ":"))


def proprieta_piatte(lista) -> dict:
    """Campi semplici per la tabella dati del sito (legge le proprietà, non il JSON `beni`)."""
    def uniti(chiave):
        visti = []
        for b in lista:
            v = b.get(chiave)
            if v and v not in visti:
                visti.append(v)
        return "; ".join(visti) or None

    piatte = {"id_bene": lista[0]["id"], "tipologia": uniti("tipologia"), "indirizzo": lista[0].get("indirizzo"), "catastale": uniti("catastale"),
              "localizzazione": uniti("localizzazione"), "verifica": uniti("verifica")}
    mq = [b["superficie_mq"] for b in lista if b.get("superficie_mq") is not None]
    piatte["superficie_mq"] = round(sum(mq), 2) if mq else None
    return {k: v for k, v in piatte.items() if v is not None}


def _geojson(geom) -> dict:
    return json.loads(shapely.to_geojson(shapely.set_precision(geom, 1e-6)))


def costruisci(beni, locs: dict, props_edifici: dict, anno: int) -> list:
    """Un elemento per poligono (edificio, terreno, poligono di un layer) e un punto per ogni bene senza poligono."""
    per_poligono, punti = {}, []
    for b in beni:
        loc = locs[b["id"]]
        voce = {**b, "localizzazione": loc.fonte, "verifica": loc.verifica}
        if loc.forma == "punto":
            punti.append((voce, loc))
        else:
            per_poligono.setdefault(loc.chiave, (loc, []))[1].append(voce)
    feats = []
    for chiave, (loc, lista) in sorted(per_poligono.items()):
        prop = {"forma": loc.forma, "id_poligono": chiave, "n_beni": len(lista), "posizione": loc.forma, "anno": anno,
                **proprieta_piatte(lista), "beni": _beni_json(lista)}
        if chiave.startswith("e") and chiave[1:].isdigit():
            for k in ("altezza", "occupancy"):
                v = props_edifici.get(int(chiave[1:]), {}).get(k)
                if v is not None:
                    prop[k] = v
        feats.append({"type": "Feature", "properties": prop, "geometry": _geojson(loc.geom)})
    for voce, loc in punti:
        feats.append({
            "type": "Feature",
            "properties": {"forma": "punto", "n_beni": 1, "posizione": loc.motivo, "anno": anno, **proprieta_piatte([voce]), "beni": _beni_json([voce])},
            "geometry": {"type": "Point", "coordinates": [round(voce["lon"], 6), round(voce["lat"], 6)]},
        })
    return feats


def verifica(beni, feats) -> None:
    visti = [b["id"] for f in feats for b in json.loads(f["properties"]["beni"])]
    if sorted(visti) != sorted(b["id"] for b in beni):
        raise SystemExit(f"incoerenza: {len(beni)} beni letti, {len(visti)} nel risultato")
    for f in feats:
        if f["properties"]["n_beni"] != len(json.loads(f["properties"]["beni"])):
            raise SystemExit("incoerenza: n_beni diverso dall'elenco dei beni")


def _conta(valori) -> dict:
    out = {}
    for v in valori:
        out[v] = out.get(v, 0) + 1
    return out


def riepilogo(beni, scartati: int, feats, locs: dict) -> dict:
    per_forma = {f: [x for x in feats if x["properties"]["forma"] == f] for f in ("edificio", "terreno", "punto")}
    per_verifica = _conta(loc.verifica for loc in locs.values())
    return {
        "beni": len(beni),
        "in_edifici": sum(f["properties"]["n_beni"] for f in per_forma["edificio"]),
        "edifici": len(per_forma["edificio"]),
        "in_terreni": sum(f["properties"]["n_beni"] for f in per_forma["terreno"]),
        "terreni": len(per_forma["terreno"]),
        "punti": len(per_forma["punto"]),
        "punti_per_motivo": _conta(f["properties"]["posizione"] for f in per_forma["punto"]),
        "per_localizzazione": _conta(loc.fonte for loc in locs.values()),
        "per_verifica": per_verifica,
        "corretti": per_verifica.get("corretto", 0),
        "senza_posizione": scartati,
        "max_beni_per_edificio": max((f["properties"]["n_beni"] for f in per_forma["edificio"]), default=0),
    }


def scrivi(uscita: Path, anno: int, beni, locs: dict, feats, riep: dict) -> None:
    uscita.mkdir(parents=True, exist_ok=True)
    (uscita / "mef_immobili.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    with open(uscita / "mef_immobili.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["id_bene", "esito", "id_poligono", "motivo", "localizzazione", "verifica", "tipologia", "indirizzo"])
        for b in beni:
            loc = locs[b["id"]]
            w.writerow([b["id"], loc.forma, loc.chiave, loc.motivo or "", loc.fonte,
                        loc.verifica, b.get("tipologia", ""), b.get("indirizzo", "")])
    (uscita / "riepilogo.json").write_text(json.dumps({"anno": anno, **riep}, ensure_ascii=False, indent=1), encoding="utf-8")
    (uscita / "README.md").write_text(
        f"# Immobili dichiarati al MEF (Comune di Palermo)\n\n"
        f"Anno del censimento: **{anno}**. Generato il {date.today().isoformat()} da `scripts/mef_immobili.py` (workflow «Aggiorna MEF»).\n\n"
        f"- Beni: {riep['beni']} · in edifici: {riep['in_edifici']} (in {riep['edifici']} edifici) · in terreni: {riep['in_terreni']} "
        f"({riep['terreni']} particelle) · punti: {riep['punti']} {riep['punti_per_motivo']}\n"
        f"- Localizzazione: {riep['per_localizzazione']} · verifica: {riep['per_verifica']} (beni corretti rispetto alla posizione MEF: {riep['corretti']})\n"
        f"- Beni scartati perché senza posizione utilizzabile: {riep['senza_posizione']}\n\n"
        f"Fonti: Ministero dell'economia e delle finanze, Dipartimento del Tesoro, Censimento degli immobili pubblici "
        f"(open data, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)); poligoni degli edifici: Comune di Palermo, unità volumetriche CTC; "
        f"particelle: SITR Regione Siciliana e Agenzia delle Entrate; immobili comunali: Comune di Palermo.\n\n"
        f"La posizione di ogni bene è verificata con il catasto (foglio e particella), poi con i layer già mappati (immobili comunali, scuole, "
        f"seggi, uffici, monumenti), poi con la posizione dichiarata. Gli edifici portano l'elenco dei beni (`beni`, JSON).\n",
        encoding="utf-8")


# --- programma --------------------------------------------------------------

PARTICELLE = "https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles"
IMMOBILI = "https://palermohub.github.io/PRG2004/immobili/immobili_comunali_2024.pmtiles"


def _file(percorso: str | None, url: str, cartella: Path, nome: str) -> Path:
    if percorso:
        return Path(percorso)
    destinazione = cartella / nome
    destinazione.write_bytes(scarica(url))
    return destinazione


def main(argv=None) -> None:
    a = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    a.add_argument("--anno", type=int, help="anno del censimento (default: l'ultimo pubblicato)")
    a.add_argument("--zip", help="ZIP del MEF già scaricato (non usa la rete)")
    a.add_argument("--pmtiles", help="edificato.pmtiles già scaricato")
    a.add_argument("--particelle", help="particelle.pmtiles già scaricato")
    a.add_argument("--immobili", help="immobili_comunali_2024.pmtiles già scaricato")
    a.add_argument("--radice", default=str(RADICE / "dati"), help="cartella dati/ con scuole, uffici e monumenti")
    a.add_argument("--uscita", default=str(USCITA))
    args = a.parse_args(argv)

    if args.zip:
        trovato = re.search(r"(\d{4})", Path(args.zip).name)
        anno = args.anno or (int(trovato.group(1)) if trovato else date.today().year)
        dati_zip = Path(args.zip).read_bytes()
    else:
        home = scarica(PAGINA).decode("utf-8", errors="replace")
        anno = args.anno or ultimo_anno(home)
        pagina = scarica(f"{PAGINA}dati_immobili_{anno}.html").decode("utf-8", errors="replace")
        dati_zip = scarica(url_archivio(pagina))
    print(f"Censimento MEF {anno}", file=sys.stderr)

    righe = beni_del_comune(leggi_csv(csv_da_zip(dati_zip)))
    tutti = [bene(r) for r in righe]
    beni = [b for b in tutti if b is not None and nell_area(b)]
    scartati = len(righe) - len(beni)
    if not MIN_BENI <= len(beni) <= MAX_BENI:
        raise SystemExit(f"{len(beni)} beni di Palermo nel CSV: fuori dall'intervallo atteso ({MIN_BENI}–{MAX_BENI})")
    print(f"Beni di Palermo: {len(beni)} (scartati senza posizione utilizzabile: {scartati})", file=sys.stderr)

    with tempfile.TemporaryDirectory() as tmp:
        cartella = Path(tmp)
        edifici = leggi_edificato(_file(args.pmtiles, EDIFICATO, cartella, "edificato.pmtiles"))
        controlla_edifici(edifici)
        print(f"Edifici letti: {len(edifici)}", file=sys.stderr)
        chiavi = chiavi_richieste(beni)
        particelle = carica_particelle(_file(args.particelle, PARTICELLE, cartella, "particelle.pmtiles"), chiavi)
        controlla_particelle(particelle, chiavi)
        print(f"Particelle trovate: {len(particelle)} su {len(chiavi)} richieste", file=sys.stderr)
        immobili = carica_immobili(_file(args.immobili, IMMOBILI, cartella, "immobili.pmtiles"))
        print(f"Immobili comunali: {len(immobili)}", file=sys.stderr)

    riferimenti = [Rif(r["fonte"], r["id"], Point(r["lon"], r["lat"]), r["indirizzo"], r["poligono"])
                   for r in carica_riferimenti(Path(args.radice))]
    print(f"Layer già mappati: {len(riferimenti)} elementi", file=sys.stderr)
    ctx = Contesto({i: g for i, (g, _) in edifici.items()}, particelle, immobili, riferimenti)
    locs = localizza_tutti(beni, ctx)
    feats = costruisci(beni, locs, {i: p for i, (_, p) in edifici.items()}, anno)
    verifica(beni, feats)
    riep = riepilogo(beni, scartati, feats, locs)
    scrivi(Path(args.uscita), anno, beni, locs, feats, riep)
    print(json.dumps(riep, ensure_ascii=False), file=sys.stderr)


if __name__ == "__main__":
    main()
