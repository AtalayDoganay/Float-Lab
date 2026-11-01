// What Rosie does when the pointer or keyboard focus rests on something she
// cares about (brief §16): a short dwell before any reaction, one reaction
// per element per repeat gap, a line only after a long dwell on a photo, and
// never a line or a sound for a disabled Continue. Pure: the layer feeds it
// enter / leave with the clock in seconds and reads `update(clock)`.

const REACTIONS = Object.freeze({
  start: { expression: 'alertness', chirp: true },
  continue: { expression: 'satisfaction', chirp: true },
  'continue-disabled': { expression: 'neutral', chirp: false },
  photo: { expression: 'wonder', chirp: false },
  help: { expression: 'reassuring', chirp: true },
});

export function createAttention({ dwellMs = 350, repeatMs = 4000, speakAfterMs = 1500 } = {}) {
  const dwell = dwellMs / 1000;
  const repeat = repeatMs / 1000;
  const speakAfter = speakAfterMs / 1000;
  const lastAt = new Map(); // element id -> clock of its last reaction
  let hover = null; // { kind, id, since, caption, reacted, spoke }

  function enter(kind, id, clock, { caption = null } = {}) {
    if (!REACTIONS[kind]) return;
    hover = { kind, id, since: clock, caption, reacted: false, spoke: false };
  }

  function leave() {
    hover = null;
  }

  function update(clock) {
    if (!hover) return { react: null };
    const spec = REACTIONS[hover.kind];
    const held = clock - hover.since;
    if (!hover.reacted && held >= dwell) {
      hover.reacted = true;
      const last = lastAt.get(hover.id);
      if (last !== undefined && clock - last < repeat) return { react: null };
      lastAt.set(hover.id, clock);
      return { react: { kind: hover.kind, expression: spec.expression, line: null, chirp: spec.chirp } };
    }
    if (hover.kind === 'photo' && hover.reacted && !hover.spoke && hover.caption && held >= speakAfter) {
      hover.spoke = true;
      return { react: { kind: hover.kind, expression: spec.expression, line: hover.caption, chirp: true } };
    }
    return { react: null };
  }

  return { enter, leave, update };
}
