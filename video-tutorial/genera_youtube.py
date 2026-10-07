"""Genera consegna/youtube.md (titolo, descrizione, capitoli con tempi reali, tag) e consegna/sottotitoli.srt dal montaggio finale."""
import json, os, re
import montaggio, storyboard as sb
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = f"{HERE}/out"; CON = f"{HERE}/consegna"
os.makedirs(CON, exist_ok=True)
L = json.load(open(f"{OUT}/log.json")); sc = {s["id"]: s for s in L["scene"]}
extra = {s["id"]: s["extra"] for s in sb.S}
intro = json.load(open(f"{OUT}/intro.json"))
s0 = L["scene"][0]["start"]; fine = max(s["end"] for s in L["scene"]) + 0.4
pts = montaggio.mappa_tempi(L["scene"], s0, fine - s0, extra)
D1 = intro["dur"] - 0.3; Tm = pts[-1][1]
fin = lambda sid: D1 + montaggio.f_uscita(pts, sc[sid]["start"] - s0)
dur_tot = float(json.load(open(f"{OUT}/montaggio_info.json"))["totale"])

CAP = [
    (None, 0.0, "Apertura: una mappa con i dati aperti di Palermo"),
    ("2-guida", None, "La Guida: i 19 passi"),
    ("2-cos-e", None, "Cos'è la mappa e a cosa serve"),
    ("2-telefono", None, "Sul telefono: le quattro tab"),
    ("2-dati", None, "Fonti e avvisi"),
    ("2-strati", None, "La barra degli strati"),
    ("2-ordine", None, "Ordine dei layer"),
    ("2-storiche", None, "Mappe di base e mappe storiche"),
    ("2-miei-layer", None, "I miei layer: aggiungere i propri dati"),
    ("2-colori", None, "Cambiare i colori di uno strato"),
    ("2-clic", None, "Un clic sulla mappa: tutto in un punto"),
    ("2-scheda", None, "Cosa si legge nella scheda"),
    ("2-monumenti", None, "Monumenti"),
    ("2-uffici", None, "Uffici comunali"),
    ("2-pai", None, "Rischio idrogeologico (PAI)"),
    ("2-incendi", None, "Incendi"),
    ("2-calore", None, "Isole di calore"),
    ("2-filtri", None, "Cercare e filtrare"),
    ("2-strumenti", None, "Strumenti: 3D, tema scuro, stampa"),
    ("2-avvertenze", None, "Avvertenze: dati informativi, senza valore legale"),
    ("3-cose", None, "Plugin RNDT: il catalogo nazionale dei dati territoriali"),
    ("3-merito", None, "Il plugin di Andrea Borruso (onData)"),
    ("3-dove", None, "Dove si trova il catalogo e come si cerca"),
    ("3-risultato", None, "Scegliere e aggiungere un servizio"),
    ("3-interroga", None, "Interrogare i layer RNDT"),
    ("3-limiti", None, "Limiti e file personali"),
    ("4-cose", None, "Geoimage: cos'è"),
    ("4-inquadra", None, "Caricare la mappa storica (Palermo 1891)"),
    ("4-posiziona", None, "Posizionare e ruotare l'immagine"),
    ("4-gcp", None, "I punti di controllo (GCP)"),
    ("4-allinea", None, "Allineare e controllare l'errore (RMSE)"),
    ("4-confronto", None, "Swipe e Spotlight"),
    ("4-esporta", None, "Esportare il risultato"),
    ("5-riepilogo", None, "Riepilogo, dove trovarci e come contribuire"),
]
cap = []
for sid, t, titolo in CAP:
    t = 0.0 if sid is None else fin(sid)
    if cap and t - cap[-1][0] < 10:           # YouTube vuole capitoli di almeno 10 secondi: si accorpa
        continue
    cap.append((t, titolo))
if dur_tot - cap[-1][0] < 10:
    cap.pop()
fmt = lambda t: f"{int(t // 60)}:{int(t % 60):02d}"
righe_cap = "\n".join(f"{fmt(t)} {titolo}" for t, titolo in cap)

