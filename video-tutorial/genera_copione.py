"""Genera copione.md e shotlist.md da storyboard.py (tempi stimati a 150 parole/minuto)."""
import storyboard as sb

WPM = 150
def dur(s): return len(s["testo"].split()) / WPM * 60 + s["extra"]
def tc(sec): return f"{int(sec//60)}:{int(sec%60):02d}"

REALE = None
try:   # se esiste la registrazione, i timecode sono quelli reali del video finito
    import json, montaggio
    _L = json.load(open("out/log.json")); _I = json.load(open("out/intro.json"))
    _ex = {x["id"]: x["extra"] for x in sb.S}
    _s0 = _L["scene"][0]["start"]; _fine = max(x["end"] for x in _L["scene"]) + 0.4
    _pts = montaggio.mappa_tempi(_L["scene"], _s0, _fine - _s0, _ex)
    _D1 = _I["dur"] - 0.3
    REALE = {x["id"]: _D1 + montaggio.f_uscita(_pts, x["start"] - _s0) for x in _L["scene"]}
    REALE["1-titolo"] = 0.0
    REALE["5-saluti"] = _D1 + _pts[-1][1]
    REALE_TOT = float(json.load(open("out/montaggio_info.json"))["totale"])
except Exception:
    REALE = None

righe, t, tot_sez = [], 0.0, {}
inizio_sez = {}
for s in sb.S:
    inizio_sez.setdefault(s["sez"], t)
    s["_t"] = t
    t += dur(s)
    tot_sez[s["sez"]] = tot_sez.get(s["sez"], 0) + len(s["testo"].split())
TOT = t
if REALE:
    for s_ in sb.S:
        s_["_t"] = REALE[s_["id"]]
    inizio_sez = {}
    for s_ in sb.S:
        inizio_sez.setdefault(s_["sez"], s_["_t"])
    TOT = REALE_TOT

md = ["# Palermo Digital Twin · video tutorial: copione", "",
      ("Durata del video finito: **%s** (limite 15:00). Parole di voce: **%d** (tetto ~2.100), a circa 147 parole/minuto effettive. I timecode sono quelli reali del montaggio." if REALE else "Durata stimata: **%s** (limite 15:00). Parole di voce: **%d** (tetto ~2.100). Stime a %d parole/minuto.") % ((tc(TOT), sum(tot_sez.values())) if REALE else (tc(TOT), sum(tot_sez.values()), WPM)),
      "", "Voce: italiano femminile, tono colloquiale, dai del «tu». Le sigle nei sottotitoli sono quelle vere; la voce legge la pronuncia della tabella finale.", ""]
for k, info in sb.SEZIONI.items():
    md += [f"## {k}. {info['titolo']} (fascia {info['slot'][0]}–{info['slot'][1]}; inizio {tc(inizio_sez[k])}; {tot_sez[k]} parole)", "",
           "| Timecode | Cosa si vede e quali azioni compiere nell'app | Testo della voce |", "|---|---|---|"]
    for s in sb.S:
        if s["sez"] != k: continue
        az = " · ".join(s["azioni"])
        md.append(f"| {tc(s['_t'])} `{s['id']}` | **Vista:** {s['vista']}<br>**Azioni:** {az} | {s['testo']} |")
    md.append("")
md += ["## Tabella di pronuncia (TTS)", "", "| Sigla o parola | Pronuncia nella voce |", "|---|---|"]
for pat, rep in sb.PRON:
    md.append(f"| `{pat.replace(chr(92)+'b','').replace(chr(92)+'.', '.')}` | {rep} |")
open("copione.md", "w").write("\n".join(md) + "\n")

sl = ["# Shot list: azioni precise", "",
      "Registrazione 1920×1080, 30 fps. Prima di ogni ripresa: rifiuta il banner cookie e chiudi l'invito «Clicca sulla mappa» («Non mostrare più»). Le coordinate sono lng, lat.", ""]
n = 0
for s in sb.S:
    n += 1
    sl += [f"### {n}. `{s['id']}` · {tc(s['_t'])}", "", f"Vista: {s['vista']}", ""]
    sl += [f"{i}. {a}" for i, a in enumerate(s["azioni"], 1)] + [""]
open("shotlist.md", "w").write("\n".join(sl) + "\n")
print("scene", len(sb.S), "· durata stimata", tc(TOT), "· parole", sum(tot_sez.values()))
for k in tot_sez: print(k, tc(inizio_sez[k]), tot_sez[k], "parole")
