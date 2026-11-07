# Setup, build, and packaging

## Requirements

- Windows 10 or 11 for packaging and for the packaged app.
- Node.js 20 or newer and npm (developed with Node 25.0.0, npm 11.6.2).
- No network access is required to run or learn. Network is needed only for
  `npm ci` and for opening the linked manuals from the Progress tab.

## Commands

| Command | What it does |
| --- | --- |
| `npm ci` | Installs the pinned dependencies from `package-lock.json`. |
| `npm start` | Runs the app in development (Electron Forge `start`). |
| `npm test` | Runs the unit and behavioral tests with `node --test`. |
| `npm run smoke` | Runs the hidden-window smoke harness against the development app: fresh run through Rosie's welcome, the home screen, a level map, two lessons driven through the recreated Edit View and Edit menu (including the look / watch / try beats and Back during a demonstration), the handbook, and help; resume after a real relaunch (with the guarded restart); malformed progress file; simulated save failure; simulated read failure (a locked file: nothing is written over it); migration of a version-1 and of a version-2 progress file; the practice steps that use the recreated windows; the course review flow; Time In / Time Out (the Start and Stop lines stay on their ruler ticks at every zoom, every second's frame labels repeat alike, the window keeps its height, and the time at the left edge stays put). Sound is exercised through silent stand-ins for the speech engine and the audio context, so narration is observable without a speaker. Never shows a window or takes focus; pointer events are synthetic and go only to the hidden page. |
| `node scripts/smoke.mjs --exe "<path to RoseflowPCMacTraining.exe>"` | Runs the same scenarios against a packaged build. |
| `node scripts/smoke.mjs --shots <dir>` | Runs the review-flow scenarios (`course`, `sheet`) and captures the review screenshots and the expression contact sheets into `<dir>`. |
| `node scripts/smoke.mjs --only course,resume` | Runs a subset of scenarios. The `course` scenario is the review flow on a fresh profile: the film, the hub, the orientation demonstrations, the "One second ON" film on the real controls, the practice with its corrections and the pass, Rosie's help, Robot Rosie. |
| `npm run desktop` | Rebuilds the packaged app and points the Desktop shortcut "Roseflow PC Mac Training" (and the Start Menu one, if present) at it, so the icon always opens the newest build. Refuses while the app is open. Progress is kept: every build uses `%APPDATA%\Roseflow PC Mac Training`. |
| `npm run record` | Records the two review sequences (watch → try → help → retry; skip → continue → start → tickle → timeout → tickle → confirmed restart) as frame folders under `docs/review/<date>/` and stitches them into MP4s with `ffmpeg` (must be on PATH). |
| `npm run package` | Packages the app into `out/Roseflow PC Mac Training-win32-x64/`. |
| `npm run make` | Packages and builds distributables under `out/make/`. |

## Artifacts produced by `npm run make`

| Artifact | Path | What it is |
| --- | --- | --- |
| Squirrel installer | `out/make/squirrel.windows/x64/RoseflowPCMacTraining-Setup.exe` | A Windows installer. Unsigned: Windows SmartScreen will warn on first run. |
| NuGet package | `out/make/squirrel.windows/x64/RoseflowPCMacTraining-0.1.0-full.nupkg` and `RELEASES` | Squirrel update feed files; not needed for a manual install. |
| Packaged folder (portable form) | `out/Roseflow PC Mac Training-win32-x64/` | Produced by `npm run package` (and as a step of `make`). Run `RoseflowPCMacTraining.exe` directly from this folder. |

