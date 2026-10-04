"""Versioni compatte dei dati tabellari, che il viewer scarica al posto dei JSON originali.

  python3 scripts/compatta_dati.py popolazione   dati/popolazione/sezioni_indicatori{,_2023}.compatto.json  (da gbvitrano/palermo_popolazione)
  python3 scripts/compatta_dati.py classifica    dati/popolazione/classifica.json  (residenti e stranieri per circoscrizione, quartiere, UPL)
  python3 scripts/compatta_dati.py civici        dati/civici-omi/civici_vie.json + civici/<00-31>.json  (da palermohub)

Gli orari del trasporto si compattano in `gtfs.py` (stesso file `orari.json`, `codifica_orari`).
I decodificatori stanno in js/core/compatto.js e restituiscono la forma originale: il resto del viewer non cambia.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATI = ROOT / "dati"

URL_POPOLAZIONE = "https://gbvitrano.github.io/palermo_popolazione/data/"
URL_CIVICI = "https://palermohub.opendatasicilia.it/pmtiles/civici_index.json"
# i soli campi che il viewer legge (indicatori.js: densità e vecchiaia; popolazione.js: residenti 2023)
CAMPI_POPOLAZIONE = ["SEZ21_ID", "Area", "P1", *[f"P{n}" for n in (30, 31, 32, 67, 68, 69, 43, 44, 45, 80, 81, 82)]]
DECIMALI_CIVICI = 6


def _scrivi(percorso, dati):
    percorso.parent.mkdir(parents=True, exist_ok=True)
    percorso.write_text(json.dumps(dati, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def _scarica(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return json.loads(r.read())


def codifica_popolazione(righe):
    """Lista di record -> un array per campo (null dove il campo manca), solo i campi usati dal viewer."""
    return {c: [r.get(c) for r in righe] for c in CAMPI_POPOLAZIONE}


LIVELLI_CLASSIFICA = {"circoscrizioni": "Circoscrizione", "quartieri": "Quartiere", "upl": "UPL"}


def codifica_classifica(righe):
    """Record delle sezioni -> residenti (P1) e stranieri (ST1) per livello amministrativo, in ordine decrescente."""
    classifica = {}
    for livello, campo in LIVELLI_CLASSIFICA.items():
        somme = {}
        for r in righe:
            nome = r.get(campo)
            if not nome:
                continue
            s = somme.setdefault(nome, [0, 0])
            s[0] += r.get("P1") or 0
            s[1] += r.get("ST1") or 0
        classifica[livello] = [[n, t, st] for n, (t, st) in sorted(somme.items(), key=lambda x: (-x[1][0], x[0]))]
    return classifica


def codifica_orari(orari):
    """Ogni gruppo {d, s, t} diventa [d, s, primo orario, differenze successive]: gli orari sono crescenti e vicini."""
    def gruppo(g):
        t = g["t"]
        assert all(b >= a for a, b in zip(t, t[1:])), "orari non crescenti"
        return [g["d"], g["s"], t[0], *(b - a for a, b in zip(t, t[1:]))]
    return {**orari, "fermate": {s: {r: [gruppo(g) for g in gs] for r, gs in rs.items()} for s, rs in orari["fermate"].items()}}


SEZIONI_CIVICI = 32


def chiave_sezione(via):
    """File dei civici in cui sta una via: hash FNV-1a del nome su 32 file (come chiaveSezione in compatto.js).

    Per iniziale non funzionerebbe: quasi tutte le vie di Palermo iniziano con «Via» e finirebbero sotto la «V».
    """
    h = 0x811C9DC5
    cod = via.encode("utf-16-le")
    for i in range(0, len(cod), 2):
        h = ((h ^ (cod[i] | cod[i + 1] << 8)) * 0x01000193) & 0xFFFFFFFF
    return f"{h % SEZIONI_CIVICI:02d}"


def _primo(civici):
    """Primo punto di una via come lo vede il JS: i civici numerici in ordine crescente (le chiavi intere di un oggetto vengono prima), poi gli altri."""
    interi = sorted((k for k in civici if re.fullmatch(r"0|[1-9]\d{0,8}", k)), key=int)
    return civici[interi[0] if interi else next(iter(civici))]


def codifica_civici(indice):
    """{via: {civico: [lon, lat]}} -> (vie, sezioni).

    vie = {via: [lon, lat]} (primo punto, per la ricerca per nome); sezioni = {chiave: {via: [civici, lon, lat]}} con le
    coordinate in micro-gradi interi e differenze dal civico precedente (si scaricano solo cercando «via + numero»).
    """
    def diff(a):
        return [a[0], *(y - x for x, y in zip(a, a[1:]))] if a else []
    scala = 10 ** DECIMALI_CIVICI
    vie, sezioni = {}, {}
    for via, civici in indice.items():
        for lon, lat in civici.values():  # il viewer assume 6 decimali: nessuna perdita
            assert abs(round(lon * scala) / scala - lon) < 1e-9 and abs(round(lat * scala) / scala - lat) < 1e-9
        vie[via] = _primo(civici)
        sezioni.setdefault(chiave_sezione(via), {})[via] = [
            list(civici), diff([round(c[0] * scala) for c in civici.values()]), diff([round(c[1] * scala) for c in civici.values()])]
    return vie, sezioni


def main(argv):
    comando = argv[1] if len(argv) > 1 else ""
    if comando == "popolazione":
        for nome in ("sezioni_indicatori", "sezioni_indicatori_2023"):
            _scrivi(DATI / "popolazione" / f"{nome}.compatto.json", codifica_popolazione(_scarica(f"{URL_POPOLAZIONE}{nome}.json")))
    elif comando == "classifica":
        _scrivi(DATI / "popolazione" / "classifica.json", {
            anno: codifica_classifica(_scarica(f"{URL_POPOLAZIONE}{nome}.json"))
            for anno, nome in (("2021", "sezioni_indicatori"), ("2023", "sezioni_indicatori_2023"))})
    elif comando == "civici":
        vie, sezioni = codifica_civici(_scarica(URL_CIVICI))
        _scrivi(DATI / "civici-omi" / "civici_vie.json", vie)
        for chiave, vie_sezione in sezioni.items():
            _scrivi(DATI / "civici-omi" / "civici" / f"{chiave}.json", vie_sezione)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
