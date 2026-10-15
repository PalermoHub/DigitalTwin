"""Aggiorna in un colpo solo i dati dei progetti PNRR di Palermo e li pubblica.

Uso:  python3 scripts/aggiorna_pnrr.py [--controlla] [--forza] [--senza-test] [--senza-push]

Cosa fa, nell'ordine (si ferma al primo problema, senza lasciare file a metà):
  1. controlla di essere su `main`, senza modifiche in sospeso, e lo aggiorna (git pull --rebase);
  2. legge sul sito di Italia Domani la data dell'ultima estrazione (pochi KB) e la confronta con quella già nel repository:
     se non c'è niente di nuovo si ferma qui (con --forza prosegue lo stesso);
  3. rigenera i dati con scripts/pnrr.py (scarica circa 330 MB);
  4. controlla che i numeri siano ragionevoli rispetto a prima (stessi ordini di grandezza, nessun file mancante);
  5. lancia i test (JS e Python del layer);
  6. fa commit dei file di dati, riallinea con origin/main e pubblica (git push).

Opzioni:
  --controlla    solo il punto 2: dice se ci sono dati nuovi e si ferma, senza scaricare né modificare nulla
  --forza        non si ferma se la data non è cambiata né davanti ai numeri sospetti
  --senza-test   salta i test
  --senza-push   fa il commit ma non pubblica

Se il sito rifiuta la richiesta (HTTP 403, succede dai server di GitHub) l'aggiornamento va fatto da un computer normale come questo.
Procedura spiegata passo per passo: dati/pnrr/AGGIORNAMENTO.md
"""
import argparse
import csv
import io
import json
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pnrr  # noqa: E402  (stessa cartella: URL e intestazioni del sito sono definiti là)

RADICE = Path(__file__).resolve().parent.parent
DATI = RADICE / "dati" / "pnrr"
FILE_DATI = ["pnrr.geojson", "pnrr_palermo.csv", "sintesi.json", "soggetti.json", "riepilogo.json", "README.md"]
TOLLERANZA = 0.25   # variazione massima ammessa dei conteggi rispetto a prima (±25%)


class Fermo(Exception):
    """Un motivo per non andare avanti: il messaggio è per l'utente."""


# ---------- parti pure (testate in tests/test_aggiorna_pnrr.py) ----------

def data_da_testo(testo):
    """«13/06/2026» → date(2026, 6, 13); None se non è una data."""
    try:
        return datetime.strptime((testo or "").strip(), "%d/%m/%Y").date()
    except ValueError:
        return None


def data_da_intestazione(inizio_csv):
    """Data di estrazione dalle prime righe di PNRR_Localizzazione.csv (ultima colonna della prima riga di dati)."""
    righe = list(csv.reader(io.StringIO(inizio_csv.lstrip("﻿")), delimiter=";"))
    if len(righe) < 2 or "Data di Estrazione" not in righe[0]:
        raise Fermo("non riesco a leggere la data di estrazione dall'inizio del file del sito (formato cambiato?)")
    indice = righe[0].index("Data di Estrazione")
    riga = righe[1]
    data = data_da_testo(riga[indice]) if len(riga) > indice else None
    if not data:
        raise Fermo("la data di estrazione nel file del sito non è nel formato gg/mm/aaaa")
    return data


def ce_di_nuovo(sito, repo):
    """True se l'estrazione del sito è successiva a quella nel repository."""
    return sito > repo


def anomalie(prima, dopo, tolleranza=TOLLERANZA):
    """Elenco dei motivi per cui i dati nuovi sembrano sbagliati (vuoto = tutto a posto). `prima` e `dopo` sono i riepilogo.json."""
    motivi = []
    if dopo.get("file_progetti_mancanti"):
        motivi.append(f"file non scaricati: {', '.join(dopo['file_progetti_mancanti'])}")
    for chiave, nome in (("cup", "progetti di Palermo"), ("su_mappa", "progetti sulla mappa")):
        vecchio, nuovo = prima.get(chiave), dopo.get(chiave)
        if not vecchio or nuovo is None:
            continue
        if abs(nuovo - vecchio) / vecchio > tolleranza:
            motivi.append(f"{nome}: {vecchio} → {nuovo} (oltre il {int(tolleranza * 100)}% di variazione)")
    d_prima, d_dopo = data_da_testo(prima.get("estrazione")), data_da_testo(dopo.get("estrazione"))
    if d_prima and d_dopo and d_dopo < d_prima:
        motivi.append(f"la data di estrazione è tornata indietro: {prima['estrazione']} → {dopo['estrazione']}")
    return motivi


def messaggio_commit(dopo):
    return f"dati: aggiornamento progetti PNRR (estrazione del {dopo.get('estrazione', '?')})"


# ---------- operazioni ----------

def esegui(*comando, controlla=True, mostra=False):
    esito = subprocess.run(comando, cwd=RADICE, capture_output=not mostra, text=True)
    if controlla and esito.returncode != 0:
        fine = (esito.stderr or esito.stdout or "").strip().splitlines()[-6:] if not mostra else []
        raise Fermo(f"`{' '.join(comando)}` è fallito (codice {esito.returncode})" + ("\n" + "\n".join(fine) if fine else ""))
    return esito


