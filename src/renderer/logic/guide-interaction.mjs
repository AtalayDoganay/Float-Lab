// How Rosie reacts to the learner's pointer, as a pure state machine the
// guide layer feeds with pointer moves, presses and the clock. Nothing here
// touches the DOM or Three.js. Her layer stays transparent to the pointer,
// so a press "on" her is only noticed, never captured: the click still
// reaches whatever is under her.
//
// Moods, highest priority first:
//   dizzy    three boops in quick succession: she wobbles with spiral eyes
//   boop     a press on her: a squash and a surprised face, then a giggle
//   giggle   the bounce after a boop
//   startle  waking up: a small hop
//   pet      the pointer stroking back and forth across her head: hearts
//   hover    the pointer resting on her: she perks up and sparkles
//   sleep    nothing has happened for a while: she dozes
//   notice   the pointer is near: she turns a little toward it
//   none
// Under a calm mood (none or notice) she also plays a small idle action
// now and then: a glance to the side, a stretch, a wiggle, a double blink.

export const NEAR_PX = 340; // how far from her the pointer still draws her attention
export const SLEEP_AFTER = 75; // seconds of nothing before she dozes
export const BOOP_WINDOW = 1.6; // three boops inside this make her dizzy
export const BOOP_FOR = 0.45;
export const GIGGLE_FOR = 0.9;
export const DIZZY_FOR = 2.4;
export const STARTLE_FOR = 0.6;
export const PET_LINGER = 0.8; // the petting mood outlives the last stroke by this
export const PET_REVERSALS = 3; // direction changes across her head that count as petting
export const IDLE_GAP = Object.freeze([6, 12]); // seconds between idle actions
export const IDLE_ACTIONS = Object.freeze({ glance: 1.2, stretch: 0.8, wiggle: 0.9, blink2: 0.5 });

const BUSY = new Set(['boop', 'giggle', 'dizzy', 'startle']);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const inside = (x, y, b) => Boolean(b) && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

export function createInteraction({ random = Math.random } = {}) {
  const s = {
    mood: 'none',
    moodAt: 0,
    hover: false,
    near: 0,
    toward: { x: 0, y: 0 },
    lastActive: 0,
    boops: [],
    pet: { reversals: 0, lastDx: 0, lastX: null, lastAt: -10, active: false },
    idle: { action: null, at: 0, next: null },
  };
  const gap = () => IDLE_GAP[0] + random() * (IDLE_GAP[1] - IDLE_GAP[0]);
  const setMood = (mood, clock) => {
    if (s.mood === mood) return;
    s.mood = mood;
    s.moodAt = clock;
  };
  const endIdle = (clock) => {
    s.idle.action = null;
    s.idle.next = clock + gap();
  };

  // `box` is her visible rectangle in window pixels, or null before she is placed.
  function pointerMove({ x, y, clock, box }) {
    s.lastActive = clock;
    if (s.mood === 'sleep') setMood('startle', clock);
    if (!box) { s.hover = false; s.near = 0; return; }
    s.hover = inside(x, y, box);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h * 0.4;
    const d = Math.hypot(x - cx, y - cy);
    s.near = s.hover ? 1 : clamp(1 - Math.max(0, d - box.w / 2) / NEAR_PX, 0, 1);
    s.toward = { x: clamp((x - cx) / NEAR_PX, -1, 1), y: clamp((cy - y) / NEAR_PX, -1, 1) };
    // Petting: strokes back and forth across the top of her (her head).
    const onHead = s.hover && y < box.y + box.h * 0.55;
    if (onHead) {
      if (clock - s.pet.lastAt > 1.2) { s.pet.reversals = 0; s.pet.lastDx = 0; s.pet.lastX = null; }
      const dx = s.pet.lastX === null ? 0 : x - s.pet.lastX;
      if (Math.abs(dx) > 2) {
        if (s.pet.lastDx !== 0 && Math.sign(dx) !== Math.sign(s.pet.lastDx)) s.pet.reversals += 1;
        s.pet.lastDx = dx;
      }
      s.pet.lastX = x;
      s.pet.lastAt = clock;
      if (s.pet.reversals >= PET_REVERSALS) s.pet.active = true;
    }
  }

  // Returns true when the press counts as a boop (on her, not on a control).
  function pointerDown({ x, y, clock, box, interactive = false }) {
    s.lastActive = clock;
    if (s.mood === 'sleep') setMood('startle', clock);
    if (interactive || !inside(x, y, box)) return false;
    if (s.mood === 'dizzy') return false;
    s.boops = s.boops.filter((t) => clock - t <= BOOP_WINDOW);
    s.boops.push(clock);
    if (s.boops.length >= 3) {
      s.boops = [];
      setMood('dizzy', clock);
    } else {
      s.mood = 'none'; // a second boop restarts the squash
      setMood('boop', clock);
    }
    return true;
  }

  function pointerLeave() {
    s.hover = false;
    s.near = 0;
  }

  // Anything else that happens to her (a new place, new words) keeps her awake.
  function activity(clock) {
    s.lastActive = clock;
    if (s.mood === 'sleep') setMood('startle', clock);
  }

  function update(clock, { reduced = false } = {}) {
    const since = clock - s.moodAt;
    if (s.mood === 'boop' && since >= BOOP_FOR) setMood('giggle', clock);
    else if (s.mood === 'giggle' && since >= GIGGLE_FOR) setMood('none', clock);
    else if (s.mood === 'dizzy' && since >= DIZZY_FOR) setMood('none', clock);
    else if (s.mood === 'startle' && since >= STARTLE_FOR) setMood('none', clock);
    if (s.pet.active && clock - s.pet.lastAt > PET_LINGER) { s.pet.active = false; s.pet.reversals = 0; }
    if (!BUSY.has(s.mood)) {
      if (s.pet.active) setMood('pet', clock);
      else if (s.hover) setMood('hover', clock);
      else if (clock - s.lastActive >= SLEEP_AFTER) setMood('sleep', clock);
      else if (s.near > 0.35) setMood('notice', clock);
      else setMood('none', clock);
    }

    const calm = s.mood === 'none' || s.mood === 'notice';
    if (s.idle.next === null) s.idle.next = clock + gap();
    if (s.idle.action && (!calm || reduced || clock - s.idle.at >= IDLE_ACTIONS[s.idle.action])) endIdle(clock);
    if (!s.idle.action && calm && !reduced && clock >= s.idle.next) {
      const names = Object.keys(IDLE_ACTIONS);
      s.idle.action = names[Math.min(names.length - 1, Math.floor(random() * names.length))];
      s.idle.at = clock;
    }

    return {
      mood: s.mood,
      since: clock - s.moodAt,
      hover: s.hover,
      near: s.near,
      toward: { ...s.toward },
      idle: s.idle.action ? { action: s.idle.action, since: clock - s.idle.at } : null,
    };
  }

  return { pointerMove, pointerDown, pointerLeave, activity, update };
}
