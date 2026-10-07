import sys; sys.path.insert(0,'verifica')
from dom import start
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    for sid in ("uffici","idraulica_pericolosita","incendi","isole-calore","monumenti"):
        pg.evaluate("(i)=>document.getElementById('strato-'+i).click()", sid)
    pg.wait_for_timeout(3000)
    print(pg.evaluate("()=>window.dt.map.getStyle().layers.map(l=>l.id).filter(i=>/uffici|pai|idraul|incendi|isole|calore|monument/i.test(i)).join('\\n')"))
    # opzioni rampa
    pg.evaluate("()=>{document.querySelector('button.strato-tema-btn[title^=\"Colori di Edificato\"]')}")
    b.close()
