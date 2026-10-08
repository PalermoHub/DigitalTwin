"""Innesta la sezione Geoimage rifatta (out/geo/clip.mp4) nel video completo di consegna, al posto di quella con i GCP sbagliati.
Parte da una copia del video precedente (VECCHIO), che deve esistere; riscrive il video completo, i sottotitoli e consegna/tagli.json.
  python unisci_geoimage.py <video_precedente.mp4> <sottotitoli_it_precedenti.srt> <sottotitoli_en_precedenti.srt>"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); C = f"{HERE}/consegna"; GEO = f"{HERE}/out/geo"
VECCHIO, SRT_IT, SRT_EN = sys.argv[1:4]
T0, T1 = 627.5, 773.5            # tratto Geoimage del video precedente (da "Ultima funzione" a "...MapWarper")
FINE = 809.41
D = json.load(open(f"{GEO}/info.json"))["durata"]
delta = (T0 + D) - T1
def sec(tc):
    h, m, s = tc.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
def tc(t):
    ms = int(round(max(0, t) * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
def blocchi(p): return [b.split("\n") for b in open(p, encoding="utf-8").read().strip().split("\n\n")]
def unisci_srt(vecchio, nuovo_clip, dst):
    out = []
    for r in blocchi(vecchio):
        a, b = [sec(x) for x in r[1].split(" --> ")]
        if b <= T0: out.append((a, b, r[2:]))
        elif a >= T1: out.append((a + delta, b + delta, r[2:]))
    for r in blocchi(nuovo_clip):
        a, b = [sec(x) for x in r[1].split(" --> ")]
        out.append((a + T0, b + T0, r[2:]))
    out.sort(key=lambda x: x[0])
    open(dst, "w", encoding="utf-8").write("\n\n".join(f"{i}\n{tc(a)} --> {tc(b)}\n" + "\n".join(t) for i, (a, b, t) in enumerate(out, 1)) + "\n")
    return len(out)
print("cue it", unisci_srt(SRT_IT, f"{GEO}/clip.it.srt", f"{C}/sottotitoli.srt"), "cue en", unisci_srt(SRT_EN, f"{GEO}/clip.en.srt", f"{C}/sottotitoli.en.srt"))
f = 0.4
fc = (f"[0:v]fade=t=out:st={T0-f:.2f}:d={f}[v0];[1:v]fade=t=in:st=0:d={f},fade=t=out:st={D-0.3:.2f}:d=0.3[v1];[2:v]fade=t=in:st=0:d=0.3[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v];")
for k in (0, 1):
    fc += (f"[0:a:{k}]afade=t=out:st={T0-f:.2f}:d={f}[a{k}0];[1:a:{k}]afade=t=in:st=0:d={f},afade=t=out:st={D-0.3:.2f}:d=0.3[a{k}1];[2:a:{k}]afade=t=in:st=0:d=0.3[a{k}2];"
           f"[a{k}0][a{k}1][a{k}2]concat=n=3:v=0:a=1[a{k}];")
CRF = os.environ.get("CRF", "26")
dst = f"{C}/palermo-digital-twin-tutorial.mp4"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "0", "-to", str(T0), "-i", VECCHIO, "-i", f"{GEO}/clip.mp4", "-ss", str(T1), "-to", str(FINE), "-i", VECCHIO,
    "-i", f"{C}/sottotitoli.srt", "-i", f"{C}/sottotitoli.en.srt", "-filter_complex", fc.rstrip(";"),
    "-map", "[v]", "-map", "[a0]", "-map", "[a1]", "-map", "3", "-map", "4",
    "-c:v", "libx264", "-preset", "medium", "-crf", CRF, "-pix_fmt", "yuv420p", "-r", "30", "-c:a:0", "aac", "-b:a:0", "128k", "-c:a:1", "aac", "-b:a:1", "96k", "-c:s", "mov_text",
    "-metadata:s:a:0", "language=ita", "-metadata:s:a:0", "title=Italiano", "-metadata:s:a:1", "language=eng", "-metadata:s:a:1", "title=English",
    "-metadata:s:s:0", "language=ita", "-metadata:s:s:0", "title=Italiano", "-metadata:s:s:1", "language=eng", "-metadata:s:s:1", "title=English",
    "-disposition:a:0", "default", "-disposition:a:1", "0", "-disposition:s:0", "0", "-disposition:s:1", "0", "-movflags", "+faststart", dst], check=True)
json.dump(dict(geoimage=[T0, T0 + D], chiusura=[789.55 + delta, FINE + delta], delta=delta), open(f"{C}/tagli.json", "w"))
print("fatto", dst, "delta", round(delta, 2))
