// Robot Rosie's preview beside the recreated windows (brief, confirmed
// direction 3 and 7): a separate mechanical model driven by the simulated
// outputs at the playhead (or the Soft Console in Manual mode), labelled as a
// simulated preview with a proposed, unconfirmed mapping. WebGL when it
// works; a flat 2D drawing of the same petals otherwise. Renders only while
// revealed and the page is visible, and only when the pose changes.
import { el, replace } from './dom.mjs';
import { ROBOT_MAPPING, ROBOT_MAPPING_NOTE, robotReadout } from '../content/robot-mapping.mjs';
import { buildRobot, robotPose, applyRobotPose, OPEN_ANGLE, COLORS } from '../guide/robot-model.mjs';
import { createStage } from '../guide/stage.mjs';
import { outputSource } from '../logic/outputs.mjs';

const W = 240;
const H = 230;

export function mountRobotPreview(aside, { THREE }) {
  const canvas = el('canvas', { width: W, height: H, 'aria-hidden': 'true', class: 'robot-canvas' });
  const value = el('div', { class: 'robot-value', 'data-ref': 'robot-value', tabindex: '0' });
  const source = el('div', { class: 'robot-source', 'data-ref': 'robot-source' });
  const m = ROBOT_MAPPING['light-1'];
  replace(aside,
    el('header', { class: 'robot-head' }, el('strong', { text: 'Robot Rosie' }), el('span', { class: 'robot-badge', text: 'Simulated preview' })),
    canvas,
    value,
    source,
    el('p', { class: 'robot-map', text: `Digital 0 → ${m.part}: ON = ${m.on}, OFF = ${m.off}.` }),
    el('p', { class: 'robot-note', text: ROBOT_MAPPING_NOTE }));

  let stage = null;
  let robot = null;
  let mode = 'none';
  let raf = 0;
  let lastKey = '';
  let lastPose = null;
  let t0 = performance.now();
  let shown = false;

  function setup() {
    if (mode !== 'none') return;
    try {
      stage = createStage(THREE, canvas, { width: W, height: H, pixelRatio: window.devicePixelRatio || 1 });
      if (stage) {
        stage.camera.position.set(0.3, 0.55, 5.6);
        stage.camera.lookAt(0, 0.1, 0);
        robot = buildRobot(THREE);
        stage.root.add(robot.root);
        robot.root.rotation.y = -0.35;
        mode = 'webgl';
        canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage = null; robot = null; mode = '2d'; });
        return;
      }
    } catch { stage = null; robot = null; }
    mode = '2d';
  }

  // The same robot, flat: a box, a drum, six petal lines that swing out, a lamp.
  function draw2d(pose) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.metalDark; ctx.fillRect(40, 180, 160, 22);
    ctx.fillStyle = COLORS.metal; ctx.fillRect(70, 110, 100, 70);
    ctx.fillStyle = COLORS.rivet; for (const [x, y] of [[78, 118], [162, 118], [78, 172], [162, 172]]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = COLORS.metalDark; ctx.fillRect(112, 92, 16, 20);
    ctx.fillStyle = COLORS.metal; ctx.beginPath(); ctx.ellipse(120, 70, 34, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.petal; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      const base = -Math.PI / 2 + (i - 2.5) * 0.28;
      const a = base + (i < 3 ? -1 : 1) * pose.petalAngle * 0.6;
      ctx.beginPath(); ctx.moveTo(120 + Math.cos(base) * 22, 60 + Math.sin(base) * 14); ctx.lineTo(120 + Math.cos(a) * 60, 60 + Math.sin(a) * 50); ctx.stroke();
    }
    ctx.fillStyle = pose.eyeLamp ? COLORS.lampOn : COLORS.lampOff; ctx.beginPath(); ctx.arc(120, 72, 8, 0, Math.PI * 2); ctx.fill();
  }

  function frame() {
    raf = 0;
    if (!shown || document.visibilityState === 'hidden' || !lastPose) return;
    const pose = { ...lastPose, hum: robotPose({ outputs: { lights: { 'light-1': lastPose.eyeLamp } }, t: (performance.now() - t0) / 1000 }).hum };
    if (mode === 'webgl' && robot) { applyRobotPose(robot.parts, robot.materials, pose, THREE); stage.render(); }
    else draw2d(pose);
    if (pose.eyeLamp) raf = requestAnimationFrame(frame); // a faint hum while ON, at most the display rate
  }

  function update({ sim, revealed = [] }) {
    const show = revealed.includes('robot');
    if (aside.hidden === show) aside.hidden = !show;
    shown = show;
    if (!show) { if (raf) { cancelAnimationFrame(raf); raf = 0; } return; }
    setup();
    const src = outputSource(sim);
    const r = robotReadout({ outputs: sim.outputs, source: src, frame: sim.frame });
    value.textContent = r.value;
    value.classList.toggle('is-on', r.on);
    source.textContent = r.source;
    const key = `${r.on}|${mode}`;
    if (key !== lastKey || !lastPose) {
      lastKey = key;
      lastPose = robotPose({ outputs: sim.outputs, t: 0 });
      if (!raf) raf = requestAnimationFrame(frame);
    }
  }

  return { update, debug: () => ({ mode, value: value.textContent, source: source.textContent, on: value.classList.contains('is-on'), petalAngle: lastPose ? lastPose.petalAngle : null, openAngle: OPEN_ANGLE }) };
}
