# Recreate the actual PC•MACs interface in the guided trainer

<!-- one-file-revision -->
**One File task · revision 1** — prepared October 7, 2026 at 9:27 PM (UTC-07:00)

- Project: Float Lab · conversation “so why arent we using actual pcmac ui for...”
- First task revision in this conversation
- Feedback included: October 7, 2026 at 7:36 PM (UTC-07:00) — “so why arent we using actual pcmac ui for examples and its own interface”
- Feedback included: October 7, 2026 at 7:38 PM (UTC-07:00) — “check the folder your self and you tell me”
- Feedback included: October 7, 2026 at 8:51 PM (UTC-07:00) — “https://gilderfluke.com/wp-content/uploads/2019/12/PCMACs_Manual.pdf LOOK HERE A…”
- Feedback included: October 7, 2026 at 9:23 PM (UTC-07:00) — “ok get the promot going”
- Evidence: saved findings only. The current code was not re-inspected for this revision; verify every referenced file before editing.
<!-- /one-file-revision -->

Implementation request: This document describes the requested work for this task revision. It is not a project overview, persistent memory, or a record of completed changes. Use repository documentation for project context and verify current code before editing. If requirements conflict, identify the conflict instead of silently choosing one.

## Outcome

Redesign the existing Roseflow PC Mac Training app so learners see and practise in a reference-supported recreation of the actual PC•MACs/Gilderfluke interface. Use the supplied PC•MACs manual and examine the actual application online to establish the interface. Keep the guided, one-step-at-a-time learning experience, offline simulation, and saved progress.

## Scope

- Edit the existing application source, styles, lesson content, and relevant implementation documentation. Preserve useful existing implementation rather than rebuilding from an empty repository.
- Replace the simplified main workspace with an interactive, reference-supported recreation of the relevant PC•MACs screens. Review the terminal recreation against its references and correct supported discrepancies.
- Integrate demonstrations and learner practice into those recreated controls while retaining the guided lesson experience.
- Leave original source materials and background handoff documents intact. Task export, task revision numbering, and One File application controls are outside the implementation scope.

## Requirements

- Use the actual PC•MACs interface for examples, demonstrations, and learner practice. A generic workspace with PC•MACs terminology or a separate reference-photo viewer does not fulfill this request.
- Consult https://gilderfluke.com/wp-content/uploads/2019/12/PCMACs_Manual.pdf and examine the actual PC•MACs application online. Establish the applicable version and source support for layouts, controls, terminology, and behavior before implementing them. The supplied findings do not establish that this research has happened.
- Identify missing required sources and notify the user before editing if required sources are unavailable. Keep reference gaps explicit; do not invent unsupported screens or claim an identical match without evidence.
- Keep the application name Roseflow PC Mac Training and its downloadable Windows training-app purpose.
- Present the learning levels when the app opens, using the exact names Basic, intermediate, and I hate my life. Give a new learner a clear starting point and group topics by function. [P1][P7]
- Basic: Teach enough to get by, including the interface, graphs, simple terminology, functions, hydraulics, and assignments. [P1]
- intermediate: Go deeper into settings and connected workflows. [P1]
- I hate my life: Provide comprehensive teaching within the available reference support. [P1]
- Keep a compact lesson panel beside the relevant recreated workspace, with Back, Next, and a visible step count. Begin simply, introduce controls gradually, and open the handbook when needed.
- Each lesson must open the relevant screen, highlight one control or concept, explain it with an example, demonstrate the action and result, let the learner practise in that same interface, and explain success or help correct mistakes before Next.
- Preserve guided practice and saved progress, with resume and restart options. Preserve existing progress where possible and explain any necessary migration. [P7]
- Provide a searchable handbook. Beginner explanations must cover a control’s purpose, when to use it, an example, common mistakes, and the expected result.
- Provide plain-language control explanations on hover, through a clickable help option, and through keyboard focus.
- Explain each setting’s software effect and supported implications for the simulated mechanism. Use reference-supported Rose Float examples involving hydraulics, electronics, sensors, motion, and timing. Do not present photographed settings as recommended operating values.
- Keep operation offline and simulation-only, with no real hardware commands. Clearly identify the trainer as independent and distinguish simulated behavior from verified PC•MACs behavior.
- Reuse useful existing teaching content and prototype code from available original Markdown, ZIP, documentation, and reference images. Confirm their actual availability rather than assuming attachment names establish repository access.
- Use the original training-app image labeled Screenshot 1 from the October 7, 10:09 AM feedback as the redesign feedback reference. Do not substitute a screenshot of One File. Its availability remains unverified in the supplied findings. [P7]
- Automated checks must not take focus or control the user’s keyboard or clipboard. Do not stage, commit, or push changes.

