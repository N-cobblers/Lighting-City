# 01｜專案現況與整體說明：yoxi 點燈城

| 項目 | 內容 |
|---|---|
| 日期 | 2026-10-12 |
| 分析基準 | commit `18e94b3`（origin/main「調整網格大小以及新增調整網格深淺功能」），文件分支 `docs/project-discussion-20261012` |
| 對象 | 全體組員（含未參與開發者）、工程師回查 |
| 相關文件 | [02 團隊待決議的 30 題](02-thirty-decision-questions.md)・[03 技術架構、創新亮點與 Demo 規劃](03-architecture-innovation-and-demo.md)・[04 資料分析與資料狀態](04-data-status.md) |

**證據標記**：【程式碼確認】讀過原始碼／設定確認；【執行驗證】本次實際執行看到結果；【推論】依證據合理推論；【待確認】需要團隊或實機確認；【提案】未來建議。

**完成狀態用詞**（四份文件一致）：✅ 已驗證可用／🟡 已實作未驗證／🟠 部分完成／🎭 mock・展示用途／⛔ 尚未實作。
「✅ 已驗證」僅代表本次在**桌面無頭 Chromium（390×844 手機尺寸、假相機影片）**與 `scripts/ocr_check.py` 中驗證過；**所有功能都尚未在 iPhone／Android 實機驗證**。

## 目錄

