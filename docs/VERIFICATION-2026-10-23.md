# Verification record: Rosie, the guide, and the simplified trainer

Date: October 23, 2026. One File task revision 1, “Simplify the trainer and
add a Rose Float mascot guide”, prepared October 23, 2026 at 1:55 PM
(UTC-07:00); its revision line was checked before any change. Machine:
Windows 11 Home 10.0.26300, Node 25.0.0, npm 11.6.2, Electron 44.6.0,
Electron Forge 8.0.1.

What the deliverable is, precisely:

- **Source**: this repository, with nothing staged, committed, or pushed, as
  the task requires. The One File task file, the staged originals under
  `one-file-promot-float-lab/`, and the October 7 verification record are
  untouched.
- **Design and plan**: `docs/superpowers/specs/2026-10-23-rosie-guide-design.md`
  and `docs/superpowers/plans/2026-10-23-rosie-guide.md`. The owner asked for
  the task to be implemented as written, so the design decisions are the
  implementer’s and are recorded there; each is reversible in one place.
- **Sources and the mascot’s basis**: `docs/GUIDE_DESIGN.md`.
- **A packaged build**: see “Packaged build” below.

## Research performed before editing

- **Training-app design**: Nielsen Norman Group on progressive disclosure and
  on onboarding tutorials versus contextual help; secondary analyses of
  Duolingo’s onboarding, lesson size, feedback, and mascot (Appcues /
  ReallyGoodUX, UX Planet, a NextLeap teardown) and Duolingo’s own archived
  2021 home page; Pendo and Rapidnative on progressive onboarding. What each
  established and how the trainer applies it is tabulated in
  `docs/GUIDE_DESIGN.md`.
- **The Rose Float logo**: the program’s own site header (rosefloat.org,
  “RoseFloat Logo 2026 fully transparent.png”) and the English Wikipedia file
  `Cal_Poly_Pomona_Rose_Float_logo.svg` (owner CPP Rose Float, source
  cpprosefloat.org, 2011) were both fetched and viewed; they agree on the
  design (red rose, green serrated leaves, thorned stem, rounded-square green
  badge, “CAL POLY / ROSE FLOAT / SINCE 1949”). The downloaded copies are not
  in the repository. Rosie is an original drawing adapted from that logo.
- **PC•MACs**: the manual (January 13, 2021, 326 pages) was downloaded again
  and its SHA-256 matches the October 7 record (`ce30eacc2500f950…`); the Edit
  View QuickStart (p. 76), Soft Console (p. 116), Control Window (p. 201), and
  GilderTerm (p. 209) pages were rendered and read. This revision changes
  nothing inside the recreated windows; the evidence map in
  `docs/REFERENCE_FIDELITY.md` gains one trainer-only row for Rosie.
- **Screenshot 1** (`one-file-promot-float-lab/assets/screenshot-fe683692eeab45c28a12a4ef19c3800e.png`,
  byte-identical to `Pictures/Screenshots/Screenshot 2026-10-07 094535.png`)
  was viewed: it is the earlier trainer’s crowded layout (Lessons / Practice /
  Handbook / Progress tabs, the block timeline, the terminal), the feedback
  reference for this redesign. A One File screenshot was not substituted.
- **Current app**: the October 7 state was captured through the hidden
  screenshot harness before editing and compared with Screenshot 1 and with
  the task’s acceptance criteria.

## What changed in behaviour

- **Rosie’s welcome**: on a fresh start a modal dialog over Home shows Rosie
  and three short beats (what this is; how a step works; where help is), with
  Next, Skip, and Esc. Shown once (`guide.welcomed` in the progress file),
  replayed by “Meet Rosie again” on Home, shown again after a confirmed Start
  over. Returning learners, including anyone with a progress file from before
  this build, never see it; Rosie greets them on Home instead.
- **Home**: Rosie with one speech bubble and one primary button (Start with
  Basic; or Continue beside Start over), then the three levels, named exactly
  Basic, intermediate, and I hate my life, as rows. The migration note for an
  older file stays as a quiet block.
- **Level map**: the Begin here card carries a small Rosie and her line
  (Begin here, Pick up where you stopped, Lesson finished with Next up, or
  every lesson finished). Structure otherwise unchanged.
- **Lesson panel**: step count and dots, Rosie’s bubble with the step title
  and the current beat’s text, one primary action (Show me, Your turn, Check,
  or Next), Back and Next, and a closed “More about this step” holding the
  example, the mechanism note, the control’s help, the handbook link, the
  reference photo, and Restart this lesson. Beats: look, watch (demos), try,
  result; a learner who acts in the windows early is checked and moved to the
  try beat; Back during a demonstration, or leaving the lesson for Home, the
  map, Explore, or Progress, cancels it and restores the show data. A finished
  step keeps “Watch again”, so no demonstration is ever out of reach. After a
  miss the correction keeps the instruction (or the question) under it.
  Rosie’s expression follows the beat: point, happy, cheer, oops; a finished
  practice step reopens with her cheering. Keyboard focus survives the panel’s
  rebuilds: when the focused button disappears (Show me while the demonstration
  runs, Check after a pass) focus moves to the next action.
