// Reference evidence: the ten photographed originals, the photographed Br-EFB
// screens transcribed for the simulated terminal, and manual citations with
// their verification status. Everything here is historical observation or a
// documented manual claim; nothing is a recommended setting.

export const IMAGE_DIR = 'assets/reference-photos/';

export const REFERENCE_IMAGES = Object.freeze([
  { file: '01-1000066743.jpg', caption: 'Terminal - COM3 over the PC•MACs window; main configuration, axis 0, card-address prompt', shows: 'The GilderTerm toolbar (Card 1, Character delay None, Clear Screen, Status greyed, Config Done, Control), the Br-EFB v1.98 main configuration menu, the prompt “Enter the card address (0 - 255):”, and behind the dialog a time ruler reading 0 min 04 sec through 24 sec with grid lines and traces.', evidence: 'observed' },
  { file: '02-1000066740.jpg', caption: 'Control enclosure interior, labeled BIG BERTHA', shows: 'Terminal blocks, boards with indicator LEDs, and wiring seen through the lid window. No settings are readable.', evidence: 'observed' },
  { file: '03-1000066744.jpg', caption: 'Main configuration with the axis prompt', shows: 'The same menu with the prompt “Enter the axis (0 - 3):”.', evidence: 'observed' },
  { file: '04-1000066739.jpg', caption: 'Workshop table: laptop, enclosure, actuator', shows: 'A laptop beside the enclosure, cabling, and a linear actuator on the table. Includes other people; keep private.', evidence: 'observed' },
  { file: '05-1000066745.jpg', caption: 'Main configuration, axis 3 selected', shows: 'axis to modify: 3; axis 3 Min Scale 10; axis 0 Max Scale 0. An earlier snapshot than photo 07.', evidence: 'observed' },
  { file: '06-1000066746.jpg', caption: 'Main configuration, axis 0 selected, axis 3 Min Scale still 10', shows: 'The same values as photo 05 with axis 0 selected.', evidence: 'observed' },
  { file: '07-1000066747.jpg', caption: 'Main configuration, later snapshot', shows: 'Axis 0 Max Scale 147 and axis 3 Min Scale 38. This is the snapshot the lessons quote.', evidence: 'observed' },
  { file: '08-1000066748.jpg', caption: 'Main configuration, later snapshot (second framing)', shows: 'The same values as photo 07.', evidence: 'observed' },
  { file: '09-1000066749.jpg', caption: 'Feedback configuration menu', shows: 'DMX-512 Addr, Prop Gain, Int Gain, Der Gain, Rev Out columns; Axis 0: Enabled; options for gains, Reverse Axis Output, Compliance Settings, More PID Options.', evidence: 'observed' },
  { file: '10-1000066750.jpg', caption: 'Br-EFB Network Settings', shows: 'DHCP disabled, IP Address 192.168.0.10, Netmask 255.255.255.0, Gateway 192.168.0.1, with Confirm and Discard options.', evidence: 'observed' },
]);

export const PHOTO_FOR = Object.freeze({
  workshop: '04-1000066739.jpg',
  controller: '07-1000066747.jpg',
  feedback: '09-1000066749.jpg',
  network: '10-1000066750.jpg',
  axisPrompt: '03-1000066744.jpg',
  cardPrompt: '01-1000066743.jpg',
});

// Transcribed from the photos. `snapshot` names the photo each table came from.
export const BREFB_HEADER = Object.freeze({
  line1: '- Gilderfluke & Co. - Electronic Feedback Card - version 1.98 - copyright 2022 -',
  serialAddress: 1,
  ipAddress: '192.168.0.10',
  status: 'NO ADL FILE!',
});