The Squirrel installer installs per user under `%LOCALAPPDATA%\RoseflowPCMacTraining\`
and creates a Start Menu shortcut. No code-signing certificate is configured.

There is no zip maker: `@electron-forge/maker-zip` depends on `cross-zip`, which
calls `fs.rmdir(path, { recursive: true })`, an option Node 25 removed, and the
failure aborts the whole `make`. If a zip is wanted, compress the packaged folder
with Windows' built-in "Send to > Compressed (zipped) folder" or
`Compress-Archive` in PowerShell.

## Where progress is saved

`app.getPath('userData')/progress.json`, which on Windows is
`%APPDATA%\Roseflow PC Mac Training\progress.json`. The Progress view shows the
exact path. The file is a versioned JSON document (`schemaVersion: 4`) written
atomically (temp file + rename). Unreadable or incompatible files are renamed to
`progress.invalid-<timestamp>.json` beside it, never deleted.

Since October 31, 2026 (schema 4) the document also carries `training`: the
last real training activity (a passed check, an answer, a step advanced, a
film watched; never the film, a hover, or a tickle), the checkpoint, the films
watched or skipped, the steps attempted or assisted, whether the course is
complete, and the restart history. A schema-3 file is backed up as
`progress.v3-backup.json` and carried forward with every field; its training
record is derived (activity = its `savedAt` when any step was finished; the
checkpoint = its saved lesson and step, which Continue reopens from the archive
when it is one of the earlier lessons). Two more files sit beside it:

- `preferences.json`: the sound layers' volumes and mutes, captions, the
  restart-confirmation style, and an optional reduced-motion override. Kept
  across a restart; an unreadable file is replaced by the defaults.
- `progress.previous-run-<stamp>.json`: the run a confirmed restart replaced,
  byte for byte; the three newest are kept.

Since October 23, 2026 the document also carries `guide: { welcomed: boolean }`,
whether Rosie's welcome has been seen. The version stays 3 because nothing else
changed: a file without the field is read as `welcomed: true` (its owner has
already used the trainer, so no welcome), a fresh document starts at `false`,
and migrated version-1 and version-2 files are marked `true`. Start over writes
a fresh document, so the welcome shows again after a confirmed restart. No
backup or migration note is involved.

To test with a throwaway profile, set `ROSEFLOW_USERDATA=<folder>` before launching.

### Migration from the guided-learning build (schema version 2)

The guided-learning build saved show settings as eight one-second blocks for
Light 1, a single command value, and the selected axis. The PC•MACs recreation
stores show data per frame, as PC•MACs does, so on load a schema-2 file is:

- **copied byte for byte to `progress.v2-backup.json`** beside it first (never
  overwritten later);
- **kept as it was for learning**: the level, lesson, and step you were on,
  every finished step and lesson, the lessons to review, and the classic
  question and exercise records;
- **converted for show data**: each ON block becomes 30 ON frames of Light 1
  (neighbouring blocks join into one span), so blocks 2 and 3 become Light 1 ON
  from 00:00:02.00 to 00:00:04.00; the saved command becomes the Soft Console
  value of the saved axis (the other three sliders start at 128); Light 2 starts
  empty because version 2 never saved it; the analog show data starts from the
  trainer's default;
- **noted** in `migrated` (from version 2, its savedAt and view), replacing any
  older version-1 note, so Home explains this update rather than the old one.

Lesson and step ids were kept wherever the concept stayed the same, so a step
finished before still counts. A finished-step record for a step a lesson no
longer has is kept in the file rather than dropped. Steps that were rewritten for the recreated
windows (for example “Light 1 ON from 5 s to 6 s only”, which replaced “Turn on
block 5 only”) kept their ids; the few new steps (the menu bar, Manual mode,
Time In / Time Out, Play Selection, and reading the Vel Limit column from photo
07) start unfinished, so a lesson finished before stays listed as finished but
shows those steps as new.

This was verified on a disposable copy of the owner's real schema-2 file
(October 7, 2026, Basic, “How a click becomes movement” step 4): location,
learning, and records came through unchanged and blocks 2–3 became Light 1
frames 60–120. The original file was only read; its hash is unchanged.

### Migration from the first build (schema version 1)

The first Windows build saved a schema-1 document: a position in the classic
lesson list (`location.lessonId`, `questionIndex`, `exerciseId`, `stepIndex`),
the classic records (`course.answered`, `course.completedLessons`,
`course.missedLessons`, `guided.completedSteps`, `guided.completedExercises`),
and the workspace settings. The app reads such a file on every launch until it
next saves, and:

- **copies the original text, byte for byte, to `progress.v1-backup.json`**
  beside it before anything else happens. The copy is written with the `wx`
  flag so a later migration never overwrites the first backup, and Start over
  leaves it alone;
- **keeps the classic records verbatim** inside the current document and keeps
  updating them: when a guided step that reuses a classic question or an
  exercise step passes, the matching id is appended, and a classic lesson is
  marked complete once both its questions are answered;
- **pre-marks guided steps** from those records. Every one of the twenty classic
  questions and all thirteen exercise steps is reused by at least one guided
  lesson, so an answered question or a finished exercise step shows as done in
  every lesson that reuses it, in every level;
- **keeps the workspace settings** (channel, axis, command, laptop IP, and the
  blocks converted to frames as described above) and the `savedAt` stamp;
- **does not carry the old panel position.** A classic lesson or exercise index
  has no reliable equivalent among the guided lessons, so the app opens on the
  level choice and says so in a note that also shows the backup path. The old
  view name is remembered under `migrated.originalView` for display only.

The migration is repeat-safe (a schema-3 file passes through untouched) and
refuses rather than repairs: an older file whose settings do not validate is
quarantined like any other unreadable file. Representative prior data was used
to verify it: the owner's real `progress.json` from October 7, 2026 (handbook
view, address exercise open, axis 3, nothing finished) and a smoke-generated file
with three finished exercise steps. The unit tests cover both shapes, and the
`legacy` smoke scenario seeds a version-1 file and checks the backup, the note,
the pre-marked steps, and the rewritten schema-3 file; `legacy2` does the same
for a version-2 file.

## Security model

- One `BrowserWindow`; renderer runs with `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, `webviewTag: false`.
- Preload (`src/main/preload.cjs`) exposes only `window.roseflow` with
  `progress.load/save/reset`, `links.open`, and `app.info`. Every IPC payload is
  validated in the main process (`validateProgress`, exact-match link allowlist).
