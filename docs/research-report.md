# 點亮 yoxi：讓叫車 App 成為每日城市夥伴

yoxi 開啟頻率低是結構問題，不是功能太少：計程車只占台灣民眾平日運具使用的 2.5%，八成叫車用戶只用一個 App，yoxi 現有的每日機制（天天領、好康任務、點從天降）又幾乎都綁在下一趟車上，沒搭車的日子就沒什麼價值。競品各自靠一個更高頻的「鄰居」撐起互動，Uber 靠 Uber Eats 與 Uber One，LINE GO 寄居在每天開 14 次的 LINE，台灣大車隊靠生活服務與外部點數；但沒有一家公開開啟頻率，研究範圍內也沒有一家系統性地主動經營民眾每天的移動決策，例如下雨、捷運延誤、找停車位、活動散場、航班與高鐵時刻。國際證據指向同一結論：最有效的是以實用為核心、再綁上承諾或群體機制的產品（Lyft Price Lock 持有者每月多搭約 4 趟，Grab Group Order 的留存與頻率是平均的兩倍），純遊戲化的效果約四週後就開始消退，硬塞給使用者的 AI 介面還可能招來一波負評。和泰手上已有現成的閉環零件：近 400 萬集團會員、1 點等於 1 元且兌換率逾九成、可直接折抵 yoxi 車資的和泰Points，加上氣象署開放資料與 TDX 即時交通資料提供的每日觸發點。供給端也有缺口可填：專職計程車司機每天約四分之一的營業時間是空車，yoxi 司機更直言「單量少」。對團隊選定的「yoxi 點燈城」來說，關鍵不在地圖多好玩，而在每一盞燈都要由真實的移動需求或空車時段點亮。具體來說，AI 情境任務要從天氣、交通與活動資料產生且不搭車也能完成，好友競賽要導向多人同行，需求預測導流則要從清單最後一項移到提案正中央，因為它最能對應評審的「商業價值」、和泰「從被動回應到主動預測」的願景與往屆得獎方向。

## 一、兩百萬下載、活躍會員卡在百萬：yoxi 零件齊全，卻缺每日開啟的理由

### 和泰聯網經營的「派遣平台加品牌車隊」

