# Rosie and the guided trainer: sources and design

Date: October 23, 2026. This records what the simplified trainer and its
mascot rest on: the training-design sources, the verified Rose Float logo,
what Rosie keeps from it, how a lesson step is now presented, and where to
change any of it. The design decisions themselves are in
`docs/superpowers/specs/2026-10-23-rosie-guide-design.md`.

## Training-design sources

| Source | What it established | How the trainer applies it |
| --- | --- | --- |
| Nielsen Norman Group, “Progressive Disclosure” (nngroup.com/articles/progressive-disclosure, read October 23, 2026) | Show the few options most people need first; put the rest one click away behind a clearly labelled control; two levels at most; novices make fewer mistakes. | Home: one bubble, one button, the levels as rows. Lesson panel: one bubble, one action, Back / Next; everything deeper under “More about this step”. |
| Nielsen Norman Group, “Onboarding Tutorials vs. Contextual Help” (nngroup.com/articles/onboarding-tutorials, read October 23, 2026) | Walkthroughs shown before they are needed are “pushy, devoid of context, and intrusive”; help works when pulled by what the learner is doing, sits beside each step, is easy to dismiss and recall, and makes the learner practise. | The welcome is three beats, skippable, shown once, replayable. Teaching stays beside the windows, step by step, and every practice step is checked. |
| Appcues / ReallyGoodUX, “Duolingo’s delightful user onboarding” and UX Planet, “Duolingo UX analysis” (secondary analyses, read October 23, 2026); Duolingo’s own 2021 home page (Wayback) | Bite-sized lessons; instant right / wrong with a one-line explanation after a mistake; the learner picks a level up front; the mascot adds warmth at the welcome and at feedback, it does not teach. | Steps stay short; Rosie cheers a pass and winces at a miss while the feedback text names what to fix; the three levels are chosen on Home; Rosie frames the teaching text without replacing it. |
| Pendo, “What is progressive disclosure?”; Rapidnative, “User onboarding best practices”; the Height example (read October 23, 2026) | Reveal a handful of things first; keep a tour short and never let it block the screen for long; advance on what the user does rather than on a timer; let people replay the tour. | The workspace still grows one pane at a time; the welcome fits on one dialog per beat; the panel moves to the try beat when the learner acts; “Meet Rosie again” on Home. |
| The owner’s reference, Freddy in *Five Nights at Freddy’s: Security Breach* | A companion who talks the player through each place, points at the next thing, and reacts to what happens. | The role of the guide, not her look. |

## The logo, verified

The Cal Poly Rose Float logo is a red rose with green serrated leaves and a
thorned stem inside a rounded-square green badge reading “CAL POLY” above and
“ROSE FLOAT” below, with “SINCE 1949” beside the stem. Two independent copies
agree:

- The program’s own site header, rosefloat.org (file “RoseFloat Logo 2026
  fully transparent.png”, 1500 × 1500, WebP, fetched October 23, 2026). The
  site lists the program’s official channels (Instagram @calpolyrosefloat,
  the Carrd page cprosefloat.carrd.co).
- English Wikipedia, `File:Cal_Poly_Pomona_Rose_Float_logo.svg`: the file
  page names the owner as CPP Rose Float and the source as cpprosefloat.org;
  uploaded January 9, 2011; marked non-free, used there under fair use.

The logo is the program’s mark (the 2026 version carries ®). It is not
bundled with the app and the downloaded copies stay outside the repository.
Rosie is an original drawing made for the team’s own, private trainer. She
is adapted from the logo, not a copy of it, and the app does not present her
as the logo or claim any affiliation.

## Rosie

A chibi rose sprite drawn as SVG by `scripts/build-mascot.mjs`:

| From the logo | In Rosie |
| --- | --- |
| The red bloom | Her head: dark outer petals with visible edges, a lighter inner face, a spiral centre at the crown. |
| Green serrated leaves | Her arms and skirt (`leaf()` in the generator draws the serration). |
| The thorned stem | Her body, with two thorns. |
| The rounded-square green badge | The outline she stands in front of, head overlapping the top edge. |
| Red `#c8102e` / `#a50f24`, green `#1f6f3f` / `#2e8b57` | Her palette; the trainer’s rose-pink is used only around her. |

