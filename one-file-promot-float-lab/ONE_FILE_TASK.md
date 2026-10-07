# Build the first Windows version of Roseflow PC Mac Training

<!-- one-file-revision -->
**One File task · revision 1** — prepared October 6, 2026 at 3:56 PM (UTC-07:00)

- Project: Float Lab · conversation “My project repository is currently empty....”
- First task revision in this conversation
- Feedback included: October 6, 2026 at 3:41 PM (UTC-07:00) — “My project repository is currently empty. The Markdown and ZIP already attached…”
- Evidence: an inspection of 5 pass(es) recorded in One File. Verify the current checkout before editing.
<!-- /one-file-revision -->

Implementation request: This document describes the requested work for this task revision. It is not a project overview, persistent memory, or a record of completed changes. Use repository documentation for project context and verify current code before editing. If requirements conflict, identify the conflict instead of silently choosing one.

## Outcome

Create an independent Windows training app centered on a familiar, reference-supported PC•MACs-style workspace. Learners can explore controls, get plain-language help, search an offline handbook, complete guided practice, and see clearly labeled simulated results. Progress survives closing the app, with Resume and Restart controls. Build from the supplied prototype in the user’s empty repository.

## Scope

- Create the application, local content and assets, progress storage, Windows packaging, development documentation, and focused verification.
- Reuse useful prototype lessons, questions, demonstrations, and images while integrating them into the required workspace-centered experience.
- Treat the repository as empty, as the user states. The attachments are starting materials, not files already installed in the repository. Do not repeat repository investigation to rediscover the project.
- Exclude real hardware communication, equipment-specific simulation without supporting evidence, and automatic public publication.
- Inspect original references before claiming interface fidelity. Missing PC•MACs screens can block faithful reproduction of those screens without blocking the offline application foundation.

## Requirements

- Use the product name Roseflow PC Mac Training and clearly identify it as an independent training app.
- Closely recreate the PC•MACs interface and workflow using reference-supported layout, controls, terminology, and behavior. Keep the familiar workspace central and uncluttered. Identify missing evidence and distinguish simulations from verified PC•MACs behavior.
- Explain every implemented training control in plain language through hover, keyboard focus, and an explicit clickable help option. Explain its software effect and possible implications for a connected mechanism where supported.
- Include a searchable handbook similar in purpose to One File’s. Beginner walkthroughs must explain each control’s purpose, when to use it, an example, common mistakes, and the expected result.
- Provide guided practice that highlights the next control, explains why it matters, lets the learner try it, and shows simulated results. Preserve useful existing questions, answer-specific explanations, lessons, and simulations.
- Use short explanations and define terms before relying on them. Put longer explanations in contextual help and the handbook. Include reference-supported Rose Float examples involving electronics, sensors, hydraulics, motion, and timing.
- Keep the initial version offline and simulation-only. Do not send commands to real hardware or require a cloud service for installed learning.
- Save learning progress locally and provide Resume learning and Restart learning controls. Keep this storage independent of One File.
- Do not invent device-specific behavior, sensor identities, hydraulic settings, wiring, or firmware details. Label unknowns and explain what evidence would establish them.
- Make the source materials and reference images accessible to the VS Code assistant through actual staged files and working local references, not attachment names alone. Verify availability before relying on them.

## These replace earlier decisions

- Float Lab is the earlier product name; Roseflow PC Mac Training replaces it. Float Lab remains the project workspace name. This identity correction is also recorded in [P1].
- The handoff’s description of Windows as merely a proposed target no longer applies: the user explicitly requires a downloadable Windows app.
- The prototype’s lesson-dashboard layout is a starting point, not the final product direction. The current requirement puts the PC•MACs-style workspace and integrated teaching at the center.

## Verified implementation facts

- In the attached baseline, app/app.js defines Q and lessons with ten lesson records and two questions per lesson. Records include teaching text, simpler explanations, takeaways, demo identifiers, answer keys, and explanations for incorrect choices. — `File 2, Float-Lab-Handoff/app/app.js:3–15`
- In attached app/app.js, the runtime state declaration includes index, qi, answered, timer, complete, and missed. nav renders lesson navigation and completion counts. These are observations of the supplied source excerpt, not an installed application. — `File 2, Float-Lab-Handoff/app/app.js:16–18`
- In attached app/app.js, openLesson validates the lesson index, clears the current timer, and resets qi to zero. renderQuestion resets answered to false and disables advancement. answer permits retries after mistakes, records missed topics, and enables advancement after a correct answer. — `File 2, Float-Lab-Handoff/app/app.js:19–22`
- In attached app/app.js, the next-button handler advances questions, marks a lesson complete after its final answered question is advanced, and creates a checkpoint identifying unfinished lessons and topics needing review. — `File 2, Float-Lab-Handoff/app/app.js:23–24`
- In attached app/app.js, renderDemo creates templates for component roles, signals, command values, calibration, axis mapping, feedback, timing, networking, menu explanations, and a troubleshooting challenge. The timeline template starts with blocks 2 and 3 enabled; calibration offers 10, 20, and 40 cm example endpoints; the network template labels its laptop choices hypothetical. — `File 2, Float-Lab-Handoff/app/app.js:25–36`
- Attached app/style.css defines navy/lime styling, sidebar and panel layouts, responsive breakpoints, focus-visible outlines, and reduced-motion rules. This establishes source styling, not a visually inspected render or PC•MACs fidelity. — `File 2, Float-Lab-Handoff/app/style.css, selectors :root, .layout, .workspace, :focus-visible, and @media; supplied source has no numbered lines`

