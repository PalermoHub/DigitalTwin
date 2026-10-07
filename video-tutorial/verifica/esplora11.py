import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.click("#btn-rndt"); pg.wait_for_timeout(1500)
    inp=pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first
    inp.fill("zone protette"); pg.locator('#rndt-pannello button', has_text="Search").first.click(); pg.wait_for_timeout(8000)
    pg.get_by_text("Parchi e Riserve - Servizio di scaricamento (WFS)").first.click(); pg.wait_for_timeout(3500)
    pg.screenshot(path=f"{OUT}/r11-1-dettaglio.png")
    print("DETT:", pg.evaluate("()=>document.getElementById('rndt-pannello').innerText.slice(300,1500)"))
    print("BTN:", pg.evaluate("()=>[...document.querySelectorAll('#rndt-pannello button, #rndt-pannello a')].filter(b=>b.offsetParent!==null).map(b=>b.innerText.trim().slice(0,28)+'|'+(b.title||'')).join(' ; ')"))
    # clic su Open della riga WFS
    pg.locator('#rndt-pannello a, #rndt-pannello button', has_text="Open").first.click(); pg.wait_for_timeout(6000)
    pg.screenshot(path=f"{OUT}/r11-2-open.png")
    print("DOPO OPEN:", pg.evaluate("()=>document.getElementById('rndt-pannello').innerText.slice(0,1800)"))
    b.close()
