import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.click("#btn-rndt"); pg.wait_for_timeout(1500)
    for q in ("PAI pericolosità geomorfologica","idrografia","zone protette","rischio idraulico"):
        inp=pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first
        inp.fill(q); pg.locator('#rndt-pannello button', has_text="Search").first.click(); pg.wait_for_timeout(8000)
        cards=pg.evaluate("""()=>[...document.querySelectorAll('#rndt-pannello .ordt-card, #rndt-pannello [class*=card], #rndt-pannello li')].filter(e=>e.offsetParent!==null).map(e=>e.innerText.replace(/\\n+/g,' | ').slice(0,170)).slice(0,10)""")
        print("\n##",q); [print("  ",c) for c in cards]
    b.close()
