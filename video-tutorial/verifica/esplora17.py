import sys, json; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:15})}"); pg.wait_for_timeout(1500)
    pg.click('button.rail-tab[data-pannello="geoimage"]'); pg.wait_for_timeout(2000)
    pg.locator('#geoimage-pannello input[type=file]').first.set_input_files("assets/pianta_1891_demo.png"); pg.wait_for_timeout(5000)
    s=pg.evaluate("()=>{const st=window.dt.geoimage.stato();return JSON.stringify(st,(k,v)=>typeof v==='function'?'fn':(typeof v==='string'&&v.length>80?v.slice(0,60)+'…':v)).slice(0,1500)}")
    print("STATO:", s)
    print("typeof stato:", pg.evaluate("()=>typeof window.dt.geoimage.stato"))
    b.close()
