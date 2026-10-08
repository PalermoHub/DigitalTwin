"""Rifa la sola sezione Geoimage del video gia' consegnato (la ripresa originale aveva i punti di controllo sbagliati).

Prerequisiti: audio/*.wav (genera_voce.py), audio/musica.wav, voci/en_US-lessac-medium.onnx, e una registrazione
  SOLO=4-cose,4-inquadra,4-carica,4-posiziona,4-gcp,4-allinea,4-rmse,4-confronto,4-esporta,4-chiusura python registra.py
che scrive out/main.webm + out/log.json.

Scrive out/geo/clip.mp4 (video con sottotitoli italiani incisi, audio ita + eng), out/geo/clip.it.srt, out/geo/clip.en.srt,
out/geo/info.json. Poi `python unisci_geoimage.py` lo innesta nel video completo."""
import json, os, subprocess, sys, wave
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
import montaggio as M
import storyboard as sb

HERE, OUT, AUD, SR, FPS = M.HERE, M.OUT, M.AUD, M.SR, M.FPS
GEO = f"{OUT}/geo"; os.makedirs(GEO, exist_ok=True)
OFFSET_MUSICA = 627.5          # secondi: la musica prosegue da dove era nel video completo
MAXTEMPO = 1.35


def tc(t):
    t = max(0, t); ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    log = json.load(open(f"{OUT}/log.json"))
    dur = json.load(open(f"{AUD}/durate.json"))
    frasi = json.load(open(f"{AUD}/frasi.json"))
    extra = {s["id"]: s["extra"] for s in sb.S}
    vm = M.calibra(f"{OUT}/main.webm")
    scene = log["scene"]
    s0 = scene[0]["start"]
    fine_main = max(s["end"] for s in scene) + 0.4
    Tsrc = fine_main - s0
    pts = M.mappa_tempi(scene, s0, Tsrc, extra)
    Tm = pts[-1][1]
    print(f"registrazione {Tsrc:.1f}s -> {Tm:.1f}s dopo la compressione dei tempi morti")
    voci = {sc["id"]: M.f_uscita(pts, sc["voice_start"] - s0) for sc in scene}
    clicks = [M.f_uscita(pts, t - s0) for t in log.get("clicks", []) if s0 <= t <= fine_main]

    # ---- battute (come i sottotitoli del video) e traduzione inglese in ordine
    en = [l.strip() for l in open(f"{HERE}/en.txt", encoding="utf-8").read().splitlines() if l.strip()]
    srt_old = open(f"{HERE}/consegna/sottotitoli.srt", encoding="utf-8").read().strip().split("\n\n")
    prima = next(i for i, b in enumerate(srt_old) if b.split("\n")[2].startswith("Ultima funzione"))
    cues = []     # (inizio, fine, testo it)
    for sid in voci:
        for f in frasi.get(sid, []):
            pezzi = M.spezza(f["testo"]); tot = sum(len(p) for p in pezzi)
            a = voci[sid] + f["t"]; durata = max(0.5, f["d"] - 0.12)
            for p in pezzi:
                parte = durata * len(p) / tot
                cues.append((a, a + parte - 0.04, p.replace("\n", " "))); a += parte
    # le battute 4-* del video vecchio vanno da "Ultima funzione" fino a "...MapWarper." (38 battute)
    n_old = 38
    assert len(cues) == n_old, f"{len(cues)} battute nuove, {n_old} nel video vecchio: controlla il copione"
    en_cues = en[prima:prima + n_old]
    assert en_cues[0].startswith("Last feature") and en_cues[-1].endswith("MapWarper."), (en_cues[0], en_cues[-1])
    for nome, testi in (("it", [c[2] for c in cues]), ("en", en_cues)):
        open(f"{GEO}/clip.{nome}.srt", "w", encoding="utf-8").write(
            "\n\n".join(f"{i}\n{tc(c[0])} --> {tc(c[1])}\n{t}" for i, (c, t) in enumerate(zip(cues, testi), 1)) + "\n")

    totale = Tm
    n = int(totale * SR)

    # ---- musica con ducking + clic (stessa ricetta del montaggio)
    mus = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-ss", str(OFFSET_MUSICA), "-i", f"{AUD}/musica.wav", "-t", str(totale),
                                        "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout, dtype=np.float32).reshape(-1, 2)
    if len(mus) < n:
        mus = np.vstack([mus, np.zeros((n - len(mus), 2), dtype=np.float32)])
    mus = mus[:n]
    cl = np.zeros(n, dtype=np.float32); s = M.clic_suono()
    for t in clicks:
        i0 = int(t * SR)
        if 0 <= i0 < n - len(s):
            cl[i0:i0 + len(s)] += s * .16

    def mix(voce, path):
        env = M.smooth(np.abs(voce), int(.18 * SR))
        duck = M.smooth(1 - .78 * np.clip(env / .05, 0, 1), int(.35 * SR))
        st = np.stack([voce + cl, voce + cl], 1) + mus * (.115 * duck)[:, None]
        pk = np.abs(st).max()
        if pk > .98: st *= .98 / pk
        with wave.open(path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())

    # voce italiana
    vit = np.zeros(n, dtype=np.float32)
    for sid, t0 in voci.items():
        w = M.carica_mono(f"{AUD}/{sid}.wav"); i0 = int(t0 * SR); L = min(len(w), n - i0)
        if L > 0: vit[i0:i0 + L] += w[:L]
    mix(vit, f"{GEO}/mix_it.wav")

    # voce inglese: una battuta per sottotitolo, sul tempo del sottotitolo
    voce = PiperVoice.load(f"{HERE}/voci/en_US-lessac-medium.onnx")
    cfg = SynthesisConfig(length_scale=1.0, noise_scale=0.6, noise_w_scale=0.7); sr_v = voce.config.sample_rate
    ven = np.zeros(n, dtype=np.float32); avvisi = []
    for i, ((a, b, _), t) in enumerate(zip(cues, en_cues)):
        x = np.concatenate([np.frombuffer(c.audio_int16_bytes, dtype=np.int16) for c in voce.synthesize(t, syn_config=cfg)])
        nz = np.nonzero(np.abs(x) > 300)[0]
        if len(nz): x = x[:nz[-1] + int(0.05 * sr_v)]
        d = len(x) / sr_v
        prossimo = cues[i + 1][0] if i + 1 < len(cues) else b + 3
        finestra = max(b - a, prossimo - a - 0.08)
        if d > finestra:
            f = d / finestra
            if f > MAXTEMPO: avvisi.append((i + 1, round(f, 2), t[:40]))
            x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(sr_v), "-ac", "1", "-i", "-", "-af", f"atempo={min(f, MAXTEMPO):.4f}", "-f", "s16le", "-"],
                                             input=x.tobytes(), capture_output=True, check=True).stdout, dtype=np.int16)
        y = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(sr_v), "-ac", "1", "-i", "-", "-ar", str(SR), "-f", "f32le", "-"],
                                         input=x.tobytes(), capture_output=True, check=True).stdout, dtype=np.float32)
        i0 = int(a * SR); L = min(len(y), n - i0)
        if L > 0: ven[i0:i0 + L] += y[:L]
    print("voce inglese oltre x1.35:", avvisi)
    mix(ven, f"{GEO}/mix_en.wav")

    # ---- video: registrazione compressa + zoom + sottotitoli italiani incisi
    M.scrivi_ass(f"{OUT}/sottotitoli_geo.ass", voci, frasi)
    zf = M.filtro_zoom(log.get("zoom", []), s0)
    ms = s0 + vm
    graf = (f"[0:v]trim=start={ms:.3f}:duration={Tsrc:.3f},setpts=PTS-STARTPTS,scale=1920:1080,format=yuv420p"
            + ("," + zf if zf else "") + f",setpts='({M.espr_mappa(pts)})/TB',fps={FPS}[vc];"
            "[vc]ass=out/sottotitoli_geo.ass:fontsdir=assets/fonts[v]")
    open(f"{OUT}/grafo_geo.txt", "w").write(graf)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-stats", "-i", f"{OUT}/main.webm", "-i", f"{GEO}/mix_it.wav", "-i", f"{GEO}/mix_en.wav",
                    "-filter_complex_script", "out/grafo_geo.txt", "-map", "[v]", "-map", "1:a", "-map", "2:a",
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", f"{totale:.3f}", f"{GEO}/clip.mp4"], check=True, cwd=HERE)
    json.dump(dict(durata=totale), open(f"{GEO}/info.json", "w"))
    print("fatto", f"{GEO}/clip.mp4", f"{totale:.1f}s")


if __name__ == "__main__":
    main()
