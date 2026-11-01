# First Digital Segment, Retro Shell, and Robot Rosie — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Roseflow trainer into the Revision-4 brief's review build: a once-per-launch orientation film, a Start/Continue hub with a Rosie-guarded restart, one course whose only active content is the first digital segment (menu tour → digital vs analog → "One second ON" with a narrated in-app demonstration, a checked practice, a Robot Rosie preview, and Rosie's two-choice help), a rounder 3D Rosie with 24 expressions and removable glasses, three controllable audio layers with captions, and a retro Cal Poly archive theme around an untouched PC•MACs replica.

**Architecture:** Keep the reducer/controller in `src/renderer/app.mjs`, the pure-logic modules under `logic/`, the DOM modules under `ui/`, and the Three.js guide under `guide/`. New pure modules (cue player, restart guard, attempt assessment, question answering, audio synthesis plans, attention rate-limiting, schema v4) are tested with `node --test` without a browser; DOM/WebGL modules are exercised by the hidden-window smoke harness, which also records the review screenshots and the frame sequence for the recording. The PC•MACs replica (`ui/pcmacs.mjs`, `edit-view.mjs`, `control-window.mjs`, `soft-console.mjs`, `terminal.mjs`, the `.pc-frame`/`.win` CSS) is not restyled; the only replica change is per-fixture channel labels.

**Tech Stack:** Electron 44 (sandboxed renderer, strict CSP, no network), vanilla ES modules, vendored Three.js 0.186.1, Web Audio API (synthesized music/chirps/cues), Web Speech `speechSynthesis` (local Windows voices) for the narrator, `node --test`, the existing hidden-window smoke harness, `ffmpeg` (on PATH) to stitch the recording.

**Spec:** the Revision 4 brief, extracted from `C:\Users\atala\Downloads\Rose_Float_Training_Brief_With_Images.zip` (SHA-256 `3ae700f0…2eeb7`) — `Rose_Float_Training_Brief.md` plus `references/A–L.png` and `SOURCES.md`. A copy of the Markdown and `SOURCES.md` goes to `docs/brief/2026-10-31-revision-4/` in Task 1 so the plan travels with its spec. Executors read both.

## Global Constraints

