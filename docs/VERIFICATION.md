# Verification record

Date: October 7, 2026 (PC•MACs interface recreation, One File task revision 1
“Recreate the actual PC•MACs interface in the guided trainer”, prepared
October 7, 2026 at 9:27 PM UTC-07:00). Machine: Windows 11 Home 10.0.26300,
Node 25.0.0, Electron 44.6.0, Electron Forge 8.0.1.

What the deliverable is, precisely:

- **Source**: this repository (nothing staged, committed, or pushed).
- **A packaged, smoke-tested application**: `out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe`,
  rebuilt from the final source and driven through every automated scenario below.
- **An installer**: `out/make/squirrel.windows/x64/RoseflowPCMacTraining-Setup.exe` (unsigned).
  **Installing it and running the installed copy was not performed** by
  automation, because an install changes the owner's machine.
- **A CI workflow**: `.github/workflows/windows-build.yml`, unchanged, not run
  (nothing has been pushed).

## Research performed before editing

- **The linked manual**: `PCMACs_Manual.pdf` (January 13, 2021, 326 pages,
  SHA-256 `ce30eacc2500f950…`) was downloaded, its text extracted, and every
  page rendered to images. The Edit View (p. 76 and pp. 77–112), the menus
  (pp. 133–134), the Control Window (p. 201), the Soft Console (p. 116), the
  “Set to value (0 - 255):” dialog (p. 178), and GilderTerm (p. 209) were read
  at high resolution, and colours were sampled from the screenshots.
- **The application online**: gilderfluke.com returned HTTP 500 on October 7,
  2026, so its downloads page was read through Wayback snapshots (newest
  listed build: v2.1.226.000 Beta; the 2021 manual covers version 2 and is
  still the newest manual). The 2011 PC•MACs cut sheet gave a second Edit View,
  Control Window, Edit menu, and Soft Console capture; it agrees with the
  manual's layout. Gilderfluke's YouTube videos offered only low-resolution
  preview frames and no captions, so no running-app video was usable.
- **Local sources** (all present): the project-context Markdown and handoff
  ZIP in Downloads match their SHA-256 prefixes (`9803636390fe17ba…`,
  `2f6b37c7574ac63a…`); the ten reference photos are byte-identical in the
  handoff and the app; Screenshot 1 is
  `one-file-promot-float-lab/assets/screenshot-fe683692eeab45c28a12a4ef19c3800e.png`.

The resulting evidence map, adaptations, and gaps are in
`docs/REFERENCE_FIDELITY.md`.

## What changed in behavior

- The simplified workspace (eight one-second blocks, a command slider, and
  readouts) is replaced by recreations of the PC•MACs windows: the menu bar,
  the **Edit View**, the **Control Window**, the **Soft Console**, the
  **“Set to value (0 - 255):”** dialog, and a corrected **Terminal - COM3**.
- Show data is per frame, as PC•MACs stores it: 240 frames for the 8-second
  training show at 30 frames per second, four analog axes and two digital
  lights.
- Practice happens in those windows: select by dragging along a channel or
  typing the selection times, Edit ▸ Set Digitals On/Off and Set Analogs to a
  Value, RightClick-and-slide drawing, the shortcut menu (Play Selection and
  others), Time In / Time Out, Play / Stop / Pause and the time sliders,
  Manual mode with the Soft Console, and the terminal keys.
- Items the trainer does not simulate are still shown as the manual
  photographs them; using one explains that in a trainer note under the
  windows.
- Trainer-only parts (the simulated float, measurement model, hypothetical
  calculators, the terminal key box, lesson panel, help) are outside the
  recreated windows and keep the plum trainer styling.