- Content Security Policy (meta tag and response header):
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'`.
- `will-navigate` and `will-redirect` are cancelled; `setWindowOpenHandler` denies
  every new window and opens only the three approved https links in the system
  browser (two manufacturer manuals and the Cisco subnet page). Permission
  requests (camera, microphone, and so on) are denied.
- Electron fuses in the packaged build: RunAsNode off, NODE_OPTIONS and
  `--inspect` disabled, cookie encryption on, ASAR integrity validation on,
  only-load-from-ASAR on.
- No serial, USB, DMX, or network libraries are present. The smoke harness
  records every non-`file:` request made by the renderer and asserts there are none.
- The one third-party library in the renderer is Three.js (`three@0.186.1`, MIT),
  vendored byte for byte under `src/renderer/vendor/three/` and loaded from the
  app's own files under the same CSP. It draws Rosie, the guide, on a small WebGL
  canvas; no loader, worker, or network code path of it is used, and
  `tests/vendor-three.test.mjs` checks the files' hashes and that they contain no
  `eval`. Without WebGL the guide falls back to bundled SVG sprites.

## Continuous integration

`.github/workflows/windows-build.yml` runs on `windows-latest` for pushes to
`main` and on manual dispatch: `npm ci`, `npm test`, `npm run smoke`,
`npm run make`, then uploads `out/make/**` as a workflow artifact. It never
creates a release, tag, or publication. Downloading a workflow artifact requires
a GitHub login; that is intentional while the photo audience is undecided.

## Source materials

The One File task and the two hash-verified originals it was prepared from are in
`one-file-promot-float-lab/` (see `sources/SOURCES.md`). They are excluded from
the packaged app by `packagerConfig.ignore` in `forge.config.cjs`.
