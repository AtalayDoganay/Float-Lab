# Roseflow PC Mac Training

An independent, offline, simulation-only Windows training app for the Cal Poly
Pomona Rose Float team. It teaches the PC•MACs show-control concepts and the
Br-EFB controller menus the team sees in the workshop, one step at a time, in
recreations of the actual PC•MACs windows: the Edit View (OffLine Editing
Window), the Control Window, the Soft Console, and the Terminal - COM3
(GilderTerm) window. Choose a level, open a lesson, and learn each control or
concept by reading a short explanation, watching it demonstrated in those
windows, and then doing it yourself in the same windows with specific feedback.

It is not affiliated with Gilderfluke & Co. It never connects to a controller,
never sends a command, and needs no network connection once installed.

The project workspace is still named Float Lab; the product name is Roseflow PC
Mac Training.

## Try it

Development run (needs Node.js and npm; dependencies are pinned in
`package-lock.json`):

```
npm ci
npm start
```

A packaged Windows build (installer and portable folder) is produced by:

```
npm run make
```

Artifacts land under `out/make/`. See `docs/SETUP.md` for exact names, the
security model, and what has and has not been verified on Windows.

## What you will see

- **Home**: three learning levels, named Basic, intermediate, and I hate my
  life. When saved progress exists, a Continue card names the level, lesson,
  and step you were on, next to Start over.
- **A level's lesson map**: lessons grouped by what they teach (the interface,
  graphs, terminology, functions, hydraulics, diagnosis, assignments), with a
  Begin here card pointing at the first unfinished lesson. Finished lessons show
  a check.
  - Basic (13 lessons) covers the practical essentials: the screen, the graphs,
    the simple terms, what each control and photographed terminal key does, how a
    number becomes a hydraulic movement, and two complete assignments.
  - intermediate (9 lessons) goes deeper: frames and show time, the measurement
    model against the real loop, the five identifiers, the GilderTerm toolbar,
    network settings, endpoints and reversal, the feedback menu, two more
    assignments.
  - I hate my life (27 lessons) includes every Basic and intermediate lesson plus
    every menu line of the photographed configuration menus, the gaps the
    references leave open, a diagnosis lesson, and a round-trip assignment.
- **A lesson**: a compact panel on the left with the step count, Back, Next, the
  explanation and a plain-language example, Show me (a demonstration run in the
  recreated windows), and Now you try with a Check button. On the right, the
  PC•MACs menu bar and only the windows and panes the lesson has introduced so
  far, with the current control highlighted. A practice step checks itself when
  you act (drag along a channel, choose Edit ▸ Set Digitals On, move a Soft
  Console slider, press Play, type a terminal key), explains what to fix, and
  unlocks Next only when it passes. Questions explain the misconception behind a
  wrong choice and let you retry.
- **Handbook** (top right): a searchable drawer that opens beside the lesson
  and closes without losing your place. Entries for every control, the core
  concepts, Rose Float examples (electronics, sensors, hydraulics, motion,
  timing), each guided lesson, the ten classic topic notes, and the three
  assignments. Aliases such as netmask/mask, PC Mac/PC•MACs, and channel/DMX are
  understood.
- **Progress** (top right): lessons finished per level, lessons to review,
  records carried over from the earlier version, where the file is saved, and
  Start over (with confirmation).
- **The PC•MACs windows**, recreated from the PC•MACs manual (January 13, 2021
  edition) in its Windows 7/8 look:
  - the menu bar (File, Edit, RealTime, Offline, Channels, Preferences, Time
    Out, Time In, Values Out, Values In, Help) with every item as the manual
    shows it;
  - the **Edit View**: frame-and-second ruler, analog traces for the four Br-EFB
    axes, digital rows for two training lights, yellow time selection, the
    green / blue / orange / dashed red transport lines, and the time, cursor,
    and preset row; select by dragging, draw digitals with the right mouse
    button, use the shortcut menu, zoom with Time In and Time Out;
  - the **Control Window**: Play, Record, Rehearse, Stop, Pause, OffLine, the
    show time, the six checkboxes, and the Start / Stop / Punch / Audio Cue
    sliders;
  - the **Soft Console**: four sliders with Value 0–255 and BUMP, and digital
    buttons, live in Manual mode;
  - the **“Set to value (0 - 255):”** dialog.
