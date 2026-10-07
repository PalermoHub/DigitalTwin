"""Montaggio finale: apertura + registrazione + schermata di chiusura, con zoom morbidi, sottotitoli,
voce, musica (con ducking) e clic. Esporta out/palermo-digital-twin-tutorial.mp4 (H.264 + AAC).

  python montaggio.py                  montaggio completo
  ANTEPRIMA=60 python montaggio.py     solo i primi 60 secondi (prova di qualità e di velocità)
"""
import glob, json, math, os, re, shutil, subprocess, sys
import numpy as np
from PIL import Image
import storyboard as sb

HERE = os.path.dirname(os.path.abspath(__file__))
OUT, AUD = f"{HERE}/out", f"{HERE}/audio"
FPS, SR = 30, 44100
ANTEPRIMA = float(os.environ.get("ANTEPRIMA", "0"))
SOTTOTITOLI_ALTI = {"2-filtri", "2-colori", "2-strati", "2-calore"}   # dove in basso coprirebbero ricerca o legenda


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        raise SystemExit("ERRORE " + " ".join(cmd[:4]) + "\n" + r.stderr[-1800:])
    return r


def calibra(webm):
    """Istante (s) del video in cui compare il lampo magenta = zero del log di registrazione."""
    d = f"{OUT}/cal"; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    run(["ffmpeg", "-v", "error", "-t", "12", "-i", webm, "-vf", f"fps={FPS},scale=32:18", f"{d}/f_%04d.png"])
    for i, f in enumerate(sorted(glob.glob(f"{d}/f_*.png"))):
        m = np.asarray(Image.open(f).convert("RGB")).reshape(-1, 3).mean(0)
        if m[0] > 170 and m[1] < 90 and m[2] > 170:
            return i / FPS
    raise SystemExit("lampo di calibrazione non trovato nel video")


# ───────────── espressioni di zoom morbido (smoothstep) per ffmpeg ─────────────
def espressione(tr, iniziale):
    """tr = [(t0, t1, valore)]; interpola a smoothstep da un valore al successivo."""
    if not tr:
        return str(iniziale)
    prev, pezzi, ult = iniziale, [], 0.0
    for t0, t1, v in tr:
        t0 = max(t0, ult)
        t1 = max(t1, t0 + 0.05)
        pezzi.append((t0, t1, prev, v))
        prev, ult = v, t1
    expr = f"{prev:.4f}"
    for t0, t1, a, b in reversed(pezzi):
        u = f"clip((t-{t0:.3f})/{t1 - t0:.3f},0,1)"
        expr = f"if(lt(t,{t0:.3f}),{a:.4f},if(lt(t,{t1:.3f}),{a:.4f}+({b:.4f}-{a:.4f})*({u}*{u}*(3-2*{u})),{expr}))"
    return expr


def filtro_zoom(zooms, s0):
    if not zooms:
        return ""
    z = [(k["t"] - s0, k["t"] - s0 + k["ramp"], k) for k in zooms]
    Z = espressione([(a, b, k["z"]) for a, b, k in z], 1.0)
    CX = espressione([(a, b, k["cx"]) for a, b, k in z], 960.0)
    CY = espressione([(a, b, k["cy"]) for a, b, k in z], 540.0)
    return (f"scale=w='trunc(1920*({Z})/2)*2':h='trunc(1080*({Z})/2)*2':eval=frame:flags=bicubic,"
            f"crop=1920:1080:x='min(max(({CX})*({Z})-960,0),in_w-1920)':y='min(max(({CY})*({Z})-540,0),in_h-1080)'")


# ───────────── sottotitoli ASS ─────────────
def spezza(testo, massimo=88):
    if len(testo) <= massimo:
        return [testo]
    meta = len(testo) // 2
    cand = [m.end() for m in re.finditer(r"[,:;] ", testo)] or [m.end() for m in re.finditer(r" ", testo)]
    k = min(cand, key=lambda i: abs(i - meta))
    return spezza(testo[:k].strip(), massimo) + spezza(testo[k:].strip(), massimo)


SETUP_SPEED, TAIL_SPEED = 3.0, 2.5
LEAD_TENUTO = 0.3


