// Three guided exercises. Each step names the control it highlights, explains
// why it matters, and validates the learner's action against the simulation
// state. Messages are specific about what was done and what to change. Step
// ids are stable: progress saved by earlier versions still counts.
import { classifyLaptopIp, formatPercent, axisToDmx, channelName, compareDigital, formatTime } from '../logic/simulation.mjs';

// Light 1 ON from 2 s to 4 s and OFF everywhere else.
function checkLight1(lights) {
  const r = compareDigital(lights['light-1'], [[2, 4]]);
  if (r.ok) return { ok: true, message: 'Exactly right. Light 1 is drawn ON from 00:00:02.00 to 00:00:04.00, sixty frames at 30 frames per second, and OFF everywhere else.' };
  const span = `${formatTime(r.from)} to ${formatTime(r.to)}`;
  return r.kind === 'extra'
    ? { ok: false, message: `Light 1 is ON from ${span}, outside 2–4 s. Select that stretch on the Light 1 row and choose Edit ▸ Set Digitals Off (Ctrl+0).` }
    : { ok: false, message: `Light 1 is still OFF from ${span}, inside 2–4 s. Select 00:00:02.00 to 00:00:04.00 on the Light 1 row and choose Edit ▸ Set Digitals On (Ctrl+1).` };
}

export const EXERCISES = Object.freeze([
  {
    id: 'schedule-light',
    title: 'Schedule a light',
    goal: 'Select a simulated digital channel on the Edit View, draw it ON from second 2 to second 4 of the eight-second show, and play it from the Control Window.',
    lesson: 'l07',
    steps: [
      {
        id: 'sl-channel',
        target: 'channel-select',
        title: 'Select the channel “Light 1”',
        why: 'A channel carries one control value. Selecting it first makes sure the ON/OFF pattern you draw belongs to the light you mean.',
        instruction: 'Click the name “Light 1 Digital” at the left of the digital pane.',
        success: 'The name Light 1 Digital is boxed as selected.',
        validate: ({ sim }) =>
          sim.channelId === 'light-1'
            ? { ok: true, message: 'Light 1 is selected: its name is boxed, and the Edit menu commands will act on it.' }
            : { ok: false, message: `You selected ${channelName(sim.channelId)}. Click the name Light 1 Digital for this exercise.` },
      },
      {
        id: 'sl-blocks',
        target: 'digital-pane',
        title: 'Draw Light 1 ON from 2 s to 4 s',
        why: 'The ruler counts seconds and frames. Two seconds at 30 frames per second is 60 frames, each a separate cue. Selecting the stretch and setting it ON is exact; drawing with the right mouse button is quicker but rougher.',
        instruction: 'Type 00:00:02.00 and 00:00:04.00 into the selected-time fields under the panes (or drag along the Light 1 row from 2 s to 4 s), make sure Light 1 is selected, then choose Edit ▸ Set Digitals On. Turn off anything outside 2–4 s.',
        success: 'Light 1 is ON from 00:00:02.00 to 00:00:04.00 and OFF elsewhere.',
        validate: ({ sim }) => checkLight1(sim.lights),
      },
      {
        id: 'sl-play',
        target: 'play',
        title: 'Press Play',
        why: 'Play runs the show from the Start time to the Stop time. Watching it is how you confirm the schedule, not just the picture.',
        instruction: 'Press Play on the Control Window and watch the show time and the Light 1 lantern.',
        success: 'The show runs from the Start time.',
        validate: ({ sim, action }) =>
          action?.type === 'play' && sim.mode === 'play'
            ? { ok: true, message: 'Playing. The lantern stays dark until 00:00:02.00, lights until 00:00:04.00, and goes dark again.' }
            : { ok: false, message: 'Press Play on the Control Window to run the show.' },
      },
      {
        id: 'sl-watch',
        target: 'stop',
        title: 'Let it finish, or press Stop',
        why: 'Stopping always works, and leaving a show running when you walk away is a habit to avoid on real equipment.',
        instruction: 'Watch until the show reaches the red Stop marker, or press Stop.',
        success: 'Playback ended.',
        validate: ({ action }) =>
          action?.type === 'stop' || action?.type === 'playback-complete'
            ? { ok: true, message: 'Done. The light was commanded ON only between second 2 and second 4. In this trainer nothing was sent to any hardware.' }
            : { ok: false, message: 'Let the show reach the red Stop marker, or press Stop.' },
      },
    ],
  },
  {
    id: 'read-command',
    title: 'Read a command',
    goal: 'Select an axis from the photographed mapping, identify its displayed channel, set its Soft Console slider to 128, and compare the output with a separately labeled simulated measurement.',
    lesson: 'l04',
    steps: [
      {
        id: 'rc-axis',
        target: 'axis-select',
        title: 'Select axis 2',
        why: 'The photographed card pairs each axis with a displayed DMX address. Selecting the axis first is how you make sure a value goes to the intended movement.',
        instruction: 'Click the name “Axis 2 DMX 8” at the left of the analog pane.',
        success: 'Axis 2 DMX 8 is boxed as the selected analog.',
        validate: ({ sim }) =>
          sim.axis === 2
            ? { ok: true, message: 'Axis 2 is selected. In the photographed card table its row reads “8 (2)”.' }
            : { ok: false, message: `Axis ${sim.axis} is selected, which the photo pairs with displayed address ${axisToDmx(sim.axis)}. Select axis 2.` },
      },
      {
        id: 'rc-channel',
        target: 'axis-select',
        title: 'Which displayed DMX address belongs to axis 2?',
        why: 'Card address, axis number, and DMX address are three different identifiers. Reading the row teaches you which is which.',
        instruction: 'Read the channel name or the terminal table and pick the displayed address.',
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
        title: 'Set the Axis 2 slider to exactly 128',
        why: '0–255 is 256 values, and 128 ÷ 255 × 100 is about 50.2%. The number is a request on the 8-bit scale, not a distance.',
        instruction: 'On the Soft Console, drag the Axis 2 slider (or click it and use the arrow keys) until its Value reads 128.',
        success: 'The Value column reads 128 for Axis 2.',
        validate: ({ sim }) => {
          if (sim.axis !== 2) return { ok: false, message: `That slider belongs to Axis ${sim.axis}. Use the Axis 2 row of the Soft Console.` };
          return sim.command === 128
            ? { ok: true, message: `Axis 2 reads 128, which is ${formatPercent(128)} of the 8-bit range.` }
            : { ok: false, message: `Axis 2 reads ${sim.command} (${formatPercent(sim.command)}). Move it to exactly 128; the arrow keys change it one step at a time.` };
        },
      },
      {
        id: 'rc-percent',
        target: 'command-readout',
        title: 'What percentage does 128 represent?',
        why: 'Percent is value ÷ 255 × 100. Half of 255 is 127.5, so 128 is just above halfway.',
        instruction: 'Read the Soft Console value and pick the matching percentage.',
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
        why: 'A command is “go there”. A measurement is “I am there”. With Manual mode on, the Soft Console slider is the commanded output; the trainer draws the simulated position separately so you never mistake one for the other.',
        instruction: 'In the simulated float under the windows, press Run model and watch the simulated position approach the commanded output while the error shrinks.',
        success: 'The simulated position approaches the output; the error falls toward 0.',
        validate: ({ sim, action }) =>
          action?.type === 'run-measure' && sim.measuring
            ? { ok: true, message: 'The simulated position is approaching the commanded output. This is a teaching model with no mass, friction, or gains; it says nothing about how far the real axis would travel. Compare the two labeled numbers, not the picture.' }
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
        instruction: 'Select 192.168.0.20 in the laptop address chooser.',
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
