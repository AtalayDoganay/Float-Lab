# Looping demo videos in lessons — design

Date: 2026-10-11. Status: approved in conversation, awaiting written-spec review.

## Intent

Learners find the lesson panel boring: each step is a paragraph to read. The
owner wants every step to *show* first and *tell* second:

1. A small video loops on the side: the pointer clicks here, then here, and
   this is what happens.
2. After it has played, a short note says what that did and how it helps.
3. Then the learner tries it themselves in the real windows.

Success: a new team member can get through a Basic lesson mostly by watching
and doing, reading at most two short sentences per step.

Decisions taken with the owner:

- Scope: do-it (practice) steps and explain steps get a video. Question steps
  stay as they are.
- Flow: video autoplays; the note and "Your turn" appear after the first full
  loop; a Skip button shows everything at once; the video keeps looping.
- Form: a live mini-replay (a sandboxed miniature copy of the real windows
  driven by a script), not recorded video files.

## 1. Lesson panel layout and flow

Top to bottom in the lesson panel (`src/renderer/ui/lesson.mjs`):

1. Back row, kicker, lesson title, step counter and dots (unchanged).
2. Step title.
3. **Demo player**, about 320×200 px, with a caption strip underneath listing
   the numbered actions ("1 Select Light 1 → 2 Edit ▸ Set Digitals On"); the
   current action is highlighted while it plays. Controls: Replay, Skip
   (only before the first loop has finished), Pause/Play.
4. After the first loop completes (or Skip):
   - **What that did:** one sentence (`did`, at most 18 words).
   - **Why it helps:** one sentence (`why`, at most 24 words).
5. Practice steps: **▶ Your turn** box with a one-line instruction (`task`, at
   most 30 words), Check, and the existing feedback line. Explain steps show
   only Next. Next is enabled for explain steps once the notes are revealed.
6. **More detail ▾** (collapsed by default): the existing `explain`,
   `example`, `mechanism` text, the full original practice instruction, and
   the handbook / control-help / photo links. Nothing existing is deleted.
7. Back / Next and Restart this lesson (unchanged).

Revealed state is per step visit: going Back to a step whose notes were
already revealed shows them immediately. A completed step always shows them.

Steps without a `video` field (lessons not yet converted, and question steps)
render exactly as today, minus the old Show me button.

## 2. The demo player

New module `src/renderer/ui/demo-player.mjs`.

