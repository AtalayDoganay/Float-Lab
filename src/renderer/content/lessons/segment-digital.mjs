// The first digital segment (brief §5–6): a quick tour of the eleven menus
// from zero assumed knowledge, the digital-versus-analog distinction in two
// visible examples, and "One second ON": a narrated film, the exact practice
// with Robot Rosie beside the workspace, and the review stop. Every term is
// explained the first time it is used. Nothing beyond this segment is
// planned here: Atalay specifies the next steps after reviewing it.
import { explain, practice, question, clearLight } from './steps.mjs';
import { SEGMENT_NAMES, validateOneSecond } from '../../logic/digital-task.mjs';
import { ONE_SECOND_FILM } from '../films/one-second-on.mjs';

export const SEGMENT_IDS = Object.freeze(['s1-orientation', 's1-digital-vs-analog', 's1-one-second-on']);

// Show data for the segment: the digitals are named Digital 0 and Digital 1.
const NAMES = [{ type: 'set-channel-names', names: SEGMENT_NAMES }];
// The clean fixture of the one-second task: Digital 0 OFF throughout, nothing else changed.
const FIXTURE = [
  ...NAMES,
  ...clearLight('light-1'),
  { type: 'set-digital-pattern', channelId: 'light-2', seconds: [] },
  { type: 'reset-analogs' },
  { type: 'set-zoom', zoom: 1 },
  { type: 'full-show' },
  { type: 'stop' },
  { type: 'select-channel', id: 'light-1' },
];
const openMenu = (id, ms = 1700) => [{ type: 'menu', id }, { wait: ms }, { type: 'menu', id: null }];

