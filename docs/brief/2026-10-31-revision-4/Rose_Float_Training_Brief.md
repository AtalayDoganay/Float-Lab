# Rose Float Training App — Detailed Training & Mascot Brief

> **Image files:** This Markdown uses the 12 real PNGs in the accompanying `references` folder. Extract the ZIP and keep that folder beside this file. When sending this brief to an AI app, attach the PNGs as images too; reading the Markdown text alone does not deliver image pixels. `Rose_Float_Training_Brief.html` is a browser preview with the pictures included.

Revision 4 • Prepared for Atalay Doganay • October 31, 2026

## Confirmed direction and current build boundary

This revision records Atalay's answers to the twelve design questions. These answers take precedence over older suggestions in the brief.

| Question | Confirmed requirement |
| --- | --- |
| 1. Learners | Brand-new Rose Float newcomers with no assumed knowledge of the software, programming, digital/analog controls, or robot animation. |
| 2. Workspace fidelity | A one-to-one recreation of the actual Pc•MACs interface and interactions. No redesigned substitute controls. |
| 3. Visible consequences | A small robot version of Rosie appears beside the workspace and shows what the learner's actions would do to a robot. |
| 4. Mascot medium | The Rosie guide is 3D, with soft rounded forms and the previously specified expressions/personality. |
| 5. Tone | Cheerful, deliberately over-expressive 1980s training-film energy. Slight vintage uncanniness is acceptable; no scary story, horror, or jump scares. |
| 6. Current lesson scope | Briefly explain digital versus analog, then build the first digital training segment in detail for Atalay to review. Expand only after that review. |
| 7. Robot versus mascot | The small robot Rosie and the Rosie guide are two different characters/objects with different jobs. |
| 8. Curriculum authority | Atalay will specify the teaching steps. Remove the AI-invented remainder of the curriculum from the active build scope. |
| 9. Guide placement | Rosie hovers near the active training area, follows the learner's activity, and tracks the mouse. |
| 10. Help and questions | Clicking Rosie offers a demonstration or a different question. Answer basic relevant questions; explain or show related concepts; redirect advanced questions and politely identify unrelated ones. |
| 11. Distribution | People will download the existing project/app from GitHub and use it on their own PCs. |
| 12. Overall length | Total course/session duration will be decided later. Do not build around an invented total runtime. |

### Two separate Rosies

**Rosie the guide:** the friendly 3D rose character with expressions, glasses, chirps, dialogue, cursor tracking, demonstrations, and the restart gag. She responds to the learner and narrator.

**Robot Rosie:** a separate small rose-inspired robot in a side preview, used as a visual explanation of the programmed output. It must read clearly as a mechanical robot rather than being a second copy of the guide. It responds to the simulated channel data/playhead, not merely to hover or the guide's emotional animation. Propose its final design and mechanism mapping for review; no final robot design has been supplied.

The preview must help a complete beginner connect the chain: selected channel → recorded value at this show time → robot's corresponding simulated behavior. Selecting a channel or zooming the view must not accidentally actuate the robot. If a mode legitimately provides a live simulated preview, identify that mode explicitly and match the reference software's behavior.

Keep the output preview visible beside the working area during the first digital example and exercise. Label the channel and simulated output simply. For the one-second event, Robot Rosie's relevant output must be visibly active for that programmed interval during preview. Do not invent a physical mechanism, wiring assignment, or real-controller behavior and present it as established fact.

### Exact software inside the retro app

Apply the retro Cal Poly theme to the app's introduction, hub, narration frame, guide, progress/help, and dialogs. Inside the Pc•MACs replica, reproduce the reference version's window layout, menu order, text, icons, toolbar, colors, graph conventions, selection feedback, mouse behavior, and keyboard shortcuts. Do not recolor or modernize those native controls to fit the outer theme.

Identify the exact reference version/build from the existing project and authoritative reference material before claiming one-to-one fidelity. If references are missing, request the specific version or view needed rather than inventing a UI. The fidelity target is the complete interface; the immediate working acceptance target is every view and action used by this first digital segment. Do not silently make unimplemented controls appear functional or claim complete software parity from one lesson's coverage.

### Beginner teaching standard

Explain each new term when first used: channel, digital, analog, timeline, playhead, selection, ON/OFF, and preview. Start with the actual software screen and one concrete cause/effect example. Do not assume learners know where menus are, how to select a channel or interval, or why selecting data differs from changing it. Show the normal mouse route before naming a shortcut.

Keep the earlier requested quick menu tour, digital/analog distinction, and first digital event as the proposed first segment. The exact scene order/timing and 1.000–2.000-second sample interval remain storyboard proposals for Atalay's review, not authority to invent an entire course. Do not add assessments, prerequisite gates, badges, a final project, detailed analog training, terminal training, or SD-card training to this build.

Complete the first segment and its supporting redesigned shell, then provide a runnable review build and a short recording. Atalay will check the result and describe the next teaching steps. Leave a modular place to add those steps without filling it with speculative lessons. Preserve useful legacy content and saves without presenting old levels as the new curriculum.

### Questions through Rosie

Clicking Rosie during training opens two clear choices:

- **“Do you want me to show you how this is done?”** — starts the visible mouse demonstration for the current skill.
- **“Do you have a different question?”** — opens text input and a few relevant suggested questions.

Use the learner's actual step, selection, and current data to make help relevant. Classification must distinguish:

| Question type | Response behavior |
| --- | --- |
| Basic and related to this lesson | Give a short, accurate explanation; offer “Show me” when a demonstration would help. |
| Related but advanced | Acknowledge it, then say that it is beyond what the learner needs to focus on right now; return attention to the current concept. Do not invent future lesson content or dates. |
| Unrelated to the training concept | Politely explain that Rosie helps with this training and suggest a relevant topic. |
| Relevant but not understood or not supported by verified material | Admit uncertainty and ask for clarification or point to the verified reference. Do not label it unrelated just because no answer was found. |

Example basic response: “Digital Zero is the channel's name. The value we record on that channel can still be ON or OFF.” Example advanced redirection: “That's a more advanced part of the system. You don't need to focus on that right now—let's get this digital event working first.”

The user-facing question behavior is confirmed; the answer engine is not. Do not introduce an external AI provider, paid service, account, API key requirement, or false promise of general conversational intelligence without resolving that choice. Clearly document whether answers come from local lesson knowledge, a local model, or an online service. Core training must remain usable independently of any optional question service.

### Following without obstructing

Rosie should feel present near the work rather than parked far away. Choose safe positions near the active control/selection, watch the cursor, and turn/gesture toward the current action. Follow activity with a short delay and smooth movement rather than sitting directly under the mouse. Keep the real target, graph, time readouts, and Robot Rosie visible. Reposition before she would cover them. Avoid chasing tiny pointer movements around the screen.

The restart dialog retains its deliberate blocking gag. During ordinary practice, her proximity must never block the one-to-one software interaction. Guide movement and robot output playback are separate animation systems.

