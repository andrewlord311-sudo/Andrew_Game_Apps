#!/bin/sh
# Short 14 plays the octave three times so children can hear it (Andrew, 13 Nov).
# Video 9's octave is two piano notes, 34.15 to 36.85 s (low C at ~34.2, high C at ~35.3).
# Builds out/_src14.mp4 = video9 from 32.6 s to 36.85 s, that octave twice more, on to 51.8 s, then the octave once more to round it off,
# plus out/_src14.srt with the later captions shifted. Then: node make_shorts.mjs short14_same_note_higher
set -e
cd "$(dirname "$0")"; R=../..; mkdir -p out
ffmpeg -y -loglevel error -i $R/videos/video9_octaves.mp4 -filter_complex "
[0:v]trim=32.6:36.85,setpts=PTS-STARTPTS[v0];[0:a]atrim=32.6:36.85,asetpts=PTS-STARTPTS[a0];
[0:v]trim=34.15:36.85,setpts=PTS-STARTPTS[v1];[0:a]atrim=34.15:36.85,asetpts=PTS-STARTPTS[a1];
[0:v]trim=34.15:36.85,setpts=PTS-STARTPTS[v2];[0:a]atrim=34.15:36.85,asetpts=PTS-STARTPTS[a2];
[0:v]trim=36.85:51.8,setpts=PTS-STARTPTS[v3];[0:a]atrim=36.85:51.8,asetpts=PTS-STARTPTS[a3];
[0:v]trim=34.15:36.85,setpts=PTS-STARTPTS[v4];[0:a]atrim=34.15:36.85,asetpts=PTS-STARTPTS[a4];
[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4]concat=n=5:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k out/_src14.mp4
python3 - <<'PY'
import re
SHIFT = 2 * (36.85 - 34.15); START = 32.6
def t(s):
    m = re.match(r"(\d+):(\d+):(\d+),(\d+)", s); return int(m[1])*3600+int(m[2])*60+int(m[3])+int(m[4])/1000
def f(x):
    ms = round(x*1000); return "%02d:%02d:%02d,%03d" % (ms//3600000, ms//60000%60, ms//1000%60, ms%1000)
out = []
for b in open("../../channel/captions/video9.en-GB.srt").read().strip().split("\n\n"):
    l = b.split("\n"); a, z = (t(x) for x in l[1].split(" --> "))
    if z <= START: continue
    if a >= 36.85: a += SHIFT; z += SHIFT      # later cues move right by the two extra plays
    out.append(f"{len(out)+1}\n{f(a-START)} --> {f(z-START)}\n" + "\n".join(l[2:]))
open("out/_src14.srt", "w").write("\n\n".join(out) + "\n")
PY