Anime treatment: a head over half her height, large eyes with two highlights
each, blush marks, a small mouth, and a sweat drop or sparkles for the
expressions. Five expressions ship as files in
`src/renderer/assets/mascot/`: `wave` (welcome and Home), `point` (look at
this, your turn), `happy` (watching a demonstration, explore), `cheer` (a
pass or a right answer), `oops` (a miss or a wrong answer). The files use
presentation attributes only (the CSP forbids inline styles), carry no
scripts or references, and load through `<img>` from the app’s own files, so
they work offline and inside the packaged ASAR.

To change her: edit the generator and run `node scripts/build-mascot.mjs`;
`tests/mascot.test.mjs` checks the files. Her name and every line she says
are in `src/renderer/content/mascot.mjs`.

## How a step is presented

`src/renderer/logic/step-beats.mjs` decides, from the step and the current
beat, what Rosie says and which single action comes next:

| Step kind | look | watch (steps with a demonstration) | try | result |
| --- | --- | --- | --- | --- |
| explain | the explanation; **Show me** if a demo exists, else **Next** | Rosie narrates the demo, then its outro; **Next**; “Watch again” | | |
| practice | the explanation; **Show me** (with “Skip to trying”) or **Your turn** | as above, then **Your turn** | the instruction and “When it’s right: …”; **Check**; “Show me again” | cheer and the pass message, **Next**; or oops, the correction with the instruction under it, stay in try |
| question | the explanation and the prompt, with the options | | | right: cheer, **Next**; wrong: oops with the hint and the prompt again |

A learner who acts in the windows before pressing Your turn is still checked
(the practice triggers are unchanged) and the panel moves to the try beat. A
done step opens in its result, with “Watch again” if it has a demonstration.
Back, or leaving the lesson, during a demonstration cancels it and restores
the show data. The beat is renderer state only; the saved progress records
steps, not beats. The panel is rebuilt on every render; keyboard focus is
restored to the same button, or moved to the next action when that button is
gone or disabled, and one persistent live region beside the panel announces
the bubble’s text only when it changes.

## The welcome and the progress file

The welcome shows when the progress file says the learner has not been
welcomed. `guide.welcomed` is an optional field of the schema-3 document:
absent means true (a file from before this build belongs to someone who has
already used the trainer), a fresh document starts at false, migrated
version-1 and version-2 files are marked true. Start over writes a fresh
document, so a deliberate fresh start begins with the welcome again. See
`docs/SETUP.md`.

## Rosie in 3D (October 24, 2026)

The owner reviewed the October 23 build and asked for Rosie to be smoother,
“like a plush”, in 3D, animated, with a face that shows emotions, and free
of the left panel: she should move around the screen and guide the learner
through it. The design is in
`docs/superpowers/specs/2026-10-24-rosie-3d-guide-design.md`; this section
records what was built and where to change it.

### The character, as a plush

Rosie is now built from soft primitives in Three.js (`src/renderer/guide/rosie-model.mjs`):

| Part | Built from | Colour |
| --- | --- | --- |
| Head (bloom) | a squashed sphere core; two rings of overlapping petal ellipsoids (5 inner, 7 outer), open at the front; a three-sphere bud | `#c8102e`, `#a50f24`, `#d9344f`; sheen `#ff9aa8` |
| Face plate | a spherical cap a little proud of the core, with a pale seam ring (a torus) | the drawn face; base `#ffd6dc` |
| Face | drawn on a 512 × 512 canvas (`guide/face.mjs`): bead eyes with two highlights each, brows, blush, a mouth that moves while she talks | eyes `#2b1b1f`, blush `#ff8aa0`, mouth `#7a2a3a` |
| Body | a lathe stem, two capsule thorns | `#3b8f5c`, `#2a6b45` |
| Leaf skirt, arms, feet | flattened ellipsoids; each arm is two lobes with a paler vein capsule on a shoulder pivot | `#2e8b57`; sheen `#9fe0b0` |
| Badge tag | a bevelled rounded rectangle beside her right foot | `#1f6f3f`, rim `#e8f5e9` |
| Extras | a translucent sweat drop; petal and sparkle sprites (`guide/effects.mjs`) | `#a7d8f5`, `#ffe28a` |

