"""Traccia audio inglese per il video gia' montato (il video non viene rigenerato).
Voce Piper en_US-lessac-medium, una battuta per ogni sottotitolo di consegna/sottotitoli.srt, posizionata sul timecode originale
(se piu' lunga della finestra viene accelerata, al massimo x1.35), sopra la stessa musica con ducking del montaggio.
Scrive audio/en/mix_en.wav e consegna/sottotitoli.en.srt."""
import json, os, re, subprocess, wave, sys
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
MAXTEMPO = 1.35
srt = open(f"{HERE}/consegna/sottotitoli.srt", encoding="utf-8").read().strip().split("\n\n")
en = [l.strip() for l in open(f"{HERE}/en.txt", encoding="utf-8").read().splitlines() if l.strip()]
assert len(srt) == len(en), (len(srt), len(en))

def sec(tc):
    h, m, s = tc.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
cues = []
for blocco, testo in zip(srt, en):
    r = blocco.split("\n"); a, b = r[1].split(" --> ")
    cues.append((sec(a), sec(b), r[1], testo))

# sottotitoli inglesi
open(f"{HERE}/consegna/sottotitoli.en.srt", "w", encoding="utf-8").write(
    "\n\n".join(f"{i}\n{tc}\n{t}" for i, (_, _, tc, t) in enumerate(cues, 1)) + "\n")

voce = PiperVoice.load(f"{HERE}/voci/en_US-lessac-medium.onnx")
cfg = SynthesisConfig(length_scale=1.0, noise_scale=0.6, noise_w_scale=0.7)
sr_v = voce.config.sample_rate
os.makedirs(f"{HERE}/audio/en", exist_ok=True)

def tempo(x, f):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(sr_v), "-ac", "1", "-i", "-", "-af", f"atempo={f:.4f}", "-f", "s16le", "-"],
                       input=x.tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.int16)

n = int((cues[-1][1] + 6) * SR)
if len(sys.argv) > 1: n = int(float(sys.argv[1]) * SR)
voice = np.zeros(n, dtype=np.float32)
avvisi = []
for i, (a, b, tc, t) in enumerate(cues):
    pezzi = [np.frombuffer(c.audio_int16_bytes, dtype=np.int16) for c in voce.synthesize(t, syn_config=cfg)]
    x = np.concatenate(pezzi)
    # toglie il silenzio finale
    nz = np.nonzero(np.abs(x) > 300)[0]
    if len(nz): x = x[:nz[-1] + int(0.05 * sr_v)]
    d = len(x) / sr_v
    prossimo = cues[i + 1][0] if i + 1 < len(cues) else b + 3
    finestra = max(b - a, prossimo - a - 0.08)
    if d > finestra:
        f = d / finestra
        if f > MAXTEMPO: avvisi.append((i + 1, round(f, 2), t[:50]))
        x = tempo(x, min(f, MAXTEMPO)); d = len(x) / sr_v
    y = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(sr_v), "-ac", "1", "-i", "-", "-ar", str(SR), "-f", "f32le", "-"],
                       input=x.tobytes(), capture_output=True, check=True).stdout
    y = np.frombuffer(y, dtype=np.float32)
    i0 = int(a * SR)
    if i0 >= n: break
    L = min(len(y), n - i0); voice[i0:i0 + L] += y[:L]
print("avvisi (voce oltre la finestra anche a x1.35):", avvisi)

def smooth(x, k):
    c = np.cumsum(np.insert(x.astype(np.float64), 0, 0.0)); y = (c[k:] - c[:-k]) / k
    sx = k // 2
    return np.pad(y, (sx, k - 1 - sx), mode="edge").astype(np.float32)

mus = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f"{HERE}/audio/musica.wav", "-t", str(n / SR), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                                   capture_output=True).stdout, dtype=np.float32).reshape(-1, 2)
if len(mus) < n: mus = np.vstack([mus, np.zeros((n - len(mus), 2), dtype=np.float32)])
mus = mus[:n]
env = smooth(np.abs(voice), int(.18 * SR))
duck = smooth(1 - .78 * np.clip(env / .05, 0, 1), int(.35 * SR))
fade = np.minimum(1, np.arange(n) / (2.0 * SR)) * np.minimum(1, (n - np.arange(n)) / (3.5 * SR))
st = np.stack([voice, voice], 1) + mus * (.115 * duck * fade)[:, None]
pk = np.abs(st).max()
if pk > .98: st *= .98 / pk
with wave.open(f"{HERE}/audio/en/mix_en.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print("ok", n / SR, "s")
