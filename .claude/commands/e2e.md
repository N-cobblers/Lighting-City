---
description: 建置並跑端對端測試，修正失敗的地方
---
1. 執行 `npm run build`，有型別錯誤先修好。
2. 在背景啟動 `npm run preview -- --port 4173`。
3. 如果還沒裝測試環境：`pip install -r scripts/requirements.txt && python -m playwright install chromium`。
4. 執行 `python scripts/e2e.py`，讀 `scripts/output/` 的截圖確認畫面（手機尺寸 390×844）。
5. 有失敗就找出原因修正，再跑一次，直到「全部通過」。
6. 最後停掉 preview 伺服器，簡短回報改了什麼。
$ARGUMENTS
