"""Opere pubbliche localizzate nella città di Palermo (BDAP-MOP, Ragioneria generale dello Stato) → dati/opere/.

Fonte: Open BDAP, Monitoraggio Opere Pubbliche (dati osservati al 30/09/2026), licenza «CC BY - Libero riuso citando la fonte»,
https://bdap-opendata.rgs.mef.gov.it/ . Due dataset uniti sul CUP:
  Localizzazione Geografica Opere Pubbliche MOP   regione, provincia e comune di ogni opera (nessun indirizzo, nessuna coordinata)
  Progetti Opere Pubbliche MOP - Sicilia          titolare, settore, tipologia, importi, date di fase
Cruscotto Italia (https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#opere) mostra gli stessi dati per il Comune di Palermo
(347 progetti = 320 attivi + 27 chiusi): serve da confronto, non come fonte. Qui si conta un'opera per CUP: 10 CUP hanno due codici
locali di progetto, per questo le opere del Comune sono 337.

Uso: python3 scripts/opere.py [--cache DIR] [--riscarica] [--uscita DIR] [--progetti FILE --localizzazione FILE]

Regole:
  1. si tengono i CUP localizzati solo nel comune di Palermo (regione 19, provincia 082, comune 053), di qualunque titolare: Comune, Città
     Metropolitana, ANAS, IACP, aziende sanitarie, Università, scuole…; si scartano i CUP localizzati anche altrove (opere di rete, programmi);
  2. il file non ha coordinate: la posizione si ricava dall'indirizzo scritto nella descrizione dell'opera («titolo*INDIRIZZO*dettagli»,
     come nel PNRR) cercandolo nei civici già nel repo (dati/civici-omi/), con le stesse funzioni di scripts/pnrr.py;
  3. gli indirizzi generici («Territorio comunale», «Centro storico», «Quartiere …») non si posizionano; nessuna «sede» di ripiego (finirebbero
     tutte nello stesso punto): le opere senza posizione restano nel CSV, nella tabella, nei grafici e nel menu a tendina della scheda;
  4. «stato» è quello del CUP (ATTIVO o CHIUSO), non l'avanzamento: la `fase` si ricava dalle date effettive dichiarate dal titolare;
  5. se un CUP compare con più titolari si tiene il primo e gli altri vanno in `altri_titolari`;
  6. gli importi sono quelli dichiarati dai titolari: i finanziamenti hanno valori anomali (singole opere da centinaia di milioni alla voce
     «altre fonti»), per questo la sintesi totalizza solo il costo dei lavori e non i finanziamenti.
Se le opere trovate sono fuori soglia (file cambiato o rotto) lo script non tocca i dati già pubblicati.

Scrive in dati/opere/:
  opere.geojson       un punto per opera con una posizione (civico esatto o solo la via)
  opere_palermo.csv   una riga per opera, con o senza posizione
  elenco.json         le opere senza punto sulla mappa, per titolare (menu a tendina della scheda)
  sintesi.json        aggregati su tutte le opere (settore, stato, fase, anno di fine lavori, titolare) per i grafici della scheda
  riepilogo.json      conteggi dell'esecuzione
  README.md           fonte, licenza, data, conteggi
"""
import argparse
import csv
import json
import re
import shutil
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

import pnrr   # Civici, separa_indirizzo, numero: stessa normalizzazione degli indirizzi del layer PNRR

RADICE = Path(__file__).resolve().parent.parent
CKAN = "https://bdap-opendata.rgs.mef.gov.it/SpodCkanApi/api/3/action/package_search"
DATASET = "spd_mop_prg_mon_reg19_01_9999"   # Progetti Opere Pubbliche MOP - Sicilia
DATASET_LOC = "spd_mop_loc_mon_local_01_9999"   # Localizzazione Geografica Opere Pubbliche MOP
PALERMO = ("19", "082", "053")   # regione, provincia, comune nel dataset di localizzazione
CF_COMUNE = "80016350821"
COMUNE = "COMUNE DI PALERMO"   # i18n-ok: valore del campo «titolare» nella fonte
LICENZA = "CC BY - Libero riuso citando la fonte"
FONTE = "Open BDAP, Ragioneria generale dello Stato: Progetti Opere Pubbliche MOP - Sicilia"
LINK_FONTE = "https://bdap-opendata.rgs.mef.gov.it/"
SOGLIA_OPERE = (1000, 1800)   # opere attese a Palermo (oggi 1.352): fuori soglia il file è cambiato o rotto
SOGLIA_COMUNE = (250, 450)   # di cui del Comune (oggi 337 CUP, 347 progetti)
CODEC = "cp1252"
TOP_TIPOLOGIE = 6

