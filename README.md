# yoxi 點燈城｜可操作原型

2026 和泰 AI 黑客松 yoxi 題目的手機網頁原型。iPhone（Safari）與 Android（Chrome）直接用瀏覽器開啟，可以加到主畫面全螢幕使用。

## 用 Claude Code 繼續開發

1. 安裝 Node.js 20 以上（https://nodejs.org）、Python 3.11 以上，以及 Claude Code。
2. 解壓縮後進入資料夾：`cd yoxi-lighting-city`
3. 執行 `claude` 開始。Claude Code 會自動讀取 `CLAUDE.md`（專案背景、架構、決策、資料隱私規則、下一步）。
4. 可以直接這樣開始：
   - 「`npm install` 後跑起來，幫我檢查有沒有錯」
   - 「幫我部署到 Firebase Hosting」（或輸入 `/deploy`）
   - 「跑端對端測試並修正問題」（或輸入 `/e2e`）
   - 「我把 yoxi 原始資料放進 data-pipeline/data/raw/ 了，重跑資料管線」（或輸入 `/data`）

資料夾內容：

| 位置 | 內容 |
|---|---|
| `src/`、`public/` | App 原始碼、車牌辨識模型、AR 用 3D 模型 |
| `data-pipeline/` | yoxi 資料前處理、分析、預測與 BigQuery ML SQL（不含原始資料） |
| `scripts/` | 端對端測試、示範車牌與假相機產生器、GLB 匯出、辨識模型檢查 |
| `docs/` | 50 題與 30 題決策、研究報告、影片腳本、簡報原始檔、內部討論書、示範車牌 |
| `CLAUDE.md` | 給 Claude Code 的專案說明 |

## 用到的技術

| 功能 | 技術 | 說明 |
|---|---|---|
| 點燈地圖 | MapLibre GL、OpenFreeMap 暗色底圖、h3-js | H3 第 10 級六角格（平均約 0.015 km²），搭車沿途格子即時點亮；底圖載不到時自動換成離線夜色底圖 |
| 今日 AI 任務、小精靈對話、拍車台詞、營運派任務 | Firebase AI Logic（Gemini Developer API）、`gemini-3.1-flash-lite` | 結構化 JSON 輸出；連不上時自動改用示範資料並標示 |
| 拍車辨識 | PaddleOCR PP-OCRv4 辨識模型、ONNX Runtime Web | 在手機上辨識，照片不上傳；車牌以雜湊比對示範車隊名單 |
| AR 小精靈 | three.js、model-viewer | 相機畫面上 3D 小精靈跳出；「AR 召喚」用 iPhone Quick Look／Android Scene Viewer 放到地上 |
| 好友排行 | Firebase 匿名登入、Cloud Firestore | 同一個房間代碼即時同步；連不上時改用示範好友 |
| 需求預測導流 | yoxi 競賽資料彙總指數 | 信義、松山區的需求熱度、平日低谷時段、下一週預測（近 4 週型態＋近期水位，正式版改 BigQuery ML ARIMA_PLUS） |
| 天氣 | 中央氣象署 F-C0032-001 | 可切換「傍晚下雨」示範情境 |

App 裡只放 yoxi 資料的彙總指數（0–100），不含任何個別行程或乘客資料。人物「小涵」、示範車牌皆為虛構。

## 一、最快看到 demo（不需要寫程式）

`dist` 資料夾就是做好的網站，放到任何 https 網站空間都能用。相機需要 https。

最簡單的方式是 Netlify Drop：
1. 執行 `npm install && npm run build` 產生 `dist` 資料夾（或使用另外提供的 `yoxi點燈城_網站.zip`）。
2. 打開 <https://app.netlify.com/drop>，登入後把 `dist` 資料夾拖進去。
3. 得到 `https://xxxx.netlify.app` 網址，用手機打開。

此時地圖、拍車辨識、AR、營運頁都能用；Gemini 與好友排行會顯示「示範資料」，接上 Firebase 後就會變成即時。

## 二、接上 Firebase（Gemini＋好友即時排行，約 30 分鐘，免綁卡）

1. **建立專案**：到 <https://console.firebase.google.com> 新增專案（Spark 免費方案，Google Analytics 可關閉）。
2. **新增網頁應用程式**：專案總覽 →「</>」→ 取名 → 複製畫面上的 `firebaseConfig`。
3. **匿名登入**：Authentication → 開始使用 → 登入方式 → 匿名 → 啟用。
4. **Firestore**：Firestore Database → 建立資料庫 → 位置選 `asia-east1`（台灣）→ 正式版模式 → 規則分頁貼上本資料夾的 `firestore.rules` → 發布。
5. **AI Logic**：左側「AI 服務」→ AI Logic → 開始使用 → 選 **Gemini Developer API** → 照引導完成。
6. **App Check**（AI Logic 會要求）：
   - 到 <https://www.google.com/recaptcha/admin> 建立 **reCAPTCHA v3** 金鑰，網域填你的網站網域（例如 `xxxx.netlify.app` 或 `專案ID.web.app`）和 `localhost`。
   - Firebase 主控台 → App Check → 應用程式 → 你的網頁應用程式 → 選 reCAPTCHA v3，貼上**密鑰**後儲存。
   - 也可以改用**偵錯權杖**：在同一頁「管理偵錯權杖」新增一組，App 設定選「偵錯權杖」貼上即可（任何網域都能用，適合彩排）。
7. **在 App 裡填設定**：打開網站 → 右上角齒輪 → 貼上 `firebaseConfig`（部署在 Firebase Hosting 時可留空）→ App Check 選 reCAPTCHA v3 並貼**網站金鑰**（或選偵錯權杖）→ 儲存。
8. 回到地圖頁按「重新生成」。任務卡出現綠色「Gemini 即時生成」就成功了；右上角小圓點變綠色代表 Gemini 連線中。

## 三、部署到 Firebase Hosting（和簡報架構一致）

需要 Node.js 20 以上。

```bash
npm install
npm run build
npx firebase-tools login
cp .firebaserc.example .firebaserc   # 把專案 ID 改成你的
npx firebase-tools deploy --only hosting,firestore:rules
```

網址是 `https://專案ID.web.app`。部署在這裡時，App 會自動讀取 Firebase 設定，不用手動貼。

## 四、錄影前檢查

- 設定 → 今日幸運數字填 **21**：配合示範車牌 TDX-3963（加總 21，中獎）、TDX-5528（20，差 1）、TDX-7708（22，差 1）、TDX-1832（14）；ABC-1234 會顯示「不在示範車隊名單」。
- 彩排時勾「同一台車可以重複收集」，正式錄影前取消，才能展示「每車每人每天一次」。
- 列印 `docs/plates/yoxi點燈城_示範車牌.pdf`，或用平板顯示車牌圖片。
- 第一次開「拍車」會下載約 25 MB 的辨識模型，請先在 Wi-Fi 下打開一次。
- 右上角時間可以叫出「一天劇本」，一鍵切到早上、午休、路上、傍晚四個時段。
- 兩支手機設定同一個房間代碼，就能錄到好友排行即時更新。
- 影片中出現地圖時，畫面右下角的 OpenStreetMap／OpenFreeMap 標示請保留。

## 開發

```bash
npm install
npm run dev      # 本機開發
npm run build    # 輸出到 dist/
```
