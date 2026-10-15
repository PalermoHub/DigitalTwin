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
  4. la posizione si ricava dall'indirizzo, cercandolo nei civici già nel repo (dati/civici-omi/): nessun geocoder esterno;
  4b. se l'indirizzo della localizzazione manca o non si trova, si prova quello scritto nella descrizione del progetto
     (`Sintesi Progetto` ha la forma «descrizione*INDIRIZZO*descrizione»): proprietà `indirizzo_da = descrizione`;
  5. se il progetto non ha un indirizzo ma il soggetto attuatore è un istituto scolastico statale, si usa la sede dell'istituto
     (Indice delle Pubbliche Amministrazioni, agganciato per codice fiscale): precisione «sede», posizione approssimata.
     Se l'indirizzo della sede coincide con una scuola del layer «Scuole» dell'app (dati/scuole/scuole.geojson) si usano le coordinate
     di quel layer (proprietà `scuola`); le scuole che nel layer mancano (superiori, plessi non censiti) si posizionano con i civici.
     Lo stesso vale per il Comune di Palermo (sede: Palazzo delle Aquile). Senza posizione il progetto resta nella tabella (CSV) ma non
     sulla mappa. L'Università e gli altri enti non si posizionano sulla propria sede: troverebbero tutti nello stesso punto e non è
     dove si fa il lavoro;
  6. di Comune e Università l'elenco completo dei progetti, con posizione o no, va in `soggetti.json`: la scheda ha un menu a tendina
     per aprire la scheda di ogni progetto anche quando non ha un punto sulla mappa.

Scrive in dati/pnrr/:
  pnrr.geojson      un punto per CUP con una posizione (civico esatto o solo la via)
  pnrr_palermo.csv  una riga per CUP, con o senza posizione
  soggetti.json     elenco completo dei progetti di Comune e Università, per il menu a tendina della scheda
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
IPA_URL = ("https://indicepa.gov.it/ipa-dati/dataset/502ff370-1b2c-4310-94c7-f39ceb7500e3/resource/"
           "3ed63523-ff9c-41f6-a6fe-980f3d9e501f/download/amministrazioni.txt")
IPA_FILE = "ipa_amministrazioni.txt"
TIPO_SCUOLE = "Istituti di Istruzione Statale di Ogni Ordine e Grado"   # tipologia_istat dell'IPA
# Comune di Palermo: anche lui si posiziona sulla sede (Palazzo delle Aquile). Nei file PNRR ha il codice 00519560825, nell'IPA 80016350821:
# si aggancia per nome. {codice fiscale nei file PNRR: denominazione IPA}
ENTI_SULLA_SEDE = {"00519560825": "Comune di Palermo"}
# soggetti con molti progetti senza un luogo: la scheda ne elenca tutti con un menu a tendina (valore di `attuatore` nella fonte)
SOGGETTI_CON_ELENCO = ("COMUNE DI PALERMO", "UNIVERSITA' DEGLI STUDI DI PALERMO")
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
    "attuatore": "Soggetto Attuatore", "cf_attuatore": "Codice Fiscale Soggetto Attuatore", "inizio_previsto": "Data Inizio Progetto Prevista", "inizio_effettivo": "Data Inizio Progetto Effettiva",
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


def _romano(token):
    """«XXVII» → «27» (le vie con numeri romani nell'indice hanno le cifre)."""
    if len(token) < 2 or not re.fullmatch(r"[IVXL]+", token):
        return token
    valori = {"I": 1, "V": 5, "X": 10, "L": 50}
    n = 0
    for a, b in zip(token, token[1:] + " "):
        n += -valori[a] if b in valori and valori[b] > valori[a] else valori[a]
    return str(n)


TIPI_NORM = {normalizza(x) for x in TIPI_VIA}


def senza_tipo(norm):
    """Parole di un nome di via senza il tipo di strada (VIA, VIALE, PIAZZA…) e con i numeri romani in cifre."""
    return [_romano(x) for x in norm.split() if x not in TIPI_NORM and len(x) > 1]


MAX_DISTANZA_AMBIGUA = 0.005   # gradi (~500 m): più vie con lo stesso nome vicine tra loro non sono un problema


def chiave_sezione(via):
    """File dei civici in cui sta una via: FNV-1a del nome su 32 file (stessa regola di js/core/compatto.js)."""
    h = 0x811C9DC5
    for c in via:
        h = ((h ^ ord(c)) * 0x01000193) & 0xFFFFFFFF
    return f"{h % SEZIONI_CIVICI:02d}"


