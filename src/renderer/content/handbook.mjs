// Searchable handbook entries. Concepts and Rose Float examples are written
// here; control, lesson, and exercise entries are derived from the shared
// teaching records so help and handbook never drift apart.
import { LESSONS } from './curriculum.mjs';
import { CONTROLS } from './controls.mjs';
import { EXERCISES } from './exercises.mjs';
import { FIRMWARE_NOTE } from './references.mjs';
import { LESSONS_BY_ID, GROUPS } from './levels.mjs';

// The guided lesson that wraps each classic exercise as an assignment.
export const EXERCISE_LESSON = Object.freeze({
  'schedule-light': 'b-assign-light',
  'read-command': 'b-assign-command',
  'understand-address': 'i-assign-address',
});

export const ALIAS_GROUPS = Object.freeze([
  ['netmask', 'net mask', 'subnet mask', 'mask', 'subnet'],
  ['pc mac', 'pc macs', 'pcmacs', 'pc•macs', 'pc-macs', 'pc mac training'],
  ['dmx', 'dmx-512', 'dmx512', 'channel', 'dmx address', 'dmx channel'],
  ['ip', 'ip address', 'address'],
  ['com port', 'com3', 'serial port', 'terminal', 'gilderterm'],
  ['card', 'card address', 'serial address'],
  ['axis', 'axes', 'output'],
  ['gain', 'p gain', 'proportional', 'pid'],
  ['8-bit', '0-255', '255', 'byte', 'eight bit'],
  ['adl', 'autodownload', 'no adl file'],
  ['velocity limit', 'vel limit', 'speed limit'],
  ['poweron', 'power on', 'power-on default', 'startup'],
  ['feedback', 'sensor', 'potentiometer', 'measured'],
  ['timeline', 'show', 'sequence', 'offline editing window'],
  ['hydraulic', 'hydraulics', 'cylinder', 'pneumatic'],
]);

const concept = (id, title, body, extra = {}) => ({ id: `concept:${id}`, type: 'concept', title, body, evidence: 'manual', related: [], images: [], ...extra });
const example = (id, title, body, tags, evidence, extra = {}) => ({ id: `example:${id}`, type: 'example', title, body, tags, evidence, related: [], images: [], ...extra });

