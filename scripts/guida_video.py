#!/usr/bin/env python3
"""Genera media/guida/guida.{mp4,vtt} dalle narrazioni e dagli screenshot dei passi.

Uso: python scripts/guida_video.py [--voce it_IT-paola-medium]
Richiede: ffmpeg/ffprobe, piper-tts e il modello vocale in ~/.cache/piper
(python -m piper.download_voices it_IT-paola-medium --data-dir ~/.cache/piper).
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from guida_screenshot import ROOT, passi

PAUSA = 0.6
LIMITE_WHATSAPP_MB = 9.5  # il limite degli stati è 10: si resta un po' sotto
FPS = 25
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
CACHE_VOCI = Path.home() / ".cache" / "piper"
OUT = ROOT / "media" / "guida"

# Coda del video: plugin RNDT e Geoimage. Il testo parlato è ricavato dai tab (PASSI_RNDT e SEZIONI di geoimage),
# che non hanno una `narrazione` (il test guida.test.mjs lo impone per i passi statici): qui lo si rende leggibile alla voce.
SIGLE = {
    "RNDT": "R N D T", "WMS": "W M S", "WMTS": "W M T S", "WFS": "W F S", "XYZ": "X Y Z", "GCP": "G C P", "GPX": "G P X",
    "KMZ": "K M Z", "KML": "K M L", "CSV": "C S V", "JPG": "J P G", "PNG": "P N G", "WEBP": "W E B P", "BMP": "B M P",
    "WGS": "W G S", "UTM": "U T M", "LZW": "L Z W", "RMSE": "R M S E", "GDAL": "G D A L", "QGIS": "Q G I S", "PAI": "P A I",
    "JSON": "Jason", "GeoJSON": "Geo Jason", "GeoTIFF": "Geo Tiff", "ArcGIS": "Arc G I S", "GetFeatureInfo": "Get Feature Info",
    "WGS84": "W G S ottantaquattro", "REST": "rest", "onData": "on Data", "Esc": "Esc", "MB": "megabyte", "3D": "tre D", "HTTPS": "H T T P S", "https": "H T T P S", "zip": "zip",
}
UNITA = "zero uno due tre quattro cinque sei sette otto nove dieci undici dodici tredici quattordici quindici sedici diciassette diciotto diciannove".split()
DECINE = "_ _ venti trenta quaranta cinquanta sessanta settanta ottanta novanta".split()


def parole(n):
    if n < 20:
        return UNITA[n]
    if n < 100:
        d, u = divmod(n, 10)
        base = DECINE[d]
        if u in (1, 8):
            base = base[:-1]
        return base + ("" if u == 0 else UNITA[u] if u != 3 else "tré")
    if n < 1000:
        c, r = divmod(n, 100)
        return ("cento" if c == 1 else UNITA[c] + "cento") + ("" if r == 0 else parole(r))
    m, r = divmod(n, 1000)
    return ("mille" if m == 1 else parole(m) + "mila") + ("" if r == 0 else parole(r))


def per_la_voce(testo):
    """Rende un testo del tab leggibile da Piper: sigle lettera per lettera, cifre a parole, niente simboli né indirizzi."""
    t = re.sub(r"\s*L.idea e il codice vengono da [^.]*\(github\.com[^)]*\)\.", "", testo)
    t = re.sub(r"\s*\([^)]*\)", lambda m: "" if re.search(r"\d|\.", m.group(0)) and len(m.group(0)) < 30 and "," not in m.group(0) else m.group(0), t)
    t = t.replace("UTM 32N o 33N", "UTM").replace("una ×", "una croce").replace("pulsante ⇄", "pulsante con la doppia freccia")
    t = t.replace("«", "").replace("»", "").replace("“", "").replace("”", "").replace("’", "'")
    t = re.sub(r"2\s*°\s*grado", "secondo grado", t)
    t = re.sub(r"(\d+)\s*°", lambda m: f"{parole(int(m.group(1)))} gradi", t)
    t = re.sub(r"(\d+)\s*%", lambda m: f"{parole(int(m.group(1)))} per cento", t)
    t = re.sub(r"\b(WGS84|GeoJSON|GeoTIFF|ArcGIS|GetFeatureInfo|[A-Z]{2,}|onData|zip|https)\b", lambda m: SIGLE.get(m.group(1), " ".join(m.group(1))), t)
    t = t.replace(".points", "Points").replace("World file", "world file")
    t = re.sub(r"(?<![\w])(\d+)(?![\w])", lambda m: parole(int(m.group(1))), t)
    t = t.replace("⌖", "il mirino").replace(" — ", ", ")
    t = re.sub(r"\s*[:;]\s*$", ".", t.strip())
    return re.sub(r"\s+", " ", t)


def _contenuti(modulo, nome):
    out = subprocess.run(["node", "-e", f"import('./js/{modulo}.js').then(m=>console.log(JSON.stringify(m.{nome})))"],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def _frasi(*parti):
    return " ".join(p if p.rstrip()[-1:] in ".!?" else p.rstrip(" :;") + "." for p in parti if p)


def passi_extra():
    """Passi RNDT e Geoimage con il testo dei rispettivi tab, nell'ordine in cui compaiono."""
    extra = [{"id": "rndt-plugin", "titolo": "Plugin RNDT: un lavoro di Andrea Borruso", "immagine": {"file": "img/guida/passi/rndt-catalogo.webp"},
              "narrazione": per_la_voce(" ".join(_contenuti("core/guida-contenuti", "MERITO_PLUGIN")))}]
    for p in _contenuti("core/guida-contenuti", "PASSI_RNDT"):
        par = p["paragrafi"]
        if p["id"] == "rndt-catalogo":  # la prima frase e poi come si cerca
            par = [re.split(r"(?<=[.!?])\s", par[0])[0], par[1]]
        elif p["id"] == "rndt-gruppo":  # il gruppo e i layer; i formati dei file stanno nella guida scritta
            par = par[:1]
        extra.append({"id": p["id"], "titolo": f"Plugin RNDT: {p['titolo']}", "immagine": p["immagine"], "narrazione": per_la_voce(" ".join(par))})
    sez = {s["id"]: s for s in _contenuti("geoimage/guida-contenuti", "SEZIONI")}
    pas = {p["titolo"]: p for s in sez.values() for p in s.get("passi", [])}
    passi_di = lambda sezione: {p["titolo"]: p for p in sez[sezione]["passi"]}
    sw, sp = passi_di("swipe"), passi_di("spotlight")
    img = lambda nome: {"file": f"img/guida/passi/geoimage-{nome}.webp"}
    el = lambda titolo, *idx: [pas[titolo]["elenco"][i] for i in idx]
    gruppi = [  # (id, titolo, immagine, testi del tab)
        ("carica", "Geoimage: caricare l'immagine", "carica", sez["cos-e"]["paragrafi"][:1] + [pas["Carica la mappa storica"]["testo"]]),
        ("posiziona", "Geoimage: posizionare l'immagine", "carica", [pas["Posiziona e orienta l’immagine"]["testo"]] + el("Posiziona e orienta l’immagine", 0, 1, 2)),
        ("gcp", "Geoimage: i punti di controllo", "gcp", [pas["Aggiungi i GCP (due clic per ogni punto)"]["testo"]] + el("Aggiungi i GCP (due clic per ogni punto)", 0, 1, 4)),
        ("allinea", "Geoimage: allineare e controllare l'errore", "allinea", [pas["Allinea l’immagine ai GCP"]["testo"], pas["Controlla l’errore (RMSE)"]["testo"]]),
        ("swipe", "Geoimage: lo Swipe", "swipe", sez["swipe"]["paragrafi"] + [sw["Attivalo"]["testo"], sw["Trascina la linea"]["testo"]]),
        ("spotlight", "Geoimage: lo Spotlight", "spotlight", sez["spotlight"]["paragrafi"] + [sp["Attivalo"]["testo"], sp["Regola il raggio"]["testo"], sp["Inverti l’effetto"]["testo"]]),
        ("esporta", "Geoimage: esportare il risultato", "esporta", [pas["Esporta il risultato"]["testo"]] + pas["Esporta il risultato"]["elenco"]),
    ]
    for id_, titolo, immagine, testi in gruppi:
        extra.append({"id": f"geoimage-{id_}", "titolo": titolo, "immagine": img(immagine), "narrazione": per_la_voce(_frasi(*testi))})
    return extra


