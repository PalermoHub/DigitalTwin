"""Controllo finale: durata, flusso video/audio, sincronia voce/azioni (da log), parole, loudness; fotogrammi chiave in out/controllo/."""
import json, os, subprocess
import storyboard as sb
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = f"{HERE}/out"
mp4 = f"{OUT}/palermo-digital-twin-tutorial.mp4"
info = json.load(open(f"{OUT}/montaggio_info.json"))
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height,avg_frame_rate,pix_fmt,sample_rate,channels,bit_rate", "-of", "json", mp4], capture_output=True, text=True).stdout)
dur = float(pr["format"]["duration"])
print(f"durata {int(dur//60)}:{dur%60:04.1f} ({'OK' if dur < 900 else 'OLTRE 15:00'}) · {int(pr['format']['size'])/1e6:.0f} MB")
for s in pr["streams"]:
    print("  ", {k: v for k, v in s.items() if v})
par = sum(len(s["testo"].split()) for s in sb.S)
print(f"parole di voce: {par} ({par/ (sum(json.load(open(f'{HERE}/audio/durate.json')).values())/60):.0f} parole/min effettive)")
# sincronia: la voce non deve sovrapporsi alla scena successiva e le azioni oltre la voce vanno nella coda compressa
L = json.load(open(f"{OUT}/log.json"))
D = json.load(open(f"{HERE}/audio/durate.json"))
sovr = [(s["id"], round(s["voice_start"] + D[s["id"]] - s["end"], 1)) for s in L["scene"] if s["voice_start"] + D[s["id"]] > s["end"] + 0.05]
print("voce oltre la fine della scena:", sovr or "nessuna")
# loudness
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
for riga in r.splitlines()[-12:]:
    if any(k in riga for k in ("I:", "LRA:", "Peak:")):
        print("  ", riga.strip())
os.makedirs(f"{OUT}/controllo", exist_ok=True)
tempi = [0.5 * 1, 8, 14, 30, 60, 120, 200, 300, 380, 460, 520, 560, 610, 650, 700, 740, 770, dur - 12, dur - 4]
for t in tempi:
    if t < dur:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.1f}", "-i", mp4, "-frames:v", "1", "-vf", "scale=640:360", f"{OUT}/controllo/t{int(t):04d}.png"])
print("fotogrammi in out/controllo/")
