# Rosie in 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Rosie’s card picture with a free-floating, WebGL-rendered plush rose who flies to the control each screen is about, points at it, talks in a bubble beside her, and emotes; the welcome becomes a tour she leads.

**Architecture:** A fixed full-window guide layer owns one canvas (Three.js, vendored) or a sprite fallback, a speech bubble, and an animation loop. Pure modules decide what she does (`guide-plan`), where she stands (`guide-placement`), and how she moves (`motion`); the model, face, and effects are built from Three.js primitives and tested in Node. The app’s `render()` hands the layer a plan after every dispatch; the layer re-flies only when the anchor changes and re-talks only when the words change.

**Tech Stack:** Electron 44, dependency-free ES-module renderer, Three.js 0.186.1 vendored as two files, `node --test`, the hidden-window smoke harness.

**Spec:** `docs/superpowers/specs/2026-10-24-rosie-3d-guide-design.md`

## Global Constraints

- Product name “Roseflow PC Mac Training” unchanged; levels named exactly “Basic”, “intermediate”, “I hate my life”.
- Offline and simulation only: no network request at any time; Three.js is loaded from the app’s own files; no runtime dependency added to `package.json`.
- CSP as in `index.html`: no inline `style=` attributes anywhere (CSSOM assignment is fine), no `eval`, no inline scripts, `img-src 'self' data:`.
- Electron isolation unchanged: sandbox, context isolation, validated IPC, navigation blocked.
- Teaching content unchanged: lessons, questions, validators, feedback text, help entries; the progress schema untouched.
- Rosie’s layer never blocks a click outside the welcome; she and her bubble never overlap the target rectangle.
- Automated checks run in the hidden window and never take focus, keyboard, or clipboard.
- Do not stage, commit, or push. The task folder `one-file-promot-float-lab/` stays intact.
- Reduced motion (`prefers-reduced-motion: reduce`) is honoured.

## Review Focus

1. A step whose target control has no box (hidden, not yet revealed, or absent) must put her at the dock, not at (0, 0). Pinned in Task 8b’s smoke check “a target with no size falls back to the dock”.
2. The handbook opening or the window resizing moves the target under her: she must re-anchor without flying across the screen again and again, and without re-talking. Pinned in Task 8b’s smoke check “a shifted target re-anchors her without a new talk”.
3. Playback ticks 30 times a second; nothing about her may change per tick. Pinned in Task 4’s `planKey` test and Task 8b’s smoke check “playback does not make her fly or talk”.
4. A lost WebGL context must drop her to the sprite without an error. Pinned in Task 8a’s smoke check “a lost WebGL context falls back to the sprite”.
5. At the minimum window size with a target at the far right, her bubble must flip to her left and stay inside the window. Pinned in Task 3’s placement test “flips the bubble when the outer side has no room” and Task 9’s small-window smoke check.

---

### Task 1: Vendor Three.js

**Files:**
- Create: `src/renderer/vendor/three/three.module.js`, `src/renderer/vendor/three/three.core.js`, `src/renderer/vendor/three/LICENSE`, `src/renderer/vendor/three/README.md`
- Test: `tests/vendor-three.test.mjs`

**Interfaces:**
- Produces: `import * as THREE from '../vendor/three/three.module.js'` (from `src/renderer/ui/` or `src/renderer/guide/`).

- [ ] **Step 1: Write the failing test**

```js
test('Three.js 0.186.1 is vendored byte for byte, with its licence and provenance', async () => {
  // sha256 of src/renderer/vendor/three/three.module.js === '9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea'
  // sha256 of src/renderer/vendor/three/three.core.js   === '9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6'
  // LICENSE contains 'MIT License'; README.md contains 'three@0.186.1' and both hashes
  // neither file contains 'eval(' or 'new Function('
  // three.module.js imports './three.core.js' (relative, same folder)
});
test('the vendored module loads in Node and exposes what the guide needs', async () => {
  // REVISION === '186'; WebGLRenderer, Scene, PerspectiveCamera, MeshPhysicalMaterial, SphereGeometry, CapsuleGeometry, LatheGeometry, CanvasTexture, Sprite, SpriteMaterial, PMREMGenerator, HemisphereLight, DirectionalLight, Group are functions
});
```