export const SEGMENT_LESSONS = [
  {
    id: 's1-orientation',
    group: 'start',
    title: 'Meet the PC•MACs screen',
    summary: 'Where the eleven menus are, what each one is for, and how the view differs from the data.',
    reveal: ['title', 'ruler', 'analog', 'digital'],
    steps: [
      explain('workspace', {
        target: 'time-ruler',
        title: 'What you are looking at',
        explain: 'The grey window on the right is a recreation of PC•MACs, the program the team uses to plan a show. A show is a list of values over time. Time runs left to right along the ruler at the top: that line is the timeline. Each row or trace under it is one channel: one thing the show controls, such as one light or one movement. Along the very top sits the menu bar, where every command lives. We will walk along it once, left to right.',
        example: 'Nothing here connects to the float. It is a safe copy of the real screen, so you can click anything.',
        concept: 'concept:timeline',
        demo: { intro: 'Watch Digital 0 named at the left of the lower pane.', actions: [...NAMES, { type: 'highlight', controls: ['channel-select'] }, { wait: 1200 }], outro: 'Digital 0 is the name of the channel we will program later.' },
      }),
      explain('menu-file', {
        target: 'menu-file',
        title: 'File: the show file itself',
        explain: 'File is the first word on the menu bar, at the far left. It is where a show is created, opened and saved: New..., Open..., Save, and the special save formats the team’s controllers read. One reason to open it: to save your work before trying something new.',
        example: 'File ▸ Save (Ctrl+S) writes the show to disk; everything else in the program edits what is in memory.',
        demo: { intro: 'Watch the File menu open and close.', actions: openMenu('file'), outro: 'The items are the ones the PC•MACs manual photographs; saving is not simulated here.' },
      }),
      explain('menu-edit', {
        target: 'menu-edit',
        title: 'Edit: change what is selected',
        explain: 'Edit is second from the left. Its commands change the data of whatever you have selected: a stretch of time on one or more channels. Selecting means marking where you want to work; it changes nothing by itself. Edit is where the change happens. One reason to open it: Set Digitals On turns a selected stretch of a digital channel ON.',
        example: 'Select one second of Digital 0, then Edit ▸ Set Digitals On (Ctrl+1): that second becomes a thick black bar.',
        concept: 'concept:selection',
        demo: { intro: 'Watch the Edit menu open; Set Digitals On is greyed until something is selected.', actions: openMenu('edit', 2000), outro: 'Greyed items need a selection first. That is the program telling you the order of things.' },
      }),
      explain('menu-realtime', {
        target: 'menu-realtime',
        title: 'RealTime: playing the show',
        explain: 'RealTime is third. It opens the windows that play the show and listen to the live controls: the Control Window (Play, Stop, the show time), the Soft Console (sliders), and GilderTerm (the controller’s own terminal). One reason to open it: RealTime ▸ Show Main Controls (F4) brings up the Control Window so you can press Play.',
        example: 'RealTime ▸ Play is the same as the Play button on the Control Window.',
        reveal: ['transport'],
        demo: { intro: 'Watch RealTime ▸ Show Main Controls open the Control Window.', actions: [{ type: 'menu', id: 'realtime' }, { wait: 1500 }, { type: 'menu', id: null }, { type: 'show-window', name: 'control' }, { wait: 1200 }], outro: 'The Control Window appeared under the Edit View. It plays the show; it does not edit it.' },
      }),
      explain('menu-offline', {
        target: 'menu-offline',
        title: 'Offline: the editing window’s options',
        explain: 'Offline is fourth. It belongs to the Edit View, the editing window you are looking at: which channels it shows, how it scrolls, its grids, its time and value scale. One reason to open it: Move to Offline brings a channel onto the editing window so you can draw on it. Offline here means “editing without playing”, not “disconnected”.',
        example: 'The Edit View is also called the OffLine Editing Window; the RealTime windows are the other half.',
        demo: { intro: 'Watch the Offline menu open and close.', actions: openMenu('offline'), outro: 'Its items are shown as the manual photographs them; presets and triggers are not simulated.' },
      }),
      explain('menu-channels', {
        target: 'menu-channels',
        title: 'Channels: the list of everything the show controls',
        explain: 'Channels is fifth. Every output the show can drive is a channel, and this menu manages the list of them: add a digital (ON/OFF) channel, add an analog (level) channel, sort or group them. One reason to open it: to find a channel by name when a show has many. In this training show you can see the whole list at the left of the Edit View, so the menu is mostly for bigger shows.',
        example: 'Our two digital rows are named Digital 0 and Digital 1; a real float show may have dozens.',
        concept: 'concept:channel',
        demo: { intro: 'Watch the Channels menu open, then Digital 0 found by its name at the left.', actions: openMenu('channels', 1500), outro: 'Locating a channel is reading its name at the left of its row.' },
      }),
      explain('menu-preferences', {
        target: 'menu-preferences',
        title: 'Preferences: how the program behaves',
        explain: 'Preferences is sixth. It holds the program’s own settings: which hardware it talks to, how smoothing and inbetweening work, how cut and paste behave. One reason to open it: to check Hardware Setup when the team connects a new controller. For this training nothing in it needs changing.',
        example: 'Preferences ▸ Hardware Setup is where the real program is told which DMX universe to send on.',
        demo: { intro: 'Watch the Preferences menu open and close.', actions: openMenu('preferences'), outro: 'Shown as photographed; none of it is simulated, and none of it is needed for the first task.' },
      }),
      explain('menu-time-out', {
        target: 'menu-time-out',
        title: 'Time Out: see more of the show',
        explain: 'Time Out and Time In appear on the bar whenever the Edit View is active. They are view controls: they change how much of the timeline fits in the window and nothing else. Time Out zooms out, so more seconds fit. One reason to use it: to see a whole pattern at once. The data (the values on every frame) is the same before and after.',
        example: 'After Time Out the ruler labels fewer frames and the bars look shorter, yet every event keeps its exact start and end.',
        demo: { intro: 'Watch Time In, then Time Out bring the view back; the bars change size, the show does not.', actions: [{ type: 'zoom', dir: 1 }, { wait: 1100 }, { type: 'zoom', dir: -1 }, { wait: 900 }], outro: 'Only the view moved. The show data is unchanged.' },
      }),
      explain('menu-time-in', {
        target: 'menu-time-in',
        title: 'Time In: see single frames',
        explain: 'Time In zooms in, so fewer seconds fill the window and single frames become visible. A frame is one step of show time; this show has 30 frames in every second. One reason to use it: to put an edge exactly on a frame. Zooming in does not make an event longer, it only makes it look wider.',
        example: 'Time In once, and a one-second event stretches across twice the screen width. It is still one second.',
        concept: 'concept:frame-rate',
        demo: { intro: 'Watch Time In twice, then Time Out twice.', actions: [{ type: 'zoom', dir: 1 }, { wait: 900 }, { type: 'zoom', dir: 1 }, { wait: 1100 }, { type: 'zoom', dir: -1 }, { wait: 700 }, { type: 'zoom', dir: -1 }], outro: 'Four clicks, and the show data did not change: zooming is viewing, not editing.' },
      }),
      explain('menu-values-out', {
        target: 'menu-values-out',
        title: 'Values Out: the analog scale, zoomed out',
        explain: 'Values Out and Values In are the other pair of view controls. They zoom the vertical scale of the upper, analog pane (0–100%), the way Time Out and Time In zoom the horizontal time scale. They are not incoming or outgoing signals. This trainer does not simulate them; the analog pane always shows 0–100%. One reason to know them: so a changed scale never looks like changed data.',
        example: 'In the real program, Values In makes a small analog move look taller. The values are the same.',
        demo: { intro: 'Watch what Values Out does here.', actions: [{ type: 'menu', id: 'values-out' }, { wait: 1800 }], outro: 'A trainer note, not a change: the analog scale stays 0–100% here.' },
      }),
      explain('menu-values-in', {
        target: 'menu-values-in',
        title: 'Values In: the analog scale, zoomed in',
        explain: 'Values In zooms the analog pane’s vertical scale in. Analog channels are the ones that carry a level between 0 and 100% rather than ON or OFF; we come back to them briefly in the next lesson. Like Values Out, it is a view control and it is not simulated in this trainer. That is all you need from it for now: digitals are our subject.',
        example: 'If an analog trace looks too flat to read, Values In is the real program’s answer. Our task uses a digital, so we leave it alone.',
        demo: { intro: 'Watch what Values In does here.', actions: [{ type: 'menu', id: 'values-in' }, { wait: 1800 }], outro: 'Not simulated here, and not needed for the digital task.' },
      }),
      explain('menu-help', {
        target: 'menu-help',
        title: 'Help: the program’s own manual',
        explain: 'Help is the last menu. It opens the program’s help index and About PCMACS, which shows the version number. One reason to open it: when the team needs to know which build is on the laptop, Help ▸ About PCMACS says so. In this trainer, the Help ? button at the top right explains any control instead.',
        example: 'Press Help ? and then click any control: a short explanation opens and nothing changes.',
        demo: { intro: 'Watch the Help menu open and close.', actions: openMenu('help'), outro: 'Help ▸ About PCMACS would name the version on a real laptop; this trainer’s help is the ? button.' },
      }),
      explain('reach-screen', {
        target: 'menu-file',
        title: 'Reaching the working screen',
        explain: 'On the real laptop you would start with File ▸ Open... to open the show, and the channels would already be on the Edit View, or Offline ▸ Move to Offline would bring them there. In this trainer the file dialog is not simulated: the training show is already open with its channels on the Edit View, exactly where the next lesson needs them.',
        example: 'Open... is shown in the File menu as the manual lists it; choosing it says it is not simulated.',
      }),
      question('q-zoom', {
        target: 'menu-time-in',
        title: 'Check your understanding',
        explain: 'View or data?',
        question: {
          prompt: 'Time In made the bars look longer. Did the event get longer?',
          options: ['No. Only the view changed; the data is the same.', 'Yes. Zooming in adds frames to the event.', 'Yes, but only on digital channels.'],
          correct: 0,
          why: 'Time In and Time Out change how much of the timeline fits in the window. Every value on every frame stays as it was.',
          hints: ['', 'Zoom never writes data. Look at the selected-time fields: the start and end did not move.', 'Zoom treats analog and digital rows the same way: neither gains a single frame.'],
        },
      }),
    ],
  },
  {
    id: 's1-digital-vs-analog',
    group: 'start',
    title: 'Digital versus analog, briefly',
    summary: 'Two kinds of channel: ON/OFF, and a level between 0 and 100%.',
    reveal: ['title', 'ruler', 'analog', 'digital'],
    steps: [
      explain('digital', {
        target: 'digital-pane',
        title: 'A digital channel is ON or OFF',
        explain: 'The lower pane holds the digital channels. Digital means two states only: ON or OFF, nothing in between. In the row, OFF is the thin grey line and ON is a thick black bar that lasts as long as the output is on. Our Digital 0 is one of these. ON means the value 1; OFF means the value 0; the name Digital 0 is just the channel’s name.',
        example: 'A lantern that is either lit or dark is a digital channel.',
        concept: 'concept:digital',
        demo: { intro: 'Watch Digital 1 switched ON for one second and then OFF again.', actions: [...NAMES, { type: 'select-range', from: 90, to: 120, channels: ['light-2'] }, { wait: 700 }, { type: 'set-digital', on: true }, { wait: 1300 }, { type: 'set-digital', on: false }, { wait: 300 }, { type: 'select-range', from: 0, to: 0, channels: [] }], outro: 'A bar appeared for one second, then it was gone. Two states, nothing between.' },
      }),
      explain('analog', {
        target: 'analog-pane',
        title: 'An analog channel carries a level',
        explain: 'The upper pane holds the analog channels. Analog means a level between 0 and 100% rather than a switch: the trace is drawn at its height on every frame. Here the four analogs are the float’s four movement axes. Detailed analog editing is a later subject; for now it is enough to recognise the difference: a level, not an ON/OFF.',
        example: 'An arm that should stop halfway along its travel needs a level, not a switch.',
        concept: 'concept:analog',
        demo: { intro: 'Watch Axis 3 set to 25% between 2 s and 4 s, then put back.', actions: [{ type: 'set-analog-value', axis: 3, fromSec: 2, toSec: 4, value: 64 }, { wait: 1300 }, { type: 'set-analog-value', axis: 3, fromSec: 2, toSec: 4, value: 166 }], outro: 'The magenta trace dropped to the 25.0% line and came back: a level, chosen from many.' },
      }),
      question('q-which', {
        target: 'digital-pane',
        title: 'Check your understanding',
        explain: 'Which kind of channel?',
        question: {
          prompt: 'A light that should simply switch on at one second and off at two seconds needs which kind of channel?',
          options: ['A digital channel: it is ON or OFF', 'An analog channel: it carries a level', 'Either; they are the same thing'],
          correct: 0,
          why: 'Two states, ON and OFF, are exactly what a digital channel carries. That is the channel the next lesson programs.',
          hints: ['', 'A level between 0 and 100% is more than a light needs: it only switches.', 'They differ: a digital is two states; an analog is a level drawn by its height.'],
        },
      }),
    ],
  },
  {
    id: 's1-one-second-on',
    group: 'start',
    title: 'One second ON',
    summary: 'Watch the task done once, then make Digital 0 turn ON at 1 s and OFF at 2 s, and play it back.',
    reveal: ['title', 'ruler', 'analog', 'digital', 'transport', 'robot'],
    steps: [
      explain('watch', {
        target: 'digital-pane',
        title: 'Watch: one second ON',
        explain: 'The narrator explains and Rosie does the clicking, on these windows. Selecting a stretch of Digital 0, turning it ON with the Edit menu, checking the end of the interval, and playing it back. Robot Rosie, beside the windows, shows the programmed output while the show plays. Pause, replay or skip at any time.',
        film: ONE_SECOND_FILM,
        setup: FIXTURE,
        concept: 'concept:preview',
      }),
      practice('try', {
        target: 'digital-pane',
        title: 'Your turn: one second ON',
        explain: 'ON at 00:00:01.00, OFF at 00:00:02.00: exactly 30 frames. Drag along the Digital 0 row from 1 s to 2 s, or type the two times into the selected-time fields and click the name Digital 0; then Edit ▸ Set Digitals On (Ctrl+1); then Play. Click Rosie if you want help.',
        instruction: 'Make Digital 0 turn ON at 1 second and OFF at 2 seconds. That’s one second ON. Then play it back.',
        // Rosie's "Show me" during practice replays the same film on an isolated copy.
        film: ONE_SECOND_FILM,
        triggers: ['set-digital', 'draw-digital-done', 'select-range', 'play', 'stop', 'playback-complete'],
        setup: [...FIXTURE, { type: 'snapshot-baseline' }],
        validate: validateOneSecond,
        success: 'Digital 0 is ON from 00:00:01.00 to 00:00:02.00, OFF everywhere else, and you played it back.',
        concept: 'concept:on-off',
      }),
      explain('review-stop', {
        title: 'End of this segment',
        explain: 'That is the whole first segment: the menus, digital versus analog, and one second of ON on Digital 0, programmed, checked and played back. The next teaching steps are not written yet: Atalay will specify them after reviewing this one. Your progress here is saved on this computer.',
        example: 'Until then, you can replay the film, redo the task, or open the Handbook for any word you met.',
      }),
    ],
  },
];

// Every explain and question step applies the segment's channel names on
// entry, so the rows read Digital 0 and Digital 1 from the first frame, not
// only after a demonstration has run (the practice carries them in its own setup).
for (const lesson of SEGMENT_LESSONS) {
  for (const step of lesson.steps) {
    if (step.kind !== 'practice' && !step.setup.some((a) => a.type === 'set-channel-names')) step.setup = [...NAMES, ...step.setup];
  }
}
