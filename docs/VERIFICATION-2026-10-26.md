# Verification record, October 26, 2026: Rosie as a chibi toon who reacts

Follows `docs/VERIFICATION-2026-10-24.md` (Rosie in 3D, the floating
guide). The owner reviewed that build, found the 3D character “terrible”,
and asked for her to look more anime chibi and cuter, like Duolingo’s
characters, and to be more interactive, with the research done online. The
design is `docs/superpowers/specs/2026-10-26-rosie-chibi-toon-design.md`;
the owner asked for the work rather than a conversation, so its decisions
are the implementer’s.

## What changed in behavior

- **Rosie is a cel-shaded chibi.** Same rounded primitives, now with flat
  toon materials in three hard shading bands, a coloured ink outline around
  every piece (an inverted hull pushed out along the view-space normal), no
  tone mapping. A head about three fifths of her height, no neck, a narrow
  stem body, stubby leaf-mitten arms, small feet. The badge tag, the face
  seam, the velvet and the environment map are gone.
- **A bigger anime face.** An unlit pale disc with an ink rim; eyes about a
  third of the face, each with a white, a green iris, a dark pupil, a glassy
  crescent, two highlights, a heavy upper lid and a lash flick; flat blush
  ovals; a small mouth with a new ω (cat) style for happy and petted. The
  same six expressions.
- **She reacts to the pointer.** Notice (she turns toward a pointer within
  340 px), hover (sparkle eyes, a stretch), boop on a press (> < eyes, a
  squash, then a giggle with a puff of sparkles and petals), dizzy after
  three quick boops (spiral eyes, a wobble), pet when the pointer strokes
  across her head (ω smile, hearts), sleep after 75 s of nothing (lids shut,
  z’s), startle on waking. In between, a small idle action every 6 to 12 s:
  a glance, a stretch, a wiggle, a double blink.
- **Never in the way.** The layer still takes no pointer events; the press
  and move listeners sit on the window and document, so a click on her
  reaches whatever is under her, and a press on a button, link, field,
  menu, dialog or recreated window is never a boop.
- **Reduced motion** keeps every reaction in the face alone: no squash,
  wobble, hop, particles or idle actions.

Nothing else changed: where she goes, what she says, the bubble, the
lesson flow, the progress file, the help and the handbook are as on
October 24.

## Checks run

| Check | Result |
| --- | --- |
| `npm test` (151 tests: the model’s parts, materials, outlines, proportions, poses, moods and idle actions; the face’s expressions and moods drawn against a context stand-in; the effects pools and spawners; every mood and transition of the interaction machine with an injected random; everything from before) | 151 passed, 0 failed |
| `npm run smoke` (the seven hidden-window scenarios: first, resume, malformed, savefail, legacy, legacy2, practice; including every guide check: placement beside the target, no overlap, pointer transparency, menus above her, the loop stopping when hidden, reduced motion, the WebGL-loss fallback, no renderer console errors) | all scenarios passed (106, 18, 9, 11, 16, 15, 23 checks) |
| `node scripts/smoke.mjs --shots <dir>` (in-app captures of the welcome, Home, the level map, lesson steps, a cheer, a correction, the windows) | captured; reviewed |
| A preview page rendered through a hidden Electron window at twice her size, per expression (idle, wave, point, happy, cheer, oops) and per mood (hover, boop, giggle, dizzy, pet, sleep, startle) | reviewed; the look and every face read as intended |

Not verified in this pass: the packaged Windows build (`npm run make`) was
not rebuilt; the change is renderer-only and loads nothing new, so the
October 24 packaging notes stand. The pointer reactions were exercised
through the unit tests of the state machine and the smoke’s existing
pointer checks, not by a scripted pointer in the hidden window.
