// Three guided exercises. Each step names the control it highlights, explains
// why it matters, and validates the learner's action against the simulation
// state. Messages are specific about what was done and what to change.
import { blocksToIntervals, classifyLaptopIp, formatPercent, axisToDmx, DIGITAL_CHANNELS } from '../logic/simulation.mjs';

const EXPECTED_BLOCKS = [false, false, true, true, false, false, false, false];

const channelName = (id) => DIGITAL_CHANNELS.find((c) => c.id === id)?.name ?? id;

function checkBlocks(blocks) {
  for (let i = 0; i < EXPECTED_BLOCKS.length; i += 1) {
    if (blocks[i] && !EXPECTED_BLOCKS[i]) {
      return { ok: false, message: `Block ${i} is ON. That would switch the light on during seconds ${i}–${i + 1}. Turn it off: only blocks 2 and 3 should be ON.` };
    }
    if (!blocks[i] && EXPECTED_BLOCKS[i]) {
      return { ok: false, message: `Block ${i} is OFF, but it needs to be ON to cover seconds ${i}–${i + 1}. Turn it on so blocks 2 and 3 are both ON.` };
    }
  }
  const intervals = blocksToIntervals(blocks).map((iv) => `${iv.start}–${iv.end} s`).join(' and ');
  return { ok: true, message: `Exactly right. Block 2 covers 2–3 seconds and block 3 covers 3–4 seconds, so the light is commanded ON for ${intervals}: from second 2 to second 4.` };
}

