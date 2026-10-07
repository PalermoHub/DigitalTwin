import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:15})}"); pg.wait_for_timeout(1500)
    pg.click('button.rail-tab[data-pannello="geoimage"]'); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{OUT}/g16-1-aperto.png")
    print("BUTTONS:", pg.evaluate("()=>[...document.querySelectorAll('#geoimage-pannello button')].filter(b=>b.offsetParent!==null).map(b=>(b.id||'')+'|'+b.innerText.trim().slice(0,24)+'|'+(b.title||'')).join('\\n')"))
    print("INPUTS:", pg.evaluate("()=>[...document.querySelectorAll('#geoimage-pannello input, #geoimage-pannello select')].map(i=>i.type+'|'+(i.id||'')+'|'+(i.accept||'')+'|'+(i.getAttribute('aria-label')||'')).join('\\n')"))
    inp=pg.locator('#geoimage-pannello input[type=file]').first
    inp.set_input_files("assets/pianta_1891_demo.png"); pg.wait_for_timeout(5000)
    pg.screenshot(path=f"{OUT}/g16-2-caricata.png")
    print("DOPO:", pg.evaluate("()=>[...document.querySelectorAll('#geoimage-pannello button')].filter(b=>b.offsetParent!==null).map(b=>(b.id||'')+'|'+b.innerText.trim().slice(0,24)+'|'+(b.title||'')).join('\\n')"))
    print("STATE:", pg.evaluate("()=>{const g=window.dt.geoimage;return g?Object.keys(g).join(','):'nessun window.dt.geoimage'}"))
    b.close()
