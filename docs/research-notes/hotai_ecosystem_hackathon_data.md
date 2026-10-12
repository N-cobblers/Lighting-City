# Hotai Group's Ecosystem, the 2026 和泰 AI 黑客松, and Complementary Taiwan Open Data (for the yoxi challenge, as of 2026-10-09)

*Research date: 2026-10-09, five days before the 10/14 13:00 proposal deadline. Tooling notes: this sandbox's egress policy blocked direct curl to bhuntr.com and ht-hackathon.tw (proxy HTTP 403), so official pages were read through WebFetch. The shared web-search quota ran out partway through, so the open-data section relies more on direct fetches of known primary URLs. Anything not verified is listed under Gaps.*

---

## Q1. 和泰會員 / 和泰Pay / 和泰Points: how the cross-brand membership and points system works

### Takeaway
Hotai runs one group-wide loyalty stack: a single 和泰會員 account, 和泰Pay, 和泰Points (1 point = NT$1) and the CTBC co-branded card. At end-2025 it had nearly 4 million members, more than 3 billion points issued cumulatively (over 700 million in 2025 alone) and a redemption rate above 90%. Points can already be earned and burned on yoxi fares, so a "non-ride interaction → points → yoxi ride" loop can use existing infrastructure.

### Cited Findings
**Product names and launch dates (names verified)**
- 和泰Pay (Hotai Pay), 和泰Points (Hotai Points) and the 中國信託和泰聯名卡 (CTBC Hotai co-branded card) launched in October 2021 ("last October" in an Aug-2022 article) — [KingAutos, 2022-08-31](https://www.kingautos.net/346936). A related-article title on U-CAR dates the launch of "和泰Pay、和泰Points、中國信託和泰聯名卡" to 2021/09/30 — [U-CAR, 2022-01-27](https://news.u-car.com.tw/news/article/69287)
- Single account: Hotai has built a digital-services ecosystem since 2020, and users reach services through a single account that links Hotai Pay, Hotai Points, iRent and yoxi — [NOWnews, 2022-06-27](https://www.nownews.com/news/5851711)
- The HOTAI購 online mall was planned as "和泰商城" for March 2022 ([KingAutos, 2022-02-08](https://www.kingautos.net/342259)). It began trial operation in April 2022 ([KingAutos, 2022-08-31](https://www.kingautos.net/346936)) with nearly 10,000 products ([KingAutos, 2022-11-02](https://www.kingautos.net/347917)). By 2026 it carries "tens of thousands" of items across car accessories, appliances/3C, home goods and food — [工商時報, 2026-04-30](https://www.ctee.com.tw/news/20260430702296-431207)

**Scale (end-2025 figures, published 2026-01-15)**
- Group members: nearly 4 million. Hotai Pay cumulative in-group card spending: about NT$170 billion. Hotai Points: over 3 billion issued cumulatively, over 700 million in 2025, redemption rate "consistently above 90%". Co-branded card: over 320,000 cards issued, cumulative spending near NT$200 billion — [工商時報, 2026-01-15, "和泰Points突破30億點"](https://www.ctee.com.tw/news/20260115702068-431207)
- The same five headline indicators (members, Hotai Pay, Points, MaaS app downloads, yoxi+iRent trips) are presented as "Taiwan's largest MaaS mobility lifestyle ecosystem" — [優分析/鉅亨, 2026-01-15](https://uanalyze.com.tw/articles/5340845465)
- Earlier figures: 1.55 million members and over 100,000 co-branded cards (Nov 2022) — [KingAutos, 2022-11-02](https://www.kingautos.net/347917). Over 650 million points issued by Aug 2022 — [KingAutos, 2022-08-31](https://www.kingautos.net/346936)

**Point value**
- 1 和泰Point = NT$1 — [工商時報, 2026-04-30](https://www.ctee.com.tw/news/20260430702296-431207); also "1點等於新台幣1元" for maintenance offsets — [U-CAR, 2022-01-27](https://news.u-car.com.tw/news/article/69287)

**Earn rules**
- Co-branded card (2026): up to 10% back at designated group channels (yoxi, iRent, HOTAI購 and the 去趣旅遊 travel mall). Up to 4.5% on genuine-parts maintenance. 0.6% with no cap on final car payments. 0.2% with no cap on income tax, plus a 20,000-point bonus for a single payment of NT$10M or more (once per household). New cardholders get 300 points after a spending threshold — [工商時報, 2026-04-30](https://www.ctee.com.tw/news/20260430702296-431207)
- The co-branded card earns points on purchases in all channels, with bonus points for in-group spending through Hotai Pay — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)
- Hotai Pay rules as of 2022: a new Toyota/Lexus purchase earns 1% of the transaction price. Toyota maintenance earns up to 5% via Hotai Pay (CTBC 1% + CTBC bonus 3% + Hotai 1%) and Lexus up to 5.5%. CPC gas stations earn 2% on the co-branded card — [U-CAR, 2022-01-27](https://news.u-car.com.tw/news/article/69287)
- Points come from new-car purchases, maintenance and yoxi rides (2022) — [KingAutos, 2022-11-02](https://www.kingautos.net/347917)

**Burn rules**
- Points can offset after-sales maintenance fees and yoxi fares. At HOTAI購 they redeem for TOYOTA/Lexus accessories, iRent hour vouchers and yoxi ride credit, using "點金自由配" (flexible offset with no cap) — [工商時報, 2026-04-30](https://www.ctee.com.tw/news/20260430702296-431207)
- Points can also be used for OpenHub charging discounts, yoxi ride credit, iRent hours and HOTAI購 products — [TVBS 車勢, 2024-06-11](https://cars.tvbs.com.tw/tech/196125)
- A car-wash map with 全國 and 車容坊 lists over 120 sites redeemable with Hotai Points. Automatic parking payment works through uTagGo and Autopass. OpenHub links 12 charging operators and about 1,400 charging points — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)

**Hotai's own use of gamified points (relevant precedent)**
- 2024 hackathon marketing: the "MaaS Wonderland" gamified site gave 100 Hotai Points for completing tasks, with hidden tasks worth more, plus 100 early-bird points — [TVBS, 2024-06-11](https://cars.tvbs.com.tw/tech/196125)
- 2022 hackathon marketing: eight "馬思" mascot NFTs were each mapped to a reward (yoxi ride vouchers, iRent hours, Hotai Points, top prize 10,000 points). Quizzes at "MaaS Smart City" theme pavilions earned iRent hours and yoxi ride credit — [NOWnews, 2022-06-27](https://www.nownews.com/news/5851711)
- yoxi's own site currently runs promotions involving LINE Pay, LINE POINTS, OPENPOINT and yoxi "搭車金" (ride credit). It also lists member ("隊員") exclusive offers, a ranking contest, referral rewards and post-ride lucky draws — [yoxi.app, fetched 2026-10-09](https://www.yoxi.app/)

**Payment rails on yoxi**
- yoxi supports Apple Pay and TWQR — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207). From October 2025, in-car digital tablets support NFC card tap and multiple e-payments, starting in Greater Taipei and Kaohsiung — [旺得富, 2025-11-13](https://wantrich.chinatimes.com/news/20251113900625-420101)

**Stated direction**
- Hotai plans to deepen the MaaS ecosystem around mobility, travel, payments and points, extend it into broader lifestyle and consumer scenarios, and use data insights for more personalized services. No numeric targets were given — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)

### Inferences
- Points are effectively cash: 1 point = NT$1 and over 90% are redeemed. Over 700 million points issued in 2025 means roughly NT$700M a year in reward value (my arithmetic from the cited figures). Any "earn points for daily check-ins" design will therefore be read as a real cost line. The proposal should model reward cost per DAU and steer redemption toward yoxi rides, so points convert into ride demand.
- The rails for a cross-brand loop already exist: points are accepted on yoxi fares, the co-branded card pays up to 10% on yoxi, and HOTAI購 sells yoxi ride credit. A proposal can plug into 和泰Points instead of inventing a new currency, which fits the brief's "commercial conversion" requirement.
- Hotai has used gamified points quests twice in its own hackathon marketing (2022 NFTs, 2024 MaaS Wonderland). A generic "daily check-in for points" may look familiar to judges, so the AI personalization layer has to be the differentiator.
- About 4M group members includes many TOYOTA/Lexus owners who drive rather than take taxis. Car-owner moments are a natural cross-brand target: maintenance day, drinking, parking scarcity, airport trips. (Inference.)

### Gaps
- No published figure on cross-brand usage (e.g., share of members using two or more brands). No yoxi-specific member, MAU or DAU numbers for 2024–2026; the latest yoxi numbers found are 2022 targets (see Q2).
- Points expiry rules were not found.
- Could not confirm whether a standalone 和泰Points/和泰會員 app exists. The evidence suggests points live inside the brand apps (yoxi, iRent) and HOTAI購.
- No information on whether 和泰產險 (insurance) or 和潤企業 (finance) participate in Points earn/burn. The 2026 accelerator lists an "innovative auto insurance sales plan" topic but does not mention points.

---

## Q2. Group mobility (MaaS) strategy, AI First, AI investments, and Toyota Japan links (2022–2026)

### Takeaway
Hotai describes itself as moving "from a pure car company to a professional mobility-service company". In 2026 it added an "AI First 全域布局" vision aimed at moving services "from reactive response (被動回應) to proactive prediction (主動預測)". Within the group, yoxi is positioned as a safety-first, senior- and accessibility-friendly ride-hailing brand with HSR-hub and Japan coverage. No Taiwan pilot of Toyota's "my route" or Woven by Toyota was found.

### Cited Findings
**MaaS positioning and management statements**
- Feb 2022: Hotai said it would pursue a MaaS vision to expand its digital transformation. yoxi completed 2.5 million trips in 2021 and set 2022 targets of 600,000 members, 6,000 vehicles and 6 million trips. iRent was described as Taiwan's only platform offering both shared cars and shared scooters, targeting 8,000 shared cars — [KingAutos, 2022-02-08](https://www.kingautos.net/342259)
- A search-result headline (article not fetched) reads "《yoxi》成軍一年服務超過70萬用戶｜年底進軍台南，正式駐點全台六都" — [KingAutos](https://www.kingautos.net/340743). yoxi launched in 2020 — [鏡週刊, 2025-12-06](https://www.mirrormedia.mg/story/20251201fin001)
- Dec 2022: chairman 黃南光 said Hotai is fully committed to realizing its MaaS vision and released real operating data for the hackathon — [CIO Taiwan, 2022-12-22](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/)
- Dec 2025: vice chairman and GM 蘇純興 said Hotai is shifting from a pure car company to a professional mobility-service company building a MaaS ecosystem. He promotes an internal "AI First" approach and encourages subsidiaries to list independently — [鏡週刊, 2025-12-06](https://www.mirrormedia.mg/story/20251201fin001)
- 2026-02-24 和泰·國瑞 New Year press conference, where GM 蘇純興 spoke ([旺得富, 2026-02-24](https://wantrich.chinatimes.com/news/20260224900311-420101)):
  - Vision: "AI First 全域布局", moving services from "被動回應" to "主動預測" and building a seamlessly connected smart mobility ecosystem — [TVBS, 2026-02-24](https://cars.tvbs.com.tw/car-news/307746); [旺得富, 2026-02-24](https://wantrich.chinatimes.com/news/20260224900311-420101)
  - Recognition cited: IDC "Best Digital Empowerment Ecosystem" award and Business Weekly "AI Innovation Top 100" silver award — [TVBS, 2026-02-24](https://cars.tvbs.com.tw/car-news/307746)
  - MaaS plans: a Japanese-language version of 去趣 run by a local Japan operation; new digital tablets and payment options for yoxi; iRent reservations opened to overseas travelers — [TVBS, 2026-02-24](https://cars.tvbs.com.tw/car-news/307746)
  - 2025 results: Hotai's three brands registered over 160,000 units (38.6% share, best in nearly 16 years). The 2026 target is 165,000 units and a 37.5% share — [旺得富, 2026-02-24](https://wantrich.chinatimes.com/news/20260224900311-420101)
- Ecosystem metrics at end-2025: yoxi and iRent cumulative trips of 40 million, and MaaS brand app downloads of nearly 3.5 million — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207); [優分析, 2026-01-15](https://uanalyze.com.tw/articles/5340845465)

**yoxi: features and positioning, 2025–2026**
- Oct–Nov 2025: in-car digital tablets combine multi-payment and video ad placement. Door-plate recognition (scan or upload a door-plate photo to fill the address) targets seniors and foreign passengers. yoxi has direct branches in all six special municipalities, waives dispatch fees for new drivers' first six months, and is expanding to HSR stations (Zuoying, Changhua). ESG programs include 敬老愛心車隊, 好孕專車 and 量產幸福 移動公益, with over 47,000 charity rides. It won Taipei's Golden Wheel 特優 rating in 2025, its second straight year. GM 葉俊谷 (English rendering "Hotai Mobility" in the source) said yoxi aims to be "乘客與駕駛都能100%信賴的出行平台" — [旺得富, 2025-11-13](https://wantrich.chinatimes.com/news/20251113900625-420101)
- Apr 2026: AI house-number recognition ("Snap to Go") and accessible-entrance search at MRT/HSR hubs, which favors pickup points with elevators. yoxi's big data shows about 40% of older users get stuck entering addresses. Usage of the "wheelchair storage" and "boarding assistance" ride notes roughly doubled in 2025. The elderly-care volunteer fleet covers 7 cities and counties (Taipei, New Taipei, Taoyuan, Taichung, Changhua, Nantou, Kaohsiung) and accepts elderly and volunteer cards. yoxi frames mobility as "支撐社會參與的重要基礎" and draws on Toyota Mobility Foundation resources — [工商時報, 2026-04-27](https://www.ctee.com.tw/news/20260427701361-430503)
- Sep 2026: yoxi won Best Product at the 23rd 國家品牌玉山獎. It offers a six-seat fixed-fare service and Japan ride-hailing with the GO taxi app since July 2025, covering 46 prefectures with the yoxi UI and fares estimated in NT$. 7-ELEVEN ibon kiosks offer 8-language booking, including Indonesian and Vietnamese, and the app has real-time translation for driver chat. Passenger insurance of 5,000萬 is described as the industry's highest. Safety features include vehicle inspections within five years, in-trip emergency help and two-way ratings, framed as "服務本位" — [工商時報, 2026-09-11](https://www.ctee.com.tw/news/20260911700013-431207)
- yoxi holds taxi-dispatch qualification at Changhua and Zuoying HSR stations and won a Taipei Golden Wheel award — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)
- yoxi.app also lists 企業簽單 (corporate billing) and driver services (help with vehicle purchase, maintenance and insurance, plus a TOYOTA/LEXUS genuine-maintenance promotion) — [yoxi.app](https://www.yoxi.app/)

**iRent / 和運租車**
- iRent at end-2025: fleet over 20,000 vehicles, about 2.5 million trips in 2025, 1,000 Corolla Altis Hybrids added, partnerships with USPACE and WeMo, and air-quality sensors in vehicles — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)
- iRent has over 2 million members and is run under 和運租車 (Hotai Rental). 和運租車 listed on the emerging board in late September 2025 and is preparing for a main-board listing. Its "和運4.0" plan covers restructuring, AI-driven efficiency, unmanned vehicles and shared mobility, with chairman 劉源森 aiming to double profit ("獲利要翻倍"). It brought in IBM to build a core system. 2024 revenue was NT$29.1B — [鏡週刊, 2025-12-06](https://www.mirrormedia.mg/story/20251201fin001)

**AI investments and innovation programs**
- 和泰加速器 (with StarFab) has run since 2024 and drew nearly 100 startups in year one. The 2026 phase 1 (announced 2026-01-08) covers TOYOTA, LEXUS and HINO across three areas (AI營運賦能, AI智慧決策, 創新商模拓展) and 15 themes, including AI customer service, an AI knowledge platform for vehicle technology and next-generation commercial-vehicle IoT. Selected teams get de-identified vehicle data and physical sites for PoCs, plus a recommendation to the Google for Startups Cloud program — [中央社, 2026-01-08](https://www.cna.com.tw/news/afe/202601080094.aspx); [鉅亨, 2026-01-08](https://news.cnyes.com/news/id/6303471)
- Phase 2 (June 2026, closing June 30) topics: a website-monitoring assistant, an innovative auto-insurance sales plan, disability-friendly digital services, a digital twin for parts warehousing, and real-time AI video for commercial vehicles. 10 PoCs have been completed so far. 李美琪 (head of business planning) said the accelerator links outside innovation with Hotai's "member data, testing experience and operating logic" — [TVBS, 2026-06-06](https://cars.tvbs.com.tw/life/325348)
- Cloud partners: Microsoft Taiwan co-organized the 2022 and 2024 hackathons, with Azure AI/ML ([CIO, 2022-12-22](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/)). Google Cloud is the 2026 hackathon partner ([和泰汽車 press release, 2026-06-03](https://www.hotaimotor.com.tw/News/Details/438))
- CARMAX, a Hotai affiliate, earned ISO/SAE 21434 automotive cybersecurity certification and is developing a T-Box, infotainment, a subscription platform, OTA and big-data analytics — [中央社, 2026-01-08](https://www.cna.com.tw/news/afe/202601080094.aspx)

**Toyota Japan links**
- Toyota Mobility Foundation is partnering with 和泰純青基金會 on child traffic safety and senior-friendly mobility — [TVBS, 2026-02-24](https://cars.tvbs.com.tw/car-news/307746). yoxi plans to use Toyota Mobility Foundation resources — [工商時報, 2026-04-27](https://www.ctee.com.tw/news/20260427701361-430503)
- Toyota chairman Akio Toyoda visited Taiwan twice in 2025 to support Hotai events — [鏡週刊, 2025-12-06](https://www.mirrormedia.mg/story/20251201fin001)
- Toyota's "my route" MaaS app combines route search with real-time transit and parking information, booking of trains, buses, flights and rental cars, digital day/tourist passes, and local tourism and event info. It runs in Fukuoka, Nagasaki, Okinawa and Kanagawa and expanded to Kumamoto in 2023. The article does not mention Taiwan or Hotai — [INSIDE, visible date 2023-02-04 (metadata says 2025-12-02)](https://www.inside.com.tw/article/30622-kumamoto-semiconductor-NO-my-Car-TOYOTA-MyRoute)

**Travel integration**
- 和漾旅行社 was established in August 2022 (GM 林秀芳). The plan was to package iRent and yoxi into themed travel and dining products sold through HOTAI購, and to build a "全旅運平台" that connects to public transit — [KingAutos, 2022-08-31](https://www.kingautos.net/346936)

### Inferences
- The judges' vocabulary to echo is: "AI First 全域布局", "從被動回應到主動預測", "無縫串聯的智慧移動生態圈", "服務本位", and "移動是支撐社會參與的重要基礎". An AI companion that proactively predicts needs from a user's frequent places and times fits the group's 2026 narrative directly.
- yoxi's "characteristics and value" that the brief asks teams to reflect are: safety (insurance, inspections, three-layer protection), trusted Toyota-quality vehicles and trained drivers, senior and accessibility care (door-plate AI, accessible pickup points, 敬老/好孕 fleets), multilingual access, HSR-hub coverage, Japan cross-border rides (GO) and corporate billing.
- yoxi already ships AI features (door-plate recognition) and runs in-car tablets with video ads. A daily-interaction product could also connect to the in-car screen, which is ad and partner inventory. (Inference.)
- Hotai's accelerator gives startups de-identified data and PoC sites. Ending the proposal with a post-hackathon PoC roadmap matches how the group actually adopts outside ideas.

### Gaps
- No public evidence of a Woven by Toyota or "my route" pilot in Taiwan. No named Hotai AI lab or team, and no AI capex figure.
- The yoxi operating entity is not confirmed. Photo credits name 和泰聯網 (Hotai Connected) ([工商時報, 2026-09-11](https://www.ctee.com.tw/news/20260911700013-431207)), and a 2022 judge was EVP of Hotai Connected ([CIO, 2022](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/)). The Chinese entity name behind "Hotai Mobility" (葉俊谷's company) was not verified.
- No current yoxi rider, fleet or driver counts were found in 2025–2026 coverage, and no 2026 MaaS numeric targets.

---

## Q3. What 去趣 is, and other newer group consumer brands and investments

### Takeaway
去趣 (chicTrip) is Hotai's travel-planning super-app, launched in 2023. It had over 3.4M downloads and over 2.3M members at end-2025, added a self-branded eSIM store in September 2025, and is launching in Japan. Hotai also took about 10% of FunNow (instant leisure booking) for US$10M in September 2026, extending the ecosystem into urban lifestyle consumption.

### Cited Findings
- 去趣 chicTrip launched in 2023 as a "一站式旅遊服務". Features: itinerary management and co-editing, attraction discovery, AI itinerary recommendations, transport and lodging booking, travel insurance, and photo/video travel memory books. It had over 2M members and repeatedly topped Taiwan's travel-app download charts (Oct 2025) — [T客邦, 2025-10-01](https://www.techbang.com/posts/125692-chictrip-app-launches-esim-service)
- eSIM launched in September 2025: multi-country data plans, QR code emailed within 20 minutes, no SIM swap, 24-hour customer service, and a 20%-off launch promotion through Oct 31 — [T客邦, 2025-10-01](https://www.techbang.com/posts/125692-chictrip-app-launches-esim-service)
- End-2025: over 3.4M downloads and over 2.3M members. Partners: Agoda, Trip.com and KKday (lodging and tickets); Tabirai, NearMe, JBL and TOYOTA Rent a Car (transport). 去趣 integrates yoxi and iRent for trips. Hotai's own eSIM product launched in 2025 — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207); [優分析, 2026-01-15](https://uanalyze.com.tw/articles/5340845465)
- A Japanese-language 去趣 run by a local Japan operation is "about to launch" (Feb 2026) — [旺得富, 2026-02-24](https://wantrich.chinatimes.com/news/20260224900311-420101)
- The 去趣旅遊 travel mall is a designated channel for up to 10% back on the co-branded card — [工商時報, 2026-04-30](https://www.ctee.com.tw/news/20260430702296-431207)
- FunNow: Hotai disclosed on MOPS on 2026-09-22 that it bought 9,090,909 FunNow preferred shares at US$1.10 (US$10M, about 10%). FunNow has over 10 million users and over 16,000 partner merchants, operates in seven Asian markets, and signed a listing-tutoring agreement in Aug 2026. INSIDE notes FunNow's urban, higher-spending users overlap with Hotai's core customers. INSIDE's valuation of about US$100M is its own estimate — [INSIDE, 2026-09-23](https://inside.com.tw/article/42459-hotai-motor-funnow-investment-10-million-usd)
- Other consumer touchpoints: HOTAI購 (online mall), OpenHub (EV charging roaming), the car-wash map, uTagGo/Autopass parking payment ([工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)), and 和漾旅行社 (travel agency, 2022) ([KingAutos, 2022-08-31](https://www.kingautos.net/346936))

### Inferences
- Partner-business conversion paths a yoxi daily companion can plausibly claim: FunNow evening and weekend bookings that lead to a ride; 去趣 trip plans and eSIM that lead to airport/HSR transfers and yoxi Japan rides via GO; HOTAI購 and 和泰Points as the reward catalog; in-car tablet video ads as media inventory.
- 去趣 itself is a separate 2026 challenge (eSIM). A yoxi proposal that hands users off to 去趣 shows group-ecosystem thinking, but it should not duplicate 去趣's trip-planning role. The 2024 champion was effectively an AI trip-planner (see Q5).

### Gaps
- No announced integration between FunNow and 和泰Points or yoxi. Investment-time articles frame the deal financially only.
- No other new 2025–2026 consumer brands were found beyond those listed. The search quota was exhausted before a broader sweep.

---

## Q4. The 2026 和泰 AI 黑客松: official details (organizers, timeline, prizes, eligibility, judging, finals, data, IP)

### Takeaway
The official page (ht-hackathon.tw, run by 獎金獵人/bhuntr) was reachable through WebFetch and gives the full timeline, prize table, eligibility rules and scoring weights. Preliminary scoring is topic relevance 30%, creativity 25%, feasibility 25% and AI integration 20%. Finals scoring is feasibility 25%, AI 20%, business value 20%, prototype completeness 20% and presentation 15%. Fifteen finalists will be announced 10/28, attend a mandatory 11/07 workshop and demo a working prototype on 11/21. The team later supplied the full yoxi challenge description and requested proposal contents (recorded in `CLAUDE.md`), but that wording has not been independently checked against the organizer's official copy; the data dictionary and data-use terms remain unverified.

### Cited Findings
**Official sources and reachability**
- Official site: https://ht-hackathon.tw/tw/ (canonical https://ht-hackathon.tw/tw/y5sf0shclq6c3yn1db), also served as a bhuntr competition page. Direct curl from this sandbox returned proxy 403, but WebFetch worked — [Official site](https://ht-hackathon.tw/tw/); [bhuntr page](https://bhuntr.com/tw/competitions/y5sf0shclq6c3yn1db)
- Hotai's official press release is dated 2026-06-03 — [和泰汽車 newsroom](https://www.hotaimotor.com.tw/News/Details/438). Media coverage: [鉅亨, 2026-06-03](https://news.cnyes.com/news/id/6482076); [U-CAR, 2026-06-04](https://news.u-car.com.tw/news/article/88819); [經濟日報, 2026-06-08](https://money.udn.com/money/story/5635/9551065)

**Organizers and positioning**
- Host: 和泰汽車. Co-organizers: TOYOTA, LEXUS, HINO, iRent, yoxi, 去趣. Partner: Google Cloud. Operator: 獎金獵人 (bhuntr) — [Accupass briefing page](https://www.accupass.com/event/2605231008171387914199)
- It succeeds the "和泰 MaaS 黑客松" started in 2022, whose first two editions drew over 400 teams and nearly 1,400 participants. Scope widened from MaaS services (iRent, yoxi, 去趣) to all group brands, adding TOYOTA, Lexus and HINO — [和泰 press release, 2026-06-03](https://www.hotaimotor.com.tw/News/Details/438)
- Framed as the starting point of the group's "AI First 全域布局", moving services from "被動回應" to "主動預測" — [U-CAR, 2026-06-04](https://news.u-car.com.tw/news/article/88819). Official theme: "以 AI 為核心動力，讓創意成為可落地的解決方案" — [Official site](https://ht-hackathon.tw/tw/)

**Full timeline (2026)** — [Official site](https://ht-hackathon.tw/tw/)
- May–June: campus lecture tour
- 06/24 (Wed) 19:00–20:00: online briefing, live-streamed on Google Meet with a recording posted. Featured speaker: 闕嘉宏 (CEO, 創代科技), a mentor in the first two seasons — [Accupass](https://www.accupass.com/event/2605231008171387914199)
- 07/08 and 08/05 (Wed) 19:00–21:00: AI practice sharing sessions at 台北記憶倉庫
- 08/15 (Sat) 10:00–17:00: AI 創新體驗日 at Google's TPKD R&D Center (team matching, mentor-guided ideation)
- 08/31 (Mon) 13:00: early-bird deadline for Step-1 registration
- **10/14 (Wed) 13:00: preliminary registration and proposal deadline**
- 10/28 (Wed) 13:00: 15 finalists announced (posted under 最新快報)
- 11/07 (Sat): finals workshop with one-on-one mentoring, not scored. **More than half of each finalist team must attend, or the team loses its finals spot to the next-ranked team.**
- 11/18 (Wed) 23:59: final proposal upload, a PDF of up to 30 pages excluding appendix, not bound to the preliminary chapter structure
- 11/21 (Sat): finals presentation, live demo and awards. Venue not stated.

**Team-provided yoxi challenge brief** — supplied on 2026-10-12 and recorded in `CLAUDE.md`; wording not independently verified against the official page:
- **Problem:** Ride-hailing apps are mainly opened when users already have a specific travel need, limiting app frequency and engagement. yoxi wants to shift from a tool passively waiting for ride requests to a proactive service platform that is a partner in city mobility and life.
- **Goal:** Use AI to design a yoxi-contextual, compelling daily interactive service that gives people a reason to open yoxi every day even when they are not taking a ride.
- **Four objectives:** (1) relate to transportation, mobility, or urban life; (2) express yoxi's distinctive value; (3) sustain long-term motivation rather than short-lived novelty; (4) balance utility and fun, with personalization from user data or behavior preferred where possible.
- **Four proposal contents:** (1) scenario and data-use plan, including target users and how data informs the service; (2) commercial conversion potential into actual ride demand or partnerships; (3) implementation architecture, technologies, compute resources, and cost estimates; (4) outcome validation, such as conversion, retention, and brand value.

**Seven challenges (official titles)** — [Official/bhuntr page](https://ht-hackathon.tw/tw/y5sf0shclq6c3yn1db)
1. TOYOTA: 「智能轉型：AI助攻油轉電」／TOYOTA EV新生活
2. TOYOTA: 「運用AI再造 TOYOTA 下一代顧客售後服務體驗」
3. Lexus: 「AI 流失風險洞察與智慧溝通：打造Lexus車主忠誠度的終極防線」
4. HINO: 「HINO x GenAI：運用商用車車聯網大數據，發展商用車頭家的智慧夥伴」
5. iRent: 「運用 AI 打造 iRent 智能車況管家：優化租還車體驗與營運效率」
6. **yoxi: 「不搭車，也打開 yoxi —— 打造高頻互動的AI出行夥伴」**
7. 去趣 eSIM: 「打造去趣 eSIM 全旅程智能銷售與服務體驗」
- The official site has an "企業挑戰題目" section; the team's supplied brief above should still be checked against the official wording and downloaded materials — [bhuntr page](https://bhuntr.com/tw/competitions/y5sf0shclq6c3yn1db)

**Prizes** — [Official site](https://ht-hackathon.tw/tw/)
- Champion NT$300,000 + trophy. Runner-up NT$250,000 + trophy. Third NT$200,000 + trophy. Certificates for each member and mentor.
- 潛力新星獎 (Rising Star): 4 teams × NT$50,000. 佳作 (Honorable Mention): 8 teams × NT$10,000.
- Stated total "超過新台幣100萬元". The listed prizes sum to NT$1,030,000 (my arithmetic).

**Eligibility and team rules** — [Official site](https://ht-hackathon.tw/tw/)
- Open to high school and vocational students, university students and working adults. Teams of 2–5 members, no solo entries, no member on multiple teams. The leader must hold ROC nationality. Minors need guardian consent. Up to 2 advisors per team, not counted in team size and not required to be professors.
- A team may submit up to 7 proposals, one per challenge. Each registration covers one proposal.
- Change from earlier editions: 2022 and 2024 were limited to ages 18+ ([NOWnews, 2022](https://www.nownews.com/news/5851711); [TVBS, 2024-06-11](https://cars.tvbs.com.tw/tech/196125)).

**Judging criteria and weights** — [Official site](https://ht-hackathon.tw/tw/)
- Preliminary (written review): 題目契合度 (topic relevance) 30%, 創意性 25%, 可行性 25%, AI 整合度 20%.
- Finals (on site, demo and prototype): 可行性 25%, AI 整合度 20%, 商業價值 20%, 原型完成度 20%, 簡報表現 15%. "評審依五項標準綜合評分" — [bhuntr page](https://bhuntr.com/tw/competitions/y5sf0shclq6c3yn1db)
- Media summaries describe the preliminary round as judging "strategic thinking and proposal logic" and the finals as judging technical depth, feasibility and the working prototype — [鉅亨, 2026-06-03](https://news.cnyes.com/news/id/6482076). 經濟日報 says solutions should combine "creativity, technology and commercial potential" — [經濟日報, 2026-06-08](https://money.udn.com/money/story/5635/9551065)

**Submission requirements** — [Official site](https://ht-hackathon.tw/tw/)
- Preliminary: the team leader uploads a PDF using the official template (from the 報名資料下載區) plus a link to a 3-minute solution video.
- Finals: a revised PDF of up to 30 pages, an on-site presentation and a working prototype demo.

**Data, compute and mentoring**
- Google Cloud provides online learning resources and a cloud computing environment that teams can apply for — [和泰 press release](https://www.hotaimotor.com.tw/News/Details/438); [U-CAR](https://news.u-car.com.tw/news/article/88819)
- The finals workshop mentors come from enterprise, business-model, creative and AI-application backgrounds. Contact: ht-hackathon@bhuntr.com, 02-6604-3004#57 — [bhuntr page](https://bhuntr.com/tw/competitions/y5sf0shclq6c3yn1db)
- Public pages do not describe the yoxi data package. The team's brief lists de-identified ride time-of-day and frequency trends, POI attributes, popular pickup/drop-off spots, and transport hubs and hotspots. For comparison, 2024 offered over 100 million de-identified records plus internal APIs ([TVBS, 2024-06-11](https://cars.tvbs.com.tw/tech/196125)).

**IP**
- Finalists must submit a "著作財產權授權暨肖像授權同意書" (copyright economic-rights license and portrait consent). No other IP terms are shown publicly — [bhuntr page](https://bhuntr.com/tw/competitions/y5sf0shclq6c3yn1db)

### Inferences
- **The prize table is a single table for all seven challenges, and 1+1+1+4+8 = 15 awards matches the 15 finalists.** This suggests (a) the yoxi entry competes against all challenges for both finalist slots and podium places, not within a yoxi-only bracket, and (b) every finalist likely receives at least NT$10,000. With 15 slots across 7 challenges, that averages about 2 per challenge, but nothing guarantees each challenge a slot. Confirm in the full rules.
- Topic relevance (30%) is the heaviest preliminary weight. The PDF should map explicitly to each yoxi requirement (mobility and city-life relevance, yoxi characteristics, long-lasting motivation, practicality plus fun, personalization from frequent places and times) and each required section (scenario and data plan, commercial conversion, architecture with compute and cost, validation metrics). A requirement-to-page traceability table would help.
- AI integration is 20% in both rounds. Generic gamification will score low unless AI is central, e.g., prediction from frequent place and time combined with weather and events, LLM-generated personal briefings, or vision features like yoxi's door-plate AI.
- In the finals, feasibility plus prototype completeness make up 45%. The prototype must run on 11/21, about five weeks after 10/14, with a mandatory workshop on 11/07. Scope the MVP accordingly.
- Google Cloud replaced Microsoft as partner. Costing the architecture on GCP (e.g., Vertex AI/Gemini, BigQuery, Cloud Run) and noting eligibility for the Google Cloud environment likely reads well, though this is not stated as a scoring factor.
- A team can submit to other challenges too (up to 7). Reusing the same data pipeline for an iRent or 去趣 entry is allowed.

### Gaps
- **Still to verify:** the full official wording against the team-provided brief, plus the data dictionary, data-access method (download vs. API vs. sandbox), and any data-use or NDA terms. Check the "企業挑戰題目" section and 報名資料下載區 directly.
- 2026 judges not announced publicly. Finals venue and whether finals are public or streamed are not stated. The early-bird benefit is not described.
- Full IP clauses (e.g., whether non-finalists keep all rights, scope of the finalist license) are not shown publicly.
- The amount of Google Cloud credits or environment specifics was not found.

---

## Q5. Previous editions (2022 and 2024 和泰 MaaS 黑客松): topics, winners, judges, comments, media

### Takeaway
There were two prior editions, 2022 and 2024, both co-run with Microsoft Taiwan. No 2023 or 2025 edition exists; 2026 coverage refers to "the first two editions". Winners were concrete, data-driven solutions tied to the group's core operations or AI personalization: 2022, DTD shared-taxi matching, iRent hotspot prediction and a travel-integration platform; 2024, an AI itinerary importer, a social itinerary checker and taxi-demand prediction. Chief judge both years was NTU Prof. 張學孔, who praised completeness, creativity, safety features, transparent fees and real-world potential.

### Cited Findings
**2022: 第一屆「和泰 MaaS 數據黑客松」 (with Microsoft Taiwan)**
- Launched 2022-06-27, registration to 2022-10-31, ages 18+. Theme: "結合智慧科技與共享經濟數據". Stages: written preliminary, semifinal (proposal implementation), final. NT$1M prize pool. Data: internal Hotai mobility data plus external Open Data — [NOWnews, 2022-06-27](https://www.nownews.com/news/5851711)
- Four focus areas: shared services, mobility lifestyle, digital technology, customer experience. Data: real operating data from iRent and yoxi plus Open Data, with Azure AI/ML — [CIO Taiwan, 2022-12-22](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/)
- Participation: 183 teams and 636 people (about twice the expected number). 20 teams reached the workshop and 10 reached the finals. Finalist themes: 旅運整合, 移動共乘, 淨零碳排 — [T客邦](https://www.techbang.com/posts/102608-hotai-hackthon-2022-competition-results-released); [Microsoft News Center TW, 2022-12-20](https://news.microsoft.com/zh-tw/maas-hackathon-2/)
- Finals held 2022-12-17 — [KingAutos](https://www.kingautos.net/348505)
- Winners — [T客邦](https://www.techbang.com/posts/102608-hotai-hackthon-2022-competition-results-released); [CIO](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/):
  - 1st (NT$300,000 + hidden NFT + trophy): 咕嚕小隊, "DTD 共享計程車". Point-to-point shared taxi using big-data matching of nearby passengers with the same drop-off district, a parent-child station model, an optimal boarding-point algorithm, a rating system and a "共乘夥伴" safety feature — [KingAutos](https://www.kingautos.net/348505)
  - 2nd (NT$250,000): 春日部防衛隊, "無車蝸牛趴趴走—iRent 路邊租還熱點預測" (iRent curbside rental and return hotspot prediction)
  - 3rd (NT$200,000): 成為獎金獵人, "WeTrip. 旅運行動服務整合平台"
  - A 4th place and three honorable mentions were named, but no source identifies them.
- Other submitted ideas: automatic parking-space finding, shopping and tourism hotspots, trip planning, carpooling, one-stop outings, a carbon passbook. Tech used included neural networks, blockchain/NFT, Azure Database and MLOps CI/CD — [T客邦](https://www.techbang.com/posts/102608-hotai-hackthon-2022-competition-results-released)
- Judges: 張學孔 (NTU Civil Engineering), 張啟厚 (Hotai New Business Division), 邱威凱 (EVP, 和泰聯網 Hotai Connected), 羅弘偉 (EVP, Hotai's cloud mobility unit), 劉俊良 (VP, Microsoft Taiwan). Mentors: 蔡景鷹 and 黃耀逸 (Microsoft Technology Center) — [CIO](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/); [Microsoft TW](https://news.microsoft.com/zh-tw/maas-hackathon-2/)
- Criteria: creativity and feasibility, business model, cloud technology, service completeness — [CIO](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/)
- Chief judge 張學孔's comments on the champion: the proposal was complete with strong team spirit. He praised the matching system, safe-riding features and transparent fees, called it "整體內容完備且饒富創意", and said it could resonate with commuters and had real-world potential — [KingAutos](https://www.kingautos.net/348505)

**2024: 第二屆「和泰 MaaS 黑客松」 (with Microsoft Taiwan)**
- Theme "移動新體驗，想像無極限". Launched 2024-06-01, early-bird 08/31, submissions closed 10/20, ages 18+. Three stages (preliminary, semifinal implementation, final). NT$1M pool. Data: over 100 million de-identified mobility records plus internal APIs, covering iRent, yoxi, HOTAI購, 去趣 and OpenHub. Mentor panel online in the preliminary round, empowerment workshops in the semifinal — [TVBS, 2024-06-11](https://cars.tvbs.com.tw/tech/196125)
- Results — [TVBS, 2024-12-21](https://cars.tvbs.com.tw/life/229125):
  - 235 teams entered. 10 finalists. Finals and awards on 2024-12-14.
  - **Champion (NT$300,000 + trophy):** 「袋熊的屁屁是骨頭」 (National Central University), "AI趣旅：智能識別，一鍵導入". AI parses online itineraries and attraction images into a full trip plan and recommends attractions from user preferences and past usage.
  - **Runner-up:** 「我說的都隊」. A social platform combined with a smart itinerary "health check".
  - **Third:** 「AIO」. Algorithmic taxi-demand prediction by area, directing vehicles to where they are needed to improve matching.
  - Finalist themes: social connection, gamified experiences, AI applications, integrated travel services.
  - Chief judge 張學孔 (Director, NTU Center for Advanced Public Transportation Research) noted that finalists built on different scenarios and needs, used data analysis and AI, and addressed post-pandemic travel demand. The champion's "創意和完整度獲得評審團高度評價".
  - Outreach covered 24 universities and innovation bases, with one-on-one mentoring at Microsoft workshops.

**Related but different Hotai competition**
- 和泰公益夢想家 is an ESG student proposal program running since 2019. Its 7th edition finals were held 2025-11-29/30 at 華山 with nearly 100 teams from 42 schools. Ten finalists each received a NT$200,000 implementation subsidy. Built on the M.O.V.E. framework (Mobility, Openness, Value, Eco) — [TVBS, 2025-12-03](https://cars.tvbs.com.tw/tech/292118)

### Inferences
- What has won: (a) solutions tied directly to group operating data and a clear business lever (taxi matching, demand prediction, iRent hotspots); (b) AI-driven personalization with a frictionless UX (2024 champion's "one-click import"). Safety, transparency and commuter relevance drew explicit praise. Two of six podium entries were taxi/yoxi-adjacent (2022 1st, 2024 3rd).
- The 2024 finalists already included "gamified experiences" and "social connection" themes, and the 2024 champion was an AI trip planner. A 2026 yoxi entry should not be a generic gamified app or a trip planner. It should be a daily, frequent-place and frequent-time habit loop that converts measurably into rides.
- 張學孔 chaired both previous panels, so a public-transport researcher's lens is likely again: multimodal integration, equity and accessibility, real commuter pain points. This is unconfirmed for 2026.
- 闕嘉宏 (創代科技), a mentor in both prior editions and the 2026 briefing speaker, emphasized "problem-solving from a business consultant's perspective". Expect pressure on business logic.

### Gaps
- Could not identify the 2022 4th place and honorable mentions, the 2024 runner-up and third-place team affiliations, the full finalist lists, or detailed write-ups (team blogs on Medium, Facebook or LinkedIn). The search quota was exhausted before a thorough team-blog sweep.
- Formal 2024 scoring weights were not found.

---

## Q6. TDX 運輸資料流通服務 (MOTC): datasets, real-time feeds, access, limits, cost, license

### Takeaway
TDX is MOTC's national transport-data hub. It provides OData APIs for bus, MRT/rail/HSR, aviation (including TPE FIDS), bike-share (YouBike/Moovo), parking (real-time remaining spaces), road traffic events (planned and live), tourism POIs, GIS and GTFS (beta). Access uses OIDC client-credentials tokens. Since 2024-04-29, per-key quotas depend on a subscription plan whose details are on a JavaScript-rendered pricing page that could not be read. Treat cost and quota as "verify after login".

### Cited Findings
**What it is**
- MOTC (Management Information Center) platform launched in 2020 as the successor to PTX (2016). Over 1,900 datasets and about 4.9 million API calls per day at the time. Over 3,000 value-added users. Includes private-sector partner data (TomTom OD and real-time traffic, Taiwan Mobile taxi fleet GPS, Chunghwa CVP real-time traffic, Gogoro, Acer, FET). In January 2021 it was free, with fees "planned" — [iThome, 2021-01-06](https://www.ithome.com.tw/news/142077)
- Data domains: road, rail, aviation, maritime, bicycle, road conditions, parking, mapping, road-segment coding and tourism, delivered as OData APIs with basic and advanced/value-added tiers — [TDX 資料使用葵花寶典](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/). The guide index also lists EV-charging, GTFS (Beta) and GIS service guides — [TDX guide index](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/llms.txt)

**Real-time feeds relevant to a yoxi companion (update frequencies)**
- Bus A1/A2/N1 (real-time position and ETA): per-record UDP every 2–3 seconds, batch TCP every 1 minute. MRT/TRA/THSR live board, delay and remaining seats: every 1 minute. Rail service disruptions (營運通阻): every 5 minutes — [TDX update-frequency table](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/data_notice/public_transportation_data/update_frequency.md)
- Parking: off-street car parks and on-street segments and spots (rates, hours, spaces). Real-time remaining spaces update every minute and static data daily. Includes an advanced "within radius" spatial query — [TDX parking guide](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/ling-yu-zi-liao-ru-men-zhi-yin/ting-ju-zi-liao-ru-men-zhi-yin.md)
- Road traffic events: planned events (construction, **activities**, weather) and live events (accidents, construction, disasters such as rockfall or flooding, congestion queues). City planned events update every 4 hours. City, provincial-highway and freeway live events update every minute — [TDX traffic-event guide](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/ling-yu-zi-liao-ru-men-zhi-yin/dao-lu-jiao-tong-shi-jian-ru-men-zhi-yin.md)
- Bike-share: YouBike and Moovo stations, with real-time bikes and e-bikes available to rent and docks to return, updated every minute. Includes a nearby-search API (`BikeApi_Station_AllCity_NearBy_2870`) — [TDX bike guide](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/ling-yu-zi-liao-ru-men-zhi-yin/zi-xing-ju-zi-liao-ru-men-zhi-yin.md)
- Aviation: FIDSAirport and FIDSFlight views with Schedule, Estimated and Actual times. **Taoyuan (TPE) real-time flight data covers the previous, current and next day**; other domestic airports cover the current day only. Seasonal schedules come from CAA and Taoyuan Airport — [TDX aviation notes](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/data_notice/public_transportation_data/air.md)
- Tourism: attractions, restaurants and hotels. Also station patronage, Taipei YouBike OD history, road network and geocoding (via the NYCU wrapper packages) — [NYCU TDX Guide](https://bookdown.org/chiajungyeh/TDX_Guide/)

**Access and authentication**
- OIDC client credentials. Token URL `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token`. The token (JWT) lasts 86,400 seconds; cache it and refresh every 4–6 hours. The token endpoint allows 20 calls per minute per IP. Up to 3 API keys per member. Use `Accept-Encoding: br,gzip`. TLS 1.2 or higher only — [tdxmotc/SampleCode (official GitHub)](https://github.com/tdxmotc/SampleCode)
- **API-endpoint limits are per API key and depend on the subscription plan, effective 2024-04-29 12:00. See https://tdx.transportdata.tw/pricing** — [tdxmotc/SampleCode](https://github.com/tdxmotc/SampleCode). The pricing page is JavaScript-rendered and could not be read in this session.
- Registration requires an account review, with approval by email (about 3 business days in 2021) — [noob.tw, 2021-09-30](https://noob.tw/tdx-api/); [HackMD tutorial](https://hackmd.io/@flagmaker/rkYuM0955)
- Older, possibly outdated limits: non-members 50 calls per day per IP. Members subject to 50 calls per second per IP (undated tutorial) — [HackMD](https://hackmd.io/@flagmaker/rkYuM0955); [noob.tw, 2021](https://noob.tw/tdx-api/)
- **Unverified social-media claim (c. late 2024):** TDX "API points" cost NT$1 per point; free users get 3 points per month; a basic-service point = 1,500 calls and an advanced-service point = 200 calls (e.g., bus-stop arrival lookup) — [Threads post by @darrell_tw_ (search snippet only; page not fetchable)](https://www.threads.com/@darrell_tw_/post/DC3ocjty016)
- Wrappers: NYCU's R package (v3.14, 2025-10-12) and `nycu-tdx-py` (Python) handle tokens automatically — [NYCU TDX Guide](https://bookdown.org/chiajungyeh/TDX_Guide/)

### Inferences
- High-value TDX joins for yoxi's de-identified data:
  - THSR/TRA live boards and delays, for HSR-hub pickups at Zuoying and Changhua where yoxi has dispatch rights.
  - TPE FIDS estimated arrival times, for airport-pickup nudges.
  - Bus and MRT disruptions and service alerts, for a "your usual route is disrupted, ride instead?" prompt.
  - Parking remaining spaces near a user's frequent destinations, for a "parking is full there tonight" prompt aimed at car owners.
  - Planned "activity" road events, for concert or event road closures.
  - YouBike availability, to show multimodal honesty (suggest a bike when it's better), which supports trust and retention.
- If the unverified points model is right (about 4,500 free basic calls per month), a live demo should cache static data, poll only a few endpoints, and use historical or bulk endpoints for modeling. Budget a small paid allowance in the cost section.

### Gaps
- **TDX plan names, prices, free quotas and per-second limits were not confirmed.** The pricing page needs JavaScript and the search quota ran out. The team should log in and read tdx.transportdata.tw/pricing.
- TDX's data license (whether all datasets follow 政府資料開放授權條款, and whether private-partner data like TomTom has extra terms) was not confirmed.
- Planned-event coverage by city (e.g., Taipei Dome events within "activities") was not confirmed. The guide points to a supply-status page at tdx.transportdata.tw/data-provide.

---

## Q7. Weather, air quality, airport, city portals, events and POI data: availability, licenses, costs

### Takeaway
Weather (CWA) and air quality (MOENV) are free under the Government Open Data License v1 and need only a free API key. Usable feeds include township forecasts every 6 hours, observations every 10 minutes and real-time rain gauges. data.taipei offers road works today, MRT hourly station flows and YouBike OD data. The Taipei Travel Open API has event calendars. Google Places (New) is billed per call above per-SKU free monthly caps. OSM is free but ODbL share-alike. No machine-readable Taipei Dome or Taipei Arena schedule feed was found.

### Cited Findings
**Government Open Data License (政府資料開放授權條款)**
- The CWA declaration grants free, non-exclusive, sublicensable, irrevocable use. Users may reproduce, adapt, publicly transmit or create derivative products and services without time or territory limits. **Attribution is required** ("使用時應註明出處"). No endorsement may be implied and data must not be maliciously altered. Some audiovisual and image works may need separate consent — [CWA 政府網站資料開放宣告](https://www.cwa.gov.tw/V8/C/information.html)
- Datasets on data.gov.tw list "政府資料開放授權條款-第1版" and "免費" — [data.gov.tw 9177](https://data.gov.tw/dataset/9177); [data.gov.tw 9309](https://data.gov.tw/dataset/9309)

**中央氣象署 (CWA) open data**
- Access: register on opendata.cwa.gov.tw to get an authorization key (format `CWA-xxxxxxxx-...`), passed as `Authorization=`. Example endpoint `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=<key>&format=JSON&locationName=桃園市` (36-hour general forecast) — [iThome 鐵人賽](https://ithelp.ithome.com.tw/articles/10346749)
- F-D0047-093, township and district forecasts for all of Taiwan, updated every 6 hours. Fields include temperature, humidity, precipitation probability, wind, comfort, apparent temperature, weather, max/min temperature and UV. Free, Gov Open Data License v1. Bulk download needs membership — [data.gov.tw 9309](https://data.gov.tw/dataset/9309)
- O-A0003-001, current weather observations every 10 minutes (precipitation, wind, temperature, humidity, UV, gusts). Free, license v1. The download URL changed 2023-09-15 — [data.gov.tw 9178](https://data.gov.tw/dataset/9178)
- O-A0002-001, real-time automatic rain-gauge rainfall (fields such as RAIN, MIN_10, HOUR_3/6/12/24, NOW, with station coordinates). Free, license v1, API/JSON/XML — [data.gov.tw 9177](https://data.gov.tw/dataset/9177)
- CWA also publishes satellite, radar, rainfall accumulation, lightning and UV data — [CWA declaration](https://www.cwa.gov.tw/V8/C/information.html)

**環境部 (MOENV) air quality**
- AQX_P_432 AQI, updated hourly. 24 fields including SiteName, County, AQI, Pollutant, Status, PM2.5, PM10, O3, wind, publishtime and coordinates. API: `https://data.moenv.gov.tw/api/v2/AQX_P_432?api_key=...&format=json`. License per data.gov.tw — [MOENV dataset page](https://data.moenv.gov.tw/dataset/detail/AQX_P_432)

**City platforms**
- 臺北市資料大平臺 (data.taipei, run by the Taipei Information Bureau) offers preview, file download and API. Featured datasets: 臺北市今日施工資訊 (today's road works), 臺北市YouBike起訖站點統計 (YouBike OD) and 臺北捷運各站分時進出量統計 (MRT hourly entries and exits by station). The footer links to the Gov Open Data License — [data.taipei](https://data.taipei/)
- The 臺北旅遊網 Open API offers 遊憩景點, 活動展演, 活動年曆, 最新消息 and 主題遊程 in JSON/XML with Swagger docs — [travel.taipei/open-api](https://www.travel.taipei/open-api)

**Event and venue data**
- TDX "planned road events" include activities with an update every 4 hours ([TDX traffic-event guide](https://motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/ling-yu-zi-liao-ru-men-zhi-yin/dao-lu-jiao-tong-shi-jian-ru-men-zhi-yin.md)). The Taipei Travel API has event calendars ([travel.taipei](https://www.travel.taipei/open-api)).
- Taipei Dome's official site (taipeidome.com.tw) homepage showed no event feed or API in what could be fetched — [Taipei Dome](https://www.taipeidome.com.tw/)

**Commercial POI options**
- Google Places API (New), USD per 1,000 calls at the lowest paid tier (page updated 2026-10-07):
  - Text Search Pro: $32, 5,000 free per month. Enterprise: $35, 1,000 free.
  - Nearby Search Pro: $32, 5,000 free.
  - Place Details Essentials: $5, 10,000 free. Pro: $17, 5,000 free. Enterprise: $20, 1,000 free.
  - Autocomplete: $2.83, 10,000 free.
  - IDs-only Text Search and Place Details: unlimited and free.
  - [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- OpenStreetMap: ODbL. Free to copy, distribute and adapt with attribution ("© OpenStreetMap contributors"). **Share-alike** applies if you distribute an adapted database. OSM does not provide a free map API or tiles for third-party heavy use, which is governed by separate usage policies — [OSM copyright](https://www.openstreetmap.org/copyright)

### Inferences
- Cheapest rich stack for a demo: CWA (rain probability and real-time rain), MOENV AQI, TDX (transit, parking, events, FIDS), data.taipei (road works, MRT flows) and the Taipei Travel events API. All are free with attribution, apart from the possible TDX quota.
- yoxi's provided POI attributes may make Google Places unnecessary for the core model. Use Places only for display enrichment, with IDs-only and Essentials SKUs inside free caps, and budget it in the cost section.
- Strong "daily reasons to open yoxi" triggers from open data: rain starting near a user's usual place and time, an event ending at a venue near a frequent destination, a delay on the usual MRT/THSR line, full parking at a frequent destination, a delayed TPE flight for an airport pickup, and an AQI spike. Each pairs naturally with a one-tap ride or reservation, which is the conversion path.

### Gaps
- CWA API rate limits were not found. The warnings dataset ID (commonly W-C0033-001) was not verified this session.
- Taoyuan Airport's own open data portal and the 新北, 臺中 and 高雄 open-data portals were not checked (search quota exhausted).
- No verified machine-readable schedules for 臺北大巨蛋, 臺北小巨蛋 or 高雄巨蛋. The 文化部 culture-event open data feed was blocked to fetching. Its category for concerts (演唱會) is believed to be in 文化部's "文化資料開放服務網", but this is unverified.
- Google Maps Platform's switch from a monthly US$200 credit to per-SKU free caps was not confirmed this session. The pricing page lists only the free caps above.
- data.gov.tw's license page could not be fetched (robots). The license summary above comes from CWA's own declaration.

---

## Q8. Examples of these datasets being used in Taiwanese mobility apps

### Takeaway
Evidence is thin because the search quota ran out. TDX had over 3,000 value-added users by 2021, and taxi-fleet GPS data flowed into TDX. Hotai's own 2022 hackathon explicitly encouraged combining its iRent and yoxi data with Open Data.

### Cited Findings
- TDX in 2021: over 3,000 value-added units, about 4.9M API calls per day, over 540M records exchanged daily. Private partners contributing data include Taiwan Mobile's taxi fleet (taxi GPS points), Gogoro, TomTom and Chunghwa Telecom CVP — [iThome, 2021-01-06](https://www.ithome.com.tw/news/142077)
- The 2022 和泰 MaaS 數據黑客松 asked participants to combine Hotai MaaS data (iRent/yoxi) with Open Data. Entries included automatic parking-space finding and a carbon passbook — [CIO, 2022-12-22](https://www.cio.com.tw/first-maas-data-hacker-ty-group-and-microsoft-open-mobile-services-new-future/); [T客邦](https://www.techbang.com/posts/102608-hotai-hackthon-2022-competition-results-released)
- yoxi's accessible-entrance feature recommends pickup points with elevators at MRT and HSR hubs, which implies hub and facility data, though the source is not stated — [工商時報, 2026-04-27](https://www.ctee.com.tw/news/20260427701361-430503)

### Inferences
- Taiwanese transit apps commonly build on TDX/PTX. A yoxi proposal that layers its private ride data on top of public TDX, CWA and city data is consistent with MOTC's stated public-private data-exchange model. (Inference from the iThome description.)

### Gaps
- No specific, verified case studies (e.g., Bus+, Taiwan bus apps, or competitors like 55688/Uber using CWA or TDX) were collected. The search quota was exhausted before this sweep.
