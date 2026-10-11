"""Terreno 3D del reel «strati esplosi» come plastico a gradoni: legge i tile Terrarium del DTM dell'app
(tileset terrain-dem del catalogo), li ritaglia sulla vista di strati.json e scrive una fetta per quota in
img/strati-3d/terreno-<n>.webp, con ombreggiatura e tinta ipsometrica; l'elenco (file e quota) va in terreno.json.
Uso: python3 scripts/social/terreno-gradoni.py"""
import io, json, math, os, urllib.request
import numpy as np
from PIL import Image

qui = os.path.dirname(os.path.abspath(__file__))
radice = os.path.join(qui, "../..")
uscita = os.path.join(radice, "img/strati-3d")
os.makedirs(uscita, exist_ok=True)
conf = json.load(open(os.path.join(radice, "img/strati-3d/strati.json")))
catalogo = json.load(open(os.path.join(radice, "dati/catalogo.json")))
URL = next(v["url"] for v in catalogo if v.get("id") == "terrain-dem")
LATO, (LON, LAT), ZOOM = conf["lato"], conf["vista"]["center"], conf["vista"]["zoom"]
Z = 14                                    # zoom dei tile da 256 px (la mappa usa tile da 512: zoom + 1)
QUOTE = [0, 10, 25, 45, 70, 100, 140, 190, 250, 320, 400, 490]   # gradoni in metri: fitti in pianura, larghi sul monte

def mercatore(lon, lat, z):          # pixel globali, tile da 256
    n = 256 * 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y

# la vista in pixel a zoom Z: la mappa è LATO px a zoom ZOOM (tile da 512) → a Z sono LATO * 2^(Z - ZOOM - 1)
cx, cy = mercatore(LON, LAT, Z)
mezzo = LATO / 2 * 2 ** (Z - ZOOM - 1)
x0, y0, x1, y1 = cx - mezzo, cy - mezzo, cx + mezzo, cy + mezzo
tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
mosaico = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), dtype=np.float32)
for ty in range(ty0, ty1 + 1):
    for tx in range(tx0, tx1 + 1):
        url = URL.replace("{z}", str(Z)).replace("{x}", str(tx)).replace("{y}", str(ty))
        try:
            a = np.asarray(Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=30).read())).convert("RGB"), dtype=np.float32)
            h = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
        except Exception:
            h = np.zeros((256, 256), np.float32)       # tile mancante: mare
        mosaico[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = h
ritaglio = (x0 - tx0 * 256, y0 - ty0 * 256, x1 - tx0 * 256, y1 - ty0 * 256)
im = Image.fromarray(mosaico, mode="F").resize((LATO, LATO), Image.BILINEAR, box=ritaglio)
h = np.asarray(im, dtype=np.float32)
terra = h > 0.5
print(f"quota massima {h.max():.0f} m, terra {terra.mean() * 100:.0f}%")

# ombreggiatura (luce da nord-ovest) con il rilievo esagerato
passo = 2 * mezzo * 40075016 * math.cos(math.radians(LAT)) / (256 * 2 ** Z) / LATO   # metri per pixel
gy, gx = np.gradient(h * 2.0, passo)
pend = np.arctan(np.hypot(gx, gy)); asp = np.arctan2(-gx, gy)
az, alt = math.radians(315), math.radians(40)
ombra = np.clip(np.sin(alt) * np.cos(pend) + np.cos(alt) * np.sin(pend) * np.cos(az - asp), 0, 1)
# tinta ipsometrica: verde scuro in pianura, ocra a mezza costa, pietra chiara in cima
TINTE = [(0, (52, 78, 66)), (40, (86, 108, 76)), (120, (150, 140, 96)), (260, (186, 160, 120)), (420, (214, 204, 186)), (600, (240, 236, 228))]

elenco = []
for n, q in enumerate(QUOTE):
    sopra = terra & (h >= q)
    if sopra.mean() < 0.0005:
        break
    banda = np.minimum(h, QUOTE[n + 1] if n + 1 < len(QUOTE) else 1e9)
    rgb = np.stack([np.interp(banda, [t for t, _ in TINTE], [c[i] for _, c in TINTE]) for i in range(3)], -1)
    rgb *= (.55 + .6 * ombra)[..., None]
    rgba = np.dstack([np.clip(rgb, 0, 255), sopra * 255]).astype(np.uint8)
    file = f"terreno-{n}.webp"
    Image.fromarray(rgba, "RGBA").save(os.path.join(uscita, file), quality=84, method=6)
    elenco.append({"file": file, "quota": q})
json.dump(elenco, open(os.path.join(uscita, "terreno.json"), "w"), indent=1)
print("ok", len(elenco), "gradoni")
