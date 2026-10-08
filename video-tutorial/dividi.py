"""Divide il video consegnato in tre (guida, plugin, geoimage), con audio ita+eng e sottotitoli ita+eng (soft).
Il video viene ricodificato (H.264 crf 18) solo per tagliare con precisione; audio e sottotitoli restano quelli del video completo."""
import os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); C = f"{HERE}/consegna"; OUT = f"{C}/parti"
SRC = f"{C}/palermo-digital-twin-tutorial.mp4"
PARTI = [("1-guida-generale", 0.0, 437.6, "Guida generale"),
         ("2-plugin-catalogo-rndt", 437.6, 626.9, "Plugin catalogo RNDT"),
         ("3-geoimage", 627.5, 773.5, "Geoimage")]
def sec(tc):
    h, m, s = tc.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
def tc(t):
    t = max(0, t); return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round(t%1*1000)):03d}".replace(",1000", ",999")
def srt_parte(src, a, b, dst):
    out, n = [], 0
    for blk in open(src, encoding="utf-8").read().strip().split("\n\n"):
        r = blk.split("\n"); s, e = [sec(x) for x in r[1].split(" --> ")]
        if s >= a - 0.01 and e <= b + 0.2:
            n += 1; out.append(f"{n}\n{tc(s-a)} --> {tc(e-a)}\n" + "\n".join(r[2:]))
    open(dst, "w", encoding="utf-8").write("\n\n".join(out) + "\n"); return n
os.makedirs(OUT, exist_ok=True)
for nome, a, b, titolo in PARTI:
    si, se = f"{OUT}/{nome}.it.srt", f"{OUT}/{nome}.en.srt"
    print(nome, srt_parte(f"{C}/sottotitoli.srt", a, b, si), srt_parte(f"{C}/sottotitoli.en.srt", a, b, se))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(a), "-to", str(b), "-i", SRC, "-i", si, "-i", se,
        "-map", "0:v", "-map", "0:a:0", "-map", "0:a:1", "-map", "1", "-map", "2",
        "-vf", "fade=t=in:st=0:d=0.4,fade=t=out:st=%.2f:d=0.5" % (b - a - 0.5),
        "-af", "afade=t=in:st=0:d=0.3,afade=t=out:st=%.2f:d=0.5" % (b - a - 0.5),
        "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p", "-c:a:0", "aac", "-b:a:0", "128k", "-c:a:1", "aac", "-b:a:1", "96k", "-c:s", "mov_text",
        "-metadata", f"title={titolo}",
        "-metadata:s:a:0", "language=ita", "-metadata:s:a:0", "title=Italiano", "-metadata:s:a:1", "language=eng", "-metadata:s:a:1", "title=English",
        "-metadata:s:s:0", "language=ita", "-metadata:s:s:0", "title=Italiano", "-metadata:s:s:1", "language=eng", "-metadata:s:s:1", "title=English",
        "-disposition:a:0", "default", "-disposition:a:1", "0", "-disposition:s:0", "0", "-disposition:s:1", "0",
        "-movflags", "+faststart", f"{OUT}/{nome}.mp4"], check=True)
