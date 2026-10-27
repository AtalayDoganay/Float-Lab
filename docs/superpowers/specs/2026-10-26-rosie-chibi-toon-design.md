# Rosie as a chibi toon who reacts to the learner — design

Date: October 26, 2026. Follows the October 24 pass (“Rosie in 3D: a plush
guide who flies around the screen”, `2026-10-24-rosie-3d-guide-design.md`).
The owner reviewed that build, found the 3D character “terrible”, and asked
for her to look “more anime chibi and cuter, like Duolingo’s”, and to be
more interactive, with the research done online. The owner asked for the
work rather than a conversation, so the decisions below are the
implementer’s, each reversible in one place.

## Intent

Keep everything the October 24 pass built around her (the flights, the
anchors, the bubble, the placement rules, the accessibility and the sprite
fallback) and replace two things: how she looks, and what she does when the
learner reaches for her.

Looks: she stops being shaded plastic and becomes an illustration that
happens to be 3D. Flat cel colours, ink outlines, a head three fifths of her
height, a face that is mostly eyes, a body that is an afterthought.

Behaviour: she notices the pointer. She turns toward it, perks up when it
rests on her, squashes and giggles when she is clicked, gets dizzy when she
is clicked three times, purrs with hearts when she is stroked, dozes when
nothing happens for a long time, and fidgets a little in between. None of
it ever takes a click away from the page.

## What the research said

- **Duolingo’s illustration guidelines and blog** (design.duolingo.com,
  “Shape language: Duolingo’s art style”, “Building character”, read
  October 26, 2026): characters are built from one or two basic rounded
  shapes; every edge is rounded and pointed shapes are off-brand; the
  fewest shapes possible, clearly silhouetted; eyes are geometric and
  large; key details are exaggerated “almost to the point of caricature”;
  bright, saturated colours rather than muted ones; the cast was derived
  from Duo’s own build (a simple geometric body, big endearing eyes,
  detached feet).
- **Duolingo’s “World character visemes”** (read October 26, 2026): the
  characters animate through a Rive state machine with idle behaviour
  (nods, blinks, brows) under everything, speech driven by a set of mouth
  shapes, and a reaction state at the end of each exercise.
- **Chibi proportions** (Clip Studio Tips, “How to draw chibi body ratio”
  and “The best way to pose chibi characters”, read October 26, 2026): two
  to three heads tall, the head about half the height or more, eyes about a
  third of the face, limbs short and rounded, hands and feet small and
  round, no neck.
- **Three.js** (`MeshToonMaterial` with a nearest-filtered `gradientMap`
  for hard shading bands; the inverted-hull outline, a back-face copy of
  each mesh pushed out along its normal, is the standard real-time ink
  line; read October 26, 2026).
- **Interactive web mascots** (page-mascot on GitHub; Rive and Framer
  mascot listings; read October 26, 2026): the usual layering is an idle
  loop at the bottom, continuous pointer tracking above it, and short
  interrupt reactions (hover, click) that hand control back; reactions
  respect reduced motion.

## Goals

1. **Chibi.** Head about three fifths of her height, no neck, a tiny body
   with stubby limbs and round feet. Eyes about a third of the face, each
   with a white, a bright iris, a pupil, two highlights and a heavy upper
   lid with a lash flick. Flat blush ovals. A small mouth.
2. **Toon, like an illustration.** Flat saturated colours in two or three
   hard shading bands, a coloured ink outline around every piece, an unlit
   face plate so the drawing stays crisp, no tone mapping.
3. **Still a rose, still the logo’s.** A red bloom head of chunky rounded
   petals with a curl at the crown, a green stem body with two rounded
   thorn nubs, a leaf collar, leaf-mitten arms, green feet. The same reds
   and greens as before, brightened.
4. **Interactive, in layers.** Idle motion and the expression at the
   bottom; pointer tracking (eyes, head and a lean) on top; short reactions
   that interrupt and hand back: notice, hover, boop, giggle, dizzy, pet,
   sleep, startle; and small idle actions (a glance, a stretch, a wiggle, a
   double blink) when nothing else is going on.
5. **Never in the way.** The layer stays transparent to the pointer. A
   press on her is noticed, never captured, and a press on a control is
   never a boop.
6. **Works for everyone.** Reduced motion keeps every reaction in the face
   alone (no squash, no wobble, no hop, no particles, no idle actions).
   The sprite fallback and the accessibility behaviour are unchanged.

## Non-goals

- No change to where she goes, what she says, the bubble, the lesson flow,
  the progress file, the help or the handbook.
- No dragging, no sound, no new assets fetched at run time; Three.js stays
  vendored as it is.
- The 2D sprite fallback keeps the October 23 drawings.

## Anti-goals

- A click on anything under her that does not reach it.
- A reaction that keeps the CPU busy when she is hidden, or that runs on
  playback ticks.
- Any inline style, `eval`, or network request.

## The character

