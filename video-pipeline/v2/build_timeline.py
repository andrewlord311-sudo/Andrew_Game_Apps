#!/usr/bin/env python3
"""Lay the narration clips out on a timeline and mix the audio.
   ~/Projects/finances/.venv/bin/python3 build_timeline.py video1
Writes out/<video>/timeline.json (clip + scene times, mouth-level envelopes) and out/<video>/mix.wav
(narration + jingle + synthesised sound effects). The page (engine.html) draws every frame from timeline.json."""
import json, sys, subprocess, wave, pathlib, math
import numpy as np
HERE = pathlib.Path(__file__).parent
name = sys.argv[1]; DRY = '--dry' in sys.argv; script = json.load(open(HERE / f'script_{name}.json'))
OUT = HERE / 'out' / name; OUT.mkdir(parents=True, exist_ok=True)
SR = 44100; FPS = 30

def load(path, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

clips = {}
for c in script['shared']: clips[c['id']] = {**c, 'path': HERE / 'audio' / 'shared' / f"{c['id']}.mp3"}
# a clip with "src" reuses another clip's recording (e.g. the same spoken letter in the ride up, the ride down and the quiz)
for c in script['clips']: clips[c['id']] = {**c, 'path': HERE / 'audio' / name / f"{c.get('src', c['id'])}.mp3"}
missing = [k for k, c in clips.items() if not c['path'].exists()]
if missing and not DRY: sys.exit('no audio yet for: ' + ', '.join(missing) + '\n(run gen_audio.py when the script is final, or use --dry for a free silent preview)')
for c in clips.values():
    if c['path'].exists(): c['wave'] = load(c['path']); c['dur'] = len(c['wave']) / SR; c['est'] = False
    else:   # --dry: no audio spent yet, so estimate how long the line will take
        c['dur'] = 0.45 + 0.062 * len(c.get('show', c['text'])); c['wave'] = np.zeros(int(c['dur'] * SR), dtype=np.float32); c['est'] = True


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
def est_words(c):
    import re
    ws = [re.sub(r'[^a-z]', '', w.lower()) for w in c['text'].split()]; ws = [w for w in ws if w]
    tot = sum(len(w) + 1.5 for w in ws); t = 0.08; out = []
    for w in ws:
        d = (len(w) + 1.5) / tot * (c['dur'] - 0.2); out.append([w, round(t, 3), round(t + d * 0.85, 3)]); t += d
    return out
for c in clips.values(): c['words'] = est_words(c) if c['est'] else words_of(c['path'])
for c in clips.values():
    if not c['est']:
        lim = c['dur'] - 0.12
        for w in c['words']: w[1] = round(min(w[1], lim), 3); w[2] = round(min(w[2], c['dur']), 3)
def W(cid, word, nth=0):
    """absolute time (s) the nth spoken word starting with `word` begins in clip cid; falls back to just after the clip starts"""
    hits = [w for w in clips[cid]['words'] if w[0].startswith(word)]
    return clips[cid]['start'] + (hits[nth][1] if len(hits) > nth else 0.4)

GAP_OVERRIDE = script.get('gapOverride', {})
SCENES = [(sc['id'], sc['clips'], sc.get('lead', 0.4), sc.get('gap', 0.0), sc.get('tail', 0.5), sc.get('grid')) for sc in script['scenes']]
def energy_onset(c):
    if c.get('est'): return 0.08
    w = np.abs(c['wave']); k = int(0.01 * SR); e = np.convolve(w, np.ones(k) / k, 'same'); hit = np.argmax(e > 0.15 * e.max())
    return float(hit) / SR
MASTER = script.get('master'); MT0 = None; MPER = 60.0 / MASTER['bpm'] if MASTER else None
t = 0.0; scenes = []
for sid, ids, lead, gap, tail, grid in SCENES:
    s0 = t; cur = s0 + lead; gbeats = []
    if MASTER and sid == MASTER['from']['scene']: MT0 = s0 + MASTER['from'].get('off', 0)
    for i, cid in enumerate(ids):
        g = GAP_OVERRIDE.get(cid, gap) if i else 0
        if grid and i >= grid['from']:
            # a beat grid: the clip's first word lands exactly on beat number (i - from), so spoken counts are dead steady
            on = energy_onset(clips[cid])   # where the sound really starts (the recogniser can't time bare numbers like 'two')
            if i == grid['from']:
                b0 = cur + g + on
                if MASTER and MT0 is not None and sid in MASTER['sounds']: b0 = MT0 + math.ceil((b0 - MT0) / MPER - 1e-9) * MPER   # lock the spoken counts onto the continuous master beat
            B = b0 + (i - grid['from']) * grid['period']; gbeats.append(round(B, 3))
            clips[cid]['start'] = B - on; cur = clips[cid]['start'] + clips[cid]['dur']; clips[cid]['end'] = cur
        else:
            cur += g; clips[cid]['start'] = cur; cur += clips[cid]['dur']; clips[cid]['end'] = cur
    t = cur + tail; scenes.append({'id': sid, 'start': s0, 'end': t, 'clips': ids, 'grid': gbeats})
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
def tone(f, dur=0.9, vol=0.13):
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
def sparkle(vol=0.11):
    out = np.zeros(int(0.9 * SR), dtype=np.float32)
    for i, f in enumerate([1046, 1318, 1568, 2093]): put(out, i * 0.07, tone(f, 0.5, vol), 1)
    return out
def slide(dur=3.4, vol=0.16):   # a smooth glide from low to high, like running a finger up the keyboard
    n=int(dur*SR); x=np.arange(n)/SR; f=110*np.exp(x/dur*math.log(1320/110))
    ph=2*math.pi*np.cumsum(f)/SR; sig=np.sin(ph)+0.35*np.sin(2*ph)
    return (sig*np.minimum(x/0.05,1)*np.minimum((dur-x)/0.2,1)*vol).astype(np.float32)
NOTE_SEMI = {'c': 0, 'cs': 1, 'd': 2, 'ds': 3, 'e': 4, 'f': 5, 'fs': 6, 'g': 7, 'gs': 8, 'a': 9, 'as': 10, 'b': 11}
_PIANO = {}
def piano(note, dur=1.8, vol=0.5):   # 'c3', 'fs4' ... -> a sampled piano note (audio/piano/<midi>.wav, from render_piano.swift)
    import re
    m = re.match(r'^([a-g]s?)(\d)$', note); midi = (int(m.group(2)) + 1) * 12 + NOTE_SEMI[m.group(1)]
    if midi not in _PIANO:
        w = load(HERE / 'audio' / 'piano' / f'{midi}.wav'); _PIANO[midi] = w / (np.abs(w).max() + 1e-9)
    w = _PIANO[midi][:int(dur * SR)].copy(); n = len(w); fade = min(int(0.4 * SR), n)
    w[n - fade:] *= np.linspace(1, 0, fade); return (w * vol).astype(np.float32)
def drum(vol=0.55):
    n = int(0.4 * SR); x = np.arange(n) / SR; f = 55 + 130 * np.exp(-x * 16)
    body = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-x / 0.12)
    k = np.random.default_rng(5).standard_normal(n) * np.exp(-x / 0.012) * 0.3
    return ((body + k) * vol).astype(np.float32)
