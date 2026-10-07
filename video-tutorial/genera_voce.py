"""Voce per scena con Piper (it_IT-paola-medium). Scrive audio/<id>.wav e audio/durate.json."""
import json, os, sys, wave
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
import storyboard as sb

LENGTH = float(os.environ.get("LENGTH", "1.27"))   # 1.0 = ~212 parole/min; 1.38 ≈ 150
PAUSA_FRASE = 0.28                                  # secondi di silenzio dopo ogni frase
voce = PiperVoice.load("voci/it_IT-paola-medium.onnx")
cfg = SynthesisConfig(length_scale=LENGTH, noise_scale=0.6, noise_w_scale=0.7)
os.makedirs("audio", exist_ok=True)
sr = voce.config.sample_rate
durate = {}
frasi_log = {}
SPLIT = r"(?<=[.!?:])\s+"
for s in sb.S:
    testo = sb.per_voce(s["testo"])
    frasi = [f.strip() for f in __import__("re").split(SPLIT, testo) if f.strip()]
    leggibili = [f.strip() for f in __import__("re").split(SPLIT, s["testo"]) if f.strip()]
    assert len(frasi) == len(leggibili), (s["id"], len(frasi), len(leggibili))
    pezzi, info, t_acc = [], [], 0.0
    for f, leg in zip(frasi, leggibili):
        n0 = sum(len(x) for x in pezzi)
        for chunk in voce.synthesize(f, syn_config=cfg):
            pezzi.append(np.frombuffer(chunk.audio_int16_bytes, dtype=np.int16))
        pezzi.append(np.zeros(int(sr * PAUSA_FRASE), dtype=np.int16))
        n1 = sum(len(x) for x in pezzi)
        info.append(dict(t=round(n0 / sr, 3), d=round((n1 - n0) / sr, 3), testo=leg))
    frasi_log[s["id"]] = info
    audio = np.concatenate(pezzi)
    with wave.open(f"audio/{s['id']}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(audio.tobytes())
    d = len(audio) / sr
    durate[s["id"]] = round(d, 2)
    print(f"{s['id']:14s} {d:6.1f}s  {len(s['testo'].split())/d*60:5.0f} parole/min")
json.dump(durate, open("audio/durate.json", "w"), indent=1)
json.dump(frasi_log, open("audio/frasi.json", "w"), indent=1, ensure_ascii=False)
tot = sum(durate.values()); par = sum(len(s['testo'].split()) for s in sb.S)
print(f"TOTALE voce {tot/60:.1f} min · {par} parole · {par/tot*60:.0f} parole/min")
