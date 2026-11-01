# Verification record — Revision 4 build, October 31, 2026

What was checked before handing the first-digital-segment build to Atalay for
review, how, and what was not checked. Companion to `FIRST_SEGMENT.md` (what
the build does) and the plan in `superpowers/plans/2026-10-31-first-digital-segment.md`.

Nothing was staged, committed or pushed. Every check below ran against the
working tree on `main`, commit `10b52d3` plus the uncommitted changes.

## Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Unit suite | `npm test` | 251 tests, 251 pass, 0 fail (after the fix pass; 245 before it) |
| Hidden-window smoke, development app | `node scripts/smoke.mjs` | `first` 100/100 · `resume` 32/32 · `malformed` 10/10 · `savefail` 11/11 · `loadfail` 10/10 · `legacy` 15/15 · `legacy2` 14/14 · `practice` 23/23 · `course` 64/64 — all pass |
| Review captures | `node scripts/smoke.mjs --shots docs/review/2026-10-31` | `course` 64/64 · `sheet` 13/13; 20 PNGs written (see below) |
| Review recordings | `node scripts/record.mjs --out docs/review/2026-10-31` | `record` 8/8; `watch-try-help-retry.mp4` (290 frames, 72.5 s) and `skip-continue-start-tickle-restart.mp4` (103 frames, 25.8 s) |
| Packaged build | `npm run package` | exit 0 → `out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe` |
| Packaged smoke | `node scripts/smoke.mjs --exe "out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe" --only first,course,loadfail` | `first` 100/100 · `course` 64/64 · `loadfail` 10/10 |

Every smoke scenario also asserts that the renderer made no network request
and logged no console error; both held in every run above.

The `course` scenario is the review flow on a fresh profile: the orientation
film (Skip>> at t=0, pause/resume, sound-enable path with audio blocked), the
hub in its three states, the existing-progress dialog, the three lessons of
the segment with their demonstrations, the "One second ON" film, a wrong
attempt (three seconds), Rosie's help (show me, typed question), the
correction and the pass, the Robot Rosie readout, and the guarded restart
(tickle, timeout, re-guard, simple confirmation, confirmed restart with the
`progress.previous-run-*.json` snapshot).

## Review Focus items (from the plan) and the tests that pin them

| # | Input the spec does not name | Pinned by |
| --- | --- | --- |
| 1 | Save written mid-legacy-lesson (schema 3) → Continue resumes that legacy lesson and says so | `tests/progress-schema.test.mjs` (migrate 3→4), `tests/hub-state.test.mjs` (unit level only; the smoke seeds are schema 1 and 2, there is no schema-3 smoke seed) |
| 2 | Restart activation at exactly the deadline → rejected; double activation never resets twice | `tests/restart-guard.test.mjs` (4.9 s, 5.0 s, 5.1 s, double activation); smoke `resume` (two activations of the simple confirmation reset once) |
| 3 | Correct one-second event on Digital 1 instead of Digital 0 → "wrong channel", never a pass | `tests/digital-task.test.mjs`; smoke `course` |
| 4 | No speech voices / suspended `AudioContext` → film runs on captions with a sound-enable control | `tests/cue-player.test.mjs` (narrator reports `spoken: false`), smoke `course` (`roseflowDebug.audioBlock`: the orientation film's and a lesson film's Turn sound on) |
| 5 | Skip>> inside the first 300 ms → hub at once, audio stopped | smoke `course` (skip as soon as the renderer is ready; the sting is guarded in code and not observable in the harness) |

## Looked at by eye

### The brief's twelve images

All twelve PNGs in the Revision 4 ZIP (SHA-256
`3ae700f0…2eeb7`, extracted to a scratch directory; the HTML companion was
checked for script tags — none — and not executed) were opened and viewed:

| | Image | Used for |
| --- | --- | --- |
| A | Current mascot render | Baseline for the 3D Rosie changes |
| B | Rounded green flower body sheet | Torso, capsule arms, round feet in `guide/rosie-model.mjs` |
| C | Expressive robot faces | Robot Rosie's eye lamp and readout mood |
| D | Robot poses | `guide/robot-model.mjs` proportions |
| E | Duolingo-style owl expressions | Reference for the speaking variants and glints |
| F | 24-face expression chart | `EXPRESSION_FAMILIES` in `guide/face.mjs` (six families × four) |
| G | Existing homepage screenshot | What the hub replaces |
| H | 1949 Rocking Horse | Archive photo, film beat and hub print |
| I | 1978 Grin and Bear It | Archive photo |
| J | 2024 Shock n' Roll | Archive photo |
| K | 2025 Nessie's Lakeside Laughs | Archive photo (the hub's print) |
| L | 2026 Jungle Jumpstart | Archive photo |

H–L are bundled byte for byte (hash-checked against `asset_sources.json`).

### Captures in `docs/review/2026-10-31/`

Screens: `intro-0-leader`, `intro-1-campuses`, `intro-4-photo`,
`intro-6-timeline`, `intro-7-ready`, `hub-fresh`, `hub-in-progress`,
`course-map`, `lesson-orientation-step1`, `film-playback-on`,
`practice-help-menu`, `practice-try-robot`.
Contact sheets: `expressions-faces.png` (29 names, silent and speaking),
`expressions-rosie-3d.png`, and six 3D crops (`rosie-joy`, `rosie-laughter`,
`rosie-grief`, `rosie-rage`, `rosie-terror-glasses`, `rosie-nerdy-glasses`).
Recordings: the two MP4s above, with their frame folders.

