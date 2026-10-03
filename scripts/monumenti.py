"""Monumenti del portale turismo del Comune di Palermo -> dati/monumenti/.

Passi, ciascuno ripetibile:
  python3 scripts/monumenti.py scarica   elenco + dettaglio (coordinate) + miniature -> dati/monumenti/
  python3 scripts/monumenti.py correggi  confronta le coordinate del portale con OpenStreetMap e l'indice civici -> correzioni.json
  python3 scripts/monumenti.py riduci    (ri)comprime le foto gia' scaricate
  python3 scripts/monumenti.py abbina    punto -> poligono di edificato.gpkg -> monumenti.geojson (punti) + monumenti_edifici.geojson (poligoni)

Le pagine scaricate restano in dati/monumenti/_cache/: rilanciare "scarica" non ripete le richieste.
Il portale ammette la scansione (robots.txt: Allow /); tra una richiesta e l'altra si aspetta PAUSA secondi.
"""
import html
import io
import json
import math
import re
import subprocess
import sys
import unicodedata
import time
from pathlib import Path

import requests
from PIL import Image
from shapely import STRtree, set_precision
from shapely.affinity import scale
from shapely.geometry import Point, mapping, shape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "monumenti"
CACHE = OUT / "_cache"
FOTO = OUT / "foto"
CORREZIONI = OUT / "correzioni.json"
CONFINE = OUT / "confine_comunale.geojson"  # Palermo: OSM unito a ISTAT (vedi la proprieta' «fonte»)
EDIFICATO = ROOT / "dati" / "edifici" / "edificato.gpkg"

BASE = "https://turismo.comune.palermo.it/"
PAUSA = 0.4
RAGGIO_PORTA_M = 12  # porte e archi sono fatti da piu' edifici (i piloni): si prendono tutti quelli entro questo raggio
PAROLE_PORTA = {"porta", "porte", "portale", "arco", "archi"}
SOGLIA_M = 25  # oltre questa distanza dal punto non si abbina nessun edificio
M_PER_GRADO = 111_320
FOTO_LATO = 480  # le immagini del portale a volte sono originali da 10+ MB: si riducono
SOGLIA_DISACCORDO_M = 100  # oltre, le coordinate del portale non coincidono con la fonte indipendente
RAGGIO_CONTENUTO_M = 300  # il nome solo contenuto (es. «Teatro dei Pupi») e' meno affidabile: raggio minore
RAGGIO_OSM_M = 1000  # un omonimo OSM piu' lontano e' un altro luogo (es. San Francesco d'Assisi a Misilmeri)
CIVICI_URL = "https://palermohub.opendatasicilia.it/pmtiles/civici_index.json"
OVERPASS = "https://overpass-api.de/api/interpreter"
OVERPASS_QL = """[out:json][timeout:120];
(
 nwr["name"]["historic"](37.95,13.2,38.25,13.5);
 nwr["name"]["amenity"~"place_of_worship|theatre|library|marketplace|arts_centre"](37.95,13.2,38.25,13.5);
 nwr["name"]["tourism"~"museum|gallery|attraction|artwork"](37.95,13.2,38.25,13.5);
 nwr["name"]["leisure"~"park|garden"](37.95,13.2,38.25,13.5);
 nwr["name"]["building"~"church|cathedral|chapel|palace|castle|monastery|civic|public"](37.95,13.2,38.25,13.5);
);
out center tags;"""
# Posizioni verificate a mano (id -> lon, lat, motivo) dove ne' il portale ne' OSM per nome bastano
MANUALI = {
    "16-67": (13.351843, 38.168011, "Santuario di Santa Rosalia: il portale lo colloca ~2 km a sud, sul versante sbagliato di Monte Pellegrino (Nominatim)"),
    "23-422": (13.367519, 38.115097, "Giardino dei Giusti: senza indirizzo sul portale (Nominatim)"),
}
LIMITI = (13.1, 37.9, 13.6, 38.4)  # lon min, lat min, lon max, lat max: scarta coordinate errate

# "Cosa Vedere" (tp=68): codice del gruppo -> categoria
CATEGORIE = {
    16: "Chiese ed Oratori", 17: "Monumenti", 18: "Teatri", 19: "Dimore e Ville storiche", 20: "Palazzi",
    21: "Gallerie d'Arte e Musei", 22: "Biblioteche", 23: "Giardini e Spazi verdi", 24: "Mercati storici",
    25: "Zone Archeologiche",
}


