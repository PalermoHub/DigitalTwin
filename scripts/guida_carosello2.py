#!/usr/bin/env python3
"""Secondo carosello social, più grafico (social/carosello-2/NN.png, 1080x1350).

Stile notturno: una sola mappa reale di Palermo scorre attraverso tutte le slide (panorama continuo con un percorso
luminoso che le attraversa), numeri grandi dai nostri dati, screenshot ritagliati e inclinati con annotazioni.
Le sorgenti (screenshot a doppia risoluzione e panorama) si generano in lavoro/carosello/ (git-ignored).

Uso: python scripts/guida_carosello2.py [--rigenera]
"""
import argparse
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SORGENTI = ROOT / "lavoro" / "carosello"
OUT = ROOT / "social" / "carosello-2"
LINK = "palermodigitaltwin.opendatasicilia.it"
LOGO = ROOT / "img" / "opendatasicilia.png"
L, A = 1080, 1350  # lato e altezza di una slide
CARD_W, CARD_H = 920, 580
IMG_W, IMG_H = 1280, 720  # sistema di coordinate in cui sono scritte le annotazioni


def _ann(x, y, testo):
    return {"x": x, "y": y, "t": testo}


# immagine = id dello screenshot; crop = (centro x, centro y come frazioni dell'immagine, zoom); ann = annotazioni (px su 1280x720)
SLIDES = [
    {"id": "cos-e", "copertina": True, "kicker": "DIGITAL TWIN", "titolo": "PALERMO", "testo": "La città sulla mappa, con tutti i suoi dati aperti.", "immagine": "cos-e", "crop": (0.5, 0.5, 1.15), "ann": []},
    {"id": "cos-e", "stat": "1", "etichetta": "MAPPA PER TUTTI I DATI DELLA CITTÀ", "testo": "Catasto, piano regolatore, popolazione, edifici e trasporti, insieme.", "immagine": "cos-e", "crop": (0.5, 0.5, 1.15),
     "ann": [_ann(58, 300, "Strati"), _ann(690, 656, "Cerca"), _ann(1245, 375, "Zoom")]},
    {"id": "dati", "stat": "OPEN", "etichetta": "DATI APERTI, FONTE PER FONTE", "testo": "Comune, AMAT, catasto, censimento, OpenStreetMap: ogni dato cita la fonte.", "immagine": "dati", "crop": (0.5, 0.55, 1.5),
     "ann": [_ann(357, 248, "Fonti e avvisi"), _ann(640, 447, "Licenze")]},
    {"id": "strati", "stat": "{strati}", "etichetta": "STRATI DA SOVRAPPORRE", "testo": "Accendi i temi che ti servono e confrontali sulla stessa mappa.", "immagine": "strati", "crop": (0.2, 0.4, 1.6),
     "ann": [_ann(58, 252, "Territorio"), _ann(138, 99, "Accendi"), _ann(240, 560, "Legenda")]},
    {"id": "scheda", "stat": "6", "etichetta": "SEZIONI IN OGNI SCHEDA", "testo": "Un clic sulla mappa: indirizzo, catasto, vincoli, mercato e popolazione.", "immagine": "scheda", "crop": (0.8, 0.5, 1.7),
     "ann": [_ann(1000, 149, "Sezioni"), _ann(1000, 199, "Particella"), _ann(1090, 594, "Visura")]},
    {"id": "monumenti", "stat": "{monumenti}", "etichetta": "MONUMENTI E LUOGHI STORICI", "testo": "Chiese, palazzi, teatri: foto, descrizione e scheda per ogni luogo.", "immagine": "monumenti", "crop": (0.55, 0.4, 1.4),
     "ann": [_ann(450, 110, "Foto"), _ann(1100, 360, "Scheda")]},
    {"id": "uffici", "stat": "{uffici}", "etichetta": "UFFICI COMUNALI IN {sedi} SEDI", "testo": "Dove sono gli uffici del Comune, quali aree ospitano e chi li dirige.", "immagine": "uffici", "crop": (0.6, 0.5, 1.4),
     "ann": [_ann(450, 200, "La sede"), _ann(1050, 366, "Responsabili")]},
    {"id": "pai", "stat": "P1→P4", "etichetta": "CLASSI DI PERICOLOSITÀ DEL PAI", "testo": "Rischio idraulico e geomorfologico con la simbologia ufficiale della Regione.", "immagine": "pai", "crop": (0.5, 0.55, 1.35),
     "ann": [_ann(240, 520, "Le classi"), _ann(1075, 602, "Vincoli PAI")]},
    {"id": "incendi", "stat": "19", "etichetta": "ANNI DI INCENDI MAPPATI", "testo": "Le aree bruciate dal 2007, anno per anno, con data, località e superficie.", "immagine": "incendi", "crop": (0.55, 0.45, 1.35),
     "ann": [_ann(240, 294, "Anno per anno"), _ann(1050, 185, "Bellolampo 2023")]},
    {"id": "filtri", "stat": "3", "etichetta": "LIVELLI: CIRCOSCRIZIONE · QUARTIERE · UPL", "testo": "Cerca una via, un quartiere o una particella e vai dritto sul posto.", "immagine": "filtri", "crop": (0.55, 0.65, 1.7),
     "ann": [_ann(690, 160, "Circoscrizione"), _ann(700, 420, "Risultati"), _ann(690, 655, "Cerca")]},
    {"id": "fine", "chiusura": True, "kicker": "PROVALO", "titolo": "PALERMO", "testo": "Un progetto di Open Data Sicilia. Dati informativi, senza valore legale.", "immagine": None, "ann": []},
]

