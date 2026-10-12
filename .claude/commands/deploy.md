---
description: 建置並部署到 Firebase Hosting
---
1. 確認專案根目錄有 `.firebaserc`；沒有的話從 `.firebaserc.example` 複製，並向我詢問 Firebase 專案 ID。
2. `npm run build`。
3. `npx firebase-tools deploy --only hosting,firestore:rules`（第一次需要 `npx firebase-tools login`）。
4. 回報網址（`https://專案ID.web.app`），並提醒我在手機上確認：任務卡出現綠色「Gemini 即時生成」、右上角小圓點為綠色。
$ARGUMENTS
