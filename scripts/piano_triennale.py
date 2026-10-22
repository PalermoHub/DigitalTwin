"""Programma triennale dei lavori pubblici 2026-2028 del Comune di Palermo (DCC 553/2026) → dati/piano-triennale/.

Fonte: schede e allegati del Programma triennale pubblicati dal Comune di Palermo con la delibera di Consiglio comunale n. 553/2026. Le tabelle
dei PDF sono state estratte e unite (548 interventi, 4.373.410.918,53 €) nel progetto «piano_triennale_26_28» di OpenDataSicilia; le geometrie
sono state ricavate dalle tavole del Programma (punti, linee, poligoni) e assegnate a ogni intervento per codice. Qui i sorgenti stanno in
dati/piano-triennale/sorgenti/ e lo script li trasforma nei file dell'app.

Uso: python3 scripts/piano_triennale.py [--sorgenti DIR] [--uscita DIR]

Regole:
  1. la chiave è il codice dell'intervento (`cod_int_amm`); una geometria può riguardare più interventi (codici separati da «;»);
  2. 454 interventi su 548 hanno almeno una geometria: gli altri 94 (2,0 miliardi di euro, tra cui la metropolitana) compaiono solo nella
     tab della scheda, nel CSV e nei grafici;
  3. gli importi sono quelli dichiarati nelle schede: «triennio» = somma dei costi dei tre anni (totale ufficiale del Programma),
     «complessivo» comprende anche le annualità successive;
  4. il CUP ufficiale non si modifica: i CUP «candidati» (ricerca nel dataset OpenCUP per descrizione e importo) sono solo proposte da verificare;
  5. se i conteggi sono fuori soglia (file cambiato o rotto) lo script non tocca i dati già pubblicati.

Scrive in dati/piano-triennale/:
  interventi.geojson            punti, linee e poligoni assegnati a un intervento (WGS84), una feature per geometria, con i dati essenziali dell'intervento
  elenco.json                   tutti gli interventi con i dettagli (scheda D, fonti, elenco annuale), per la tab Piano triennale
  sintesi.json                  aggregati (anno, settore, tipologia, risorse) per i grafici della tab
  riepilogo.json                conteggi dell'esecuzione
"""
import argparse
import csv
import json
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
USCITA = RADICE / "dati" / "piano-triennale"
SORGENTI = USCITA / "sorgenti"
SOGLIA_INTERVENTI = (540, 560)
SOGLIA_GEOMETRIE = (500, 700)   # punti + linee + poligoni assegnati a un intervento (oggi 562)
TOTALE_ATTESO = 4373410918.53

# codice del settore (prime due cifre del sottosettore) → nome breve
SETTORI = {
    "01": "Trasporti", "02": "Ambiente e risorse idriche", "03": "Energia", "04": "Aree produttive",
    "05": "Infrastrutture sociali", "06": "Turismo, commercio e ricerca", "10": "Altri servizi",
}


ANNUALITA = {1: "I annualità (2026)", 2: "II annualità (2027)", 3: "III annualità (2028)"}


def r2(x):
    return None if x is None else round(float(x), 2)


def pulito(d):
    """Toglie i valori vuoti (None, '', liste vuote) per ridurre il peso del JSON."""
    return {k: v for k, v in d.items() if v not in (None, "", [], {})}


