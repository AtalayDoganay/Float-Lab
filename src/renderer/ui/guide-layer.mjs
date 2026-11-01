// The floating guide layer: Rosie herself (a WebGL canvas, or the bundled
// sprite when WebGL is unavailable), her speech bubble, and the welcome
// backdrop, all in one fixed layer over the whole window. The app hands the
// layer a plan after every render; the layer resolves the plan's anchor to a
// rectangle, places her beside it, flies her there on a spring, poses and
// animates her, and keeps the bubble at her side. Outside the welcome the
// layer is transparent to the pointer, so she never blocks a click.
import { el, replace } from './dom.mjs';
import { mascotSrc } from '../content/mascot.mjs';
import { ROSIE_BOX, placeBeside, placeAtDock, placeAtCenter, placeAtCorner, placeCover, visibleBox } from '../logic/guide-placement.mjs';
import { springAdvance, bank, squashAt, nextBlinkDelay, blinkAmount, talkEnvelope, settled } from '../logic/motion.mjs';
import { createStage } from '../guide/stage.mjs';
import { buildRosie, poseFor, applyPose, COLORS } from '../guide/rosie-model.mjs';
import { FACE_SIZE, faceParams, drawFace } from '../guide/face.mjs';
import { createEffects } from '../guide/effects.mjs';
import { createInteraction } from '../logic/guide-interaction.mjs';
import { createAttention } from '../logic/attention.mjs';

const INERT_SELECTORS = ['header', 'main', '#persistence-notice'];
const WELCOME_LABEL = 'Welcome from Rosie, the guide';
const HEAD_STAGE_Y = 0.5; // where her head sits in stage units, for the burst
const TRAIL_SPEED = 160; // px/s above which she sheds petals
const TRAIL_EVERY = 0.045;
const HEARTS_EVERY = 0.55; // while she is petted
const DOZE_EVERY = 1.6; // while she sleeps
// A press on one of these is a click the learner meant for the page, never a boop.
const INTERACTIVE = 'button, a, input, select, textarea, summary, label, [role="button"], [role="menuitem"], [role="tab"], [role="option"], dialog, .pc-menu, .win';

