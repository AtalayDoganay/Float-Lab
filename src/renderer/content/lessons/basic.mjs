// Basic level: the practical essentials. The interface, the graphs, the simple
// terms, what the controls do, how a number becomes a hydraulic movement, and
// two complete assignments. Every statement is backed by the photos or the
// manuals read for this app; see references.mjs for the citations. Practice
// happens in the recreated PC•MACs windows themselves.
import { explain, practice, question, classicQuestion, exerciseStep, digitalPattern, clearLight } from './steps.mjs';
import { FLOW_PARTS } from '../curriculum.mjs';
import { formatPercent, FPS } from '../../logic/simulation.mjs';

const SIM = 'In this trainer nothing leaves the computer. No command is sent to any controller or mechanism.';

// Axis 0 holds 255 from 1 s to 3 s (frames 30-89), allowing three frames of slack at each edge.
function axis0At255({ sim }) {
  const v = sim.analogs[0];
  const inside = v.slice(33, 87);
  if (inside.every((x) => x === 255)) {
    const before = v.slice(0, 27).every((x) => x !== 255);
    const after = v.slice(93).every((x) => x !== 255);
    if (before && after) return { ok: true, message: 'Axis 0 now holds 255, 100.0%, from 1 s to 3 s: its trace runs along the top line there and returns to the old data either side.' };
    return { ok: false, message: 'Axis 0 reaches 255 between 1 s and 3 s, but also outside it. Select only 00:00:01.00 to 00:00:03.00 on Axis 0 before using Set Analogs to a Value.' };
  }
  const first = inside.find((x) => x !== 255);
  return { ok: false, message: `Between 1 s and 3 s Axis 0 still reads ${first} in places (${formatPercent(first)}). Select 00:00:01.00 to 00:00:03.00 on Axis 0, choose Edit ▸ Set Analogs to a Value..., type 255 with Decimal chosen, and press OK.` };
}

