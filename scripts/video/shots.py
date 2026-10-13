"""分鏡：每個場景用哪段錄影、右側重點、題目標籤。時間都以旁白句子為準（timeline.py）。
clip = (來源, 起點 marker, 起點偏移秒, 終點 marker, 終點偏移秒, 速度)；速度 None = 自動配合長度（最慢 0.75 倍，不夠就停在最後一格）。"""

# 右側重點：time 小標、title 大標、body 內文、stats 大數字、list 項目、chips 標籤、note 註腳
P = {
    5: dict(time='早上 08:30', title='小涵・信義區上班族', body='地圖上亮著的，<br>是她這個月走過、搭過的路', note='人物為虛構；足跡只存在手機', tag='長期動機'),
    6: dict(time='早上 08:30', title='今晚 18 點比較難叫', body='晚一個小時，<em>好叫很多</em>', note='小精靈用 LightGBM 等車預測（示範資料）', tag='實用・個人化'),
    7: dict(time='早上 08:30', title='選「晚點走」', body='<em>19:00</em> 從市府回家，<br>排進今天的任務', note='不發優惠券：錯峰的路線會亮兩階', tag='實用'),
    8: dict(time='早上 08:30', title='每個人的城市都不一樣', list=['阿哲・板橋通勤族', '小雅・淡水週末旅遊者'], body='AI 依常去的地方和時段安排任務', note='人物皆為虛構', tag='個人化'),
    9: dict(time='午休 12:30', title='不搭車，也能點亮', body='散步到四四南村，<br>按下「我到了」', note='每天至少一個不用搭車的任務', tag='不搭車也打開'),
    10: dict(time='路上 15:00', title='拍 yoxi 車，<br>召喚車燈小精靈', body='每台 yoxi 車都住著一隻小精靈', note='示範車牌 TDX-3963 為虛構', tag='趣味・yoxi 特色'),
    11: dict(time='路上 15:00', title='車牌在手機上辨識', body='照片不上傳。<br>加總最接近今日幸運數字 <em>21</em>，<br>就是好友排行第一', tag='趣味・好友'),
    12: dict(time='傍晚 18:05', title='錯峰回家，路線亮兩階', stats=[('20 格', '錯峰之光'), ('1 點', '和泰 Points')], note='每趟最多 2 點・每月上限 20 點', tag='長期動機・商業轉換'),
    13: dict(time='傍晚 18:05', title='晚一小時，等車少很多', stats=[('25%', '18 點等超過 10 分鐘'), ('11%', '19 點等超過 10 分鐘')], note='信義區平日・yoxi 競賽資料 2026/2–4 彙總', tag='資料應用'),
    14: dict(time='AI ①', title='等車預測 LightGBM', stats=[('−8%', '逐時等車誤差'), ('−16%', '熱門上車點')], note='4 週滾動回測；對照組：近 4 週同時段中位數', tag='AI 整合'),
    15: dict(time='AI ②', title='小精靈會自己用工具', body='Gemini function calling<br>查預報、排錯峰，<em>排之前先問你</em>', note='影片中為示範資料', tag='AI 整合'),
    16: dict(time='AI ③', title='車牌辨識在手機上', stats=[('0.2 秒', 'PP-OCRv4・ONNX Runtime Web')], body='照片不上傳', tag='AI 整合・隱私'),
    17: dict(time='技術架構', title='原型：手機網頁，已經能用', chips=['React', 'MapLibre', 'H3', 'Firebase', 'Gemini', 'LightGBM', 'ONNX Runtime'], body='正式版：<em>Flutter</em>，做進 yoxi App', tag='技術架構'),
    18: dict(time='商業模式', title='不發優惠券，用光讓人錯峰', stats=[('NT$0.6', '一趟錯峰的 Points 成本'), ('NT$26.6', '一趟派遣費')], note='試算：一趟約 12 格 ÷ 20 格／點 × NT$1；派遣費 NT$266 × 10%', tag='商業轉換'),
    19: dict(time='成效驗證', title='北極星：非搭車日開啟率', list=['只有光', '光＋Points', '都沒有'], body='錯峰點燈用三組對照驗證', note='先在雙北一個行政區試辦', tag='成效驗證'),
}

# 場景：lines = 涵蓋的旁白句；phase = 背景配色；clips = 錄影片段
SCENES = [
    dict(id='opening', kind='scene', lines=[1, 2, 3, 4]),
    dict(id='morning', kind='phone', lines=[5, 6, 7], phase='dawn', clips=[('story', 'morning_map', -1.3, 'later_card', 3.6, None)]),
    dict(id='personas', kind='phone', lines=[8], phase='dawn', clips=[('story', 'persona_阿哲', -0.7, 'persona_阿哲', 4.6, 1.0), ('story', 'persona_小雅', -0.7, 'persona_小雅', 4.4, 1.0)]),
    dict(id='noon', kind='phone', lines=[9], phase='day', clips=[('story', 'noon', -1.2, 'walk_done', 4.8, None)], sfx=[('ding', 'story', 'walk_done', 0.7)]),
    dict(id='scan', kind='phone', lines=[10, 11], phase='dusk', clips=[('story', 'afternoon', 0.4, 'friends', 4.4, None)], sfx=[('shutter', 'story', 'scan_shot', 0.0), ('sparkle', 'story', 'scan_shot', 0.9)]),
    dict(id='evening', kind='phone', lines=[12, 13], phase='night', clips=[('story', 'ride_start', -2.0, 'points', 0.3, 1.45), ('story', 'points', 0.3, 'ride_end', 0.0, 1.0)], sfx=[('chime', 'story', 'points', 0.1)]),
    dict(id='model', kind='phone', lines=[14], phase='night', clips=[('story', 'ops', 0.3, 'offpeak_card', -0.2, None)]),
    dict(id='tools', kind='phone', lines=[15], phase='dawn', clips=[('chat', 'ask_forecast', -0.4, 'confirm', 3.0, None)]),
    dict(id='ocr', kind='phone', lines=[16], phase='dusk', clips=[('story', 'scan_ready', -0.3, 'scan_ready', 5.0, None)]),
    dict(id='stack', kind='phone', lines=[17], phase='night', clips=[('story', 'points', 1.0, 'ride_end', 0.0, None)]),
    dict(id='biz', kind='phone', lines=[18, 19], phase='night', clips=[('story', 'offpeak_card', -0.3, 'end', 0.0, 1.0)]),
    dict(id='ending', kind='scene', lines=[20]),
]