def step(vol=0.5):
    n = int(0.25 * SR); x = np.arange(n) / SR; f = 45 + 60 * np.exp(-x * 25)
    body = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-x / 0.07)
    z = np.random.default_rng(6).standard_normal(n); z = np.convolve(z, np.ones(30) / 30, 'same') * np.exp(-x / 0.02) * 1.6
    return ((body + z) * vol).astype(np.float32)
def clap(vol=0.45):
    n = int(0.25 * SR); x = np.arange(n) / SR; z = np.random.default_rng(7).standard_normal(n)
    z = z - np.convolve(z, np.ones(10) / 10, 'same')
    e = np.exp(-x / 0.035) + 0.8 * np.exp(-np.maximum(x - 0.012, 0) / 0.03) * (x > 0.012) + 0.6 * np.exp(-np.maximum(x - 0.026, 0) / 0.03) * (x > 0.026)
    return (z * e * vol * 0.8).astype(np.float32)
def heart(vol=0.4):
    out = np.zeros(int(0.5 * SR), dtype=np.float32)
    for at, g in [(0.0, 1.0), (0.2, 0.65)]:
        n = int(0.16 * SR); x = np.arange(n) / SR; f = 48 + 40 * np.exp(-x * 30)
        put(out, at, (np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-x / 0.05) * vol * g).astype(np.float32), 1)
    return out