export const BASIC_LESSONS = [
  {
    id: 'b-system',
    group: 'interface',
    title: 'How a click becomes movement',
    summary: 'The three jobs in a show-control system: the show, the controller, the mechanism.',
    reveal: ['title'],
    steps: [
      explain('show', {
        title: FLOW_PARTS[0].label,
        explain: `${FLOW_PARTS[0].text} PC•MACs is where the team builds the show. The windows on the right recreate its interface from the manufacturer’s manual and the team’s photos.`,
        example: 'Think of a performance: the show is the script.',
        concept: 'concept:pcmacs',
      }),
      explain('controller', {
        title: FLOW_PARTS[1].label,
        explain: `${FLOW_PARTS[1].text} In the workshop photos that is the Br-EFB card inside the enclosure labeled BIG BERTHA, read through the Terminal - COM3 window.`,
        example: 'The controller follows the script.',
        concept: 'example:electronics-enclosure',
      }),
      explain('actuator', {
        title: FLOW_PARTS[2].label,
        explain: `${FLOW_PARTS[2].text} Photo 04 shows a linear actuator on the workshop table. Software, controller, and mechanism have different jobs. The simulated float under the windows stands in for the mechanism.`,
        example: 'The mechanism performs the action.',
        concept: 'example:motion-linear-actuator',
        mechanism: { text: 'An actuator may be hydraulic, pneumatic, or electric; the Br-EFB closes a position loop around it.', evidence: 'manual' },
      }),
      classicQuestion('q-movement', 'l01q1', { explain: 'Which part actually moves?' }),
      classicQuestion('q-timing', 'l01q2', { explain: 'When something happens is part of the plan.' }),
    ],
  },
  {
    id: 'b-interface',
    group: 'interface',
    title: 'What you are looking at',
    summary: 'The menu bar, the Edit View one pane at a time, the Control Window, and how to get help on any control.',
    reveal: ['title'],
    steps: [
      explain('what-is-pcmacs', {
        title: 'PC•MACs and this trainer',
        explain: 'PC•MACs is the Windows program the team uses to build a show: a value for every output on every frame. The grey area on the right recreates its windows, following the PC•MACs manual (January 13, 2021 edition). It is a simulation: an independent trainer, not the real program.',
        example: 'A show is like a script for the float: it says what each light and movement should be doing at every moment.',
        concept: 'concept:pcmacs',
        mechanism: { text: SIM, evidence: 'simplified' },
      }),
      explain('menus', {
        target: 'menu-realtime',
        title: 'The menu bar',
        explain: 'Every PC•MACs command is in the menu bar: File, Edit, RealTime, Offline, Channels, Preferences, and Help. While the Edit View is active, Time Out, Time In, Values Out, and Values In appear too; they zoom the view. Click a menu to look inside. Commands the trainer does not simulate say so instead of pretending.',
        example: 'RealTime ▸ Show Main Controls (F4) brings the Control Window to the front.',
        concept: 'concept:offline-editing-window',
      }),
      explain('ruler', {
        target: 'time-ruler', reveal: ['ruler'],
        title: 'Time runs left to right',
        explain: 'The window titled Edit View is the OffLine Editing Window. The ruler along its top is show time: each second is labeled “0 min” over “02 sec” and so on, with frame numbers between. The training show is eight seconds long at 30 frames per second.',
        example: 'Something that should happen four seconds into the show sits under the “04 sec” label.',
        concept: 'concept:timeline',
      }),
      explain('analog-pane', {
        target: 'analog-pane', reveal: ['analog'],
        title: 'The upper pane: analog, 0–100%',
        explain: 'Analog (variable-level) channels are drawn in the upper pane, 0% at the bottom and 100% at the top, each in its own colour with its name at the lower left. Here the four analogs are the Br-EFB’s four axes. The lines step once per frame, which is why they look like stairs.',
        example: 'A dimmer at half brightness or an arm halfway along its travel would both be drawn near the 50.0% line.',
        concept: 'concept:offline-editing-window',
      }),
      explain('digital-pane', {
        target: 'digital-pane', reveal: ['digital'],
        title: 'The lower pane: digital, on or off',
        explain: 'Digital (on/off) channels are rows in the lower pane, names at the left. OFF is a thin grey line; ON is drawn as a thick black bar for as long as the output is on.',
        example: 'Light 1 is ON from 2 s to 4 s in the training show: a black bar between the “02 sec” and “04 sec” labels.',
        concept: 'concept:offline-editing-window',
      }),
      explain('transport', {
        target: 'transport-markers', reveal: ['transport'],
        title: 'The Control Window and its markers',
        explain: 'The Control Window plays the show. Its Start and Stop times are the green and the dashed red vertical lines on the Edit View; Punch In and Punch Out are the blue and orange ones. The big readout is the show time, written hours:minutes:seconds.frames.',
        example: '00:00:02.00 is two seconds into the show.',
        concept: 'concept:frame-rate',
      }),
      practice('help', {
        target: 'help-button',
        title: 'Every control explains itself',
        explain: 'Rest the pointer on any control, or Tab to it, for a short note. For the full help (purpose, when to use it, an example, common mistakes, the expected result) press F1 on a focused control, or press Help ? at the top and then click any control. The Handbook button opens the searchable handbook at any time.',
        instruction: 'Open the full help for any control: press Help ? and click a control, or focus a control and press F1.',
        triggers: ['help-open'],
        validate: ({ action }) => (action?.type === 'help-open'
          ? { ok: true, message: `You opened the help for “${action.name}”. Close it with Esc or Close; the windows stay exactly as they were.` }
          : { ok: false, message: 'Press Help ? at the top and then click a control, or focus a control and press F1.' }),
        success: 'A help dialog opens and closes without changing anything in the windows.',
      }),
      question('q-panes', {
        target: 'digital-pane',
        title: 'Check your understanding',
        explain: 'Two panes, two kinds of channel.',
        question: {
          prompt: 'Which pane of the Edit View shows ON/OFF channels?',
          options: ['The lower, digital pane', 'The upper, analog pane', 'The time ruler'],
          correct: 0,
          why: 'Digital channels are rows in the lower pane; analog 0–100% channels are drawn above them.',
          hints: ['', 'The upper pane is for analog levels drawn 0–100%.', 'The ruler shows time, not channels.'],
        },
      }),
    ],
  },
  {
    id: 'b-terminal',
    group: 'interface',
    title: 'The Terminal - COM3 window',
    summary: 'What the photographed terminal is, what its header says, and the one key you will press first.',
    reveal: ['terminal'],
    steps: [
      explain('gilderterm', {
        target: 'term-menu',
        title: 'A terminal inside PC•MACs',
        explain: 'The window titled “Terminal - COM3” is GilderTerm, the serial terminal built into PC•MACs (RealTime ▸ Show GilderTerm). The text inside is the controller card’s own configuration menu, sent over the computer’s COM3 port. The trainer reproduces it from the team’s photos.',
        example: 'When the team lead reads settings off the card in the workshop, this is the screen they are reading.',
        concept: 'concept:gilderterm',
      }),
      explain('header', {
        target: 'term-menu',
        title: 'The header lines',
        explain: 'The first lines name the card (Electronic Feedback Card, version 1.98), its Serial Address 1, and its IP address 192.168.0.10. “NO ADL FILE!” means no AutoDownload show file is stored on the card. By itself that is a status message, not a fault.',
        concept: 'concept:adl-file',
      }),
      explain('menu-lines', {
        target: 'term-menu',
        title: 'Menu lines and the table',
        explain: 'Each menu line starts with the key that selects it. The table on the right lists the four axes. Only keys whose responses were photographed are simulated; any other key says so instead of inventing a response.',
        example: 'Click “k) feedback conf” or type k: the feedback menu from photo 09 appears.',
      }),
      practice('press-k', {
        target: 'term-menu',
        title: 'Switch to the feedback menu',
        explain: 'The k key toggles between the main configuration menu and the feedback configuration menu. Both were photographed.',
        instruction: 'Click the line “k) feedback conf”, or click the terminal text and type k.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal }) => {
          if (terminal.screen === 'feedback') return { ok: true, message: 'The feedback configuration menu is showing: DMX-512 Addr, Prop Gain, Int Gain, Der Gain, Rev Out. Press k again to return.' };
          if (terminal.screen === 'network') return { ok: false, message: 'You opened Network Settings (key 6). Press x to discard and return, then press k.' };
          if (terminal.prompt) return { ok: false, message: 'A prompt is open. Answer it or press Enter, then press k.' };
          return { ok: false, message: 'Still on the main menu. Press k to switch to the feedback menu.' };
        },
        success: 'The feedback menu replaces the main menu.',
      }),
      classicQuestion('q-com-vs-ip', 'l04q2', { target: 'term-menu', explain: 'COM3 and 192.168.0.10 appear in the same window but are different kinds of address.' }),
    ],
  },
  {
    id: 'b-timeline-graph',
    group: 'graphs',
    title: 'Reading the timeline',
    summary: 'Seconds and frames, drawing a digital ON, and the show time.',
    reveal: ['title', 'ruler', 'digital'],
    steps: [
      explain('seconds', {
        target: 'time-ruler',
        title: 'Seconds and frames',
        explain: `Each second on the ruler is ${FPS} frames, and every frame is a separate cue. Times are written hours:minutes:seconds.frames, so 00:00:05.00 is five seconds in and 00:00:05.15 is half a second later.`,
        example: 'A lantern lit from second 2 to second 4 is ON for 60 frames.',
        concept: 'concept:frame-rate',
      }),
      explain('block-states', {
        target: 'digital-pane',
        title: 'Select a stretch, then set it ON',
        explain: 'To change a digital exactly, select it for a stretch of time and use the Edit menu. LeftClick on the channel’s row and slide right: that channel is selected over the yellow stretch, and its line gets fatter there. Edit ▸ Set Digitals On (Ctrl+1) turns the selected stretch ON; Set Digitals Off (Ctrl+0) turns it OFF. You can also type the start and end times into the two fields joined by -> under the panes.',
        demo: { intro: 'Watch Light 1 selected from 4 s to 5 s, set ON, then set OFF again.', actions: [{ type: 'select-range', from: 120, to: 150, channels: ['light-1'] }, { wait: 900 }, { type: 'set-digital', on: true }, { wait: 1100 }, { type: 'set-digital', on: false }, { wait: 300 }, { type: 'select-range', from: 0, to: 0, channels: [] }], outro: 'The yellow stretch was the selection; the thick black bar meant ON; Set Digitals Off removed it.' },
        concept: 'concept:offline-editing-window',
      }),
      practice('turn-on-5', {
        target: 'digital-pane',
        title: 'Light 1 ON from 5 s to 6 s only',
        explain: 'Every other part of the Light 1 row should stay OFF. Selecting 00:00:05.00 to 00:00:06.00 gives exactly 30 frames.',
        instruction: 'Select Light 1 from 5 s to 6 s (drag along its row, or type 00:00:05.00 and 00:00:06.00 into the selected-time fields and click the name Light 1 Digital), then choose Edit ▸ Set Digitals On.',
        triggers: ['set-digital', 'draw-digital-done'],
        setup: [...clearLight('light-1'), { type: 'select-channel', id: 'light-1' }],
        validate: digitalPattern('light-1', 'Light 1', [[5, 6]]),
        success: 'Light 1 is drawn ON from 00:00:05.00 to 00:00:06.00 and nowhere else.',
      }),
      explain('playhead', {
        target: 'time-readout', reveal: ['transport'],
        title: 'The show time',
        explain: 'Play on the Control Window runs the show from the Start time. The big readout counts hours:minutes:seconds.frames, and a thin black line moves across the Edit View at the frame being played. Stop halts it where it is.',
        example: '00:00:02.15 is two seconds and fifteen frames, half a second past the two-second mark.',
        demo: { intro: 'Watch the readout and the moving line for about three seconds.', actions: [{ type: 'play' }, { wait: 2600 }, { type: 'stop' }], outro: 'Stop left the readout where playback stopped and the show data unchanged.' },
        concept: 'concept:frame-rate',
      }),
      question('q-frames', {
        target: 'time-readout',
        title: 'Check your understanding',
        explain: 'Hours, minutes, seconds, frames.',
        question: {
          prompt: 'The readout shows 00:00:02.15. Where is the show?',
          options: ['Two seconds and fifteen frames in, half a second past the 2 s mark', '2.15 seconds in', 'Two minutes and fifteen seconds in'],
          correct: 0,
          why: 'The last two digits are frames, and at 30 frames per second fifteen frames is half a second.',
          hints: ['', 'The digits after the dot are frames, not hundredths of a second.', 'Minutes are the second pair; this show is only eight seconds long.'],
        },
      }),
    ],
  },
  {
    id: 'b-analog-graph',
    group: 'graphs',
    title: 'Reading the analog graph',
    summary: 'A trace is show data; set it with Set Analogs to a Value; the live output and the simulated position are separate.',
    reveal: ['title', 'ruler', 'analog'],
    steps: [
      explain('command-line', {
        target: 'analog-pane',
        title: 'A trace is the show’s plan for one axis',
        explain: 'Each coloured trace is one analog channel’s show data: the value it will be sent on every frame, drawn 0–100%. Moving the pointer over the pane shows the time and value at the cursor at the bottom left, and the channel under the cursor at the bottom right.',
        example: 'The blue Axis 0 trace rises from 25% at 1 s to 75% at 4 s: the training show asks that axis to move during those three seconds.',
        demo: { intro: 'Watch Axis 3 set to 25% from 2 s to 6 s, then back to its earlier value.', actions: [{ type: 'set-analog-value', axis: 3, fromSec: 2, toSec: 6, value: 64 }, { wait: 1200 }, { type: 'set-analog-value', axis: 3, fromSec: 2, toSec: 6, value: 166 }], outro: 'The magenta trace dropped to the 25.0% line and came back.' },
        concept: 'concept:0-255',
      }),
      practice('to-255', {
        target: 'menu-edit',
        title: 'Set Axis 0 to 255 from 1 s to 3 s',
        explain: '255 is the top of the 8-bit range: 100%. Select the stretch on the analog, then Edit ▸ Set Analogs to a Value... (Ctrl+2) opens “Set to value (0 - 255):”.',
        instruction: 'Select Axis 0 from 00:00:01.00 to 00:00:03.00 (drag along the blue trace, or type the two times and click the name Axis 0 DMX 6), choose Edit ▸ Set Analogs to a Value..., type 255 with Decimal chosen, and press OK.',
        triggers: ['set-analog-value'],
        setup: [{ type: 'reset-analogs' }, { type: 'select-range', from: 0, to: 0, channels: [] }],
        validate: axis0At255,
        success: 'The blue trace runs along the 100.0% line from 1 s to 3 s.',
      }),
      explain('measurement-line', {
        target: 'measure-readout', reveal: ['measure'],
        title: 'Output and simulated position are different things',
        explain: 'Under the windows, the simulated float shows the selected axis. The pink bar is the commanded output; the dashed line is the trainer’s simulated position, a teaching model of a mechanism catching up. A command says “go there”; a measurement says “I am there”. Neither is drawn by PC•MACs itself.',
        demo: { intro: 'Watch the simulated position climb toward the output for a moment.', actions: [{ type: 'reset-measure' }, { type: 'run-measure' }, { wait: 1800 }, { type: 'run-measure' }], outro: 'The error shrank as the dashed line approached the output.' },
        concept: 'concept:command-vs-measurement',
        mechanism: { text: 'On the real card the Br-EFB compares the commanded position with the sensor reading and drives the valve or motor by the difference.', evidence: 'manual' },
      }),
      classicQuestion('q-analog', 'l02q1', { target: 'analog-pane', explain: 'A level that must vary needs a channel that can carry many values.' }),
    ],
  },
  {
    id: 'b-channels',
    group: 'terminology',
    title: 'Channels: digital and analog',
    summary: 'One channel carries one control value; two states or many levels.',
    reveal: ['title', 'ruler', 'analog', 'digital'],
    steps: [
      explain('digital', {
        target: 'channel-select',
        title: 'A digital channel has two states',
        explain: 'Each row in the lower pane is one digital channel: one thing that can be switched ON or OFF. Light 1 and Light 2 are training channels with no real DMX address.',
        example: 'A relay that lights a lantern is a good fit for a digital channel.',
        concept: 'concept:channel',
      }),
      explain('analog', {
        target: 'axis-select',
        title: 'An analog channel carries a level',
        explain: 'Each trace in the upper pane is one analog channel. Its name at the lower left, such as “Axis 2 DMX 8”, is in the trace’s colour. Analog here means a variable control function; the data still travels digitally.',
        example: 'An arm that should stop at 40% of its travel needs a level, not a switch.',
        concept: 'concept:channel',
      }),
      practice('pick-light-2', {
        target: 'channel-select',
        title: 'Select Light 2 by its name',
        explain: 'Clicking a name in the left margin selects that channel; the name gets a grey box. <Ctrl>+Click adds or removes channels from the selection.',
        instruction: 'Click the name “Light 2 Digital” at the left of the digital pane.',
        triggers: ['select-channel'],
        setup: [{ type: 'select-channel', id: 'light-1' }],
        validate: ({ sim }) => (sim.channelId === 'light-2'
          ? { ok: true, message: 'Light 2 is selected: its name is boxed, and Edit menu commands will act on its row.' }
          : { ok: false, message: 'Light 1 is still the selected digital. Click the name Light 2 Digital.' }),
        success: 'Light 2 Digital is boxed as selected.',
      }),
      classicQuestion('q-on-state', 'l02q2', { target: 'digital-pane', explain: 'ON tells you the state of the command, nothing about distance or speed.' }),
    ],
  },
  {
    id: 'b-values',
    group: 'terminology',
    title: '0–255: a value, not a distance',
    summary: '256 values, the percent formula, the Soft Console, and why 128 is not 128 centimetres.',
    reveal: ['title', 'ruler', 'analog', 'command'],
    steps: [
      explain('256', {
        target: 'command-readout',
        title: 'Eight bits, 256 values',
        explain: 'The Soft Console (RealTime ▸ Show Soft Console, F5) has a slider per assigned analog, with its Value beside it from 0 to 255: 256 values, because zero counts. Percent of range is value ÷ 255 × 100, so 128 is about 50.2%.',
        example: 'The number has no built-in centimetres, volts, or ohms. What 128 means physically depends on the calibrated endpoints.',
        demo: { intro: 'Watch the Axis 0 Value at 64, 191, and 128.', actions: [{ type: 'set-command', axis: 0, value: 64 }, { wait: 900 }, { type: 'set-command', axis: 0, value: 191 }, { wait: 900 }, { type: 'set-command', axis: 0, value: 128 }], outro: '64 is about 25.1%, 191 about 74.9%, 128 about 50.2%.' },
        concept: 'concept:0-255',
      }),
      exerciseStep('set-128', 'read-command:rc-command', { setup: [{ type: 'set-command', axis: 2, value: 100 }] }),
      classicQuestion('q-count', 'l03q1', { target: 'command-readout' }),
      classicQuestion('q-distance', 'l03q2', { target: 'command-readout' }),
    ],
  },
  {
    id: 'b-identifiers',
    group: 'terminology',
    title: 'Card, axis, and DMX address',
    summary: 'Three different numbers on one photographed screen.',
    reveal: ['title', 'ruler', 'analog', 'terminal'],
    steps: [
      explain('axis', {
        target: 'axis-select',
        title: 'An axis is one movement on the card',
        explain: 'The Br-EFB card has four axes, 0 to 3. The photographed table pairs each with a displayed DMX address: 6 (0), 7 (1), 8 (2), 9 (3). First Channel is 6 and the display is 0-based, so axis n shows 6 + n. The trainer names the analogs to match, for example “Axis 2 DMX 8”. The two windows are separate: selecting a channel in PC•MACs does not move the card’s arrow, and the card’s “s) axis to modify” does not select anything in PC•MACs.',
        example: 'The analog named Axis 2 DMX 8 and the terminal row “8 (2)” describe the same output, reached two different ways.',
        demo: { intro: 'Watch Axis 2 DMX 8 selected in the Edit View, then s and 2 typed in the terminal: two separate actions.', actions: [{ type: 'select-axis', axis: 2, select: true }, { wait: 1000 }, { type: 'term-key', key: 's' }, { wait: 700 }, { type: 'term-key', key: '2' }, { wait: 900 }, { type: 'select-axis', axis: 0, select: true }, { type: 'term-key', key: 's' }, { type: 'term-key', key: '0' }], outro: 'Each window changed only when you acted in it. The name and the row both point at DMX 8.' },
        concept: 'concept:card-axis-channel',
      }),
      exerciseStep('select-axis-2', 'read-command:rc-axis', { setup: [{ type: 'select-axis', axis: 0 }] }),
      exerciseStep('q-dmx-for-2', 'read-command:rc-channel'),
      explain('card', {
        target: 'term-card', reveal: ['term-toolbar'],
        title: 'The card address is a fourth number',
        explain: 'The Card field in the toolbar, photographed as 1, is the serial address GilderTerm appends to its commands so the right card answers. It is not an axis, not a DMX address, not the COM port, and not part of the IP address.',
        concept: 'concept:card-axis-channel',
      }),
      classicQuestion('q-axis-8', 'l04q1', { target: 'term-menu', explain: 'Read the row written “8 (2)” in the photographed table.' }),
    ],
  },
  {
    id: 'b-play-stop',
    group: 'functions',
    title: 'Play and Stop',
    summary: 'Run the show from the Control Window, watch the result, and always stop it.',
    reveal: ['title', 'ruler', 'digital', 'transport'],
    steps: [
      explain('play', {
        target: 'play',
        title: 'Play runs the show from the Start time',
        explain: 'Play (F1 in PC•MACs; here F1 is the trainer’s help key, so use the button or RealTime ▸ Play) runs the show from the green Start marker to the dashed red Stop marker. The button for the current mode is drawn black. The lanterns in the simulated float follow the digital channels frame by frame.',
        example: 'With Light 1 ON from 2 s to 4 s, its lantern is dark for two seconds, lit for two, then dark again.',
        demo: { intro: 'Watch two and a half seconds of playback, then Stop.', actions: [{ type: 'set-digital-pattern', channelId: 'light-1', seconds: [[2, 4]] }, { type: 'play' }, { wait: 2500 }, { type: 'stop' }], outro: 'The line reached 2 s, the Light 1 lantern lit, then Stop ended playback.' },
        mechanism: { text: `PC•MACs’ Play sends values to connected gear. ${SIM}`, evidence: 'manual' },
        concept: 'concept:timeline',
      }),
      exerciseStep('press-play', 'schedule-light:sl-play', { setup: [{ type: 'stop' }] }),
      explain('stop', {
        target: 'stop',
        title: 'Stop ends playback immediately',
        explain: 'Stop (the space bar in PC•MACs) halts the show where it is; the show data is untouched. Pause stops too but lets Continue carry on from the same frame.',
        example: 'Leaving a show running when you walk away is a habit to avoid on real equipment.',
      }),
      exerciseStep('press-stop', 'schedule-light:sl-watch'),
      classicQuestion('q-instant', 'l07q2', { target: 'play', explain: 'A target change is a request; a mechanism takes time to move.' }),
    ],
  },
  {
    id: 'b-terminal-keys',
    group: 'functions',
    title: 'Terminal keys that are photographed',
    summary: 'Select an axis, step through axes, and leave configuration mode.',
    reveal: ['terminal', 'term-toolbar'],
    steps: [
      explain('s-key', {
        target: 'term-menu',
        title: 's) axis to modify',
        explain: 'Pressing s makes the card ask “Enter the axis (0 - 3):”, exactly as photo 03 shows. Typing a digit moves the arrow to that axis: the axis the card’s setting keys will change. It is the card’s own menu, so nothing in the PC•MACs windows changes.',
        demo: { intro: 'Watch s, then 1, select axis 1; then s and 0 return to axis 0.', actions: [{ type: 'term-reset' }, { type: 'term-key', key: 's' }, { wait: 900 }, { type: 'term-key', key: '1' }, { wait: 1200 }, { type: 'term-key', key: 's' }, { wait: 700 }, { type: 'term-key', key: '0' }], outro: 'The prompt appeared, the digit answered it, and the arrow moved.' },
        concept: 'control:term-menu',
      }),
      practice('select-axis-3', {
        target: 'term-input',
        title: 'Select axis 3 through the terminal',
        explain: 'Click the terminal text and type, or use the trainer’s key box under the window: one key per Enter. The prompt only accepts 0 to 3.',
        instruction: 'Type s, then 3.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal }) => {
          if (terminal.axis === 3 && !terminal.prompt) return { ok: true, message: 'Axis 3 is selected on the card. The arrow points at the row “9 (3)”.' };
          if (terminal.prompt === 'axis') return { ok: false, message: 'The prompt “Enter the axis (0 - 3):” is waiting. Type 3.' };
          if (terminal.prompt) return { ok: false, message: 'A different prompt is open. Answer it, then press s and 3.' };
          return { ok: false, message: `Axis ${terminal.axis} is selected. Press s to open the axis prompt, then type 3.` };
        },
        success: 'The arrow sits on the row “9 (3)”.',
      }),
      explain('n-l', {
        target: 'term-menu',
        title: 'n) Next and l) Last',
        explain: 'n moves the arrow down one axis and l moves it up, wrapping around at the ends. Both appear in the photographed footer.',
        demo: { intro: 'Watch n, n, then l.', actions: [{ type: 'term-key', key: 'n' }, { wait: 800 }, { type: 'term-key', key: 'n' }, { wait: 800 }, { type: 'term-key', key: 'l' }], outro: 'Down, down, up.' },
      }),
      practice('press-n', {
        target: 'term-menu',
        title: 'Move the arrow to axis 2 with n',
        explain: 'Starting from axis 1, one press of n lands on axis 2.',
        instruction: 'Click “n) Next” in the footer, or click the terminal text and type n.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }, { type: 'term-axis', axis: 1 }],
        validate: ({ terminal, action }) => {
          if (terminal.axis === 2 && action?.key === 'n') return { ok: true, message: 'The arrow moved from axis 1 to axis 2, the row “8 (2)”.' };
          if (terminal.axis === 2) return { ok: true, message: 'Axis 2 is selected. Next time try the n key: it steps down one row without a prompt.' };
          return { ok: false, message: `The arrow is on axis ${terminal.axis}. Press n once from axis 1 to reach axis 2.` };
        },
        success: 'The arrow sits on the row “8 (2)”.',
      }),
      explain('exit', {
        target: 'term-config-done',
        title: 'Leaving configuration mode',
        explain: 'The manual says to always exit configuration mode before leaving GilderTerm: press Config Done, or type x and answer Y. A card left in configuration mode may not respond normally to show commands.',
        concept: 'control:term-config-done',
        mechanism: { text: 'On the real card these keys change live settings. Changing them without the team lead can make an axis over-travel or move unexpectedly.', evidence: 'manual' },
      }),
      question('q-s-key', {
        target: 'term-menu',
        title: 'Check your understanding',
        explain: 'Three photographed keys, three different jobs.',
        question: {
          prompt: 'Which key opens the prompt “Enter the axis (0 - 3):”?',
          options: ['s', 'a', 'k'],
          correct: 0,
          why: '“s) axis to modify” asks for the axis number (photo 03).',
          hints: ['', 'a asks for the card address, 0 to 255 (photo 01).', 'k switches between the main and feedback menus.'],
        },
      }),
    ],
  },
  {
    id: 'b-hydraulics',
    group: 'hydraulics',
    title: 'From a number to a cylinder',
    summary: 'Actuators, endpoints, feedback, Manual mode, and what the references leave open.',
    reveal: ['title', 'ruler', 'analog', 'command', 'measure', 'terminal'],
    steps: [
      explain('actuator', {
        title: 'What an actuator is',
        explain: 'The Br-EFB manual defines an actuator as a mechanical device that moves something, powered by hydraulics, compressed air, or an electric motor. The card closes up to four position-feedback loops, one per axis. Photo 04 shows a linear actuator on the workshop table; whether the team’s float rig is hydraulic, pneumatic, or electric is not established by the references.',
        example: 'A hydraulic cylinder lifting a float element is one actuator on one axis.',
        concept: 'example:hydraulics-cylinder',
        mechanism: { text: 'For a hydraulic cylinder, the card drives a valve by the difference between command and measured position.', evidence: 'manual' },
      }),
      explain('endpoints', {
        target: 'term-menu',
        title: 'Min Scale and Max Scale are the ends of travel',
        explain: 'In the photographed table, Min Scale is the end of travel reached at a 0% command and Max Scale the end reached at 100%, entered on the 0–255 scale. The manual says they are adjusted so a movement stops short of its mechanical limits, which protects the linkage. The photographed 61 / 147 and the other rows are one snapshot, not centimetres and not recommendations.',
        concept: 'concept:calibration',
        mechanism: { text: 'Endpoints set too wide let a cylinder hit its mechanical stop; too narrow and the element never reaches its pose.', evidence: 'manual' },
      }),
      explain('manual-mode', {
        target: 'manual-mode', reveal: ['transport'],
        title: 'Manual mode puts the Soft Console in charge',
        explain: 'With the Control Window’s Manual checkbox on (F3), the Soft Console sliders drive the outputs live, so you can feel a movement before programming it (manual p. 204). With it off and the show stopped, the trainer holds the show’s values; the Soft Console does not reach the outputs.',
        demo: { intro: 'Watch Manual turn on, then the Axis 0 slider move the commanded output in the simulated float.', actions: [{ type: 'select-axis', axis: 0 }, { type: 'set-manual', on: true }, { wait: 700 }, { type: 'set-command', axis: 0, value: 220 }, { wait: 1000 }, { type: 'set-command', axis: 0, value: 128 }], outro: 'With Manual on, the slider was the output.' },
        mechanism: { text: 'On real equipment, Manual mode moves the figure as you move the slider. Clear the area first.', evidence: 'manual' },
      }),
      explain('feedback', {
        target: 'measure-readout',
        title: 'Feedback: the sensor says where it really is',
        explain: 'A position sensor on the actuator reports back to the card, which compares that measurement with the command. The trainer’s dashed line stands in for that measurement, as a simple approach model with no mass, friction, or gains.',
        example: 'A potentiometer is one common sensor: movement changes a resistance ratio and the sensed voltage.',
        concept: 'concept:feedback',
      }),
      exerciseStep('run-model', 'read-command:rc-measure', { setup: [{ type: 'set-manual', on: true }, { type: 'set-command', axis: 0, value: 128 }, { type: 'reset-measure' }] }),
      explain('gap', {
        title: 'What the references do not tell you',
        explain: 'The photos do not identify the sensor on the team’s rig, its wiring, or its travel; they do not show which valve or pump is used; and the Velocity Limit column has no entry in the 2018 Br-EFB manual. Confirm those with the team lead or a firmware-matched document before touching real settings.',
        concept: 'example:sensors-position',
      }),
      classicQuestion('q-units', 'l05q2', { target: 'term-menu', explain: 'The screen supplies settings, not their physical units.' }),
    ],
  },
  {
    id: 'b-assign-light',
    group: 'assignments',
    title: 'Assignment: schedule a light',
    summary: 'Select the channel, draw the pattern, play it, stop it.',
    reveal: ['title', 'ruler', 'digital', 'transport'],
    steps: [
      explain('goal', {
        title: 'The task',
        explain: 'Light 1 should be ON from second 2 to second 4 of the eight-second show, and OFF everywhere else. You will select the channel, set the pattern with the Edit menu or the right mouse button, play the show, and stop it. Each step is checked against what you actually do.',
        concept: 'exercise:schedule-light',
      }),
      exerciseStep('channel', 'schedule-light:sl-channel', { setup: [{ type: 'select-channel', id: 'light-2' }] }),
      exerciseStep('blocks', 'schedule-light:sl-blocks', { setup: clearLight('light-1') }),
      exerciseStep('play', 'schedule-light:sl-play'),
      exerciseStep('watch', 'schedule-light:sl-watch'),
      classicQuestion('q-blocks', 'l07q1', { target: 'digital-pane' }),
    ],
  },
  {
    id: 'b-assign-command',
    group: 'assignments',
    title: 'Assignment: read a command',
    summary: 'Select an axis, read its address, set 128 on the Soft Console, and compare with the simulated measurement.',
    reveal: ['title', 'ruler', 'analog', 'command', 'measure', 'terminal'],
    steps: [
      explain('goal', {
        title: 'The task',
        explain: 'Select axis 2 from the photographed mapping, identify its displayed DMX address, set its Soft Console slider to exactly 128, read it as a percentage, and run the measurement model to compare a request with a simulated result.',
        concept: 'exercise:read-command',
      }),
      exerciseStep('axis', 'read-command:rc-axis', { setup: [{ type: 'select-axis', axis: 0 }] }),
      exerciseStep('address', 'read-command:rc-channel'),
      exerciseStep('command', 'read-command:rc-command', { setup: [{ type: 'set-command', axis: 2, value: 100 }] }),
      exerciseStep('percent', 'read-command:rc-percent'),
      exerciseStep('measure', 'read-command:rc-measure', { reveal: ['transport'], setup: [{ type: 'set-manual', on: true }, { type: 'reset-measure' }] }),
    ],
  },
];