- [會議快讀摘要](#會議快讀摘要)
- [1. 一頁摘要](#1-一頁摘要)
- [2. 背景與產品定位](#2-背景與產品定位)
- [3. 主要使用流程](#3-主要使用流程)
- [4. 功能現況表](#4-功能現況表)
- [5. 專案結構與模組職責](#5-專案結構與模組職責)
- [6. 資料、整合與部署現況](#6-資料整合與部署現況)
- [7. 已知限制、風險與技術債](#7-已知限制風險與技術債)
- [8. 下一階段建議](#8-下一階段建議)
- [附錄：本次執行紀錄與未檢查範圍](#附錄本次執行紀錄與未檢查範圍)

---

## 會議快讀摘要

1. **是什麼**：yoxi App 裡的新分頁「點燈城」手機網頁原型（React + Vite + TypeScript），讓乘客「不搭車也有理由每天打開 yoxi」。搭車點亮路線、完成 AI 任務點亮街區、拍 yoxi 車牌召喚車燈小精靈、和好友比幸運數字；營運端用需求低谷把任務與乘車金導到空車時段。
2. **現在能做到**：不需要任何帳號或金鑰，五個分頁（點燈地圖、小精靈、拍車、好友、營運）在**示範模式**下可以完整走完「小涵的一天」。`npm run build` 與 `scripts/e2e.py` 在 `18e94b3` 全部通過【執行驗證】；手機端車牌辨識對 5 張示範車牌全對【執行驗證】。
3. **還不能宣稱**：Gemini、Firestore 好友即時排行、氣象署 API、iPhone Quick Look／Android Scene Viewer AR 都**從未接上真實服務驗證**；搭車、預約、乘車金、推播都是模擬；BigQuery ML 只有 SQL。
4. **最大缺口**：(a) GitHub Pages 線上版停在舊 commit `08538f7`（I1）；(b) 沒有實機測試；(c) 18e94b3 改用 H3 第 10 級後點亮效果變淡（I4）；(d) 簡報與影片的技術敘述和原型不一致（I7）；(e) GitHub repo 是**公開的**，已提交的競賽資料衍生檔是否符合資料使用規範尚未確認（[Q18](02-thirty-decision-questions.md#q18)、[文件 4 第 9 節](04-data-status.md#9-隱私合規與公開範圍)）。
5. **最先要決定**：[Q01](02-thirty-decision-questions.md#q01) 決賽主軸、[Q04](02-thirty-decision-questions.md#q04) 是否接真實 AI、[Q06](02-thirty-decision-questions.md#q06) demo 網址、[Q07](02-thirty-decision-questions.md#q07) 格網解析度與亮度、[Q14](02-thirty-decision-questions.md#q14) 簡報技術敘述。

---

## 1. 一頁摘要

### 1.1 專案是什麼

「yoxi 點燈城」是 2026 和泰 AI 黑客松 yoxi 題目「不搭車，也打開 yoxi —— 打造高頻互動的 AI 出行夥伴」的參賽作品。產品構想是 yoxi App 內的新分頁；目前交付物是**可在手機瀏覽器開啟的網頁原型**，加上一條離線的**資料管線**（`data-pipeline/`）與提案文件（`docs/`）。【程式碼確認】`../../CLAUDE.md`、`../../README.md`

### 1.2 想解決什麼問題

| 面向 | 問題 | 證據 |
|---|---|---|
| 乘客 | 叫車 App 只有要出門時才被打開 | 競賽資料：當月有搭車的乘客平均 **89% 的日子不搭車**、33% 三個月只搭 1 次（見[文件 4](04-data-status.md)）【程式碼確認：`../../data-pipeline/data/processed/metrics.json`】 |
| 司機／營運 | 尖峰叫不到車、低谷空車多 | 叫車到上車中位數 5.9 分，平日尖峰 6.5–7.2 分；信義、松山有明確平日低谷時段 |
| yoxi 品牌 | 想從「被動工具」轉為「城市移動與生活夥伴」 | 主辦方題目敘述（`../../CLAUDE.md`） |

### 1.3 主要使用者與使用場景

- **乘客端**：都會通勤上班族（20–35 歲）與大學生（`../decisions-50.md` 第 3 題）。原型用虛構示範玩家「小涵」（27 歲，信義區上班、住松山民生社區）串成故事（`../../src/data/demo.ts` 的 `PERSONA`）。
- **營運端**：yoxi 營運人員查看需求熱度與低谷、讓 AI 設計空車時段任務（`../../src/views/OpsView.tsx`）。
- **司機端**：目前只在營運頁以一張「每位參與司機多接（單）」的 KPI 卡呈現，沒有獨立畫面。
- 首波試辦客群仍未定案，見 [Q02](02-thirty-decision-questions.md#q02)。

### 1.4 目前能完成什麼

| 可以展示 | 狀態 |
|---|---|
| 夜色地圖＋搭車沿途六角格點亮動畫、重訪變亮 | ✅（搭車本身是 🎭 模擬） |
| 依時段、天氣、低谷生成的今日 3 個任務 | 示範備援 ✅；Gemini 即時生成 🟡 |
| 相機拍車牌 → 手機端 OCR → 雜湊比對示範車隊 → 3D 小精靈跳出 → AR 預覽 | ✅（假相機）；系統 AR 🟡 |
| 好友幸運數字排行 | 示範好友 ✅；Firestore 即時 🟡 |
| 營運頁需求熱度、低谷、預測曲線、AI 派任務 | 資料與畫面 ✅；派任務 Gemini 🟡；推播 🎭 |
| 一天劇本（一鍵切早上／午休／路上／傍晚） | ✅ |

### 1.5 最主要的缺口與下一步

1. 把最新 main 部署上線並在 iPhone／Android 實機跑一次（I1、[Q06](02-thirty-decision-questions.md#q06)）。
2. 決定點燈格網與預設亮度，恢復 demo 的視覺衝擊（I4、[Q07](02-thirty-decision-questions.md#q07)）。
3. 建 Firebase 專案、驗證 Gemini 與兩機排行，或決定全程示範並揭露（I2、[Q04](02-thirty-decision-questions.md#q04)、[Q05](02-thirty-decision-questions.md#q05)）。
4. 簡報 P9、影片旁白與車資數字更新（I7、[Q14](02-thirty-decision-questions.md#q14)）。

---

## 2. 背景與產品定位

### 2.1 問題與題目要求

主辦方要求方案「與交通、移動或城市生活相關」「具備 yoxi 特色」「有長期使用動機」「平衡實用與趣味，最好結合個人化資料」，提案需涵蓋情境與資料應用、商業轉換、技術架構與成本、成效驗證（`../../CLAUDE.md`「主辦方題目敘述與提案要求」；註明尚未逐字比對官網版本【待確認】）。

### 2.2 價值主張（依現有專案證據整理）

| 對象 | 價值主張 | 對應功能 | 證據等級 |
|---|---|---|---|
| 乘客 | 不搭車的日子也有事可做：每日任務、點亮自己的生活圈、拍車收集小精靈、和朋友比幸運數字 | F1、F3、F4、F6–F11 | 【程式碼確認】功能存在；長期留存效果【待確認】 |
| 乘客 | 下雨或尖峰前被提醒預約、在低谷時段拿到限時乘車金 | F4、F5、F15 | 提醒文案【程式碼確認】；真實預約與乘車金 ⛔ |
| 司機 | 低谷時段多接單 | F13、F14 | 低谷時段來自資料【程式碼確認】；「多接單」為試算 🎭 |
| yoxi | 提高非搭車日開啟率，再轉換成叫車 | 整體 | 北極星指標定義見 [Q03](02-thirty-decision-questions.md#q03)【待確認】 |

### 2.3 預期成果

- 初賽（10/14 13:00）：提案 PDF（≤15 頁）＋ 3 分鐘影片。簡報為 Claude Slides（`../links.md`），影片腳本 `../video-script.md`。
- 決賽（11/21）：現場 demo。評分：可行性 25%、AI 整合度 20%、商業價值 20%、原型完成度 20%、簡報 15%。

### 2.4 已定案 vs 仍待決議

| 已定案（有文件） | 仍待決議（不要當成事實對外說） |
|---|---|
| 手機網頁原型、Gemini 走 Firebase AI Logic、每個 AI 功能都有示範備援、車牌在手機上辨識不上傳、足跡只存本機（`../implementation-decisions.md`、`../../CLAUDE.md`「不要改掉的決策」） | 第一亮點是乘客互動還是雙邊導流（[Q01](02-thirty-decision-questions.md#q01)）；首波客群（[Q02](02-thirty-decision-questions.md#q02)）；北極星指標的精確定義（[Q03](02-thirty-decision-questions.md#q03)）；乘車金規則（[Q10](02-thirty-decision-questions.md#q10)）；決賽是否轉 Flutter（[Q14](02-thirty-decision-questions.md#q14)） |

注意：`../decisions-50.md` 第 24–27 題寫「Flutter、Vertex AI、Cloud Functions、推播」，已被 `../implementation-decisions.md` 第 2、7 題取代；簡報 P9 與影片旁白仍是舊敘述（I7）。

---

## 3. 主要使用流程

以下以推薦的 demo 主線「小涵的一天」排列。外部服務都有備援：連不上時畫面會標「示範資料」或「示範」。

| # | 使用者動作 | 頁面／元件 | 資料與服務 | 實際狀態 |
|---|---|---|---|---|
| 0 | 打開網址（可加到主畫面） | `../../index.html`、`../../src/App.tsx`（頂欄＋5 分頁） | `localStorage` 讀設定與足跡；Google Fonts | ✅ |
| 1 | 早上看地圖與今日 AI 任務 | `../../src/views/MapView.tsx`（bottom sheet） | `generateTasks()`（`../../src/lib/ai.ts`）→ Firebase AI Logic → Gemini；context 含時段、天氣、幸運數字、點亮比例、`LOW_WINDOWS`（`../../src/data/demand.json`）；失敗用 `FALLBACK_TASKS` | 示範 ✅／Gemini 🟡 |
| 2 | 按「預約 yoxi」看搭車點亮 | `MapView` 的 `ride()` | `taskRoute()` 選 `ROUTES` 手畫折線 → `routeCells()` 換成 H3 第 10 級格 → `recordRideCells()` 寫入 visits；**沒有呼叫任何叫車 API** | 動畫 ✅／叫車 🎭 |
| 3 | 午休按「我到了」完成步行任務 | `MapView` 的 `doWalk()` | 直接 `lightCells()`＋`completeTask()`，**不檢查位置** | 🎭（I6） |
| 4 | 和小精靈聊天 | `../../src/views/SpriteChat.tsx` | `chatReply()` 串流；失敗用 `FALLBACK_CHAT` 關鍵字回覆；回覆含「預約／回家」時出現「預約 18:10 回家」按鈕 → `requestRide('evening-home')` 回地圖播放 | 示範 ✅／Gemini 🟡 |
| 5 | 拍 yoxi 車牌 | `../../src/views/ScanView.tsx` | `getUserMedia` → `cropForOcr()` → `recognize()`（`../../src/lib/ocr.ts`，PP-OCRv4 + ONNX Runtime Web）→ `extractPlate()` → `plateHash()` 比對 `DEMO_FLEET_HASHES`（`../../src/lib/lucky.ts`）→ 每車每天一次（`seen:v1`） | ✅（假相機） |
| 6 | 小精靈跳出、AR 召喚 | `mountSpriteStage()`（`../../src/lib/sprite3d.ts`）、`ArModal`（model-viewer） | `spriteLine()` 產生稱號與台詞（Gemini／示範）；`public/sprites/sprite-*.glb` | 跳出 ✅／3D 預覽 ✅／Quick Look・Scene Viewer 🟡 |
| 7 | 看好友排行與圖鑑 | `../../src/views/FriendsView.tsx` | `ensureSubmit()` → `joinRoom()`（`../../src/lib/social.ts`）→ Firestore `rooms/{room}-{日期}/players/{uid}`；連不上補 `BOTS` 示範好友 | 示範 ✅／Firestore 🟡 |
| 8 | 傍晚下雨提醒、預約回家 | `App.tsx` 一天劇本 → `SpriteChat` → `MapView` | `rainScenario()`（預設）或 `fetchCwa()`（`../../src/lib/weather.ts`） | 情境 ✅／氣象署 🟡 |
| 9 | 營運：看低谷、AI 派任務、推播 | `../../src/views/OpsView.tsx` | `demand.json` 的 cells／profiles／low_windows／forecast；`opsPlan()`；「推播給附近玩家」只把任務插回本機任務清單 | 資料 ✅／Gemini 🟡／推播 🎭 |

**可完整運作的流程**：0–9 在示範模式全程可走完，e2e 腳本依序覆蓋地圖 → 搭車（檢查點亮比例增加）→ 小精靈 → 拍車（檢查讀到 TDX-39）→ AR → 好友 → 營運 → 劇本 → 設定【執行驗證】。

**只做到部分的流程**：真實叫車與預約、乘車金發放與核銷、推播、位置驗證、司機端、跨裝置資料（皆 ⛔，見 F20）。

---

## 4. 功能現況表

「驗證方式」欄：e2e＝`scripts/e2e.py`（無頭 Chromium、390×844、假相機）；ocr＝`scripts/ocr_check.py`；code＝只讀過程式碼。

| ID | 功能 | 使用者價值 | 實作位置（檔案＋symbol） | 完成狀態 | 驗證方式 | 限制 | 後續工作 |
|---|---|---|---|---|---|---|---|
| F1 | 點燈地圖＋OpenFreeMap 暗色底圖＋離線底圖備援 | 打開就看到自己的城市亮了多少 | `MapView.tsx` `DARK_STYLE`、`FALLBACK_STYLE`、`addLayers`；`../../src/data/districts.json` | ✅（離線備援為【程式碼確認】，本次未觸發） | e2e 截圖顯示真實圖磚 | 地圖出處標示需保留；7 秒逾時才切離線底圖 | 實機確認圖磚與手勢 |
| F2 | 搭車點亮動畫 | 搭車＝點亮整條路線，是核心回饋 | `MapView.tsx` `ride()`、`taskRoute()`；`../../src/lib/geo.ts` `ROUTES`、`routeCells()`、`samplePath()` | 🎭 | e2e（點亮比例增加） | 路線是手畫折線；`taskRoute` 對非預設地點用 L 形兩段線；沒有叫車 | [Q08](02-thirty-decision-questions.md#q08) 路線來源 |
| F3 | 足跡重訪亮度與 7 天淡化 | 常走的路越來越亮，久沒去會淡但不消失 | `../../src/lib/store.tsx` `glowLevel()`、`recordRideCells()`、`loadVisitHistory()`、`expandToCurrentResolution()`；鍵 `visits:v2`、`lit:v6` | 🟡 | e2e 間接（toast 顯示首次／重訪格數） | 無單元測試；舊版 R9 資料會展開成 R10 子格 | 補 `glowLevel` 單元測試；[Q07](02-thirty-decision-questions.md#q07) |
| F4 | 今日 AI 任務 | 每天打開的理由；任務排進低谷 | `ai.ts` `generateTasks()`、`TASK_SYSTEM`、`Schema.object`；`MapView.tsx` `regenerate()`；`demo.ts` `FALLBACK_TASKS` | Gemini 🟡；示範備援 ✅ | e2e（示範）；Gemini 未驗 | 20 秒 timeout；欄位截斷與 `poiId` 白名單；任務不持久化（重整即重新生成） | [Q04](02-thirty-decision-questions.md#q04)、[Q23](02-thirty-decision-questions.md#q23)、[Q24](02-thirty-decision-questions.md#q24) |
| F5 | 小精靈對話（串流） | 有個性的城市嚮導、引導預約 | `ai.ts` `chatReply()`、`CHAT_SYSTEM`；`SpriteChat.tsx`；`FALLBACK_CHAT` | Gemini 🟡；關鍵字示範 ✅ | e2e（示範回覆） | 對話不保存；「預約」按鈕以正規表示式判斷 | [Q25](02-thirty-decision-questions.md#q25) 安全邊界 |
| F6 | 拍車 OCR | 遇到 yoxi 車就能玩，照片不上傳 | `ocr.ts` `loadOcr()`、`cropForOcr()`、`recognize()`、`recognizeLine()`；`lucky.ts` `extractPlate()` | ✅（假相機） | e2e 讀到 TDX-39；ocr 5/5，信心 0.990–0.997 | 只做單行辨識，需車牌放進取景框；首次下載約 25 MB；未在真實光線／角度測試 | 實機戶外測試；[Q11](02-thirty-decision-questions.md#q11) |
| F7 | 示範車隊比對、每車每人每天一次 | 只有自願加入的車會出現小精靈 | `lucky.ts` `DEMO_FLEET_HASHES`、`plateHash()`（鹽＋SHA-256）；`ScanView.tsx` `handlePlate()`、`seen:v1` | 示範名單 ✅；真實車隊名單 ⛔ | e2e | 鹽寫在前端，4 位數車牌可暴力還原（示範可接受）；`dayKey` 用 UTC（I3） | [Q22](02-thirty-decision-questions.md#q22)；正式版名單需後端 |
| F8 | 小精靈跳出動畫 | 拍到車的驚喜時刻 | `sprite3d.ts` `buildSprite()`、`mountSpriteStage()` | ✅ | e2e 截圖 | WebGL 效能未在中低階手機測 | 實機測 |
| F9 | AR 召喚 | 把小精靈放到地上拍照分享 | `ScanView.tsx` `ArModal`；`../../public/sprites/sprite-0..4.glb`；`exportSpriteGlb()` 備援 | 3D 預覽 ✅；Quick Look／Scene Viewer 🟡 | e2e 截圖（桌面 3D 預覽） | 系統 AR 需實機 | 實機錄 2 秒 AR |
| F10 | 好友排行 | 每天和朋友比誰最接近幸運數字 | `social.ts` `joinRoom()`、`BOTS`；`FriendsView.tsx` `connect()`、`ensureSubmit()`；`../../firestore.rules` | Firestore 🟡；示範好友 ✅ | e2e（示範） | 匿名登入；I12 防作弊不足；`bestKey` 用 UTC（I3） | [Q05](02-thirty-decision-questions.md#q05)、[Q21](02-thirty-decision-questions.md#q21) |
| F11 | 小精靈圖鑑 | 收集動機 | `store.tsx` `addCollected()`、鍵 `collected:v1`（最多 30 筆） | ✅ | e2e 截圖 | 只存本機 | [Q20](02-thirty-decision-questions.md#q20) |
| F12 | 揪團 | 社交擴散、把兩趟併一趟 | `MapView.tsx` `doGroup()`；`FriendsView.tsx` 揪團卡 | 🟠 | code | 只送出 Web Share／剪貼簿文字，無房間配對、無共同任務狀態 | 依 [Q01](02-thirty-decision-questions.md#q01) 決定是否加強 |
| F13 | 營運頁需求熱度、低谷、預測曲線 | 讓營運知道何時導流 | `OpsView.tsx` `heat`、`PROFILE`、`CELLS`、`districtOf()`；`store.tsx` `LOW_WINDOWS`；`demand.json` | ✅（資料為離線預先計算） | e2e 截圖 | 只有信義、松山；預測是 5/1–5/7 的歷史預測（I17）；週末顯示週五型態 | [Q15](02-thirty-decision-questions.md#q15)、[Q19](02-thirty-decision-questions.md#q19) |
| F14 | 營運 AI 派任務與推播 | AI 說明為什麼這樣派，雙邊受惠 | `ai.ts` `opsPlan()`、`FALLBACK_OPS`；`OpsView.tsx` `dispatch()`、`push()` | Gemini 🟡、示範 ✅；推播 🎭；預估新增叫車（520×8%）🎭 | e2e（示範） | 示範理由文字與實際數字不符（I5）；推播只寫本機任務清單；`poiId` 與乘車金固定 | [Q12](02-thirty-decision-questions.md#q12)、[Q13](02-thirty-decision-questions.md#q13) |
| F15 | 天氣 | 下雨前提醒預約 | `weather.ts` `fetchCwa()`（F-C0032-001 臺北市）、`rainScenario()` | 氣象署 🟡；「傍晚下雨」情境（預設）✅ | e2e（情境） | 需授權碼；瀏覽器直接呼叫 CWA 的 CORS 行為【待確認】 | [Q16](02-thirty-decision-questions.md#q16) |
| F16 | 一天劇本 | 錄影／demo 一鍵切時段 | `App.tsx` `SCRIPT`；`store.tsx` `setClock()` | ✅ | e2e | 只改時分，日期仍是今天 | — |
| F17 | 設定頁 | 接 Firebase、彩排開關 | `../../src/views/SettingsSheet.tsx`；`../../src/lib/settings.ts` `defaultSettings` | ✅ | e2e 截圖 | 改 Firebase 相關設定會自動重新載入 | — |
| F18 | BigQuery ML ARIMA_PLUS | 正式版需求預測 | `../../data-pipeline/data/processed/bigquery/sql/01–04` | ⛔（只有 SQL，未實跑） | — | 營運頁目前用本機 Python 結果 | [Q15](02-thirty-decision-questions.md#q15) |
| F19 | 部署 | 手機用 https 打開 | `../../.github/workflows/deploy-pages.yml`；`../../firebase.json` | GitHub Pages CI ✅（但未包含最新 main，I1）；Firebase Hosting ⛔ | `gh run list`、curl | 18e94b3 的部署被 cancel | [Q06](02-thirty-decision-questions.md#q06) |
| F20 | 真實叫車／預約、乘車金、推播、司機端 App、任務位置驗證、帳號系統 | 商業轉換閉環 | — | ⛔ | — | 原型範圍外 | [Q09](02-thirty-decision-questions.md#q09)、[Q10](02-thirty-decision-questions.md#q10)、[Q12](02-thirty-decision-questions.md#q12)、[Q13](02-thirty-decision-questions.md#q13) |

**狀態歸納**：✅ 集中在本機可完成的部分（F1、F6、F7 示範名單、F8、F11、F13、F16、F17，以及各 AI 功能的示範備援）；🟡 集中在外部服務與實機（Gemini、Firestore、氣象署、系統 AR）及缺單元測試的 F3；🎭 是搭車、推播與營運預估；⛔ 是商業閉環（F20）與 BigQuery ML（F18）。

---

## 5. 專案結構與模組職責

架構圖、資料流與設計取捨見[文件 3](03-architecture-innovation-and-demo.md)；這裡只列職責與依賴。

```
src/
  main.tsx, App.tsx          進入點；頂欄（時鐘＝一天劇本、AI 狀態燈、設定）、5 分頁、toast
  lib/store.tsx              全域狀態（React context）：設定、模擬時間、天氣、點亮格、任務、圖鑑、分頁
  lib/settings.ts            設定型別與 localStorage 讀寫
  lib/firebase.ts            Firebase 初始化、App Check、匿名登入
  lib/ai.ts                  4 個 Gemini 功能＋示範備援＋AI 狀態事件
  lib/geo.ts                 H3（RES=10）、遊戲範圍、POI、示範路線與取樣
  lib/ocr.ts                 PP-OCRv4 單行辨識（ONNX Runtime Web）
  lib/lucky.ts               幸運數字、車牌解析、雜湊比對、配色
  lib/sprite3d.ts            three.js 小精靈與 GLB 匯出
  lib/social.ts              Firestore 好友排行
  lib/weather.ts             氣象署與雨天情境
  views/                     MapView、ScanView、SpriteChat、FriendsView、OpsView、SettingsSheet、SpriteAvatar
  data/demand.json           資料管線匯出的 0–100 彙總指數
  data/demo.ts               虛構玩家小涵、示範任務／對話／營運理由
  data/districts.json        離線底圖行政區界
public/models/               PP-OCRv4 模型（10.8 MB）與字典
public/sprites/              5 色小精靈 GLB
scripts/                     e2e.py、make_fixtures.py、ocr_check.py、export_glb.py
data-pipeline/               Python 資料管線（00–10 已提交；11–13 未提交，I14）＋BigQuery SQL
docs/                        提案決策、研究、資料分析報告、影片腳本、簡報原始檔、示範車牌
```

**模組依賴（由上往下呼叫）**

| 模組 | 依賴 | 被誰使用 |
|---|---|---|
| `store.tsx` | `settings`、`geo`、`lucky`、`weather`、`demo.ts`、`demand.json` | 所有 views |
| `ai.ts` | `firebase`、`geo`（POI 白名單）、`demo.ts`（備援） | MapView、SpriteChat、ScanView、OpsView、App（狀態燈） |
| `social.ts` | `firebase` | FriendsView（ScanView 透過 `ensureSubmit` 間接使用） |
| `ocr.ts` | `onnxruntime-web/wasm`（`../../vite.config.ts` alias） | ScanView |
| `sprite3d.ts` | `three` | ScanView、`scripts/export_glb.py`（經 dev server） |
| `geo.ts` | `h3-js` | store、MapView、OpsView、ai |

**技術與版本**（`../../package.json`）：React 18.3、Vite 5.4、TypeScript 5.6、firebase 13、maplibre-gl 4.7、h3-js 4.1、onnxruntime-web 1.30、three 0.183、@google/model-viewer 4.4。測試：Python 3.11、Playwright、onnxruntime、Pillow。本機環境 Node v24、Python 3.11.9。

---

## 6. 資料、整合與部署現況

### 6.1 資料來源與處理（摘要，詳見[文件 4](04-data-status.md)）

| 資料 | 位置 | 處理方式 | 進 App？ |
|---|---|---|---|
| yoxi 競賽資料（964,991 筆，2026/2/1–4/30，含乘客編號與精確座標） | `data-pipeline/data/raw/`、`extracted/`（gitignore） | `scripts/00–07` 清理、分析、預測、匯出 | **否** |
| 彙總指數（152 個 H3 第 9 級格、信義／松山星期×小時、低谷、5/1–5/7 預測、上車點） | `../../src/data/demand.json` | `05_export.py` 匯出後複製 | 是（0–100 指數） |
| 路線與熱門路段（本機 OSRM） | `data-pipeline/data/processed/routes/` | `08–10` | 否（只在報告） |
| 示範玩家、任務、對話 | `../../src/data/demo.ts` | 手寫虛構 | 是 |
| 行政區界 | `../../src/data/districts.json`、`data-pipeline/geo/towns.geojson` | 內政部界線 | 是 |

隱私規則：逐筆資料不得進 `src/`、`public/`、`dist/` 或 commit（`../../.gitignore` 已排除 `raw_df.pkl`、`*.parquet`、原始資料與 OSRM 檔）【程式碼確認】。公開邊界的決策見 [Q18](02-thirty-decision-questions.md#q18)。

### 6.2 外部 API／服務

| 服務 | 用途 | 呼叫位置 | 需要的設定 | 狀態 |
|---|---|---|---|---|
| Firebase AI Logic（Gemini Developer API），預設模型 `gemini-3.1-flash-lite` | 任務、對話、拍車台詞、營運理由 | `ai.ts` `getModel()` | Firebase 專案、AI Logic 啟用、App Check | 🟡 |
| Firebase App Check（reCAPTCHA v3 或偵錯權杖） | AI Logic 強制要求 | `firebase.ts` `getFirebase()` | reCAPTCHA 網站金鑰或偵錯權杖 | 🟡（I15） |
| Firebase Auth（匿名） | 好友排行身分 | `firebase.ts` `ensureUser()` | 主控台啟用匿名登入 | 🟡 |
| Cloud Firestore | 好友排行 | `social.ts` | 建資料庫、部署 `firestore.rules` | 🟡 |
| OpenFreeMap | 暗色底圖 | `MapView.tsx`、`OpsView.tsx` | 無；需保留出處 | ✅ |
| 中央氣象署 F-C0032-001 | 傍晚降雨機率 | `weather.ts` `fetchCwa()` | 授權碼 | 🟡 |
| Google Fonts | Noto Sans TC、Fredoka | `index.html` | 無 | ✅ |

### 6.3 必要設定（沒有 `.env`）

本專案**沒有 `.env` 或建置期環境變數**；所有執行期設定都在 App 右上角齒輪的設定頁輸入，存在使用者瀏覽器 `localStorage`（`../../src/lib/settings.ts`）。部署在 Firebase Hosting 時 `firebaseConfig` 可留空，會讀 `/__/firebase/init.json`；GitHub Pages 沒有這個路徑（本次探測 404），必須手動貼上（I2）。

| 設定欄位 | 用途 | 預設 |
|---|---|---|
| `firebaseConfig` | Firebase web config（JSON 或主控台片段） | 空 |
| `appCheckMode` | `debug`／`recaptcha`／`none` | `debug` |
| `appCheckDebugToken` | App Check 偵錯權杖 | 空 |
| `recaptchaSiteKey` | reCAPTCHA v3 網站金鑰 | 空 |
| `model` | Gemini 模型名稱 | `gemini-3.1-flash-lite` |
| `cwaKey` | 氣象署授權碼 | 空 |
| `weatherMode` | `rain`（示範情境）／`live` | `rain` |
| `luckyOverride` | 今日幸運數字覆寫（demo 填 21，I16） | 空 |
| `room` | 好友房間代碼 | `demo` |
| `nickname` | 暱稱 | 空 |
| `forceDemo` | 全部使用示範資料 | `false` |
| `allowRepeat` | 同一台車可重複收集（彩排用） | `false` |

`localStorage` 鍵（前綴 `yoxi-lighting-city:`）：`settings:v1`、`lit:v6`、`visits:v2`（舊 `lit:v5`、`lit:v4`、`visits:v1` 會自動轉換）、`collected:v1`、`seen:v1`（拍車每日紀錄）、`best:{YYYY-MM-DD}`（當日最佳成績）。

部署用：`.firebaserc`（從 `../../.firebaserc.example` 複製，填 Firebase 專案 ID；已 gitignore）。不要把任何金鑰、權杖寫進 repo。

### 6.4 本機啟動與部署

```bash
npm install
npm run dev                          # http://localhost:5173
npm run build                        # tsc --noEmit + vite build → dist/
npm run preview -- --port 4173

# 測試
pip install -r scripts/requirements.txt && python -m playwright install chromium
python scripts/make_fixtures.py      # 注意：會改寫 tracked 的 docs/plates/*.png（I9）
python scripts/e2e.py                # 需先 build + preview
python scripts/ocr_check.py
```

| 部署方式 | 設定 | 現況 |
|---|---|---|
| GitHub Pages | `../../.github/workflows/deploy-pages.yml`：push 到 main 自動 `npm ci` → `npm run build` → 部署 `dist` | 已上線 `https://n-cobblers.github.io/Lighting-City/`，但服務的是 `08538f7`；`18e94b3` 的 run（38253077290）被 cancel（I1）【執行驗證】 |
| Firebase Hosting | `../../firebase.json`（GLB、ONNX、WASM 的 Content-Type 與快取標頭）；`npx firebase-tools deploy --only hosting,firestore:rules` | ⛔ 未部署（沒有 `.firebaserc`） |
| Netlify Drop | README 第一節 | 未使用【推論】 |

---

## 7. 已知限制、風險與技術債

依影響排序。編號 I1–I18 四份文件共用。

### 7.1 Demo 阻塞（決賽前必須處理）

| 編號 | 問題 | 影響 | 證據 | 最小修正建議 | 對應決策 |
|---|---|---|---|---|---|
| I1 | GitHub Pages 未部署最新 main | 手機打開的是 H3 第 9 級舊版，和 repo 不一致 | `gh run list`：run 38253077290 cancelled；線上 `index-_TdyP08-.js` 與本機 08538f7 建置相同【執行驗證】 | 在 Actions 手動 `workflow_dispatch` 重跑，或推一個新 commit | [Q06](02-thirty-decision-questions.md#q06) |
| I2 | Firebase／Gemini／Firestore／App Check 從未在真實專案驗證 | 「AI 整合度 20%」的即時證據不足；現場可能只看到「示範資料」 | 無 `.firebaserc`；本次無設定執行全走備援【執行驗證】 | 建專案、在 Pages 網域設 reCAPTCHA（含 `n-cobblers.github.io`）或偵錯權杖，實機跑一次 | [Q04](02-thirty-decision-questions.md#q04)、[Q05](02-thirty-decision-questions.md#q05) |
| I4 | 改 H3 第 10 級＋預設格線深淺 35% 後點亮很淡 | 搭車點亮是第一個「哇」時刻，現在新格子淡、鄰格幾乎看不見；點亮比例從約 31% 變約 12% | 18e94b3 前後的 e2e 截圖對照【執行驗證】；`MapView.tsx` `gridOpacity` 預設 35 | 預設深淺調高或只套用在格線、不套用在 lit-fill；e2e 加像素或圖層檢查 | [Q07](02-thirty-decision-questions.md#q07) |
| I7 | 簡報／影片技術敘述與原型不符 | 評審追問時前後矛盾；可行性與誠信風險 | 影片旁白寫 Flutter、BigQuery ML 用降雨預報；簡報 P9 寫 Flutter、ML Kit、ARCore；車資 NT$300、SOM 1.8 億 | P9 改「原型 Web 已完成，決賽版另議」；旁白改「低谷時段預測＋天氣情境提醒」；數字改 NT$254、約 1.6 億 | [Q14](02-thirty-decision-questions.md#q14)、[Q16](02-thirty-decision-questions.md#q16) |
| I16 | 幸運數字依日期算（10/12 為 26），示範車牌是為 21 設計 | 忘記覆寫就不會「中了！」 | `lucky.ts` `luckyNumber()`；e2e 截圖顯示 26【執行驗證】 | demo 檢查清單第一項：設定填 21 | [Q28](02-thirty-decision-questions.md#q28) |
| （Q18） | GitHub repo 為 PUBLIC，已提交逐時上車數 CSV、路段流量、上車點等競賽資料衍生檔 | 若競賽規範不允許公開衍生資料，屬合規風險；Git 歷史也保留這些檔案 | `gh repo view N-cobblers/Lighting-City --json visibility` → `PUBLIC`【執行驗證】；細節見[文件 4 第 9 節](04-data-status.md#9-隱私合規與公開範圍) | 先向主辦方確認規範；確認前不再新增衍生資料，必要時改為 private | [Q18](02-thirty-decision-questions.md#q18) |
| I5 | 營運示範理由與實際數字不符；推播任務地點與乘車金寫死；出處壓到圖例 | 評審看到「比中位數短」但數字相同 | `FALLBACK_OPS.reason`；信義 14:00 為 5.6 分＝中位數 5.6【執行驗證】；`OpsView.tsx` `push()` | 示範理由改成依數字動態組句；`poiId` 依行政區選上車點 | [Q13](02-thirty-decision-questions.md#q13) |

### 7.2 產品缺口

| 編號 | 問題 | 影響 | 最小修正建議 | 對應決策 |
|---|---|---|---|---|
| I3 | 「一天」定義不一致：`ScanView` `dayKey`、`FriendsView` `bestKey` 用 UTC，`social.ts` 房間用本地日期 | 台灣 00:00–08:00 拍車會被算到前一天；排行與本機最佳成績錯位 | 抽一個共用 `localDayKey()`（Asia/Taipei） | [Q22](02-thirty-decision-questions.md#q22) |
| I6 | 「我到了」不驗證位置；搭車、預約是模擬 | 不能宣稱「真實到訪」或「真實叫車轉換」 | 步行任務用 `geolocation` 判斷是否在 POI 所在格或鄰格 | [Q09](02-thirty-decision-questions.md#q09) |
| I12 | Firestore rules：`diff`／`plateMasked`／`palette` 未驗型別；匿名登入可讀任何房間；`sum` 前端自報 | 排行可被竄改；房間代碼可猜 | rules 補型別與長度；正式版由後端驗證車牌事件 | [Q21](02-thirty-decision-questions.md#q21) |
| I17 | 營運預測曲線是 5/1–5/7 的歷史預測，週末顯示週五型態 | 標「下一週」容易被誤解為即時預測 | 文案改「以 4/30 前資料預測 5/1–5/7（回測）」 | [Q15](02-thirty-decision-questions.md#q15) |
| I11 | 首次拍車下載約 25 MB；主 bundle 1.2 MB | 行動網路下首次拍車等待久 | demo 前用 Wi-Fi 先開一次「拍車」暖機；長期可延遲載入 MapLibre 以外模組 | [Q29](02-thirty-decision-questions.md#q29) |
| I15 | App Check 偵錯模式依賴 SDK 覆寫會丟錯的 `CustomProvider` | 偵錯權杖可能失效，AI 全部退回示範 | 實機驗證；失敗則改用 reCAPTCHA v3 | [Q05](02-thirty-decision-questions.md#q05) |

### 7.3 長期維護

| 編號 | 問題 | 影響 | 建議 | 對應決策 |
|---|---|---|---|---|
| I10 | 無單元測試、無 lint；CI 只 build 不跑 e2e；e2e 依賴 Playwright 瀏覽器下載與 ffmpeg | 回歸靠人工；本次 Playwright 新版瀏覽器下載失敗，需改用舊版 | 先補 `glowLevel`、`extractPlate`、`luckyNumber`、日期鍵的單元測試；CI 加 e2e（可選） | [Q30](02-thirty-decision-questions.md#q30) |
| I8 | 文件與 repo 不一致：README／`../links.md` 提到的示範車牌 PDF、內部討論書 docx 不在 repo；CLAUDE.md 寫「還沒部署」；README 以 Netlify Drop 為主 | 新組員照文件找不到檔案 | 更新 README 與 CLAUDE.md 現況 | — |
| I9 | `make_fixtures.py` 會重寫 tracked plate PNG | 跑測試就產生非預期 diff | 輸出改到 `scripts/fixtures/` 或只在缺檔時產生 | [Q30](02-thirty-decision-questions.md#q30) |
| I14 | 工作區有未提交的資料研究（`11_route_deep.py`、`12_valley_value.py`、`13_rider_segments.py`、`data/processed/research/`、`docs/data-analysis/14–17_*.png`） | 作者與完成度不明，可能遺失或與報告不一致 | 作者確認後另開 PR；本次不 stage | [Q17](02-thirty-decision-questions.md#q17) |
| I13 | Firebase 設定變更需重新載入 | 低；設定頁已自動 reload | 維持 | — |
| I18 | 18e94b3 一併提交 `.vscode/settings.json`（終端自動核准設定） | 低；個人編輯器設定進版控 | 團隊確認是否保留或加入 `.gitignore` | — |

---

## 8. 下一階段建議

工作量：S＝半天內、M＝1–2 人日、L＝3 人日以上（相對估計，非精確工期）。

### 8.1 Demo 前必須完成

| 順序 | 工作 | 量 | 依賴 | 對應 |
|---|---|---|---|---|
| 1 | 重新部署最新 main 到 Pages（或定案改 Firebase Hosting），iPhone 與 Android 各實機跑完整主線一次並記錄錯誤 | S＋M | [Q06](02-thirty-decision-questions.md#q06) | I1 |
| 2 | 決定格網解析度與預設亮度，讓搭車點亮清楚可見；e2e 補檢查 | S | [Q07](02-thirty-decision-questions.md#q07) | I4 |
| 3 | 建 Firebase 專案（AI Logic、App Check、匿名登入、Firestore＋rules），驗證 Gemini 綠色標籤與兩機排行；或依 Q04 決定全程示範並在講稿揭露 | M | [Q04](02-thirty-decision-questions.md#q04)、[Q05](02-thirty-decision-questions.md#q05) | I2、I15 |
| 4 | 修 UTC 日期鍵 | S | [Q22](02-thirty-decision-questions.md#q22) | I3 |
| 5 | 修營運示範文案與推播任務的地點／乘車金 | S | [Q13](02-thirty-decision-questions.md#q13) | I5 |
| 6 | 更新簡報 P9、影片旁白、車資與 SOM | S | [Q14](02-thirty-decision-questions.md#q14)、[Q16](02-thirty-decision-questions.md#q16) | I7 |
| 7 | 準備道具（列印示範車牌）、幸運數字 21、重置流程、雙手機同房間 | S | [Q11](02-thirty-decision-questions.md#q11)、[Q28](02-thirty-decision-questions.md#q28) | I16 |
| 8 | 預錄完整主線備援影片 | S | 1–7 | [Q29](02-thirty-decision-questions.md#q29) |

詳細 demo 腳本、重置流程與備援見[文件 3 第 E 節](03-architecture-innovation-and-demo.md)。

### 8.2 Demo 後短期優先

| 工作 | 量 | 依賴 | 對應 |
|---|---|---|---|
| BigQuery ML ARIMA_PLUS 實跑並把結果接回營運頁 | M | [Q15](02-thirty-decision-questions.md#q15) | F18 |
| 步行任務位置驗證 | M | [Q09](02-thirty-decision-questions.md#q09) | I6 |
| 搭車點亮改用預先算好的道路路線 | M | [Q08](02-thirty-decision-questions.md#q08)、[Q18](02-thirty-decision-questions.md#q18) | F2 |
| Firestore rules 補強與排行防作弊 | S–M | [Q21](02-thirty-decision-questions.md#q21) | I12 |
| 單元測試、CI 跑 e2e、修 `make_fixtures` 副作用 | M | [Q30](02-thirty-decision-questions.md#q30) | I9、I10 |
| AI 任務品質規則檢查與小型 eval | M | [Q24](02-thirty-decision-questions.md#q24) | F4 |
| 整理未提交的資料研究 | S | [Q17](02-thirty-decision-questions.md#q17) | I14 |

### 8.3 可延後

| 工作 | 量 | 依賴 | 對應 |
|---|---|---|---|
| 司機端獨立畫面 | L | [Q12](02-thirty-decision-questions.md#q12) | F20 |
| 真實推播、乘車金發放與核銷 | L | [Q10](02-thirty-decision-questions.md#q10)、[Q13](02-thirty-decision-questions.md#q13)、yoxi 系統介接 | F20 |
| 足跡雲端備份／換機 | M | [Q20](02-thirty-decision-questions.md#q20) | F11、F3 |
| 需求指數擴到雙北、更細粒度 | M | [Q19](02-thirty-decision-questions.md#q19)、[Q18](02-thirty-decision-questions.md#q18) | F13 |
| 和泰集團導流情境 | M | [Q27](02-thirty-decision-questions.md#q27) | — |
| 是否轉 Flutter | L | [Q14](02-thirty-decision-questions.md#q14) | — |

---

## 附錄：本次執行紀錄與未檢查範圍

### 實際執行（2026-10-12，Windows 11、Node v24.19、Python 3.11.9）

| 指令 | 結果 |
|---|---|
| `npm run build`（08538f7 與 18e94b3） | 兩者都通過；主 bundle `index-*.js` 1.22 MB（gzip 349 kB）、`ScanView` 615 kB、`ort-wasm-simd-threaded.wasm` 14.2 MB【執行驗證】 |
| `python scripts/make_fixtures.py` | 產生假相機影片；同時改寫 tracked 的 `docs/plates/*.png` 與產生 PDF，已還原與刪除（I9） |
| `python scripts/e2e.py` | `python -m playwright install chromium` 下載失敗，改用本機已安裝的 chromium-1223（以 wrapper 指定 `executable_path`，未修改 repo）；兩個 commit 皆「全部通過」，約 60–70 秒；截圖確認地圖、搭車、拍車、AR 預覽、好友、營運畫面 |
| `python scripts/ocr_check.py` | 5 張示範車牌全部辨識正確，信心 0.990–0.997 |
| curl GitHub Pages | 首頁 200、ONNX 200（`application/octet-stream`）、GLB `model/gltf-binary`、`/__/firebase/init.json` 404 |
| `gh run list` | 08538f7 部署 success；18e94b3 部署 cancelled |

### 未檢查或未能驗證的範圍

| 範圍 | 原因 |
|---|---|
| Gemini、Firestore、匿名登入、App Check、氣象署 API | 沒有 Firebase 專案設定與 CWA 授權碼 |
| iPhone Safari／Android Chrome 實機、真實相機、Quick Look／Scene Viewer | 本次只有桌面無頭瀏覽器 |
| 資料管線重跑（`data-pipeline/scripts/00–10`） | 原始與逐筆資料只在本機（已 gitignore），本次沒有重跑；指標以既有 `processed/` 輸出核對為準，詳見[文件 4](04-data-status.md) |
| `node_modules/`、`dist/`、`public/models/*.onnx`、`public/sprites/*.glb`、OSRM 處理檔 | 第三方或編譯產物、大型二進位檔 |
| `docs/proposal-deck/`（簡報 HTML 原始檔）、`docs/research-notes/` 全文 | 只抽查與本文件相關的技術與數字敘述 |
| 未提交的 `data-pipeline/scripts/11–13`、`processed/research/` | 他人進行中的工作，只記錄存在（I14） |
