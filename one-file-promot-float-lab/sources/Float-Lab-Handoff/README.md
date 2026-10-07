# Float Lab — desktop development handoff

A guided learning app for PC•MACs and the Br-EFB controller concepts used in CPP Rose Float work.

## Start here

1. Extract this ZIP into its own project folder.
2. To try the existing browser prototype, open `app/index.html` in a browser. It uses local files and requires no dependency installation. It is not a Windows installer.
3. Open the extracted project folder in VS Code.
4. Give your coding agent the entire contents of `docs/VS_CODE_PROMPT.md`.
5. Use `docs/FLOAT_LAB_PROJECT_CONTEXT.md` as the project knowledge file in One File through the app’s supported file-sharing/context workflow. This Markdown file is not a native ChatGPT conversation export. If that workflow does not accept Markdown, paste its text into the project conversation; do not use a ZIP/JSON chat-import button for this source archive unless the importer explicitly supports this format.

## Contents

- `app/`: exact static prototype source and four in-app reference images.
- `reference-photos/`: all ten original attached JPGs, with their attachment order retained.
- `docs/FLOAT_LAB_PROJECT_CONTEXT.md`: consolidated project history, requirements, observed controller values, limitations, and the entire current lesson/question curriculum.
- `docs/VS_CODE_PROMPT.md`: implementation instructions for the next coding session.
- `docs/lessons.json`: a structured snapshot of the curriculum for migration. The prototype currently uses the inline array in `app/app.js`; this JSON is an export, not a second live data source.

## Current state

The browser prototype has ten lessons, twenty questions, answer-specific feedback, interactive command/calibration examples, a feedback model, an editable eight-second timeline, network examples, and photo references. Progress is only in memory; refreshing loses it. The included source was syntax-checked and curriculum/asset references were validated. No interactive browser or Windows desktop test has been performed for this handoff.

The hosted preview at https://float-lab.ok-frog.chatgpt.site was successfully published privately on October 5, 2026 (Pacific). The local copy does not need that URL.

No Electron shell, Windows installer, public GitHub repository, release workflow, signing certificate, or native One File import is included or claimed. Those are the next milestone described by the prompt.

## Repository preparation

The archive intentionally excludes the hosted Site’s `.git`, hosting identity, credentials, and internal deployment files. Start a new repository for the desktop project; no GitHub URL has been reserved. Suggested name: `Float-Lab`.

Workshop photos are supplied by the project owner and may contain other people and team equipment. Keep them in a private development repository until the owner chooses what may be distributed. No open-source license is asserted for the photos or manufacturer documentation. Manufacturer manuals are linked, not bundled.