- [ ] **Step 2: Run it** — `node --test tests/vendor-three.test.mjs` — Expected: FAIL (ENOENT).
- [ ] **Step 3: Copy** `package/build/three.module.js`, `package/build/three.core.js`, `package/LICENSE` from the `three-0.186.1.tgz` tarball already extracted in the scratchpad (`scratchpad/three-pkg/package/`). Write README.md: source (npm registry tarball `three-0.186.1.tgz`), licence, the two hashes, how to update (replace both files together, update hashes here and in the test).
- [ ] **Step 4: Run it** — Expected: PASS 2/2. Then `npm test` — Expected: 97 pass.

---

### Task 2: Motion primitives

**Files:**
- Create: `src/renderer/logic/motion.mjs`
- Test: `tests/motion.test.mjs`

**Interfaces:**
- Produces:
  - `springStep({ x, v }, target, dt, { omega = 9 } = {}) → { x, v }` critically damped spring, dt in seconds, clamped to 0.05 s per step.
  - `bank(vx, vy, { scale = 0.0009, max = 0.35 } = {}) → { roll, pitch }` radians, roll opposes vx (moving right rolls left shoulder down: roll = −vx·scale), pitch = vy·scale, both clamped to ±max.
  - `squashAt(t, { duration = 0.3, amount = 0.1 } = {}) → { sx, sy }` 1 ± amount·sin(πt/duration)·(1 − t/duration) for 0 ≤ t < duration, else { 1, 1 }.
  - `nextBlinkDelay(random = Math.random) → seconds` in [2.5, 5).
  - `blinkAmount(sinceBlink, { duration = 0.16 } = {}) → 0..1` 0 at 0, 1 at duration/2, 0 at ≥ duration.
  - `talkEnvelope(sinceChange, { duration = 1.1 } = {}) → { active, mouth, nod }` mouth = |sin(sinceChange·22)|·fade, nod = sin(sinceChange·9)·0.04·fade, fade = 1 − sinceChange/duration; all zero and inactive at ≥ duration or negative.
  - `idleBob(t) → { y, yaw }` y = sin(t·1.6)·0.06, yaw = sin(t·0.7)·0.08.
  - `settled(s, target, { eps = 0.5, veps = 2 } = {}) → boolean` |x − target| < eps and |v| < veps.

- [ ] **Step 1: Write the failing tests** (one `test` per function):
  - spring converges: after 2 s of 1/60 steps from {0,0} toward 100, |x−100| < 0.5 and never overshoots by more than 1.
  - spring clamps dt: one step with dt 5 equals one step with dt 0.05.
  - bank: `bank(400, 0)` roll < 0 and ≥ −0.35, pitch 0; `bank(-9999, 9999)` is clamped to ±0.35.
  - squash: `squashAt(0)` and `squashAt(0.3)` are {1,1}; `squashAt(0.1).sy < 1 < squashAt(0.1).sx`.
  - blink: `nextBlinkDelay(() => 0)` is 2.5, `(() => 0.999)` < 5; `blinkAmount(0) === 0`, `blinkAmount(0.08) === 1`, `blinkAmount(0.2) === 0`.
  - talk: `talkEnvelope(0.5).active === true` with mouth in [0,1]; `talkEnvelope(1.1).active === false` and mouth 0; `talkEnvelope(-1)` inactive.
  - idle: `idleBob(0)` is {0,0}; `idleBob(1).y` within ±0.06.
  - settled: `settled({x:100.2,v:0}, 100)` true; `settled({x:90,v:0}, 100)` false.
- [ ] **Step 2: Run** `node --test tests/motion.test.mjs` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `src/renderer/logic/motion.mjs` with the signatures above. No DOM, no Three.js.
- [ ] **Step 4: Run** — Expected: PASS. `npm test` green.

---

### Task 3: Placement beside a target

**Files:**
- Create: `src/renderer/logic/guide-placement.mjs`
- Test: `tests/guide-placement.test.mjs`