const CONCEPTS = [
  concept('pcmacs', 'PC•MACs (the show programming software)',
    'PC•MACs is Gilderfluke & Co.’s Windows program for creating and editing shows. A show stores a value for every output on every frame, usually 25 or 30 frames each second. The PC is attached to the DMX-512 network only while programming; afterwards the controllers run the show themselves. Roseflow PC Mac Training is an independent trainer, not affiliated with Gilderfluke. It recreates the Edit View, Control Window, Soft Console, and GilderTerm windows from the PC•MACs manual (January 13, 2021 edition, which covers version 2) and the team’s photos, simulates part of their behaviour, and does not connect to anything. The newest build Gilderfluke lists is v2.1.226.000 Beta; which build the team’s laptop runs is not known.',
    { aliases: ['show programming', 'gilderfluke'], related: ['concept:offline-editing-window', 'concept:gilderterm'], cites: ['pcmacs-frames', 'pcmacs-dmx'] }),
  concept('offline-editing-window', 'OffLine Editing Window (the Edit View)',
    'In PC•MACs the OffLine Editing Window, titled Edit View, shows analog (0–100%) channels in the upper pane and digital (on/off) channels in the lower pane, with time along the top, channel names at the left, and show times at the bottom. Empty digitals are thin grey lines and ON time is a thick black bar. A selected stretch of time has a yellow background and selected channels are drawn fatter inside it. Green, blue, orange, and dashed red vertical lines mark the Start, Punch In, Punch Out, and Stop times. You select with LeftClick-and-slide, draw digitals with RightClick-and-slide, and change selections with the Edit menu. The trainer recreates it with four analogs (the Br-EFB axes), two training lights, and an eight-second show; presets, triggers, rubberbanding, and the Move to OffLine dialog are not simulated.',
    { aliases: ['edit view', 'offline window'], related: ['control:digital-pane', 'control:analog-pane', 'control:menu-set-digital', 'concept:timeline'], cites: ['pcmacs-offline-window', 'pcmacs-selection'], evidence: 'manual' }),
  concept('gilderterm', 'Terminal - COM3 (GilderTerm)',
    'The photographed “Terminal - COM3” window is GilderTerm, the serial terminal built into PC•MACs (RealTime ▸ Show GilderTerm, Shift+F4). Its six top controls are Card Address, Character Delay, Clear Screen, Status, Configure/Config Done, and Control. The text inside is the controller’s own configuration menu, not a PC•MACs menu. COM3 is the computer’s serial port name. ' + FIRMWARE_NOTE,
    { related: ['control:term-menu', 'control:term-card', 'control:term-status', 'concept:com-port'], images: ['01-1000066743.jpg'], cites: ['pcmacs-gilderterm'], evidence: 'observed' }),
  concept('channel', 'Channel: digital vs analog, and DMX-512 addresses',
    'A channel carries one control value. A digital channel has two states, ON and OFF. An analog channel carries a variable level such as 0–255 (8-bit). “Analog” names the control function; the data still travels digitally. Controllers are networked with DMX-512, and each output has a DMX-512 address so the right value reaches the right output. In the photos, First Channel is 6 and the four axes display addresses 6, 7, 8, and 9 with 0-based numbering.',
    { aliases: ['digital', 'analog', 'on/off'], related: ['control:channel-select', 'control:axis-select', 'lesson:b-channels', 'lesson:b-identifiers'], cites: ['pcmacs-dmx'], images: ['07-1000066747.jpg'], evidence: 'observed' }),
  concept('0-255', '0–255: 256 values, no built-in units',
    'Eight bits give 256 integer values, 0 through 255. Percent of range is value ÷ 255 × 100, so 128 is about 50.2% and 255 is 100%. The number has no inherent centimeters, volts, or ohms; calibration and the device decide what it means physically. Photographed Min Scale and Max Scale values such as 61 and 147 are on this scale, not measurements.',
    { aliases: ['percent', 'resolution'], related: ['control:command-slider', 'control:command-readout', 'lesson:b-values', 'concept:calibration'], cites: ['brefb-endpoints'] }),
  concept('card-axis-channel', 'Card address, axis, DMX address, COM port, IP: five different identifiers',
    'Card (serial) address 1 identifies the Br-EFB on the serial network. Axis 0–3 is one controlled movement on that card. The DMX-512 address (6–9 in the photo) is the command slot for each axis. COM3 is the PC’s serial port. 192.168.0.10 is the card’s IP address on Ethernet. None of them are interchangeable, and COM3 does not mean an IP ending in .3.',
    { related: ['control:axis-select', 'control:term-card', 'lesson:b-identifiers'], images: ['07-1000066747.jpg'], evidence: 'observed' }),
  concept('com-port', 'COM port (serial port label)',
    'COM3 is the Windows name of a serial port on the computer. GilderTerm talks to the card through it. The number is just the port’s label; it is not an address on the card and not part of an IP address.',
    { related: ['concept:gilderterm', 'concept:card-axis-channel'], evidence: 'observed' }),
  concept('ip-address', 'IP address',
    'An IP address identifies one network interface. The photographed card uses 192.168.0.10. The laptop’s own address is not shown in any photo; the trainer uses 192.168.0.20 only as a hypothetical example of a different host on the same subnet.',
    { related: ['concept:netmask', 'concept:gateway', 'control:laptop-ip-select'], images: ['10-1000066750.jpg'], cites: ['brefb-network'], evidence: 'observed' }),
  concept('netmask', 'Subnet mask (netmask)',
    'The mask says which part of an address is the network and which part is the host. 255.255.255.0, also written /24, makes the first three numbers the network portion: 192.168.0.10 and 192.168.0.20 are local to each other; 192.168.1.20 is not. A matching mask helps local communication; it does not prove cables, ports, or software are working.',
    { aliases: ['/24', '255.255.255.0'], related: ['control:laptop-ip-select', 'lesson:i-network', 'exercise:understand-address'], images: ['10-1000066750.jpg'], cites: ['brefb-network'], evidence: 'observed' }),
  concept('gateway', 'Gateway',
    'The gateway is the address traffic goes to when the destination is on another network. The photo shows 192.168.0.1 configured as the gateway. That is a setting, not proof that a router answers there. DHCP, shown disabled, would otherwise hand out these three values automatically.',
    { related: ['concept:netmask', 'lesson:i-network'], images: ['10-1000066750.jpg'], cites: ['brefb-network'], evidence: 'observed' }),
  concept('timeline', 'Timeline and playback',
    'A timeline organizes channel values over time; time runs left to right. PC•MACs stores a value for every output on every frame, so the training show is 240 frames: eight seconds at 30 frames per second. Play reads them in order from the Start time to the Stop time. An instant change in the command does not mean an instant physical movement.',
    { related: ['control:digital-pane', 'control:play', 'control:stop', 'lesson:b-timeline-graph', 'exercise:schedule-light'], cites: ['pcmacs-frames', 'pcmacs-offline-window'], evidence: 'manual' }),
  concept('frame-rate', 'Frames and show time (hh:mm:ss.ff)',
    'PC•MACs updates most shows at 25 or 30 frames each second and writes show times as hours:minutes:seconds.frames, for example 00:00:00.00. The trainer uses 30 FPS, so 00:00:02.15 is two and a half seconds.',
    { related: ['control:time-readout'], cites: ['pcmacs-frames'] }),
  concept('command-vs-measurement', 'Command versus measurement',
    'A command is what was requested (“go there”). A measurement is what a sensor reports (“I am there”). The error is command minus measurement. A command of 128 with a reported position of 0 tells you only that they disagree; mapping, enable state, power, sensor, or mechanism could each explain it. The trainer always labels simulated measurements as simulated.',
    { related: ['control:measure-readout', 'lesson:h-diagnosis', 'lesson:i-measurement', 'lesson:h-diagnosis'], evidence: 'simplified' }),
  concept('feedback', 'Feedback and position sensors',
    'Feedback is the measured state fed back to the controller. The Br-EFB closes a position-feedback loop around each actuator using a sensor attached to it. A potentiometer is one possible sensor: movement shifts a contact and changes the sensed voltage. The exact sensor on the team’s rig, its wiring, and its travel are not established by the photos.',
    { aliases: ['closed loop'], related: ['control:measure-run', 'lesson:i-measurement', 'concept:pid'], images: ['09-1000066749.jpg'], cites: ['brefb-actuators', 'brefb-p-gain'], evidence: 'manual' }),
  concept('pid', 'P, I, D gains (basic idea only)',
    'P responds to the present error, I accumulates error over time, and D responds to how quickly the error changes. The Br-EFB manual explains P gain as comparing commanded and measured position and driving the valve output by the difference, with a range of 0.001 to 8.000. The photographed feedback menu lists Prop Gain, Int Gain, Der Gain, and Rev Out per axis. The trainer’s approach animation is not a PID model, and no gain values are recommended here.',
    { aliases: ['tuning'], related: ['concept:feedback', 'lesson:i-measurement', 'control:term-menu'], images: ['09-1000066749.jpg'], cites: ['brefb-p-gain'], evidence: 'manual' }),
  concept('calibration', 'Min Scale and Max Scale (endpoints)',
    'Per the Br-EFB manual, Minimum Scale is the end of travel reached at a 0% command and Maximum Scale the end reached at 100%. Values are entered on the 8-bit output scale; the manual’s example uses 64 and 192 for about 25% and 75%, and a minimum higher than the maximum reverses direction. They are adjusted so a movement stops short of its mechanical limits. The photographed 61/147, 37/88, 59/183, 38/135 are one snapshot and changed between photos; they are not centimeters and not recommendations.',
    { aliases: ['endpoints', 'range', 'min scale', 'max scale'], related: ['control:calibration-range', 'lesson:i-calibration', 'control:term-menu'], images: ['07-1000066747.jpg', '05-1000066745.jpg'], cites: ['brefb-endpoints'], evidence: 'manual' }),
  concept('velocity-limit', 'Velocity Limit (unresolved)',
    'The photographed main menu has “Set Velocity Limit” and a Vel Limit column (3.00, 7.00, 3.00, 6.00). The 2018 Br-EFB manual read for this app contains no Velocity Limit entry, so its units and algorithm on firmware 1.98 are not established. Do not read 3.00 as cm/s or as a target slew rate. A firmware-matched document from the manufacturer would resolve it.',
    { related: ['control:term-menu', 'lesson:h-main-menu'], images: ['07-1000066747.jpg'], cites: ['brefb-velocity-limit'], evidence: 'unverified' }),
  concept('force-output', 'Force output to value',
    '“Force” here is a verb: impose an output value. The Br-EFB manual lists Force Output to a Value among the commands that act on the selected output and suggests it for finding endpoint values. It is not a mechanical-force measurement in newtons. How the override is released on firmware 1.98 is not photographed.',
    { related: ['control:term-menu', 'lesson:h-main-menu'], cites: ['brefb-force-output'], evidence: 'manual' }),
  concept('poweron-default', 'PowerOn Default',
    'Per the manual, power-on defaults are the values output at power-up, and they are used only when no AutoDownload file is found and no DMX-512 or serial real-time data is arriving. The photographed column shows 0 for all four axes. Special values and exact startup sequences for firmware 1.98 remain unverified.',
    { related: ['control:term-menu', 'lesson:h-main-menu', 'concept:adl-file'], cites: ['brefb-poweron'], evidence: 'manual' }),
  concept('reverse-output', 'Reverse Axis Output',
    'A servo loop wired or plumbed backwards is a phase reversal: raising P gain makes the movement slam to one end. The manual says this can be corrected in wiring or with Reverse Axis Output. The photographed Rev Out column reads Yes, No, No, Yes. Output reversal is not the same as reversing a show timeline.',
    { related: ['control:term-menu', 'concept:pid'], images: ['09-1000066749.jpg'], cites: ['brefb-reverse'], evidence: 'manual' }),
  concept('adl-file', 'NO ADL FILE (AutoDownload file)',
    'ADL refers to an AutoDownload show file stored on the card. The photographed header says NO ADL FILE!, meaning no show file was found. With none, the manual says the Br-EFB assumes all channels are analogs and uses power-on defaults. The message alone is not a fault and does not prove live commands cannot work.',
    { related: ['control:term-menu', 'concept:poweron-default'], cites: ['brefb-adl'], evidence: 'manual' }),
  concept('progress-storage', 'Where your progress is saved',
    'Progress is a small JSON file in this app’s own user-data folder on this computer (the Progress tab shows the exact path). It is independent of One File and is never sent anywhere. If the file is unreadable it is moved aside with a timestamp and you are told; if saving fails, a banner says so and your work stays in memory while the app is open.',
    { related: ['control:resume', 'control:restart'], evidence: 'simplified' }),
  concept('photos', 'The reference photos and what they establish',
    'Ten photos are bundled. Six show the Terminal - COM3 dialog with the Br-EFB v1.98 main configuration menu, one shows the feedback menu, one the network settings, and two show the workshop (enclosure interior and table). Behind the terminal only a time ruler, a dotted grid, and trace fragments of the PC•MACs Edit View are visible. The recreated Edit View, Control Window, and Soft Console therefore follow the screenshots in the PC•MACs manual, not the photos, and the trainer does not claim they match the team’s laptop pixel for pixel. The photos’ terminal toolbar reads “Card” where the manual’s older capture reads “Card Address:”, a sign that the team runs a newer build than the manual shows.',
    { related: ['control:photo-toggle', 'concept:gilderterm'], images: ['01-1000066743.jpg', '04-1000066739.jpg'], evidence: 'observed' }),
];