def passi_video():
    return passi() + passi_extra()


def controlla_requisiti(voce):
    for exe in ("ffmpeg", "ffprobe"):
        if not shutil.which(exe):
            sys.exit(f"manca {exe}: installalo (es. sudo apt install ffmpeg)")
    try:
        import piper  # noqa: F401
    except ImportError:
        sys.exit("manca piper-tts: python -m pip install piper-tts")
    modello = CACHE_VOCI / f"{voce}.onnx"
    if not modello.exists():
        sys.exit(f"manca il modello {modello}: python -m piper.download_voices {voce} --data-dir {CACHE_VOCI}")
    return modello


def _ts(s):
    ms = round(s * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}"


def formatta_vtt(durate, testi):
    righe, t = ["WEBVTT", ""], 0.0
    for d, testo in zip(durate, testi):
        righe += [f"{_ts(t)} --> {_ts(t + d)}", testo, ""]
        t += d
    return "\n".join(righe)


def cue_per_frase(testo, durata):
    """Spezza la narrazione di un passo in sottotitoli, uno per frase, con la durata ripartita in proporzione ai caratteri."""
    frasi = [f for f in re.split(r"(?<=[.!?;:])\s+", testo.strip()) if f]
    totale = sum(len(f) for f in frasi)
    cue, usato = [], 0.0
    for i, f in enumerate(frasi):
        d = durata - usato if i == len(frasi) - 1 else durata * len(f) / totale
        cue.append((d, f))
        usato += d
    return cue


