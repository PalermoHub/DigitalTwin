#!/usr/bin/env python3
"""Cambia l'indirizzo pubblico dell'app in tutti i file che lo scrivono per esteso (canonical, og:url, og:image, sitemap, robots, dati strutturati).

Uso:
  python scripts/imposta_indirizzo.py https://nuovo.dominio.it/            # applica
  python scripts/imposta_indirizzo.py https://nuovo.dominio.it/ --prova    # mostra cosa cambierebbe
  python scripts/imposta_indirizzo.py --mostra                             # indirizzo attuale

L'indirizzo attuale si legge dal <link rel="canonical"> di index.html. Deve finire con «/» (la radice dell'app).
Vedi docs/QUANDO_SARA_ONLINE.md per tutto il resto da aggiornare in un cambio di dominio (Worker CORS, VPS dei dati, testi).
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILE = ["index.html", "presentazione.html", "sitemap.xml", "robots.txt"]


def attuale():
    testo = (ROOT / "index.html").read_text(encoding="utf-8")
    m = re.search(r'<link rel="canonical" href="([^"]+)"', testo)
    if not m:
        sys.exit('non trovo <link rel="canonical"> in index.html')
    return m.group(1)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("nuovo", nargs="?", help="nuovo indirizzo, con «/» finale")
    ap.add_argument("--prova", action="store_true", help="non scrive nulla")
    ap.add_argument("--mostra", action="store_true", help="stampa l'indirizzo attuale ed esce")
    args = ap.parse_args(argv)
    vecchio = attuale()
    if args.mostra or not args.nuovo:
        print(vecchio)
        return 0
    nuovo = args.nuovo
    if not re.fullmatch(r"https://[^\s/]+(/[^\s]*)?/", nuovo):
        sys.exit("l'indirizzo deve iniziare con https:// e finire con «/» (esempio: https://palermodigitaltwin.opendatasicilia.it/)")
    if nuovo == vecchio:
        print("l'indirizzo è già questo")
        return 0
    totale = 0
    for nome in FILE:
        percorso = ROOT / nome
        if not percorso.exists():
            continue
        testo = percorso.read_text(encoding="utf-8")
        n = testo.count(vecchio)
        if n:
            totale += n
            print(f"{nome}: {n} occorrenze")
            if not args.prova:
                percorso.write_text(testo.replace(vecchio, nuovo), encoding="utf-8")
    print(f"{'da cambiare' if args.prova else 'cambiate'}: {totale} occorrenze, da {vecchio} a {nuovo}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
