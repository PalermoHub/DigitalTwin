"""Scene della sezione 4 (Geoimage) e riepilogo della chiusura."""
import json, math, os, re, time
from scenes_base import *

IMMAGINE = os.path.join(HERE, "assets", "pianta_1891_demo.png")
META = json.load(open(os.path.join(HERE, "assets", "pianta_1891_demo.json")))
VISTA_GCP = (13.3597, 38.1148, 15.35)

IMG2SCREEN = """([u,v,W,H])=>{const g=window.dt.geoimage.stato.angoli;const s=u/W,t=v/H;
  const lat=(1-s)*(1-t)*g[0].lat+s*(1-t)*g[1].lat+(1-s)*t*g[2].lat+s*t*g[3].lat;
  const lng=(1-s)*(1-t)*g[0].lng+s*(1-t)*g[1].lng+(1-s)*t*g[2].lng+s*t*g[3].lng;
  const m=window.dt.map;const p=m.project([lng,lat]);const r=m.getContainer().getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top}}"""


def centro_di(r, sel):
    b = r.pg.locator(sel).first.bounding_box()
    return (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2) if b else None


def pannello_gi(r):
    if r.pg.locator("#geoimage-pannello").is_hidden():
        r.click('button.rail-tab[data-pannello="geoimage"]', after=1.2)


@sc("4-cose")
def _(r):
    r.chip(2)
    r.card("Sezione 3", "Geoimage", "Mappe storiche sulla città di oggi", hold=2.6, durante=lambda: pulisci(r, vista=True))
    r.lower("Geoimage", "Mappe storiche sulla città di oggi")
    r.sync(0.34)
    r.click('button.rail-tab[data-pannello="geoimage"]', after=1.5)
    r.sync(0.66)
    r.ring("#gi-zona", "Carica mappa storica", pos="left", hold=2.2)
    r.sync(0.90)
    rc = r.find_rect("*", "ground control", "#geoimage-pannello")
    if rc:
        r.ring(rc, "GCP = punti di controllo", pos="left", hold=1.4)


@sc("4-inquadra")
def _(r):
    r.sync(0.05)
    r.type("#cerca-testo", "Teatro Massimo", per=0.05)
    r.pause(0.6)
    r.click("#cerca-risultati li", after=1.5)
    r.layers_off(keep=("circoscrizioni", "edificato"))
    r.key("Escape")
    r.fly(VISTA_GCP[0], VISTA_GCP[1], VISTA_GCP[2], ms=1600)


@sc("4-carica")
def _(r):
    pannello_gi(r)
    r.sync(0.08)
    r.hover("#gi-zona", hold=0.6)
    r.pg.locator('#geoimage-pannello input[type=file]').first.set_input_files(IMMAGINE)
    r.pause(2.5)
    r.fly(VISTA_GCP[0], VISTA_GCP[1], VISTA_GCP[2], ms=1200)
    r.shot("caricata")
    r.sync(0.55)
    boxes = [r.pg.locator(".gi-angolo").nth(i).bounding_box() for i in range(4)]
    xs = [b["x"] for b in boxes]; ys = [b["y"] for b in boxes]
    r.zoom_box([min(xs) - 40, min(ys) - 40, max(xs) - min(xs) + 80, max(ys) - min(ys) + 80], 1.8)
    r.ring([min(xs) - 10, min(ys) - 10, max(xs) - min(xs) + 36, max(ys) - min(ys) + 36], "Maniglie di posizionamento", pos="right", hold=2.4)
    r.zoom_out()


@sc("4-posiziona")
def _(r):
    cx, cy = centro_di(r, ".gi-centro")
    r.sync(0.05)
    r.drag(cx, cy, cx - 40, cy + 25, dur=0.6)
    r.sync(0.22)
    rx, ry = centro_di(r, ".gi-rota")
    r.drag(rx, ry, rx + 50, ry + 15, dur=0.6)
    r.sync(0.40)
    r.ring("#gi-modo", "Scala ⇄ deforma", pos="left", hold=1.6)
    r.sync(0.62)
    for _ in range(6):
        r.click("#gi-piu", move=0.2, after=0.05)
    r.shot("ingrandita")


