import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:15})}")
    pg.click("#btn-gruppo-layer"); pg.wait_for_timeout(600)
    if not pg.locator("#pannello details#gruppo-edifici").evaluate("d=>d.open"): pg.locator("#pannello details#gruppo-edifici summary").click()
    pg.wait_for_timeout(500)
    pg.click('button.strato-tema-btn[title^="Colori di Edificato"]'); pg.wait_for_timeout(800)
    sel=pg.locator("#pannello select:visible")
    sel.nth(0).select_option(value="dens_pop_ha"); pg.wait_for_timeout(500)
    sel.nth(1).select_option(value="graduata"); pg.wait_for_timeout(1200)
    print(pg.evaluate("""()=>{const pan=[...document.querySelectorAll('#pannello .tema-panel, #pannello [class*=tema]')].filter(e=>e.offsetParent!==null);
      return pan.slice(0,3).map(e=>e.className+' :: '+e.innerText.replace(/\\n+/g,' | ').slice(0,260)).join('\\n')}"""))
    print("BTN:", pg.evaluate("()=>[...document.querySelectorAll('#pannello button')].filter(b=>b.offsetParent!==null&&/ripristina|rampa|scala|esporta|importa/i.test(b.innerText+b.title+b.className)).map(b=>b.className+'|'+b.innerText.trim().slice(0,30)+'|'+(b.title||'')).join('\\n')"))
    print("RAMPA:", pg.evaluate("()=>[...document.querySelectorAll('#pannello [class*=rampa]')].filter(e=>e.offsetParent!==null).slice(0,6).map(e=>e.tagName+'.'+e.className+' '+e.innerText.slice(0,40)).join('\\n')"))
    pg.screenshot(path=f"{OUT}/p21.png")
    b.close()
