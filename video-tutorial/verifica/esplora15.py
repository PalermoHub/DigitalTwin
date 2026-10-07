import sys; sys.path.insert(0,'verifica')
from dom import start, OUT
from playwright.sync_api import sync_playwright
def apri(pg, q, titolo):
    pg.click("#btn-rndt"); pg.wait_for_timeout(1500)
    inp=pg.locator('#rndt-pannello input[type=search], #rndt-pannello input[type=text]').first
    inp.fill(q); pg.locator('#rndt-pannello button', has_text="Search").first.click(); pg.wait_for_timeout(8000)
    pg.get_by_text(titolo).first.click(); pg.wait_for_timeout(3000)


with sync_playwright() as p:
    b,pg=start(p)
    apri(pg,"zone protette","Parchi e Riserve - Servizio di Consultazione (WMS)")
    pg.locator('#rndt-pannello a, #rndt-pannello button', has_text="Open").first.click(); pg.wait_for_timeout(4000)
    pg.locator("#rndt-pannello label:has-text(\"Riserve Regionali\")").first.click(); pg.wait_for_timeout(600)
    pg.locator('#rndt-pannello button', has_text="Add features").first.click(); pg.wait_for_timeout(9000)
    lid=pg.evaluate("()=>window.dt.map.getStyle().layers.map(l=>l.id).find(i=>/^rndt-.*-fill$/.test(i))"); print("LAYER", lid)
    c=pg.evaluate("""(id)=>{const m=window.dt.map;const fs=m.queryRenderedFeatures({layers:[id]});const f=fs.find(x=>x.properties&&JSON.stringify(x.properties).length>10)||fs[0];
      const pts=[];const w=c=>typeof c[0]==='number'?pts.push(c):c.forEach(w);w(f.geometry.coordinates);
      const q=pts.map(p=>m.project(p)).filter(q=>q.x>200&&q.x<1400&&q.y>150&&q.y<900);const a=q.reduce((s,z)=>({x:s.x+z.x,y:s.y+z.y}),{x:0,y:0});
      return {x:a.x/q.length,y:a.y/q.length,props:f.properties}}""", lid)
    print("PROPS", str(c["props"])[:400])
    pg.mouse.click(c["x"],c["y"]); pg.wait_for_timeout(4000)
    pg.screenshot(path=f"{OUT}/r15-1-scheda.png")
    print("SCHEDA:", pg.evaluate("()=>document.getElementById('scheda').innerText.slice(0,900)"))
    print("TABS:", pg.evaluate("()=>[...document.querySelectorAll('#scheda button')].filter(b=>b.offsetParent!==null).map(b=>b.innerText.trim().slice(0,30)).join(' ; ')"))
    pg.click("#btn-gruppo-rndt"); pg.wait_for_timeout(1000)
    pg.screenshot(path=f"{OUT}/r15-2-gruppo.png")
    b.close()