Every fabric part is a `MeshPhysicalMaterial` with roughness 0.95 and full
sheen (the cloth and velvet model) over a procedural fuzz normal map, lit by
a hemisphere light, a warm key, a cool fill, a rim, and an environment built
with `PMREMGenerator` from a small procedural room (`guide/stage.mjs`). The
face plate has little sheen so the drawing stays crisp.

Expressions are poses (`poseFor`) plus face parameters (`faceParams`):
idle (hover bob, slow sway, blinks every 2.5–5 s, eyes follow the pointer),
wave, point (the arm nearer the target extends, the body and head turn),
happy, cheer (hop, one spin, arms up, a sparkle burst), oops (droop, head
shake, sweat drop). Her chibi head sits on her shoulders, so raised arms
swing outward and forward rather than straight up. When her words change she
talks for about a second: a nod and a moving mouth. In flight she banks into
the move, sheds petals, and squashes when she lands.

### Where she goes

`src/renderer/logic/guide-plan.mjs` decides her scene, anchor, expression
and words from the app state; `logic/guide-placement.mjs` turns an anchor
rectangle into a position for her and her bubble; `ui/guide-layer.mjs` owns
the fixed layer, the canvas (or the sprite), the bubble, and the frame loop.

| Screen | Anchor | What she says |
| --- | --- | --- |
| Welcome | the window centre; on the last beat, Home’s action card | the three beats (unchanged), with the count, Skip and Next / Let’s go in her bubble, which is the modal dialog; the page behind is `inert`, Esc closes it |
| Home | the action card (`data-target`: start-learning or resume) | the Home lines (unchanged) |
| Level map | the begin card (`data-target="begin-here"`) | Begin here / Pick up / the finished line / the level-done line |
| Lesson | the step’s target control, else the dock at the top of the panel | `bubbleText` for the beat (unchanged); a miss keeps the instruction under the correction |
| Explore | the dock | the explore lines |
| Progress | the lower-right corner | a short line |

Placement rules: she stands to the right, left, below or above the target,
or beside the window that holds it, taking the first spot that fits the
window, misses the target, and touches nothing she avoids; when none is
clear she takes the least weighted overlap. The avoided rectangles carry
weights: the panel, the handbook and every recreated window weigh 1, the
window that holds the target 2, and the panel’s action rows (the buttons the
learner needs next) 4. Her bubble goes on her outer side, flips when that
side has no room, takes the side with the least weighted overlap when none
is clear, slides sideways rather than clip a target that fills the desk, and
never sits on her. A target with no box (hidden, not yet revealed) sends her
to the dock. The plan carries a key, so the thirty playback ticks a second
never move her or make her talk; a layout shift (the handbook opening, a
resize) re-anchors her without a new flight or talk.

The layer sits below the PC•MACs drop-down menus and the tooltip in the
stacking order, so an open menu is never hidden by her, and it is
transparent to the pointer except during the welcome, so she never blocks a
click. Outside the welcome (a dialog) and the lessons (the panel’s live
region), her bubble is a polite status region, rebuilt only when her words
change, so each change is announced once; when the welcome closes, keyboard
focus moves to Home’s primary action. The frame loop runs on
`requestAnimationFrame` with a slow timer behind it (a window can report
itself visible yet stop delivering animation frames once WebGL is drawn, as
the hidden smoke window does), and both stop while the page is hidden or
minimised; long frames are integrated in 50 ms sub-steps so her flights keep
real-time speed. Without WebGL, or after a lost context, the same layer
shows the October 23 SVG sprites. `prefers-reduced-motion: reduce` removes
the idle motion, the particles, the flights, the cheer’s hop and spin, the
wave’s oscillation and the talking nod (she is placed at once; arms up and a
smile are the whole cheer).

### Three.js