def separa_indirizzo(testo):
    """«Via Gino Marinuzzi, 3» → («VIA GINO MARINUZZI», «3»). Civico «» se assente."""
    s = (testo or "").strip()
    s = re.sub(r"[,\s-]*\b9\d{4}\b[,\s-]*(palermo\b)?", " ", s, flags=re.IGNORECASE)   # CAP (90100-90151) e «- 90142 Palermo»
    s = re.sub(r"[,\s-]+\bpalermo\b\s*(\(pa\))?\s*$", "", s, flags=re.IGNORECASE)      # «…, Palermo» in coda
    s = s.strip(" ,-")
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
        token = [x for x in via_norm.split() if len(x) > 1]   # le iniziali («G.») e i numeri romani isolati («I») non contano
        if len(token) < 2:
            return None
        candidate = [v for v, n in self.norm.items() if all(x in n.split() for x in token)]
        if len(candidate) == 1:
            return candidate[0]
        vicine = difflib.get_close_matches(via_norm, list(self.per_norm), n=1, cutoff=0.93)   # refusi: «Emanule»
        return self.per_norm[vicine[0]][0] if vicine else None

    def candidate(self, via_norm):
        """Vie dell'indice che corrispondono al testo: prima il nome esatto, poi ignorando il tipo di strada
        («Via del Fante» → «Viale del Fante», «Via Largo Camastra» → «Largo Camastra»)."""
        via = self.trova_via(via_norm)
        if via:
            return [via]
        q = senza_tipo(via_norm)
        if not q or len(" ".join(q)) < 5:
            return []
        return [v for v, n in self.norm.items() if all(x in senza_tipo(n) for x in q)]

    def posizione(self, indirizzo):
        """(lon, lat, precisione, via) con precisione «civico» o «via»; None se non si trova o cade fuori città."""
        via_norm, civico = separa_indirizzo(indirizzo)
        if not via_norm:
            return None
        candidate = self.candidate(via_norm)
        if not candidate:
            return None
        # più vie possibili: si tiene quella che ha il civico; se restano distanti tra loro l'indirizzo è ambiguo
        con_civico = [v for v in candidate if civico and civico in self._civici_della_via(v)]
        scelte = con_civico or candidate
        primo = self.vie[scelte[0]]
        if any(abs(self.vie[v][0] - primo[0]) > MAX_DISTANZA_AMBIGUA or abs(self.vie[v][1] - primo[1]) > MAX_DISTANZA_AMBIGUA for v in scelte):
            return None
        via = scelte[0]
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


def sedi_scuole(percorso, enti=ENTI_SULLA_SEDE):
    """{codice fiscale: indirizzo} degli istituti scolastici statali di Palermo e degli enti in `enti` ({cf nei file PNRR: denominazione IPA}),
    dall'elenco IPA (tab-separated)."""
    sedi = {}
    per_nome = {nome.lower(): cf for cf, nome in enti.items()}
    with open(percorso, encoding="utf-8-sig", errors="replace", newline="") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            cf = (r.get("cf") or "").strip()
            if cf and (r.get("Comune") or "").strip().lower() == "palermo" and (r.get("tipologia_istat") or "").strip() == TIPO_SCUOLE:
                sedi[cf] = (r.get("Indirizzo") or "").strip()
            cf_ente = per_nome.get((r.get("des_amm") or "").strip().lower())
            if cf_ente:
                sedi[cf_ente] = (r.get("Indirizzo") or "").strip()
    return sedi


def indirizzo_da_sintesi(sintesi):
    """Il campo «Sintesi Progetto» ha la forma «descrizione*INDIRIZZO*descrizione»: restituisce la parte di mezzo se sembra un indirizzo."""
    parti = [x.strip() for x in (sintesi or "").split("*")]
    if len(parti) < 3 or not parti[1] or len(parti[1]) > 80 or not re.search(r"[A-Za-z]{3}", parti[1]):
        return None
    return parti[1]


def layer_scuole(percorso):
    """{(via, civico): (lon, lat, nome)} dalle scuole già nell'app, per riusarne le coordinate."""
    scuole = {}
    if not Path(percorso).exists():
        return scuole
    for f in json.loads(Path(percorso).read_text(encoding="utf-8"))["features"]:
        p = f["properties"]
        via, civico = separa_indirizzo(p.get("indirizzo") or "")
        if via and civico and f["geometry"]["type"] == "Point":
            scuole.setdefault((via, civico), (*f["geometry"]["coordinates"][:2], p.get("nome")))
    return scuole


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