Frames from both recordings were spot-checked (film beat with the staged
mistake and the demonstration cursor; the "Your turn" bubble after the wrong
attempt; the pass; the existing-progress dialog; the first lesson after a
confirmed restart).

Known capture artifact: the hidden smoke window freezes CSS animations
mid-frame, so animated elements can look ghosted in a PNG. The real window
does not do this.

## Not verified here — needs a person

- **Audio was never listened to.** Smoke mode builds the audio engine with no
  speech and no `AudioContext`, so no run above reached a speaker. The
  narrator is whichever local speech voice Windows offers (`pickVoice`
  prefers the masculine Microsoft voices), not a recorded actor; the music
  and chirps are synthesized plans. Play the film once on a speaker.
- **Photo rights.** H–L ship with their credits; `SOURCES.md` says the
  redistribution licence is not established. Keep the repository private
  until that is checked.
- **The three open decisions** are implemented as labelled interims and are
  Atalay's to make: Robot Rosie mapping (petals), Show-me on an isolated
  copy, questions answered locally only.
- The packaged build was exercised only through the hidden-window harness
  (`first`, `course`); nobody opened the installed window by hand.
- Visual judgement of the 3D Rosie, the hub and the film is the owner's; the
  captures above are what to look at first.

## The final review and its fix pass

A fresh-context reviewer read the whole working tree against the brief and
the plan. Its two Critical and eleven Important findings were fixed in one
pass, each with a test that pins it (unit tests first where the logic is
pure; hidden-window smoke checks for the rest), then the whole suite and
every smoke scenario were re-run. In short:

- "Show me" during practice no longer wipes the attempt: the snapshot now
  covers the selection, view, names, baseline and last playback, nothing is
  re-applied over it, and a save made during the film stores the attempt.
- "Continue training" in the guarded restart dialog now closes it.
- The watch → try handoff opens the practice in its try beat (no second
  Watch; "Click mascot to get help" is there from the start).
- The segment names its channels in every step's setup; the archive lessons
  get "Light 1 Digital" back.
- The orientation film waits (at most 600 ms) for the sound to come up, so
  its first line is narrated; a Skip>> during loading no longer leaves the
  session silent; a lesson film with blocked audio offers Turn sound on.
- The Sound settings survive a slider drag (preview without rebuild) and a
  rebuild (the disclosure stays open); preference saves are serialized.
- A cue cut short by Skip>>, Replay, Back or Home performs nothing more.
- Editing the show makes the last playback stale, so a stale preview never
  passes the check.
- Her bubble slides up past the target instead of covering Check / Next and
  Play on the practice screen.
- A progress file that cannot be read (locked, unreadable) is reported, both
  hub buttons are disabled, nothing is saved over it, and "Try reading again"
  recovers.
- The simple-confirmation restart cannot run twice; the page behind the
  guarded dialog stays inert through its rebuilds.
- A save made during the orientation film is valid (it points at the hub).
- The existing-progress dialog no longer says "Last worked on: unknown".

The harness now uses silent stand-ins for the speech engine and the audio
context, so narration is observable: the first line of the film is asserted
to be narrated, not only captioned.

## Deferred minors from the final review

Reported by the reviewer, judged cosmetic or out of the first-five-minutes
path, and left for a later pass (listed in the ledger):

- The Edit View's hover-name label keeps its last text until the pointer
  moves again (visible as "Digital 0" beside "Light 1 Digital" rows in
  recording two, frame 0103).
- Resume re-baselines on the restored show (`snapshot-baseline` is a safe
  setup action).
- Cue player: `stop()` zeroes `inFlight` while a perform may still be
  pending; `resume()` uses `minMs` rather than the caption duration when
  narration finished before the pause. Neither is reached by today's films.
- No narration timeout; a stuck utterance stalls its beat (Skip still
  works). `speech.resume()` is not called in `cancelNarration`.
- The third timeout line repeats the first (the brief's table contradicts
  its own no-repeat rule; the alternation stands).
- During tickling, focus moves to Continue training.
- The five-second window opens on a fixed 700 ms timer, not when she has
  visibly cleared the button.
- Question classifier: a single-word basic key beats an advanced key; the
  `calibrat` prefix key never matches under whole-word matching; the
  attempt is not used in answers.
- The Channels demonstration only opens and closes the menu.
- The help popover persists across navigation until closed.
- Robot preview: the ON hum loop runs at display rate; after a lost WebGL
  context the 2D fallback draws nothing.
- The cinema's drag uses fixed row pixels duplicated from the Edit View.
- `scripts/record.mjs` breaks on paths with spaces.
- `PROGRAM_FACTS` and the photos' source-page links are never shown.

## Reproduce

```
npm test
node scripts/smoke.mjs
node scripts/smoke.mjs --shots docs/review/2026-10-31
npm run record            # needs ffmpeg on PATH
npm run package
node scripts/smoke.mjs --exe "out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe" --only first,course
```
