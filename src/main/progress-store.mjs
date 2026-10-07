// Local, versioned progress storage for the main process. One JSON file in the
// app's user-data directory, written atomically (temp file + rename). Unreadable
// or incompatible files are moved aside, never deleted, and the caller is told.
import fs from 'node:fs/promises';
import path from 'node:path';
import { validateProgress } from '../shared/progress-schema.mjs';

export const PROGRESS_FILE = 'progress.json';

function describeError(error) {
  return error && error.code ? `${error.code}: ${error.message}` : String(error && error.message ? error.message : error);
}

export function createProgressStore({ dir, now = () => new Date() }) {
  const filePath = path.join(dir, PROGRESS_FILE);

  async function quarantine(reason) {
    const stamp = now().toISOString().replace(/[:.]/g, '-');
    const quarantinedPath = path.join(dir, `progress.invalid-${stamp}.json`);
    await fs.rename(filePath, quarantinedPath);
    return { ok: true, value: null, recovered: { reason, quarantinedPath } };
  }

  async function load() {
    let text;
    try {
      text = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return { ok: true, value: null };
      return { ok: false, error: describeError(error) };
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return quarantine('invalid-json');
    }
    const validated = validateProgress(parsed);
    if (!validated.ok) return quarantine(validated.error);
    return { ok: true, value: validated.value };
  }

  async function save(doc) {
    const validated = validateProgress(doc);
    if (!validated.ok) return { ok: false, error: 'invalid-progress' };
    const savedAt = now().toISOString();
    const value = { ...validated.value, savedAt };
    const tempPath = `${filePath}.${process.pid}.tmp`;
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8');
      await fs.rename(tempPath, filePath);
      return { ok: true, savedAt };
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      return { ok: false, error: describeError(error) };
    }
  }

  async function reset() {
    try {
      await fs.rm(filePath, { force: true });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: describeError(error) };
    }
  }

  return { filePath, load, save, reset };
}