## Assumptions — not verified

- The implementation plan assumes the original Markdown and complete ZIP can accompany the task. Their availability to VS Code is not confirmed. Confirm by opening the actual files, extracting the archive, and loading its images in that environment.
- Interpret “handbook similar to One File’s” as an integrated searchable reference with beginner walkthroughs. Exact visual parity is unspecified and would require a separate reference if desired.

## Open questions — resolve while implementing

- First verify source delivery: where can VS Code read File 1 and the complete File 2 archive? A task Markdown file or attachment label alone does not establish availability. If an original is missing, identify the exact missing item and arrange staging while continuing independent scaffolding.
- Before porting, read the complete extracted app/app.js, app/index.html, README.md, docs/VS_CODE_PROMPT.md, and docs/lessons.json. The current supplied excerpts omit app.js lines 37–50 and several documents; their exact contents must not be reconstructed from historical summaries.
- Which PC•MACs version and workspace do the original images actually establish? If they show only controller terminal menus, obtain a readable full-window reference, relevant menu/dialog states, and the offline select/edit/play/stop workflow before certifying reproduction of the main workspace.
- Which Windows architecture and packaging target should the first artifact support, and is a Windows environment available for a packaged-app smoke test? Document the choice and any unperformed validation.
- What distribution audience is authorized for workshop images and team materials? Prepare a buildable project and artifact workflow without assuming permission for public release or choosing a public license for those materials.

## Proposed approaches — suggestions, not requirements

- Recommended framework: Electron with Electron Forge, retaining vanilla HTML/CSS/JavaScript where useful. This allows substantial reuse of the prototype, bundles offline assets, and supports desktop-owned local storage and Windows packaging. Its tradeoff is a larger application footprint. This is a recommendation, not a previously approved framework decision. Verify current official documentation and supported versions, then pin dependencies in a lockfile.
- Proposed first version: one coherent training workspace with channel selection, a simplified eight-second timeline, command/measurement displays, contextual help, a handbook, and guided exercises. Use original references to determine the actual layout. Clearly label teaching simplifications; do not present the eight-block exercise as an exact PC•MACs editor. The earlier one-workspace/one-exercise suggestion was not an accepted scope limit [P2].
- Separate curriculum, simulated state, guided-step validation, rendering, and persistence. Give lessons, questions, controls, and guided steps stable identifiers. Preserve all ten useful lesson topics and twenty question records, reconciling app.js with docs/lessons.json before selecting an authoritative runtime dataset.
- Use shared teaching records for control help and handbook entries. Search titles, body text, and useful aliases such as mask/netmask, PC Mac/PC•MACs, and channel/DMX. Show matching excerpts, empty-query guidance, and no-results feedback. Opening help or a result should preserve practice state. Link entries to related controls, lessons, and locally available reference images.
- Proposed exercise — Schedule a light: select a simulated digital channel, enable only blocks 2 and 3 in an eight-second sequence, and play it. Explain the intervals 2–3 and 3–4 seconds. Validate the learner’s action, explain mistakes, permit retries, and support stopping playback.
- Proposed exercise — Read a command: select an axis from the documented photo-mapping example, identify its displayed channel, and set command 128. Explain approximately 50.2% of the 8-bit range and compare the requested value with a separately labeled simulated measurement. Do not infer actual travel.
- Proposed exercise — Understand an address: compare 192.168.0.20, 192.168.1.20, and 192.168.0.10 against the historical controller example 192.168.0.10/24. Explain same-subnet, different-subnet, and duplicate-address cases. Perform no scanning, pinging, or computer network changes.
- Implement guided steps with a highlighted target, a short explanation, action validation, specific feedback, and Back/retry/repeat-explanation controls. Count completed actions and answered questions rather than visited screens. Preserve the existing one-question-at-a-time learning loop.
- Recommended persistence design: a versioned local progress document in the desktop app’s user-data directory, validated on load and written atomically after meaningful changes. Store current location, completed lessons and guided steps, missed topics, necessary answer state, and meaningful exercise settings. Restore animations paused. Account for openLesson and renderQuestion resetting state when adapting the prototype. Keep exercise reset separate from confirmed course restart, preserve recoverable data, and report save failures visibly.
- For Electron, disable renderer Node integration and enable context isolation and sandboxing. Expose only narrow, validated IPC needed by the app. Restrict navigation and new windows; allow approved source links to open in the system browser. Bundle learning dependencies locally. Provide development and packaging commands and a Windows GitHub Actions artifact workflow without automatic publication.

