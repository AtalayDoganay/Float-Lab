// intermediate level: deeper into the same workspace. Frames, the measurement
// model against the real loop, the five identifiers, the GilderTerm toolbar,
// network settings, endpoints and reversal, the feedback menu, and two more
// assignments.
import { explain, practice, question, classicQuestion, exerciseStep, digitalPattern, clearLight } from './steps.mjs';
import { percentOf, formatTime } from '../../logic/simulation.mjs';

export const INTERMEDIATE_LESSONS = [
  {
    id: 'i-frames',
    group: 'graphs',
    title: 'Frames and show time',
    summary: 'Frames, zooming the Edit View, drawing a span, and playing only a selection.',
    reveal: ['title', 'ruler', 'digital', 'transport'],
    steps: [
      explain('fps', {
        target: 'time-readout',
        title: 'Thirty cues every second',
        explain: 'PC•MACs updates most shows at 25 or 30 frames each second, and every frame is a separate cue with a value for every output. Show times are written hours:minutes:seconds.frames. The training show’s last frame is 00:00:07.29, which is where the Control Window’s Stop time sits.',
        demo: { intro: 'Watch the readout for a second and a half.', actions: [{ type: 'play' }, { wait: 1600 }, { type: 'stop' }], outro: 'The last two digits ran from .00 to .29 before each new second.' },
        concept: 'concept:frame-rate',
      }),
      explain('block-frames', {
        target: 'menu-zoom',
        title: 'Time In and Time Out',
        explain: 'Time In and Time Out on the menu bar zoom the Edit View: in, to see single frames; out, to see more of the show. Zoomed in, the ruler labels every few frames and the scroll bar under the panes moves through the show. The fields at the bottom left and right always say what time the window’s edges show.',
        demo: { intro: 'Watch Time In twice, then Time Out twice.', actions: [{ type: 'zoom', dir: 1 }, { wait: 900 }, { type: 'zoom', dir: 1 }, { wait: 1200 }, { type: 'zoom', dir: -1 }, { wait: 600 }, { type: 'zoom', dir: -1 }], outro: 'The show did not change; only how much of it fits in the window.' },
        concept: 'concept:offline-editing-window',
      }),
      practice('blocks-5-6', {
        target: 'digital-pane',
        title: 'Light 1 ON only from 5 s to 7 s',
        explain: 'That is one stretch of 60 frames, 00:00:05.00 to 00:00:07.00. Typing the times is exact; RightClick-and-slide on the row draws it by hand and may be a frame or two off, which the check allows.',
        instruction: 'Make Light 1 ON from 5 s to 7 s and nowhere else, with Edit ▸ Set Digitals On or by RightClick-and-slide along its row.',
        triggers: ['set-digital', 'draw-digital-done'],
        setup: [...clearLight('light-1'), { type: 'select-channel', id: 'light-1' }],
        validate: digitalPattern('light-1', 'Light 1', [[5, 7]]),
        success: 'Light 1 is commanded ON from second 5 to second 7.',
      }),
      practice('play-selection', {
        target: 'digital-pane',
        title: 'Play only the part you are working on',
        explain: 'RightClick on empty space in either pane (away from any line) opens the shortcut menu. Play Selection copies the selected stretch to the Control Window’s Start and Stop times; Loop Selection does the same and ticks Loop (manual p. 80). The green and dashed red lines move to match.',
        instruction: 'Select 00:00:05.00 to 00:00:07.00 (type the times, or drag on empty space), then RightClick on empty space and choose Play Selection.',
        triggers: ['play-selection', 'set-transport-time'],
        setup: [{ type: 'full-show' }, { type: 'select-range', from: 0, to: 0, channels: [] }],
        validate: ({ sim }) => {
          const near = (f, target) => Math.abs(f - target) <= 3;
          if (near(sim.start, 150) && near(sim.stop, 209)) return { ok: true, message: 'Start is 00:00:05.00 and Stop is 00:00:06.29: Play will now run only those two seconds. Set to Full Show on the same menu puts them back.' };
          return { ok: false, message: `Start is ${formatTime(sim.start)} and Stop is ${formatTime(sim.stop)}. Select 00:00:05.00 to 00:00:07.00 first, then RightClick on empty space between the rows and choose Play Selection.` };
        },
        success: 'The green line sits at 5 s and the dashed red line just before 7 s.',
      }),
      question('q-frame-count', {
        target: 'time-readout',
        title: 'Check your understanding',
        explain: 'Seconds and frames.',
        question: {
          prompt: 'At 30 frames per second, how many frames does Light 1 being ON from 5 s to 7 s cover?',
          options: ['60', '2', '30'],
          correct: 0,
          why: 'Two seconds at 30 frames each is 60 frames, each a separate cue.',
          hints: ['', 'Two is the number of seconds; multiply by the frame rate.', 'Thirty frames is one second; the span covers two.'],
        },
      }),
      question('q-end', {
        target: 'transport-markers',
        title: 'Check your understanding',
        explain: 'The dashed red line.',
        question: {
          prompt: 'Playback reaches the Stop time, the dashed red line. What happens next?',
          options: ['Playback stops, unless Loop is ticked, in which case it starts again at the Start time', 'The show always loops forever', 'The card restarts'],
          correct: 0,
          why: 'The Control Window’s Loop checkbox (Ctrl+L) decides: off, playback stops at the Stop time; on, it goes back to the Start time (manual p. 205).',
          hints: ['', 'Only with Loop ticked.', 'Nothing here talks to a card at all.'],
        },
      }),
    ],
  },
  {
    id: 'i-measurement',
    group: 'graphs',
    title: 'The measurement model and the real loop',
    summary: 'Error, approach, and what the teaching model leaves out.',
    reveal: ['title', 'ruler', 'analog', 'transport', 'command', 'measure'],
    steps: [
      explain('error', {
        target: 'measure-readout',
        title: 'Error is command minus measurement',
        explain: 'The simulated float shows the error as the commanded output’s percentage minus the simulated position. A positive error means the measurement has not yet reached the request.',
        example: 'Command 50.2%, measurement 30.0%: error 20.2 points.',
        concept: 'concept:command-vs-measurement',
      }),
      practice('watch-error', {
        target: 'measure-run',
        title: 'Run the model, then pause it under 10 points of error',
        explain: 'The model moves a fraction of the remaining gap each tick, so the error shrinks quickly at first and slowly near the end.',
        instruction: 'Manual is on and the slider reads 192. In the simulated float, press Run model, then press Pause model once the error is below 10 points.',
        triggers: ['run-measure'],
        setup: [{ type: 'set-manual', on: true }, { type: 'set-command', value: 192 }, { type: 'reset-measure' }],
        validate: ({ sim }) => {
          // The same error the simulated float shows: commanded output minus simulated position.
          const error = percentOf(sim.outputs.analogs[sim.axis]) - sim.measured;
          if (!sim.checks.manual) return { ok: false, message: 'Manual is off, so the slider does not reach the output. Tick Manual on the Control Window, press Reset, and run the model again.' };
          if (sim.measuring) return { ok: false, message: `The model is still running (error ${error.toFixed(1)} points). Press Pause model once it is below 10.` };
          if (sim.measured === 0) return { ok: false, message: 'Press Run model to start the simulated measurement.' };
          if (error >= 10) return { ok: false, message: `Paused at ${error.toFixed(1)} points of error. Run it again and wait until the readout is below 10.` };
          return { ok: true, message: `Paused at ${error.toFixed(1)} points. The measurement approached ${percentOf(sim.command).toFixed(1)}% without ever being told how far the real axis would travel.` };
        },
        success: 'The model is paused with an error below 10 points.',
      }),
      explain('not-pid', {
        target: 'measure-readout',
        title: 'What the model is not',
        explain: 'The model has no mass, friction, gains, or overshoot, and it is not a Br-EFB, valve, or PID simulator. On the real card, the P gain compares the commanded and measured positions and the size and direction of the difference set the voltage sent to the valve output.',
        concept: 'concept:pid',
        mechanism: { text: 'Actual response depends on gains, supply, load, and the sensor, none of which the photos establish.', evidence: 'manual' },
      }),
      classicQuestion('q-error', 'l06q1', { target: 'measure-readout' }),
    ],
  },
  {
    id: 'i-five-ids',
    group: 'terminology',
    title: 'Five identifiers that are not interchangeable',
    summary: 'Card address, axis, DMX address, COM port, and IP address.',
    reveal: ['title', 'analog', 'terminal', 'term-toolbar'],
    steps: [
      explain('five', {
        target: 'term-card',
        title: 'Five numbers, five jobs',
        explain: 'Card (serial) address 1 identifies the Br-EFB on the serial network. Axis 0–3 is one movement on that card. DMX-512 addresses 6–9 are the command slots for those axes. COM3 is the computer’s serial port. 192.168.0.10 is the card’s IP address on Ethernet.',
        concept: 'concept:card-axis-channel',
      }),
      explain('first-channel', {
        target: 'term-menu',
        title: 'First Channel 6 and 0-based',
        explain: 'Line c) sets the First Channel to 6 and line f) says the display is 0-based. That is why axis 0 shows 6, axis 1 shows 7, and axis 3 shows 9. These are the photographed values, not universal settings.',
        example: 'If First Channel were 20, axis 2 would display 22.',
      }),
      practice('axis-for-9', {
        target: 'axis-select',
        title: 'Select the axis whose row reads 9',
        explain: 'Work backwards from the displayed address: 9 is 6 + 3.',
        instruction: 'Click the analog name whose DMX address is 9.',
        triggers: ['select-axis'],
        setup: [{ type: 'select-axis', axis: 0 }],
        validate: ({ sim }) => (sim.axis === 3
          ? { ok: true, message: 'Axis 3 displays address 9: First Channel 6 plus 3.' }
          : { ok: false, message: `Axis ${sim.axis} displays address ${6 + sim.axis}. Address 9 belongs to axis 3.` }),
        success: 'Axis 3 DMX 9 is the selected analog.',
      }),
      question('q-com', {
        target: 'term-menu',
        title: 'Check your understanding',
        explain: 'The window title.',
        question: {
          prompt: '“COM3” appears in the terminal window title. What is it?',
          options: ['The computer’s serial port name', 'The card’s third channel', 'The last number of the IP address'],
          correct: 0,
          why: 'COM3 is the Windows name of the serial port GilderTerm talks through.',
          hints: ['', 'Channels are DMX addresses on the card; the port is on the computer.', 'The IP address ends in .10 in the photos and has nothing to do with the port label.'],
        },
      }),
      question('q-card-vs-dmx', {
        target: 'term-card',
        title: 'Check your understanding',
        explain: 'Card Address 1 and DMX address 6 appear on the same screen.',
        question: {
          prompt: 'Are “Card Address 1” and “DMX address 6” two names for the same number?',
          options: ['No: the card address identifies the card on the serial network; the DMX address is an output slot', 'Yes, the card address is always the first DMX address', 'Only when First Channel is set to 1'],
          correct: 0,
          why: 'They live on different networks and identify different things.',
          hints: ['', 'The card address is used by GilderTerm on the serial link; DMX addresses route show values to outputs.', 'First Channel moves the DMX addresses; it does not change what the card address is.'],
        },
      }),
    ],
  },
  {
    id: 'i-toolbar',
    group: 'functions',
    title: 'The GilderTerm toolbar',
    summary: 'Card, Character delay, Clear Screen, Status, Config Done, Control.',
    reveal: ['terminal', 'term-toolbar'],
    steps: [
      explain('card-field', {
        target: 'term-card',
        title: 'Card',
        explain: 'The serial address GilderTerm appends to Status and Configure requests, so only the addressed card answers. Photographed as 1; display only in the trainer.',
        concept: 'control:term-card',
      }),
      explain('delay', {
        target: 'term-delay',
        title: 'Character delay',
        explain: 'A legacy setting that paced outgoing characters for very old PCs. Photographed as None. It never fixes an addressing or cabling problem.',
      }),
      explain('status', {
        target: 'term-status',
        title: 'Status is greyed while configuring',
        explain: 'Status asks the addressed card for a report. The manual says it is unavailable while the card is in configuration mode, which is why it is greyed out in every photo. The grey button is not a fault.',
      }),
      practice('config-done', {
        target: 'term-config-done',
        title: 'Press Config Done',
        explain: 'Config Done tells the card to leave configuration mode; the simulated menu closes.',
        instruction: 'Press the Config Done button in the toolbar.',
        triggers: ['term-button'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal }) => (!terminal.configMode
          ? { ok: true, message: 'The simulated card left configuration mode and the button now reads Configure.' }
          : { ok: false, message: 'The card is still in configuration mode. Press Config Done.' }),
        success: 'The menu is replaced by a note and the button reads Configure.',
      }),
      practice('configure', {
        target: 'term-config-done',
        title: 'Press Configure to reopen the menu',
        explain: 'Configure puts the card back into configuration mode and redraws its main menu.',
        instruction: 'Press Configure.',
        triggers: ['term-button'],
        validate: ({ terminal }) => (terminal.configMode && terminal.screen === 'main'
          ? { ok: true, message: 'Back in configuration mode with the main menu redrawn.' }
          : { ok: false, message: 'The menu is not back yet. Press Configure.' }),
        success: 'The main configuration menu is showing again.',
      }),
      explain('control', {
        target: 'term-control',
        title: 'Control: the GilderCommands window',
        explain: 'In PC•MACs, Control opens a small window that sends serial show commands such as play, stop, loop, and pause to the attached gear. The trainer shows the list read-only; nothing is sent.',
        demo: { intro: 'Open the Control window, then close it.', actions: [{ type: 'term-button', name: 'control' }, { wait: 1800 }, { type: 'term-button', name: 'control' }], outro: 'Every entry says which ASCII character the manual lists for it.' },
      }),
      explain('clear', {
        target: 'term-clear',
        title: 'Clear Screen',
        explain: 'Clears the terminal text only. The card and its settings are untouched; any menu key redraws the menu.',
      }),
      question('q-status', {
        target: 'term-status',
        title: 'Check your understanding',
        explain: 'Grey in every photo.',
        question: {
          prompt: 'Why is the Status button greyed out in every photo?',
          options: ['The card is in configuration mode, where the manual says Status is unavailable', 'The card is broken', 'COM3 is disconnected'],
          correct: 0,
          why: 'The photos show the configuration menu on screen, and the manual says Status cannot be used in that mode.',
          hints: ['', 'A grey button is a mode indicator, not a fault.', 'The menu text on screen proves the serial link is working.'],
        },
      }),
    ],
  },
  {
    id: 'i-network',
    group: 'functions',
    title: 'Network settings',
    summary: 'The photographed network screen, and what IP, mask, and gateway each decide.',
    reveal: ['title', 'network', 'terminal'],
    steps: [
      explain('menu-6', {
        target: 'term-menu',
        title: '6) Network Settings',
        explain: 'Key 6 opens the Br-EFB Network Settings screen photographed in photo 10: DHCP disabled, IP 192.168.0.10, netmask 255.255.255.0, gateway 192.168.0.1, with c) Confirm and x) Discard.',
        demo: { intro: 'Open the network screen, then discard with x.', actions: [{ type: 'term-reset' }, { type: 'term-key', key: '6' }, { wait: 1800 }, { type: 'term-key', key: 'x' }], outro: 'Discard returned to the main menu without changing anything.' },
        concept: 'concept:ip-address',
      }),
      practice('open-network', {
        target: 'term-menu',
        title: 'Open the network screen',
        explain: 'Press 6 from the main menu.',
        instruction: 'Click “6) Network Settings” or type 6 and press Enter.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal }) => (terminal.screen === 'network'
          ? { ok: true, message: 'The network screen is showing the photographed values. Options 1–4 are listed but changing them was never photographed, so they are not simulated.' }
          : { ok: false, message: 'Still on the main menu. Press 6 to open Network Settings.' }),
        success: 'The Br-EFB Network Settings screen replaces the menu.',
      }),
      explain('three-fields', {
        target: 'network-result',
        title: 'IP, mask, gateway',
        explain: 'The IP identifies an interface. The mask says which part of the address is the network: with 255.255.255.0 (/24), 192.168.0 is the network and the last number is the host. The gateway is where traffic for other networks goes. With DHCP disabled, all three are set by hand, as the manual describes.',
        example: 'House number, neighbourhood, and the road out of town. An analogy, not a wiring diagram.',
        concept: 'concept:netmask',
      }),
      exerciseStep('same', 'understand-address:ua-same', { setup: [{ type: 'select-laptop-ip', ip: '192.168.1.20' }] }),
      exerciseStep('different', 'understand-address:ua-different'),
      exerciseStep('duplicate', 'understand-address:ua-duplicate'),
      practice('discard', {
        target: 'term-menu',
        title: 'Leave the network screen with x',
        explain: 'x) Discard settings returns to the main menu. c) Confirm would keep the photographed values; neither sends anything here.',
        instruction: 'Click “x) Discard settings” or type x and press Enter.',
        triggers: ['term-key'],
        validate: ({ terminal, action }) => {
          if (terminal.screen === 'main' && action?.key === 'x') return { ok: true, message: 'Discarded (simulated): back on the main menu, nothing changed.' };
          if (terminal.screen === 'main' && action?.key === 'c') return { ok: true, message: 'Confirmed (simulated): the photographed values were kept. x would have discarded instead.' };
          if (terminal.screen === 'main') return { ok: true, message: 'Back on the main menu.' };
          return { ok: false, message: 'Still on the network screen. Press x to discard and return.' };
        },
        success: 'The main menu is back.',
      }),
      classicQuestion('q-same-subnet', 'l08q1', { target: 'laptop-ip-select' }),
      classicQuestion('q-gateway', 'l08q2', { target: 'network-result' }),
    ],
  },
  {
    id: 'i-calibration',
    group: 'hydraulics',
    title: 'Endpoints and calibration',
    summary: 'Min and Max Scale on the output scale, a hypothetical travel example, and reversed loops.',
    reveal: ['title', 'analog', 'command', 'calibration', 'terminal'],
    steps: [
      explain('min-max', {
        target: 'term-menu',
        title: 'Endpoints are entered on the output scale',
        explain: 'The Br-EFB manual sets Minimum Scale as the end of travel at a 0% command and Maximum Scale at 100%, entered on the 8-bit output scale; its example uses 64 and 192 for roughly 25% and 75%. A minimum set higher than the maximum is allowed and reverses direction.',
        concept: 'concept:calibration',
        mechanism: { text: 'Endpoints are adjusted so a movement stops short of its mechanical ends of travel.', evidence: 'manual' },
      }),
      explain('example-range', {
        target: 'calibration-range',
        title: 'A hypothetical travel range',
        explain: 'The example travel range in the simulated float maps the Soft Console value linearly onto 10, 20, or 40 cm. It exists only to show that the same percentage points to different distances when the calibration changes. It is not a measurement of any float mechanism.',
        demo: { intro: 'Watch the centimetre target change while the command stays at 128.', actions: [{ type: 'set-command', value: 128 }, { type: 'set-calibration', cm: 10 }, { wait: 900 }, { type: 'set-calibration', cm: 40 }, { wait: 900 }, { type: 'set-calibration', cm: 20 }], outro: '50.2% of 10 cm, of 40 cm, of 20 cm: three different targets for one command.' },
      }),
      practice('cal-40', {
        target: 'calibration-range',
        title: 'Command 128 on a 40 cm example',
        explain: '128 ÷ 255 × 40 is about 20.08 cm in this linear example.',
        instruction: 'Choose 40 cm in the example travel range and set the selected axis’s Soft Console slider to 128.',
        triggers: ['set-calibration', 'set-command'],
        setup: [{ type: 'set-calibration', cm: 20 }, { type: 'set-command', value: 100 }],
        validate: ({ sim }) => {
          if (sim.calibrationCm !== 40) return { ok: false, message: `The example range is ${sim.calibrationCm} cm. Choose 40 cm.` };
          if (sim.command !== 128) return { ok: false, message: `The slider reads ${sim.command}. Set it to exactly 128.` };
          return { ok: true, message: 'Command 128 on a 0–40 cm example points to about 20.08 cm. Change the range back to 20 cm and the same command points to about 10.04 cm.' };
        },
        success: 'The readout says about 20.08 cm for command 128.',
      }),
      classicQuestion('q-20cm', 'l05q1', { target: 'calibration-range' }),
      explain('reverse', {
        target: 'term-menu',
        title: 'Reverse Axis Output',
        explain: 'A servo loop wired or plumbed backwards is a phase reversal: when the P gain is first raised, the movement slams to one end. The manual says this is corrected in wiring or with Reverse Axis Output, line 5 of the feedback menu. The photographed Rev Out column reads Yes, No, No, Yes.',
        concept: 'concept:reverse-output',
      }),
      question('q-reverse', {
        target: 'term-menu',
        title: 'Check your understanding',
        explain: 'The manual’s diagnosis.',
        question: {
          prompt: 'Raising the P gain makes a movement slam to one end of travel. What does the manual say is the likely cause?',
          options: ['A phase reversal: wiring or plumbing backwards, fixed in wiring or with Reverse Axis Output', 'The netmask is wrong', 'The show frame rate is too high'],
          correct: 0,
          why: 'Page 100 of the Br-EFB manual describes exactly this symptom and fix.',
          hints: ['', 'Network settings do not change which way an actuator moves.', 'Frame rate is a show property; this symptom is in the servo loop.'],
        },
      }),
    ],
  },
  {
    id: 'i-feedback-menu',
    group: 'hydraulics',
    title: 'The feedback menu and the P gain',
    summary: 'Photo 09, line by line, and what the manual says the P gain does.',
    reveal: ['title', 'analog', 'command', 'measure', 'terminal'],
    steps: [
      explain('open-feedback', {
        target: 'term-menu',
        title: 'k) feedback conf',
        explain: 'The feedback configuration menu lists, per axis, the DMX-512 address, Prop Gain, Int Gain, Der Gain, and Rev Out, with options to set each gain, reverse the output, open Compliance Settings, and More PID Options.',
        demo: { intro: 'Open the feedback menu, then return.', actions: [{ type: 'term-reset' }, { type: 'term-key', key: 'k' }, { wait: 1800 }, { type: 'term-key', key: 'k' }], outro: 'k toggles between the two photographed menus.' },
        concept: 'concept:pid',
      }),
      practice('press-k', {
        target: 'term-menu',
        title: 'Open the feedback menu',
        explain: 'Press k from the main menu.',
        instruction: 'Click “k) feedback conf” or type k and press Enter.',
        triggers: ['term-key'],
        setup: [{ type: 'term-reset' }],
        validate: ({ terminal }) => (terminal.screen === 'feedback'
          ? { ok: true, message: 'The feedback menu is showing. The gains in the table are one photographed snapshot, not recommendations.' }
          : { ok: false, message: 'Press k to switch to the feedback configuration menu.' }),
        success: 'The feedback table replaces the main table.',
      }),
      explain('p-gain', {
        target: 'term-menu',
        title: 'What the P gain does',
        explain: 'The manual says the P gain compares the position the actuator is commanded to with the measured position from the sensor; the direction and size of that difference control the voltage sent to the valve output, which sets how quickly the actuator moves toward the desired position. The setting range is 0.001 to 8.000.',
        example: 'The photographed values 1.000, 3.000, 1.000, and 2.500 are what the card showed that day, nothing more.',
        concept: 'concept:pid',
        mechanism: { text: 'A P gain set too high makes a hydraulic axis hunt or slam; the manual’s tuning procedure belongs with the team lead, not this trainer.', evidence: 'manual' },
      }),
      explain('enabled', {
        target: 'term-menu',
        title: '1) Axis 0: Enabled',
        explain: 'An enabled axis is permitted to operate by this setting. That alone does not establish that power, feedback, and the other conditions are ready.',
      }),
      classicQuestion('q-p-gain', 'l06q2', { target: 'term-menu' }),
      question('q-gain-range', {
        target: 'term-menu',
        title: 'Check your understanding',
        explain: 'From the manual.',
        question: {
          prompt: 'What setting range does the Br-EFB manual give for the P gain?',
          options: ['0.001 to 8.000', '0 to 255', '1 to 100'],
          correct: 0,
          why: 'Page 55 of the manual states the range 0.001 to 8.000.',
          hints: ['', '0–255 is the output value scale, not a gain.', 'Percentages describe commands, not this gain.'],
        },
      }),
    ],
  },
  {
    id: 'i-assign-address',
    group: 'assignments',
    title: 'Assignment: understand an address',
    summary: 'Three laptop addresses against the photographed controller address.',
    reveal: ['title', 'network', 'terminal'],
    steps: [
      explain('goal', {
        title: 'The task',
        explain: 'Compare 192.168.0.20, 192.168.1.20, and 192.168.0.10 with the controller’s photographed 192.168.0.10/24, explain each case, then choose the address you would give the laptop. Nothing here scans, pings, or changes any network setting.',
        concept: 'exercise:understand-address',
      }),
      exerciseStep('same', 'understand-address:ua-same', { setup: [{ type: 'select-laptop-ip', ip: '192.168.1.20' }] }),
      exerciseStep('different', 'understand-address:ua-different'),
      exerciseStep('duplicate', 'understand-address:ua-duplicate'),
      exerciseStep('pick', 'understand-address:ua-pick'),
    ],
  },
  {
    id: 'i-assign-second-light',
    group: 'assignments',
    title: 'Assignment: a second light on its own schedule',
    summary: 'Light 2 ON during seconds 0–1 and 6–8, played and stopped.',
    reveal: ['title', 'ruler', 'digital', 'transport'],
    steps: [
      explain('goal', {
        title: 'The task',
        explain: 'Light 2 should be ON for the first second and for the last two seconds of the show: 0–1 s and 6–8 s. Leave Light 1 as it is.',
        concept: 'example:timing-light-cue',
      }),
      practice('pick-light-2', {
        target: 'channel-select',
        title: 'Select Light 2',
        explain: 'The pattern must be drawn on the right row.',
        instruction: 'Click the name Light 2 Digital.',
        triggers: ['select-channel'],
        setup: [{ type: 'select-channel', id: 'light-1' }],
        validate: ({ sim }) => (sim.channelId === 'light-2'
          ? { ok: true, message: 'Light 2 is selected.' }
          : { ok: false, message: 'Light 1 is selected. Click the name Light 2 Digital.' }),
        success: 'Light 2 Digital is boxed as selected.',
      }),
      practice('pattern', {
        target: 'digital-pane',
        title: 'Draw 0–1 s and 6–8 s',
        explain: 'Two separate stretches. Select and set each one, or draw each with the right mouse button.',
        instruction: 'On the Light 2 row, make 00:00:00.00–00:00:01.00 and 00:00:06.00 to the end of the show ON, and nothing else.',
        triggers: ['set-digital', 'draw-digital-done'],
        setup: [...clearLight('light-2'), { type: 'select-channel', id: 'light-2' }],
        validate: digitalPattern('light-2', 'Light 2', [[0, 1], [6, 8]]),
        success: 'Light 2 is commanded ON for 0–1 s and 6–8 s.',
      }),
      practice('play', {
        target: 'play',
        title: 'Play it',
        explain: 'Watch the Light 2 lantern in the simulated float. Make sure the Start and Stop times cover the whole show (shortcut menu ▸ Set to Full Show).',
        instruction: 'Press Play on the Control Window.',
        triggers: ['play'],
        setup: [{ type: 'full-show' }],
        validate: ({ sim, action }) => {
          if (action?.type !== 'play' || sim.mode !== 'play') return { ok: false, message: 'Press Play on the Control Window to run the show.' };
          return { ok: true, message: 'Playing. The Light 2 lantern lights at once, goes dark at second 1, and lights again from second 6.' };
        },
        success: 'Playback runs.',
      }),
      practice('stop', {
        target: 'stop',
        title: 'Let it finish, or press Stop',
        explain: 'Either way the show data stays as you drew it.',
        instruction: 'Let the show reach the red Stop marker, or press Stop.',
        triggers: ['stop', 'playback-complete'],
        validate: ({ action }) => (action?.type === 'stop' || action?.type === 'playback-complete'
          ? { ok: true, message: 'Done. Nothing was sent to any hardware.' }
          : { ok: false, message: 'Let the show reach the red Stop marker, or press Stop.' }),
        success: 'Playback has ended.',
      }),
      question('q-lit', {
        target: 'digital-pane',
        title: 'Check your understanding',
        explain: 'Read the pattern back.',
        question: {
          prompt: 'During playback of this Light 2 pattern, when is the lamp lit?',
          options: ['Seconds 0–1 and 6–8', 'Seconds 2–4', 'The whole show'],
          correct: 0,
          why: 'The Light 2 row is ON from 0 s to 1 s and from 6 s to the end of the show.',
          hints: ['', 'That is the Light 1 pattern from the earlier assignment.', 'Most of the row is OFF.'],
        },
      }),
    ],
  },
];
