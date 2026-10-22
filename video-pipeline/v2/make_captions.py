#!/usr/bin/env python3
"""Write a YouTube caption file (.srt) for a finished video from its timeline.
   python3 make_captions.py video8        (or: all)
Reads out/<video>/timeline.json (the same clip times the render used) and the script's clean "show" text,
writes ../../channel/captions/<video>.en-GB.srt. One cue per spoken line, split at sentence ends when a line
is too long to read in two rows; each cue's sentence timing comes from the recogniser's word times."""
import json, re, sys, pathlib
HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent / 'channel' / 'captions'
ROW = 38; MIN_HOLD = 1.2

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'

def rows(text):
    """wrap into at most two balanced rows"""
    if len(text) <= ROW: return text
    words = text.split(); best = None
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]: best = (score, a, b)
    return best[1] + '\n' + best[2]

def cues_for(clip, text):
    """split a clip into sentence cues if it won't fit in two rows; time each from the word list"""
    if len(text) <= 2 * ROW: return [(clip['start'], clip['end'], text)]
    sents = [s for s in re.split(r'(?<=[.!?…])\s+', text) if s]
    words = clip.get('words') or []; n_txt = len(text.split())
    out = []; k = 0
    for s in sents:
        k0 = k; k += len(s.split())
        if len(words) == n_txt:   # word counts line up: use the recogniser's times
            t0 = clip['start'] + words[k0][1]
        else:                      # otherwise share the clip out by characters
            t0 = clip['start'] + (clip['end'] - clip['start']) * len(' '.join(text.split()[:k0])) / len(text)
        out.append([t0, None, s])
    out[0][0] = clip['start']
    for a, b in zip(out, out[1:]): a[1] = b[0]
    out[-1][1] = clip['end']
    return [tuple(c) for c in out]

def build(name):
    tl = json.load(open(HERE / 'out' / name / 'timeline.json'))
    script = json.load(open(HERE / f'script_{name}.json'))
    show = {c['id']: c.get('show') for c in script['shared'] + script['clips']}
    order = sorted(tl['clips'].items(), key=lambda kv: kv[1]['start'])
    cues = []
    for cid, c in order:
        text = (show.get(cid) or re.sub(r'<[^>]+>', '', c['text'])).strip()
        text = re.sub(r'\s+', ' ', text)
        if not text: continue
        cues += cues_for(c, text)
    # hold each cue long enough to read, but never over the next one or past the end
    final = []
    for i, (a, b, t) in enumerate(cues):
        nxt = cues[i + 1][0] if i + 1 < len(cues) else tl['duration']
        b = min(max(b + 0.3, a + MIN_HOLD), nxt - 0.05, tl['duration'])
        final.append((a, b, t))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.en-GB.srt'
    path.write_text(''.join(f'{i}\n{ts(a)} --> {ts(b)}\n{rows(t)}\n\n' for i, (a, b, t) in enumerate(final, 1)))
    print(path, len(final), 'cues')

names = [f'video{i}' for i in range(1, 10)] if sys.argv[1] == 'all' else sys.argv[1:]
for n in names: build(n)
