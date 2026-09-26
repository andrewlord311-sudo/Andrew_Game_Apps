# Context for Claude -- Andrew_Game_Apps

_Copied from Claude's memory on Andrew's Mac, 26 September 2026, by `vault-tools/sync-claude-context.py`. Don't edit by hand -- it's regenerated._

## About Andrew

Andrew Lord builds a portfolio of small personal projects, one GitHub repo each
(on his Mac they live in `~/Projects/<repo>`). He is technically fluent: give
concrete detail (file:line, what the code actually does), not just summaries.
His Obsidian vault "Andrew Second Brain" is the durable home for plans; the
private repo `andrew-second-brain` mirrors it (see "Working in the cloud").

**Commit and push without asking** -- he has authorised it durably. Stop only
for a genuine content problem (a secret or someone's personal data about to be
committed), and report that as a finding.

Friendly, not too verbose. Laura (wife), Clara (7) and Felix (4): anything
built for Laura must work as a plain phone link, no accounts or apps.

## Working in the cloud (Claude Code on the web)

This file is copied from the memory Claude keeps on Andrew's Mac, so a cloud
session starts with the same context. The Mac copy may be newer -- the date
is above. In the cloud, as opposed to on the Mac:

- **No Mac-only things:** no launchd jobs, no iCloud Drive, no `~/.secrets`,
  no local Telegram pollers, no Homebrew tools that aren't installed by the
  environment's setup script. Code that runs on the Mac on a schedule can be
  *edited* here, but it won't run until the Mac pulls the change.
- **The vault:** `andrew-second-brain` (a separate private repo) is the Second
  Brain vault. Edits pushed there reach iCloud and Obsidian when the Mac next
  syncs (vault-tools/commit-second-brain.py pulls before it pushes). The Lord
  Family vault is the private repo `the-lord-family/obsidian-vault`.
- **Always commit and push** before the session ends: the Mac and the other
  sessions only see what's on GitHub.

## Memory: project-nuggets-music-apps

Andrew is building a family of browser-based music-teaching games for kids called "Nuggets" — each teaches one small music-reading concept (note names, stave lines/spaces, clefs, keyboard patterns, finger numbers, musical alphabet). 10 are built as of 2026-07-21, plus a shared `music/reward-system.js` (pick an animal, reveal it piece by piece across correct answers, 3-tier fanfare on repeat completions, localStorage-persisted).

