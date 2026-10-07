# Roseflow PC Mac Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first offline, simulation-only Windows desktop version of Roseflow PC Mac Training: a PC•MACs-style training workspace with contextual help, a searchable handbook, three guided exercises, the ten ported lessons, and locally saved progress with Resume and Restart.

**Architecture:** Electron (main process in ESM, sandboxed renderer, CommonJS preload) with a dependency-free vanilla HTML/CSS/JS renderer. Pure logic modules (course state machine, simulation math, guided-step validation, handbook search, progress schema) are tested with `node --test`; a hidden-window smoke harness exercises the real renderer without taking focus. Content (curriculum, control help, handbook, exercises, references) lives in data modules with stable identifiers.

**Tech Stack:** Electron 44.6.0, Electron Forge 8.0.1 (maker-squirrel, maker-zip, plugin-fuses), Node 25 for tests, no runtime dependencies besides electron-squirrel-startup.

**Spec:** `one-file-promot-float-lab/ONE_FILE_TASK.md` (revision 1, confirmed by the owner on October 7, 2026) plus the staged originals in `one-file-promot-float-lab/sources/`.

## Global Constraints

- Product name: "Roseflow PC Mac Training"; identify it as an independent training app and simulation only on screen.
- Offline and simulation-only: no serial, USB, DMX, controller Ethernet, discovery, or hardware-control libraries; no cloud service for installed learning.
- Progress stored locally in the Electron userData directory, independent of One File; Resume learning and Restart learning (confirmed) controls; exercise reset separate from course restart.
- Electron security: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`; narrow validated IPC; navigation and new windows blocked; only allowlisted external links open in the system browser.
- Accuracy boundaries: 0–255 is 256 values; percentage = value / 255 × 100; values carry no cm, volts, or ohms; calibration ranges 10/20/40 cm are hypothetical; the approach-to-target animation is an educational model, not a Br-EFB or PID simulator.
- Keep COM-port labels, card addresses, axes, DMX channels, and IP addresses distinct; photographed values are historical observations, not recommendations.
- Velocity Limit units/algorithm, firmware PID behavior, startup special values, override release, sensor identity, travel, and wiring stay explicitly unresolved.
- Preserve all ten lesson topics and twenty question records with valid answer keys and wrong-answer explanations.
- Do not modify the originals under `one-file-promot-float-lab/`.
- Nothing staged, committed, pushed, or published. The GitHub Actions workflow only uploads build artifacts; it never publishes a release.
- Automated checks must not take focus or use the owner's keyboard or clipboard: the smoke harness uses a hidden window (`show: false`).

## Review Focus

1. Progress file written by a newer or older schema, or hand-edited to garbage: the app must start, quarantine the file, say so, and never mark work complete. Test in Task 3.
2. Save failure (userData path unwritable): the app keeps working in memory, shows a visible banner with retry, and does not claim the save succeeded. Test in Task 3 and Task 9.
3. Timeline playback left running when the learner switches lesson or opens help, then returns: no duplicate intervals, lamp state matches the current block, Stop always works. Test in Task 4 (pure stepping) and Task 9 (smoke).
4. Command slider dragged to 127 or 129 in the "Read a command" exercise: validation must say exactly what was set and ask for 128, not accept "close enough". Test in Task 5.
5. Handbook query that only matches an alias ("netmask", "pc mac", "dmx"): the canonical entry must be found and the excerpt must show where it matched. Test in Task 6.

---

### Task 1: Project skeleton, sources manifest, and Forge configuration

**Files:**
- Create: `package.json`, `package-lock.json` (via npm), `forge.config.cjs`, `.gitignore`
- Create: `one-file-promot-float-lab/sources/SOURCES.md` and staged copies of the originals
- Create: `src/renderer/assets/reference-photos/*.jpg` (ten unchanged originals)

**Interfaces:**
- Produces: npm scripts `start`, `package`, `make`, `test`, `smoke`.

- [x] Copy the two originals from Downloads, verify SHA-256 against the task listing, extract the ZIP beside them.
- [x] Install `electron@44.6.0`, `@electron-forge/cli@8.0.1`, makers and fuses plugin with `--save-exact`; confirm `npx electron --version` prints v44.6.0.
- [x] Write `forge.config.cjs` with squirrel + zip makers, fuses, and an `ignore` list that excludes the task package, tests, scripts, docs, and workflow from the packaged app.

### Task 2: Shared progress schema

**Files:**
- Create: `src/shared/progress-schema.mjs`
- Test: `tests/progress-schema.test.mjs`

**Interfaces:**
- Produces: `SCHEMA_VERSION = 1`, `APP_ID = 'roseflow-pc-mac-training'`, `createEmptyProgress() → ProgressDoc`, `validateProgress(input) → { ok: true, value: ProgressDoc } | { ok: false, error: string }`.
- `ProgressDoc = { schemaVersion, app, savedAt, location: { view, lessonId, questionIndex, exerciseId, stepIndex }, course: { completedLessons: string[], missedLessons: string[], answered: string[] }, guided: { completedSteps: string[], completedExercises: string[] }, settings: { channelId, blocks: boolean[8], axis: 0..3, command: 0..255, laptopIp } }`

- [x] Write failing tests: empty doc validates; wrong `schemaVersion` rejects with `'unsupported-schema'`; `blocks` of length 7 rejects; `command: 256` rejects; non-object rejects; unknown extra keys are dropped; string ids only.
- [x] Run `node --test tests/progress-schema.test.mjs`; expect failures (module missing).
- [x] Implement `validateProgress` as a hand-written validator (no dependency) that returns a normalized copy.
- [x] Run tests; expect pass.

### Task 3: Main-process progress store, links allowlist, preload, and window

**Files:**
- Create: `src/main/progress-store.mjs`, `src/main/links.mjs`, `src/main/preload.cjs`, `src/main/main.mjs`
- Test: `tests/progress-store.test.mjs`, `tests/links.test.mjs`

**Interfaces:**
- Consumes: `validateProgress`, `createEmptyProgress`.
- Produces: `createProgressStore({ dir, now }) → { load(): Promise<{ ok, value|null, recovered? }>, save(doc): Promise<{ ok, savedAt } | { ok:false, error }>, reset(): Promise<{ ok }> , filePath }`; `isApprovedLink(url) → boolean`; `APPROVED_LINKS`.
- Preload exposes `window.roseflow = { progress: { load, save, reset }, links: { open(url) }, app: { info() } }`.
- IPC channels: `progress:load`, `progress:save`, `progress:reset`, `links:open`, `app:info`.

- [x] Write failing tests: save then load round-trips; load with no file returns `value: null`; malformed JSON is renamed to `progress.invalid-<timestamp>.json` and load returns `recovered.reason`; a doc with `schemaVersion: 99` is quarantined the same way; save into a path whose parent is a file returns `{ ok: false, error }` and leaves no partial file; `isApprovedLink` accepts the two manual URLs and the Cisco page, rejects `file:`, `javascript:`, and look-alike hosts.
- [x] Run tests; expect failures.
- [x] Implement the store with temp-file + rename writes.
- [x] Implement `main.mjs`: single window (`show: false` until `ready-to-show`, hidden entirely under `ROSEFLOW_SMOKE=1`), security webPreferences, CSP header via `session.webRequest.onHeadersReceived`, `will-navigate` block, `setWindowOpenHandler` deny with allowlisted external open, IPC handlers that validate payloads, `ROSEFLOW_USERDATA` override, and smoke-mode runner (Task 9).
- [x] Run tests; expect pass.

### Task 4: Simulation and course logic

**Files:**
- Create: `src/renderer/logic/simulation.mjs`, `src/renderer/logic/course.mjs`
- Test: `tests/simulation.test.mjs`, `tests/course.test.mjs`

**Interfaces:**
- Produces (simulation): `percentOf(value) → number` (128 → 50.196…), `formatPercent(value) → '50.2%'`, `blocksToIntervals(blocks) → [{ start, end }]` ([2,3] → [{2,3},{3,4}]), `playbackStep(tick, blocks) → { done, index, on, label }` (tick 8 → done), `formatShowTime(seconds, fps=30) → '00:00:02.00'`, `axisToDmx(axis) → 6..9` (photographed mapping, first channel 6), `classifyLaptopIp(ip, controller='192.168.0.10', mask='255.255.255.0') → 'same-subnet' | 'different-subnet' | 'duplicate'`, `approachStep(actual, target, k=0.08) → number`, `calibratedTarget(value, maxCm) → number`.
- Produces (course): `createCourse(lessons)`, `course.answer(state, choice) → { state, correct, feedback }`, `course.next(state) → state`, `course.open(state, lessonIndex) → state`, `course.checkpoint(state) → { missingLessonIds, missedLessonIds, completedCount }`, state shape `{ lessonIndex, questionIndex, answered, completedLessons, missedLessons }` using lesson and question ids.

- [x] Write failing tests for every produced function with the acceptance values: `percentOf(128)` rounds to 50.2; `blocksToIntervals` for blocks 2 and 3 yields seconds 2–3 and 3–4; `playbackStep` covers ticks 0–7 then `done` at 8; `classifyLaptopIp` for the three examples; wrong-then-right answer records the lesson as missed and still completes; `next` on the last question marks the lesson complete; skipping to lesson 5 then back to 2 leaves completion untouched; `checkpoint` lists unfinished lessons.
- [x] Run tests; expect failures.
- [x] Implement both modules as pure functions over plain objects (sets serialized as arrays).
- [x] Run tests; expect pass.

### Task 5: Content modules and guided-practice engine

**Files:**
- Create: `src/renderer/content/curriculum.mjs`, `src/renderer/content/controls.mjs`, `src/renderer/content/exercises.mjs`, `src/renderer/content/references.mjs`, `src/renderer/content/handbook.mjs`
- Create: `src/renderer/logic/guided.mjs`
- Test: `tests/content.test.mjs`, `tests/guided.test.mjs`

**Interfaces:**
- Produces: `LESSONS` (10 records, ids `l01`…`l10`, questions `l01q1`…), `CONTROLS` (map id → `{ name, short, purpose, when, example, mistakes, expected, effect, mechanism, evidence, related, images }`), `EXERCISES` (3 records with `steps[]` of `{ id, target, title, why, instruction, validate(ctx) → { ok, message } , success }`), `REFERENCE_IMAGES`, `MANUAL_CITATIONS`, `HANDBOOK_ENTRIES`, `ALIASES`.
- Produces: `createGuidedRun(exercise)`, `run.current()`, `run.validate(ctx) → { ok, message, finished }`, `run.back()`, `run.reset()`, `run.progress() → { completed: string[], index }`.
- Validation context `ctx = { sim: SimState, action: { type, payload } | null, answer: string | null }`.

- [x] Write failing tests: ten lessons, twenty questions, each question has exactly one correct index and a non-empty hint for every wrong option; every exercise step `target` exists in `CONTROLS`; every control has the six required help fields; schedule-light step 2 rejects blocks [1,2,3] with a message naming block 1; read-command step 3 rejects command 127 with a message containing "127" and "128"; understand-address steps classify the three examples; `back()` and `reset()` behave.
- [x] Run tests; expect failures.
- [x] Port the curriculum from `app/app.js` verbatim text, add ids. Write control help, exercises, references, handbook entries.
- [x] Run tests; expect pass.

### Task 6: Handbook search

**Files:**
- Create: `src/renderer/logic/search.mjs`
- Test: `tests/search.test.mjs`

**Interfaces:**
- Produces: `buildIndex(entries, aliases) → Index`, `search(index, query) → { kind: 'empty' | 'results' | 'none', results: [{ id, title, type, score, excerpt, matchedTerms }] }`.

- [x] Write failing tests: empty/whitespace query → `kind: 'empty'`; `'netmask'` finds the subnet-mask entry via alias with an excerpt; `'pc mac'` finds entries mentioning PC•MACs; `'dmx'` finds the channel entry; gibberish → `kind: 'none'`; title matches outrank body matches.
- [x] Run tests; expect failures.
- [x] Implement tokenizer (lowercase, strip diacritics and the bullet in PC•MACs), alias expansion, scoring, excerpt window.
- [x] Run tests; expect pass.

### Task 7: Renderer UI (workspace, terminal, help, panels)

**Files:**
- Create: `src/renderer/index.html`, `src/renderer/styles.css`, `src/renderer/app.mjs`
- Create: `src/renderer/ui/help.mjs`, `src/renderer/ui/workspace.mjs`, `src/renderer/ui/terminal.mjs`, `src/renderer/ui/lessons.mjs`, `src/renderer/ui/guided.mjs`, `src/renderer/ui/handbook.mjs`, `src/renderer/ui/progress.mjs`, `src/renderer/ui/dom.mjs`

**Interfaces:**
- Consumes: everything above through `window.roseflow` (preload) and the logic/content modules.
- Produces: a single `createApp(root, api)` in `app.mjs` with `getState()`, `dispatch(action)`, and `window.roseflowDebug` exposed only when `document.documentElement.dataset.smoke === '1'`.
- Every training control element carries `data-control="<id>"`; the help module resolves it against `CONTROLS`.

- [x] Build the layout: identity bar, collapsible trainer panel (Lessons / Practice / Handbook / Progress), central workspace (ruler, analog pane, digital pane, transport, time readouts), right-hand Terminal - COM3 dialog.
- [x] Implement help: tooltip on `mouseover`/`focusin` for `[data-control]`, dialog on `?` click or F1, Esc closes and returns focus, no state change.
- [x] Implement workspace rendering from state and dispatch of actions `select-channel`, `toggle-block`, `play`, `stop`, `select-axis`, `set-command`, `run-measure`, `reset-measure`, `select-laptop-ip`, `terminal-key`, `terminal-button`.
- [x] Implement lessons panel (Learn → Try → Answer), guided panel with highlight, handbook panel, progress panel (storage path, Resume/Restart with confirm, exercise reset, save-failure banner).
- [x] Verified visually through hidden-window screenshots (`node scripts/smoke.mjs --shots`); `npm start` was not launched to avoid taking focus.

### Task 8: Documentation and CI workflow

**Files:**
- Create: `README.md`, `docs/SETUP.md`, `docs/REFERENCE_FIDELITY.md`, `docs/VERIFICATION.md`, `.github/workflows/windows-build.yml`

- [x] README: what the app is, launch instructions, where progress lives, what is simulated, privacy note about photos.
- [x] SETUP: commands, security model, packaging, artifact names, distribution audience note.
- [x] REFERENCE_FIDELITY: observed / simplified / unverified table for every workspace element.
- [x] Workflow: `windows-latest`, `npm ci`, `npm test`, `npm run smoke`, `npm run make`, `actions/upload-artifact`; no release step; `workflow_dispatch` and push to main.

### Task 9: Hidden-window smoke harness and verification

**Files:**
- Create: `scripts/smoke.mjs`, `src/main/smoke-runner.mjs`
- Modify: `src/main/main.mjs` (smoke hook)

**Interfaces:**
- `npm run smoke` spawns Electron twice with a fresh temp userData: run 1 performs actions and quits; run 2 checks Resume state. Exit code 0 only if every check passes. Prints a JSON report.

- [x] Checks in run 1: title contains "Roseflow PC Mac Training"; ten lessons rendered; wrong-then-right answer; next question; help dialog open/close keeps the selected answer; handbook search "netmask" returns results; toggle blocks and play; after 1.2 s the current block is 1; stop; set command 128 shows 50.2%; zero non-file network requests observed; progress saved.
- [x] Checks in run 2: resumed lesson/question equals run 1's final location; playback is paused; blocks restored; restart (confirmed) clears completion.
- [x] Malformed-file check: run 3 starts with a garbage progress.json; expects a recovery notice and `completedLessons` empty.
- [x] Ran `npm test`, `npm run smoke`, `npm run make`; packaged executable smoke-tested; results in `docs/VERIFICATION.md`. The zip maker was dropped (cross-zip is incompatible with Node 25).