# ---------- parsing (funzioni pure) ----------

def _testo(frammento):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", frammento))).strip()


def parse_elenco(pagina, det):
    """Elenco di un gruppo: id, nome, descrizione breve, miniatura, link alla scheda del portale."""
    luoghi = []
    for blocco in re.findall(r'<article class="badge">(.*?)</article>', pagina, re.S):
        link = re.search(r'href="(palermo-welcome-luogo-dettaglio\.php\?[^"]*?id=(\d+))"', blocco)
        nome = re.search(r"<h2>(.*?)</h2>", blocco, re.S)
        if not link or not nome:
            continue
        foto = re.search(r'<img src="([^"]+)"', blocco)
        descrizione = re.search(r'<div class="div100"[^>]*>(.*?)</div>', blocco, re.S)
        luoghi.append({
            "id": f"{det}-{link.group(2)}",
            "nome": _testo(nome.group(1)),
            "descrizione": _testo(descrizione.group(1)) if descrizione else "",
            "foto_url": foto.group(1) if foto else None,
            "url": BASE + html.unescape(link.group(1)),
        })
    return luoghi


def parse_coordinate(pagina):
    """(lon, lat) dalla meta geo.position della scheda; None se assente o fuori da Palermo."""
    r = re.search(r'<meta content="(-?[\d.]+);(-?[\d.]+)" name="geo\.position">', pagina)
    if not r:
        return None
    lat, lon = float(r.group(1)), float(r.group(2))
    if not (LIMITI[0] <= lon <= LIMITI[2] and LIMITI[1] <= lat <= LIMITI[3]):
        return None
    return lon, lat


# ---------- correzione delle coordinate ----------

def _norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join(re.sub(r"[^a-z0-9 ]", " ", re.sub(r"\(.*?\)", " ", s)).split())


def _senza_alias(x):
    return re.sub(r"\s(detta|detto|o|ex)\b.*$", "", _norm(x)).strip()


def nome_esatto(a, b):
    """Nome uguale, senza accenti, punteggiatura, parentesi e alias dopo «detta/o»."""
    return _senza_alias(a) == _senza_alias(b)


def stesso_nome(a, b):
    """Nome esatto oppure uno contenuto per intero nell'altro."""
    x, y = _senza_alias(a), _senza_alias(b)
    return x == y or (len(x) >= 8 and len(y) >= 8 and (x in y or y in x))


def metri(a, b):
    k = math.cos(math.radians(a[1]))
    return math.hypot((a[0] - b[0]) * k, a[1] - b[1]) * M_PER_GRADO


def scegli_coordinate(luogo, osm, civico, condivisa):
    """Coordinate corrette {lon, lat, fonte, scarto_m} oppure None se il portale va bene.

    Il portale resta la fonte di base. Lo si sostituisce solo se il suo punto e' condiviso da piu' luoghi
    (coordinate generiche) o se dista oltre SOGLIA_DISACCORDO_M da entrambe le fonti indipendenti disponibili
    (OSM per nome, civico dall'indirizzo): una sola fonte discorde non basta. Preferenza: civico, poi OSM.
    """
    if luogo.get("lon") is None:
        for fonte, c in (("civico", civico), ("osm", osm)):
            if c:
                return {"lon": c[0], "lat": c[1], "fonte": fonte, "scarto_m": None}
        return None
    portale = (luogo["lon"], luogo["lat"])
    lontano = {f: metri(portale, c) > SOGLIA_DISACCORDO_M for f, c in (("civico", civico), ("osm", osm)) if c}
    if not lontano:
        return None
    if condivisa or all(lontano.values()):
        for fonte, c in (("civico", civico), ("osm", osm)):
            if c and lontano[fonte]:
                return {"lon": c[0], "lat": c[1], "fonte": fonte, "scarto_m": round(metri(portale, c))}
    return None