CSS = f"""
*{{box-sizing:border-box;margin:0}}
body{{width:{L}px;height:{A}px;overflow:hidden;position:relative;background:#070a19;color:#fff;font-family:'Noto Sans','DejaVu Sans',sans-serif}}
.pano{{position:absolute;inset:0;overflow:hidden}}
.pano .mappa{{position:absolute;top:0;height:{A}px;width:__PANOW__px;background-size:100% 100%;filter:invert(1) hue-rotate(198deg) saturate(1.7) brightness(.95) contrast(1.15)}}
.velo{{position:absolute;inset:0;background:radial-gradient(120% 70% at 85% 8%,rgba(245,166,35,.28),transparent 60%),linear-gradient(180deg,rgba(7,10,25,.88) 0%,rgba(7,10,25,.55) 38%,rgba(7,10,25,.80) 78%,rgba(7,10,25,.95) 100%)}}
.percorso{{position:absolute;top:0;height:{A}px}}
.top{{position:absolute;left:64px;right:64px;top:50px;display:flex;justify-content:space-between;align-items:center;font-size:25px;font-weight:700;letter-spacing:.16em;color:#7fe6ff}}
.num{{color:#fff;opacity:.85;letter-spacing:.08em}}
.prog{{position:absolute;left:64px;right:64px;top:22px;display:flex;gap:6px}}
.prog i{{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.18)}}
.prog i.on{{background:#f5a623;box-shadow:0 0 14px #f5a623}}
.stat{{position:absolute;left:58px;top:92px;font-size:250px;line-height:1;font-weight:900;letter-spacing:-.04em;color:#f5a623;text-shadow:0 0 60px rgba(245,166,35,.55),0 6px 0 rgba(0,0,0,.25)}}
.stat.l{{font-size:170px;top:132px}}
.etic{{position:absolute;left:68px;right:64px;top:350px;font-size:33px;font-weight:800;letter-spacing:.1em;color:#fff}}
.dev{{position:absolute;left:{(L - CARD_W) // 2}px;top:500px;width:{CARD_W}px;height:{CARD_H}px;transform:perspective(1700px) rotateY(-9deg) rotateX(5deg) rotate(-1.6deg);transform-origin:50% 50%}}
.clip{{position:absolute;inset:0;border-radius:38px;overflow:hidden;border:3px solid rgba(255,255,255,.28);box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 80px rgba(245,166,35,.28);background:#0b1020}}
.clip img{{position:absolute;max-width:none}}
.ring{{position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:5px solid #f5a623;box-shadow:0 0 24px #f5a623,inset 0 0 16px rgba(245,166,35,.5)}}
.pill{{position:absolute;margin-top:-86px;padding:9px 20px;border-radius:30px;background:#f5a623;color:#1a1206;font-size:27px;font-weight:800;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.45)}}
.testo{{position:absolute;left:64px;right:64px;top:1130px;font-size:40px;line-height:1.28;font-weight:600;color:#f1f4fa}}
.piede{{position:absolute;left:0;right:0;bottom:0;padding:40px 64px 34px;background:linear-gradient(180deg,rgba(7,10,25,0),rgba(7,10,25,.92) 60%);display:flex;justify-content:space-between;align-items:center;font-size:25px;color:#9fb0c8}}
.piede b{{color:#7fe6ff;font-weight:700}}
.freccia{{font-size:54px;color:#f5a623;text-shadow:0 0 18px #f5a623;font-weight:900}}
.cop .kick{{position:absolute;left:64px;top:380px;font-size:44px;font-weight:800;letter-spacing:.34em;color:#f5a623}}
.cop h1,.fin h1{{position:absolute;left:58px;top:450px;font-size:196px;line-height:1;font-weight:900;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:5px #fff;text-shadow:0 0 70px rgba(127,230,255,.5)}}
.cop .testo{{top:790px;font-size:50px}}
.cop .dev{{top:960px}}
.fin h1{{top:170px}}
.fin .kick{{position:absolute;left:64px;top:120px;font-size:44px;font-weight:800;letter-spacing:.34em;color:#f5a623}}
.fin .testo{{top:520px;font-size:48px}}
.fin .link{{position:absolute;left:64px;right:64px;top:690px;font-size:42px;font-weight:900;color:#7fe6ff;text-shadow:0 0 30px rgba(127,230,255,.6)}}
.fin .logo{{position:absolute;left:64px;top:930px;height:230px}}
"""