### Downloadable PC app

Keep the existing project as the implementation base. Package the reviewed build for people to download from GitHub and run on their own PCs, with clear install/launch instructions, bundled required visual/audio assets, and local saved progress. Inspect the existing platform/framework; do not replace it with a hosted-only web app or assume support for additional operating systems. Automatic updates, account systems, cloud sync, shared-computer profiles, telemetry, and actual GitHub publication are outside this specification unless separately requested.

### Small remaining decisions for the next clarification

These are intentionally unresolved, not delegated as unmarked builder guesses:

1. Which Robot Rosie part/output should the first digital channel operate, and what should ON/OFF physically look like in the preview?
2. During “Show me,” should Rosie modify the learner's current attempt with a recoverable snapshot, or demonstrate on a separate temporary example?
3. Must answers to typed questions work fully offline, or may an optional online AI service be used?

The answer to question 9 established Rosie's placement; it did not explicitly choose between the two demonstration-state options. Total course duration and all future teaching steps are deferred by the user and do not need to be decided now.


## 0. Existing project: skills first, then redesign

**This is an existing application, not a blank new project. The assignment is a major UI/UX redesign and reworking of the training flow inside that project.** Reuse sound underlying functionality, validated lesson knowledge, local progress storage, tests, and useful assets. Inspect before replacing; do not create a disconnected lookalike app or discard working code just to change its appearance.

Before executing ANY implementation task in this brief, discover the skills available in your environment, obtain/install relevant skills through the supported mechanism where available, and read their full instructions. Start with project guidance such as AGENTS.md, then relevant UI/UX design, frontend or desktop framework, animation, accessibility, audiovisual production, image/asset handling, and app-testing skills. Use skills suited to the actual stack; do not invent a skill name or claim you loaded one without doing so. If an essential skill cannot be obtained, explain that specific gap and continue independent work where possible. Record the skills actually used in the final report.

The supplied current-home screenshot is reference G. It visibly shows the title “Roseflow PC Mac Training,” Home/Handbook/Progress/Help navigation, Continue/Start over actions, a rose mascot, three level rows, and text claiming local progress saving and simulation-only operation. These are observed UI elements, not proof that every advertised function works. Verify behavior in the code and running app.

Replace the sparse beige/plum homepage and three-level selection with the new opening film and training hub. Remove the “Basic,” “intermediate,” and “I hate my life” level structure from the new learner-facing flow. Keep useful lesson content and migrate progress into one course. Preserve the app's **simulation-only** boundary: this redesign does not authorize adding real-controller communication.

Read this whole brief before coding. Its new homepage/opening requirements complement the existing short-video lessons; the opening film is not a replacement for demonstrations before exercises.

## 1. Core training experience

Build the first beginner digital-training segment, using **short narrated demonstrations followed immediately by the matching exercise**. The overall course remains extensible; Atalay will specify additional steps after reviewing this segment. A masculine-voiced instructor explains the software while an expressive female rose mascot performs the actions. Sometimes she makes a small, understandable mistake; the narrator kindly corrects her; she fixes it visibly. After each demonstration, she invites the learner to try.

The training pattern is **watch → try → optional mascot help → feedback**. For this build, complete the first digital segment and stop at the review boundary. There are no three difficulty levels. Do not invent subsequent chapters, progression gates, or end-of-course assessments.

The expression requirement replaces the previous 10/12-face target with **at least 24 distinct expressions**, matching the full new reference sheet. Use she/her for the mascot. She is charming, sympathetic, excited, nerdy, and dorky. Her ordinary appearance has no glasses, but she can put them on for a technical explanation and take them off afterward. Her dialogue uses original game-style speech sounds, separate from the narrator's intelligible human voice.

Introduce analog versus digital briefly, then concentrate on digitals. Save detailed analog work for later. Mascot help must visibly use the working training controls like a person using a mouse; instant answers and text-only hints do not satisfy that requirement.

This document is the implementation brief and handoff prompt. It does not mean the app has already been modified or its runtime behavior inspected. The supplied screenshot has been reviewed as visual evidence.

## 2. Reference video and sound direction

