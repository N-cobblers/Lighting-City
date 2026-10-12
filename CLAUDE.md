# yoxi 點燈城（2026 和泰 AI 黑客松・yoxi 題目）

給 Claude Code 的專案說明。回覆與 UI 文案一律用**繁體中文（台灣用語）**。

## 一句話

叫車 App 只有要出門時才被打開。「yoxi 點燈城」是 yoxi App 裡的新分頁：城市一開始是夜色，搭 yoxi 會點亮整條路線，完成每天的 AI 情境任務會點亮街區（H3 六角格）；路上遇到 yoxi 車可以拍車牌召喚「車燈小精靈」，和朋友比誰的車牌加總最接近今日幸運數字。背後的「需求預測導流」把任務與限時乘車金排進空車多的低谷時段，讓乘客和司機雙邊受惠。

題目：yoxi「不搭車，也打開 yoxi —— 打造高頻互動的 AI 出行夥伴」。

## 重要日期

| 日期 | 事項 |
|---|---|
| 10/14（三）13:00 | 初賽截止：提案 PDF（官方模板，≤15 頁）＋ 3 分鐘 YouTube 不公開影片連結 |
| 10/28（三） | 公布 15 隊決賽名單 |
| 11/07（六） | 決賽工作坊（隊員過半必須出席） |
| 11/18（三）23:59 | 決賽簡報 PDF（≤30 頁） |
| 11/21（六） | 決賽現場 demo。評分：可行性 25%、AI 整合度 20%、商業價值 20%、原型完成度 20%、簡報表現 15% |

初賽評分：題目契合度 30%、創意性 25%、可行性 25%、AI 整合度 20%。

## 目前狀態（2026/10/12）

- 手機網頁原型（React + Vite + TypeScript）已完成，`npm run build` 可建置，`scripts/e2e.py` 在無頭 Chromium（手機尺寸、假相機）跑過全部流程。
- **還沒在真機驗證**：Gemini（Firebase AI Logic）、Firestore 即時排行、OpenFreeMap 圖磚、氣象署 API、iPhone Quick Look／Android Scene Viewer 的 AR。開發環境當時連不到這些服務，程式依 SDK 型別撰寫，失敗時會自動改用示範資料。
- 還沒部署。部署方式見 `README.md`（Netlify Drop、Firebase Hosting）。
- 簡報（Claude Slides）的 P9 技術架構寫的是 Flutter、ML Kit、ARCore；原型實際是 Web、PaddleOCR、model-viewer。簡報待更新成「原型（Web）已完成，決賽版 Flutter」。
- 資料分析發現平均車資約 NT$254（雙北 NT$266），簡報原本用 NT$300，SOM 應從約 1.8 億改為約 1.6 億，簡報待更新。

## 指令

```bash
npm install
npm run dev                 # 開發（http://localhost:5173）
npm run build               # tsc 型別檢查 + vite 建置到 dist/
npm run preview -- --port 4173

# 測試（Python 3.11+）
pip install -r scripts/requirements.txt && python -m playwright install chromium
python scripts/make_fixtures.py      # 示範車牌 PNG/PDF、假相機影片（需要 ffmpeg）
python scripts/e2e.py                 # 需先 build + preview；截圖在 scripts/output/
python scripts/ocr_check.py           # 用 onnxruntime 檢查車牌辨識模型
python scripts/export_glb.py          # 需先 npm run dev；重新匯出 AR 用的小精靈 GLB

# 部署（需先建立 .firebaserc）
npx firebase-tools deploy --only hosting,firestore:rules
```

資料管線在 `data-pipeline/`，見該資料夾的 `README.md`。

## 架構與檔案