- **Home mid-session**: pressing Home from a lesson offers Continue for the
  current lesson (“You are on …”), not the first-visit copy; at launch the
  saved place reads “Welcome back …”.
- **Explore**: Rosie’s line replaces the explanatory paragraph.
- **Unchanged**: all 27 lessons, 161 steps, questions, answers, hints,
  validators, demonstrations, the recreated windows, help texts, the handbook,
  search, the terminal, the simulated float, the security model, and the
  progress file apart from the optional `guide.welcomed` field.

## Automated checks (all passed)

### `npm test` (node --test), 95 tests

| Area | What is pinned |
| --- | --- |
| progress schema (+1) | `guide.welcomed`: a fresh document starts `false`; a document without the key reads as `true`; a non-boolean is rejected (`invalid-guide`); version-1 and version-2 migrations set `true` |
| mascot content (4) | the name and five expressions; `mascotSrc` paths and the `RangeError`; three welcome beats of at most 45 words each, ending in “Let’s go”; every guide line non-empty and built from its arguments; each SVG file exists, starts with `<svg`, has the 240 × 260 viewBox and a `<title>` naming Rosie, has no inline `style=`, no script, no `href=`, and is under 40 KB |
| step beats (5) | `initialBeat`, `primaryAction`, `secondaryActions`, `expressionFor`, and `bubbleText` against every row of the beat table in the spec |

The 85 earlier tests (lesson flow, levels, content with the four new control
help entries, handbook, search, simulation, terminal, links, PC•MACs
recreation, progress store) still pass.

### `npm run smoke` (hidden Electron window), 176 checks in 7 scenarios

Run against the development app with a fresh throwaway user-data folder. The
window is never shown; pointer and focus events are synthetic.

| Scenario | Checks | New in this revision |
| --- | --- | --- |
| first | 84 | the welcome dialog is open on a fresh start; the mascot image is bundled and loads (`complete`, natural width > 0, `assets/mascot/rosie-wave.svg`); two Next presses reach beat 3 of 3; Let’s go closes it and sets `guide.welcomed`; Home offers one primary action, Start with Basic; “Meet Rosie again” reopens the welcome at beat 1; the welcome buttons carry no tooltip hook; the first step opens in its look beat with Rosie’s bubble and “More about this step” closed; one persistent live region outside the panel announces the step; Home mid-session offers Continue for the current lesson and Continue returns to it; after the demonstration the panel is in the watch beat with the outro; a practice step opens in look; a wrong RightClick-and-slide during look moves the panel to try with the correction (Review Focus 3), the live region announces it without being re-created, and the instruction stays under the correction; Show me puts the panel in watch, and Back during the demonstration cancels it, restores Light 1, and opens the previous step at look (Review Focus 4); a finished step still offers Watch again, and after the demonstration ends focus lands on Next; after a pass focus moves from the vanished Check to Next; leaving for Explore during a demonstration cancels it and restores the selection |
| resume (real relaunch) | 18 | no welcome for a returning learner; the Continue card is Rosie’s “Welcome back…” naming the lesson and step; a confirmed Start over begins with the welcome again |
| malformed | 9 | a fresh start after quarantine shows the welcome |
| savefail | 11 | the welcome opens and closes without an error while saving fails, and the failure banner still appears (Review Focus 1) |
| legacy (v1 file) | 16 | a migrated version-1 file never shows the welcome (Review Focus 2) |
| legacy2 (v2 file) | 15 | a migrated version-2 file never shows the welcome (Review Focus 2) |
| practice | 23 | the welcome is dismissed first, then the practice checks as before |

### Screenshots (`node scripts/smoke.mjs --shots <dir>`), 25 checks

Captured from the hidden 1440 × 900 window and reviewed by eye: the welcome
(beat 1 over Home), Home, the Basic map with Rosie in the begin card, the first
step (look beat), the timeline step after its demonstration (watch beat with
“Watch again” and Next), the try beat (the instruction and “When it’s right: …”
with Check as the primary), the practice correction (Rosie `oops`, the
correction with the instruction under it, Check as the primary), the corrected
action (Rosie `cheer`, Next as the primary), the Edit menu, the analog
selection, the Set to value dialog, the Control Window with Manual highlighted,
the terminal lesson (Your turn as the primary), the handbook beside a lesson,
help, the round-trip assignment, the explore panel with Rosie, Progress, and at
the minimum window size 1024 × 680 both the longest bubble (a correction) and
the welcome (Review Focus 5: the guide card, the actions, and the Back / Next
row fit; the PC•MACs menu bar wraps to two lines as it did before this
revision).
The mascot files themselves were also rendered through a hidden window during
drawing and adjusted twice (arms in front of the bloom, a spiral crown, visible
petal edges).

