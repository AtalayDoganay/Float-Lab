// Which part of Robot Rosie the first digital channel drives, as a proposal
// for Atalay's review (brief: "do not silently substitute a generic lamp or
// invent a physical mapping"). Change the mapping here and nowhere else.
import { formatTime } from '../logic/simulation.mjs';

export const ROBOT_MAPPING = Object.freeze({
  'light-1': Object.freeze({ part: 'petals', on: 'petals open', off: 'petals closed', status: 'proposed' }),
  'light-2': null,
});

export const ROBOT_MAPPING_NOTE = 'Proposed mapping, not confirmed: which Robot Rosie part Digital 0 drives is still Atalay’s decision. No real robot, wiring or controller behaviour is claimed.';

const SOURCE_TEXT = {
  show: (frame) => `Following the show at ${formatTime(frame)}`,
  hold: (frame) => `Stopped: holding frame ${formatTime(frame)}`,
  manual: () => 'Manual mode: the Soft Console drives the outputs',
};

// The preview's readout: the channel, its logical value, and where the value comes from.
export function robotReadout({ outputs, source, frame }) {
  const on = Boolean(outputs && outputs.lights && outputs.lights['light-1']);
  return { on, value: `Digital 0: ${on ? 'ON (1)' : 'OFF (0)'}`, source: (SOURCE_TEXT[source] || SOURCE_TEXT.hold)(frame) };
}
