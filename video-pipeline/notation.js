// The ONLY place VexFlow is used. Every scene that needs a stave/clef/note
// calls this one function instead of hand-positioning CSS divs - VexFlow
// guarantees correct clef proportions, note placement, and ledger lines
// because it's built on real music notation rules, not tuned pixel values.
//
// spec:
//   clef      'treble' | 'bass'
//   notes     array of pitch strings, e.g. ['e/4'] or ['c/5'] (ledger line above
//             treble stave) - standard VexFlow pitch notation, letter/octave
//   width     px, defaults to the container's own current width (via CSS) - pass
//             explicitly only if the container isn't already sized by CSS
//   height    px, defaults to the container's own current height likewise
//   color     optional CSS color for noteheads/stems (defaults to ink/clef color via caller)
//   showClef  default true - set false for icons that only need the note+stave
//   hideStave default false - set true for small icons that want just a clef
//             and/or note floating with no stave lines/barlines visible
//   scale     default 1 - VexFlow's line spacing and clef/note glyph sizes are
//             fixed pixel values that don't grow with width/height, so to make
//             a notation graphic bigger (not just wider), render it at the same
//             internal size and then stretch the SVG's display size vs its
//             viewBox by this factor - stretches width AND height together,
//             everything scales proportionally including stroke widths
function renderNotation(containerEl, spec) {
  const {
    clef, notes,
    width = containerEl.clientWidth || 260,
    height = containerEl.clientHeight || 200,
    color, showClef = true, hideStave = false, scale = 1,
  } = spec;
  containerEl.innerHTML = '';
  if (!containerEl.id) containerEl.id = 'vf-' + Math.random().toString(36).slice(2);

  const { Factory } = VexFlow;
  const factory = new Factory({ renderer: { elementId: containerEl.id, width, height } });
  // VexFlow's line spacing (10px/line) and clef/note glyph sizes are fixed
  // regardless of width/height - they don't scale to fill a bigger box. A
  // Stave's y also isn't where the first line lands: VexFlow always reserves
  // a fixed ~40px above y for a clef/key-signature area even when unused, so
  // the first line actually renders at y+40 - place the 5-line block (40px
  // tall) a bit above vertical-centre, clamped so it never goes negative for
  // very short boxes, leaving margin both above (clef/ledger-above) and below
  // (descenders/ledger-below) that scales with the box instead of a fixed number.
  const y = Math.max(0, Math.round(height * 0.4) - 40);

  if (notes.length === 0) {
    // Stave/clef only, no notes to lay out - EasyScore needs at least one note, so skip it.
    const stave = factory.Stave({ x: 10, y, width: width - 20 });
    if (showClef) stave.addClef(clef);
    factory.draw();
  } else {
    const score = factory.EasyScore();
    const system = factory.System({ width: width - 20, x: 10, y });
    // EasyScore shorthand is "<letter><octave>/<duration>" (no slash between
    // letter and octave) - e.g. "e4/q", not the StaveNote "e/4" key format.
    const noteStr = notes.map((n) => `${n.replace('/', '')}/q`).join(', ');
    const voice = score.voice(score.notes(noteStr, { clef, stem: 'auto' }));
    voice.setStrict(false); // these are illustrative snippets, not full measures - don't require exact time-signature completion
    const stave = system.addStave({ voices: [voice] });
    if (showClef) stave.addClef(clef);
    factory.draw();
  }

  if (scale !== 1) {
    const svg = containerEl.querySelector('svg');
    svg.style.width = `${width * scale}px`;
    svg.style.height = `${height * scale}px`;
  }

  if (hideStave) {
    containerEl.querySelectorAll('svg .vf-stave, svg .vf-stavebarline').forEach((el) => {
      el.style.display = 'none';
    });
  }

  if (color) {
    // Stave lines and barlines are <path>/<rect>; noteheads and clef glyphs are
    // <text> (they're music-font characters, not vector shapes) - both need covering.
    containerEl.querySelectorAll('svg path, svg rect, svg ellipse, svg circle, svg text').forEach((el) => {
      el.style.fill = color;
      el.style.stroke = color;
    });
  }

  return containerEl.querySelector('svg');
}

if (typeof window !== 'undefined') window.renderNotation = renderNotation;
