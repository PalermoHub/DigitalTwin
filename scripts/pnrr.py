"""Progetti PNRR localizzati nella sola città di Palermo → dati/pnrr/.

Fonte: catalogo open data di Italia Domani (Sogei / Struttura di missione PNRR), licenza CC BY 4.0
https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html
Si usano due famiglie di file, unite dal CUP:
  PNRR_Localizzazione.csv       dove sta ogni progetto (comune, indirizzo, CAP, percentuale); nessuna coordinata
  PNRR_Progetti_M1 … M7.csv     titolo, stato, importi, soggetto attuatore, date, classificazione CUP

Uso: python3 scripts/pnrr.py [--cache DIR] [--riscarica] [--uscita DIR]

Regole:
  1. si tengono i CUP con almeno una localizzazione a Palermo (Sicilia 019, Palermo 082, comune 053);
  2. si scartano quelli localizzati anche in altri comuni (programmi nazionali o regionali): non sono «lavori della città»;
  3. si uniscono ai file dei progetti sul CUP;
  4. la posizione si ricava dall'indirizzo, cercandolo nei civici già nel repo (dati/civici-omi/): nessun geocoder esterno.
     Senza indirizzo, o con indirizzo non trovato, il progetto resta nella tabella (CSV) ma non sulla mappa.

Scrive in dati/pnrr/:
  pnrr.geojson      un punto per CUP con una posizione (civico esatto o solo la via)
  pnrr_palermo.csv  una riga per CUP, con o senza posizione
  sintesi.json      aggregati su tutti i progetti (missione, stato, anno di fine, settore, attuatore) per i grafici della scheda
  riepilogo.json    conteggi dell'esecuzione
  README.md         fonte, data di estrazione, licenza, conteggi
"""
import argparse
import csv
import difflib
import json
import re
import shutil
import sys
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
BASE = "https://www.italiadomani.gov.it/content/dam/sogei-ng/opendata/"
LOCALIZZAZIONE = "PNRR_Localizzazione.csv"
PROGETTI = [f"PNRR_Progetti_M{n}.csv" for n in range(1, 8)]
LICENZA = "CC BY 4.0"
FONTE = "Italia Domani — Struttura di missione PNRR, Sogei (catalogo open data)"
# Palermo nei codici ISTAT dei file: regione 019, provincia 082, comune 053 (ISTAT 082053)
PALERMO = ("019", "082", "053")
# riquadro di Palermo: scarta le coordinate dei civici fuori città (stesso ordine di grandezza degli altri script)
LON_MIN, LON_MAX, LAT_MIN, LAT_MAX = 13.2, 13.5, 38.0, 38.25
SEZIONI_CIVICI = 32

# colonne dei file dei progetti che finiscono nei dati dell'app (il resto resta nella fonte)
CAMPI_TESTO = {
    "titolo": "Titolo Progetto", "sintesi": "Sintesi Progetto", "missione": "Missione", "missione_nome": "Descrizione Missione",
    "componente": "Componente", "componente_nome": "Descrizione Componente", "misura": "Descrizione Misura",
    "submisura": "Codice Univoco Submisura", "submisura_nome": "Descrizione Submisura", "titolare": "Amministrazione Titolare",
    "stato": "Stato Avanzamento Progetto", "natura": "CUP Descrizione Natura", "tipologia": "CUP Descrizione Tipologia",
    "settore": "CUP Descrizione Settore", "sottosettore": "CUP Descrizione Sottosettore", "categoria": "CUP Descrizione Categoria",
    "attuatore": "Soggetto Attuatore", "inizio_previsto": "Data Inizio Progetto Prevista", "inizio_effettivo": "Data Inizio Progetto Effettiva",
    "fine_prevista": "Data Fine Progetto Prevista", "fine_effettiva": "Data Fine Progetto Effettiva",
}
CAMPI_IMPORTO = {"pnrr": "Finanziamento PNRR", "totale": "Finanziamento Totale", "totale_pubblico": "Finanziamento Totale Pubblico"}
MAX_SINTESI = 600

