import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    errs=[]
    pg.on("requestfailed", lambda r: errs.append(("FAIL",r.url[:110])))
    pg.on("response", lambda r: errs.append((r.status,r.url[:110])) if ("rndt" in r.url.lower() or "geodati" in r.url.lower() or "workers.dev" in r.url) else None)
    pg.click("#btn-rndt"); pg.wait_for_timeout(2000)
    inp=pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first
    inp.fill("frane"); 
    pg.locator('#rndt-pannello button', has_text="Search").first.click()
    pg.wait_for_timeout(12000)
    pg.screenshot(path=f"{OUT}/r8-1-risultati.png")
    print("PANEL TEXT:", pg.evaluate("()=>document.getElementById('rndt-pannello').innerText.slice(0,1500)"))
    print("NET:", errs[:12])
    b.close()