`three@0.186.1` is vendored byte for byte from the npm registry tarball into
`src/renderer/vendor/three/` (MIT, licence included, hashes in its README
and in `tests/vendor-three.test.mjs`). It loads from the app’s own files
under the existing content security policy; no loader, worker or network
path is used.

### Sources read for this pass

- Three.js documentation for `MeshPhysicalMaterial` (sheen), `PMREMGenerator`,
  `CanvasTexture`, `Sprite`, `CapsuleGeometry`, `LatheGeometry`.
- Tooltip and coach-mark placement guidance (Userpilot, “Tooltip best
  practices”; Flook, “Mastering tooltip placement”; ServiceNow mobile
  tooltip guidance; read October 24, 2026): place the callout beside the
  target and never over it, flip when there is no room, keep one callout at
  a time.

## Rosie as a chibi toon who reacts (October 26, 2026)

The owner reviewed the October 24 build, found the 3D character ugly, and
asked for her to look more anime chibi and cuter, like Duolingo's
characters, and to be more interactive. The design is in
`docs/superpowers/specs/2026-10-26-rosie-chibi-toon-design.md`; this
section records what was built and where to change it. Where she goes, what
she says, the bubble, the placement rules, the sprite fallback and the
accessibility behaviour are unchanged from October 24.

### The look

Still built from rounded primitives in `src/renderer/guide/rosie-model.mjs`,
now as an illustration rather than a plush:

| Part | Built from | Colour |
| --- | --- | --- |
| Head (bloom) | a core sphere; a back ring of 8 chunky petals and a front ring of 8 fanned away from the face; a three-sphere curl at the crown | `#e8435f`, `#d11e42`, `#aa1333`; ink `#5a0c20` |
| Face plate | a shallow unlit spherical cap carrying the whole drawing (disc, rim, eyes, mouth) | the drawing |
| Face (`guide/face.mjs`) | a pale disc with an ink rim; eyes about a third of the face, each a white with a green iris, a dark pupil, a glassy crescent, two highlights, a heavy upper lid and a lash flick; brows; flat blush ovals; mouth styles smile, grin, cat (ω), open, o, wobble | skin `#ffe6eb`, iris `#1d6b3d` to `#62d394`, ink `#5a0c20`, blush `#ff9fb3` |
| Body | a short capsule stem with two rounded thorn nubs | `#55c67f`, nubs `#2a8a4e` |
| Leaf collar, arms, feet | six small leaves under the head; a flattened leaf and a round mitten tip per arm; two small feet | `#2fa35b`, `#44b86f`, `#2a8a4e`; ink `#15482b` |

Proportions follow the chibi guides: the bloom is about three fifths of her
height, there is no neck, the body is narrow with stubby limbs. Shading is
`MeshToonMaterial` with a nearest-filtered three-band gradient map
(`makeGradientMap`), lit by one warm key light and a soft hemisphere
(`guide/stage.mjs`), with no tone mapping so the colours stay saturated.
Every shaded piece carries an `ink` child: the same geometry drawn
back-face only and pushed out along its view-space normal by `OUTLINE`
(0.028 units, about 2.5 px), the inverted-hull outline. The face plate is
unlit so the drawing stays flat and crisp. The badge tag, the seam ring,
the velvet material and the environment map of October 24 are gone.

### The reactions

`src/renderer/logic/guide-interaction.mjs` is a pure state machine the layer
feeds with pointer moves, presses and activity; `poseFor` and `faceParams`
take its mood as an overlay on the expression.

| Mood | Trigger | Face and body |
| --- | --- | --- |
| notice | the pointer within 340 px | a touch more blush; she turns toward it |
| hover | the pointer resting on her | sparkle eyes, grin; a stretch, arms lifted |
| boop, then giggle | a press on her that is not on a control | > < eyes and an o mouth with a squash; then happy eyes, hops and a roll wiggle; a puff of sparkles and petals |
| dizzy | three boops within 1.6 s | spiral eyes, a wobble for 2.4 s |
| pet | three direction changes across the top of her within 1.2 s | happy eyes, ω mouth, full blush; she leans in; hearts rise |
| sleep | 75 s without a pointer move, press, flight or new words | lids shut, head drooped, slow breathing, little z's |
| startle | waking | wide eyes, a small hop |