## These replace earlier decisions

- The original empty-repository and build-first-version instructions no longer apply. The application already exists and must be redesigned while preserving useful implementation and progress. [P7]
- The earlier draft’s requirement to confirm revision 2 before editing no longer applies; the user explicitly removed that prerequisite. Task numbering belongs to the application’s task workflow. [P2][P7]
- The documented choice to use a simplified PC•MACs-style workspace is no longer the UI target. The latest instruction requires consulting the manual, examining the actual application online, and using its actual interface as the basis for the trainer.

## Verified implementation facts

- src/renderer/ui/workspace.mjs: mountWorkspace constructs a custom ruler, analog pane, clickable digital blocks, Play/Stop controls, a command slider, and teaching readouts. It labels the workspace OffLine Editing Window and explicitly describes its eight-second block timeline as a teaching simplification. This is source evidence, not runtime appearance verification. — `[F4] src/renderer/ui/workspace.mjs:27-175`, `[F7] src/renderer/ui/workspace.mjs:175-198`
- docs/REFERENCE_FIDELITY.md says the ten photos obscure the main PC•MACs window, leaving ruler, grid, and trace fragments visible. It describes the workspace as based on manual descriptions and lists zoom, selection ranges, presets, drag-and-drop triggers, and many channels as unimplemented. These are documented explanations; the supplied inspection did not independently verify those claims against the manual and all photos. — `[F3] docs/REFERENCE_FIDELITY.md:10-18`, `[F3] docs/REFERENCE_FIDELITY.md:41-59`
- src/renderer/content/references.mjs catalogues ten photo filenames and includes transcribed Br-EFB main, feedback, and network menus plus photographed prompts. — `[F5] src/renderer/content/references.mjs:6-118`
- Photo 06 visibly shows the Terminal–COM3 title, Card field, Character delay selector, Clear Screen, Status, Config Done and Control buttons, a left text menu, and a right ASCII table. src/renderer/ui/terminal.mjs constructs those elements and uses registered main, feedback, and network snapshots. The comparison establishes recognizable structure in a still photo and source code, not an exact running visual or behavioral match. — `[F24] one-file-promot-float-lab/sources/Float-Lab-Handoff/reference-photos/06-1000066746.jpg (image)`, `[F8] src/renderer/ui/terminal.mjs:16-86`, `[F9] src/renderer/ui/terminal.mjs:110-157`
- src/renderer/ui/terminal.mjs uses decorative window-button spans, a read-only Card value of 1, disabled Character delay at None, and disabled Status. It adds clickable menu lines, help buttons, a three-character answer field, Send, and teaching messages. Main and feedback values come from snapshots; state changes the selected-axis label and arrow, while uptime is fixed at 0:00:19:41. src/renderer/styles.css specifies an 11.5 px terminal font, 1.32 line height, and 400 px minimum screen height. — `[F8] src/renderer/ui/terminal.mjs:16-67`, `[F8] src/renderer/ui/terminal.mjs:88-100`, `[F9] src/renderer/ui/terminal.mjs:101-123`, `[F16] src/renderer/styles.css:369-401`
- src/renderer/ui/workspace.mjs: update hides workspace sections absent from revealed. src/renderer/app.mjs: render obtains lessonRun.revealed(), controls timeline and terminal container visibility, and passes disclosure information to both renderers. The terminal toolbar requires term-toolbar. — `[F4] src/renderer/ui/workspace.mjs:136-142`, `[F20] src/renderer/app.mjs:619-649`, `[F9] src/renderer/ui/terminal.mjs:130-136`
- src/renderer/ui/lesson.mjs renders explanations, optional examples and demonstrations, practice or questions, feedback, and navigation. Next is disabled when canAdvance is false or a demonstration is running. — `[F10] src/renderer/ui/lesson.mjs:26-66`
- src/renderer/ui/lesson.mjs resolves step.photo against REFERENCE_IMAGES and conditionally displays See the reference photo. The open-photo handler in src/renderer/app.mjs stores the filename. src/renderer/ui/dialogs.mjs constructs the image from IMAGE_DIR and that filename, includes caption-based alternative text and descriptions, and warns that photographed values are historical observations rather than recommendations. — `[F10] src/renderer/ui/lesson.mjs:16-24`, `[F10] src/renderer/ui/lesson.mjs:68-72`, `[F19] src/renderer/app.mjs:507-509`, `[F15] src/renderer/ui/dialogs.mjs:24-43`
- src/renderer/content/lessons/intermediate.mjs assigns different disclosure sections to actual lessons: Frames and show time uses title, ruler, digital, and transport; Five identifiers that are not interchangeable uses title, analog, terminal, and term-toolbar; The GilderTerm toolbar uses terminal and term-toolbar. — `[F25] src/renderer/content/lessons/intermediate.mjs:10-14`, `[F28] src/renderer/content/lessons/intermediate.mjs:105-110`, `[F28] src/renderer/content/lessons/intermediate.mjs:162-167`
- src/renderer/content/lessons/comprehensive.mjs: What the references do not settle includes a practice step linking 07-1000066747.jpg and targeting photo-toggle. It asks the learner to find the Vel Limit column, but its validator checks only action?.type === 'open-photo'. Opening the image is verified by that predicate; identifying the column is not. — `[F31] src/renderer/content/lessons/comprehensive.mjs:127-168`

