"""Colonna sonora del reel «strati esplosi»: come musica-reel.py (musica sintetizzata, nessun brano di terzi, 120 bpm),
con whoosh e colpo sui tagli e un tic leggero a ogni strato della salita; la musica scende sotto la voce.
Tempi da esplodi-tempi.json (scritto da genera-esplodi.mjs --tempi).
Uso: python musica-esplodi.py <cartella-voce> <uscita.wav>"""
import json, os, sys, wave
import numpy as np
SR = 44100
qui = os.path.dirname(os.path.abspath(__file__))
BATTUTE = json.load(open(os.path.join(qui, "esplodi-battute.json")))
TEMPI = json.load(open(os.path.join(qui, "esplodi-tempi.json")))
DUR = TEMPI["durata"]
TAGLI = TEMPI["tagli"]
STRATI = [TEMPI["salita"] + k * TEMPI["passo"] for k in range(1, TEMPI["n"])]
R = [0, TEMPI["tagli"][-1], DUR]
voce_dir, uscita = sys.argv[1], sys.argv[2]
n = int(SR * DUR); t = np.arange(n) / SR
rng = np.random.default_rng(7)
BPM = 120; beat = 60 / BPM; bar = 4 * beat
ACC = [(110.00, [220.00, 261.63, 329.63]), (87.31, [174.61, 220.00, 261.63]),
       (130.81, [196.00, 261.63, 329.63]), (98.00, [196.00, 246.94, 293.66])]
mus = np.zeros((n, 2))
def add(sig, t0, gl=1, gr=1):
    i0 = int(t0 * SR)
    if i0 >= n: return
    L = min(len(sig), n - i0); mus[i0:i0+L, 0] += sig[:L] * gl; mus[i0:i0+L, 1] += sig[:L] * gr
def tono(f, d, dec):
    tt = np.arange(int(SR * d)) / SR
    return (np.sin(2*np.pi*f*tt) + .35*np.sin(2*np.pi*2*f*tt) + .15*np.sin(2*np.pi*3*f*tt)) * np.exp(-tt * dec)
def kick():
    tt = np.arange(int(SR * .35)) / SR
    f = 50 + 110 * np.exp(-tt * 28)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-tt * 9)
def hat():
    tt = np.arange(int(SR * .05)) / SR
    s = rng.standard_normal(len(tt)); s = np.diff(s, prepend=0)
    return s * np.exp(-tt * 70)
def pad(fs, d):
    tt = np.arange(int(SR * d)) / SR
    s = sum(np.sin(2*np.pi*f*tt) + .4*np.sin(2*np.pi*f*1.005*tt) for f in fs)
    return s * np.minimum(1, tt / .3) * np.minimum(1, (d - tt) / .5)
INIZIO_RITMO = 0.35   # la cassa parte con la prima battuta
nb = int(DUR / bar) + 1
for b in range(nb):
    t0 = b * bar
    basso, tri = ACC[b % 4]
    add(pad(tri, bar + .5) * .03, t0)
    for k in range(8):                       # arpeggio a crome
        f = [tri[0], tri[1], tri[2], tri[1]*2, tri[2]*2, tri[1]*2, tri[2], tri[1]][k]
        p = .3 + .4 * (k % 2)
        add(tono(f, .4, 9) * .06, t0 + k * beat / 2, 1 - p, p)
    for k in range(4):
        tb = t0 + k * beat
        if tb >= INIZIO_RITMO and tb < DUR - 1.6:
            add(kick() * .55, tb)
            add(tono(basso, .45, 6) * .22, tb)
        add(hat() * .12, tb + beat / 2)
# whoosh prima del taglio e colpo sul taglio
for c in TAGLI:
    d = .45; tt = np.arange(int(SR * d)) / SR
    nz = rng.standard_normal(len(tt))
    # rumore filtrato con media mobile che si accorcia: sale verso l'acuto
    out = np.zeros_like(nz); acc = 0
    for i in range(len(nz)):
        a = .02 + .5 * (i / len(nz)) ** 2
        acc += a * (nz[i] - acc); out[i] = acc
    add(out * (tt / d) ** 2 * .5, c - d)
    add(kick() * .5, c); add(tono(55, .6, 5) * .3, c)
# un tic a ogni strato della salita
for c in STRATI:
    add(tono(1318.5, .18, 22) * .07, c, .6, .4); add(tono(1975.5, .12, 30) * .035, c + .02, .4, .6)
# finale: accordo lungo
add(pad([220.00, 261.63, 329.63, 440.0], DUR - R[-2]) * .06, R[-2])
mus /= np.abs(mus).max()
# voce
voce = np.zeros(n)
for i, b in enumerate(BATTUTE):
    with wave.open(os.path.join(voce_dir, f"voce-{i}.wav")) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16) / 32768
    a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
    i0 = int(b["t"] * SR); L = min(len(a), n - i0); voce[i0:i0+L] += a[:L]
voce /= np.abs(voce).max()
# ducking: inviluppo della voce smussato
env = np.convolve(np.abs(voce), np.ones(int(SR * .08)) / int(SR * .08), mode="same")
duck = 1 - .55 * np.clip(env / .08, 0, 1)
duck = np.convolve(duck, np.ones(int(SR * .05)) / int(SR * .05), mode="same")
mix = mus * duck[:, None] * .55 + voce[:, None] * .95
fade = np.minimum(1, (DUR - t) / 1.2)[:, None]
mix *= fade
mix /= np.abs(mix).max(); mix *= .95
with wave.open(uscita, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", uscita)