# indirizzi che non indicano un luogo: non si cercano nei civici (il confronto per parole darebbe falsi positivi)
GENERICO = re.compile(r"\b(TERRITORIO|COMUNALE|COMUNE DI|CITTA|CITTÀ|VARIE|DIVERSE|CENTRO STORICO|CITTA STORICA|QUARTIERE|MANDAMENT\w*|ZONA)\b", re.IGNORECASE)

# colonne della fonte (confronto senza accenti e simboli: l'intestazione ha caratteri rotti) → nome del campo
TESTO = {
    "codice_locale": "Codice Locale Progetto", "cup": "Codice CUP", "descrizione": "Descrizione CUP Integrale", "stato": "Descrizione Stato CUP",
    "natura": "Natura Intervento", "tipologia": "Tipologia Intervento", "settore": "Settore Interv Inv", "sottosettore": "Sottosettore Interv Inv",
    "categoria": "Categoria Interv Inv", "titolare": "Descrizione Titolare", "cf_titolare": "Codice Fiscale Titolare",
}
IMPORTI = {
    "costo_previsto": "Costo Lavori Previsto", "somme_previste": "Somme a disposizione Previste", "oneri_previsti": "Oneri Investimento Previsti",
    "costo_effettivo": "Costo Lavori Effettivo", "fin_statali": "Finanziamenti Statali", "fin_europei": "Finanziamenti Europei",
    "fin_enti": "Finanziamenti Enti Territorial", "fin_privati": "Finanziamenti Privati", "fin_altri": "Altre fonti di finanziamento",
    "da_reperire": "Finanziamenti da reperire", "economie": "Totale Economie",
}
DATE = {
    "prog_inizio_eff": "Inizio progettazione effettiva", "prog_fine_eff": "Fine progettazione effettiva",
    "esec_inizio_prev": "Inizio esecuzione prevista", "esec_fine_prev": "Fine esecuzione prevista",
    "esec_inizio_eff": "Inizio esecuzione effettiva", "esec_fine_eff": "Fine esecuzione effettiva",
    "concl_fine_prev": "Fine conclusione prevista", "concl_inizio_eff": "Inizio conclusione effettiva", "concl_fine_eff": "Fine conclusione effettiva",
    "funz_inizio_eff": "Inizio funzionalit effettiva",
}
FASI = ("In funzione", "Lavori conclusi", "Esecuzione terminata", "In esecuzione", "In progettazione", "Fase non indicata")


def chiave_colonna(nome):
    """«Data Inizio Validità CUP» e la stessa con un carattere rotto → «datainiziovaliditcup»: si confrontano senza accenti né simboli."""
    return re.sub(r"[^a-z0-9]", "", str(nome).lower())


def data_it(s):
    """«2023-12-01» → «01/12/2023»; il segnaposto 9999-12-31 e il vuoto → None."""
    m = re.fullmatch(r"(\d{4})-(\d\d)-(\d\d)(?:[ T].*)?", (s or "").strip())
    if not m or m.group(1) == "9999":
        return None
    return f"{m.group(3)}/{m.group(2)}/{m.group(1)}"


def fase(o):
    """Avanzamento ricavato dalle date effettive dichiarate (la fonte dà solo lo stato del CUP)."""
    if o.get("funz_inizio_eff"):
        return "In funzione"
    if o.get("concl_fine_eff") or o.get("concl_inizio_eff"):
        return "Lavori conclusi"
    if o.get("esec_fine_eff"):
        return "Esecuzione terminata"
    if o.get("esec_inizio_eff"):
        return "In esecuzione"
    if o.get("prog_inizio_eff") or o.get("prog_fine_eff"):
        return "In progettazione"
    return "Fase non indicata"


def frase(testo):
    return re.sub(r"\s+", " ", (testo or "").strip())