def intervento(o):
    """Riga compatta dell'elenco: solo quanto serve alla scheda."""
    fonti = pulito({
        "prog": o["fonti_prog"], "risorsa": o["fonti_tipologia_risorsa"], "descrizione": o["fonti_descrizione_finanziamento"],
        "importo_2025": r2(o["fonti_importo_2025"]), "importo_totale": r2(o["fonti_importo_totale"]),
    })
    annuale = pulito({
        "importo": r2(o["annuale_importo_annualita"]), "finalita": o["annuale_finalita"], "conformita_urbanistica": o["annuale_conformita_urbanistica"],
        "vincoli_ambientali": o["annuale_verifica_vincoli_ambientali"], "progettazione": o["annuale_livello_progettazione"],
        "ausa": o["annuale_centrale_committenza_ausa"], "stazione_appaltante": o["annuale_centrale_committenza_denominazione"],
        "cig_accordo_quadro": o["annuale_cig_accordo_quadro"],
    }) if o["in_elenco_annuale"] else {}
    candidato = pulito({
        "cup": o["cup_candidato"], "affidabilita": o["cup_candidato_affidabilita"], "importo_coincide": o["cup_candidato_importo_coincide"],
        "duplicato": o["cup_candidato_duplicato"], "descrizione": o["cup_candidato_descrizione"], "costo": r2(o["cup_candidato_costo"]),
        "anno": o["cup_candidato_anno"], "link": o["cup_candidato_link"],
    })
    geo = o["geo"][0] if o["geo"] else None
    return pulito({
        "cod": o["cod_int_amm"], "titolo": (o["descrizione_intervento"] or "").strip(), "descrizione": (o["descrizione"] or "").strip() if o["descrizione"] != o["descrizione_intervento"] else None,
        "tavola": o["tavola"], "cui": o["cui"], "cup": o["cup"], "cup_stato": o["cup_stato"], "cup_2026_mancante": o["cup_2026_mancante"] or None,
        "opencup": o["opencup_link"], "cup_candidato": candidato, "rup": o["rup"], "affidamento": o["annualita_avvio_affidamento"],
        "lotto": o["lotto_funzionale"] or None, "complesso": o["lavoro_complesso"] or None,
        "nuts": o["nuts"], "tipologia": o["tipologia"], "sottosettore": o["settore_sottosettore"], "settore": o["settore"], "priorita": o["priorita"],
        "c1": r2(o["costo_1_anno"]), "c2": r2(o["costo_2_anno"]), "c3": r2(o["costo_3_anno"]), "successive": r2(o["costi_annualita_successive"]) or None,
        "triennio": r2(o["importo_triennio"]), "complessivo": r2(o["importo_complessivo"]),
        "immobili": r2(o["valore_immobili_scheda_c"]) or None, "mutuo_scadenza": o["scadenza_ultima_mutuo"],
        "privato": r2(o["capitale_privato_importo"]) or None, "privato_tipologia": o["capitale_privato_tipologia"],
        "variato": o["intervento_aggiunto_variato"], "fonti": fonti, "annuale": annuale,
        "circoscrizione": geo[0] if geo else None, "quartiere": geo[1] if geo else None, "upl": geo[2] if geo else None,
        "localizzato": bool(o["pos"]),
    })


def geometrie(sorgenti, per_cod):
    """Punti, linee e poligoni del gpkg in WGS84, con i dati essenziali del primo intervento citato."""
    feats = []
    with tempfile.TemporaryDirectory() as tmp:
        for strato in ("poligoni", "linee", "punti"):   # i poligoni sotto, i punti sopra
            out = Path(tmp) / f"{strato}.geojson"
            subprocess.run(["ogr2ogr", "-f", "GeoJSON", str(out), str(sorgenti / "interventi_oopp_2026_2028_v2.gpkg"), strato,
                            "-t_srs", "EPSG:4326", "-lco", "COORDINATE_PRECISION=6"], check=True, capture_output=True)
            for f in json.loads(out.read_text(encoding="utf-8"))["features"]:
                p = f["properties"]
                chiave = (p.get("cod_int") or p.get("cod_assegnato") or "").strip()
                codici = [c for c in chiave.split(";") if c]
                righe = [per_cod[c] for c in codici if c in per_cod]
                if not righe:   # geometria non assegnata a nessun intervento: la mappa originale non la mostra
                    continue
                classe = p.get("classe")
                prop = pulito({
                    "cod": ";".join(c for c in codici if c in per_cod),
                    "n": len(righe) if len(righe) > 1 else None,
                    "titolo": righe[0]["titolo"] if len(righe) == 1 else f"{righe[0]['titolo']} (+{len(righe) - 1})",
                    "settore": righe[0].get("settore"),
                    "settore_nome": SETTORI.get(righe[0].get("settore")),
                    "annualita": ANNUALITA.get(classe),
                    "importo": r2(sum(r.get("triennio") or 0 for r in righe)),
                    "classe": classe if classe in (1, 2, 3) else None,
                    "origine": p.get("origine") if strato == "punti" else None,
                    "cup": righe[0].get("cup") if len(righe) == 1 else None,
                    "circoscrizione": p.get("Circoscrizione"), "quartiere": p.get("Quartiere"),
                    "tipo": {"punti": "punto", "linee": "linea", "poligoni": "poligono"}[strato],
                })
                feats.append({"type": "Feature", "properties": prop, "geometry": f["geometry"]})
    return feats