## Assumptions — not verified

- The inspected modules remain the relevant implementation entry points. Confirm with a focused read of the current files before editing; the supplied findings are not a guarantee that the files have remained unchanged.
- The existing application can support the redesign without replacing its framework. Confirm the current stack and constraints from package.json and the application entry points before recommending architectural changes.

## Open questions — resolve while implementing

- First verify: which PC•MACs version should the recreation represent, what the linked manual establishes, and which authoritative online application views establish its actual appearance and interactions? Neither the manual contents nor online application inspection is supplied here.
- First verify: are the original Markdown, ZIP contents, reference photos, and Screenshot 1 accessible to the implementer? Locate them through available project materials and supplied attachment links; report missing required sources before editing.
- Which differences between the existing workspace or terminal and the actual application are supported corrections, intentional teaching additions, or still unsupported? Determine this from the new reference comparison.
- What persistence format, lesson identifiers, and completion rules currently store progress, and what migration is necessary? These were not established by the supplied findings.
- Which build, packaging, and test commands are available, and which checks can run without desktop focus, keyboard, or clipboard control?
- How does the app currently render and behave at runtime? The findings establish code and still-image observations, not live appearance, successful progression, or persistence.

## Proposed approaches — suggestions, not requirements

- Create a concise reference mapping from each recreated screen and important interaction to a manual page, authoritative application view, or supplied photo. Update docs/REFERENCE_FIDELITY.md with supported behavior, deliberate training adaptations, and remaining gaps.
- Evolve src/renderer/ui/workspace.mjs, src/renderer/ui/terminal.mjs, and src/renderer/styles.css around the verified interface. Keep lesson explanations and help visually distinct from the recreated application controls.
- Reuse the existing disclosure and lesson-rendering connections. Introduce relevant windows and interactions progressively while preserving recognizable, reference-supported layouts.
- Connect demonstrations and practice to the same simulated controls and state. Review affected validation predicates so they check the action or result requested by the lesson.
- Preserve stable lesson identifiers and progress fields where feasible. If migration is needed, implement and document it explicitly instead of silently resetting existing learners.

## Must not change

- Offline, simulation-only operation and the prohibition on real hardware commands.
- The exact level names Basic, intermediate, and I hate my life.
- Existing learner progress must not be silently discarded.
- Original Markdown, ZIP materials, reference images, and background handoff documents must remain intact.
- Do not stage, commit, or push. Do not automate desktop focus changes, keyboard control, or clipboard access.

## Implementation guidance

- Begin with focused verification of the listed entry points, progress storage, and reference availability. Use the supplied findings to avoid repeating a broad repository investigation.
- Screenshot 1 is the training-app feedback reference associated with the overcrowded learning experience. The historical description is not a fresh visual inspection and is not evidence of the original PC•MACs interface. [P1][P2][P7]
- Use Photo 06 as a terminal appearance reference within the limits of the supplied still-image comparison. Photo 07 has a verified lesson link, but its visual contents were not independently established in these findings.
- Reference images should inform the interactive recreation; displaying them in the existing image dialog alone does not satisfy the requested interface change.
- Do not assume the terminal’s fixed values, disabled controls, answer-length limit, or CSS dimensions match the real application. Verify each relevant detail before retaining or changing it.
- Use existing project build and test commands once inspected. Prefer checks of meaningful behavior such as progression, persistence, migration, and offline operation.
- Report the implemented changes, validation actually performed, reference support, and remaining gaps. Distinguish source review from runtime verification.

