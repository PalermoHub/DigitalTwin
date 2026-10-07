"""Genera copione.md e shotlist.md da storyboard.py (tempi stimati a 150 parole/minuto)."""
import storyboard as sb

WPM = 150
def dur(s): return len(s["testo"].split()) / WPM * 60 + s["extra"]
def tc(sec): return f"{int(sec//60)}:{int(sec%60):02d}"

righe, t, tot_sez = [], 0.0, {}
inizio_sez = {}
for s in sb.S:
    inizio_sez.setdefault(s["sez"], t)
    s["_t"] = t
    t += dur(s)
    tot_sez[s["sez"]] = tot_sez.get(s["sez"], 0) + len(s["testo"].split())
TOT = t

md = ["# Palermo Digital Twin · video tutorial: copione", "",
      "Durata stimata: **%s** (limite 15:00). Parole di voce: **%d** (tetto ~2.100). Stime a %d parole/minuto; i tempi reali si fissano con l'audio generato." % (tc(TOT), sum(tot_sez.values()), WPM),
      "", "Voce: italiano femminile, tono colloquiale, dai del «tu». Le sigle nei sottotitoli sono quelle vere; la voce legge la pronuncia della tabella finale.", ""]
for k, info in sb.SEZIONI.items():
    md += [f"## {k}. {info['titolo']} (fascia {info['slot'][0]}–{info['slot'][1]}; stima {tc(inizio_sez[k])}; {tot_sez[k]} parole)", "",
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
