"""Converte i font Montserrat dell'app (woff2) in TTF per i sottotitoli: scrive assets/fonts/Montserrat-*.ttf."""
import os
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(HERE, "..", "css", "fonts")
dst = os.path.join(HERE, "assets", "fonts"); os.makedirs(dst, exist_ok=True)
for nome in ("Bold", "SemiBold", "Medium"):
    f = TTFont(os.path.join(src, f"montserrat-{nome}.woff2")); f.flavor = None
    f.save(os.path.join(dst, f"Montserrat-{nome}.ttf"))
print("font pronti in", dst)