export const BREFB_MAIN_SNAPSHOT = Object.freeze({
  snapshot: '07-1000066747.jpg',
  settings: [
    ['a', 'Card Address', '1'],
    ['c', 'First Channel', '6'],
    ['d', 'Resolution', '8-bit'],
    ['e', 'DMX', 'Rx w/CS'],
    ['f', '0-based', ''],
  ],
  axisMenu: [
    ['s', 'axis to modify'],
    ['1', 'Set minimum range'],
    ['2', 'Set maximum range'],
    ['3', 'Force output to value'],
    ['4', 'Set PowerOn Default'],
    ['5', 'Set Velocity Limit'],
    ['6', 'Network Settings'],
  ],
  columns: ['DMX_512 Addr', 'Min Scale', 'Max Scale', 'Force Pos', 'Power Def', 'Vel Limit'],
  rows: [
    { axis: 0, dmx: 6, min: 61, max: 147, force: 0, power: 0, vel: '3.00' },
    { axis: 1, dmx: 7, min: 37, max: 88, force: 0, power: 0, vel: '7.00' },
    { axis: 2, dmx: 8, min: 59, max: 183, force: 0, power: 0, vel: '3.00' },
    { axis: 3, dmx: 9, min: 38, max: 135, force: 0, power: 0, vel: '6.00' },
  ],
  footer: 'k) feedback conf, n) Next, l) Last, i) Info, o) def., g) loop, h) Halt, x) Xit',
});

export const BREFB_EARLIER_SNAPSHOT = Object.freeze({
  snapshot: '05-1000066745.jpg',
  differences: 'Axis 0 Max Scale shown as 0 (not 147) and axis 3 Min Scale shown as 10 (not 38). Both values changed between photos; the later snapshot is not proof of a correct or final setting.',
});

export const BREFB_FEEDBACK_SNAPSHOT = Object.freeze({
  snapshot: '09-1000066749.jpg',
  menu: [
    ['s', 'axis to modify'],
    ['1', 'Axis 0: Enabled'],
    ['2', 'Set proportional gain'],
    ['3', 'Set integral gain'],
    ['4', 'Set derivative gain'],
    ['5', 'Reverse Axis Output'],
    ['6', 'Compliance Settings'],
    ['7', 'More PID Options'],
  ],
  columns: ['DMX-512 Addr', 'Prop Gain', 'Int Gain', 'Der Gain', 'Rev Out'],
  rows: [
    { axis: 0, dmx: 6, p: '1.000', i: '0.000', d: '0.000', rev: 'Yes' },
    { axis: 1, dmx: 7, p: '3.000', i: '0.000', d: '0.000', rev: 'No' },
    { axis: 2, dmx: 8, p: '1.000', i: '0.000', d: '0.000', rev: 'No' },
    { axis: 3, dmx: 9, p: '2.500', i: '0.000', d: '0.000', rev: 'Yes' },
  ],
  footer: 'k) main conf, n) Next, l) Last, i) Info, o) def., g) loop, h) Halt, x) eXit',
});

export const BREFB_NETWORK_SNAPSHOT = Object.freeze({
  snapshot: '10-1000066750.jpg',
  title: 'Br-EFB Network Settings',
  menu: [
    ['1', 'DHCP disabled'],
    ['2', 'Set IP address'],
    ['3', 'Set Netmask'],
    ['4', 'Set Gateway'],
  ],
  rows: [
    ['IP Address', '192.168.0.10'],
    ['Netmask', '255.255.255.0'],
    ['Gateway', '192.168.0.1'],
  ],
  footer: ['c) Confirm settings', 'x) Discard settings'],
});

export const PROMPTS = Object.freeze({
  card: { text: 'Enter the card address (0 - 255):', snapshot: '01-1000066743.jpg' },
  axis: { text: 'Enter the axis (0 - 3):', snapshot: '03-1000066744.jpg' },
});

export const FIRMWARE_NOTE =
  'The photographed card reports “version 1.98 – copyright 2022”. The Br-EFB manual read for this app (May 22, 2018) shows screens marked “version 1.00 – copyright 2018” with different menu letters. Manual claims are cited only for concepts, never for the exact behavior of the photographed menu.';

