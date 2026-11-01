# The first digital segment: what it does, what it rests on, what is open

Built October 31, 2026 from the Revision 4 brief
(`docs/brief/2026-10-31-revision-4/Rose_Float_Training_Brief.md`). This is
the review build Atalay asked for. It stops at the review boundary: nothing
beyond the first segment is written, and the three decisions the brief left
open are labelled in the app rather than decided.

## What the app does now

| Part | Behaviour |
| --- | --- |
| Orientation film | Plays once on every fresh launch (`src/renderer/content/intro.mjs`, `ui/intro.mjs`): eight beats, about a minute, the narration lines of brief §13 verbatim, the archive photos H–L in year order with year, title, award and credit. **Skip>>** is on screen from the first frame and stops the film and its sound at once. Pause / Resume, captions, a sound-enable control when the browser keeps audio blocked. Home never replays it; **Replay introduction** on the hub does. |
| Hub | **Start your training** on the left, **Continue your training** on the right (`ui/hub.mjs`, `logic/hub-state.mjs`). Continue is a disabled button with **No saved training yet.** until a lesson has been opened or real training activity exists; with a save it shows the checkpoint and, once there has been real activity, the local last-active date (none is invented for a lesson merely opened); a finished course leads to the review stop; a malformed save is explained with the path of the file moved aside; a save that cannot be read at all (locked, unreadable) disables both buttons, says nothing was changed, blocks every save until **Try reading again** succeeds. Start with a save opens the existing-progress dialog (Continue training / Restart from the beginning / Cancel). An archive print with its credit sits on the left; Rosie stands in her own dock beside the actions. |
| One course | `content/course.mjs`: three lessons (`Meet the PC•MACs screen`, `Digital versus analog, briefly`, `One second ON`) and one non-clickable placeholder row for the steps Atalay will specify. The three earlier levels are kept as an archive under Progress; a save mid-legacy-lesson resumes that lesson from the archive and says so. |
| Rosie guards Restart | `logic/restart-guard.mjs`, `ui/restart-dialog.mjs`: guarded on open; a click on her (or Enter/Space on her hit target) tickles her; once she has moved aside a five-second window opens with a countdown and **Restart training** enabled; the activation is checked as `now < deadline`; a timeout re-guards with the next line; losing focus re-locks; **Use simple confirmation** is the plain alternative and is remembered. A confirmed restart snapshots the old run to `progress.previous-run-<stamp>.json` first. |
| Lessons of the segment | `content/lessons/segment-digital.mjs`. Every term is defined at first use; the eleven menus are introduced left to right with a demonstration that opens the real menu; Time In / Time Out are taught as view controls with a before/after that leaves the data unchanged; Values In / Values Out are given a short honest orientation (vertical zoom of the analog scale, not simulated). |
| The film "One second ON" | `content/films/one-second-on.mjs`, run by `logic/cue-player.mjs` through `ui/cinema.mjs`: one clock for narration, captions, Rosie's cues and the pointer; the demonstration cursor glides to each control resolved from its identity and current bounds, then runs the control's own handler (a real click on the menu title and item, real pointer events on the Edit View pane, the real Play button). The staged mistake (three seconds instead of one) is corrected in the data with Set Digitals Off. Pause / Resume / Replay / Skip>>; a skipped film is recorded as skipped, not watched. |
| The practice | `logic/digital-task.mjs`: Digital 0 (channel id `light-1`) ON on frames 30–59 (`00:00:01.00` up to, not including, `00:00:02.00`), every other channel as the fixture left it, and the result played back through the event. The check names the observed state (wrong channel, too long, stays on, extra stretch, not previewed…) with the exact boundaries. |
| Rosie's help | **Click mascot to get help** above her throughout practice (mouse, touch, keyboard). Two choices: **Do you want me to show you how this is done?** (the film on an isolated copy; the attempt is kept) and **Do you have a different question?** (typed questions, three suggestions). `logic/questions.mjs` classifies basic / advanced / unrelated / uncertain and answers from `content/qa.mjs`. Help use is recorded as assisted. |
| Robot Rosie | `ui/robot-preview.mjs`, `guide/robot-model.mjs`: a separate mechanical model beside the windows, driven only by the simulated outputs at the playhead (or the Soft Console in Manual mode). Selecting and zooming never move her. Labelled **Simulated preview** with the proposed mapping and its note. |
| Rosie, the guide | Rounder body (a broad torso, capsule arms, round feet), removable glasses on her head, the brief's 24 expressions in six families plus five extras (`guide/face.mjs`), each with a silent and a speaking variant; hover/focus reactions with dwell and rate limits (`logic/attention.mjs`); the earlier pointer reactions unchanged. |
| Sound | `logic/audio-plan.mjs`, `ui/audio.mjs`: narrator through the system's local speech voices (a masculine en-US voice preferred when installed), original synthesized music (sting, loop, completion sting) and Rosie's chirps (short bursts per word group, pitch and tempo by emotion, capped density, never over the narrator), quiet rate-limited UI cues. Separate volumes and mutes per layer, captions, remembered in `preferences.json`. |

