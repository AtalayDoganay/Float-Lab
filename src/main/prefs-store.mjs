// Preferences storage for the main process: one small JSON file beside
// progress.json, written atomically. Unlike progress, an unreadable file is
// not quarantined: the defaults are used and the problem is reported, and
// the next save replaces it.
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_PREFS, validatePrefs } from '../shared/prefs-schema.mjs';

export const PREFS_FILE = 'preferences.json';

const describe = (error) => (error && error.code ? `${error.code}: ${error.message}` : String(error && error.message ? error.message : error));

export function createPrefsStore({ dir }) {
  const filePath = path.join(dir, PREFS_FILE);

  async function load() {
    let text;
    try {
      text = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return { ok: true, value: DEFAULT_PREFS };
      return { ok: true, value: DEFAULT_PREFS, recovered: describe(error) };
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: true, value: DEFAULT_PREFS, recovered: 'invalid-json' };
    }
    const v = validatePrefs(parsed);
    return v.ok ? { ok: true, value: v.value } : { ok: true, value: DEFAULT_PREFS, recovered: v.error };
  }

  // Saves run one after another (a slider can fire many in a row); each one
  // writes its own temporary file, so two never race for the same name.
  let queue = Promise.resolve();
  let seq = 0;
  function save(prefs) {
    const run = queue.then(() => writePrefs(prefs));
    queue = run.catch(() => {});
    return run;
  }

  async function writePrefs(prefs) {
    const v = validatePrefs(prefs);
    const value = v.ok ? v.value : DEFAULT_PREFS;
    seq += 1;
    const tempPath = `${filePath}.${process.pid}.${seq}.tmp`;
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8');
      await fs.rename(tempPath, filePath);
      return { ok: true, value };
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      return { ok: false, error: describe(error) };
    }
  }

  return { filePath, load, save };
}
