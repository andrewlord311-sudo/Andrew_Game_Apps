// The storyboard step: every piece of music notation that appears anywhere in
// this video, declared once as plain pitch names (VexFlow's own notation -
// "b/4", "c/5" etc, standard letter+octave). video1_main.html and
// bumper_render.html both render FROM this file (via renderNotation, see
// notation.js) instead of hand-coding CSS clef/note/ledger positions, so
// there is exactly one place to look to know what music appears in the video,
// and exactly one place to edit to change it.
//
// storyboard_preview.html renders every entry below as a plain static grid -
// open it in a browser and look before spending any tokens on TTS audio,
// Playwright recording, or ffmpeg assembly. If a pitch is wrong, it's a
// one-line edit here and a page reload, not a re-render.
const STORYBOARD = {
  s3: { label: 'Scene 3 - Treble clef', spec: { clef: 'treble', notes: [] } },
  s4: { label: 'Scene 4 - Bass clef', spec: { clef: 'bass', notes: [] } },
  s5: { label: 'Scene 5 - A note (middle line)', spec: { clef: 'treble', notes: ['b/4'] } },
  s6_line: { label: 'Scene 6 - A note on a line', spec: { clef: 'treble', notes: ['g/4'] } },
  s6_lineAndSpace: { label: 'Scene 6 - Line + space together', spec: { clef: 'treble', notes: ['g/4', 'c/5'] } },
  s7: { label: 'Scene 7 - Ledger line above the stave', spec: { clef: 'treble', notes: ['a/5'] } },
  s8_stave: { label: 'Recap - STAVE', spec: { clef: 'treble', notes: [], showClef: false } },
  s8_clef: { label: 'Recap - CLEF', spec: { clef: 'treble', notes: [], hideStave: true } },
  s8_note: { label: 'Recap - NOTE', spec: { clef: 'treble', notes: ['b/4'], showClef: false, hideStave: true } },
  s8_lineSpace: { label: 'Recap - LINE / SPACE', spec: { clef: 'treble', notes: ['g/4', 'c/5'], showClef: false } },
  s8_ledger: { label: 'Recap - LEDGER LINE', spec: { clef: 'treble', notes: ['a/5'], showClef: false } },
  bumperTreble: { label: 'Intro/outro - Melody\'s clef', spec: { clef: 'treble', notes: [] } },
  bumperBass: { label: 'Intro/outro - Barnaby\'s clef', spec: { clef: 'bass', notes: [] } },
};

if (typeof window !== 'undefined') window.STORYBOARD = STORYBOARD;
