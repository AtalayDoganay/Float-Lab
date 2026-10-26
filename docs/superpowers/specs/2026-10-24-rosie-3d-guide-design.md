# Rosie in 3D: a plush guide who flies around the screen — design

Date: October 24, 2026. Follows the October 23 pass (“Simplify the trainer
and add a Rose Float mascot guide”, `2026-10-23-rosie-guide-design.md`). The
owner reviewed that build and asked for Rosie to be smoother and cleaner,
“like a plush”, in 3D, with more effects and animation, with a face that
shows emotions, and not fixed to the left panel: she should move around the
screen and guide the learner through it. The owner asked for the work rather
than a conversation, so the decisions below are the implementer’s, each
reversible in one place.

## Intent

Rosie stops being a picture in a card. She becomes a small plush rose,
rendered in real 3D, who floats free over the whole window. She flies to the
control a step is about, points at it, talks in a speech bubble beside her,
and reacts with her face and body: a wave on arrival, a cheer on a pass, a
wince on a miss. The lesson panel keeps the buttons; Rosie keeps the words.

Everything else from the October 23 pass stands: the three levels and their
names, every lesson, question, validator and wrong-answer explanation, the
recreated PC•MACs windows, the help, the handbook, the progress file and its
semantics, the security model, and the offline rule.

## Goals

1. **Plush, not blocky.** Soft rounded forms only (spheres, ellipsoids,
   capsules, lathes), a velvet fabric material with sheen and a faint fuzz,
   a visible seam where a plush toy has one, warm soft lighting. No hard
   edges, no flat fills.
2. **Real 3D.** A WebGL scene with a perspective camera. She turns toward
   what she points at, tilts into a flight, bobs while idle, and the light
   moves across her as she does.
3. **Face and emotions.** A drawn face on a curved face plate: large eyes
   that blink, follow the pointer and the target, and change shape with
   mood; brows, blush, a mouth that moves while she talks; a sweat drop for
   a miss, sparkles for a cheer. Expressions: `wave`, `point`, `happy`,
   `cheer`, `oops`, with `idle` motion underneath all of them.
4. **Effects and animation.** Appear with a pop, fly along a gentle arc
   with banking and a trail of petals, settle with a small squash, idle
   hover, blink, talk, wave, point, cheer (hop, spin, arms up, sparkle
   burst), oops (droop, head shake, sweat drop), hide with a shrink.
5. **Guides through the screen.** Rosie is anchored to what matters on each
   screen: the step’s target control in a lesson (she flies to it and
   points), the Begin button on the level map, the primary action on Home,
   the centre of the window during the welcome, a quiet dock when there is
   nothing to point at. The welcome becomes a short tour with her in it.
6. **Never in the way.** Her layer is transparent to the pointer except
   during the welcome; she and her bubble are placed beside the target,
   never over it, and kept clear of the lesson panel when they can be.
7. **Works for everyone.** A sprite fallback (the existing SVGs) when WebGL
   is unavailable; reduced motion honoured (no idle motion, no particles,
   instant placement with a fade); the lesson live region keeps announcing
   her words once; the welcome stays a modal dialog for keyboard and
   assistive technology; automated checks run in the hidden window without
   taking focus or input.

## Non-goals

- No new lessons, text, validators, or progress-file changes. The progress
  schema is untouched.
- No dependency fetched at run time: Three.js is bundled as files in the
  app and loaded from the app’s own files under the existing CSP.
- No dragging, no voice, no clicking on Rosie, no mascot drawn inside the
  recreated PC•MACs windows themselves (she floats beside them).
- No change to the help, the handbook, the tooltips, or the PC•MACs
  recreation.

## Anti-goals (what would make this a failure)

- Rosie or her bubble covering the control the learner has to use, or
  blocking a click anywhere.
- A render loop that makes playback in the Edit View stutter, or that keeps
  the CPU busy when she is hidden.
- A screen reader re-reading her bubble on every frame or every render.
- A welcome that can be left open behind a focused page, or that the
  keyboard cannot close.
- Any network request, any inline style attribute, any `eval`.

## Sources used

- Three.js documentation and source for `MeshPhysicalMaterial` (sheen,
  sheenRoughness, sheenColor: the cloth and velvet model), `PMREMGenerator`
  (soft environment light from a scene), `CanvasTexture`, `Sprite`,
  `CapsuleGeometry`, `LatheGeometry`.
- The Three.js package itself: `three@0.186.1` from the npm registry, MIT
  licence, the two unminified module files vendored byte for byte with
  their SHA-256 recorded in `src/renderer/vendor/three/README.md`. The
  package ships no minified build, so the files are the upstream ones.
