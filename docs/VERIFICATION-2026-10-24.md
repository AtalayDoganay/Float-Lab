# Verification record, October 24, 2026: Rosie in 3D, the floating guide

Follows `docs/VERIFICATION-2026-10-23.md` (Rosie, the guide, and the
simplified trainer). The owner reviewed that build and asked for Rosie to be
smoother and cleaner, “like a plush”, in 3D, with more effects and
animation, with a face that shows emotions, and not fixed to the left panel:
she should move around the screen and guide the learner through it. The
design is `docs/superpowers/specs/2026-10-24-rosie-3d-guide-design.md`, the
plan `docs/superpowers/plans/2026-10-24-rosie-3d-guide.md`; every decision
the implementer took on the owner’s behalf is a `Ruling:` line in the plan’s
ledger (`.superpowers/sdd/2026-10-24-rosie-3d-guide/progress.md`, kept).

## What changed in behavior

- **Rosie is a 3D plush.** Built from soft primitives in Three.js: a
  squashed-sphere bloom with two rings of petal ellipsoids open at the front,
  a drawn face on a curved plate with a pale seam, a lathe stem with two
  thorns, leaf arms (two lobes and a vein) on shoulder pivots, a leaf skirt,
  feet, a badge tag. Velvet materials (full sheen, fuzz normal map), soft
  lights and a procedural environment. Six faces: idle, wave, point, happy,
  cheer, oops.
- **She floats over the whole window** in a fixed layer that is transparent
  to the pointer, so she never blocks a click, and that sits below the
  PC•MACs drop-down menus and the tooltip, so an open menu is never hidden
  by her. She is anchored to what each screen is about: the window centre
  for the welcome (and Home’s action card on its last beat), Home’s action
  card, the level map’s begin card, a step’s target control (else a dock at
  the top of the lesson panel), the dock in Explore, the lower-right corner
  in Progress.
- **Placement never covers the target.** She stands to the right, left,
  below or above the target, or beside the window that holds it, taking the
  first spot that fits, misses the target, and keeps off the panel, the
  handbook and every recreated window; when none is clear, the least
  weighted overlap (the target’s own window weighs double, the panel’s
  action rows four times). Her bubble goes on her outer side, flips when
  that side has no room, takes the least weighted overlap when none is
  clear, slides sideways rather than clip a target that fills the desk, and
  never sits on her.
- **Motion and effects.** A critically damped spring (sub-stepped for long
  frames) flies her to each anchor; she banks into the move, sheds petals in
  flight, squashes when she lands, bobs and sways while idle, blinks every
  2.5–5 s, follows the pointer with her eyes, nods and moves her mouth for a
  second when her words change, waves on Home, extends an arm and turns
  toward a target, hops and spins with a sparkle burst on a pass, droops
  with a sweat drop and a head shake on a miss. With
  `prefers-reduced-motion: reduce` she is placed at once and holds still:
  no flight, bob, trail, burst, hop, spin, wave oscillation or nod.
- **The welcome is a tour.** The same three beats, now in her bubble acting
  as a modal dialog (`role="dialog"`, `aria-modal`, the page `inert`, Esc
  closes it) over a dimmed Home; on the last beat she flies to the Start
  button; when it closes, keyboard focus moves to Home’s primary action.
  The `<dialog id="welcome-dialog">` element is gone.
- **The panels lost their speech cards.** Home has a plain action card,
  the level map a plain begin card, the lesson panel the step count, the
  actions, Back / Next, More about this step, and the dock; Explore its
  heading and the dock. Her words live in her bubble, which is a polite
  status region on Home, the level map, Explore and Progress (rebuilt only
  when her words change, so each change is announced once); in lessons the
  panel’s persistent live region announces them, as before.
- **Fallback.** Without WebGL, or after a lost context, the same layer shows
  the October 23 SVG sprites. The frame loop stops entirely while the page
  is hidden or minimised.
- **Unchanged:** every lesson, question, validator and feedback text; the
  recreated PC•MACs windows; help, handbook, tooltips; the progress file
  (schema 3, `guide.welcomed`); the security model.

## Sources used

- Three.js documentation and source for `MeshPhysicalMaterial` (sheen),
  `PMREMGenerator`, `CanvasTexture`, `Sprite`, `CapsuleGeometry`,
  `LatheGeometry`; the package `three@0.186.1` from the npm registry
  tarball (MIT), vendored byte for byte with its SHA-256 recorded in
  `src/renderer/vendor/three/README.md` and checked by
  `tests/vendor-three.test.mjs`. The package ships no minified build. The
  reviewer re-verified the tarball’s registry digests independently.
