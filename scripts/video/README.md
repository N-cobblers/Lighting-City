# 3 分鐘方案說明影片：自動錄製與合成

整支影片由程式產生，改旁白或分鏡後可以重跑。成片是 1920×1080、30fps、約 2 分 52 秒的 MP4。所有輸出都在 `scripts/video/out/`（不進 git）。

腳本與分鏡以線上文件為準，`docs/video-script.md` 是副本。

## 需要

- Windows，有顯示卡。無頭 Chromium 用顯示卡繪圖，地圖動畫才順；軟體繪圖每秒只有約 3 格。
- Python 3.11 以上：`pip install playwright edge-tts`，並執行 `python -m playwright install chromium`（用完整版 Chromium，不是 headless shell）。
- ffmpeg 要在 PATH 裡。
- 專案已經 `npm install`，`scripts/fixtures/camera.y4m` 已產生（`python scripts/make_fixtures.py`）。
- 網路：OpenFreeMap 圖磚、Google Fonts、微軟語音服務、Internet Archive（下載配樂）。

## 步驟

```bash
# 1. 建置並啟動 App（另開一個視窗）
npm run build && npm run preview -- --port 4173

# 2. 錄 App 畫面：小涵的一天（約 2 分鐘），和小精靈用工具那段
python scripts/video/record_story.py
python scripts/video/record_story.py --sections chat --out scripts/video/out/rec/chat
python scripts/video/frames_tool.py video scripts/video/out/rec/story
python scripts/video/frames_tool.py video scripts/video/out/rec/chat

# 3. 旁白：微軟 edge-tts 台灣男聲（YunJhe），語速 -5%，同時算出每段字幕的時間
python scripts/video/tts_build.py -5%

# 4. 開場、結尾：台北夜景地圖，App 的真實路線一格格亮起
python scripts/video/record_scene.py opening
python scripts/video/frames_tool.py video scripts/video/out/rec/opening
python scripts/video/record_scene.py ending
python scripts/video/frames_tool.py video scripts/video/out/rec/ending

# 5. 合成：右側重點、字幕、淡入淡出、旁白、配樂、音效
python scripts/video/compose.py all
```

成片在 `scripts/video/out/yoxi點燈城_方案說明影片.mp4`。

## 檔案

| 檔案 | 用途 |
|---|---|
| `script_data.py` | 旁白：每句拆成字幕段落（字幕用阿拉伯數字，語音用中文數字） |
| `timeline.py` | 每句旁白開始的秒數與句間停頓 |
| `shots.py` | 分鏡：每個場景用哪段錄影、右側重點、題目標籤 |
| `record_story.py` | 自動操作 App 並用 CDP screencast 錄下每一格，記下每個動作的時間點 |
| `record_scene.py`、`scenes/scene_template.html` | 開場、結尾的城市地圖場景（MapLibre + H3） |
| `compose.py`、`panel_template.html` | 合成成片 |
| `frames_tool.py`、`grab.py` | 錄影畫面轉影片、抽畫面檢查 |

## 注意

- 錄影時天氣自動設成「示範情境：晴天」。下雨情境下 19 點等超過 10 分鐘的機率還有 23%，晚點走的差距出不來。
- AI 內容是示範資料，畫面保留「示範資料」標籤，旁白不說成即時生成。
- 人物與車牌都是虛構的；畫面保留「黑客松原型」標籤與地圖出處（OpenFreeMap、OpenStreetMap）。
- 配樂是 Kevin MacLeod 的〈City Sunshine〉，FreePD 公共領域。`compose.py` 會從 Internet Archive 下載。