# parole che aprono un indirizzo: serve per togliere i prefissi tipo «Palazzo D'Orleans - Piazza Indipendenza 21»
TIPI_VIA = ("via", "viale", "piazza", "piazzale", "piazzetta", "corso", "largo", "vicolo", "salita", "passaggio", "lungomare", "strada",
            "contrada", "discesa", "cortile", "foro", "rampa", "scalinata", "traversa", "stradella", "arco", "baglio", "borgo", "calata",
            "cala", "piano", "ponte", "scesa", "vico", "vial", "p.zza", "c.so", "v.le")


# ---------- testo e indirizzi (stessa normalizzazione di js/core/indirizzi.js) ----------

def normalizza(s):
    s = unicodedata.normalize("NFD", s.upper())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^A-Z0-9' ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def chiave_sezione(via):
    """File dei civici in cui sta una via: FNV-1a del nome su 32 file (stessa regola di js/core/compatto.js)."""
    h = 0x811C9DC5
    for c in via:
        h = ((h ^ ord(c)) * 0x01000193) & 0xFFFFFFFF
    return f"{h % SEZIONI_CIVICI:02d}"


def separa_indirizzo(testo):
    """«Via Gino Marinuzzi, 3» → («VIA GINO MARINUZZI», «3»). Civico «» se assente."""
    s = (testo or "").strip()
    if not s:
        return "", ""
    # via dal primo tipo di strada in poi: scarta i nomi di edifici davanti
    m = re.search(r"\b(" + "|".join(re.escape(t) for t in TIPI_VIA) + r")\b", s, re.IGNORECASE)
    if m:
        s = s[m.start():]
    s = re.sub(r"\b[nN](?:r|°|\.|ro)?\.?\s*(?=\d)", ", ", s)   # «N.3», «n° 12» → «, 3»
    parte_via, _, resto = s.partition(",")
    if not resto:
        m = re.search(r"\s(\d+)\s*([A-Za-z]?)\b", s)
        if m:
            parte_via, resto = s[:m.start()], m.group(0)
    numero = re.search(r"(\d+)\s*[/-]?\s*([A-Za-z])?\b", resto)
    civico = ""
    if numero:
        civico = numero.group(1) + (numero.group(2).upper() if numero.group(2) and len(numero.group(2)) == 1 else "")
    return normalizza(parte_via), civico


class Civici:
    """Indice via → civico → (lon, lat) letto dai file compatti di dati/civici-omi/ (un file per ogni via, scelto dall'hash)."""

    def __init__(self, cartella):
        self.cartella = Path(cartella)
        self.vie = json.loads((self.cartella / "civici_vie.json").read_text(encoding="utf-8"))
        self.norm = {via: normalizza(via) for via in self.vie}
        self.per_norm = defaultdict(list)
        for via, n in self.norm.items():
            self.per_norm[n].append(via)
        self._file = {}

    def _civici_della_via(self, via):
        chiave = chiave_sezione(via)
        if chiave not in self._file:
            self._file[chiave] = json.loads((self.cartella / "civici" / f"{chiave}.json").read_text(encoding="utf-8"))
        voce = self._file[chiave].get(via)
        if not voce:
            return {}
        elenco, lon, lat = voce
        x = y = 0
        out = {}
        for c, dx, dy in zip(elenco, lon, lat):
            x += dx
            y += dy
            out[c] = (x / 1e6, y / 1e6)
        return out

    def trova_via(self, via_norm):
        """Nome della via nell'indice, o None se assente o ambigua."""
        if via_norm in self.per_norm:
            return self.per_norm[via_norm][0]
        token = via_norm.split()
        if len(token) < 2:
            return None
        candidate = [v for v, n in self.norm.items() if all(t in n.split() for t in token)]
        if len(candidate) == 1:
            return candidate[0]
        vicine = difflib.get_close_matches(via_norm, list(self.per_norm), n=1, cutoff=0.93)   # refusi: «Emanule»
        return self.per_norm[vicine[0]][0] if vicine else None

    def posizione(self, indirizzo):
        """(lon, lat, precisione, via) con precisione «civico» o «via»; None se non si trova o cade fuori città."""
        via_norm, civico = separa_indirizzo(indirizzo)
        if not via_norm:
            return None
        via = self.trova_via(via_norm)
        if not via:
            return None
        civici = self._civici_della_via(via)
        # «4» quando esistono solo 4A, 4B…: si prende la prima variante
        esatto = civico if civico in civici else next((k for k in civici if civico and re.fullmatch(rf"{re.escape(civico)}[A-Z]", k)), None)
        if esatto:
            (lon, lat), precisione = civici[esatto], "civico"
        else:
            (lon, lat), precisione = self.vie[via], "via"
        if not (LON_MIN <= lon <= LON_MAX and LAT_MIN <= lat <= LAT_MAX):
            return None
        return round(lon, 6), round(lat, 6), precisione, via


