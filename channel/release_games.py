#!/usr/bin/env python3
"""Wire each Nugget game to its video the moment the video is public.

For every entry in channel/release-schedule.json that is not done and has a videoId:
  1. skip it until its publishAfter time has passed;
  2. ask YouTube (oEmbed) whether the video is public (HTTP 200; 401/403/404 means still private or scheduled);
  3. if public: set `const VIDEO_URL = ''` in the game file to the video address, add the game to PUBLISHED in
     music/arcade-core.js, and mark the entry done.
Safe to run again and again. Run by GitHub Actions every 15 minutes (no laptop needed), or by hand:
    python3 channel/release_games.py            # do it
    python3 channel/release_games.py --dry      # only report
    python3 channel/release_games.py --root DIR --force   # test on a copy, treat every video as public
"""
import json, re, sys, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

args = sys.argv[1:]
DRY, FORCE = '--dry' in args, '--force' in args
ROOT = Path(args[args.index('--root') + 1]) if '--root' in args else Path(__file__).resolve().parent.parent
SCHED = ROOT / 'channel' / 'release-schedule.json'
CORE = ROOT / 'music' / 'arcade-core.js'

def is_public(video_id):
    if FORCE:
        return True
    url = f'https://www.youtube.com/oembed?url=https://youtu.be/{video_id}&format=json'
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'nuggets-release-check'}), timeout=20) as r:
            return r.status == 200
    except urllib.error.HTTPError as e:
        print(f'  YouTube says {e.code}: not public yet')
        return False
    except Exception as e:
        print(f'  could not check ({e}); will try again next run')
        return False

def main():
    data = json.loads(SCHED.read_text())
    now = datetime.now(timezone.utc)
    changed = False
    for g in data['games']:
        name = g['game']
        if g.get('done'):
            continue
        print(f"{name} (video {g['video']}):", end=' ')
        if not g.get('videoId'):
            print('no videoId yet (video not uploaded): waiting'); continue
        if not FORCE and now < datetime.fromisoformat(g['publishAfter'].replace('Z', '+00:00')):
            print('not due yet'); continue
        print('checking YouTube')
        if not is_public(g['videoId']):
            continue
        gf = ROOT / 'music' / name
        html = gf.read_text()
        url = f"https://youtu.be/{g['videoId']}"
        if "const VIDEO_URL = '';" in html:
            html = html.replace("const VIDEO_URL = '';", f"const VIDEO_URL = '{url}';", 1)
        elif url not in html:
            print(f'  {name}: VIDEO_URL is already set to something else; leaving it alone'); continue
        core = CORE.read_text()
        if f"'{name}'" not in re.search(r"const PUBLISHED = \[[^\]]*\]", core).group(0):
            core = re.sub(r"(const PUBLISHED = \[[^\]]*?)\s*\]", lambda m: m.group(1) + f", '{name}']", core, 1)
        print(f'  PUBLIC: wiring {name} to {url}')
        if not DRY:
            gf.write_text(html); CORE.write_text(core)
            g['done'] = True; g['wiredAt'] = now.strftime('%Y-%m-%dT%H:%M:%SZ'); changed = True
    if changed:
        SCHED.write_text(json.dumps(data, indent=2) + '\n')
    print('changes made' if changed else 'nothing to do')

main()