def sintesi(elenco, quadro, n_geom):
    def per(campo, chiave=None):
        chiave = chiave or (lambda o: o.get(campo))
        g = defaultdict(lambda: {"n": 0, "importo": 0.0})
        for o in elenco:
            v = chiave(o)
            if v is None:
                continue
            g[v]["n"] += 1
            g[v]["importo"] += o.get("triennio") or 0
        return [{"voce": k, "n": v["n"], "importo": r2(v["importo"])} for k, v in sorted(g.items(), key=lambda kv: -kv[1]["importo"])]

    totali = {"1": sum(o.get("c1", 0) for o in elenco), "2": sum(o.get("c2", 0) for o in elenco), "3": sum(o.get("c3", 0) for o in elenco)}
    non_loc = [o for o in elenco if not o["localizzato"]]
    return {
        "n": len(elenco), "importo_triennio": r2(sum(o.get("triennio", 0) for o in elenco)),
        "importo_complessivo": r2(sum(o.get("complessivo", 0) for o in elenco)),
        "per_anno": [{"voce": str(2025 + int(k)), "importo": r2(v), "n": sum(1 for o in elenco if o.get(f"c{k}"))} for k, v in totali.items()],
        "n_localizzati": len(elenco) - len(non_loc), "n_non_localizzati": len(non_loc), "importo_non_localizzati": r2(sum(o.get("triennio", 0) for o in non_loc)),
        "geometrie": n_geom,
        "per_settore": per("settore", lambda o: SETTORI.get(o.get("settore"), o.get("settore"))),
        "per_sottosettore": per("sottosettore"), "per_tipologia": per("tipologia"),
        "per_circoscrizione": per("circoscrizione"),
        "con_cup": sum(1 for o in elenco if o.get("cup")), "cup_2026_mancante": sum(1 for o in elenco if o.get("cup_2026_mancante")),
        "in_elenco_annuale": sum(1 for o in elenco if o.get("annuale")),
        "maggiori": [{"cod": o["cod"], "titolo": o["titolo"], "importo": o.get("triennio")} for o in sorted(elenco, key=lambda o: -(o.get("triennio") or 0))[:10]],
        "risorse": quadro,
    }


def leggi_quadro(sorgenti):
    righe = []
    with open(sorgenti / "quadro_risorse.csv", encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            v = [float(r[k].replace(",", "")) for k in ("Primo_anno", "Secondo_anno", "Terzo_anno", "Importo_totale")]
            righe.append({"voce": r["Tipologia_risorsa"], "anni": v[:3], "totale": v[3]})
    return righe


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--sorgenti", type=Path, default=SORGENTI)
    ap.add_argument("--uscita", type=Path, default=USCITA)
    a = ap.parse_args()

    grezzi = json.loads((a.sorgenti / "interventi.json").read_text(encoding="utf-8"))
    elenco = [intervento(o) for o in grezzi]
    totale = sum(o.get("triennio", 0) for o in elenco)
    if not SOGLIA_INTERVENTI[0] <= len(elenco) <= SOGLIA_INTERVENTI[1] or abs(totale - TOTALE_ATTESO) > 1:
        sys.exit(f"Interventi fuori soglia: {len(elenco)} per {totale:,.2f} €: non scrivo nulla.")
    if len({o["cod"] for o in elenco}) != len(elenco):
        sys.exit("Codici intervento duplicati: non scrivo nulla.")
    feats = geometrie(a.sorgenti, {o["cod"]: o for o in elenco})
    if not SOGLIA_GEOMETRIE[0] <= len(feats) <= SOGLIA_GEOMETRIE[1]:
        sys.exit(f"Geometrie fuori soglia: {len(feats)}: non scrivo nulla.")

    a.uscita.mkdir(parents=True, exist_ok=True)
    dump = lambda nome, d: (a.uscita / nome).write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    dump("interventi.geojson", {"type": "FeatureCollection", "features": feats})
    dump("elenco.json", elenco)
    s = sintesi(elenco, leggi_quadro(a.sorgenti), dict(Counter(f["properties"]["tipo"] for f in feats)))
    dump("sintesi.json", s)
    dump("riepilogo.json", {"interventi": len(elenco), "importo_triennio": s["importo_triennio"], "geometrie": s["geometrie"],
                            "localizzati": s["n_localizzati"], "non_localizzati": s["n_non_localizzati"]})
    print(f"{len(elenco)} interventi ({s['n_localizzati']} localizzati), {len(feats)} geometrie, {totale:,.2f} €")


if __name__ == "__main__":
    main()
