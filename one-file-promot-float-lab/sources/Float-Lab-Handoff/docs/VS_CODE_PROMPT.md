# Prompt for the coding agent in VS Code

Continue Float Lab, my PC•MACs / Rose Float learning app. I am Atalay, a Cal Poly Pomona Rose Float team member learning the controller software and hardware concepts. Turn the included browser prototype into a real downloadable Windows desktop application, with a GitHub-ready repository and a Windows release artifact. Work on the implementation, not another proposal or a marketing website.

First read `docs/FLOAT_LAB_PROJECT_CONTEXT.md`, `README.md`, and the existing files under `app/`. Inspect the reference photos when relevant. Follow any applicable repository instructions. Preserve existing working lessons and interactions. Do not assume you can access my previous chats or my One File app source.

The One File app is my separate project-context/chat workspace. Store this project’s knowledge there only through its supported user-controlled workflow; do not merge Float Lab into One File’s source, change One File’s security model, manufacture a ChatGPT export, or claim any import happened without verifying it. This task is to build Float Lab in its own repository.

My learning requirement: walk me through each topic slowly. Explain it in everyday English, show a visual example, let me change something, ask a question, and explain why my answer is right or wrong. Do not dump long paragraphs on me or assume electrical-engineering knowledge. Use the terms in my actual screenshots so I can connect the app to the workshop.

Implementation direction:
1. Inspect the workspace and reuse a suitable existing desktop stack if one is already established. For a new repository, the proposed starting point is an Electron desktop shell around the included local HTML/CSS/JS, using Electron Forge for packaging. Verify current official documentation and compatible dependency versions, pin a lockfile, and avoid a rewrite merely to change frameworks. Windows is the first target; do not add mobile or cloud infrastructure to this milestone.
2. Package all lessons and reference assets locally. Learning and simulation must work offline and must not depend on the private hosted prototype, a paid API, ChatGPT login, or a running web server. External source links may open in the system browser on explicit user action.
3. Use an isolated, sandboxed renderer with Node integration disabled. Expose only narrowly scoped preload/IPC methods if needed. Do not load arbitrary remote pages inside the privileged application. Restrict navigation, window creation, and external URLs; do not shell-open arbitrary schemes or local paths. Follow the official Electron security guidance.
4. Preserve the ten existing lessons and twenty questions as a baseline. Move curriculum into a clearly structured content module with stable lesson/question IDs. Keep original screenshots available for inspection. Preserve attributions and distinguish observed screenshot settings from examples and suggested settings.
5. Improve the walkthrough into clear Learn → Try → Answer steps, with a way to revisit the explanation. Wrong answers should explain the misconception and offer a retry or simpler explanation. After a correct answer, ask a nearby application question where useful. This is deterministic teaching logic for the first version, not a claimed AI tutor.
6. Save current lesson, completed steps, and review topics locally across restarts. Provide Resume and Restart learning; restarting needs an explicit confirmation. Explain where progress is stored and never send it elsewhere. Avoid accounts and remote databases.
7. Preserve or improve keyboard access, readable text, scaling, contrast, and layout on common laptop sizes. Clear timers when leaving lessons. Respect reduced-motion settings without removing the information needed to learn.
8. Add a development command and a reproducible Windows packaging command. Provide a Windows GitHub Actions workflow that can produce build artifacts without publishing automatically. Produce a local installer on a compatible Windows environment when available. A download of source code is not the same as an installer; name each artifact accurately. Do not claim signing or a successful Windows run if neither occurred. Do not publish a public repository or release containing the workshop photos without the owner’s choice of audience.

Curriculum accuracy:
- Explain show/timeline versus controller configuration, card versus axis versus DMX channel, and COM port versus IP address.
- Explain ON/OFF and variable commands, 8-bit values 0–255, percentages, calibrated ranges, target versus measured position, feedback and sensor concepts, and basic P/I/D ideas.
- Explain the photographed Br-EFB main, feedback, and network menu labels. Identify photographed firmware version 1.98 / copyright 2022 separately from the older manufacturer manual. Never invent exact units or algorithms for a field whose firmware behavior has not been verified.
- Velocity Limit is specifically unresolved: research the matching controller/firmware before teaching its exact behavior. Do not equate it to a target slew rate or cm/s based only on its name. Do not prescribe PID values, wiring, endpoint settings, output reversal, or live test commands from these photos.
- A simplified simulation must be labeled as such. The existing feedback animation is not a physical plant or PID model. A later PID simulation must explicitly state its model assumptions and display target, measured position, and error.
- No live serial, USB, DMX, Ethernet hardware commands in this educational milestone.

Verification and completion:
- Exercise the actual rendered flow: complete lessons, choose wrong then right answers, revisit, skip and return, finish the course, and review mistakes. Check timeline play/stop and leaving an active animation.
- Verify progress survives a restart, resetting works, malformed saved state recovers, and all photos load offline.
- Verify the desktop window opens local content, external links obey the policy, and the packaging output includes the required assets.
- Run on Windows or Windows CI when available. Clearly separate source checks, packaging success, and an actually tested installed app. If the environment cannot build Windows artifacts, leave a ready-to-run Windows workflow and report the precise remaining step.
- Update README with plain instructions to develop, build, install, and locate release artifacts. Keep `docs/FLOAT_LAB_PROJECT_CONTEXT.md` current with decisions, verified facts, unresolved items, and test evidence.

Begin by inspecting the supplied project and then implement the first desktop milestone. Ask me only for a choice that materially blocks the work. Do not claim a GitHub repository, release, One File import, or desktop build exists unless you actually created and verified it.
