// Electron main process for Roseflow PC Mac Training.
// Security model: one BrowserWindow, sandboxed renderer with context isolation
// and no Node integration, a strict CSP, all navigation and window creation
// blocked, and a handful of validated IPC channels. No network access is used.
import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import started from 'electron-squirrel-startup';
import { createProgressStore } from './progress-store.mjs';
import { isApprovedLink } from './links.mjs';
import { validateProgress } from '../shared/progress-schema.mjs';

// Squirrel.Windows runs the app briefly during install/uninstall; exit quietly.
if (started) app.quit();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SMOKE = process.env.ROSEFLOW_SMOKE === '1';

if (process.env.ROSEFLOW_USERDATA) {
  app.setPath('userData', process.env.ROSEFLOW_USERDATA);
}

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ');

const store = { current: null };

function registerIpc() {
  ipcMain.handle('progress:load', () => store.current.load());
  ipcMain.handle('progress:save', (_event, doc) => {
    const validated = validateProgress(doc);
    if (!validated.ok) return { ok: false, error: 'invalid-progress' };
    return store.current.save(validated.value);
  });
  ipcMain.handle('progress:reset', () => store.current.reset());
  ipcMain.handle('links:open', async (_event, url) => {
    if (!isApprovedLink(url)) return { ok: false, error: 'link-not-approved' };
    await shell.openExternal(url);
    return { ok: true };
  });
  ipcMain.handle('app:info', () => ({
    name: 'Roseflow PC Mac Training',
    version: app.getVersion(),
    progressPath: store.current.filePath,
    userData: app.getPath('userData'),
    packaged: app.isPackaged,
  }));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: 'Roseflow PC Mac Training',
    backgroundColor: '#161b22',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      navigateOnDragDrop: false,
      spellcheck: false,
    },
  });

  // New windows are never created in-app; approved links go to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isApprovedLink(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // The renderer never navigates away from the bundled page.
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  win.webContents.on('will-redirect', (event) => event.preventDefault());

  const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
  win.loadFile(indexPath, SMOKE ? { query: { smoke: '1' } } : undefined);

  // The smoke harness keeps the window hidden so automated checks never take focus.
  if (!SMOKE) win.once('ready-to-show', () => win.show());
  return win;
}

app.whenReady().then(async () => {
  store.current = createProgressStore({ dir: app.getPath('userData') });
  registerIpc();

  const ses = session.defaultSession;
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] } });
  });
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  let smoke = null;
  if (SMOKE) {
    const { createSmokeRunner } = await import('./smoke-runner.mjs');
    smoke = createSmokeRunner({ session: ses, store });
  }

  const win = createWindow();

  if (smoke) {
    const code = await smoke.run(win);
    app.exit(code);
  }
});

app.on('window-all-closed', () => app.quit());