## Must not change

- Keep the supplied originals and background handoff documents intact, including FLOAT_LAB_PROJECT_CONTEXT.md and the archive’s docs/FLOAT_LAB_PROJECT_CONTEXT.md and docs/VS_CODE_PROMPT.md. Edit application source and create current setup/build documentation separately.
- Preserve the separation between observed historical settings, hypothetical teaching examples, and verified software behavior. Do not turn photographed values into recommended equipment settings.
- Keep learning progress independent of One File. Do not modify One File or make it the training app’s runtime backend.
- Maintain simulation-only operation: no serial, USB, DMX, controller Ethernet, discovery, live connection controls, or hardware-control libraries.

## Implementation guidance

- The prompt text is ready to review and save into the application’s ONE_FILE_TASK.md package. Original-file transfer remains unverified; saving task text alone does not establish that the ZIP and images reached VS Code.
- Source handoff: make File 1, FLOAT_LAB_PROJECT_CONTEXT.md, and File 2, Float-Lab-Handoff.zip, available as actual readable files alongside the task or in another documented local location. Use application-provided relative links to selected originals; do not invent attachment or image paths. Record verified local source locations in the new setup documentation. If the package does not include the ZIP, arrange delivery of the original archive before claiming source reuse is ready.
- The archive inventory identifies Float-Lab-Handoff/app/index.html, app/style.css, app/app.js, app/controller.jpg, app/feedback.jpg, app/network.jpg, app/workshop.jpg, README.md, .gitignore, docs/FLOAT_LAB_PROJECT_CONTEXT.md, docs/VS_CODE_PROMPT.md, and docs/lessons.json. Read the complete files after extraction; the supplied attachment excerpts are not the entire source bundle.
- Original visual-reference labels in File 2 are Float-Lab-Handoff/reference-photos/01-1000066743.jpg, 02-1000066740.jpg, 03-1000066744.jpg, 04-1000066739.jpg, 05-1000066745.jpg, 06-1000066746.jpg, 07-1000066747.jpg, 08-1000066748.jpg, 09-1000066749.jpg, and 10-1000066750.jpg. These ten originals and the four app JPGs were listed, not visually inspected in this preparation. Inspect their pixels before using them as visual evidence. File 1 documents reported subjects and settings; that documentation is separate from visual inspection and runtime verification.
- Preserve accuracy boundaries: 0–255 represents 256 values, and normalized percentage is value / 255 × 100. Values have no inherent centimeters, volts, or ohms. The 0–10, 0–20, and 0–40 cm calibration ranges are hypothetical linear examples. The existing approach-to-target animation is an educational model, not a validated Br-EFB, hydraulic, or PID simulator; inspect its complete handler before porting it.
- Keep COM-port labels, card addresses, axes, DMX channels, and IP addresses distinct. File 1 documents historical zero-based mapping 6→0, 7→1, 8→2, and 9→3, plus controller IP 192.168.0.10, netmask 255.255.255.0, and gateway 192.168.0.1. Confirm against originals before presenting these as image observations. The hypothetical laptop address is not a discovered setting; subnet agreement does not establish reachability or a working gateway.
- Leave Velocity Limit units/algorithms, firmware-specific PID behavior, startup special values, override release, sensor identity, travel, and wiring explicitly unresolved. Their absence does not block generic teaching exercises. Firmware-matched documentation is needed before implementing equipment-specific behavior. Do not mistake the controller’s terminal configuration interface for the complete PC•MACs application.
- The handoff links manufacturer manuals rather than bundling them: https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf and https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf. Record edition, page/section, URL, and verification status for claims drawn from them. Earlier indexed excerpts are not a complete manual review, and installed lessons must not depend on downloading manuals.
- Use current official Electron security and sandbox documentation and Electron Forge setup/Windows-maker documentation when implementing the recommended stack. Do not infer current package versions from the historical handoff.
- Use focused behavioral tests for persistence recovery, question advancement, guided-step validation, timeline boundaries, and any privileged IPC. Source checks and successful packaging do not replace interaction testing. Report precisely whether the deliverable is source, a CI artifact, an installer, or a tested installed application.

## Acceptance criteria