def _numeri():
    sedi = json.loads((ROOT / "dati/uffici/sedi.geojson").read_text(encoding="utf-8"))["features"]
    mon = json.loads((ROOT / "dati/monumenti/monumenti.geojson").read_text(encoding="utf-8"))["features"]
    fmt = lambda n: f"{n:,}".replace(",", ".")
    meta = SORGENTI / "meta.json"
    strati = json.loads(meta.read_text())["strati"] if meta.exists() else 0
    return {"strati": str(strati), "monumenti": fmt(len(mon)), "uffici": fmt(sum(f["properties"].get("n_uffici", 0) for f in sedi)), "sedi": str(len(sedi))}


def _percorso(tot):
    """Linea luminosa unica che attraversa tutte le slide (SVG largo tot*L)."""
    w = tot * L
    pt = [(0, 790), (700, 700), (1500, 860), (2300, 740), (3100, 880), (3900, 720), (4700, 850), (5500, 740), (6300, 880), (7100, 730), (7900, 860), (8700, 750), (9500, 880), (10300, 740), (w, 800)]
    d = f"M{pt[0][0]},{pt[0][1]} " + " ".join(f"S{(x0 + x1) / 2:.0f},{y1 + (60 if i % 2 else -60)} {x1},{y1}" for i, ((x0, _), (x1, y1)) in enumerate(zip(pt, pt[1:])))
    nodi = "".join(f'<circle cx="{x}" cy="{y}" r="13" fill="#070a19" stroke="#f5a623" stroke-width="6"/>' for x, y in pt[1:-1:2])
    return (f'<svg class="percorso" width="{w}" height="{A}" viewBox="0 0 {w} {A}"><defs><filter id="g" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="9"/></filter></defs>'
            f'<path d="{d}" fill="none" stroke="#f5a623" stroke-width="16" opacity=".55" filter="url(#g)"/><path d="{d}" fill="none" stroke="#ffd27a" stroke-width="5" opacity=".95"/>{nodi}</svg>')


def _crop(slide, cw=CARD_W, ch=CARD_H):
    """(larghezza, altezza, sinistra, alto) dell'immagine dentro la cornice, con il centro limitato in modo che la cornice resti piena."""
    fx, fy, z = slide["crop"]
    w, h = cw * z, cw * z * IMG_H / IMG_W
    h = max(h, ch)  # con zoom bassi l'immagine deve comunque coprire l'altezza
    w = max(w, h * IMG_W / IMG_H)
    fx = min(max(fx, cw / 2 / w), 1 - cw / 2 / w)
    fy = min(max(fy, ch / 2 / h), 1 - ch / 2 / h)
    return w, h, cw / 2 - fx * w, ch / 2 - fy * h


def _annotazioni(slide, cw=CARD_W, ch=CARD_H):
    w, h, sx, sy = _crop(slide, cw, ch)
    out = []
    for a in slide["ann"]:
        x, y = sx + a["x"] / IMG_W * w, sy + a["y"] / IMG_H * h
        if not (30 < x < cw - 30 and 30 < y < ch - 30):
            continue
        lato = "right:%dpx" % (cw - x - 26) if x > cw * 0.62 else "left:%dpx" % (x - 26)
        out.append(f'<div class="ring" style="left:{x:.0f}px;top:{y:.0f}px"></div><div class="pill" style="{lato};top:{y:.0f}px">{html.escape(a["t"])}</div>')
    return "".join(out)