- Clickable help no longer needs ? buttons inside the recreated windows: press
  Help ?, then click any control (“What's this?” mode). Hover, keyboard focus,
  and F1 still work. F1 stays the help key rather than PC•MACs' Play.
- 27 lessons, 161 steps (49 practice, 39 questions); Basic 13 lessons,
  intermediate 9, I hate my life 27. New steps: the menu bar, Manual mode,
  Time In / Time Out, Play Selection, and reading the Vel Limit column from
  photo 07. The photo practice step now checks what it asks (opening the
  photo), and a following question checks the reading.
- Progress is schema version 3; version-1 and version-2 files are migrated and
  backed up (see `docs/SETUP.md`).

## Automated checks (all passed)

### `npm test` (node --test), 85 tests

New or changed for this revision:

| Area | What is pinned |
| --- | --- |
| simulation | 240 frames; hh:mm:ss.ff and mm:ss.ff formatting; typed times parse, and times outside the show or with frames ≥ 30 are refused; digital ON spans round-trip; Set Digitals On joins spans; a drawn digital is compared with expected seconds with three frames of edge slack and the whole wrong stretch is named; Set Analogs to a Value and run-length saving; outputs follow the show while playing, the Soft Console in Manual mode (BUMP 255), and hold the frame otherwise |
| progress schema | schema is 3; default show data; ON spans that overlap, run backwards, or leave the show are rejected; analog run-lengths must cover exactly 240 frames of 0–255; console must be four bytes; **version-1 → 3** (blocks 2–3 become Light 1 frames 60–120; command becomes the axis's console value); **version-2 → 3** keeps location, learning, and every record, converts blocks 2, 3, 5 to [[60,120],[150,180]] and command 100 on axis 2 to console [128,128,100,128], records the migration note, and keeps an earlier v1 note; refuses unusable v2 settings and locations |
| progress store | v1 file migrated and backed up as `progress.v1-backup.json`; **v2 file migrated and backed up byte for byte as `progress.v2-backup.json`**; after one save the file is version 3 and is not migrated again |
| exercises | Light 1 must be ON 2–4 s only, naming the wrong stretch in hh:mm:ss.ff and the Edit menu command that fixes it; Play / Stop; the Axis 2 slider must be 128 and the slider of another axis is named |
| PC•MACs recreation | menu bar order matches the manual's p. 76 capture; the Edit menu has all 27 items with the manual's shortcuts; every simulated menu item, shortcut, and shortcut-menu entry dispatches an action the controller handles, and has help; F1 is not taken from help; every practice trigger and setup action, and every demonstration action, is one the controller handles (read from `app.mjs`); the photo step and its follow-up question |

Unchanged areas (lesson flow, levels, content with 72 controls, handbook,
search, terminal, links) still pass.

### `npm run smoke` (hidden Electron window), 145 checks in 7 scenarios

Run against the development app and, separately, against the packaged
executable, each with a fresh throwaway user-data folder. The window is never
shown, so nothing takes focus, keyboard, or clipboard; pointer and focus events
are synthetic and dispatched only to the hidden page.

| Scenario | Checks |
| --- | --- |
| first (60) | ES modules load under the CSP; identity text; Home lists exactly Basic, intermediate, I hate my life; first lesson at “Step 1 of 5” with only the PC•MACs frame revealed; the menu bar reads as in the manual; the Edit View is titled “Edit View”; question feedback; lesson finish recorded and mirrored. “Reading the timeline”: Control Window and Soft Console not yet revealed; the Set Digitals demonstration runs and leaves Light 1 unchanged; practice starts from all OFF; Edit ▸ Set Digitals On is greyed with nothing selected; **a real RightClick-and-slide on the digital row draws Light 1 ON 4–5 s** and gets “ON from 00:00:04.00 to 00:00:05.00, where it should be OFF”; Next stays locked; RightClick-and-slide undraws it; **LeftClick-and-slide selects Light 1 for 5–6 s**; **clicking Edit ▸ Set Digitals On** passes with “Exactly right” without advancing; the highlight is on the digital pane; Back/Next keep the count; the next step reveals the Control Window with Stop drawn as the current mode. Handbook search and return; help dialog; **Help ? then clicking Play explains Play without playing**; tooltips on focus and hover; playback at 30 frames a second with Play drawn as current; save writes schema 3 with the lesson location, finished steps, the Light 1 span [[150,180]], axis 2, and console value 100; zero network requests; zero console errors |
| resume (16, real relaunch) | Continue names the lesson and step; the Light 1 span, axis 2, and console value restored; playback stopped; Start over confirm/cancel/clear |
| malformed (8) | garbage file moved aside, fresh start, visible notice |
| savefail (9) | simulated write failure reported, work kept in memory |
| legacy (15) | a version-1 file migrated, backed up, records kept, steps pre-marked, file rewritten as schema 3 |
| legacy2 (14) | a version-2 file (mid-lesson, blocks 2, 3, 5, axis 2 at 100) migrated and backed up as `progress.v2-backup.json`; finished lessons and steps kept; Light 1 [[60,120],[150,180]]; axis 2 console 100; Continue reopens the saved step; first save writes schema 3 and keeps the note; a finished-step key for a retired step is kept; Home explains the version-2 update |
| practice (23) | Set Analogs to a Value refused with its reason when nothing is selected; **the “Set to value (0 - 255):” dialog** opens and OK sets Axis 0 to 255 for 1–3 s, passing the step; **RightClick on empty space opens the shortcut menu with the manual's items**, and Play Selection moves Start/Stop to 00:00:05.00 / 00:00:06.29, passing the step; a two-stretch Light 2 pattern names the missing stretch from 00:00:06.00, then passes; the measurement practice sets up Manual and 192 and passes when paused under 10 points; moving the wrong axis's slider is named, **the real Axis 1 slider at 64** passes; the 128-vs-0 diagnosis passes; in Manual mode console button 1 lights the Light 1 lantern; clicking Axis 2 DMX 8 leaves the card's terminal arrow alone; **an open menu's items and the terminal's lines are the same elements 0.4 s into playback** and RealTime ▸ Stop and a terminal line both respond; a step passed by a terminal key is on disk before Next; the photo 07 reading 7.00 is accepted |

### Screenshots (`node scripts/smoke.mjs --shots <dir>`)

Captured from the hidden 1440 × 900 window and compared with the manual's
captures and photos 06–07: Home; the Basic map; the first step; the timeline
practice with a drawn span and a selection; the Edit menu open; the Edit View
with an analog selection; the “Set to value (0 - 255):” dialog; the Control
Window with Manual highlighted; the terminal lesson; the handbook; help; the
round-trip assignment with all windows; the Edit View zoomed in (frame labels
2, 4 … 28 as in the manual); Progress. Fixed after review: ruler second labels
overlapping frame numbers; the blue Punch In line hiding the green Start line
at frame 0; the terminal footer losing the space after each comma (photo 07
shows “k) feedback conf, n) Next, …”); two default analog traces overlapping;
trainer wording inside the empty Edit View.

