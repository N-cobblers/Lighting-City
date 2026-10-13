# 3 分鐘方案說明影片：自動錄製與合成

整支影片由程式產生，改旁白或分鏡後可以重跑。成片 2560×1440、30fps、約 2 分 35 秒。所有輸出都在 `scripts/video/out/`，不進 git。

腳本以線上文件為準，`docs/video-script.md` 是副本。

## 做法

- 主角是虛構的小涵，車燈小精靈當主持，有自己的聲音。
- 畫面由 `stage.html` 這個網頁舞台逐格畫出來，再送進 ffmpeg 編碼，包括：
  - 手機位置與推近、三機並排、左右分割對比
  - 數字跳動、文字跟著旁白逐行出現
  - 小精靈序列圖、題目標籤、字幕
- App 畫面是自動操作 App 錄下來的，用瀏覽器層級強制 2.5 倍（975×2110）。
  - 只用 Playwright 的 `device_scale_factor` 模擬的話，CDP 錄下來的畫面只有 1 倍。
- 地圖場景是 OpenFreeMap 夜景加上 App 的真實路線，原生 2560×1440。
  - 錄影時動畫用 0.4 倍速播放，合成時再加快，等效每秒 40 格以上。

## 需要

- Windows，有顯示卡。無頭 Chromium 用顯示卡繪圖才順；軟體繪圖每秒只有約 3 格。
- Python 3.11 以上：`pip install playwright edge-tts pillow`，再執行 `python -m playwright install chromium`。要用完整版 Chromium，不是 headless shell。
- ffmpeg 要在 PATH 裡。
- 專案已經 `npm install`，`scripts/fixtures/camera.y4m` 已經產生（`python scripts/make_fixtures.py`）。
- 網路：OpenFreeMap 圖磚、Google Fonts、微軟語音服務、Internet Archive（下載配樂）。

## 步驟

```bash
# 1. 建置並啟動 App（另開一個視窗）
npm run build && npm run preview -- --port 4173

# 2. 小精靈動作序列（720×720 透明背景）
python scripts/video/sprite/render_sprite.py actions

# 3. 錄 App：小涵的一天、小精靈用工具
python scripts/video/record_story.py
python scripts/video/record_story.py --sections chat --out scripts/video/out/rec/chat

# 4. 地圖場景：封面、痛點、轉折、結尾
python scripts/video/scenes.py cover
python scripts/video/scenes.py hook
python scripts/video/scenes.py turn
python scripts/video/scenes.py ending

# 5. 配音：男聲旁白（YunJhe）與小精靈（曉雨），逐詞時間對字幕
python scripts/video/tts.py

# 6. 時間軸、輸出畫面（約 9 分鐘）、混音、合併
python scripts/video/timeline.py
python scripts/video/render.py scripts/video/out/tl.json scripts/video/out/video.mp4
python scripts/video/mix.py
ffmpeg -i scripts/video/out/video.mp4 -i scripts/video/out/audio.m4a -map 0:v -map 1:a -c copy -shortest -movflags +faststart scripts/video/out/yoxi點燈城_方案說明影片.mp4

# 7. YouTube 縮圖
python scripts/video/thumbnail.py
```

檢查用：

- `render.py ... --stills 12,30,80` 只輸出指定秒數的截圖。
- `sheet.py` 把截圖拼成一張。

## 檔案

| 檔案 | 用途 |
|---|---|
| `script.py` | 旁白與小精靈的台詞，每句拆成字幕段落（字幕用阿拉伯數字，語音用中文數字），以及兩種聲音的設定 |
| `timeline.py` | 依配音秒數排出每個鏡頭（手機、推近、文字、小精靈、標籤）、字幕與音效時間 |
| `stage.html`、`render.py` | 網頁舞台與逐格輸出 |
| `record_story.py` | 自動操作 App 並用 CDP screencast 錄下每一格，記下每個動作的時間點 |
| `scenes.py` | 地圖場景（MapLibre + H3） |
| `tts.py`、`mix.py` | 配音、混音（配樂旁白出現時自動壓低、音效用程式合成） |
| `thumbnail.py` | YouTube 縮圖 |
| `sprite/` | 車燈小精靈的動作序列（模型在 `src/lib/spriteModel.ts`，App 與影片共用） |
| `frames_tool.py`、`grab.py`、`sheet.py` | 錄影畫面轉影片、抽畫面檢查 |

## 注意

- 錄影時天氣自動設成「示範情境：晴天」。下雨情境下 19 點等超過 10 分鐘的機率還有 23%，晚點走的差距出不來。
- AI 內容是示範資料，畫面保留「示範資料」標籤，旁白不說成即時生成。
- 人物與車牌都是虛構的。畫面保留「黑客松原型」標籤與地圖出處（OpenFreeMap、OpenStreetMap）。
- 配樂是 Kevin MacLeod 的〈Funshine〉，FreePD，CC0。