- Tooltip and coach-mark placement guidance read October 24, 2026
  (Userpilot “Tooltip best practices”, Flook “Mastering tooltip placement”,
  ServiceNow mobile tooltip guidance): beside the target, never over it,
  flip when there is no room, one callout at a time.
- Feasibility spikes in the session scratchpad before any code: WebGL
  renders in a hidden Electron window under the app’s own CSP (Intel Iris
  Xe, WebGL 2.0); Node imports the vendored module for unit tests; a
  scratchpad page can import repository modules for visual previews; a
  hidden window reports itself visible and delivers animation frames at full
  rate on a plain page, but stops delivering them once WebGL is drawn.

## Automated checks

### `npm test` (node --test), 141 tests, all passed

The 95 from the previous records plus:

| File | Tests | What they pin |
| --- | --- | --- |
| `tests/vendor-three.test.mjs` | 2 | both vendored files match the recorded SHA-256, contain no `eval(` / `new Function(`, the module imports its core from the same folder, licence and README present; the module loads in Node and exposes the classes the guide uses |
| `tests/motion.test.mjs` | 9 | the spring converges in 2 s without overshoot and clamps a long frame; `springAdvance` sub-steps a long frame to real time; banking, squash, blink timing, the talk envelope, the idle bob, `settled` |
| `tests/guide-placement.test.mjs` | 16 | right / left / below placement, the bubble flipping, avoiding the panel, the full-window target reported as overlapping, dock / centre / corner placements; standing beside the window that holds the target; least overlap when nothing is clear; the bubble’s least-overlap fallback never on her; the bubble keeping off the panel and the target’s window; a stacked bubble sliding clear of a target that fills the desk; the bubble keeping off the panel’s action rows (a heavier avoid); keeping off the other recreated windows |
| `tests/guide-plan.test.mjs` | 6 | the welcome beats and their anchors; Home’s anchors and lines; the level map’s anchor, point / cheer, the four lines; a lesson step’s target, expression, words, feedback, and the dock when there is no target; Explore and Progress; the plan key ignores playback and changes with the target |
| `tests/face.test.mjs` | 4 | the expression table; open eyes as ellipses with highlights and happy eyes as arcs; a blink closes the eyes; every expression draws without touching anything a canvas lacks |
| `tests/rosie-model.test.mjs` | 4 | every named part from soft primitives, about 2.6 units tall on the ground, at least 25 meshes and 6 fabric materials with full sheen; the pose table; `applyPose` writes rotations; reduced motion removes the cheer hop and spin and the wave oscillation |
| `tests/effects.test.mjs` | 5 | 24 petal and 10 sparkle sprites hidden at rest; one petal per trail call; a burst of 18; particles fall, fade, and hide within two seconds; the pool never grows |

Every test was written before its code and watched fail first (the plan’s
steps; for three placement rules found by the screenshots or the review the
rule was temporarily disabled to watch the new test fail, then restored).
Two `rosie-model` assertions were corrected during the task (the bounding
box in the root’s own frame; cones and capsules exempt from the
straight-cylinder check) and one after the review (the cheer hop is
full-motion behaviour), each recorded.

### `npm run smoke` (hidden Electron window), 198 checks in 7 scenarios

| Scenario | Checks | What the new ones cover |
| --- | --- | --- |
| first | 106 | the welcome is open on a fresh start and is a modal dialog in her bubble with `main` inert and the layer modal; her rendering mode is recorded (`webgl` on this machine); her artwork is drawn; two Next presses reach 3 of 3 and on the last beat she is anchored to Start with Basic; Let’s go closes it, remembers it, and frees the page; **focus moves to Home’s primary action when the welcome closes**; **on Home her bubble is a polite status region**; Meet Rosie again reopens at beat 1; the welcome buttons carry no tooltip hook; Escape closes the welcome and **focus returns to the primary action**; **a lost WebGL context falls back to the sprite** (Review Focus 4); the first step opens with her words in her bubble; Home mid-session anchors her beside Continue without overlap; a lesson step anchors her to its target, settled, without overlap; the panel keeps a dock and no speech card; the next step changes her position and counts one flight; her bubble carries the beat’s text; the layer is transparent to the pointer; **a target with no size falls back to the dock** (Review Focus 1); **a shifted target re-anchors her without a new talk or flight** (Review Focus 2); **playback does not make her fly or talk** (Review Focus 3); **in a lesson her bubble is not a live region**; **an open menu paints above her** (the layer below the menus in the root stacking order, no stacking context between); **her loop runs while the page is visible and stops while it is hidden**; **with reduced motion she is placed at once, without a flight**; the correction and the pass show in her bubble; the live region still announces once; **the explore panel keeps its heading** |
| resume (real relaunch) | 18 | no welcome for a returning learner; the Continue card’s words in her bubble name the lesson and step; Start over brings the welcome back |
| malformed | 9 | the welcome scene after a quarantine |
| savefail | 11 | the welcome opens and closes without error when saving fails |
| legacy | 16 | a migrated version-1 file never shows the welcome |
| legacy2 | 15 | a migrated version-2 file never shows the welcome; the Continue words in her bubble |
| practice | 23 | unchanged (every practice step solved in the recreated windows) |

