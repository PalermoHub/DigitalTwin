"""Libreria di registrazione: cursore umano, clic, evidenziazioni, sincronia con la voce."""
import json, os, time, math, re
from playwright.sync_api import TimeoutError as PWTimeout

URL = "https://palermohub.github.io/DigitalTwin/index.html"
FAST = float(os.environ.get("FAST", "0"))       # >0: modalità collaudo, tutto più veloce (es. 0.2)
K = FAST if FAST else 1.0
HERE = os.path.dirname(os.path.abspath(__file__))
LEAD = 0.30                                      # la voce parte 0,3 s dopo l'inizio della scena


def ease(u):
    return u * u * (3 - 2 * u)


class Rec:
    def __init__(self, pg, durate, scene_ids, t0):
        self.pg, self.dur, self.ids, self.t0 = pg, durate, scene_ids, t0
        self.log, self.zooms, self.warn, self.clicks = [], [], [], []
        self.cur = (960.0, 540.0)
        self.s_start = 0.0
        self.s_voice = 0.0
        self.sid = None

    # ───── tempo ─────
    def now(self):
        return time.monotonic() - self.t0

    def begin(self, sid, extra):
        self.sid = sid
        self.s_start = self.now()
        self.s_voice = self.s_start + LEAD * K
        self.audio = self.dur.get(sid, 5.0) * K
        self.s_end = self.s_voice + self.audio + extra * K
        self.log.append(dict(id=sid, start=self.s_start, voice_start=self.s_voice, voice_dur=self.audio / K))

    def sync(self, frac):
        """Aspetta il punto `frac` (0..1) della voce della scena corrente."""
        target = self.s_voice + frac * self.audio
        d = target - self.now()
        if d > 0:
            time.sleep(d)

    def finish(self):
        d = self.s_end - self.now()
        if d > 0:
            time.sleep(d)
        elif d < -0.05:
            self.warn.append(f"{self.sid}: azioni oltre la voce di {-d:.1f}s")
        self.log[-1]["end"] = self.now()

    def pause(self, s):
        time.sleep(s * K)

    # ───── cursore e clic ─────
    def move(self, x, y, dur=0.7):
        """Cursore finto fluido (animato nella pagina) + un solo movimento reale del mouse alla fine:
        ogni mossa reale costa 150-180 ms con la mappa accesa, quindi non si può spezzare in tanti passi."""
        dur *= K
        x0, y0 = self.cur
        self.pg.evaluate("([a,b,c,d,ms])=>window.__v.glide(a,b,c,d,ms)", [x0, y0, x, y, int(dur * 1000)])
        time.sleep(dur)
        self.pg.mouse.move(x, y)
        self.cur = (x, y)

    def box(self, target, timeout=8000):
        loc = self.pg.locator(target) if isinstance(target, str) else target
        loc = loc.first
        loc.wait_for(state="visible", timeout=timeout)
        loc.scroll_into_view_if_needed(timeout=timeout)
        b = loc.bounding_box()
        return loc, b

    def click(self, target, dx=0.5, dy=0.5, move=0.7, timeout=8000, after=0.35):
        try:
            loc, b = self.box(target, timeout)
            x, y = b["x"] + b["width"] * dx, b["y"] + b["height"] * dy
        except PWTimeout:
            self.warn.append(f"{self.sid}: non trovato {target}")
            return False
        self.click_xy(x, y, move, after)
        return True

    def click_xy(self, x, y, move=0.7, after=0.35):
        self.move(x, y, move)
        self.pg.evaluate("([x,y])=>window.__v&&window.__v.ripple(x,y)", [x, y])
        self.clicks.append(round(self.now(), 3))
        self.pg.mouse.down(); time.sleep(0.07); self.pg.mouse.up()
        time.sleep(after * K)

    def hover(self, target, move=0.6, hold=0.5):
        try:
            loc, b = self.box(target, 5000)
        except PWTimeout:
            self.warn.append(f"{self.sid}: hover non trovato {target}"); return
        self.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, move)
        time.sleep(hold * K)

    def type(self, target, testo, per=0.09):
        if not self.click(target):
            return
        for ch in testo:
            self.pg.keyboard.type(ch)
            time.sleep(per * K)

    def drag(self, x0, y0, x1, y1, dur=1.0, hold=0.2):
        """Trascinamento visibile: premi in (x0,y0), muovi a passi fino a (x1,y1), rilascia."""
        self.move(x0, y0, 0.6)
        self.pg.mouse.down()
        time.sleep(0.08 * K)
        n = max(6, int(dur * 10 * K) + 4)
        t_ini = time.monotonic()
        self.pg.evaluate("([a,b,c,d,ms])=>window.__v.glide(a,b,c,d,ms)", [x0, y0, x1, y1, int(max(dur * K, n * 0.09) * 1000)])
        for i in range(1, n + 1):
            u = ease(i / n)
            self.pg.mouse.move(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)
        resto = max(dur * K, n * 0.09) - (time.monotonic() - t_ini)
        if resto > 0:
            time.sleep(resto)
        self.cur = (x1, y1)
        time.sleep(hold * K)
        self.pg.mouse.up()
        time.sleep(0.3 * K)

    def key(self, k):
        self.pg.keyboard.press(k)

    # ───── mappa ─────
    def px(self, lng, lat):
        return self.pg.evaluate("([a,b])=>{const m=window.dt.map;const p=m.project([a,b]);const r=m.getContainer().getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top}}", [lng, lat])

    def jump(self, lng, lat, zoom, pitch=None, bearing=None):
        self.pg.evaluate("""([a,b,z,p,br])=>new Promise(res=>{const m=window.dt.map;const o={center:[a,b],zoom:z};if(p!=null)o.pitch=p;if(br!=null)o.bearing=br;
            m.jumpTo(o);m.once('idle',()=>res(1));setTimeout(()=>res(0),4000)})""", [lng, lat, zoom, pitch, bearing])
        self.pg.wait_for_timeout(int(600 * K))

    def fly(self, lng, lat, zoom, ms=2200, pitch=None, bearing=None):
        self.pg.evaluate("""([a,b,z,ms,p,br])=>new Promise(res=>{const m=window.dt.map;const o={center:[a,b],zoom:z,duration:ms,essential:true};
            if(p!=null)o.pitch=p;if(br!=null)o.bearing=br;m.once('moveend',()=>m.once('idle',()=>res(1)));m.flyTo(o);setTimeout(()=>res(0),ms+5000)})""",
                         [lng, lat, zoom, int(ms * K), pitch, bearing])
        self.pg.wait_for_timeout(int(500 * K))

    def map_click(self, lng, lat, move=0.9, after=2.0):
        p = self.px(lng, lat)
        self.click_xy(p["x"], p["y"], move, after)

    def feature_px(self, layer_id, filtro=None, near=None, attesa=9.0):
        """Pixel (x,y) di un punto che cade davvero dentro un elemento visibile del layer (il più vicino a `near`=(lng,lat)).
        Riprova finché i tile non sono caricati."""
        js = """([id,f,near])=>{const m=window.dt.map;const o={layers:[id]};if(f)o.filter=f;
          const fs=m.queryRenderedFeatures(o);if(!fs.length)return null;
          const r=m.getContainer().getBoundingClientRect();
          const tg=near?m.project(near):{x:r.width/2,y:r.height/2};
          const ok=q=>q.x>420&&q.x<1450&&q.y>150&&q.y<950;
          const hit=(x,y)=>m.queryRenderedFeatures([[x-3,y-3],[x+3,y+3]],{layers:[id]}).length>0;
          const cand=[];
          for(const ft of fs.slice(0,500)){
            const pts=[];const w=c=>typeof c[0]==='number'?pts.push(c):c.forEach(w);w(ft.geometry.coordinates);
            const pr=pts.map(p=>m.project(p));const vis=pr.filter(ok);if(!vis.length)continue;
            const a=vis.reduce((s,q)=>({x:s.x+q.x,y:s.y+q.y}),{x:0,y:0});const c={x:a.x/vis.length,y:a.y/vis.length};
            cand.push({d:Math.hypot(c.x-tg.x,c.y-tg.y),c,vis});}
          cand.sort((a,b)=>a.d-b.d);
          for(const k of cand.slice(0,40)){
            if(ok(k.c)&&hit(k.c.x,k.c.y))return {x:k.c.x+r.left,y:k.c.y+r.top};
            const xs=k.vis.map(q=>q.x),ys=k.vis.map(q=>q.y);
            const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
            for(let i=1;i<9;i++)for(let j=1;j<9;j++){const x=x0+(x1-x0)*i/9,y=y0+(y1-y0)*j/9;
              if(ok({x,y})&&hit(x,y))return {x:x+r.left,y:y+r.top};}
          }
          return null}"""
        fine = time.monotonic() + attesa
        while True:
            p = self.pg.evaluate(js, [layer_id, filtro, list(near) if near else None])
            if p or time.monotonic() > fine:
                return p
            time.sleep(0.7)

    def scegli(self, locator, valore=None, index=None, label=None):
        """Clic visibile su un menu a tendina e scelta del valore."""
        loc = locator.first
        loc.wait_for(state="visible", timeout=6000)
        loc.scroll_into_view_if_needed()
        b = loc.bounding_box()
        self.click_xy(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, 0.6, 0.3)
        loc.select_option(value=valore) if valore is not None else (loc.select_option(index=index) if index is not None else loc.select_option(label=label))
        self.pg.keyboard.press("Escape") if False else None
        time.sleep(0.5 * K)

    def layer(self, sid, on=True, visible=True):
        """Accende/spegne uno strato; visible=True muove il cursore sulla casella, altrimenti lo fa in silenzio."""
        stato = self.pg.evaluate("(i)=>{const e=document.getElementById('strato-'+i);return e?e.checked:null}", sid)
        if stato is None:
            self.warn.append(f"{self.sid}: strato {sid} inesistente"); return False
        if stato == on:
            return True
        if visible:
            ok = self.click(f"label.strato:has(input#strato-{sid})", dx=0.15)
            if ok:
                return True
        self.pg.evaluate("(i)=>document.getElementById('strato-'+i).click()", sid)
        return True

    def layers_off(self, keep=()):
        self.pg.evaluate("(k)=>{document.querySelectorAll('input[id^=strato-]:checked').forEach(e=>{if(!k.includes(e.id.slice(7)))e.click()})}", list(keep))
        self.pg.wait_for_timeout(int(400 * K))

    def group(self, nome):
        """Apre (se chiuso) il gruppo del tab Layer: <details id="gruppo-<nome>">; non lo richiude se è già aperto."""
        slug = re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-")
        det = self.pg.locator(f"#pannello details#gruppo-{slug}")
        try:
            det.wait_for(state="attached", timeout=5000)
        except PWTimeout:
            self.warn.append(f"{self.sid}: gruppo {nome} non trovato"); return
        det.scroll_into_view_if_needed()
        if not det.evaluate("d=>d.open"):
            b = det.locator("summary").first.bounding_box()
            self.click_xy(b["x"] + min(120, b["width"] / 2), b["y"] + b["height"] / 2, 0.6, 0.5)
        else:
            self.pause(0.3)

    def close_scheda(self):
        self.pg.keyboard.press("Escape")
        self.pg.wait_for_timeout(int(500 * K))

    # ───── sovrapposti ─────
    def ring(self, target, label=None, pos="below", hold=2.0, pad=8, wait=True):
        if hasattr(target, "bounding_box"):
            b = target.first.bounding_box()
            target = [b["x"], b["y"], b["width"], b["height"]] if b else None
            if target is None:
                self.warn.append(f"{self.sid}: ring su locator non visibile"); return
        ok = self.pg.evaluate("([t,l,p,pad])=>window.__v.ring(t,l,p,pad)", [target, label, pos, pad])
        if not ok:
            self.warn.append(f"{self.sid}: evidenziazione non trovata {target}")
        if wait:
            time.sleep(hold * K)
            self.pg.evaluate("()=>window.__v.clearRings()")

    def clear(self):
        self.pg.evaluate("()=>window.__v.clearRings()")

    def lower(self, titolo, sotto="", hold=4.2):
        self.pg.evaluate("([a,b,m])=>window.__v.lower(a,b,m)", [titolo, sotto, int(hold * 1000 * K)])

    def find_rect(self, css, contains=None, root=None):
        """Rettangolo [x,y,w,h] del primo elemento `css` (nel `root`) il cui testo contiene `contains`."""
        return self.pg.evaluate("""([css,txt,root])=>{const base=root?document.querySelector(root):document;
          const e=[...base.querySelectorAll(css)].find(e=>e.offsetParent!==null&&(!txt||(e.innerText||'').toLowerCase().includes(txt))&&(!txt||![...e.children].some(c=>(c.innerText||'').toLowerCase().includes(txt))));
          if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}""", [css, contains.lower() if contains else None, root])

    def click_text(self, text, css="button, label, summary, a, li, h3, p, span, div", root="#pannello", **kw):
        r = self.find_rect(css, text, root)
        if not r:
            self.warn.append(f"{self.sid}: testo non trovato «{text}»"); return False
        self.click_xy(r[0] + r[2] / 2, r[1] + r[3] / 2, kw.get("move", 0.7), kw.get("after", 0.4))
        return True

    def chip(self, att):
        self.pg.evaluate("([v,a])=>window.__v.chip(v,a)", [["La mappa", "Plugin RNDT", "Geoimage"], att])

    def card(self, num, titolo, sotto="", hold=2.6, durante=None):
        self.pg.evaluate("([a,b,c])=>window.__v.card(a,b,c)", [num, titolo, sotto])
        t_ini = time.monotonic()
        if durante:
            time.sleep(0.5 * K)
            durante()
        resto = hold * K - (time.monotonic() - t_ini)
        if resto > 0:
            time.sleep(resto)
        self.pg.evaluate("()=>window.__v.cardOff()")

    def big(self, html, hold=3.0, wait=True):
        self.pg.evaluate("(h)=>window.__v.big(h)", html)
        if wait:
            time.sleep(hold * K)
            self.pg.evaluate("()=>window.__v.bigOff()")

    def big_off(self):
        self.pg.evaluate("()=>window.__v.bigOff()")

    # ───── zoom morbido (applicato in montaggio) ─────
    def zoom_box(self, target, z=1.55, ramp=0.9):
        """Registra una zoomata verso `target` (selettore o [x,y,w,h]) a partire da adesso."""
        if isinstance(target, str):
            b = self.pg.locator(target).first.bounding_box()
            if not b:
                return
            cx, cy = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        else:
            cx, cy = target[0] + target[2] / 2, target[1] + target[3] / 2
        self.zooms.append(dict(t=self.now(), cx=cx, cy=cy, z=z, ramp=ramp))

    def zoom_out(self, ramp=0.8):
        self.zooms.append(dict(t=self.now(), cx=960, cy=540, z=1.0, ramp=ramp))

    def shot(self, nome):
        if FAST and os.environ.get("SHOTS"):
            self.pg.screenshot(path=os.path.join(HERE, "out/shots", f"{self.sid}-{nome}.png"))

    def save(self, path):
        json.dump(dict(scene=self.log, zoom=self.zooms, clicks=self.clicks, warn=self.warn), open(path, "w"), indent=1)
