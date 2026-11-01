// User preferences that survive a restart of the training run: the volume
// and mute of each sound layer, captions, the restart-confirmation style,
// and an optional reduced-motion override. Shared by the main process (store
// + IPC validation) and the renderer. Anything that does not validate is
// replaced by its default rather than refused: a preference file is never a
// reason to block the app.

export const SOUND_LAYERS = Object.freeze(['narration', 'music', 'mascot', 'ui']);

export const DEFAULT_PREFS = Object.freeze({
  volumes: Object.freeze({ narration: 1, music: 0.6, mascot: 0.8, ui: 0.5 }),
  muted: Object.freeze({ narration: false, music: false, mascot: false, ui: false }),
  captions: true,
  simpleConfirm: false,
  reducedMotion: null,
});

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);
const clamp01 = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : fallback);

export function validatePrefs(input) {
  if (input === undefined || input === null) return { ok: true, value: DEFAULT_PREFS };
  if (!isPlainObject(input)) return { ok: false, error: 'not-an-object' };
  const volumesIn = isPlainObject(input.volumes) ? input.volumes : {};
  const mutedIn = isPlainObject(input.muted) ? input.muted : {};
  return {
    ok: true,
    value: {
      volumes: Object.fromEntries(SOUND_LAYERS.map((k) => [k, clamp01(volumesIn[k], DEFAULT_PREFS.volumes[k])])),
      muted: Object.fromEntries(SOUND_LAYERS.map((k) => [k, bool(mutedIn[k], DEFAULT_PREFS.muted[k])])),
      captions: bool(input.captions, DEFAULT_PREFS.captions),
      simpleConfirm: bool(input.simpleConfirm, DEFAULT_PREFS.simpleConfirm),
      reducedMotion: typeof input.reducedMotion === 'boolean' ? input.reducedMotion : null,
    },
  };
}
