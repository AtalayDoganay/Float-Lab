// Hidden-window smoke harness. Runs only when ROSEFLOW_SMOKE=1. Drives the real
// renderer through window.roseflowDebug (exposed only in smoke mode), records
// every non-local network request, and prints one SMOKE_RESULT JSON line.
// The window is never shown, so these checks cannot take focus or input.

import fs from 'node:fs/promises';
import path from 'node:path';

const SCENARIOS = ['first', 'resume', 'malformed', 'savefail', 'shots'];

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

  async function scenarioFirst(js) {
    const lessonCount = await js('document.querySelectorAll(\'[data-control="lesson-nav"] button\').length');
    check('ten lessons are listed', lessonCount === 10, lessonCount);

    // Wrong answer, then right answer, then advance.
    const wrong = await js('window.roseflowDebug.dispatch({ type: "answer", choice: 1 })');
    check('wrong answer is explained', typeof wrong.feedback === 'string' && wrong.feedback.startsWith('Not quite'), wrong.feedback);
    const right = await js('window.roseflowDebug.dispatch({ type: "answer", choice: 0 })');
    check('correct answer is confirmed', right.feedback && right.feedback.includes('right'), right.feedback);
    let state = await js('window.roseflowDebug.getState()');
    check('lesson marked for review after a wrong try', state.course.missedLessons.includes('l01'));
    await js('window.roseflowDebug.dispatch({ type: "next" })');
    state = await js('window.roseflowDebug.getState()');
    check('next moves to question 2', state.course.questionIndex === 1, state.course.questionIndex);

    // Help preserves practice state.
    const before = JSON.stringify((await js('window.roseflowDebug.getState()')).course);
    await js('window.roseflowDebug.openHelp("command-slider")');
    const helpOpen = await js('document.querySelector("#help-dialog").open');
    check('help dialog opens on request', helpOpen === true);
    const helpTitle = await js('document.querySelector("#help-dialog h2").textContent');
    check('help dialog shows the control name', helpTitle.includes('Command value slider'), helpTitle);
    await js('window.roseflowDebug.closeHelp()');
    const helpClosed = await js('document.querySelector("#help-dialog").open');
    check('help dialog closes', helpClosed === false);
    const after = JSON.stringify((await js('window.roseflowDebug.getState()')).course);
    check('opening help kept the practice state', before === after);

    // Tooltip on focus. A hidden window never has page focus, so Chromium does
    // not dispatch focus events for element.focus(); the harness dispatches the
    // focusin event the real keyboard path would produce.
    await js('(() => { const b = document.querySelector(\'[data-control="play"]\'); b.focus(); b.dispatchEvent(new FocusEvent("focusin", { bubbles: true })); })()');
    await sleep(50);
    const tip = await js('document.querySelector("#tooltip").hidden === false && document.querySelector("#tooltip").textContent');
    check('tooltip appears on focusin of a control', typeof tip === 'string' && tip.includes('Play'), tip);
    await js('document.querySelector(\'[data-control="play"]\').dispatchEvent(new FocusEvent("focusout", { bubbles: true }))');
    const tipGone = await js('document.querySelector("#tooltip").hidden');
    check('tooltip hides on focusout', tipGone === true);
    await js('(() => { const b = document.querySelector(\'[data-control="stop"]\'); b.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); })()');
    const hoverTip = await js('document.querySelector("#tooltip").hidden === false && document.querySelector("#tooltip").textContent');
    check('tooltip appears on hover of a control', typeof hoverTip === 'string' && hoverTip.includes('Stop'), hoverTip);
    await js('document.querySelector(\'[data-control="stop"]\').dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))');

    // Handbook search through the UI.
    await js('window.roseflowDebug.dispatch({ type: "view", view: "handbook" })');
    await js('window.roseflowDebug.setSearch("netmask")');
    const hits = await js('document.querySelectorAll("#handbook-results li").length');
    check('handbook search for netmask returns results', hits > 0, hits);
    const firstHit = await js('document.querySelector("#handbook-results li").textContent');
    check('top result is the netmask concept', firstHit.includes('Subnet mask'), firstHit);
    await js('window.roseflowDebug.setSearch("zzzzqq")');
    const none = await js('document.querySelector("#handbook-status").textContent');
    check('no-results feedback is shown', none.toLowerCase().includes('no entries'), none);

    // Timeline: toggle, play, boundary, stop.
    await js('window.roseflowDebug.dispatch({ type: "view", view: "lessons" })');
    await js('window.roseflowDebug.dispatch({ type: "toggle-block", index: 1 })');
    state = await js('window.roseflowDebug.getState()');
    check('block 1 toggles on', state.sim.blocksByChannel['light-1'][1] === true, state.sim.blocksByChannel);
    await js('window.roseflowDebug.dispatch({ type: "toggle-block", index: 1 })');
    await js('window.roseflowDebug.dispatch({ type: "play" })');
    await sleep(1250);
    state = await js('window.roseflowDebug.getState()');
    check('after 1.25 s playback is on block 1 (0–1 s done)', state.sim.playing && state.sim.tick === 1, state.sim.tick);
    const readout = await js('document.querySelector(\'[data-control="time-readout"]\').textContent');
    check('time readout shows 00:00:01.00 at block 1', readout.includes('00:00:01.00'), readout);
    await js('window.roseflowDebug.dispatch({ type: "stop" })');
    state = await js('window.roseflowDebug.getState()');
    check('stop ends playback', state.sim.playing === false && state.sim.tick === 0);

    // Command 128 -> 50.2%.
    await js('window.roseflowDebug.dispatch({ type: "set-command", value: 128 })');
    const cmd = await js('document.querySelector(\'[data-control="command-readout"]\').textContent');
    check('command 128 reads 50.2%', cmd.includes('50.2%'), cmd);

    // Network examples.
    const outcomes = [];
    for (const ip of ['192.168.0.20', '192.168.1.20', '192.168.0.10']) {
      await js(`window.roseflowDebug.dispatch({ type: "select-laptop-ip", ip: "${ip}" })`);
      outcomes.push(await js('document.querySelector(\'[data-control="network-result"]\').textContent'));
    }
    check('three network examples explain same / different / duplicate',
      /same subnet/i.test(outcomes[0]) && /different subnet/i.test(outcomes[1]) && /duplicate/i.test(outcomes[2]), outcomes);

    // Guided exercise end to end: schedule a light.
    await js('window.roseflowDebug.dispatch({ type: "view", view: "practice" })');
    await js('window.roseflowDebug.dispatch({ type: "start-exercise", id: "schedule-light" })');
    await js('window.roseflowDebug.dispatch({ type: "select-channel", id: "light-1" })');
    let g = await js('window.roseflowDebug.getState().guided');
    check('guided step 1 passed on channel select', g.stepIndex === 1, g);
    await js('window.roseflowDebug.dispatch({ type: "guided-check" })');
    g = await js('window.roseflowDebug.getState().guided');
    check('guided step 2 passed on default blocks 2 and 3', g.stepIndex === 2, g);
    await js('window.roseflowDebug.dispatch({ type: "play" })');
    g = await js('window.roseflowDebug.getState().guided');
    check('guided step 3 passed on play', g.stepIndex === 3, g);
    await js('window.roseflowDebug.dispatch({ type: "stop" })');
    g = await js('window.roseflowDebug.getState().guided');
    check('guided exercise completes on stop', g.completedExercises.includes('schedule-light'), g);

    // Distinctive settings to verify on resume, then save.
    await js('window.roseflowDebug.dispatch({ type: "select-axis", axis: 2 })');
    await js('window.roseflowDebug.dispatch({ type: "set-command", value: 100 })');
    await js('window.roseflowDebug.dispatch({ type: "play" })');
    const saved = await js('window.roseflowDebug.flushSave()');
    check('progress saved to disk', saved && saved.ok === true, saved);
    const onDisk = await store.current.load();
    check('saved file validates and holds the answered question', onDisk.ok && onDisk.value && onDisk.value.course.answered.includes('l01q1'), onDisk.value && onDisk.value.course);
    check('playback is never saved as running', onDisk.value && onDisk.value.settings.axis === 2 && onDisk.value.settings.command === 100);
  }

  async function scenarioResume(js) {
    const startVisible = await js('document.querySelector("#start-dialog").open');
    check('start dialog offers Resume / Restart when progress exists', startVisible === true);
    await js('window.roseflowDebug.dispatch({ type: "resume" })');
    const state = await js('window.roseflowDebug.getState()');
    check('resume restores lesson 1 question 2', state.course.lessonIndex === 0 && state.course.questionIndex === 1, state.course);
    check('resume restores axis 2 and command 100', state.sim.axis === 2 && state.sim.command === 100, state.sim);
    check('resume restores playback paused', state.sim.playing === false);
    check('resume restores completed exercise', state.guided.completedExercises.includes('schedule-light'));
    check('resume restores the practice view that was open', state.view === 'practice', state.view);

    await js('window.roseflowDebug.dispatch({ type: "restart-request" })');
    const confirmOpen = await js('document.querySelector("#confirm-dialog").open');
    check('restart asks for confirmation', confirmOpen === true);
    await js('window.roseflowDebug.dispatch({ type: "restart-cancel" })');
    let after = await js('window.roseflowDebug.getState()');
    check('cancelled restart keeps progress', after.course.answered.length === 1);
    await js('window.roseflowDebug.dispatch({ type: "restart-request" })');
    await js('window.roseflowDebug.dispatch({ type: "restart-confirm" })');
    await sleep(100);
    after = await js('window.roseflowDebug.getState()');
    check('confirmed restart clears progress', after.course.answered.length === 0 && after.course.completedLessons.length === 0 && after.guided.completedExercises.length === 0);
    const onDisk = await store.current.load();
    check('restart wrote a fresh empty document', onDisk.ok && onDisk.value && onDisk.value.course.answered.length === 0);
  }

  async function scenarioMalformed(js) {
    const state = await js('window.roseflowDebug.getState()');
    check('malformed file did not crash and started fresh', state.course.completedLessons.length === 0);
    check('recovery notice is recorded', state.persistence.recovered && state.persistence.recovered.reason === 'invalid-json', state.persistence);
    const notice = await js('document.querySelector("#persistence-notice").hidden === false && document.querySelector("#persistence-notice").textContent');
    check('recovery notice is visible', typeof notice === 'string' && notice.includes('moved aside'), notice);
  }

  // Captures PNGs of the hidden window for design review. Never shows the window.
  async function scenarioShots(js, win) {
    const dir = process.env.ROSEFLOW_SMOKE_SHOT_DIR;
    if (!dir) { check('shot directory provided', false, 'set ROSEFLOW_SMOKE_SHOT_DIR'); return; }
    await fs.mkdir(dir, { recursive: true });
    const shot = async (name) => {
      await sleep(250);
      const image = await win.webContents.capturePage();
      const file = path.join(dir, name);
      await fs.writeFile(file, image.toPNG());
      check(`captured ${name}`, !image.isEmpty(), image.getSize());
    };
    await shot('01-lessons-start.png');
    await js('window.roseflowDebug.dispatch({ type: "open-lesson", index: 3 })');
    await js('window.roseflowDebug.dispatch({ type: "select-axis", axis: 2 })');
    await shot('02-lesson4-axis.png');
    await js('window.roseflowDebug.dispatch({ type: "view", view: "practice" })');
    await js('window.roseflowDebug.dispatch({ type: "start-exercise", id: "schedule-light" })');
    await js('window.roseflowDebug.dispatch({ type: "select-channel", id: "light-1" })');
    await js('window.roseflowDebug.dispatch({ type: "toggle-block", index: 1 })');
    await js('window.roseflowDebug.dispatch({ type: "guided-check" })');
    await shot('03-practice-highlight.png');
    await js('window.roseflowDebug.dispatch({ type: "toggle-block", index: 1 })');
    await js('window.roseflowDebug.dispatch({ type: "term-key", key: "k" })');
    await js('window.roseflowDebug.setSearch("netmask")');
    await shot('04-handbook-feedback-menu.png');
    await js('window.roseflowDebug.dispatch({ type: "open-entry", id: "concept:calibration" })');
    await js('window.roseflowDebug.dispatch({ type: "term-key", key: "6" })');
    await shot('05-entry-network-menu.png');
    await js('window.roseflowDebug.openHelp("timeline-block")');
    await shot('06-help-dialog.png');
    await js('window.roseflowDebug.closeHelp()');
    await js('window.roseflowDebug.dispatch({ type: "view", view: "progress" })');
    await js('window.roseflowDebug.dispatch({ type: "play" })');
    await sleep(2300);
    await shot('07-progress-playing.png');
    await js('window.roseflowDebug.dispatch({ type: "stop" })');
  }

  async function scenarioSaveFail(js) {
    await js('window.roseflowDebug.dispatch({ type: "answer", choice: 0 })');
    const saved = await js('window.roseflowDebug.flushSave()');
    check('save failure is reported to the renderer', saved && saved.ok === false, saved);
    const banner = await js('document.querySelector("#persistence-notice").hidden === false && document.querySelector("#persistence-notice").textContent');
    check('save failure banner is visible', typeof banner === 'string' && banner.includes('could not be saved'), banner);
    const state = await js('window.roseflowDebug.getState()');
    check('work stays in memory after a failed save', state.course.answered.includes('l01q1'));
    check('failed save does not mark anything complete', state.course.completedLessons.length === 0);
  }

  return { run };
}