- Mounts a **second workspace engine** (section 4) and the existing
  `mountPcmacs`, `mountTerminal`, and `mountFloatPanel` UI modules into an
  offscreen-sized stage (the real workspace's natural size), scaled down with a
  CSS transform inside the 320×200 viewport. The sandbox is `inert` and
  `aria-hidden`; learners cannot interact with it, and assistive technology
  reads the caption strip instead.
- A **pointer** element (SVG arrow) and a **click ripple** are drawn in an
  overlay above the scaled stage.
- **Camera:** each script step may name a `focus` control; the player
  animates the transform so that control's bounding box fills most of the
  viewport (clamped between 1× of the fitted view and 3×). Default focus is the
  step's `target` control.
- **Loop:** reset the sandbox to the step's starting state, run the script,
  hold the result for 1200 ms, fade, repeat. The first completed loop fires
  `onFirstLoop`, which reveals the notes.
- **Reduced motion:** when `prefers-reduced-motion: reduce` matches, the player
  does not autoplay; it shows the final state of the script with a Play
  button, and the notes are revealed immediately.
- The player stops all its timers when the step changes, the view changes, or
  the window is hidden (`visibilitychange`).

### Script format

A step's `video` field:

```js
video: {
  start: [ /* sandbox setup actions, same vocabulary as practice.setup */ ],
  script: [
    { click: 'channel-select', label: 'Select Light 1' },
    { drag: 'digital-pane', do: { type: 'select-range', from: 120, to: 150, channels: ['light-1'] }, label: 'Drag 4 s → 5 s' },
    { click: 'menu-edit', label: 'Edit' },
    { click: 'menu-set-digital-on', label: 'Set Digitals On' },
    { circle: 'digital-pane' },           // explain steps: point and circle
    { wait: 800 },
  ],
  did: 'Light 1 turned ON from 4 s to 5 s: the thick black bar.',
  why: 'This is how you time a light to a moment in the show.',
  task: 'Now make Light 1 ON from 5 s to 6 s only.',   // practice steps only
}
```

Script step kinds:

- `click: <control>` — move the pointer to the element tagged
  `data-control="<control>"`, ripple, then call the element's real `.click()`
  inside the sandbox, so menus open and close exactly as they do for the
  learner. A value starting with `[` is used as a CSS selector instead, for
  elements that share a `data-control` (e.g. one channel name among several).
  The first match in the sandbox is used.
- `drag: <control>, do: <action>` — animate the pointer across the control,
  then dispatch `<action>` to the sandbox engine. Used where a real mouse
  gesture would be needed (range selection, drawing digitals, sliders).
- `type: <control>, text: '255', do: <action>` — pointer to the field, show
  the text appearing, then dispatch `<action>`. Used for the Set to value
  dialog and the terminal input.
- `do: <action>` alone — dispatch with no pointer motion (e.g. `play`).
- `circle: <control>` — pointer moves there and draws a ring; everything else
  is dimmed for the duration.
- `wait: <ms>`.
- Optional `focus: <control>` on any step overrides the camera target.

Pointer speed is fixed (about 600 px/s in stage coordinates, minimum 250 ms
per move) so videos feel consistent. Each video should run 3–8 s per loop.

Practice-step videos demonstrate a *similar* task, never the exact answer
(e.g. video 4–5 s, task 5–6 s).

## 3. Content

- Add `video` to every practice step (31 `practice(...)` plus 22
  `exerciseStep(...)` uses) and every explain step (73) — about 126 videos.
- `steps.mjs`: `base()` carries `video` (default `null`); `exerciseStep` and
  `classicQuestion` accept it in options. The old `demo` field is removed.
- The 20 existing `demo` scripts are converted to `video` scripts.
- Delivery in three batches, each shippable on its own:
  1. Engine extraction, demo player, new panel layout, and all **Basic**
     lessons (`lessons/basic.mjs`).
  2. **intermediate** lessons (`lessons/intermediate.mjs`).
  3. **I hate my life** lessons (`lessons/comprehensive.mjs`).
  Unconverted lessons keep today's text-first layout.

## 4. Workspace engine extraction

`src/renderer/app.mjs` currently owns one global `state.sim` and
`state.terminal`, the play and measure timers, and the reducer cases for the
Edit View, Control Window, console, terminal, and float panel.

- New `src/renderer/logic/workspace.mjs` exports
  `createWorkspace({ onChange, onAction })` returning
  `{ state, dispatch(action), reset(sim?), destroy() }`, where `state` is
  `{ sim, terminal }`. It owns `freshSim`, the workspace reducer cases, play
  and measure timers, and `computeOutputs` refresh. `onAction(original,
  effective)` replaces the direct `afterAction` call so the app can still run
  practice checks.
- `app.mjs` keeps navigation, lessons, persistence, handbook, dialogs, and
  delegates every workspace action to its engine instance.
- `mountPcmacs` takes the value dialog host as an option instead of calling
  `document.getElementById('value-dialog')`, so the sandbox gets its own
  dialog inside the scaled stage.
- The Show me machinery (`runDemo`, `cancelDemo`, `snapshotShow`,
  `restoreShow`, `demo-start`, `state.lesson.demo`) is removed: the sandbox
  can never touch the learner's show, so nothing needs restoring.

Behaviour of the main workspace must be identical before and after the
extraction; the existing simulation, progress, and smoke tests guard this.

## 5. Testing

- `tests/workspace.test.mjs`: the engine reduces the same actions to the same
  sim as before (selection, set digital, set analog, play/stop timing with
  fake timers, measure), and two engines do not share state.
- `tests/lessons-video.test.mjs`: for every converted lesson, every practice
  and explain step has a `video` with a non-empty `script`, `did` (≤ 18
  words), `why` (≤ 24 words), and practice steps a `task` (≤ 30 words); every
  `do` and `start` action type is one the engine accepts; applying a practice
  step's `start` and all its `do` actions to a fresh engine (in Node, so
  `click` steps are not run) must not pass that step's validator — the video
  must not be the exact answer. Validators that only look at the triggering
  action (such as the help step) are exempt.
- Smoke runner (`src/main/smoke-runner.mjs`): plays every converted step's
  video once at 10× speed in the hidden window and fails if any `click`,
  `drag`, `type`, `circle`, or `focus` control is not found in the sandbox.
- Lesson UI smoke: notes hidden before the first loop, shown after; Skip
  reveals them; Next blocked on explain steps until revealed.
- The existing 85 tests keep passing.

## 6. Out of scope

Question steps, narration or sound, recorded video files, and changes to the
workspace windows themselves.
