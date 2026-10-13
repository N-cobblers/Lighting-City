"""把多張截圖拼成一張檢查圖：python sheet.py <out.jpg> <cols> <tile寬> img1 img2 ..."""
import sys

from PIL import Image, ImageDraw

out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
th = round(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (0, 0, 0))
for i, (im, f) in enumerate(zip(ims, files)):
    tile = im.resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(tile, (x, y))
    d = ImageDraw.Draw(sheet)
    label = f.split('still_')[-1].replace('.jpg', '') if 'still_' in f else str(i)
    d.rectangle([x, y, x + 70, y + 22], fill=(0, 0, 0))
    d.text((x + 4, y + 4), label, fill=(255, 255, 0))
sheet.save(out, quality=90)
print(out)