Every scenario also asserts zero network requests and zero renderer console
errors. The hidden window never takes focus, keyboard, or clipboard.

**What was actually observed after the review’s fix pass** (the last code
change): `first` 106 of 106 and the screenshot scenario 30 of 30, each run
on its own; then a full-suite run was stopped by the operating system’s
memory pressure part-way: `first` produced no report, `resume` (which reads
the place `first` saves) failed 3 of 18 as a direct consequence, and
`malformed` 9, `savefail` 11, `legacy` 16, `legacy2` 15 and `practice` 23
passed. Before the fix pass the full suite passed 190 of 190 three times.
The `resume` scenario therefore stands verified only on the pre-fix-pass
code; the fix pass did not touch what it checks (relaunch, the Continue
words, Start over), but that is reasoning, not evidence. `npm run smoke`
should be re-run on a machine with memory to spare.

### Screenshots (`node scripts/smoke.mjs --shots <dir>`), 30 checks, 23 captures

Captured from the hidden 1440 × 900 window after the fix pass and reviewed
by eye: the welcome (beat 1, Rosie centred over a dimmed Home, her bubble
with Skip and Next); the welcome’s third beat (she stands beside the action
card, Let’s go); Home (she waves beside the action card); the Basic map (she
points at the begin card, “Begin here.”); the first step (she sits in the
panel dock, her feet clear of Back / Next); the attempted mid-flight capture
(she is still near the dock: the capture takes longer than her short hop,
recorded as such); the timeline step after its demonstration; the try beat;
the practice correction (oops: worried brows, sweat drop, the correction in
orange with the instruction under it); the corrected action (cheer: mid-spin,
arms up, sparkles, below the Edit View); the Edit menu (the open menu paints
above her bubble); the analog selection; the Set to value dialog; the
Control Window with Manual highlighted (she stands below-right of the
window, bubble above her over the Edit View’s lower corner); the terminal
lesson (she stands below the terminal window); the handbook beside a
lesson; help; the round-trip assignment (she stands at the Control Window’s
right edge, bubble clear of every window); the explore panel (she sits in
the dock); Progress (lower-right corner, happy); and at the minimum window
size 1024 × 680 the longest bubble (a correction) and the terminal lesson,
where the checks **“at 1024 by 680 the bubble stays inside the window and
off the target”** (Review Focus 5) and **“… keeps off the panel’s action
rows”** pass: she stands left of the terminal over the panel, the only spot
that misses the target, and her bubble goes above her, off the terminal,
inside the window, and clear of Your turn, Back and Next.

Six model previews in the session scratchpad (`spike3d/rosie-v3.png` to
`v6.png`) record the visual iteration: the face opened and enlarged, the
petals pulled back from the face, the raised arms swung outward and forward
so they show beside her chibi head.

### Packaged build

Before the fix pass, `npm run make` produced
`out/make/squirrel.windows/x64/RoseflowPCMacTraining-Setup.exe` (158 MB,
unsigned) and the portable folder `out/Roseflow PC Mac Training-win32-x64/`;
`app.asar` held `src/renderer/vendor/three/` (both files and the licence),
`src/renderer/guide/`, `src/renderer/ui/guide-layer.mjs` and
`assets/mascot/`, and lacked the deleted `welcome.mjs` and `guide.mjs` and
the development folders. `node scripts/smoke.mjs --exe …` against it: 7
scenarios, 190 checks, 0 failed, zero network requests and zero console
errors; the packaged app recorded `mode: webgl` and its lost-context check
fell back to the sprite.