[80's Training Video — An S.A Original, by Synthfro, starting at 0:07](https://www.youtube.com/watch?v=XeEFvT09Zqg&t=7s).

“Start from 7” is interpreted as seven seconds; the page shows a duration of 1:54. Its creator describes music inspired by old employee-training films with a strong synth character. The page and description were inspected, but playback did not work here: **the sound was not directly auditioned, extracted, or analyzed**. The production direction below is an original proposal based on the user's request, not a claim about the clip's exact tempo, melody, instrumentation, or mix. The audio designer should listen from 0:07 before finalizing it.

Use the link as a music reference. The masculine narrator is a separate requested element. Use the user-named Poppy Playtime mechanical-arm/GrabPack training sequences as a format reference: announcer explains, character demonstrates, result is visible. Do not copy the recording, melody, script, characters, or game audio.

| Sound layer | Original production direction | Required behavior |
| --- | --- | --- |
| Narrator | Warm masculine voice; clear diction; slightly theatrical, earnest 1980s workplace instructor; patient dry humor | Names each action, explains why, and pauses for the click/result. Corrects the mascot kindly. |
| Music | Cheerful retro synth backing, warm chords, light rhythm, short playful theme, restrained tape texture | Opening sting, quiet instructional loop, brief completion sting. Speech remains dominant; music settles during practice. |
| Mascot | Soft pitched chirps, blips, and vowel-like syllables; inspired by the dialogue feel the user associates with Undertale, Stardew Valley, and Wii/Mii characters | Original sounds accompany her readable dialogue. Pitch and rhythm reflect emotion while keeping one recognizable voice. |

Mascot text carries the meaning; chirps add personality. Use short phrase-like bursts, not a loud beep on every letter. Leave punctuation gaps, cap sound density, and stop immediately on pause, skip, text reveal, or dialogue close. Excitement can sound quicker/brighter; concern softer/slower. Do not overlap her speech sounds with a critical narrated explanation.

Provide separate controls for narration, music, and mascot sounds, plus captions. Keep speech crisp under the VHS texture. Require an audio preview and listening review during implementation; this brief is not a delivered soundtrack.

Suggested music-production prompt:

> Compose an original, short, loopable instrumental for a cheerful 1980s employee-training film about learning robot controls. Use warm synth sounds, a light rhythmic pulse, and earnest, slightly dorky corporate optimism. Leave space for a male narrator. Deliver an opening sting, quiet looping bed, and completion sting with a consistent identity. Do not reproduce the reference recording or melody.

## 3. 3D guide mascot, personality, and 24 expressions

Render Rosie the guide in 3D. Preserve her recognizable rose identity: red/pink flower head, green body, leaf details, friendly face. Build Robot Rosie as the separate mechanical output preview described in the confirmed direction; do not merge the two roles. Use reference B for a fuller curved torso, short rounded limbs, soft proportions, and smooth transitions. She should feel less like assembled geometric pieces. References C–E guide cartoon performance. Reference F supplies emotional range, not realistic human anatomy.

She loves the subject and wants the learner to succeed. She leans toward interesting graphs, becomes proudly technical, adjusts her glasses, and gets a little too excited about a useful shortcut. Her mistakes make her relatable and teach one useful point. They should not make her seem incompetent or consume the lesson.

Default mood: bright, attentive, welcoming. Add blinks, breathing, head tilts, petal/leaf reactions, and clear pointing gestures. Glasses are removable accessories and must stay attached correctly during animation.

The supplied chart has six rows of four expressions. Implement **all 24 distinct targets**, including recognizable differences between neighboring intensity levels:

| Family | Expression 1 | Expression 2 | Expression 3 | Expression 4 | Adaptation for the rose mascot |
| --- | --- | --- | --- | --- | --- |
| Firmness/frustration | Sternness | Indignation | Anger | Rage | Focused seriousness through comic frustration at her own mishap, never at a struggling learner. |
| Dislike | Disdain | Aversion | Disgust | Revulsion | Skeptical reaction through exaggerated cartoon “yuck” at a staged messy example. |
| Worry | Concern | Anxiety | Fear | Terror | Concerned glance through brief cartoon alarm; ordinary help stays reassuring. |
| Happiness | Satisfaction | Amusement | Joy | Laughter | Small proud smile through delighted laughter; her most frequent emotional family. |
| Sadness | Dejection | Melancholy | Sadness | Grief | Mild droop through theatrical sadness, used sparingly. |
| Discovery | Alertness | Wonder | Surprise | Shock | Attentive focus through wide-eyed amazement. |

Also support a neutral listening/rest pose and useful extra blends such as curious, reassuring, sheepish, and nerdy concentration. These supplement the required palette. The asset set can include intense emotions without forcing every intense face into beginner lessons.

Expression, speaking mouth, gaze, gesture, and glasses should be coordinated but separate states. Every expression needs speaking and silent variants. Different mouth openings or glasses toggles do not count as different expressions. Blend transitions naturally. Her mouth follows her chirps and rests during silence. When the narrator speaks, she demonstrates and reacts rather than lip-syncing his voice.

## 4. Short-video format and handoff

Most clips should be about 30–75 seconds; allow about 90 seconds for orientation or a complete worked example. These are proposed pacing targets. Split an overloaded topic into adjacent clips rather than rushing clicks or captions. Titles and jokes stay brief.

| Phase | Screen experience | Completion/control |
| --- | --- | --- |
| Watch | Real training workspace, narrator, visible demonstration cursor, captions, mascot performance | Pause/resume/replay and audio controls stay available. Demonstrate the skill before offering its exercise. |
| Handoff | Music settles; mascot looks toward learner and states the task | Show “Try it.” Restore the exercise's initial state; do not leave the completed demo answer in place. |
| Try | Interactive workspace, concise task card, mascot at the side | Show **“Click mascot to get help”** above her throughout practice. No artificial countdown. |
| Help | Contextual hint, “Show me,” or replay | “Show me” visibly operates the same controls through mouse-style actions. |
| Feedback | Friendly, state-specific response | Judge the actual result; allow retry, then continue. |

Make her help control keyboard-focusable and tappable. Keep the label readable and unobstructed.

Suggested handoff dialogue, delivered with her chirps:

> “Okay, now we know how to do this! Give it a try. If you need help, just let me know—click me and I'll show you.”

Then give one specific task:

> “Make Digital 0 turn ON at 1 second and OFF at 2 seconds. That's one second ON. Then play it back.”

A replay uses isolated demo state and must not overwrite the learner's attempt. Preserve progress on pause/resume. If playback is skipped, do not falsely record it as watched.

## 5. First digital segment only: menus before practice

The user will define the remaining training sequence. Implement the following earlier-requested introductory material and first digital task for review; the exact scene ordering is a storyboard proposal, not a complete course syllabus.

| Current material | Demonstration | Practice/review boundary |
| --- | --- | --- |
| Quick interface orientation | Explain the requested menus and relevant views from zero assumed knowledge. | No extra assessment or navigation gate is specified. |
| Reach the working screen | Show the verified file-opening/edit-view sequence needed for this exercise. | Keep this part of the first segment rather than inventing a separate file-management curriculum. |
| Digital versus analog | Brief plain-language distinction and visible example. | Detailed analog training is deferred. |
| First digital task | Select Digital 0, show the relevant verified top controls, mouse route, shortcuts, and exact one-second interval. | Learner tries it and previews the corresponding Robot Rosie behavior. |
| Review stop | Rosie offers help, explanation, demonstration, and retry. | Produce the runnable result for Atalay's review. Additional lessons and progression rules await his instructions. |

The first interface tour must cover **File, Edit, RealTime, Offline, Channels, Preferences, Time Out, Time In, Values Out, Values In, and Help**. Match the installed version's spelling and layout. For each: show its location, state its purpose, and explain one reason to use it. Open or operate it where meaningful. Narration, highlight, pointer, and mascot gaze must refer to the same target.

File/Edit lead into opening and changing the practice file. RealTime/Offline need a clear distinction grounded in the actual app. Channels needs a visible example of locating a channel. Preferences and Help need short useful examples, not exhaustive option lists. Revisit relevant controls in detail during the actual task.

### Time Out / Time In / Values Out / Values In

Verify these four controls rather than guessing from their names. **Do not assume Time In/Out are event start/end fields, or Values In/Out are incoming/outgoing hardware signals.** If these are the graph zoom controls in the installed version, teach them as view controls and demonstrate that changing the view leaves recorded data unchanged.

For each control, the final storyboard must state its verified function, show a before/after, explain why it helps, and identify what it does not change. If Values In/Out applies to the analog value scale, give only that short orientation and return to digitals. Do not turn it into an advanced analog lesson.

Use the verified selection/time controls to set the event boundaries. Explicitly distinguish viewing a smaller part of the timeline from shortening an event.

## 6. First digital exercise: precise target

The learner selects **Digital 0**, chooses a one-second interval, uses the appropriate top button/menu command to set it ON, and previews it. Show the mouse route first, then its verified hotkey. Ctrl+1/Ctrl+0 remain candidates until confirmed in the actual software.

Use a resettable simulation with a show lasting at least three seconds and the separate small Robot Rosie preview beside the workspace. Digital 0 begins OFF throughout; other channels remain unchanged. Robot Rosie must show the assigned output behavior during playback. The exact robot part and ON/OFF mechanism mapping remain a question for Atalay; do not silently substitute a generic lamp or invent a physical mapping. Label the preview as simulated.

**Digital 0 is the channel's name/index, not a command to set its value to zero.** In this fixture, ON means logical 1 and OFF means logical 0. Confirm physical output polarity separately before discussing hardware.

| Time | Digital 0 | Robot Rosie preview |
| --- | --- | --- |
| Before 1.000 s | OFF / 0 | Assigned robot output inactive; mechanism mapping to be confirmed. |
| 1.000 s up to, but not including, 2.000 s | ON / 1 | Assigned robot output active for this interval. |
| At and after 2.000 s | OFF / 0 | Assigned robot output inactive again. |

Duration: **2.000 − 1.000 = 1.000 second**. Translate this into the application's actual frame/timebase convention. Account for inclusive frame endpoints if applicable; do not accidentally add an extra frame. Holding a mouse button for roughly a second is not a substitute for programming an exact one-second event.

### Proposed 80–90-second storyboard

These lines and timings are original proposals. Replace bracketed control names with verified labels before recording, and rehearse timing against the real actions.

| Time | Voice/dialogue | Visible action |
| --- | --- | --- |
| 0–5 s | Narrator: “Let's give one digital channel a very simple job.” | Brief “One second ON” title. Mascot arrives eagerly; show the clean timeline. |
| 5–14 s | “This is Digital Zero. Zero is its channel number. Its value can still be ON or OFF.” | Pointer clicks the channel label. Show the actual selection highlight and distinguish label from value. |
| 14–25 s | “First, make the part of the timeline we're using easy to see.” | Demonstrate the verified view controls and changed time scale without changing the data. She briefly puts on glasses to inspect it. |
| 25–37 s | “Select from one second to two seconds. That gives us one second of activity.” | Show the mouse selection process and exact boundaries/duration. |
| 37–47 s | “Now use [verified ON control] to turn that selected section on.” | Hover over the top control, click, and show the recorded ON region. Display the verified hotkey as an alternative. |
| 47–57 s | She accidentally extends the event to three seconds. Narrator: “Almost! We asked for one second. Let's check the end of the interval.” | One visibly incorrect, staged duration mistake in the demo copy. She looks sheepish and checks the readout. |
| 57–67 s | “One to two. That's the interval we want.” | She visibly repairs the event and removes extra ON data. Correct the data, not merely the selection highlight. Confirm OFF after two seconds. |
| 67–79 s | “Watch the playhead. ON at one. OFF at two.” | Click preview. Play the interval at real speed with synchronized timeline and Robot Rosie output behavior. |
| 79–90 s | Mascot: “Okay, now we know how! Your turn. Click me if you need help.” | Human narration stops; her text/chirps take over. She removes glasses, smiles, and gestures to the reset exercise. Help label appears above her. |

If the view-control explanation needs more time, give it a separate short clip immediately beforehand. Do not replace understandable steps with a rapid cursor montage. Mistakes should be occasional, brief, useful, and visibly corrected—not a compulsory gag in every clip.

## 7. Rosie help, typed questions, and visible mouse actions

Clicking Rosie first offers “Do you want me to show you how this is done?” or “Do you have a different question?” The latter opens typed questions and follows the basic/relevant, advanced, unrelated, and uncertain response rules in the confirmed direction. The answer engine remains unresolved.

“Show me” means the learner sees the pointer move, hover, click, open a menu, select the channel, drag an interval, click the ON control, and preview the result. Each visible action must cause the corresponding real change in the training workspace.

1. Inspect the current attempt to identify what needs help.
2. Offer the two requested choices: a demonstration or a different question. Relevant hints/replay can be secondary options. If the learner already requests the demonstration, do not repeat the choice unnecessarily.
3. Preserve the current attempt. Atalay still needs to choose whether the demonstration operates on that attempt or a separate temporary example; do not silently pick a destructive behavior. A demonstration on the current attempt must be recoverable and labeled assisted.
4. Move an in-app demonstration cursor to the actual target, pause to identify it, then click or drag. Keep the relevant UI feedback visible.
5. Use the same control handlers and validation as manual input. Do not set the final answer behind the scenes while drawing a decorative mouse animation.
6. Coordinate mascot gaze, gestures, short dialogue, and speech sounds with the action.
7. Provide pause/stop and a clear handback. Do not let user and demonstration edit the same control simultaneously.
8. Invite a retry and record that help was used. Do not invent a mastery gate or decide later lesson eligibility; those progression policies are deferred.

Both mouse-only completion and verified shortcuts must work. Judge the outcome, not a rigid click sequence.

This requirement concerns the app's actual **training interface**. It does not assume permission or capability to move the user's operating-system mouse or control installed external software. If this is a Pc•MACs simulator, label it honestly; external native-app control is a separate capability to verify.

| Observed problem | Helpful response |
| --- | --- |
| No channel selected | “Let's pick Digital 0 first.” Point to its label. |
| Wrong channel edited | “The timing looks close—let's check which channel received it.” Show channel identity. |
| Selection exists but no ON data | “We've selected where to work. Now let's turn that section on.” Demonstrate the edit action. |
| Two-second ON event | “We're close! Check the duration: we need one second.” Show both boundaries. |
| Stays ON afterward | “It starts correctly. Let's make sure it switches off at two seconds.” Show trailing data. |
| Correct but not previewed | “Looks ready. Let's play it and watch what happens.” Highlight preview. |
| Correct and previewed | “Yes! One second ON. You got it!” Brief joy pose and soft completion sound. |

## 8. Deferred training: leave room, do not invent lessons

For this build, explain digital versus analog briefly and concentrate on the first digital segment. Detailed analog editing, percentages/calibration, terminal/GilderTerm operation, controller details, SD-card/export exercises, naming/editing follow-on lessons, and a final show-building challenge are not active implementation tasks. They are future subjects previously discussed, for which Atalay will provide teaching steps after reviewing the first result.

Keep lesson architecture extensible and preserve useful legacy material. Do not fill the learner's navigation with AI-authored future chapters or present these topics as completed/approved training. Do not assume a total course runtime. This current brief is self-contained and does not require an older brief to define the active work.

## 9. Implementing-AI instructions

### Audit and verify

Inspect the repository and running app before describing current features. Inventory each relevant screen/control with purpose, current behavior, evidence, status, and required change. Use working/partial/mockup/absent/unverified statuses. Explain actual capabilities; a connection animation is not proof of hardware communication.

Confirm the Pc•MACs reference version, exact UI and interaction fidelity, channel selection, top buttons/hotkeys, the four time/value controls, event editing, and timebase for this segment. Controller model, export formats, and terminal settings belong to later user-defined training and must not be invented now. Clarify “activate”: showing a channel, selecting it, writing ON data, and enabling a physical output are different operations.

The official [Pc•MACs manual](https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf), OffLine Editing Window QuickStart, is a starting point. Indexed material confirms the requested menu-label family and graph/channel view. Full retrieval failed here, so this brief does not verify exact shortcuts or all control behavior. Match evidence to the installed version before recording technical narration. Continue independent visual work while a hardware-specific detail is unresolved.

### Suggested lesson implementation

Use the existing stack where practical. A synchronized in-app cinematic sequence may serve as the training video if it includes actual narration, visible actions, mascot performance, captions, and playback controls. A static text carousel is insufficient.

| Lesson component | Required contents |
| --- | --- |
| Objective | One observable skill and a concrete practice task. |
| Initial state | Deterministic demo/practice fixtures, stable channel identity, actual timebase. |
| Cues | Ordered narration, captions, expression, gesture, pointer target/action, expected result. |
| Practice validation | Correct channel/data/timing and relevant preview behavior. |
| Help | State-specific hint and visible UI demonstration using normal controls. |
| Progress | Record watched/skipped/attempted/assisted state and the current checkpoint; future progression and mastery policies remain user-defined. |
| Evidence | Source for technical claims, review results, unresolved details. |

Resolve pointer targets from control identity and current bounds, not fixed pixel locations. Recalculate after resizing or opening menus. Wait for expected UI state. If a control is missing or disabled, pause and recover rather than clicking blindly. Show pointer-down, drag, and release when selecting an interval.

Use one playback clock for narration, captions, cursor cues, and animation. Pause/resume stays synchronized. Replay cancels previous sound instances and timers. Demonstrations use isolated practice data and must not send real hardware commands on replay or reload. Preserve progress without resuming a half-finished takeover. Reduce decorative motion when requested while retaining clear instructional actions.

### Execution prompt: use with this whole document and all included references

> Before implementation, discover/obtain supported relevant skills and read their instructions plus project guidance. Update the existing downloadable PC project. Treat the confirmed answers at the beginning of this revision as binding. Build for complete beginners. Recreate the verified Pc•MACs interface and interactions one-to-one; apply the cheerful, over-expressive 1980s Cal Poly training theme around it. Use a rounded 3D Rosie guide and a separate mechanical Robot Rosie preview driven by the simulated programmed output. Implement the previously specified opening film, Start/Continue hub, saved progress, restart/tickle interaction, and context-aware cursor reactions. Build only the first introductory/digital segment with the menu orientation, brief digital/analog distinction, narrator demonstration, learner attempt, visible output consequences, and Rosie help/typed questions. Keep the guide near the active work without covering it. Respect the three unresolved choices listed in the confirmed direction instead of silently inventing them. Preserve all references, historical photo credits, and existing useful code/data. Validate the UI fidelity, teaching clarity, audiovisual behavior, and progress handling. Deliver a runnable review build and recording. Stop before adding more training: Atalay will review this segment and specify future teaching steps. Total course duration, later lessons, scoring, gates, and final challenges are deferred. Preserve simulation-only behavior and report what is tested versus unresolved.


## 10. Acceptance checks and final implementation report

- [ ] All supplied references and sourced historical photos are included and correctly captioned.
- [ ] Rose identity is preserved; silhouette and limbs are softer and rounder.
- [ ] All 24 faces are distinguishable at in-app size and support speaking/rest states.
- [ ] Glasses can be added/removed and do not count as another face.
- [ ] Narrator, original music, and original mascot chirps are separate controllable layers.
- [ ] Captions are readable; audio is reviewed; chirps stop on pause/skip/reveal.
- [ ] Short demonstrations precede their exercises throughout one course; three levels are removed.
- [ ] All requested menus are introduced before digital tasks and their functions verified.
- [ ] Detailed analog work is deferred.
- [ ] Digital channel number 0 is clearly distinguished from logical value 0.
- [ ] Mouse route works; keyboard shortcuts match the actual application.
- [ ] One-second validation checks correct channel, ON interval, OFF boundaries, unchanged unrelated data, and preview.
- [ ] Frame boundaries are correct; changing zoom is not mistaken for editing duration.
- [ ] “Click mascot to get help” appears above her and works with mouse, touch, and keyboard.
- [ ] Help performs visible control actions with no hidden answer injection.
- [ ] Partial/wrong attempts, help interruption, retry, and assisted completion are handled correctly.
- [ ] Pause/resume/replay/resize preserve synchronization and target accuracy.
- [ ] Staged mistakes are corrected in the actual data and visibly verified.
- [ ] Only the first requested segment is active; later analog/SD-card/terminal training and progression policy await Atalay’s next steps.

Final report: what the app now does, a recording of one full watch → try → help → retry cycle, an expression contact sheet, audio previews, relevant test results, and remaining unverified behavior. A successful build alone is not proof that the lesson works.

## 11. New identity: Cal Poly Rose Float training archive

Give the training shell a coherent identity inspired strongly by cheerful, overly expressive 1980s industrial training tapes and Poppy Playtime’s instructional presentation. Slight vintage uncanniness is acceptable; horror, a scary story, and jump scares are outside the requested tone. Combine workshop history, a charming company-style mascot, photographic archive cards, cheerful synth music, formal male instruction, tape counters, restrained analog texture, and occasional playful character business. Keep the material original and the lessons readable.

Use **Cal Poly Pomona as the home-campus emphasis**, while clearly crediting **Cal Poly San Luis Obispo** as a substantial partner. “Cal sloth” in the request is interpreted as Cal Poly SLO, not a new sloth mascot. The joint program deserves visible credit, not a hidden footer mention.

Suggested display title: **Roseflow — Cal Poly Rose Float Training**. Suggested subline: **Pomona × San Luis Obispo · Learn by Doing**. Preserve the existing app/project identity and don't imply university endorsement unless established. Use legitimate existing brand assets if available; do not fabricate university seals.

### Proposed visual system

| Element | Direction |
| --- | --- |
| Main palette | Deep workshop green, warm gold, cream paper, dark ink, and Rosie's rose/pink accents. These are proposed design colors, not a claim about official brand specifications. |
| Photo treatment | Actual historical float photos in dated print/slide frames, light grain, subtle faded edges, and restrained pan/zoom. Year/title/award remain crisp. |
| Typography | Strong utilitarian headings; highly readable body text; monospaced tape/time labels as accents. Avoid making the whole interface a distorted terminal. |
| Layout | A purposeful full-window stage with clear hierarchy, generous photography, a resident mascot, and stable controls. Reduce empty unused space and generic stacked cards. |
| Motion | Slide/projector transitions, short film-leader moments, soft mascot acting, tactile button presses. Restrained VHS effects; no flashing or heavy distortion across instructions. |
| Sound | Original music and mascot voice rules from section 2; warm masculine orientation narration. Quiet tactile hover/click cues with rate limits. |

Carry the theme through Home, narration, training framing, Handbook, Progress, Help, app dialogs, loading states, and the current review-stop screen. The Pc•MACs replica itself is an explicit exception: preserve its original appearance and interactions one-to-one rather than theming or modernizing its controls. Keep Robot Rosie beside it and the 3D guide near the active task.

## 12. Researched history and photographic selection

Research checked October 31, 2026. Use dates and verified names instead of a fragile “latest” label. The specifically requested 2025 float remains a featured image; 2026 has since occurred and must not be erased from current-history claims.

| Topic/year | Grounded fact for the introduction | Source |
| --- | --- | --- |
| Joint program | Students at Cal Poly Pomona and Cal Poly San Luis Obispo collaborate on the Rose Parade entry. | [Cal Poly Rose Float: program](https://www.rosefloat.org/cal-poly-rose-float) |
| 1949 | The first entry, “Rocking Horse,” won the Award of Merit. | [Program history](https://www.rosefloat.org/our-history) |
| Early partnership | Pomona initially led much design/construction, with SLO fundraising and decoration support; cooperation continued after the campuses separated in 1966. | [Cal Poly Magazine history](https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/) |
| 1978 | “Grin and Bear It” is identified by the university's history as an early milestone introducing computer-controlled animation to the parade. | [Cal Poly Magazine timeline](https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/) |
| 2024 | “Shock n’ Roll: Powering the Musical Current” won the Crown City Innovator Award. | [CPP 2024 award report](https://www.cpp.edu/news/content/2024/01/cal-poly-universities-75th-rose-float-wins-innovator-award/) |
| 2025 | “Nessie’s Lakeside Laughs” won the Leishman Public Spirit Award. Its animated scenes included moving characters. | [CPP 2025 award report](https://www.cpp.edu/news/content/2025/01/cal-poly-universities-win-leishman-public-spirit-award-for-76th-rose-float/index.shtml) |
| 2026 | “Jungle Jumpstart,” featuring a rainforest robot, won the Sweepstakes Award. | [Cal Poly 2026 award report](https://www.calpoly.edu/news/cal-poly-float-wins-sweepstakes-award-2026-rose-parade) |

The photo sequence includes the first float, an animation-history example, award winners, the requested 2025 entry, and the newer robot float. Call them floats or animated float characters, not all “robots.” Avoid total-award counts and sweeping “only/first ever” claims that are unnecessary to this short introduction and can vary across sources.

Included photos H–L come from the linked university/program coverage. Preserve captions and source attribution. The first-float photo is credited by Cal Poly Magazine to Information Technology Services, Special Collections and Archives, Cal Poly. The 2026 article credits its photos to Tom Zasadzinski, Cal Poly Pomona. Where an individual photographer is not identified, credit the publishing source without inventing a name. The included source register records provenance; public availability is not a blanket reuse license. Check applicable image-use terms before public distribution.

### Why this app matters

Explain the relationship in everyday language: float animation relies on planned timing and control values; this simulator lets learners practice the interface, understand channels, and see how timed changes produce a simulated response. It helps them learn vocabulary and workflow before supervised work with actual float systems. The app itself does not drive a real float, certify a hardware operator, or prove that the pictured historical floats used the same controller/software.

Suggested concise homepage description:

> Learn how timed digital signals become animated actions. Practice the controls, read the timeline, and build confidence with Rosie in a simulation inspired by Cal Poly Rose Float's student-built tradition.

## 13. Opening film on every app launch

On each fresh application launch, play a roughly **45–60-second orientation film** before the training hub. Use the supplied music reference and the established narrator/Rosie sound roles. It should briefly answer: What is Rose Float? Who builds it? What has the team accomplished? What will this app teach me, and why does it matter?

Show **“Skip>>” at the upper right from the first frame**. It remains visible, clickable, keyboard-accessible, and tappable through all scenes and loading states. Clicking it stops the intro audio/animation and opens the hub immediately. Do not gate Skip behind an animation or minimum viewing time.

Play the introduction once per fresh launch—not again on every Home click, route change, window resize, or lesson return. A Home option such as “Replay introduction” may start it explicitly. Browser audio restrictions must not leave a blank or blocked screen: captions and visual playback can begin, with a clear sound-enable control if needed. Respect saved volume/mute/reduced-motion preferences.

### Proposed orientation storyboard and original narration

| Time | Image/action | Narration or text |
| --- | --- | --- |
| 0–5 s | Brief tape leader, green/gold title, Rosie peeks into frame; Skip already visible | “Welcome to Roseflow. Behind every moving float is a team learning how to bring an idea to life.” |
| 5–13 s | Two campus names on equal-readable labels; Rosie connects two simple workshop marks | “Cal Poly Pomona and Cal Poly San Luis Obispo work together to build a student-created Rose Parade float.” |
| 13–21 s | Photo H, dated 1949, gently presented as an archive print | “The tradition began with Rocking Horse in 1949, an entry that earned the Award of Merit.” |
| 21–29 s | Photo I, then a brief transition to Photo J | “Over the years, students developed new ways to animate their creations. That combination of creativity and engineering still defines the program.” |
| 29–39 s | Photos J and K with year/title/award captions; Rosie proudly presents 2025 Nessie | “Meet a few award-winning creations—and the teamwork behind them.” Keep exact awards in on-screen captions. |
| 39–45 s | Photo L and a clear 2026 year label, avoiding any claim 2025 is newest | “And the story continues.” |
| 45–56 s | Shift from float photo to illustrative timeline and simulated ON/OFF indicator | “Here, you'll practice timing, digital channels, and the controls that organize a show. Watch a short example, try it yourself, and ask Rosie whenever you need help.” |
| 56–60 s | Rosie waves toward the hub; film fades to stable buttons | Rosie, with chirps and text: “Ready? Let's make something move!” |

Keep the factual history brief and put extra detail in an optional “Float archive / About this program” panel. This storyboard is a proposed edit, not a finished video. Preserve the photo subjects and archival integrity; use presentation effects around them instead of inventing historical imagery.

## 14. Home hub: Start and Continue behavior

After the intro finishes or is skipped, show a polished workshop-training hub. Use a large archive/photo stage and Rosie with a concise explanation of the app. Place **“Start your training” on the left and “Continue your training” on the right**, with comparable size and a clear distinction between them. Secondary Handbook/Progress/Help access can remain, styled consistently and visually quieter.

| Saved state | Start your training | Continue your training |
| --- | --- | --- |
| No saved training | Enabled; begins the first short lesson | Visible but truly disabled, muted, no clickable hover effect; “No saved training yet.” |
| In-progress training | Enabled; opens the existing-progress dialog below | Enabled; shows last active date and lesson/step, then resumes the saved checkpoint. |
| Completed training | Enabled; opens the existing-progress dialog | Enabled; leads to saved completion/review rather than pretending an unfinished lesson exists. |
| Save still loading | Show a short loading state; do not allow actions to race loading | Disabled until data is available. |
| Save unreadable/incompatible | Explain the concrete issue, preserve the original data, and offer the verified recovery path | Do not render a working-looking button that fails silently. |

A disabled Continue must actually reject activation, not only look gray. Keep its explanation visible. Do not invent a progress percentage, last-session date, or checkpoint. Display local date/time from actual saved training activity; opening the intro, hovering, or teasing Rosie does not count as lesson progress.

### Existing-progress dialog

Clicking Start when a save exists opens a themed dialog with the actual checkpoint and date:

> “You already have training in progress. Last worked on: {local date and time}. Continue from {lesson, step}, or start a new run?”

Offer **Continue training**, **Restart from the beginning**, and **Cancel**. Continue is easy to choose and never blocked by Rosie. Restart invokes the playful confirmation below; opening the dialog alone changes no progress.

## 15. Rosie guards Restart: the five-second tickle interaction

Implement the requested video-game-style gag as the default restart confirmation. Rosie moves in front of the actual restart confirmation button and guards it. Her speech is friendly concern about the learner's saved effort, never punishment. The protected action must be logically blocked as well as visually covered.

Initial line:

> “Hold on! You've already made progress. Are you sure you want to start your training over?”

A small hint makes the interaction discoverable: **“Tickle Rosie to reveal Restart.”** Clicking/tapping her in this specific dialog triggers a short tickle/laugh animation. She moves away and exposes an enabled **“Restart training”** button for **five seconds**. Show a small readable countdown. The tickle itself must never restart training.

The user must make a separate click/activation on Restart during the window. If they do, preserve a recoverable snapshot, reset the active training run, and enter the first lesson. If five seconds pass first, Rosie guards it again and says a different contextual line. There is no automatic reset on timeout.

### State rules for the builder

| State/event | Required result |
| --- | --- |
| Dialog opens | Guarded. Restart action disabled; Continue and Cancel active. |
| Rosie is activated | Begin tickle animation once; consume the activation so it cannot click through to Restart. |
| Rosie has visibly cleared the button | Start a fresh five-second unlock window. Display countdown; enable Restart. |
| Separate Restart activation before expiry | Atomically save recovery snapshot and create new active run; prevent duplicate submission. |
| Window expires | Disable Restart first, then re-block visually; choose contextual reminder. No data reset. |
| Rosie is tickled again after re-block | Start a new complete cycle and five-second window. |
| Cancel / Continue / Escape / dialog close | Cancel timers and animations; preserve progress. Continue resumes if chosen. |
| App loses focus/backgrounds during unlock | Re-lock and cancel the window; do not leave a surprise active button when the user returns. |
| Save/reset fails | Keep the original progress and display a recoverable error. Do not claim the restart succeeded. |

Evaluate the deadline on activation, not just from a delayed visual timer: the action is valid only while `now < unlockDeadline`. The five seconds begin after the button is actually exposed. Closing/reopening the dialog starts guarded again. Never let the five-second window apply to ordinary practice, Continue, or other navigation.

Keep keyboard and touch equivalents. In this dialog, Enter/Space on Rosie can tickle her, and keyboard focus can reach the newly enabled Restart. Offer a **“Use simple confirmation”** alternative without a timed motor challenge, and respect reduced-motion preferences. This preserves the playful default while ensuring the user can still control their own progress.

### At least three additional conversations, selected from actual context

Use the initial line plus all three distinct exchanges below. This is state-aware game dialogue, not a requirement to add an online AI service.

| Context | Before/after tickle dialogue |
| --- | --- |
| First timeout in this dialog | “Hey—are you really sure? I can still take you back to where you left off.” After tickle: “Hehe! Okay, five seconds. Your call!” |
| Second or later timeout in the same dialog | “Another tickle? I think you've discovered my weakness, not the Restart button.” After tickle: “All right, all right—button's clear!” |
| A later separate restart attempt | “Back at the beginning again? Your last training activity was {actual local date}. Want a fresh run, or shall we continue?” After tickle: “Fresh start, fresh notebook. You've got five seconds!” |

If the learner completed the course, acknowledge that accurately: “Finished already and coming back for another run? I like your enthusiasm!” If they have never restarted before, do not imply they have. Track enough state to avoid repeating the same line immediately, such as dialog timeout count, last line ID, and confirmed restart history. Teasing Rosie must not alter lesson timestamps or completion.

## 16. Cursor-following and reactive behavior throughout the app

Rosie the 3D guide watches the pointer and hovers near the active training area, tracking the learner’s current work. Reposition smoothly with a short delay and bounded eye/head movement; do not stay permanently anchored far from the task or chase every tiny cursor movement. Keep software targets and Robot Rosie unobstructed. When the pointer leaves the window, settle calmly. On touch, use tap/focus reactions.

| Interaction | Rosie response |
| --- | --- |
| Hover/focus Start | Eager lean, bright eyes, a small ready-to-go gesture. |
| Hover/focus enabled Continue | Recognition and a welcoming gesture toward the saved checkpoint. |
| Disabled Continue | No misleading invitation; optional glance at “No saved training yet.” |
| Hover a historical photo | Look toward it with interest; an optional brief caption reaction after a dwell. |
| Click a normal action | Short acknowledgment, then allow the action immediately. |
| Enter a tricky lesson or Help | Reassuring expression; glasses may appear for a focused demonstration. |
| Guarded restart dialog | The special protective/tickle behavior above overrides ordinary click-to-help. |

Rate-limit reactions and sound so repeatedly crossing a button does not produce constant dialogue. Use a small hover dwell before any spoken text. Prioritize instructional animation over idle tracking; a lesson cue may deliberately direct her gaze. Ordinary reactions must not steal focus, intercept clicks, trigger settings, or delay navigation. The restart gag is the intentional, clearly communicated exception.

## 17. Integration, progress preservation, and new acceptance checks

Before changes, map existing routes, shared components, lesson IDs, save formats, and tests. Preserve legacy progress and implement a reliable continuation path into the approved first segment; do not invent the rest of the single-course syllabus merely to map old lessons. Preserve the original save before migration. If a checkpoint has no reliable equivalent, explain it and offer the closest valid continuation without discarding history or claiming exact resume.

Starting over resets the active training run only after explicit confirmation. Keep preferences, accessibility choices, sound settings, and a recoverable previous-run snapshot. Do not erase unrelated files or history. Use atomic writes/transactions appropriate to the stack; failed migration/reset leaves the previous save intact.

New checks in addition to section 10:

- [ ] Relevant skills and project guidance were read before implementation; actual use is reported.
- [ ] The existing downloadable PC project is updated; useful behavior and simulation-only operation remain intact.
- [ ] Intro appears once on each fresh launch; Skip>> works from frame one and stops intro audio.
- [ ] Home navigation does not repeatedly retrigger the launch film.
- [ ] Archive photos have correct years, titles, captions, and provenance; 2025 is not mislabeled as current latest.
- [ ] Pomona is emphasized and SLO's partnership is visibly credited.
- [ ] Start/Continue render correctly for absent, in-progress, completed, loading, and unreadable saves.
- [ ] Last-active date comes from real training activity and is formatted locally.
- [ ] Clicking Start with progress offers Continue/Restart/Cancel before any reset.
- [ ] Rosie blocks Restart until tickled; tickling alone never resets or clicks through.
- [ ] Five-second boundary is checked in logic, including at 4.9 s, 5.0 s, and after 5.0 s using a controlled clock.
- [ ] Timeout re-blocks, preserves the save, and uses appropriate alternate dialogue.
- [ ] Cancel, backgrounding, repeated clicks, and reopening cancel stale timers and prevent double reset.
- [ ] All three extra conversation variants and completed-course variant are reachable in the correct contexts.
- [ ] Keyboard/touch and simple-confirmation paths work; ordinary controls are not obstructed.
- [ ] Hover reactions are smooth, limited, context-aware, and do not spam sound.
- [ ] Theme covers every major page/dialog while the simulated software controls remain recognizable.
- [ ] Old-save migration, failed writes, restart recovery, and resume are verified.

Show the first review build with screenshots of the intro, hub with and without a save, guarded/unlocked restart, exact Pc•MACs workspace, 3D guide, separate Robot Rosie preview, and question/help interface. Include a short recording of skip → continue and start → tickle → timeout → tickle → confirmed restart, plus the earlier watch → try → help cycle. Report remaining limitations honestly.



### Revision 4 acceptance additions

- [ ] Complete newcomers can follow each action without assumed software/control knowledge.
- [ ] Reference version is identified and the Pc•MACs appearance/interactions used in this segment match one-to-one.
- [ ] The retro shell does not alter the native-looking replica controls.
- [ ] Rosie is a rounded 3D guide; Robot Rosie is a distinct mechanical preview with separate behavior.
- [ ] The robot preview is driven by actual simulated channel data/playback, not decorative button-triggered animation.
- [ ] The guide follows the work near the cursor without obstructing controls or the robot preview.
- [ ] Clicking Rosie offers demonstration or a different question; relevant basic, advanced, unrelated, and uncertain questions are handled distinctly.
- [ ] Question-engine connectivity and demonstration-state choices are documented rather than silently assumed.
- [ ] GitHub-downloadable PC packaging and local progress match the existing project’s supported platform.
- [ ] No extra curriculum, fixed total duration, progression gate, or final challenge is invented.
- [ ] A runnable first-segment review build and recording are delivered before later training is added.

## 18. Visual references and photographic sources

Use captions rather than upload order. A is the existing mascot; B defines softer body shapes; C–E guide cartoon expression/performance; F adds the full emotional range; G is the existing homepage. H–L are sourced historical photographs for the opening film. The supplied references are not redesigned assets.

### A — Current rose mascot

Preserve the rose identity, flower head, green body, and friendly character. Improve the rounded silhouette and transitions between body parts.

![A — Current rose mascot](references/A_Current_Rose_Mascot.png)

Credit: User-supplied visual reference.

### B — Rounded body-shape target

Use the green flower character for soft proportions, a broad curved torso, rounded limbs, and a cohesive silhouette. This is the body-shape reference referred to as the second image in the request.

![B — Rounded body-shape target](references/B_Rounded_Body_Reference.png)

Credit: User-supplied visual reference.

### C — Expressive robot faces

Use the variation in eye shapes, brows, head angles, and gestures as expression inspiration. Retain the rose mascot rather than copying the robot design.

![C — Expressive robot faces](references/C_Expressive_Robot_Reference.png)

Credit: User-supplied visual reference.

### D — Robot demonstration poses

Use the pointing, presenting, cheerful, and focused poses as inspiration for a mascot that visibly participates in the narrated lesson.

![D — Robot demonstration poses](references/D_Robot_Performance_Reference.png)

Credit: User-supplied visual reference.

### E — Owl expression range

Use the clearly distinguishable emotional states and full-body reactions as a readability reference for the speaking-face system.

![E — Owl expression range](references/E_Owl_Expression_Reference.png)

Credit: User-supplied visual reference.

### F — Full 24-expression palette

Six rows of four expressions define the new required range and intensity. Adapt all 24 to the original rounded rose mascot. Use this for emotional variety, not realistic human anatomy. This supersedes the old 10/12-face target.

![F — Full 24-expression palette](references/F_24_Expression_Reference.png)

Credit: User-supplied visual reference.

### G — Existing homepage to redesign

User-supplied current screenshot. Replace the homepage layout and three-level structure; audit the underlying project and preserve useful functionality and progress. The visible banner describes simulation-only operation.

![G — Existing homepage to redesign](references/G_Existing_Homepage.png)

Credit: User-supplied visual reference.

### H — 1949: Rocking Horse

The first Cal Poly float; Award of Merit. Use for the opening historical archive scene.

![H — 1949: Rocking Horse](references/H_1949_Rocking_Horse.png)

Credit: Information Technology Services, Special Collections and Archives, Cal Poly; via Cal Poly Magazine. [Source page](https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/) · [Original image](https://magazine.calpoly.edu/wp-content/uploads/2024/05/ss24_rose-inset-rocking-horse-750x500.jpg).

### I — 1978: Grin and Bear It

Historical animation milestone. Use to connect the float tradition to learning control and timing.

![I — 1978: Grin and Bear It](references/I_1978_Grin_And_Bear_It.png)

Credit: Cal Poly Magazine; individual photographer not identified in the timeline caption. [Source page](https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/) · [Original image](https://magazine.calpoly.edu/wp-content/uploads/2024/05/ss24_rose-float-timeline_grin-and-bear-it-750x500.jpg).

### J — 2024: Shock n’ Roll: Powering the Musical Current

Crown City Innovator Award. A full-float photo for the award-winning montage.

![J — 2024: Shock n’ Roll: Powering the Musical Current](references/J_2024_Shock_N_Roll.png)

Credit: Tom Zasadzinski, Cal Poly Pomona; via Cal Poly News. [Source page](https://www.calpoly.edu/news/cal-poly-float-wins-crown-city-innovator-award-2024-rose-parade) · [Original image](https://www.calpoly.edu/sites/default/files/styles/width_2048px/public/2024-01/news_rose-parade_hero_2.jpg?itok=qxlchNVX).

### K — 2025: Nessie’s Lakeside Laughs

Leishman Public Spirit Award. Keep this user-requested entry prominent and label it 2025.

![K — 2025: Nessie’s Lakeside Laughs](references/K_2025_Nessies_Lakeside_Laughs.png)

Credit: Cal Poly Pomona / CPP News; individual photographer not identified on the source page. [Source page](https://www.cpp.edu/news/content/2025/01/cal-poly-universities-win-leishman-public-spirit-award-for-76th-rose-float/index.shtml) · [Original image](https://www.cpp.edu/news/img/news/2025/01/25rose-float-parade-pasadena.jpg).

### L — 2026: Jungle Jumpstart

Sweepstakes Award. The newer robot-themed float, included so the introduction does not call 2025 the latest completed parade entry.

![L — 2026: Jungle Jumpstart](references/L_2026_Jungle_Jumpstart.png)

Credit: Tom Zasadzinski, Cal Poly Pomona; via Cal Poly News. [Source page](https://www.calpoly.edu/news/cal-poly-float-wins-sweepstakes-award-2026-rose-parade) · [Original image](https://www.calpoly.edu/sites/default/files/styles/width_2048px/public/2026-01/26rose-parade1-lead-crop.jpg?itok=QimLHajG).

