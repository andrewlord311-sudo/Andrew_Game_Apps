# Andrew_Game_Apps

Context carried over from Claude's memory on the Mac:

@CLAUDE-context.md

## Key docs (read these before re-deriving anything)
**Topic:** "Melody & Barnaby's Music Nuggets" -- the music-teaching games (`music/`) and their paired YouTube videos (`video-pipeline/`, `videos/`).

**Vault:** Second Brain (`andrewlord311-sudo/andrew-second-brain`). In the cloud, attach it with `add_repo` if it isn't in the session; it's cloned to `/home/user/andrew-second-brain`. Paths are below `Claude Projects/Kids learning/Music teaching/`:
- `Music teaching.md` -- front door
- `Nuggets dashboard.md` -- status of every video and game
- `Curriculum map.md` -- the plan
- `Games/Nuggets ideas.md` -- game status and feedback (canonical); `Games/Nugget scoping.md`, `Games/Reward system.md`
- `Videos and channel/Channel launch plan.md`, `Nugget Videos - Storyboards.md`, `Nugget Videos - Resources.md`, `Video scripts/`

**Cross-project:** `Claude Projects/Project Index.md` and `How my apps work.md` in the same vault.

**Lord Family vault** (`the-lord-family/obsidian-vault`): no notes for this project live there. Don't add family/Laura material here.

## Video pacing (read before touching a Nugget video)
Children's videos must never rush. Rules, history of complaints and the workflow are in the `video-pacing` skill (`~/.claude/skills/video-pacing/SKILL.md`). Run `python3 video-pipeline/v2/pacing_check.py <video>` after building any timeline, and use `build_timeline.py <video> --dry` for a free silent preview before voicing.
