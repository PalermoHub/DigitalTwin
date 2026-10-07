import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.click("#btn-rndt"); pg.wait_for_timeout(1500)
    inp=pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first
    inp.fill("zone protette"); pg.locator('#rndt-pannello button', has_text="Search").first.click(); pg.wait_for_timeout(8000)
    pg.get_by_text("Parchi e Riserve - Servizio di scaricamento (WFS)").first.click(); pg.wait_for_timeout(3000)
    pg.locator('#rndt-pannello a, #rndt-pannello button', has_text="Open").first.click(); pg.wait_for_timeout(5000)
    pg.get_by_text("aree_protette_parchi_riserve_areemarine:Riserve_Regionali").first.click(); pg.wait_for_timeout(800)
    pg.screenshot(path=f"{OUT}/r12-1-scelto.png")
    pg.locator('#rndt-pannello button', has_text="Add features").first.click(); pg.wait_for_timeout(12000)
    pg.screenshot(path=f"{OUT}/r12-2-aggiunto.png")
    print("PANEL:", pg.evaluate("()=>document.getElementById('rndt-pannello').innerText.slice(0,600)"))
    print("LAYERS:", pg.evaluate("()=>window.dt.map.getStyle().layers.map(l=>l.id).filter(i=>/rndt|ordt|wfs|riserv/i.test(i)).join(' ')"))
    print("STRATI:", pg.evaluate("()=>[...document.querySelectorAll('input[id^=strato-]')].map(e=>e.id).filter(i=>/rndt|riser|wfs|ordt/i.test(i)).join(' ')"))
    b.close()
