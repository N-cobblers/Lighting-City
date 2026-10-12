# yoxi users and Taiwanese daily mobility: what users say, how they travel, and which needs go unmet (as of 2026-10-09)

> **Method and limits (read first).** Research was done on 2026-10-09. The shared web-search budget ran out partway through, so the rest of the evidence comes from direct fetches of pages that earlier searches had already found.
>
> **Pages that could not be read:**
> - LINE GO's Taiwan App Store page (proxy rate limit, HTTP 429)
> - All Google Play listings
> - 55688's App Store page
> - PTT and Dcard threads
> - The TWNIC report site
> - The DGBAS survey summary (blocked by robots.txt)
> - CommonWealth Magazine (天下, cw.com.tw; blocked by robots.txt)
> - Direct file downloads from motc.gov.tw (blocked by the egress proxy, HTTP 403)
>
> Forum sentiment therefore comes mostly from secondary summaries (news, blogs, social-listening firms).
>
> **Evidence labels used below:**
> - **[SURVEY]** official or representative survey
> - **[PLATFORM DATA]** operating data reported by a company, not audited
> - **[SOCIAL LISTENING]** analysis of online discussion volume; not representative of users
> - **[ANECDOTE]** individual reviews, posts, or blogger opinions

---

## Q1. App-store ratings and review themes for yoxi, compared with Uber, 55688 and LINE GO

### Takeaway
yoxi has a high iOS rating: 4.8 from about 54,000 ratings on the Taiwan App Store (read 2026-10-09). Uber has roughly 11 times as many ratings (4.9 from about 590,000). yoxi's visible reviews are all about the ride itself: wrong arrival estimates, drivers cancelling reservations, safety monitoring, and driver kindness. Users judge the app only as a booking tool, and nothing in the reviews points to value between trips.

