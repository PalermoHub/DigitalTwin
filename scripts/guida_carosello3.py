#!/usr/bin/env python3
"""Terzo carosello social (social/carosello-3/NN.png, 1080x1350): Palermo in 3D notturna dai nostri dati.

Ogni slide ha come sfondo una veduta aerea reale della città (edifici estrusi dall'altezza reale, colorati per altezza,
resi dall'app stessa con uno stile notturno), un numero grande dai nostri dati e uno screenshot annotato.
Le vedute si renderizzano in lavoro/carosello/hero*.png (git-ignored): senza GPU ogni immagine richiede alcuni minuti,
per questo il rendering parte in processi paralleli. Uso: python scripts/guida_carosello3.py [--rigenera]
"""
import argparse
import html
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import guida_carosello2 as v2  # noqa: E402

ROOT, SORGENTI, LINK, L, A = v2.ROOT, v2.SORGENTI, v2.LINK, v2.L, v2.A
OUT = ROOT / "social" / "carosello-3"
CARD_W, CARD_H = 800, 500

# vedute: centro, zoom, inclinazione, direzione di sguardo (gradi)
HEROES = {
    "heroA": (13.3615, 38.1145, 15.0, 62, -28),   # centro storico verso la città alta
    "heroB": (13.3572, 38.1202, 16.4, 64, 25),    # Teatro Massimo da vicino
    "heroC": (13.3700, 38.1260, 14.8, 60, 40),    # porto e costa
    "heroD": (13.3560, 38.1100, 15.6, 60, -80),   # Palazzo dei Normanni e Cattedrale
    "heroE": (13.3400, 38.1300, 13.6, 55, -15),   # veduta ampia sulla città
}

NOTTE_JS = """(() => {
  const m = window.dt.map;
  const set = (id, k, v) => { if (m.getLayer(id)) m.setPaintProperty(id, k, v); };
  set('background', 'background-color', '#050816');
  set('park', 'fill-color', '#08112a'); set('landcover_wood', 'fill-color', '#07102a'); set('landuse_residential', 'fill-color', '#08112b');
  set('water', 'fill-color', '#06173a'); set('waterway', 'line-color', '#0a2a66');
  set('building', 'fill-color', '#0d1838'); set('building', 'fill-opacity', 1);
  for (const id of ['highway_minor', 'highway_path']) { set(id, 'line-color', '#25407e'); set(id, 'line-opacity', .9); }
  for (const id of ['highway_major_inner', 'highway_major_subtle']) set(id, 'line-color', '#4d78e0');
  for (const id of ['highway_motorway_inner', 'highway_motorway_subtle', 'highway_motorway_bridge_inner']) set(id, 'line-color', '#ffb84d');
  for (const id of ['highway_major_casing', 'highway_motorway_casing', 'highway_motorway_bridge_casing']) set(id, 'line-color', '#0b1330');
  for (const l of m.getStyle().layers) if (l.type === 'symbol') m.setLayoutProperty(l.id, 'visibility', 'none');
  set('edifici-3d', 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'altezza'], 0], 0, '#1a2a66', 9, '#2f55c9', 18, '#22c7f5', 30, '#ffb84d', 50, '#ffe2a0']);
  set('edifici-3d', 'fill-extrusion-opacity', .96);
  m.setLight({ anchor: 'viewport', color: '#b8c8ff', intensity: .55, position: [1.3, 220, 50] });
})()"""

# per ogni slide: veduta di sfondo e come inquadrarla (zoom, posizione in %)
SFONDI = [
    ("heroA", 1.0, 50, 50), ("heroA", 1.3, 30, 20), ("heroE", 1.0, 50, 50), ("heroE", 1.35, 80, 30), ("heroB", 1.0, 50, 50),
    ("heroB", 1.3, 20, 30), ("heroD", 1.0, 50, 50), ("heroC", 1.0, 50, 50), ("heroE", 1.35, 15, 70), ("heroA", 1.3, 70, 85), ("heroC", 1.3, 40, 30),
]

