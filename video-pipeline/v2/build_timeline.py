#!/usr/bin/env python3
"""Lay the narration clips out on a timeline and mix the audio.
   ~/Projects/finances/.venv/bin/python3 build_timeline.py video1
Writes out/<video>/timeline.json (clip + scene times, mouth-level envelopes) and out/<video>/mix.wav
(narration + jingle + synthesised sound effects). The page (engine.html) draws every frame from timeline.json."""
import json, sys, subprocess, wave, pathlib, math
import numpy as np
HERE = pathlib.Path(__file__).parent
name = sys.argv[1]; script = json.load(open(HERE / f'script_{name}.json'))
OUT = HERE / 'out' / name; OUT.mkdir(parents=True, exist_ok=True)
SR = 44100; FPS = 30

def load(path, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

clips = {}
for c in script['shared']: clips[c['id']] = {**c, 'path': HERE / 'audio' / 'shared' / f"{c['id']}.mp3"}
for c in script['clips']: clips[c['id']] = {**c, 'path': HERE / 'audio' / name / f"{c['id']}.mp3"}
for c in clips.values():
    c['wave'] = load(c['path']); c['dur'] = len(c['wave']) / SR


WHISPER = '/opt/homebrew/bin/whisper-cli'; WMODEL = pathlib.Path.home() / 'Projects/voice-journal/models/ggml-small.en.bin'
def words_of(path):
    cache = path.with_suffix('.words.json')
    if cache.exists() and cache.stat().st_mtime >= path.stat().st_mtime: return json.load(open(cache))
    import tempfile, re
    with tempfile.TemporaryDirectory() as t:
        wav = pathlib.Path(t) / 'a.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-af', 'adelay=500|500,apad=pad_dur=1', '-ar', '16000', '-ac', '1', str(wav)], check=True)
        subprocess.run([WHISPER, '-m', str(WMODEL), '-f', str(wav), '-ml', '1', '-sow', '-ojf', '-of', str(pathlib.Path(t) / 'o'), '-np'], capture_output=True)
        d = json.load(open(pathlib.Path(t) / 'o.json'))
    out = []
    for seg in d['transcription']:
        w = re.sub(r'[^a-z]', '', seg['text'].lower())
        if w: out.append([w, round(max(0, seg['offsets']['from'] / 1000 - 0.5), 3), round(max(0, seg['offsets']['to'] / 1000 - 0.5), 3)])
    json.dump(out, open(cache, 'w')); return out
for c in clips.values(): c['words'] = words_of(c['path'])
def W(cid, word, nth=0):
    """absolute time (s) the nth spoken word starting with `word` begins in clip cid; falls back to just after the clip starts"""
    hits = [w for w in clips[cid]['words'] if w[0].startswith(word)]
    return clips[cid]['start'] + (hits[nth][1] if len(hits) > nth else 0.4)

# scene layout: (scene id, [clip ids], lead-in, gap rules, tail)
SCENES = [
 ('opener', ['opener'], 0.8, 0.0, 0.8),
 ('hook',   ['hook'], 0.4, 0.0, 0.5),
 ('today',  ['today'], 0.4, 0.0, 0.5),
 ('stave',  ['five', 'count', 'n1', 'n2', 'n3', 'n4', 'n5', 'stave'], 0.4, 0.4, 0.5),
 ('clef',   ['clef1', 'clef2'], 0.4, 0.4, 0.5),
 ('bass',   ['bass'], 0.4, 0.0, 0.5),
 ('note',   ['note'], 0.4, 0.0, 0.6),
 ('linespace', ['line', 'space'], 0.4, 0.35, 0.5),
 ('ledger', ['high', 'ledger'], 0.4, 0.5, 0.6),
 ('recap',  ['again', 'r1', 'r2', 'r3', 'r4', 'r5', 'well'], 0.4, 0.3, 0.7),
 ('outro',  ['game1', 'game2', 'bye'], 0.6, 0.4, 3.4),
]
GAP_OVERRIDE = {'n1': 0.35, 'n2': 0.3, 'n3': 0.3, 'n4': 0.3, 'n5': 0.3, 'stave': 0.5}
t = 0.0; scenes = []
for sid, ids, lead, gap, tail in SCENES:
    s0 = t; cur = s0 + lead
    for i, cid in enumerate(ids):
        g = GAP_OVERRIDE.get(cid, gap) if i else 0
        cur += g; clips[cid]['start'] = cur; cur += clips[cid]['dur']; clips[cid]['end'] = cur
    t = cur + tail; scenes.append({'id': sid, 'start': s0, 'end': t, 'clips': ids})
DURATION = t

total = int(DURATION * SR) + SR
mix = np.zeros(total, dtype=np.float32)
def put(buf, start, sig, gain=1.0):
    i = int(start * SR); n = min(len(sig), len(buf) - i)
    if n > 0: buf[i:i + n] += sig[:n] * gain
for cid, c in clips.items(): put(mix, c['start'], c['wave'], 1.0)

# --- sound effects (synthesised: no licensing) ---
def env(n, a=0.005, d=0.3):
    x = np.arange(n) / SR; return np.minimum(x / a, 1) * np.exp(-x / d)