Built in `src/renderer/guide/rosie-model.mjs` from a shared unit sphere and
a capsule, scaled per piece. Every shaded piece carries an `ink` child: the
same geometry with `MeshBasicMaterial({ side: BackSide })` whose vertex
shader pushes each vertex out along its view-space normal by `OUTLINE`
(0.028 world units, about 2.5 px on screen), so the line is the same
thickness whatever the piece’s scale.

| Part | Built from | Colour |
| --- | --- | --- |
| Head (bloom) | a core sphere (r 0.78); a back ring of 8 petals (0.36 × 0.46 × 0.2) and a front ring of 8 (0.3 × 0.4 × 0.16) fanned away from the face; a three-sphere curl at the crown | `#e8435f`, `#d11e42`, `#aa1333`; ink `#5a0c20` |
| Face plate | a shallow spherical cap, unlit, textured with the drawn face; the cap’s UVs span the whole texture | the drawing |
| Face (`guide/face.mjs`, 512 × 512) | a pale disc with an ink rim; eyes 120 × 152 px with a white, a green iris (`#1d6b3d` → `#62d394`), a dark pupil, a glassy crescent, two highlights, a 14 px upper lid and a lash flick; brows; flat blush; mouth styles smile, grin, cat (ω), open, o, wobble | skin `#ffe6eb`, ink `#5a0c20`, blush `#ff9fb3` |
| Body | a capsule stem (r 0.23) with two rounded thorn nubs | `#55c67f`, nubs `#2a8a4e`; ink `#15482b` |
| Leaf collar | six small flattened ellipsoids under the head | `#2fa35b` |
| Arms | a flattened ellipsoid and a round mitten tip on each shoulder pivot (same mirror frame as before) | `#44b86f` |
| Feet | two small ellipsoids | `#2a8a4e` |
| Extras | the sweat drop; petals, sparkles, hearts and z’s as sprites | drop `#9fd8ff`, hearts `#ff6f8a`, z `#9bb9ff` |

Shading: `MeshToonMaterial` with a 4-texel gradient map (values 100, 190,
255, 255; nearest filtering) under a warm key light and a soft hemisphere.
`NoToneMapping`. The badge tag and the face seam ring of the October 24
build are gone: fewest shapes.

Her bounding box is about 2.2 wide and 2.7 tall in stage units, inside the
same 300 × 340 canvas and the same placement geometry.

## The reactions

`src/renderer/logic/guide-interaction.mjs` is a pure state machine the
layer feeds with pointer moves (with her visible box), presses (with
whether the press landed on a control), and a note of any activity (a new
anchor, new words). `update(clock)` returns the mood, how long it has held,
how near the pointer is, which way it is, and any idle action.

| Mood | Trigger | Ends | Face | Body |
| --- | --- | --- | --- | --- |
| notice | the pointer within 340 px of her | it moves away | a touch more blush | she turns toward it |
| hover | the pointer resting on her visible box | it leaves | sparkle eyes, brows up, grin | a 5 % stretch, head up, arms lifted a little |
| boop | a press on her (not on a control) | 0.45 s | > < eyes, o mouth | squash 18 %, head nod |
| giggle | after a boop | 0.9 s | happy eyes, grin | two small hops, a roll wiggle |
| dizzy | three boops within 1.6 s | 2.4 s | spiral eyes, wobble mouth | yaw and roll wobble, arms down |
| pet | three direction changes while the pointer moves across the top half of her, within 1.2 s | 0.8 s after the last stroke | happy eyes, ω mouth, full blush | leans into the hand; hearts every 0.55 s |
| sleep | 75 s with no pointer move, press, flight or new words | anything happens | lids shut | head droops, slow breathing; a z every 1.6 s |
| startle | waking | 0.6 s | wide eyes, o mouth | a small hop |

Idle actions play every 6 to 12 s while she is calm (none or notice) and
reduced motion is off: glance (eyes left then right, 1.2 s), stretch (0.8
s), wiggle (0.9 s), double blink (0.5 s). Any other mood ends them.

Priority: dizzy, boop, giggle and startle run their course; then pet, then
hover, then sleep, then notice, then none.

The pointer listeners are on `window` and `document` (passive, the press
one in the capture phase), so the layer keeps `pointer-events: none`. A
press whose target is inside a button, link, field, summary, label, menu
item, tab, option, dialog, PC•MACs menu or recreated window is never a
boop. A boop spawns a puff (six sparkles, four petals).

## Verification

- `npm test`: the model (parts, materials, outlines, proportions, poses,
  moods, idle actions), the face (expressions, moods, drawing without
  anything a canvas lacks), the effects (pools and spawners), the
  interaction machine (every mood and transition, deterministic with an
  injected random).
- `npm run smoke`: all seven hidden-window scenarios, including every
  existing guide check (placement, no overlap, pointer transparency,
  stacking, loop stops when hidden, reduced motion).
- Design review from captures: the preview page in the scratchpad renders
  her at twice her size per expression and per mood through a hidden
  Electron window; `node scripts/smoke.mjs --shots <dir>` captures her in
  the app.
