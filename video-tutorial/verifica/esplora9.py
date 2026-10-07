import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.click("#btn-rndt"); pg.wait_for_timeout(1500)
    pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first.fill("frane")
    pg.locator('#rndt-pannello button', has_text="Search").first.click(); pg.wait_for_timeout(9000)
    pg.get_by_text("Catalogo frane - Frane poligonali").first.click(); pg.wait_for_timeout(3000)
    pg.screenshot(path=f"{OUT}/r9-1-dettaglio.png")
    print("DETTAGLIO:", pg.evaluate("()=>document.getElementById('rndt-pannello').innerText.slice(0,1200)"))
    print("BUTTONS:", pg.evaluate("()=>[...document.querySelectorAll('#rndt-pannello button')].filter(b=>b.offsetParent!==null).map(b=>(b.className||'').slice(0,30)+'|'+b.innerText.trim().slice(0,30)+'|'+(b.title||'')).join('\\n')"))
    b.close()
