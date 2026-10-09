"""GTFS Trenitalia (ferrovia urbana di Palermo) -> stazioni, linee e orari in dati/trasporto/.

  python3 scripts/gtfs_trenitalia.py [cartella]   legge i .txt del feed (default dati/gtfs-trenitalia/) e scrive
                            ferrovia-fermate.geojson  stazioni con nome, servizi che passano, accessibilità; membro `validita`
                            ferrovia-linee.geojson    un tracciato per servizio e direzione, con le stazioni in sequenza
                            ferrovia-orari.json       partenze per stazione, servizio, direzione e giorno (stesso schema di orari.json)

Feed: https://github.com/deryclem/trenitalia-gtfs (NeTEx Trenitalia/CCISS convertito in GTFS, CC BY 4.0).
Il feed è nazionale e ha una sola rotta per categoria di treno (REG, RV…), senza linee con nome: i servizi urbani si ricavano
dalle corse con almeno due stazioni nel perimetro di Palermo, raggruppate per capolinea (`ferrovia_nomi.json` dà i nomi ufficiali).
Gli id hanno un prefisso (stazioni `f<codice>`, rotte `ferrovia-<n>`, servizi da 1000) per non collidere con quelli di AMAT,
perché il viewer tiene i due insiemi nelle stesse mappe.
Le coordinate di alcune stazioni nel feed sono sbagliate (fino a 1 km: De Gasperi ha quelle di Francia): `ferrovia_posizioni.json`
le corregge con i nodi stazione di OpenStreetMap (© OpenStreetMap contributors, ODbL), con l'id del nodo come fonte.
Le stazioni non ancora aperte (Politeama e Porto, dell'Anello) non sono nel feed: `ferrovia_in_apertura.json` le aggiunge come punti con
`stato: in apertura` (posizione dai nodi OpenStreetMap in costruzione), senza linee né orari. Da togliere dal file quando il feed le include.
Il feed non ha calendar_dates: i servizi sono definiti da calendar.txt (giorni della settimana tra start_date e end_date).
Le shapes del feed non si usano: contengono i vertici delle fermate di tutta la corsa, anche fuori ordine (a volte Bagheria in mezzo a una
tratta urbana). Il tracciato è quindi la spezzata delle stazioni, instradata sulla rete delle tratte tra stazioni consecutive (i servizi
veloci passano dalle stazioni che saltano): schematico, ma coerente con le stazioni mostrate.
"""
import heapq
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path

from compatta_dati import codifica_orari
from gtfs import data_iso, leggi, minuti, nome

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "dati" / "gtfs-trenitalia"
OUT = ROOT / "dati" / "trasporto"
NOMI = Path(__file__).resolve().parent / "ferrovia_nomi.json"
POSIZIONI = Path(__file__).resolve().parent / "ferrovia_posizioni.json"
IN_APERTURA = Path(__file__).resolve().parent / "ferrovia_in_apertura.json"

BBOX = (13.105, 38.07, 13.50, 38.25)  # lon min, lat min, lon max, lat max: dall'aeroporto (13,110) a Ficarazzi/Roccella; fuori Cinisi e la linea per Trapani
BASE_SERVIZI = 1000
COLORE = "#B7282E"
MIN_CORSE = 3  # un servizio con meno corse è una variante: si aggrega a uno più grande che ne contiene il percorso
ACCESSIBILE = {"1": "Sì", "2": "No"}
GIORNI = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


ARTICOLI = {"Di", "Del", "Dei", "Della", "Delle", "Dello", "Degli", "Da", "Al", "Alla"}


def _nome_stazione(testo):
    """Nome in maiuscole e minuscole, con preposizioni e articoli in minuscolo («Isola delle Femmine»); il primo termine resta maiuscolo."""
    parole = nome(testo).split(" ")
    return " ".join(p if i == 0 or p not in ARTICOLI else p.lower() for i, p in enumerate(parole))


def _chiave_sigla(sigla):
    """Ordine naturale delle sigle: M1, M2, M10 (e non M1, M10, M2)."""
    return [int(x) if x.isdigit() else x for x in re.split(r"(\d+)", sigla)]


def dentro(lon, lat):
    return BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]