### Packaged build

`npm run make` succeeded on the final source (after the review fixes). The
seven smoke scenarios were run against
`out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe`: 145 checks,
0 failed, zero network requests, zero console errors.

### Independent code review

A separate reviewer read the changed files and ran the tests. It found no
critical issues and five important ones, all fixed and covered above:

1. menus and terminal lines were rebuilt on every 30 fps tick, so clicks and
   focus were lost during playback: menu items are now refreshed in place and
   the terminal redraws only when its state changes;
2. the measurement practice checked a different error from the one on screen:
   it now uses the commanded output and says to tick Manual when it is off;
3. Resume skipped a practice step's setup, so its text could be false: setup
   actions that change only modes and views are replayed on restore;
4. selecting an analog moved the card's terminal arrow, which the real
   programs do not do: the two are now separate, and the lessons say so;
5. a step passed by some actions was not saved until Next: every passed check
   is now saved.

Minor findings also fixed: Home/End and Ctrl+A no longer act on sliders, open
menus, or the terminal; the Set Analogs practice highlights the Edit menu;
windows opened from the RealTime menu close between lessons; Show me restores
the learner's show data and stops its playback when cancelled; a lost pointer
can no longer leave a stale drawing snapshot; the round-trip Light 2 step
selects Light 2; stale on-screen text (“resumes paused”, “schema version 2”,
“version-1 file” for a v2 backup); retired step keys are kept; BUMP works from
the keyboard; menus have Left/Right, close on Tab-out, and carry
`aria-haspopup`/`aria-expanded`; the shortcut menu opens with the Menu key or
Shift+F10.

## Representative prior data

The owner's real `%APPDATA%\Roseflow PC Mac Training\progress.json` is now a
schema-2 file (saved 2026-10-07T18:19:29Z, Basic, “How a click becomes
movement” step 4). A disposable copy was migrated by the real progress store:
location, learning, and records came through unchanged, blocks 2–3 became Light
1 frames 60–120, and a `progress.v2-backup.json` was written beside the copy.
The original file was only read; its SHA-256 (`ee31bc41b7659c89…`) is unchanged.
The first launch of the new build will back it up and migrate it the same way.

## Not verified by automation (owner to confirm by hand)

- The recreated windows against the PC•MACs build on the team's laptop (its
  version is unknown; Help ▸ About PCMACS would show it). Comparison was made
  with the manual's screenshots and photos 06–07 only.
- Real mouse use: right-button drawing, drags past a pane's edge, the shortcut
  menu position, and the Soft Console sliders with a physical mouse. The
  harness used synthetic pointer events in a hidden window.
- Real keyboard focus tooltips and the Ctrl+0/1/2 shortcuts from a real
  keyboard.
- Layouts below 1440 px wide and other display scaling; reduced motion.
- Running with the network adapter physically disabled (the harness proves zero
  non-`file:` requests and the CSP forbids connections).
- Installing `RoseflowPCMacTraining-Setup.exe` and launching from the Start Menu.
- The migration of the owner's real file in place.

## Known limitations recorded honestly

- Not simulated, though drawn: Record and Rehearse, presets, triggers,
  rubberbanding, Values In / Out, the Move to OffLine and Channel List
  dialogs, clock-face menus, and most File, Offline, Channels, Preferences, and
  Help items. Each says so when used.
- What outputs do after Stop with Manual off is not documented; the trainer
  holds the frame's values and labels this as its assumption.
- No zip distributable: `@electron-forge/maker-zip` fails on Node 25 (see `docs/SETUP.md`).
- The installer is unsigned; Windows SmartScreen will warn.