def bitrate_video(durata, mb, audio=48_000):
    """Bitrate video (bit/s) per stare in `mb` megabyte, con il 3% di margine per il contenitore."""
    bitrate = int(mb * 1024 * 1024 * 8 * 0.97 / durata) - audio
    if bitrate < 50_000:
        raise ValueError(f"video troppo lungo ({durata:.0f} s) per stare in {mb} MB: sotto i 50 kbit/s la qualità non è più leggibile")
    return bitrate


def _durata(f):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True).stdout)


def _sintetizza(testo, modello, wav):
    subprocess.run([sys.executable, "-m", "piper", "-m", str(modello), "-f", str(wav)], input=testo, text=True, check=True)


def _ts_ass(s):
    cs = round(s * 100)
    return f"{cs // 360000:d}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _genera_ass(cues, out_ass):
    righe = [
        "[Script Info]",
        "ScriptType: v4.00+",
        "PlayResX: 1280",
        "PlayResY: 720",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Default,DejaVu Sans,22,&H00FFFFFF,&H000000FF,&H00000000,&HA8070A19,-1,0,0,0,100,100,0,0,3,10,0,2,80,80,52,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    t = 0.0
    for dur, testo in cues:
        t_end = t + dur
        testo_pulito = testo.strip().replace("\n", " ").replace("\\", "").replace("{", "").replace("}", "")
        righe.append(f"Dialogue: 0,{_ts_ass(t)},{_ts_ass(t_end)},Default,,0,0,0,,{testo_pulito}")
        t = t_end
    out_ass.write_text("\n".join(righe), encoding="utf-8")


def _segmento(passo, wav, durata_audio, dest, indice=1, totale=1, ass_path=None):
    durata = durata_audio + PAUSA
    titolo = passo["titolo"].replace("'", "’").replace(":", "\\:").replace("%", "\\%")
    zoom = f"zoompan=z='min(zoom+0.0003,1.05)':d={int(durata * FPS) + 1}:s=1280x720:fps={FPS}"
    top_bar = "drawbox=x=0:y=0:w=1280:h=56:color=black@0.78:t=fill"
    brand = f"drawtext=fontfile={FONT}:text='DIGITAL TWIN PALERMO':fontcolor=0xf5a623:fontsize=18:x=32:y=19"
    sep1 = f"drawtext=fontfile={FONT}:text='·':fontcolor=white@0.5:fontsize=18:x=290:y=19"
    step = f"drawtext=fontfile={FONT}:text='PASSO {indice:02d}/{totale:02d}':fontcolor=0x7fe6ff:fontsize=16:x=310:y=20"
    sep2 = f"drawtext=fontfile={FONT}:text='·':fontcolor=white@0.5:fontsize=18:x=455:y=19"
    title = f"drawtext=fontfile={FONT}:text='{titolo}':fontcolor=white:fontsize=18:x=475:y=19"
    prog = f"drawbox=x=0:y=715:w='1280*(t/{durata})':h=5:color=0xf5a623@0.95:t=fill"

    filtri_v = [f"[0:v]scale=2560:1440", zoom, top_bar, brand, sep1, step, sep2, title, prog]
    if ass_path and Path(ass_path).exists():
        filtri_v.append(f"subtitles={ass_path}")
    filtri_v.append("format=yuv420p[v]")
    vf_string = ",".join(filtri_v)

    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(ROOT / passo["immagine"]["file"]), "-i", str(wav),
        "-filter_complex", f"{vf_string};[1:a]apad=pad_dur={PAUSA},aresample=44100[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{durata:.3f}", "-c:v", "libx264", "-c:a", "aac", "-ar", "44100", "-ac", "1", "-r", str(FPS), str(dest),
    ], check=True)