def servizi_calendar(src):
    """service_id -> date ISO ordinate in cui il servizio è attivo (calendar.txt espanso giorno per giorno)."""
    attivi = {}
    for r in leggi(src, "calendar"):
        giorno = date.fromisoformat(data_iso(r["start_date"]))
        fine = date.fromisoformat(data_iso(r["end_date"]))
        date_attive = []
        while giorno <= fine:
            if r[GIORNI[giorno.weekday()]] == "1":
                date_attive.append(giorno.isoformat())
            giorno += timedelta(days=1)
        if date_attive:
            attivi[r["service_id"]] = date_attive
    return attivi


def _contiene(grande, piccolo):
    """True se `piccolo` compare come tratto contiguo di `grande`, nello stesso verso o nel contrario."""
    n = len(piccolo)
    return any(grande[i:i + n] in (piccolo, piccolo[::-1]) for i in range(len(grande) - n + 1))


def _direzione(sequenza, riferimento):
    """0 se la corsa va nello stesso verso della sequenza di riferimento (misurato sulle stazioni in comune), 1 se è il ritorno."""
    pos = {s: i for i, s in enumerate(riferimento)}
    comuni = [pos[s] for s in sequenza if s in pos]
    if len(comuni) >= 2:
        return 0 if comuni[0] < comuni[-1] else 1
    return 0 if sequenza[0] == riferimento[0] else 1