- The repository contains a buildable Windows project, dependency lockfile, documented development/package commands, and an artifact workflow. The source handoff identifies readable originals and all required images through verified local paths.
- The app displays Roseflow PC Mac Training and clear independent-trainer/simulation identification. Its workspace is central. Reproduced elements have reference support; unresolved fidelity gaps are explicitly recorded and are not reported as completed exact reproduction.
- Every implemented training control has equivalent help through hover, keyboard focus, and clicking. Longer help is keyboard accessible and dismissible, and opening help or the handbook preserves practice state.
- The offline handbook covers the existing curriculum and provides useful searchable explanations, examples, mistakes, expected results, and supported mechanism implications.
- Guided practice highlights the next control, explains it, validates the attempted action, provides specific correction and retry, and records completion accurately. Under the recommended exercise plan, all three proposed exercises work end to end.
- The ten prototype lesson topics and twenty question records are retained or equivalently integrated, with valid answer keys and wrong-answer explanations. Wrong-then-right answers, revisiting, skipping and returning, completion, and missed-topic review work.
- Simulations preserve the distinction between commands and measurements. Under the recommended exercise plan, blocks 2 and 3 cover seconds 2–4, command 128 displays approximately 50.2%, and the three network examples produce the intended explanations.
- Progress survives a real application restart. Resume restores the correct learning location and relevant settings with playback paused. Confirmed Restart resets progress predictably; malformed data and failed writes do not crash the app or falsely mark work complete.
- Installed lessons, handbook search, help, simulations, progress, and required images work with runtime network access disabled. No hardware communication is attempted.
- The packaged artifact includes required assets, follows the chosen desktop security model, and is identified accurately. Unperformed Windows or runtime checks remain explicitly unverified.

## Runtime and visual checks

- Run the packaged app on Windows with network access disabled. Visit every lesson, open its images, search the handbook, and complete the implemented guided exercises.
- Compare implemented workspace elements with the inspected original references at the same relevant states. Record which elements are observed, simplified, or still unverified.
- Use mouse and keyboard to open and dismiss help, follow guided highlights, navigate search results, and return to practice. Check visible focus, readable scaling, uncluttered layout, and reduced-motion behavior.
- Make incorrect answers and exercise changes, retry successfully, skip lessons, return, and finish. Confirm progress reflects completed work and review includes missed topics.
- Close and reopen during partial progress and active animation. Verify correct Resume state with playback paused, course restart confirmation, and a separate exercise reset.
- Exercise malformed/incompatible saved data and a controlled save failure. Verify a clear recovery path and no silent completion or data-loss claim.
- Start and stop the timeline and feedback demonstrations repeatedly, then leave their screens. Check interval boundaries and timer cleanup. Verify approved external links open outside the app and unsupported navigation remains blocked.

## Before you edit

This task was written from an inspection recorded at the time shown below. Verify the current checkout and re-read every referenced file and symbol before changing anything: line numbers and surrounding code may have moved.

## Provenance

- Project: Float Lab
- Original request: My project repository is currently empty. The Markdown and ZIP already attached are the starting material for building the app, not files already installed in my repository.  Use those attachments, our agreed requirements, and the corrected project reference to prepare the first implementation task for Roseflow PC Mac Training.  First explain the proposed first version in plain language, then prepare the task for my VS Code assistant to build it in the empty repository. Preserve our required PC•MACs-style workspace, contextual teaching, searchable handbook, guided practice, offline simulation-only operation, and saved progress with resume/restart. No real hardware commands.  Recommend a suitable framework and explain that choice; don’t describe an unconfirmed choice as something I already approved. Identify any missing references that actually block implementation, and clearly label simulated or unverified behavior.  Reuse the useful prototype code and teaching content from the ZIP. Ensure the handoff identifies and makes available the source materials and reference images the VS Code assistant needs—not just attachment names it cannot access.  Don’t inspect an empty repository to learn the project again. Prepare the task for review and tell me clearly when it is ready to save into the project’s ONE_FILE_TASK.md package.
- Task prepared: October 6, 2026 at 3:56 PM (UTC-07:00)
- Inspection passes: 5
- Source freshness: source versions were revalidated during the recorded inspection.
- Material unverified points:
  - [Partial] Application workflow: are the task and original source assets confirmed available to the VS Code assistant?

<!-- one-file-files -->
## Attached files

The conversation this task was prepared from included these attached files. Their text was given to the assistant that wrote this task. **The original files are not included in this package**: if the work depends on details not written above, ask the user for them.

- File 1 · FLOAT_LAB_PROJECT_CONTEXT.md · Markdown · 29.8 KB · SHA-256 9803636390fe17ba… · 574 lines, 30,350 characters, 3 sections
- File 2 · Float-Lab-Handoff.zip · ZIP archive · 6 MB · SHA-256 2f6b37c7574ac63a… · 22 files · 8 documents read, 14 listed only
<!-- /one-file-files -->