def data_sul_sito():
    """Legge solo l'inizio del file di localizzazione (richiesta con Range) e ne ricava la data di estrazione."""
    richiesta = urllib.request.Request(pnrr.BASE + pnrr.LOCALIZZAZIONE, headers={**pnrr.INTESTAZIONI, "Range": "bytes=0-4095"})
    try:
        with urllib.request.urlopen(richiesta, timeout=60) as r:
            inizio = r.read(4096).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raise Fermo(f"il sito di Italia Domani ha risposto HTTP {e.code} {e.reason}: "
                    "se è 403 prova da un'altra rete (da casa, senza VPN) oppure scarica i file col browser (vedi dati/pnrr/AGGIORNAMENTO.md)")
    except OSError as e:
        raise Fermo(f"non riesco a raggiungere il sito di Italia Domani: {e}")
    return data_da_intestazione(inizio)   # l'ultima riga può essere tagliata: serve solo la prima riga di dati


def riepilogo_attuale():
    return json.loads((DATI / "riepilogo.json").read_text(encoding="utf-8"))


def ripristina():
    """Rimette i file di dati com'erano nell'ultimo commit (dopo un controllo fallito)."""
    esegui("git", "checkout", "--", "dati/pnrr", controlla=False)


def principale(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--controlla", action="store_true", help="dice solo se ci sono dati nuovi")
    ap.add_argument("--forza", action="store_true", help="prosegue anche senza dati nuovi o con numeri sospetti")
    ap.add_argument("--senza-test", action="store_true")
    ap.add_argument("--senza-push", action="store_true")
    args = ap.parse_args(argv)

    prima = riepilogo_attuale()
    repo = data_da_testo(prima.get("estrazione")) or date.min
    print(f"Dati nel repository: estrazione del {prima.get('estrazione')}  ({prima['cup']} progetti, {prima['su_mappa']} sulla mappa)")
    sito = data_sul_sito()
    print(f"Dati sul sito di Italia Domani: estrazione del {sito:%d/%m/%Y}")
    nuovo = ce_di_nuovo(sito, repo)
    if args.controlla:
        print("→ Ci sono dati nuovi: lancia `python3 scripts/aggiorna_pnrr.py` per aggiornare." if nuovo else "→ Nessun dato nuovo: non c'è nulla da aggiornare.")
        return 0
    if not nuovo and not args.forza:
        print("→ Nessun dato nuovo: mi fermo (con --forza rigenero lo stesso).")
        return 0

    ramo = esegui("git", "rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    if ramo != "main":
        raise Fermo(f"sei sul ramo «{ramo}»: passa a main (`git switch main`) prima di aggiornare")
    if esegui("git", "status", "--porcelain", "--untracked-files=no").stdout.strip():
        raise Fermo("ci sono modifiche non salvate nel repository: fai commit o `git stash` e rilancia")
    print("Aggiorno main…")
    esegui("git", "pull", "--rebase", "origin", "main")

    print("Rigenero i dati (scarica circa 330 MB, un minuto circa)…")
    esegui(sys.executable, "scripts/pnrr.py", "--riscarica", mostra=True)
    dopo = riepilogo_attuale()
    motivi = anomalie(prima, dopo)
    if motivi and not args.forza:
        ripristina()
        raise Fermo("i dati nuovi sembrano sbagliati, non li salvo:\n  - " + "\n  - ".join(motivi) + "\n(con --forza li salvo lo stesso)")
    print(f"Nuovi dati: estrazione del {dopo['estrazione']}, {dopo['cup']} progetti, {dopo['su_mappa']} sulla mappa. Controlli ok.")

    if not args.senza_test:
        print("Test…")
        try:
            esegui("npm", "run", "test:js")
            esegui(sys.executable, "-m", "pytest", "tests/test_pnrr.py", "-q")
        except Fermo:
            ripristina()
            raise

    esegui("git", "add", "-f", *[f"dati/pnrr/{f}" for f in FILE_DATI])
    if esegui("git", "diff", "--cached", "--quiet", controlla=False).returncode == 0:
        print("→ I file sono identici a prima: niente da salvare.")
        return 0
    esegui("git", "commit", "-m", messaggio_commit(dopo))
    print(f"Commit fatto: {messaggio_commit(dopo)}")
    if args.senza_push:
        print("→ Non pubblico (--senza-push). Per pubblicare: `git fetch origin && git rebase origin/main && git push origin main`.")
        return 0
    esegui("git", "fetch", "origin")
    esegui("git", "rebase", "origin/main")
    esegui("git", "push", "origin", "main")
    print("→ Pubblicato su main. Il sito si aggiorna con il workflow «Pubblica sito».")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(principale())
    except Fermo as e:
        print(f"\nERRORE: {e}", file=sys.stderr)
        sys.exit(1)
