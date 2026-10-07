import sys, time, json; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
def prova(pg, nome):
    t=time.monotonic()
    for i in range(20): pg.mouse.move(700+i*8, 500+i*3)
    print(nome, "ms/mossa:", round((time.monotonic()-t)/20*1000))
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3596,38.1138],zoom:15.7}) }"); pg.wait_for_timeout(2000)
    prova(pg,"mappa semplice (2 strati)")
    pg.click('button.rail-tab[data-pannello="geoimage"]'); pg.wait_for_timeout(1500)
    pg.locator('#geoimage-pannello input[type=file]').first.set_input_files("assets/pianta_1891_demo.png"); pg.wait_for_timeout(4000)
    prova(pg,"con immagine Geoimage")
    c=pg.locator(".gi-centro").bounding_box(); x,y=c["x"]+14,c["y"]+14
    pg.mouse.move(x,y); pg.mouse.down()
    t=time.monotonic()
    for i in range(20): pg.mouse.move(x-i*4, y+i*2)
    print("trascinamento maniglia ms/mossa:", round((time.monotonic()-t)/20*1000)); pg.mouse.up()
    pg.evaluate("()=>{for(const i of ['edificato','circoscrizioni']){const e=document.getElementById('strato-'+i);if(e&&e.checked)e.click()}}"); pg.wait_for_timeout(1500)
    c=pg.locator(".gi-centro").bounding_box(); x,y=c["x"]+14,c["y"]+14
    pg.mouse.move(x,y); pg.mouse.down()
    t=time.monotonic()
    for i in range(20): pg.mouse.move(x-i*4, y+i*2)
    print("trascinamento senza strati ms/mossa:", round((time.monotonic()-t)/20*1000)); pg.mouse.up()
    # classi dello swipe
    pg.click("#gi-swipe"); pg.wait_for_timeout(1200)
    print(pg.evaluate("()=>[...document.querySelectorAll('body *')].filter(e=>/swipe|divisor|confronto|clip/i.test((e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)||'')&&e.id!=='gi-swipe').slice(0,8).map(e=>e.tagName+'.'+(e.className.baseVal??e.className)+' '+JSON.stringify(e.getBoundingClientRect()).slice(0,80)).join('\\n')"))
    b.close()
