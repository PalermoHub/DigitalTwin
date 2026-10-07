import sys; sys.path.insert(0,'verifica')
from dom import start
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b,pg=start(p)
    pg.click("#btn-gruppo-layer"); pg.wait_for_timeout(700)
    print("attrs rail layer:", pg.evaluate("()=>{const e=document.getElementById('btn-gruppo-layer');return [...e.attributes].map(a=>a.name+'='+a.value).join(' ')}"))
    pg.click("#btn-gruppo-miei"); pg.wait_for_timeout(500)
    print("attrs rail layer dopo miei:", pg.evaluate("()=>{const e=document.getElementById('btn-gruppo-layer');return [...e.attributes].map(a=>a.name+'='+a.value).join(' ')}"))
    pg.click("#btn-gruppo-layer"); pg.wait_for_timeout(500)
    html=pg.evaluate("()=>{const e=[...document.querySelectorAll('#pannello *')].find(e=>/ordine layer in mappa/i.test(e.textContent)&&![...e.children].some(c=>/ordine layer in mappa/i.test(c.textContent)));return e?e.outerHTML.slice(0,300)+'\\n--parent:'+e.parentElement.outerHTML.slice(0,500):'NONE'}")
    print(html)
    print("visibile?", pg.evaluate("()=>{const e=[...document.querySelectorAll('#pannello *')].find(e=>/ordine layer in mappa/i.test(e.textContent)&&![...e.children].some(c=>/ordine layer in mappa/i.test(c.textContent)));return e&&[e.offsetParent!==null,e.innerText]}"))
    pg.evaluate("()=>{window.dt.map.jumpTo({center:[13.3615,38.1157],zoom:15})}")
    pg.locator("#pannello").get_by_text("Ordine layer in mappa").first.click(); pg.wait_for_timeout(800)
    print(pg.evaluate("()=>[...document.querySelectorAll('#pannello button')].filter(b=>b.offsetParent!==null&&/su|giù|up|down|sposta/i.test((b.title||'')+(b.getAttribute('aria-label')||''))).slice(0,8).map(b=>b.className+'|'+b.title+'|'+b.getAttribute('aria-label')).join('\\n')"))
    pg.screenshot(path="verifica/p7-ordine.png")
    b.close()