def tone(f, dur=0.9, vol=0.22):
    n = int(dur * SR); x = np.arange(n) / SR
    s = np.sin(2 * math.pi * f * x) + 0.4 * np.sin(2 * math.pi * 2 * f * x) + 0.15 * np.sin(2 * math.pi * 3 * f * x)
    return (s * env(n, 0.01, 0.35) * vol).astype(np.float32)
def pop(vol=0.25):
    n = int(0.12 * SR); x = np.arange(n) / SR; f = 700 - 3000 * x
    return (np.sin(2 * math.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04) * vol).astype(np.float32)
def tick(vol=0.3):
    n = int(0.08 * SR); x = np.arange(n) / SR
    return (np.sin(2 * math.pi * 1250 * x) * env(n, 0.001, 0.02) * vol).astype(np.float32)
def whoosh(vol=0.12):
    n = int(0.35 * SR); rng = np.random.default_rng(3); z = rng.standard_normal(n)
    k = np.ones(40) / 40; z = np.convolve(z, k, 'same'); w = np.sin(np.linspace(0, math.pi, n)) ** 2
    return (z * w * vol * 3).astype(np.float32)
def sparkle(vol=0.18):
    out = np.zeros(int(0.9 * SR), dtype=np.float32)
    for i, f in enumerate([1046, 1318, 1568, 2093]): put(out, i * 0.07, tone(f, 0.5, vol), 1)
    return out
FREQ = {'g4': 392.0, 'b4': 493.9, 'c5': 523.3, 'a5': 880.0}
events = []   # also written to timeline.json so the page can sync visuals if wanted
def ev(kind, at, **kw): events.append({'kind': kind, 'at': round(at, 3), **kw})
for s in scenes[1:-0]: ev('whoosh', s['start'] + 0.2)
for k in ['n1', 'n2', 'n3', 'n4', 'n5']: ev('tick', clips[k]['start'])
ev('pop', W('clef1','swirly') - 0.05); ev('pop', clips['bass']['start'] + 0.15)
ev('pop', W('note','blob') - 0.1); ev('tone', W('note','blob'), f='b4')
ev('pop', clips['line']['start'] + 0.1); ev('tone', clips['line']['start'] + 0.2, f='g4')
ev('pop', clips['space']['start'] + 0.1); ev('tone', clips['space']['start'] + 0.2, f='c5')
ev('pop', clips['high']['start'] + 0.3); ev('tone', clips['high']['start'] + 0.4, f='a5')
ev('pop', W('ledger','extra') - 0.1)
for k in ['r1', 'r2', 'r3', 'r4', 'r5']: ev('pop', clips[k]['start'] - 0.05)
ev('sparkle', clips['well']['start'])
for e in events:
    k = e['kind']
    sig = {'whoosh': whoosh, 'tick': tick, 'pop': pop, 'sparkle': sparkle}.get(k, lambda: tone(FREQ.get(e.get('f'), 440)))()
    put(mix, e['at'], sig, 1.0)

# --- the jingle: Andrew's own track, trimmed and faded, same every video (opening and closing) ---
jingle = load(HERE / 'audio' / 'shared' / 'jingle.mp3')
def faded(sig, secs, fin=0.05, fout=1.0, gain=0.5):
    s = sig[:int(secs * SR)].copy(); n = len(s)
    s *= np.minimum(np.arange(n) / (fin * SR), 1); s *= np.minimum((n - np.arange(n)) / (fout * SR), 1); return s * gain
put(mix, 0.0, faded(jingle, scenes[0]['end'] + 0.4, fout=1.2, gain=0.55))
o = scenes[-1]; put(mix, o['start'] + 0.1, faded(jingle, o['end'] - o['start'] - 0.1, fout=1.6, gain=0.4))

mix = mix[:int(DURATION * SR)]
peak = np.abs(mix).max(); mix = mix / peak * 0.89 if peak > 0.89 else mix
with wave.open(str(OUT / 'mix.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())

# --- mouth levels per frame for each clip (smoothed 0..1) ---
def levels(sig):
    h = SR // FPS; n = len(sig) // h
    r = np.array([np.sqrt(np.mean(sig[i * h:(i + 1) * h] ** 2)) for i in range(n)])
    r = r / (np.percentile(r, 92) + 1e-9); r = np.clip(r, 0, 1)
    return np.convolve(r, [0.25, 0.5, 0.25], 'same')
out = {'fps': FPS, 'duration': round(DURATION, 3), 'scenes': scenes, 'events': events, 'game': script['game'], 'gameFile': script['gameFile'], 'title': script['title'], 'nugget': script['nugget'],
       'clips': {cid: {'who': c['who'], 'text': c.get('show', c['text']), 'words': c['words'], 'start': round(c['start'], 3), 'end': round(c['end'], 3), 'env': [round(float(v), 2) for v in levels(c['wave'])]} for cid, c in clips.items()}}
json.dump(out, open(OUT / 'timeline.json', 'w'))
print(f"duration {DURATION:.1f}s; scenes:", ', '.join(f"{s['id']} {s['start']:.1f}-{s['end']:.1f}" for s in scenes))
