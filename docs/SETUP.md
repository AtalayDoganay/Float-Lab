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
| `npm run smoke` | Runs the hidden-window smoke harness against the development app: fresh run, resume after a real relaunch, malformed progress file, simulated save failure. Never shows a window or takes focus. |
| `node scripts/smoke.mjs --exe "<path to RoseflowPCMacTraining.exe>"` | Runs the same scenarios against a packaged build. |
| `node scripts/smoke.mjs --shots <dir>` | Captures review screenshots of the hidden window into `<dir>`. |
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
`%APPDATA%\Roseflow PC Mac Training\progress.json`. The Progress tab shows the
exact path. The file is a versioned JSON document (`schemaVersion: 1`) written
atomically (temp file + rename). Unreadable or incompatible files are renamed to
`progress.invalid-<timestamp>.json` beside it, never deleted.

To test with a throwaway profile, set `ROSEFLOW_USERDATA=<folder>` before launching.

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