@sc("4-gcp")
def _(r):
    r.sync(0.04)
    r.click("#gi-gcp-modo", after=0.8)
    W = H = META["size"][0]
    n = 0
    for nome, v in META["punti"].items():
        n += 1
        r.sync(0.10 + 0.20 * (n - 1))
        a = r.pg.evaluate(IMG2SCREEN, [v["px"][0], v["px"][1], W, H])
        r.click_xy(a["x"], a["y"], 0.6, 0.5)
        b = r.px(v["lng"], v["lat"])
        r.click_xy(b["x"], b["y"], 0.6, 0.7)
        righe = r.pg.evaluate("()=>document.querySelectorAll('#geoimage-pannello tbody tr').length")
        if righe < n:      # il secondo clic non è stato registrato: riprova una volta
            r.click_xy(b["x"], b["y"], 0.3, 0.9)
            righe = r.pg.evaluate("()=>document.querySelectorAll('#geoimage-pannello tbody tr').length")
            if righe < n:
                r.warn.append(f"4-gcp: GCP {n} ({nome}) non registrato")
        r.shot(f"gcp{n}")
    r.sync(0.92)
    r.key("Escape")
    r.pause(0.4)


@sc("4-allinea")
def _(r):
    r.sync(0.12)
    r.click("#gi-allinea", after=2.8)
    r.shot("allineata")
    r.sync(0.62)
    r.click("#gi-adatta", after=2.5)
    r.shot("adatta")


@sc("4-rmse")
def _(r):
    r.sync(0.05)
    rc = r.find_rect("*", "rmse", "#geoimage-pannello")
    if rc:
        r.zoom_box(rc, 1.5)
        r.ring(rc, "Errore medio in metri", pos="left", hold=2.6)
    r.sync(0.45)
    rc = r.find_rect("th, td, *", "res (m)", "#geoimage-pannello")
    if rc:
        r.ring([rc[0] - 10, rc[1] - 6, 360, 150], "Residuo di ogni punto", pos="left", hold=3.0)
    r.zoom_out()
    r.shot("rmse")


@sc("4-confronto")
def _(r):
    r.sync(0.06)
    r.click("#gi-swipe", after=1.0)
    sw = r.pg.locator(".gi-divisore-maniglia").first
    b = sw.bounding_box() if sw.count() else None
    if b:
        x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        r.drag(x, y, x - 420, y, dur=1.2)
        r.drag(x - 420, y, x + 380, y, dur=1.8)
    else:
        r.warn.append("4-confronto: maniglia dello swipe non trovata")
    r.shot("swipe")
    r.sync(0.52)
    r.click("#gi-swipe", after=0.8)
    r.click("#gi-spotlight", after=0.8)
    cx, cy = 760, 520
    for k in range(14):
        a = k / 14 * 2 * math.pi
        r.move(cx + 230 * math.cos(a), cy + 150 * math.sin(a), 0.22)
    r.shot("spotlight")
    r.sync(0.88)
    r.click("#gi-spotlight", after=0.5)


@sc("4-esporta")
def _(r):
    r.sync(0.10)
    rc = r.find_rect("button", "kmz", "#geoimage-pannello")
    if rc:
        r.zoom_box([rc[0] - 20, rc[1] - 20, 400, 330], 1.4)
        r.ring([rc[0] - 6, rc[1] - 6, 366, 300], "Export", pos="left", hold=3.0)
    r.sync(0.60)
    r.click("#gi-geotiff", after=1.2)
    r.shot("geotiff")
    r.ring("#gi-gtiff-sr", "Sistema di riferimento", pos="left", hold=2.0)
    r.zoom_out()


@sc("4-chiusura")
def _(r):
    r.sync(0.05)
    r.big("<b>Salvataggio automatico</b><br>il progetto resta nel tuo browser", wait=False)
    r.sync(0.55)
    r.big("<b>Più precisione?</b><br>MapWarper · mapwarper.net", wait=False)
    r.sync(0.98)
    r.big_off()


# ───────── chiusura: riepilogo sulla mappa viva ─────────
@sc("5-riepilogo")
def _(r):
    r.pg.evaluate("()=>window.__v.chipOff()")
    pulisci(r)
    r.click("#gi-rimuovi", after=0.5) if r.pg.locator("#gi-rimuovi").is_visible() else None
    r.click("#btn-home", after=1.5)
    r.layers_off(keep=("circoscrizioni", "edificato"))
    voci = ["<b>1</b> &nbsp;Un clic: tutto su un luogo", "<b>2</b> &nbsp;Il catalogo nazionale in mappa", "<b>3</b> &nbsp;Geoimage: ieri e oggi"]
    acc = ""
    for frac, v in zip((0.22, 0.48, 0.74), voci):
        r.sync(frac)
        acc += f"<div style='margin:12px 0'>{v}</div>"
        r.big(acc, wait=False)
    r.sync(1.0)
    r.big_off()