const PCMACS_URL = 'https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf';
const BREFB_URL = 'https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf';
const PCMACS_EDITION = 'Pc•MACs Manual, January 13, 2021 (326 pages)';
const BREFB_EDITION = 'Br-EFB Manual, May 22, 2018 (142 pages; screens marked firmware version 1.00, copyright 2018)';

export const MANUAL_CITATIONS = Object.freeze({
  'pcmacs-gilderterm': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '209–211, RealTime menu, “Show/Hide GilderTerm”',
    claim: 'GilderTerm is the serial terminal built into PC•MACs. Its six top controls are Card Address (a two-digit hex serial address appended to commands), Character Delay (a legacy slow-down), Clear Screen, Status (sends a status request; unavailable while the GilderGear is in configuration mode), Configure/Config Done (enters configuration mode; exit with Config Done or by typing X then Y or N), and Control (opens a small window for serial GilderCommands such as play, stop, loop, pause, resume).',
  },
  'pcmacs-offline-window': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '75–78, OffLine Editing Window QuickStart (screenshot p. 76)',
    claim: 'The window is titled “Edit View”. Analog (0–100%) functions are displayed in the upper pane and digital (on/off) functions in the lower pane. The text says unprogrammed digitals appear as light blue lines; the screenshot’s pixels are grey. ON time is drawn in black, thicker where selected. Time is displayed along the top with major markers at each second at that zoom level. Show times appear at the lower left, center and right, with the cursor time and value and the channel under the cursor. Transport markers are vertical lines: green playback start, blue punch in, orange punch out, red playback end. Channel names are listed at the left of each pane; a selected stretch of time has a yellow background.',
  },
  'pcmacs-selection': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '79–85, shortcut menu, selecting channels, and right-mouse drawing',
    claim: 'LeftClick on a channel and slide to select it for a stretch of time; slide on empty space to select every displayed channel; <shift>+LeftClick adds or removes a channel or extends the time. The selected times can be typed into the fields at the bottom. RightClick and slide on a digital draws it (from an OFF point) or undraws it (from an ON point). RightClick on empty space opens a shortcut menu with Set Start Here, Set Stop Here, Loop, Play Selection, Loop Selection, and Set to Full Show. Double-clicking empty space sets the playback start time.',
  },
  'pcmacs-edit-menu': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '133 (menu screenshot) and 176–178, Set Digital Off / On, Set Analogs to a Value',
    claim: 'Set Digital Off (Ctrl+0) and Set Digital On (Ctrl+1) force the selected digital channels off or on through the selected time; Set Analogs to a Value (Ctrl+2) opens “Set to value (0 - 255):” and sets the selected analogs, in decimal, hexadecimal, or percentage. Each is only available when channels are selected for a non-zero stretch of time.',
  },
  'pcmacs-main-control': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '201–206, RealTime menu, Show Main Control Window (screenshot p. 201)',
    claim: 'The Control Window has Play [F1], Record, Rehearse, Stop [space bar], Pause/Continue [F2], and OffLine [F8] buttons; the show time; the Auto-Punch, Manual [F3], Ease-In, Audio Cue, Loop, and Auto-Inbetweening checkboxes; Select Sequencer, Load Preset (Shift to Save), and Skew; and Start, Stop, Punch In, Punch Out, and Audio Cue time sliders. Play plays between the Start and Stop times; Loop starts again at the Start time; Manual sends the console inputs to the outputs while idle.',
  },
  'pcmacs-soft-console': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '115–118, RealTime Programming QuickStart (screenshot p. 116)',
    claim: 'The Soft Console has analog sliders at the top, each with Rev and Punch Out checkboxes, an assignment, a value, and a BUMP button that jumps to 100% while held, and digital buttons at the bottom. With Manual mode on, moving the sliders and pressing the buttons is reflected in the outputs.',
  },
  'pcmacs-menus': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '76–77 and 133–134, menu bar and Menus Overview',
    claim: 'All commands are in the pulldown menus File, Edit, RealTime, Offline, Channels, Preferences, and Help. While the OffLine Editing Window is active, Time Out, Time In, Values Out, and Values In appear on the menu bar and zoom the window.',
  },
  'pcmacs-frames': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '15 (Overview) and 136 (File menu, Frame rate)',
    claim: 'Most shows are updated at 25 or 30 frames each second; the File > New dialog’s frame rate is typically left at 30 FPS. Every frame of every show is a separate cue with a new value for every output. Show times are written as hours:minutes:seconds.frames, for example 00:00:00.00.',
  },
  'pcmacs-dmx': {
    manual: 'PC•MACs manual', edition: PCMACS_EDITION, url: PCMACS_URL, status: 'read-locally',
    pages: '15 (Overview) and 75 (Move to OffLine dialog)',
    claim: 'A typical installation networks controllers using DMX-512. Outputs can be sorted numerically by the DMX-512 addresses assigned to them and by type, which separates analogs from digitals.',
  },
  'brefb-endpoints': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '54–55 (PID Settings web tab) and 87–88 (Set Minimum, Maximum and Jog using Keypad)',
    claim: 'Minimum Scale sets the end of travel reached when a 0% command is applied; Maximum Scale sets the end of travel at a 100% command. Endpoints are entered on the 8-bit output scale (the manual’s example uses 64 and 192 for roughly 25% and 75%), and a minimum set higher than the maximum is acceptable and reverses direction. Endpoints are adjusted so a movement stops short of its mechanical ends of travel.',
  },
  'brefb-poweron': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '68 and 86, Set Power-On Defaults',
    claim: 'Power-on defaults are used only if no AutoDownload file is found and no DMX-512 or serial real-time data is being received. They set the value output on each address when the card is first powered up.',
  },
  'brefb-force-output': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '85 (Output to Test & Adjust) and 88 (Set Analog Endpoints)',
    claim: '“Force Output to a Value” is listed with Test Output, Set Analog Endpoints, and set PowerOn Defaults as commands that act on the selected output, and is suggested as a way to find the values that set proper endpoints. It imposes an output value; it is not a force measurement.',
  },
  'brefb-reverse': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '100, Reverse Axis Output',
    claim: 'A servo loop wired or plumbed backwards is a phase reversal. If the movement slams to one end when the P gain is first raised, that is the likely cause; it can be corrected in wiring or with Reverse Axis Output.',
  },
  'brefb-p-gain': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '55, Proportional (P) Gain',
    claim: 'The P gain compares the position the actuator is commanded to with the measured position from the sensor. The direction and size of that difference control the voltage sent to the valve output, which sets how quickly the actuator moves toward the desired position. The setting range is 0.001 to 8.000.',
  },
  'brefb-network': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '69, Use DHCP / IP Address / NetMask / Gateway',
    claim: 'If DHCP is enabled the local DHCP server provides the IP address; if disabled, the IP address, NetMask and Gateway are set manually.',
  },
  'brefb-adl': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '68 and 85–86',
    claim: 'ADL refers to the AutoDownload show file on the card’s flash card. With no AutoDownload file the Br-EFB assumes all channels are analogs and uses power-on defaults. The message by itself does not indicate a fault.',
  },
  'brefb-velocity-limit': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: 'none: the text contains no “Velocity Limit” entry; p. 100 describes “5) limit valve voltage”',
    claim: 'The 2018 manual does not document the photographed firmware 1.98 “Set Velocity Limit” field. Its PID menu has “5) limit valve voltage” (±10 V by default; lowering it to ±5 V halves an actuator’s top speed), but whether the two are the same setting is not established. Units and algorithm remain unresolved; a firmware-matched document would establish them.',
  },
  'brefb-actuators': {
    manual: 'Br-EFB manual', edition: BREFB_EDITION, url: BREFB_URL, status: 'read-locally',
    pages: '1, introduction',
    claim: 'An actuator is a mechanical device that moves something, powered by hydraulics, compressed air, or an electric motor. The Br-EFB closes up to four position-feedback loops for four independent actuators.',
  },
});
