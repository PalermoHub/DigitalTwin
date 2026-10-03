#!/usr/bin/env python3
"""Quarto carosello social (social/carosello-4/NN.png, 1080x1350): Stile Editoriale Moderno / Digital Atlas.

Design editoriale premium in midnight navy con illuminazione atmosferica, texture cartografica,
visual card espansa ad alta definizione, pin HUD contestuali e strip di metriche reali.

Uso: python scripts/guida_carosello4.py
"""
import base64
import html
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "social" / "carosello-4"
SORGENTI = ROOT / "lavoro" / "carosello"
PASSI_IMG = ROOT / "img" / "guida" / "passi"
LOGO_FILE = ROOT / "img" / "opendatasicilia.png"
LINK = "palermodigitaltwin.opendatasicilia.it"
L, A = 1080, 1350

SLIDES = [
    {
        "copertina": True,
        "kicker": "OPEN DATA SICILIA PRESENTA",
        "categoria": "PIATTAFORMA PUBBLICA",
        "titolo": "DIGITAL TWIN PALERMO",
        "desc": "Tutta la città su una sola mappa interattiva libera: catasto, PRG, edifici 3D, popolazione, monumenti, trasporti e rischi ambientali.",
        "immagine": "cos-e",
        "hud1": "37 Strati Informativi Integrati",
        "hud2": "Dati Aperti & Codice Libero",
        "stat1": ("ACCESSO", "100% Gratuito"),
        "stat2": ("PIATTAFORMA", "Senza Registrazione"),
        "stat3": ("FONTI", "6 Enti Ufficiali"),
        "swipe": "Inizia la guida ➔",
    },
    {
        "categoria": "01 · PANORAMICA GENERALE",
        "titolo": "Cos'è il Digital Twin?",
        "desc": "Una piattaforma partecipata per leggere Palermo da ogni punto di vista, unificando banche dati che prima erano frammentate.",
        "immagine": "cos-e",
        "hud1": "Visuale Generale della Città",
        "hud2": "Interrogazione Spaziale Istantanea",
        "stat1": ("MOTORE", "MapLibre GPU 2D/3D"),
        "stat2": ("COPERTURA", "Intero Comune"),
        "stat3": ("DESTINATARI", "Cittadini & Tecnici"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "02 · TRASPARENZA TOTALE",
        "titolo": "Solo Dati Aperti e Verificati",
        "desc": "Ogni informazione cita la fonte d'origine, con data di rilascio e licenza d'uso. Nessun dato inventato o proprietario.",
        "immagine": "dati",
        "hud1": "Comune, AMAT, ISTAT, Regione",
        "hud2": "Licenze Aperte CC BY & IODL",
        "stat1": ("CATALOGO", "Metadati & Date"),
        "stat2": ("MAPPA BASE", "OpenStreetMap"),
        "stat3": ("FORMATO", "PMTiles & GeoJSON"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "03 · LIVELLI TEMATICI",
        "titolo": "Accendi e Sovrapponi i Temi",
        "desc": "La barra laterale organizza tutti gli strati tematici. Puoi accenderne più d'uno per confrontare catasto, edifici e pianificazione.",
        "immagine": "strati",
        "hud1": "Menu Laterale Raggruppato",
        "hud2": "Legenda Dinamica in Tempo Reale",
        "stat1": ("MACRO-TEMI", "Territorio · Rischio · Edifici"),
        "stat2": ("RICERCA", "Filtro Rapido Strati"),
        "stat3": ("LAYOUT", "Responsive Touch"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "04 · INTERAZIONE DIRETTA",
        "titolo": "Tocca un Punto: Ecco la Scheda",
        "desc": "Fai clic o tocca qualsiasi luogo da smartphone: il punto viene evidenziato ed esegue una query su tutti i livelli sottostanti.",
        "immagine": "clic",
        "hud1": "Punto Selezionato: Via Maqueda",
        "hud2": "Query Spaziale Multi-Layer",
        "stat1": ("INTERAZIONE", "1 Clic sul Punto"),
        "stat2": ("RISPOSTA", "Istantanea Real-Time"),
        "stat3": ("DISPOSITIVI", "Desktop & Mobile"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "05 · SCHEDA DEL LUOGO",
        "titolo": "Cosa si Legge nella Scheda?",
        "desc": "Una scheda divisa in sezioni: particella catastale, zonizzazione PRG, vincoli, quotazioni OMI, fermate bus e censimento ISTAT.",
        "immagine": "scheda",
        "hud1": "Foglio & Particella con Link SISTER",
        "hud2": "Quotazioni OMI (€/mq) e PRG",
        "stat1": ("CATASTO", "Foglio 128 · P. 180"),
        "stat2": ("PRG 2004", "Zona A Centro Storico"),
        "stat3": ("VALORI OMI", "Quotazioni Min / Max"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "06 · PATRIMONIO CULTURALE",
        "titolo": "Oltre 4.000 Luoghi Storici",
        "desc": "Chiese, oratori, palazzi nobiliari, teatri e fontane. Clicca su un monumento per vederne foto, descrizione e collegamento storico.",
        "immagine": "monumenti",
        "hud1": "Teatro Massimo (Palermo)",
        "hud2": "Descrizione & Portale Turismo",
        "stat1": ("MONUMENTI", "4.039 Luoghi Mappati"),
        "stat2": ("EDIFICI", "Sagome Evidenziate"),
        "stat3": ("SCHEDE", "Foto & Cenni Storici"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "07 · SERVIZI MUNICIPALI",
        "titolo": "81 Sedi Comunali Mappate",
        "desc": "Localizza assessorati, circoscrizioni e servizi. La scheda di ogni sede elenca le aree ospitate, dirigenti responsabili e contatti.",
        "immagine": "uffici",
        "hud1": "Palazzo Palagonia · Uffici",
        "hud2": "Dirigenti, Telefoni & E-mail",
        "stat1": ("SEDI", "81 Presidi sul Territorio"),
        "stat2": ("UFFICI", "605 Uffici Censiti"),
        "stat3": ("CONTATTI", "Orari & Responsabili"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "08 · DIFESA DEL SUOLO",
        "titolo": "Rischio Idraulico e Frane (PAI)",
        "desc": "La cartografia ufficiale del Piano di Assetto Idrogeologico regionale: scopri la pericolosità e il rischio con la legenda ufficiale.",
        "immagine": "pai",
        "hud1": "Piano PAI · Regione Siciliana",
        "hud2": "Pericolosità e Rischio P1→P4",
        "stat1": ("RISCHIO IDRAULICO", "Allagamenti & Fiumi"),
        "stat2": ("GEOMORFOLOGICO", "Frane & Scarpate"),
        "stat3": ("VALUTAZIONE", "Classe Più Grave"),
        "swipe": "Scorri ➔",
    },
    {
        "categoria": "09 · AMBIENTE & SICUREZZA",
        "titolo": "18 Anni di Incendi Mappati",
        "desc": "La serie storica del Censimento Incendi della Regione Siciliana dal 2007 al 2024: perimetro, data, ettari boscati e squadre intervenute.",
        "immagine": "incendi",
        "hud1": "Censimento Incendi · 2007-2024",
        "hud2": "Bellolampo, Pellegrino, Caputo...",
        "stat1": ("SERIE STORICA", "2007 ➔ 2024"),
        "stat2": ("DETTAGLIO", "Superficie Bruciata (ha)"),
        "stat3": ("INTERVENTI", "Squadre Antincendio"),
        "swipe": "Scorri ➔",
    },
    {
        "chiusura": True,
        "kicker": "OPEN DATA SICILIA",
        "categoria": "INIZIA SUBITO",
        "titolo": "PALERMO È NELLE TUE MANI",
        "desc": "Uno strumento gratuito e indipendente per dare a tutti i cittadini la conoscenza del proprio territorio. Inizia a esplorare adesso!",
        "immagine": "filtri",
        "hud1": "palermodigitaltwin.opendatasicilia.it",
        "hud2": "Open Data Sicilia Community",
        "stat1": ("LICENZA DATI", "CC BY 4.0"),
        "stat2": ("CODICE SORGENTE", "EUPL-1.2 Libero"),
        "stat3": ("VALORE", "Puramente Informativo"),
        "swipe": "Apri la WebApp ➔",
    },
]


def _uri(percorso: Path) -> str:
    tipo = "image/webp" if percorso.suffix == ".webp" else "image/png"
    return f"data:{tipo};base64," + base64.b64encode(percorso.read_bytes()).decode()


def _ottieni_immagine(id_img: str) -> str:
    png = SORGENTI / f"{id_img}.png"
    if png.exists():
        return _uri(png)
    webp = PASSI_IMG / f"{id_img}.webp"
    if webp.exists():
        return _uri(webp)
    sys.exit(f"Immagine non trovata per {id_img}")


def html_slide(slide, n, tot, logo_uri):
    e = html.escape
    img_src = _ottieni_immagine(slide["immagine"])
    prog_steps = "".join(f'<div class="progress-seg{" on" if i < n else ""}"></div>' for i in range(tot))

    s1_lbl, s1_val = slide["stat1"]
    s2_lbl, s2_val = slide["stat2"]
    s3_lbl, s3_val = slide["stat3"]

    is_copertina = slide.get("copertina", False)
    is_chiusura = slide.get("chiusura", False)

    if is_copertina:
        title_html = f'''
        <div class="kicker-glow">{e(slide["kicker"])}</div>
        <h1 class="hero-title">{e(slide["titolo"])}</h1>
        <p class="subtitle hero-sub">{e(slide["desc"])}</p>
        '''
    elif is_chiusura:
        title_html = f'''
        <div class="kicker-glow">{e(slide["kicker"])}</div>
        <h1 class="hero-title">{e(slide["titolo"])}</h1>
        <p class="subtitle hero-sub">{e(slide["desc"])}</p>
        '''
    else:
        title_html = f'''
        <div class="badge-category">{e(slide["categoria"])}</div>
        <h1>{e(slide["titolo"])}</h1>
        <p class="subtitle">{e(slide["desc"])}</p>
        '''

    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  width: {L}px; height: {A}px; overflow: hidden; position: relative;
  background: #060913;
  color: #fff; font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
}}

/* Ambient Lighting & Depth */
.bg-glow {{
  position: absolute; inset: 0; pointer-events: none;
  background: 
    radial-gradient(circle at 85% 15%, rgba(245, 166, 35, 0.22) 0%, transparent 50%),
    radial-gradient(circle at 10% 80%, rgba(34, 197, 94, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.10) 0%, transparent 60%);
}}

.grid-overlay {{
  position: absolute; inset: 0; opacity: 0.10; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px);
  background-size: 60px 60px;
}}

.container {{
  position: relative; z-index: 2; width: {L}px; height: {A}px;
  padding: 48px 56px 40px; display: flex; flex-direction: column; justify-content: space-between;
}}

/* Top Navigation */
.top-meta {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }}
.brand-pill {{
  display: flex; align-items: center; gap: 12px;
  background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 8px 20px; border-radius: 40px; backdrop-filter: blur(12px);
}}
.brand-pill img {{ width: 22px; height: 25px; }}
.brand-pill span {{ font-size: 16px; font-weight: 800; letter-spacing: 0.12em; color: #f5a623; text-transform: uppercase; }}

.step-indicator {{
  font-size: 17px; font-weight: 800; letter-spacing: 0.15em; color: #94a3b8;
  background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.10);
  padding: 8px 20px; border-radius: 40px;
}}
.step-indicator b {{ color: #ffffff; }}

/* Progress Tracker */
.progress-track {{ display: flex; gap: 7px; width: 100%; margin-bottom: 24px; }}
.progress-seg {{ flex: 1; height: 5px; border-radius: 4px; background: rgba(255, 255, 255, 0.12); }}
.progress-seg.on {{ background: #f5a623; box-shadow: 0 0 12px rgba(245, 166, 35, 0.9); }}

/* Headline */
.headline-box {{ margin-bottom: 24px; }}
.kicker-glow {{
  font-size: 17px; font-weight: 900; letter-spacing: 0.28em; text-transform: uppercase;
  color: #f5a623; text-shadow: 0 0 16px rgba(245, 166, 35, 0.6); margin-bottom: 10px;
}}
.badge-category {{
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
  color: #38bdf8; margin-bottom: 10px;
}}
.badge-category::before {{ content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }}

h1 {{
  font-size: 54px; font-weight: 900; line-height: 1.12; letter-spacing: -0.03em;
  color: #ffffff; margin-bottom: 12px;
}}
h1.hero-title {{
  font-size: 68px; letter-spacing: -0.04em;
  background: linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}}
.subtitle {{
  font-size: 24px; line-height: 1.40; color: #cbd5e1; font-weight: 500; max-width: 920px;
}}
.subtitle.hero-sub {{
  font-size: 26px; color: #e2e8f0; font-weight: 600;
}}

/* Visual Canvas Frame */
.visual-wrapper {{
  position: relative; width: 968px; height: 600px; margin-bottom: 24px;
}}
.visual-card {{
  width: 100%; height: 100%; border-radius: 28px; overflow: hidden; position: relative;
  background: #0d1222; border: 1.5px solid rgba(255, 255, 255, 0.20);
  box-shadow: 
    0 35px 90px -15px rgba(0, 0, 0, 0.95),
    0 0 60px -10px rgba(245, 166, 35, 0.28);
}}
.visual-card img {{
  width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;
}}

/* HUD Floating Pins */
.hud-tag {{
  position: absolute; z-index: 10;
  display: flex; align-items: center; gap: 10px;
  background: rgba(8, 12, 24, 0.92); backdrop-filter: blur(16px);
  border: 1.5px solid rgba(245, 166, 35, 0.7);
  padding: 11px 22px; border-radius: 30px;
  box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 24px rgba(245, 166, 35, 0.35);
  font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: 0.02em;
}}
.hud-dot {{
  width: 10px; height: 10px; border-radius: 50%; background: #f5a623;
  box-shadow: 0 0 12px #f5a623;
}}
.hud-tag.pos-top {{ right: 28px; top: 32px; }}
.hud-tag.pos-bottom {{ left: 28px; bottom: 28px; }}

/* Stats Strip */
.stats-strip {{
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;
}}
.stat-card {{
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 20px; padding: 18px 22px; backdrop-filter: blur(10px);
}}
.stat-card .label {{
  font-size: 13px; font-weight: 800; color: #94a3b8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px;
}}
.stat-card .value {{
  font-size: 22px; font-weight: 900; color: #f8fafc; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}}
.stat-card .value b {{ color: #f5a623; }}

/* Footer Bar */
.footer {{
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.12); padding-top: 22px;
}}
.url-label {{ font-size: 22px; font-weight: 800; color: #38bdf8; letter-spacing: 0.02em; }}
.swipe-callout {{
  display: flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, #f5a623 0%, #ea580c 100%);
  color: #070b14; font-size: 19px; font-weight: 900; letter-spacing: 0.04em;
  padding: 12px 28px; border-radius: 40px; box-shadow: 0 10px 25px rgba(245, 166, 35, 0.45);
}}
</style>
</head>
<body>
<div class="bg-glow"></div>
<div class="grid-overlay"></div>

<div class="container">
  <div>
    <div class="progress-track">{prog_steps}</div>
    
    <div class="top-meta">
      <div class="brand-pill">
        <img src="{logo_uri}" alt="">
        <span>Digital Twin Palermo</span>
      </div>
      <div class="step-indicator">SLIDE <b>{n:02d}</b> / {tot:02d}</div>
    </div>

    <div class="headline-box">
      {title_html}
    </div>

    <div class="visual-wrapper">
      <div class="visual-card">
        <img src="{img_src}" alt="">
      </div>
      <div class="hud-tag pos-top">
        <div class="hud-dot"></div>
        <span>{e(slide["hud1"])}</span>
      </div>
      <div class="hud-tag pos-bottom">
        <div class="hud-dot"></div>
        <span>{e(slide["hud2"])}</span>
      </div>
    </div>

    <div class="stats-strip">
      <div class="stat-card">
        <div class="label">{e(s1_lbl)}</div>
        <div class="value">{e(s1_val)}</div>
      </div>
      <div class="stat-card">
        <div class="label">{e(s2_lbl)}</div>
        <div class="value">{e(s2_val)}</div>
      </div>
      <div class="stat-card">
        <div class="label">{e(s3_lbl)}</div>
        <div class="value">{e(s3_val)}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="url-label">{LINK}</div>
    <div class="swipe-callout">{e(slide["swipe"])}</div>
  </div>
</div>
</body>
</html>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    logo_uri = _uri(LOGO_FILE)
    tot = len(SLIDES)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": L, "height": A}, device_scale_factor=1)

        for i, s in enumerate(SLIDES, 1):
            h = html_slide(s, i, tot, logo_uri)
            page.set_content(h)
            page.wait_for_timeout(250)
            out_path = OUT / f"{i:02d}.png"
            page.screenshot(path=str(out_path))
            print("ok", f"{i:02d}", s["titolo"])

        browser.close()
    print(f"Completato! Generate {tot} slide in {OUT}")


if __name__ == "__main__":
    main()
