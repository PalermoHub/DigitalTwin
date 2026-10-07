import sys, json; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3590,38.1160],zoom:16})}"); pg.wait_for_timeout(2000)
    pg.click('button.rail-tab[data-pannello="geoimage"]'); pg.wait_for_timeout(2000)
    pg.locator('#geoimage-pannello input[type=file]').first.set_input_files("assets/pianta_1891_demo.png"); pg.wait_for_timeout(5000)
    print(pg.evaluate("""()=>[...document.querySelectorAll('.maplibregl-marker, [class*=manig], [class*=handle], [class*=gi-]')].filter(e=>e.offsetParent!==null||e.getBoundingClientRect().width>0).slice(0,16).map(e=>{const r=e.getBoundingClientRect();return e.tagName+'.'+(e.className.baseVal??e.className).toString().slice(0,60)+' '+Math.round(r.left)+','+Math.round(r.top)+' '+Math.round(r.width)+'x'+Math.round(r.height)}).join('\\n')"""))
    print("angoli:", pg.evaluate("()=>JSON.stringify(window.dt.geoimage.stato.angoli)"))
    print("immagine:", pg.evaluate("()=>{const i=window.dt.geoimage.stato.immagine;return i?[i.width,i.height,i.naturalWidth]:null}"))
    print("schermo:", pg.evaluate("()=>{const s=window.dt.geoimage.stato.schermo;return s?[s.larghezza,s.altezza]:null}"))
    pg.screenshot(path=f"{OUT}/g18-1.png")
    b.close()