**Interfaces:**
- Produces:
  - `ROSIE_BOX = { w: 300, h: 340, inset: 36 }` (her canvas; `inset` is the transparent margin on each side, her visible body is the canvas shrunk by it).
  - `placeBeside({ viewport: {w,h}, target: {x,y,w,h}, box = ROSIE_BOX, bubble: {w,h}, avoid = [], margin = 10 }) → { x, y, side, facing, bubble: { x, y, side }, overlapsTarget: false }`
    - `side` ∈ right | left | below | above: where she stands relative to the target, first that fits her visible box in the viewport without intersecting the target and without intersecting any `avoid` rectangle; if none fits, the first that fits in the viewport without touching the target; if still none, `right` clamped.
    - `facing` ∈ 'left' | 'right': the direction of the target from her (she points that way).
    - `bubble.side` ∈ right | left | below: on her outer side (away from the target) when it fits in the viewport; otherwise the other side; otherwise below her. The bubble must not intersect the target.
    - `bubble.x/y` are the bubble’s top-left; her head is at about 30 % of her box height, so the bubble’s top aligns to `y + 0.2·h` when beside her.
  - `placeAtDock({ dock: {x,y,w,h}, viewport, box = ROSIE_BOX, bubble }) → same shape` she is centred in the dock, `side: 'dock'`, `facing: 'right'`, the bubble to her right (clamped), or below her if the right has no room.
  - `placeAtCenter({ viewport, box, bubble }) → same shape` her visible box centred a little above the middle, bubble to her right, `side: 'center'`.
  - `placeAtCorner({ viewport, box, bubble }) → same shape` lower-right corner, bubble to her left, `side: 'corner'`.
  - `visibleBox({ x, y }, box) → {x,y,w,h}` the inset box; `intersects(a, b) → boolean`; `clampRect(rect, viewport) → rect`.

- [ ] **Step 1: Write the failing tests**:
  - “stands to the right of a target with room, facing left”: viewport 1440×900, target {600,400,80,30}, bubble {320,120} → side 'right', facing 'left', visibleBox does not intersect target, bubble.side 'right', bubble inside viewport, bubble does not intersect target.
  - “stands to the left when the right has no room”: target {1300,400,120,30} → side 'left', facing 'right', bubble.side 'left'.
  - “stands below when neither side has room”: viewport 1024×680, target {40,300,944,40} → side 'below'.
  - “flips the bubble when the outer side has no room” (Review Focus 5): viewport 1024×680, target {760,200,250,40} → she is left of the target; bubble.side 'left'; bubble.x ≥ 0 and bubble.x + 320 ≤ 1024.
  - “avoids the lesson panel when it can”: viewport 1440×900, target {380,300,60,30}, avoid [{0,0,360,900}] → her visible box does not intersect the avoid rect.
  - “never overlaps the target, even when clamped”: viewport 1024×680, target {0,0,1024,680} (full-window target) → result has `overlapsTarget: true` reported, and side 'right' (the caller then uses the dock).
  - “the dock centres her and puts the bubble to her right”: dock {20,100,320,220}, viewport 1440×900 → |x + 150 − 180| < 1, bubble.x ≥ x + 300 − 36.
  - “centre and corner placements stay inside the viewport”.
- [ ] **Step 2: Run** — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the module (pure geometry).
- [ ] **Step 4: Run** — Expected: PASS. `npm test` green.

---

### Task 4: The guide plan

**Files:**
- Create: `src/renderer/logic/level-status.mjs` (move `lessonStatus` and `nextLessonFor` out of `src/renderer/ui/level.mjs`; `ui/level.mjs` re-exports them so `app.mjs` is untouched)
- Create: `src/renderer/logic/guide-plan.mjs`
- Modify: `src/renderer/content/mascot.mjs` (add `LINES.progress`, `LINES.exploreHelp`)
- Test: `tests/guide-plan.test.mjs`, `tests/mascot.test.mjs` (two assertions)