def _civico_di(pagina, indice):
    """(lon, lat) del civico indicato nell'indirizzo della scheda del portale, se nell'indice civici."""
    blocco = re.search(r'id="map-loc"[^>]*>(.*?)(?:Orari|Ente|</div>)', pagina, re.S)
    if not blocco:
        return None
    testo = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", blocco.group(1)))).strip()
    r = re.match(r"(.+?),\s*(\d+\s*[A-Za-z]?)\b", testo)
    if not r:
        return None
    via = " ".join(_norm(r.group(1)).split())
    numeri = indice["strade"].get(via)
    num = r.group(2).replace(" ", "").upper()
    c = numeri and (numeri.get(num) or numeri.get(re.sub(r"[A-Z]$", "", num)))
    return tuple(c) if c else None


def correggi():
    s = requests.Session()
    s.headers["User-Agent"] = "DigitalTwinPalermo/1.0 (dati aperti; gbvitrano@gmail.com)"
    luoghi = json.loads((OUT / "luoghi.json").read_text(encoding="utf-8"))
    f_osm, f_civ = CACHE / "osm.json", CACHE / "civici_index.json"
    if not f_osm.exists():
        r = s.post(OVERPASS, data={"data": OVERPASS_QL}, timeout=180)
        r.raise_for_status()
        json.loads(r.text)  # niente cache di risposte d'errore
        f_osm.write_text(r.text, encoding="utf-8")
    if not f_civ.exists():
        r = s.get(CIVICI_URL, timeout=60)
        r.raise_for_status()
        f_civ.write_text(r.text, encoding="utf-8")
    elementi = []
    for e in json.loads(f_osm.read_text(encoding="utf-8"))["elements"]:
        c = e.get("center") or e
        if "lat" in c and e["tags"].get("name"):
            elementi.append((e["tags"]["name"], (c["lon"], c["lat"])))
    civici = json.loads(f_civ.read_text(encoding="utf-8"))
    indice = {"strade": {" ".join(_norm(k).split()): v for k, v in civici.items()}}
    usi = {}
    for l in luoghi:
        if l.get("lon") is not None:
            usi[(round(l["lon"], 5), round(l["lat"], 5))] = usi.get((round(l["lon"], 5), round(l["lat"], 5)), 0) + 1
    correzioni = {}
    for l in luoghi:
        if l["id"] in MANUALI:
            lon, lat, motivo = MANUALI[l["id"]]
            correzioni[l["id"]] = {"lon": lon, "lat": lat, "fonte": "manuale", "motivo": motivo, "nome": l["nome"]}
            continue
        pagina = (CACHE / f"dettaglio_{l['id']}.html").read_text(encoding="utf-8")
        civico = _civico_di(pagina, indice)
        riferimento = (l["lon"], l["lat"]) if l.get("lon") is not None else civico
        candidati = [(metri(riferimento, c), c) for n, c in elementi if stesso_nome(l["nome"], n)] if riferimento else []
        candidati = [(d, c) for (d, c), (n, _) in zip(candidati, [e for e in elementi if stesso_nome(l["nome"], e[0])])
                     if d <= (RAGGIO_OSM_M if nome_esatto(l["nome"], n) else RAGGIO_CONTENUTO_M)] if candidati else []
        osm = min(candidati)[1] if candidati else None
        condivisa = l.get("lon") is not None and usi[(round(l["lon"], 5), round(l["lat"], 5))] > 1
        c = scegli_coordinate(l, osm, civico, condivisa)
        if c:
            c["nome"] = l["nome"]
            if condivisa:
                c["motivo"] = "coordinate del portale condivise con altri luoghi"
            correzioni[l["id"]] = c
    CORREZIONI.write_text(json.dumps(correzioni, ensure_ascii=False, indent=1), encoding="utf-8")
    print(len(correzioni), "correzioni:")
    for i, c in correzioni.items():
        print(f"  {i:7} {c['fonte']:8} {str(c.get('scarto_m')):>5} m  {c['nome']}")


def applica_correzioni(luoghi):
    """Luoghi con le coordinate corrette (quelli rimasti senza coordinate vengono scartati)."""
    correzioni = json.loads(CORREZIONI.read_text(encoding="utf-8")) if CORREZIONI.exists() else {}
    for l in luoghi:
        c = correzioni.get(l["id"])
        if c:
            l["lon_portale"], l["lat_portale"] = l.get("lon"), l.get("lat")
            l["lon"], l["lat"] = c["lon"], c["lat"]
    return [l for l in luoghi if l.get("lon") is not None]