const EXAMPLES = [
  example('electronics-enclosure', 'Rose Float example · electronics: the control enclosure',
    'The workshop photos show a grey enclosure labeled BIG BERTHA with terminal blocks, boards with indicator LEDs, and a bundle of wiring, with a laptop beside it running the terminal. When a float element does not respond, the first questions are electrical: is the enclosure powered, is the card addressed as expected (card 1, first channel 6 in the photos), and is the laptop actually talking on COM3? None of the photos show the wiring diagram, so which terminal feeds which actuator is unverified.',
    ['electronics'], 'observed', { related: ['concept:card-axis-channel', 'concept:gilderterm'], images: ['02-1000066740.jpg', '04-1000066739.jpg'] }),
  example('sensors-position', 'Rose Float example · sensors: knowing where the arm really is',
    'Suppose a float’s waving arm is commanded to 128 (about 50.2%) but the reported position stays at 0. The Br-EFB closes a position loop using a sensor on the actuator; a potentiometer is one common kind, where movement changes a resistance ratio and the sensed voltage. A reading of 0 could be a real position or a sensor or wiring problem. The photos do not identify the sensor on the team’s rig, so check its type, wiring, and travel with the lead before trusting the number.',
    ['sensors'], 'unverified', { related: ['concept:feedback', 'concept:command-vs-measurement', 'lesson:h-diagnosis'], cites: ['brefb-actuators'] }),
  example('hydraulics-cylinder', 'Rose Float example · hydraulics: a cylinder with endpoints',
    'The Br-EFB manual says an actuator can be powered by hydraulics, compressed air, or an electric motor, and that Min and Max Scale are set so a movement stops short of its mechanical ends of travel. For a hydraulic cylinder lifting a float element, those endpoints protect the linkage. The supplied photos show a linear actuator on the table but do not establish whether the team’s rig is hydraulic, pneumatic, or electric, or which valve or pump is used; this example is generic.',
    ['hydraulics', 'motion'], 'manual', { related: ['concept:calibration', 'concept:reverse-output'], cites: ['brefb-actuators', 'brefb-endpoints'] }),
  example('motion-linear-actuator', 'Rose Float example · motion: the actuator on the table',
    'Photo 04 shows a linear actuator lying on the workshop table next to the enclosure. A command on its axis asks for a position between the Min and Max Scale endpoints; feedback reports where it is; the difference drives the output. If raising P gain makes it slam to one end, the manual says that is a phase reversal, fixed in wiring or with Reverse Axis Output. Its stroke, supply, and wiring were not photographed.',
    ['motion'], 'observed', { related: ['concept:pid', 'concept:reverse-output', 'control:measure-run'], images: ['04-1000066739.jpg'], cites: ['brefb-reverse'] }),
  example('timing-light-cue', 'Rose Float example · timing: lighting a lantern for two seconds',
    'A lantern on the float should glow from second 2 to second 4 of a short loop. On the Edit View that is its digital channel selected from 00:00:02.00 to 00:00:04.00 and set ON with Edit ▸ Set Digitals On: 60 frames. The lantern’s real DMX address and dimmer are not in the references, so the trainer uses unaddressed training channels named Light 1 and Light 2.',
    ['timing'], 'simplified', { related: ['exercise:schedule-light', 'concept:timeline', 'control:menu-set-digital'] }),
  example('electronics-addressing', 'Rose Float example · electronics and timing: four axes, four addresses',
    'The photographed card maps axis 0–3 to displayed DMX addresses 6–9 with 0-based numbering. If a show were built for a head turn on address 8, selecting axis 1 (address 7) by mistake would send the head’s timing to a different movement. Reading the row “8 (2)” before editing is the habit the Read a command exercise builds.',
    ['electronics', 'timing'], 'observed', { related: ['exercise:read-command', 'concept:card-axis-channel'], images: ['07-1000066747.jpg'] }),
];