## Acceptance criteria

- The linked manual and the actual application online have been examined, with the chosen version and usable evidence recorded. Unavailable required sources are reported before editing.
- Relevant PC•MACs screens are interactive recreations supported by the references. The change does more than rename or restyle the existing simplified timeline, and deviations are documented.
- Opening the app presents Basic, intermediate, and I hate my life exactly, with a clear starting lesson and saved-progress resume and restart options.
- Lessons use a compact adjacent panel with Back, Next, and a step count. They introduce one concept, demonstrate an action and result, allow practice in the same interface, and provide feedback before progression.
- Existing progress survives the update where feasible; any necessary migration is implemented, explained, and checked.
- Searchable handbook content and hover, clickable-help, and keyboard-focus explanations remain available and describe supported software and simulated mechanism effects.
- The app remains usable offline and issues no real hardware commands. Independent-trainer and simulation boundaries are clear.
- Available build and relevant behavioral checks pass without taking focus or controlling the user’s keyboard or clipboard.
- Original reference materials and background handoff documents remain unchanged, and nothing is staged, committed, or pushed.

## Runtime and visual checks

- Compare the running recreated workspace and terminal with the selected application version, manual figures, and Photo 06. Check layout, labels, control states, text readability, and resizing.
- From a fresh learner state, complete an introductory lesson through explanation, demonstration, practice, incorrect-action feedback, correction, and Next.
- Confirm each exact level name opens suitable content and that progressive disclosure keeps the current lesson understandable.
- Close and reopen the app to verify resume behavior. Check restart and any migration using disposable progress data rather than the user’s only saved progress.
- Check handbook search, hover help, clickable help, keyboard focus, and reference-photo captions and warnings.
- Verify the packaged app works without a network connection. Perform automated runtime checks headlessly or in an isolated process that cannot seize desktop focus or control the user’s keyboard or clipboard.

## Before you edit

This task was written from an inspection recorded at the time shown below. Verify the current checkout and re-read every referenced file and symbol before changing anything: line numbers and surrounding code may have moved.

## Provenance

- Project: Float Lab
- Original request: ok get the promot going
- Task prepared: October 7, 2026 at 9:27 PM (UTC-07:00)
- Inspection passes: 0
- Source freshness: not re-checked for this export; the task is based on the recorded inspection.
- Sources the findings rest on:
  - `README.md:1-137 sha256:309fd3c9eae3`
  - `package.json:1-28 sha256:276683624d8a`
  - `docs/REFERENCE_FIDELITY.md:1-79 sha256:dbf6baf5057b`
  - `src/renderer/ui/workspace.mjs:1-175 sha256:1a3b422e73d6`
  - `src/renderer/content/references.mjs:1-176 sha256:a40b6e20c6f4`
  - `src/renderer/app.mjs:1-150 sha256:872e30f935a4`
  - `src/renderer/ui/workspace.mjs:175-198 sha256:1a3b422e73d6`
  - `src/renderer/ui/terminal.mjs:1-100 sha256:9080a36c7291`
  - `src/renderer/ui/terminal.mjs:101-164 sha256:9080a36c7291`
  - `src/renderer/ui/lesson.mjs:1-87 sha256:c6be8af57bff`
  - `src/renderer/ui/dialogs.mjs:1-55 sha256:bad8196283e1`
  - `src/renderer/styles.css:360-429 sha256:e37fa2a5a693`
  - `src/renderer/app.mjs:500-511 sha256:872e30f935a4`
  - `src/renderer/app.mjs:606-649 sha256:872e30f935a4`
  - `src/renderer/content/lessons/steps.mjs:1-100 sha256:ca32b47bd5dc`
  - `src/renderer/content/lessons/intermediate.mjs:1-65 sha256:68587a150ce0`
  - `src/renderer/content/lessons/intermediate.mjs:105-200 sha256:68587a150ce0`
  - `src/renderer/content/lessons/comprehensive.mjs:110-180 sha256:32a8705c7a16`