CSS = f"""
*{{box-sizing:border-box;margin:0}}
body{{width:{L}px;height:{A}px;overflow:hidden;position:relative;background:#050816;color:#fff;font-family:'Noto Sans','DejaVu Sans',sans-serif}}
.bg{{position:absolute;inset:0;background-repeat:no-repeat}}
.velo{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,8,22,.82) 0%,rgba(5,8,22,.15) 30%,rgba(5,8,22,.05) 48%,rgba(5,8,22,.7) 76%,rgba(5,8,22,.97) 100%)}}
.top{{position:absolute;left:64px;right:64px;top:50px;display:flex;justify-content:space-between;font-size:25px;font-weight:700;letter-spacing:.16em;color:#7fe6ff;text-shadow:0 2px 12px #000}}
.num{{color:#fff;letter-spacing:.08em}}
.prog{{position:absolute;left:64px;right:64px;top:22px;display:flex;gap:6px}}
.prog i{{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.2)}}
.prog i.on{{background:#f5a623;box-shadow:0 0 14px #f5a623}}
.stat{{position:absolute;left:58px;top:92px;font-size:250px;line-height:1;font-weight:900;letter-spacing:-.04em;color:#f5a623;text-shadow:0 0 60px rgba(245,166,35,.6),0 8px 30px rgba(0,0,0,.7)}}
.stat.l{{font-size:170px;top:132px}}
.etic{{position:absolute;left:68px;right:64px;top:350px;font-size:33px;font-weight:800;letter-spacing:.1em;text-shadow:0 2px 16px #000,0 0 30px #000}}
.dev{{position:absolute;left:{L - CARD_W - 52}px;top:610px;width:{CARD_W}px;height:{CARD_H}px;transform:perspective(1700px) rotateY(-10deg) rotateX(5deg) rotate(-2deg)}}
.clip{{position:absolute;inset:0;border-radius:34px;overflow:hidden;border:3px solid rgba(255,255,255,.3);box-shadow:0 40px 90px rgba(0,0,0,.75),0 0 90px rgba(245,166,35,.35);background:#0b1020}}
.clip img{{position:absolute;max-width:none}}
.ring{{position:absolute;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;border:5px solid #f5a623;box-shadow:0 0 24px #f5a623,inset 0 0 16px rgba(245,166,35,.5)}}
.pill{{position:absolute;margin-top:-84px;padding:8px 18px;border-radius:30px;background:#f5a623;color:#1a1206;font-size:25px;font-weight:800;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.5)}}
.testo{{position:absolute;left:64px;right:64px;top:1130px;font-size:40px;line-height:1.28;font-weight:600;color:#f4f6fb;text-shadow:0 2px 14px #000}}
.piede{{position:absolute;left:0;right:0;bottom:0;padding:30px 64px 30px;display:flex;justify-content:space-between;align-items:center;font-size:24px;color:#9fb0c8}}
.piede b{{color:#7fe6ff;font-weight:700}}
.cred{{position:absolute;right:64px;bottom:76px;font-size:17px;color:#7d8fb0;letter-spacing:.02em}}
.freccia{{font-size:54px;color:#f5a623;text-shadow:0 0 18px #f5a623;font-weight:900}}
.cop .kick,.fin .kick{{position:absolute;left:64px;top:560px;font-size:44px;font-weight:800;letter-spacing:.34em;color:#f5a623;text-shadow:0 2px 20px #000}}
.cop h1,.fin h1{{position:absolute;left:58px;top:620px;font-size:196px;line-height:1;font-weight:900;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:5px #fff;text-shadow:0 0 70px rgba(127,230,255,.55)}}
.cop .testo{{top:880px;font-size:50px}}
.fin .kick{{top:300px}} .fin h1{{top:360px}} .fin .testo{{top:640px;font-size:46px}}
.fin .link{{position:absolute;left:64px;right:64px;top:830px;font-size:42px;font-weight:900;color:#7fe6ff;text-shadow:0 0 30px rgba(127,230,255,.6),0 2px 14px #000}}
.fin .logo{{position:absolute;left:64px;top:960px;height:210px}}
"""