# ---------- lettura dei CSV ----------

def righe_csv(percorso):
    csv.field_size_limit(sys.maxsize)
    with open(percorso, encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f, delimiter=";")


def numero(testo):
    """Importo dei file: «500000» o «1234,56»; vuoto → None."""
    s = (testo or "").strip()
    if not s:
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        v = float(s)
    except ValueError:
        return None
    return int(v) if v == int(v) else round(v, 2)


def localizzazioni(percorso):
    """CUP con almeno una localizzazione a Palermo → {'righe': [righe di Palermo], 'solo': True se non ha altri comuni}."""
    palermo = defaultdict(list)
    altrove = set()
    for r in righe_csv(percorso):
        cup = r["CUP"].strip()
        if (r["Regione"], r["Provincia"], r["Comune"]) == PALERMO:
            palermo[cup].append(r)
        else:
            altrove.add(cup)
    return {cup: {"righe": righe, "solo": cup not in altrove} for cup, righe in palermo.items()}


def progetti_dei(cup_richiesti, percorsi):
    """{cup: riga del file dei progetti} per i CUP richiesti; il primo file che lo contiene vince."""
    trovati = {}
    for p in percorsi:
        for r in righe_csv(p):
            cup = r["CUP"].strip()
            if cup in cup_richiesti and cup not in trovati:
                trovati[cup] = r
    return trovati


# ---------- composizione ----------

def proprieta(cup, loc_righe, progetto):
    """Proprietà piatte di un CUP: campi del progetto, importi e localizzazione. Senza progetto restano solo CUP e sede."""
    prima = next((r for r in loc_righe if r["Indirizzo"].strip()), loc_righe[0])
    p = {"cup": cup, "indirizzo": prima["Indirizzo"].strip() or None, "cap": prima["CAP"].strip() or None,
         "n_sedi": len(loc_righe), "submisura": prima["Codice Univoco Submisura"], "submisura_nome": prima["Descrizione Submisura"]}
    if progetto:
        for chiave, colonna in CAMPI_TESTO.items():
            valore = (progetto.get(colonna) or "").strip()
            p[chiave] = valore or None
        for chiave, colonna in CAMPI_IMPORTO.items():
            p[chiave] = numero(progetto.get(colonna))
        if p.get("sintesi") and len(p["sintesi"]) > MAX_SINTESI:
            p["sintesi"] = p["sintesi"][:MAX_SINTESI].rsplit(" ", 1)[0] + "…"
    p["con_dati_progetto"] = bool(progetto)
    return p