**Interfaces:**
- Consumes: `primaryAction`, `expressionFor`, `bubbleText` from `logic/step-beats.mjs`; `WELCOME`, `LINES` from `content/mascot.mjs`; `LEVELS`, `LESSONS_BY_ID`, `LEVEL_BY_ID` from `content/levels.mjs`; `lessonStatus`, `nextLessonFor` from `logic/level-status.mjs`.
- Produces:
  - `homeWhere(state) → null | { level, lessonId, stepIndex, back }` (moved from `ui/home.mjs`, same semantics; `ui/home.mjs` imports it).
  - `guidePlan({ state, run }) → { scene, anchor, expression, title, lines, welcome, key }`
    - `scene` ∈ welcome | home | level | lesson | explore | progress | none.
    - `anchor` ∈ `{ kind: 'center' }` | `{ kind: 'control', id }` | `{ kind: 'dock' }` | `{ kind: 'corner' }` | `{ kind: 'none' }`.
    - `expression` ∈ wave | point | happy | cheer | oops.
    - `title` string or null; `lines` string[] (the first line of a lesson result is the feedback; `feedbackOk` true/false/null is also returned so the layer can colour it).
    - `welcome` null or `{ step, total, button, last, skip: 'Skip' }`.
    - `key` a string that changes only when scene, anchor, expression, title or lines change.
  - Welcome: `state.guide.open` → scene welcome, beat = `WELCOME[state.guide.step]`; anchor center for steps 0–1; for the last step `{ kind: 'control', id: homeWhere(state) ? 'resume' : 'start-learning' }`.
  - Home: anchor `{ kind: 'control', id: homeWhere(state) ? 'resume' : 'start-learning' }`, expression wave, lines as `ui/home.mjs` computes today (the four home lines).
  - Level: anchor `{ kind: 'control', id: 'begin-here' }`; expression cheer when `state.lesson.justFinished` or every lesson finished, else point; lines: finished / levelDone / pickUp / beginHere as `ui/level.mjs` today; title null.
  - Lesson (needs `run`): `ctx` as `ui/lesson.mjs` builds it; anchor `{ kind: 'control', id: step.target }` when `step.target`, else dock; expression `expressionFor(ctx)`; title/lines `bubbleText(ctx)`.
  - Explore: dock, happy, title 'All the windows', lines [`LINES.explore()`, `LINES.exploreHelp()`].
  - Progress: corner, happy, lines [`LINES.progress()`].
  - Anything else: scene none, anchor none.

- [ ] **Step 1: Write the failing tests** (build minimal state objects; a fake `run` with `current()` returning `{ step, done, index, total, isLast }` and `lesson`):
  - welcome beats: step 0 → scene welcome, anchor center, expression 'wave', lines [WELCOME[0].text], welcome {step 0, total 3, button 'Next', last false}; step 2 with no saved place → anchor control 'start-learning', button 'Let’s go', last true; step 2 with a current lesson → control 'resume'.
  - home first visit → anchor 'start-learning', wave, lines [LINES.homeFirst()]; returning (saved place, nothing moved) → 'resume' and the 'Welcome back' line naming the lesson and step; mid-session → 'You are on' line.
  - level: not started → 'begin-here', point, [LINES.beginHere()]; a started next lesson → [LINES.pickUp()]; justFinished → cheer and the finished line naming the next title; all finished → cheer and the levelDone line.
  - lesson with target → control id equals step.target, expression and lines equal `expressionFor` / `bubbleText` of the same ctx; a feedback miss → feedbackOk false and lines[0] the message; lesson step without target → dock.
  - explore → dock, happy, two lines; progress → corner.
  - `key` is identical for two states that differ only in `sim.frame` and `sim.mode` (Review Focus 3) and differs when the step target changes.
  - `LINES.progress()` and `LINES.exploreHelp()` are non-empty.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** `level-status.mjs` (move), `guide-plan.mjs`, the two new lines; make `ui/level.mjs` re-export; make `ui/home.mjs` import `homeWhere` (delete its local `where`).
- [ ] **Step 4: Run** — Expected: PASS. `npm test` green; `npm run smoke` still 176/176 (nothing visible changed yet).

---

### Task 5: The face

**Files:**
- Create: `src/renderer/guide/face.mjs`
- Test: `tests/face.test.mjs`

**Interfaces:**
- Produces:
  - `FACE_SIZE = 512`.
  - `faceParams(expression) → { eye, brow, mouth, blush }` with eye ∈ open | happy | closed | wide; brow ∈ none | up | worried | determined; mouth ∈ smile | grin | open | wobble | o; blush 0..1. Table: wave {open, up, grin, .5}; point {open, determined, smile, .35}; happy {happy, none, smile, .5}; cheer {closed, up, open, 1}; oops {wide, worried, wobble, .2}; idle/unknown {open, none, smile, .35}.
  - `drawFace(ctx, params, { look = {x:0,y:0}, blink = 0, mouthOpen = 0, t = 0 } = {})` draws the whole face on a `FACE_SIZE` square 2D context: a radial-gradient base with a soft alpha edge, two eyes (iris ellipse, gradient, two highlights; height scaled by (1 − blink); `happy`/`closed` draw arcs instead), brows per style, blush per amount, mouth per style with `mouthOpen` widening it. `look` shifts the pupils by up to 14 px.