def indirizzo_opera(descrizione):
    """La descrizione è «titolo*INDIRIZZO*dettagli». None se manca, è troppo lungo o è generico («Territorio comunale»)."""
    parti = [x.strip() for x in (descrizione or "").split("*")]
    if len(parti) >= 3:
        testo = parti[1]
    elif len(parti) == 2 and re.match(r"(" + "|".join(pnrr.TIPI_VIA) + r")\b", parti[1], re.IGNORECASE):
        testo = parti[1]
    else:
        return None
    testo = re.sub(r"^(via|viale|piazza)\s+(?=(via|viale|piazza|vie)\b)", "", testo, flags=re.IGNORECASE)   # «VIA VIA MELI»
    testo = re.sub(r"[,\s]+(snc|s\.n\.c\.?)\s*$", "", testo, flags=re.IGNORECASE)   # «VIA GERMANESE SNC»
    if not testo or len(testo) > 80 or not re.search(r"[A-Za-z]{3}", testo) or GENERICO.search(testo):
        return None
    return testo


def titolo_e_dettagli(descrizione):
    parti = [frase(x) for x in (descrizione or "").split("*")]
    titolo = parti[0] if parti else ""
    dettagli = " · ".join(x for x in parti[2:] if x and x.lower() != titolo.lower())
    return titolo, dettagli


# ---------- lettura del CSV ----------

def righe_csv(percorso):
    """Righe come {chiave_colonna: valore}."""
    csv.field_size_limit(sys.maxsize)
    with open(percorso, encoding=CODEC, newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            yield {chiave_colonna(k): (v or "") for k, v in r.items() if k}


def localizzate_a_palermo(percorso):
    """CUP localizzati solo a Palermo: (insieme dei CUP, n. di quelli scartati perché anche altrove)."""
    palermo, altrove = set(), set()
    for r in righe_csv(percorso):
        cup = r.get(chiave_colonna("Codice CUP"), "").strip().upper()
        if (r.get(chiave_colonna("Codice Regione")), r.get(chiave_colonna("Codice Provincia")), r.get(chiave_colonna("Codice Comune"))) == PALERMO:
            palermo.add(cup)
        else:
            altrove.add(cup)
    return palermo - altrove, len(palermo & altrove)


def opere_di_palermo(percorso, cup_richiesti):
    """Un dizionario per CUP richiesto, letto dal file dei progetti. Con più titolari tiene quello del Comune, se c'è, altrimenti il primo;
    gli altri vanno in `altri_titolari`."""
    col = lambda r, nome: r.get(chiave_colonna(nome), "")
    per_cup = {}
    for r in righe_csv(percorso):
        cup = col(r, "Codice CUP").strip().upper()
        if cup not in cup_richiesti:
            continue
        o = {k: frase(col(r, v)) or None for k, v in TESTO.items()}
        o["cup"] = cup
        for k, v in IMPORTI.items():
            o[k] = pnrr.numero(col(r, v))
        for k, v in DATE.items():
            o[k] = data_it(col(r, v))
        o["fase"] = fase(o)
        o["inizio_cup"] = data_it(col(r, "Data Inizio Validit CUP"))
        precedente = per_cup.get(cup)
        if precedente is None:
            per_cup[cup] = o
            continue
        tieni, scarta = (o, precedente) if o["cf_titolare"] == CF_COMUNE and precedente["cf_titolare"] != CF_COMUNE else (precedente, o)
        altri = [*tieni.get("altri_titolari", []), *scarta.get("altri_titolari", [])]
        if scarta["titolare"] and scarta["titolare"] != tieni["titolare"]:
            altri.append(scarta["titolare"])
        if altri:
            tieni["altri_titolari"] = altri
        per_cup[cup] = tieni
    return list(per_cup.values())


def costruisci(righe, civici):
    """(elenco di proprietà, feature GeoJSON, contatori) per le opere del Comune."""
    elenco, feature, contatori = [], [], Counter()
    for o in sorted(righe, key=lambda x: x["cup"]):
        p = {k: v for k, v in o.items() if k != "descrizione"}
        p["titolo"], p["dettagli"] = titolo_e_dettagli(o.get("descrizione"))
        p["fine_anno"] = (p.get("concl_fine_prev") or p.get("esec_fine_prev") or "")[-4:] or None
        p["indirizzo"] = indirizzo_opera(o.get("descrizione"))
        pos = civici.posizione(p["indirizzo"]) if p["indirizzo"] else None
        if pos:
            p["precisione"] = pos[2]
            p["lon"], p["lat"] = pos[0], pos[1]
            contatori["posizione_" + pos[2]] += 1
            feature.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [pos[0], pos[1]]},
                            "properties": {k: v for k, v in p.items() if k not in ("lon", "lat") and v is not None}})
        else:
            p["precisione"] = None
            contatori["indirizzo_non_trovato" if p["indirizzo"] else "senza_indirizzo_utile"] += 1
        elenco.append(p)
    return elenco, feature, contatori


