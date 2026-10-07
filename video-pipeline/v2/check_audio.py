#!/usr/bin/env python3
"""Transcribe every generated clip locally (whisper.cpp) and flag clips whose words differ from the script -
a mispronounced word usually transcribes as something else ('stave' -> 'starve a'). Free; nothing leaves the Mac.
   python3 check_audio.py script_video1.json"""
import json, sys, subprocess, tempfile, pathlib, re
HERE = pathlib.Path(__file__).parent
WH = '/opt/homebrew/bin/whisper-cli'; MODEL = pathlib.Path.home() / 'Projects/voice-journal/models/ggml-small.en.bin'
script = json.load(open(HERE / sys.argv[1])); name = pathlib.Path(sys.argv[1]).stem.replace('script_', '')
norm = lambda t: re.sub(r'[^a-z ]', '', t.lower().replace('-', ' ')).split()
bad = 0
for grp, d in (('shared', 'shared'), ('clips', name)):
    for c in script[grp]:
        mp3 = HERE / 'audio' / d / f"{c['id']}.mp3"
        with tempfile.TemporaryDirectory() as t:
            wav = pathlib.Path(t) / 'a.wav'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp3), '-af', 'adelay=1000|1000,apad=pad_dur=1.5', '-ar', '16000', '-ac', '1', str(wav)], check=True)
            out = subprocess.run([WH, '-m', str(MODEL), '-f', str(wav), '-nt', '-np'], capture_output=True, text=True).stdout
        got, want = norm(out), norm(c.get('show', c['text']))
        flag = got != want
        bad += flag
        print(('MISMATCH ' if flag else 'ok       ') + f"{c['id']:7s} want: {' '.join(want)}" + (f"   got: {' '.join(got)}" if flag else ''))
print(f'{bad} mismatch(es)')
