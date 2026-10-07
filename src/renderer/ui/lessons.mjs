// Lessons panel: lesson list, Learn / Try / Answer loop, and the checkpoint.
import { el, replace, helpButton, evidenceChip } from './dom.mjs';
import { LESSONS, SETTING_EXPLANATIONS, FLOW_PARTS, CHALLENGE_CLUES } from '../content/curriculum.mjs';
import { CONTROLS } from '../content/controls.mjs';
import { REFERENCE_IMAGES } from '../content/references.mjs';
import { formatPercent, percentOf, axisToDmx, calibratedTarget, blocksToIntervals, classifyLaptopIp } from '../logic/simulation.mjs';

const SETTING_EVIDENCE = { range: 'manual', velocity: 'unverified', force: 'manual', power: 'manual', reverse: 'manual', enable: 'observed', compliance: 'unverified', adl: 'manual' };

export function mountLessons(container, { dispatch, course }) {
  let builtKey = null;
  const refs = {};

  function pointer(text, controls) {
    return el('div', { class: 'pointer' },
      el('span', { text }),
      el('button', { type: 'button', class: 'btn', text: 'Show me where', onclick: () => dispatch({ type: 'highlight', controls }) }));
  }

  function buildTry(lesson, state) {
    const { sim, demos } = state;
    const box = el('div', { class: 'try' }, el('h3', { text: 'Try it' }));
    switch (lesson.demo) {
      case 'flow': {
        const flow = el('div', { class: 'flow' }, ...FLOW_PARTS.map((p, i) => el('button', { type: 'button', 'data-control': 'flow-part', 'aria-pressed': String(demos.flowPart === i), text: `${i + 1}. ${p.label}`, onclick: () => dispatch({ type: 'flow-part', index: i }) })));
        box.append(flow, el('p', { class: 'muted', style: 'margin-top:8px', text: FLOW_PARTS[demos.flowPart].text }), helpButton('flow-part'));
        break;
      }
      case 'signals': {
        box.append(
          el('div', {}, el('span', { class: `indicator ${demos.signalOn ? 'on' : ''}` }), ' ', el('strong', { text: demos.signalOn ? 'ON' : 'OFF' }), ' ',
            el('button', { type: 'button', class: 'btn', 'data-control': 'signal-toggle', 'aria-pressed': String(demos.signalOn), text: 'Toggle ON / OFF', onclick: () => dispatch({ type: 'signal-toggle' }) }), ' ', helpButton('signal-toggle')),
          el('label', { for: 'level-slider' }, 'Analog level ', helpButton('level-slider')),
          el('input', { id: 'level-slider', type: 'range', min: 0, max: 255, value: demos.level, 'data-control': 'level-slider', oninput: (e) => dispatch({ type: 'set-level', value: Number(e.target.value) }) }),
          el('div', { class: 'muted', 'data-ref': 'level-text', text: `${demos.level} / 255 = ${formatPercent(demos.level)}` }),
        );
        break;
      }
      case 'value':
        box.append(pointer('Use the command slider in the workspace readouts.', ['command-slider', 'command-readout']),
          el('div', { class: 'metric', 'data-ref': 'mirror', text: `${sim.command} / 255 = ${formatPercent(sim.command)}` }),
          el('p', { class: 'muted', text: 'Half of 255 is 127.5, so 128 is just above halfway. The number has no built-in unit.' }));
        break;
      case 'calibration':
        box.append(el('label', {}, 'Example maximum travel ', helpButton('calibration-range')),
          el('select', { 'data-control': 'calibration-range', onchange: (e) => dispatch({ type: 'set-calibration', cm: Number(e.target.value) }) },
            ...[10, 20, 40].map((cm) => el('option', { value: cm, selected: sim.calibrationCm === cm, text: `${cm} cm` }))),
          pointer('Then move the command slider in the workspace.', ['command-slider', 'calibration-range']),
          el('div', { class: 'muted', 'data-ref': 'mirror', text: `${formatPercent(sim.command)} of the command range, target ${calibratedTarget(sim.command, sim.calibrationCm).toFixed(2)} cm in this linear example` }));
        break;
      case 'axis':
        box.append(pointer('Select an axis in the analog pane, or click “s) axis to modify” in the terminal and type a number.', ['axis-select', 'term-menu']),
          el('div', { class: 'metric', 'data-ref': 'mirror', text: `${axisToDmx(sim.axis)} (axis ${sim.axis})` }),
          el('p', { class: 'muted', text: 'Card address 1, first channel 6. The photo uses 0-based numbering.' }));
        break;
      case 'feedback':
        box.append(pointer('Set a command, then press Run model in the simulated measurement readout.', ['command-slider', 'measure-run', 'measure-readout']),
          el('div', { class: 'muted', 'data-ref': 'mirror', text: `Command ${formatPercent(sim.command)}, measurement ${sim.measured.toFixed(1)}%, error ${(percentOf(sim.command) - sim.measured).toFixed(1)} points` }),
          el('p', { class: 'muted', text: 'The animation moves a fraction of the remaining gap each tick. It is not a Br-EFB or PID simulator.' }));
        break;
      case 'timeline': {
        const intervals = blocksToIntervals(sim.blocksByChannel[sim.channelId]);
        box.append(pointer('Click blocks in the digital pane, then press Play.', ['timeline-block', 'play', 'stop']),
          el('div', { class: 'muted', 'data-ref': 'mirror', text: intervals.length ? `ON ${intervals.map((iv) => `${iv.start}–${iv.end} s`).join(', ')}` : 'No ON blocks' }));
        break;
      }
      case 'network':
        box.append(pointer('Choose a hypothetical laptop IP in the workspace readouts.', ['laptop-ip-select', 'network-result']),
          el('div', { class: 'muted', 'data-ref': 'mirror', text: `${sim.laptopIp}: ${classifyLaptopIp(sim.laptopIp).replace('-', ' ')}` }));
        break;
      case 'settings': {
        const entry = SETTING_EXPLANATIONS[demos.setting];
        box.append(el('label', {}, 'Explore a menu label ', helpButton('setting-select')),
          el('select', { 'data-control': 'setting-select', onchange: (e) => dispatch({ type: 'set-setting', key: e.target.value }) },
            ...Object.entries({ range: 'Min / Max Scale', velocity: 'Velocity Limit', force: 'Force output to value', power: 'PowerOn Default', reverse: 'Reverse Axis Output', enable: 'Axis Enabled', compliance: 'Compliance Settings', adl: 'NO ADL FILE' })
              .map(([k, label]) => el('option', { value: k, selected: demos.setting === k, text: label }))),
          el('h3', {}, entry[0], ' ', evidenceChip(SETTING_EVIDENCE[demos.setting])),
          el('p', { text: entry[1] }),
          pointer('See the label on the simulated terminal menu.', ['term-menu']));
        break;
      }
      case 'challenge':
        box.append(el('p', {}, 'Requested value: ', el('strong', { text: '128 / 255 (50.2%)' }), '. Reported position: ', el('strong', { text: '0%' }), '. We know the readings disagree. Select a clue to explore.'),
          el('div', { class: 'btn-row' }, ...Object.entries(CHALLENGE_CLUES).map(([k, c]) => el('button', { type: 'button', class: 'btn', 'data-control': 'clue-button', 'aria-pressed': String(demos.clue === k), text: c.label, onclick: () => dispatch({ type: 'clue', key: k }) })), helpButton('clue-button')),
          el('p', { class: 'muted', text: demos.clue ? CHALLENGE_CLUES[demos.clue].text : '' }));
        break;
      default:
        break;
    }
    return box;
  }

  function buildQuestion(state) {
    const current = course.current(state.course);
    const q = current.question;
    const ui = state.lessonUi;
    const wrap = el('div', {});
    wrap.append(
      el('h3', { text: `Check your understanding, question ${state.course.questionIndex + 1} of ${current.lesson.questions.length}` }),
      el('p', { text: q.text }),
      el('div', { class: 'answers' }, ...q.options.map((opt, i) => {
        const cls = current.isAnswered && i === q.correct ? 'correct' : (ui.lastChoice === i && !ui.lastCorrect ? 'wrong' : '');
        return el('button', { type: 'button', class: cls, 'data-control': 'answer-option', 'data-fid': `answer-${i}`, disabled: current.isAnswered, onclick: () => dispatch({ type: 'answer', choice: i }) },
          el('span', { class: 'letter', text: String.fromCharCode(65 + i) }), el('span', { text: opt }));
      })),
      el('div', { class: `feedback ${ui.feedbackKind}`, role: 'status', 'aria-live': 'polite', text: ui.feedback }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn', 'data-control': 'prev-button', 'data-fid': 'prev', disabled: state.course.lessonIndex === 0, text: 'Previous lesson', onclick: () => dispatch({ type: 'prev' }) }),
        el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'next-button', 'data-fid': 'next', disabled: !current.isAnswered,
          text: !current.isAnswered ? 'Choose an answer' : (current.isLastQuestion ? (current.isLastLesson ? 'Finish course' : 'Next lesson') : 'Next question'),
          onclick: () => dispatch({ type: 'next' }) }),
        helpButton('answer-option'), helpButton('next-button')));
    return wrap;
  }

  function buildCheckpoint(state) {
    const cp = course.checkpoint(state.course);
    const missing = cp.missingLessonIds;
    const missed = cp.missedLessonIds;
    return el('div', { class: 'checkpoint' },
      el('h3', { text: missing.length ? 'Keep going' : 'Foundations complete' }),
      el('h2', { text: `${cp.completedCount} of ${cp.total} lessons completed.` }),
      el('p', { text: missing.length ? 'You skipped some lessons. Finish them to complete the course.' : 'You have practiced the signal path, values, calibration, feedback, timing, and networking.' }),
      el('p', { text: missed.length ? `Review the topics where you needed another try: ${missed.map((id) => LESSONS.find((l) => l.id === id).short).join(', ')}.` : 'You can revisit any lesson to practice again.' }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn btn-primary', text: missing.length ? 'Continue unfinished lessons' : 'Review the course',
          onclick: () => dispatch({ type: 'open-lesson', index: missing.length ? LESSONS.findIndex((l) => l.id === missing[0]) : (missed.length ? LESSONS.findIndex((l) => l.id === missed[0]) : 0) }) }),
        el('button', { type: 'button', class: 'btn', text: 'Try the guided exercises', onclick: () => dispatch({ type: 'view', view: 'practice' }) })));
  }

  function build(state) {
    const lesson = LESSONS[state.course.lessonIndex];
    const cp = course.checkpoint(state.course);
    refs.list = el('div', { class: 'lesson-list', 'data-control': 'lesson-nav', role: 'list' },
      ...LESSONS.map((l, i) => el('button', { type: 'button', role: 'listitem', 'data-fid': `lesson-${i}`, class: state.course.completedLessons.includes(l.id) ? 'done' : '', 'aria-current': i === state.course.lessonIndex ? 'step' : null, onclick: () => dispatch({ type: 'open-lesson', index: i }) },
        el('span', { class: 'num', text: state.course.completedLessons.includes(l.id) ? '✓' : String(i + 1).padStart(2, '0') }), l.short)));
    const photo = lesson.photo ? REFERENCE_IMAGES.find((img) => img.file === lesson.photo) : null;
    refs.try = buildTry(lesson, state);
    refs.question = state.lessonUi.checkpoint ? buildCheckpoint(state) : buildQuestion(state);
    replace(container,
      el('div', { class: 'with-help' }, el('h2', { text: 'Lessons' }), helpButton('lesson-nav')),
      el('div', { class: 'lesson-progress' }, el('span', { text: 'Course progress' }), el('strong', { text: `${cp.completedCount} / ${cp.total}` })),
      el('progress', { max: cp.total, value: cp.completedCount, 'aria-label': 'Completed lessons' }),
      refs.list,
      el('hr'),
      el('div', { class: 'lesson-kicker', text: `Lesson ${state.course.lessonIndex + 1} of ${LESSONS.length}. Learn, try, then answer.` }),
      el('h2', { text: lesson.title }),
      el('p', { class: 'lesson-intro', text: lesson.intro }),
      el('h3', { text: 'The idea' }),
      el('p', {}, el('strong', { text: `${lesson.heading}. ` }), lesson.body),
      el('details', { 'data-control': 'simpler-toggle' }, el('summary', { text: 'Explain it more simply' }), el('p', { text: lesson.simple })),
      el('div', { class: 'remember' }, el('strong', { text: 'Remember: ' }), lesson.take),
      refs.try,
      photo ? el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn', 'data-control': 'photo-toggle', text: `See the reference photo (${photo.caption})`, onclick: () => dispatch({ type: 'open-photo', file: photo.file }) }), helpButton('photo-toggle')) : null,
      el('hr'),
      refs.question);
  }

  function update(state) {
    const key = [state.course.lessonIndex, state.course.questionIndex, state.lessonUi.checkpoint ? 'cp' : 'q', state.course.answered.length, state.course.completedLessons.length, state.lessonUi.feedback, state.lessonUi.lastChoice, state.demos.flowPart, state.demos.signalOn, state.demos.setting, state.demos.clue].join('|');
    if (key !== builtKey) {
      const active = document.activeElement;
      const fid = active && container.contains(active) ? active.dataset.fid : null;
      build(state);
      builtKey = key;
      if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
      return;
    }
    // Light refresh for mirrors that follow the workspace or sliders.
    const lesson = LESSONS[state.course.lessonIndex];
    const mirror = refs.try.querySelector('[data-ref="mirror"]');
    const { sim, demos } = state;
    if (mirror) {
      if (lesson.demo === 'value') mirror.textContent = `${sim.command} / 255 = ${formatPercent(sim.command)}`;
      if (lesson.demo === 'calibration') mirror.textContent = `${formatPercent(sim.command)} of the command range, target ${calibratedTarget(sim.command, sim.calibrationCm).toFixed(2)} cm in this linear example`;
      if (lesson.demo === 'axis') mirror.textContent = `${axisToDmx(sim.axis)} (axis ${sim.axis})`;
      if (lesson.demo === 'feedback') mirror.textContent = `Command ${formatPercent(sim.command)}, measurement ${sim.measured.toFixed(1)}%, error ${(percentOf(sim.command) - sim.measured).toFixed(1)} points`;
      if (lesson.demo === 'timeline') { const iv = blocksToIntervals(sim.blocksByChannel[sim.channelId]); mirror.textContent = iv.length ? `ON ${iv.map((x) => `${x.start}–${x.end} s`).join(', ')}` : 'No ON blocks'; }
      if (lesson.demo === 'network') mirror.textContent = `${sim.laptopIp}: ${classifyLaptopIp(sim.laptopIp).replace('-', ' ')}`;
    }
    const levelText = refs.try.querySelector('[data-ref="level-text"]');
    if (levelText) levelText.textContent = `${demos.level} / 255 = ${formatPercent(demos.level)}`;
  }

  return { update };
}