# ---------- sintesi per i grafici ----------

TOP_TITOLARI = 10


def _gruppi(elenco, chiave, vuoto="n.d."):
    """[{voce, n, costo}] per valore di `chiave`, per numero di opere decrescente; `costo` = costo dei lavori previsto."""
    n, costo = Counter(), Counter()
    for p in elenco:
        v = chiave(p) or vuoto
        n[v] += 1
        costo[v] += p.get("costo_previsto") or 0
    return [{"voce": v, "n": n[v], "costo": round(costo[v], 2)} for v, _ in n.most_common()]


def _con_mappa(gruppi, elenco):
    """Aggiunge a ogni titolare quante delle sue opere hanno una posizione in mappa (`n_mappa`): il filtro non mostrerebbe le altre."""
    sulla_mappa = Counter(p.get("titolare") or "n.d." for p in elenco if p.get("precisione"))
    return [{**g, "n_mappa": sulla_mappa[g["voce"]]} for g in gruppi]


def sintesi(elenco, su_mappa, estrazione):
    """Aggregati su tutte le opere di Palermo (non solo quelle in mappa). Niente totali sui finanziamenti: vedi l'intestazione."""
    per_anno = sorted((g for g in _gruppi(elenco, lambda p: p.get("fine_anno"), vuoto=None) if g["voce"]), key=lambda g: g["voce"])
    return {
        "estrazione": estrazione,
        "n": len(elenco), "su_mappa": su_mappa,
        "costo_previsto": round(sum(p.get("costo_previsto") or 0 for p in elenco), 2),
        "costo_effettivo": round(sum(p.get("costo_effettivo") or 0 for p in elenco), 2),
        "per_settore": _gruppi(elenco, lambda p: p.get("settore")),
        "per_stato": _gruppi(elenco, lambda p: p.get("stato")),
        "per_fase": sorted(_gruppi(elenco, lambda p: p.get("fase")), key=lambda g: FASI.index(g["voce"]) if g["voce"] in FASI else 99),
        "per_anno_fine": per_anno,
        "senza_anno_fine": sum(1 for p in elenco if not p.get("fine_anno")),
        "per_tipologia": _gruppi(elenco, lambda p: p.get("tipologia"))[:TOP_TIPOLOGIE],
        "totali_titolare": dict(Counter(p.get("titolare") for p in elenco if p.get("titolare")).most_common()),   # per la legenda («43 di 189»)
        "per_titolare": _con_mappa(_gruppi(elenco, lambda p: p.get("titolare"))[:TOP_TITOLARI], elenco),
    }


def elenco_senza_punto(elenco):
    """[{voce, n, progetti}] con le opere senza posizione, per titolare (il Comune per primo): sulla mappa non si trovano, si aprono dal menu."""
    pubbliche = lambda p: {k: v for k, v in p.items() if k not in ("lon", "lat") and v is not None}
    per = {}
    for p in sorted((x for x in elenco if not x.get("precisione")), key=lambda x: (x.get("titolo") or "").lower()):
        per.setdefault(p.get("titolare") or "n.d.", []).append(pubbliche(p))
    return [{"voce": v, "n": len(l), "progetti": l} for v, l in sorted(per.items(), key=lambda kv: (kv[0] != COMUNE, -len(kv[1])))]


# ---------- file di uscita ----------

COLONNE_CSV = ["cup", "titolo", "titolare", "stato", "fase", "settore", "sottosettore", "tipologia", "natura", "costo_previsto", "costo_effettivo",
               "somme_previste", "oneri_previsti", "fin_statali", "fin_europei", "fin_enti", "fin_privati", "fin_altri", "da_reperire", "economie",
               "esec_inizio_prev", "esec_fine_prev", "esec_inizio_eff", "esec_fine_eff", "concl_fine_prev", "concl_fine_eff", "funz_inizio_eff",
               "indirizzo", "precisione", "lon", "lat", "dettagli"]