function makeSpriteTexture(THREE, kind) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (kind === 'sparkle') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? 30 : 9;
      ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'heart') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(32, 56);
    ctx.bezierCurveTo(6, 36, 4, 14, 20, 12);
    ctx.bezierCurveTo(27, 11, 31, 16, 32, 20);
    ctx.bezierCurveTo(33, 16, 37, 11, 44, 12);
    ctx.bezierCurveTo(60, 14, 58, 36, 32, 56);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'zzz') {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('z', 32, 34);
  } else {
    const g = ctx.createRadialGradient(28, 26, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(1, 'rgba(255, 210, 220, 0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(32, 32, 30, 20, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const rectOf = (node) => {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
};

export function mountGuideLayer({ dispatch, findControl, THREE, audio = null }) {
  const layer = document.getElementById('guide-layer');
  const backdrop = document.getElementById('welcome-backdrop');
  const rosie = document.getElementById('rosie');
  const bubble = document.getElementById('rosie-bubble');
  const helpLabel = document.getElementById('rosie-help');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedOverride = null; // the smoke harness can force reduced motion on or off
  let reduced = reduceQuery.matches;
  const syncReduced = () => { reduced = reducedOverride === null ? reduceQuery.matches : reducedOverride; };
  reduceQuery.addEventListener('change', syncReduced);

  // ---- her artwork: WebGL when it works, the sprite otherwise
  let mode = 'sprite';
  let stage = null;
  let model = null;
  let fx = null;
  let faceCanvas = null;
  let faceTexture = null;
  let faceKey = '';
  let img = null;

  function setupSprite(expression) {
    if (stage) { stage.dispose(); stage = null; model = null; fx = null; }
    replace(rosie);
    img = el('img', { class: 'mascot', src: mascotSrc(expression), alt: '', 'aria-hidden': 'true', draggable: 'false', width: ROSIE_BOX.w, height: ROSIE_BOX.h });
    rosie.append(img);
    mode = 'sprite';
  }

  function setupWebGL() {
    try {
      const canvas = el('canvas', { width: ROSIE_BOX.w, height: ROSIE_BOX.h, 'aria-hidden': 'true' });
      stage = createStage(THREE, canvas, { width: ROSIE_BOX.w, height: ROSIE_BOX.h, pixelRatio: window.devicePixelRatio || 1 });
      if (!stage) return false;
      faceCanvas = document.createElement('canvas');
      faceCanvas.width = FACE_SIZE;
      faceCanvas.height = FACE_SIZE;
      faceTexture = new THREE.CanvasTexture(faceCanvas);
      faceTexture.colorSpace = THREE.SRGBColorSpace;
      faceTexture.anisotropy = 4;
      model = buildRosie(THREE, { faceTexture });
      stage.root.add(model.root);
      fx = createEffects(THREE, stage.scene, { makeTexture: (kind) => makeSpriteTexture(THREE, kind) });
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        setupSprite(expression);
      });
      replace(rosie, canvas);
      mode = 'webgl';
      return true;
    } catch {
      stage = null;
      model = null;
      fx = null;
      return false;
    }
  }

  // ---- state
  let plan = null;
  let scene = 'none';
  let modal = false;
  let anchorKey = '';
  let textKey = '';
  let expression = 'happy';
  let expressionAt = 0;
  let talkAt = -10;
  let pendingBurst = false;
  let pendingPuff = false;
  const interaction = createInteraction();
  let mood = 'none';
  let moodNear = 0;
  let heartsAt = -10;
  let dozeAt = -10;
  let boops = 0;
  let flights = 0;
  let talks = 0;
  let placed = false;
  const pos = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
  let goal = null; // the latest placement result
  let resolved = 'none';
  let anchorRect = null;
  let facing = 'right';
  let flying = false;
  let arrivedAt = -10;
  let trailClock = 0;
  let clock = 0;
  let lastFrame = 0;
  let rafId = 0;
  let timerId = 0;
  let frames = 0;
  let pageVisible = document.visibilityState !== 'hidden';
  let blinkAt = -10;
  let blinkNext = nextBlinkDelay();
  const pointer = { x: -1, y: -1 };
  let bubbleSize = { w: 320, h: 120 };

  // Hover and focus reactions on the page's [data-react] elements (brief §16),
  // rate-limited by the attention machine; a reaction overlays the plan's
  // expression for a moment, with a line for a long dwell on a photo.
  const attention = createAttention();
  let reaction = null; // { expression, line, until }
  let reactionKey = '';
  let override = null; // { expression, glasses } forced by the review harness
  const reactTarget = (t) => (t instanceof Element ? t.closest('[data-react]') : null);
  const enterReact = (node) => { if (node) attention.enter(node.dataset.react, node.dataset.fid || node.dataset.react, clock, { caption: node.dataset.caption || null }); };
  document.addEventListener('pointerover', (event) => { const n = reactTarget(event.target); if (n) enterReact(n); }, { passive: true });
  document.addEventListener('pointerout', (event) => { const n = reactTarget(event.target); if (n && !n.contains(event.relatedTarget)) attention.leave(); }, { passive: true });
  document.addEventListener('focusin', (event) => { const n = reactTarget(event.target); if (n) enterReact(n); });
  document.addEventListener('focusout', (event) => { if (reactTarget(event.target)) attention.leave(); });

  const herBox = () => (placed ? visibleBox({ x: pos.x.x, y: pos.y.x }) : null);
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    interaction.pointerMove({ x: pointer.x, y: pointer.y, clock, box: herBox() });
  }, { passive: true });
  // Her layer never takes the pointer; a press on her is only noticed, and the
  // click goes on to whatever is under her. A press on a control is never a boop.
  window.addEventListener('pointerdown', (event) => {
    if (scene === 'none' || layer.hidden) return;
    const t = event.target;
    const interactive = Boolean(t && t.closest && t.closest(INTERACTIVE));
    if (interaction.pointerDown({ x: event.clientX, y: event.clientY, clock, box: herBox(), interactive })) {
      pendingPuff = true;
      boops += 1;
      // During practice a click on her is a call for help (brief §7).
      if (plan && plan.help) dispatch({ type: 'help-open-menu' });
    }
  }, { passive: true, capture: true });
  document.addEventListener('pointerleave', () => { pointer.x = -1; pointer.y = -1; interaction.pointerLeave(); });
  document.addEventListener('keydown', (event) => {
    if (modal && event.key === 'Escape') { event.preventDefault(); dispatch({ type: 'welcome-done' }); }
  });

  function setModal(on) {
    if (on === modal) return;
    modal = on;
    layer.classList.toggle('is-modal', on);
    backdrop.hidden = !on;
    for (const selector of INERT_SELECTORS) {
      const node = document.querySelector(selector);
      if (node) node.inert = on;
    }
    if (on) {
      bubble.setAttribute('role', 'dialog');
      bubble.setAttribute('aria-modal', 'true');
      bubble.setAttribute('aria-label', WELCOME_LABEL);
    } else {
      bubble.removeAttribute('role');
      bubble.removeAttribute('aria-modal');
      bubble.removeAttribute('aria-label');
    }
  }

  function buildBubble(p) {
    const nodes = [];
    if (p.title) nodes.push(el('h2', { class: 'bubble-title', text: p.title }));
    p.lines.forEach((line, i) => {
      const feedback = i === 0 && p.feedbackOk !== null;
      nodes.push(el('p', { class: feedback ? (p.feedbackOk ? 'ok' : 'bad') : null, 'data-ref': feedback ? 'feedback' : null, text: line }));
    });
    if (p.welcome) {
      const w = p.welcome;
      nodes.push(el('div', { class: 'welcome-actions' },
        el('span', { class: 'welcome-count', text: `${w.step + 1} of ${w.total}` }),
        el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'welcome-skip', text: w.skip, onclick: () => dispatch({ type: 'welcome-done' }) }),
        el('button', { type: 'button', class: 'btn btn-primary', 'data-fid': 'welcome-next', text: w.button, onclick: () => dispatch({ type: w.last ? 'welcome-done' : 'welcome-next' }) })));
    }
    replace(bubble, ...nodes);
    bubble.hidden = nodes.length === 0;
    bubbleSize = { w: bubble.offsetWidth || 320, h: bubble.offsetHeight || 120 };
  }

  // ---- placement
  function viewport() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  // Rectangles she and her bubble keep off, weighted: the panel and the
  // handbook, every recreated window (the one that holds the target weighs
  // double), and the panel's action rows (heaviest: the buttons the learner
  // needs next).
  function avoidRects(ownWindow = null) {
    const out = [];
    for (const id of ['panel', 'handbook']) {
      const r = rectOf(document.getElementById(id));
      if (r) out.push({ ...r, weight: 1 });
    }
    for (const node of document.querySelectorAll('.desk .win')) {
      const r = rectOf(node);
      if (r) out.push({ ...r, weight: node === ownWindow ? 2 : 1 });
    }
    for (const node of document.querySelectorAll('#panel .beat-actions, #panel .nav-row, .hub-actions, #robot')) {
      const r = rectOf(node);
      if (r) out.push({ ...r, weight: 4 });
    }
    for (const node of document.querySelectorAll('.hub-print, #stage .lesson-rows')) {
      const r = rectOf(node);
      if (r) out.push({ ...r, weight: 2 });
    }
    return out;
  }

  function dockPlacement(vp, id = 'guide-dock') {
    const node = document.getElementById(id);
    const dock = rectOf(node);
    if (dock) { resolved = 'dock'; anchorRect = dock; return placeAtDock({ dock, viewport: vp, bubble: bubbleSize, avoid: avoidRects(), facing: node.dataset.facing || 'right' }); }
    resolved = 'corner';
    anchorRect = null;
    return placeAtCorner({ viewport: vp, bubble: bubbleSize });
  }

  function resolvePlacement() {
    const vp = viewport();
    const anchor = plan.anchor;
    if (anchor.kind === 'control') {
      const node = findControl(anchor.id);
      const target = rectOf(node);
      if (target) {
        // She prefers to stay off the window the target sits in, so its other controls stay readable.
        const ownWindow = node.closest('.win');
        const win = rectOf(ownWindow);
        const r = placeBeside({ viewport: vp, target, bubble: bubbleSize, avoid: avoidRects(ownWindow), clear: win });
        if (!r.overlapsTarget) { resolved = 'control'; anchorRect = target; return r; }
      }
      return dockPlacement(vp);
    }
    if (anchor.kind === 'cover') {
      const target = rectOf(findControl(anchor.id));
      if (target) { resolved = 'cover'; anchorRect = target; return placeCover({ target, viewport: vp, bubble: bubbleSize, avoid: [] }); }
      return dockPlacement(vp);
    }
    if (anchor.kind === 'dock') return dockPlacement(vp, anchor.id || 'guide-dock');
    if (anchor.kind === 'center') { resolved = 'center'; anchorRect = null; return placeAtCenter({ viewport: vp, bubble: bubbleSize }); }
    resolved = 'corner';
    anchorRect = null;
    return placeAtCorner({ viewport: vp, bubble: bubbleSize });
  }

  // ---- the frame
  function lookAt() {
    // Toward the pointer when it is in the window, toward the target when she points.
    const cx = pos.x.x + ROSIE_BOX.w / 2;
    const cy = pos.y.x + ROSIE_BOX.h * 0.35;
    let x = 0;
    let y = 0;
    if (pointer.x >= 0) {
      x = Math.max(-1, Math.min(1, (pointer.x - cx) / 500));
      y = Math.max(-1, Math.min(1, (cy - pointer.y) / 400));
    }
    if (expression === 'point') x = facing === 'left' ? -0.75 : 0.75;
    return { x, y };
  }

  function drawFaceIfNeeded(look, blink, mouthOpen) {
    if (!faceCanvas) return;
    const key = [expression, mood, Math.round(look.x * 20), Math.round(look.y * 20), Math.round(blink * 10), Math.round(mouthOpen * 8)].join(',');
    if (key === faceKey) return;
    faceKey = key;
    drawFace(faceCanvas.getContext('2d'), faceParams(expression, mood), { look, blink, mouthOpen });
    faceTexture.needsUpdate = true;
  }

  // An idle glance: her eyes go to one side, then the other.
  const glanceLook = (since) => ({ x: since < 0.6 ? -0.9 : 0.9, y: 0.15 });
  const doubleBlink = (since) => Math.max(blinkAmount(since), blinkAmount(since - 0.24));

  function tick(now) {
    rafId = 0;
    if (timerId) { clearTimeout(timerId); timerId = 0; }
    if (!plan || scene === 'none' || !pageVisible) return;
    frames += 1;
    syncReduced();
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.25) : 1 / 60;
    lastFrame = now;
    clock += dt;

    goal = resolvePlacement();
    facing = goal.facing;
    const jump = !placed || reduced;
    if (jump) {
      pos.x = { x: goal.x, v: 0 };
      pos.y = { x: goal.y, v: 0 };
      if (!placed) arrivedAt = clock;
      placed = true;
    } else {
      pos.x = springAdvance(pos.x, goal.x, dt);
      pos.y = springAdvance(pos.y, goal.y, dt);
    }
    const moving = !(settled(pos.x, goal.x) && settled(pos.y, goal.y));
    if (flying && !moving) arrivedAt = clock;
    flying = moving;
    const speed = Math.hypot(pos.x.v, pos.y.v);

    rosie.style.transform = `translate3d(${pos.x.x.toFixed(1)}px, ${pos.y.x.toFixed(1)}px, 0)`;
    bubble.dataset.side = goal.bubble.side;
    bubble.style.transform = `translate3d(${(goal.bubble.x - goal.x + pos.x.x).toFixed(1)}px, ${(goal.bubble.y - goal.y + pos.y.x).toFixed(1)}px, 0)`;
    // The help label rides above her head throughout practice.
    const showHelp = Boolean(plan.help);
    if (helpLabel.hidden === showHelp) helpLabel.hidden = !showHelp;
    if (showHelp) {
      const lw = helpLabel.offsetWidth || 180;
      const lh = helpLabel.offsetHeight || 30;
      const lx = Math.min(Math.max(4, pos.x.x + ROSIE_BOX.w / 2 - lw / 2), window.innerWidth - lw - 4);
      const ly = Math.max(4, pos.y.x + ROSIE_BOX.inset - lh - 6);
      helpLabel.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
    }

    // Reactions to what the pointer rests on, laid over the plan for a moment.
    const r = attention.update(clock).react;
    if (r) {
      reaction = { expression: r.expression, line: r.line, until: clock + (r.line ? 3.5 : 1.4) };
      if (r.chirp && audio) { if (r.line) audio.chirp(r.line, 'neutral'); else audio.cue('hover'); }
      interaction.activity(clock);
    }
    if (reaction && clock >= reaction.until) reaction = null;
    const wantExpression = override ? override.expression : (reaction ? reaction.expression : plan.expression);
    if (wantExpression !== expression) {
      expression = wantExpression;
      expressionAt = clock;
      faceKey = '';
      if (img) img.src = mascotSrc(expression);
    }
    const nextReactionKey = reaction && reaction.line ? reaction.line : '';
    if (nextReactionKey !== reactionKey) {
      reactionKey = nextReactionKey;
      buildBubble(reactionKey ? { ...plan, title: null, lines: [reactionKey], welcome: null, feedbackOk: null } : plan);
      if (reactionKey) talkAt = clock;
    }

    // Blink schedule.
    if (clock - blinkAt >= blinkNext) { blinkAt = clock; blinkNext = nextBlinkDelay(); }
    const talk = talkEnvelope(clock - talkAt);
    const snap = interaction.update(clock, { reduced });
    mood = snap.mood;
    moodNear = snap.near;
    const idle = snap.idle;
    const look = idle && idle.action === 'glance' ? glanceLook(idle.since) : lookAt();
    const blink = idle && idle.action === 'blink2' ? doubleBlink(idle.since) : blinkAmount(clock - blinkAt);

    if (mode === 'webgl' && model) {
      const pose = poseFor({ expression, t: clock - expressionAt, phase: clock, look, facing, reduced, mood, moodT: snap.since, idle, toward: snap.toward, near: snap.near, glasses: override ? Boolean(override.glasses) : Boolean(plan.glasses) });
      const lean = reduced ? { roll: 0, pitch: 0 } : bank(pos.x.v, pos.y.v);
      pose.root.roll += lean.roll;
      pose.root.pitch += lean.pitch;
      const squash = squashAt(clock - arrivedAt);
      pose.root.sx *= squash.sx;
      pose.root.sy *= squash.sy;
      pose.head.pitch += reduced ? 0 : talk.nod;
      applyPose(model.parts, pose);
      drawFaceIfNeeded(look, blink, reduced ? 0 : talk.mouth);
      if (fx) {
        if (pendingBurst) { pendingBurst = false; if (!reduced) fx.burst(0, HEAD_STAGE_Y, 0.3); }
        if (pendingPuff) { pendingPuff = false; if (!reduced) fx.puff(0, HEAD_STAGE_Y, 0.4); }
        if (mood === 'pet' && clock - heartsAt >= HEARTS_EVERY) { heartsAt = clock; if (!reduced) fx.hearts(0, HEAD_STAGE_Y + 0.7, 0.3); }
        if (mood === 'sleep' && clock - dozeAt >= DOZE_EVERY) { dozeAt = clock; if (!reduced) fx.doze(0.55, HEAD_STAGE_Y + 0.6, 0.3); }
        if (!reduced && speed > TRAIL_SPEED) {
          trailClock += dt;
          if (trailClock >= TRAIL_EVERY) { trailClock = 0; fx.trail(0, 0.1, 0.2, pos.x.v, pos.y.v); }
        }
        fx.update(dt);
      }
      stage.render();
    } else if (img) {
      const lean = reduced ? { roll: 0 } : bank(pos.x.v, pos.y.v);
      img.style.transform = `rotate(${(lean.roll * 57.3).toFixed(1)}deg)`;
    }
    schedule();
  }

  // One frame per animation frame while she is shown and the page is
  // visible, with a slow timer behind it: a window that reports itself
  // visible can still stop delivering animation frames (the hidden smoke
  // window does once WebGL is drawn). Nothing runs while the page is hidden
  // or minimised.
  function schedule() {
    if (scene === 'none' || layer.hidden || !pageVisible) return;
    if (!rafId) rafId = requestAnimationFrame(tick);
    if (!timerId) timerId = setTimeout(() => { timerId = 0; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } tick(performance.now()); }, 120);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    if (timerId) clearTimeout(timerId);
    rafId = 0;
    timerId = 0;
    lastFrame = 0;
  }

  function setVisible(on) {
    pageVisible = Boolean(on);
    if (pageVisible) schedule(); else stop();
  }
  document.addEventListener('visibilitychange', () => setVisible(document.visibilityState !== 'hidden'));

  function setReduced(force) {
    reducedOverride = force === null || force === undefined ? null : Boolean(force);
    syncReduced();
  }

  // Outside the welcome and the lessons, the bubble is a polite status
  // region: it is rebuilt only when her words change, so each change is
  // announced once. Lessons announce through the panel's live region; the
  // welcome is a dialog (set by setModal).
  function setBubbleRole(forScene) {
    if (forScene === 'welcome') return;
    if (forScene === 'lesson') { bubble.removeAttribute('role'); bubble.removeAttribute('aria-live'); return; }
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');
  }

  // ---- the app's entry point
  function update(next) {
    plan = next;
    if (next.scene === 'none') {
      scene = 'none';
      setModal(false);
      layer.hidden = true;
      helpLabel.hidden = true;
      stop();
      return;
    }
    if (layer.hidden) { layer.hidden = false; if (!img && !stage) { if (!setupWebGL()) setupSprite(next.expression); } }
    const closingWelcome = modal && next.scene !== 'welcome';
    scene = next.scene;
    layer.dataset.scene = scene;
    setModal(scene === 'welcome');
    setBubbleRole(scene);

    const nextAnchorKey = `${next.anchor.kind}:${next.anchor.id || ''}`;
    if (nextAnchorKey !== anchorKey) { anchorKey = nextAnchorKey; if (placed) flights += 1; interaction.activity(clock); }

    const nextTextKey = [next.title || '', next.feedbackOk, next.welcome ? next.welcome.step : '', ...next.lines].join('\u0001');
    if (nextTextKey !== textKey) {
      textKey = nextTextKey;
      reaction = null;
      reactionKey = '';
      buildBubble(next);
      talks += 1;
      talkAt = clock;
      interaction.activity(clock);
    }
    if (next.expression !== expression && !reaction) {
      expression = next.expression;
      expressionAt = clock;
      faceKey = '';
      if (expression === 'cheer') pendingBurst = true;
      if (img) img.src = mascotSrc(expression);
    }
    if (modal && !bubble.contains(document.activeElement)) bubble.querySelector('[data-fid="welcome-next"]')?.focus({ preventScroll: true });
    // The welcome held the keyboard; hand it to Home's primary action when it closes.
    if (closingWelcome) {
      const active = document.activeElement;
      if (!active || active === document.body || bubble.contains(active)) document.querySelector('[data-control="resume"], [data-control="start-learning"]')?.focus({ preventScroll: true });
    }
    schedule();
  }

  function debug() {
    const b = bubble.hidden ? null : rectOf(bubble);
    return {
      mode,
      scene,
      anchor: plan ? plan.anchor : null,
      resolved,
      anchorRect,
      position: { x: pos.x.x, y: pos.y.x },
      visible: placed ? visibleBox({ x: pos.x.x, y: pos.y.x }) : null,
      bubbleRect: b,
      bubbleText: bubble.textContent,
      expression,
      mood,
      near: moodNear,
      boops,
      facing,
      side: goal ? goal.side : null,
      flying,
      flights,
      talks,
      reduced,
      frames,
      pageVisible,
      help: !helpLabel.hidden,
      helpRect: helpLabel.hidden ? null : rectOf(helpLabel),
      glasses: override ? Boolean(override.glasses) : Boolean(plan && plan.glasses),
    };
  }

  function setOverride(o) {
    override = o && o.expression ? { expression: o.expression, glasses: Boolean(o.glasses) } : null;
    faceKey = '';
  }

  return { update, debug, setVisible, setReduced, setOverride };
}
