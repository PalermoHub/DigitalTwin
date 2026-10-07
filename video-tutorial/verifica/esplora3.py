import sys, json; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
def px(pg,lng,lat):
    return pg.evaluate("([a,b])=>{const m=window.dt.map;const p=m.project([a,b]);const r=m.getContainer().getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top}}",[lng,lat])
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3586,38.1203],zoom:17})}"); pg.wait_for_timeout(2500)
    pg.click("#btn-gruppo-layer"); pg.wait_for_timeout(500)
    pg.locator("#pannello").get_by_text("Territorio",exact=True).first.click(); pg.wait_for_timeout(400)
    for sid in ("catasto",):
        pg.locator(f"label.strato:has(input#strato-{sid})").click(); pg.wait_for_timeout(1500)
    pg.screenshot(path=f"{OUT}/p3-1-catasto.png")
    c=px(pg,13.3586,38.1203); print("click px",c)
    pg.mouse.move(c["x"],c["y"],steps=10); pg.mouse.click(c["x"],c["y"]); pg.wait_for_timeout(3500)
    pg.screenshot(path=f"{OUT}/p3-2-scheda.png")
    print("TABS:", pg.evaluate("()=>[...document.querySelectorAll('#scheda [role=tab], #scheda .scheda-tab, #scheda nav button, #scheda button')].slice(0,25).map(e=>(e.className||'')+'|'+(e.innerText||e.title||'').slice(0,40)).join('\\n')"))
    print("SCHEDA text:", pg.evaluate("()=>document.getElementById('scheda').innerText.slice(0,700)"))
    print("STATO scheda hidden:", pg.evaluate("()=>document.getElementById('scheda').hidden"))
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:15})}"); pg.wait_for_timeout(1500)
    print("tavolozza:", pg.evaluate("()=>[...document.querySelectorAll('#pannello button')].filter(b=>/color|colore|tavolozza|palette/i.test((b.title||'')+(b.getAttribute('aria-label')||'')+(b.className||''))).slice(0,6).map(b=>b.className+'|'+b.title+'|'+(b.getAttribute('aria-label')||'')).join('\\n')"))
    b.close()