def titolo_completo(titolo, sintesi):
    """La fonte tronca spesso `Titolo Progetto` a 40 caratteri; il titolo intero è di solito la prima parte della sintesi
    («titolo*INDIRIZZO*dettagli»): lo si usa solo se ricomincia con lo stesso testo (altrimenti è un altro dato, come un settore)."""
    titolo = (titolo or "").strip()
    intero = (sintesi or "").split("*")[0].strip()
    if titolo and len(intero) > len(titolo) and intero.lower().startswith(titolo.lower()[:25]):
        return intero
    return titolo or None


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
        p["titolo"] = titolo_completo(p.get("titolo"), progetto.get("Sintesi Progetto"))
        if p.get("sintesi") and len(p["sintesi"]) > MAX_SINTESI:
            p["sintesi"] = p["sintesi"][:MAX_SINTESI].rsplit(" ", 1)[0] + "…"
    p["con_dati_progetto"] = bool(progetto)
    return p


def costruisci(loc, progetti, civici, sedi=None, scuole=None):
    """(elenco di proprietà, feature GeoJSON, contatori) per i soli CUP localizzati solo a Palermo.
    `sedi` = {codice fiscale: indirizzo} degli istituti scolastici: posiziona i progetti senza indirizzo sulla sede dell'attuatore;
    `scuole` = {(via, civico): (lon, lat, nome)} del layer Scuole dell'app, da preferire al calcolo dai civici."""
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
        if not pos:
            da_sintesi = indirizzo_da_sintesi((progetti.get(cup) or {}).get("Sintesi Progetto"))
            pos = civici.posizione(da_sintesi) if da_sintesi else None
            if pos:
                p["indirizzo"], p["indirizzo_da"] = da_sintesi, "descrizione"
                contatori["posizione_da_descrizione"] += 1
        if not pos and sedi and p.get("cf_attuatore") in sedi:
            indirizzo = sedi[p["cf_attuatore"]]
            nota = (scuole or {}).get(separa_indirizzo(indirizzo))
            if nota:
                pos = (round(nota[0], 6), round(nota[1], 6), "sede", None)
                p["scuola"] = nota[2]
                contatori["sede_da_layer_scuole"] += 1
            else:
                sede = civici.posizione(indirizzo)
                if sede:
                    pos = (sede[0], sede[1], "sede", sede[3])
            if pos:
                p["sede"] = indirizzo   # per le scuole è la sede dell'istituto, per il Comune Palazzo delle Aquile
        if pos:
            p["precisione"] = pos[2]
            p["lon"], p["lat"] = pos[0], pos[1]
            contatori["posizione_" + pos[2]] += 1
            feature.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [pos[0], pos[1]]},
                            "properties": {k: v for k, v in p.items() if k not in ("lon", "lat", "cf_attuatore") and v is not None}})
        else:
            p["precisione"] = None
            contatori["indirizzo_non_trovato" if p["indirizzo"] else "senza_indirizzo"] += 1
        elenco.append(p)
    return elenco, feature, contatori


# ---------- sintesi per i grafici ----------

TOP_SETTORI = 6
TOP_ATTUATORI = 10


def _gruppi(elenco, chiave, vuoto="n.d."):
    """[{voce, n, pnrr}] per valore di `chiave`, in ordine di numero di progetti decrescente."""
    n, importo = Counter(), Counter()
    for p in elenco:
        v = chiave(p) or vuoto
        n[v] += 1
        importo[v] += p.get("pnrr") or 0
    return [{"voce": v, "n": n[v], "pnrr": round(importo[v], 2)} for v, _ in n.most_common()]


def _con_mappa(gruppi, elenco):
    """Aggiunge a ogni soggetto quanti dei suoi progetti hanno una posizione in mappa (`n_mappa`): il filtro non mostrerebbe gli altri."""
    sulla_mappa = Counter(p.get("attuatore") or "n.d." for p in elenco if p.get("precisione"))
    return [{**g, "n_mappa": sulla_mappa[g["voce"]]} for g in gruppi]


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
        "totali_attuatore": dict(Counter(p.get("attuatore") for p in elenco if p.get("attuatore")).most_common()),   # tutti i soggetti, per la legenda («43 di 448»)
        "per_attuatore": _con_mappa(_gruppi(elenco, lambda p: p.get("attuatore"))[:TOP_ATTUATORI], elenco),
    }


