import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.click("#btn-gruppo-layer"); pg.wait_for_timeout(1000)
    # apri il gruppo Territorio
    gr = pg.locator("#pannello").get_by_text("Territorio", exact=True).first
    gr.click(); pg.wait_for_timeout(800)
    html = pg.evaluate("()=>document.getElementById('pannello').innerHTML")
    open(f"{OUT}/pannello-territorio.html","w").write(html)
    print(len(html))
    print(pg.evaluate("""()=>[...document.querySelectorAll('#pannello label, #pannello input[type=checkbox]')].slice(0,60).map(e=>e.tagName+'|'+(e.className||'')+'|'+(e.innerText||e.getAttribute('aria-label')||e.id||'').slice(0,60)).join('\\n')"""))
    pg.screenshot(path=f"{OUT}/layer-territorio.png")
    b.close()