def mappa_tempi(scene, s0, fine, extra):
    """Punti (t_sorgente, t_uscita) di una mappa lineare a tratti: la parte di preparazione prima della voce e la coda dopo la voce
    vengono accelerate (timelapse), la voce resta a velocità normale. Tempi relativi a s0."""
    pts, out = [(0.0, 0.0)], 0.0
    def tratto(a, b, vel):
        nonlocal out
        if b - a <= 1e-3:
            return
        out += (b - a) / vel
        pts.append((b, out))
    for i, sc in enumerate(scene):
        S = sc["start"] - s0
        X = (scene[i + 1]["start"] - s0) if i + 1 < len(scene) else fine
        V = sc["voice_start"] - s0
        E = V + sc["voice_dur"] + min(extra.get(sc["id"], 0.5), 0.6)
        a1 = max(S, V - LEAD_TENUTO)
        if pts[-1][0] < S:                      # eventuale spazio fra scene
            tratto(pts[-1][0], S, 1.0)
        tratto(S, a1, SETUP_SPEED if a1 - S > 1.2 else 1.0)
        tratto(a1, min(E, X), 1.0)
        if X > E:
            tratto(E, X, TAIL_SPEED if X - E > 1.5 else 1.0)
    return pts


def f_uscita(pts, t):
    for (a, oa), (b, ob) in zip(pts, pts[1:]):
        if t <= b:
            return oa + (t - a) * (ob - oa) / (b - a)
    return pts[-1][1]


def espr_mappa(pts):
    """Espressione ffmpeg per setpts: tempo di uscita (in unità del timebase) a partire da T (secondi sorgente)."""
    expr = f"{pts[-1][1]:.4f}"
    for (a, oa), (b, ob) in reversed(list(zip(pts, pts[1:]))):
        k = (ob - oa) / (b - a)
        expr = f"if(lt(T,{b:.4f}),{oa:.4f}+(T-{a:.4f})*{k:.5f},{expr})"
    return expr


def tc_ass(t):
    t = max(0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def scrivi_ass(path, voce_inizio, frasi):
    righe = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080", "WrapStyle: 0", "",
             "[V4+ Styles]",
             "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding",
             "Style: Basso,Montserrat,40,&H00FFFFFF,&H000000FF,&H28231F1B,&H28231F1B,-1,0,0,0,100,100,0,0,3,14,0,2,330,330,58,1",
             "Style: AltoAlto,Montserrat,40,&H00FFFFFF,&H000000FF,&H28231F1B,&H28231F1B,-1,0,0,0,100,100,0,0,3,14,0,8,330,330,30,1",
             "Style: Alto,Montserrat,40,&H00FFFFFF,&H000000FF,&H28231F1B,&H28231F1B,-1,0,0,0,100,100,0,0,3,14,0,8,330,330,150,1",
             "", "[Events]", "Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text"]
    for sid, t0 in voce_inizio.items():
        stile = "AltoAlto" if sid == "5-saluti" else ("Alto" if sid in SOTTOTITOLI_ALTI else "Basso")
        for f in frasi.get(sid, []):
            pezzi = spezza(f["testo"])
            tot = sum(len(p) for p in pezzi)
            a = t0 + f["t"]
            durata = max(0.5, f["d"] - 0.12)
            for p in pezzi:
                parte = durata * len(p) / tot
                righe.append(f"Dialogue: 0,{tc_ass(a)},{tc_ass(a + parte - 0.04)},{stile},,0,0,0,,{p.replace(chr(10), ' ')}")
                a += parte
    open(path, "w", encoding="utf-8").write("\n".join(righe) + "\n")


# ───────────── audio ─────────────
def carica_mono(path):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ar", str(SR), "-ac", "1", "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32)


def clic_suono():
    n = int(SR * 0.05)
    t = np.arange(n) / SR
    rng = np.random.default_rng(3)
    return ((np.sin(2 * np.pi * 1500 * t) * .6 + rng.standard_normal(n) * .4) * np.exp(-t * 90)).astype(np.float32)


def smooth(x, n):
    """Media mobile in tempo lineare (somma cumulata): np.convolve su 14 minuti di audio impiegherebbe minuti."""
    c = np.cumsum(np.insert(x.astype(np.float64), 0, 0.0))
    y = (c[n:] - c[:-n]) / n
    sx = n // 2
    return np.pad(y, (sx, n - 1 - sx), mode="edge").astype(np.float32)


