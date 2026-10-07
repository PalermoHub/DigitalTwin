import json, sys
from playwright.sync_api import sync_playwright
URL = "https://palermohub.github.io/DigitalTwin/index.html"
OUT = "/home/user/DigitalTwin/video-tutorial/verifica"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width":1920,"height":1080})
    pg.on("console", lambda m: None)
    pg.goto(URL, wait_until="networkidle", timeout=90000)
    pg.wait_for_timeout(4000)
    pg.screenshot(path=f"{OUT}/00-home.png")
    for t in ("Rifiuta","Non mostrare più"):
        try: pg.get_by_role("button", name=t).first.click(timeout=3000)
        except Exception as e: print("manca", t)
    pg.wait_for_timeout(800)
    res = {}
    for key in ["guida","plugin","geoimage","fonti"]:
        pg.click(f'#menu-info button[data-scheda="{key}"]'); pg.wait_for_timeout(1500)
        txt = pg.evaluate("() => { const d=document.getElementById('crediti'); return d? d.innerText : '' }")
        res[key] = txt
        pg.screenshot(path=f"{OUT}/sez-{key}.png")
        open(f"{OUT}/live-{key}.txt","w").write(txt)
        print(key, len(txt), "caratteri")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(500)
    b.close()
