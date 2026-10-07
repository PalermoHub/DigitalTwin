from playwright.sync_api import sync_playwright
URL="https://palermohub.github.io/DigitalTwin/index.html"
OUT="/home/user/DigitalTwin/video-tutorial/verifica"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={"width":1920,"height":1080})
    pg.goto(URL,wait_until="networkidle",timeout=90000); pg.wait_for_timeout(3000)
    for t in ("Rifiuta","Non mostrare più"):
        try: pg.get_by_role("button",name=t).first.click(timeout=3000)
        except: pass
    pg.click("#btn-rndt"); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{OUT}/rndt-1-aperto.png")
    print(pg.evaluate("()=>document.getElementById('rndt-pannello').innerText.slice(0,1500)"))
    b.close()