- Nielsen Norman Group, “Onboarding Tutorials vs. Contextual Help” (applied
  on October 23): help beside the thing it is about, easy to dismiss.
- Tooltip and coach-mark placement guidance (Userpilot “Tooltip best
  practices”, Flook “Mastering tooltip placement”, ServiceNow mobile
  tooltip guidance, read October 24, 2026): place the callout beside the
  target and never over it, flip sides when there is no room, use an arrow
  or pointer toward the target, one callout at a time.

## The character

The same adaptation of the Cal Poly Rose Float logo as before (red bloom,
green serrated leaves, thorned stem, green badge), now built as a plush toy:

| Part | Built from | Colour |
| --- | --- | --- |
| Head (bloom) | a squashed sphere core; two rings of overlapping squashed-sphere petals (5 inner, 7 outer) in alternating reds; a three-sphere bud at the crown | `#c8102e`, `#a50f24`, `#d9344f`; sheen tint `#ff9aa8` |
| Face plate | a spherical cap on the front of the core, a little proud of it, with a thin pale seam ring | the face texture; base `#ffd6dc` to `#f7b8c4` |
| Face | drawn on a 512 × 512 canvas: bead eyes with two highlights each, brows, blush, mouth | eyes `#2b1b1f`, blush `#ff8aa0`, mouth `#7a2a3a` |
| Body (stem) | a lathe profile: rounded, slightly tapered | `#3b8f5c` |
| Thorns | two tiny capsules on the stem | `#2a6b45` |
| Leaf skirt | five flattened ellipsoids around the top of the stem | `#2e8b57`; sheen `#9fe0b0` |
| Arms | two flattened lobed leaves (two overlapping ellipsoids each) on shoulder pivots, with a paler vein capsule | `#2e8b57` |
| Feet | two small green ellipsoids | `#2e8b57` |
| Badge tag | a small rounded tag hanging from the stem, green with a pale rim | `#1f6f3f`, rim `#e8f5e9` |
| Extras | a sweat drop (translucent blue sphere and cone), sparkles and petals as camera-facing sprites | drop `#a7d8f5`, sparkles `#ffe28a`, petals the bloom reds |

Fabric: `MeshPhysicalMaterial`, roughness 0.95, metalness 0, sheen 1,
sheenRoughness 0.55, a procedural fuzz normal map (a noise canvas,
normalScale about 0.3), lit by a hemisphere light, a warm key, a cool fill,
a rim, and a soft environment built with `PMREMGenerator` from a tiny
procedural room. ACES tone mapping. Her canvas is 300 × 340 CSS pixels with
a transparent background; the pixel ratio is capped at 2.

Expressions are poses (pure, time-dependent data) applied to the parts, plus
face parameters:

| Expression | Body | Face |
| --- | --- | --- |
| idle (under every expression) | hover bob, slow yaw sway, arms relaxed | open eyes, small smile, a blink every 2.5–5 s, eyes follow the pointer |
| wave | right arm waves, body leans back a little | wide smile, brows up |
| point | the arm nearer the target extends toward it; lean and head turn that way | determined brows, small smile, eyes toward the target |
| happy | gentle sway and bounce | half-moon eyes, smile |
| cheer | hop, one full spin, both arms up, sparkle burst, petal confetti | closed happy arcs, open smile, full blush |
| oops | droop forward, arms down, small head shake, sweat drop | worried brows, wobbly mouth, wide eyes |

When her words change she “talks” for about a second: a small nod and a
mouth that opens and closes.

## The guide layer

A fixed, full-window layer at the start of `<body>`, `#guide-layer`,
transparent to the pointer except while the welcome is open. Inside:

- `#rosie`: her canvas (or the fallback `<img class="mascot">`), moved with
  a transform; 300 × 340.
- `#rosie-bubble`: her speech bubble, beside her on the side away from the
  target, with a tail toward her; max width 320 px; text only, except in
  the welcome where it also holds the count, Skip, and Next / Let’s go.
- `#welcome-backdrop`: a dimming backdrop shown only during the welcome.

`src/renderer/logic/guide-plan.mjs` decides, from the state, what she does
(pure, tested):

