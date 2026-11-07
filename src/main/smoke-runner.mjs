// Hidden-window smoke harness. Runs only when ROSEFLOW_SMOKE=1. Drives the real
// renderer through window.roseflowDebug (exposed only in smoke mode), records
// every non-local network request, and prints one SMOKE_RESULT JSON line.
// The window is never shown, so these checks cannot take focus or input.

import fs from 'node:fs/promises';
import path from 'node:path';

const SCENARIOS = ['first', 'resume', 'malformed', 'savefail', 'loadfail', 'legacy', 'legacy2', 'practice', 'course', 'sheet', 'record', 'zoom'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createSmokeRunner({ session, store }) {
  const scenario = SCENARIOS.includes(process.env.ROSEFLOW_SMOKE_SCENARIO)
    ? process.env.ROSEFLOW_SMOKE_SCENARIO
    : 'first';
  const networkRequests = [];
  session.webRequest.onBeforeRequest((details, callback) => {
    if (!/^(file|devtools|chrome-extension|data|blob):/.test(details.url)) networkRequests.push(details.url);
    callback({});
  });

  if (scenario === 'savefail') {
    // Simulate an unwritable progress file without breaking Electron's own user-data use.
    const original = store.current.save;
    store.current.save = async () => ({ ok: false, error: 'EACCES: simulated write failure (smoke test)' });
    store.current._originalSave = original;
  }
  if (scenario === 'loadfail') {
    // Simulate a progress file that exists but cannot be read (locked by another program).
    store.current._originalLoad = store.current.load;
    store.current.load = async () => ({ ok: false, error: 'EBUSY: resource busy or locked (simulated, smoke test)' });
  }

  const results = [];
  const check = (name, ok, detail) => {
    results.push({ name, ok: Boolean(ok), detail: detail === undefined ? null : detail });
  };

  async function run(win) {
    const consoleErrors = [];
    win.webContents.on('console-message', (event) => {
      if (event.level === 'error') consoleErrors.push(event.message);
    });

    try {
      await new Promise((resolve, reject) => {
        win.webContents.once('did-finish-load', resolve);
        win.webContents.once('did-fail-load', (_e, code, desc) => reject(new Error(`did-fail-load ${code} ${desc}`)));
      });
      const js = (code) => win.webContents.executeJavaScript(code, true);

      let ready = false;
      for (let i = 0; i < 50 && !ready; i += 1) {
        ready = await js('Boolean(window.roseflowDebug && window.roseflowDebug.ready())');
        if (!ready) await sleep(100);
      }
      check('renderer exposed debug hooks (ES modules loaded)', ready);
      if (!ready) throw new Error('renderer never became ready');

      const title = await js('document.title');
      check('window title names the product', title.includes('Roseflow PC Mac Training'), title);
      const identity = await js("document.body.textContent.toLowerCase()");
      check('identifies itself as independent and simulation only', identity.includes('independent') && identity.includes('simulation'));

      if (scenario === 'first') await scenarioFirst(js);
      if (scenario === 'resume') await scenarioResume(js);
      if (scenario === 'malformed') await scenarioMalformed(js);
      if (scenario === 'savefail') await scenarioSaveFail(js);
      if (scenario === 'loadfail') await scenarioLoadFail(js);
      if (scenario === 'legacy') await scenarioLegacy(js);
      if (scenario === 'legacy2') await scenarioLegacy2(js);
      if (scenario === 'practice') await scenarioPractice(js);
      if (scenario === 'course') await scenarioCourse(js, win);
      if (scenario === 'sheet') await scenarioSheet(js, win);
      if (scenario === 'record') await scenarioRecord(js, win);
      if (scenario === 'zoom') await scenarioZoom(js, win);

      check('no network requests were made', networkRequests.length === 0, networkRequests.slice(0, 5));
      check('no renderer console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5));
    } catch (error) {
      check('harness completed without exceptions', false, String(error && error.stack ? error.stack : error));
    }

    const failed = results.filter((r) => !r.ok);
    process.stdout.write(`SMOKE_RESULT ${JSON.stringify({ scenario, passed: results.length - failed.length, failed: failed.length, results })}\n`);
    return failed.length === 0 ? 0 : 1;
  }

  const d = (action) => `window.roseflowDebug.dispatch(${JSON.stringify(action)})`;
  const stepInfo = (js) => js('window.roseflowDebug.stepInfo()');
  const partHidden = (js, part) => js(`(() => { const n = document.querySelector('[data-part="${part}"]'); return n ? n.hidden : null; })()`);
  const onSpans = (frames) => {
    const out = [];
    frames.forEach((on, i) => { if (on && (i === 0 || !frames[i - 1])) out.push([i, i]); if (on) out[out.length - 1][1] = i + 1; });
    return out;
  };
  // Real pointer events on an Edit View pane, at times given in seconds. The
  // window stays hidden; these are synthetic events, not the user's mouse.
  const dragOn = (js, selector, button, fromSec, toSec, rowY) => js(`(() => {
    const plot = document.querySelector('${selector}');
    const r = plot.getBoundingClientRect();
    const x = (s) => r.left + (s / 8) * r.width;
    const y = r.top + ${rowY};
    const opts = (cx, buttons) => ({ bubbles: true, cancelable: true, pointerId: 7, button: ${button}, buttons, clientX: cx, clientY: y, pointerType: 'mouse' });
    plot.dispatchEvent(new PointerEvent('pointerdown', opts(x(${fromSec}), ${button === 2 ? 2 : 1})));
    plot.dispatchEvent(new PointerEvent('pointermove', opts(x(${(fromSec + toSec) / 2}), ${button === 2 ? 2 : 1})));
    plot.dispatchEvent(new PointerEvent('pointermove', opts(x(${toSec}), ${button === 2 ? 2 : 1})));
    plot.dispatchEvent(new PointerEvent('pointerup', opts(x(${toSec}), 0)));
    return true;
  })()`);

  async function scenarioFirst(js) {
    // The orientation film opens the app; Skip>> leads to the hub, where
    // Rosie stands beside Start and her artwork comes from the app's own
    // files, drawn in WebGL or shown as the bundled sprite.
    const guide = () => js('window.roseflowDebug.guide()');
    let g = await guide();
    check('the film is open on a fresh start', (await js('window.roseflowDebug.getState()')).view === 'intro');
    check('her rendering mode is recorded', g && (g.mode === 'webgl' || g.mode === 'sprite'), g && g.mode);
    let art = null;
    for (let i = 0; i < 20; i += 1) {
      art = await js('(() => { const r = document.getElementById("rosie"); const c = r && r.querySelector("canvas"); const i = r && r.querySelector("img.mascot"); if (c) return { kind: "canvas", width: c.width }; if (i) return { kind: "img", complete: i.complete, width: i.naturalWidth, src: i.getAttribute("src") }; return null; })()');
      if (art && (art.kind === 'canvas' || art.complete)) break;
      await sleep(100);
    }
    check('her artwork is bundled and drawn', art && (art.kind === 'canvas' ? art.width > 0 : (art.complete && art.width > 0 && /assets\/mascot\/rosie-/.test(art.src))), art);
    await js(d({ type: 'intro-skip' }));
    let state = await js('window.roseflowDebug.getState()');
    g = await guide();
    const freed = await js('({ inert: document.querySelector("main").inert, role: document.getElementById("rosie-bubble").getAttribute("role") })');
    check('Skip>> closes the film, remembers it, and frees the page', state.view === 'home' && state.intro.shown === true && g.scene === 'home' && freed.inert === false, { view: state.view, scene: g.scene, freed });
    const hubButtons = await js('(() => { const s = document.querySelector(\'[data-fid="start"]\'); const c = document.querySelector(\'[data-fid="continue"]\'); return s && c ? { start: s.textContent, startDisabled: s.disabled, cont: c.textContent, contDisabled: c.disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent } : null; })()');
    check('the hub offers Start your training and a truly disabled Continue', hubButtons && hubButtons.start === 'Start your training' && hubButtons.startDisabled === false && hubButtons.cont === 'Continue your training' && hubButtons.contDisabled === true && hubButtons.explain === 'No saved training yet.', hubButtons);
    check('focus moves to Start when the film closes', (await js('document.activeElement && document.activeElement.dataset.fid')) === 'start', await js('document.activeElement && document.activeElement.outerHTML.slice(0, 80)'));
    const statusBubble = await js('({ role: document.getElementById("rosie-bubble").getAttribute("role"), live: document.getElementById("rosie-bubble").getAttribute("aria-live") })');
    check('on the hub her bubble is a polite status region, so her words are announced', statusBubble.role === 'status' && statusBubble.live === 'polite', statusBubble);
    await js(d({ type: 'continue-training' }));
    check('a disabled Continue rejects activation', (await js('window.roseflowDebug.getState()')).view === 'home');
    // Review Focus 4: a lost WebGL context drops her to the sprite, without an error.
    if ((await guide()).mode === 'webgl') {
      const lost = await js('(() => { const c = document.querySelector("#rosie canvas"); const gl = c && (c.getContext("webgl2") || c.getContext("webgl")); const ext = gl && gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); return Boolean(ext); })()');
      let mode = null;
      for (let i = 0; i < 20 && mode !== 'sprite'; i += 1) { await sleep(100); mode = (await guide()).mode; }
      check('a lost WebGL context falls back to the sprite', lost && mode === 'sprite' && (await js('Boolean(document.querySelector("#rosie img.mascot"))')) === true, { lost, mode });
    } else {
      check('a lost WebGL context falls back to the sprite (skipped: already in sprite mode)', true, 'sprite mode from the start');
    }
    // The hub carries no level rows; the three levels live in the archive under Progress.
    const levelRows = await js('document.querySelectorAll(\'#stage [data-control="level-choice"]\').length');
    check('the hub shows no level rows', levelRows === 0, levelRows);
    const deskHidden = await js('document.getElementById("desk").hidden');
    check('the workspace is not shown until a lesson starts', deskHidden === true);
    await js(d({ type: 'go-progress' }));
    const archive = await js('[...document.querySelectorAll(\'#stage [data-control="level-choice"]\')].map((n) => n.textContent)');
    check('Progress lists the three earlier levels as an archive', archive.length === 3 && archive[0].startsWith('Basic') && archive[2].startsWith('I hate my life'), archive);

    // The archive's level map, grouped by function with a clear starting point.
    await js(d({ type: 'choose-level', level: 'basic' }));
    state = await js('window.roseflowDebug.getState()');
    check('choosing Basic opens its lesson map', state.view === 'level' && state.level === 'basic');
    const groups = await js('[...document.querySelectorAll(".group h2")].map((n) => n.textContent)');
    check('Basic groups topics by function', ['The interface', 'Graphs', 'Terminology', 'Functions', 'Hydraulics', 'Assignments'].every((g) => groups.includes(g)), groups);
    const beginTitle = await js('document.querySelector(".begin-card .title").textContent');
    check('Begin here names the first lesson', beginTitle === 'How a click becomes movement', beginTitle);

    // First lesson: explanation steps, a wrong answer, a right answer, finish.
    await js(d({ type: 'begin-here' }));
    let info = await stepInfo(js);
    check('Begin here opens the first lesson at step 1', info && info.lessonId === 'b-system' && info.index === 0 && info.total === 5, info);
    check('the first step opens in its look beat with Rosie\'s words in her bubble', info.beat === 'look' && /PC•MACs is where the team builds the show/.test(await js('document.getElementById("rosie-bubble").textContent')), info.beat);
    check('More about this step is closed by default', (await js('document.querySelector("#panel details.more").open')) === false);
    const announcer = await js('(() => { const a = document.getElementById("panel-announcer"); window.__announcer = a; return a ? { text: a.textContent, live: a.getAttribute("aria-live"), inPanel: document.querySelectorAll("#panel [aria-live]").length } : null; })()');
    check('one persistent live region, outside the rebuilt panel, announces the step', announcer && announcer.live === 'polite' && announcer.inPanel === 0 && announcer.text.includes('PC•MACs / show'), announcer);
    const count = await js('document.querySelector(\'[data-ref="step-count"]\').textContent');
    check('step count is visible and accurate', count === 'Step 1 of 5', count);
    check('only the PC•MACs frame is revealed on the first step', (await partHidden(js, 'ruler')) === true && (await partHidden(js, 'title')) === false);
    const menuBar = await js('[...document.querySelectorAll(".pc-menu-title")].map((n) => n.textContent)');
    check('the menu bar reads as in the manual', JSON.stringify(menuBar) === JSON.stringify(['File', 'Edit', 'RealTime', 'Offline', 'Channels', 'Preferences', 'Time Out', 'Time In', 'Values Out', 'Values In', 'Help']), menuBar);
    check('the Edit View window is titled as in the manual', (await js('document.querySelector(".edit-view .win-title-text").textContent')) === 'Edit View');
    const termHidden = await js('document.getElementById("terminal").hidden');
    check('the terminal stays hidden until a lesson needs it', termHidden === true);
    for (let i = 0; i < 3; i += 1) await js(d({ type: 'step-next' }));
    info = await stepInfo(js);
    check('three Next presses reach the first question', info.index === 3 && info.kind === 'question' && info.canAdvance === false, info);
    const wrong = await js(d({ type: 'step-answer', choice: 1 }));
    check('a wrong answer is explained and does not unlock Next', wrong.ok === false && wrong.message.startsWith('Not quite') && (await stepInfo(js)).canAdvance === false, wrong);
    const right = await js(d({ type: 'step-answer', choice: 0 }));
    check('the correct answer is confirmed and unlocks Next', right.ok === true && (await stepInfo(js)).canAdvance === true, right);
    await js(d({ type: 'step-next' }));
    await js(d({ type: 'step-answer', choice: 1 }));
    const finish = await js(d({ type: 'step-next' }));
    state = await js('window.roseflowDebug.getState()');
    check('finishing the last step returns to the map and records the lesson', finish === 'finished' && state.view === 'level' && state.learning.completedLessons.includes('b-system'), { finish, view: state.view });
    check('reused classic questions are mirrored into the version-1 record', state.course.answered.includes('l01q1') && state.course.answered.includes('l01q2') && state.course.completedLessons.includes('l01'), state.course);
    check('a wrong try marks the lesson for review', state.learning.missedLessons.includes('b-system') && state.course.missedLessons.includes('l01'));
    const finishedNote = await js('document.getElementById("rosie-bubble").textContent');
    check('the map says which lesson was finished', typeof finishedNote === 'string' && finishedNote.includes('How a click becomes movement'), finishedNote);
    await js(d({ type: 'go-home' }));
    const midHub = await js('({ bubble: document.getElementById("rosie-bubble").textContent, contDisabled: document.querySelector(\'[data-fid="continue"]\').disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent })');
    check('the hub mid-session enables Continue for the current lesson and names it', midHub.contDisabled === false && midHub.bubble.includes('How a click becomes movement') && midHub.explain.includes('How a click becomes movement') && midHub.explain.includes('archive'), midHub);
    await js(d({ type: 'continue-training' }));
    check('Continue mid-session returns to the current lesson', (await js('window.roseflowDebug.getState()')).view === 'lesson');

    // Timeline lesson: progressive disclosure, a demonstration, a wrong practice action, a correction.
    await js(d({ type: 'start-lesson', id: 'b-timeline-graph' }));
    info = await stepInfo(js);
    check('the timeline lesson opens on its first step with ruler and digital pane', info.index === 0 && (await partHidden(js, 'ruler')) === false && (await partHidden(js, 'digital')) === false, info);
    check('the Control Window and Soft Console are not revealed yet', (await partHidden(js, 'transport')) === true && (await partHidden(js, 'command')) === true);
    await js(d({ type: 'step-next' }));
    info = await stepInfo(js);
    check('step 2 explains selecting and setting a digital, with a demonstration', info.index === 1 && info.target === 'digital-pane', info);
    const lightBefore = (await js('window.roseflowDebug.getState()')).sim.lights['light-1'].slice();
    await js('window.roseflowDebug.runDemo()');
    state = await js('window.roseflowDebug.getState()');
    check('the demonstration runs to its end and reports its outcome', state.lesson.demo.running === false && /removed it/.test(state.lesson.demo.note), state.lesson.demo);
    check('the demonstration leaves Light 1 as it was', JSON.stringify(state.sim.lights['light-1']) === JSON.stringify(lightBefore));
    info = await stepInfo(js);
    check('after the demonstration the panel is in the watch beat with the outro and Next', info.beat === 'watch' && info.demoFinished === true, info);
    await js(d({ type: 'step-next' }));
    info = await stepInfo(js);
    state = await js('window.roseflowDebug.getState()');
    check('the practice step starts from its setup state (Light 1 all OFF)', info.kind === 'practice' && state.sim.lights['light-1'].every((b) => b === false));
    check('a practice step opens in its look beat', info.beat === 'look', info.beat);
    const menuGreyed = await js('(() => { document.querySelector(\'[data-menu="edit"]\').click(); const item = [...document.querySelectorAll(".pc-item")].find((n) => n.textContent.includes("Set Digitals On")); const greyed = item.disabled; document.body.click(); return greyed; })()');
    check('Edit ▸ Set Digitals On is greyed until a digital is selected for a stretch', menuGreyed === true);
    // A wrong action through the real Edit View: RightClick-and-slide on Light 1 from 4 s to 5 s.
    await dragOn(js, '.ev-digital', 2, 4, 5, 14);
    state = await js('window.roseflowDebug.getState()');
    check('RightClick-and-slide on the digital row draws Light 1 ON', JSON.stringify(onSpans(state.sim.lights['light-1'])) === JSON.stringify([[120, 150]]), onSpans(state.sim.lights['light-1']));
    check('an incorrect practice action gets a specific correction', state.lesson.feedback && state.lesson.feedback.ok === false && /ON from 00:00:04\.00 to 00:00:05\.00/.test(state.lesson.feedback.message), state.lesson.feedback);
    check('the live region announces the correction without being re-created', (await js('Boolean(window.__announcer) && document.getElementById("panel-announcer") === window.__announcer && /ON from 00:00:04\\.00/.test(window.__announcer.textContent)')) === true);
    check('the correction keeps the instruction under it', (await js('document.getElementById("rosie-bubble").textContent')).includes('Select Light 1 from 5 s to 6 s'));
    check('Next stays locked after a wrong action', (await stepInfo(js)).canAdvance === false);
    check('acting in the windows during the look beat moves the panel to the try beat', (await stepInfo(js)).beat === 'try');
    // Correct it: RightClick on the ON stretch undraws; then select 5-6 s on the row and use the Edit menu.
    await dragOn(js, '.ev-digital', 2, 4, 5, 14);
    await dragOn(js, '.ev-digital', 0, 5, 6, 14);
    state = await js('window.roseflowDebug.getState()');
    check('LeftClick-and-slide on Light 1 selects it from 5 s to 6 s', state.sim.selection.from === 150 && state.sim.selection.to === 180 && JSON.stringify(state.sim.selection.channels) === '["light-1"]', state.sim.selection);
    await js('(() => { document.querySelector(\'[data-menu="edit"]\').click(); [...document.querySelectorAll(".pc-item")].find((n) => n.textContent.includes("Set Digitals On")).click(); })()');
    state = await js('window.roseflowDebug.getState()');
    check('the corrected action passes with an outcome explanation', state.lesson.feedback.ok === true && /Exactly right/.test(state.lesson.feedback.message), state.lesson.feedback);
    check('a passed practice unlocks Next without advancing by itself', (await stepInfo(js)).canAdvance === true && (await stepInfo(js)).index === 2);
    const highlighted = await js('document.querySelector(".is-target") && document.querySelector(".is-target").dataset.control');
    check('the highlight follows the current step\'s control', highlighted === 'digital-pane', highlighted);
    // Back while a demonstration runs cancels it, restores the show data, and
    // opens the previous step at its first beat.
    await js(d({ type: 'step-back' }));
    const lightsBefore = (await js('window.roseflowDebug.getState()')).sim.lights['light-1'].slice();
    await js(d({ type: 'demo-start' }));
    await sleep(1200);
    check('Show me puts the panel in the watch beat while the demonstration runs', (await stepInfo(js)).beat === 'watch');
    await js(d({ type: 'step-back' }));
    state = await js('window.roseflowDebug.getState()');
    info = await stepInfo(js);
    check('Back during a demonstration cancels it, restores Light 1, and opens the previous step at its first beat', info.index === 0 && state.lesson.demo.running === false && info.beat === 'look' && JSON.stringify(state.sim.lights['light-1']) === JSON.stringify(lightsBefore), { index: info.index, running: state.lesson.demo.running, beat: info.beat });
    await js(d({ type: 'step-next' }));
    await js(d({ type: 'step-next' }));

    // Keyboard focus survives a demonstration: Show me was focused, the panel
    // rebuilt it as a disabled button, and when the demo ends focus lands on Next.
    await js(d({ type: 'step-back' }));
    check('a finished step with a demonstration still offers Watch again', (await js('Boolean(document.querySelector(\'#panel [data-fid="secondary-watch-again"]\'))')) === true);
    await js('(() => { const b = document.querySelector(\'#panel [data-fid="secondary-watch-again"]\'); b.focus(); b.click(); })()');
    await sleep(3000);
    const afterDemoFocus = await js('document.activeElement ? (document.activeElement.dataset.fid || document.activeElement.tagName) : null');
    check('after Show me ends, focus lands on Next instead of being lost', afterDemoFocus === 'step-next', afterDemoFocus);
    await js(d({ type: 'step-next' }));

    await js(d({ type: 'step-back' }));
    await js(d({ type: 'step-next' }));
    info = await stepInfo(js);
    const count3 = await js('document.querySelector(\'[data-ref="step-count"]\').textContent');
    check('Back then Next returns to the same step with the count accurate', info.index === 2 && info.done === true && count3 === 'Step 3 of 5', { info, count3 });
    await js(d({ type: 'step-next' }));
    check('the show-time step reveals the Control Window', (await partHidden(js, 'transport')) === false);
    const stopActive = await js('document.querySelector(\'[data-control="stop"]\').classList.contains("active")');
    check('the Control Window draws the current mode (Stop) inverted, as in the manual', stopActive === true);

    // Handbook during a lesson, then back to the same step.
    await js(d({ type: 'handbook-toggle' }));
    const hbOpen = await js('document.getElementById("handbook").hidden === false');
    check('the handbook opens beside the lesson', hbOpen === true);
    await js('window.roseflowDebug.setSearch("netmask")');
    const hits = await js('document.querySelectorAll("#handbook-results li").length');
    check('handbook search for netmask returns results', hits > 0, hits);
    const firstHit = await js('document.querySelector("#handbook-results li").textContent');
    check('top result is the netmask concept', firstHit.includes('Subnet mask'), firstHit);
    await js('window.roseflowDebug.setSearch("zzzzqq")');
    const none = await js('document.querySelector("#handbook-status").textContent');
    check('no-results feedback is shown', none.toLowerCase().includes('no entries'), none);
    await js(d({ type: 'handbook-close' }));
    info = await stepInfo(js);
    check('closing the handbook returns to the same lesson step', (await js('document.getElementById("handbook").hidden')) === true && info.lessonId === 'b-timeline-graph' && info.index === 3, info);

    // Help preserves the lesson.
    await js('window.roseflowDebug.openHelp("command-slider")');
    const helpOpen = await js('document.querySelector("#help-dialog").open');
    check('help dialog opens on request', helpOpen === true);
    const helpTitle = await js('document.querySelector("#help-dialog h2").textContent');
    check('help dialog shows the control name', helpTitle.includes('Soft Console slider'), helpTitle);
    await js('window.roseflowDebug.closeHelp()');
    check('help dialog closes and the step is unchanged', (await js('document.querySelector("#help-dialog").open')) === false && (await stepInfo(js)).index === 3);

    // Clickable help: Help ?, then a click on a recreated control explains it instead of using it.
    await js('document.getElementById("help-current").click()');
    await js('document.querySelector(\'[data-control="play"]\').click()');
    const whatsThis = await js('document.querySelector("#help-dialog").open && document.querySelector("#help-dialog h2").textContent');
    state = await js('window.roseflowDebug.getState()');
    check('Help ? then clicking Play explains Play without playing', whatsThis === 'Play' && state.sim.mode === 'stop', { whatsThis, mode: state.sim.mode });
    await js('window.roseflowDebug.closeHelp()');

    // Tooltip on focus. A hidden window never has page focus, so Chromium does
    // not dispatch focus events for element.focus(); the harness dispatches the
    // focusin event the real keyboard path would produce.
    await js('(() => { const b = document.querySelector(\'[data-control="play"]\'); b.focus(); b.dispatchEvent(new FocusEvent("focusin", { bubbles: true })); })()');
    await sleep(50);
    const tip = await js('document.querySelector("#tooltip").hidden === false && document.querySelector("#tooltip").textContent');
    check('tooltip appears on focusin of a control', typeof tip === 'string' && tip.includes('Play'), tip);
    await js('document.querySelector(\'[data-control="play"]\').dispatchEvent(new FocusEvent("focusout", { bubbles: true }))');
    check('tooltip hides on focusout', (await js('document.querySelector("#tooltip").hidden')) === true);
    await js('(() => { const b = document.querySelector(\'[data-control="stop"]\'); b.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); })()');
    const hoverTip = await js('document.querySelector("#tooltip").hidden === false && document.querySelector("#tooltip").textContent');
    check('tooltip appears on hover of a control', typeof hoverTip === 'string' && hoverTip.includes('Stop'), hoverTip);
    await js('document.querySelector(\'[data-control="stop"]\').dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))');

    // Playback and the time readout still work inside a lesson.
    await js(d({ type: 'play' }));
    await sleep(1250);
    state = await js('window.roseflowDebug.getState()');
    check('after 1.25 s playback is a little past 1 s (30 frames a second)', state.sim.mode === 'play' && state.sim.frame >= 30 && state.sim.frame <= 40, state.sim.frame);
    const readout = await js('document.querySelector(\'[data-control="time-readout"]\').textContent');
    check('the Control Window time reads 00:00:01.xx', /^00:00:01\.\d\d$/.test(readout), readout);
    const playActive = await js('document.querySelector(\'[data-control="play"]\').classList.contains("active")');
    check('Play is drawn as the current mode while playing', playActive === true);
    await js(d({ type: 'stop' }));
    await js(d({ type: 'select-axis', axis: 2 }));
    await js(d({ type: 'set-command', value: 100 }));
    await js(d({ type: 'play' }));
    const saved = await js('window.roseflowDebug.flushSave()');
    check('progress saved to disk', saved && saved.ok === true, saved);
    const onDisk = await store.current.load();
    const v = onDisk.ok && onDisk.value;
    check('saved file is schema 4 with the lesson location', v && v.schemaVersion === 4 && v.location.view === 'lesson' && v.location.level === 'basic' && v.location.lessonId === 'b-timeline-graph' && v.location.stepIndex === 3, v && v.location);
    check('saved file holds finished steps, the finished lesson, and the mirrored classic record', v && v.learning.completedLessons.includes('b-system') && v.learning.completedSteps.includes('b-timeline-graph:turn-on-5') && v.course.answered.includes('l01q1'), v && v.learning);
    check('saved show data holds the practised Light 1 span, and playback is never saved as running', v && JSON.stringify(v.settings.lights['light-1']) === '[[150,180]]' && v.settings.axis === 2 && v.settings.console[2] === 100 && v.settings.command === 100, v && v.settings);

    // Keyboard focus survives a pass: Check was focused, the primary became Next.
    await js(d({ type: 'start-lesson', id: 'b-channels', stepIndex: 2 }));
    await js(d({ type: 'beat-try' }));
    await js('document.querySelector(\'#panel [data-fid="primary"]\').focus()');
    await js(d({ type: 'select-channel', id: 'light-2' }));
    const afterPassFocus = await js('document.activeElement ? (document.activeElement.dataset.fid || document.activeElement.tagName) : null');
    check('after a pass, focus moves from the vanished Check to Next', afterPassFocus === 'step-next' && (await stepInfo(js)).done === true, afterPassFocus);
    // Leaving the lesson while a demonstration runs cancels it.
    await js(d({ type: 'start-lesson', id: 'b-timeline-graph', stepIndex: 1 }));
    const selectionBefore = JSON.stringify((await js('window.roseflowDebug.getState()')).sim.selection);
    await js(d({ type: 'demo-start' }));
    await sleep(200);
    await js(d({ type: 'explore' }));
    state = await js('window.roseflowDebug.getState()');
    check('leaving for Explore during a demonstration cancels it and restores the selection', state.lesson.demo.running === false && state.lesson.beat === 'look' && JSON.stringify(state.sim.selection) === selectionBefore, { running: state.lesson.demo.running, beat: state.lesson.beat });
    check('the explore panel keeps its heading', (await js('document.querySelector("#panel h2") && document.querySelector("#panel h2").textContent')) === 'All the windows');
    // ---- Rosie, the floating guide: where she goes and what she must never cover.
    const guideDbg = () => js('window.roseflowDebug.guide()');
    const hit = (a, b) => Boolean(a && b) && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const rectOf = (selector) => js(`(() => { const n = document.querySelector('${selector}'); if (!n) return null; const r = n.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
    const targetNode = (id) => `(document.querySelector('[data-target="${id}"]') || document.querySelector('.desk [data-control="${id}"]') || document.querySelector('[data-control="${id}"]'))`;
    await js(d({ type: 'go-home' }));
    await sleep(1500);
    let gd = await guideDbg();
    const buttonsRect = await rectOf('.hub-buttons');
    const ledeRect = await rectOf('.hub-lede');
    check('the hub docks her beside the actions and she covers neither the buttons nor the description', gd.anchor.kind === 'dock' && gd.resolved === 'dock' && !hit(gd.visible, buttonsRect) && !hit(gd.bubbleRect, buttonsRect) && !hit(gd.visible, ledeRect), { anchor: gd.anchor, resolved: gd.resolved, visible: gd.visible, buttonsRect, ledeRect, bubble: gd.bubbleRect });
    await js(d({ type: 'start-lesson', id: 'b-interface', stepIndex: 1 }));
    await sleep(1500);
    gd = await guideDbg();
    check('a lesson step anchors her to its target and she does not overlap it', gd.anchor.id === 'menu-realtime' && gd.resolved === 'control' && gd.flying === false && !hit(gd.visible, gd.anchorRect) && !hit(gd.bubbleRect, gd.anchorRect), { anchor: gd.anchor, resolved: gd.resolved, flying: gd.flying, visible: gd.visible, anchorRect: gd.anchorRect, bubble: gd.bubbleRect });
    check('the panel keeps a dock for her and no longer carries the speech card', (await js('Boolean(document.getElementById("guide-dock")) && !document.querySelector("#panel .step-guide")')) === true);
    let before = gd;
    await js(d({ type: 'step-next' }));
    await sleep(1500);
    gd = await guideDbg();
    check('her position changes when the target changes', gd.anchor.id === 'time-ruler' && gd.flights === before.flights + 1 && Math.hypot(gd.position.x - before.position.x, gd.position.y - before.position.y) > 40, { from: before.position, to: gd.position, flights: [before.flights, gd.flights] });
    check('her bubble carries the beat’s text', /ruler/.test(gd.bubbleText), gd.bubbleText.slice(0, 80));
    check('the layer is transparent to the pointer outside the welcome', (await js(`(() => { const v = ${JSON.stringify(gd.visible)}; const n = document.elementFromPoint(v.x + v.w / 2, v.y + v.h / 2); return Boolean(n) && !n.closest('#guide-layer'); })()`)) === true);
    // Review Focus 1: a target with no box puts her at the dock, not at (0, 0).
    await js(`${targetNode('time-ruler')}.hidden = true`);
    await sleep(500);
    gd = await guideDbg();
    check('a target with no size falls back to the dock', gd.resolved === 'dock' && gd.position.y > 0, { resolved: gd.resolved, position: gd.position });
    await js(`${targetNode('time-ruler')}.hidden = false`);
    await sleep(1500);
    // Review Focus 2: the handbook narrows the desk and moves the ruler; she follows without a new talk or flight.
    before = await guideDbg();
    await js(d({ type: 'handbook-toggle' }));
    await sleep(1500);
    gd = await guideDbg();
    check('a shifted target re-anchors her without a new talk or flight', gd.resolved === 'control' && gd.talks === before.talks && gd.flights === before.flights && Math.abs(gd.position.x - before.position.x) > 20, { before: before.position, after: gd.position, talks: [before.talks, gd.talks], flights: [before.flights, gd.flights] });
    await js(d({ type: 'handbook-close' }));
    await sleep(800);
    // Review Focus 3: thirty playback ticks a second never reach her.
    before = await guideDbg();
    await js(d({ type: 'play' }));
    await sleep(700);
    await js(d({ type: 'stop' }));
    gd = await guideDbg();
    check('playback does not make her fly or talk', gd.talks === before.talks && gd.flights === before.flights, { talks: [before.talks, gd.talks], flights: [before.flights, gd.flights] });
    const lessonBubble = await js('({ role: document.getElementById("rosie-bubble").getAttribute("role"), live: document.getElementById("rosie-bubble").getAttribute("aria-live") })');
    check('in a lesson her bubble is not a live region (the panel announcer speaks once)', lessonBubble.role === null && lessonBubble.live === null, lessonBubble);
    // An open PC•MACs menu must paint above her and her bubble: the layer sits below the menus in the root stacking order.
    const stacking = await js(`(() => {
      const z = (n) => { const v = getComputedStyle(n).zIndex; return v === 'auto' ? null : Number(v); };
      const menu = document.querySelector('.pc-menu');
      const contexts = [];
      for (let n = menu.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if ((cs.position !== 'static' && cs.zIndex !== 'auto') || cs.opacity !== '1' || cs.transform !== 'none' || cs.filter !== 'none' || cs.isolation === 'isolate' || cs.mixBlendMode !== 'normal' || cs.willChange !== 'auto') contexts.push(n.tagName.toLowerCase() + '.' + n.className);
      }
      return { layer: z(document.getElementById('guide-layer')), menu: z(menu), contexts };
    })()`);
    check('an open menu paints above her: the layer sits below the menus in the root stacking order', stacking.layer !== null && stacking.menu !== null && stacking.layer < stacking.menu && stacking.contexts.length === 0, stacking);
    // Her loop runs while the page is visible and stops when it is hidden (driven through the debug hook).
    const f0 = (await guideDbg()).frames;
    await sleep(250);
    const f1 = (await guideDbg()).frames;
    await js('window.roseflowDebug.guideVisible(false)');
    await sleep(150);
    const f2 = (await guideDbg()).frames;
    await sleep(300);
    const f3 = (await guideDbg()).frames;
    await js('window.roseflowDebug.guideVisible(true)');
    await sleep(300);
    const f4 = (await guideDbg()).frames;
    check('her loop runs while the page is visible and stops while it is hidden', typeof f0 === 'number' && f1 > f0 && f3 === f2 && f4 > f3, { f0, f1, f2, f3, f4 });
    // Reduced motion: placed at once, no flight.
    await js('window.roseflowDebug.guideReduced(true)');
    await js(d({ type: 'step-next' }));
    await sleep(220);
    gd = await guideDbg();
    check('with reduced motion she is placed at once, without a flight', gd.reduced === true && gd.flying === false && gd.anchor.id === 'analog-pane', { reduced: gd.reduced, flying: gd.flying, anchor: gd.anchor });
    await js('window.roseflowDebug.guideReduced(null)');
    await js(d({ type: 'step-back' }));
    await sleep(900);

    // Back on the saved step for the relaunch scenario.
    await js(d({ type: 'start-lesson', id: 'b-timeline-graph', stepIndex: 3 }));
    await js(d({ type: 'stop' }));
    check('the saved step is written again for the relaunch', (await js('window.roseflowDebug.flushSave()')).ok === true);
  }

  async function scenarioResume(js) {
    check('the film plays again on a fresh launch, even for a returning learner', (await js('window.roseflowDebug.getState()')).view === 'intro');
    await js(d({ type: 'intro-skip' }));
    const card = await js('document.getElementById("rosie-bubble").textContent');
    check('the hub offers Continue when progress exists, from Rosie', typeof card === 'string' && card.includes('Welcome back') && card.includes('Reading the timeline'), card);
    const hub = await js('(() => { const c = document.querySelector(\'[data-fid="continue"]\'); return { disabled: c.disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent }; })()');
    const savedAt = (await store.current.load()).value.training.lastActivityAt;
    check('Continue is enabled and shows the real last-active local date', hub.disabled === false && typeof savedAt === 'string' && hub.explain.includes(`Last worked on: ${new Date(savedAt).toLocaleString()}`) && hub.explain.includes('Reading the timeline'), { hub, savedAt });
    await js(d({ type: 'start-training' }));
    const dlg = await js('(() => { const dl = document.getElementById("progress-dialog"); return { open: dl.open, line: dl.querySelector(\'[data-ref="progress-line"]\') && dl.querySelector(\'[data-ref="progress-line"]\').textContent, buttons: [...dl.querySelectorAll("button")].map((b) => b.textContent) }; })()');
    check('Start with a save opens the existing-progress dialog', dlg.open === true && /^You already have training in progress\. Last worked on: .+\. Continue from Reading the timeline, step 4, or start a new run\?$/.test(dlg.line) && JSON.stringify(dlg.buttons) === JSON.stringify(['Cancel', 'Restart from the beginning', 'Continue training']), dlg);
    await js(d({ type: 'progress-dialog-close' }));
    const afterCancel = await js('window.roseflowDebug.getState()');
    check('Cancel changes nothing', (await js('document.getElementById("progress-dialog").open')) === false && afterCancel.view === 'home' && afterCancel.learning.completedLessons.length === 1);
    await js(d({ type: 'continue-training' }));
    const state = await js('window.roseflowDebug.getState()');
    const info = await stepInfo(js);
    check('Continue reopens the saved lesson and step', state.view === 'lesson' && info.lessonId === 'b-timeline-graph' && info.index === 3, { view: state.view, info });
    check('resume restores the practised Light 1 span, axis 2, and the Soft Console value 100', JSON.stringify(onSpans(state.sim.lights['light-1'])) === '[[150,180]]' && state.sim.axis === 2 && state.sim.command === 100 && state.sim.console[2] === 100, { axis: state.sim.axis, command: state.sim.command });
    check('resume restores playback stopped', state.sim.mode === 'stop');
    check('resume keeps the finished lesson', state.learning.completedLessons.includes('b-system'));
    check('the earlier practice step is still done on resume', (await js(d({ type: 'step-back' }))) === null && (await stepInfo(js)).done === true);

    // ---- Rosie guards Restart (brief §15). The unlock window is shortened so the timeout path runs in seconds.
    const guardDbg = () => js('(() => { const dl = document.getElementById("restart-dialog"); const s = window.roseflowDebug.getState(); const go = dl.querySelector(\'[data-fid="restart-go"]\'); return { open: dl.open, restartDisabled: go ? go.disabled : null, line: dl.querySelector(\'[data-ref="guard-line"]\') && dl.querySelector(\'[data-ref="guard-line"]\').textContent, hint: dl.querySelector(\'[data-ref="guard-hint"]\') && dl.querySelector(\'[data-ref="guard-hint"]\').textContent, countdown: dl.querySelector(\'[data-ref="countdown"]\') && dl.querySelector(\'[data-ref="countdown"]\').textContent, hit: Boolean(dl.querySelector(\'[data-fid="tickle"]\')), phase: s.guard && s.guard.phase, timeouts: s.guard && s.guard.timeouts, inert: document.getElementById("shell").inert, focus: document.activeElement && document.activeElement.dataset.fid }; })()');
    await js('window.roseflowDebug.guardUnlockMs(1200)');
    await js(d({ type: 'go-home' }));
    await js(d({ type: 'start-training' }));
    await js('document.querySelector(\'#progress-dialog [data-fid="restart"]\').click()');
    let g = await guardDbg();
    check('Restart from the beginning opens the guarded dialog: Restart disabled, Rosie’s line, the hint, her hit target focused', g.open === true && g.restartDisabled === true && g.line.startsWith('Hold on!') && g.hint === 'Tickle Rosie to reveal Restart.' && g.hit === true && g.phase === 'guarded' && g.inert === true && g.focus === 'tickle', g);
    // Continue training is the plain way out of the guarded dialog (brief §14: never blocked by Rosie).
    await js('document.querySelector(\'#restart-dialog [data-fid="continue"]\').click()');
    const cont = await js('window.roseflowDebug.getState()');
    check('Continue training in the guarded dialog closes it, drops the guard, frees the page and reopens the lesson', (await guardDbg()).open === false && cont.guard === null && cont.dialogs.restart === false && cont.view === 'lesson' && (await js('document.getElementById("shell").inert')) === false, { view: cont.view, guard: cont.guard, restart: cont.dialogs.restart });
    await js(d({ type: 'restart-request' }));
    await sleep(1300);
    const gdGuard = await js('window.roseflowDebug.guide()');
    check('she stands in front of the Restart button while it is guarded', gdGuard.scene === 'guard' && gdGuard.anchor.kind === 'cover' && gdGuard.resolved === 'cover', { scene: gdGuard.scene, anchor: gdGuard.anchor, resolved: gdGuard.resolved });
    const refused = await js(d({ type: 'guard-activate' }));
    let after = await js('window.roseflowDebug.getState()');
    check('activating while guarded is refused and resets nothing', refused && refused.ok === false && after.learning.completedLessons.length === 1, refused);
    await js(d({ type: 'restart-cancel' }));
    after = await js('window.roseflowDebug.getState()');
    check('Cancel closes the dialog, keeps progress, and frees the page', (await guardDbg()).open === false && after.learning.completedLessons.length === 1 && (await js('document.getElementById("shell").inert')) === false);
    await js(d({ type: 'restart-request' }));
    await js('document.querySelector(\'#restart-dialog [data-fid="tickle"]\').click()');
    g = await guardDbg();
    check('a click on Rosie tickles her and does not reach Restart; the page behind stays inert through the rebuild', g.phase === 'tickling' && g.restartDisabled === true && g.inert === true && (await js('window.roseflowDebug.getState()')).learning.completedLessons.length === 1, g);
    await sleep(900);
    g = await guardDbg();
    check('once she has moved aside the window opens: Restart enabled, a countdown, her after-line, the page still inert', g.phase === 'unlocked' && g.restartDisabled === false && /^[12] s$/.test(g.countdown) && g.line.includes('Five seconds') && g.inert === true, g);
    await sleep(1400);
    g = await guardDbg();
    check('after the window passes she guards again, counts the timeout, and changes her line', g.phase === 'guarded' && g.timeouts === 1 && g.restartDisabled === true && g.line.startsWith('Hey—are you really sure?'), g);
    await js('document.querySelector(\'#restart-dialog [data-fid="tickle"]\').click()');
    await sleep(900);
    await js('window.dispatchEvent(new Event("blur"))');
    g = await guardDbg();
    check('losing focus during the window re-locks without counting a timeout', g.phase === 'guarded' && g.timeouts === 1 && g.restartDisabled === true, g);
    await js('document.querySelector(\'#restart-dialog [data-fid="tickle"]\').click()');
    await sleep(900);
    g = await guardDbg();
    check('a second tickle after the re-lock opens a new window', g.phase === 'unlocked' && g.restartDisabled === false, g);
    await js('document.querySelector(\'#restart-dialog [data-fid="restart-go"]\').click()');
    await sleep(300);
    after = await js('window.roseflowDebug.getState()');
    const info2 = await stepInfo(js);
    check('a separate click on Restart inside the window resets the run and opens the first lesson', after.learning.completedSteps.length === 0 && after.course.answered.length === 0 && after.view === 'lesson' && info2 && info2.lessonId === 's1-orientation' && after.training.restarts.count === 1, { view: after.view, info: info2, restarts: after.training.restarts });
    check('a confirmed restart does not replay the film and keeps the preferences', after.intro.shown === true && after.prefs && typeof after.prefs.captions === 'boolean');
    const files = await fs.readdir(path.dirname(store.current.filePath));
    check('the previous run is kept as a recoverable snapshot', files.some((f) => /^progress\.previous-run-.*\.json$/.test(f)), files);
    const onDisk = await store.current.load();
    check('the fresh document carries the restart count and no finished work', onDisk.ok && onDisk.value && onDisk.value.learning.completedSteps.length === 0 && onDisk.value.training.restarts.count === 1 && onDisk.value.location.level === 'course', onDisk.value && onDisk.value.training);
    await js(d({ type: 'restart-request' }));
    g = await guardDbg();
    check('a later restart attempt opens with the history line and a real local date', g.line.startsWith('Back at the beginning again?') && !g.line.includes('not recorded'), g.line);
    await js(d({ type: 'guard-simple' }));
    g = await guardDbg();
    check('Use simple confirmation enables Restart without the timed challenge and remembers the choice', g.restartDisabled === false && g.hit === false && (await js('window.roseflowDebug.getState()')).prefs.simpleConfirm === true, g);
    // A double click (or a held Enter) on the simple Restart resets once.
    const snapshotsOf = async () => (await fs.readdir(path.dirname(store.current.filePath))).filter((f) => /^progress\.previous-run-/.test(f)).length;
    const snapsBefore = await snapshotsOf();
    await js(`${d({ type: 'guard-activate' })}; ${d({ type: 'guard-activate' })}`);
    await sleep(700);
    const twice = await js('window.roseflowDebug.getState()');
    const snapsAfter = await snapshotsOf();
    check('two activations in a row reset once: one more snapshot, the restart count up by one, the first lesson open', twice.training.restarts.count === 2 && snapsAfter === snapsBefore + 1 && twice.view === 'lesson' && twice.dialogs.restart === false, { count: twice.training.restarts.count, snapsBefore, snapsAfter, view: twice.view });
    await js('window.roseflowDebug.guardUnlockMs(5000)');
  }

  async function scenarioMalformed(js) {
    check('a fresh start after quarantine shows the film', (await js('window.roseflowDebug.getState()')).view === 'intro');
    await js(d({ type: 'intro-skip' }));
    const state = await js('window.roseflowDebug.getState()');
    check('malformed file did not crash and started fresh', state.learning.completedLessons.length === 0 && state.view === 'home');
    check('recovery notice is recorded', state.persistence.recovered && state.persistence.recovered.reason === 'invalid-json', state.persistence);
    const notice = await js('document.querySelector("#persistence-notice").hidden === false && document.querySelector("#persistence-notice").textContent');
    check('recovery notice is visible', typeof notice === 'string' && notice.includes('moved aside'), notice);
    const hub = await js('({ disabled: document.querySelector(\'[data-fid="continue"]\').disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent })');
    check('the hub explains the unreadable save with its path and keeps Continue off', hub.disabled === true && hub.explain.includes('invalid-json') && hub.explain.includes('progress.invalid-'), hub);
  }

  async function scenarioSaveFail(js) {
    check('the film opens even when the progress file cannot be saved', (await js('window.roseflowDebug.getState()')).view === 'intro');
    await js(d({ type: 'intro-skip' }));
    check('the film closes without an error when saving fails', (await js('window.roseflowDebug.getState()')).view === 'home');
    await js(d({ type: 'choose-level', level: 'basic' }));
    await js(d({ type: 'begin-here' }));
    const saved = await js('window.roseflowDebug.flushSave()');
    check('save failure is reported to the renderer', saved && saved.ok === false, saved);
    const banner = await js('document.querySelector("#persistence-notice").hidden === false && document.querySelector("#persistence-notice").textContent');
    check('save failure banner is visible', typeof banner === 'string' && banner.includes('could not be saved'), banner);
    const state = await js('window.roseflowDebug.getState()');
    check('work stays in memory after a failed save', state.view === 'lesson' && state.level === 'basic');
    check('failed save does not mark anything complete', state.learning.completedSteps.length === 0);
  }

  // The progress file is there but cannot be read (brief §14: explain, and
  // preserve the original): nothing may be written over it until it reads.
  async function scenarioLoadFail(js) {
    await js(d({ type: 'intro-skip' }));
    const s = await js('window.roseflowDebug.getState()');
    check('an unreadable (not malformed) file is reported as a read failure, not as no save', s.persistence.readFailed === true && typeof s.persistence.error === 'string' && s.persistence.error.includes('EBUSY') && s.persistence.recovered === null, s.persistence);
    const hub = await js('(() => ({ start: document.querySelector(\'[data-fid="start"]\').disabled, cont: document.querySelector(\'[data-fid="continue"]\').disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent }))()');
    check('the hub disables both actions and says nothing was changed', hub.start === true && hub.cont === true && hub.explain.includes('EBUSY') && hub.explain.includes('Nothing has been changed'), hub);
    const notice = await js('(() => { const n = document.getElementById("persistence-notice"); return { hidden: n.hidden, text: n.textContent, retry: Boolean([...n.querySelectorAll("button")].find((b) => b.textContent === "Try reading again")) }; })()');
    check('the notice names the read failure and offers Try reading again', notice.hidden === false && notice.text.includes('could not be read') && notice.retry, notice);
    await js(d({ type: 'explore' }));
    const saved = await js('window.roseflowDebug.flushSave()');
    check('nothing is saved over a file that could not be read', saved && saved.ok === false && saved.error === 'unread', saved);
    store.current.load = store.current._originalLoad;
    await js(d({ type: 'go-home' }));
    await js(d({ type: 'retry-load' }));
    await sleep(500);
    const after = await js('window.roseflowDebug.getState()');
    check('Try reading again clears the failure once the file can be read, and the hub opens up', after.persistence.readFailed === false && after.persistence.error === null && (await js('document.querySelector(\'[data-fid="start"]\').disabled')) === false, after.persistence);
  }

  // Seeded by scripts/smoke.mjs with a version-1 file: one classic question
  // answered and two exercise steps finished.
  async function scenarioLegacy(js) {
    await js(d({ type: 'intro-skip' }));
    const state = await js('window.roseflowDebug.getState()');
    check('a version-1 file is migrated and reported', state.migratedInfo && state.migratedInfo.fromSchemaVersion === 1 && state.persistence.migrated && typeof state.persistence.migrated.backupPath === 'string', { migratedInfo: state.migratedInfo, migrated: state.persistence.migrated });
    let backupExists = false;
    try { await fs.access(state.persistence.migrated.backupPath); backupExists = true; } catch { backupExists = false; }
    check('the original version-1 file was backed up beside progress.json', backupExists, state.persistence.migrated && state.persistence.migrated.backupPath);
    check('the classic records survive migration', state.course.answered.includes('l03q1') && state.guided.completedSteps.includes('schedule-light:sl-blocks'), { course: state.course, guided: state.guided });
    check('the app opens at the hub after migration', state.view === 'home');
    const found = await js('document.querySelector(".found-card") && document.querySelector(".found-card").textContent');
    check('the hub explains that earlier progress was found', typeof found === 'string' && found.includes('earlier version') && found.includes('archive'), found);

    await js(d({ type: 'choose-level', level: 'basic' }));
    await js(d({ type: 'start-lesson', id: 'b-values', stepIndex: 2 }));
    let info = await stepInfo(js);
    check('a reused classic question is pre-marked done from the version-1 record', info.lessonId === 'b-values' && info.kind === 'question' && info.done === true && info.canAdvance === true, info);
    await js(d({ type: 'start-lesson', id: 'b-assign-light', stepIndex: 1 }));
    info = await stepInfo(js);
    const doneChannel = info.done;
    await js(d({ type: 'start-lesson', id: 'b-assign-light', stepIndex: 2 }));
    info = await stepInfo(js);
    check('reused exercise steps are pre-marked done from the version-1 record', doneChannel === true && info.done === true, info);
    await js(d({ type: 'start-lesson', id: 'b-assign-light', stepIndex: 3 }));
    info = await stepInfo(js);
    check('exercise steps that were never finished are still to do', info.done === false && info.canAdvance === false, info);
    await js(d({ type: 'go-progress' }));
    const progressText = await js('document.getElementById("stage").textContent');
    check('Progress reports the earlier-version records and the backup', progressText.includes('Records from the earlier version') && progressText.includes('1 of 20 classic questions') && progressText.includes('2 of 13 exercise steps') && progressText.includes('progress.v1-backup.json'), progressText.slice(0, 400));
    const saved = await js('window.roseflowDebug.flushSave()');
    const onDisk = await store.current.load();
    check('after the first save the file is schema 4 and the records are intact', saved.ok && onDisk.value.schemaVersion === 4 && onDisk.value.course.answered.includes('l03q1') && onDisk.value.migrated && onDisk.value.migrated.fromSchemaVersion === 1, onDisk.value && onDisk.value.migrated);
  }

  // Seeded by scripts/smoke.mjs with a version-2 file (the guided-learning
  // build): mid-lesson in b-timeline-graph with blocks 2, 3, and 5 ON.
  async function scenarioLegacy2(js) {
    await js(d({ type: 'intro-skip' }));
    const state = await js('window.roseflowDebug.getState()');
    check('a version-2 file is migrated and backed up as progress.v2-backup.json', state.persistence.migrated && state.persistence.migrated.fromSchemaVersion === 2 && /progress\.v2-backup\.json$/.test(state.persistence.migrated.backupPath), state.persistence.migrated);
    check('finished lessons and steps survive', state.learning.completedLessons.includes('b-system') && state.learning.completedSteps.includes('b-timeline-graph:seconds'), state.learning);
    check('blocks 2, 3, and 5 became Light 1 ON from 2 s to 4 s and 5 s to 6 s', JSON.stringify(onSpans(state.sim.lights['light-1'])) === '[[60,120],[150,180]]', onSpans(state.sim.lights['light-1']));
    check('the saved command became axis 2’s Soft Console value', state.sim.axis === 2 && state.sim.console[2] === 100 && state.sim.command === 100);
    const card = await js('document.getElementById("rosie-bubble").textContent');
    check('Continue still offers the saved lesson and step, from the archive', typeof card === 'string' && card.includes('Reading the timeline') && (await js('document.querySelector(\'[data-ref="explain"]\').textContent')).includes('archive'), card);
    await js(d({ type: 'continue-training' }));
    const info = await stepInfo(js);
    check('Continue reopens the saved step', info.lessonId === 'b-timeline-graph' && info.index === 2, info);
    const saved = await js('window.roseflowDebug.flushSave()');
    const onDisk = await store.current.load();
    check('after the first save the file is schema 4 and the migration note is kept', saved.ok && onDisk.value.schemaVersion === 4 && onDisk.value.migrated && onDisk.value.migrated.fromSchemaVersion === 2, onDisk.value && onDisk.value.migrated);
    check('a finished-step key for a step the lesson no longer has is kept, not dropped', onDisk.value.learning.completedSteps.includes('b-timeline-graph:retired-step'), onDisk.value.learning.completedSteps);
    const home = await js(d({ type: 'go-home' })) === null && await js('document.querySelector(".found-card") && document.querySelector(".found-card").textContent');
    check('the hub explains the version-2 update', typeof home === 'string' && home.includes('earlier version') && home.includes('archive'), home);
  }

  // Solves the practice steps that use the recreated windows, the way a learner
  // would, and checks each one passes only after the right action.
  async function scenarioPractice(js) {
    await js(d({ type: 'intro-skip' }));
    const feedback = async () => (await js('window.roseflowDebug.getState()')).lesson.feedback;
    // Opens a lesson at the step with this id (with its setup applied).
    const open = async (id, stepId) => {
      for (let i = 0; i < 20; i += 1) {
        await js(d({ type: 'start-lesson', id, stepIndex: i }));
        const info = await stepInfo(js);
        if (info.id === stepId) return info;
      }
      throw new Error(`step ${id}:${stepId} not found`);
    };

    // Basic: Set Axis 0 to 255 from 1 s to 3 s through the value dialog.
    await open('b-analog-graph', 'to-255');
    await js(d({ type: 'open-value-dialog' }));
    check('Set Analogs to a Value is refused, with the reason, when nothing is selected', /only available/.test((await js('window.roseflowDebug.getState()')).sim.note) && (await js('document.getElementById("value-dialog").open')) === false);
    await js(d({ type: 'select-range', from: 30, to: 90, channels: ['axis-0'] }));
    await js(d({ type: 'open-value-dialog' }));
    await sleep(50);
    const dialogOpen = await js('document.getElementById("value-dialog").open');
    await js('(() => { const d = document.getElementById("value-dialog"); const input = d.querySelector("input.field"); input.value = "255"; input.dispatchEvent(new Event("input")); [...d.querySelectorAll("button")].find((b) => b.textContent === "OK").click(); })()');
    let fb = await feedback();
    check('“Set to value (0 - 255):” opens and OK sets Axis 0 to 255 from 1 s to 3 s', dialogOpen === true && fb && fb.ok === true, fb);

    // intermediate: Play Selection from the shortcut menu.
    await open('i-frames', 'play-selection');
    await js(d({ type: 'select-range', from: 150, to: 210, channels: [] }));
    await js(`(() => { const p = document.querySelector('.ev-digital'); const r = p.getBoundingClientRect(); p.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 2, buttons: 2, clientX: r.left + r.width * 0.3, clientY: r.top + 32, pointerId: 9 })); })()`);
    const menu = await js('[...document.querySelectorAll(".pc-menu .pc-item .lbl")].map((n) => n.textContent)');
    check('RightClick on empty space opens the shortcut menu with the manual’s items', ['Set Start Here', 'Set Stop Here', 'Loop', 'Scroll While Playing', 'Play Selection', 'Loop Selection', 'Set to Full Show', 'New Trigger...'].every((t) => menu.includes(t)), menu);
    await js('[...document.querySelectorAll(".pc-menu .pc-item")].find((n) => n.textContent.includes("Play Selection")).click()');
    fb = await feedback();
    let state = await js('window.roseflowDebug.getState()');
    check('Play Selection moves Start and Stop to the selection and passes the step', fb && fb.ok === true && state.sim.start === 150 && state.sim.stop === 209, { fb, start: state.sim.start, stop: state.sim.stop });

    // intermediate: Light 2 on two separate stretches.
    await open('i-assign-second-light', 'pattern');
    await js(d({ type: 'select-range', from: 0, to: 30, channels: ['light-2'] }));
    await js(d({ type: 'set-digital', on: true }));
    fb = await feedback();
    check('half of a two-stretch pattern is named as still missing', fb && fb.ok === false && /00:00:06\.00/.test(fb.message), fb);
    await js(d({ type: 'select-range', from: 180, to: 240, channels: ['light-2'] }));
    await js(d({ type: 'set-digital', on: true }));
    fb = await feedback();
    check('both stretches pass', fb && fb.ok === true, fb);

    // intermediate: the measurement model with Manual on.
    await open('i-measurement', 'watch-error');
    state = await js('window.roseflowDebug.getState()');
    check('the measurement practice sets up Manual mode and slider 192', state.sim.checks.manual === true && state.sim.command === 192, { manual: state.sim.checks.manual, command: state.sim.command });
    await js(d({ type: 'run-measure' }));
    await sleep(1800);
    await js(d({ type: 'run-measure' }));
    fb = await feedback();
    check('pausing the model under 10 points passes', fb && fb.ok === true, fb);

    // I hate my life: Axis 1 slider to 64, reproduce the 128-vs-0 mismatch.
    await open('h-assign-roundtrip', 'cmd-64');
    await js(d({ type: 'set-command', axis: 0, value: 64 }));
    fb = await feedback();
    check('moving the wrong axis’s slider is named', fb && fb.ok === false && /Axis 0/.test(fb.message), fb);
    await js('(() => { const s = [...document.querySelectorAll(\'[data-control="command-slider"]\')][1]; s.value = "64"; s.dispatchEvent(new Event("input", { bubbles: true })); })()');
    fb = await feedback();
    check('the Axis 1 Soft Console slider at 64 passes', fb && fb.ok === true, fb);
    await open('h-diagnosis', 'reproduce');
    await js(d({ type: 'set-command', value: 128 }));
    fb = await feedback();
    check('output 128 against a simulated position of 0 reproduces the symptom', fb && fb.ok === true, fb);

    // Manual mode and the Soft Console drive the simulated float.
    await js(d({ type: 'set-check', key: 'manual', on: true }));
    await js(d({ type: 'console-digital', id: 'light-1', down: true }));
    state = await js('window.roseflowDebug.getState()');
    check('in Manual mode console button 1 lights the Light 1 lantern', state.sim.outputs.lights['light-1'] === true);
    await js(d({ type: 'console-digital', id: 'light-1', down: false }));
    await js(d({ type: 'set-check', key: 'manual', on: false }));

    // Selecting an analog in PC•MACs does not move the card's own arrow (separate programs).
    await open('b-identifiers', 'axis');
    await js(d({ type: 'term-reset' }));
    await js('document.querySelector(\'.ev-name[data-channel="axis-2"]\').click()');
    state = await js('window.roseflowDebug.getState()');
    check('clicking Axis 2 DMX 8 selects it in PC•MACs and leaves the terminal arrow on axis 0', state.sim.axis === 2 && state.terminal.axis === 0, { sim: state.sim.axis, terminal: state.terminal.axis });

    // Menus and the terminal stay clickable while the show plays at 30 frames a second.
    await open('h-assign-roundtrip', 'play');
    await js(d({ type: 'play' }));
    await js('document.querySelector(\'[data-menu="realtime"]\').click(); window.__stopItem = [...document.querySelectorAll(".pc-menu .pc-item")].find((n) => n.querySelector(".lbl").textContent === "Stop"); window.__termLine = document.querySelector(\'#terminal .term-line[data-key="k"]\');');
    await sleep(400);
    const stable = await js('document.contains(window.__stopItem) && document.contains(window.__termLine)');
    check('menu items and terminal lines are not rebuilt by playback ticks (a press and release land on the same element)', stable === true);
    await js('window.__stopItem.click()');
    state = await js('window.roseflowDebug.getState()');
    check('RealTime ▸ Stop, clicked 0.4 s into playback, stops the show', state.sim.mode === 'stop', state.sim.mode);
    await js(d({ type: 'play' }));
    await sleep(300);
    await js('document.querySelector(\'#terminal .term-line[data-key="k"]\').click()');
    state = await js('window.roseflowDebug.getState()');
    check('a terminal menu line clicked during playback responds', state.terminal.screen === 'feedback', state.terminal.screen);
    await js(d({ type: 'stop' }));

    // A passed step is saved without pressing Next.
    await open('i-network', 'open-network');
    await js(d({ type: 'term-key', key: '6' }));
    await sleep(500);
    const disk = await store.current.load();
    check('a step passed by a terminal key is on disk before Next', disk.ok && disk.value && disk.value.learning.completedSteps.includes('i-network:open-network'), disk.value && disk.value.learning.completedSteps.slice(-3));

    // The photo step and its follow-up question.
    await open('h-unresolved', 'q-vel-photo');
    const right = await js(d({ type: 'step-answer', choice: 0 }));
    check('reading 7.00 off photo 07 is accepted', right.ok === true, right);
  }

  // The review build's flow on a fresh profile: the orientation film, the hub, the course.
  async function scenarioCourse(js, win) {
    const state = () => js('window.roseflowDebug.getState()');
    const intro = () => js('window.roseflowDebug.intro()');
    const audio = () => js('window.roseflowDebug.audio()');
    // ---- the film opens the app, with Skip>> from the first frame
    let s = await state();
    check('a fresh launch opens on the orientation film', s.view === 'intro', s.view);
    const skipNow = await js('(() => { const f = document.getElementById("film"); const b = f && f.querySelector(\'[data-fid="skip"]\'); return b ? { hidden: f.hidden, text: b.textContent, inert: document.getElementById("shell").inert } : null; })()');
    check('Skip>> is on screen at once and the page behind the film is inert', skipNow && skipNow.hidden === false && skipNow.text === 'Skip>>' && skipNow.inert === true, skipNow);
    check('the film is playing from its first beat', (await intro()).playing === true && (await intro()).beat === 0, await intro());
    const firstLine = (await audio()).spoken;
    check('the first line is narrated, not only captioned: the sound comes up before the film starts', firstLine.length > 0 && firstLine[0].startsWith('Welcome to Roseflow'), firstLine);
    await js(d({ type: 'intro-skip' }));
    s = await state();
    check('Skip>> pressed at once opens the hub and stops the music', s.view === 'home' && s.intro.shown === true && (await audio()).music === 'stopped' && (await js('document.getElementById("film").hidden')) === true, { view: s.view, audio: await audio() });
    await js(d({ type: 'go-home' }));
    check('Home never replays the film by itself', (await state()).view === 'home');
    // ---- replay, the blocked-audio path, pause and resume
    await js('window.roseflowDebug.audioBlock(true)');
    await js(d({ type: 'intro-replay' }));
    await sleep(350);
    let i = await intro();
    check('Replay introduction starts the film again', (await state()).view === 'intro' && i.playing === true && i.beat === 0, i);
    const introSave = await js('window.roseflowDebug.flushSave()');
    check('a save made during the film is valid: the film is not a place the save points back to', introSave && introSave.ok === true && (await store.current.load()).value.location.view === 'home', introSave);
    check('blocked audio shows a sound-enable control while the captions still run', i.soundButton === true && typeof i.caption === 'string' && i.caption.startsWith('Welcome to Roseflow'), i);
    await js(d({ type: 'intro-pause' }));
    i = await intro();
    check('Pause freezes the film', i.paused === true && (await js('document.querySelector(".film-pause").textContent')) === 'Resume', i);
    await js(d({ type: 'intro-resume' }));
    check('Resume continues it', (await intro()).paused === false);
    const gd = await js('window.roseflowDebug.guide()');
    check('Rosie stands at the film’s dock during the film', gd.scene === 'intro' && gd.resolved === 'dock', { scene: gd.scene, resolved: gd.resolved });
    const shotDir = process.env.ROSEFLOW_SMOKE_SHOT_DIR;
    if (shotDir) {
      await fs.mkdir(shotDir, { recursive: true });
      for (const [beat, name] of [[0, 'intro-0-leader'], [1, 'intro-1-campuses'], [4, 'intro-4-photo'], [6, 'intro-6-timeline'], [7, 'intro-7-ready']]) {
        await js(`window.roseflowDebug.introSeek(${beat})`);
        await sleep(1400);
        await win.webContents.capturePage();
        await sleep(400);
        const image = await win.webContents.capturePage();
        await fs.writeFile(path.join(shotDir, `${name}.png`), image.toPNG());
      }
    }
    await js(d({ type: 'intro-skip' }));
    await js('window.roseflowDebug.audioBlock(false)');
    check('the film can be skipped again and the hub returns', (await state()).view === 'home');
    // ---- the hub on a fresh profile, then Start your training
    const fresh = await js('(() => { const c = document.querySelector(\'[data-fid="continue"]\'); return { disabled: c.disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent, rows: document.querySelectorAll("#stage .level-row").length }; })()');
    check('fresh profile: Continue disabled with its explanation, no level rows', fresh.disabled === true && fresh.explain === 'No saved training yet.' && fresh.rows === 0, fresh);
    const shotHub = async (name) => {
      if (!shotDir) return;
      await sleep(1200);
      await win.webContents.capturePage();
      await sleep(400);
      await fs.writeFile(path.join(shotDir, `${name}.png`), (await win.webContents.capturePage()).toPNG());
    };
    await shotHub('hub-fresh');
    await js(d({ type: 'start-training' }));
    let info = await stepInfo(js);
    check('Start your training opens the first course lesson at step 1', info && info.lessonId === 's1-orientation' && info.index === 0 && (await state()).level === 'course', info);
    const firstNames = await js('document.querySelector(\'.ev-name[data-channel="light-1"]\').textContent');
    check('the first course screen already names the rows Digital 0 and Digital 1', firstNames === 'Digital 0', firstNames);
    const kicker = await js('document.querySelector("#panel .lesson-kicker") && document.querySelector("#panel .lesson-kicker").textContent');
    check('the lesson panel names the segment, not a level', typeof kicker === 'string' && kicker.includes('Your first segment'), kicker);
    await shotHub('lesson-orientation-step1');
    await js(d({ type: 'open-level' }));
    const course = await js('(() => ({ view: window.roseflowDebug.getState().view, rows: [...document.querySelectorAll("#stage .lesson-row .name")].map((n) => n.textContent) }))()');
    check('Lessons leads to the course map: three lessons and the placeholder', course.view === 'course' && JSON.stringify(course.rows) === JSON.stringify(['Meet the PC•MACs screen', 'Digital versus analog, briefly', 'One second ON', 'Next steps']), course);
    await shotHub('course-map');
    await js(d({ type: 'go-home' }));
    await shotHub('hub-in-progress');
    const mid = await js('({ disabled: document.querySelector(\'[data-fid="continue"]\').disabled, explain: document.querySelector(\'[data-ref="explain"]\').textContent })');
    check('after opening a lesson the hub enables Continue and names the checkpoint', mid.disabled === false && mid.explain.includes('Meet the PC•MACs screen'), mid);
    const saved = await js('window.roseflowDebug.flushSave()');
    const disk = await store.current.load();
    check('the checkpoint is saved; no activity time is invented for merely opening a lesson', saved.ok && disk.value.training.checkpoint && disk.value.training.checkpoint.lessonId === 's1-orientation' && disk.value.training.lastActivityAt === null && disk.value.location.level === 'course', disk.value && disk.value.training);

    // ---- orientation demonstrations open the real menus and leave the data alone
    const cinema = () => js('window.roseflowDebug.cinema()');
    const untilDemoDone = async (ms = 12000) => { for (let i = 0; i < ms / 100; i += 1) { const s = await state(); if (s.lesson.demo.finished && !s.lesson.demo.running) return true; await sleep(100); } return false; };
    await js(d({ type: 'start-lesson', id: 's1-orientation', stepIndex: 2 }));
    const movesBefore = (await cinema()).moves;
    await js(d({ type: 'demo-start' }));
    await sleep(900);
    const menuOpen = await js('(() => { const m = document.querySelector(".pc-menu"); return { open: m && !m.hidden, items: m ? m.querySelectorAll(".pc-item").length : 0, cursor: !document.getElementById("demo-cursor").hidden }; })()');
    check('the Edit menu demonstration moves the cursor to Edit and opens the real menu', menuOpen.open === true && menuOpen.items > 20 && menuOpen.cursor === true && (await cinema()).moves > movesBefore, menuOpen);
    check('the demonstration ends with the menu closed', (await untilDemoDone()) && (await js('document.querySelector(".pc-menu").hidden')) === true);
    await js(d({ type: 'start-lesson', id: 's1-orientation', stepIndex: 8 }));
    const lightsBefore = JSON.stringify((await state()).sim.lights);
    await js(d({ type: 'demo-start' }));
    await sleep(1500);
    const zoomed = (await state()).sim.zoom;
    check('the Time In demonstration clicks the real Time In and zooms', zoomed > 1, zoomed);
    await untilDemoDone();
    const afterZoom = await state();
    check('after the zoom demonstration the view is back and the show data is unchanged', afterZoom.sim.zoom === 1 && JSON.stringify(afterZoom.sim.lights) === lightsBefore);

    // ---- One second ON: the film performs the task on the real controls, then hands off
    await js('window.roseflowDebug.filmScale(0.3)');
    await js(d({ type: 'start-lesson', id: 's1-one-second-on', stepIndex: 0 }));
    await js('window.roseflowDebug.audioBlock(true)');
    await js(d({ type: 'demo-start' }));
    await sleep(600);
    let cin = await cinema();
    check('Watch starts the film: playing, beat 0, a caption, Rosie performing', cin.playing === true && cin.beat === 0 && typeof cin.caption === 'string' && cin.caption.length > 0 && (await js('document.querySelector(\'[data-ref="film-caption"]\') && document.querySelector(\'[data-ref="film-caption"]\').textContent')).length > 0, cin);
    const names = await js('document.querySelector(\'.ev-name[data-channel="light-1"]\').textContent');
    check('the film’s show names the channel Digital 0', names === 'Digital 0', names);
    // Blocked audio during a lesson film: a Turn sound on control in the panel's sound settings.
    const soundBtn = await js('(() => { const b = document.querySelector(\'#panel [data-control="sound-enable"]\'); return b ? { present: true, text: b.textContent } : { present: false }; })()');
    check('a lesson film with blocked audio offers Turn sound on in its sound settings', soundBtn.present === true && soundBtn.text === 'Turn sound on', soundBtn);
    await js('window.roseflowDebug.audioBlock(false)');
    await js(d({ type: 'sound-enable' }));
    await sleep(200);
    check('Turn sound on brings the sound up and the control goes away', (await audio()).state === 'ready' && (await js('Boolean(document.querySelector(\'#panel [data-control="sound-enable"]\'))')) === false, await audio());
    // The sound settings survive a slider drag and a rebuild: the dragged control is the same node, the disclosure stays open.
    await js('(() => { document.querySelector(\'details[data-keep="sound"]\').open = true; document.querySelector(\'[data-fid="sound-narration"]\').dataset.mark = "dragging"; })()');
    await js(d({ type: 'prefs-preview', prefs: { volumes: { narration: 0.5 } } }));
    const dragging = await js('(() => ({ mark: document.querySelector(\'[data-fid="sound-narration"]\').dataset.mark, open: document.querySelector(\'details[data-keep="sound"]\').open, level: window.roseflowDebug.getState().prefs.volumes.narration }))()');
    check('a slider mid-drag moves the level without rebuilding the control under the pointer', dragging.mark === 'dragging' && dragging.open === true && dragging.level === 0.5, dragging);
    await js(d({ type: 'prefs-set', prefs: { volumes: { narration: 0.5 } } }));
    const released = await js('(() => ({ open: document.querySelector(\'details[data-keep="sound"]\').open, value: document.querySelector(\'[data-fid="sound-narration"]\').value, level: window.roseflowDebug.getState().prefs.volumes.narration }))()');
    check('releasing the slider keeps the Sound disclosure open and the new level', released.open === true && released.value === '50' && released.level === 0.5, released);
    await js(d({ type: 'film-pause' }));
    cin = await cinema();
    const elapsedAtPause = cin.player && cin.player.elapsedMs;
    await sleep(500);
    cin = await cinema();
    check('Pause freezes the film’s clock', cin.paused === true && cin.player && Math.abs(cin.player.elapsedMs - elapsedAtPause) < 5, { elapsedAtPause, now: cin.player && cin.player.elapsedMs });
    await js(d({ type: 'film-resume' }));
    let sawOn = false;
    let sawPlay = false;
    let done = false;
    let shotFilm = false;
    for (let i = 0; i < 600 && !done; i += 1) {
      const s = await state();
      if (s.sim.lights['light-1'].slice(30, 60).every(Boolean)) sawOn = true;
      if (s.sim.mode === 'play') sawPlay = true;
      if (s.sim.mode === 'play' && !shotFilm && s.sim.frame >= 30 && s.sim.frame < 60) { shotFilm = true; await shotHub('film-playback-on'); }
      done = s.lesson.demo.finished && !s.lesson.demo.running;
      if (!done) await sleep(100);
    }
    const after = await state();
    check('the film sets Digital 0 ON over 1–2 s on the real Edit View and plays it back', done && sawOn && sawPlay, { done, sawOn, sawPlay });
    check('the film ran on an isolated copy: afterwards Digital 0 is OFF again and the film is recorded as watched', after.sim.lights['light-1'].every((b) => !b) && after.training.watched.includes('s1-one-second-on:watch') && !after.training.skipped.includes('s1-one-second-on:watch'), { watched: after.training.watched });
    check('the demonstration cursor moved many times and is hidden afterwards', (await cinema()).moves > movesBefore + 10 && (await cinema()).visible === false, await cinema());
    const primary = await js('document.querySelector(\'#panel [data-fid="primary"]\') && document.querySelector(\'#panel [data-fid="primary"]\').textContent');
    const nextLabel = await js('document.querySelector(\'#panel [data-fid="step-next"]\').textContent');
    check('after the film the handoff reads Try it', primary === null ? nextLabel === 'Try it' : primary === 'Try it', { primary, nextLabel });
    await js(d({ type: 'step-next' }));
    const tryInfo = await stepInfo(js);
    const fixture = await state();
    check('Try it opens the practice from its fixture: Digital 0 OFF throughout, nothing selected', tryInfo.kind === 'practice' && fixture.sim.lights['light-1'].every((b) => !b) && fixture.sim.selection.to === 0 && fixture.sim.baseline !== null, { kind: tryInfo.kind });
    await js('window.roseflowDebug.filmScale(1)');

    // ---- the practice: help, wrong attempts with specific corrections, the pass
    const tryPrimary = await js('document.querySelector(\'#panel [data-fid="primary"]\') && document.querySelector(\'#panel [data-fid="primary"]\').textContent');
    check('the practice opens in its try beat with Check as the action, not a second Watch', tryInfo.beat === 'try' && tryPrimary === 'Check', { beat: tryInfo.beat, primary: tryPrimary });
    await sleep(400);
    const helpLabel = await js('(() => { const b = document.getElementById("rosie-help"); const r = b.getBoundingClientRect(); return { hidden: b.hidden, text: b.textContent, onScreen: r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight }; })()');
    check('“Click mascot to get help” shows above her during practice', helpLabel.hidden === false && helpLabel.text === 'Click mascot to get help' && helpLabel.onScreen, helpLabel);
    await shotHub('practice-try-robot');
    await js('document.getElementById("rosie-help").click()');
    await shotHub('practice-help-menu');
    const menu = await js('(() => { const p = document.getElementById("rosie-help-pop"); return { hidden: p.hidden, hint: p.querySelector(\'[data-ref="help-hint"]\').textContent, buttons: [...p.querySelectorAll("button")].map((b) => b.textContent) }; })()');
    check('her help offers the two choices, with the state-specific hint', menu.hidden === false && menu.hint === 'Let’s pick Digital 0 first.' && menu.buttons[0] === 'Do you want me to show you how this is done?' && menu.buttons[1] === 'Do you have a different question?', menu);
    await js(d({ type: 'help-ask' }));
    const answer = await js(d({ type: 'help-question', text: 'what is digital 0' }));
    const shown = await js('document.querySelector(\'#rosie-help-pop [data-ref="help-answer"]\').textContent');
    check('a typed basic question is answered from local lesson knowledge', answer.kind === 'basic' && shown === 'Digital Zero is the channel’s name. The value we record on that channel can still be ON or OFF.' && (await state()).training.assisted.includes('s1-one-second-on:try'), { answer, shown });
    const advanced = await js(d({ type: 'help-question', text: 'how do I set the PID gains' }));
    const lunch = await js(d({ type: 'help-question', text: 'what is for lunch' }));
    const huh = await js(d({ type: 'help-question', text: 'zzqp' }));
    check('advanced, unrelated and uncertain questions are handled distinctly', advanced.kind === 'advanced' && lunch.kind === 'unrelated' && huh.kind === 'uncertain', { advanced: advanced.kind, lunch: lunch.kind, huh: huh.kind });
    await js(d({ type: 'help-close' }));
    check('closing help returns focus to the label', (await js('document.getElementById("rosie-help-pop").hidden')) === true && (await js('document.activeElement && document.activeElement.id')) === 'rosie-help');

    // ---- Show me during practice runs on an isolated copy: the attempt, its names, baseline and preview survive it
    await js(d({ type: 'select-range', from: 30, to: 90, channels: ['light-1'] }));
    await js(d({ type: 'set-digital', on: true }));
    await js(d({ type: 'select-range', from: 0, to: 0, channels: [] }));
    const attempt = await state();
    const attemptLights = JSON.stringify(attempt.sim.lights);
    check('a two-second attempt is named as too long', attempt.lesson.feedback && attempt.lesson.feedback.ok === false && attempt.lesson.feedback.message.startsWith('We’re close! Check the duration'), attempt.lesson.feedback);
    await js('window.roseflowDebug.filmScale(0.3)');
    await js(d({ type: 'help-show-me' }));
    let changed = false;
    for (let i = 0; i < 300 && !changed; i += 1) { const s = await state(); changed = s.lesson.demo.running && JSON.stringify(s.sim.lights) !== attemptLights; if (!changed) await sleep(100); }
    check('Show me performs on the copy: the data on screen changes while it runs', changed);
    const midSave = await js('window.roseflowDebug.flushSave()');
    const midDisk = await store.current.load();
    check('a save made during Show me keeps the learner’s attempt, not the film’s copy', midSave.ok === true && midDisk.value && JSON.stringify(midDisk.value.settings.lights['light-1']) === JSON.stringify([[30, 90]]), midDisk.value && midDisk.value.settings.lights);
    await js(d({ type: 'film-skip' }));
    await sleep(400);
    const restored = await state();
    check('after the skipped film the attempt is back exactly: data, names, baseline, no preview; help use recorded', JSON.stringify(restored.sim.lights) === attemptLights && restored.sim.names['light-1'] === 'Digital 0' && restored.sim.baseline !== null && restored.sim.lastPlay === null && restored.lesson.demo.running === false && restored.training.assisted.includes('s1-one-second-on:try'), { on: restored.sim.lights['light-1'].slice(25, 95).map(Number).join(''), names: restored.sim.names, baseline: Boolean(restored.sim.baseline), lastPlay: restored.sim.lastPlay });
    // A cue cut short by Skip>> performs nothing: the Time In click already gliding never lands.
    await js(d({ type: 'help-show-me' }));
    let aimed = false;
    for (let i = 0; i < 600 && !aimed; i += 1) { const c = (await cinema()).current; aimed = Boolean(c && c.click === 'menu-time-in'); if (!aimed) await sleep(20); }
    await js(d({ type: 'film-skip' }));
    await sleep(900);
    const cut = await state();
    check('a click cut short by Skip>> never lands: no zoom, no open menu, the attempt untouched', aimed && cut.sim.zoom === 1 && (await js('(() => { const m = document.querySelector(".pc-menu"); return !m || m.hidden; })()')) === true && JSON.stringify(cut.sim.lights) === attemptLights, { aimed, zoom: cut.sim.zoom });
    await js('window.roseflowDebug.filmScale(1)');
    // Back to the clean fixture for the corrections below; a playback of the empty
    // show must not count as the preview of data drawn afterwards.
    await js(d({ type: 'select-range', from: 30, to: 90, channels: ['light-1'] }));
    await js(d({ type: 'set-digital', on: false }));
    await js(d({ type: 'play' }));
    await sleep(2300);
    await js(d({ type: 'stop' }));
    check('the empty show was played across the event’s time', (await state()).sim.lastPlay && (await state()).sim.lastPlay.to >= 60, (await state()).sim.lastPlay);
    // Wrong channel: a perfect event drawn on Digital 1.
    await dragOn(js, '.ev-digital', 2, 1, 2, 26);
    let fb = (await state()).lesson.feedback;
    check('an event on Digital 1 is named as the wrong channel', fb && fb.ok === false && fb.message.startsWith('The timing looks close'), fb);
    await dragOn(js, '.ev-digital', 2, 1, 2, 26);
    // Too long: 1 s to 2.5 s on Digital 0 through the Edit menu.
    await js(d({ type: 'select-range', from: 30, to: 75, channels: ['light-1'] }));
    await js(d({ type: 'set-digital', on: true }));
    fb = (await state()).lesson.feedback;
    check('an event that runs past two seconds gets the duration correction', fb && fb.ok === false && fb.message.startsWith('We’re close! Check the duration') && fb.message.includes('00:00:02.15'), fb);
    await js(d({ type: 'select-range', from: 60, to: 75, channels: ['light-1'] }));
    await js(d({ type: 'set-digital', on: false }));
    fb = (await state()).lesson.feedback;
    check('correct data that has not been played back asks for the preview', fb && fb.ok === false && fb.message.startsWith('Looks ready'), fb);
    await js(d({ type: 'play' }));
    await sleep(8600);
    const passed = await state();
    check('playing it back passes the step: correct channel, interval, boundaries, unchanged data, previewed', passed.lesson.feedback && passed.lesson.feedback.ok === true && passed.lesson.feedback.message === 'Yes! One second ON. You got it!' && (await stepInfo(js)).done === true, passed.lesson.feedback);
    check('the pass is real training activity and the attempt is recorded', typeof passed.training.lastActivityAt === 'string' && passed.training.attempted.includes('s1-one-second-on:try'), passed.training);

    // ---- Robot Rosie follows the simulated output, never the selection or the zoom
    const robot = () => js('window.roseflowDebug.robot()');
    check('Robot Rosie is shown beside the windows for this lesson, as a simulated preview with a proposed mapping', (await js('(() => { const r = document.getElementById("robot"); return { hidden: r.hidden, badge: r.querySelector(".robot-badge").textContent, note: r.querySelector(".robot-note").textContent }; })()')).hidden === false && /proposed/i.test(await js('document.querySelector("#robot .robot-note").textContent')));
    await js(d({ type: 'stop' }));
    await js(d({ type: 'set-frame', frame: 45 }));
    let rb = await robot();
    check('holding frame 45 shows Digital 0 ON (1) and the petals open', rb.value === 'Digital 0: ON (1)' && rb.on === true && rb.petalAngle === rb.openAngle && rb.source === 'Stopped: holding frame 00:00:01.15', rb);
    await js(d({ type: 'select-range', from: 100, to: 200, channels: ['light-1'] }));
    await js(d({ type: 'zoom', dir: 1 }));
    rb = await robot();
    check('selecting a range and zooming never actuate her', rb.value === 'Digital 0: ON (1)' && rb.petalAngle === rb.openAngle, rb);
    await js(d({ type: 'zoom', dir: -1 }));
    await js(d({ type: 'set-frame', frame: 90 }));
    rb = await robot();
    check('holding frame 90 shows OFF (0) and the petals closed', rb.value === 'Digital 0: OFF (0)' && rb.petalAngle === 0, rb);
    check('her rendering mode is recorded', rb.mode === 'webgl' || rb.mode === '2d', rb.mode);

    // ---- the archive keeps the trainer's channel names
    await js(d({ type: 'start-lesson', id: 'b-timeline-graph' }));
    const legacyNames = await js('document.querySelector(\'.ev-name[data-channel="light-1"]\').textContent');
    check('an archive lesson opened after the segment shows Light 1 Digital again', legacyNames === 'Light 1 Digital', legacyNames);
  }

  // Review material: the expression contact sheets and a few in-app captures
  // of the 3D character with and without her glasses.
  // ---- Time In / Time Out: everything on the time axis zooms together, and
  // nothing else moves. Start at 1 s and Stop at 7 s must sit on the ruler's
  // 1 s and 7 s ticks at every zoom; the frame labels repeat the same way in
  // every second; the window keeps its height; the left edge keeps its time.
  async function scenarioZoom(js, win) {
    const dir = process.env.ROSEFLOW_SMOKE_SHOT_DIR;
    if (dir) await fs.mkdir(dir, { recursive: true });
    await js(d({ type: 'intro-skip' }));
    await sleep(600);
    await js(d({ type: 'start-training' }));
    await js(d({ type: 'start-lesson', id: 's1-orientation', stepIndex: 8 }));
    await js(d({ type: 'set-transport-time', which: 'start', frame: 30 }));
    await js(d({ type: 'set-transport-time', which: 'stop', frame: 210 }));
    await sleep(400);
    const measure = () => js(`(() => {
      const inner = document.querySelector('.ev-inner').getBoundingClientRect();
      const majors = [...document.querySelectorAll('.ev-ruler .rl-tick.major')].map((n) => n.getBoundingClientRect().left);
      const at = (sel) => { const n = document.querySelector(sel); return n ? n.getBoundingClientRect().left : null; };
      const labels = [...document.querySelectorAll('.ev-ruler .rl-num')].map((n) => {
        const r = n.getBoundingClientRect();
        return Math.round(((r.left + r.width / 2 - inner.left) / inner.width) * ${240});
      });
      const perSecond = [];
      for (const f of labels) { const s = Math.floor(f / 30); (perSecond[s] = perSecond[s] || []).push(f % 30); }
      return {
        height: Math.round(document.querySelector('.edit-view').getBoundingClientRect().height * 10) / 10,
        start: { marker: at('.ev-digital line.marker.start'), tick: majors[1] },
        stop: { marker: at('.ev-digital line.marker.stop'), tick: majors[7] },
        perSecond: perSecond.map((l) => l.join(',')),
      };
    })()`);
    const seen = {};
    for (const z of [1, 2, 4]) {
      await js(d({ type: 'set-zoom', zoom: z }));
      await sleep(250);
      const m = await measure();
      seen[z] = m;
      const off = (p) => Math.abs(p.marker - p.tick);
      check(`zoom ${z}: Start and Stop sit on their ruler ticks`, off(m.start) <= 1 && off(m.stop) <= 1, { start: m.start, stop: m.stop });
      check(`zoom ${z}: the frame labels repeat the same way in every second`, m.perSecond.length === 8 && m.perSecond.every((l) => l === m.perSecond[0]), m.perSecond);
      if (dir) {
        await sleep(500);
        await win.webContents.capturePage();
        await sleep(300);
        await fs.writeFile(path.join(dir, `edit-view-zoom-${z}.png`), (await win.webContents.capturePage()).toPNG());
      }
    }
    check('Time In and Time Out never change the window’s height', seen[1].height === seen[2].height && seen[2].height === seen[4].height, [seen[1].height, seen[2].height, seen[4].height]);
    // Scrolled to the second half at zoom 2, Time In keeps 4 s at the left edge.
    // (A hidden window paints no frames, so the scroll event is sent by hand.)
    await js(d({ type: 'set-zoom', zoom: 2 }));
    await sleep(200);
    await js('(() => { const s = document.querySelector(".ev-scroller"); s.scrollLeft = s.scrollWidth / 2; s.dispatchEvent(new Event("scroll")); return s.scrollLeft; })()');
    await sleep(200);
    const leftTime = () => js('document.querySelector(".ev-time.left .field").textContent');
    const before = await leftTime();
    await js(d({ type: 'zoom', dir: 1 }));
    await sleep(250);
    const after = await leftTime();
    check('Time In keeps the time at the left edge of the view', before === '[00:00:04.00]' && after === before, { before, after });
    await js(d({ type: 'set-zoom', zoom: 1 }));
  }

  async function scenarioSheet(js, win) {
    const dir = process.env.ROSEFLOW_SMOKE_SHOT_DIR;
    if (!dir) { check('shot directory provided', false, 'set ROSEFLOW_SMOKE_SHOT_DIR'); return; }
    await fs.mkdir(dir, { recursive: true });
    const writeDataUrl = async (name, dataUrl) => {
      if (!dataUrl) return false;
      await fs.writeFile(path.join(dir, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
      return true;
    };
    check('the face contact sheet (29 faces, silent and speaking) is written', await writeDataUrl('expressions-faces.png', await js('window.roseflowDebug.faceSheet()')));
    check('the 3D contact sheet (with and without glasses) is written', await writeDataUrl('expressions-rosie-3d.png', await js('window.roseflowDebug.rosieSheet()')));
    await js(d({ type: 'intro-skip' }));
    await sleep(1200);
    for (const [name, glasses] of [['joy', false], ['laughter', false], ['terror', true], ['rage', false], ['grief', false], ['nerdy', true]]) {
      await js(`window.roseflowDebug.guideOverride(${JSON.stringify({ expression: name, glasses })})`);
      await sleep(700);
      await win.webContents.capturePage();
      await sleep(300);
      const image = await win.webContents.capturePage();
      const g = await js('window.roseflowDebug.guide()');
      const scale = await js('window.devicePixelRatio || 1');
      const v = g.visible;
      const crop = image.crop({ x: Math.round(v.x * scale), y: Math.round(v.y * scale), width: Math.round(v.w * scale), height: Math.round(v.h * scale) });
      await fs.writeFile(path.join(dir, `rosie-${name}${glasses ? '-glasses' : ''}.png`), crop.toPNG());
      check(`captured rosie-${name}${glasses ? '-glasses' : ''}.png`, !crop.isEmpty() && g.glasses === glasses, { glasses: g.glasses });
    }
    await js('window.roseflowDebug.guideOverride(null)');
  }

  // The review recordings (brief §10, §17): frames at about four a second
  // into <dir>/<name>/NNNN.png for scripts/record.mjs to stitch with ffmpeg.
  // One: watch, try, help, a wrong attempt, the correction, the pass. Two:
  // skip the film, continue, start with a save, tickle, timeout, tickle,
  // confirmed restart.
  async function scenarioRecord(js, win) {
    const dir = process.env.ROSEFLOW_SMOKE_SHOT_DIR;
    if (!dir) { check('shot directory provided', false, 'set ROSEFLOW_SMOKE_SHOT_DIR'); return; }
    const state = () => js('window.roseflowDebug.getState()');
    let frames = 0;
    let recording = null;
    const recorder = {
      async start(name) {
        const folder = path.join(dir, name);
        await fs.rm(folder, { recursive: true, force: true });
        await fs.mkdir(folder, { recursive: true });
        recording = { folder, n: 0, stop: false };
        const loop = async () => {
          while (recording && !recording.stop) {
            const t = Date.now();
            try {
              const image = await win.webContents.capturePage();
              await fs.writeFile(path.join(recording.folder, `${String(recording.n).padStart(4, '0')}.png`), image.toPNG());
              recording.n += 1;
              frames += 1;
            } catch { /* a frame lost is fine */ }
            await sleep(Math.max(0, 250 - (Date.now() - t)));
          }
        };
        recording.done = loop();
      },
      async stop() { if (!recording) return 0; recording.stop = true; await recording.done; const n = recording.n; recording = null; return n; },
    };
    const untilDemoDone = async (ms = 90000) => { for (let i = 0; i < ms / 200; i += 1) { const s = await state(); if (s.lesson.demo.finished && !s.lesson.demo.running) return true; await sleep(200); } return false; };

    // ---- recording one: watch → try → help → retry
    await js(d({ type: 'intro-skip' }));
    await js('window.roseflowDebug.filmScale(0.5)');
    await recorder.start('watch-try-help-retry');
    await js(d({ type: 'start-training' }));
    await sleep(1200);
    await js(d({ type: 'start-lesson', id: 's1-one-second-on', stepIndex: 0 }));
    await sleep(1500);
    await js(d({ type: 'demo-start' }));
    const finished = await untilDemoDone();
    await sleep(1200);
    await js(d({ type: 'step-next' }));
    await sleep(1200);
    await js(d({ type: 'beat-try' }));
    await sleep(1500);
    await js('document.getElementById("rosie-help").click()');
    await sleep(2000);
    await js(d({ type: 'help-ask' }));
    await sleep(800);
    await js(d({ type: 'help-question', text: 'What is Digital 0?' }));
    await sleep(3200);
    await js(d({ type: 'help-close' }));
    await sleep(800);
    await dragOn(js, '.ev-digital', 0, 1, 2.5, 14);
    await sleep(700);
    await js('(() => { document.querySelector(\'[data-menu="edit"]\').click(); })()');
    await sleep(900);
    await js('(() => { [...document.querySelectorAll(".pc-item")].find((n) => n.textContent.includes("Set Digitals On")).click(); })()');
    await sleep(3200);
    await js(d({ type: 'select-range', from: 60, to: 75, channels: ['light-1'] }));
    await sleep(900);
    await js('(() => { document.querySelector(\'[data-menu="edit"]\').click(); })()');
    await sleep(900);
    await js('(() => { [...document.querySelectorAll(".pc-item")].find((n) => n.textContent.includes("Set Digitals Off")).click(); })()');
    await sleep(2600);
    await js('document.querySelector(\'[data-control="play"]\').click()');
    await sleep(9000);
    await sleep(2500);
    const one = await recorder.stop();
    const passed = await state();
    check('recording one covers the film, the help, a wrong attempt, the correction and the pass', finished && one > 60 && passed.lesson.feedback && passed.lesson.feedback.ok === true, { finished, frames: one, feedback: passed.lesson.feedback });
    await js('window.roseflowDebug.filmScale(1)');
    await js('window.roseflowDebug.flushSave()');

    // ---- recording two: skip → continue → start → tickle → timeout → tickle → confirmed restart
    await recorder.start('skip-continue-start-tickle-restart');
    await js(d({ type: 'intro-replay' }));
    await sleep(2500);
    await js(d({ type: 'intro-skip' }));
    await sleep(1800);
    await js(d({ type: 'continue-training' }));
    await sleep(2200);
    await js(d({ type: 'go-home' }));
    await sleep(1500);
    await js(d({ type: 'start-training' }));
    await sleep(2200);
    await js('document.querySelector(\'#progress-dialog [data-fid="restart"]\').click()');
    await sleep(2500);
    await js('document.querySelector(\'#restart-dialog [data-fid="tickle"]\').click()');
    await sleep(6400);
    await sleep(1800);
    await js('document.querySelector(\'#restart-dialog [data-fid="tickle"]\').click()');
    await sleep(2200);
    await js('document.querySelector(\'#restart-dialog [data-fid="restart-go"]\').click()');
    await sleep(3000);
    const two = await recorder.stop();
    const after = await state();
    check('recording two covers skip, continue, the guarded restart, a timeout, and the confirmed restart', two > 40 && after.training.restarts.count === 1 && after.view === 'lesson', { frames: two, restarts: after.training.restarts, view: after.view });
    check('frames were captured', frames > 100, frames);
  }

  return { run };
}
