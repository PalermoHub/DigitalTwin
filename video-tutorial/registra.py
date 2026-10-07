"""Registra la sessione nell'app live seguendo storyboard.py e audio/durate.json.

  python registra.py                 registrazione reale (video in out/main.webm + out/log.json)
  FAST=0.2 python registra.py        collaudo veloce, senza video, con screenshot in out/shots/ (SHOTS=1)
  SOLO=2-strati,2-ordine ...         esegue solo alcune scene
"""
import os, sys, time
from playwright.sync_api import sync_playwright
from scenes_base import *
import scenes_s12  # noqa
for _m in ("scenes_s3", "scenes_s4"):
    try:
        __import__(_m)
    except ModuleNotFoundError as e:
        if e.name != _m:
            raise
SOLO = [x for x in os.environ.get("SOLO", "").split(",") if x]

def prep(r, sid):
    pass

def run():
    video = not FAST
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--force-device-scale-factor=1"])
        kw = dict(viewport={"width": 1920, "height": 1080}, locale="it-IT")
        if video:
            kw.update(record_video_dir=f"{OUT}/video", record_video_size={"width": 1920, "height": 1080})
        ctx = b.new_context(**kw)
        pg = ctx.new_page()
        pg.add_init_script(path=os.path.join(HERE, "overlay.js"))
        ctx.add_init_script("try{localStorage.setItem('dt-consenso','no');localStorage.setItem('dt.invito.no','1')}catch(e){}")
        pg.goto("about:blank")
        # lampo magenta per calibrare l'inizio del video
        t0 = time.monotonic()
        pg.evaluate("()=>{document.body.style.margin=0;document.body.style.background='#ff00ff';document.documentElement.style.background='#ff00ff'}")
        time.sleep(0.8)
        pg.goto(URL, wait_until="networkidle", timeout=120000)
        pg.wait_for_function("()=>window.dt&&window.dt.pronto", timeout=120000)
        pg.wait_for_timeout(2500)
        for nome in ("Rifiuta", "Non mostrare più"):
            try:
                pg.get_by_role("button", name=nome).first.click(timeout=2500)
            except Exception:
                pass
        r = Rec(pg, DUR, ORDINE, t0)
        r.cur = (960.0, 700.0)
        pg.evaluate("()=>window.__v.cursor(960,700)")
        pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:12})}")
        pg.wait_for_timeout(1500)
        scene_ids = [s for s in ORDINE if s not in ("1-titolo", "5-saluti")]
        for sid in scene_ids:
            if SOLO and sid not in SOLO:
                continue
            fn = SCENE.get(sid)
            r.begin(sid, EXTRA[sid])
            if SOLO:
                prep(r, sid)
            try:
                if fn:
                    fn(r)
                else:
                    r.warn.append(f"{sid}: scena non ancora scritta")
            except Exception as e:  # una scena fallita non ferma la sessione
                r.warn.append(f"{sid}: ECCEZIONE {type(e).__name__}: {str(e)[:200]}")
            r.finish()
            if FAST and os.environ.get("SHOTS"):
                pg.screenshot(path=f"{OUT}/shots/{sid}.png")
        r.save(f"{OUT}/log.json")
        print("avvisi:", *r.warn, sep="\n  ")
        ctx.close()
        if video:
            os.replace(pg.video.path(), f"{OUT}/main.webm")
        b.close()


if __name__ == "__main__":
    run()
