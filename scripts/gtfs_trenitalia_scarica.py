"""Feed GTFS Trenitalia (ferrovia urbana di Palermo) -> dati/trasporto/ferrovia-*.

  python3 scripts/gtfs_trenitalia_scarica.py            scarica gtfs-trenitalia.zip, e se `feed_version` è diversa da quella in uso lo
                                                         verifica e rigenera stazioni, linee e orari (scripts/gtfs_trenitalia.py)
  python3 scripts/gtfs_trenitalia_scarica.py --forza    rigenera anche se la versione è già quella in uso
  python3 scripts/gtfs_trenitalia_scarica.py --rapporto F   se il feed porta stazioni o linee che non erano nei dati, scrive in F (Markdown) l'elenco
                                                         (il workflow ne ricava una issue); orari, tracciati e stazioni note si aggiornano comunque

Il feed è prodotto da https://github.com/deryclem/trenitalia-gtfs (CC BY 4.0) ogni lunedì dai dati NeTEx di Trenitalia/CCISS.
Fallisce (senza toccare i dati) se il feed è scaduto, incompleto o ha meno di tre stazioni nel perimetro urbano: meglio un dato vecchio che uno sbagliato.
"""
import argparse
import io
import json
import sys
import tempfile
import urllib.request
import zipfile
from datetime import date, datetime
from pathlib import Path

import gtfs
import gtfs_trenitalia

URL = "https://github.com/deryclem/trenitalia-gtfs/raw/main/gtfs-trenitalia.zip"
MARCATORE = gtfs_trenitalia.OUT / "ferrovia_origine.json"
MINIMO_STAZIONI = 3
RICHIESTI = ("agency", "calendar", "feed_info", "routes", "stop_times", "stops", "trips")  # le shapes (14 MB) non servono: vedi gtfs_trenitalia.py


def versione(src):
    return next(gtfs.leggi(Path(src), "feed_info"))["feed_version"]


def da_aggiornare(nuova, marcatore=MARCATORE):
    try:
        return json.loads(marcatore.read_text(encoding="utf-8")).get("versione") != nuova
    except (OSError, ValueError, AttributeError):
        return True


def _leggi_json(file):
    try:
        return json.loads(Path(file).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def _chiave_linea(f):
    """Identità di una linea indipendente dalla direzione e dalla sigla (assegnata in automatico): i due capolinea."""
    cod = f["properties"]["fermate"]
    return "-".join(sorted((cod[0], cod[-1])))


def novita(vecchie, nuove):
    """(stazioni, linee) presenti nei dati nuovi e non nei vecchi. `vecchie` e `nuove` sono coppie (fermate, linee) GeoJSON.

    Le stazioni «in apertura» (aggiunte a mano, senza corse) contano come presenti nei vecchi dati: quando il feed le include
    la loro riga cambia id e compare qui, che è giusto, perché `ferrovia_in_apertura.json` va ripulito.
    """
    (vf, vl), (nf, nl) = vecchie, nuove
    note = {f["properties"]["id"] for f in vf.get("features", [])}
    stazioni = [f["properties"] for f in nf["features"] if f["properties"]["id"] not in note and f["properties"].get("stato") != "in apertura"]
    viste = {_chiave_linea(f) for f in vl.get("features", [])}
    linee, gia = [], set()
    for f in nl["features"]:
        k = _chiave_linea(f)
        if k not in viste and k not in gia:
            gia.add(k)
            linee.append(f["properties"])
    return stazioni, linee


def rapporto(stazioni, linee, versione, in_apertura=()):
    """Testo Markdown della issue, o stringa vuota se non c'è niente di nuovo."""
    if not stazioni and not linee:
        return ""
    r = [f"Il feed Trenitalia `{versione}` contiene stazioni o linee che non erano nei dati della metro. "
         "Gli orari e i tracciati noti sono già stati aggiornati; qui va deciso a mano cosa fare delle novità.", ""]
    if stazioni:
        r.append("### Stazioni nuove")
        r += [f"- `{s['id']}` {s['nome']} (linee {', '.join(s['linee']) or '—'}; coordinate del feed {s['lat']}, {s['lon']})" for s in stazioni]
        r += ["", "Le coordinate del feed possono essere sbagliate (anche di 1 km): da controllare con OpenStreetMap e, se serve, correggere in `scripts/ferrovia_posizioni.json`.", ""]
        aperte = [s["nome"] for s in stazioni if any(s["nome"].lower() == (i.get("nome") or "").lower() for i in in_apertura)]
        if aperte:
            r += [f"Già presenti in `scripts/ferrovia_in_apertura.json` (da togliere): {', '.join(aperte)}.", ""]
    if linee:
        r.append("### Linee nuove")
        r += [f"- {l['numero']} (sigla provvisoria) {l['nome']}: {l['da']} → {l['a']}, {len(l['fermate'])} stazioni" for l in linee]
        r += ["", "Per dare nome ufficiale e sigla definitiva aggiungere la voce in `scripts/ferrovia_nomi.json` (chiave: codici dei due capolinea in ordine, separati da `-`).", ""]
    return "\n".join(r)


def estrai(dati, dest):
    """Scompatta solo i file GTFS attesi, ignorando cartelle e percorsi: nessuna scrittura fuori da dest."""
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(dati)) as z:
        for info in z.infolist():
            base = Path(info.filename).name
            if Path(base).stem in RICHIESTI and base.endswith(".txt") and not info.is_dir():
                (dest / base).write_bytes(z.read(info))


