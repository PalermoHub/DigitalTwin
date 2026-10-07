"""Sottofondo sintetizzato (nessun brano di terzi): pad morbido + arpeggio pizzicato, 96 bpm, progressione Am–F–C–G.
Scrive audio/musica.wav (stereo 44,1 kHz) lungo `minuti` minuti."""
import sys, numpy as np, wave
SR = 44100
minuti = float(sys.argv[1]) if len(sys.argv) > 1 else 15.5
n = int(SR * 60 * minuti)
t = np.arange(n) / SR
BPM = 96; beat = 60 / BPM
bar = 4 * beat
ACCORDI = [  # (nota basso, triade) in Hz
    (110.00, [220.00, 261.63, 329.63]),   # Am
    (87.31,  [174.61, 220.00, 261.63]),   # F
    (130.81, [196.00, 261.63, 329.63]),   # C
    (98.00,  [196.00, 246.94, 293.66]),   # G
]
def pad(freqs, dur):
    tt = np.arange(int(SR * dur)) / SR
    s = sum(np.sin(2*np.pi*f*tt) + .5*np.sin(2*np.pi*f*2.003*tt) + .25*np.sin(2*np.pi*f*.5*tt) for f in freqs)
    env = np.minimum(1, tt / 1.2) * np.minimum(1, (dur - tt) / 1.6)
    return s * env
def pizz(f, dur=.9):
    tt = np.arange(int(SR * dur)) / SR
    return (np.sin(2*np.pi*f*tt) + .3*np.sin(2*np.pi*f*2*tt)) * np.exp(-tt * 5.5)
out = np.zeros((n, 2))
n_bar = int(minuti * 60 / bar) + 1
for b in range(n_bar):
    basso, tri = ACCORDI[b % 4]
    i0 = int(b * bar * SR)
    p = pad([basso] + tri, bar + 1.8) * .045
    L = min(len(p), n - i0)
    if L <= 0: break
    out[i0:i0+L, 0] += p[:L]; out[i0:i0+L, 1] += p[:L]
    # arpeggio a crome, con pan alternato
    nota_seq = [tri[0], tri[1], tri[2], tri[1] * 2, tri[2], tri[1], tri[0] * 2, tri[1]]
    for k, f in enumerate(nota_seq):
        j0 = i0 + int(k * beat / 2 * SR)
        if j0 >= n: break
        s = pizz(f * (2 if k % 4 == 3 else 1)) * (.07 if k % 2 == 0 else .045)
        L = min(len(s), n - j0)
        pan = .35 + .3 * (k % 2)
        out[j0:j0+L, 0] += s[:L] * (1 - pan); out[j0:j0+L, 1] += s[:L] * pan
    # basso al primo tempo
    sb = pizz(basso, 1.4) * .12
    L = min(len(sb), n - i0)
    out[i0:i0+L] += sb[:L, None]
# eco morbido
d = int(.375 * SR)
eco = np.zeros_like(out); eco[d:] = out[:-d] * .28
out += eco
out /= max(1e-6, np.abs(out).max()); out *= .9
pcm = (out * 32767).astype(np.int16)
with wave.open("audio/musica.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("musica", round(n / SR / 60, 1), "min")
