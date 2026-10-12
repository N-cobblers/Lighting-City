"""在電腦上檢查車牌辨識模型（與 App 相同的前處理：高 48、BGR、0–1、CTC 解碼）。
用法：python scripts/ocr_check.py [圖片 ...]（預設讀 docs/plates/plate_*.png）
"""
import glob
import os
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, 'public', 'models', 'ch_PP-OCRv4_rec_infer.onnx')
DICT = os.path.join(ROOT, 'public', 'models', 'ppocr_keys_v1.txt')

chars = open(DICT, encoding='utf-8').read().split('\n') + [' ']
sess = ort.InferenceSession(MODEL)
inp = sess.get_inputs()[0].name


def rec(img):
    img = img.convert('RGB')
    h = 48
    w = max(48, min(960, round(img.width * h / img.height)))
    a = np.asarray(img.resize((w, h), Image.BILINEAR), dtype=np.float32) / 255.0
    x = a[:, :, ::-1].transpose(2, 0, 1)[None].copy()
    out = sess.run(None, {inp: x})[0][0]
    idx, prob = out.argmax(1), out.max(1)
    text, ps, prev = '', [], -1
    for i, p in zip(idx, prob):
        if i != 0 and i != prev:
            text += chars[i - 1]
            ps.append(p)
        prev = i
    return text, float(np.mean(ps)) if ps else 0.0


files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, 'docs', 'plates', 'plate_*.png')))
for f in files:
    t, m = rec(Image.open(f))
    print(f'{os.path.basename(f)}\t{t}\t信心 {m:.3f}')