```
src/
  App.tsx               外框：頂欄（時間＝一天劇本、AI 狀態燈、設定）、5 個分頁、toast
  lib/store.tsx         全域狀態（React context）：設定、模擬時間、天氣、點亮格子、任務、圖鑑、分頁
  lib/settings.ts       設定型別與 localStorage 讀寫（Firebase 設定、App Check、模型、房間、幸運數字覆寫…）
  lib/firebase.ts       Firebase 初始化（設定字串或 Hosting 的 /__/firebase/init.json）、App Check、匿名登入
  lib/ai.ts             Gemini：今日任務（結構化 JSON）、小精靈對話（串流）、拍車台詞、營運派任務；全部有示範資料備援
  lib/geo.ts            H3（第 9 級）、遊戲範圍、POI（yoxi 上車點座標來自競賽資料）、示範路線與取樣
  lib/ocr.ts            PP-OCRv4 辨識模型 + ONNX Runtime Web，只做單行辨識（取景框已框住車牌）
  lib/lucky.ts          今日幸運數字、車牌解析、雜湊比對示範車隊、小精靈配色
  lib/sprite3d.ts       three.js 車燈小精靈（相機畫面上跳出動畫）與 GLB 匯出
  lib/social.ts         Firestore 好友排行 rooms/{room}-{日期}/players/{uid}
  lib/weather.ts        氣象署 F-C0032-001 與「傍晚下雨」情境
  views/MapView.tsx     點燈地圖（MapLibre + OpenFreeMap 暗色，失敗改離線底圖）、搭車點亮動畫、任務卡
  views/ScanView.tsx    相機取景、辨識、小精靈、AR 召喚（model-viewer）
  views/SpriteChat.tsx  小精靈對話
  views/FriendsView.tsx 幸運數字、好友排行、揪團、圖鑑
  views/OpsView.tsx     營運：需求熱度地圖、低谷時段、下一週預測、AI 派任務
  data/demand.json      由 data-pipeline 匯出的彙總指數（0–100），不含個別行程
  data/demo.ts          虛構示範玩家「小涵」、各時段示範任務與對話
  data/districts.json   台北市與部分新北市行政區界（離線底圖）
public/models/          PP-OCRv4 辨識模型（10.8 MB）與字典
public/sprites/         5 種配色的小精靈 GLB（AR 用，scripts/export_glb.py 產生）
data-pipeline/          yoxi 資料前處理、分析、預測、匯出（Python）與 BigQuery ML SQL
docs/                   提案決策、研究報告、資料分析報告（data-analysis-report.md）、影片腳本、簡報原始檔、示範車牌
```

## 不要改掉的決策（有原因）

- **手機網頁而非 Flutter**：開發環境無法編譯 Flutter，三天內做安裝檔風險太高。決賽版若要轉 Flutter，簡報要同步。
- **Gemini 走 Firebase AI Logic（Gemini Developer API）**：金鑰不放前端、Spark 免費方案可用。2026 年 7 月起 AI Logic 強制 App Check，設定提供 reCAPTCHA v3 或偵錯權杖。模型預設 `gemini-3.1-flash-lite`（與簡報成本試算一致）。
- **每個 AI 功能都要有示範資料備援**，畫面標「示範資料」或「Gemini」。錄影與現場 demo 不能因為網路卡住。
- **車牌在手機上辨識、照片不上傳**；示範車隊只存「鹽＋車牌」的 SHA-256。不要改成上傳照片給雲端辨識。
- **只用 PP-OCRv4 辨識模型、不做文字偵測**：先前用 OpenCV + 偵測模型會讓畫面卡住數十秒，改成單行辨識後約 0.2 秒。
- **ONNX Runtime 用單執行緒 wasm**（`vite.config.ts` 把 `onnxruntime-web` 指到 `onnxruntime-web/wasm`）：多執行緒需要 COOP/COEP，會擋掉 Google Fonts 與圖磚。
- **AR 用系統 AR**（model-viewer → iPhone Quick Look、Android Scene Viewer／WebXR），相機畫面上的跳出動畫是 three.js 疊圖。
- **示範玩家的歷史路線走敦化北路**，示範搭車走光復南北路，這樣錄影時搭車才會點亮新的格子。改路線時要確認 `scripts/e2e.py` 的「點亮比例有增加」檢查仍通過。
- **地圖底圖 OpenFreeMap 需要標示出處**，影片裡也要保留。

## 資料與隱私（嚴格遵守）

