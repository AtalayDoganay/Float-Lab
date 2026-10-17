// The PC•MACs menu bar, item for item, from the manual's menu screenshots
// (January 13, 2021 edition, pp. 133-134 and the Edit View capture on p. 76).
// Items with an `action` are simulated by the trainer; the rest are shown as
// photographed and explain that they are not simulated when chosen. Greyed
// items are greyed in the screenshots. The File menu's list of recent shows
// (someone else's file names) is left out.

const item = (label, key = '', more = {}) => ({ label, key, ...more });
const SEP = { sep: true };

const hasSel = (sim, kind) => sim.selection.to > sim.selection.from && sim.selection.channels.some((id) => id.startsWith(kind));

export const MENUS = Object.freeze([
  {
    id: 'file', label: 'File', items: [
      item('New...', 'Ctrl+N'), item('Open...', 'Ctrl+O'), SEP,
      item('Save', 'Ctrl+S'), item('Save As...', 'Alt+S'), item('Restore from Backup'), item('Revert to Saved'), SEP,
      item('Save As Eprom...'), item('Save As AutoDownload...'), item('Import From Eprom...'), item('Import from Auto-Download...'), SEP,
      item('Save Macro...', 'Ctrl+M'), item('Insert Macro...', 'Alt+M'), item('Insert Multiple Macros...'), SEP,
      item('Show Information...', 'Alt+I'), SEP,
      item('Print Setup...', 'Alt+P'), item('Print', 'Ctrl+P', { greyed: true }), SEP,
      item('Quit', 'Ctrl+Q'),
    ],
  },
  {
    id: 'edit', label: 'Edit', items: [
      item("Can't undo", '', { greyed: true }), item("Can't redo", '', { greyed: true }), SEP,
      item('Cut', 'Ctrl+X'), item('Copy', 'Ctrl+C'), item('Paste', 'Ctrl+V', { greyed: true }), item('Paste Multiple...', 'Alt+V', { greyed: true }), SEP,
      item('Clear to Default Values', 'Del'), item('Fill with First Range Value', 'Ctrl+F'), item('Invert Values', 'Ctrl+I'), item('Reverse Values', 'Ctrl+R'),
      item('Set to Yak...', 'Ctrl+Y', { greyed: true }),
      item('Set Digitals Off', 'Ctrl+0', { action: { type: 'set-digital', on: false }, enabled: (sim) => hasSel(sim, 'light-'), control: 'menu-set-digital' }),
      item('Set Digitals On', 'Ctrl+1', { action: { type: 'set-digital', on: true }, enabled: (sim) => hasSel(sim, 'light-'), control: 'menu-set-digital' }), SEP,
      item('Set Analogs to a Value...', 'Ctrl+2', { action: { type: 'open-value-dialog' }, enabled: (sim) => hasSel(sim, 'axis-'), control: 'menu-set-analog' }),
      item('Ramp to a Value...', 'Ctrl+3'), item('Scale by Percentage...', 'Ctrl+4'), item('Shift by Percentage...', 'Ctrl+5'), item('Set Min and Max...', 'Ctrl+6'),
      item('Ramp Colors to a Value...', '', { sub: true }), SEP,
      item('Smooth', 'F9'), item('Inbetween', 'F10'), item('Setup and Inbetween', 'Shift+F10'), SEP,
      item('Select All', 'Ctrl+A', { action: { type: 'select-all' } }),
      item('Deselect All', 'Alt+A', { action: { type: 'deselect-all' } }),
      item('Invert Selection'), SEP,
      item('Insert Time', 'Ctrl+Ins'), item('Delete Time', 'Ctrl+Del'),
    ],
  },
  {
    id: 'realtime', label: 'RealTime', items: [
      item('Show Main Controls', 'F4', { action: { type: 'show-window', name: 'control' } }),
      item('Show GilderTerm', 'Shift+F4', { action: { type: 'show-window', name: 'terminal' } }),
      item('Show Soft Console', 'F5', { action: { type: 'show-window', name: 'console' } }),
      item('Show Output Monitor', 'Shift+F5'), item('Show Channel Mixer', 'F6'), item('Show Mackie Extender Dialog', '', { greyed: true }), SEP,
      item('Disable Outputs...', 'Ctrl+D'),
      item('Set Outputs to First Frame', 'Home', { action: { type: 'set-frame', frame: 0 } }),
      item('Set Outputs to Last Frame', 'End', { action: { type: 'set-frame', frame: 'last' } }), SEP,
      item('Play', 'F1', { action: { type: 'play' } }),
      item('Record', 'Ctrl+F1', { action: { type: 'record' } }),
      item('Rehearse', 'Shift+F1', { action: { type: 'rehearse' } }),
      item('Stop', 'Space', { action: { type: 'stop' }, checked: (sim) => sim.mode === 'stop' }),
      item('Pause', 'F2', { action: { type: 'pause' }, checked: (sim) => sim.mode === 'pause' }), SEP,
      item('Manual Mode', 'F3', { action: { type: 'toggle-check', key: 'manual' }, checked: (sim) => sim.checks.manual, control: 'manual-mode' }),
      item('Ease-In', '', { action: { type: 'toggle-check', key: 'easeIn' }, checked: (sim) => sim.checks.easeIn }),
      item('Auto Punch', '', { action: { type: 'toggle-check', key: 'autoPunch' }, checked: (sim) => sim.checks.autoPunch }),
      item('Auto-Inbetween', '', { action: { type: 'toggle-check', key: 'autoInbetween' }, checked: (sim) => sim.checks.autoInbetween }),
      item('Audio Cue', 'Ctrl+B', { action: { type: 'toggle-check', key: 'audioCue' }, checked: (sim) => sim.checks.audioCue }),
      item('Looping', 'Ctrl+L', { action: { type: 'toggle-check', key: 'loop' }, checked: (sim) => sim.checks.loop }), SEP,
      item('Load Console Preset...'), item('Save Console Preset...'), item('Delete Console Preset...'),
      item('DMX Console Channels...', '', { greyed: true }), item('Capture Console Channels', '', { greyed: true }),
    ],
  },
  {
    id: 'offline', label: 'Offline', items: [
      item('Hide Offline', 'F8'), item('Move to Offline', 'Shift-F8'), item('Save Offline Preset'), item('Load Offline Preset', '', { sub: true }), item('Delete Offline Preset'), SEP,
      item('Cancel Single Step', 'F2'), item('Single Step', 'Shift+F2'), item('Single Step Program', 'Ctrl+F2'), item('Single Step Speed', '', { sub: true }), SEP,
      item('Time Scale', '', { sub: true }), item('Value Scale', '', { sub: true }), SEP,
      item('Auto Scroll', '', { checked: () => true }), item('Smooth Scrolling', '', { checked: () => true }), item('Scroll Amount...'), SEP,
      item('Vertical Grid', '', { checked: () => true }), item('Horizontal Grid', '', { checked: () => true }), item('Draw Audio Wave...', '', { sub: true }),
      item('Left Channel', '', { greyed: true }), item('Right Channel', '', { greyed: true }), item('Recompute Waveform', '', { greyed: true }), SEP,
      item('Find Selected Range', 'Alt+F'), SEP,
      item('Set Color'), item('Hide', 'Ctrl+H'), item('Show All', 'Alt+H', { greyed: true }), item('Show Triggers', 'Shift+Alt+T', { checked: () => true }), item('Delete All Triggers'),
    ],
  },
  {
    id: 'channels', label: 'Channels', items: [
      item('Hide List', 'F7'), item('Sort Channel List', '', { sub: true }), item('Collapse Groups'), item('Skip GilderSum Addresses'), SEP,
      item('Show by Figures', '', { checked: () => true }), item('Show by Sequencers'), item('Show by Devices'), SEP,
      item('Add Device with Channels', '', { sub: true }), item('Add Device without Channels', '', { sub: true }), item('Add Multiple Devices', '', { sub: true }),
      item('Show by Devices to Rename', '', { greyed: true }), item('Show by Devices to Delete', '', { greyed: true }), SEP,
      item('Add Analog Channel'), item('Add Digital Channel'), item('Add Multiple Channels'),
    ],
  },
  {
    id: 'preferences', label: 'Preferences', items: [
      item('Hardware Setup', '', { sub: true }), item('Consoles'), item('Universes'), item('When selecting a different Sequencer', '', { sub: true }), SEP,
      item('Ease-In Options...'), item('Auto-Inbetweening...'), item('Looped Record Mode'), item('Looped Rehearse Mode', '', { checked: () => true }), item('Auto-Pause Enable'), SEP,
      item('Inbetweening...'), item('Cut/Paste...'), item('Rubberbanding...', 'Ctrl+F10'), item('Smoothing frames...'),
    ],
  },
  { id: 'time-out', label: 'Time Out', gap: true, action: { type: 'zoom', dir: -1 }, control: 'menu-zoom' },
  { id: 'time-in', label: 'Time In', action: { type: 'zoom', dir: 1 }, control: 'menu-zoom' },
  { id: 'values-out', label: 'Values Out', gap: true },
  { id: 'values-in', label: 'Values In' },
  {
    id: 'help', label: 'Help', items: [
      item('Index...'), item('Topic Search...', '', { greyed: true }), item('Using Help...'), SEP, item('About PCMACS...'),
    ],
  },
]);

