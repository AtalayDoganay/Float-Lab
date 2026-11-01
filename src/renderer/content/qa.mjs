// Rosie's local answers for typed questions during the first segment (brief
// §7). Everything comes from the lesson's own knowledge, offline: no
// provider, no account, no key. `basic` entries answer; `advanced` ones
// redirect to the current concept; a question that matches nothing is
// uncertain, never dismissed as unrelated. Keys are matched as whole words
// or phrases in the lowercased question.

export const ADVANCED_TEXT = 'That’s a more advanced part of the system. You don’t need to focus on that right now—let’s get this digital event working first.';
export const UNRELATED_TEXT = 'I help with this training. Want to look at the timeline or Digital 0 instead?';
export const UNCERTAIN_TEXT = 'I’m not sure I understood that. Can you say it another way? You can also open the Handbook for the verified reference.';

const basic = (id, keys, answer, showMe = false) => Object.freeze({ id, kind: 'basic', keys, answer, showMe });
const advanced = (id, keys) => Object.freeze({ id, kind: 'advanced', keys, answer: ADVANCED_TEXT, showMe: false });

export const QA = Object.freeze([
  basic('digital-zero', ['digital 0', 'digital zero', 'zero', 'channel number', 'the name', 'called'], 'Digital Zero is the channel’s name. The value we record on that channel can still be ON or OFF.', true),
  basic('wrong-channel', ['digital 1', 'digital one', 'wrong channel', 'other row', 'second row'], 'Digital 1 is the second row. The task is on Digital 0, the first row: click its name at the left before selecting.', true),
  basic('channel', ['channel', 'channels', 'row', 'trace'], 'A channel is one thing the show controls: one light or one movement. Each row or trace on the Edit View is one channel.'),
  basic('digital-analog', ['digital', 'analog', 'difference', 'level', 'on off', 'on/off', 'on or off'], 'A digital channel is ON or OFF, nothing in between. An analog channel carries a level between 0 and 100%. Our task uses a digital.'),
  basic('select', ['select', 'selection', 'selecting', 'highlight', 'yellow', 'drag', 'one second', 'interval', 'from 1', 'to 2'], 'Selecting marks where you want to work: drag along the Digital 0 row from 1 s to 2 s and that stretch turns yellow. It changes nothing by itself; the Edit menu then acts on it. You can also type 00:00:01.00 and 00:00:02.00 into the two time fields under the panes.', true),
  basic('set-on', ['turn on', 'turn it on', 'set on', 'set digitals on', 'ctrl+1', 'ctrl 1', 'edit menu', 'make it on', 'switch on', 'the bar'], 'With Digital 0 selected from 1 s to 2 s, choose Edit ▸ Set Digitals On, or press Ctrl+1. The selected stretch becomes a thick black bar.', true),
  basic('set-off', ['turn off', 'set off', 'set digitals off', 'ctrl+0', 'ctrl 0', 'remove', 'undo', 'too long', 'three seconds'], 'Select the stretch that should be OFF on the Digital 0 row and choose Edit ▸ Set Digitals Off, or press Ctrl+0. Only the data under the selection changes.', true),
  basic('timeline', ['timeline', 'ruler', 'time', 'seconds', 'frame', 'frames', 'hh:mm', 'clock'], 'The timeline runs left to right along the ruler. Each second has 30 frames; times are written hours:minutes:seconds.frames, so 00:00:01.00 is one second and 00:00:02.00 is two.'),
  basic('playhead', ['playhead', 'play', 'playback', 'preview', 'play back', 'moving line', 'play button'], 'Play on the Control Window runs the show from the Start time. The thin line crossing the Edit View is the playhead, and Robot Rosie follows the output while it moves.', true),
  basic('zoom', ['zoom', 'time in', 'time out', 'bigger', 'closer', 'view', 'values in', 'values out'], 'Time In and Time Out only change how much of the timeline you see; Values In and Values Out zoom the analog scale. None of them changes the data.'),
  basic('robot', ['robot', 'petal', 'petals', 'robot rosie', 'mechanism'], 'Robot Rosie is a simulated preview: she follows the show data at the playhead. Which part Digital 0 really drives is a proposal, not a confirmed mechanism.'),
  basic('check', ['check', 'did it work', 'correct', 'right', 'done', 'finished', 'pass'], 'The step checks itself as you act: when Digital 0 is ON from 00:00:01.00 to 00:00:02.00, OFF everywhere else, and you have played it back, I cheer. Until then the message under the windows says what to fix.'),
  advanced('analog-editing', ['set analogs', 'analog value', 'ramp', 'percentage', 'scale by', 'soft console', 'slider', 'rubberband']),
  advanced('terminal', ['terminal', 'gilderterm', 'com3', 'card address', 'br-efb', 'feedback menu', 'network settings', 'ip address', 'netmask']),
  advanced('pid', ['pid', 'gain', 'gains', 'velocity limit', 'endpoint', 'endpoints', 'min scale', 'max scale', 'calibrat']),
  advanced('export', ['sd card', 'export', 'autodownload', 'eprom', 'save as', 'download to the card']),
  advanced('dmx', ['dmx', 'address', 'universe', 'hardware setup', 'wiring', 'polarity']),
]);

// Words that mark a question as outside the training when no training key matches.
export const UNRELATED_HINTS = Object.freeze(['weather', 'football', 'soccer', 'lunch', 'dinner', 'breakfast', 'movie', 'joke', 'homework', 'pizza', 'coffee', 'birthday', 'dog', 'cat', 'holiday', 'weekend']);

export const SUGGESTIONS = Object.freeze({
  try: Object.freeze(['What is Digital 0?', 'How do I select one second?', 'How do I turn the selection on?']),
  watch: Object.freeze(['What is a channel?', 'What is the playhead?', 'What does Robot Rosie show?']),
  default: Object.freeze(['What is a digital channel?', 'What is the timeline?', 'What does Time In do?']),
});