const SECTION_LABELS = [
  ['purpose', 'Purpose'], ['when', 'When to use it'], ['example', 'Example'],
  ['mistakes', 'Common mistakes'], ['expected', 'Expected result'], ['effect', 'Software effect'],
];

function controlEntry(c) {
  const sections = SECTION_LABELS.map(([key, label]) => ({ label, text: c[key] }));
  sections.push({ label: `Possible implications for a connected mechanism (${c.mechanism.evidence})`, text: c.mechanism.text });
  return {
    id: `control:${c.id}`,
    type: 'control',
    title: c.name,
    body: [c.short, ...sections.map((s) => s.text)].join(' '),
    sections,
    evidence: c.evidence,
    related: c.related,
    images: c.images,
    cites: c.cites,
    controlId: c.id,
  };
}

// The ten classic lesson texts, kept as topic notes: the idea, the simpler
// restatement, and the takeaway. Their questions live on in the guided lessons.
function topicEntry(lesson) {
  return {
    id: `topic:${lesson.id}`,
    type: 'topic',
    title: lesson.title,
    body: `${lesson.intro} ${lesson.heading}. ${lesson.body} Simpler: ${lesson.simple} Remember: ${lesson.take}`,
    sections: [
      { label: 'The idea', text: lesson.body },
      { label: 'Explain it more simply', text: lesson.simple },
      { label: 'Remember', text: lesson.take },
    ],
    evidence: 'simplified',
    related: [],
    images: lesson.photo ? [lesson.photo] : [],
  };
}