## Evidence for the technical claims

| Claim | Source |
| --- | --- |
| Reference version | PC•MACs version 2 as documented in the January 13, 2021 manual; the team's build is unknown (`docs/REFERENCE_FIDELITY.md`). The brief's "identify the exact reference version" is answered to that extent and no further. |
| Menu labels, order, shortcuts | The manual's menu screenshots, pp. 133–134: **Edit ▸ Set Digitals On = Ctrl+1**, **Set Digitals Off = Ctrl+0**. Verified against the manual, not against the team's laptop. |
| Time In / Time Out / Values In / Values Out | Manual pp. 76–77: zoom of the time scale and of the analog value scale. Not event fields, not hardware signals. |
| Frames | 30 frames per second; one second ON is 30 frames, `[30, 60)`; the end frame is exclusive, so no extra frame is added. |
| Digital 0 | The channel's name in this training show (channel names are the show author's in PC•MACs). ON = logical 1, OFF = logical 0. Output polarity is a wiring question and is not claimed. |
| "Activate" | Showing a channel (reveal), selecting it (selection), writing ON data (Set Digitals On), and enabling a physical output (Manual mode / playback through outputs) are four different operations in the app and in the lessons. |

## The three open decisions (brief, "Small remaining decisions")

1. **Which Robot Rosie part Digital 0 drives** — interim: a proposed petal-flap mechanism (six hinged plates open when ON) plus the eye lamp, in `src/renderer/content/robot-mapping.mjs`, labelled "proposed, not confirmed" in the panel, in the help, and here.
2. **Whether "Show me" works on the learner's attempt or a separate example** — interim: the film runs on an isolated copy of the show (the attempt, with its selection, view, names, baseline and last playback, is snapshotted and restored afterwards untouched; nothing is re-applied over it, and a save made meanwhile stores the attempt, not the copy), so nothing destructive happens by default. Switching to "modify the attempt with a recoverable snapshot" is a change in `runFilm` / `finishFilm` in `src/renderer/app.mjs`.
3. **Whether typed answers may use an online service** — interim: answers come only from local lesson knowledge (`content/qa.mjs`); no provider, account, key, or network; the app's CSP still forbids any connection. The core training never depends on the question feature.

## What is honest about the audiovisual layer

- The narrator is whichever local speech voice the system offers; `pickVoice` prefers the masculine Microsoft voices, then any en-US voice. It is not a recorded actor. Without a voice the film runs on captions.
- The music and chirps are synthesized plans, original but not composed by an audio designer; the reference clip from the brief was not auditioned here.
- Audio was exercised through the hidden-window harness with no sound output (by design); listening review on a speaker is still to be done by a person.

## Rights

Photos H–L are bundled as supplied with their credits; the source register says their redistribution licence is not established. Keep the repository private until the owner has checked the image-use terms (see `README.md`, Privacy).

## Not in this build, on purpose

No later lessons, no assessments or gates, no badges, no total duration, no analog, terminal or SD-card training, no online question service, no real-controller communication.
