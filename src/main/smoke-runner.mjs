// Hidden-window smoke harness. Runs only when ROSEFLOW_SMOKE=1. Drives the real
// renderer through window.roseflowDebug (exposed only in smoke mode), records
// every non-local network request, and prints one SMOKE_RESULT JSON line.
// The window is never shown, so these checks cannot take focus or input.

import fs from 'node:fs/promises';
import path from 'node:path';

const SCENARIOS = ['first', 'resume', 'malformed', 'savefail', 'legacy', 'legacy2', 'practice', 'shots'];

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
      if (scenario === 'legacy') await scenarioLegacy(js);
      if (scenario === 'legacy2') await scenarioLegacy2(js);
      if (scenario === 'practice') await scenarioPractice(js);
      if (scenario === 'shots') await scenarioShots(js, win);

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
    // Home: the three levels, named exactly, and no Continue card yet.
    const levelNames = await js('[...document.querySelectorAll(\'[data-control="level-choice"] h2\')].map((n) => n.textContent)');
    check('home presents Basic, intermediate, and I hate my life', JSON.stringify(levelNames) === JSON.stringify(['Basic', 'intermediate', 'I hate my life']), levelNames);
    const continueCard = await js('Boolean(document.querySelector(\'[data-control="resume"]\'))');
    check('no Continue card on a fresh start', continueCard === false);
    const deskHidden = await js('document.getElementById("desk").hidden');
    check('the workspace is not shown until a lesson starts', deskHidden === true);

    // Level map grouped by function with a clear starting point.
    await js(d({ type: 'choose-level', level: 'basic' }));
    let state = await js('window.roseflowDebug.getState()');
    check('choosing Basic opens its lesson map', state.view === 'level' && state.level === 'basic');
    const groups = await js('[...document.querySelectorAll(".group h2")].map((n) => n.textContent)');
    check('Basic groups topics by function', ['The interface', 'Graphs', 'Terminology', 'Functions', 'Hydraulics', 'Assignments'].every((g) => groups.includes(g)), groups);
    const beginTitle = await js('document.querySelector(".begin-card .title").textContent');
    check('Begin here names the first lesson', beginTitle === 'How a click becomes movement', beginTitle);

    // First lesson: explanation steps, a wrong answer, a right answer, finish.
    await js(d({ type: 'begin-here' }));
    let info = await stepInfo(js);
    check('Begin here opens the first lesson at step 1', info && info.lessonId === 'b-system' && info.index === 0 && info.total === 5, info);
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
    const finishedNote = await js('document.querySelector(".finished-note") && document.querySelector(".finished-note").textContent');
    check('the map says which lesson was finished', typeof finishedNote === 'string' && finishedNote.includes('How a click becomes movement'), finishedNote);

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
    await js(d({ type: 'step-next' }));
    info = await stepInfo(js);
    state = await js('window.roseflowDebug.getState()');
    check('the practice step starts from its setup state (Light 1 all OFF)', info.kind === 'practice' && state.sim.lights['light-1'].every((b) => b === false));
    const menuGreyed = await js('(() => { document.querySelector(\'[data-menu="edit"]\').click(); const item = [...document.querySelectorAll(".pc-item")].find((n) => n.textContent.includes("Set Digitals On")); const greyed = item.disabled; document.body.click(); return greyed; })()');
    check('Edit ▸ Set Digitals On is greyed until a digital is selected for a stretch', menuGreyed === true);
    // A wrong action through the real Edit View: RightClick-and-slide on Light 1 from 4 s to 5 s.
    await dragOn(js, '.ev-digital', 2, 4, 5, 14);
    state = await js('window.roseflowDebug.getState()');
    check('RightClick-and-slide on the digital row draws Light 1 ON', JSON.stringify(onSpans(state.sim.lights['light-1'])) === JSON.stringify([[120, 150]]), onSpans(state.sim.lights['light-1']));
    check('an incorrect practice action gets a specific correction', state.lesson.feedback && state.lesson.feedback.ok === false && /ON from 00:00:04\.00 to 00:00:05\.00/.test(state.lesson.feedback.message), state.lesson.feedback);
    check('Next stays locked after a wrong action', (await stepInfo(js)).canAdvance === false);
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
    check('saved file is schema 3 with the lesson location', v && v.schemaVersion === 3 && v.location.view === 'lesson' && v.location.level === 'basic' && v.location.lessonId === 'b-timeline-graph' && v.location.stepIndex === 3, v && v.location);
    check('saved file holds finished steps, the finished lesson, and the mirrored classic record', v && v.learning.completedLessons.includes('b-system') && v.learning.completedSteps.includes('b-timeline-graph:turn-on-5') && v.course.answered.includes('l01q1'), v && v.learning);
    check('saved show data holds the practised Light 1 span, and playback is never saved as running', v && JSON.stringify(v.settings.lights['light-1']) === '[[150,180]]' && v.settings.axis === 2 && v.settings.console[2] === 100 && v.settings.command === 100, v && v.settings);
  }

  async function scenarioResume(js) {
    const card = await js('document.querySelector(".continue-card") && document.querySelector(".continue-card").textContent');
    check('home offers Continue when progress exists', typeof card === 'string' && card.includes('Reading the timeline') && card.includes('step 4 of 5'), card);
    check('home still shows the three levels', (await js('document.querySelectorAll(\'[data-control="level-choice"]\').length')) === 3);
    await js(d({ type: 'resume' }));
    const state = await js('window.roseflowDebug.getState()');
    const info = await stepInfo(js);
    check('Continue reopens the saved lesson and step', state.view === 'lesson' && info.lessonId === 'b-timeline-graph' && info.index === 3, { view: state.view, info });
    check('resume restores the practised Light 1 span, axis 2, and the Soft Console value 100', JSON.stringify(onSpans(state.sim.lights['light-1'])) === '[[150,180]]' && state.sim.axis === 2 && state.sim.command === 100 && state.sim.console[2] === 100, { axis: state.sim.axis, command: state.sim.command });
    check('resume restores playback stopped', state.sim.mode === 'stop');
    check('resume keeps the finished lesson', state.learning.completedLessons.includes('b-system'));
    check('the earlier practice step is still done on resume', (await js(d({ type: 'step-back' }))) === null && (await stepInfo(js)).done === true);

    await js(d({ type: 'restart-request' }));
    const confirmOpen = await js('document.querySelector("#confirm-dialog").open');
    check('Start over asks for confirmation', confirmOpen === true);
    await js(d({ type: 'restart-cancel' }));
    let after = await js('window.roseflowDebug.getState()');
    check('cancelled Start over keeps progress', after.learning.completedLessons.length === 1);
    await js(d({ type: 'restart-request' }));
    await js(d({ type: 'restart-confirm' }));
    await sleep(100);
    after = await js('window.roseflowDebug.getState()');
    check('confirmed Start over clears progress and returns home', after.view === 'home' && after.learning.completedSteps.length === 0 && after.course.answered.length === 0 && after.level === null, { view: after.view });
    const onDisk = await store.current.load();
    check('Start over wrote a fresh empty document', onDisk.ok && onDisk.value && onDisk.value.learning.completedSteps.length === 0 && onDisk.value.location.level === null);
  }

  async function scenarioMalformed(js) {
    const state = await js('window.roseflowDebug.getState()');
    check('malformed file did not crash and started fresh', state.learning.completedLessons.length === 0 && state.view === 'home');
    check('recovery notice is recorded', state.persistence.recovered && state.persistence.recovered.reason === 'invalid-json', state.persistence);
    const notice = await js('document.querySelector("#persistence-notice").hidden === false && document.querySelector("#persistence-notice").textContent');
    check('recovery notice is visible', typeof notice === 'string' && notice.includes('moved aside'), notice);
  }

  async function scenarioSaveFail(js) {
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

  // Seeded by scripts/smoke.mjs with a version-1 file: one classic question
  // answered and two exercise steps finished.
  async function scenarioLegacy(js) {
    const state = await js('window.roseflowDebug.getState()');
    check('a version-1 file is migrated and reported', state.migratedInfo && state.migratedInfo.fromSchemaVersion === 1 && state.persistence.migrated && typeof state.persistence.migrated.backupPath === 'string', { migratedInfo: state.migratedInfo, migrated: state.persistence.migrated });
    let backupExists = false;
    try { await fs.access(state.persistence.migrated.backupPath); backupExists = true; } catch { backupExists = false; }
    check('the original version-1 file was backed up beside progress.json', backupExists, state.persistence.migrated && state.persistence.migrated.backupPath);
    check('the classic records survive migration', state.course.answered.includes('l03q1') && state.guided.completedSteps.includes('schedule-light:sl-blocks'), { course: state.course, guided: state.guided });
    check('the app opens at the level choice after migration', state.view === 'home');
    const found = await js('document.querySelector(".found-card") && document.querySelector(".found-card").textContent');
    check('home explains that earlier progress was found and what it held', typeof found === 'string' && found.includes('earlier version') && found.includes('1 answered question') && found.includes('2 finished exercise steps'), found);

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
    check('after the first save the file is schema 3 and the records are intact', saved.ok && onDisk.value.schemaVersion === 3 && onDisk.value.course.answered.includes('l03q1') && onDisk.value.migrated && onDisk.value.migrated.fromSchemaVersion === 1, onDisk.value && onDisk.value.migrated);
  }

  // Seeded by scripts/smoke.mjs with a version-2 file (the guided-learning
  // build): mid-lesson in b-timeline-graph with blocks 2, 3, and 5 ON.
  async function scenarioLegacy2(js) {
    const state = await js('window.roseflowDebug.getState()');
    check('a version-2 file is migrated and backed up as progress.v2-backup.json', state.persistence.migrated && state.persistence.migrated.fromSchemaVersion === 2 && /progress\.v2-backup\.json$/.test(state.persistence.migrated.backupPath), state.persistence.migrated);
    check('finished lessons and steps survive', state.learning.completedLessons.includes('b-system') && state.learning.completedSteps.includes('b-timeline-graph:seconds'), state.learning);
    check('blocks 2, 3, and 5 became Light 1 ON from 2 s to 4 s and 5 s to 6 s', JSON.stringify(onSpans(state.sim.lights['light-1'])) === '[[60,120],[150,180]]', onSpans(state.sim.lights['light-1']));
    check('the saved command became axis 2’s Soft Console value', state.sim.axis === 2 && state.sim.console[2] === 100 && state.sim.command === 100);
    const card = await js('document.querySelector(".continue-card") && document.querySelector(".continue-card").textContent');
    check('Continue still offers the saved lesson and step', typeof card === 'string' && card.includes('Reading the timeline'), card);
    await js(d({ type: 'resume' }));
    const info = await stepInfo(js);
    check('Continue reopens the saved step', info.lessonId === 'b-timeline-graph' && info.index === 2, info);
    const saved = await js('window.roseflowDebug.flushSave()');
    const onDisk = await store.current.load();
    check('after the first save the file is schema 3 and the migration note is kept', saved.ok && onDisk.value.schemaVersion === 3 && onDisk.value.migrated && onDisk.value.migrated.fromSchemaVersion === 2, onDisk.value && onDisk.value.migrated);
    check('a finished-step key for a step the lesson no longer has is kept, not dropped', onDisk.value.learning.completedSteps.includes('b-timeline-graph:retired-step'), onDisk.value.learning.completedSteps);
    const home = await js(d({ type: 'go-home' })) === null && await js('document.querySelector(".found-card") && document.querySelector(".found-card").textContent');
    check('Home explains the version-2 update, not the version-1 text', typeof home === 'string' && home.includes('previous version was updated') && home.includes('Edit View'), home);
  }

  // Solves the practice steps that use the recreated windows, the way a learner
  // would, and checks each one passes only after the right action.
  async function scenarioPractice(js) {
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

  // Captures PNGs of the hidden window for design review. Never shows the window.
  async function scenarioShots(js, win) {
    const dir = process.env.ROSEFLOW_SMOKE_SHOT_DIR;
    if (!dir) { check('shot directory provided', false, 'set ROSEFLOW_SMOKE_SHOT_DIR'); return; }
    await fs.mkdir(dir, { recursive: true });
    const shot = async (name) => {
      // A hidden window repaints lazily and the first capture returns the
      // previous frame; take a throwaway capture, wait, then capture for real.
      await sleep(300);
      await win.webContents.capturePage();
      await sleep(600);
      const image = await win.webContents.capturePage();
      const file = path.join(dir, name);
      await fs.writeFile(file, image.toPNG());
      check(`captured ${name}`, !image.isEmpty(), image.getSize());
    };
    await shot('01-home.png');
    await js(d({ type: 'choose-level', level: 'basic' }));
    await shot('02-level-map.png');
    await js(d({ type: 'begin-here' }));
    await shot('03-first-step.png');
    await js(d({ type: 'start-lesson', id: 'b-timeline-graph', stepIndex: 2 }));
    await dragOn(js, '.ev-digital', 2, 4, 5, 14);
    await dragOn(js, '.ev-digital', 0, 3.5, 5.5, 14);
    await shot('04-practice-correction.png');
    await js('document.querySelector(\'[data-menu="edit"]\').click()');
    await shot('05-edit-menu.png');
    await js('document.body.click()');
    await js(d({ type: 'start-lesson', id: 'b-channels', stepIndex: 0 }));
    await js(d({ type: 'select-range', from: 30, to: 90, channels: ['axis-0'] }));
    await shot('06-edit-view-analog-selection.png');
    await js(d({ type: 'open-value-dialog' }));
    await sleep(50);
    await shot('07-set-to-value-dialog.png');
    await js('document.getElementById("value-dialog").close()');
    await js(d({ type: 'start-lesson', id: 'b-hydraulics', stepIndex: 2 }));
    await shot('08-control-window-soft-console.png');
    await js(d({ type: 'start-lesson', id: 'b-terminal', stepIndex: 3 }));
    await shot('09-terminal-lesson.png');
    await js(d({ type: 'start-lesson', id: 'i-network', stepIndex: 3 }));
    await js(d({ type: 'handbook-toggle' }));
    await js('window.roseflowDebug.setSearch("netmask")');
    await shot('10-handbook-open.png');
    await js(d({ type: 'handbook-close' }));
    await js('window.roseflowDebug.openHelp("menu-set-digital")');
    await shot('11-help-dialog.png');
    await js('window.roseflowDebug.closeHelp()');
    await js(d({ type: 'start-lesson', id: 'h-assign-roundtrip', stepIndex: 4 }));
    await shot('12-roundtrip-all-windows.png');
    await js(d({ type: 'explore' }));
    await js(d({ type: 'zoom', dir: 1 }));
    await js(d({ type: 'zoom', dir: 1 }));
    await shot('13-explore-zoomed-in.png');
    await js(d({ type: 'go-progress' }));
    await shot('14-progress.png');
  }

  return { run };
}