# ---------- abbinamento punto -> edificio ----------

class Indice:
    """Edifici (geometria, altezza) con indice spaziale, in gradi lon/lat."""

    def __init__(self, edifici):
        self.geoms = [g for g, _ in edifici]
        self.tree = STRtree(self.geoms)


def abbina_edificio(punto, edifici, soglia_m=SOGLIA_M):
    """(geometria, 'contenuto'|'vicino') oppure (None, 'nessuno')."""
    indice = edifici if isinstance(edifici, Indice) else Indice(edifici)
    for i in indice.tree.query(punto, predicate="within"):
        return indice.geoms[i], "contenuto"
    r = soglia_m / M_PER_GRADO * 1.5
    k = math.cos(math.radians(punto.y))
    p = scale(punto, xfact=k, yfact=1, origin=(0, 0))
    migliore, dmin = None, soglia_m
    for i in indice.tree.query(punto.buffer(r)):
        d = p.distance(scale(indice.geoms[i], xfact=k, yfact=1, origin=(0, 0))) * M_PER_GRADO
        if d <= dmin:
            migliore, dmin = indice.geoms[i], d
    return (migliore, "vicino") if migliore is not None else (None, "nessuno")


def abbina_edifici(punto, edifici, nome, soglia_m=SOGLIA_M):
    """([geometrie], 'contenuto'|'vicino'|'nessuno'). Porte e archi: tutti gli edifici entro RAGGIO_PORTA_M."""
    indice = edifici if isinstance(edifici, Indice) else Indice(edifici)
    g, tipo = abbina_edificio(punto, indice, soglia_m)
    if g is None:
        return [], "nessuno"
    if tipo == "vicino" and PAROLE_PORTA & set(_norm(nome).split()):
        k = math.cos(math.radians(punto.y))
        p = scale(punto, xfact=k, yfact=1, origin=(0, 0))
        vicini = [indice.geoms[i] for i in indice.tree.query(punto.buffer(RAGGIO_PORTA_M / M_PER_GRADO * 1.5))
                  if p.distance(scale(indice.geoms[i], xfact=k, yfact=1, origin=(0, 0))) * M_PER_GRADO <= RAGGIO_PORTA_M]
        if vicini:
            return vicini, tipo
    return [g], tipo


def costruisci_feature(luogo, geom, abbinamento):
    """Feature GeoJSON del monumento.

    Il punto porta tutti i dettagli; il poligono dell'edificio solo id, nome e categoria (per colorarlo): il viewer
    ritrova i dettagli dal punto con lo stesso id, cosi' il file non duplica testi e link.
    """
    if geom is None:
        chiavi = ("id", "nome", "categoria", "descrizione", "foto", "url", "lon", "lat", "fonte")
        geometria = {"type": "Point", "coordinates": [luogo["lon"], luogo["lat"]]}
    else:
        chiavi = ("id", "nome", "categoria")
        geometria = mapping(set_precision(geom, 1e-6))
    props = {k: luogo.get(k) for k in chiavi}
    props["abbinamento"] = abbinamento
    return {"type": "Feature", "properties": props, "geometry": geometria}


# ---------- rete ----------

def _prendi(sessione, url, file_cache):
    if file_cache.exists():
        return file_cache.read_text(encoding="utf-8")
    time.sleep(PAUSA)
    r = sessione.get(url, timeout=30)
    r.raise_for_status()
    file_cache.parent.mkdir(parents=True, exist_ok=True)
    file_cache.write_text(r.text, encoding="utf-8")
    return r.text