def verifica(src, oggi=None, minimo=MINIMO_STAZIONI):
    src = Path(src)
    for nome in RICHIESTI:
        if not (src / f"{nome}.txt").exists():
            raise ValueError(f"Feed incompleto: manca {nome}.txt")
    fine = datetime.strptime(next(gtfs.leggi(src, "feed_info"))["feed_end_date"], "%Y%m%d").date()
    if fine < (oggi or date.today()):
        raise ValueError(f"Feed scaduto il {fine}")
    stazioni = [r for r in gtfs.leggi(src, "stops")
                if r["location_type"] in ("", "0") and gtfs_trenitalia.dentro(float(r["stop_lon"]), float(r["stop_lat"]))]
    if len(stazioni) < minimo:
        raise ValueError(f"Feed con troppo poche stazioni nel perimetro urbano: {len(stazioni)} (minimo {minimo})")


def _scarica(url):
    with urllib.request.urlopen(url, timeout=300) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--forza", action="store_true", help="rigenera anche se la versione è già quella in uso")
    ap.add_argument("--rapporto", type=Path, help="file Markdown dove elencare stazioni e linee nuove (non viene creato se non ce ne sono)")
    a = ap.parse_args()
    nomi_file = gtfs_trenitalia.NOMI
    nomi = json.loads(nomi_file.read_text(encoding="utf-8")) if nomi_file.exists() else {}
    posizioni = json.loads(gtfs_trenitalia.POSIZIONI.read_text(encoding="utf-8")) if gtfs_trenitalia.POSIZIONI.exists() else {}
    in_apertura = json.loads(gtfs_trenitalia.IN_APERTURA.read_text(encoding="utf-8")) if gtfs_trenitalia.IN_APERTURA.exists() else {}
    with tempfile.TemporaryDirectory() as tmp:
        estrai(_scarica(URL), tmp)
        verifica(tmp)
        nuova = versione(tmp)
        if not a.forza and not da_aggiornare(nuova):
            print(f"Già aggiornato: feed Trenitalia {nuova}")
            return 0
        risultato = gtfs_trenitalia.costruisci(Path(tmp), nomi, posizioni, in_apertura)
    fermate = risultato[0]
    if a.rapporto:
        vecchie = (_leggi_json(gtfs_trenitalia.OUT / "ferrovia-fermate.geojson"), _leggi_json(gtfs_trenitalia.OUT / "ferrovia-linee.geojson"))
        testo = rapporto(*novita(vecchie, risultato[:2]), nuova, in_apertura.values())
        if testo:
            a.rapporto.write_text(testo + "\n", encoding="utf-8")
    gtfs_trenitalia.scrivi(risultato)
    MARCATORE.write_text(json.dumps({"versione": nuova, "scaricato": datetime.now().isoformat(timespec="seconds"), "validita": fermate["validita"]},
                                    ensure_ascii=False) + "\n", encoding="utf-8")
    v = fermate["validita"]
    print(f"Feed Trenitalia {nuova}: {len(fermate['features'])} stazioni, {len(risultato[1]['features'])} tracciati, valido dal {v['da']} al {v['a']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