def html_slide(slide, n, tot, numeri, prefisso="../"):
    e = html.escape
    pano_w = tot * L
    sfondo = (f'<div class="pano"><div class="mappa" style="left:-{(n - 1) * L}px;background-image:url({prefisso}pano.png)"></div></div>'
              f'<div class="velo"></div><div style="position:absolute;left:-{(n - 1) * L}px;top:0;width:{pano_w}px;height:{A}px">{_percorso(tot)}</div>')
    barra = '<div class="prog">' + "".join(f'<i class="{"on" if i < n else ""}"></i>' for i in range(tot)) + "</div>"
    classe = "cop" if slide.get("copertina") else "fin" if slide.get("chiusura") else ""
    corpo = [barra, f'<div class="top"><span>DIGITAL TWIN PALERMO</span><span class="num">{n:02d} / {tot:02d}</span></div>']
    sost = lambda t: t.format(**numeri)
    if slide.get("copertina") or slide.get("chiusura"):
        corpo.append(f'<div class="kick">{e(slide["kicker"])}</div><h1>{e(slide["titolo"])}</h1>')
    else:
        stat = sost(slide["stat"])
        corpo.append(f'<div class="stat{" l" if len(stat) > 4 else ""}">{e(stat)}</div><div class="etic">{e(sost(slide["etichetta"]))}</div>')
    if slide.get("immagine"):
        w, h, sx, sy = _crop(slide)
        corpo.append(f'<div class="dev"><div class="clip"><img src="{prefisso}{slide["immagine"]}.png" style="width:{w:.0f}px;height:{h:.0f}px;left:{sx:.0f}px;top:{sy:.0f}px" alt=""></div>{_annotazioni(slide)}</div>')
    corpo.append(f'<div class="testo">{e(slide["testo"])}</div>')
    if slide.get("chiusura"):
        corpo.append(f'<div class="link">{LINK}</div><img class="logo" src="{prefisso}logo.png" alt="Open Data Sicilia">')
        piede = '<span>Dati aperti · codice libero</span><span>CC BY 4.0 · EUPL-1.2</span>'
    else:
        piede = f'<span><b>{LINK}</b></span><span class="freccia">→</span>'
    corpo.append(f'<div class="piede">{piede}</div>')
    css = CSS.replace("__PANOW__", str(pano_w))
    return f'<!doctype html><html lang="it"><meta charset="utf-8"><style>{css}</style><body class="{classe}">{sfondo}{"".join(corpo)}</body></html>'


def genera_sorgenti(forza=False):
    """Screenshot a doppia risoluzione dei passi (come per la guida) e panorama notturno della città."""
    sys.path.insert(0, str(Path(__file__).parent))
    import guida_screenshot as g
    from playwright.sync_api import sync_playwright

    SORGENTI.mkdir(parents=True, exist_ok=True)
    if forza or not all((SORGENTI / f"{p['id']}.png").exists() for p in g.passi()):
        g.main(["--scala", "2", "--dest", str(SORGENTI)])
    if forza or not (SORGENTI / "pano.png").exists() or not (SORGENTI / "meta.json").exists():
        proc, url = g._avvia_server()
        try:
            with sync_playwright() as pw:
                b = pw.chromium.launch(args=["--use-gl=swiftshader", "--ignore-gpu-blocklist"])
                pg = b.new_page(viewport={"width": 11 * L, "height": A}, device_scale_factor=1)
                pg.goto(url + "/index.html")
                pg.wait_for_function("window.dt && window.dt.pronto === true", timeout=120000)
                strati = pg.evaluate("document.querySelectorAll('input[id^=strato-]').length")
                (SORGENTI / "meta.json").write_text(json.dumps({"strati": strati}))
                pg.add_style_tag(content="body > *:not(#mappa){display:none!important} #mappa{position:fixed;inset:0}")
                g._imposta_strati(pg, ["edificato"])
                pg.evaluate("window.dt.map.resize(); window.dt.map.jumpTo({center:[13.36,38.12], zoom:14.1, pitch:0, bearing:0})")
                pg.wait_for_function("window.dt.map.loaded()", timeout=120000)
                pg.wait_for_timeout(6000)
                pg.screenshot(path=str(SORGENTI / "pano.png"))
                b.close()
        finally:
            proc.terminate()
    logo = SORGENTI / "logo.png"
    if not logo.exists():
        logo.write_bytes(LOGO.read_bytes())


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--rigenera", action="store_true", help="rifà anche screenshot e panorama sorgente")
    args = ap.parse_args(argv)
    from playwright.sync_api import sync_playwright

    genera_sorgenti(args.rigenera)
    numeri = _numeri()
    pagine = SORGENTI / "html"
    pagine.mkdir(exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": L, "height": A}, device_scale_factor=1)
        for i, s in enumerate(SLIDES, 1):
            f = pagine / f"{i:02d}.html"
            f.write_text(html_slide(s, i, len(SLIDES), numeri), encoding="utf-8")
            page.goto(f.as_uri())
            page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / f"{i:02d}.png"))
            print("ok", f"{i:02d}", s.get("titolo") or s["etichetta"])
        browser.close()


if __name__ == "__main__":
    main()
