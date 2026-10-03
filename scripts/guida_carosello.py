#!/usr/bin/env python3
"""Genera il carosello social (social/carosello/NN.png, 1080x1350) che spiega la webapp.

Usa gli screenshot della guida (img/guida/passi/, vedi guida_screenshot.py) e testi brevi pensati per i social.
Uso: python scripts/guida_carosello.py
"""
import base64
import html
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "social" / "carosello"
LOGO = "img/opendatasicilia.png"
LINK = "palermodigitaltwin.opendatasicilia.it"
P = "img/guida/passi/"

SLIDES = [
    {"titolo": "Digital Twin Palermo", "testo": "La città sulla mappa, con i dati aperti. Scorri per scoprire come si usa.", "immagine": P + "cos-e.webp", "copertina": True},
    {"titolo": "Cos'è", "testo": "Una mappa interattiva che mette a disposizione di tutti i cittadini i dati della città: catasto, piano regolatore, popolazione, edifici, trasporti.", "immagine": P + "cos-e.webp"},
    {"titolo": "Da dove vengono i dati", "testo": "Comune di Palermo, AMAT, catasto, censimento, OpenStreetMap. Ogni dato ha la sua fonte e la sua licenza, elencate nell'app.", "immagine": P + "dati.webp"},
    {"titolo": "Scegli gli strati", "testo": "Accendi i temi che ti servono (territorio, edifici, trasporti, sicurezza) e confrontali sulla stessa mappa.", "immagine": P + "strati.webp"},
    {"titolo": "Un clic, una scheda", "testo": "Tocca un punto: la scheda raccoglie indirizzo, catasto, vincoli, mercato e popolazione.", "immagine": P + "scheda.webp"},
    {"titolo": "Monumenti", "testo": "Chiese, palazzi, teatri: foto, descrizione e scheda per ogni luogo storico.", "immagine": P + "monumenti.webp"},
    {"titolo": "Uffici comunali", "testo": "Dove sono gli uffici del Comune, quali aree ospitano e chi li dirige.", "immagine": P + "uffici.webp"},
    {"titolo": "Rischio idrogeologico", "testo": "Il Piano di Assetto Idrogeologico: pericolosità e rischio idraulico e geomorfologico, con la simbologia ufficiale.", "immagine": P + "pai.webp"},
    {"titolo": "Incendi", "testo": "Le aree percorse dal fuoco dal 2007, anno per anno, con data, località e superficie bruciata.", "immagine": P + "incendi.webp"},
    {"titolo": "Cerca e filtra", "testo": "Una via, un quartiere, una particella: filtra per circoscrizione e vai dritto sul posto.", "immagine": P + "filtri.webp"},
    {"titolo": "Provalo!", "testo": "Un progetto di Open Data Sicilia. Dati aperti (CC BY 4.0), codice libero (EUPL‑1.2). Dati informativi, senza valore legale.", "immagine": None, "chiusura": True},
]

CSS = """
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;font-family:'Noto Sans','DejaVu Sans',sans-serif;color:#1b1f24;background:#fafbfd;position:relative;overflow:hidden}
.bande{position:absolute;left:0;top:0;width:100%;height:18px;background:#f5a623}
.num{position:absolute;right:56px;top:52px;font-size:28px;color:#5b6570;font-weight:600}
.marchio{position:absolute;left:56px;top:48px;font-size:28px;font-weight:700;color:#b45309;letter-spacing:.02em}
h1{position:absolute;left:56px;right:56px;top:130px;font-size:84px;line-height:1.05;font-weight:800}
.scheda{position:absolute;left:56px;top:330px;width:968px;border-radius:24px;overflow:hidden;border:2px solid #d6d6e8;box-shadow:0 14px 40px rgba(0,0,0,.14)}
.scheda img{display:block;width:100%;height:auto}
p{position:absolute;left:56px;right:56px;top:950px;font-size:44px;line-height:1.35;color:#3a424c}
.piede{position:absolute;left:56px;right:56px;bottom:44px;display:flex;align-items:center;justify-content:space-between;font-size:26px;color:#5b6570}
.piede img{height:72px;width:auto}
.copertina{background:#1b1f24;color:#fff}
.copertina .sfondo{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(6px) brightness(.45)}
.copertina h1{top:420px;font-size:128px;color:#fff}
.copertina p{top:860px;color:#f1f3f5;font-size:52px}
.copertina .marchio{color:#f5a623}
.copertina .num{color:#e6e9ee}
.copertina .piede{color:#e6e9ee}
.chiusura h1{top:260px;font-size:140px}
.chiusura p{top:560px;font-size:52px}
.chiusura .link{position:absolute;left:56px;right:56px;top:880px;font-size:50px;font-weight:800;color:#b45309}
.chiusura .logo-grande{position:absolute;left:56px;top:1010px;height:210px;width:auto}
"""


def _uri(percorso):
    f = ROOT / percorso
    tipo = "image/webp" if f.suffix == ".webp" else "image/png"
    return f"data:{tipo};base64," + base64.b64encode(f.read_bytes()).decode()


def html_slide(slide, n, tot):
    e = html.escape
    classe = "copertina" if slide.get("copertina") else "chiusura" if slide.get("chiusura") else ""
    corpo = [f'<div class="bande"></div><div class="marchio">DIGITAL TWIN PALERMO</div><div class="num">{n} / {tot}</div>']
    if slide.get("copertina"):
        corpo.insert(0, f'<div class="sfondo" style="background-image:url({_uri(slide["immagine"])})"></div>')
    corpo.append(f"<h1>{e(slide['titolo'])}</h1>")
    if slide.get("immagine") and not slide.get("copertina"):
        corpo.append(f'<div class="scheda"><img src="{_uri(slide["immagine"])}" alt=""></div>')
    corpo.append(f"<p>{e(slide['testo'])}</p>")
    if slide.get("chiusura"):
        corpo.append(f'<div class="link">{LINK}</div>')
        corpo.append(f'<img class="logo-grande" src="{_uri(LOGO)}" alt="Open Data Sicilia">')
    else:
        corpo.append(f'<div class="piede"><span>{LINK}</span><img src="{_uri(LOGO)}" alt="Open Data Sicilia"></div>')
    return f'<!doctype html><html lang="it"><meta charset="utf-8"><style>{CSS}</style><body class="{classe}">{"".join(corpo)}</body></html>'


def main():
    from playwright.sync_api import sync_playwright

    mancanti = [s["immagine"] for s in SLIDES if s.get("immagine") and not (ROOT / s["immagine"]).exists()]
    if mancanti:
        sys.exit(f"immagini mancanti: {mancanti}; esegui scripts/guida_screenshot.py")
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=1)
        for i, s in enumerate(SLIDES, 1):
            page.set_content(html_slide(s, i, len(SLIDES)))
            page.wait_for_timeout(150)
            page.screenshot(path=str(OUT / f"{i:02d}.png"))
            print("ok", f"{i:02d}", s["titolo"])
        browser.close()


if __name__ == "__main__":
    main()
