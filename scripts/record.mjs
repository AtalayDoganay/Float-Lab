#!/usr/bin/env node
// Records the two review sequences through the hidden-window harness and
// stitches them into MP4s with ffmpeg (which must be on PATH):
//   docs/review/<date>/watch-try-help-retry.mp4
//   docs/review/<date>/skip-continue-start-tickle-restart.mp4
//
//   npm run record            (writes under docs/review/YYYY-MM-DD/)
//   node scripts/record.mjs --out <dir>
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const out = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(repoRoot, 'docs', 'review', new Date().toISOString().slice(0, 10));
await fs.mkdir(out, { recursive: true });

const ffmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ffmpeg.status !== 0) {
  console.error('ffmpeg is not on PATH; the frames can still be captured but no video will be stitched.');
}

const run = (cmd, cmdArgs, env = {}) => new Promise((resolve) => {
  const child = spawn(cmd, cmdArgs, { cwd: repoRoot, env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('close', (code) => resolve(code));
});

const code = await run('node', ['scripts/smoke.mjs', '--only', 'record'], { ROSEFLOW_SMOKE_SHOT_DIR: out });
if (code !== 0) { console.error('the record scenario failed; see the smoke output above'); process.exit(code); }

for (const name of ['watch-try-help-retry', 'skip-continue-start-tickle-restart']) {
  const folder = path.join(out, name);
  const frames = (await fs.readdir(folder)).filter((f) => f.endsWith('.png')).length;
  if (ffmpeg.status !== 0 || frames === 0) continue;
  const video = path.join(out, `${name}.mp4`);
  const rc = await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '4', '-i', path.join(folder, '%04d.png'), '-vf', 'scale=1280:-2', '-pix_fmt', 'yuv420p', video]);
  console.log(rc === 0 ? `wrote ${video} (${frames} frames at 4 fps)` : `ffmpeg failed for ${name}`);
}
console.log(`Review material in ${out}`);