def _distanza(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


def _rete(sequenze, pos):
    """Archi tra stazioni consecutive in almeno una corsa, senza le corde che scavalcano una stazione intermedia.

    Un servizio veloce che salta una stazione dà l'arco A-C: se esistono anche A-B e B-C e B sta quasi sul segmento, A-C non è
    una tratta di binario ma una scorciatoia, e si scarta (il binario passa da B). `pos` = codice -> [lon, lat].
    """
    archi = {frozenset(c) for seq in sequenze for c in zip(seq, seq[1:])}

    def scavalcato(arco):
        a, b = tuple(arco)
        return any(frozenset((a, c)) in archi and frozenset((c, b)) in archi
                   and _distanza(pos[a], pos[c]) + _distanza(pos[c], pos[b]) < 1.3 * _distanza(pos[a], pos[b])
                   for c in pos if c not in arco)
    return {arco for arco in archi if not scavalcato(arco)}


def _instrada(seq, archi, pos):
    """Coordinate del servizio `seq` lungo la rete: tra due stazioni consecutive prende il percorso più breve sugli archi
    (passando dalle stazioni che il servizio salta); senza percorso le collega in linea retta."""
    vicini = defaultdict(list)
    for arco in archi:
        a, b = tuple(arco)
        vicini[a].append(b)
        vicini[b].append(a)

    def percorso(da, a):
        coda, visti = [(0.0, da, [da])], set()
        while coda:
            costo, nodo, tratto = heapq.heappop(coda)
            if nodo == a:
                return tratto
            if nodo in visti:
                continue
            visti.add(nodo)
            for v in vicini[nodo]:
                if v not in visti:
                    heapq.heappush(coda, (costo + _distanza(pos[nodo], pos[v]), v, tratto + [v]))
        return [da, a]

    codici = [seq[0]]
    for da, a in zip(seq, seq[1:]):
        codici += percorso(da, a)[1:]
    return [pos[c] for c in codici]


def costruisci(src=SRC, nomi=None, posizioni=None, in_apertura=None):
    nomi = nomi or {}
    in_apertura = in_apertura or {}  # stazioni non ancora aperte (non sono nel feed): solo punti, senza linee né orari
    posizioni = posizioni or {}  # stop_code -> {lon, lat}: correzioni alle coordinate del feed (vedi ferrovia_posizioni.json)
    stazioni = {}  # stop_id -> riga, solo le fermate vere (location_type 0) dentro il perimetro
    for r in leggi(src, "stops"):
        if r["location_type"] in ("", "0") and dentro(float(r["stop_lon"]), float(r["stop_lat"])):
            stazioni[r["stop_id"]] = r
    attivi = servizi_calendar(src)
    indice = {sid: BASE_SERVIZI + i for i, sid in enumerate(sorted(attivi))}
    feed = next(leggi(src, "feed_info"))
    validita = {"da": data_iso(feed["feed_start_date"]), "a": data_iso(feed["feed_end_date"])}

    soste = defaultdict(list)  # corsa -> (sequenza, stop_id, partenza) delle sole fermate nel perimetro
    for r in leggi(src, "stop_times"):
        if r["stop_id"] in stazioni:
            soste[r["trip_id"]].append((int(r["stop_sequence"]), r["stop_id"], minuti(r["departure_time"])))
    treni = {r["route_id"] for r in leggi(src, "routes") if r["route_type"] == "2"}  # niente autobus sostitutivi (rotta BUS, tipo 3)
    corse = {r["trip_id"]: r for r in leggi(src, "trips") if r["route_id"] in treni}
    urbane = {}  # corsa -> [(stop_id, partenza)] in ordine
    for tid, s in soste.items():
        if len(s) >= 2 and tid in corse and corse[tid]["service_id"] in indice:
            urbane[tid] = [(stop, m) for _, stop, m in sorted(s)]

    codice = {sid: s["stop_code"] for sid, s in stazioni.items()}

    def coord(sid):
        """[lon, lat] della stazione: la correzione se c'è, altrimenti le coordinate del feed. Il perimetro usa sempre quelle del feed."""
        c = posizioni.get(stazioni[sid]["stop_code"])
        return [round(c["lon"], 6), round(c["lat"], 6)] if c else [round(float(stazioni[sid]["stop_lon"]), 6), round(float(stazioni[sid]["stop_lat"]), 6)]

    sequenza = {tid: [codice[stop] for stop, _ in s] for tid, s in urbane.items()}

    # servizi: corse con gli stessi capolinea (in qualunque verso); le varianti piccole si aggregano a un servizio che ne contiene il percorso
    gruppi = defaultdict(list)
    for tid, seq in sequenza.items():
        gruppi[frozenset((seq[0], seq[-1]))].append(tid)
    modale = {chiave: Counter(tuple(sequenza[t]) for t in tids).most_common(1)[0][0] for chiave, tids in gruppi.items()}
    grandi = sorted((c for c, tids in gruppi.items() if len(tids) >= MIN_CORSE), key=lambda c: (-len(gruppi[c]), sorted(c)))
    servizio = {}  # corsa -> chiave del servizio
    for chiave, tids in gruppi.items():
        for tid in tids:
            if chiave in grandi:
                servizio[tid] = chiave
                continue
            ospite = next((g for g in grandi if _contiene(list(modale[g]), sequenza[tid])), None)
            if ospite is None:  # percorso non contiguo: il servizio grande con più stazioni in comune (almeno 2)
                comuni = {g: len(set(modale[g]) & set(sequenza[tid])) for g in grandi}
                migliore = max(comuni, key=comuni.get, default=None)
                ospite = migliore if migliore is not None and comuni[migliore] >= 2 else None
            servizio[tid] = ospite or chiave
    chiavi = sorted(set(servizio.values()), key=lambda c: (-sum(1 for k in servizio.values() if k == c), sorted(c)))
    rotta = {c: f"ferrovia-{i}" for i, c in enumerate(chiavi, 1)}
    rif = {c: list(modale[c]) for c in chiavi}

    def firma(c):
        return "-".join(sorted(c))

    passano = defaultdict(set)  # stazione -> numeri di servizio
    partenze = defaultdict(list)  # (stazione, rotta, direzione, servizio) -> minuti
    per_linea = defaultdict(list)  # (rotta, direzione) -> corse
    riservate = [i["numero"] for i in nomi.values() if i.get("numero")]
    if len(set(riservate)) != len(riservate):
        raise ValueError(f"ferrovia_nomi.json: sigle duplicate {sorted(x for x in set(riservate) if riservate.count(x) > 1)}")
    libere = (f"M{n}" for n in range(1, len(chiavi) + len(riservate) + 1) if f"M{n}" not in riservate)  # le sigle riservate non si riassegnano
    numero = {c: nomi.get(firma(c), {}).get("numero") or next(libere) for c in chiavi}
    for tid, s in urbane.items():
        c = servizio[tid]
        d = _direzione(sequenza[tid], rif[c])
        per_linea[(rotta[c], d)].append(tid)
        for stop, _ in s:
            passano[stop].add(numero[c])
        for stop, m in s[:-1]:  # all'ultima stazione del tratto la corsa termina per questo servizio: non è una partenza
            partenze[(stop, rotta[c], d, indice[corse[tid]["service_id"]])].append(m)

    orari_fermate = defaultdict(lambda: defaultdict(list))
    for (stop, r, d, s), tempi in sorted(partenze.items()):
        orari_fermate[f"f{codice[stop]}"][r].append({"d": d, "s": s, "t": sorted(tempi)})

    usate = {stop for s in urbane.values() for stop, _ in s}
    fermate = {"type": "FeatureCollection", "validita": validita, "features": [
        {"type": "Feature", "geometry": {"type": "Point", "coordinates": coord(sid)},
         "properties": {"id": f"f{codice[sid]}", "nome": _nome_stazione(stazioni[sid]["stop_name"]), "linee": sorted(passano[sid], key=_chiave_sigla),
                        "accessibile": ACCESSIBILE.get(stazioni[sid]["wheelchair_boarding"], ""), "tipo": "ferrovia",
                        "lon": coord(sid)[0], "lat": coord(sid)[1]}}
        for sid in sorted(usate, key=lambda s: codice[s])]}
    for chiave, s in sorted(in_apertura.items()):
        fermate["features"].append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(s["lon"], 6), round(s["lat"], 6)]},
                                    "properties": {"id": f"f{chiave}", "nome": s["nome"], "linee": [], "accessibile": s.get("accessibile", ""), "tipo": "ferrovia",
                                                   "stato": "in apertura", "lon": round(s["lon"], 6), "lat": round(s["lat"], 6)}})

    per_codice = {codice[sid]: sid for sid in usate}
    punti = {k: coord(sid) for k, sid in per_codice.items()}
    rete = _rete(list(sequenza.values()), punti)
    elementi = []
    for (r, d), tids in sorted(per_linea.items(), key=lambda kv: (int(kv[0][0].split("-")[1]), kv[0][1])):
        c = next(k for k, v in rotta.items() if v == r)
        info = nomi.get(firma(c), {})
        seq = list(Counter(tuple(sequenza[t]) for t in tids).most_common(1)[0][0])
        coord = _instrada(seq, rete, punti)
        a, b = stazioni[per_codice[seq[0]]], stazioni[per_codice[seq[-1]]]
        da0, a0 = rif[c][0], rif[c][-1]
        medio = coord[len(coord) // 2]
        elementi.append({"type": "Feature", "geometry": {"type": "LineString", "coordinates": coord}, "properties": {
            "id": f"linea-{r}-{d}", "route_id": r, "numero": numero[c],
            "nome": info.get("nome") or f"{_nome_stazione(stazioni[per_codice[da0]]['stop_name'])} ⇄ {_nome_stazione(stazioni[per_codice[a0]]['stop_name'])}",
            "colore": info.get("colore", COLORE), "tipo": "ferrovia", "direzione": d,
            "da": _nome_stazione(a["stop_name"]), "a": _nome_stazione(b["stop_name"]), "fermate": [f"f{k}" for k in seq], "lon": medio[0], "lat": medio[1]}})
    linee = {"type": "FeatureCollection", "features": elementi}

    in_uso = {corse[t]["service_id"] for t in urbane}
    orari = {"validita": validita, "servizi": {str(i): attivi[sid] for sid, i in indice.items() if sid in in_uso},
             "fermate": {stop: dict(per_rotta) for stop, per_rotta in orari_fermate.items()}}
    return fermate, linee, orari


def scrivi(risultato, out=OUT):
    out.mkdir(parents=True, exist_ok=True)
    for file, dati in zip(("ferrovia-fermate.geojson", "ferrovia-linee.geojson", "ferrovia-orari.json"), risultato):
        if file == "ferrovia-orari.json":
            dati = codifica_orari(dati)  # compatto: lo decodifica js/core/compatto.js
        (out / file).write_text(json.dumps(dati, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    nomi = json.loads(NOMI.read_text(encoding="utf-8")) if NOMI.exists() else {}
    posizioni = json.loads(POSIZIONI.read_text(encoding="utf-8")) if POSIZIONI.exists() else {}
    in_apertura = json.loads(IN_APERTURA.read_text(encoding="utf-8")) if IN_APERTURA.exists() else {}
    fermate, linee, orari = risultato = costruisci(Path(argv[0]) if argv else SRC, nomi, posizioni, in_apertura)
    scrivi(risultato)
    print(f"{len(fermate['features'])} stazioni, {len(linee['features'])} tracciati, {len(orari['fermate'])} stazioni con orari")
    for f in linee["features"]:
        p = f["properties"]
        print(f"  {p['numero']} {p['nome']} dir {p['direzione']}: {p['da']} -> {p['a']} ({len(p['fermate'])} stazioni)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