- [ ] **Step 1: Write the failing tests**:
  - the params table above, exactly, for the six names.
  - `drawFace` on a recording stub context (every method a no-op that logs its name; `createRadialGradient` returns `{ addColorStop() {} }`; `measureText` returns `{ width: 0 }`) calls `ellipse` or `arc` at least four times for `open` eyes and at least two `arc`/`quadraticCurveTo` for `happy`; `blink: 1` with `open` eyes draws no `ellipse` whose height argument exceeds 2 px; it never throws for any expression; it sets no property the stub does not have (the stub is a Proxy that throws on unknown property writes other than the canvas state fields `fillStyle, strokeStyle, lineWidth, lineCap, lineJoin, globalAlpha, shadowBlur, shadowColor, font, textAlign, textBaseline`).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** the module (no DOM access: everything through `ctx`).
- [ ] **Step 4: Run** — Expected: PASS. `npm test` green.

---

### Task 6: The plush model and its poses

**Files:**
- Create: `src/renderer/guide/rosie-model.mjs`
- Test: `tests/rosie-model.test.mjs` (imports the vendored Three.js in Node)
- Scratchpad (not in the repo): a preview page that mounts the model in the hidden-window harness for visual review.

**Interfaces:**
- Consumes: `THREE` (passed in, never imported by the model so tests and the layer share one copy), a `faceTexture` (any `THREE.Texture`).
- Produces:
  - `COLORS` frozen: bloom ['#c8102e','#a50f24','#d9344f'], bloomSheen '#ff9aa8', face '#ffd6dc', stem '#3b8f5c', thorn '#2a6b45', leaf '#2e8b57', leafSheen '#9fe0b0', tag '#1f6f3f', tagRim '#e8f5e9', drop '#a7d8f5', sparkle '#ffe28a'.
  - `buildRosie(THREE, { faceTexture, fuzzTexture = null }) → { root, parts }` where `root` is a `Group` about 2.6 units tall standing on y = 0 (feet) with the head centre near y = 1.75, facing +z; `parts` = `{ head, bloom, face, body, armL, armR, shoulderL, shoulderR, leaves, feet, tag, drop, seam }`, every part named the same (`root.getObjectByName('armL')`). `drop.visible` starts false. Materials are `MeshPhysicalMaterial` with sheen 1 for every fabric part.
  - `poseFor({ expression, t, phase = 0, look = {x:0,y:0}, facing = 'right', reduced = false }) → pose` pure; `pose = { root: { y, yaw, pitch, roll, sx, sy }, head: { yaw, pitch, roll }, armL: { x, z }, armR: { x, z }, drop: boolean, sparkle: 0..1 }`, radians; `t` seconds since the expression began; `phase` the idle clock.
    - idle under all: `root.y` includes `idleBob(phase).y`, `root.yaw` includes `idleBob(phase).yaw` unless `reduced`.
    - wave: armR.z oscillates between about −2.2 and −2.8 for the first 2 s then rests at −2.4; root.pitch −0.05.
    - point: the arm on the `facing` side extends (armR.z ≈ −1.5 for 'right', armL.z ≈ +1.5 for 'left'); root.yaw turns 0.35 toward it; head.yaw 0.25 toward it.
    - happy: root.y adds a 0.04 bounce at 2.2 Hz; root.roll sways ±0.05.
    - cheer: for t < 1.2: root.y adds a hop up to 0.45, root.yaw adds a full turn (2π·t/1.2); both arms up (armL.z 2.6, armR.z −2.6); sparkle 1 → 0 over 1.5 s; after 1.2 s arms stay up and the bounce continues.
    - oops: root.pitch 0.25 (droop), arms down (armL.z 0.3, armR.z −0.3), head.yaw shakes ±0.12 at 6 Hz for the first 1 s, drop true.
    - `look` adds head.yaw += look.x·0.18 and head.pitch += −look.y·0.12 in every expression.
  - `applyPose(parts, pose)` writes the pose into the parts’ rotations, position and scale (root.position.y = base + pose.root.y; root.scale sx/sy; shoulders rotate for arms).
  - `BASE_Y` the root’s rest y.