def scarica():
    s = requests.Session()
    s.headers["User-Agent"] = "DigitalTwinPalermo/1.0 (dati aperti; gbvitrano@gmail.com)"
    luoghi, senza_coord = [], []
    for det, categoria in CATEGORIE.items():
        elenco = _prendi(s, f"{BASE}palermo-welcome-luoghi.php?tp=68&det={det}", CACHE / f"elenco_{det}.html")
        for luogo in parse_elenco(elenco, det):
            dettaglio = _prendi(s, luogo["url"], CACHE / f"dettaglio_{luogo['id']}.html")
            coord = parse_coordinate(dettaglio)
            if coord is None:
                senza_coord.append(luogo["id"] + " " + luogo["nome"])
            luogo.update(categoria=categoria, lon=coord[0] if coord else None, lat=coord[1] if coord else None, foto=None)
            if luogo["foto_url"]:
                dest = FOTO / f"{luogo['id']}.jpg"
                if not dest.exists():
                    time.sleep(PAUSA)
                    r = s.get(luogo["foto_url"], timeout=30)
                    if r.ok:
                        FOTO.mkdir(parents=True, exist_ok=True)
                        dest.write_bytes(riduci_foto(r.content))
                if dest.exists():
                    luogo["foto"] = f"foto/{dest.name}"
            luoghi.append(luogo)
        print(f"{categoria}: {sum(1 for x in luoghi if x['categoria'] == categoria)}", flush=True)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "luoghi.json").write_text(json.dumps(luoghi, ensure_ascii=False, indent=1), encoding="utf-8")
    if senza_coord:
        print("senza coordinate valide sul portale (si recuperano con «correggi»):", *senza_coord, sep="\n  ")


def riduci_esistenti():
    for f in sorted(FOTO.glob("*")):
        f.write_bytes(riduci_foto(f.read_bytes()))


def nel_comune(luoghi, confine):
    """(dentro, fuori): il Portale e il KML includono Monreale, Bagheria, Villabate e altri comuni vicini."""
    dentro, fuori = [], []
    for l in luoghi:
        (dentro if confine.contains(Point(l["lon"], l["lat"])) else fuori).append(l)
    return dentro, fuori


def abbina():
    import pyogrio

    tutti = OUT / "tutti.json"  # prodotto da monumenti_kml.py unisci: portale + KML, senza duplicati
    luoghi = (json.loads(tutti.read_text(encoding="utf-8")) if tutti.exists()
              else applica_correzioni(json.loads((OUT / "luoghi.json").read_text(encoding="utf-8"))))
    luoghi, esclusi = nel_comune(luoghi, shape(json.loads(CONFINE.read_text(encoding="utf-8"))["features"][0]["geometry"]))
    print(len(esclusi), "luoghi fuori dal confine comunale esclusi")
    xs, ys = [l["lon"] for l in luoghi], [l["lat"] for l in luoghi]
    marg = 0.002
    edifici = pyogrio.read_dataframe(EDIFICATO, bbox=(min(xs) - marg, min(ys) - marg, max(xs) + marg, max(ys) + marg),
                                     columns=["altezza"])
    indice = Indice(list(zip(edifici.geometry, edifici["altezza"])))
    punti, poligoni, conteggio = [], [], {}
    for l in luoghi:
        geoms, tipo = abbina_edifici(Point(l["lon"], l["lat"]), indice, l["nome"])
        conteggio[tipo] = conteggio.get(tipo, 0) + 1
        punti.append(costruisci_feature(l, None, tipo))  # il punto c'e' sempre
        poligoni.extend(costruisci_feature(l, g, tipo) for g in geoms)
    # due file: i punti si raggruppano in cluster nel viewer (il clustering vale solo per i punti)
    for nome, feats in (("monumenti.geojson", punti), ("monumenti_edifici.geojson", poligoni)):
        (OUT / nome).write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False,
                                           separators=(",", ":")), encoding="utf-8")
    pmtiles_edifici(OUT / "monumenti_edifici.geojson", OUT / "monumenti_edifici.pmtiles")
    print(len(luoghi), "luoghi:", conteggio)


def pmtiles_edifici(geojson, pmtiles):
    """Poligoni degli edifici in tile vettoriali: il browser scarica solo quelli nella vista (non il file intero)."""
    subprocess.run(
        ["tippecanoe", "-o", str(pmtiles), "-f", "-l", "edifici", "-Z10", "-z16",
         "--no-tile-size-limit", "--no-feature-limit", str(geojson)],
        check=True, capture_output=True,
    )


if __name__ == "__main__":
    comando = sys.argv[1] if len(sys.argv) > 1 else ""
    {"scarica": scarica, "correggi": correggi, "abbina": abbina, "riduci": riduci_esistenti}.get(comando, lambda: sys.exit(__doc__))()