export const EXERCISES = Object.freeze([
  {
    id: 'schedule-light',
    title: 'Schedule a light',
    goal: 'Select a simulated digital channel, enable only blocks 2 and 3 in an eight-second sequence, and play it.',
    lesson: 'l07',
    steps: [
      {
        id: 'sl-channel',
        target: 'channel-select',
        title: 'Select the channel “Light 1”',
        why: 'A channel carries one control value. Choosing the row first makes sure the ON/OFF pattern you draw belongs to the light you mean.',
        instruction: 'In the digital pane, click the row named Light 1.',
        success: 'Light 1 is selected and its eight blocks are shown.',
        validate: ({ sim }) =>
          sim.channelId === 'light-1'
            ? { ok: true, message: 'Light 1 is selected. Its row now owns the eight blocks you are about to edit.' }
            : { ok: false, message: `You selected ${channelName(sim.channelId)}. Select the row named Light 1 for this exercise.` },
      },
      {
        id: 'sl-blocks',
        target: 'timeline-block',
        title: 'Turn on only blocks 2 and 3',
        why: 'Each block is one second. Block 2 covers 2–3 s and block 3 covers 3–4 s, so those two blocks make the light ON from second 2 to second 4 and OFF everywhere else.',
        instruction: 'Click blocks until only 2 and 3 are ON, then press Check again if needed.',
        success: 'Blocks 2 and 3 are ON; all other blocks are OFF.',
        validate: ({ sim }) => checkBlocks(sim.blocks),
      },
      {
        id: 'sl-play',
        target: 'play',
        title: 'Press Play',
        why: 'Playback reads the blocks in order, one second each. Watching it is how you confirm the schedule, not just the picture.',
        instruction: 'Press Play and watch the playhead, the time readout, and the lamp.',
        success: 'The sequence starts from 00:00:00.00.',
        validate: ({ sim, action }) =>
          action?.type === 'play' && sim.playing
            ? { ok: true, message: 'Playing. The lamp should stay dark for seconds 0–2, light for 2–4, and go dark again until 8.' }
            : { ok: false, message: 'Press Play to run the eight-second sequence.' },
      },
      {
        id: 'sl-watch',
        target: 'stop',
        title: 'Let it finish, or press Stop',
        why: 'Stopping always works, and leaving a show running when you walk away is a habit to avoid on real equipment.',
        instruction: 'Watch until the readout says “Sequence complete”, or press Stop.',
        success: 'Playback ended and the lamp is off.',
        validate: ({ action }) =>
          action?.type === 'stop' || action?.type === 'playback-complete'
            ? { ok: true, message: 'Done. The light was commanded ON only between second 2 and second 4. In this trainer nothing was sent to any hardware.' }
            : { ok: false, message: 'Let the sequence finish or press Stop to end playback.' },
      },
    ],
  },
  {
    id: 'read-command',
    title: 'Read a command',
    goal: 'Select an axis from the photographed mapping, identify its displayed channel, set command 128, and compare it with a separately labeled simulated measurement.',
    lesson: 'l04',
    steps: [
      {
        id: 'rc-axis',
        target: 'axis-select',
        title: 'Select axis 2',
        why: 'The photographed card pairs each axis with a displayed DMX address. Selecting the axis first is how you make sure a value goes to the intended movement.',
        instruction: 'In the analog pane choose Axis 2, or type s then 2 in the terminal.',
        success: 'Axis 2 is selected and the row reads “8 (2)”.',
        validate: ({ sim }) =>
          sim.axis === 2
            ? { ok: true, message: 'Axis 2 is selected. In the photo its row reads “8 (2)”.' }
            : { ok: false, message: `Axis ${sim.axis} is selected, which the photo pairs with displayed address ${axisToDmx(sim.axis)}. Select axis 2.` },
      },
      {
        id: 'rc-channel',
        target: 'axis-select',
        title: 'Which displayed DMX address belongs to axis 2?',
        why: 'Card address, axis number, and DMX address are three different identifiers. Reading the row teaches you which is which.',
        instruction: 'Read the analog row or the terminal table and pick the displayed address.',
        success: 'You identified 8.',
        question: { prompt: 'Displayed DMX address for axis 2 in the photographed table:', options: ['6', '7', '8', '9'] },
        validate: ({ answer }) => {
          if (answer === '8') return { ok: true, message: 'Correct: the row “8 (2)” pairs displayed address 8 with axis 2. First Channel is 6 and the display is 0-based, so axis 2 is 6 + 2.' };
          const pairs = { 6: 'axis 0', 7: 'axis 1', 9: 'axis 3' };
          return { ok: false, message: `In the photographed table, ${answer} is beside ${pairs[answer] ?? 'a different axis'}. Look for the row written “8 (2)”.` };
        },
      },
      {
        id: 'rc-command',
        target: 'command-slider',
        title: 'Set the command to exactly 128',
        why: '0–255 is 256 values, and 128 ÷ 255 × 100 is about 50.2%. The number is a request on the 8-bit scale, not a distance.',
        instruction: 'Drag the command slider (or use the arrow keys) until the readout shows 128.',
        success: 'The readout shows 128 / 255 · 50.2%.',
        validate: ({ sim }) =>
          sim.command === 128
            ? { ok: true, message: `Command is 128, which the readout shows as ${formatPercent(128)} of the 8-bit range.` }
            : { ok: false, message: `You set ${sim.command} (${formatPercent(sim.command)}). Move the command to exactly 128; the arrow keys change it one step at a time.` },
      },
      {
        id: 'rc-percent',
        target: 'command-readout',
        title: 'What percentage does 128 represent?',
        why: 'Percent is value ÷ 255 × 100. Half of 255 is 127.5, so 128 is just above halfway.',
        instruction: 'Read the command readout and pick the matching percentage.',
        success: 'You identified about 50.2%.',
        question: { prompt: '128 on the 0–255 scale is:', options: ['50.0%', '50.2%', '128%'] },
        validate: ({ answer }) => {
          if (answer === '50.2%') return { ok: true, message: 'Right: 128 ÷ 255 × 100 = 50.196…, shown as 50.2%. It is not 128 cm, volts, or ohms.' };
          if (answer === '50.0%') return { ok: false, message: 'Close, but 255 has no exact middle value: 127.5 would be 50.0%. 128 ÷ 255 × 100 rounds to 50.2%.' };
          return { ok: false, message: '128 is the raw value, not a percentage. Divide by 255 and multiply by 100 to get about 50.2%.' };
        },
      },
      {
        id: 'rc-measure',
        target: 'measure-run',
        title: 'Run the measurement model and compare',
        why: 'A command is “go there”. A measurement is “I am there”. The trainer draws the simulated measurement separately so you never mistake one for the other.',
        instruction: 'Press Run model and watch the simulated measurement approach 50.2% while the error shrinks.',
        success: 'Measurement approaches the command; the error readout falls toward 0.',
        validate: ({ sim, action }) =>
          action?.type === 'run-measure' && sim.measuring
            ? { ok: true, message: 'The simulated measurement is approaching the command. This is a teaching model with no mass, friction, or gains; it says nothing about how far the real axis would travel. Compare the two labeled numbers, not the picture.' }
            : { ok: false, message: 'Press Run model to start the simulated measurement.' },
      },
    ],
  },
  {
    id: 'understand-address',
    title: 'Understand an address',
    goal: 'Compare three hypothetical laptop addresses with the photographed controller address 192.168.0.10/24 and explain each case.',
    lesson: 'l08',
    steps: [
      {
        id: 'ua-same',
        target: 'laptop-ip-select',
        title: 'Choose 192.168.0.20',
        why: 'With netmask 255.255.255.0 the first three numbers are the network portion. 192.168.0.20 shares it with the controller and uses a different host number.',
        instruction: 'Select 192.168.0.20 in the laptop IP chooser.',
        success: 'The result explains “same subnet, different host”.',
        validate: ({ sim }) =>
          sim.laptopIp === '192.168.0.20'
            ? { ok: true, message: 'Same subnet, different host: local communication is possible if cables, ports, and software are working. That is an assumption the trainer cannot check.' }
            : { ok: false, message: `${sim.laptopIp} is selected. Choose 192.168.0.20 for this step.` },
      },
      {
        id: 'ua-different',
        target: 'laptop-ip-select',
        title: 'Now choose 192.168.1.20',
        why: 'Changing the third number changes the network portion under a /24 mask, even though only one digit moved.',
        instruction: 'Select 192.168.1.20.',
        success: 'The result explains “different subnet”.',
        validate: ({ sim }) =>
          sim.laptopIp === '192.168.1.20'
            ? { ok: true, message: 'Different subnet under /24: 192.168.1 is not 192.168.0, so traffic would need routing through a gateway that actually exists and is configured.' }
            : { ok: false, message: `${sim.laptopIp} is selected. Choose 192.168.1.20 to see the different-subnet case.` },
      },
      {
        id: 'ua-duplicate',
        target: 'laptop-ip-select',
        title: 'Now choose 192.168.0.10',
        why: 'Two devices with the same address on one network conflict; the controller already uses this one.',
        instruction: 'Select 192.168.0.10.',
        success: 'The result explains “duplicate address”.',
        validate: ({ sim }) =>
          sim.laptopIp === '192.168.0.10'
            ? { ok: true, message: 'Duplicate address: this is the controller’s own photographed address, so the laptop would conflict with it.' }
            : { ok: false, message: `${sim.laptopIp} is selected. Choose 192.168.0.10 to see the duplicate case.` },
      },
      {
        id: 'ua-pick',
        target: 'network-result',
        title: 'Which address would you give the laptop?',
        why: 'The right choice is on the same subnet and not already in use. Nothing here proves the network is wired or that a gateway answers.',
        instruction: 'Pick the address that is same-subnet and not a duplicate.',
        success: 'You chose 192.168.0.20.',
        question: { prompt: 'Hypothetical laptop address on the controller’s subnet without a conflict:', options: ['192.168.0.20', '192.168.1.20', '192.168.0.10'] },
        validate: ({ answer }) => {
          const kind = classifyLaptopIp(answer);
          if (kind === 'same-subnet') return { ok: true, message: '192.168.0.20 shares the network portion and has a different host number, assuming nothing else uses it. The trainer performed no scanning, pinging, or network changes.' };
          if (kind === 'duplicate') return { ok: false, message: 'That duplicates the controller’s address.' };
          return { ok: false, message: 'The third octet differs, so that address is on a different /24 subnet.' };
        },
      },
    ],
  },
]);
