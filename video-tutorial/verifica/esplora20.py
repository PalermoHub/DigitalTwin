import sys, json, time; sys.path.insert(0,'verifica'); sys.path.insert(0,'.')
from dom import start, OUT
from playwright.sync_api import sync_playwright
META=json.load(open("assets/pianta_1891_demo.json"))
IMG2="""([u,v,W,H])=>{const g=window.dt.geoimage.stato.angoli;const s=u/W,t=v/H;
  const lat=(1-s)*(1-t)*g[0].lat+s*(1-t)*g[1].lat+(1-s)*t*g[2].lat+s*t*g[3].lat;
  const lng=(1-s)*(1-t)*g[0].lng+s*(1-t)*g[1].lng+(1-s)*t*g[2].lng+s*t*g[3].lng;
  const m=window.dt.map;const p=m.project([lng,lat]);const r=m.getContainer().getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top}}"""
PX="""([a,b])=>{const m=window.dt.map;const p=m.project([a,b]);const r=m.getContainer().getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top}}"""
with sync_playwright() as p:
    b,pg=start(p)
    pg.evaluate("""()=>new Promise(res=>{const m=window.dt.map;m.once('idle',()=>res(1));m.jumpTo({center:[13.3596,38.1138],zoom:15.7});setTimeout(()=>res(0),6000)})""")
    pg.click('button.rail-tab[data-pannello="geoimage"]'); pg.wait_for_timeout(1500)
    pg.locator('#geoimage-pannello input[type=file]').first.set_input_files("assets/pianta_1891_demo.png"); pg.wait_for_timeout(4000)
    print("vista:", pg.evaluate("()=>{const m=window.dt.map;return [m.getCenter().lng,m.getCenter().lat,m.getZoom()]}"))
    pg.click("#gi-gcp-modo"); pg.wait_for_timeout(500)
    W=META["size"][0]
    for nome,v in META["punti"].items():
        a=pg.evaluate(IMG2,[v["px"][0],v["px"][1],W,W]); bpx=pg.evaluate(PX,[v["lng"],v["lat"]])
        print(nome,"img->",round(a["x"]),round(a["y"]),"base->",round(bpx["x"]),round(bpx["y"]))
        pg.mouse.move(a["x"],a["y"]); pg.mouse.click(a["x"],a["y"]); pg.wait_for_timeout(800)
        st1=pg.evaluate("()=>document.querySelector('.gi-stato').innerText")
        pg.mouse.move(bpx["x"],bpx["y"]); pg.mouse.click(bpx["x"],bpx["y"]); pg.wait_for_timeout(1000)
        st2=pg.evaluate("()=>document.querySelector('.gi-stato').innerText")
        print("   passo1:",st1[:60],"| passo2:",st2[:60])
    print("righe tabella GCP:", pg.evaluate("()=>document.querySelectorAll('#geoimage-pannello tbody tr').length"))
    pg.screenshot(path=f"{OUT}/g20.png")
    b.close()