def scrivi(uscita, elenco, feature, contatori, estrazione):
    uscita.mkdir(parents=True, exist_ok=True)
    compatto = dict(ensure_ascii=False, separators=(",", ":"))
    (uscita / "opere.geojson").write_text(json.dumps({"type": "FeatureCollection", "estrazione": estrazione, "features": feature}, **compatto), encoding="utf-8")
    with open(uscita / "opere_palermo.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, COLONNE_CSV, extrasaction="ignore")
        w.writeheader()
        w.writerows(elenco)
    (uscita / "elenco.json").write_text(json.dumps({"estrazione": estrazione, "titolari": elenco_senza_punto(elenco)}, **compatto), encoding="utf-8")
    (uscita / "sintesi.json").write_text(json.dumps(sintesi(elenco, len(feature), estrazione), **compatto), encoding="utf-8")
    r = {"estrazione": estrazione, "opere": len(elenco), "su_mappa": len(feature), "del_comune": sum(1 for p in elenco if p.get("titolare") == COMUNE),
         **dict(contatori), "costo_previsto_eur": round(sum(p.get("costo_previsto") or 0 for p in elenco), 2),
         "per_stato": dict(Counter(p.get("stato") or "?" for p in elenco)), "per_fase": dict(Counter(p["fase"] for p in elenco)),
         "per_titolare": dict(Counter(p.get("titolare") or "?" for p in elenco).most_common(10))}
    (uscita / "riepilogo.json").write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (uscita / "README.md").write_text(readme(r), encoding="utf-8")
    return r


def readme(r):
    costo = f"{r['costo_previsto_eur']:,.0f}".replace(",", ".")
    return f"""# Opere pubbliche nella città di Palermo

Generato da `scripts/opere.py`. Non modificare a mano.

- **Fonte**: {FONTE}, <{LINK_FONTE}>; localizzazione: dataset «Localizzazione Geografica Opere Pubbliche MOP»
- **Licenza**: {LICENZA}
- **Dati osservati al**: {r['estrazione']}
- **Opere** localizzate solo a Palermo, di qualunque titolare: {r['opere']} (di cui {r['del_comune']} del Comune; costo dei lavori previsto {costo} €); stato: {', '.join(f'{k} {v}' for k, v in r['per_stato'].items())}
- **Sulla mappa**: {r['su_mappa']} (civico {r.get('posizione_civico', 0)}, solo la via {r.get('posizione_via', 0)}); le altre hanno un indirizzo non trovato nei civici ({r.get('indirizzo_non_trovato', 0)}) o generico/assente ({r.get('senza_indirizzo_utile', 0)}) e sono in `opere_palermo.csv`
- Confronto per il Comune: <https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#opere> (stessi dati BDAP-MOP; conta 347 progetti, qui 337 CUP perché 10 CUP hanno due codici locali)

## File

| File | Contenuto |
|---|---|
| `opere.geojson` | un punto per opera con posizione; `precisione` è «civico» o «via» (la seconda approssimata) |
| `opere_palermo.csv` | tutte le opere, con o senza posizione |
| `elenco.json` | le opere senza punto sulla mappa, per titolare, per il menu a tendina della scheda |
| `sintesi.json` | aggregati su tutte le opere, per i grafici della scheda |
| `riepilogo.json` | conteggi dell'ultima esecuzione |

`stato` è quello del CUP (ATTIVO o CHIUSO); `fase` è ricavata dalle date effettive dichiarate. Gli importi sono quelli dichiarati dai titolari e i
finanziamenti hanno valori anomali: non vanno sommati. Regole e limiti: intestazione di `scripts/opere.py`. Aggiornamento: `AGGIORNAMENTO.md`.
"""


# ---------- scarico ----------

INTESTAZIONI = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) DigitalTwinPalermo/1.0", "Accept": "text/csv,*/*;q=0.8"}
TENTATIVI = 3


class ErroreScarico(OSError):
    """Scarico fallito dopo i tentativi: il messaggio dice indirizzo e motivo."""


def _leggi(indirizzo, destinazione=None):
    ultimo = None
    for tentativo in range(1, TENTATIVI + 1):
        try:
            with urllib.request.urlopen(urllib.request.Request(indirizzo, headers=INTESTAZIONI), timeout=300) as r:
                if destinazione is None:
                    return r.read()
                with open(destinazione.with_suffix(".parte"), "wb") as f:
                    shutil.copyfileobj(r, f)
            destinazione.with_suffix(".parte").replace(destinazione)
            return destinazione
        except urllib.error.HTTPError as e:
            ultimo = f"HTTP {e.code} {e.reason}"
            if e.code in (401, 403, 404):
                break
        except OSError as e:
            ultimo = f"{type(e).__name__}: {e}"
        time.sleep(2 * tentativo)
    if destinazione is not None:
        destinazione.with_suffix(".parte").unlink(missing_ok=True)
    raise ErroreScarico(f"impossibile scaricare {indirizzo}: {ultimo}")


def indirizzo_csv(nome_dataset):
    """(URL del CSV, data dei dati) dal catalogo CKAN: si cerca per nome (la ricerca per testo del catalogo trova solo «MOP»: 127 dataset in una pagina) perché l'UUID della risorsa può cambiare; https al posto di http."""
    dati = json.loads(_leggi(f"{CKAN}?{urllib.parse.urlencode({'q': 'MOP', 'rows': 500})}"))
    for d in dati.get("result", {}).get("results", []):
        if d.get("name") == nome_dataset:
            for r in d.get("resources", []):
                if (r.get("format") or "").lower() == "csv" and "datastore/dump" in (r.get("url") or ""):
                    osservati = re.search(r"osservati al (\d\d/\d\d/\d{4})", d.get("notes") or "")
                    return r["url"].replace("http://", "https://", 1), osservati.group(1) if osservati else (d.get("metadata_modified") or "")[:10]
    raise ErroreScarico(f"dataset {nome_dataset} non trovato nel catalogo BDAP")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cache", type=Path, default=RADICE / ".cache" / "opere", help="dove tenere i CSV scaricati (circa 90 MB)")
    ap.add_argument("--riscarica", action="store_true", help="scarica di nuovo anche se i file ci sono già")
    ap.add_argument("--progetti", type=Path, help="usa questo CSV dei progetti già scaricato (niente rete)")
    ap.add_argument("--localizzazione", type=Path, help="usa questo CSV di localizzazione già scaricato (niente rete)")
    ap.add_argument("--uscita", type=Path, default=RADICE / "dati" / "opere")
    ap.add_argument("--civici", type=Path, default=RADICE / "dati" / "civici-omi")
    args = ap.parse_args(argv)

    estrazione = None
    percorsi = {"progetti": args.progetti, "localizzazione": args.localizzazione}
    for chiave, dataset, nome in (("progetti", DATASET, "progetti_sicilia.csv"), ("localizzazione", DATASET_LOC, "localizzazione.csv")):
        if percorsi[chiave]:
            continue
        percorsi[chiave] = args.cache / nome
        try:
            url, data = indirizzo_csv(dataset)
            if chiave == "progetti":
                estrazione = data
            if args.riscarica or not percorsi[chiave].exists():
                args.cache.mkdir(parents=True, exist_ok=True)
                print(f"scarico {url}…", file=sys.stderr)
                _leggi(url, percorsi[chiave])
        except ErroreScarico as e:
            sys.exit(f"ERRORE: {e}")
    cup, anche_altrove = localizzate_a_palermo(percorsi["localizzazione"])
    righe = opere_di_palermo(percorsi["progetti"], cup)
    del_comune = sum(1 for o in righe if o["titolare"] == COMUNE)
    print(f"CUP solo a Palermo: {len(cup)} (scartati perché anche altrove: {anche_altrove}); opere trovate: {len(righe)}, del Comune: {del_comune}", file=sys.stderr)
    if not SOGLIA_OPERE[0] <= len(righe) <= SOGLIA_OPERE[1] or not SOGLIA_COMUNE[0] <= del_comune <= SOGLIA_COMUNE[1]:
        sys.exit(f"ERRORE: {len(righe)} opere ({del_comune} del Comune), attese {SOGLIA_OPERE} ({SOGLIA_COMUNE}): dati non toccati")
    elenco, feature, contatori = costruisci(righe, pnrr.Civici(args.civici))
    r = scrivi(args.uscita, elenco, feature, contatori, estrazione or "n.d.")
    print(json.dumps(r, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