DESCR = f"""Palermo Digital Twin: come usare la mappa, il catalogo nazionale RNDT e Geoimage.

Una mappa con i dati aperti di Palermo: catasto, piano regolatore, vincoli, monumenti, trasporto pubblico, sicurezza stradale, isole di calore, rischio idrogeologico (PAI) e molto altro, tutti nello stesso posto. In questo tutorial di circa 13 minuti vediamo, dal vivo sull'app:

• La Guida generale, passo dopo passo: ricerca, strati, filtri, vista 3D, clic sulla mappa e scheda del luogo, mappe storiche, uso da telefono, Fonti e avvisi.
• Il plugin RNDT: il catalogo del Repertorio Nazionale dei Dati Territoriali, direttamente sulla mappa. Il plugin è openrndt-geolibre, ideato e scritto da Andrea Borruso (onData).
• Geoimage: come sovrapporre una mappa storica (qui la pianta di Palermo del 1891) alla cartografia di oggi e georeferenziarla con i punti di controllo (GCP).

CAPITOLI
{righe_cap}

LINK
• L'app: https://palermodigitaltwin.opendatasicilia.it/ (indirizzo di reindirizzamento di https://palermohub.github.io/DigitalTwin/)
• Open Data Sicilia: https://opendatasicilia.it/
• Plugin RNDT (openrndt-geolibre, Andrea Borruso / onData): https://github.com/ondata/openrndt-geolibre
• Geoimage (@gbvitrano): https://github.com/gbvitrano/Geoimage
• Atlante delle carte tecniche storiche di Palermo: https://palermohub.opendatasicilia.it/index_atlante_iframe.html
• MapWarper, per georeferenziazioni più precise: https://mapwarper.net/

AVVISO
Catasto, zonizzazione del piano regolatore e vincoli sono dati informativi, senza valore legale: non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Le fonti dei dati, le date e le licenze sono elencate nella scheda "Fonti e avvisi" dell'app.

Hai trovato un errore o hai un'idea? Segnalalo e contribuisci: il progetto è aperto.

#PalermoDigitalTwin #OpenDataSicilia #OpenData #GIS #Palermo #RNDT #Geoimage #DatiAperti
"""
TITOLI = [
    "Palermo Digital Twin: la mappa con i dati aperti della città (tutorial completo)",
    "Palermo Digital Twin: guida all'app, catalogo RNDT e Geoimage in 13 minuti",
    "Come usare Palermo Digital Twin: catasto, PRG, mappe storiche e dati aperti",
]
TAG = "Palermo Digital Twin, Palermo, dati aperti, open data, Open Data Sicilia, mappa interattiva, GIS, catasto, PRG, piano regolatore, RNDT, catalogo nazionale dati territoriali, Geoimage, georeferenziazione, mappe storiche, MapWarper, QGIS, tutorial, isole di calore, PAI, rischio idrogeologico, trasporto pubblico, Andrea Borruso, onData"
md = [f"# YouTube: titolo, descrizione, capitoli e tag", "",
      f"Durata del video: **{fmt(dur_tot)}** ({dur_tot:.0f} s). I tempi dei capitoli sono calcolati dal montaggio finale e valgono sia per la versione master sia per la copia compressa (differenza < 1 s).", "",
      "## Titolo (tre proposte)", ""] + [f"{i}. {t}" for i, t in enumerate(TITOLI, 1)] + ["",
      "## Descrizione (da incollare così com'è)", "", "```", DESCR.rstrip(), "```", "",
      "## Tag", "", TAG, "",
      "## Sottotitoli", "", "Carica `sottotitoli.srt` in YouTube Studio → Sottotitoli → Aggiungi → Italiano → Carica file → «Con tempi». I sottotitoli sono già incisi nel video; il file serve solo per accessibilità e ricerca.", "",
      "## Note per la pubblicazione", "",
      "- I capitoli compaiono su YouTube solo se il primo è a 0:00 e ogni capitolo dura almeno 10 secondi (qui è già così).",
      "- Il video e l'indirizzo `palermodigitaltwin.opendatasicilia.it` nella schermata finale funzionano solo se il reindirizzamento è attivo al momento della pubblicazione.",
      "- Nella scheda \"Guida\" dell'app c'è un video YouTube incorporato (`Mzj1xk1l2QM`): quando pubblichi questo, aggiorna l'ID in `js/core/guida.js` se vuoi sostituirlo.", ""]
open(f"{CON}/youtube.md", "w").write("\n".join(md))

# SRT dai sottotitoli ASS del montaggio
ass = open(f"{OUT}/sottotitoli.ass", encoding="utf-8").read().splitlines()
def sec(t):
    h, m, s = t.split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
def srt_t(t): return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round((t % 1) * 1000)):03d}".replace(",1000", ",999")
ev = []
for r in ass:
    if r.startswith("Dialogue:"):
        p = r.split(",", 9); ev.append((sec(p[1]), sec(p[2]), p[9]))
ev.sort()
open(f"{CON}/sottotitoli.srt", "w", encoding="utf-8").write("\n".join(f"{i}\n{srt_t(a)} --> {srt_t(b)}\n{t}\n" for i, (a, b, t) in enumerate(ev, 1)))
print(len(cap), "capitoli;", len(ev), "sottotitoli; totale", fmt(dur_tot))
print(righe_cap)