- yoxi 競賽資料（約 96.5 萬筆行程，2026/2/1–4/30）含乘客編號與精確座標，**不得**放進 `src/`、`public/`、`dist/` 或任何會公開的地方，也不要 commit 原始或清理後的逐筆資料。
- App 只能放彙總後的 0–100 指數（`src/data/demand.json`）。
- 原始 7z 放 `data-pipeline/data/raw/`，解壓到 `data-pipeline/data/extracted/`；逐筆中間檔（`raw_df.pkl`、`*.parquet`）都已列在 `.gitignore`。`data-pipeline/data/processed/` 裡的 JSON／CSV 是彙總結果，可以保留。
- 人物「小涵」、示範車牌（TDX-3963、TDX-5528、TDX-1832、TDX-7708；ABC-1234 為非車隊）都是虛構的，畫面要保留「黑客松原型」標籤。

## 資料分析重點（簡報可引用，來源：data-pipeline/data/processed/metrics.json）

- 雙北占 62%；平均每天約 1.08 萬趟（`metrics.json` 的 `daily_mean` 1.07 萬把只有 40 筆的 5/1 算成一天）；乘客 131,962 位。
- 當月有搭車的乘客，平均約 89% 的日子不搭車；2 月乘客 3 月再搭 59%；33% 三個月只搭 1 次。
- 搭 5 次以上的乘客（34%）貢獻 83% 行程；其上下車點中位數 58% 集中在 2 個 H3 格、48% 行程在同一個 3 小時。
- 叫車到上車中位數 5.9 分鐘，平日尖峰拉長到 6.5–7.2 分鐘；信義區平日低谷 11–12、14–15、20 點，松山區 11–16、20 點。
- 隔日逐時預測 WAPE：雙北 6.7%（基準 7.7%）、信義 16.4%（19.8%）、松山 15.5%（19.7%）。
- 雙北路線（起訖歸到 H3 第 9 級、本機 OSRM 推估最快路線，`data-pipeline/data/processed/routes/`）：前 10% 路段承載 76% 行駛量；主走廊為忠孝東西路、建國高架、中山高、基隆路；平日低谷時通勤幹道流量剩尖峰約 7 成，忠孝東路一到四段持平；同一段路 10 點出發比 17 點少花約 22% 時間；看不出系統性繞路（繞路比中位數 0.98）。

## 程式注意事項

- Firebase JS SDK v13 的 `Part` 要寫 `{ type: 'text', text }`。
- `lib/ai.ts` 用 `Schema.object(...)` 做結構化輸出，回傳後一律再做欄位驗證與截斷。
- 地圖的 bottom sheet 會蓋住下半部，`fitBounds`／`flyTo` 要帶 padding；搭車時先收起 sheet，`maxZoom` 13.9。
- 拍車流程要先 `cropForOcr` 再停相機，否則會讀到黑畫面。
- e2e 的假相機影片必須是直式（手機相機是直式；橫式影片在直式容器裡會被裁掉車牌）。
- 視覺：深藍夜色 `#0E1830`、車燈暖黃 `#FFC94A`、奶油白 `#F5F0E6`、字型 Noto Sans TC + Fredoka。小精靈是原創角色，不要畫任何既有角色或 yoxi 官方 logo。

## 下一步（建議順序）

1. 部署到 https，在 iPhone 與 Android 實測：Gemini 任務卡（綠色標籤）、好友排行兩機同步、拍車、AR 召喚。把錯誤訊息修掉。
2. 錄製 3 分鐘影片的實機片段（步驟見 `docs/video-script.md` 最後一節）。
3. 更新簡報：P9 架構（原型實際技術）、車資與 SOM、痛點頁補上資料發現。
4. 決賽前：BigQuery ML ARIMA_PLUS 實跑（`data-pipeline/data/processed/bigquery/sql/`）並把結果接進營運頁；司機端畫面；任務完成的位置驗證（目前「我到了」是直接完成）。

## 相關連結

見 `docs/links.md`（簡報、影片腳本、資料分析頁都在 claude.ai 上）。
