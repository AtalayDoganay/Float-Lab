# Verification record

Date: October 7, 2026. Machine: Windows 11 Home 10.0.26300, Node 25.0.0, npm 11.6.2,
Electron 44.6.0, Electron Forge 8.0.1.

What the deliverable is, precisely:

- **Source**: this repository (nothing staged, committed, or pushed).
- **A packaged, smoke-tested application**: `out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe`,
  built on this Windows machine and driven through every automated scenario below.
- **An installer**: `out/make/squirrel.windows/x64/RoseflowPCMacTraining-Setup.exe` (unsigned).
  Building succeeded; **installing it and running the installed copy was not performed**
  by automation, because an install changes the owner's machine. The installed
  copy is the same packaged folder that was smoke-tested.
- **A CI workflow**: `.github/workflows/windows-build.yml`. **Not yet run** (nothing has been
  pushed). It repeats the steps below on `windows-latest` and uploads artifacts only.

## Automated checks (all passed)

### `npm test` (node --test), 58 tests

| Area | What is pinned |
| --- | --- |
| progress schema | empty doc validates; unsupported schema, wrong app, bad blocks, command 256, axis 4, fractional command rejected; unknown keys and non-string ids dropped; location defaults; invalid view rejected |
| progress store | save/load round-trip with savedAt; no file; malformed JSON quarantined to `progress.invalid-<stamp>.json`; unsupported schema quarantined; invalid doc refused without disk write; failed write reported with no partial file; reset |
| links | exact allowlist of three https URLs; file:, javascript:, look-alike hosts, http:, non-strings rejected |
| simulation | 128 → 50.196… shown as 50.2%; blocks 2 and 3 → intervals 2–3 and 3–4 s; playback ticks 0–7 then done at 8; hh:mm:ss.ff at 30 FPS; axes 0–3 → DMX 6–9 with range errors; same/different/duplicate subnet cases; approach model; linear calibration 128 on 20 cm ≈ 10.04 |
| course | wrong then right records the lesson for review and unlocks Next; answered question stays answered; next blocked until answered; question → lesson → checkpoint transitions; skip ahead and return keeps completion; rebuild from saved ids ignores unknown ids |
| content | 10 lessons, 20 questions, one correct option each, hint for every wrong option, prototype answer keys spot-checked; 44 controls with complete help and evidence labels; 3 exercises whose steps target real controls; handbook covers every control, lesson, exercise, 14 core concepts, and Rose Float examples tagged electronics/sensors/hydraulics/motion/timing; 10 reference images; manual citations with edition, pages, url, status |
| guided | schedule-light names the offending block (block 1 ON, block 3 OFF); read-command refuses 127 and says so; channel question explains "6 is beside axis 0"; address exercise produces same/different/duplicate explanations; back/reset/restore clamp |
| search | empty query → guidance; "netmask", "pc mac", "PC•MACs", "dmx" reach the intended entries through aliases with excerpts; gibberish → none; title match outranks body match |
| terminal | s + digit selects an axis; a opens the card prompt without changing the value; k toggles main/feedback; 6 opens network; c/x confirm/discard; n/l wrap; keys 1–5, i, o, g, h answer "not simulated"; x then Y/N exits; Config Done / Configure / Clear Screen |

### `npm run smoke` and `node scripts/smoke.mjs --exe …` (hidden Electron window), 65 checks

Run against both the development app and the packaged executable, with a fresh
throwaway user-data folder, window never shown.

| Scenario | Checks |
| --- | --- |
| first | ES modules load under the CSP; title and identity text; ten lessons listed; wrong then right answer; review mark; Next to question 2; help dialog opens, names the control, closes, and leaves practice state unchanged; tooltip on focusin and on hover, hides on focusout; handbook "netmask" returns results with the subnet-mask concept first; no-results message; block toggle; after 1.25 s playback is on block 1 and the readout shows 00:00:01.00; Stop; command 128 reads 50.2%; three network examples explain same/different/duplicate; guided "Schedule a light" end to end (channel → blocks → Play → Stop) records completion; axis 2 and command 100 saved; file validates; playback never saved as running; zero network requests; zero renderer console errors |
| resume (real relaunch) | start dialog offers Resume/Restart; Resume restores lesson 1 question 2, axis 2, command 100, playback paused, completed exercise, and the Practice view; Restart asks for confirmation; cancel keeps progress; confirm clears it and writes a fresh file |
| malformed | garbage `progress.json` → app starts fresh, file moved aside, visible notice says so, nothing marked complete |
| savefail | simulated write failure → renderer told, visible banner "could not be saved", work stays in memory, nothing marked complete |

### Packaged artifact inspection

`app.asar` holds `src/`, `package.json`, `README.md`, `.gitignore`, and pruned
`node_modules` (electron-squirrel-startup only). It contains the ten reference
photos and does **not** contain `one-file-promot-float-lab/`, `tests/`, `docs/`,
`scripts/`, `.github/`, or `forge.config.cjs`. Renderer and main files in the
asar are byte-identical to the source.

### Screenshots

`node scripts/smoke.mjs --shots <dir>` captured the lessons view, lesson 4 with
axis 2 selected, guided practice with the block row highlighted and a specific
"Block 1 is ON" correction, the handbook with the feedback menu shown in the
terminal, a handbook entry with the network menu, the help dialog, and the
Progress view during playback (playhead on block 2, lamp lit, 00:00:02.00). They
were reviewed for layout; the terminal table and footer fit without clipping and
the ruler labels do not collide at a 1440 px window.

## Not verified by automation (owner to confirm by hand)

- Real keyboard focus tooltips: a hidden window never receives page focus, so the
  harness dispatched the `focusin`/`mouseover` events a real keyboard or mouse
  would produce. Tab to a control in the running app and confirm the tooltip.
- Reduced-motion rendering, readable scaling at other window sizes, and the
  layout below 1340 px (the terminal moves under the timeline).
- The approved links opening in the system browser (the allowlist and handler are
  unit-tested; the actual `shell.openExternal` call was not exercised).
- Running with the network adapter physically disabled. The harness proves the
  renderer makes zero non-`file:` requests and the CSP forbids connections, which
  is the same property.
- Installing `RoseflowPCMacTraining-Setup.exe` and launching from the Start Menu.

## Known limitations recorded honestly

- No zip distributable: `@electron-forge/maker-zip` fails on Node 25 (see `docs/SETUP.md`).
- The installer is unsigned; Windows SmartScreen will warn.
- The PC•MACs main window was never photographed; the workspace is a labeled
  simplification (see `docs/REFERENCE_FIDELITY.md`).