def comprimi_whatsapp(src, dest, mb=8.5):
    """Ricodifica `src` in `dest` a 960x540 con due passate, puntando a `mb` megabyte (limite degli stati WhatsApp: 10)."""
    audio = 32_000
    bitrate = bitrate_video(_durata(src), mb, audio)
    comune = ["-vf", "scale=960:540", "-c:v", "libx264", "-preset", "slow", "-b:v", str(bitrate), "-pix_fmt", "yuv420p", "-r", str(FPS)]
    with tempfile.TemporaryDirectory() as tmp:
        log = str(Path(tmp) / "passata")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), *comune, "-pass", "1", "-passlogfile", log, "-an", "-f", "null", "/dev/null"], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), *comune, "-pass", "2", "-passlogfile", log,
                        "-c:a", "aac", "-b:a", str(audio), "-ac", "1", "-movflags", "+faststart", str(dest)], check=True)
    dimensione = dest.stat().st_size / 1024 / 1024
    print(f"{dest.name}: {dimensione:.1f} MB")
    if dimensione >= LIMITE_WHATSAPP_MB:
        sys.exit(f"{dest.name} pesa {dimensione:.1f} MB: oltre il limite di {LIMITE_WHATSAPP_MB} MB per gli stati WhatsApp")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--voce", default="it_IT-paola-medium")
    ap.add_argument("--whatsapp", action="store_true", help="solo la versione ridotta per gli stati WhatsApp, da media/guida/guida.mp4")
    args = ap.parse_args(argv)
    if args.whatsapp:
        for exe in ("ffmpeg", "ffprobe"):
            if not shutil.which(exe):
                sys.exit(f"manca {exe}: installalo (es. sudo apt install ffmpeg)")
        if not (OUT / "guida.mp4").exists():
            sys.exit("manca media/guida/guida.mp4: esegui prima scripts/guida_video.py")
        return comprimi_whatsapp(OUT / "guida.mp4", OUT / "guida-whatsapp.mp4")
    modello = controlla_requisiti(args.voce)
    elenco = passi_video()
    mancanti = [p["immagine"]["file"] for p in elenco if not (ROOT / p["immagine"]["file"]).exists()]
    if mancanti:
        sys.exit(f"immagini mancanti: {mancanti}; esegui scripts/guida_screenshot.py")
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        segmenti, durate = [], []
        tot = len(elenco)
        for idx, p in enumerate(elenco, 1):
            wav, seg = tmp / f"{p['id']}.wav", tmp / f"{p['id']}.mp4"
            _sintetizza(p["narrazione"], modello, wav)
            da = _durata(wav)
            cues = cue_per_frase(p["narrazione"], da)
            ass = tmp / f"{p['id']}.ass"
            _genera_ass(cues, ass)
            _segmento(p, wav, da, seg, indice=idx, totale=tot, ass_path=ass)
            segmenti.append(seg)
            durate.append(_durata(seg))  # misurata: il padding di codifica non si accumula sui sottotitoli
            print("ok", p["id"], f"{durate[-1]:.1f}s")
        lista = tmp / "lista.txt"
        lista.write_text("".join(f"file '{s}'\n" for s in segmenti))
        mp4 = OUT / "guida.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", "-movflags", "+faststart", str(mp4)], check=True)
    cue = [c for p, d in zip(elenco, durate) for c in cue_per_frase(p["narrazione"], d)]
    (OUT / "guida.vtt").write_text(formatta_vtt([d for d, _ in cue], [t for _, t in cue]), encoding="utf-8")
    comprimi_whatsapp(OUT / "guida.mp4", OUT / "guida-whatsapp.mp4")
    print("scritti", *(OUT / n for n in ("guida.mp4", "guida.vtt", "guida-whatsapp.mp4")))


if __name__ == "__main__":
    main()