- **Terminal - COM3**: the photographed GilderTerm window with the Br-EFB v1.98
  main, feedback, and network menus transcribed from the photos. Keys whose
  responses were photographed (s, a, k, 6, n, l, x, c) are simulated; every
  other key says plainly that it is not.
- **Simulated float** (trainer only, under the windows): two lanterns and one
  actuator that show what the outputs would do, the measurement model, and two
  hypothetical calculators. It is styled as the trainer, not as PC•MACs.

Menu items and buttons the trainer does not simulate are still shown; using one
explains that in a trainer note under the windows instead of pretending.

Hover or keyboard-focus any control for a short explanation. Press F1 on a
focused control, or press Help ? and then click any control, for the full help:
purpose, when to use it, an example, common mistakes, the expected result, the
software effect, and what it could mean for a connected mechanism, with an
evidence label. (F1 is Play in PC•MACs; here it stays the help key.)

## Accuracy boundaries

- 0–255 is 256 values. Percent is value ÷ 255 × 100, so 128 is about 50.2%.
  Values have no built-in centimeters, volts, or ohms.
- Photographed settings (Min/Max Scale 61/147 and so on, gains, IP 192.168.0.10)
  are historical observations from one workshop session, not recommendations.
- The approach-to-target animation is an educational model, not a Br-EFB, valve,
  or PID simulator.
- Velocity Limit units and algorithm, firmware PID behavior, startup special
  values, override release, the sensor's identity, travel, and wiring are
  explicitly unresolved. The app says so wherever they come up, and the
  comprehensive level has a lesson that lists them.
- The recreated windows follow the manual's screenshots; the team's photos show
  only fragments of the Edit View behind the terminal. The PC•MACs build on the
  team's laptop is not known (the newest listed build is v2.1.226.000 Beta), so
  the trainer does not claim a pixel-for-pixel match. Every screen and
  interaction is mapped to its evidence, with deliberate adaptations and gaps,
  in `docs/REFERENCE_FIDELITY.md`.

## Where progress lives

A small JSON file in the app's own user-data folder (the Progress view shows the
path, typically `%APPDATA%\Roseflow PC Mac Training\progress.json`). It is
independent of One File and is never sent anywhere. The file is schema version
3. A file written by an earlier build is read, backed up beside itself
(`progress.v1-backup.json` or `progress.v2-backup.json`), and carried forward:
finished lessons and steps stay finished, answered questions and finished
exercise steps pre-mark the guided steps that reuse them, and a saved light
pattern becomes the same ON time in frames. See
`docs/SETUP.md` for exactly what carries over and what does not. An unreadable
file is moved aside with a timestamp and you are told; a failed save shows a
banner and keeps your work in memory while the app is open.

## Privacy

The bundled reference photos were taken in the team workshop and include other
people and team equipment. Keep this repository private until the owner decides
what may be distributed. No license is asserted for the photos or the
manufacturer documentation; manuals are linked, not bundled.

## Repository map

- `src/main/` Electron main process, preload, progress store (with migration
  and backup of older files), link allowlist, smoke runner.
- `src/renderer/` the app: `content/` (levels and guided lessons under
  `lessons/`, control help, the PC•MACs menus, the classic curriculum and
  exercises the lessons reuse, handbook, references), `logic/` (pure show data
  and simulation, outputs, lesson flow, search, terminal), `ui/` (DOM modules:
  `pcmacs.mjs` frame and menus, `edit-view.mjs`, `control-window.mjs`,
  `soft-console.mjs`, `terminal.mjs`, `float-panel.mjs`, lesson panel,
  handbook, help), `assets/reference-photos/`.
- `src/shared/progress-schema.mjs` the versioned progress document and its
  migration.
- `tests/` unit and behavioral tests (`npm test`).
- `scripts/smoke.mjs` hidden-window smoke harness (`npm run smoke`).
- `docs/` setup, reference fidelity, verification record, implementation plan.
- `one-file-promot-float-lab/` the One File task and the staged, hash-verified
  originals in `sources/`. Not packaged into the app.