def costruisci(loc, progetti, civici):
    """(elenco di proprietà, feature GeoJSON, contatori) per i soli CUP localizzati solo a Palermo."""
    elenco, feature = [], []
    contatori = Counter()
    for cup in sorted(c for c, v in loc.items() if v["solo"]):
        p = proprieta(cup, loc[cup]["righe"], progetti.get(cup))
        contatori["con_dati_progetto" if p["con_dati_progetto"] else "senza_dati_progetto"] += 1
        pos = None
        for r in loc[cup]["righe"]:
            if r["Indirizzo"].strip():
                pos = civici.posizione(r["Indirizzo"])
                if pos and pos[2] == "civico":
                    break
        if pos:
            p["precisione"] = pos[2]
            p["lon"], p["lat"] = pos[0], pos[1]
            contatori["posizione_" + pos[2]] += 1
            feature.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [pos[0], pos[1]]},
                            "properties": {k: v for k, v in p.items() if k not in ("lon", "lat") and v is not None}})
        else:
            p["precisione"] = None
            contatori["indirizzo_non_trovato" if p["indirizzo"] else "senza_indirizzo"] += 1
        elenco.append(p)
    return elenco, feature, contatori


# ---------- sintesi per i grafici ----------

TOP_SETTORI = 6
TOP_ATTUATORI = 8


def _gruppi(elenco, chiave, vuoto="n.d."):
    """[{voce, n, pnrr}] per valore di `chiave`, in ordine di numero di progetti decrescente."""
    n, importo = Counter(), Counter()
    for p in elenco:
        v = chiave(p) or vuoto
        n[v] += 1
        importo[v] += p.get("pnrr") or 0
    return [{"voce": v, "n": n[v], "pnrr": round(importo[v], 2)} for v, _ in n.most_common()]


def sintesi(elenco, su_mappa, estrazione):
    """Aggregati su tutti i progetti di Palermo (non solo quelli in mappa): alimentano i grafici della scheda."""
    anno = lambda d: d[-4:] if d and re.fullmatch(r"\d\d/\d\d/\d{4}", d) else None
    per_anno = sorted(_gruppi(elenco, lambda p: anno(p.get("fine_prevista")), vuoto=None) or [], key=lambda g: g["voce"] or "")
    return {
        "estrazione": estrazione,
        "n": len(elenco), "su_mappa": su_mappa,
        "pnrr": round(sum(p.get("pnrr") or 0 for p in elenco), 2),
        "totale": round(sum(p.get("totale") or 0 for p in elenco), 2),
        "per_missione": sorted(_gruppi(elenco, lambda p: p.get("missione")), key=lambda g: g["voce"]),
        "per_stato": _gruppi(elenco, lambda p: p.get("stato")),
        "per_anno_fine": [g for g in per_anno if g["voce"]],
        "senza_data_fine": sum(1 for p in elenco if not anno(p.get("fine_prevista"))),
        "per_settore": _gruppi(elenco, lambda p: p.get("settore"))[:TOP_SETTORI],
        "per_attuatore": _gruppi(elenco, lambda p: p.get("attuatore"))[:TOP_ATTUATORI],
    }


# ---------- file di uscita ----------

COLONNE_CSV = ["cup", "titolo", "missione", "missione_nome", "componente_nome", "submisura", "submisura_nome", "stato", "settore",
               "tipologia", "attuatore", "pnrr", "totale", "inizio_previsto", "fine_prevista", "fine_effettiva", "indirizzo", "cap",
               "precisione", "lon", "lat", "n_sedi", "con_dati_progetto"]


