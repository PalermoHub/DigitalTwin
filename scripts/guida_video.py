#!/usr/bin/env python3
"""Genera media/guida/guida.{mp4,mp3,vtt} dalle narrazioni e dagli screenshot dei passi.

Uso: python scripts/guida_video.py [--voce it_IT-paola-medium]
Richiede: ffmpeg/ffprobe, piper-tts e il modello vocale in ~/.cache/piper
(python -m piper.download_voices it_IT-paola-medium --data-dir ~/.cache/piper).
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from guida_screenshot import ROOT, passi

PAUSA = 0.6
FPS = 25
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
CACHE_VOCI = Path.home() / ".cache" / "piper"
OUT = ROOT / "media" / "guida"


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


def _durata(f):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True).stdout)


def _sintetizza(testo, modello, wav):
    subprocess.run([sys.executable, "-m", "piper", "-m", str(modello), "-f", str(wav)], input=testo, text=True, check=True)


def _segmento(passo, wav, durata_audio, dest):
    durata = durata_audio + PAUSA
    titolo = passo["titolo"].replace("'", "’").replace(":", "\\:")
    zoom = f"zoompan=z='min(zoom+0.0004,1.06)':d={int(durata * FPS) + 1}:s=1280x720:fps={FPS}"
    testo = f"drawtext=fontfile={FONT}:text='{titolo}':fontcolor=white:fontsize=34:box=1:boxcolor=black@0.55:boxborderw=14:x=40:y=h-th-40"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(ROOT / passo["immagine"]["file"]), "-i", str(wav),
        "-filter_complex", f"[0:v]scale=2560:1440,{zoom},{testo},format=yuv420p[v];[1:a]apad=pad_dur={PAUSA},aresample=44100[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{durata:.3f}", "-c:v", "libx264", "-c:a", "aac", "-ar", "44100", "-ac", "1", "-r", str(FPS), str(dest),
    ], check=True)


def comprimi_whatsapp(src, dest, mb=8.5):
    """Ricodifica `src` in `dest` a 960x540 con due passate, puntando a `mb` megabyte (limite degli stati WhatsApp: 10)."""
    audio = 48_000
    bitrate = int(mb * 1024 * 1024 * 8 * 0.97 / _durata(src)) - audio  # 3% di margine per il contenitore
    comune = ["-vf", "scale=960:540", "-c:v", "libx264", "-preset", "slow", "-b:v", str(bitrate), "-pix_fmt", "yuv420p", "-r", str(FPS)]
    with tempfile.TemporaryDirectory() as tmp:
        log = str(Path(tmp) / "passata")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), *comune, "-pass", "1", "-passlogfile", log, "-an", "-f", "null", "/dev/null"], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), *comune, "-pass", "2", "-passlogfile", log,
                        "-c:a", "aac", "-b:a", str(audio), "-ac", "1", "-movflags", "+faststart", str(dest)], check=True)
    print(f"{dest.name}: {dest.stat().st_size / 1024 / 1024:.1f} MB")


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
    elenco = passi()
    mancanti = [p["immagine"]["file"] for p in elenco if not (ROOT / p["immagine"]["file"]).exists()]
    if mancanti:
        sys.exit(f"immagini mancanti: {mancanti}; esegui scripts/guida_screenshot.py")
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        segmenti, durate = [], []
        for p in elenco:
            wav, seg = tmp / f"{p['id']}.wav", tmp / f"{p['id']}.mp4"
            _sintetizza(p["narrazione"], modello, wav)
            da = _durata(wav)
            _segmento(p, wav, da, seg)
            segmenti.append(seg)
            durate.append(da + PAUSA)
            print("ok", p["id"], f"{da + PAUSA:.1f}s")
        lista = tmp / "lista.txt"
        lista.write_text("".join(f"file '{s}'\n" for s in segmenti))
        mp4 = OUT / "guida.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", "-movflags", "+faststart", str(mp4)], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp4), "-vn", "-c:a", "libmp3lame", "-q:a", "4", str(OUT / "guida.mp3")], check=True)
    (OUT / "guida.vtt").write_text(formatta_vtt(durate, [p["narrazione"] for p in elenco]), encoding="utf-8")
    comprimi_whatsapp(OUT / "guida.mp4", OUT / "guida-whatsapp.mp4")
    print("scritti", *(OUT / n for n in ("guida.mp4", "guida.mp3", "guida.vtt", "guida-whatsapp.mp4")))


if __name__ == "__main__":
    main()
