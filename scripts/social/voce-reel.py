"""Voce del reel di lancio con Edge TTS (it-IT-ElsaNeural, la voce del primo reel).
Per ogni battuta di reel-battute.json scrive <out>/voce-<n>.wav e, in <out>/durate.json,
la durata e i tempi di ogni parola (per i sottotitoli karaoke).
Uso: python voce-reel.py <cartella-uscita> [voce] [velocità, es. +5%]"""
import asyncio, json, os, subprocess, sys
import certifi
if os.path.exists("/root/.ccr/ca-bundle.crt"):          # proxy dell'ambiente cloud
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts

qui = os.path.dirname(os.path.abspath(__file__))
BATTUTE = json.load(open(os.path.join(qui, "reel-battute.json")))
out = sys.argv[1]
VOCE = sys.argv[2] if len(sys.argv) > 2 else "it-IT-ElsaNeural"
RATE = sys.argv[3] if len(sys.argv) > 3 else "+0%"
os.makedirs(out, exist_ok=True)

async def battuta(i, b):
    c = edge_tts.Communicate(b["testo"], VOCE, rate=b.get("rate", RATE), boundary="WordBoundary",
                             proxy=os.environ.get("HTTPS_PROXY"))
    mp3, parole = bytearray(), []
    async for ev in c.stream():
        if ev["type"] == "audio":
            mp3 += ev["data"]
        elif ev["type"] == "WordBoundary":
            parole.append({"w": ev["text"], "t": ev["offset"] / 1e7, "d": ev["duration"] / 1e7})
    f = os.path.join(out, f"voce-{i}")
    open(f + ".mp3", "wb").write(mp3)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f + ".mp3", "-ac", "1", "-ar", "24000", f + ".wav"], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f + ".wav"]))
    return {"d": round(d, 3), "parole": parole}

async def main():
    info = [await battuta(i, b) for i, b in enumerate(BATTUTE)]
    json.dump(info, open(os.path.join(out, "durate.json"), "w"), ensure_ascii=False)
    for i, (b, x) in enumerate(zip(BATTUTE, info)):
        fine = x["parole"][-1]["t"] + x["parole"][-1]["d"] if x["parole"] else x["d"]
        print(f"{i:2d} t={b['t']:5.2f}  file {x['d']:4.2f}s  parlato {fine:4.2f}s  fine {b['t'] + fine:5.2f}  {b['testo']}")

asyncio.run(main())