- [ ] **Step 1: Write the failing tests**:
  - “builds every named part from soft primitives”: all parts present and named; `root` bounding box height between 2.3 and 3.0, min y within ±0.1 of 0; `bloom.children.length ≥ 13` (core + 12 petals + bud); every mesh under `root` has a `MeshPhysicalMaterial` or `MeshStandardMaterial` or `MeshBasicMaterial`; every fabric material has `sheen === 1`; `drop.visible === false`; no geometry is a `BoxGeometry`, `CylinderGeometry` with equal radii, or `PlaneGeometry` except under `tag`.
  - “poses follow the table”: `poseFor({expression:'wave', t:0.3}).armR.z < -2`; point facing right extends the right arm and turns the body toward +x; point facing left mirrors it; cheer at t 0.6 has `root.y > 0.2`, `root.yaw` near π, both arms up, `sparkle > 0`; cheer at t 3 has arms up and `sparkle === 0`; oops has `root.pitch > 0.2`, `drop === true`; `reduced: true` zeroes the idle bob.
  - “applyPose writes rotations”: after `applyPose(parts, poseFor({expression:'cheer', t:0.6}))`, `parts.shoulderL.rotation.z > 2` and `parts.root.position.y > BASE_Y + 0.2`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** the model. Primitives only: `SphereGeometry` (scaled for ellipsoids), `CapsuleGeometry`, `LatheGeometry` for the stem, `TorusGeometry` for the seam, an `ExtrudeGeometry` of a rounded-rectangle `Shape` with bevel for the tag. Material helper `fabric(color, sheenColor, extra)`.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Visual pass.** Write a scratchpad preview page (hidden window via `scratchpad/spike3d/shot-main.cjs`) that imports the repo’s `rosie-model.mjs`, `face.mjs`, and the vendored Three.js, renders the six expressions side by side at 300 × 340 with the Task 8 lighting (hemisphere, key, fill, rim, PMREM room), and capture a PNG. Review it by eye: plush (soft, no facets, visible sheen), readable face, arms and leaves in front of the head where they should be, badge tag visible. Iterate the model until it reads well; keep the tests green. Record the final capture path in the verification record.

---

### Task 7: Effects

**Files:**
- Create: `src/renderer/guide/effects.mjs`
- Test: `tests/effects.test.mjs`

**Interfaces:**
- Produces: `createEffects(THREE, parent, { makeTexture }) → { trail(x, y, z, vx, vy), burst(x, y, z), update(dt), count() }`
  - `makeTexture(kind)` returns a `THREE.Texture` for 'petal' or 'sparkle' (the layer draws them on canvases; tests pass a stub returning `new THREE.Texture()`).
  - A pool of 24 petal `Sprite`s and 10 sparkle `Sprite`s, all `visible = false` at rest, children of `parent`.
  - `trail` spawns one petal at the position moving opposite to the velocity (scaled down) with a random spin, life 0.9 s; at most one per call.
  - `burst` spawns all 10 sparkles outward at random angles (speed 1.5–3 units/s), life 1.2 s, plus 8 petals, life 1.4 s.
  - `update(dt)` moves, fades (material opacity to 0 over the life), and hides dead particles; gravity −1.5 units/s² on petals.
  - `count()` = live particles.

- [ ] **Step 1: Write the failing tests**: pool sizes and hidden at rest; `trail` makes exactly one live petal; `burst` makes 18 live; after `update(2)` all hidden and count 0; a dead petal’s sprite is `visible === false`; sprites are `THREE.Sprite` instances.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** — Expected: PASS. `npm test` green.

---

### Task 8a: The stage, the guide layer, and the welcome tour

**Files:**
- Create: `src/renderer/guide/stage.mjs`, `src/renderer/ui/guide-layer.mjs`
- Delete: `src/renderer/ui/welcome.mjs`
- Modify: `src/renderer/index.html` (remove `<dialog id="welcome-dialog">`; add `#guide-layer` markup as the first child of `<body>`), `src/renderer/styles.css`, `src/renderer/app.mjs` (mount the layer, call `ui.guide.update(guidePlan({ state, run: lessonRun }))` at the end of `render()`, expose `roseflowDebug.guide()`), `src/main/smoke-runner.mjs` (welcome checks).

