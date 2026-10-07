# Roseflow PC Mac Training

An independent, offline, simulation-only Windows training app for the Cal Poly
Pomona Rose Float team. It teaches the PC•MACs show-control concepts and the
Br-EFB controller menus the team sees in the workshop, through a familiar
PC•MACs-style workspace, contextual help on every control, a searchable
handbook, three guided exercises, and ten lessons with twenty questions.

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

A packaged Windows build (installer and portable zip) is produced by:

```
npm run make
```

Artifacts land under `out/make/`. See `docs/SETUP.md` for exact names, the
security model, and what has and has not been verified on Windows.

## What you will see

- **Lessons** (left panel): the ten lessons from the prototype, each as
  Learn, Try, then Answer. Wrong answers explain the misconception and let you
  retry. Finishing the last lesson opens a checkpoint listing unfinished lessons
  and topics to review.
- **Practice**: three guided exercises. Each step highlights the next control in
  the workspace, explains why it matters, checks what you actually did, and shows
  the simulated result.
  1. Schedule a light: select a digital channel, enable blocks 2 and 3 of an
     eight-second show, play it.
  2. Read a command: select axis 2, identify its displayed DMX address, set
     command 128, read 50.2%, compare with a separately labeled simulated
     measurement.
  3. Understand an address: compare 192.168.0.20, 192.168.1.20, and
     192.168.0.10 with the photographed controller address 192.168.0.10/24.
- **Handbook**: searchable entries for every control, the core concepts, Rose
  Float examples (electronics, sensors, hydraulics, motion, timing), each lesson,
  and each exercise. Aliases such as netmask/mask, PC Mac/PC•MACs, and
  channel/DMX are understood.
- **Progress**: where progress is saved, counts, Restart learning (with
  confirmation), and Reset current exercise.
- **The workspace** (center): a labeled simplification of the PC•MACs OffLine
  Editing Window: time ruler, analog pane with the command line and a dashed
  simulated measurement, digital pane with eight one-second blocks per training
  channel, Play and Stop, and show-time readouts in hh:mm:ss.ff.
- **Terminal - COM3** (right): the photographed GilderTerm dialog with the
  Br-EFB v1.98 main, feedback, and network menus transcribed from the photos.
  Keys whose responses were photographed (s, a, k, 6, n, l, x, c) are simulated;
  every other key says plainly that it is not.

Hover or keyboard-focus any control for a short explanation. Click the `?`
beside it, or press F1, for the full help: purpose, when to use it, an example,
common mistakes, the expected result, the software effect, and what it could
mean for a connected mechanism, with an evidence label.

## Accuracy boundaries

- 0–255 is 256 values. Percent is value ÷ 255 × 100, so 128 is about 50.2%.
  Values have no built-in centimeters, volts, or ohms.
- Photographed settings (Min/Max Scale 61/147 and so on, gains, IP 192.168.0.10)
  are historical observations from one workshop session, not recommendations.
- The approach-to-target animation is an educational model, not a Br-EFB, valve,
  or PID simulator.
- Velocity Limit units and algorithm, firmware PID behavior, startup special
  values, override release, the sensor's identity, travel, and wiring are
  explicitly unresolved. The app says so wherever they come up.
- The PC•MACs main window itself was not photographed. The workspace is built
  from the manual's description and is labeled a simplification, not an exact
  reproduction. See `docs/REFERENCE_FIDELITY.md`.

## Where progress lives

A small JSON file in the app's own user-data folder (the Progress tab shows the
path, typically `%APPDATA%\Roseflow PC Mac Training\progress.json`). It is
independent of One File and is never sent anywhere. An unreadable file is moved
aside with a timestamp and you are told; a failed save shows a banner and keeps
your work in memory while the app is open.

## Privacy

The bundled reference photos were taken in the team workshop and include other
people and team equipment. Keep this repository private until the owner decides
what may be distributed. No license is asserted for the photos or the
manufacturer documentation; manuals are linked, not bundled.

## Repository map

- `src/main/` Electron main process, preload, progress store, link allowlist,
  smoke runner.
- `src/renderer/` the app: `content/` (curriculum, control help, exercises,
  handbook, references), `logic/` (pure simulation, course, guided, search,
  terminal), `ui/` (DOM modules), `assets/reference-photos/`.
- `src/shared/progress-schema.mjs` the versioned progress document.
- `tests/` unit and behavioral tests (`npm test`).
- `scripts/smoke.mjs` hidden-window smoke harness (`npm run smoke`).
- `docs/` setup, reference fidelity, verification record, implementation plan.
- `one-file-promot-float-lab/` the One File task (revision 1) and the staged,
  hash-verified originals in `sources/`. Not packaged into the app.
