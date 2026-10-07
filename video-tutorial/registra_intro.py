"""Registra l'apertura animata (titolo.html) in out/intro.webm per la durata della scena 1-titolo."""
import json, os, time
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
dur = json.load(open(f"{HERE}/audio/durate.json"))["1-titolo"] + 0.3 + 1.5
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--allow-file-access-from-files"])
    ctx = b.new_context(viewport={"width": 1920, "height": 1080}, record_video_dir=f"{OUT}/video_intro", record_video_size={"width": 1920, "height": 1080})
    pg = ctx.new_page()
    t0 = time.monotonic()
    pg.goto("file://" + os.path.join(HERE, "titolo.html"))
    t_ok = time.monotonic() - t0
    pg.wait_for_timeout(int(dur * 1000))
    path = pg.video.path()
    ctx.close(); b.close()
os.replace(path, f"{OUT}/intro.webm")
json.dump({"dur": dur, "load": t_ok}, open(f"{OUT}/intro.json", "w"))
print("intro", round(dur, 1), "s")