// The shortcut menu for a RightClick on empty space in the Edit View (manual
// pp. 79-80; the screenshot's wording is used where the text differs).
export function shortcutMenu(sim, frame) {
  const sel = sim.selection.to > sim.selection.from;
  return [
    item('Set Start Here', '', { action: { type: 'set-transport-time', which: 'start', frame } }),
    item('Set Stop Here', '', { action: { type: 'set-transport-time', which: 'stop', frame } }),
    item('Loop', '', { action: { type: 'toggle-check', key: 'loop' }, checked: (s) => s.checks.loop }),
    item('Scroll While Playing', '', { checked: () => true }),
    item('Play Selection', '', { action: { type: 'play-selection', loop: false }, enabled: () => sel }),
    item('Loop Selection', '', { action: { type: 'play-selection', loop: true }, enabled: () => sel }),
    item('Set to Full Show', '', { action: { type: 'full-show' } }),
    item('New Trigger...', '', { sub: true }),
  ];
}

// Keyboard equivalents handled while focus is inside the recreated window.
// F1 stays the trainer's help key, so Play is not bound to it here.
export const SHORTCUTS = Object.freeze({
  'Ctrl+0': { type: 'set-digital', on: false },
  'Ctrl+1': { type: 'set-digital', on: true },
  'Ctrl+2': { type: 'open-value-dialog' },
  'Ctrl+A': { type: 'select-all' },
  'Alt+A': { type: 'deselect-all' },
  'Ctrl+L': { type: 'toggle-check', key: 'loop' },
  F2: { type: 'pause' },
  F3: { type: 'toggle-check', key: 'manual' },
  F4: { type: 'show-window', name: 'control' },
  'Shift+F4': { type: 'show-window', name: 'terminal' },
  F5: { type: 'show-window', name: 'console' },
  Home: { type: 'set-frame', frame: 0 },
  End: { type: 'set-frame', frame: 'last' },
});