### Cited Findings
- **yoxi on the Taiwan App Store:** 4.8/5 from about 5.4萬 (≈54,000) ratings. The app is free, in the Travel category, and published by Hotai Connected (和泰聯網). — [App Store TW, yoxi](https://apps.apple.com/tw/app/id1521393667) (read 2026-10-09)
  - Features listed: one-tap booking of saved frequent routes; ride preferences (no music, no chatting, notes to the driver); coupons applied automatically when a credit card is linked; two-way ratings and in-app tipping; trip export for expense claims; and an SMS emergency alert.
- **yoxi release cadence:** 20 iOS releases from 1.11.12 (2026-01-07) to 1.12.16 (2026-09-29), counting both ends. Version 1.12.0 (dated 3月18日, which is 2026 by sequence) added an "unrestricted vehicle type" mode; that is an English paraphrase of the release note, and the exact Chinese wording was not captured. Most release notes say only "優化體驗並修復已知問題". — [App Store TW, yoxi](https://apps.apple.com/tw/app/id1521393667)
- **Reviews visible on the yoxi listing [ANECDOTE].** The developer replied to every review and pointed users to cs@yoxi.app. — [App Store TW, yoxi](https://apps.apple.com/tw/app/id1521393667)
  - 2024/09/12, "預估時間不準確": "預估抵達的時間嚴重過度樂觀"
  - 2025/06/15, "預約接送司機單方面取消太過份": "可以讓接預約單的司機單方面取消訂單對乘客造成相當嚴重的影響"
  - 2024/10/07, a safety suggestion: "比方說中央遠端監控對規劃的距離地點及時間若有嚴重偏離差距，立刻呼叫處理"
  - 2024/09/22, praise: "司機真的超棒的…開車平穩…因為下雨天讓我在不會淋雨的地方下車"
- **Uber on the Taiwan App Store:** 4.9/5 from about 59萬 (≈590,000) ratings. The visible reviews (2018–2022) complain that rider ratings are unexplained and that the pickup pin "選擇定位的時候無法排除禁止臨時停車的區域" (can't avoid no-stopping zones). — [App Store TW, Uber](https://apps.apple.com/tw/app/uber/id368677368) (read 2026-10-09)
- **yoxi's own figure (July 2026):** "over 60,000 reviews averaging 4.8 stars on iOS and Android." — [TVBS 車圈, 2026-07-14](https://cars.tvbs.com.tw/life/331958). If iOS alone has about 54,000 ratings, the combined figure implies either a small Google Play rating base or a different measurement date (unverified).
- **Consumer blog scoring:** lists yoxi's Google rating as 4.8, scores yoxi 4/5 for coupons and 3/5 for ease of use, and notes that cash payment and corporate billing cannot use ride coupons. — [kikinote](https://kikinote.net/160985) (page dated 2026-06-23; its date labels are inconsistent)
- **55688, 2022 figures:** "好評4.7顆星", about 33,000 reviews, and "用戶好感度高達94%". These come from a sponsored, company-favourable article citing Sensor Tower; it doesn't say which app store. No 2026 figure was found. — [遠見 廣編, 2022-07-14](https://www.gvm.com.tw/article/91974); [旺得富, 2022-07-17](https://wantrich.chinatimes.com/news/20220717900178-420101)
- **yoxi driver app (supply side):** 3.6/5 from 164 ratings. — [App Store TW, yoxi司機](https://apps.apple.com/tw/app/id1521393549)
  - 2025/07/06: "單量少的可憐，不想辦法增加客源，只會整天搞一些規定來整司機"
  - 2025/07/23: notification sound too quiet, and no sound through CarPlay
  - 2024/09/20: asks to keep in-app messaging after the passenger boards
  - 2024/01/23: one star over yoxi's sponsorship of 《賀瓏夜夜秀》

### Inferences
- Every theme in the reviews is about the trip itself (arrival estimates, cancellation, the driver, the drop-off spot). Nothing suggests users get value from the app between trips, which supports the challenge's premise.
- Reservations are both where yoxi earns loyalty and where failures hurt most. Users praise reserved drivers who arrive early and reduce anxiety (see Q2), and they are angry when drivers cancel reservations.
- Drivers complaining about "單量少" shows the demand gap is felt on the supply side too. A daily-engagement feature that produces scheduled or predicted demand would also help keep drivers.

### Gaps
- Google Play ratings and download counts for yoxi, Uber, 55688 and LINE GO could not be retrieved.
- LINE GO's App Store page was blocked by a rate limit (HTTP 429), and 55688's App Store page did not load.
- Systematic review mining (hundreds of reviews coded by theme) was not possible; only the few reviews each listing shows were seen.
- No Taiwanese review aggregator (for example AppFigures or Sensor Tower public pages) was reached.

---

## Q2. Forum, social and news discussion: why people choose yoxi, typical use cases, and loyalty and switching

### Takeaway
Online and media discussion casts yoxi as the option with new, clean Toyota/Lexus cars, coupons, a polished app and corporate billing. It is valued for planned (reserved) and business trips, mostly in Greater Taipei, and it ranks 4th in online discussion volume behind Uber, 55688 and LINE GO.

Riders clearly use several apps. Media and netizens routinely advise opening several apps at once in rain or at peak times, and since 2024 yoxi's own fleet can also be booked through Uber. Both reduce the reasons to open yoxi specifically.

### Cited Findings
**Discussion volume and positioning [SOCIAL LISTENING]**
- **DailyView/KEYPO, 2024-07-07 to 2025-07-06**, ranked by discussion volume only, not sentiment: 1 Uber, 2 55688, 3 LINE GO, 4 yoxi. — [TVBS/DailyView, 2025-07](https://news.tvbs.com.tw/ttalk/2929639)
  - yoxi user: "常使用預約叫車，派遣來的司機們都會提早到達，減少我的焦慮，服務態度很好，車輛乾淨新穎"
  - LINE GO user: "最近午後常下大雨，都用LINE GO叫車，使用上順暢，綁定LINE Pay，到了直接下車". Others say "LINE GO容易叫不到車".
  - 55688 user: "幫女兒預約叫車去學校，可以一路清楚看到行經路線與時間，掌握狀況！"
  - The same article lists yoxi features: suggested pickup and drop-off points that avoid illegal-parking spots; trip progress on the iOS lock screen and Dynamic Island; SMS emergency reporting; live customer service; acceptance of 敬老愛心卡 senior cards; and an interface in Chinese, English, Vietnamese and Indonesian with in-app translation.
- **DailyView ranking, 2019-06 to 2022-06:** Uber, 55688, LINE TAXI, then yoxi in 4th. — [TVBS/DailyView, 2022-06-28](https://news.tvbs.com.tw/ttalk/1830936)
  - Netizen quotes: "Uber真的素質好又方便"; "只搭55688app叫車,比Uber便宜而且車素質也不錯"; "年輕人就愛Uber".
- **i-Buzz analysis of the prior year's discussion (published 2024-04):** — [The News Lens / i-Buzz, 2024-04-07](https://www.thenewslens.com/article/200347)
  - Driver quality is the most-discussed topic in the category, and discounts draw the most attention.
  - Uber's discussion volume is about 9 times the industry level. Uber and LINE GO are praised for clean cars, in contrast with the smell users associate with street taxis.
  - LINE GO and 55688 are criticised as hard to hail.
  - yoxi's positive buzz came from Kaohsiung MRT Mengo points integration and its drivers' support for the Mazu pilgrimage. Its negative buzz came from sponsoring 《賀瓏夜夜秀》.
  - The analysts warn that low prices may not sustain loyalty.

**Why people choose yoxi, and its perceived weaknesses [ANECDOTE / media summaries]**
- **PTT and Dcard sentiment, as summarised by a blog** (no thread links, so second-hand): — [UpToGo, 2026-07-07](https://uptogo.com.tw/汽機車/哪個計程車隊比較好ptt？/)
  - yoxi is praised for Toyota cars under 5 years old, frequent coupons and a full-featured app. Complaints: prices swing more outside off-peak hours, and there are fewer cars outside Taipei. Typical use is short trips within the city, mainly in Taipei.
  - 55688 is praised for getting a car at night and in suburbs, and for stable metered fares during demand surges.
  - Uber is praised for showing the fare upfront and because "不用跟司機講話". It is criticised for fares that rise "2 至 3 倍" in rain, on New Year's Eve and at rush hour.
- **Consumer-finance comparison:** — [Roo.cash, 2025-12-08, updated 2026-01-07](https://roo.cash/blog/taxi-comparison)
  - yoxi: "行程紀錄與行車匯出上做得很不錯", and it earns 和泰 Points.
  - LINE TAXI: a daily ride voucher of NT$25–35 and a "日日搭" monthly pass at up to 40% off.
  - 55688: a five-tier 熊友會 membership, and a female-driver option ("女司機服務可以說是女性福音").
  - Uber: a pet-friendly car option.
- **mybest ranking (yoxi 3rd of 10 apps):** all cars under 5 years old, NT$50M passenger liability insurance, saved routes, ride preferences, and corporate e-billing. — [mybest, 2024-07-18](https://tw.my-best.com/116064)
- **Points and card limits:** "和泰Points可以折抵的通路有限", and one credit card can be linked to only one user. — [Money101, updated 2022-09-14](https://www.money101.com.tw/blog/yoxi-%E8%A8%88%E7%A8%8B%E8%BB%8A-%E5%84%AA%E6%83%A0%E7%A2%BC-%E4%BF%A1%E7%94%A8%E5%8D%A1%E6%8E%A8%E8%96%A6) (dated)

**Pricing perception: the sources conflict**
- **Marketing copy:** yoxi "不論是預約叫車、攜帶寵物、雨天或尖峰時段，均不會有加價或不合理的費率". — [TVBS/DailyView, 2025-07](https://news.tvbs.com.tw/ttalk/2929639)
- **yoxi's own fare page and FAQ say otherwise for 多元計程車 in Taipei and New Taipei:** — [yoxi fare rules](https://www.yoxi.app/promotion/105); [yoxi FAQ](https://www.yoxi.app/faq)
  - Fare page: "動態加成倍數為基本運價、計時費用、加成費用之 1~3.9 倍".
  - FAQ: "若您是在台北市或新北市叫車，系統也會同步考量當下的即時搭車需求來微調車資".
  - Metered 小黃 taxis follow the meter "或是司機與您雙方和議之定價收費".
  - So the "no surcharge" claim seems to hold for metered taxis and pets (the FAQ says "寵物搭乘不需另外支付費用"), but not for 多元 rides in Taipei and New Taipei.
- **Sources disagree on yoxi's pricing model:** Roo.cash lists it as metered ("跳表"); UpToGo lists it as dynamic. Each is partly right. — [Roo.cash](https://roo.cash/blog/taxi-comparison); [UpToGo](https://uptogo.com.tw/汽機車/哪個計程車隊比較好ptt？/)
- **Blog guide:** 多元 fares "在尖峰時段或需求量大時，可能會有動態加成費用"; and "若臨時變更下車點，也可能影響優惠券適用性". — [Roo.cash yoxi guide, 2025-11-24, updated 2026-03-22](https://roo.cash/blog/?p=113683)
- **Cancellation fees from 2025-01-01:** NT$40 for an instant ride when the driver has arrived and the rider doesn't show within 3 minutes; NT$80 for a reservation cancelled within 30 minutes of pickup. Corporate accounts cannot cover cancellation fees. — [yoxi FAQ](https://www.yoxi.app/faq); [yoxi fare rules](https://www.yoxi.app/promotion/105)

**Use cases that appear in discussion and company material**
- **Reservations to reduce anxiety:** see the DailyView quote above.
- **Groups and families:** yoxi's 6-seat "樂聚多元" service launched 2026-09-01 with "固定車資免跳表". It targets groups of 4–6, families, airport trips, large luggage, camping gear, strollers and shopping trips: "讓親友同行不必再分車". — [TVBS 車圈, 2026-09-01](https://cars.tvbs.com.tw/car-life/340536)
- **Business:** corporate billing and trip export; 650+ corporate and government clients; corporate trips up 23% year on year (company figures, July 2026). — [TVBS 車圈, 2026-07-14](https://cars.tvbs.com.tw/life/331958)
- **Seniors and hospital visits:** senior and disability cards accepted in 7 cities; requests for wheelchair storage or boarding help doubled in 2025 versus 2024; about 20% of ride demand at medical facilities comes from Indonesian-language users. — [T客邦, 2026-04-28](https://www.techbang.com/posts/129049-yoxi-ai-address-recognition-for-seniors)
- **Pets:** no pet fee, but a cleaning fee may apply. — [yoxi FAQ](https://www.yoxi.app/faq)
- **High-speed rail:** yoxi won taxi-rank access at Changhua and Zuoying HSR stations in 2025. — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)
- **Japan:** the yoxi app works through GO in 46 prefectures. — [工商時報, 2026-01-15](https://www.ctee.com.tw/news/20260115702068-431207)

**Loyalty and switching**
- **MRT 文湖線 outage, 2025-07-29.** Media advice: "可以同時開啟Uber、台灣大車隊、55688、yoxi等四大平台，看看系統先配對哪一平台，就搭哪一台", and "「小費」按下去機會更大". — [NOWnews, 2025-07-29](https://www.nownews.com/news/6712947)
- **Rainy-day advice, 2026-06:** open the app 15–30 minutes early, choose a clear pickup point, and try several services. — [NOWnews, 2026-06-26](https://www.nownews.com/news/6850655)
- **Consumer guide:** in rain, typhoons and rush hour, use metered fleets such as 55688 to avoid Uber's 1.5–3× surge; compare prices across apps on clear, off-peak days. A Threads user found 55688 cheaper than Uber "99%" of the time. — [UpToGo, 2026-06-12](https://uptogo.com.tw/?p=1753152)
- **Uber dual dispatch since February 2024.** yoxi-fleet taxis take orders through both yoxi and Uber: "yoxi 車隊將會成為全台第一個可透過 yoxi、Uber 雙平台派遣計程車的車隊" — [INSIDE, 2024-02-16](https://www.inside.com.tw/article/34203-yoxi-uber-taiwan); and "會員可以同時透過Yoxi或者Uber叫車，配合的司機也可以自行選擇藉由Yoxi或者Uber平台收單" — [TVBS 車圈, 2024-02-16](https://cars.tvbs.com.tw/life/172782)
- **Proxy from outside Taiwan only (Singapore online survey, July 2025, n=127):** — [The News Lens/TNL Research, 2025-08-08](https://www.thenewslens.com/article/267314)
  - 26.2% always use one platform; 36.4% mainly use one but switch when needed; 30.8% switch based on price, wait or promotions.
  - What triggers switching: fare 59.8%, promo codes 52.3%, pickup wait 35.5%.
  - Caveats: small sample, Singapore rather than Taiwan, and the article says its first draft was AI-generated.

### Inferences
- yoxi's distinctive strengths (new Toyota/Lexus cars, consistent quality, reservations that arrive early, business billing) show up in planned trips. Its perceived weaknesses (fewer cars outside Taipei, poor matching in rain, dynamic 多元 pricing) show up in spontaneous, stressful moments. A daily companion that moves demand into "planned" mode, by pre-booking around known routines and forecasts, plays to yoxi's strength.
- Using several apps at once is normal, and in rain people open all of them and take whichever matches first. Because yoxi cars can also be booked through Uber, the yoxi app needs reasons to be opened that are not rides, and needs to become the first app people try.
- Fare transparency is a trust lever. The gap between "no surcharge" marketing and dynamic multipliers of 1–3.9× (Taipei and New Taipei 多元) risks disappointment. An AI that forecasts and explains fares (for example, "leave 20 minutes later and pay less") could turn that risk into a daily engagement hook.

### Gaps
- No PTT, Dcard, Mobile01, Threads, Facebook-group or YouTube thread could be read directly, so forum sentiment here is second-hand.
- No representative Taiwanese survey was found on how often riders compare prices across apps, or on loyalty and switching rates.
- No data on how many yoxi-fleet trips are booked through Uber rather than the yoxi app.

---

## Q3. Published yoxi user demographics and survey data

### Takeaway
yoxi has not published passenger demographics (age, gender, city), open frequency, or ride frequency per user. What exists are company-reported scale metrics and signals about a few segments: seniors, Indonesian-speaking caregivers, riders needing accessibility help, business clients, and points users.

### Cited Findings
- **Scale over time [PLATFORM DATA]:**
  - August 2021: 500,000+ downloads, 3,000+ drivers, 1M trips. — [車訊網, 2021-08-23](https://www.kingautos.net/339474)
  - February 2024: 1M+ members and about 11,000 drivers. For comparison, the same article cites 55688 at about 6.5M members, LINE TAXI/LINE GO at about 3.5M, and Uber "reportedly" at about 12M members in Taiwan (unverified). — [TVBS 車圈, 2024-02-16](https://cars.tvbs.com.tw/life/172782)
  - July 2026: 2M+ app downloads, 10,000+ partner drivers, and about 4M members across the Hotai group ecosystem. — [TVBS 車圈, 2026-07-14](https://cars.tvbs.com.tw/life/331958)
- **Other company figures as of July 2026 [PLATFORM DATA]:** — [TVBS 車圈, 2026-07-14](https://cars.tvbs.com.tw/life/331958)
  - 1.2M+ trips used a points discount, redeeming 36M+ points ("累計已突破120萬趟行程啟用點數折抵，使用點數超過3,600萬點").
  - AI house-number recognition (AI 門牌辨識) was used 50,000+ times in the 4 months after launch.
  - 100+ "dynamic electronic fence" designated pickup points, switched on at large events and transport hubs.
  - 700+ accessible entrances mapped.
  - 53,000+ charity trips.
  - 68% of the fleet is hybrid or electric.
  - 30,000+ inbound foreign visitors served through the GO partnership.
  - Corporate trips up 23% year on year.
- **Senior and caregiver figures:**
  - "yoxi營運大數據顯示大約40%年長用戶認為用App叫車很麻煩" (no sample size or period given). — [工商時報, 2026-09-11](https://www.ctee.com.tw/news/20260911700013-431207)
  - Another version of the figure: about 40% of older users struggle to set an address and some give up booking. About 20% of ride demand at medical facilities comes from Indonesian-language users. Requests for wheelchair or boarding help doubled in 2025. People 65+ now exceed 20% of Taiwan's population. — [T客邦, 2026-04-28](https://www.techbang.com/posts/129049-yoxi-ai-address-recognition-for-seniors)
- **Recent rollouts:**
  - Kiosk booking at 7-ELEVEN ibon machines with an 8-language interface (including Indonesian and Vietnamese), plus real-time translation for talking to drivers. — [工商時報, 2026-09-11](https://www.ctee.com.tw/news/20260911700013-431207)
  - In-car digital tablets (NFC card payment, e-payments, video ads) rolling out from October 2025 in Greater Taipei and Kaohsiung. — [旺得富, 2025-11-13](https://wantrich.chinatimes.com/news/20251113900625-420101)
  - House-number recognition was reported as new in November 2025 and upgraded as "Snap to Go" with the Toyota Mobility Foundation in April 2026; sources differ on the exact launch date.
- **Promotions on the yoxi homepage (read October 2026):** "輸入【歡慶雙十】領 $120 yoxi 搭車金"; "10 點即可抽最高單張 $100 搭車金"; and references to LINE POINTS and OPENPOINT. The mechanics behind these are not visible on the page. — [yoxi.app](https://www.yoxi.app/)
- **Earlier promotion mechanics (most now expired):** a daily random coupon ("天天領"); one ride in a month earns a discount next month; 10 rides in a month earns 2 × NT$50; draws for movie and concert tickets tied to rides. — [kikinote, 2025-12-24](https://kikinote.net/159757)

### Inferences
- Seniors and their caregivers, including Indonesian-speaking migrant caregivers, form a high-need segment with recurring trips such as clinic and hospital visits. They are natural candidates for personalisation by frequent places and times, and for booking on someone else's behalf.
- yoxi already uses light gamification (points draws, daily coupons, monthly ride rewards), but all of it is tied to taking rides. A daily-open hook would need to offer value without a ride.

### Gaps
- No yoxi passenger split by age, gender or city; no monthly or daily active users; no app-open frequency, rides per user, retention or NPS; no yoxi-run user survey found.
- How many yoxi-fleet rides are booked through Uber versus yoxi is unknown.

---

## Q4. MOTC daily travel mode survey (民眾日常使用運具狀況調查), latest edition 113年 (2024 data, published June 2025)

### Takeaway
[SURVEY] In 2024, taxis were only **2.5%** of weekday trips by mode nationwide (each mode used in a trip counts once). Scooters (43.7%) and private cars (26.6%) dominated, and public transport was 15.2%, ranging from 38.3% in Taipei to under 5% in Tainan and several counties.

Trips cluster at 7–9 a.m. and 5–7 p.m., and commuting is 44.9% of trip purposes. Women and seniors depend more on non-driving modes. For most people the taxi is an occasional, situational choice, not a habit.

### Cited Findings
- **Survey design (113年):** — [MOTC 113年摘要分析, 2025-06](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1389089679046873088&type=s&id=56&serno=202506190000)
  - Asks residents 15+ about the previous weekday's trips (Monday–Friday).
  - Fieldwork 2024-09-01 to 2024-12-31; n=34,236 (28,279 landline, 5,957 mobile).
  - Excludes trips under 500 m.
- **Trip-making, 2024 (2022 in brackets):** — same source
  - 76.1% of people went out on the surveyed day (73.4%).
  - 2.49 trips per day for each person who went out.
  - 2.71 mode uses per day per person who went out.
  - About 42.61M mode uses per day in total, up 6.2% on 2022.
- **Trip purposes, 2024:** — same source
  - Overall: commuting 44.9%, shopping 17.1%, family/personal 16.8%, leisure 11.9%, business 4.7%, school 4.5%.
  - Commuting: men 48.3%, women 41.5%.
  - Women do more shopping (20.4% vs men's 13.7%) and more family/personal trips (19.6% vs 14.1%).
  - People 65+: leisure 33.8%, shopping 28.2%, family/personal 23.6%.
- **National mode shares, 2024 (2022 in brackets):** — same source
  - Scooter 43.7% (45.8%)
  - Private car 26.6% (25.0%)
  - Walking 9.9% (10.0%)
  - Rail (MRT, TRA, HSR) 6.6% (5.5%); rail overtook buses for the first time
  - Bus and coach 6.0% (6.0%)
  - Bicycle 2.7% (3.0%)
  - **Taxi 2.5% (2.7%)**
  - Micro e-scooter 0.2% (0.3%)
  - All public transport 15.2% (14.3%); all private motorised 72.0% (72.3%)
- **Public transport share by city, 2024 (2022 in brackets):** — same source
  - Taipei 38.3% (37.2%); Keelung 33.4% (32.5%); New Taipei 29.0% (28.7%); Taoyuan 12.9% (9.1%); Kaohsiung 10.2% (8.4%); Taichung 9.0% (8.8%); Tainan 4.9% (4.8%).
  - Lowest: Nantou 3.3%, Changhua 3.4%, Yunlin 3.8%.
  - Private motorised share is highest in Changhua (89.1%) and Pingtung (88.8%) and lowest in Taipei (37.0%).
- **Public transport share by group, 2024:** women 19.2% vs men 11.0%; ages 15–17 43.2%; ages 65+ 19.7%; residents of the six special municipalities 18.7% vs 6.7% elsewhere. — same source
- **When trips start, 2024.** These shares are derived from the weighted sample counts in appendix table 2 (附表2), so treat them as approximate. — [MOTC 113年統計表](https://www.motc.gov.tw/ch/app/data/doc?id=56&module=survey&detailNo=1387600371127422976&serno=202506260000&type=s&preview=&aplistdn=)

  | Departure time | Share of trips |
  |---|---|
  | Before 07:00 | 6.2% |
  | 07:00–09:00 | 24.5% |
  | 09:00–11:00 | 11.0% |
  | 11:00–13:00 | 8.5% |
  | 13:00–15:00 | 5.4% |
  | 15:00–17:00 | 9.3% |
  | 17:00–19:00 | 21.9% |
  | 19:00–22:00 | 10.1% |
  | After 22:00 | 1.7% |

- **Public transport share by trip purpose, 2024:** school 38.2%, leisure 20.3%, family/personal 17.3%, business 13.9%, commuting 13.6%, shopping 6.6%. — same tables
- **Taipei, 2024 (2022 in brackets):** — [Taipei City Municipal Statistics Weekly No. 1341, 2025-07-16](https://www-ws.gov.taipei/001/Upload/367/relfile/46908/9442607/0bbf97f1-faca-4f2c-b296-3013a137e3f0.pdf)
  - MRT 16.0% (14.4%); bus 13.7% (13.1%); walking 20.8% (18.6%); bicycle 3.8% (5.2%); car 20.1% (22.2%); scooter 16.3% (15.9%).
  - Commuting is 44.2% of Taipei trips (39.5%).
  - 75.1% of Taipei women's trips are by public transport, walking or cycling.
- **2022 edition (111年, n=37,792):** — [MOTC 111年摘要 (SRDA copy)](https://srda.sinica.edu.tw/file/cb076321-9145-4b67-bf55-0675c4dee8ae)
  - Taxi was 2.7% of mode uses and 2.4% by main mode per trip.
  - Reasons for not using public transport: "開/騎車機動性較高" 48.8%; "沒有公共運輸可以搭乘" 21.8%; destination too close to need transport 19.9%; schedules don't fit 11.5%.
- **Taichung, 2022 data:** taxis are **23.8% of public-transport use**, second only to city buses (39.3%); private motorised share is 80.7%. — [Taichung City Budget, Accounting and Statistics Office, report 112-012, 2023-11](https://www.dbas.taichung.gov.tw/media/998929/112-012-臺中市運具使用變化.pdf). A council interpellation put Taichung's private motorised share at 81.6% in the 113年 survey. — [NOWnews, 2026-05-21](https://www.nownews.com/news/6838607)
- **2016 edition (105年):** taxi share was 2.2% of mode uses and 1.6% by main mode, after MOTC reweighted taxis using supply-side data because the survey had undercounted them. Taxi satisfaction was 97.5%. — [MOTC 105年摘要 (SRDA copy)](https://srda.sinica.edu.tw/file/ddfc476a-494a-4aeb-9805-2408879d2917)
- **New Taipei city poll, 2016:** only 0.4% of residents named the taxi as their most-used mode. — [New Taipei Transportation Department](https://www.traffic.ntpc.gov.tw/userfiles/1130901/files/%E6%96%B0%E5%8C%97%E5%B8%82%E5%85%AC%E5%85%B1%E9%81%8B%E8%BC%B8%E5%B8%82%E5%8D%A0%E7%8E%87%E6%80%A7%E5%88%A5%E5%B7%AE%E7%95%B0%E5%88%86%E6%9E%90.pdf)
- **Supply side: 112年 taxi operations survey** (2023 data, n=9,142 full-time drivers, fieldwork March–June 2024): — [MOTC 112年計程車營運狀況調查](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1301088644538306560&type=s&id=56&serno=202410300001)
  - How drivers get passengers (multiple answers allowed): 72.5% through app/online or radio dispatch (58.0% in 2021); 51.7% by cruising the streets.
  - 68.1% belong to a dispatch fleet (50.0% in 2021).
  - Per day: 12.2 trips and 9.1 operating hours, of which 2.4 hours are empty (an empty-time rate of 26.4%).
  - Average driver age is 53.6, and **4.5% of drivers are women**.

### Inferences
- **Rough scale (my calculation):** 2.5% × about 42.61M daily mode uses ≈ **1.07M taxi uses per weekday** among people 15+ in 2024. Taxis matter in absolute terms, but for most individuals they are an occasional mode.
- To be used daily, a companion has to help with the trips people actually make. Outside Taipei that means scooters and cars; in Taipei it means MRT, bus and walking. Useful daily help covers weather, parking, transit disruptions and commute timing, with conversion to a ride at the moments those modes fail.
- The 7–9 a.m. and 5–7 p.m. peaks hold about 46% of trip departures combined, which makes them the natural daily touchpoints for commute prompts.
- Women and seniors rely more on public transport and walking, and women make more shopping and family trips. These groups have more moments without a car that a ride can solve: carrying bags, travelling with children, rain, coming home late.

### Gaps
- Taxi-specific breakdowns by city, purpose, time of day, age and gender sit in appendix tables 11 and 17 (附表11/附表17) of the 113年 statistics. They could not be extracted: the PDF was truncated and downloads from motc.gov.tw were blocked by the proxy (HTTP 403).
- The survey covers weekdays only and does not ask about ride-hailing apps or how people book.
- The full report text, with reasons for using or avoiding public transport in 2024, was not reached; the 2022 reasons are given above.

---

## Q5. Other surveys on ride-hailing use and attitudes, and Taiwanese smartphone and app habits

### Takeaway
Within the search budget, no representative third-party survey on how often Taiwanese use ride-hailing was found (none from 東方線上, MIC, 創市際, 波仕特, YouGov or Rakuten Insight). The best signals are platform data from 55688, LINE GO and Uber, plus social listening.

LINE is the anchor of daily phone habits: 93% weekly reach and about 14 opens a day on average (Nielsen, 2025). LINE GO already sits inside LINE and hands out daily ride vouchers.

### Cited Findings
- **LINE usage (Nielsen 2025 Internet Survey and 2025 LINE usage survey, ages 15–65):** — [旺得富, 2025-11-25](https://wantrich.chinatimes.com/news/20251125900301-420501); [NOWnews, 2025-11-25](https://www.nownews.com/news/6757935)
  - 93% used LINE in the past 7 days.
  - Users open it 14 times a day on average.
  - About half are medium-to-heavy users, who open it about 22 times a day.
  - About 80% welcome LINE combining AI with its services.
  - There are 3.4M official accounts, and the average user follows about 60.
- **LINE company data (to 2024-11-30):** — [公視, 2024-12-17](https://news.pts.org.tw/article/729263)
  - 22M users in Taiwan, using it about 1 hour a day.
  - The wallet page (LINE Pay, Bank, Points) peaks at 12:00–14:00.
  - Photo and video sharing peaks at 8–9 a.m.
- **TWNIC (as cited by TechNews):** 92% of internet users use LINE as their main messaging app. — [TechNews, 2024-12-18](https://technews.tw/?p=1321003)
- **Nielsen 2024:** LINE weekly reach 92.1%; 87% say promotional messages from official accounts attract them; 81% say offers raise their intent to buy. — [NOWnews, 2024-11-27](https://www.nownews.com/news/6594885)
- **LINE GO user counts [PLATFORM DATA]:** about 4.8M users (CTO interview, January 2026); 4.85M cumulative users at end-2025; 4.95M by March 2026. — [TechNews, 2026-01-21](https://technews.tw/2026/01/21/exclusive-interview-with-line-go-cto-hayden-huang/); [GVM 城市學, 2026-01-31](https://city.gvm.com.tw/article/127951); [旺得富, 2026-03-24](https://wantrich.chinatimes.com/news/20260324900648-420101)
- **LINE GO 2025 mobility data:** — [GVM 城市學](https://city.gvm.com.tw/article/127951); [工商時報, 2026-01-14](https://www.ctee.com.tw/news/20260114700949-430503); [UAnalyze](https://uanalyze.com.tw/articles/5822545277)
  - Taichung HSR station was the single busiest pickup landmark in Taiwan.
  - Airport pickups averaged a 4-minute wait after collecting baggage.
  - Designated-driver demand peaked on Friday at 21:00 in Taichung's Xitun district.
  - Car rentals of under 1 hour grew 6-fold.
  - People aged 30–39 were the main users of low-carbon taxis.
  - About 40% of shared-scooter users also used other LINE GO services ("組合式移動").
  - LINE GO's summary: "移動樣態已從「特定情境」轉向「生活日常」".
- **LINE GO CTO interview:** — [TechNews, 2026-01-21](https://technews.tw/2026/01/21/exclusive-interview-with-line-go-cto-hayden-huang/)
  - Each city has its own dispatch model; Taichung riders will wait about 10 minutes, Taipei riders less.
  - LINE GO is testing agentic AI that links airport pickup, rental and other legs into one journey through MCP servers.
  - Family payment sharing and coupon sharing are planned.
- **Uber Taiwan [PLATFORM DATA]:**
  - 2025: the most frequent rider (in Tainan) took 2,000+ trips; Uber XL weekend use was about 30% higher than weekday use; Japan was the top overseas destination for Taiwanese Uber users. — [鏡週刊, 2025-12-22](https://www.mirrormedia.mg/story/20251222edi021)
  - Summer 2025 versus the year before: trips +21%, Uber Taxi +21.6%, 6-seat rides +10%. Uber covered all 19 cities and counties by July 2026. — [聯合報, 2026-07-28](https://udn.com/news/story/7266/9655533)
- **55688 (台灣大車隊) [PLATFORM DATA]:**
  - Q3 2021 "乘車大數據黃皮書", six special municipalities, in a report about anniversary-sale department-store trips: **women took 61% of rides**; 69% of rides were booked through the app; taxis leaving department stores outnumbered those arriving by 8 to 1. The report doesn't make clear whether the 61% and 69% cover all rides or only department-store trips. — [T客邦, 2021-11-03](https://www.techbang.com/posts/91135)
  - 2022: 6.5M users, about 80M rides a year, 24% of Taiwan's 90,190 taxis, and 70% of users book through the app. — [遠見 廣編, 2022-07-14](https://www.gvm.com.tw/article/91974)
- **Social-listening rankings:** see Q2 (DailyView 2022 and 2025; i-Buzz 2024).

### Inferences
- LINE's roughly 14 opens a day set the bar for a daily habit. A yoxi daily service could either reach users inside LINE (an official account, since 87% are drawn by official-account promotions), or offer something LINE GO does not. LINE GO already competes for the same daily-open slot with daily vouchers inside LINE.
- Platform data point to everyday ride occasions beyond a one-off trip need: shopping with bags, Friday nights out, the first and last mile to airports and HSR, and booking for elderly parents. Women may be the larger rider base (55688's 61% from 2021, but that figure may cover only department-store trips).

### Gaps
- No representative Taiwanese survey on ride-hailing penetration, frequency or loyalty.
- No Taiwanese data on how many apps people open daily, or attitudes to super-apps beyond LINE; the TWNIC report site could not be fetched.
- No figures on daily opens for mobility, map or weather apps in Taiwan.

---

## Q6. Demand spikes and hard-to-get-a-ride situations

### Takeaway
Rain is the most frequent and best-documented spike. It raises demand while shrinking effective supply: traffic slows trips, and drivers hit their daily targets early and avoid app orders. The results are hour-long waits, surge pricing, and even viral pricing glitches.

Large events (Taipei Dome crowds of about 40,000, New Year's Eve) are managed around the MRT and shuttles, and ride-hailing is often suspended in control zones. No taxi-specific data on these events was found.

### Cited Findings
**Rain and typhoons**
- **How often it rains, and why drivers vanish:** — [今周刊, 2022-01-13](https://www.businesstoday.com.tw/article/category/183027/post/202201130005/)
  - Taipei and New Taipei average **160–166 rainy days a year** (about 13–14 a month) over roughly 10 years; Yilan approaches 200.
  - Drivers say rain lets them hit daily targets early and stop: "下雨天，計程車司機容易提前賺到每天設定的營業目標". Congestion can make trips take one to two times longer.
  - The author claims app users will wait "最長可能只有6分鐘，最好是3分鐘以內". This is the author's assertion, not survey data.
- **Hsinchu heavy rain, 2026-06-26** (classes and work suspended from noon): — [NOWnews, 2026-06-26](https://www.nownews.com/news/6850655); [Newtalk, 2026-06-26](https://newtalk.tw/news/view/2026-06-26/1043554)
  - Users reported no cars available on Uber, 55688 or yoxi, and one waited more than an hour on a Friday evening.
  - A 2-km, 6-minute ride showed an estimate of NT$25,670–30,365, against a normal estimate of NT$135–160. The poster wrote "外面只是下雨，不是下恐龍耶".
  - The operator called it a system glitch that has been fixed. NOWnews attributes the statement "目前該問題已修復，如有遇到車資異常問題，可聯繫客服" to yoxi; Newtalk only says "業者". Which platform produced the estimate is unverified.
  - Uber's general statement: fares may rise temporarily when demand exceeds drivers.
- **Driver behaviour in Hsinchu:** according to insiders, many Hsinchu drivers avoid Uber and LINE GO because of roughly 20–25% commission, and work through local fleets or private booking groups instead. — [Newtalk, 2026-06-26](https://newtalk.tw/news/view/2026-06-26/1043554)
- **Uber surge levels:** "車資有可能會變成平常的 1.5 倍、2 倍甚至 3 倍". One user's example: NT$230 at 18:00 in heavy rain versus NT$145 at 20:10 after the rain stopped (anecdote). — [UpToGo, 2026-06-12](https://uptogo.com.tw/?p=1753152)
- **Surcharges in fare rules:**
  - yoxi's fare table adds NT$50 in Tainan, Kaohsiung and Pingtung on days when the whole city suspends work. The Taipei, New Taipei and Keelung night surcharge is NT$20 per trip (23:00–06:00). — [yoxi fare rules](https://www.yoxi.app/promotion/105)
  - A NT$50 typhoon or heavy-rain surcharge for Taipei, New Taipei and Keelung was proposed in December 2022, "考量每次遇到颱風，司機容易自行喊價". — [Taiwan News, 2022-12-14](https://www.taiwannews.com.tw/ch/news/4750596). It does not appear in yoxi's 2026 Taipei fare table, so whether it was adopted is unverified (conflicting).

**MRT disruption**
- The 文湖線 morning outage on 2025-07-29 made commuters late. Suggested alternatives were opening four ride-hailing apps at once, shared scooters, or bus plus YouBike. A driver noted that rain makes drivers prefer street hails to app orders: "下雨天容易塞車，大多不希望塞車在接單的路上". — [NOWnews, 2025-07-29](https://www.nownews.com/news/6712947)

**Events (Taipei Dome and others)**
- **CPBL championship game 1, 2024-10-19, Taipei Dome:** about 40,000 fans, with dangerous crowding in the MRT connecting passage. The mayor ordered Taipei Metro to review and to "超前部署". — [中央社, 2024-10-20](https://www.cna.com.tw/news/ahel/202410200026.aspx); [公視, 2024-10-20](https://news.pts.org.tw/article/720235)
- **Dome test game, 2023-11-18 (13,000 attendees):** the city estimated that more than 80% of attendees used public transport or walked ("觀賽民眾之公共運輸及步行使用率約達8成以上"). The dome has 969 car and 1,116 scooter parking spaces. — [遠見城市, 2023-11-19](https://city.gvm.com.tw/article/107706)
- **Asian Championship, 2023-12-03 (about 17,000 fans):** Taipei Metro expected 30–45 minutes to clear the crowd, and 6 free shuttle routes ran. — [Taiwan News, 2023-12-02](https://www.taiwannews.com.tw/zh/news/5051220)
- **New Year's Eve 2025/26:** — [聯合報, 2025-12-31](https://udn.com/news/story/7266/9237072); [NOWnews, 2025-12-28](https://www.nownews.com/news/6769503)
  - Uber, Foodpanda and Uber Eats suspended service in the Xinyi control zones from 18:00 until controls lifted at 03:00.
  - 蔡依林 played Taipei Dome concerts on 12/30, 12/31 and 1/1, with shuttles to Nanjing Sanmin station.
  - Rides were free on the MRT green line from two stations, and the MRT ran for 42 hours without stopping.
  - Private pickups used a temporary stopping zone (臨停區) on 光復南路.
- **yoxi's event tool:** "dynamic electronic fences" switch on at large events and hubs to guide passengers to legal pickup points (100+ locations). — [TVBS 車圈, 2026-07-14](https://cars.tvbs.com.tw/life/331958)

**Airports, HSR, late nights, shopping and groups**
- LINE GO: airport pickups average a 4-minute wait; Taichung HSR is the top pickup landmark; designated-driver demand peaks on Friday at 21:00. — [GVM 城市學, 2026-01-31](https://city.gvm.com.tw/article/127951)
- yoxi airport fees: +15% for Taoyuan airport dispatch, and +NT$50 at Kaohsiung airport from 2026-09-01. — [yoxi fare rules](https://www.yoxi.app/promotion/105)
- Department stores: taxis leaving outnumbered those arriving 8 to 1 (55688, Q3 2021). — [T客邦, 2021-11-03](https://www.techbang.com/posts/91135)
- Uber XL weekend use about 30% higher than weekdays (2025). — [鏡週刊, 2025-12-22](https://www.mirrormedia.mg/story/20251222edi021)

### Inferences
- Rain is a predictable, almost daily trigger: it falls on roughly 44% of days in Greater Taipei (160–166 of 365). That makes it a strong basis for a "rain radar → book before the spike" feature, especially for scooter riders, who make 43.7% of mode uses nationally. It also shifts demand to times when supply is easier to secure, which suits yoxi's reliable reservations.
- Event spikes are predictable from the calendar (Dome schedules, New Year's Eve), and ride-hailing near venues is often restricted or congested. An event companion could earn app opens in the days before an event, by advising when to leave, which exit or pickup fence to use, and whether to take the MRT out first and then a pre-booked car.
- Fare shocks (surges, viral glitches) damage trust exactly when users need a ride most. Proactive fare forecasts and a "price-lock if you book now" option could become both a reason to engage and a way to convert.

### Gaps
- No platform published quantified demand multipliers for rain, typhoons or events.
- No data on taxi waits after events at Taipei Dome, 小巨蛋, or Kaohsiung's World Games Stadium and Arena (高雄世運/巨蛋).
- No platform data on demand around school pick-up times, typhoon-day ride volumes, or hospital-visit peaks.

---

## Q7. Everyday city-life mobility pain points: parking, weather, seniors, children, business trips and safety

### Takeaway
Official survey data quantify several recurring frictions:
- Parking: 31.6% of scooter and car commuters must search for parking at work, about 7.2 minutes on average.
- Family driving: 20% of car trips are picking up or dropping off family members.
- Ageing: people 65+ are more than 20% of the population, and yoxi says 40% of its older users find app booking hard.
- Most private-vehicle users already combine modes.

Each of these is a daily hook for a mobility companion that is not tied to a single taxi trip.

### Cited Findings
- **Purposes and use, 113年 scooter and car usage survey** (2024 data, surveyed May–July 2025, published November 2025): — [MOTC 113年機車及自用小客車使用狀況調查](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1446329030327406592&type=s&id=56&serno=202511270000&title=1141205公布版_113年機車及自用小客車使用狀況調查報告.pdf)
  - Scooter purposes: commuting or school 58.4%, shopping 21.6%, leisure 8.0%, picking up or dropping off family 7.9%, business 3.5%.
  - Car purposes: commuting or school 43.3%, leisure 20.4%, **picking up or dropping off family 20.0%**, business 8.5%, shopping 6.7%.
  - Scooters are used 4.8 days a week for 46.6 minutes on days used. Cars are used 3.9 days a week for 1.8 hours on days used, and a car commute averages 1.3 hours and 35.7 km.
- **Parking (same survey):**
  - At home, 14.5% must search for parking, averaging 9.1 minutes (10.4 minutes in northern Taiwan).
  - At work or school, **31.6% must search, averaging 7.2 minutes** (7.8 minutes in the north), and 28.4% pay for parking (37.4% in the north).
  - Results are reported by region, not by city.
- **Costs (same survey):** cars average NT$84,317 a year in variable costs, of which fuel or charging is NT$36,543. Scooters average NT$8,610.
- **Combining modes (same survey):**
  - 72.0% of scooter users also use other modes, mainly cars (66.8%) and public transport (49.5%).
  - 82.1% of car users also use other modes, mainly scooters (83.9%) and public transport (37.3%).
  - Taxis are counted inside public transport.
  - NOWnews (2026-05-21) gives 70.1% and 81.0% from the "same" survey series. These are probably from an earlier edition; the discrepancy is unresolved. — [NOWnews](https://www.nownews.com/news/6838607)
- **Older drivers and riders (same survey):** 13.4% of scooter users are 65+ (7.5% are 70+), and 13.9% of car drivers are 65+. Riders 70+ use scooters mainly for shopping (55.9%).
- **Seniors and the app:** 40% of older yoxi users find app booking troublesome; requests for wheelchair or boarding help doubled in 2025; people 65+ exceed 20% of the population. — [工商時報, 2026-09-11](https://www.ctee.com.tw/news/20260911700013-431207); [T客邦, 2026-04-28](https://www.techbang.com/posts/129049-yoxi-ai-address-recognition-for-seniors). Trip purposes for 65+ are in Q4.
- **Booking for others is growing:** — [旺得富, 2026-03-24](https://wantrich.chinatimes.com/news/20260324900648-420101)
  - Use of LINE GO's "幫人叫車" has grown about 3.5% a month on average since it launched in 2025.
  - Main uses: "年輕族群協助長輩叫車、商務聚餐接送及朋友聚會後返程安排".
  - Passengers who are not LINE GO users still receive the driver, plate and car location by LINE message.
  - One account can now manage up to 5 trips in progress, aimed at families and social outings ("社群化移動").
- **Children:** a 55688 user books school rides for her daughter and tracks the route. — [TVBS/DailyView, 2025-07](https://news.tvbs.com.tw/ttalk/2929639)
- **Business expenses:**
  - yoxi offers trip export and corporate e-billing with monthly statements. — [mybest](https://tw.my-best.com/116064)
  - Corporate billing cannot use coupons. — [kikinote](https://kikinote.net/160985)
  - Cancellation fees cannot be charged to the corporate account. — [yoxi FAQ](https://www.yoxi.app/faq)
  - LINE GO opened self-service corporate sign-up with monthly billing for small and mid-sized businesses in late 2025. — [TechNews, 2026-01-21](https://technews.tw/2026/01/21/exclusive-interview-with-line-go-cto-hayden-huang/)
- **Safety:**
  - Only 4.5% of taxi drivers are women, and the average driver is 53.6. — [MOTC 112年計程車營運狀況調查](https://www.motc.gov.tw/ch/app/data/doc?module=survey&detailNo=1301088644538306560&type=s&id=56&serno=202410300001)
  - 55688 offers a female-driver service, described as "女性福音". — [Roo.cash](https://roo.cash/blog/taxi-comparison)
  - yoxi has SMS emergency reporting; LINE GO sends emergency contacts SMS trip tracking. — [TVBS/DailyView, 2025-07](https://news.tvbs.com.tw/ttalk/2929639)
  - yoxi reviewers ask for remote monitoring of route deviation (Q1).
- **Street-taxi annoyances [ANECDOTE]:** Uber fans complain of smoke odour, betel nut and abrupt braking in street-hailed taxis. — [UpToGo, 2026-07-07](https://uptogo.com.tw/汽機車/哪個計程車隊比較好ptt？/)
- **Avoiding parking:** taxi round trips to department stores are partly about avoiding the hassle of driving and parking; the article says this was most common in Taipei but gives no percentage. — [T客邦, 2021-11-03](https://www.techbang.com/posts/91135)

### Inferences
- **Parking** is a daily, recurring pain for about a third of motor-vehicle commuters at work. A companion that predicts parking difficulty at a user's frequent destinations, and suggests leaving the car and taking a ride on hard days, could convert some of these trips.
- **Family logistics** (20% of car trips; booking for others growing about 3.5% a month at LINE GO) suggest a "family mobility hub": recurring school and clinic runs, booking and tracking for parents and children, and alerts to the person who booked. That person, often an adult child or caregiver, is then the one opening the app daily.
- **Seniors** make many leisure, shopping and family trips, and 40% struggle with app booking. Caregivers, including Indonesian-speaking migrant caregivers, are likely the actual app users for many of these trips.
- **Scooter riders** are 43.7% of mode uses and are exposed to rain and heat. Combined with about 44% rainy days in the north, prompts to switch to a ride on rainy days are a natural conversion path. (There is no direct survey on this; see Gaps.)
- **Combining modes** is normal (72–82% of private-vehicle users). A companion that spans modes (MRT disruptions, YouBike, parking, taxi) fits real behaviour better than a taxi-only app.

### Gaps
- No Taiwanese survey found on switching from scooter to taxi on rainy days.
- No city-level parking-search data (regions only).
- No data on how children get to school.
- No survey on women's sense of safety in taxis at night.
- No data on business-travel expense pain points.
- The reasons for choosing a car or scooter (appendix table A27 in the MOTC report) were not in the extracted text.

---

## Q8. Taiwanese evidence on what users want from ride-hailing and mobility apps

### Takeaway
Users ask mainly for:
- reliability: accurate arrival times and no driver cancellations
- fare predictability: upfront fares and no shock surges
- safety: trip sharing, route-deviation alerts and female drivers
- comfort: clean cars and no-chat options
- low-friction booking for less tech-savvy users

The market is moving toward agentic AI (LINE GO), social and multi-person trips, and offline or assisted booking. Nothing suggests users currently expect, or are offered, a reason to open a ride-hailing app daily without a trip.

### Cited Findings
- **Reliability and safety requests in yoxi reviews:** accurate arrival estimates, no unilateral cancellation of reservations, and remote monitoring of route deviation. — [App Store TW, yoxi](https://apps.apple.com/tw/app/id1521393667)
- **Fare predictability:** Uber is praised because "計價不用擔心繞路多收費". — [Roo.cash](https://roo.cash/blog/taxi-comparison). Users also want to see the fare and route upfront and avoid dynamic surges. — [UpToGo, 2026-07-07](https://uptogo.com.tw/汽機車/哪個計程車隊比較好ptt？/)
- **Comfort and privacy:** Uber's "不用跟司機講話" is a selling point. — [UpToGo](https://uptogo.com.tw/汽機車/哪個計程車隊比較好ptt？/). yoxi and 55688 both offer no-chat and no-music preferences. — [App Store TW, yoxi](https://apps.apple.com/tw/app/id1521393667); [TVBS/DailyView](https://news.tvbs.com.tw/ttalk/2929639). Driver quality and clean cars dominate online discussion. — [i-Buzz/The News Lens, 2024-04-07](https://www.thenewslens.com/article/200347)
- **Discounts and daily rewards:** discounts are the topic that draws most attention. — [i-Buzz](https://www.thenewslens.com/article/200347). LINE TAXI's daily vouchers and monthly pass are cited as reasons to use it. — [Roo.cash](https://roo.cash/blog/taxi-comparison)
- **Easier booking for seniors and non-Chinese speakers:**
  - yoxi's AI house-number recognition was used 50,000+ times in 4 months. — [TVBS 車圈, 2026-07-14](https://cars.tvbs.com.tw/life/331958)
  - yoxi added 7-ELEVEN ibon kiosk booking in 8 languages. — [工商時報, 2026-09-11](https://www.ctee.com.tw/news/20260911700013-431207)
  - yoxi added an accessible-entrance search. — [T客邦, 2026-04-28](https://www.techbang.com/posts/129049-yoxi-ai-address-recognition-for-seniors)
- **Booking for others and multi-person trips:** LINE GO's booking-for-others feature (+3.5% a month) and up to 5 simultaneous trips. — [旺得富, 2026-03-24](https://wantrich.chinatimes.com/news/20260324900648-420101)
- **Openness to AI:** about 80% of LINE users welcome LINE combining AI with its services (Nielsen 2025). — [旺得富, 2025-11-25](https://wantrich.chinatimes.com/news/20251125900301-420501)
- **Competitors' AI direction:** LINE GO uses ML dispatch tuned to each city's tolerance for waiting, and is testing agentic AI that plans a whole journey (for example, airport pickup plus rental with one-way return) and suggests pickup and drop-off addresses. — [TechNews, 2026-01-21](https://technews.tw/2026/01/21/exclusive-interview-with-line-go-cto-hayden-huang/)
- **Driver-side feature requests:** louder notifications and CarPlay support, and messaging after the passenger boards. — [App Store TW, yoxi司機](https://apps.apple.com/tw/app/id1521393549)

### Inferences
- The highest-value AI functions for a daily companion map directly onto expressed needs:
  - forecasting arrival times and fares, with "book now / leave later" advice
  - proactive rain and disruption alerts, with one-tap pre-booking
  - safety (trip sharing and anomaly alerts for family members)
  - a caregiver mode for booking on behalf of seniors
- These should build on data yoxi already has: saved frequent routes, ride preferences and points.
- Because LINE GO is pushing agentic journey planning and social trips inside the app people open 14 times a day, yoxi's daily hook probably needs a distinct, personal angle. Examples are habits built around frequent places and times, family logistics, and rewards from the Hotai ecosystem, rather than generic vouchers.

### Gaps
- No Taiwanese survey that ranks desired ride-hailing features or measures willingness to use AI mobility assistants, specifically for transport.
- No user research on whether people would open a mobility app daily for content that isn't a ride (weather, commute, parking, events).
- The review evidence is anecdotal; no YouTube or Facebook-group content was reachable.