# ---------- elenco dei progetti per soggetto ----------

def _pubbliche(p):
    return {k: v for k, v in p.items() if k not in ("lon", "lat", "cf_attuatore") and v is not None}


def elenco_soggetti(elenco, soggetti=SOGGETTI_CON_ELENCO):
    """[{voce, n, progetti}] con tutti i progetti dei soggetti indicati, in mappa o no, per missione e titolo."""
    out = []
    for voce in soggetti:
        progetti = sorted((_pubbliche(p) for p in elenco if p.get("attuatore") == voce), key=lambda p: (p.get("missione") or "", (p.get("titolo") or "").lower()))
        if progetti:
            out.append({"voce": voce, "n": len(progetti), "progetti": progetti})
    return out


# ---------- file di uscita ----------

COLONNE_CSV = ["cup", "titolo", "missione", "missione_nome", "componente_nome", "submisura", "submisura_nome", "stato", "settore",
               "tipologia", "attuatore", "pnrr", "totale", "inizio_previsto", "fine_prevista", "fine_effettiva", "indirizzo", "cap",
               "indirizzo_da", "precisione", "lon", "lat", "n_sedi", "con_dati_progetto"]


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
    (uscita / "soggetti.json").write_text(
        json.dumps({"estrazione": estrazione, "soggetti": elenco_soggetti(elenco)}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
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
- **Sulla mappa**: {r['su_mappa']} (di cui {r.get('posizione_da_descrizione', 0)} con l'indirizzo scritto nella descrizione del progetto; civico {r.get('posizione_civico', 0)}, solo la via {r.get('posizione_via', 0)}, sede dell'istituto scolastico {r.get('posizione_sede', 0)}, di cui {r.get('sede_da_layer_scuole', 0)} con le coordinate del layer Scuole dell'app); gli altri sono in `pnrr_palermo.csv`
- **Sede degli istituti scolastici**: Indice delle Pubbliche Amministrazioni (IPA, AgID), <https://indicepa.gov.it/ipa-dati/dataset/amministrazioni>, CC BY 4.0; indirizzi posizionati con i numeri civici ANNCSU
- Progetti localizzati anche in altri comuni: esclusi

## File

| File | Contenuto |
|---|---|
| `pnrr.geojson` | un punto per progetto con posizione; `precisione` è «civico», «via» o «sede» (le ultime due approssimate) |
| `pnrr_palermo.csv` | tutti i progetti, con o senza posizione |
| `soggetti.json` | tutti i progetti di Comune e Università (anche senza punto sulla mappa), per il menu a tendina della scheda |
| `sintesi.json` | aggregati su tutti i progetti, per i grafici della scheda |
| `riepilogo.json` | conteggi dell'ultima esecuzione |

Regole di selezione, fonti e limiti: intestazione di `scripts/pnrr.py`. Per aggiornare: workflow «Aggiorna PNRR» (avvio manuale).
"""


# ---------- scarico ----------

def scarica(nome, cartella, riscarica=False, url=None):
    destinazione = cartella / nome
    if destinazione.exists() and not riscarica:
        return destinazione
    cartella.mkdir(parents=True, exist_ok=True)
    richiesta = urllib.request.Request(url or BASE + nome, headers={"User-Agent": "Mozilla/5.0"})   # senza User-Agent il sito risponde 403
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
    ap.add_argument("--scuole", type=Path, default=RADICE / "dati" / "scuole" / "scuole.geojson", help="layer Scuole dell'app")
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

    sedi = {}
    try:
        sedi = sedi_scuole(scarica(IPA_FILE, args.cache, args.riscarica, url=IPA_URL))
    except OSError as e:   # senza l'elenco IPA i progetti delle scuole restano senza posizione
        mancanti.append(IPA_FILE)
        print(f"ATTENZIONE: elenco IPA non scaricato ({e}): niente posizione dalla sede delle scuole", file=sys.stderr)
    elenco, feature, contatori = costruisci(loc, progetti, Civici(args.civici), sedi, layer_scuole(args.scuole))
    r = scrivi(args.uscita, elenco, feature, contatori, estrazione, mancanti)
    print(json.dumps(r, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