After the fix pass the rebuild was attempted in the same run the operating
system stopped for memory pressure and failed with Windows exit code
3221225794 (a DLL initialisation failure, not a build error in the code).
**The installer and portable folder in `out/` are therefore from before the
fix pass** (02:59). To ship the reviewed code: `npm run make`, then
`node scripts/smoke.mjs --exe "out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe"`.

## Independent code review

A separate reviewer with a fresh context read the whole working tree
against the spec, the plan, the plan’s Review Focus and the ledger’s
rulings, re-ran `npm test` (138 at the time) and `npm run smoke` (190)
itself, and re-verified the Three.js provenance against the registry. It
found one Critical, six Important and nine Minor issues. Re-graded by what a
learner gets, all seven Critical and Important ones were fixed in one pass,
each with a test that failed first and the suites green after:

1. Her bubble and body painted over open PC•MACs drop-down menus, including
   the menu item a correction names. Fixed: the layer sits below the menus
   and the tooltip in the stacking order (and there is no stacking context
   between), pinned by a smoke check.
2. Reduced motion still hopped, spun, waved and nodded. Fixed: the cheer’s
   hop, spin and sparkles, the wave’s oscillation and lean, and the talking
   nod and mouth are gated; unit and smoke checks.
3. The frame loop never stopped while the page was hidden. Fixed: the loop
   (animation frame plus the slow timer behind it) stops while the page is
   hidden or minimised and resumes on `visibilitychange`; smoke check
   through a debug hook.
4. Keyboard focus was dropped when the welcome closed. Fixed: focus moves
   to Home’s primary action on Let’s go, Skip and Esc; two smoke checks.
5. Words that used to be announced (the finished-lesson note) or sit in a
   landmark were in neither. Fixed: her bubble is a polite status region
   outside the welcome and the lessons; the explore panel keeps its heading;
   three smoke checks.
6. At the minimum window size the bubble covered the panel’s primary
   action, and in multi-window lessons it covered other windows’ controls.
   Fixed: weighted avoid rectangles (every recreated window, the target’s
   own window double, the panel’s action rows four times) for her and for
   the bubble; two unit tests and one smoke check.

Deferred, recorded in the ledger for the owner: no fade on reduced-motion
placement (the spec says fade); `guidePlan`’s key is computed but the layer
diffs its own sub-keys, and `stage.setSize` is unused; the Progress corner
bubble can cover the progress-file path; a renderer leak if the model build
throws after the stage is created, a pixel ratio fixed at mount, model
geometries not disposed on context loss; the face is re-rasterised on every
quantised look change; the bubble’s measured width (331) differs from the
spec’s 320; duplicated smoke helpers and the mid-flight capture that shows
no flight. Two documentation errors (licence years, a README overclaim)
were corrected.

## Not verified by automation (owner to confirm by hand)

- The full smoke suite and the packaged build after the fix pass (see
  above): `npm run smoke`, `npm run make`, the packaged smoke run.
- How she feels in a visible window at 60 frames a second (the harness
  drives a hidden window at about 8 frames a second through the timer;
  motion is integrated in real time either way).
- Other GPUs and drivers; the sprite fallback was exercised only through a
  forced context loss on an Intel Iris Xe.
- `prefers-reduced-motion: reduce` by eye (the logic is unit tested and
  exercised through a debug override; the hidden window reports no
  preference).
- Display scaling other than this machine’s; the installer’s install and
  uninstall; a real keyboard through the welcome (Tab order inside the
  bubble, Esc, the focus hand-off) and the inert page; a screen reader
  through Home and a lesson.
- Whether Rosie is cute enough, and her name. Her look is in
  `src/renderer/guide/rosie-model.mjs` and `guide/face.mjs`; her lines in
  `src/renderer/content/mascot.mjs`.

## Known limitations recorded honestly

- In the smallest window with a target that fills the desk (the terminal
  lesson at 1024 × 680) the only spot that misses the target is over the
  lesson panel; she and her bubble are pointer-transparent and the bubble
  now keeps off the action rows, but the panel’s header is covered.
- In lessons with several windows open she may stand over the edge of a
  window other than the target’s when no clear spot exists (least overlap);
  her bubble keeps off the windows when it can.
- The vendored library is unminified (about 2.1 MB in the ASAR), the price
  of byte-for-byte provenance.
- The mid-flight screenshot does not show a flight: the hidden window’s
  capture takes longer than her short hop from the dock to the menu bar.
- The installer is unsigned; Windows SmartScreen will warn.
