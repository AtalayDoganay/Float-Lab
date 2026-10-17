#!/usr/bin/env node
// Runs the hidden-window smoke scenarios against the development app or, with
// --exe <path>, against a packaged executable. Never shows a window.
//
//   npm run smoke
//   node scripts/smoke.mjs --exe "out/Roseflow PC Mac Training-win32-x64/RoseflowPCMacTraining.exe"
//   node scripts/smoke.mjs --shots <dir>
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const args = process.argv.slice(2);
const exeIndex = args.indexOf('--exe');
const exe = exeIndex >= 0 ? path.resolve(args[exeIndex + 1]) : null;
const shotsIndex = args.indexOf('--shots');
const shotsDir = shotsIndex >= 0 ? path.resolve(args[shotsIndex + 1]) : null;

const userData = path.join(repoRoot, '.smoke-userdata', `run-${Date.now()}`);
await fs.mkdir(userData, { recursive: true });

// A representative version-1 progress file (the schema the first Windows build
// wrote): one classic question answered, two exercise steps finished, and the
// learner last on the handbook tab with axis 3 selected.
const LEGACY_V1 = {
  schemaVersion: 1,
  app: 'roseflow-pc-mac-training',
  savedAt: '2026-10-07T16:47:52.826Z',
  location: { view: 'handbook', lessonId: 'l03', questionIndex: 1, exerciseId: 'schedule-light', stepIndex: 2 },
  course: { completedLessons: [], missedLessons: ['l03'], answered: ['l03q1'] },
  guided: { completedSteps: ['schedule-light:sl-channel', 'schedule-light:sl-blocks'], completedExercises: [] },
  settings: { channelId: 'light-1', blocks: [false, false, true, true, false, false, false, false], axis: 3, command: 128, laptopIp: '192.168.0.20' },
};

function launch(scenario) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      ROSEFLOW_SMOKE: '1',
      ROSEFLOW_SMOKE_SCENARIO: scenario,
      ROSEFLOW_USERDATA: userData,
      ...(shotsDir ? { ROSEFLOW_SMOKE_SHOT_DIR: shotsDir } : {}),
    };
    const command = exe ?? require('electron');
    const commandArgs = exe ? [] : [repoRoot];
    const child = spawn(command, commandArgs, { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => child.kill(), 90000);
    child.on('close', (code) => {
      clearTimeout(timer);
      const line = stdout.split(/\r?\n/).find((l) => l.startsWith('SMOKE_RESULT '));
      resolve({ scenario, code, report: line ? JSON.parse(line.slice('SMOKE_RESULT '.length)) : null, stderr: stderr.slice(-2000) });
    });
  });
}

// A representative version-2 progress file (the guided-learning build): in the
// timeline lesson at step 3 with blocks 2, 3, and 5 ON and axis 2 at 100.
const LEGACY_V2 = {
  schemaVersion: 2,
  app: 'roseflow-pc-mac-training',
  savedAt: '2026-10-07T19:12:00.000Z',
  location: { view: 'lesson', level: 'basic', lessonId: 'b-timeline-graph', stepIndex: 2 },
  learning: { completedSteps: ['b-system:show', 'b-timeline-graph:seconds', 'b-timeline-graph:block-states', 'b-timeline-graph:retired-step'], completedLessons: ['b-system'], missedLessons: [] },
  course: { completedLessons: ['l01'], missedLessons: [], answered: ['l01q1', 'l01q2'] },
  guided: { completedSteps: [], completedExercises: [] },
  settings: { channelId: 'light-1', blocks: [false, false, true, true, false, true, false, false], axis: 2, command: 100, laptopIp: '192.168.0.20' },
  migrated: null,
};

const sequence = shotsDir ? ['shots'] : ['first', 'resume', 'malformed', 'savefail', 'legacy', 'legacy2', 'practice'];
const summary = [];
for (const scenario of sequence) {
  if (scenario === 'malformed') {
    await fs.writeFile(path.join(userData, 'progress.json'), '{ definitely not json', 'utf8');
  }
  if (scenario === 'legacy') {
    await fs.rm(path.join(userData, 'progress.v1-backup.json'), { force: true });
    await fs.writeFile(path.join(userData, 'progress.json'), JSON.stringify(LEGACY_V1, null, 2), 'utf8');
  }
  if (scenario === 'legacy2') {
    await fs.rm(path.join(userData, 'progress.v2-backup.json'), { force: true });
    await fs.writeFile(path.join(userData, 'progress.json'), JSON.stringify(LEGACY_V2, null, 2), 'utf8');
  }
  const result = await launch(scenario);
  summary.push(result);
  const r = result.report;
  console.log(`\n== scenario: ${scenario} ${r ? `(${r.passed} passed, ${r.failed} failed)` : '(no report)'} ==`);
  if (r) for (const c of r.results) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.ok ? '' : `  -> ${JSON.stringify(c.detail)}`}`);
  if (!r) console.log(result.stderr || '(no stderr)');
}

const failed = summary.filter((s) => !s.report || s.report.failed > 0);
console.log(`\nTarget: ${exe ?? 'development app (electron .)'}`);
console.log(`User data used: ${userData}`);
console.log(failed.length ? `SMOKE FAILED (${failed.length} scenario(s))` : 'SMOKE PASSED (all scenarios)');
process.exit(failed.length ? 1 : 0);
