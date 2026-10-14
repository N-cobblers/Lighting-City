"""第二版混音：配音（旁白＋小精靈）、配樂（旁白出現時自動壓低）、音效（程式合成）。
用法：python scripts/video/mix.py [配樂.mp3] [out.m4a]
配樂預設是 Kevin MacLeod〈Funshine〉（FreePD，CC0），沒有就從 Internet Archive 下載。"""
import json
import subprocess
import sys
from pathlib import Path

from paths import OUT

MUSIC = OUT / 'music' / 'Funshine.mp3'
MUSIC_URLS = ['https://archive.org/download/freepd/upbeat/Funshine.mp3', 'https://ia801509.us.archive.org/18/items/freepd/upbeat/Funshine.mp3']
SFXDIR = OUT / 'sfx'
SFXDIR.mkdir(parents=True, exist_ok=True)

# 名稱: (aevalsrc 公式, 長度秒, 額外濾鏡, 音量)
SFX = {
    'flash': ("0.22*sin(2*PI*(260*t+700*t*t))*exp(-2.2*t)+0.12*sin(2*PI*(520*t+1400*t*t))*exp(-2.6*t)", 1.0, '', 0.8),
    'pop': ("0.55*sin(2*PI*(420*t+2400*t*t))*exp(-16*t)", 0.28, '', 0.7),
    'boing': ("0.45*sin(2*PI*(180*t+520*t*t))*exp(-4.5*t)*(1+0.45*sin(2*PI*13*t))", 0.65, 'lowpass=f=3000', 0.55),
    'impact': ("0.95*sin(2*PI*52*t)*exp(-3.6*t)+0.5*sin(2*PI*104*t)*exp(-6*t)+0.3*(random(1)*2-1)*exp(-22*t)", 1.4, 'lowpass=f=2400', 0.95),
    'whoosh': ("(random(2)*2-1)*0.5*sin(PI*t/0.5)*sin(PI*t/0.5)", 0.5, 'highpass=f=700,lowpass=f=6000', 0.45),
    'zoom': ("(random(3)*2-1)*0.4*sin(PI*t/0.6)*sin(PI*t/0.6)+0.08*sin(2*PI*(300*t+500*t*t))*sin(PI*t/0.6)", 0.6, 'highpass=f=400,lowpass=f=5000', 0.4),
    'tick': ("0.28*sin(2*PI*2400*t)*exp(-70*mod(t,0.075))*lt(t,0.85)", 0.95, '', 0.5),
    'ding': ("0.32*sin(2*PI*1318.5*t)*exp(-5*t)+0.18*sin(2*PI*1975.5*t)*exp(-6*t)", 1.2, '', 0.75),
    'shutter': ("(random(0)*2-1)*0.55*(exp(-70*t)+0.8*exp(-70*abs(t-0.07))*gte(t,0.07))", 0.35, '', 0.7),
    'sparkle': ("0.16*(sin(2*PI*1567.98*t)*exp(-7*t)+gte(t,0.07)*sin(2*PI*2093*(t-0.07))*exp(-7*(t-0.07))+gte(t,0.14)*sin(2*PI*2637*(t-0.14))*exp(-6*(t-0.14)))", 1.0, '', 0.8),
    'chime': ("0.2*(sin(2*PI*1046.5*t)*exp(-3.5*t)+gte(t,0.12)*sin(2*PI*1318.5*(t-0.12))*exp(-3.5*(t-0.12))+gte(t,0.24)*sin(2*PI*1568*(t-0.24))*exp(-3*(t-0.24)))", 1.4, '', 0.85),
    'cheer': ("0.17*(sin(2*PI*1046.5*t)*exp(-4*t)+gte(t,0.09)*sin(2*PI*1318.5*(t-0.09))*exp(-4*(t-0.09))+gte(t,0.18)*sin(2*PI*1568*(t-0.18))*exp(-4*(t-0.18))+gte(t,0.27)*sin(2*PI*2093*(t-0.27))*exp(-4*(t-0.27)))", 1.3, '', 0.75),
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        print(r.stderr[-2500:])
        raise SystemExit('ffmpeg failed')


def get_music():
    if MUSIC.exists():
        return MUSIC
    import urllib.request
    MUSIC.parent.mkdir(parents=True, exist_ok=True)
    for url in MUSIC_URLS:
        try:
            urllib.request.urlretrieve(url, MUSIC)
            subprocess.run(['ffprobe', '-v', 'error', str(MUSIC)], check=True)
            return MUSIC
        except Exception as e:
            print('下載配樂失敗：', url, e)
    raise SystemExit('請手動下載 Funshine.mp3 放到 ' + str(MUSIC))


def main():
    music = sys.argv[1] if len(sys.argv) > 1 else str(get_music())
    out = sys.argv[2] if len(sys.argv) > 2 else str(OUT / 'audio.m4a')
    cfg = json.loads((OUT / 'sfx.json').read_text(encoding='utf-8'))
    total = cfg['total']
    for name, (expr, d, flt, _) in SFX.items():
        af = ['-af', flt] if flt else []
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f"aevalsrc='{expr}':s=48000:d={d}", *af, '-ac', '2', str(SFXDIR / f'{name}.wav')])
    args = ['ffmpeg', '-v', 'error', '-y']
    fc, voices = [], []
    n = 0
    for v in cfg['voice']:
        args += ['-i', v['file']]
        ms = int(v['t'] * 1000)
        fc.append(f'[{n}:a]aresample=48000,aformat=channel_layouts=stereo,volume={1.0 if v["who"] == "narr" else 1.05},adelay={ms}|{ms}[v{n}]')
        voices.append(f'[v{n}]')
        n += 1
    fc.append(f'{"".join(voices)}amix=inputs={len(voices)}:normalize=0,apad=whole_dur={total:.3f},asplit=2[voice][sc]')
    args += ['-i', music]
    fc.append(f'[{n}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},asetpts=PTS-STARTPTS,volume=0.30,'
              f'afade=t=in:st=0.3:d=1.2,afade=t=out:st={total - 2.6:.3f}:d=2.6[mus]')
    fc.append('[mus][sc]sidechaincompress=threshold=0.025:ratio=7:attack=15:release=380[mduck]')
    n += 1
    fx = []
    for j, (t, name) in enumerate(cfg['sfx']):
        if name not in SFX:
            continue
        args += ['-i', str(SFXDIR / f'{name}.wav')]
        ms = int(max(0, t) * 1000)
        fc.append(f'[{n}:a]volume={SFX[name][3]},adelay={ms}|{ms}[f{j}]')
        fx.append(f'[f{j}]')
        n += 1
    mix = ['[voice]', '[mduck]'] + fx
    fc.append(f'{"".join(mix)}amix=inputs={len(mix)}:normalize=0,atrim=0:{total:.3f},loudnorm=I=-14:TP=-1.5:LRA=11[aout]')
    args += ['-filter_complex', ';'.join(fc), '-map', '[aout]', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', out]
    run(args)
    print('audio ->', out)


main()