function guidedLessonEntry(lesson) {
  const targets = [...new Set(lesson.steps.map((s) => s.target).filter(Boolean))].map((id) => `control:${id}`);
  const concepts = [...new Set(lesson.steps.map((s) => s.concept).filter(Boolean))];
  return {
    id: `lesson:${lesson.id}`,
    type: 'lesson',
    title: lesson.title,
    body: `${GROUPS[lesson.group].title}. ${lesson.summary} ${lesson.steps.map((s) => `${s.title}: ${s.explain}`).join(' ')}`,
    sections: lesson.steps.map((s, i) => ({ label: `Step ${i + 1} of ${lesson.steps.length}: ${s.title}`, text: s.explain })),
    evidence: 'simplified',
    related: [...targets, ...concepts],
    images: [],
    lessonId: lesson.id,
  };
}

function exerciseEntry(exercise) {
  const lessonId = EXERCISE_LESSON[exercise.id];
  return {
    id: `exercise:${exercise.id}`,
    type: 'exercise',
    title: `Assignment: ${exercise.title}`,
    body: `${exercise.goal} Steps: ${exercise.steps.map((s) => s.title).join('; ')}.`,
    sections: exercise.steps.map((s, i) => ({ label: `Step ${i + 1}: ${s.title}`, text: `${s.why} ${s.instruction} Expected: ${s.success}` })),
    evidence: 'simplified',
    related: [`lesson:${lessonId}`, `topic:${exercise.lesson}`, ...exercise.steps.map((s) => `control:${s.target}`)],
    images: [],
    exerciseId: exercise.id,
    lessonId,
  };
}

export const HANDBOOK_ENTRIES = Object.freeze([
  ...CONCEPTS,
  ...EXAMPLES,
  ...Object.values(CONTROLS).map(controlEntry),
  ...Object.values(LESSONS_BY_ID).map(guidedLessonEntry),
  ...LESSONS.map(topicEntry),
  ...EXERCISES.map(exerciseEntry),
]);

export const HANDBOOK_BY_ID = new Map(HANDBOOK_ENTRIES.map((e) => [e.id, e]));
