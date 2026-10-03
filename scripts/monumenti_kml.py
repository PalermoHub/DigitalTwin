"""«Mappa monumentale di Palermo e dell'Agro Palermitano» (KML) -> dati/monumenti/.

  python3 scripts/monumenti_kml.py unisci   KML + luoghi del portale -> tutti.json (poi: monumenti.py abbina)

Il KML ha coordinate precise: dove un luogo del portale ha un omonimo vicino nel KML, ne prende la posizione.
Tutti gli altri punti del KML si aggiungono come luoghi in piu', senza duplicati.
  python3 scripts/monumenti_kml.py foto     scarica le foto dei luoghi del KML in foto/ (ridotte) e aggiorna tutti.json

Il KML non ha cartelle: la categoria si deduce dal nome. Le foto stanno su Google My Maps, che nel browser le blocca
(NotSameSite): si scaricano da qui, gia' ridimensionate con il parametro `fife`, e si salvano ridotte in foto/.
"""
import hashlib
import html
import io
import json
import re
import sys
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from lxml import etree

import monumenti as m

KML = m.OUT / "Mappa monumentale di Palermo e dell'Agro Palermitano.kml"
TUTTI = m.OUT / "tutti.json"
VIEWER = (13.1, 37.9785, 13.55, 38.2919)  # limiti della mappa: fuori non si puo' navigare
FOTO_LATO = 360
MAX_CAR = 400
RAGGIO_DUPLICATO_M = 100  # un punto del KML con il nome del luogo del portale entro questa distanza e' lo stesso monumento
RAGGIO_OMONIMI_M = 60  # due punti del KML con lo stesso nome entro questa distanza sono lo stesso luogo
FONTE_KML = "Mappa monumentale di Palermo e dell'Agro Palermitano di Marcello Petrucci"

# (categoria, parole) in ordine di priorita': la prima che compare nel nome vince
REGOLE = [
    ("Rifugi e memoria bellica", "segnaletica ricovero rifugio rifugi casamatta casematta bunker bombardamento bombardamenti batteria batterie forte"),
    ("Chiese ed Oratori", "chiesa chiesetta chiese cappella oratorio basilica santuario cattedrale duomo convento monastero abbazia badia "
                          "cripta parrocchia collegiata campanile chiostro confraternita"),
    ("Teatri", "teatro politeama"),
    ("Gallerie d'Arte e Musei", "museo galleria pinacoteca"),
    ("Biblioteche", "biblioteca archivio"),
    ("Mercati storici", "mercato"),
    ("Zone Archeologiche", "necropoli catacombe archeologica archeologico scavi grotta"),
    ("Giardini e Spazi verdi", "giardino giardini parco orto"),
    ("Dimore e Ville storiche", "villa villino villini casina baglio castello palazzina masseria tenuta"),
    ("Palazzi", "palazzo palazzi palazzetto albergo collegio ospedale casa case casena istituto scuola conservatorio ospizio ritiro"),
    ("Monumenti", "fontana fontanella porta torre statua monumento ponte colonna lapide cippo edicola obelisco arco cupola loggia "
                  "bastione mura stele busto"),
]
REGOLE = [(c, set(p.split())) for c, p in REGOLE]
ALTRI = "Altri luoghi"


def classifica(nome):
    parole = set(m._norm(nome).split())
    for categoria, chiavi in REGOLE:
        if parole & chiavi:
            return categoria
    return ALTRI


