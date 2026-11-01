// "One second ON": the narrated demonstration of the first digital task
// (brief §6 storyboard), as a film for the cue player. The narrator's lines
// are the storyboard's, with the verified control names filled in. Every
// action is performed on the real recreated windows through the cinema
// runner: the pointer moves to the control, then the same handlers run that
// a learner's mouse would trigger. The staged mistake (three seconds instead
// of one) is corrected in the data with Set Digitals Off, not by moving the
// selection. The film runs on an isolated copy of the show and the learner's
// attempt is restored afterwards (interim choice; see docs/FIRST_SEGMENT.md).
import { SEGMENT_NAMES } from '../../logic/digital-task.mjs';

export const ONE_SECOND_FILM = Object.freeze({
  id: 'one-second-on',
  intro: 'Watch the narrator and Rosie give Digital 0 one second of ON, then play it back.',
  outro: 'ON at one second, OFF at two: one second of activity, played back on the timeline and on Robot Rosie.',
  // Applied before the film starts, on the isolated copy.
  setup: [
    { type: 'set-channel-names', names: SEGMENT_NAMES },
    { type: 'set-digital-pattern', channelId: 'light-1', seconds: [] },
    { type: 'select-range', from: 0, to: 0, channels: [] },
    { type: 'select-channel', id: 'light-1' },
    { type: 'set-zoom', zoom: 1 },
    { type: 'full-show' },
    { type: 'stop' },
  ],
  beats: Object.freeze([
    {
      id: 'title', minMs: 4000, caption: 'One second ON',
      say: 'Let’s give one digital channel a very simple job.',
      rosie: { expression: 'wave', line: 'A tiny job for a tiny channel!', chirp: 'excited' },
    },
    {
      id: 'channel', minMs: 8000,
      say: 'This is Digital Zero. Zero is its channel number. Its value can still be ON or OFF.',
      rosie: { expression: 'point' },
      actions: [{ at: 900, pointer: 'channel-select' }, { at: 2200, click: 'channel-select' }],
    },
    {
      id: 'zoom', minMs: 8000,
      say: 'First, make the part of the timeline we’re using easy to see.',
      rosie: { expression: 'point', glasses: true, line: 'Time In. The view gets closer; the data stays put.', chirp: 'neutral' },
      actions: [{ at: 800, pointer: 'menu-time-in' }, { at: 2000, click: 'menu-time-in' }],
    },
    {
      id: 'select', minMs: 9000,
      say: 'Select from one second to two seconds. That gives us one second of activity.',
      rosie: { expression: 'point', glasses: true },
      actions: [{ at: 900, drag: { pane: 'digital', channel: 'light-1', fromSec: 1, toSec: 2, button: 0 } }, { at: 3800, pointer: 'selection-times' }],
    },
    {
      id: 'set-on', minMs: 9000,
      say: 'Now use Edit, Set Digitals On, to turn that selected section on.',
      rosie: { expression: 'happy', glasses: true, line: 'Or press Ctrl+1. I love that one.', chirp: 'excited' },
      actions: [{ at: 600, pointer: 'menu-edit' }, { at: 1500, menu: 'edit' }, { at: 3200, click: 'menu-item:Set Digitals On' }],
    },
    {
      // Her staged mistake: she stretches the event out to three seconds.
      id: 'mistake', minMs: 5000,
      rosie: { expression: 'happy', glasses: true, line: 'And a little more, just to be sure!', chirp: 'excited' },
      actions: [{ at: 300, drag: { pane: 'digital', channel: 'light-1', fromSec: 2, toSec: 3, button: 0 } }, { at: 2000, menu: 'edit' }, { at: 3200, click: 'menu-item:Set Digitals On' }],
    },
    {
      id: 'check', minMs: 7000,
      say: 'Almost! We asked for one second. Let’s check the end of the interval.',
      rosie: { expression: 'oops', glasses: true, line: 'Oh. That’s three seconds.', chirp: 'concern' },
      actions: [{ at: 1200, pointer: 'selection-times' }, { at: 3000, pointer: 'digital-pane' }],
    },
    {
      id: 'repair', minMs: 9000,
      say: 'One to two. That’s the interval we want.',
      rosie: { expression: 'point', glasses: true, line: 'Select the extra bit and set it OFF.', chirp: 'neutral' },
      actions: [{ at: 600, drag: { pane: 'digital', channel: 'light-1', fromSec: 2, toSec: 3, button: 0 } }, { at: 2200, menu: 'edit' }, { at: 3400, click: 'menu-item:Set Digitals Off' }, { at: 5200, pointer: 'digital-pane' }],
    },
    {
      id: 'playback', minMs: 10500,
      say: 'Watch the playhead. ON at one. OFF at two.',
      rosie: { expression: 'happy', glasses: false },
      actions: [{ at: 400, pointer: 'play' }, { at: 1400, click: 'play' }],
    },
    {
      id: 'handoff', minMs: 5000,
      rosie: { expression: 'wave', glasses: false, line: 'Okay, now we know how to do this! Give it a try. If you need help, just let me know—click me and I’ll show you.', chirp: 'excited' },
    },
    {
      id: 'task', minMs: 4000,
      rosie: { expression: 'point', glasses: false, line: 'Make Digital 0 turn ON at 1 second and OFF at 2 seconds. That’s one second ON. Then play it back.', chirp: 'neutral' },
    },
  ]),
});
