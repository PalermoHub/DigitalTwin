"""Miniature YouTube 1280x720 dei tre video: sfondo dell'app sfocato, titolo grande, elenco e riquadro con la schermata vera.
Sorgenti in miniature/sorgenti (schermate pulite dell'app, ricavate con registra.py in modalita' FAST + SHOTS).
Scrive miniature/miniatura-1-guida-generale.jpg, -2-plugin-rndt.jpg, -3-geoimage.jpg  (python miniature.py)"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); F = f"{HERE}/assets/fonts"; S = f"{HERE}/miniature/sorgenti"
ARANCIO, BIANCO, CIANO, NOTTE = (245, 166, 35), (255, 255, 255), (127, 220, 255), (20, 27, 40)
font = lambda w, n: ImageFont.truetype(f"{F}/Montserrat-{w}.ttf", n)
SCHEDE = [
    ("miniatura-1-guida-generale", "pulito_guida.png", None, "GUIDA GENERALE  ·  1/3", "DIGITAL TWIN", "PALERMO",
     ["Strati, filtri e ricerca", "Un clic: la scheda del luogo", "Mappe storiche e telefono"]),
    ("miniatura-2-plugin-rndt", "f_566.png", (213, 0, 1920, 960), "PLUGIN RNDT  ·  2/3", "CATALOGO", "NAZIONALE",
     ["Cerca nel catalogo ufficiale", "Aggiungi servizi WMS e WFS", "Interroga i layer con un clic"]),
    ("miniatura-3-geoimage", "pulito_geoimage.png", None, "GEOIMAGE  ·  3/3", "MAPPE", "STORICHE",
     ["Carica la pianta del 1891", "Punti di controllo (GCP)", "Esporta KMZ e GeoTIFF"]),
]
def scheda(nome, src, box, kicker, t1, t2, punti):
    sorg = Image.open(f"{S}/{src}").convert("RGB")
    if box: sorg = sorg.crop(box)
    bg = sorg.resize((1280, 720), Image.LANCZOS).filter(ImageFilter.GaussianBlur(7))
    velo = Image.new("L", (1280, 720), 0); dv = ImageDraw.Draw(velo)
    for x in range(1280):
        dv.line([(x, 0), (x, 720)], fill=int(245 * max(0.0, 1 - x / 1050) ** 1.3))
    im = Image.composite(Image.new("RGB", (1280, 720), NOTTE), bg, velo)
    d = ImageDraw.Draw(im)
    d.text((60, 70), kicker, font=font("Bold", 36), fill=CIANO)
    d.text((56, 122), t1, font=font("Bold", 112), fill=BIANCO)
    d.text((56, 232), t2, font=font("Bold", 112), fill=ARANCIO)
    d.rectangle((60, 362, 200, 369), fill=ARANCIO)
    y = 398
    for p in punti:
        d.text((60, y), "•", font=font("Bold", 36), fill=BIANCO)
        d.text((100, y), p, font=font("Bold", 36), fill=BIANCO); y += 58
    d.text((60, 664), "OPEN DATA SICILIA", font=font("Bold", 27), fill=ARANCIO)
    x0, y0, w, h = 726, 392, 520, 292
    d.rectangle((x0 - 8, y0 - 8, x0 + w + 7, y0 + h + 7), fill=ARANCIO)
    im.paste(sorg.resize((w, h), Image.LANCZOS), (x0, y0))
    im.save(f"{HERE}/miniature/{nome}.jpg", quality=93, optimize=True)
os.makedirs(f"{HERE}/miniature", exist_ok=True)
for s in SCHEDE: scheda(*s); print("ok", s[0])
