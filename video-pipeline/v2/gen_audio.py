#!/usr/bin/env python3
"""Generate narration for a video script with ElevenLabs (Melody + Barnaby). Caches by text+voice, so reruns cost nothing.
   python3 gen_audio.py script_video1.json [--only id,id]   -> audio/<video>/<id>.mp3 ; shared clips -> audio/shared/<id>.mp3"""
import json, os, sys, hashlib, urllib.request, pathlib
HERE = pathlib.Path(__file__).parent
env = {}
for l in open(HERE.parent.parent / '.env'):
    if '=' in l and not l.startswith('#'):
        k, v = l.strip().split('=', 1); env[k] = v
KEY = env['ELEVENLABS_API_KEY']
VOICE = {'melody': env['ELEVENLABS_MELODY_VOICE_ID'], 'barnaby': env['ELEVENLABS_BARNABY_VOICE_ID']}
SPEED = {'melody': 0.95, 'barnaby': 0.9}    # Andrew liked Daniel being slower; kids' audience
def gen(who, text, out, prev=None):
    meta = out.with_suffix('.json'); h = hashlib.sha1(f"{who}|{text}|{SPEED[who]}|{prev}".encode()).hexdigest()
    if out.exists() and meta.exists() and json.load(open(meta)).get('hash') == h: return 0
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.3, "speed": SPEED[who]}, **({"previous_text": prev} if prev else {})}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE[who]}?output_format=mp3_44100_128", body,
        {"xi-api-key": KEY, "Content-Type": "application/json"})
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(urllib.request.urlopen(req, timeout=120).read()); json.dump({"hash": h, "text": text, "who": who}, open(meta, 'w'))
    return len(text)
if __name__ == '__main__':
    script = json.load(open(HERE / sys.argv[1])); name = pathlib.Path(sys.argv[1]).stem.replace('script_', '')
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    spent = 0
    for c in script['shared']:
        if only is None or c['id'] in only: spent += gen(c['who'], c['text'], HERE / 'audio' / 'shared' / f"{c['id']}.mp3")
    for c in script['clips']:
        if only is None or c['id'] in only: spent += gen(c['who'], c['text'], HERE / 'audio' / name / f"{c['id']}.mp3", c.get('prev'))
    print('credits spent this run (characters):', spent)
