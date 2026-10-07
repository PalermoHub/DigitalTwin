import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
def apri(pg, q, titolo):
    pg.click("#btn-rndt"); pg.wait_for_timeout(1500)
    inp=pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first
    inp.fill(q); pg.locator('#rndt-pannello button', has_text="Search").first.click(); pg.wait_for_timeout(8000)
    pg.get_by_text(titolo).first.click(); pg.wait_for_timeout(3000)
with sync_playwright() as p:
    b,pg=start(p)
    apri(pg,"zone protette","Parchi e Riserve - Servizio di Consultazione (WMS)")
    print("BTN:", pg.evaluate("()=>[...document.querySelectorAll('#rndt-pannello button, #rndt-pannello a')].filter(b=>b.offsetParent!==null).map(b=>b.innerText.trim().slice(0,22)).join(' ; ')"))
    # riga WMS: Open
    pg.locator('#rndt-pannello a, #rndt-pannello button', has_text="Open").first.click(); pg.wait_for_timeout(5000)
    pg.screenshot(path=f"{OUT}/r13-1-wms-open.png")
    print("TEXT:", pg.evaluate("()=>{const t=document.getElementById('rndt-pannello').innerText;return t.slice(t.indexOf('WMS'),t.indexOf('WMS')+900)}"))
    b.close()
