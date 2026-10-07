import sys; sys.path.insert(0,'verifica')
from dom import start
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>document.getElementById('strato-idraulica_pericolosita').click()")
    pg.wait_for_timeout(2500)
    best=None
    for c in [(13.40,38.08),(13.37,38.10),(13.34,38.10),(13.33,38.15),(13.30,38.13),(13.42,38.06),(13.36,38.12),(13.38,38.14),(13.35,38.07),(13.31,38.05)]:
        pg.evaluate("([a,b])=>{window.dt.map.jumpTo({center:[a,b],zoom:14})}",list(c)); pg.wait_for_timeout(3500)
        n=pg.evaluate("()=>window.dt.map.queryRenderedFeatures({layers:['pai-idraulica_pericolosita-hit']}).length")
        print(c,n)
        if n and not best: best=c
    print("BEST",best)
    b.close()
