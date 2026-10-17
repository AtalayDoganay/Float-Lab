// "I hate my life": comprehensive coverage of everything the references
// support, plus explicit statements of what they do not. These lessons are
// added on top of every Basic and intermediate lesson.
import { explain, practice, question, classicQuestion, digitalPattern, clearLight } from './steps.mjs';
import { SETTING_EXPLANATIONS, CHALLENGE_CLUES } from '../curriculum.mjs';
import { formatPercent } from '../../logic/simulation.mjs';

const NOT_SIMULATED = 'Its prompt and effect were not photographed, so the trainer answers “not simulated” rather than inventing firmware behavior.';

export const COMPREHENSIVE_LESSONS = [
  {
    id: 'h-main-menu',
    group: 'functions',
    title: 'Main configuration menu, line by line',
    summary: 'Every line of photo 07, with what is simulated and what is not.',
    reveal: ['terminal', 'term-toolbar'],
    steps: [
      explain('a-line', {
        target: 'term-menu',
        title: 'a) Card Address: 1',
        explain: 'Pressing a makes the card ask “Enter the card address (0 - 255):”, photographed in photo 01. Changing the address was not photographed, so the trainer keeps 1 and says so.',
        demo: { intro: 'Open the card-address prompt and answer it.', actions: [{ type: 'term-reset' }, { type: 'term-key', key: 'a' }, { wait: 1200 }, { type: 'term-key', key: '1' }], outro: 'The prompt appeared; the answer was accepted without changing the photographed value.' },
      }),
      explain('c-d-e-f', {
        target: 'term-menu',
        title: 'c) First Channel, d) Resolution, e) DMX, f) 0-based',
        explain: `First Channel 6, Resolution 8-bit, DMX “Rx w/CS”, and 0-based numbering are photographed values. For each of these lines the prompt was never photographed, so none is simulated. “Rx w/CS” names a DMX receive mode on the card; the references do not explain it further and the trainer does not guess.`,
      }),
      explain('ranges', {
        target: 'term-menu',
        title: '1) Set minimum range, 2) Set maximum range',
        explain: `${SETTING_EXPLANATIONS.range[1]} The manual describes endpoints on the output scale with the example 64 and 192. ${NOT_SIMULATED}`,
        concept: 'concept:calibration',
      }),
      explain('force', {
        target: 'term-menu',
        title: '3) Force output to value',
        explain: `${SETTING_EXPLANATIONS.force[1]} The manual lists it among commands that act on the selected output and suggests it for finding endpoint values. How a forced output is released on firmware 1.98 is not photographed. ${NOT_SIMULATED}`,
        concept: 'concept:force-output',
      }),
      explain('poweron', {
        target: 'term-menu',
        title: '4) Set PowerOn Default',
        explain: `${SETTING_EXPLANATIONS.power[1]} The manual says power-on defaults are used only when no AutoDownload file is found and no DMX-512 or serial real-time data is arriving. The photographed column reads 0 for every axis; special values for this firmware are unverified. ${NOT_SIMULATED}`,
        concept: 'concept:poweron-default',
      }),
      explain('velocity', {
        target: 'term-menu',
        title: '5) Set Velocity Limit',
        explain: `${SETTING_EXPLANATIONS.velocity[1]} The Vel Limit column reads 3.00, 7.00, 3.00, 6.00, and the 2018 Br-EFB manual read for this app contains no Velocity Limit entry at all. Units and algorithm remain unresolved. ${NOT_SIMULATED}`,
        concept: 'concept:velocity-limit',
      }),
      practice('try-5', {
        target: 'term-menu',
        title: 'Press 5 and read the honest answer',
        explain: 'The trainer refuses to invent what a key does when the photos do not show it.',
        instruction: 'Click “5) Set Velocity Limit” or type 5 and press Enter, then read the note under the terminal.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal, action }) => (action?.key === '5' && /not simulated/.test(terminal.note)
          ? { ok: true, message: 'The note says the line is photographed but its prompt and effect are not, so it is not simulated. On the real card it would change a live setting.' }
          : { ok: false, message: 'Press 5 on the main menu and read the note that appears under the terminal.' }),
        success: 'The note under the terminal explains that key 5 is not simulated.',
      }),
      classicQuestion('q-force', 'l09q1', { target: 'term-menu' }),
      classicQuestion('q-startup', 'l09q2', { target: 'term-menu' }),
    ],
  },
  {
    id: 'h-feedback-menu',
    group: 'hydraulics',
    title: 'Feedback menu, line by line',
    summary: 'Integral and derivative gains, compliance, and More PID Options.',
    reveal: ['terminal'],
    steps: [
      explain('open', {
        target: 'term-menu',
        title: 'k) feedback conf',
        explain: 'The feedback menu from photo 09 lists Enabled, the three gains, Reverse Axis Output, Compliance Settings, and More PID Options.',
        demo: { intro: 'Open the feedback menu.', actions: [{ type: 'term-reset' }, { type: 'term-key', key: 'k' }], outro: 'Axis 0 is shown Enabled; the gains are a snapshot.' },
        concept: 'concept:pid',
      }),
      explain('i-d', {
        target: 'term-menu',
        title: '3) integral gain, 4) derivative gain',
        explain: 'In the basic PID idea, the integral term accumulates error over time and the derivative term responds to how quickly the error changes. The photographed Int Gain and Der Gain columns read 0.000 for every axis. No gain values are recommended here, and the prompts for setting them were not photographed, so they are not simulated.',
        concept: 'concept:pid',
      }),
      explain('compliance', {
        target: 'term-menu',
        title: '6) Compliance Settings',
        explain: `${SETTING_EXPLANATIONS.compliance[1]} Nothing in the photos shows the compliance screen, so it is not simulated.`,
      }),
      explain('more-pid', {
        target: 'term-menu',
        title: '7) More PID Options',
        explain: `A photographed menu line whose screen was not photographed. ${NOT_SIMULATED}`,
      }),
      practice('try-7', {
        target: 'term-menu',
        title: 'Press 7 on the feedback menu',
        explain: 'Confirm for yourself that unphotographed lines are refused, not guessed.',
        instruction: 'With the feedback menu open, click “7) More PID Options” or type 7 and press Enter.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }, { type: 'term-key', key: 'k' }],
        validate: ({ terminal, action }) => {
          if (terminal.screen !== 'feedback') return { ok: false, message: 'Open the feedback menu first with k, then press 7.' };
          if (action?.key === '7' && /not simulated/.test(terminal.note)) return { ok: true, message: 'The trainer says “More PID Options” is photographed as a line but not as a screen, so it is not simulated.' };
          return { ok: false, message: 'Press 7 on the feedback menu and read the note.' };
        },
        success: 'The note explains that line 7 is not simulated.',
      }),
      question('q-int', {
        target: 'term-menu',
        title: 'Check your understanding',
        explain: 'The three terms.',
        question: {
          prompt: 'In the basic PID idea, what does the integral term respond to?',
          options: ['Error accumulated over time', 'The present error only', 'How quickly the error is changing'],
          correct: 0,
          why: 'I accumulates error over time; P responds to the present error; D responds to the rate of change.',
          hints: ['', 'That is the proportional term.', 'That is the derivative term.'],
        },
      }),
    ],
  },
  {
    id: 'h-unresolved',
    group: 'hydraulics',
    title: 'What the references do not settle',
    summary: 'The gaps, stated plainly, and what evidence would close each one.',
    reveal: ['terminal'],
    steps: [
      explain('velocity-gap', {
        target: 'term-menu',
        title: 'Velocity Limit',
        explain: 'Photographed as a menu line and a column (3.00, 7.00, 3.00, 6.00). The 2018 Br-EFB manual has no Velocity Limit entry. Its PID menu does have “5) limit valve voltage” (p. 100): ±10 V by default, lowered to slow an actuator, so ±5 V halves its top speed. Whether firmware 1.98’s Vel Limit is that setting renamed is not established. A firmware-matched document from the manufacturer would settle it. Do not read 3.00 as centimetres per second.',
        concept: 'concept:velocity-limit',
      }),
      explain('poweron-gap', {
        target: 'term-menu',
        title: 'PowerOn Default special values',
        explain: 'The manual explains when a PowerOn Default applies, but any special values and the exact startup sequence on firmware 1.98 are unverified. The photographed 0 in every row is an observation, not a meaning.',
        concept: 'concept:poweron-default',
      }),
      explain('force-gap', {
        target: 'term-menu',
        title: 'Releasing a forced output',
        explain: 'The manual lists Force Output to a Value; how the override is released on this firmware is not photographed and the trainer does not simulate it.',
        concept: 'concept:force-output',
      }),
      explain('rig-gap', {
        title: 'The rig itself',
        explain: 'The position sensor’s identity, travel, and wiring; whether the actuator is hydraulic, pneumatic, or electric; which valve or pump is used; and any lighting channel’s real DMX address are not established by the photos. The team’s photos show only fragments of the PC•MACs main window behind the terminal, so the recreated Edit View, Control Window, and Soft Console follow the manufacturer’s manual instead, and the PC•MACs version on the team’s laptop is unknown.',
        concept: 'concept:photos',
      }),
      practice('open-photo', {
        target: 'photo-toggle',
        title: 'Look at the evidence yourself',
        explain: 'The reference photo is bundled so you can check the transcription instead of trusting it. Open it now; the next step asks you to read a value from it.',
        instruction: 'Press “See the reference photo”.',
        photo: '07-1000066747.jpg',
        triggers: ['open-photo'],
        validate: ({ action }) => (action?.type === 'open-photo'
          ? { ok: true, message: 'Photo 07 is open: the snapshot the lessons quote. Find the Vel Limit column at the right of its table; the next step asks about it.' }
          : { ok: false, message: 'Press “See the reference photo” in this panel.' }),
        success: 'The reference photo opens inside the app.',
      }),
      question('q-vel-photo', {
        target: 'photo-toggle',
        photo: '07-1000066747.jpg',
        title: 'Read the column yourself',
        explain: 'Open the photo again if you need to. Read across the row that begins “7 (1)”.',
        question: {
          prompt: 'In photo 07, what does the Vel Limit column read for axis 1, the row “7 (1)”?',
          options: ['7.00', '3.00', '6.00'],
          correct: 0,
          why: 'The row “7 (1)” ends in 7.00. That is what the screen read on the day; the references still do not say what 7.00 means.',
          hints: ['', '3.00 is the reading for axis 0 and for axis 2.', '6.00 is the reading for axis 3.'],
        },
      }),
      question('q-vel', {
        target: 'term-menu',
        title: 'Check your understanding',
        explain: 'Reading a number without inventing its meaning.',
        question: {
          prompt: 'The photographed Vel Limit for axis 0 is 3.00. What can you say about it?',
          options: ['Only that the field read 3.00; its units and algorithm are not established by the references', 'The axis moves at 3 cm per second', 'It is 3% of full speed'],
          correct: 0,
          why: 'The manual read for this app contains no Velocity Limit entry, so the number has no verified meaning yet.',
          hints: ['', 'No reference gives the units; centimetres per second is a guess.', 'No reference says it is a percentage.'],
        },
      }),
    ],
  },
  {
    id: 'h-diagnosis',
    group: 'diagnosis',
    title: 'Command says 128, feedback says 0',
    summary: 'Separate what was asked from what was observed before blaming a part.',
    reveal: ['title', 'ruler', 'analog', 'command', 'measure', 'terminal'],
    steps: [
      explain('mismatch', {
        target: 'measure-readout',
        title: 'A mismatch is evidence, not a diagnosis',
        explain: 'Start by identifying the intended axis and command, then compare the requested value with feedback. A mismatch can have several causes: incorrect mapping, disabled output, missing power, a sensor issue, or a mechanical problem. The numbers alone do not say which.',
        concept: 'concept:command-vs-measurement',
      }),
      practice('reproduce', {
        target: 'command-slider',
        title: 'Reproduce the symptom in the trainer',
        explain: 'An output of 128 with the simulated position stopped at 0% is the picture of a request that was never answered. Manual mode is on, so the Soft Console slider is the output.',
        instruction: 'Set the selected axis’s Soft Console slider to 128 and leave the measurement model stopped at 0.0%.',
        triggers: ['set-command', 'run-measure', 'reset-measure'],
        setup: [{ type: 'set-manual', on: true }, { type: 'reset-measure' }, { type: 'set-command', value: 0 }],
        validate: ({ sim }) => {
          if (sim.command !== 128) return { ok: false, message: `The slider for Axis ${sim.axis} reads ${sim.command} (${formatPercent(sim.command)}). Set it to exactly 128.` };
          if (!sim.checks.manual) return { ok: false, message: 'Manual is off, so the slider does not reach the output. Tick Manual on the Control Window.' };
          if (sim.measuring || sim.measured !== 0) return { ok: false, message: 'Press Reset so the simulated position reads 0.0% and stays there.' };
          return { ok: true, message: 'Output 50.2%, simulated position 0.0%, error 50.2 points. You know the two disagree, and nothing else yet.' };
        },
        success: 'The float shows an output of 128 / 255 against 0.0%.',
      }),
      explain('command-path', {
        target: 'axis-select',
        title: `Clue: ${CHALLENGE_CLUES.clue1.label}`,
        explain: CHALLENGE_CLUES.clue1.text,
      }),
      explain('feedback-path', {
        target: 'measure-readout',
        title: `Clue: ${CHALLENGE_CLUES.clue2.label}`,
        explain: CHALLENGE_CLUES.clue2.text,
        concept: 'example:sensors-position',
      }),
      classicQuestion('q-mismatch', 'l10q1', { target: 'measure-readout' }),
      classicQuestion('q-next-step', 'l10q2', { target: 'axis-select' }),
    ],
  },
  {
    id: 'h-assign-roundtrip',
    group: 'assignments',
    title: 'Assignment: the full round trip',
    summary: 'Terminal, command, model, timeline, playback, in one pass.',
    reveal: ['title', 'ruler', 'analog', 'digital', 'transport', 'command', 'measure', 'terminal', 'term-toolbar'],
    steps: [
      explain('goal', {
        title: 'The task',
        explain: 'Select axis 1 through the terminal, set its Soft Console slider to 64, run the measurement model, then draw Light 2 ON for the first and last second of the show only, play the show, and stop it.',
      }),
      practice('term-axis-1', {
        target: 'term-input',
        title: 'Select axis 1 through the terminal',
        explain: 'Use s, then 1.',
        instruction: 'Type s, then 1, in the terminal.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal }) => {
          if (terminal.prompt === 'axis') return { ok: false, message: 'The axis prompt is open. Type 1.' };
          if (terminal.axis === 1) return { ok: true, message: 'Axis 1 is selected on the card: the row “7 (1)”. Next, the same output in PC•MACs.' };
          return { ok: false, message: `Axis ${terminal.axis} is selected. Press s, then 1.` };
        },
        success: 'The arrow is on the row “7 (1)”.',
      }),
      practice('cmd-64', {
        target: 'command-slider',
        title: 'Set the Axis 1 slider to 64',
        explain: '64 ÷ 255 × 100 is about 25.1%, a quarter of the way up.',
        instruction: 'On the Soft Console, set the Axis 1 slider to exactly 64.',
        triggers: ['set-command'],
        setup: [{ type: 'set-command', axis: 1, value: 128 }],
        validate: ({ sim }) => {
          if (sim.axis !== 1) return { ok: false, message: `That is the Axis ${sim.axis} slider. Use the Axis 1 row.` };
          return sim.command === 64
            ? { ok: true, message: 'Axis 1 reads 64, 25.1%. The Br-EFB manual uses 64 as its example for roughly 25%.' }
            : { ok: false, message: `Axis 1 reads ${sim.command} (${formatPercent(sim.command)}). Move it to exactly 64.` };
        },
        success: 'The Value column reads 64 for Axis 1.',
      }),
      practice('run', {
        target: 'measure-run',
        title: 'Run the measurement model',
        explain: 'Manual mode is on, so the slider is the commanded output. Watch the dashed line approach 25.1%.',
        instruction: 'Press Run model in the simulated float.',
        triggers: ['run-measure'],
        setup: [{ type: 'set-manual', on: true }, { type: 'reset-measure' }],
        validate: ({ sim, action }) => (action?.type === 'run-measure' && sim.measuring
          ? { ok: true, message: 'The simulated position is approaching 25.1%. It says nothing about the real axis.' }
          : { ok: false, message: 'Press Run model.' }),
        success: 'The model is running.',
      }),
      practice('light-2-pattern', {
        target: 'digital-pane',
        title: 'Light 2: the first and last second only',
        explain: 'Two separate stretches: 00:00:00.00 to 00:00:01.00, and 00:00:07.00 to the end of the show.',
        instruction: 'Set Light 2 ON from 0 s to 1 s and from 7 s to 8 s, and nowhere else. Use the selected-time fields and Edit ▸ Set Digitals On, or RightClick-and-slide along its row.',
        triggers: ['set-digital', 'draw-digital-done'],
        setup: [...clearLight('light-2'), { type: 'select-channel', id: 'light-2' }],
        validate: digitalPattern('light-2', 'Light 2', [[0, 1], [7, 8]]),
        success: 'Light 2 is ON for 0–1 s and 7–8 s.',
      }),
      practice('play', {
        target: 'play',
        title: 'Play',
        explain: 'Watch the Light 2 lantern in the simulated float.',
        instruction: 'Press Play on the Control Window.',
        triggers: ['play'],
        validate: ({ sim, action }) => (action?.type === 'play' && sim.mode === 'play'
          ? { ok: true, message: 'Playing: the Light 2 lantern is lit for the first second, dark until second 7, and lit for the last second.' }
          : { ok: false, message: 'Press Play on the Control Window.' }),
        success: 'Playback runs.',
      }),
      practice('stop', {
        target: 'stop',
        title: 'Stop',
        explain: 'Always end a show you started.',
        instruction: 'Press Stop, or let the show reach the red Stop marker.',
        triggers: ['stop', 'playback-complete'],
        validate: ({ action }) => (action?.type === 'stop' || action?.type === 'playback-complete'
          ? { ok: true, message: 'Done. Every step was checked against what you actually did, and nothing left this computer.' }
          : { ok: false, message: 'Press Stop or let the show reach the red Stop marker.' }),
        success: 'Playback has ended.',
      }),
      question('q-sent', {
        target: 'play',
        title: 'Check your understanding',
        explain: 'The contract of this trainer.',
        question: {
          prompt: 'What was sent to the controller during this assignment?',
          options: ['Nothing: the trainer is offline and simulation only', 'The command 64 over COM3', 'The Light 2 schedule over DMX-512'],
          correct: 0,
          why: 'No serial, DMX, or network library exists in this app; every result you saw was simulated.',
          hints: ['', 'The terminal reproduces the photos; it is not connected to a port.', 'The training channels have no real DMX address and no DMX output exists.'],
        },
      }),
    ],
  },
];