yoxi 於 **2020 年 11 月 19 日正式上線**（[中央社](https://www.cna.com.tw/news/afe/202011190376.aspx)）。品牌、官網與乘客 App 由和泰汽車子公司**和泰聯網**經營（[yoxi About](https://www.yoxi.app/about-yoxi)）。負責車隊派遣的**和泰移動服務**設立於 2020 年 4 月 17 日：董事席次由和泰聯網代表出任，監察人則代表和潤企業（[LawPlayer 公司登記](https://lawplayer.com/company/83610921)）。查無 JapanTaxi、GO 或 Uber 持股的證據：日本 GO 自 2025 年 7 月起與 yoxi 串接（[DX Magazine](https://dxmagazine.jp/news/2531uk54/)），Uber 自 2024 年 2 月起合作（[數位時代](https://www.bnext.com.tw/article/78389/yoxi-uuber)），兩者都只是商業夥伴。2026 年對外發言的是和泰聯網總經理**邱威凱**（[TVBS](https://cars.tvbs.com.tw/life/331958)）。

營運上，yoxi 同時是派遣平台與品牌車隊。司機須持執業登記證、靠行車行後「入隊」接單（[yoxi 車行資訊](https://www.yoxi.app/driverAgency)），車輛主打 **5 年內的 TOYOTA 與 Lexus 新車**（[yoxi 乘客](https://www.yoxi.app/passenger)）。yoxi 向司機收派遣費，區域方案「0 元起」，一般多元「免月租、派遣費 10%」（[yoxi 成為司機](https://www.yoxi.app/driver)），低於 2024 年報導中 Uber 的 25% 與 LINE GO 的 15% 抽成（[數位時代 2024](https://www.bnext.com.tw/article/78389/yoxi-uuber)）。和泰真正的飛輪在司機端。台灣約 10 萬輛計程車中約八成是 TOYOTA（[中央社](https://www.cna.com.tw/news/afe/202011190376.aspx)），所以和泰能用購車貸款、原廠保養與保險優惠招募司機，再把派遣費壓低。目前小黃服務 13 個縣市、多元服務 9 個縣市，並透過 GO 覆蓋日本 46 個都道府縣（[yoxi FAQ](https://www.yoxi.app/faq)）。

### 規模數字：下載持續成長，活躍會員停滯

yoxi 從未公開營收、獲利、MAU/DAU 或開啟頻率，以下都是公司自己公布的數字：

| 時間 | 公司揭露指標 | 來源 |
|---|---|---|
| 2021-08 | 會員下載 50 萬、司機 3,000 名、累計 100 萬趟 | [車訊網](https://www.kingautos.net/339474) |
| 2023-09 | 會員約 120 萬、司機逾 7,000 名、投入約 5 億元、**尚未獲利**，預估司機達一萬人可轉虧為盈 | [今周刊](https://www.businesstoday.com.tw/article/category/183015/post/202309200007/) |
| 2024-01 | 「活躍會員數突破百萬」 | [數位時代](https://www.bnext.com.tw/article/78389/yoxi-uuber) |
| 2025-09 | 活躍會員仍為「百萬」 | [數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt) |
| 2026-07 | 下載逾 200 萬、司機逾 1 萬、評論逾 6 萬則平均 4.8 星、企業與政府機關客戶逾 650 家、點數折抵逾 120 萬趟 | [TVBS](https://cars.tvbs.com.tw/life/331958) |

這組數字透露兩件事。第一，活躍會員從 2024 年 1 月到 2025 年 9 月都停在「百萬」，2026 年的新聞稿則改報下載數，暗示用戶成長已趨緩（這是推論，並非公司揭露的趨勢）。第二，下載逾 200 萬、最近一次揭露的活躍會員約 100 萬，集團會員卻有近 400 萬，可推知大量下載者與和泰會員並非經常搭乘的用戶，正是題目所說的低頻困境。從揭露的規模看，yoxi 也明顯落後台灣大車隊的 720 萬 App 用戶與 LINE GO 的 517 萬會員（[數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt)；[TVBS](https://cars.tvbs.com.tw/car-news/342104)）。

### 產品很廣，AI 集中在友善移動

以叫車 App 而言，yoxi 的功能相當完整。車型有尊榮多元、2026 年 9 月上線的**樂聚多元 6 人座**（固定車資、主打家庭與親友同行，[TVBS](https://cars.tvbs.com.tw/car-life/340536)），以及「任意車型」模式與寵物友善。AI 投資集中在高齡與多語族群。**AI 門牌辨識**上線 4 個月就被使用逾 5 萬次（[TVBS](https://cars.tvbs.com.tw/life/331958)），開發起因是約 **40% 年長用戶卡在輸入地址**這一步（[工商時報](https://www.ctee.com.tw/news/20260427701361-430503)）。此外還有逾 700 個無障礙上下車點（[TVBS](https://cars.tvbs.com.tw/life/331958)），以及 7-ELEVEN ibon 的 8 語介面與司機乘客對話的即時翻譯（[工商時報](https://www.ctee.com.tw/news/20260911700013-431207)）。這些功能多半掛在「Mobility for All（行者無界）」的口號下（[旺得富](https://wantrich.chinatimes.com/news/20251113900625-420101)）。2025 年 10 月起，雙北與高雄的車內陸續裝設 12.5 吋平板（[旺得富](https://wantrich.chinatimes.com/news/20251113900625-420101)），可播放影音廣告並讓乘客領取商家優惠；yoxi 把核心乘客定義為「25–45 歲白領上班族」（[旺得富](https://wantrich.chinatimes.com/news/20250925900524-420501)）。

### 每個「非乘車」機制，最後都指向下一趟車

yoxi 其實早有每日開啟的誘因，只是這些誘因的價值幾乎都要搭車才能兌現。**「天天領」**要使用者每天打開 App 按「立即試今日手氣」，可領最高 50 元的隨機優惠券，效期到隔天 23:59，且只限用 App 叫車並以信用卡付款（[yoxi 優惠 910](https://www.yoxi.app/promotion/910)）。**好康任務**的常駐任務是「月來月好運」與「十載有禮」，同樣以搭車次數計算（[yoxi 優惠 1000](https://www.yoxi.app/promotion/1000)）。「點從天降」按搭車趟數送點（[yoxi 優惠 1068](https://www.yoxi.app/promotion/1068)）。「搭車金福袋」讓使用者花 10 點抽 20 到 100 元的搭車金（[yoxi 優惠 1076](https://www.yoxi.app/promotion/1076)）。研究過程中**沒有找到**內容動態、連續簽到、會員分級、訂閱方案、LINE 機器人或 AI 客服，App Store 的介紹文字也仍把 yoxi 寫成純叫車工具（[App Store](https://apps.apple.com/tw/app/id1521393667)）。這對點燈城是重要提醒：yoxi 已經有一個「每日手氣」機制，好友幸運數字競賽必須明顯有別於天天領，否則評審會把它看成換皮。

公司的策略敘事則一路朝「主動提供價值」靠攏。2023 年，管理層說要從「以車為中心」轉向「以人為中心」，並開放封閉的 One ID 生態系（[鏡週刊](https://www.mirrormedia.mg/story/20231214fin004)）。2025 年，yoxi 宣稱計程車將成為「城市移動中的資訊與體驗媒介」（[旺得富](https://wantrich.chinatimes.com/news/20250925900524-420501)）。2026 年 1 月，和泰表示 MaaS 下一步要延伸到更廣的生活消費情境（[優分析](https://uanalyze.com.tw/articles/5340845465)）。最關鍵的是 2026 年 9 月與忠泰美術館的合作：yoxi 直接把自己定位為**「你的城市探索夥伴」**，並預告將擴大藝術、音樂、旅遊與生活的合作，以增加「服務場景與用戶接觸點」（[TVBS](https://cars.tvbs.com.tw/life/341717)）。點燈城的「城市探索地圖」幾乎就是這句品牌主張的產品化，這是提案最強的對齊點。

## 二、競品都借一個更高頻的「鄰居」撐起互動，卻沒人經營每天的移動決策

### 法規把競爭推向體驗與忠誠度

台灣登記計程車約 **92,303 輛**（2026 年 5 月底，[公視](https://news.pts.org.tw/article/814182)），和 2020 年 5 月底的 92,365 輛幾乎一樣（[監察院](https://cybsbox.cy.gov.tw/CYBSBoxSSL/edoc/download/41668)），總量已經飽和。結構正快速轉向只能用 App 叫的多元計程車，2025 年上半年約占三成（[數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt)）。派遣市場由少數業者主導。**台灣大車隊 55688** 約有 2.9 萬輛車，約占全台計程車三成（[數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt)），並自稱派遣市占四成六（[風傳媒](https://www.storm.mg/article/11086708)）。**Uber** 車輛數僅次於 55688（[數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt)），2026 年 2 月完成收購皇冠大車隊（[工商時報](https://www.ctee.com.tw/news/20260205700953-431401)）。**LINE GO** 司機逾 1.5 萬名，自稱市場第三（[優分析](https://uanalyze.com.tw/articles/6950634196)）。**yoxi** 合作司機逾 1 萬名。**Bolt** 2025 年 9 月進場，以低抽成與不收乘客平台費競爭（[數位時代](https://www.bnext.com.tw/article/84553/2025-bolt-ride-hailing-platform)）。以上市占都由業者自行公布，市場上沒有獨立研究。法規進一步限縮了競爭空間。小黃費率由公會擬定、主管機關核定（[工商時報](https://www.ctee.com.tw/news/20260109700926-431401)）；一輛車只能靠行一個車隊（[數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt)）；乘客端不得跨平台派遣（[數位時代](https://www.bnext.com.tw/article/78389/yoxi-uuber)）。Uber 2026 年在北投試辦機車載客，交通部與台北市直接認定違法（[公視](https://news.pts.org.tw/article/815675)）。價格與供給都難以拉開差距，平台只能在**體驗、可靠度、忠誠度與鄰近服務**上競爭。點燈城這類互動提案正落在這個空間，而且不涉及共乘或白牌，法規風險低。

### 叫車 App 只在有需求時才被打開

台灣沒有任何叫車 App 公開 DAU/MAU 或開啟頻率。Z.com Engagement Lab 用 2,397 人的裝置被動數據加問卷進行研究，結果顯示 **80% 叫車用戶只用單一 App**。Uber 用戶偏 20–29 歲，傍晚 6 點與週末用得最多；55688 則以商務、清晨與晚間為主。特別值得注意的是，**yoxi 用戶花更多時間在找折扣與獎勵**（[Z.com](https://engagement.z.com/resource/article/insights-taiwan-hailing-202410.html)）。這是一把雙面刃：yoxi 用戶確實會為了獎勵打開 App，但這類用戶在誘因停止時也最容易流失。55688 就直言，補貼會製造「假性需求」（[數位時代](https://www.bnext.com.tw/article/84554/2025-uber-yoxi-55688-bolt)）。關鍵時刻的忠誠度也很薄弱。2025 年 7 月文湖線故障時，媒體建議通勤族「同時開啟……四大平台，看看系統先配對哪一平台，就搭哪一台」（[NOWnews](https://www.nownews.com/news/6712947)）。再加上 yoxi 司機自 2024 年起也能接 Uber 的優步小黃訂單（[INSIDE](https://www.inside.com.tw/article/34203-yoxi-uber-taiwan)），乘客專程打開 yoxi 的理由又少了一個。

### 四家競品的非乘車互動槓桿

| 槓桿 | Uber | 台灣大車隊 55688 | LINE GO | Bolt |
|---|---|---|---|---|
| 高頻「鄰居」 | Uber Eats（同帳號同會員） | 1,000+ 類生活服務（[數位時代](https://www.bnext.com.tw/article/81927/2024-55688)），但多半本身也低頻 | LINE 本體：每週觸及 93%，平均每天開 14 次（[旺得富](https://wantrich.chinatimes.com/news/20251125900301-420501)） | 無 |
| 會員／點數 | Uber One 2026 年 6 月宣布月費由 120 元漲到 **199 元**，乘車回饋改為最高 15% 點數，新增家庭共享（[工商時報](https://www.ctee.com.tw/news/20260610701344-430503)） | 熊友會 5 級；可用 Happy Go、LINE Points、街口、亞洲萬里通付車資（[遠見](https://www.gvm.com.tw/article/84514)） | 會員由 3 級擴為 5 級；半年內 100 趟或消費 5 萬元可升級（[車訊網](https://www.kingautos.net/370723)） | 未見會員方案，主打低抽成與低價（[數位時代](https://www.bnext.com.tw/article/84553/2025-bolt-ride-hailing-platform)） |
| 遊戲化／社交 | 年度回顧加推薦獎勵（[旺得富](https://wantrich.chinatimes.com/news/20251222900548-420501)）；青少年與家庭帳號 | 品牌影片與展覽 | 等車小遊戲（[旺得富](https://wantrich.chinatimes.com/news/20251009900456-420501)）；每週搭車挑戰、週年貼圖、家庭群組、幫人叫車（[車訊網](https://www.kingautos.net/370723)） | 無 |
| 乘客端 AI | 未見台灣在地功能 | 只用於派遣（與 Google 合作，[風傳媒](https://www.storm.mg/article/11086708)） | 語音叫車（2023）；以 **MCP server** 串接的 agentic 行程規劃測試（[TechNews](https://technews.tw/2026/01/21/exclusive-interview-with-line-go-cto-hayden-huang/)） | 無 |
| 公開成效 | 未揭露台灣會員數 | 2026 上半年營收 +8%（[ETtoday](https://finance.ettoday.net/news/3218168)）；執行長坦言最大挑戰是大眾認為 55688「只是叫車 App」（[數位時代](https://www.bnext.com.tw/article/81927/2024-55688)） | 2026 年 1–7 月叫車趟數僅 **+3%**，機場接送 +57%（[車訊網](https://www.kingautos.net/370723)） | 上線 3 個月完成趟數較初期增近五成，基期低（[旺得富](https://wantrich.chinatimes.com/news/20260114900385-420501)） |

### 天天出現不等於多搭車

這張表最重要的訊息是：**每天被看見，不會自動帶來乘車量**。LINE GO 住在台灣人每天開 14 次的 App 裡，官方帳號好友逾 1,000 萬（[工商時報](https://www.ctee.com.tw/news/20260114700949-430503)），核心叫車趟數卻只成長 3%。成長來自有計畫、有社交情境的需求，例如機場接送、短租與企業用車。55688 的超級 App 把每位用戶的消費面拉寬了，大眾認知卻沒跟著改變。Uber 的跨服務黏著則來自外送，yoxi 無法複製。每家競品都靠一個更高頻的鄰居撐起互動：Uber 是吃飯，LINE GO 是聊天，55688 是生活雜務與外部點數，yoxi 是購車與保修，而後者本身也低頻。真正還沒被搶下的位置是**每天的移動決策**：下雨要不要出門、捷運延誤、停車位、活動散場、航班與高鐵時刻。研究範圍內沒有任何競品系統性地主動服務這些時刻。不過 LINE GO 已在測試 agentic 行程規劃，這個空窗不會開太久。

## 三、計程車只占運具 2.5%，但下雨、找車位與接送長輩天天都在發生

### 用戶只拿 yoxi 當訂車工具來評價

yoxi 在台灣 App Store 拿到 **4.8 星、約 5.4 萬則評分**。Uber 是 4.9 星、約 59 萬則，評分數約為 yoxi 的 11 倍（[App Store yoxi](https://apps.apple.com/tw/app/id1521393667)；[App Store Uber](https://apps.apple.com/tw/app/uber/id368677368)）。yoxi 頁面上看得到的評論全都圍繞乘車本身，例如「預估抵達的時間嚴重過度樂觀」「預約接送司機單方面取消太過份」、希望有中央遠端監控路線偏離，也有人稱讚司機在雨天挑了不會淋雨的地方讓他下車。沒有一則提到兩趟車之間的價值。

社群聲量方面，2024 年 7 月到 2025 年 7 月，yoxi 在叫車 App 中排第四，落後 Uber、55688 與 LINE GO（只計討論量，不分正負評）。同一篇報導引用的一位用戶評語，點出了 yoxi 真正的強項：「常使用預約叫車，派遣來的司機們都會提早到達，減少我的焦慮……車輛乾淨新穎」（[TVBS/DailyView](https://news.tvbs.com.tw/ttalk/2929639)）。部落格對 PTT 與 Dcard 討論的二手整理，稱讚 yoxi 的 5 年內 TOYOTA 新車與頻繁的優惠券，也批評離峰以外價格浮動較大、台北以外車少（[UpToGo](https://uptogo.com.tw/汽機車/哪個計程車隊比較好ptt？/)）。

供給端同樣感受到需求不足。yoxi 司機 App 只有 3.6 星，有司機直言「單量少的可憐，不想辦法增加客源」（[App Store yoxi司機](https://apps.apple.com/tw/app/id1521393549)）。對點燈城來說，這句話說明空車時段導流不只是商業模式，也是留住司機的工具。

### 價格與可靠度是信任缺口

行銷文案說 yoxi「雨天或尖峰時段，均不會有加價」（[TVBS/DailyView](https://news.tvbs.com.tw/ttalk/2929639)），yoxi 自己的費率頁卻寫明，雙北多元計程車的「動態加成倍數為基本運價、計時費用、加成費用之 1~3.9 倍」（[yoxi 費率](https://www.yoxi.app/promotion/105)）。「不加價」的說法大致只適用於跳表小黃與寵物搭乘，雙北多元並不適用。

雨天是落差最大的時刻。台北與新北每年約有 **160–166 天下雨**；雨天司機容易提早達到當日營業目標而收工，塞車又把每趟車程拉長（[今周刊](https://www.businesstoday.com.tw/article/category/183027/post/202201130005/)）。2026 年 6 月新竹豪雨，網友回報 Uber、55688、yoxi 都叫不到車，有人等了一個多小時。還有平台把 2 公里的車程估成兩萬五千多元，業者事後稱是系統錯誤已修復。NOWnews 把這則回應歸給 yoxi，Newtalk 只寫「業者」，究竟是哪一家平台仍無法確認（[NOWnews](https://www.nownews.com/news/6850655)；[Newtalk](https://newtalk.tw/news/view/2026-06-26/1043554)）。

用戶最需要車的時刻，正是最容易對平台失望的時刻。如果 AI 能事先提醒「這一帶快下雨了，現在預約比較穩」，就能同時補上信任缺口並促成叫車。

### 台灣人每天怎麼移動

交通部 113 年「民眾日常使用運具狀況調查」（n=34,236）顯示，**計程車只占平日運具使用的 2.5%**。機車占 43.7%，自用車 26.6%，公共運輸 15.2%；六都的公共運輸占比從台北的 38.3% 到台南的 4.9%，城鄉落差極大（[交通部](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1389089679046873088&type=s&id=56&serno=202506190000)）。全國每日約有 4,261 萬次運具使用，依此推算，計程車每個平日約被使用 107 萬次。總量不小，但對多數人來說是偶一為之的選擇。

出發時間高度集中。7–9 點出發的旅次占 24.5%，17–19 點占 21.9%，兩個尖峰合計約 46%；22 點以後出發的旅次只占 1.7%（全運具，依附表樣本數推估，[交通部統計表](https://www.motc.gov.tw/ch/app/data/doc?id=56&module=survey&detailNo=1387600371127422976&serno=202506260000&type=s&preview=&aplistdn=)）。依旅次目的，通勤占 44.9%。65 歲以上的旅次以休閒（33.8%）、購物（28.2%）與家庭事務（23.6%）為主，合計超過八成五，大多是時間有彈性的行程。女性的購物與家務旅次也明顯多於男性（[交通部](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1389089679046873088&type=s&id=56&serno=202506190000)）。

### 天天發生的移動摩擦

真正天天出現的，是其他運具失靈的時刻。交通部機車及自用小客車調查顯示，**31.6% 的汽機車通勤者到了公司或學校要找車位，平均花 7.2 分鐘**；自用車旅次中有 **20% 是接送家人**；72% 的機車使用者與 82.1% 的汽車使用者也會使用其他運具（[交通部機車及自用小客車調查](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1446329030327406592&type=s&id=56&serno=202511270000&title=1141205公布版_113年機車及自用小客車使用狀況調查報告.pdf)）。高齡化讓照護型移動持續增加：65 歲以上人口已超過兩成，yoxi 的「輪椅收納」與「協助上車」備註 2025 年使用量翻倍，醫療院所上車點約兩成需求來自印尼語用戶（[T客邦](https://www.techbang.com/posts/129049-yoxi-ai-address-recognition-for-seniors)）。「幫別人叫車」也在成長：LINE GO 的幫人叫車功能自 2025 年上線後每月平均成長約 3.5%，主要用途是年輕人幫長輩叫車、商務聚餐接送，以及聚會後安排回程（[旺得富](https://wantrich.chinatimes.com/news/20260324900648-420101)）。

需求在時間與地點上的分布也很清楚。Uber 指出 2024 年晚間 8 點的叫車需求成長近 1.5 倍，週六是需求最高的一天，熱點是高鐵與台鐵車站、夜市與百貨公司（[工商時報](https://www.ctee.com.tw/news/20250625702132-431401)）。LINE GO 全台最熱門的上車地標是台中高鐵站，代駕需求在週五晚上 9 點達到高峰（[遠見城市學](https://city.gvm.com.tw/article/127951)）。供給面則有閒置：交通部 112 年計程車營運調查顯示，專職司機每天營業 9.1 小時，其中 **2.4 小時空車，空車率 26.4%**（[交通部](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1301088644538306560&type=s&id=56&serno=202410300001)）。

### 對點燈城的三個含義

第一，「夜色城市」是好的視覺語言，但觸發點不能只在夜晚。通勤尖峰、午後雷陣雨、假日購物與長輩回診都發生在白天，而 22 點以後出發的旅次只占 1.7%。

第二，每日任務必須在不搭車的情況下也能完成。多數人每天騎機車、搭捷運或走路，任務應該讓他們在這些移動中也能點燈；遇到下雨、延誤或找不到車位，再一鍵轉成 yoxi。

第三，26.4% 的空車率是導流的經濟基礎。不過空車集中在哪些時段與區域，公開資料無法回答，必須用黑客松提供的 yoxi 去識別化資料驗證。至於 65 歲以上那些時間有彈性的休閒、購物與家務行程，最適合引導到離峰時段。

## 四、國內外案例：實用與承諾機制有效，純遊戲化約四週開始退燒

### 連巨頭都做不到天天交易

國際龍頭也沒有做到「每天交易」。Grab 執行長在 2025 年第四季法說會上說，每月交易用戶 4,700 萬人，其中只有 780 萬人每天交易，**比例約 17%**（[MarketBeat 逐字稿](https://www.marketbeat.com/earnings/reports/2026-2-11-grab-holdings-limited-stock/)）。Uber 每位月活躍消費者每月的叫車加外送次數，近五季都停在 **6.1 到 6.2 次**，年增只有 2–4%（[Uber 2026 Q2 補充資料](https://s23.q4cdn.com/407969754/files/doc_earnings/2026/q2/supplemental-info/Uber-Q2-26-Earnings-Supplemental-Data.pdf)）。Andrew Chen 也指出，不是設計給每天使用的產品，不該拿 DAU/MAU 當目標；該問的是，能不能在用戶真正投入的時刻賺到錢（[Andrew Chen](https://andrewchen.com/power-user-curve/)）。所以 yoxi 的每日開啟只能來自不需要交易的實用價值。KPI 也該分兩層：每日開啟衡量習慣是否養成，被導流的乘車趟數與空車時段填補率衡量商業成效。

### 有公開成效數據的做法

| 模式 | 案例 | 公開成效 | 對點燈城的意義 |
|---|---|---|---|
| 通勤價格承諾 | Lyft Price Lock，月費 2.99 美元 | 2024 年 9 月底活躍通行證逾 20 萬張；**持有者平均每月多搭約 4 趟**，流失率低（[MarketBeat Lyft](https://www.marketbeat.com/earnings/reports/2024-11-6-lyft-inc-stock)） | 把用戶最焦慮的漲價變成想「用回本」的承諾；空車時段可提供鎖價或保證有車 |
| 群體機制 | Grab Group Order、Group Ride | Group Order 的**留存與頻率都是平均的 2 倍**；Saver 頻率是平均的 1.5 倍（[MarketBeat Grab](https://www.marketbeat.com/earnings/reports/2026-2-11-grab-holdings-limited-stock/)） | 好友競賽若能導向多人同行，比個人排行榜更有依據 |
| 外部忠誠度串接 | Lyft 與聯合航空、DoorDash、Chase 等 | 北美**超過四分之一的乘車與合作夥伴綁定**；聯合航空串接的新註冊中，相當比例是新用戶與流失回流用戶（[Lyft Q4 2025](https://www.lyft.com/blog/posts/lyft-q4-and-full-year-2025-results-prepared-remarks)） | 和泰Points 就是現成的外部動機 |
| 付費會員 | Uber One | 2026 年第一季會員 5,000 萬，貢獻約**一半**總訂單金額（[Business Wire](https://www.businesswire.com/news/home/20260506718774/en/Uber-Announces-Results-for-First-Quarter-2026)）；會員消費約為非會員 4 倍，留存高 15%（2022 年第四季，[Restaurant Dive](https://www.restaurantdive.com/news/uber-one-subscription-is-boosting-delivery-spend-frequency-and-user-loyalt/642245/)） | 長期可把「點燈進度」接上會員分級 |
| 連續紀錄 | Duolingo | 延續連續紀錄時的新動畫讓新用戶 **D7 留存 +1.7%**；兩次「連續紀錄凍結」讓每日活躍 +0.38%（[Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)） | 每日任務要有容錯，例如雨天、出差、連假可以凍結 |
| 主動推播 | 健康 App 微隨機試驗（1,255 人） | 客製推播讓 24 小時內互動機率 **+3.9%**；中午 12:30 推送效果最好（+8.8%）（[JMIR](https://mhealth.jmir.org/2018/11/e10123/)） | 一天至多一則、以情境觸發 |
| 核心服務優先 | 日本 GO | 媒合率約 97%，派車中位數約 5 秒，等車中位數 3.3 分鐘；**AI 預約訂單成長 3 倍**（[k-tai Watch](https://k-tai.watch.impress.co.jp/docs/news/2133093.html)） | 互動功能救不了不可靠的派車，點燈的終點必須是準時的車 |
| 車主生活 | Kakao T | 一個 App 整合叫車、停車、代駕、充電、洗車與保養，累計 3,000 萬註冊（[DealSite](https://dealsite.co.kr/articles/104845)） | 和泰約 400 萬會員中有大量車主，是最接近的結構類比 |
| 車內注意力 | Uber、Lyft 廣告 | Uber 廣告年化營收 **15 億美元**（2025 年 5 月，[The Current](https://www.thecurrent.com/marketing/marketing-strategy-uber-advertising-scaling-billion-dollar-ad-business)）；Lyft 乘客平均在車上約 17 分鐘，最多查看 App 7 次（[MarketBeat Lyft](https://www.marketbeat.com/earnings/reports/2024-11-6-lyft-inc-stock)） | 車內平板可做車燈小精靈的第二舞台 |

### 台灣的參照：訂閱與儲值留得住人，抽獎招來抱怨

台灣本地的移動 App 也有類似的模式。WeMo 的 PASS 訂閱會員（每月 99 元）約占用戶兩成，騎乘量卻是一般用戶的 4 倍，貢獻逾四成營收（[TechNews](https://technews.tw/?p=1514086)），說明訂閱能把頻率集中到少數核心用戶身上。台北捷運Go 會員從約 60 萬成長到逾 95 萬，但會員抱怨抽獎很難中、寧可直接拿車資回饋（[聯合報](https://udn.com/news/story/7266/8987286)）；之後捷運點數改為可轉入悠遊付儲值（[TVBS](https://news.tvbs.com.tw/life/2992270)）。LINE GO 約四成共享機車用戶也會使用它的其他服務（[工商時報](https://www.ctee.com.tw/news/20260114700949-430503)）。台灣用戶看重的是像錢一樣好用的回饋，而不是機率型的驚喜。點燈城的幸運數字如果只是另一種抽獎，很可能重蹈捷運Go 的覆轍。

### 主動 AI 還沒有成效數據

Uber 的 AI 通勤提醒會依個人搭乘紀錄、即時司機供給與價格趨勢，告訴乘客「什麼時候叫車最划算」（[Uber Go-Get 2025](https://www.uber.com/newsroom/go-get-2025/)）。Grab 在 2026 年把自己重新定位為「東南亞的智慧日常嚮導」，推出 13 項 AI 功能（[Grab](https://www.grab.com/sg/press/others/grab-unveils-13-ai-powered-experiences-at-grabx-2026-as-southeast-asias-intelligent-everyday-guide/)）。但這些發表都**沒有公布採用率或轉換率**。因此團隊不能宣稱「AI 夥伴已被證實能提升開啟」，只能把它列為要驗證的假設，並設計 A/B 測試指標。

### 跌倒的地方，正好對應點燈城的風險

第一，**遊戲化的新鮮感會消退**。一項為期 14 週、756 人的準實驗顯示，遊戲化效果約在第 4 週開始下滑，之後只部分回升，回不到初始水準（[Rodrigues et al.](https://educationaltechnologyjournal.springeropen.com/articles/10.1186/s41239-021-00314-6)）。推播疲勞也是真的：廠商調查稱，每週推播一次就有 10% 的用戶關閉通知（[Business of Apps](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/)，資料較舊）。

第二，**硬塞的 AI 會招來負評**。Snapchat 把 My AI 置頂在聊天列表最上方，付費才能移除，用戶還覺得它使用位置資訊的方式「令人毛骨悚然」。那一週美國 App Store 的平均評分跌到 1.67（2023 年第一季為 3.05），約 75% 是一星（[TechCrunch](https://techcrunch.com/2023/04/24/snapchat-sees-spike-in-1-star-reviews-as-users-pan-the-my-ai-feature-calling-for-its-removal/)）。

第三，**路線地圖會洩漏隱私**，這點和點燈城的關係最直接。Strava 的全球熱力圖在 2018 年被發現暴露了軍事基地，之後又陸續被用來推出用戶住址；Strava 最後讓用戶可以退出熱力圖彙整（[Wikipedia: Strava](https://en.wikipedia.org/wiki/Strava)）。「搭 yoxi 點亮整條路線」的終點，往往就是家或公司。

第四，**遠離核心的生活服務和綑綁式訂閱撐不久**。Gojek 的洗衣、美容等 GoLife 服務在 2019–2020 年陸續關閉（[Wikipedia: Gojek](https://en.wikipedia.org/wiki/Gojek)）。豐田也投資過的 MaaS Global（Whim）募資 1.49 億歐元，赫爾辛基月活躍用戶卻只有約 1 萬人，2024 年 3 月破產（[Traffic Technology Today](https://www.traffictechnologytoday.com/news/mobility-as-a-service/maas-global-declares-bankruptcy.html)）。

第五，**留存手段也有界線**。Uber 在 2022 年關掉免費點數計畫 Uber Rewards（[TechCrunch](https://techcrunch.com/2023/05/30/uber-drops-ride-discounts-for-subscribers-switches-to-cash-back)）。2025 年，美國聯邦貿易委員會（FTC）控告 Uber，指出取消 Uber One 可能要經過 23 個畫面、32 個動作（[FTC](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-takes-action-against-uber-deceptive-billing-cancellation-practices)）。

### 能長久的是「用戶的貢獻讓大家受益」

能長久的互動，往往是用戶貢獻讓所有人都受益的那種。Transit App 讓乘客分享車輛即時位置，替每條路線設排行榜，並提供「幽靈模式」保護隱私（[Transit](https://help.transitapp.com/article/91-what-is-go-crowdsourcing)）。Waze 與 Google 在地嚮導用積分與等級獎勵回報和地圖編輯（[Wikipedia: Waze](https://en.wikipedia.org/wiki/Waze)；[Google Local Guides](https://maps.google.com/localguides/)）。螞蟻森林把虛擬的能量換成真實種下的樹，累計用戶逾 6.5 億，但沒有公開的行為改變因果證據（[Wikipedia: Ant Forest](https://en.wikipedia.org/wiki/Ant_Forest)）。

對點燈城的啟示是：讓「點燈」不只是收集。例如回報一個好上車的地點、一個無障礙入口，或某站計程車排班的狀況，點亮的街區就真的讓下一位乘客更好叫車。這也與 yoxi 已有的 700 多個無障礙上下車點、100 多個電子圍籬一脈相承。

## 五、30 億點、免費開放資料與 30% 的題目契合度：和泰的零件與評審的尺

### 和泰Points 是現成的閉環貨幣

和泰的會員體系由單一的和泰會員帳號，加上和泰Pay、和泰Points 與中信和泰聯名卡組成。截至 2025 年底，集團會員**近 400 萬**，和泰Points 累計發行逾 **30 億點**，其中 2025 年一年就發出逾 7 億點，**兌換率長期超過 90%**（[工商時報](https://www.ctee.com.tw/news/20260115702068-431207)）。1 點等於新台幣 1 元，可折抵保修費與 yoxi 車資，也能在 HOTAI購 兌換 iRent 時數券、yoxi 搭車金與商品（[工商時報](https://www.ctee.com.tw/news/20260430702296-431207)）。在 yoxi 上，已有逾 120 萬趟行程用點數折抵，用掉逾 3,600 萬點（[TVBS](https://cars.tvbs.com.tw/life/331958)）。

這代表「非乘車互動、賺點、折抵 yoxi 車資」的閉環，基礎建設都已存在。反過來說，點數幾乎等於現金。每發一點，都是和泰帳上一筆真實成本。

### 集團的其他資產

集團還有三類可以串接的資產。**去趣**是一站式旅遊 App，2025 年底下載逾 340 萬、會員逾 230 萬，並已串接 yoxi 與 iRent（[工商時報](https://www.ctee.com.tw/news/20260115702068-431207)）。**FunNow** 是和泰 2026 年 9 月以 1,000 萬美元取得約一成股權的即時休閒預訂平台，用戶逾千萬、合作商家逾 1.6 萬（[INSIDE](https://inside.com.tw/article/42459-hotai-motor-funnow-investment-10-million-usd)）。它擅長的晚間與週末預訂，正好是「夜色城市」的內容來源，但目前與和泰Points 或 yoxi 尚無已宣布的串接，只能列為可洽談的合作。**車主生活服務**則包括串接約 1,400 個充電點的 OpenHub、逾 120 處可用點數的洗車點，以及 uTagGo 與 Autopass 停車自動扣款（[工商時報](https://www.ctee.com.tw/news/20260115702068-431207)）。

### 集團的語言與評審習慣

2026 年 2 月，和泰總經理蘇純興提出「AI First 全域布局」，要讓服務「從被動回應到主動預測」（[TVBS](https://cars.tvbs.com.tw/car-news/307746)）。本屆黑客松也正是這個願景的起點（[U-CAR](https://news.u-car.com.tw/news/article/88819)）。yoxi 題目要求的「從被動等待呼叫的工具，轉為主動提供價值的服務平台」，用的是同一套語言。

和泰在自家黑客松宣傳中，兩度用過遊戲化點數任務：2022 年的「馬思」NFT，以及 2024 年的「MaaS Wonderland」任務網站，完成任務可得 100 點（[TVBS](https://cars.tvbs.com.tw/tech/196125)；[NOWnews](https://www.nownews.com/news/5851711)）。評審對「每日任務換點數」並不陌生，提案不能只停在這一層。

### 開放資料：每日情境任務的觸發點

| 資料來源 | 可用內容與更新頻率 | 授權／成本 |
|---|---|---|
| TDX 運輸資料流通服務 | 捷運、台鐵、高鐵動態與延誤（每分鐘）；營運通阻（每 5 分鐘）；停車場剩餘車位（每分鐘）；道路施工與活動等預定事件（每 4 小時）；YouBike 即時車輛數（每分鐘）；桃園機場航班表定、預估與實際時間（[TDX 指南](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/)） | 需申請金鑰；2024-04-29 起依訂閱方案計算額度，方案細節需登入確認（[tdxmotc](https://github.com/tdxmotc/SampleCode)） |
| 中央氣象署 | 鄉鎮天氣預報（每 6 小時）、天氣觀測（每 10 分鐘）、自動雨量站即時雨量（[data.gov.tw](https://data.gov.tw/dataset/9177)） | 免費，政府資料開放授權，需註明出處（[氣象署](https://www.cwa.gov.tw/V8/C/information.html)） |
| 環境部 | 空氣品質指標 AQI，每小時更新（[環境部](https://data.moenv.gov.tw/dataset/detail/AQX_P_432)） | 免費 |
| 臺北市資料大平臺、臺北旅遊網 | 今日施工、捷運各站分時進出量、YouBike 起訖統計；活動展演與活動年曆 API（[data.taipei](https://data.taipei/)；[臺北旅遊網](https://www.travel.taipei/open-api)） | 免費 |
| Google Places（New） | 景點補充資訊；依 SKU 計價，例如 Nearby Search Pro 每千次 32 美元、每月 5,000 次免費（[Google](https://developers.google.com/maps/billing-and-pricing/pricing)） | 付費 |

研究範圍內**找不到臺北大巨蛋、小巨蛋與高雄巨蛋的機器可讀場館行程**。如果點燈城要做「散場任務」，需要用臺北旅遊網的活動年曆、TDX 的活動事件，或人工整理的行程表來替代。

### 評分權重與時程

本屆由和泰汽車主辦，Google Cloud 為合作夥伴，共 7 個企業題目（[官網](https://ht-hackathon.tw/tw/)）。初賽書審的權重是題目契合度 **30%**、創意性 25%、可行性 25%、AI 整合度 20%；決賽改為可行性 25%、AI 整合度 20%、商業價值 20%、原型完成度 20%、簡報 15%。

時程：初賽提案 **10 月 14 日 13:00** 截止，10 月 28 日公布 15 隊決賽名單。11 月 7 日的決賽工作坊必須有過半隊員出席，否則由下一名遞補。11 月 21 日決賽現場展示可運作的原型。

獎項是七題共用的一張表：冠軍 30 萬、亞軍 25 萬、季軍 20 萬，另有潛力新星 4 隊、佳作 8 隊，合計正好 15 個名額。由此推測，yoxi 提案要和其他六題一起搶決賽與頒獎名額（這是推論，需以完整辦法確認）。yoxi 題目的完整說明與資料字典放在官網「企業挑戰題目」區，本研究無法取得。團隊說明中提到的資料包括去識別化的搭乘時段與頻率趨勢、POI 屬性、熱門上下車點與交通樞紐熱區。

### 往屆得獎方向

| 屆次 | 名次 | 隊伍與作品 | 方向 |
|---|---|---|---|
| 2022 | 冠軍 | 咕嚕小隊「DTD 共享計程車」 | 大數據媒合同區乘客、最佳上車點演算法、評價與「共乘夥伴」安全機制（[車訊網](https://www.kingautos.net/348505)） |
| 2022 | 亞軍 | 春日部防衛隊 | iRent 路邊租還熱點預測 |
| 2022 | 季軍 | 成為獎金獵人「WeTrip.」 | 旅運整合平台（[T客邦](https://www.techbang.com/posts/102608-hotai-hackthon-2022-competition-results-released)） |
| 2024 | 冠軍 | 中央大學「AI趣旅：智能識別，一鍵導入」 | 把網路行程與景點照片轉成完整旅程 |
| 2024 | 亞軍 | 我說的都隊 | 社群平台加行程健檢 |
| 2024 | 季軍 | AIO | 依區域預測計程車需求並導引車輛（[TVBS](https://cars.tvbs.com.tw/life/229125)） |

兩屆的總評審都是台大張學孔教授。他評 2022 年冠軍時稱讚媒合系統、安全乘車設計與費用透明，認為「整體內容完備且饒富創意」、具真實落地潛力（[車訊網](https://www.kingautos.net/348505)）；2024 年冠軍則以「創意和完整度」獲得高度評價（[TVBS](https://cars.tvbs.com.tw/life/229125)）。2024 年決賽隊伍的主題已經涵蓋社群連結、遊戲化體驗與 AI 應用（同上）。換句話說，**遊戲化或旅程規劃本身已不新鮮**。6 個得獎作品中有 2 個與計程車派遣直接相關，而得獎者共同的特徵，是把集團營運數據接上一個明確的營運槓桿。

## 六、對點燈城的啟示：地圖是體驗核心，預測引擎才是論證核心

### 把提案的重心從遊戲移到預測

點燈城的方向站得住。它把 yoxi 2026 年 9 月「你的城市探索夥伴」的定位直接做成產品，也呼應 yoxi 品牌頁「驚喜，不限里程」的文案（[yoxi About](https://www.yoxi.app/about-yoxi)）。問題在於五個模組的證據強度差很多。證據最充分、也最貼近評審習慣的，反而是清單上排最後的需求預測導流。往屆六個得獎作品中，2022 年冠軍的共享計程車媒合、亞軍的 iRent 熱點預測，以及 2024 年季軍的區域叫車需求預測，都是把集團營運資料接上營運槓桿。和泰 2026 年「從被動回應到主動預測」的願景，講的也是同一件事。地圖、幸運數字與 AR 屬於遊戲化與社交，2024 年決賽已經有隊伍做過，和泰自己的黑客松宣傳也兩度用過「任務換點數」。

因此建議保留地圖作為使用者看到的體驗核心，但把評審要看的論證核心換成預測引擎，敘事順序也跟著倒過來。第一步先講 AI 如何從天氣、交通、活動與 yoxi 歷史資料，預測「你今天哪個時刻可能需要車」以及「哪個時段車最多」。第二步講情境任務如何把這些預測變成每日提醒，而且不搭車也有用。第三步才是點燈地圖、車燈小精靈與好友競賽，這些是讓人願意回來的外層。換句話說，地圖是收據，記錄使用者在城市裡被照顧過、也貢獻過的足跡。這個結構在初賽能同時拿下題目契合度（30%）與 AI 整合度（20%），到了決賽也直接回答商業價值（20%）。

### 五個模組逐一對照證據

| 模組 | 支持的證據 | 主要風險 | 建議調整 |
|---|---|---|---|
| 點燈探索地圖 | yoxi 自我定位為城市探索夥伴；Transit 排行榜與 Google 在地嚮導證明「貢獻型」機制能長久 | 新鮮感約 4 週消退；路線起訖點洩漏住家與公司（Strava 前例） | 以街區為單位點燈，起訖點模糊化，預設僅自己可見，可一鍵刪除；讓點燈綁定實用貢獻，例如回報好上車點或無障礙入口 |
| 每日 AI 情境任務 | 氣象署、TDX、臺北旅遊網活動資料可即時取得；雙北每年 160–166 天下雨；31.6% 通勤者要找車位 | 任務若要搭車才能完成，就是天天領換皮；推播疲勞 | 任務不搭車也能完成；每天至多一則情境推播；依常用地點與時段個人化，並說明推薦原因 |
| 車燈小精靈 | 車內 12.5 吋平板已部署；Lyft 乘客平均在車上約 17 分鐘；yoxi 已有門牌辨識等影像 AI | 重演 Snapchat My AI 的反彈；與 LINE GO 的 agentic 行程規劃正面重疊；2024 冠軍已是 AI 旅程規劃 | 被呼叫才出現、可靜音，只出現在通勤卡片、雨天提醒等實用時刻；專攻主動的日常移動與和泰生態系，不做旅程規劃 |
| 拍 yoxi 車 AR 彩蛋 | 與 Snap to Go 同屬影像 AI，可證明技術可行；呼應「驚喜，不限里程」 | 全台約八成計程車是 TOYOTA，靠車型認不出 yoxi；在路邊對車拍照有安全與隱私疑慮 | 以 yoxi 專屬標記或車內平板作為辨識錨點；只在停靠點、排班區或上車後觸發；畫面中遮蔽車牌與人臉 |
| 好友每日幸運數字 | Grab Group Order 的留存與頻率是平均的 2 倍；樂聚多元 6 人座主打「親友同行不必再分車」 | 與天天領「試今日手氣」重疊；台北捷運Go 會員抱怨抽獎難中、寧可要車資回饋（[聯合報](https://udn.com/news/story/7266/8987286)） | 讓幸運數字部分由當天點燈行為決定，而非純運氣；獎勵導向多人同行或家人共乘，而不是個人現金券 |
| 需求預測導流 | 專職司機空車率 26.4%；司機抱怨「單量少」；往屆三件得獎作品屬同類 | 小黃費率須經核定；點數成本；預測不準反而傷害信任 | 用點數與搭車金導流，不動車資；空車時段以 yoxi 資料驗證；放在提案正中央 |

「夜色城市」這個意象和計程車需求其實相當契合：Uber 晚間 8 點的需求成長近 1.5 倍，Bolt 的高峰在週五、週六晚上（[旺得富](https://wantrich.chinatimes.com/news/20260114900385-420501)），LINE GO 的代駕高峰在週五晚上 9 點。但不搭車的每日任務，主要得發生在 7–9 點與 17–19 點的通勤尖峰，當時多數人騎機車或搭捷運。一個可行的做法是「白天累積、夜晚點亮」：白天完成情境任務時累積車燈能量，晚上再一次點亮街區，讓視覺主題與真實行為兩邊都顧到。

隱私要在第一版就設計進去，因為路線燈本身就是行蹤紀錄。可參考三個做法：Google 把位置時間軸改存在手機端，並可逐筆刪除（[Google](https://blog.google/products/maps/updates-to-location-history-and-new-controls-coming-soon-to-maps/)）；Transit 提供幽靈模式；Strava 在出事後讓用戶退出熱力圖彙整。好友之間只分享點亮的街區數與排名，不分享路線，風險會小很多。

### 商業閉環：點數是導流成本，不是贈品

決賽有 20% 看商業價值，提案必須把點數成本算清楚。和泰Points 兌換率超過九成，2025 年發出逾 7 億點，等於一年約 7 億元的回饋價值（依前述數字推算）。點燈城的試算可以這樣做：假設每天有 10 萬人完成情境任務、每人平均得 2 點，一年就要發出約 7,300 萬點，約為 2025 年全集團發點量的一成。這筆錢如果只換來打開 App，很難說服評審；如果點數只能折抵空車時段的 yoxi 車資，它就變成填補閒置運能的獲客成本，可以拿來和增量趟數的毛利對比。

同樣的設計也能把導流包裝成司機的收入工具。yoxi 的派遣費本來就低，司機又抱怨單量少，乘客端的任務若能把需求推到空車時段，司機端就能看到「預計湧入的需求」。對和泰靠購車、保修與貸款建立的司機飛輪來說，這是一個能同時講給乘客與司機聽的故事。

導流也要守住法規。小黃車資須經核定，雙北多元雖可在 1 到 3.9 倍之間動態加成（[yoxi 費率](https://www.yoxi.app/promotion/105)），但改價格容易引來「不透明」的批評。用點數與搭車金引導時段，比直接調降車資安全。

變現的第二條路是合作夥伴。忠泰美術館已示範「看展代碼折 60 元」的模式（[TVBS](https://cars.tvbs.com.tw/life/341717)），FunNow 的晚間商家與車內平板廣告也能替地圖上的街區提供由合作方出資的點燈獎勵。Uber 在 2026 年世足期間，商家出資的優惠年增約七成（[Uber Q2 2026](https://s23.q4cdn.com/407969754/files/doc_earnings/2026/q2/supplemental-info/Uber-Q2-26-Earnings-Supplemental-Data.pdf)），證明活動期間的商家預算確實存在。

### 驗證指標：設定兩層 KPI，搶先定義「不搭車開啟」

台灣沒有任何叫車業者公開開啟頻率，所以點燈城可以自己定義這個指標，並成為第一個量測它的人。

第一層是**習慣層**：不搭車也打開 App 的天數、D7 與 D30 留存、任務完成率，再加上推播關閉率作為防護指標。可參考的基準是，一般 App 的 D30 留存約 9.55%，前十大 App 約 59.8%（2015 年 Android 資料，[Andrew Chen](https://andrewchen.com/new-data-shows-why-losing-80-of-your-mobile-users-is-normal-and-that-the-best-apps-do-much-better/)）。

第二層是**轉換層**：情境任務觸發的叫車數、空車時段填補率、參與者與對照組的每月搭乘次數差距，以及每一增量趟數所耗的點數成本。轉換層的外部基準有兩個：Lyft Price Lock 持有者每月多搭約 4 趟，Grab 群體產品的留存與頻率是平均的 2 倍。至於從探索內容到叫車的轉換率，國際上都沒有公開基準，提案只能把它列為待驗證的指標，不能宣稱已知效果。

時間尺度也要誠實。研究顯示習慣平均要 66 天才會自動化（[UCL](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit)），遊戲化研究也提醒，短於約 12 週的試驗可能誤導（[Rodrigues et al.](https://educationaltechnologyjournal.springeropen.com/articles/10.1186/s41239-021-00314-6)）。從 10 月 14 日到 11 月 21 日只有五週多，證明不了習慣，只能證明可行。提案結尾最好附上一份 12 週 PoC 計畫，對接和泰加速器既有的「提供去識別化資料與實證場域」機制；該加速器至今已完成 10 個 PoC（[TVBS](https://cars.tvbs.com.tw/life/325348)）。

### 原型範圍：先做出會動的預測與一盞燈

決賽的可行性與原型完成度合計 45%，11 月 7 日還有必須過半出席的工作坊，所以原型範圍要收斂。最小可行版本只需要把四個環節串起來：先用 yoxi 去識別化資料加上氣象署雨量，建立分時段、分區域的需求模型；再用大型語言模型依使用者的常用地點與時段產生當日情境任務，例如以 Google Cloud 的 Vertex AI 與 Gemini 實作；任務完成後在地圖上點亮一個街區；最後跑通一個完整的導流情境，也就是預測到下雨、提醒使用者、使用者預約離峰車、獲得點數。AR 彩蛋與好友競賽在原型中用輕量的示意版本即可。本屆合作夥伴是 Google Cloud，把架構與成本估算建立在 GCP 上，評審較容易看懂（這點並非明列的評分項目）。資料面有兩個風險：TDX 自 2024 年起改為依方案計算額度，示範時應快取靜態資料；大巨蛋等場館沒有機器可讀的行程，散場任務需要替代資料源。

最大的未知數在 yoxi 資料包本身。團隊說明列出的是搭乘時段與頻率趨勢、POI、熱門上下車點與樞紐熱區，看起來都是需求端資料。如果資料字典沒有司機上線數或空車時數，「空車時段」就只能用需求低谷推估，或以交通部 26.4% 的平均空車率當先驗。這一點應在 10 月 14 日前查閱官網「企業挑戰題目」區確認，並在提案中寫明假設。

## 結論

這份研究改變了對題目的理解。yoxi 的低頻不是缺少功能，而是缺少一個在「決定要不要叫車之前」就有用的理由。每一家競品的乘客互動工具都只負責把乘客拉回來，靠的是優惠、會員或寄居高頻 App；供給端的空車則交給派遣演算法處理。研究範圍內，沒有一家用乘客端的每日互動去填補司機 26.4% 的空車時間。點燈城如果把每日任務當成調節需求時段的工具，就是市場上少見的「雙邊互動設計」：乘客得到每天有用的提醒與城市探索的樂趣，司機得到被填補的空檔，和泰則把原本只是回饋支出的點數，變成可以計算回報的運能調度成本。這個框架同時對上集團「從被動回應到主動預測」的語言、往屆評審偏好的營運槓桿，以及 yoxi「你的城市探索夥伴」的品牌主張。

真正的不確定性有三個，提案應主動揭露。第一，國際上沒有任何 AI 出行夥伴公布過採用率或轉換率，點燈城的效果必須靠自己的對照實驗證明。第二，yoxi 資料包是否含供給端資料仍未知，它決定導流模型能做到多精準。第三，LINE GO 已在 LINE 裡測試 agentic 行程規劃，主動日常移動這個空窗可能在一兩年內關上。這也是點燈城最該把握的地方：與其和 LINE GO 比誰更會規劃旅程，不如搶先把「每一盞燈都代表一次被照顧的移動」做成 yoxi 獨有的城市記憶，並把高齡、無障礙與多語族群一起點亮，延續 yoxi「Mobility for All」的路線。
