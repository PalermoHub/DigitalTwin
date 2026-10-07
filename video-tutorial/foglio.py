import sys, glob, os
from PIL import Image, ImageDraw
ids = sys.argv[2:]
out = sys.argv[1]
W,H=800,450
cols=2; rows=(len(ids)+cols-1)//cols
sheet=Image.new("RGB",(W*cols,H*rows),"#222")
for i,s in enumerate(ids):
    f=f"out/shots/{s}.png"
    if not os.path.exists(f): continue
    im=Image.open(f).convert("RGB").resize((W,H))
    ImageDraw.Draw(im).rectangle((0,0,230,22),fill="#000"); ImageDraw.Draw(im).text((6,4),s,fill="#fff")
    sheet.paste(im,((i%cols)*W,(i//cols)*H))
sheet.save(out)
