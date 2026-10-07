from playwright.sync_api import sync_playwright
URL="https://palermohub.github.io/DigitalTwin/index.html"
OUT="/home/user/DigitalTwin/video-tutorial/verifica"
def start(p, vp=(1920,1080), mobile=False):
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={"width":vp[0],"height":vp[1]}, has_touch=mobile, is_mobile=mobile)
    pg=ctx.new_page(); pg.goto(URL,wait_until="networkidle",timeout=90000); pg.wait_for_timeout(3000)
    for t in ("Rifiuta","Non mostrare più"):
        try: pg.get_by_role("button",name=t).first.click(timeout=3000)
        except: pass
    return b,pg
if __name__=="__main__":
    with sync_playwright() as p:
        b,pg=start(p)
        print(pg.evaluate("""()=>[...document.querySelectorAll('button[id], [id^=btn-]')].map(e=>e.id+' | '+(e.title||e.getAttribute('aria-label')||e.innerText||'').slice(0,50)).join('\\n')"""))
        print('--- rail'); print(pg.evaluate("()=>document.getElementById('rail-pannelli').innerHTML.slice(0,1500)"))
        pg.click("#btn-gruppo-layer") if pg.query_selector("#btn-gruppo-layer") else None
        pg.wait_for_timeout(1200); pg.screenshot(path=f"{OUT}/layer-1.png")
        print('--- gruppi'); print(pg.evaluate("()=>document.getElementById('pannello').innerText.slice(0,1500)"))
        b.close()
