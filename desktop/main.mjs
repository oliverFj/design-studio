import { app, BrowserWindow, dialog, Menu } from 'electron';
import { promises as fs, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDesktopServer, findAdjacentWorkspace, isStudioURL, prepareDesktopRoot, projectArgument, startDesktopServer } from './runtime.mjs';

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
app.setName('Design Studio');
app.setAppUserModelId('dk.design-studio.desktop');
app.enableSandbox();
const smokeFlag = process.argv.indexOf('--desktop-smoke');
if (smokeFlag >= 0) {
  const smokeFolder = process.argv[smokeFlag + 1];
  if (!smokeFolder || !path.isAbsolute(smokeFolder)) throw new Error('Smoke-output skal være en absolut mappe.');
  const smokeProfile = path.join(smokeFolder, 'profile');
  mkdirSync(smokeProfile, { recursive: true });
  app.setPath('userData', smokeProfile);
}

let mainWindow;
let rootDir;
let current;
let quitReady = false;
let switching = Promise.resolve();
const servers = new Set();
const origins = new Set();
let initialProject = null;
try { initialProject = projectArgument(process.argv); } catch (error) { dialog.showErrorBox('Design Studio', error.message); app.exit(1); }

function reportError(error) {
  if (process.argv.includes('--desktop-smoke')) { console.error(error.stack || error.message); return; }
  dialog.showErrorBox('Design Studio', error.message || 'Handlingen kunne ikke gennemføres.');
}
function focusWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function openStudio(projectPath = null) {
  const candidate = await startDesktopServer({ rootDir, projectPath });
  servers.add(candidate.server);
  origins.add(candidate.url);
  const previous = current;
  try {
    await mainWindow.loadURL(candidate.url);
    current = candidate;
    if (previous) {
      await closeDesktopServer(previous.server);
      servers.delete(previous.server);
      origins.delete(previous.url);
    }
    mainWindow.setTitle(projectPath ? 'Design Studio · ' + path.basename(path.dirname(projectPath)) : 'Design Studio');
    focusWindow();
  } catch (error) {
    await closeDesktopServer(candidate.server);
    servers.delete(candidate.server);
    origins.delete(candidate.url);
    // Cancellation keeps the existing file, revision and server intact.
    if (previous && error.code === 'ERR_ABORTED') return;
    throw error;
  }
}

function queueOpen(projectPath = null) {
  switching = switching.catch(() => {}).then(() => openStudio(projectPath));
  return switching;
}
async function pickProject() {
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: 'Åbn et projekts tema', buttonLabel: 'Åbn tema',
    filters: [{ name: 'Design Studio-tema', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (!selected.canceled && selected.filePaths.length === 1) await queueOpen(selected.filePaths[0]);
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Filer', submenu: [
      { label: 'Åbn projekttema…', accelerator: 'CmdOrCtrl+O', click: () => pickProject().catch(reportError) },
      { label: 'Vis temaer i Design Studio', click: () => queueOpen().catch(reportError) },
      { type: 'separator' },
      { label: 'Luk Design Studio', accelerator: 'Alt+F4', click: () => app.quit() },
    ] },
    { label: 'Rediger', submenu: [
      { label: 'Fortryd', role: 'undo' }, { label: 'Gentag', role: 'redo' }, { type: 'separator' },
      { label: 'Klip', role: 'cut' }, { label: 'Kopiér', role: 'copy' }, { label: 'Indsæt', role: 'paste' },
      { label: 'Markér alt', role: 'selectAll' },
    ] },
    { label: 'Vis', submenu: [
      { label: 'Genindlæs', role: 'reload' }, { type: 'separator' },
      { label: 'Faktisk størrelse', role: 'resetZoom' }, { label: 'Zoom ind', role: 'zoomIn' },
      { label: 'Zoom ud', role: 'zoomOut' }, { type: 'separator' }, { label: 'Fuld skærm', role: 'togglefullscreen' },
    ] },
    { label: 'Hjælp', submenu: [
      { label: 'Om Design Studio', click: () => dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'Design Studio', message: 'Design Studio ' + app.getVersion(),
        detail: 'Et fælles komponentbibliotek med udskiftelige temaer.\n\nÅbn et projekts tema via Filer → Åbn projekttema. Gem ændringer opdaterer den valgte fil.\n\nTemaer i denne udgave:\n' + path.join(rootDir, 'packages'),
      }) },
    ] },
  ]));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 960, minWidth: 720, minHeight: 560,
    title: 'Design Studio', backgroundColor: '#f5f7fa', show: false,
    icon: path.join(SOURCE_ROOT, 'desktop', 'icon.png'),
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false, spellcheck: false,
    },
  });
  const contents = mainWindow.webContents;
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  for (const name of ['will-navigate', 'will-redirect']) {
    contents.on(name, (event, url) => { if (!isStudioURL(url, origins)) event.preventDefault(); });
  }
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question', title: 'Ændringer er ikke gemt',
      message: 'Vil du kassere dine ugemte ændringer?',
      buttons: ['Bliv i temaet', 'Kassér ændringer'], defaultId: 0, cancelId: 0,
    });
    if (choice === 1) event.preventDefault();
  });
  const session = contents.session;
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
  session.webRequest.onBeforeRequest((details, callback) => {
    const internal = details.url === 'about:blank' || details.url.startsWith('data:') || details.url.startsWith('blob:');
    callback({ cancel: !internal && !isStudioURL(details.url, origins) });
  });
  session.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ title: 'Gem eksport fra Design Studio',
      defaultPath: path.join(app.getPath('downloads'), path.basename(item.getFilename())) });
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

if (!app.requestSingleInstanceLock({ projectPath: initialProject })) {
  app.quit();
} else {
  app.on('second-instance', (_event, _args, _cwd, data) => {
    focusWindow();
    if (typeof data?.projectPath === 'string') queueOpen(data.projectPath).catch(reportError);
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', event => {
    if (quitReady) return;
    event.preventDefault();
    Promise.allSettled([...servers].map(closeDesktopServer)).finally(() => {
      servers.clear(); origins.clear(); quitReady = true; app.exit(0);
    });
  });
  app.whenReady().then(async () => {
    rootDir = app.isPackaged
      ? await findAdjacentWorkspace(process.env.PORTABLE_EXECUTABLE_FILE || app.getPath('exe'))
        || await prepareDesktopRoot({ sourceRoot: SOURCE_ROOT, dataRoot: path.join(app.getPath('userData'), 'workspace') })
      : SOURCE_ROOT;
    createWindow();
    buildMenu();
    await queueOpen(initialProject);
    // Explicit main-process-only verification hook, with no renderer bridge.
    const smokeIndex = process.argv.indexOf('--desktop-smoke');
    if (smokeIndex >= 0) {
      const output = process.argv[smokeIndex + 1];
      if (!output || !path.isAbsolute(output)) throw new Error('Smoke-output skal være en absolut mappe.');
      await fs.mkdir(output, { recursive: true });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const info = await mainWindow.webContents.executeJavaScript("({ title: document.title, text: document.body.innerText, nodeExposed: typeof require !== 'undefined' || typeof process !== 'undefined', cardCount: document.querySelectorAll('.ds-card').length })");
      const image = await mainWindow.webContents.capturePage();
      await fs.writeFile(path.join(output, 'desktop.png'), image.toPNG());
      await fs.writeFile(path.join(output, 'desktop.json'), JSON.stringify({ ...info, url: current.url, packaged: app.isPackaged, version: app.getVersion() }, null, 2));
      app.quit();
    }
  }).catch(error => { reportError(error); app.quit(); });
}