**Interfaces:**
- Consumes: `guidePlan`, `placeBeside` / `placeAtDock` / `placeAtCenter` / `placeAtCorner`, motion functions, `buildRosie` / `poseFor` / `applyPose`, `faceParams` / `drawFace`, `createEffects`, `mascotSrc`, `WELCOME`.
- Produces:
  - `createStage(THREE, canvas, { width, height, pixelRatio }) → null | { renderer, scene, camera, root, render(), setSize(w,h), dispose() }`; null when `new THREE.WebGLRenderer` throws; the scene has the hemisphere, key, fill, rim lights and a PMREM environment from a six-face procedural room (coloured `MeshBasicMaterial` boxes), ACES tone mapping, `alpha: true`, clear alpha 0.
  - `mountGuideLayer({ dispatch, findControl, THREE }) → { update(plan), debug() }`
    - DOM: `#guide-layer` (fixed, full window, `data-scene`, `data-mode`), `#welcome-backdrop`, `#rosie` (canvas or `img.mascot`), `#rosie-bubble` (`.rosie-bubble`, `data-side`), the bubble content: optional `h2.bubble-title`, `p` per line (the first line gets `data-ref="feedback"` and class ok/bad when `feedbackOk` is not null), and in the welcome scene: `span.welcome-count`, buttons `[data-fid="welcome-skip"]` and `[data-fid="welcome-next"]` with no `data-control`.
    - Welcome: the bubble gets `role="dialog" aria-modal="true" aria-label="Welcome from Rosie, the guide"`; `header`, `main`, and `#persistence-notice` get `inert`; the layer gets class `is-modal` (pointer events on); focus moves to the Next button when the bubble is not already focused; `Escape` dispatches `welcome-done`; Next dispatches `welcome-next` (or `welcome-done` on the last beat); Skip dispatches `welcome-done`. Leaving the welcome removes `inert`.
    - Loop: `requestAnimationFrame` while the layer is visible and `document.visibilityState === 'visible'`; stopped otherwise (`visibilitychange`). Each frame: resolve the anchor rect, place, spring toward the place (or jump when reduced or on the first placement), bank from velocity, pose, face redraw when its inputs changed (blink, look, mouth, params), effects, render.
    - Plan diffing: a new `anchor` (by kind+id) → a flight (count `flights`); new `lines`/`title` → a talk (count `talks`); new `expression` → reset the expression clock. Same key → nothing.
    - Mode: `data-mode="webgl"` or `"sprite"`; on `webglcontextlost` on the canvas: prevent default, dispose, switch to sprite.
    - Reduced motion: `matchMedia('(prefers-reduced-motion: reduce)')`, re-read on change.
    - `debug() → { mode, scene, anchor, anchorRect, position: {x,y}, bubbleRect, bubbleText, expression, flights, talks, side }`.
- Smoke (in `scenarioFirst`, replacing the welcome checks): the layer is in scene welcome on a fresh start; the bubble is a modal dialog (`role=dialog`, `aria-modal=true`) and `main` is inert; her mode is 'webgl' or 'sprite' (recorded in the detail); in sprite mode the img loads from `assets/mascot/`; in webgl mode the canvas has width > 0; two Next presses reach '3 of 3'; Let’s go closes it, `main` is no longer inert, and the layer is not modal; Meet Rosie again reopens at '1 of 3'; the welcome buttons carry no `data-control`; **Escape closes the welcome** (dispatch a `keydown` Escape on `document`); **a lost WebGL context falls back to the sprite** (in webgl mode: `canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`, then within 1 s `debug().mode === 'sprite'` and an `img.mascot` exists; skipped with a recorded note in sprite mode). Other scenarios’ `welcome-dialog` checks become `debug().scene === 'welcome'` checks.

- [ ] **Step 1: Update the smoke checks first** as above; run `npm run smoke` — Expected: the new checks FAIL (no layer yet), the rest pass.
- [ ] **Step 2: Implement** `stage.mjs`, `guide-layer.mjs`, the markup, the styles (layer, bubble with tail per side, backdrop, welcome buttons, reduced-motion rules, `.is-modal`), the `app.mjs` wiring, and delete `welcome.mjs`.
- [ ] **Step 3: Run** `npm test` and `npm run smoke` — Expected: all green.

---

### Task 8b: Views without cards; anchors in lessons, Home, the level map, Explore and Progress