In between, every 6 to 12 s, a small idle action: a glance to each side, a
stretch, a wiggle or a double blink. Reduced motion keeps every reaction in
the face (no squash, wobble, hop, particles or idle actions). The listeners
sit on `window` and `document`, so the layer keeps `pointer-events: none`:
a press on her is only noticed and the click goes on to whatever is under
her; a press on a button, link, field, menu, dialog or recreated window is
never a boop. The hearts and z's are sprites in `guide/effects.mjs`, drawn
to small canvases by the layer like the petals and sparkles.

To check the look without the app: the preview page and the hidden-window
renderer used for this pass live in the session scratchpad, not in the
repository; `node scripts/smoke.mjs --shots <dir>` captures her in the app.

## Rosie as the training film's performer (October 31, 2026)

The Revision 4 brief (`docs/brief/2026-10-31-revision-4/`) asked for a
rounder 3D guide with at least 24 distinct expressions, removable glasses,
original chirps, a separate mechanical Robot Rosie, and help on a click.
`docs/FIRST_SEGMENT.md` records what was built; this section records where
to change her.

| What | Where |
| --- | --- |
| The broad torso, capsule arms, round feet, and the glasses group on her head | `src/renderer/guide/rosie-model.mjs` (`buildRosie`); `poseFor` takes `glasses` and gives the six families their body language |
| The 24 faces (six families of four) and the five extras, parametric brows / eyes / mouth / marks, silent and speaking | `src/renderer/guide/face.mjs` (`TABLE`, `faceParams`, `drawFace`); legacy names map through `FACE_ALIASES` |
| The sprite fallback for every name | `src/renderer/content/mascot.mjs` (`spriteFor`) |
| Hover and focus reactions with dwell and rate limits | `src/renderer/logic/attention.mjs`, read by `ui/guide-layer.mjs` from `[data-react]` elements |
| Her chirps (short bursts per word group, pitch and tempo by emotion) | `src/renderer/logic/audio-plan.mjs` (`chirpPhrase`), played by `ui/audio.mjs` |
| Her film cues (expression, glasses, line, chirp) and where she stands during a film | `content/films/one-second-on.mjs`, `content/intro.mjs`; `logic/guide-plan.mjs` (`lessonPlan` while the cinema plays, `introPlan`) |
| Her help label and popover | `ui/rosie-help.mjs`; the label rides above her in `ui/guide-layer.mjs` |
| Guarding Restart (cover placement, the tickled pose) | `logic/guide-plan.mjs` (`guardPlan`), `logic/guide-placement.mjs` (`placeCover`), `rosie-model.mjs` (`tickled`) |
| Robot Rosie, a different character | `guide/robot-model.mjs`, `ui/robot-preview.mjs`, `content/robot-mapping.mjs` |
| The contact sheets for review | `guide/contact-sheet.mjs`; `node scripts/smoke.mjs --shots <dir>` writes `expressions-faces.png` and `expressions-rosie-3d.png` |

### Sources read for this pass

- Duolingo, illustration guidelines (design.duolingo.com) and the blog posts
  "Shape language: Duolingo's art style", "Building character" and "World
  character visemes" (read October 26, 2026): rounded basic shapes, the
  fewest shapes possible, large geometric eyes, exaggerated key details,
  bright colours; idle behaviour under everything, a reaction state at the
  end of each exercise.
- Clip Studio Tips, "How to draw chibi body ratio" and "The best way to pose
  chibi characters" (read October 26, 2026): two to three heads tall, eyes
  about a third of the face, short rounded limbs, no neck.
- Three.js documentation for `MeshToonMaterial` and `gradientMap`; the
  inverted-hull outline technique.
- page-mascot (GitHub, MIT) and Rive and Framer mascot listings (read
  October 26, 2026): an idle loop under continuous pointer tracking, short
  interrupt reactions that hand control back, reduced motion honoured.
