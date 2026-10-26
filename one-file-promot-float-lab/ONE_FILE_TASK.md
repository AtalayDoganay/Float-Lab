# Simplify the trainer and add a Rose Float mascot guide

<!-- one-file-revision -->
**One File task · revision 1** — prepared October 23, 2026 at 1:55 PM (UTC-07:00)

- Project: Float Lab · conversation “I want you to search the internet to get a...”
- First task revision in this conversation
- Feedback included: October 23, 2026 at 1:25 PM (UTC-07:00) — “I want you to search the internet to get an idea of how these training things us…”
- Feedback included: October 23, 2026 at 1:51 PM (UTC-07:00) — “Our mascot is gonna be the rose floats logo look up on intetn make it cuter anim…”
- Feedback included: October 23, 2026 at 1:53 PM (UTC-07:00) — “ok get eveything ready and give the promto to vs code”
- Evidence: saved findings only. The current code was not re-inspected for this revision; verify every referenced file before editing.
<!-- /one-file-revision -->

Implementation request: This document describes the requested work for this task revision. It is not a project overview, persistent memory, or a record of completed changes. Use repository documentation for project context and verify current code before editing. If requirements conflict, identify the conflict instead of silently choosing one.

## Outcome

Redesign the existing Roseflow PC Mac Training app so a beginner immediately understands where to start and what to do next. A small, cute anime-style character adapted from the Rose Float logo welcomes the learner before teaching begins and guides them through simple lessons and practice in the recreated PC•MACs interface.

## Scope

- Implement the redesign in the existing Float Lab repository, including source changes and finished local mascot assets.
- Research training-app design, find the intended Rose Float logo online, and use those references to inform the implementation.
- Simplify the learning experience while retaining teaching coverage, authentic PC•MACs practice, contextual help, and saved progress.
- Leave background handoff documents and original reference materials intact.

## Requirements

- Search the internet to understand how training apps usually work and use relevant findings to make this trainer very simple and easy to understand.
- Give the learner an obvious starting point and a clear next action. Reduce the amount of information and the number of controls presented at once.
- Before teaching begins, introduce the small mascot through a brief welcome, pop-up, or equivalent guided introduction.
- Look up the Rose Float logo, adapt it into a cuter anime-style character, and actually use the resulting character as the app’s mascot.
- Have the mascot teach and guide the learner throughout the experience. Freddy in FNAF is a reference for the idea of a small character guide.
- Keep the recreated PC•MACs workspace central to practical learning. Consult https://gilderfluke.com/wp-content/uploads/2019/12/PCMACs_Manual.pdf and actual PC•MACs application references online; reproduce reference-supported layout, controls, terminology, and behavior without claiming an unsupported identical match.
- Retain a clear starting point, topics grouped by function, compact lesson guidance alongside the relevant workspace, Back and Next controls, and a visible step count. Introduce controls gradually and open the handbook when needed.
- For each lesson, show the relevant recreated PC•MACs/Gilderfluke screen, highlight one thing, explain it with an example, demonstrate the action and result, and let the learner practise in that interface. Explain the outcome or help correct mistakes before advancing.
- Keep the learning levels named exactly “Basic,” “intermediate,” and “I hate my life,” available at the start of learning. Basic covers enough to get by, including the interface, graphs, simple terms, functions, hydraulics, and assignments; intermediate goes deeper; I hate my life provides comprehensive teaching.
- Preserve guided practice and saved progress, with resume and restart options. Preserve existing progress where possible and explain any necessary migration. Restarting learning requires confirmation.
- Retain the searchable handbook and plain-language control explanations accessible through hover, clickable help, and keyboard focus. Keep explanations of purpose, when to use a control, examples, common mistakes, and expected results.
- Keep reference-supported explanations of software effects and possible implications for the connected mechanism, using relevant Rose Float examples without inventing hardware behavior.
- Keep the Windows app independent, offline, and simulation-only, with no real hardware commands. Bundle the mascot assets locally.
- Use the original training-app screenshot from the October 7, 10:09 AM feedback when available as a visual reference. Do not substitute a screenshot of One File.
- Notify the user before editing if required source materials are missing, identifying the missing materials precisely.
- Automated checks must not take focus or control the user’s keyboard or clipboard.
- Do not stage, commit, or push changes.

## These replace earlier decisions

- The original empty-repository build instructions no longer apply. This task redesigns the existing application.
- The initially unspecified mascot is now specifically a cute anime-style character adapted from the Rose Float logo. The Freddy reference remains an example of the guide’s role.

## Assumptions — not verified

- The existing Electron application can support this redesign without replacing its framework. This is based on saved project memory, not a current source inspection; confirm the current package configuration and renderer architecture before choosing an implementation.

## Open questions — resolve while implementing

- First verify the current startup flow, lesson rendering, workspace disclosure, demonstration behavior, progress persistence, and available test commands. No current inspection findings or runtime results were supplied for this prompt.
- Identify the intended Rose Float logo using authoritative team or program sources. Its exact image, source URL, and available local assets were not supplied; resolve any material ambiguity before creating the character.
- Locate the original October 7 training-app screenshot and any required teaching/reference originals. No screenshot attachment label, image path, or visible screenshot contents were supplied here, so their appearance cannot be described or treated as verified.
- Check whether the existing app already implements looping demonstrations or parts of the proposed simplified flow. Saved memory does not establish their implementation status.
- Verify that the required PC•MACs references are accessible and distinguish supported behavior from adaptations. The team laptop’s exact PC•MACs build is unknown in the supplied context.

