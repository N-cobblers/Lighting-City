"""解壓 yoxi 競賽資料（7z）到 data/extracted/yoxi/。
用法：python scripts/00_extract_7z.py [7z 檔路徑]（預設找 data/raw/ 底下第一個 .7z）
"""
import sys, os, glob, shutil, py7zr
src = sys.argv[1] if len(sys.argv) > 1 else (sorted(glob.glob('data/raw/*.7z')) or [None])[0]
if not src:
    sys.exit('找不到 7z 檔：請放到 data/raw/ 或在參數指定路徑')
dst = 'data/extracted'
os.makedirs(dst, exist_ok=True)
with py7zr.SevenZipFile(src, 'r') as z:
    for n in z.getnames():
        assert not n.startswith('/') and '..' not in n.split('/'), n
    z.extractall(path=dst)
# 原始資料夾名稱很長，統一改成 yoxi/
for d in os.listdir(dst):
    p = os.path.join(dst, d)
    if os.path.isdir(p) and d != 'yoxi' and any(f.endswith('.csv') for f in os.listdir(p)):
        if os.path.exists(os.path.join(dst, 'yoxi')):
            shutil.rmtree(os.path.join(dst, 'yoxi'))
        os.rename(p, os.path.join(dst, 'yoxi'))
print('完成：', os.listdir(os.path.join(dst, 'yoxi')))
