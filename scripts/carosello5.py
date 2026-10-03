#!/usr/bin/env python3
"""Quinto carosello social (social/carosello-5/NN.png, 1080x1350) dal PDF Palermo_Digital_Twin.

Il PDF è fatto di 10 slide-immagine 16:9: qui vengono smontate. Immagini e testi sono quelli
originali (ritagli delle pagine + testo trascritto alla lettera) e riorganizzati in 12 slide 4:5.
Filo conduttore: la città a strati, ogni slide aggiunge uno strato alla pila in basso.

Uso: python scripts/carosello5.py [file.pdf]
"""
import base64
import html
import io
import sys
from pathlib import Path

import pymupdf
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "social" / "Palermo_Digital_Twin.pdf"
OUT = ROOT / "social" / "carosello-5"
LINK = "palermodigitaltwin.opendatasicilia.it"
L, A = 1080, 1350
TOT = 12

INK, GHIACCIO, VERDE, ROSSO, ORO, AZZURRO, VIOLA = "#14202E", "#E8F0EE", "#0F7A6F", "#C9372C", "#D9A32B", "#2F6FDB", "#6B4FA3"
STRATI = [INK, VERDE, AZZURRO, VIOLA, ROSSO, ORO, VERDE, AZZURRO, VIOLA, ROSSO, ORO, INK]
e = html.escape
PAGINE = {}


def carica(pdf):
    doc = pymupdf.open(pdf)
    for n, p in enumerate(doc, 1):
        pm = pymupdf.Pixmap(doc, p.get_images()[0][0])
        if pm.n > 3:
            pm = pymupdf.Pixmap(pymupdf.csRGB, pm)
        PAGINE[n] = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)