## Proposed approaches — suggestions, not requirements

- Use a short mascot welcome followed by clear start or resume choices and the existing learning levels. Keep topic browsing and reference material available without making the opening screen crowded.
- Consider presenting explanation, demonstration, practice, and feedback as separate focused views within a lesson. The user suggested changing pages as one possible simplification; separate routes or a page for every action are not mandatory.
- Reuse the existing simulated workspace and reveal the relevant controls for the current step. Keep the lesson guidance brief, with deeper explanations available on demand.
- Create a small anime or chibi interpretation that retains recognizable features of the verified Rose Float logo. Integrate finished artwork rather than leaving a placeholder or an image-generation prompt.
- Keep mascot dialogue in accessible interface text, with artwork beside it. Use restrained expressions or animation only when useful, respect reduced motion, and avoid covering the controls being taught.

## Must not change

- The product name “Roseflow PC Mac Training,” its independent identity, and its offline, simulation-only boundary.
- Existing teaching coverage, original question records, valid answers, and wrong-answer explanations. Simplifying presentation must not silently delete learning material.
- Existing learner progress and completion semantics, except for an explicitly necessary, documented migration that preserves valid progress.
- Existing Electron isolation, sandboxing, validated IPC, navigation restrictions, and external-link allowlisting.
- Background handoff documents, original references, and staged originals under one-file-promot-float-lab/.

## Implementation guidance

- Saved project memory was last checked October 23, 2026 at 1:16 PM (UTC-07:00), but the code was not re-verified for this prompt. Treat the following paths as investigation leads, not proof of current behavior.
- Start with package.json and src/renderer/app.mjs. Saved memory identifies renderer coordination and imports of content/levels.mjs, logic/lesson-flow.mjs, and the home, level, and lesson UI modules. References: package.json:1–28 [F7]; src/renderer/app.mjs:1–200 [F8]. Inspect the actual rendering and event handlers before changing the flow.
- Documentation identifies the recreated workspace modules under src/renderer/ui/, including pcmacs.mjs, edit-view.mjs, control-window.mjs, soft-console.mjs, terminal.mjs, and float-panel.mjs. Confirm current ownership in source. Reference: README.md:1–165 [F1].
- Inspect src/shared/progress-schema.mjs and the current progress-storage implementation before changing persistence. Saved source observations describe schema 3; do not revert to an older documented schema. Reference: src/shared/progress-schema.mjs:1–200 [F13].
- The looping-demo document is historical design evidence, not proof of implementation or a requirement to add a new playback subsystem. Reference: docs/superpowers/specs/2026-10-11-looping-demo-videos-design.md:1–189 [F2].
- Keep online research focused. Record the sources used for training-design decisions, the logo, and PC•MACs fidelity. Separate screenshot appearance, documented behavior, source observations, and runtime verification.
- Use the repository’s existing checks after inspecting their commands. Saved memory identifies scripts/smoke.mjs and src/main/smoke-runner.mjs as automation leads, but no current execution results are available. References: scripts/smoke.mjs:1–103 [F10]; src/main/smoke-runner.mjs:1–170 [F12].
- Finish with a concise account of implemented changes, research and asset sources, checks actually run, and any remaining reference or platform limitations.

## Acceptance criteria

- A first-time learner encounters the mascot before lesson teaching and can identify where to start without navigating a crowded workspace.
- The finished mascot is visibly based on the verified Rose Float logo, has the requested cute anime-style treatment, and appears in the implemented app.
- Each learning step has a clear focus and next action; unrelated controls and lengthy reference text do not overwhelm it.
- The exact level names, Back and Next controls, visible step count, contextual help, and searchable handbook remain available.
- A representative lesson explains, demonstrates, accepts practice in the recreated interface, and gives useful success or correction feedback before advancement.
- Existing progress loads and resumes correctly; restart remains deliberate, and any necessary migration is explained and verified.
- The app and mascot function offline, preserve the simulation boundary, and introduce no dependency on a remote mascot or teaching service.
- Relevant tests and smoke checks pass, or concrete failures and unperformed checks are reported accurately.
- Background materials remain intact, and nothing is staged, committed, or pushed.

## Runtime and visual checks

- Walk through a fresh launch and a returning learner’s launch. Confirm the welcome is brief, the starting action is obvious, and resuming does not force repetition of completed instruction.
- Complete a representative lesson with both correct and incorrect actions. Check highlighting, demonstration, feedback, navigation, and progress after closing and reopening the app.
- Inspect the mascot against the sourced logo and inspect the redesigned app against any supplied training-app screenshot, using its actual attachment label. Confirm the mascot and guidance do not obscure workspace controls.
- Check keyboard navigation, focused help, reduced motion, readable text, and layout at supported window sizes.
- Verify offline asset loading in the development app and an available packaged Windows build. Run automated checks without taking focus or manipulating the user’s keyboard or clipboard.

## Before you edit

This task was written from an inspection recorded at the time shown below. Verify the current checkout and re-read every referenced file and symbol before changing anything: line numbers and surrounding code may have moved.

## Provenance

- Project: Float Lab
- Original request: ok get eveything ready and give the promto to vs code
- Task prepared: October 23, 2026 at 1:55 PM (UTC-07:00)
- Inspection passes: 0
- Source freshness: not re-checked for this export; the task is based on the recorded inspection.
