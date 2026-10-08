#!/usr/bin/env python3
"""Pacing lint for a built timeline: flags narration that races, clips that crowd each other, long runs of speech with no
breath, and scenes that end before a child has had time to look. Free and instant - run it BEFORE spending any
ElevenLabs credits or render time.

    python3 build_timeline.py video3 --dry && python3 pacing_check.py video3      # dry = estimated speech, so the
                                                                                    # speech-rate checks only mean something with real audio
It checks only what the timeline knows (speech and scene timing). It cannot see captions or animations, so the visual
rules in ~/.claude/skills/video-pacing/SKILL.md still have to be checked by looking at frames.
FIX = change it before showing Andrew.  NOTE = brisk; fine if deliberate, but look at it.   Exit code 1 if any FIX."""
import json, sys, pathlib
HERE = pathlib.Path(__file__).parent
name = sys.argv[1]
T = json.load(open(HERE / 'out' / name / 'timeline.json'))
clips, scenes = T['clips'], T['scenes']
fix, note = [], []
real = not T.get('dry')
for i, sc in enumerate(scenes):
    dur = sc['end'] - sc['start']; ids = sc['clips']
    first, last = clips[ids[0]], clips[ids[-1]]
    lead, tail = first['start'] - sc['start'], sc['end'] - last['end']
    opening = 0 < i <= 3                                   # the first scenes after the opener carry the idea in: slowest of all
    last_scene = i == len(scenes) - 1
    if dur > 16: fix.append((sc['id'], f"scene runs {dur:.0f}s - long enough to lose a child; split it"))
    elif dur > 12 and not last_scene: note.append((sc['id'], f"scene runs {dur:.0f}s"))
    if dur < 3.0: note.append((sc['id'], f"scene is only {dur:.1f}s long"))
    if lead < 0.3: fix.append((sc['id'], f"speech starts only {lead:.2f}s into the scene - the picture has not arrived yet"))
    elif lead < 0.4: note.append((sc['id'], f"speech starts {lead:.2f}s into the scene"))
    if not last_scene:
        if tail < 0.6: fix.append((sc['id'], f"only {tail:.2f}s after the last word before the scene ends: the last caption/highlight will flash and vanish"))
        elif tail < 1.0: note.append((sc['id'], f"{tail:.2f}s after the last word before the scene ends (aim for 1.0s+, 2s+ when the last word is the key term)"))
    for a, b in zip(ids, ids[1:]):
        gap = clips[b]['start'] - clips[a]['end']
        if gap < 0.25: fix.append((sc['id'], f"'{a}' to '{b}': only {gap:.2f}s between them"))
        elif gap < 0.35: note.append((sc['id'], f"'{a}' to '{b}': {gap:.2f}s between them"))
    if real:
        for cid in ids:
            c = clips[cid]; n = len(c['text'].split()); d = c['end'] - c['start']
            if n >= 5 and d > 0:
                wps = n / d
                fixat, noteat = (2.6, 2.3) if opening else (3.6, 2.8)      # the first teaching scenes must be the slowest
                if wps > fixat: fix.append((sc['id'], f"'{cid}': {wps:.1f} words/second races (limit {fixat}). Add pauses with <break time=\"0.4s\" /> between phrases and set \"speed\": 0.88 on the clip, or split the line"))
                elif wps > noteat: note.append((sc['id'], f"'{cid}': {wps:.1f} words/second is brisk (aim under {noteat})"))
print(f"{name}: {len(scenes)} scenes, {T['duration']:.0f}s" + ('' if real else ' (silent dry-run estimate: speech-rate checks skipped)'))
if not fix and not note: print("pacing OK")
for sid, msg in fix: print(f"  FIX   {sid}: {msg}")
for sid, msg in note: print(f"  note  {sid}: {msg}")
sys.exit(1 if fix else 0)
