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
    pg.locator('#rndt-pannello a, #rndt-pannello button', has_text="Open").first.click(); pg.wait_for_timeout(4000)
    pg.locator("#rndt-pannello label:has-text(\"Riserve Regionali\")").first.click(); pg.wait_for_timeout(800)
    pg.screenshot(path=f"{OUT}/r14-1-spuntato.png")
    print("BTN:", pg.evaluate("()=>[...document.querySelectorAll('#rndt-pannello button')].filter(b=>b.offsetParent!==null).map(b=>b.innerText.trim().slice(0,30)+(b.disabled?'[off]':'')).join(' ; ')"))
    pg.locator('#rndt-pannello button', has_text="Add features").first.click(); pg.wait_for_timeout(12000)
    pg.screenshot(path=f"{OUT}/r14-2-features.png")
    print("ERR/INFO:", pg.evaluate("()=>[...document.querySelectorAll('#rndt-pannello [class*=error], #rndt-pannello [class*=status], #rndt-pannello [class*=msg]')].map(e=>e.innerText.slice(0,120)).join(' || ')"))
    print("LAYERS:", pg.evaluate("()=>window.dt.map.getStyle().layers.map(l=>l.id).filter(i=>!/^(pai|incendi|isole|monument|uffici|catasto|prg|vincoli|omi|immobili|civici|sicurezza|trasporto|colonn|scuole|seggi|quart|upl|circ|amap|sezioni|edific|coropl|rilievo|elevaz|fontan|alberi|geo_|dissesti|idraul|coste)/.test(i)).slice(-14).join(' ')"))
    b.close()
