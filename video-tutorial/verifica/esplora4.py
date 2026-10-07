import sys, json; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:15})}")
    pg.click("#btn-gruppo-layer"); pg.wait_for_timeout(600)
    pg.locator("#pannello").get_by_text("Edifici",exact=True).first.click(); pg.wait_for_timeout(500)
    pg.click('button.strato-tema-btn[title^="Colori di Edificato"]'); pg.wait_for_timeout(800)
    print("SELECT:", pg.evaluate("""()=>[...document.querySelectorAll('#pannello select')].filter(s=>s.offsetParent!==null).map(s=>({id:s.id,cls:s.className,lab:s.getAttribute('aria-label'),opts:[...s.options].map(o=>o.value+'='+o.text).slice(0,14)}))"""))
    # ids strati per gruppi
    print("IDS:", pg.evaluate("()=>[...document.querySelectorAll('input[id^=strato-]')].map(e=>e.id.slice(7)).join(' ')"))
    # stampa
    pg.click("#btn-stampa"); pg.wait_for_timeout(500)
    print("STAMPA:", pg.evaluate("()=>[...document.querySelectorAll('#stampa-menu select')].map(s=>s.id+':'+[...s.options].map(o=>o.text).join('|'))"))
    pg.screenshot(path=f"{OUT}/p4-stampa.png"); pg.keyboard.press("Escape")
    # filtri
    pg.click("#btn-gruppo-filtri"); pg.wait_for_timeout(700)
    print("FILTRI vis:", pg.evaluate("()=>[...document.querySelectorAll('#pannello select, #pannello input, #pannello button')].filter(e=>e.offsetParent!==null&&/f-|cerca|filtri|particella/i.test(e.id||'')).map(e=>e.id).join(' ')"))
    print("f-circ opts:", pg.evaluate("()=>[...document.getElementById('f-circ').options].map(o=>o.text).join('|')"))
    pg.screenshot(path=f"{OUT}/p4-filtri.png")
    b.close()
