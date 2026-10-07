# Verified source materials for Roseflow PC Mac Training

This folder holds the two original handoff files that the One File task
(`../ONE_FILE_TASK.md`, revision 1) was prepared from. They were copied here on
October 7, 2026 from the project owner's Downloads folder so the project no longer
depends on that folder. The copies are byte-identical to the originals.

| File | Relative path (from repo root) | Size | SHA-256 | Matches task listing |
| --- | --- | --- | --- | --- |
| File 1 · Project context Markdown | `one-file-promot-float-lab/sources/FLOAT_LAB_PROJECT_CONTEXT.md` | 30,515 bytes, 574 lines | `9803636390fe17ba66480588215eb5f58e539635e59c69b062d2a77b3afaa115` | Yes (`9803636390fe17ba…`) |
| File 2 · Handoff archive | `one-file-promot-float-lab/sources/Float-Lab-Handoff.zip` | 6,239,972 bytes, 22 files | `2f6b37c7574ac63a9001386014edcdd7576e63d2e5a116199a20d132f0ad5aa0` | Yes (`2f6b37c7574ac63a…`) |

An extracted, unmodified copy of the archive sits beside it at
`one-file-promot-float-lab/sources/Float-Lab-Handoff/` for direct reading. The
application does not load anything from this folder; it is excluded from packaging
(see `forge.config.cjs`, `packagerConfig.ignore`).

## Archive inventory (all 22 files present)

```
Float-Lab-Handoff/.gitignore
Float-Lab-Handoff/README.md
Float-Lab-Handoff/app/app.js            (49 lines: prototype curriculum, demos, state)
Float-Lab-Handoff/app/index.html
Float-Lab-Handoff/app/style.css
Float-Lab-Handoff/app/controller.jpg    = reference-photos/07-1000066747.jpg (identical bytes)
Float-Lab-Handoff/app/feedback.jpg      = reference-photos/09-1000066749.jpg (identical bytes)
Float-Lab-Handoff/app/network.jpg       = reference-photos/10-1000066750.jpg (identical bytes)
Float-Lab-Handoff/app/workshop.jpg      = reference-photos/04-1000066739.jpg (identical bytes)
Float-Lab-Handoff/docs/FLOAT_LAB_PROJECT_CONTEXT.md   (identical to File 1)
Float-Lab-Handoff/docs/VS_CODE_PROMPT.md
Float-Lab-Handoff/docs/lessons.json     (export of the same 10 lessons / 20 questions as app.js)
Float-Lab-Handoff/reference-photos/01-1000066743.jpg … 10-1000066750.jpg (ten originals, 1536x1153 or 1536x1152)
```

## Where the app uses them

- The ten reference photos are copied unchanged to
  `src/renderer/assets/reference-photos/` and bundled into the packaged app.
- The curriculum (10 lessons, 20 questions, answer keys, wrong-answer explanations)
  is ported from `app/app.js` into `src/renderer/content/curriculum.mjs` with stable
  identifiers. `docs/lessons.json` was compared with `app/app.js` and holds the same
  data; `app.js` was treated as authoritative because it is what the prototype ran.
- The prototype demos in `app/app.js` lines 25–47 were read in full before porting.

## Visual inspection of the photos (performed October 6–7, 2026)

| Photo | What the pixels show | Used as evidence for |
| --- | --- | --- |
| 01-1000066743 | `Terminal - COM3` dialog over a PC•MACs background. Toolbar: `Card [1]`, `Character delay: None`, `Clear Screen`, `Status` (greyed), `Config Done`, `Control`. Main configuration menu, axis 0 selected, prompt `Enter the card address (0 - 255):`. Background shows a time ruler (`0 min 04 sec … 24 sec`), a grid, and purple/red traces. A `Help` menu item is visible top-left. | Terminal dialog layout, menu text, card-address prompt, ruler style |
| 02-1000066740 | Enclosure interior through the lid window, label `BIG BERTHA`, wiring and boards. | Workshop context only |
| 03-1000066744 | Same dialog; prompt `Enter the axis (0 - 3):`. | Axis prompt text |
| 04-1000066739 | Workshop table: laptop, enclosure, a linear actuator and cabling. Includes other people. | Workshop context only; keep private |
| 05-1000066745 | Main configuration, `axis to modify: 3`, axis 3 Min Scale `10`, axis 0 Max Scale `0`. | Snapshot variation |
| 06-1000066746 | Main configuration, `axis to modify: 0`, axis 3 Min Scale still `10`. Window buttons partly cropped. | Snapshot variation |
| 07-1000066747 | Main configuration, axis 0 Max Scale `147`, axis 3 Min Scale `38`. | The "later snapshot" table used in lessons |
| 08-1000066748 | Same as 07, slightly different framing. | Same |
| 09-1000066749 | Feedback menu: `DMX-512 Addr`, `Prop Gain`, `Int Gain`, `Der Gain`, `Rev Out`; `Axis 0: Enabled`; options 1–7; footer `k) main conf … x) eXit`. | Feedback menu text and values |
| 10-1000066750 | `Br-EFB Network Settings`: DHCP disabled, IP `192.168.0.10`, Netmask `255.255.255.0`, Gateway `192.168.0.1`, `c) Confirm settings`, `x) Discard settings`. | Network menu text and values |

**Fidelity gap recorded:** none of the ten photos shows the PC•MACs main window
with the terminal dialog closed. Only the top ruler, grid lines, and trace fragments
are visible. The app therefore reproduces the terminal/configuration dialog from the
photos and presents its timeline workspace as a labeled simplified teaching surface
built from the manual's description, not as an exact reproduction. See
`docs/REFERENCE_FIDELITY.md`.

## Manufacturer manuals (linked, not bundled)

- PC•MACs manual: https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf
  Edition text on page 1: "Pc•MACs Manual / January 13, 2021", 326 pages. Read during
  implementation on October 7, 2026 by extracting the PDF text locally.
- Br-EFB manual: https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf
  Edition text on page 1: "Br-EFB Manual / May 22, 2018", 142 pages, firmware screens
  shown as "version 1.00 - copyright 2018". The photographed card reports version 1.98,
  copyright 2022, and its menu letters differ from the manual's, so the manual is cited
  only for concepts it documents, never for the photographed menu's exact behavior.

Claims drawn from them in the app cite edition, page, URL, and verification status
in `src/renderer/content/references.mjs`. Installed lessons do not depend on
downloading either manual.
