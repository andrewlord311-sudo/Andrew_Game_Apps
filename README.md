# Andrew_Game_Apps — Tiny Games Arcade

Music-teaching games for children (the **Nuggets** series), plus a small
arcade of unrelated fun pages and the pipeline that renders the YouTube
videos. Plain HTML and JavaScript, published straight to GitHub Pages.

**Live:** https://andrewlord311-sudo.github.io/Andrew_Game_Apps/

## Layout

| Folder | What it is |
|---|---|
| `music/` | The music-teaching games. `music_arcade.html` is the hub. |
| `fun/` | Unrelated one-off games, not part of the Nuggets series. |
| `video-pipeline/` | Renders the YouTube videos — Playwright records each HTML scene, ffmpeg muxes the audio and concatenates. |
| `videos/` | Rendered output. |
| `voice_samples/` | Narration audio, generated with ElevenLabs. |
| `assets/` | Shared images and mascot art. |
| `firestore.rules` | Pupil-tracking security rules — paste into the Firebase console. |

## The games

Note reading and keyboard orientation, mostly: `stave_explorer_game`,
`line_and_space_safari`, `clef_detective`, `space_face`, `face_finder`,
`moo_clef`, `moo_keys`, `higher_lower_same`, `black_key_patterns`,
`c_hunt`, `alphabet_elevator`, `finger_numbers`, `name_that_part`,
`meet_the_mascots`.

Shared behaviour lives in `game-progress.js` (progress), `reward-system.js`
(the reward loop), `auth.js` (pupil PIN) and `back-link.js`.

## Pupil tracking, and its deliberate limit

Progress can be recorded to **Firestore** so a teacher can see how a pupil is
doing. `firestore.rules` is intentionally low-security, and the header comment
in that file says why: the PIN is a "make sure it's really you" speed bump for
children, not an access boundary. The site is public and static, with no server
to sit behind.

**Never put anything beyond first-name-level information in `pupils` or
`events`.** These are other people's children.

## Video pipeline

Requires `npx playwright install chromium` and ffmpeg. Two gotchas already paid
for: narration is generated at 24 kHz mono while music bumpers are 44.1 kHz
stereo, and concatenating mismatched audio silently corrupts playback — so
normalise every segment (`-ar 44100 -ac 2`) before muxing. And scene timings
come from the real narration durations, not the storyboard's estimates.

ElevenLabs credits are monthly and **do not roll over**.

## Related

Design docs live in the vault under `Claude Projects/Music teaching/` —
start with `Nuggets ideas`.
