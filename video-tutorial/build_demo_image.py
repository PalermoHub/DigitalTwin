"""Costruisce assets/pianta_1891_demo.png: la carta del 1891 (Harvard Map Collection, via MapWarper) ricavata dalle tessere,
poi ruotata e traslata come una scansione non georeferenziata. Scrive anche assets/pianta_1891_demo.json con i punti di controllo."""
import io, json, math, os, requests
from PIL import Image, ImageDraw, ImageFilter

Z = 16
LON0, LON1, LAT0, LAT1 = 13.3440, 13.3800, 38.1000, 38.1300     # area del centro storico
ROT = 11.0                                                       # gradi (antiorario)
S = 0.92                                                         # scala della scansione rispetto al mosaico

def tile_xy(lng, lat, z=Z):
    n = 2 ** z
    x = (lng + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

x0, y1 = tile_xy(LON0, LAT0); x1, y0 = tile_xy(LON1, LAT1)
tx0, tx1, ty0, ty1 = int(x0), int(x1), int(y0), int(y1)
W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
mos = Image.new("RGBA", (W, H), (233, 223, 200, 255))
for tx in range(tx0, tx1 + 1):
    for ty in range(ty0, ty1 + 1):
        r = requests.get(f"https://mapwarper.net/maps/tile/60209/{Z}/{tx}/{ty}.png", timeout=60)
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("image"):
            t = Image.open(io.BytesIO(r.content)).convert("RGBA")
            mos.alpha_composite(t, ((tx - tx0) * 256, (ty - ty0) * 256))
print("mosaico", mos.size)
# carta ingiallita
carta = Image.new("RGBA", mos.size, (236, 226, 202, 255)); carta.alpha_composite(mos)
carta = carta.convert("RGB")
# scansione: rotazione + margini di carta
cw = int(W * 1.18); ch = int(H * 1.18)
fondo = Image.new("RGB", (cw, ch), (222, 214, 196))
sc = carta.resize((int(W * S), int(H * S)), Image.LANCZOS)
rot = sc.rotate(ROT, resample=Image.BICUBIC, expand=True, fillcolor=(222, 214, 196))
ox, oy = (cw - rot.width) // 2, (ch - rot.height) // 2
fondo.paste(rot, (max(ox, 0), max(oy, 0)))
ImageDraw.Draw(fondo).rectangle((8, 8, cw - 9, ch - 9), outline=(150, 135, 105), width=6)
fondo = fondo.filter(ImageFilter.GaussianBlur(0.6))
os.makedirs("assets", exist_ok=True)
fondo.save("assets/pianta_1891_demo.png")
print("immagine", fondo.size)

def to_img(lng, lat):
    px, py = tile_xy(lng, lat)
    mx, my = (px - tx0) * 256, (py - ty0) * 256            # pixel nel mosaico
    sx, sy = mx * S, my * S                                 # scala
    cx, cy = sc.width / 2, sc.height / 2
    a = math.radians(ROT)                                   # rotazione antioraria in coordinate immagine (y in giù)
    dx, dy = sx - cx, sy - cy
    rx = dx * math.cos(a) + dy * math.sin(a)
    ry = -dx * math.sin(a) + dy * math.cos(a)
    return rx + rot.width / 2 + max(ox, 0), ry + rot.height / 2 + max(oy, 0)

PUNTI = {
    "Teatro Massimo": (13.35720, 38.12017),
    "Piazza Marina": (13.36680, 38.11880),   # a nord-est e dentro la vista; il centro dell immagine (maniglia di spostamento) intercetterebbe il clic
    "Porta Nuova": (13.35250, 38.11130),
    "Stazione Centrale": (13.36680, 38.10930),
}
out = {"size": fondo.size, "punti": {k: dict(lng=v[0], lat=v[1], px=to_img(*v)) for k, v in PUNTI.items()}}
json.dump(out, open("assets/pianta_1891_demo.json", "w"), indent=1)
print(json.dumps(out["punti"], indent=1))