**Files:**
- Modify: `src/renderer/ui/lesson.mjs` (drop the guide card; add `#guide-dock` at the top; keep the announcer), `src/renderer/ui/home.mjs` (action card without the picture; reserved space `.home-stage`), `src/renderer/ui/level.mjs` (begin card without the picture), `src/renderer/app.mjs` (`renderExplorePanel` without the card; progress unchanged), `src/renderer/styles.css`
- Delete: `src/renderer/ui/guide.mjs` (`mascotImg` moves into `guide-layer.mjs`)
- Modify: `src/main/smoke-runner.mjs`

**Interfaces:**
- Consumes: `homeWhere` from `logic/guide-plan.mjs`; `debug()` from the layer.
- Smoke additions (in `scenarioFirst` after the first step opens, and in `scenarioPractice`):
  - “Home anchors her to the primary action”: `debug().anchor` is control 'start-learning' and her visible box does not intersect that button’s rect.
  - “a lesson step anchors her to its target and she does not overlap it”: on `b-interface` step 1 (target `menu-realtime`) `debug().anchor.id === 'menu-realtime'`, after 1.5 s `settled`, and neither her visible box nor the bubble rect intersects the target rect.
  - “her position changes when the target changes”: `step-next` to the ruler step; after 1.5 s the position differs by more than 40 px and `flights` grew by 1.
  - “her bubble carries the beat’s text”: `debug().bubbleText` includes the step’s `explain`.
  - “a target with no size falls back to the dock” (Review Focus 1): set `hidden` on the current target element via script, wait two frames, `debug().anchor.kind === 'dock'` (resolved), then remove `hidden`.
  - “a shifted target re-anchors her without a new talk” (Review Focus 2): record `talks`, `flights`, position; dispatch `handbook-toggle`; after 1.2 s `talks` unchanged, `flights` unchanged, position changed; close the handbook.
  - “playback does not make her fly or talk” (Review Focus 3): on the Control Window step, dispatch `play`, wait 700 ms, dispatch `stop`: `talks` and `flights` unchanged.
  - “the layer is transparent to the pointer outside the welcome”: `document.elementFromPoint` at the centre of her box is not inside `#guide-layer`.
  - “the correction and the pass show in her bubble”: the existing `#panel .step-guide .bubble` checks move to `#rosie-bubble` (feedback line `data-ref="feedback"` class bad/ok).
- The panel’s announcer keeps the lesson text (unchanged check).

- [ ] **Step 1: Update the smoke checks first**; run — Expected: the new checks FAIL.
- [ ] **Step 2: Implement** the view changes and styles.
- [ ] **Step 3: Run** `npm test`, `npm run smoke` — Expected: green.

---

### Task 9: Screenshots, small window, documentation

**Files:**
- Modify: `src/main/smoke-runner.mjs` (`scenarioShots`), `docs/GUIDE_DESIGN.md`, `README.md`, `docs/SETUP.md` (security model: a bundled rendering library), `docs/VERIFICATION.md` (pointer), create `docs/VERIFICATION-2026-10-24.md`, update memory.

- [ ] **Step 1: Shots**: keep the existing list; add `00b-welcome-beat3.png` (she points at Start with Basic), `03c-flying.png` (captured 250 ms after a step change, mid-flight), `04c-cheer.png` (already the pass), and in the small window the target `term-menu` step of `b-terminal` with the check “at 1024 × 680 the bubble stays inside the window and off the target” (Review Focus 5) before the capture `15b-small-window-terminal-target.png`.
- [ ] **Step 2: Run** `node scripts/smoke.mjs --shots <scratchpad>/shots-3d` — Expected: all captured; review every capture by eye and fix what reads wrong (placement, bubble size, her scale).
- [ ] **Step 3: Documentation**: `docs/GUIDE_DESIGN.md` gets a section on the 3D Rosie (the parts table, materials, the anchor table, the placement rules, the fallback, Three.js provenance); `README.md` and `docs/SETUP.md` mention the vendored library under the security model; `docs/VERIFICATION-2026-10-24.md` records every check run with counts; memory file updated.

---

### Task 10: Packaged build

- [ ] **Step 1:** `npm run make` — Expected: the installer and the portable folder under `out/`; the vendored files and the mascot SVGs inside `resources/app.asar`.
- [ ] **Step 2:** `node scripts/smoke.mjs --exe "out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe"` — Expected: every scenario green, zero network requests, zero console errors; record the mode the packaged app ran in.