def scrivi(uscita, elenco, feature, contatori, estrazione, file_mancanti):
    uscita.mkdir(parents=True, exist_ok=True)
    (uscita / "pnrr.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "estrazione": estrazione, "features": feature}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8")
    with open(uscita / "pnrr_palermo.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, COLONNE_CSV, extrasaction="ignore")
        w.writeheader()
        w.writerows(elenco)
    totale = sum(p["pnrr"] or 0 for p in elenco)
    (uscita / "sintesi.json").write_text(
        json.dumps(sintesi(elenco, len(feature), estrazione), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    r = {"estrazione": estrazione, "cup": len(elenco), "su_mappa": len(feature), **dict(contatori),
         "importo_pnrr_eur": totale, "per_missione": dict(Counter(p.get("missione") or "?" for p in elenco)),
         "per_stato": dict(Counter(p.get("stato") or "?" for p in elenco)), "file_progetti_mancanti": file_mancanti}
    (uscita / "riepilogo.json").write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (uscita / "README.md").write_text(readme(r), encoding="utf-8")
    return r


def readme(r):
    r = {**r, 'importo_it': f"{r['importo_pnrr_eur']:,.0f}".replace(',', '.')}
    return f"""# Progetti PNRR localizzati a Palermo

Generato da `scripts/pnrr.py` (workflow «Aggiorna PNRR»). Non modificare a mano.

- **Fonte**: {FONTE}, <https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html>
- **Licenza**: {LICENZA}, con citazione della fonte
- **Data di estrazione dei dati**: {r['estrazione']}
- **Progetti** localizzati solo a Palermo: {r['cup']} (finanziamento PNRR complessivo {r['importo_it']} €)
- **Sulla mappa**: {r['su_mappa']} (civico {r.get('posizione_civico', 0)}, solo la via {r.get('posizione_via', 0)}); gli altri sono in `pnrr_palermo.csv`
- Progetti localizzati anche in altri comuni: esclusi

## File

| File | Contenuto |
|---|---|
| `pnrr.geojson` | un punto per progetto con posizione; `precisione` è «civico» o «via» (posizione approssimata) |
| `pnrr_palermo.csv` | tutti i progetti, con o senza posizione |
| `sintesi.json` | aggregati su tutti i progetti, per i grafici della scheda |
| `riepilogo.json` | conteggi dell'ultima esecuzione |

Regole di selezione, fonti e limiti: intestazione di `scripts/pnrr.py`. Per aggiornare: workflow «Aggiorna PNRR» (avvio manuale).
"""


# ---------- scarico ----------

def scarica(nome, cartella, riscarica=False):
    destinazione = cartella / nome
    if destinazione.exists() and not riscarica:
        return destinazione
    cartella.mkdir(parents=True, exist_ok=True)
    richiesta = urllib.request.Request(BASE + nome, headers={"User-Agent": "Mozilla/5.0"})   # senza User-Agent il sito risponde 403
    print(f"scarico {nome}…", file=sys.stderr)
    with urllib.request.urlopen(richiesta, timeout=300) as r, open(destinazione.with_suffix(".parte"), "wb") as f:
        shutil.copyfileobj(r, f)
    destinazione.with_suffix(".parte").replace(destinazione)
    return destinazione


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cache", type=Path, default=RADICE / ".cache" / "pnrr", help="dove tenere i CSV scaricati (circa 330 MB)")
    ap.add_argument("--riscarica", action="store_true", help="scarica di nuovo anche se i file ci sono già")
    ap.add_argument("--uscita", type=Path, default=RADICE / "dati" / "pnrr")
    ap.add_argument("--civici", type=Path, default=RADICE / "dati" / "civici-omi")
    args = ap.parse_args(argv)

    loc = localizzazioni(scarica(LOCALIZZAZIONE, args.cache, args.riscarica))
    estrazioni = {r["Data di Estrazione"] for v in loc.values() for r in v["righe"]}
    estrazione = sorted(estrazioni, key=lambda d: d[6:] + d[3:5] + d[:2])[-1] if estrazioni else None
    solo = {c for c, v in loc.items() if v["solo"]}
    print(f"CUP con Palermo: {len(loc)}  solo Palermo: {len(solo)}", file=sys.stderr)

    percorsi, mancanti = [], []
    for nome in PROGETTI:
        try:
            percorsi.append(scarica(nome, args.cache, args.riscarica))
        except OSError as e:
            mancanti.append(nome)
            print(f"ATTENZIONE: {nome} non scaricato ({e})", file=sys.stderr)
    progetti = progetti_dei(solo, percorsi)

    elenco, feature, contatori = costruisci(loc, progetti, Civici(args.civici))
    r = scrivi(args.uscita, elenco, feature, contatori, estrazione, mancanti)
    print(json.dumps(r, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