**Code:** [Andrew_Game_Apps](https://github.com/andrewlord311-sudo/Andrew_Game_Apps) on GitHub — plain HTML files, one per nugget (e.g. `higher_lower_same.html`, `c_hunt.html`, `alphabet_elevator.html`).

**Docs:** [[reference-obsidian-vault]] → `Claude Projects/Music teaching/` (no
trailing space in the folder name, despite an older note saying so).
**Front door: `Music teaching.md` (added 3.9.26)** — frames the folder as
**two projects**: (1) *the games* — `Nuggets ideas.md` (status table + per-game
feedback), `Nugget scoping.md` (build specs for unbuilt ones), `Reward
system.md`; (2) *the videos* — see the YouTube spinoff section below;
plus the paused `Characters.md` (mascot art pipeline). `Project Index.md`'s
"Music teaching" block mirrors this split.

**Conventions:** mascots Melody (treble clef) and Barnaby (bass clef); canvas-drawn stave; every game has 3 difficulty stages (Easy/Medium/Hard); score/streak/hearts UI; hints toggle. New nuggets should match this style so they slot into the same family.

**YouTube video spinoff (as of 2026-07-27):** one short instructional video per nugget, hosted by Melody/Barnaby, docs in the vault under `Music teaching` → `Nugget Videos - Resources.md` (production pipeline, Google Cloud TTS setup) and `Nugget Videos - Storyboards.md` (per-video scripts; Video 1 "Name That Part" is explicitly Part 1 of a recurring theme). **Channel name decided: "Melody & Barnaby's Music Nuggets"** (checked clear of existing YouTube channels). Cloud TTS API key is live in `Andrew_Game_Apps/.env` (`GOOGLE_TTS_API_KEY`, gitignored) and verified working. An intro/outro bumper concept ("one note becomes a whole world" theme) was designed and published as a Claude Artifact. Andrew's own composed track for it lives at `Music teaching/intro outro.mp3` in the vault (12.4s) — same clip used on both ends as a first pass, embedded directly in the artifact; the bumper timings were stretched to match its length.

**First complete video built (2026-07-27):** `~/Projects/Andrew_Game_Apps/video-pipeline/` is the reusable render pipeline — Playwright (Chromium, installed via `npx playwright install chromium`) records each HTML scene as a silent .webm, then ffmpeg muxes in audio and concatenates segments. Key files: `bumper_render.html` (isolated single-stage version of the intro/outro artifact, driven by `?mode=intro|outro` + `window.startRender()` — needed because the original artifact page has surrounding chrome unsuitable for a video capture), `video1_main.html` (the 10-scene lesson content for "Name That Part, Part 1", timed off the real narration audio via `BEATS` timestamps computed from each line's actual duration, not the storyboard's rough estimates), `render.mjs` (the Playwright capture script). Output: `~/Projects/Andrew_Game_Apps/videos/video1_name_that_part_complete.mp4` (1280x720, ~80s = 12.4s intro + 55.3s lesson + 12.4s outro). The narration audio (`voice_samples/video1_lines/*.mp3` + `video1_full_preview.mp3`) already existed in the repo pre-dating this session's work. **Known gotcha hit during this build:** the local preview-server tool (`preview_start`) couldn't serve a brand-new folder under `~/Projects/Andrew_Game_Apps` (silently 404'd everything) — worked around by launching `python3 -m http.server` directly via Bash instead, which had no such issue. Also: TTS-generated narration audio was 24kHz mono while the music bumper was 44.1kHz stereo — concatenating mismatched audio formats silently corrupts playback, so every segment's audio must be normalized (`-ar 44100 -ac 2`) before muxing.

**Round two (2026-07-27) — Andrew caught 6 real defects my own review missed** (clef sizing/centering regressed vs. an earlier fix, notes too small, a note not actually on its target line, end-of-video A/V drift, pacing feeling rushed, a ledger-line note floating in the wrong place) **and asked why the checking process hadn't caught them.** Root causes, all fixed:
- Clef/note CSS in `video1_main.html` had never inherited the earlier centering fix made in the *bumper* file — two separate files, one bug fixed in only one place.
- Notes were positioned via a fragile "container bottom-offset" scheme; replaced with a zero-size anchor-point design (`.note-glyph{width:0;height:0}`, children use `transform:translate(-50%,-50%)`) so a note's `top` is now literally its target y-coordinate — eliminates this whole bug class.
- A/V drift traced to trusting **arithmetic** (summing individual clip durations) instead of **measuring** the real assembled track; fixed by reading scene boundaries off `ffmpeg silencedetect` on the actual concatenated audio. Also switched narration concatenation from the `concat` demuxer (stream-copy) to the `concat` **filter** (decodes to PCM and rejoins) for sample accuracy.
- Rushed pacing: reveals were at fixed small ms-offsets from scene start regardless of scene length, so everything fired in the first ~1.5s and then sat idle. Replaced with fraction-of-scene-duration timing (`at(sceneId, fraction, fn)` helper) plus continuous idle-bob motion on mascots during holds.
- SSML `<mark>` timepointing (which would give exact word-level sync) is **not supported on Studio voices** — confirmed via a live 400 error, so don't retry that path without switching voice tier.
- A separate real bug found only by building the checker: the scene-timeline's `tick()` fallback logic sent playback back to scene 1 during every inter-scene silence gap. Fixed to hold on the previously-active scene during gaps.

**Round four (2026-07-27) — 4 more, mostly a checker-coverage gap plus one real audio win:**
- **Bumper (intro/outro) clefs were tiny** — `nugget_intro_outro.html`/`bumper_render.html` clef CSS had never been updated to match the main-video fix at all (separate file, separate bug, third time this exact class of "fixed in file A, file B never got it" mistake has bitten). Measured the bumper's actual stave height and set matching font-sizes (treble 155px, bass 151px at the bumper's 1280x720 render scale) — also discovered along the way that `.clef` has a base `transform: scale(.4)` only reached via its pop-in animation, so any manual size measurement that doesn't trigger/bypass that animation reads wildly wrong numbers.
- **Main-video bass clef still too small even after round 3** — round 3 only pushed it to 1.07x stave height; re-targeted to 1.36x (close to treble's 1.39x) by direct trial-and-measure rather than a formula, then nudged Barnaby's mascot position in scene 4 to keep clearance from the now-much-bigger clef.
- **Ledger line overcorrected** — round 3 made it deliberately asymmetric (extend left) per that round's feedback; this round asked for symmetric, so it's now centred on the note (`margin-left: -50%` of its own width).
- **Recap ("let's say them again") pacing fixed at the source, not just re-timed.** Rather than re-estimating word-weighted fractions again, widened the actual SSML `<break>` durations in line 8 (250-300ms → 600-650ms between each named term) and regenerated that one audio line. Bonus: breaks that wide are long enough for `ffmpeg silencedetect` to resolve **each term's exact start time directly** from the real audio — so the montage now fires on measured timestamps, not an estimate. This is the same "generate the true silences long enough to be measurable" trick worth reusing whenever a scene's internal sub-timing needs to be precise and marks aren't available.
- **The real lesson from this round:** `check.mjs`'s clef check only ever asserted centering, never size, until round 3 added a size floor for the *main* video — but that check only runs against `video1_main.html`, so it did nothing to catch the *bumper's* clefs being tiny. A checker only catches what it's pointed at; a passing report from one file says nothing about a sibling file with the same component copy-pasted into it.

**Round five (2026-07-27) — the bass clef sizing saga finally resolved, plus a real missing-feature catch:**
- **Root cause of the whole bass-clef-too-small saga across rounds 3-5: `getBoundingClientRect()` measures the font's line-box, not the glyph's ink.** Direct pixel-scan of an actual screenshot (excluding stave-line rows) showed the bass clef's real ink sat *entirely inside* the 5-line stave with ~35px of invisible box padding above/below — every earlier "ratio" fix (1.07x, then 1.36x box-height-to-stave-height) was tuning a number that didn't correspond to what's visually on screen. Fixed properly this time by pixel-measuring actual ink boundaries against actual stave-line pixel positions (via a small Playwright+Pillow script) and iterating on font-size until ink-top empirically reached the target y-coordinate — landed on 233px (vs 134px before). **Lesson for any future clef/glyph sizing work: don't trust box-height ratios for this font; measure ink pixels directly.**
- Growing the bass clef that much pushed it into the scene-4 mascot — nudged Barnaby's `right` offset out further once the collision was confirmed via measured bounding boxes (not eyeballing).
- **"All the symbols have gone" was a real missing feature, not a regression** — the recap montage was always text-only; earlier rounds' fixes to its *timing* never added the visual icon each earlier scene had paired with its word. Built a small set of mini icons (stave lines, treble clef glyph, note, line-vs-space illustration, ledger-line-with-note) that swap in time with each term.
- **Debugging gotcha worth remembering:** the clef's reveal uses a `clip-path` transition (1.1s). Any quick Playwright test script that adds `.show` and screenshots after only ~200ms will render a glyph that looks glitched/partial (dots "missing", shapes "distorted") — that's just the transition mid-flight, not a real bug. `getBoundingClientRect()`-based checks are unaffected by this (clip-path doesn't change box geometry, only paint), which is why `check.mjs`'s numeric assertions stayed reliable throughout even when ad-hoc screenshot scripts gave misleading pictures. Always wait out CSS transitions before treating a screenshot as ground truth.

**`video-pipeline/check.mjs` now exists** — an automated Playwright-based QA gate, run before every render: asserts clef/note pixel-alignment against actual stave geometry (not eyeballed screenshots), asserts the BEATS timeline is contiguous and matches real audio duration, asserts every scripted reveal actually reaches visible opacity, and asserts gap-handling holds the right scene. **Run this and get a clean PASS before rendering or shipping any future nugget video** — it catches exactly the class of bug Andrew found by hand this round. It does not (yet) judge subjective pacing/"rushed" feel — that still needs a human watch.

**Round three (2026-07-27) — 4 more issues, illustrating a gap in the checker itself:**
- **Clef size regressed silently.** The checker only ever asserted *centering*, never *size* — so a clef could be perfectly centred and still tiny (treble was only 0.51x the stave's own height; real notation has it visibly overrunning the stave, more like 1.3-1.5x). Measured and fixed properly this time (treble font-size 137px → 1.39x stave height, bass 106px → 1.07x), **and added a `CLEF_MIN_RATIO` size assertion to check.mjs** (treble ≥1.15x, bass ≥0.85x stave height) so this specific regression class can't silently recur.
- **Clef re-shown in note-teaching scenes (5/6/7) was distracting** — removed it from those scenes entirely; the stave alone carries the "which line/space" teaching without re-establishing the clef every time.
- **Ledger line too short/thin, not extending toward where it visually should** — real ledger lines read as a "shelf" the note sits at the right end of, extending noticeably further left of the note than right. Fixed: 100px wide, asymmetric (-70px margin so it extends mostly leftward), 7px thick (was 4px).
- **Scene 8 ("let's say them again" recap) still out of sync** — the montage was evenly spacing 5 terms across the scene, but the actual SSML line isn't evenly spaced (a long lead-in phrase before "stave" even starts; "line and space"/"ledger line" are multi-word so take longer than the single-word terms). Re-timed using word-count-weighted fraction estimates instead of even spacing. **This is still an estimate, not verified sync** — Studio voices don't support SSML `<mark>` timepointing (confirmed via API error), so there is no way to get exact word-level timestamps on this voice tier; if sync still isn't tight enough, the real fix is switching the affected line(s) to a WaveNet/Neural2 voice (which do support `<mark>`) rather than continuing to guess proportions. **Found already in the repo but not previously tracked in this memory:** `voice_samples/video1_lines/` has a full set of narrated lines for Video 1 dated 2026-07-23, and `music/meet_the_mascots.html` is a built mascot-intro page — worth checking actual state of video production before assuming it's still at the planning stage.

**Round six (2026-07-27) — bumper bass clef still wrong (4th time this exact bug class recurred) + recap icons redesigned, and check.mjs finally extended to cover both:**
- **Bumper bass clef ink-scaling was non-linear and misleading at first read.** Bumping `.clef-bass` font-size from 151px in small steps (180, 200, 230px) produced *zero* measured change in ink height — looked like a plateau/bug. Root cause was in the measurement script, not the glyph: it sampled one global corner pixel as "background," but the bumper's stage background is a radial gradient, so background colour drifts across the image and corrupted the ink/not-ink threshold. Fixed by sampling each row's *local* left-edge pixel as that row's background instead of one global sample. After the fix, ink height scaled smoothly and the real fix size was found empirically: **355px** (vs treble's 155px, ratio ~2.3x) — confirms yet again that this font's bass-clef glyph needs a much larger font-size than its box-height would suggest, and that the exact multiplier isn't transferable between differently-scaled contexts (main video needed 233px vs treble's 137px, a 1.7x ratio; the bumper needed 355 vs 155, a 2.3x ratio) — **always re-measure ink per context, never reuse a ratio from a different render target.**
- **Growing the bumper bass clef that much collided with Barnaby's mascot** (same collision class as round 5's main-video mascot fix) — moved `.mascot-barnaby` from `right:22%` to `right:36%` so he sits clear of the enlarged clef, mirroring Melody's placement relative to the treble clef on the other side.
- Fixed in **both** sibling files this time in the same pass: `bumper_render.html` (fixed px, the actual render target) and `nugget_intro_outro.html` (the interactive artifact, uses `clamp()` for responsive sizing — scaled the vw/rem terms proportionally rather than copying the px value directly).
- **Recap icons for "LINE / SPACE" and "LEDGER LINE" were genuinely badly designed, not just mispositioned** — both used small headless note-blobs inconsistent with every other note glyph in the video (which all have head+stem). Redesigned both using the same head+stem shape as the working `ICON_NOTE`, with positions computed from the icon's own drawn line coordinates (not eyeballed) — verified by reading the actual rendered DOM geometry afterward (note-head centre vs line centre, sub-pixel match) rather than trusting a screenshot by eye.
- **`check.mjs` extended to close exactly the two gaps that let both bugs ship unnoticed**: it now also (a) loads `bumper_render.html` in a second page and asserts the same clef centering/size checks against both its intro and outro stages, and (b) asserts the LINE/SPACE and LEDGER recap icons' note-head(s) land on/between their own drawn lines within tolerance. Both are real regression tests now, not just this session's ad-hoc verification — **run `check.mjs` and get a clean PASS before shipping any future edit to either file.** (Minor gotcha hit while writing the icon check: a `rotate(-16deg)` note head's axis-aligned bounding-box height is ~36px, not its unrotated ~27px — a classification filter with too tight an upper bound silently excluded it.)

**Round seven (2026-07-28) — the CSS-hand-coded clef saga ended by switching to VexFlow, a real music-engraving library:** after the round-six bumper bass-clef fix still shipped "enormous" (a bad eyeball call on a box-height ratio, not caught before delivery), Andrew asked for a fundamentally different, token-efficient, hands-off workflow rather than another round of pixel tuning. Rebuilt the whole notation-rendering layer:
- **`video-pipeline/notation.js`** — the one and only place VexFlow is used. `renderNotation(containerEl, {clef, notes, showClef, hideStave, width, height, color})` draws a stave/clef/notes into an SVG via VexFlow's `Factory`/`EasyScore` API. Notes are plain pitch strings (`'b/4'`, `'a/5'`) — VexFlow places them on the correct line/space and draws ledger lines automatically, because it's built on real notation rules. This eliminates the entire bug class (clef size/centering, note position, ledger placement) **by construction**, not by measurement.
- **`video-pipeline/storyboard_data.js`** — the actual "storyboard step" Andrew asked for: every piece of notation in the video declared once, in one place, as plain pitch names. Both `video1_main.html` and `bumper_render.html` render from this file instead of hand-coding CSS. One edit here changes the note everywhere it's used.
- **`video-pipeline/storyboard_preview.html`** — a static page that renders every `STORYBOARD` entry as a labelled grid, no audio/video/Playwright involved. Open it and look BEFORE spending any tokens on TTS or rendering — this is the actual token-savings mechanism, catching notation problems at the cheapest possible point instead of after a full render.
- `check.mjs` was rewritten to drop all pixel-geometry assertions (clef centering/size ratios, note-position-vs-stave-line offsets) — meaningless now — replaced with a simple "did VexFlow actually render an SVG into this container" structural check, plus the unchanged BEATS/timing/reachability checks (never the buggy part).
- Retired entirely: `.stave`, `.clef`/`.clef-treble`/`.clef-bass`, `.note-glyph`, `.ledger`, the `ICON_*` string-template constants, and the Python ink-pixel-scanning scripts from earlier rounds.
- **Real gotchas hit building this, worth knowing before touching `notation.js` again:** (1) VexFlow's EasyScore note-string syntax is `"e4/q"` (letter+octave, no slash, then `/duration`) — NOT the StaveNote key format `"e/4"` that the public `notes` API uses; the function converts internally. (2) VexFlow's `Stave`/`System` `y` parameter is NOT where the first line lands — it always reserves a fixed ~40px above `y` for a clef/key-signature area even when unused, so first line renders at `y+40`; line spacing is a fixed 10px regardless of width/height (glyphs don't scale to fill a bigger box), so very small containers (<~150-200px tall) will clip unless `y` and `height` are sized generously — verify with a real bounding-box check (`el.getBBox()` on visible, non-`opacity:0`, non-`display:none` children), not eyeballing. (3) Mascot positions (`.mascot-barnaby` etc.) tuned in earlier rounds were calibrated against the old, much-larger hand-coded clef glyphs — after switching to VexFlow's more modestly-sized default clef, those positions needed to move back closer to their original pre-saga values, otherwise the mascot visually collides with the now-smaller clef.
- Video1 was fully re-rendered on the new system and spot-checked directly against the delivered mp4 (not just the live page) — bass clef, treble clef, and the ledger-line note all confirmed correct in the actual output.

**Round eight (2026-07-28) — post-launch polish, then video 1 frozen:** Andrew's reaction to the VexFlow rewrite was "FAR better," with three refinements:
- **Scene 2's line-by-line stave-counting animation had gone silent** — a real regression from round seven: `.stave`/`.stave-line` CSS was deleted as "retired," but scene 2 (a separate, intentionally hand-coded "count the 5 lines with me" moment, out of scope for the VexFlow migration) used those same class names and lost its styling as a side effect. Restored the CSS, now with a comment explaining scene 2 is deliberately hand-coded and not dead code.
- **Staves were too long relative to their content** ("tiny note at one end") — VexFlow's `System`/`Stave` width directly controls stave line length, so narrowed it per scene (280px for single-clef/single-note scenes, 340px for scene 6's two-note case) instead of spanning near the full frame.
- **"Make it bigger" required a new `scale` option on `renderNotation()`** — VexFlow's line spacing (fixed 10px) and clef/note glyph sizes are fixed pixel values that do NOT grow with width/height, so a bigger container alone doesn't produce a bigger graphic. The fix: render at the normal internal size, then stretch the SVG's CSS width/height beyond its viewBox (`svg.style.width/height = internalSize * scale`) — scales everything (clef, stave, notes, strokes) proportionally. Container CSS must be sized to match the *scaled* footprint, not the pre-scale one, or the centering transform centers the wrong box and the mascot collides with the bigger clef.
- **Video 1 is now frozen** — Andrew's explicit instruction, no further changes without a new request.

**Open item for video 2:** narration intonation on the Studio voices (`en-GB-Studio-C`/`-B`) isn't always perfect — Andrew noticed but chose not to chase it on video 1. For video 2, test `<emphasis>` and `<prosody rate/pitch>` SSML tags live against these voices before relying on them (same "verify, don't assume" lesson as `<mark>`, which silently doesn't work on Studio voices) — and watch intonation more closely during review this time rather than after the fact.

**Game completion + progress tracking (2026-07-28):** a reviewer flagged that the 11 nugget games (all in `music/`, one HTML file each) never actually finish — 3 difficulty stages exist per game but clearing one just loops/replays, no end-state, no visible sense of progress. Built `music/game-progress.js`, a third shared self-injecting module (same one-include convention as `reward-system.js`/`auth.js`): a game counts as "complete" once all 3 stages are cleared at least once, reusing each game's existing streak-based `triggerStageComplete()` trigger as the checkpoint rather than inventing a new mechanic. Progress persists per game in localStorage (`tga_game_progress`), shows as a small 3-star widget bottom-left in-game, and fires a one-time "Game Complete" modal the first time all 3 stages are done (re-triggering afterward is a safe no-op). `music_arcade.html` (the hub/launcher) reads the same storage to show a "✓ Complete" or "Stage X/3" badge on each game's tile. All 11 games wired in one pass; verified live in-browser (widget render/update/persist, one-time modal, hub badges) since this repo has no automated test suite for the HTML games. Committed as `b7dd64c`.
- **Two pre-existing gaps found during this work:** `line_and_space_safari.html` never included `reward-system.js` at all (the animal-reward loop silently never ran in that one game) — flagged as a background task (`task_bf47bb8d`), not yet actioned as of 2026-07-28, check status before assuming fixed. The other gap — `music_arcade.html`'s hub only listing 3 of 11 real games — was folded back into this same session and fixed directly (commit `17cc261`): all 11 real games now have hub entries (title/description/emoji pulled from each game's own on-page heading, distinct accent colors), the 3 "coming soon" placeholders (ear_island/circle_fifths/sandbox_piano — no backing files, intentional) left as-is.
- **Desktop launcher added (2026-07-28):** `~/Desktop/Music Arcade.command`, matching the existing `Tower Clash.command`/`Seven Suppers.command` convention already on Andrew's Desktop — spins up a local no-cache Python server on port 8935 (these game files have no ES modules/build step, so `file://` would likely work too, but matched the established safer server-based pattern rather than assume) and opens `music_arcade.html`. Double-click to launch; closing the terminal window stops the server.

**Reward-animal overhaul (2026-07-28, commit `638398a`):** Andrew asked for the reward mechanic (pick-an-animal, build-it-piece-by-piece in `reward-system.js`) to be reworked: pick the animal eagerly (before the first question, not lazily on first correct answer), build it from 8 parts instead of 5 (added distinct arms/eyes/nose/mouth), grow the widget to fill more space, and auto-advance the game's difficulty stage when an animal completes (new `RewardSystem.onAnimalComplete(callback)` hook, wired into all 11 games). Also finally closed the `line_and_space_safari.html` gap flagged in the previous round — it now has the full reward-animal loop, with its own 2-stage cap (`onAnimalComplete`/`GameProgress.stageCleared` both pass `2` explicitly, since it's the one game with 2 stages not 3 — `game-progress.js` had `totalStages` hardcoded to 3 and was generalized to take it as a parameter, fixing `music_arcade.html`'s stage-count badge for this game too).
- **Widget sizing bug caught during live verification, not by the user:** the first "bigger" pass hardcoded 260x260px, which looked right on a desktop-width viewport but badly overlapped gameplay (piano keys, buttons) at phone width (375px) since the widget is `position:fixed` to the viewport corner, not scaled to the game card. Fixed with `clamp(120px, 26vw, 260px)` plus percentage-based border-radius/svg-sizing, so it's fully big on desktop and shrinks to a non-intrusive corner badge on narrow viewports. **Always check a "make it bigger" fixed-position widget change at mobile width too, not just desktop — this class of bug won't show up on a normal desktop screenshot.**
- **Confirmed Claude_Browser MCP tool caching gotcha again, now the second time it's cost real debugging effort:** the tool caches external `<script src="...">` resources in a way that ignores `Cache-Control: no-store` from even a custom no-cache Python server, and does NOT invalidate on the containing page's URL changing — only a cache-busting query string on the `<script src>` attribute itself forces a genuine reload. Hit this again mid-verification (a `RewardSystem.onAnimalComplete` check returned `false`/`undefined` on a freshly-edited file until the script tag itself was cache-busted). **Standing rule for this project: whenever iterating on a shared `.js` file (`reward-system.js`, `game-progress.js`, `auth.js`) and testing changes live in the Claude_Browser tool, bump a `?t=` query on that file's own `<script src>` tag for each test round, then revert to the clean tag before committing** — don't trust a plain page reload/navigate to pick up JS changes.

**Four new games added (2026-08-05/06), a paired naming+keyboard set:** Andrew asked for games teaching the classic space-note mnemonics, naming only for the first pair and piano-key-finding for the second, both explicitly 2-stage (spaces, then the lines around them) rather than the usual 3:
- `space_face.html` ("Space Face") — treble clef, spaces F4/A4/C5/E5 spell FACE (stage 1), lines E4/G4/B4/D5/F5 spell EGBDF (stage 2). Naming via fixed-order letter-quiz buttons (reused `clef_detective.html`'s quiz pattern).
- `moo_clef.html` ("Moo Clef") — bass clef, spaces A2/C3/E3/G3 spell ACEG "All Cows Eat Grass" (stage 1), lines G2/B2/D3/F3/A3 spell GBDFA (stage 2). Same quiz pattern, Barnaby mascot.
- `face_finder.html` ("Face Finder") — same treble note set as Space Face, but found on a real piano keyboard (fixed C4-C6 range, Middle C labelled) instead of named via buttons. Keyboard-render/tap code reused from `stave_piano_explorer.html`.
- `moo_keys.html` ("Moo Keys") — same bass note set as Moo Clef, piano keyboard fixed C2-C4 (Middle C labelled at the *right* end this time, since the range sits below it).
- **New shared UI element, not previously in this codebase:** a "mnemonic strip" — a persistent row of letter tiles (e.g. "F A C E") shown throughout each stage as a memory-aid legend, with the matching tile popping/glowing briefly on a correct answer. Deliberately shown before answering too (it's the whole word, not the specific answer, so it teaches the pattern without giving away any individual question). Present in all 4 new games; not yet added to any of the 11 original games — worth considering if Andrew likes the pattern.
- All 4 registered in `music_arcade.html`'s `GAMES` array (violet/amber/blue/red accents respectively, none reused from the 11 existing games' colors). `GP_TOTAL_STAGES = 2` set explicitly in all four (matching `line_and_space_safari.html`'s precedent for a non-default stage count).
- **Verified live in-browser, all 4 games individually**: staff/keyboard rendering correct, full answer loop tested with a real interaction (not just a load-and-screenshot) — correct-answer path confirmed to update score/streak, play a tone, trigger `RewardSystem.correct()` (animal-picker + widget appeared), pop the mnemonic tile, and advance to a new round with a properly-positioned note. Zero console errors across all four.
- **Tool gotcha hit during verification, not a code bug:** the Claude_Browser pane's screenshot capture became unreliable specifically when the page was scrolled (via either `scrollIntoView` or the `scroll` action) on `music_arcade.html` — repeatedly returned a blank white image on both the original tab and a freshly-opened one, while direct DOM queries (`getBoundingClientRect()`, text content, href attributes) on the exact same scrolled state confirmed the content was genuinely present, correctly sized, and correctly positioned. Screenshotting the unscrolled top of the same page worked perfectly. If this recurs, trust DOM assertions over a stubbornly-blank screenshot rather than assuming a real rendering bug — but do get at least one successful screenshot (even unscrolled) as a sanity check that the page loaded at all.
- Committed `2c65039`, pushed, live at the usual `andrewlord311-sudo.github.io/Andrew_Game_Apps/music/music_arcade.html` Pages URL.

**How to apply:** when Andrew mentions "the music apps," "Nuggets," or asks about a specific game by name, check `Nuggets ideas.md` for its built/status and open feedback first rather than re-deriving from scratch. For the video spinoff specifically, check `voice_samples/` and the vault docs above for current state before re-planning from zero. **For any future video's notation: add entries to `storyboard_data.js`, open `storyboard_preview.html` and look, THEN wire up audio/timing/rendering — never hand-code a clef/note/ledger-line in CSS again, and never spend tokens on Playwright/ffmpeg before the storyboard preview has been eyeballed.** **For any future `.js` shared-module edit tested live via Claude_Browser: cache-bust the script tag's own `src`, not just the page URL — see the caching gotcha above.**

## Memory: project-nugget-video-template

Andrew flagged this as **the next area of development** (2026-09-03) and then
said *"Save this thinking. Let's come back to it. Question 1 is the key one
for me."* So this is a **parked design proposal**, not a green-lit build.

## What Andrew wants

Extend the [[project-home-video]] idea into making the "Melody & Barnaby's
Music Nuggets" YouTube videos (see [[project-nuggets-music-apps]]). Explicitly
**not** DaVinci Resolve / commercial NLEs — *"too complex and too high
friction."* Goal: **define a video template precisely once, reuse it over and
over with different text**, so authoring a new video is a home-written Python
workflow, not a timeline edit.

## ElevenLabs switch status — essentially not started (my finding 2026-09-03)

- Every narration file that exists is **Google Cloud TTS** — `en-GB-Studio-C`
  (Melody) / `en-GB-Studio-B` (Barnaby). Video 1 is fully built with these.
- Vault `Nugget Videos - Resources.md` still says *"AI voice provider —
  decided: Google Cloud Text-to-Speech."*
- Around 6-11 Aug 2026, `Andrew_Game_Apps/.env` gained `ELEVENLABS_API_KEY`
  and `ELEVENLABS_MELODY_VOICE_ID` (no Barnaby ID), and the README was
  reworded to "generated with ElevenLabs."
- But: **no ElevenLabs audio generated, and NO TTS/generation script anywhere
  in the repo** for either provider — the Google narration was made by ad-hoc
  API calls in a session, never scripted. Nothing changed since 28 Jul 2026.
- So the "switch" = a decision written in a README + half an API key. It is
  genuinely greenfield.

## Proposed shape (mine, for when we resume)

The existing `Andrew_Game_Apps/video-pipeline/` is **already** a scripted
HTML-scene -> Playwright-capture -> ffmpeg-mux pipeline, and
`storyboard_data.js` already pulls notation content out into data. The only
bespoke part is `video1_main.html` (138 KB, hand-authored scenes + a `BEATS`
timeline hand-computed from real narration durations). That is the friction.

Fix = **template + data split**:
- **one `template.html`** holding the whole visual vocabulary as reusable
  scene types (`draw-stave`, `draw-clef`, `note-appears`, `mascot-line`,
  `term-flash`, `recap-montage`, ...). Never edited per video.
- **a `video.yaml`/`.json` per video** — a list of scenes:
  `{speaker, scene-type + params, on-screen text, narration line}`. This is
  all Andrew writes for a new video.
- **a Python app** that: generates narration per line -> measures each clip's
  real duration -> drives `template.html` scene-by-scene for exactly those
  durations -> Playwright records -> ffmpeg concatenates + muxes narration +
  music bed + intro/outro bumper + writes `.srt` captions.

**New sibling tool, NOT an extension of `home-video`'s `make.py`** — `make.py`
concatenates *existing* media; this *renders generated animation* from a spec.
Different jobs. But share the philosophy (pure plan-builder + ffmpeg arg-lists
+ tests + offline + run-by-hand) and reuse `render.py`'s music-bed / concat /
mux helpers. **Keep the browser for rendering the scenes** — ffmpeg alone
can't animate a stave drawing itself or a clef stroke-by-stroke; `drawtext`/
`zoompan`/`xfade` only get you slides + captions + Ken Burns + crossfades.

**UPDATE 2026-09-03: the browser-rendered-scene engine now exists** as
[[project-family-reel]] (`template.html` + `capture.mjs` + pure
`scenes.py`/`render.py`, 63 tests). Built standalone for the kids' highlight
films; it's the pattern to generalise for the Nuggets videos when Q1 is
settled — read that repo first rather than starting from `video-pipeline/`.

DaVinci verdict: Andrew's instinct is right *for this case* — NLEs win for
one-off creative edits, lose for "many videos, one format, different words."

## Open design questions — Q1 is the blocker Andrew cares about

1. **TTS provider — Google Cloud TTS (works, ~free at this scale) vs
   ElevenLabs (why? monthly non-rollover credits).** The narration step of the
   tool is built around whichever. *Nothing proceeds until Andrew decides.*
   Worth surfacing: the switch to ElevenLabs was never justified in writing —
   ask what's driving it (voice quality, presumably) before spending effort.
2. How much of `video1_main.html`'s animation to generalise vs start the
   scene-type library fresh — read it in full first.
3. Where it lives — inside `Andrew_Game_Apps/video-pipeline/` (keeps the
   notation-render code adjacent) or its own repo like `home-video`.
4. Scope of scene types for v1 — just enough to rebuild Video 1 from a
   `video.yaml`, then grow as later videos need it.

## How to apply

When Andrew returns to "the video maker" / "the Nuggets videos" / "the next
area of development," resume from here. Do not build until Q1 is answered.
Relevant existing knowledge: [[project-nuggets-music-apps]] (VexFlow notation
layer, `storyboard_data.js`, `check.mjs` QA gate, Studio voices don't support
SSML `<mark>`), [[project-home-video]] (the plan/render/test structure to
mirror).
