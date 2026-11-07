#!/usr/bin/env python3
"""Scrive js/core/ultimo-aggiornamento.json: giorno dell'ultima modifica a strati, schede o dati e che cosa è cambiato.

Per ogni commit che tocca js/layers/ o dati/ (dal più recente, tutti quelli dello stesso giorno):
- messaggio descrittivo → si usa il messaggio;
- messaggio generico («upgrade», «dati: aggiornamento…») → si ricavano i nomi dagli strati/schede toccati.
Uso: python scripts/genera_ultimo_aggiornamento.py [--staged]
--staged (hook pre-commit): conta anche il commit in preparazione, di cui si conoscono solo i file in stage (nessun messaggio).
"""
import json, re, subprocess, sys
from datetime import date
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
USCITA = RADICE / "js/core/ultimo-aggiornamento.json"
GENERICO = re.compile(r"^(upgr?e?ade|dati: aggiornamento|aggiornamento|wip)\b", re.I)
SUFFISSI = ("-dom", "-grafici", "-live", "-luoghi", "-visore", "-classi", "-grafico", "-mondo-terre", "-mondo", "-orbite")
NOMI = {  # quando la radice del file non coincide con un id di strato
    "particella-analisi": "Scheda particella catastale", "terreno": "Scheda terreno", "trasporto": "Scheda trasporto",
    "omi": "Valori OMI", "scuole": "Scuole", "sicurezza": "Sicurezza", "pc-mappa": "Protezione civile",
    "mef": "Immobili MEF", "ricerca-territorio": "Ricerca territorio", "legenda-prg": "Legenda PRG",
}

def git(*a):
    return subprocess.run(["git", *a], cwd=RADICE, capture_output=True, text=True, check=True).stdout

def etichette():
    d = json.loads((RADICE / "js/core/home-strati.json").read_text())["it"]
    return {s["id"]: s["etichetta"] for a in d for s in a["strati"]}

def nome(percorso, strati):
    p = Path(percorso)
    if p.parts[0] == "dati":
        radice = p.parts[1]
    elif p.parts[:2] == ("js", "layers"):
        radice = p.stem.removeprefix("scheda-")
        for s in SUFFISSI:
            if radice.endswith(s) and radice[: -len(s)]:
                radice = radice[: -len(s)]
                break
    else:
        return None
    if radice in NOMI: return NOMI[radice]
    if radice in strati: return strati[radice]
    return radice.replace("-", " ").capitalize()

def main():
    strati = etichette()
    giorno, cosa = None, []
    righe = git("log", "-60", "--name-only", "--format=@@%cs|%s", "--", "js/layers", "dati").split("@@")[1:]
    if "--staged" in sys.argv:
        stage = [f for f in git("diff", "--cached", "--name-only", "--", "js/layers", "dati").split("\n") if f]
        if stage:
            righe.insert(0, f"{date.today().isoformat()}|upgrade\n" + "\n".join(stage))
    for blocco in righe:
        testa, *file = blocco.strip().split("\n")
        data, msg = testa.split("|", 1)
        if giorno is None: giorno = data
        if data != giorno: break
        if GENERICO.match(msg):
            voci = [n for n in (nome(f, strati) for f in file if f) if n]
        else:
            voci = [msg]
        cosa += [v for v in dict.fromkeys(voci) if v not in cosa]
    USCITA.write_text(json.dumps({"data": giorno, "cosa": cosa[:4]}, ensure_ascii=False, indent=1) + "\n")
    print(giorno, cosa[:4])

main()