## Packaged build

`npm run make` succeeded on the final source: the packaged folder
`out/Roseflow PC Mac Training-win32-x64/` (run `RoseflowPCMacTraining.exe`
directly) and the Squirrel installer under `out/make/squirrel.windows/x64/`
(unsigned, so SmartScreen will warn). `forge.config.cjs` now also keeps the
plan workspace folder `.superpowers/` out of the package. The five mascot
files and `content/mascot.mjs` are inside `resources/app.asar` (checked with
`@electron/asar`). The seven smoke scenarios were then run against the
packaged executable, rebuilt after the review fixes: 176 checks, 0 failed, zero network requests and zero
renderer console errors in every scenario, which is the offline proof that
Rosie loads from the bundle. Installing the installer and launching from the
Start Menu was not performed, because an install changes the owner’s machine.

## Independent code review

A separate reviewer with a fresh context read the diff and the new files
against the spec, the plan, the plan’s Review Focus, and the executor’s
rulings, and re-ran the tests and the smoke suite itself. It found no
critical issue, three important ones, and ten minor ones. Re-graded by what a
learner gets, the following were fixed in one pass, each with a test that
failed first (unit or smoke) and the whole suite green after:

1. Demonstrations were unreachable on a finished step (Back to re-watch, or
   revisiting a finished lesson, found no Show me). Fixed: “Watch again” on
   every finished step with a demonstration.
2. The speech bubble was a live region re-created on every render, so a
   screen reader would re-read the whole step on every interaction. Fixed:
   one persistent, visually hidden live region outside the panel, updated
   only when the bubble’s text changes.
3. Keyboard focus was dropped after Show me (the button became disabled) and
   after a pass (Check became Next). Fixed: focus moves to the next action.
4. After a wrong answer the question prompt vanished while the options
   stayed; after a failed check the instruction vanished. Fixed: both stay
   under the correction.
5. The welcome buttons could show a hover / focus tooltip under the modal
   backdrop. Fixed: the two buttons carry no tooltip hook.
6. Home pressed mid-session showed the first-visit copy and no Continue.
   Fixed: Continue for the current lesson or level, and Continue returns to
   the current lesson.
7. The first welcome line called the windows “a copy of the real windows”.
   Fixed: “a recreation of the real PC•MACs windows”, in line with the
   fidelity policy.
8. Leaving the lesson for Home, the map, Explore, or Progress while a
   demonstration ran left it running (pre-existing, more visible with beats).
   Fixed: it is cancelled and the show data restored.
9. A finished practice step reopened with Rosie pointing rather than
   cheering; an unused `beat-look` action and a duplicated “Finish this step
   first” string. Fixed.
10. Home had no page heading. Fixed with a visually hidden one.

Deferred, recorded here for the owner: a hand-edited `guide` field (for
example `"welcomed": "yes"`) is treated like any other invalid field and
quarantines the file, where a default would do; the level map’s
“Lesson finished” line is still a live region inside a rebuilt card, as it was
before; and `<h2>` headings inside the level-row buttons are pre-existing.

## Not verified by automation (owner to confirm by hand)

- Rosie against the team’s own sense of the logo: the drawing was checked by
  eye against the two logo sources; whether it is “cute” enough is the team’s
  call. Her name is a working name, changed in one place
  (`src/renderer/content/mascot.mjs`).
- Real keyboard use of the welcome dialog (Tab between Skip and Next, Esc) and
  of “More about this step”; the harness drives them with synthetic events.
- `prefers-reduced-motion`: the welcome wave is inside a
  `no-preference` media query and the existing global rule disables
  animations; not exercised by the harness.
- Display scaling other than 100 % and windows narrower than 1024 px (below the
  app’s minimum).
- Installing the installer and launching from the Start Menu.

## Known limitations recorded honestly

- The welcome and the beats are the trainer’s own presentation; nothing new is
  claimed about PC•MACs behaviour. The looping-demo design of October 11 was
  not implemented; the existing Show me demonstrations are reused.
- The guide’s speech bubble re-renders with the lesson panel on every action.
  It is not itself a live region: one persistent, visually hidden live region
  beside the panel receives the bubble’s text only when that text changes, so
  a screen reader hears the current beat (or the result) once.
- The logo is a trademark of the Cal Poly Rose Float program. Rosie is a
  derivative drawing for the team’s private trainer; the repository and its
  photos should stay private until the owner decides otherwise.