| Scene | Anchor | Expression | Words |
| --- | --- | --- | --- |
| welcome | beats 1 and 2: the window centre; beat 3: Home’s primary action | the beat’s expression | the beat’s text; the count; Skip; Next / Let’s go |
| home | the primary action (`start-learning` or `resume`) | wave | `LINES.homeFirst` / returning / current (unchanged) |
| level | the Begin button (`begin-here`) | point; cheer after a finished lesson or a finished level | `LINES.beginHere` / `pickUp` / `finished` / `levelDone` (unchanged) |
| lesson | the step’s `target` control when it resolves, else the panel dock | `expressionFor` (unchanged) | `bubbleText` (unchanged) |
| explore | the panel dock | happy | `LINES.explore` and the help line |
| progress | the window’s lower right corner | happy | `LINES.progress` (new line) |

Anchors are resolved to rectangles by the layer after each render, with the
same `findControl` lookup the target highlight uses. A target that does not
resolve, or has no size (hidden), falls back to the dock. The dock is an
empty element at the top of the lesson panel (`#guide-dock`, 300 × 276) that
reserves her room, so her bubble, which then sits to her right over the
window area, never covers the panel’s buttons. Top-layer dialogs (help,
photo, confirm, Set to value) paint above her as they do above everything.

`src/renderer/logic/guide-placement.mjs` (pure, tested): given the viewport,
the target rectangle, her box, the bubble’s box and rectangles to avoid,
returns her position and the bubble’s: beside the target on the side with
room (right, left, below, above, in that order), never overlapping the
target, clamped to the viewport, the bubble on her outer side and flipped
when it would leave the window.

`src/renderer/logic/motion.mjs` (pure, tested): a critically damped spring
for her position, banking from velocity, the arrival squash, the blink
schedule, the talk envelope, the idle bob, and a reduced mode that jumps.

The layer runs one `requestAnimationFrame` loop while she is visible and
the document is visible, and none otherwise. Plans are compared by a key:
she re-flies only when the anchor changes, re-talks only when the words
change, and never reacts to the 30-per-second playback ticks, which do not
reach her.

## The welcome as a tour

Three beats as before, the same words. Rosie appears at the centre over a
dimmed Home, waves, and talks. Her bubble is the dialog: `role="dialog"`,
`aria-modal="true"`, labelled, with the count, Skip, and Next / Let’s go;
the rest of the page is `inert` while it is open; Esc dismisses it. On the
third beat she flies to Home’s primary action and points at it. The
`<dialog id="welcome-dialog">` element goes away.

## What the panel and the stage views keep

- Lesson panel: Lessons, the kicker, the title, the step count, the question
  options, the beat actions, Back / Next, More about this step. The speech
  card goes; the dock takes its place at the top.
- Home: a heading, the primary action (Start with Basic, or Continue with
  Start over) in a plain action card beside a reserved space where Rosie
  hovers, the three level rows, the found card, the foot line with Meet
  Rosie again.
- Level map: the begin card keeps the title, the summary, and the button;
  Rosie’s line moves to her bubble.
- Explore and Progress: the panel keeps its back button and heading; the
  words move to the bubble.

## Fallback and reduced motion

If `WebGLRenderer` cannot be created, or the context is lost, the layer
shows the existing SVG sprites in the same floating element; placement, the
bubble and the welcome behave the same. `prefers-reduced-motion: reduce`
turns off the idle motion, the trail, the bursts, and the flight: she is
placed at once and fades in. The smoke harness records which mode ran.

## Verification

- Unit tests: the plan, the placement, the motion, the face parameters, the
  model’s parts and poses (Three.js imported in Node), the effects pool,
  the vendored files’ hashes.
- Smoke (hidden window): the layer exists and her mode is recorded; the
  welcome is a modal dialog in her bubble with the page inert, and Esc
  closes it; Home anchors her to the primary action; a lesson step anchors
  her to its target and her position changes when the target changes; her
  bubble carries the beat’s text; her box and the bubble never overlap the
  target rectangle; the layer is pointer-transparent outside the welcome;
  the live region announces once; no network; no console errors.
- Screenshots reviewed by eye: the welcome, Home, the level map, a step
  with a target, a correction, a pass, the small window.
- Packaged build: `npm run make`, then the smoke suite against the
  executable.

## Where to change things

- Her look: `src/renderer/guide/rosie-model.mjs` (parts, colours, poses)
  and `src/renderer/guide/face.mjs` (the face).
- Her effects: `src/renderer/guide/effects.mjs`.
- Where she goes and what she says: `src/renderer/logic/guide-plan.mjs`;
  her lines in `src/renderer/content/mascot.mjs`.
- How she is placed beside a target: `src/renderer/logic/guide-placement.mjs`.
- The layer, the loop, the bubble, the welcome: `src/renderer/ui/guide-layer.mjs`.
- Three.js: `src/renderer/vendor/three/` (replace both files together and
  update the README’s hashes and the test).
