// What the simulated outputs are doing at this moment. While a show plays (or
// is paused) the outputs carry the show data at the current frame (manual
// p. 201). When stopped with Manual mode on, the Soft Console drives them
// live (p. 204, p. 117). When stopped with Manual off the trainer holds the
// show's values at the current frame; the manual does not say what real
// outputs do then, so this is labelled a trainer assumption.
import { ANALOG_CHANNELS, DIGITAL_CHANNELS, LAST_FRAME } from './simulation.mjs';

export function outputSource(sim) {
  if (sim.mode === 'play' || sim.mode === 'pause') return 'show';
  return sim.checks.manual ? 'manual' : 'hold';
}

export function computeOutputs(sim) {
  const source = outputSource(sim);
  const f = Math.min(Math.max(sim.frame, 0), LAST_FRAME);
  return {
    source,
    analogs: ANALOG_CHANNELS.map(({ axis }) => {
      if (source !== 'manual') return sim.analogs[axis][f];
      return sim.bump === axis ? 255 : sim.console[axis];
    }),
    lights: Object.fromEntries(DIGITAL_CHANNELS.map(({ id }) => [id, source === 'manual' ? Boolean(sim.consoleDigital[id]) : Boolean(sim.lights[id][f])])),
  };
}