def mix_audio(path, totale, voci_inizio, clicks_t):
    n = int(totale * SR)
    voce = np.zeros(n, dtype=np.float32)
    for sid, t0 in voci_inizio.items():
        w = carica_mono(f"{AUD}/{sid}.wav")
        i0 = int(t0 * SR)
        L = min(len(w), n - i0)
        if L > 0:
            voce[i0:i0 + L] += w[:L]
    # musica
    mus = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f"{AUD}/musica.wav", "-t", str(totale), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout, dtype=np.float32).reshape(-1, 2)
    if len(mus) < n:
        mus = np.vstack([mus, np.zeros((n - len(mus), 2), dtype=np.float32)])
    mus = mus[:n]
    env = smooth(np.abs(voce), int(.18 * SR))
    duck = 1 - .78 * np.clip(env / .05, 0, 1)
    duck = smooth(duck, int(.35 * SR))
    fade = np.minimum(1, np.arange(n) / (2.0 * SR)) * np.minimum(1, (n - np.arange(n)) / (3.5 * SR))
    music = mus * (.115 * duck * fade)[:, None]
    # clic
    cl = np.zeros(n, dtype=np.float32)
    s = clic_suono()
    for t in clicks_t:
        i0 = int(t * SR)
        if 0 <= i0 < n - len(s):
            cl[i0:i0 + len(s)] += s * .16
    st = np.stack([voce + cl, voce + cl], axis=1) + music
    pk = np.abs(st).max()
    if pk > .98:
        st *= .98 / pk
    pcm = (st * 32767).astype(np.int16)
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def main():
    log = json.load(open(f"{OUT}/log.json"))
    dur = json.load(open(f"{AUD}/durate.json"))
    frasi = json.load(open(f"{AUD}/frasi.json"))
    intro = json.load(open(f"{OUT}/intro.json"))
    extra = {s["id"]: s["extra"] for s in sb.S}
    vm = calibra(f"{OUT}/main.webm")
    scene = log["scene"]
    s0 = scene[0]["start"]
    fine_main = max(s["end"] for s in scene) + 0.4
    Tsrc = fine_main - s0
    pts = mappa_tempi(scene, s0, Tsrc, extra)
    Tm = pts[-1][1]
    D1 = intro["dur"] - 0.3
    Dc = dur["5-saluti"] + extra["5-saluti"] + 0.7 + 0.5
    totale = D1 + Tm + Dc
    print(f"intro {D1:.1f}s · registrazione {Tsrc:.1f}s → {Tm:.1f}s dopo la compressione dei tempi morti · chiusura {Dc:.1f}s · TOTALE {totale / 60:.2f} min")

    voci = {"1-titolo": 0.4}
    for sc_ in scene:
        voci[sc_["id"]] = D1 + f_uscita(pts, sc_["voice_start"] - s0)
    voci["5-saluti"] = D1 + Tm + 0.7
    clicks = [D1 + f_uscita(pts, t - s0) for t in log.get("clicks", []) if s0 <= t <= fine_main]

    scrivi_ass(f"{OUT}/sottotitoli.ass", voci, frasi)
    mix_audio(f"{OUT}/mix.wav", totale, voci, clicks)

    zf = filtro_zoom(log.get("zoom", []), s0)
    ms = s0 + vm
    graf = (
        f"[0:v]trim=start=0.3,setpts=PTS-STARTPTS,fps={FPS},scale=1920:1080,format=yuv420p,fade=t=out:st={D1 - 0.5:.2f}:d=0.5[v0];"
        f"[1:v]trim=start={ms:.3f}:duration={Tsrc:.3f},setpts=PTS-STARTPTS,scale=1920:1080,format=yuv420p"
        + ("," + zf if zf else "") + f",setpts='({espr_mappa(pts)})/TB',fps={FPS},fade=t=in:st=0:d=0.5,fade=t=out:st={Tm - 0.5:.2f}:d=0.5[v1];"
        f"[2:v]fps={FPS},scale=1920:1080,format=yuv420p,trim=duration={Dc:.2f},fade=t=in:st=0:d=0.6[v2];"
        f"[v0][v1][v2]concat=n=3:v=1:a=0[vc];"
        f"[vc]ass={OUT}/sottotitoli.ass:fontsdir={HERE}/assets/fonts[v]"
    )
    open(f"{OUT}/grafo.txt", "w").write(graf)
    cmd = ["ffmpeg", "-y", "-v", "error", "-stats",
           "-i", f"{OUT}/intro.webm", "-i", f"{OUT}/main.webm",
           "-loop", "1", "-framerate", str(FPS), "-i", f"{HERE}/assets/chiusura.png",
           "-i", f"{OUT}/mix.wav",
           "-filter_complex_script", f"{OUT}/grafo.txt", "-map", "[v]", "-map", "3:a",
           "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest"]
    if ANTEPRIMA:
        cmd += ["-t", str(ANTEPRIMA)]
        dest = f"{OUT}/anteprima.mp4"
    else:
        dest = f"{OUT}/palermo-digital-twin-tutorial.mp4"
    subprocess.run(cmd + [dest], check=True)
    info = dict(intro=D1, registrazione=Tm, chiusura=Dc, totale=totale, vm=vm, file=dest)
    json.dump(info, open(f"{OUT}/montaggio_info.json", "w"), indent=1)
    print("fatto:", dest, f"{totale / 60:.2f} min")


if __name__ == "__main__":
    main()