def ritaglio(pagina, box, scala=2):
    """Ritaglio originale della pagina, ingrandito (Lanczos) e data-URI."""
    im = PAGINE[pagina].crop(box)
    im = im.resize((im.width * scala, im.height * scala), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def copertina_foto():
    """Foto di copertina: parte destra della pagina 1, senza il residuo del sottotitolo."""
    im = PAGINE[1].copy()
    # il sottotitolo sfora sul pannello: lo ricostruisco sfumando tra le righe sopra e sotto
    x0, x1, y0, y1 = 745, 1170, 388, 452
    alto, basso = im.crop((x0, y0 - 1, x1, y0)), im.crop((x0, y1, x1, y1 + 1))
    for y in range(y0, y1):
        t = (y - y0) / (y1 - y0)
        riga = Image.blend(alto, basso, t)
        im.paste(riga, (x0, y))
    im.paste(im.crop((1255, 722, 1376, 742)), (1255, 744))  # copre il watermark del generatore
    PAGINE[1] = im
    return ritaglio(1, (762, 0, 1376, 768), 2)


def pila(n):
    return "".join(f'<i style="background:{STRATI[i]};opacity:{1 if i < n else .16}"></i>' for i in range(TOT))


def img(src, cls="", stile=""):
    return f'<img class="{cls}" style="{stile}" src="{src}" alt="">'


def corpo(n):
    if n == 1:
        return f"""
<div class="cover" style="background-image:linear-gradient(180deg,rgba(20,32,46,0) 40%,rgba(20,32,46,.85) 100%),url({copertina_foto()})">
  <div class="cover-box">
    <h1 class="big">Palermo in Trasparenza</h1>
    <p class="lead">Il gemello digitale della città: una guida visiva ai dati aperti di Open Data Sicilia.</p>
    <p class="pill">Ottimizzato per la lettura esplorativa.</p>
  </div>
</div>"""
    if n == 2:
        return f"""<div class="pagina">
<h2>Una nuova lente per leggere lo spazio urbano</h2>
{img(ritaglio(2, (450, 40, 1250, 745)), "foto", "width:640px;align-self:center")}
<p class="testo">Il Digital Twin mette a disposizione di tutti i cittadini una mappa interattiva senza precedenti. Permette di leggere un singolo luogo da molteplici punti di vista simultanei, riunendo dati storici, amministrativi e infrastrutturali in un'unica interfaccia.</p>
<p class="nota">Non è solo una mappa: è l'infrastruttura invisibile della città resa visibile.</p>
</div>"""
    if n == 3:
        return f"""<div class="pagina">
<h2>L'anatomia della piattaforma</h2>
{img(ritaglio(3, (380, 278, 1000, 630)), "foto")}
<ol class="passi">
  <li><b>La Cabina di Regia (Strati)</b><span>Raggruppa i temi sovrapponibili: rilievo, popolazione, territorio, edifici, trasporti e sicurezza. Scegli e accendi i livelli per confrontarli.</span></li>
  <li><b>Il Livello Visivo (Legenda)</b><span>Gli strati attivi compaiono in alto. La legenda in basso traduce i colori in informazioni leggibili sul territorio.</span></li>
  <li><b>L'Analisi di Dettaglio (Scheda)</b><span>Facendo clic su un punto qualsiasi, si apre una scheda laterale che svela tutti i dati intersecati in quella specifica coordinata.</span></li>
</ol></div>"""
    if n == 4:
        return f"""<div class="pagina">
<h2>Dall'intera città al singolo civico</h2>
{img(ritaglio(4, (95, 135, 1300, 735), 1), "foto largo")}
<ol class="passi">
  <li><b>1. La Ricerca Libera</b><span>Cerca direttamente una via, un civico, o una particella catastale dalla barra inferiore.</span></li>
  <li><b>2. I Filtri Geografici</b><span>Restringi il campo d'azione. Seleziona una specifica Circoscrizione, Quartiere, o UPL.</span></li>
  <li><b>3. Il Risultato Mirato</b><span>Un clic sul risultato trasporta immediatamente la visuale sul posto esatto.</span></li>
</ol></div>"""
    if n == 5:
        fonti = [("Comune di Palermo", "Zonizzazione PRG, Uffici, Numeri civici.", AZZURRO, 168),
                 ("Regione Siciliana", "Piano PAI, Censimento Incendi.", VERDE, 278),
                 ("ISTAT", "Dati di censimento e stime della popolazione.", VIOLA, 388),
                 ("Agenzia delle Entrate", "Cartografia catastale e zone OMI.", ORO, 498),
                 ("OpenStreetMap", "Cartografia di base.", ROSSO, 608)]
        righe = "".join(
            f'<li style="--c:{c}">{img(ritaglio(5, (88, y + 14, 152, y + 78)), "icona")}'
            f'<div><b>{e(a)}</b><span>{e(b)}</span></div></li>' for a, b, c, y in fonti)
        return f"""<div class="pagina">
<h2>L'ecosistema dei dati pubblici</h2>
<ul class="fonti">{righe}</ul>
<p class="nota">Tutte le fonti sono dichiarate, trasparenti e consultabili con le relative licenze nella scheda Fonti e avvisi.</p>
</div>"""
    if n == 6:
        righe = [("Urbanistica", "Catasto e PRG", "Particelle, fogli e destinazione d'uso", "Verificare le zone del Piano Regolatore o i confini catastali di un immobile.", AZZURRO, 291),
                 ("Sicurezza", "Hotspot Incidenti", "Aree a concentrazione di incidenti stradali", "Analizzare il livello di rischio pedonale e veicolare di un incrocio.", ROSSO, 407),
                 ("Servizi", "Trasporti e Uffici", "Fermate, linee e uffici comunali", "Trovare l'area competente del Comune e i mezzi pubblici per raggiungerla.", VERDE, 523),
                 ("Rischi", "PAI e Incendi", "Pericolosità idraulica e aree bruciate dal 2007", "Valutare l'esposizione di un terreno a dissesto idrogeologico o incendi.", ORO, 639)]
        voci = "".join(
            f'<li style="--c:{c}"><h3>{img(ritaglio(6, (84, y - 30, 142, y + 30)), "icona")}{e(t)}</h3>'
            f'<dl><dt>Strato Principale</dt><dd>{e(s)}</dd><dt>Cosa Mostra</dt><dd>{e(m)}</dd>'
            f'<dt>Caso d\'Uso Civico</dt><dd class="uso">{e(u)}</dd></dl></li>' for t, s, m, u, c, y in righe)
        return f"""<div class="pagina"><h2>Le lenti a confronto: cosa rivelano i dati</h2><ul class="lenti">{voci}</ul></div>"""
    if n in (7, 8, 9, 10):
        pag, box, titolo, sotto, dettaglio, icona = {
            7: (7, (53, 220, 637, 627), "Monumenti", "Luoghi d'interesse storico e culturale (chiese, teatri, fontane).",
                "Quando possibile, la mappa colora l'intero edificio. La scheda offre foto, descrizioni e collegamenti diretti al Portale del Turismo.", (53, 120, 90, 160)),
            8: (7, (740, 220, 1324, 627), "Uffici Comunali", "Le sedi dell'amministrazione raggruppate sulla mappa.",
                "La scheda svela aree, uffici ospitati, e i relativi responsabili e contatti (quando pubblici).", (738, 120, 778, 160)),
            9: (8, (42, 236, 654, 588), "Rischio Idrogeologico", "Dati ufficiali della Regione Siciliana.",
                "Mostra pericolosità idraulica, geomorfologica ed erosione costiera. Un clic rivela immediatamente la classe di vincolo più grave per l'area.", (50, 122, 98, 170)),
            10: (8, (722, 236, 1334, 588), "Storico Incendi (Dal 2007)", "Censimento Incendi della Regione Siciliana.",
                 "Aree percorse dal fuoco mappate anno per anno. Il colore indica l'annata; la scheda riporta data esatta e tipologia di superficie bruciata.", (728, 120, 770, 172)),
        }[n]
        sezione = "Cultura e Amministrazione" if n < 9 else "Rischi Ambientali"
        generale = ("Esplorare il patrimonio" if n < 9 else "Mappare la vulnerabilità")
        return f"""<div class="pagina">
<p class="sez">{generale}: {sezione}</p>
<h2>{e(titolo)}</h2>
<p class="lead">{e(sotto)}</p>
{img(ritaglio(pag, box), "foto centro")}
<p class="testo"><b>Feature Detail</b><br>{e(dettaglio)}</p>
</div>"""
    if n == 11:
        return f"""<div class="pagina">
<h2>La potenza dell'intersezione: Tutto in un punto</h2>
{img(ritaglio(9, (150, 105, 1300, 650), 1), "foto pieno centro")}
<p class="nota">Un singolo clic non restituisce un solo dato, ma svela la complessa realtà sovrapposta della vita urbana.</p>
</div>"""
    return f"""<div class="pagina">
<h2>Oltre la mappa: Il perimetro di utilizzo</h2>
<p class="nota alto">Catasto, PRG e vincoli sono dati informativi, <b>senza valore legale</b>.</p>
<div class="verdetto">
  <div style="--c:{VERDE}"><h3>{img(ritaglio(10, (82, 258, 188, 372)), "icona grande")}Valore Informativo</h3>
    <p>Il Digital Twin è perfetto per la ricerca, la trasparenza civica, l'analisi urbana e lo studio.</p>
    <p class="corsivo">Nota: I dati del censimento sulla popolazione per edificio sono stime campionarie.</p></div>
  <div style="--c:{ROSSO}"><h3>{img(ritaglio(10, (755, 258, 860, 372)), "icona grande")}Valore Legale</h3>
    <p>Catasto, zonizzazione e vincoli NON sostituiscono visure ufficiali o certificati di destinazione urbanistica.</p>
    <p class="azione"><span>Per usi legali:</span> Visura su SISTER o uffici competenti.</p></div>
</div></div>"""


CSS = f"""
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Instrument+Sans:wght@400;600&display=swap');
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:{L}px;height:{A}px;overflow:hidden;position:relative;background:{GHIACCIO};color:{INK};
 font-family:'Instrument Sans',system-ui,sans-serif;font-size:28px;line-height:1.38}}
h1,h2,h3,.cta b,.passi b,.fonti b,.piede .url{{font-family:'Bricolage Grotesque',sans-serif}}
.pagina{{position:absolute;inset:0;padding:64px 56px 140px;display:flex;flex-direction:column;gap:26px}}
h2{{font-size:58px;line-height:1.04;font-weight:800;letter-spacing:-.025em}}
h3{{font-size:36px;font-weight:800;letter-spacing:-.01em;line-height:1.1}}
.sez{{font-size:24px;font-weight:600;color:{VERDE};margin-bottom:-12px}}
.lead{{font-size:36px;line-height:1.3}}
.testo{{font-size:34px;line-height:1.38}}
.nota{{margin-top:0;font-size:34px;font-weight:600;border-left:8px solid {ORO};padding-left:24px;line-height:1.3}}
.nota.alto{{font-weight:400;font-size:30px;margin-bottom:6px}}
.foto{{display:block;border-radius:14px;box-shadow:0 0 0 2px {INK},10px 10px 0 rgba(20,32,46,.14);width:968px}}
.foto.centro{{margin-top:auto;margin-bottom:auto}}.foto.pieno{{width:1080px;margin-left:-56px;border-radius:0;box-shadow:none}}
.passi{{list-style:none;display:grid;gap:24px}}
.passi li{{display:grid;gap:2px}}
.passi b{{font-size:38px;font-weight:800;line-height:1.1}}
.passi span{{font-size:31px;line-height:1.32}}
.fonti{{list-style:none;display:grid;gap:18px}}
.fonti li{{border-left:12px solid var(--c);background:#fff;padding:24px 26px;border-radius:0 14px 14px 0;
 display:flex;align-items:center;gap:22px}}
.fonti .icona{{width:84px;height:84px;border-radius:8px}}
.fonti b{{font-size:44px;line-height:1.1;display:block}}
.fonti span{{font-size:30px;color:#42505e}}
.lenti{{list-style:none;display:grid;gap:14px}}
.lenti li{{background:#fff;border-radius:16px;padding:16px 26px;border-top:10px solid var(--c)}}
.lenti h3{{display:flex;align-items:center;gap:16px;margin-bottom:4px;font-size:38px}}
.lenti .icona{{width:50px;height:50px}}
.lenti dl{{display:grid;grid-template-columns:230px 1fr;column-gap:18px;row-gap:3px;font-size:25px;line-height:1.28}}
.lenti dt{{color:#8a5a12;font-weight:600}}
.lenti dd.uso{{font-weight:600}}
.verdetto{{display:grid;gap:26px}}
.verdetto>div{{background:#fff;border-radius:18px;padding:38px 36px;border-left:14px solid var(--c);display:grid;gap:14px}}
.verdetto h3{{display:flex;align-items:center;gap:20px;font-size:40px}}
.verdetto .icona{{width:84px;height:84px}}
.verdetto p{{font-size:34px;line-height:1.33}}
.verdetto .corsivo{{font-size:29px;font-style:italic;color:#42505e}}
.azione{{background:{AZZURRO};color:#fff;border-radius:14px;padding:18px 24px;font-weight:600;font-size:30px}}
.azione span{{display:block;font-size:27px;font-weight:400}}
.stack{{position:absolute;left:56px;right:56px;bottom:78px;display:flex;gap:7px;height:12px}}
.stack i{{flex:1;border-radius:6px}}
.piede{{position:absolute;left:56px;right:56px;bottom:30px;display:flex;justify-content:space-between;align-items:baseline}}
.piede .url{{font-weight:800;font-size:25px}}
.piede .quale{{font-size:25px}}
.cover{{position:absolute;inset:0;background-size:cover;background-position:center;color:#fff;padding:0 56px 150px;
 display:flex;flex-direction:column;justify-content:flex-end}}
.big{{font-size:150px;line-height:.9;font-weight:800;letter-spacing:-.04em;margin-bottom:34px;text-shadow:0 4px 30px rgba(0,0,0,.35)}}
.cover .lead{{font-size:38px;color:#fff;max-width:900px;margin-bottom:34px}}
.pill{{align-self:flex-start;font-size:26px;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.55);
 padding:12px 26px;border-radius:14px;backdrop-filter:blur(8px)}}
"""


def pagina(n):
    cover = n == 1
    col = "rgba(255,255,255,.92)" if cover else INK
    return f"""<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><style>{CSS}</style></head><body>
{corpo(n)}
<div class="stack">{pila(n)}</div>
<div class="piede" style="color:{col}"><span class="url">{LINK}</span><span class="quale">{n} / {TOT}</span></div>
</body></html>"""


def main():
    carica(PDF)
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.png"):
        f.unlink()
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={"width": L, "height": A})
        for n in range(1, TOT + 1):
            p.set_content(pagina(n))
            p.evaluate("document.fonts.ready")
            p.wait_for_timeout(400)
            # il contenuto non deve scendere sotto la pila di strati (bottom:78px)
            ingombro = p.evaluate("Math.max(...[...document.querySelectorAll('.pagina>*,.cover-box')].map(x=>x.getBoundingClientRect().bottom))") - (A - 100)
            p.screenshot(path=str(OUT / f"{n:02d}.png"))
            print("ok", n, "overflow" if ingombro > 0 else "", ingombro if ingombro > 0 else "")
        b.close()


if __name__ == "__main__":
    main()