def testo_foto(descrizione, max_car=MAX_CAR):
    """(testo, url foto) dalla descrizione HTML di un segnaposto; None dove manca."""
    if not descrizione:
        return None, None
    foto = None
    for src in re.findall(r'<img[^>]+src="([^"]+)"', descrizione):
        src = html.unescape(src)
        if "mymaps.usercontent.google.com" in src and "fife=" in src:  # le altre (lh3) risultano scadute
            foto = re.sub(r"fife=s\d+", f"fife=s{FOTO_LATO}", src)
            break
    t = re.sub(r"<img[^>]*>", " ", descrizione)
    t = re.sub(r"<br\s*/?>|</p>|</div>|</li>", " ", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    t = " ".join(t.split())
    if len(t) > max_car:
        t = t[:max_car].rsplit(" ", 1)[0].rstrip(" ,;:.") + "…"
    return (t or None), foto


def leggi_kml(percorso=KML):
    """Segnaposto puntuali del KML dentro i limiti della mappa."""
    ns = {"k": "http://www.opengis.net/kml/2.2"}
    luoghi = []
    for i, p in enumerate(etree.parse(str(percorso)).iterfind(".//k:Placemark", ns)):
        pt = p.find(".//k:Point/k:coordinates", ns)
        nome = " ".join((p.findtext("k:name", namespaces=ns) or "").split())
        if pt is None or not nome:
            continue
        lon, lat = (float(v) for v in pt.text.strip().split(",")[:2])
        if not (VIEWER[0] <= lon <= VIEWER[2] and VIEWER[1] <= lat <= VIEWER[3]):
            continue
        testo, foto = testo_foto(p.findtext("k:description", namespaces=ns))
        luoghi.append({"id": f"k-{i}", "nome": nome, "categoria": classifica(nome), "descrizione": testo, "foto": foto,
                       "url": None, "lon": lon, "lat": lat, "fonte": FONTE_KML})
    return luoghi


# parole che dicono solo il tipo di edificio: nel confronto tra nomi contano le altre (i santi, i luoghi, le famiglie)
TIPI = set("chiesa chiese chiesetta cappella oratorio basilica santuario cattedrale duomo convento monastero abbazia badia parrocchia "
           "confraternita compagnia congregazione collegiata palazzo palazzina teatro museo biblioteca villa villino parco giardino "
           "real reale antica antico nuova nuovo".split())
ARTICOLI = set("di del della dei delle degli dello d e il la lo i le l detta detto o ex a al alla ai in da con".split())
RAGGI = (600, 300, 300, 250)  # metri massimi per priorita' di corrispondenza 0..3


def _chiavi(nome):
    parole = [w for w in m._norm(m._senza_alias(nome)).split() if w not in ARTICOLI]
    return {"distintive": frozenset(w for w in parole if w not in TIPI), "tipi": frozenset(w for w in parole if w in TIPI),
            "esatto": " ".join(parole)}


def _corrispondenza(a, b, nome_a, nome_b):
    """Priorita' (0 = migliore) della corrispondenza tra due nomi, o None."""
    if a["esatto"] == b["esatto"]:
        return 0
    da, db = a["distintive"], b["distintive"]
    if da and da == db:
        return 1
    if m.stesso_nome(nome_a, nome_b):
        return 2
    if da and db and len(min(da, db, key=len)) >= 2 and (da <= db or db <= da):
        return 3
    return None


def abbina_portale(portale, kml):
    """{id portale: segnaposto KML}: nome corrispondente e vicini, ciascun segnaposto usato una volta sola."""
    celle = defaultdict(list)  # indice a griglia (~1 km) per non confrontare tutto con tutto
    chiavi = {q["id"]: _chiavi(q["nome"]) for q in kml}
    for q in kml:
        celle[(int(q["lon"] * 100), int(q["lat"] * 100))].append(q)
    coppie = []
    for p in portale:
        if p.get("lon") is None:
            continue
        kp = _chiavi(p["nome"])
        cx, cy = int(p["lon"] * 100), int(p["lat"] * 100)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for q in celle[(cx + dx, cy + dy)]:
                    d = m.metri((p["lon"], p["lat"]), (q["lon"], q["lat"]))
                    if d > RAGGI[0]:
                        continue
                    kq = chiavi[q["id"]]
                    pri = _corrispondenza(kp, kq, p["nome"], q["nome"])
                    if pri is None or d > RAGGI[pri]:
                        continue
                    tipo_diverso = bool(kp["tipi"] and kq["tipi"] and not (kp["tipi"] & kq["tipi"]))
                    coppie.append((pri, tipo_diverso, d, p["id"], q["id"], q))
    risultato, usati = {}, set()
    for _, _, _, pid, qid, q in sorted(coppie, key=lambda c: c[:5]):
        if pid not in risultato and qid not in usati:
            risultato[pid] = q
            usati.add(qid)
    return risultato


def deduplica(extra, portale):
    """Toglie dagli extra i punti che sono gia' un luogo del portale (stesso nome, vicino) e gli omonimi vicini tra loro."""
    base = [(m._senza_alias(p["nome"]), (p["lon"], p["lat"])) for p in portale if p.get("lon") is not None]

    def stesso(a, b):  # come m.stesso_nome, su nomi gia' normalizzati
        return a == b or (len(a) >= 8 and len(b) >= 8 and (a in b or b in a))

    def duplicato_del_portale(chiave, e):
        return any(stesso(n, chiave) and m.metri(pos, (e["lon"], e["lat"])) <= RAGGIO_DUPLICATO_M for n, pos in base)

    ricchezza = lambda e: (bool(e.get("foto")), len(e.get("descrizione") or ""))
    chiavi = {e["id"]: (m._senza_alias(e["nome"]), m._norm(e["nome"])) for e in extra}
    tenuti, per_nome = [], defaultdict(list)
    for e in sorted(extra, key=ricchezza, reverse=True):
        senza_alias, nome = chiavi[e["id"]]
        if duplicato_del_portale(senza_alias, e):
            continue
        if any(m.metri((t["lon"], t["lat"]), (e["lon"], e["lat"])) <= RAGGIO_OMONIMI_M for t in per_nome[nome]):
            continue
        tenuti.append(e)
        per_nome[nome].append(e)
    ordine = {e["id"]: i for i, e in enumerate(extra)}
    return sorted(tenuti, key=lambda e: ordine[e["id"]])


def _file_foto(url):
    return f"foto/kml-{hashlib.sha1(url.encode()).hexdigest()[:12]}.jpg"  # stesso URL, stesso file: le immagini ripetute si scaricano una volta


def usa_foto_locali(luoghi):
    """Sostituisce l'URL della foto con il file locale, dove gia' scaricato."""
    for l in luoghi:
        if l.get("foto", "") and l["foto"].startswith("http") and (m.OUT / _file_foto(l["foto"])).exists():
            l["foto"] = _file_foto(l["foto"])


def foto(lavoratori=6):
    import requests
    from PIL import Image

    tutti = json.loads(TUTTI.read_text(encoding="utf-8"))
    urls = sorted({l["foto"] for l in tutti if l.get("foto") and l["foto"].startswith("http")})
    m.FOTO.mkdir(parents=True, exist_ok=True)
    sessione = requests.Session()
    sessione.headers["User-Agent"] = "DigitalTwinPalermo/1.0 (dati aperti; gbvitrano@gmail.com)"

    def scarica_una(url):
        dest = m.OUT / _file_foto(url)
        if dest.exists():
            return True
        time.sleep(0.15)
        try:
            r = sessione.get(url, timeout=60)
            r.raise_for_status()
            img = Image.open(io.BytesIO(r.content)).convert("RGB")
            img.thumbnail((FOTO_LATO, FOTO_LATO))
            img.save(dest, "JPEG", quality=80, optimize=True, progressive=True)
            return True
        except Exception as e:  # una foto rotta non ferma le altre
            print("foto non scaricata:", url[:80], type(e).__name__, flush=True)
            return False

    with ThreadPoolExecutor(lavoratori) as ex:
        esiti = []
        for i, ok in enumerate(ex.map(scarica_una, urls), 1):
            esiti.append(ok)
            if i % 100 == 0:
                print(f"{i}/{len(urls)}", flush=True)
    usa_foto_locali(tutti)
    for l in tutti:  # link scaduti o non scaricabili: nel browser non si caricherebbero comunque
        if l.get("foto") and l["foto"].startswith("http"):
            l["foto"] = None
    TUTTI.write_text(json.dumps(tutti, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"foto: {sum(esiti)}/{len(urls)} scaricate")


def unisci():
    portale = m.applica_correzioni(json.loads((m.OUT / "luoghi.json").read_text(encoding="utf-8")))
    for p in portale:
        p.setdefault("fonte", "Portale del Turismo — Comune di Palermo")
    kml = leggi_kml()
    abb = abbina_portale(portale, kml)
    for p in portale:
        q = abb.get(p["id"])
        if q:
            p["lon_precedente"], p["lat_precedente"] = p["lon"], p["lat"]
            p["lon"], p["lat"], p["posizione"] = q["lon"], q["lat"], "kml"
    usati = {q["id"] for q in abb.values()}
    extra = deduplica([q for q in kml if q["id"] not in usati], portale)
    tutti = portale + extra
    usa_foto_locali(tutti)
    TUTTI.write_text(json.dumps(tutti, ensure_ascii=False, indent=1), encoding="utf-8")
    spostati = [m.metri((p["lon_precedente"], p["lat_precedente"]), (p["lon"], p["lat"])) for p in portale if "lon_precedente" in p]
    print(f"KML: {len(kml)} punti nei limiti | portale: {len(portale)} (posizione dal KML: {len(abb)}, "
          f"spostamento mediano {sorted(spostati)[len(spostati) // 2]:.0f} m)")
    print(f"extra: {len(kml) - len(usati)} non abbinati -> {len(extra)} dopo i duplicati | totale {len(tutti)}")
    conteggio = defaultdict(int)
    for t in tutti:
        conteggio[t["categoria"]] += 1
    for c, n in sorted(conteggio.items(), key=lambda x: -x[1]):
        print(f"  {n:5} {c}")


if __name__ == "__main__":
    {"unisci": unisci, "foto": foto}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
