// The sound settings: one slider and one mute per layer (narrator, music,
// Rosie's chirps, UI cues) and the captions switch. Built for the lesson
// panel's film transport and the film's own controls. A slider previews its
// level while it is dragged (prefs-preview: the engine follows, nothing is
// rebuilt) and is remembered when it is released (prefs-set, saved across
// launches and restarts). When the browser keeps audio blocked, a Turn sound
// on control comes first.
import { el } from './dom.mjs';

const LAYERS = [['narration', 'Narrator'], ['music', 'Music'], ['mascot', 'Rosie’s chirps'], ['ui', 'Click sounds']];

export function soundSettings({ prefs, dispatch, compact = false, audioState = 'ready' }) {
  const rows = LAYERS.map(([key, label]) => el('div', { class: 'sound-row' },
    el('label', { class: 'sound-label' },
      el('input', { type: 'checkbox', 'data-fid': `mute-${key}`, checked: !prefs.muted[key], 'aria-label': `${label} on`, onchange: (e) => dispatch({ type: 'prefs-set', prefs: { muted: { [key]: !e.target.checked } } }) }),
      label),
    el('input', {
      type: 'range', min: 0, max: 100, step: 5, 'data-fid': `sound-${key}`, value: Math.round(prefs.volumes[key] * 100), 'aria-label': `${label} volume`,
      oninput: (e) => dispatch({ type: 'prefs-preview', prefs: { volumes: { [key]: Number(e.target.value) / 100 } } }),
      onchange: (e) => dispatch({ type: 'prefs-set', prefs: { volumes: { [key]: Number(e.target.value) / 100 } } }),
    })));
  return el('details', { class: `sound-settings${compact ? ' compact' : ''}`, 'data-control': 'sound-settings', 'data-keep': 'sound' },
    el('summary', { 'data-fid': 'sound', text: 'Sound' }),
    audioState === 'blocked' ? el('button', { type: 'button', class: 'btn btn-small btn-primary', 'data-control': 'sound-enable', 'data-fid': 'sound-enable', text: 'Turn sound on', onclick: () => dispatch({ type: 'sound-enable' }) }) : null,
    ...rows,
    el('label', { class: 'sound-label' },
      el('input', { type: 'checkbox', 'data-fid': 'captions', checked: prefs.captions, 'aria-label': 'Captions', onchange: (e) => dispatch({ type: 'prefs-set', prefs: { captions: e.target.checked } }) }),
      'Captions'));
}