FREQ = {'e4': 329.6, 'f4': 349.2, 'g4': 392.0, 'a4': 440.0, 'b4': 493.9, 'c5': 523.3, 'd5': 587.3, 'e5': 659.3, 'f5': 698.5, 'g5': 784.0, 'a5': 880.0, 'cs4': 277.2, 'ds4': 311.1, 'fs4': 370.0, 'gs4': 415.3, 'as4': 466.2, 'cs5': 554.4, 'ds5': 622.3, 'c3': 130.8, 'g3': 196.0, 'c6': 1046.5}
events = []   # also written to timeline.json so the page can sync visuals if wanted
def ev(kind, at, **kw): events.append({'kind': kind, 'at': round(at, 3), **kw})
for s in scenes[1:-0]: ev('whoosh', s['start'] + 0.2)
for r in script.get('events', []):
    c = clips[r['clip']]
    base = W(r['clip'], r['word'], r.get('nth', 0)) if 'word' in r else (c['end'] if r.get('from') == 'end' else c['start'])
    extra = {k: v for k, v in r.items() if k in ('f', 'dur', 'note', 'vol')}
    if r['kind'] == 'run':    # a run of single piano notes, one every `step` seconds, e.g. a finger running up the keys
        for i, nt in enumerate(r['notes']): ev('pno', base + r.get('off', 0) + i * r['step'], note=nt, vol=r.get('vol', 0.5), dur=r.get('dur', 1.2))
    else: ev(r['kind'], base + r.get('off', 0), **extra)
for e in events:
    k = e['kind']
    if k == 'tone' and script.get('pianoTones') and e.get('f') and __import__('re').match(r'^[a-g]s?\d$', e['f']):   # an old synthetic tone event, played as a real piano note instead
        put(mix, e['at'], piano(e['f'], 1.2, 0.45), 1.0); continue
    sig = {'whoosh': whoosh, 'tick': tick, 'pop': pop, 'sparkle': sparkle, 'slide': lambda: slide(e.get('dur', 3.4)), 'pno': lambda: piano(e['note'], e.get('dur', 1.8), e.get('vol', 0.5))}.get(k, lambda: tone(FREQ.get(e.get('f'), 440), 0.9 if e.get('f') not in ('c3','g3') else 1.3, 0.2 if e.get('f') in ('c3','g3') else 0.13))()
    put(mix, e['at'], sig, 1.0)

# --- beat tracks (rhythm videos): a steady run of drum / step / clap / heartbeat hits; the page draws its pulses from the same times ---
SND = {'drum': drum, 'step': step, 'clap': clap, 'heart': heart}
beats = []
master_out = None
if MASTER:   # one continuous beat under the whole first part: it never stops between scenes
    mend = next(sc for sc in scenes if sc['id'] == MASTER['to'])['end'] - 0.25
    k = 0; tm = MT0
    while tm <= mend:
        sc = next(x for x in scenes if x['start'] <= tm < x['end'])
        speaking = any((not c.get('quiet')) and c['start'] - 0.05 <= tm <= c['end'] for c in clips.values())
        g = MASTER.get('under', 0.6) if speaking else 1.0
        snd = MASTER['sounds'].get(sc['id'], 'drum')
        beats.append({'t': round(tm, 3), 'track': 'main', 'i': k, 'sound': snd}); put(mix, tm, SND[snd](), g)
        k += 1; tm = MT0 + k * MPER
    master_out = {'t0': round(MT0, 3), 't1': round(mend, 3)}
for b in script.get('beats', []):
    if 'grid' in b: times = list(next(sc for sc in scenes if sc['id'] == b['grid'])['grid'])
    else:
        at = b['at']
        base = clips[at['clip']]['end' if at.get('from') == 'end' else 'start'] if 'clip' in at else next(sc for sc in scenes if sc['id'] == at['scene'])['start']
        base += at.get('off', 0)
        if 'offsets' in b: times = [base + o for o in b['offsets']]
        else:
            per = 60.0 / b['bpm']
            n = b['count'] if 'count' in b else int((next(sc for sc in scenes if sc['id'] == b['until'])['end'] - 0.25 - base) / per) + 1
            times = [base + i * per for i in range(n)]
    for i, tm in enumerate(times):
        beats.append({'t': round(tm, 3), 'track': b['track'], 'i': i, 'sound': b['sound']})
        if not b.get('silent'): put(mix, tm, SND[b['sound']](), 1.0)

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
out = {'fps': FPS, 'duration': round(DURATION, 3), 'scenes': scenes, 'events': events, 'beats': beats, 'master': master_out, 'titleAt': script.get('titleAt'), 'todayLead': script.get('todayLead'), 'dry': DRY, 'game': script['game'], 'gameFile': script['gameFile'], 'title': script['title'], 'nugget': script['nugget'],
       'clips': {cid: {'who': c['who'], 'text': c.get('show', c['text']), 'quiet': c.get('quiet', False), 'words': c['words'], 'start': round(c['start'], 3), 'end': round(c['end'], 3), 'env': [round(float(v), 2) for v in levels(c['wave'])]} for cid, c in clips.items()}}
json.dump(out, open(OUT / 'timeline.json', 'w'))
print(f"duration {DURATION:.1f}s; scenes:", ', '.join(f"{s['id']} {s['start']:.1f}-{s['end']:.1f}" for s in scenes))