- Simulation only: nothing connects to a controller; `connect-src 'none'` stays; no new network code path; the smoke "no network requests" check must keep passing.
- The PC•MACs replica keeps its appearance, menu order, labels, shortcuts (`Ctrl+1` Set Digitals On, `Ctrl+0` Set Digitals Off, as the manual's Edit menu screenshot pp. 133–134 shows) and mouse behaviour; the retro theme never touches `.pc-frame`, `.win`, `.w7btn`, `.field` and their children.
- Reference version stays: PC•MACs version 2 as documented in the January 13, 2021 manual; the team's build is unknown (`docs/REFERENCE_FIDELITY.md`). Values Out / Values In are vertical zoom of the analog scale (manual p. 77), not hardware signals; they remain "not simulated" and are taught in one short orientation.
- Time base: 30 frames per second, 8-second show (240 frames). The one-second event is frames `[30, 60)`: ON at `00:00:01.00`, OFF at `00:00:02.00`, exactly 30 frames.
- Channel naming for the segment: the digital channel the learner edits is labelled **Digital 0** (id `light-1`); the second row is **Digital 1** (id `light-2`). "Digital 0" is a name, logical ON = 1, OFF = 0. Legacy lessons keep "Light 1 Digital" / "Light 2 Digital".
- Three decisions stay open and are labelled "proposed, not confirmed" in UI and docs, never silently decided: (1) which Robot Rosie part Digital 0 drives; (2) whether "Show me" works on the learner's attempt or on a separate example; (3) whether typed answers may use an online service. Interim choices in this plan: (1) a proposed petal-flap mechanism in one config file; (2) the demonstration runs on an isolated copy and the learner's attempt is restored untouched afterwards; (3) answers come only from local lesson knowledge.
- Copy fixed by the brief (verbatim): display title **Roseflow — Cal Poly Rose Float Training**; subline **Pomona × San Luis Obispo · Learn by Doing**; buttons **Start your training**, **Continue your training**, **No saved training yet.**, **Continue training**, **Restart from the beginning**, **Cancel**, **Restart training**, **Use simple confirmation**, **Skip>>**, **Replay introduction**, **Try it**, **Click mascot to get help**; label **Tickle Rosie to reveal Restart.**; the existing-progress line “You already have training in progress. Last worked on: {local date and time}. Continue from {lesson, step}, or start a new run?”; the guard lines in Task 9; the handoff lines “Okay, now we know how to do this! Give it a try. If you need help, just let me know—click me and I'll show you.” and “Make Digital 0 turn ON at 1 second and OFF at 2 seconds. That's one second ON. Then play it back.”; the help-state lines in Task 12; the homepage description in Task 7.
- No new curriculum: the course lists exactly the three first-segment lessons and one non-clickable placeholder row; no assessments, gates, badges, final project, analog/terminal/SD-card training, no total duration.
- Audio: narration, music and mascot chirps are separate layers with separate volume/mute; captions always available; chirps stop on pause/skip/reveal/close; nothing overlaps a narrated line; reduced motion and saved volumes respected.
- Photos H–L are bundled as supplied (bytes unchanged) with captions, years, titles, awards and credits from `SOURCES.md`; 2025 is never called "latest"; "Cal sloth" means Cal Poly San Luis Obispo.
- Nothing is staged, committed or pushed (owner's instruction); plan steps therefore have no commit steps.

## Review Focus

1. **A save written mid-legacy-lesson (schema 3)** — Continue must resume that legacy lesson (it still exists in the archive) and say so, never claim a course checkpoint it does not have. Pinned by Task 3's `migrateProgress` test and Task 7's hub test.
2. **Restart activation at exactly the deadline** — `now === unlockDeadline` must be rejected (`now < unlockDeadline` only), and a second activation inside the window must not reset twice. Pinned by Task 9's guard tests (4.9 s, 5.0 s, 5.1 s, double activation).
3. **A correct one-second event drawn on Digital 1 instead of Digital 0** — must report "wrong channel", not "no data", and must not pass. Pinned by Task 10's assessment tests.
4. **Narration unavailable (no `speechSynthesis` voices, or a suspended `AudioContext`)** — the film and demonstrations must still run on captions with a visible sound-enable control, never a blank screen. Pinned by Task 5's cue-player test with a narrator that reports `available: false`, and Task 6's smoke check.
5. **Skip>> pressed during the first 300 ms while images are still decoding** — must open the hub immediately and stop audio. Pinned by Task 6's smoke check (skip at t=0).

---

### Task 1: Spec copy, archive assets, and approved links

**Files:**
- Create: `docs/brief/2026-10-31-revision-4/Rose_Float_Training_Brief.md`, `docs/brief/2026-10-31-revision-4/SOURCES.md`, `docs/brief/2026-10-31-revision-4/asset_sources.json` (copied from the extracted ZIP)
- Create: `src/renderer/assets/archive/H_1949_Rocking_Horse.png` … `L_2026_Jungle_Jumpstart.png` (byte-for-byte copies of references H–L)
- Create: `src/renderer/content/archive.mjs`
- Modify: `src/main/links.mjs`
- Test: `tests/archive.test.mjs`, `tests/links.test.mjs`

**Interfaces:**
- Produces: `ARCHIVE_DIR = 'assets/archive/'`; `ARCHIVE_PHOTOS: readonly [{ id: 'h'|'i'|'j'|'k'|'l', file, year: number, title, award, credit, sourcePage, imageUrl, rights, sha256 }]` in year order; `PROGRAM_FACTS: readonly [{ id, text, sourceUrl }]` (joint program, 1949, early partnership, 1978, 2024, 2025, 2026 — the seven rows of brief §12, text as given there).
- `APPROVED_LINKS` gains the five `sourcePage` URLs and the two program-history URLs from brief §12.

- [ ] **Step 1: Write the failing tests**

```js
// tests/archive.test.mjs
test('five archive photos in year order with captions, credits and sources', () => {
  assert.deepEqual(ARCHIVE_PHOTOS.map((p) => p.year), [1949, 1978, 2024, 2025, 2026]);
  assert.equal(ARCHIVE_PHOTOS.find((p) => p.year === 2025).award, 'Leishman Public Spirit Award');
  assert.equal(ARCHIVE_PHOTOS.find((p) => p.year === 1949).credit, 'Information Technology Services, Special Collections and Archives, Cal Poly; via Cal Poly Magazine');
  for (const p of ARCHIVE_PHOTOS) assert.ok(p.rights.includes('not established'));
});
test('the bundled archive files are the supplied bytes', async () => {
  for (const p of ARCHIVE_PHOTOS) {
    const bytes = await fs.readFile(new URL(`../src/renderer/assets/archive/${p.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), p.sha256);
  }
});
test('every archive source page is an approved link', () => {
  for (const p of ARCHIVE_PHOTOS) assert.ok(isApprovedLink(p.sourcePage));
  for (const f of PROGRAM_FACTS) assert.ok(isApprovedLink(f.sourceUrl));
});
```

- [ ] **Step 2: Run `node --test tests/archive.test.mjs` — expect FAIL (module not found)**
- [ ] **Step 3: Copy the files, write `archive.mjs` with the SHA-256 values from `asset_sources.json`, extend `links.mjs`**
- [ ] **Step 4: Run `node --test tests/archive.test.mjs tests/links.test.mjs` — expect PASS**

---

### Task 2: Preferences store and restart snapshot (main process)

**Files:**
- Create: `src/shared/prefs-schema.mjs`, `src/main/prefs-store.mjs`
- Modify: `src/main/progress-store.mjs` (`reset()` snapshots first), `src/main/main.mjs` (IPC `prefs:load`, `prefs:save`; `autoplayPolicy: 'no-user-gesture-required'`), `src/main/preload.cjs` (`window.roseflow.prefs.load/save`)
- Test: `tests/prefs-schema.test.mjs`, `tests/progress-store.test.mjs`

**Interfaces:**
- `DEFAULT_PREFS = { volumes: { narration: 1, music: 0.6, mascot: 0.8, ui: 0.5 }, muted: { narration: false, music: false, mascot: false, ui: false }, captions: true, simpleConfirm: false, reducedMotion: null }`; `validatePrefs(input) → { ok, value } | { ok: false, error }` (unknown keys dropped, volumes clamped 0–1, booleans coerced only from booleans).
- `createPrefsStore({ dir }) → { filePath, load(), save(prefs) }` — same atomic temp+rename as progress; an unreadable file is replaced by defaults, never crashes.
- `progressStore.reset() → { ok: true, snapshotPath: string | null }`: before removing `progress.json`, copies it to `progress.previous-run-<ISO stamp>.json`; keeps the three newest `previous-run` files.

- [ ] **Step 1: Write failing tests** — `validatePrefs` clamps `volumes.music: 2` to 1 and rejects `captions: 'yes'` → default; `createPrefsStore` round-trips and survives `{ bad json`; `reset()` leaves a `progress.previous-run-*.json` whose text equals the former file and prunes to three.
- [ ] **Step 2: Run them — expect FAIL**
- [ ] **Step 3: Implement; register IPC; expose in preload; set `autoplayPolicy`**
- [ ] **Step 4: Run `node --test tests/prefs-schema.test.mjs tests/progress-store.test.mjs` — expect PASS**

---

### Task 3: Progress schema version 4 (training state, one course)

**Files:**
- Modify: `src/shared/progress-schema.mjs`
- Test: `tests/progress-schema.test.mjs`

**Interfaces:**
- `SCHEMA_VERSION = 4`; `LEVELS` gains `'course'`; `VIEWS` gains `'course'`, `'hub'` is **not** added (the hub saves as `'home'`).
- New section `training: { lastActivityAt: string|null, checkpoint: { lessonId: string, stepIndex: number } | null, watched: string[], skipped: string[], attempted: string[], assisted: string[], completed: boolean, restarts: { count: number, lastAt: string|null } }` with `readTraining(input)` defaulting every field.
- `createEmptyProgress({ restarts } = {})` lets a fresh document carry the previous run's restart record.
- `migrateProgress` handles 3 → 4: everything kept; `training.lastActivityAt = savedAt` when `learning.completedSteps.length > 0`, else `null`; `training.checkpoint = location.lessonId ? { lessonId, stepIndex } : null`; `migrated: { fromSchemaVersion: 3, originalSavedAt, originalView }`. The 1→4 and 2→4 paths produce the same `training` defaults.
- `validateProgress` rejects `training.checkpoint` with a non-integer `stepIndex` (`'invalid-training'`).

- [ ] **Step 1: Write failing tests** — `migrateProgress(v3Doc)` yields version 4 with the checkpoint and `lastActivityAt` rules above (both branches), a v3 file mid-`b-timeline-graph` keeps `location.lessonId` so Continue can resume it (Review Focus 1); `validateProgress` of a v4 doc with `training.checkpoint.stepIndex: 'x'` → `invalid-training`; `createEmptyProgress({ restarts: { count: 2, lastAt: 'ISO' } })` carries them; existing v1/v2 tests updated to expect version 4.
- [ ] **Step 2: Run `node --test tests/progress-schema.test.mjs` — expect FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run `node --test tests/progress-schema.test.mjs tests/progress-store.test.mjs` — expect PASS (store backup becomes `progress.v3-backup.json` automatically)**

---

### Task 4: Audio engine (synthesized layers, narrator, chirps, cues)

**Files:**
- Create: `src/renderer/logic/audio-plan.mjs` (pure), `src/renderer/ui/audio.mjs` (Web Audio + speechSynthesis)
- Test: `tests/audio-plan.test.mjs`

**Interfaces:**
- `audio-plan.mjs` (no DOM): `MUSIC = { sting, bed, done }` note plans `[{ at, dur, freq, gain, wave }]` with `bed.loopLength` seconds; `chirpPhrase(text, emotion) → [{ at, dur, freq, gain }]` — one burst per word group split at punctuation, at most `CHIRP_MAX_PER_SECOND = 7`, gap ≥ 90 ms at `, . ! ?`, pitch base by emotion (`excited` ×1.25 faster/brighter, `concern` ×0.85 slower/softer, `neutral`); `pickVoice(voices) → voice|null` prefers `en-US` voices whose name matches `/david|guy|mark|ryan|christopher|eric|roger/i`, then any `en-US`, then any `en`; `limiter(minGapMs) → (now) => boolean` for UI cues.
- `ui/audio.mjs`: `createAudio({ prefs, speech = window.speechSynthesis, AudioContextCtor = window.AudioContext }) → { enable(), state(): 'ready'|'blocked'|'off', setPrefs(p), music: { sting(), bed(), stop(), done() }, narrate(text) → Promise<{ spoken: boolean }> (resolves at utterance end; `spoken:false` immediately when no voice), pauseNarration(), resumeNarration(), cancelNarration(), chirp(text, emotion), stopChirps(), cue(kind: 'hover'|'click'|'pass'|'miss'), available(): { narration: boolean, audio: boolean } }`. The narrator never speaks while a chirp phrase plays: `narrate` calls `stopChirps()` first; `chirp` is ignored while an utterance is active.

- [ ] **Step 1: Write failing tests** for `chirpPhrase` density and punctuation gaps, emotion tempo, `pickVoice` preference order and null on empty, `limiter`, `MUSIC.bed` loop length > 8 s with all gains ≤ 0.25.
- [ ] **Step 2: Run `node --test tests/audio-plan.test.mjs` — expect FAIL**
- [ ] **Step 3: Implement both modules** (`ui/audio.mjs` guards every `AudioContext`/`speechSynthesis` access in try/catch and reports `state()`).
- [ ] **Step 4: Run the test — expect PASS**

---

### Task 5: Cue player (one clock for narration, captions, pointer and Rosie cues)

**Files:**
- Create: `src/renderer/logic/cue-player.mjs`
- Test: `tests/cue-player.test.mjs`

**Interfaces:**
- A *film* is `{ id, beats: [{ id, say?: string, caption?: string, rosie?: { expression, glasses?, line?, chirp?: 'excited'|'neutral'|'concern' }, minMs?: number, actions?: [{ at: number, ...cue }] }] }`. `cue` kinds: `{ pointer: controlId }`, `{ click: controlId }`, `{ drag: { pane: 'digital'|'analog', channel, fromSec, toSec, button: 0|2 } }`, `{ type: controlId, text }`, `{ dispatch: action }`, `{ menu: 'edit' }`, `{ wait: ms }`.
- `createCuePlayer(film, { narrator, perform, onCaption, onRosie, onBeat, onDone, now = () => performance.now(), setTimeout, clearTimeout }) → { play(), pause(), resume(), stop(), replay(), seekBeat(i), status(): { beat, playing, paused, elapsedMs, done } }`.
  - A beat ends when its narration promise has resolved **and** its last action has fired **and** `minMs` has elapsed; `narrator(text) → Promise<{ spoken }>`; when `spoken === false` the beat lasts `max(minMs, captionMs(text))` with `captionMs = 1500 + 60·words`.
  - `pause()` freezes the clock, cancels pending timers, calls `narrator.pause()`; `resume()` reschedules remaining actions from the frozen elapsed time; `stop()`/`replay()` call `narrator.cancel()` and `onRosie({ chirp: 'stop' })`.
  - `perform(cue)` is awaited for `click`/`drag`/`type`/`dispatch`/`menu` so the UI can wait for the expected state before the next cue.

- [ ] **Step 1: Write failing tests** with fake timers (`setTimeout` captured in an array; `now` driven manually): beats run in order; actions fire at their offsets; a beat with narration `spoken:false` lasts `captionMs`; pause at 400 ms then resume fires the 600 ms action 200 ms after resume; `replay()` cancels narration and restarts at beat 0; `stop()` emits `chirp:'stop'`; `onDone` fires once.
- [ ] **Step 2: Run `node --test tests/cue-player.test.mjs` — expect FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run — expect PASS**

---

### Task 6: Opening film (once per launch, Skip>> from frame one)

**Files:**
- Create: `src/renderer/content/intro.mjs` (the film: eight beats of brief §13 with the narration text verbatim, photos H–L by `ARCHIVE_PHOTOS` id, captions with year/title/award), `src/renderer/ui/intro.mjs`
- Modify: `src/renderer/index.html` (a `<section id="film" hidden>` before `#guide-layer`), `src/renderer/styles.css`, `src/renderer/app.mjs` (view `'intro'` at boot; actions `intro-skip`, `intro-done`, `intro-replay`, `intro-pause`, `intro-resume`, `sound-enable`; `state.intro = { shown: false, playing: false }`), `src/main/smoke-runner.mjs`
- Test: `tests/intro-content.test.mjs`; smoke checks in scenario `first`

**Interfaces:**
- `INTRO_FILM` (a cue-player film) with beats `leader, campuses, 1949, 1978-2024, 2024-2025, 2026, practice, ready`; every photo beat carries `{ photo: 'h'|'i'|'j'|'k'|'l' }` and its caption string `"{year} · {title} · {award}"`.
- `mountIntro(section, { dispatch, audio, cuePlayerFactory }) → { start(), stop(), update(state) }`: renders the stage (tape leader, title card “Roseflow — Cal Poly Rose Float Training”, campus labels of equal size, an archive print frame for the photo with grain and faded edges, a caption strip, a simulated ON/OFF indicator for the `practice` beat), a **Skip>>** button at the upper right rendered before any image loads, Pause/Resume, a sound-enable button shown when `audio.state() === 'blocked'`, and the Rosie cue through `onRosie` (the guide layer anchors her to `#film-rosie-dock`).
- App: `boot()` sets `state.view = 'intro'` before loading progress; `intro-done`/`intro-skip` set `state.intro.shown = true` and `state.view = 'home'`; `go-home`, resize and lesson return never set `view = 'intro'` again; `intro-replay` (Home's **Replay introduction**) does.

- [ ] **Step 1: Write the failing content test** — eight beats; narration texts equal the brief's lines; photos appear in the order h, i, j, k, l; the `2026` beat caption contains `2026` and `Sweepstakes Award`; no caption calls 2025 "latest".
- [ ] **Step 2: Add smoke checks (scenario `first`)**: on load `state.view === 'intro'`; `#film [data-fid="skip"]` exists and is visible within 100 ms of ready; pressing Skip>> at once → `view === 'home'` and `audio.music` stopped (`window.roseflowDebug.audio().music === 'stopped'`); `intro-replay` reopens it; `go-home` afterwards does not. Review Focus 4 and 5 covered here (the harness forces `audio.state() === 'blocked'` through `roseflowDebug.audioBlock(true)` and asserts the sound-enable button is shown while captions advance).
- [ ] **Step 3: Run the unit test — expect FAIL; implement content, UI, styles and app wiring**
- [ ] **Step 4: Run `node --test tests/intro-content.test.mjs` — PASS; `npm run smoke` scenario `first` — the new checks pass (older Home checks will fail until Task 7; note them)**

---

### Task 7: Hub (Start / Continue), course view, legacy archive, theme

**Files:**
- Create: `src/renderer/content/course.mjs`, `src/renderer/ui/hub.mjs`, `src/renderer/ui/course.mjs`, `src/renderer/logic/hub-state.mjs`
- Modify: `src/renderer/app.mjs` (`state.view` values `home`→hub rendering, `course`; actions `start-training`, `continue-training`, `open-course`, `open-archive`, `existing-progress-open/close`; `training.lastActivityAt` stamped only in `lessonCheck` pass, `step-answer`, `step-next`, demo finish), `src/renderer/ui/home.mjs` (deleted; replaced by `hub.mjs`), `src/renderer/ui/level.mjs` (header "Earlier lessons (archive)"), `src/renderer/ui/progress.mjs` (archive link), `src/renderer/index.html` (identity header copy), `src/renderer/styles.css` (theme tokens), `src/renderer/logic/guide-plan.mjs` (`hubPlan`, `coursePlan`)
- Test: `tests/hub-state.test.mjs`, `tests/course.test.mjs`; smoke scenarios `first`, `resume`, `legacy`, `legacy2`

**Interfaces:**
- `COURSE = { id: 'course', title: 'Rose Float training', lessons: ['s1-orientation', 's1-digital-vs-analog', 's1-one-second-on'], placeholder: 'Further steps will be added after Atalay reviews this segment.' }`; `COURSE_LESSONS` resolved from `LESSONS_BY_ID` (Task 11 adds them; until then the module throws at import if an id is missing, so Task 11 must land before the app boots — order the work accordingly or stub the three lessons in Task 7 and replace in Task 11).
- `hubState({ progress: { loaded, error, recovered }, training, learning, location }) → { kind: 'loading'|'unreadable'|'none'|'in-progress'|'completed', continueEnabled: boolean, continueLabel, startLabel, lastActive: Date|null, checkpoint: { lessonId, stepIndex, title, legacy: boolean } | null, explain: string }`. `'completed'` when `training.completed`; `'in-progress'` when `training.lastActivityAt` or any `learning.completedSteps`; a saved legacy `location.lessonId` yields `checkpoint.legacy = true` with `explain` naming the archive (Review Focus 1); hovering/intro/tickling never change `lastActivityAt` (only the app paths listed above write it).
- `mountHub(container, { dispatch }) → { update(state) }`: title, subline, the archive photo stage (one `ARCHIVE_PHOTOS` print with year/title/award, `data-react="photo"`, rotates on each visit), Rosie dock, the homepage description paragraph from brief §12 verbatim, **Start your training** (left, `data-control="start-training"`, `data-react="start"`) and **Continue your training** (right, `data-control="continue-training"`, `data-react="continue"`, `disabled` attribute when `!continueEnabled`, with the explanation line under it: **No saved training yet.** / last-active local date via `toLocaleString()` / the unreadable-save explanation and “Recover” pointing to the quarantined path), quieter Handbook / Progress / Help, **Replay introduction**, and the existing-progress `<dialog>` (title line from the brief, **Continue training**, **Restart from the beginning**, **Cancel**).
- Theme tokens in `:root`: `--ws-green #184a2c`, `--ws-green-2 #215f39`, `--gold #d9a21b`, `--gold-soft #f1cf6b`, `--cream #f4ecd8`, `--cream-2 #fbf6ea`, `--ink #1a1a17`, `--rose #e0728a`, `--rose-deep #b8475f`, `--tape-font Consolas…`; headings Bahnschrift SemiBold, body Segoe UI; a `body::after` grain overlay at 4% opacity disabled under reduced motion; tactile `:active` transform on `.btn`. Applied to header, hub, course, panel, handbook, progress, dialogs, notices, intro, help; **not** to `.pc-frame`, `.win`, `.w7*`, `.field`, `.term-*`.

- [ ] **Step 1: Write failing tests** — `hubState` for all five kinds; disabled Continue for `none`; `completed` leads to a review label; legacy checkpoint flagged; `course.test.mjs` asserts exactly three lesson ids and that none of `b-`, `i-`, `h-` lessons are in the course.
- [ ] **Step 2: Update smoke**: `first` — after Skip, `[data-control="continue-training"]` has `disabled` and clicking it leaves `view === 'home'`; explanation text equals `No saved training yet.`; the three level rows are gone; **Start your training** opens `s1-orientation` step 1. `resume` — Continue enabled with a local date string matching `new Date(savedAt).toLocaleString()`; Start opens the existing-progress dialog; Cancel changes nothing. `legacy2` — Continue resumes `b-timeline-graph` and the hub explanation mentions “archive”.
- [ ] **Step 3: Implement** (hub, course view with the three rows + placeholder row `aria-disabled`, archive entry from Progress, theme CSS, header copy, guide plans).
- [ ] **Step 4: Run `node --test`, then `npm run smoke` — all scenarios pass except checks that depend on Tasks 8–13 (list them in the task log)**

---

### Task 8: Attention: hover/focus reactions with dwell and rate limits

**Files:**
- Create: `src/renderer/logic/attention.mjs`
- Modify: `src/renderer/ui/guide-layer.mjs` (listen for `pointerover`/`focusin` on `[data-react]`, feed `attention`, apply its reaction as a transient expression/line/chirp over the plan), `src/renderer/content/mascot.mjs` (`REACTIONS` lines)
- Test: `tests/attention.test.mjs`

**Interfaces:**
- `createAttention({ dwellMs = 350, repeatMs = 4000, speakAfterMs = 1500 }) → { enter(kind, id, clock), leave(clock), update(clock) → { react: { kind, expression, line: string|null, chirp: boolean } | null } }` with kinds `start` → `{ expression: 'alertness' leaning, line: null }`, `continue` → `'satisfaction'`, `continue-disabled` → `'neutral'` glance (never a line), `photo` → `'wonder'` and after `speakAfterMs` the photo caption as line, `help` → `'reassuring'`. The same element never reacts twice within `repeatMs`; a reaction never fires before `dwellMs`; `leave()` cancels a pending one.

- [ ] **Step 1: Write failing tests** for dwell, repeat limit, leave-cancel, disabled Continue never speaking, photo line after the long dwell.
- [ ] **Step 2: Run — FAIL; implement logic and layer hooks (the layer calls `audio.cue('hover')` through the limiter only when a reaction fires)**
- [ ] **Step 3: Run `node --test tests/attention.test.mjs` — PASS**

---

### Task 9: Rosie guards Restart (five-second tickle), simple confirmation, recoverable reset

**Files:**
- Create: `src/renderer/logic/restart-guard.mjs`, `src/renderer/ui/restart-dialog.mjs`
- Modify: `src/renderer/app.mjs` (actions `restart-request` opens the guarded dialog; `guard-tickle`, `guard-activate`, `guard-tick`, `guard-blur`, `guard-simple`, `restart-cancel`; `restart()` keeps prefs, calls `api.progress.reset()`, creates a fresh doc with `restarts: { count: old + 1, lastAt: now }`, sets `view = 'lesson'` on `s1-orientation` step 0), `src/renderer/ui/dialogs.mjs` (old confirm removed), `src/renderer/ui/guide-layer.mjs` (anchor kind `cover`: she stands centred over the target rect; in this dialog her canvas gets `pointer-events: auto` and a focusable `<button class="rosie-hit">` with `aria-label="Rosie"` sits over her, Enter/Space tickles), `src/renderer/logic/guide-plan.mjs` (`guardPlan`), `src/renderer/content/mascot.mjs` (`GUARD_LINES`), `src/renderer/guide/rosie-model.mjs` (`expression: 'tickled'` pose: wriggle, arms in)
- Test: `tests/restart-guard.test.mjs`; smoke scenario `resume`

**Interfaces:**
- `createRestartGuard({ now, unlockMs = 5000, completed = false, restarts = { count, lastAt }, lastActivityAt }) → { open(), tickle(), activate() → { ok: boolean, reason? }, tick(), blur(), close(), state(): { phase: 'guarded'|'tickling'|'unlocked', deadline: number|null, remainingMs, timeouts: number, line: { id, text }, hint: 'Tickle Rosie to reveal Restart.' } }`.
  - `tickle()` in `guarded` → `tickling` (consumes the activation; `activate()` during `tickling` returns `{ ok:false, reason:'tickling' }`); `cleared()` (called by the UI once her move-away animation finished, or at once under reduced motion) → `unlocked` with `deadline = now() + unlockMs`.
  - `activate()` returns `ok:true` only when `phase === 'unlocked' && now() < deadline`, then moves to `phase: 'done'` so a second activation returns `{ ok:false, reason:'done' }`.
  - `tick()` after the deadline → `guarded`, `timeouts += 1`, the line changes: first timeout → “Hey—are you really sure? I can still take you back to where you left off.”, after tickle “Hehe! Okay, five seconds. Your call!”; second or later → “Another tickle? I think you've discovered my weakness, not the Restart button.” / “All right, all right—button's clear!”; a later separate attempt (`restarts.count > 0`) opens with “Back at the beginning again? Your last training activity was {actual local date}. Want a fresh run, or shall we continue?” / after tickle “Fresh start, fresh notebook. You've got five seconds!”; `completed` opens with “Finished already and coming back for another run? I like your enthusiasm!”; otherwise the initial line “Hold on! You've already made progress. Are you sure you want to start your training over?”. The same line id is never chosen twice in a row.
  - `blur()` (window blur / visibility hidden) → `guarded` without counting a timeout; `close()` clears everything.
- `mountRestartDialog({ dispatch, guard }) → { update(state) }` renders the themed dialog: the line, **Continue training**, **Restart training** (`disabled` unless `unlocked`, with a readable `m:ss`→`5 s… 1 s` countdown `data-ref="countdown"`), **Cancel**, the hint, **Use simple confirmation** (switches to a plain confirm with the same **Restart training** button enabled and no timer; the choice is saved in prefs `simpleConfirm`). Escape = Cancel. The dialog body uses `inert` on the rest of the page.

- [ ] **Step 1: Write failing guard tests** with a controlled clock: tickle→cleared→activate at +4900 ms ok; at +5000 ms rejected; at +5100 ms rejected and `tick()` re-guards with `timeouts === 1` and the first-timeout line; double activation; blur re-locks without a timeout; tickle during tickling ignored; line sequence for second timeout; the restarts-history line with a formatted date; completed line; no immediate line repeat (Review Focus 2).
- [ ] **Step 2: Run — FAIL; implement logic, dialog, layer cover anchor, app wiring, the tickled pose (unit test in `rosie-model.test.mjs`: `poseFor({ expression: 'tickled', t: 0.2 })` has `root.roll !== 0` and both arms in; reduced: still)**
- [ ] **Step 3: Smoke (`resume`)**: `restart-request` opens the dialog with Restart `disabled`; `guard-tickle` then (after `cleared`) Restart enabled and countdown text `5 s`; `guard-activate` before the deadline resets, writes a fresh doc with `training.restarts.count === 1`, and a `progress.previous-run-*.json` exists in user data; reopening the dialog starts guarded with the history line containing the local date; `window.dispatchEvent(new Event('blur'))` during unlock re-guards.
- [ ] **Step 4: Run `node --test tests/restart-guard.test.mjs` — PASS; `npm run smoke` scenario `resume` — PASS**

---

### Task 10: Segment fixture, channel labels, attempt assessment, preview tracking

**Files:**
- Create: `src/renderer/logic/digital-task.mjs`
- Modify: `src/renderer/logic/simulation.mjs` (`channelLabel(sim, id)`), `src/renderer/ui/edit-view.mjs` (digital name buttons read `channelLabel` on update), `src/renderer/ui/float-panel.mjs` (lamp text uses `channelLabel`), `src/renderer/app.mjs` (`sim.names = {}` in `freshSim`; action `set-channel-names`; `sim.lastPlay = null` set on `stop`/`playback-complete` to `{ from: playStartFrame, to: sim.frame }`; `play` records `playStartFrame`)
- Test: `tests/digital-task.test.mjs`, `tests/simulation.test.mjs`

**Interfaces:**
- `channelLabel(sim, id)` → `sim.names?.[id] ?? (digital ? \`${name} Digital\` : name)`.
- `SEGMENT_NAMES = { 'light-1': 'Digital 0', 'light-2': 'Digital 1' }`; `TASK = { channelId: 'light-1', label: 'Digital 0', on: 30, off: 60 }`.
- `assessAttempt({ sim, task = TASK }) → { state, message, detail }` with `state` ∈ `no-channel` (no selection channel and no ON data anywhere), `wrong-channel` (ON data on another digital and none on the task channel), `selection-no-data` (a selection on the task channel, no ON data), `too-long` (ON span ends after `off`), `stays-on` (ON through the end), `too-short`/`misplaced` (first ON span ≠ `[on, off)`), `extra-data` (a second ON span), `other-channel-changed` (any other digital or analog differs from the fixture baseline passed in `sim.baseline`), `not-previewed` (data right, `sim.lastPlay` does not cover `[on, off]`), `done`. Messages use the brief's help lines verbatim (Task 12 table) plus the precise boundaries as `hh:mm:ss.ff`.
- `validateOneSecond(ctx)` — the practice validator: `done` → `{ ok: true, message: 'Yes! One second ON. You got it!' }`; everything else `{ ok: false, message }`.

- [ ] **Step 1: Write failing tests** — each state reachable from a constructed `sim` (Review Focus 3: a perfect `[30,60)` on `light-2` → `wrong-channel`); `[30,61)` → `too-long` naming `00:00:02.00` and `00:00:02.01`; `[30,60)` with `lastPlay: { from: 0, to: 59 }` → `not-previewed`; `lastPlay: { from: 0, to: 239 }` → `done`; zoom change never alters the state; `channelLabel` falls back correctly.
- [ ] **Step 2: Run — FAIL; implement**
- [ ] **Step 3: Run `node --test tests/digital-task.test.mjs tests/simulation.test.mjs` — PASS**

---

### Task 11: The first segment's lessons (content) and the demonstration film

**Files:**
- Create: `src/renderer/content/lessons/segment-digital.mjs`, `src/renderer/content/films/one-second-on.mjs`
- Modify: `src/renderer/content/levels.mjs` (register the segment lessons in `LESSONS_BY_ID` without adding them to any level), `src/renderer/content/lessons/steps.mjs` (`film` step kind: `{ kind: 'film', film, then: 'try' }` and `practice` steps may carry `film` as their demonstration), `src/renderer/content/handbook.mjs` (concept entries: `channel`, `digital`, `analog`, `timeline`, `playhead`, `selection`, `on-off`, `preview` — plain definitions for first use), `src/renderer/content/controls.mjs` (entries `robot-preview`, `rosie-help`, `film-skip`, `film-pause`, `sound-settings`, `start-training`, `continue-training`, `replay-intro`)
- Test: `tests/segment-content.test.mjs`, `tests/content.test.mjs`

**Interfaces:**
- `s1-orientation` “Meet the PC•MACs screen” — steps (ids): `workspace` (explain, reveal title/ruler/analog/digital; defines *timeline* and *channel*), `menu-file`, `menu-edit`, `menu-realtime`, `menu-offline`, `menu-channels`, `menu-preferences`, `menu-time-out`, `menu-time-in`, `menu-values-out`, `menu-values-in`, `menu-help` (each: target `menu-<id>`, explanation naming location + purpose + one reason, a `demo` that performs `{ menu: id }` and, for `time-in`/`time-out`, `{ dispatch: { type: 'zoom', dir } }` with the outro “The view changed; the data did not.”), `reach-screen` (explain: File ▸ Open… and Offline ▸ Move to Offline are shown as the manual lists them and are not simulated; the training show is already open on the Edit View), `q-zoom` (question: “Time In made the bars look longer. Did the event get longer?” correct: no).
- `s1-digital-vs-analog` “Digital versus analog, briefly” — `digital` (explain + demo drawing a Digital 1 ON bar then removing it), `analog` (explain + demo changing an analog value and restoring it), `q-which` (question).
- `s1-one-second-on` “One second ON” — `watch` (film step: `ONE_SECOND_FILM`), `try` (practice: setup `[{ type: 'set-channel-names', names: SEGMENT_NAMES }, ...clearLight('light-1'), { type: 'select-range', from: 0, to: 0, channels: [] }, { type: 'snapshot-baseline' }]`, instruction = the brief's task line, triggers `['set-digital', 'draw-digital-done', 'select-range', 'play', 'stop', 'playback-complete']`, `validate: validateOneSecond`, `success: 'Digital 0 is ON from 00:00:01.00 to 00:00:02.00, OFF everywhere else, and you played it back.'`), `review-stop` (explain: “That is the end of this segment. Atalay will specify the next steps after reviewing it.”).
- `ONE_SECOND_FILM`: the nine beats of brief §6 with the narration verbatim, `[verified ON control]` replaced by “Edit ▸ Set Digitals On”, the hotkey line “or Ctrl+1”; actions: `{ click: 'channel-select' }` on Digital 0's name, `{ menu: 'time-in' }` ×2 with glasses on, `{ drag: { pane: 'digital', channel: 'light-1', fromSec: 1, toSec: 2, button: 0 } }`, `{ menu: 'edit' }` then `{ click: 'menu-set-digital-on' }`, the staged mistake `{ drag: … toSec: 3 }` + set on, the repair `{ drag: … fromSec: 2, toSec: 3 }` + `{ click: 'menu-set-digital-off' }`, `{ click: 'play' }`, glasses off, the handoff lines as `rosie.line`.
- `demo` cues on the orientation steps use the existing `demo.actions` shape with the new `{ menu }` action (Task 13 performs it).

- [ ] **Step 1: Write failing tests** — the three lessons exist with those step ids; every orientation menu step targets a `MENUS` id and the eleven menu labels are all covered; every new term appears in the handbook with a definition; `ONE_SECOND_FILM.beats.length === 9`; the mistake beat's drag ends at 3 s and the repair beat sets OFF over `[60, 90)`; narration strings match the brief; the practice instruction equals the brief's line; no lesson is in any `LEVELS` entry.
- [ ] **Step 2: Run — FAIL; write the content**
- [ ] **Step 3: Run `node --test tests/segment-content.test.mjs tests/content.test.mjs` — PASS**

---

### Task 12: Rosie's help: label, two choices, typed questions (local), state-specific hints

**Files:**
- Create: `src/renderer/logic/questions.mjs`, `src/renderer/content/qa.mjs`, `src/renderer/ui/rosie-help.mjs`
- Modify: `src/renderer/ui/guide-layer.mjs` (the **Click mascot to get help** label: a `<button id="rosie-help" data-control="rosie-help">` above her head, visible in the `try` beat of a practice step, keyboard-focusable, `pointer-events: auto`), `src/renderer/app.mjs` (actions `help-open-menu`, `help-close`, `help-show-me` → runs the step's film/demo on an isolated copy, `help-ask`, `help-question {text}`; records `training.assisted`), `src/renderer/content/mascot.mjs`
- Test: `tests/questions.test.mjs`

**Interfaces:**
- `QA` entries `{ id, kind: 'basic'|'advanced'|'unrelated-hint', keys: string[], answer, showMe?: boolean }` covering channel, digital/analog, ON/OFF, "Digital 0 means zero?", selection vs editing, timeline, playhead, preview, zoom; advanced: analog editing, terminal, SD card, PID, DMX addresses; the example answers from the brief verbatim (“Digital Zero is the channel's name. The value we record on that channel can still be ON or OFF.”; “That's a more advanced part of the system. You don't need to focus on that right now—let's get this digital event working first.”).
- `classifyQuestion(text, { stepId, attempt }) → { kind: 'basic'|'advanced'|'unrelated'|'uncertain', entry|null }`: basic when ≥1 basic key matches; advanced when only advanced keys match; unrelated when a word from `UNRELATED_HINTS` (weather, football, lunch…) matches and no training key does; otherwise **uncertain** (never unrelated merely because nothing matched).
- `answerQuestion(text, ctx) → { kind, text, showMe: boolean, suggestions: string[] }` with the uncertain text “I'm not sure I understood that. Can you say it another way? You can also open the Handbook for the verified reference.” and the unrelated text “I help with this training. Want to look at the timeline or Digital 0 instead?”.
- `hintFor(state)` maps `assessAttempt` states to the brief's lines: no-channel → “Let's pick Digital 0 first.”; wrong-channel → “The timing looks close—let's check which channel received it.”; selection-no-data → “We've selected where to work. Now let's turn that section on.”; too-long (2 s) → “We're close! Check the duration: we need one second.”; stays-on → “It starts correctly. Let's make sure it switches off at two seconds.”; not-previewed → “Looks ready. Let's play it and watch what happens.”; done → “Yes! One second ON. You got it!”.
- `mountRosieHelp({ dispatch, audio }) → { update(state) }`: a popover beside her with **“Do you want me to show you how this is done?”** and **“Do you have a different question?”**; the second reveals a text field, three suggested questions from `QA` relevant to the step, and the answer with an optional **Show me** button; Escape closes; focus returns to the help label.
- Documentation line (also in `docs/FIRST_SEGMENT.md`, Task 16): answers come from local lesson knowledge only; no provider, account or key; the online option is unresolved.

- [ ] **Step 1: Write failing tests** — the four kinds with examples (“what is digital 0”, “how do I set the PID gains”, “what's for lunch”, “qwzz”), `hintFor` table, suggestions depend on the step, `showMe` true for basic entries flagged.
- [ ] **Step 2: Run — FAIL; implement**
- [ ] **Step 3: Run `node --test tests/questions.test.mjs` — PASS**

---

### Task 13: Cinema runner: demonstration cursor, real control actions, captions, transport

**Files:**
- Create: `src/renderer/ui/cinema.mjs`
- Modify: `src/renderer/app.mjs` (`runFilm(film, { isolated: true })` replaces `runDemo` for steps with a film; `demo.actions` with `{ menu }` perform through cinema; `state.cinema = { playing, paused, beat, caption }`; actions `film-pause`, `film-resume`, `film-replay`, `film-stop`), `src/renderer/ui/pcmacs.mjs` (`openMenu(id)`, `menuItemElement(controlId)`), `src/renderer/ui/lesson.mjs` (film step beat: Pause/Resume/Replay/Skip + the **Try it** handoff button + caption strip + sound settings popover with the three sliders and captions toggle), `src/renderer/index.html` (`<div id="demo-cursor" hidden>` arrow), `src/renderer/styles.css`
- Test: smoke scenario `course` (new) in `src/main/smoke-runner.mjs`

**Interfaces:**
- `mountCinema({ findControl, pcmacs, dispatch }) → { perform(cue) → Promise<void>, cursorTo(rect), hideCursor(), setCaption(text) }`: `pointer` glides the arrow to the control's live rect (recomputed at call time, so a resize or open menu is accounted for), waits 250 ms; `click` moves there then calls `element.click()` on the real control (menu items through `pcmacs.menuItemElement`), waits until `document.contains(element)` is false or 120 ms; `drag` dispatches real `PointerEvent`s on the pane (down, two moves, up) exactly like the smoke harness; `type` sets the real input's value and dispatches `change`; `menu` opens through `pcmacs.openMenu`; `dispatch` goes through `dispatch`. If a control is missing or disabled, `perform` resolves after setting the caption “(waiting for {control})” and the player pauses (`onStall`).
- App: a film runs on an isolated copy — `snapshotShow()` before, `restoreShow()` after (Global Constraints, decision 2 interim); replay cancels the running player; `step-back`, leaving the lesson, and the help popover's “Show me” reuse the same runner; the practice fixture is reapplied after the demo; help “Show me” marks the step `assisted`.

- [ ] **Step 1: Add smoke scenario `course`**: Skip intro → Start → `s1-orientation`: `demo-start` on `menu-edit` opens the real Edit menu (`.pc-menu` visible) and closes; `menu-time-in` demo changes `sim.zoom` and leaves `sim.lights` equal; `s1-one-second-on` `watch`: `runFilm` reaches beat 9 with `lastPlay` covering `[30,60]` during the film, then `sim.lights['light-1']` is all OFF again (isolated copy restored); the cursor element moved (its transform changed ≥ 3 times); `film-pause` freezes `status().elapsedMs`; `film-replay` restarts at beat 0; **Try it** moves to the `try` beat with the fixture reset.
- [ ] **Step 2: Implement cinema, app glue, lesson panel film beat**
- [ ] **Step 3: Run `npm run smoke` scenario `course` — the Task 13 checks PASS**

---

### Task 14: Robot Rosie preview (separate mechanical model driven by outputs)

**Files:**
- Create: `src/renderer/content/robot-mapping.mjs`, `src/renderer/guide/robot-model.mjs`, `src/renderer/ui/robot-preview.mjs`
- Modify: `src/renderer/index.html` (`<aside id="robot" class="robot-preview" hidden>` inside `#desk` beside `#pcmacs`), `src/renderer/styles.css` (desk grid: `minmax(0,1fr) 280px`, stacks under 1180 px), `src/renderer/app.mjs` (`renderTick` updates the robot from `state.sim.outputs`, `outputSource`, `sim.frame`), `src/renderer/content/levels.mjs` (`WORKSPACE_PARTS` gains `'robot'`; the three segment lessons reveal it)
- Test: `tests/robot-model.test.mjs`, `tests/robot-mapping.test.mjs`

**Interfaces:**
- `ROBOT_MAPPING = { 'light-1': { part: 'petals', on: 'petals open', off: 'petals closed', status: 'proposed' }, 'light-2': null }`; `ROBOT_MAPPING_NOTE = 'Proposed mapping, not confirmed. Which Robot Rosie part Digital 0 drives is still Atalay's decision.'`.
- `buildRobot(THREE) → { root, parts: { chassis, head, petals: [6 hinge groups], eyeLamp, bolts }, materials }` — a boxy riveted chassis (`BoxGeometry` allowed here), a cylindrical head drum with a visible hinge ring, six flat petal plates on hinge pivots, an unlit eye lamp; metallic grey/green with rose-red petals; **no face drawing, no leaf mittens** (must not read as the guide).
- `robotPose({ outputs, mapping, t }) → { petalAngle: 0|OPEN_ANGLE (1.1 rad), eyeLamp: boolean, hum: number }` — `petalAngle` from `outputs.lights['light-1']` only; nothing from selection, zoom or pointer.
- `mountRobotPreview(aside, { THREE }) → { update({ sim }) }`: title “Robot Rosie”, badge “Simulated preview”, the mapping sentence with the proposal note, a readout “Digital 0: ON (1)” / “OFF (0)”, the source line (“Following the show at 00:00:01.12” / “Stopped: holding frame …” / “Manual mode: Soft Console”), the canvas (WebGL; a 2D canvas drawing of the same petals without WebGL). Rendering runs only when revealed and the page is visible, at most 30 fps, and only when the pose key changes.

- [ ] **Step 1: Write failing tests** — `robotPose` ignores a `selection`/`zoom` field and follows `outputs.lights['light-1']`; `ROBOT_MAPPING['light-1'].status === 'proposed'`; `buildRobot` has six petal pivots, no `MeshToonMaterial` face plate, and a bounding box ≤ 2.4 wide.
- [ ] **Step 2: Run — FAIL; implement**
- [ ] **Step 3: Smoke (`course`)**: during the film's playback beat the robot readout reads `ON (1)` while `sim.frame ∈ [30,60)` and `OFF (0)` at frame 90; selecting a range and zooming never change the readout.
- [ ] **Step 4: Run `node --test tests/robot-model.test.mjs tests/robot-mapping.test.mjs` — PASS**

---

### Task 15: Rosie: rounder body, glasses, 24 expressions with speaking/silent variants

**Files:**
- Modify: `src/renderer/guide/rosie-model.mjs` (torso: a broad ellipsoid `scale [0.46, 0.5, 0.4]` at `y 0.55` replacing the capsule stem; arms: short capsules `r 0.11, len 0.3` with round mittens; feet larger and rounder; `glasses` group on the head: two torus rims r 0.2 + a bridge + two temple capsules, `visible` by pose; `poseFor` accepts `glasses: boolean` and `expression` from the 24 names), `src/renderer/guide/face.mjs` (parametric: `EXPRESSIONS` table of 24 + `neutral`, `curious`, `reassuring`, `sheepish`, `nerdy`; params `{ browAngle: -1..1, browHeight: -1..1, browCurve, eyeOpen: 0..1.3, eyeShape: 'round'|'narrow'|'wide'|'happy'|'closed'|'squeeze', pupil: 0.5..1.2, mouth: 'smile'|'grin'|'cat'|'open'|'o'|'wobble'|'frown'|'flat'|'grimace'|'teeth'|'gasp'|'cry', mouthWidth, blush, tears: boolean, sweat: boolean, veins: boolean }`; legacy names `wave→joy`, `point→alertness`, `happy→satisfaction`, `cheer→laughter`, `oops→anxiety`, `idle→neutral`, `tickled→laughter`; `drawFace` renders tears/sweat/vein marks), `src/renderer/content/mascot.mjs` (`EXPRESSION_FAMILIES`), `src/renderer/logic/step-beats.mjs` (`expressionFor` returns family names), `scripts/contact-sheet.mjs` (new: renders the 24 faces + 5 extras × {silent, speaking} to one PNG through the hidden Electron window; writes `docs/review/2026-10-31/expressions.png`)
- Test: `tests/face.test.mjs`, `tests/rosie-model.test.mjs`

**Interfaces:**
- `EXPRESSION_NAMES` = the 24 of brief §3 in family order plus the five extras; `faceParams(name, mood)` returns a full param object; `distinct(a, b)` (test helper in the test file) requires at least two params to differ by ≥ 0.25 or a different `mouth`/`eyeShape` between every pair of neighbours in a family and between all 24.
- `poseFor({ expression, glasses, … })` returns `pose.glasses` (boolean) and the family body language: firmness → brows down, arms akimbo; dislike → head turned away; worry → arms in, slight tremble at `fear`/`terror`; happiness → the existing bounce; sadness → droop increasing with intensity; discovery → head up, arms out at `shock`.
- `applyPose` sets `parts.glasses.visible = pose.glasses`.

- [ ] **Step 1: Write failing tests** — 29 names; every neighbouring pair in each family distinct; all 24 mutually distinct by the rule; `faceParams('laughter')` has `mouth: 'open'` and `eyeShape: 'closed'`; speaking variant: `drawFace(...,{ mouthOpen: 0.9 })` issues more `fill` calls than silent for every expression; glasses toggle through pose; torso width ≥ 0.8 units and bounding box still ≤ 2.3 wide and 2.3–3.0 tall; `legacy 'cheer'` maps to `laughter`.
- [ ] **Step 2: Run — FAIL; implement model, face, mappings, contact-sheet script**
- [ ] **Step 3: Run `node --test tests/face.test.mjs tests/rosie-model.test.mjs` — PASS; run `node scripts/contact-sheet.mjs` and view the PNG**

---

### Task 16: Verification, recording, docs, and the report

**Files:**
- Create: `docs/FIRST_SEGMENT.md` (what the segment does; evidence per technical claim; the three open decisions; the question engine is local; what "activate" means; frame boundaries), `docs/VERIFICATION-2026-10-31.md`, `docs/review/2026-10-31/` (screenshots, `expressions.png`, `watch-try-help-retry.mp4`, `skip-continue-start-tickle-restart.mp4`), `scripts/record.mjs` (runs the smoke `record` scenario that captures frames at ~4 fps into a folder, then invokes `ffmpeg -framerate 4 -i %04d.png -vf scale=1280:-2 -pix_fmt yuv420p out.mp4`)
- Modify: `README.md`, `docs/SETUP.md` (schema 4, prefs file, previous-run snapshots, audio, the review build), `docs/REFERENCE_FIDELITY.md` (Values In/Out orientation; channel labels per fixture; Robot Rosie is trainer-only), `src/main/smoke-runner.mjs` (scenario `record`: two sequences from brief §17), `package.json` (`"record": "node scripts/record.mjs"`)

- [ ] **Step 1: Run `npm test` — all pass; run `npm run smoke` — all scenarios pass; `node scripts/smoke.mjs --shots docs/review/2026-10-31` — captures: intro, hub without save, hub with save, guarded dialog, unlocked dialog, orientation step, film beat, try beat with Robot Rosie, help menu, typed question, a correction, the pass**
- [ ] **Step 2: Run `npm run record` — both MP4s exist and play (check with `ffprobe`)**
- [ ] **Step 3: Run `npm run package` — the packaged folder launches the hidden smoke (`node scripts/smoke.mjs --exe …`) with the `first` scenario passing**
- [ ] **Step 4: Write the docs and the verification record (checks run, results, limits, unresolved items)**

---

## Self-review notes

- Spec coverage: §0 (reuse, skills, remove levels) → Tasks 7, 16; §1/§4/§5/§6 (segment, watch→try, handoff, storyboard, exact interval) → Tasks 10, 11, 13; §2 (sound layers, captions) → Tasks 4, 13; §3 (24 expressions, glasses, rounder body) → Task 15; §7 (help, questions, visible mouse actions, state table) → Tasks 12, 13; §8 (no invented lessons) → Task 7 course + 11; §9 (audit, pointer from control identity, one clock, isolated data) → Tasks 5, 13, 16; §10/§17 acceptance → Task 16 record; §11 (theme, credits) → Tasks 1, 7; §12 (history, captions) → Tasks 1, 6; §13 (intro, Skip>>) → Task 6; §14 (hub states, dialog) → Task 7; §15 (tickle guard) → Task 9; §16 (cursor reactions) → Task 8 (+ existing interaction machine); confirmed direction rows 3/7 (Robot Rosie) → Task 14; 10 (questions) → Task 12; 11 (downloadable) → Task 16.
- Known gap stated rather than hidden: the narrator is Windows' installed speech voice, not a recorded actor; whether it is masculine depends on the voices installed (`pickVoice` prefers the male Microsoft voices); music and chirps are synthesized, not composed by an audio designer; the reference clip was not auditioned. Task 16 reports this.
- Ordering: Task 11 (content) must exist before the app boots with Task 7's course import; execute 10 → 11 → 7 → 13 if working strictly in order, or stub the three lesson ids in Task 7.