def html_slide(slide, n, tot, numeri, sfondo, prefisso="../"):
    e = html.escape
    eroe, zoom, px, py = sfondo
    classe = "cop" if slide.get("copertina") else "fin" if slide.get("chiusura") else ""
    corpo = [f'<div class="bg" style="background-image:url({prefisso}{eroe}.png);background-size:{zoom * 100:.0f}% auto;background-position:{px}% {py}%"></div><div class="velo"></div>',
             '<div class="prog">' + "".join(f'<i class="{"on" if i < n else ""}"></i>' for i in range(tot)) + "</div>",
             f'<div class="top"><span>DIGITAL TWIN PALERMO</span><span class="num">{n:02d} / {tot:02d}</span></div>']
    sost = lambda t: t.format(**numeri)
    if slide.get("copertina") or slide.get("chiusura"):
        corpo.append(f'<div class="kick">{e(slide["kicker"])}</div><h1>{e(slide["titolo"])}</h1>')
    else:
        stat = sost(slide["stat"])
        corpo.append(f'<div class="stat{" l" if len(stat) > 4 else ""}">{e(stat)}</div><div class="etic">{e(sost(slide["etichetta"]))}</div>')
    if slide.get("immagine") and not slide.get("copertina"):
        w, h, sx, sy = v2._crop(slide, CARD_W, CARD_H)
        corpo.append(f'<div class="dev"><div class="clip"><img src="{prefisso}{slide["immagine"]}.png" style="width:{w:.0f}px;height:{h:.0f}px;left:{sx:.0f}px;top:{sy:.0f}px" alt=""></div>{v2._annotazioni(slide, CARD_W, CARD_H)}</div>')
    corpo.append(f'<div class="testo">{e(slide["testo"])}</div>')
    if slide.get("chiusura"):
        corpo.append(f'<div class="link">{LINK}</div><img class="logo" src="{prefisso}logo.png" alt="Open Data Sicilia">')
        piede = '<span>Dati aperti · codice libero</span><span>CC BY 4.0 · EUPL-1.2</span>'
    else:
        piede = f'<span><b>{LINK}</b></span><span class="freccia">→</span>'
    corpo.append(f'<div class="cred">Mappa: © OpenStreetMap contributors · OpenFreeMap · dati Comune di Palermo</div><div class="piede">{piede}</div>')
    return f'<!doctype html><html lang="it"><meta charset="utf-8"><style>{CSS}</style><body class="{classe}">{"".join(corpo)}</body></html>'


def render_hero(nome):
    """Una veduta 3D notturna (lenta senza GPU: alcuni minuti)."""
    import guida_screenshot as g
    from playwright.sync_api import sync_playwright

    lon, lat, zoom, pitch, bearing = HEROES[nome]
    proc, url = g._avvia_server()
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--use-gl=swiftshader", "--ignore-gpu-blocklist"])
            pg = b.new_page(viewport={"width": L, "height": A})
            pg.goto(url + "/index.html")
            pg.wait_for_function("window.dt && window.dt.pronto === true", timeout=120000)
            pg.add_style_tag(content="body > *:not(#mappa){display:none!important} #mappa{position:fixed;inset:0} .maplibregl-ctrl-bottom-right,.maplibregl-ctrl-bottom-left{display:none!important}")
            g._imposta_strati(pg, ["edifici3d"])
            pg.evaluate(NOTTE_JS)
            pg.evaluate("window.dt.map.resize()")
            pg.evaluate(f"window.dt.map.jumpTo({{center:[{lon},{lat}], zoom:{zoom}, pitch:{pitch}, bearing:{bearing}}})")
            pg.wait_for_function("window.dt.map.loaded()", timeout=900000)
            pg.wait_for_timeout(4000)
            pg.screenshot(path=str(SORGENTI / f"{nome}.png"))
            b.close()
    finally:
        proc.terminate()


def genera_heroes(forza=False):
    SORGENTI.mkdir(parents=True, exist_ok=True)
    mancanti = [h for h in HEROES if forza or not (SORGENTI / f"{h}.png").exists()]
    procs = [subprocess.Popen([sys.executable, __file__, "--hero", h], stdin=subprocess.DEVNULL) for h in mancanti]
    for p, h in zip(procs, mancanti):
        if p.wait() != 0:
            sys.exit(f"rendering di {h} fallito")
        print("ok", h)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--rigenera", action="store_true", help="rifà anche screenshot e vedute")
    ap.add_argument("--hero", help="(interno) renderizza una sola veduta")
    args = ap.parse_args(argv)
    if args.hero:
        return render_hero(args.hero)
    from playwright.sync_api import sync_playwright

    v2.genera_sorgenti(args.rigenera)
    genera_heroes(args.rigenera)
    numeri = v2._numeri()
    pagine = SORGENTI / "html3"
    pagine.mkdir(exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": L, "height": A}, device_scale_factor=1)
        for i, (s, sf) in enumerate(zip(v2.SLIDES, SFONDI), 1):
            f = pagine / f"{i:02d}.html"
            f.write_text(html_slide(s, i, len(v2.SLIDES), numeri, sf, prefisso="../"), encoding="utf-8")
            page.goto(f.as_uri())
            page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / f"{i:02d}.png"))
            print("ok", f"{i:02d}", s.get("titolo") or s["etichetta"])
        browser.close()


if __name__ == "__main__":
    main()
