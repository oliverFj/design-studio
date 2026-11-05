import themes from './bundled-themes.mjs';
import { generateCSS } from '../../core/engine.mjs';
import { createComponentFactory } from '../../core/components.mjs';
import { createProjectFile } from '../../core/files.mjs';
import { resolveThemeMode, resolveThemeModeId, themeModeOptions, hasNamedThemeModes, createColorModePreference } from '../../core/theme-modes.mjs';
import { mountWorkspace } from './app.mjs';
import { createWorkspaceState, validateWorkspaceData, workspaceData, workspaceHasDrafts } from './data.mjs';

const root = document.querySelector('#app'), controls = document.querySelector('#example-controls');
const style = document.querySelector('#theme-styles');
let themeKey = 'fjordside', state = createWorkspaceState(), mounted, dirty = false;
const colorMode = createColorModePreference({ key: 'design-studio.workspace.color-mode', onChange: applyColorMode });
const projectFile = createProjectFile({ format: 'design-studio.workspace', version: 1, validate: validateWorkspaceData });
const announce = message => { controls.querySelector('#example-message').textContent = message; };

const namedModes=new Map();
const sourceTheme=()=>themes.find(item=>item.key===themeKey).package;
const modeChoice=()=>hasNamedThemeModes(sourceTheme())?namedModes.get(themeKey)??sourceTheme().defaultMode:colorMode.value;
function resolvedTheme() { return resolveThemeMode(sourceTheme(), modeChoice(), colorMode.resolved); }
function applyColorMode() {
  style.textContent = generateCSS(resolvedTheme());
  const picker = controls.querySelector('#example-color-mode-control');
  if (picker) picker.value = modeChoice();
  const selected=resolveThemeModeId(sourceTheme(),modeChoice(),colorMode.resolved);
  document.documentElement.style.colorScheme=sourceTheme().modes?.[selected]?.colorScheme??(sourceTheme().modes?selected:'normal');
}

function render({ preserveScroll = true } = {}) {
  const positions = ['.ds-app-content', '.ds-app-navigation', '.ds-panel-layout', '.ds-panel-content', '.ds-panel-side', '#workspace-tab-panel', '.ds-form-fields'].map(selector => {
    const node = preserveScroll && root.querySelector(selector);
    return { selector, top: node?.scrollTop || 0, left: node?.scrollLeft || 0 };
  });
  const theme = resolvedTheme();
  const c = createComponentFactory(theme);
  style.textContent = generateCSS(theme);
  const title = document.createElement('div'); title.className = 'example-title';
  title.append(c('heading', { variant: 'section', slots: { root: { tag: 'h2', text: 'Design Studio i brug' } } }), c('text', { variant: 'small', text: 'Samme arbejdsrum. Otte udtryk.' }));
  const actions = document.createElement('div'); actions.className = 'example-actions';
  const themeField = c('field', { idPrefix: 'example-theme', label: 'Tema', value: themeKey, hint: '', controlVariant: 'desktop', slots: { control: { tag: 'select', children: themes.map(item => ({ tag: 'option', attrs: { value: item.key }, text: item.package.name })) } } }); themeField.className += ' example-theme';
  themeField.querySelector('select').addEventListener('change', event => { themeKey = event.target.value; render(); controls.querySelector('select').focus(); });
  const modeField = c('field', { idPrefix: 'example-color-mode', label: 'Farvetilstand', value: modeChoice(), hint: '', controlVariant: 'desktop', slots: { control: { tag: 'select', children: themeModeOptions(sourceTheme()).map(({value,label}) => ({ tag: 'option', attrs: { value }, text:label })) } } }); modeField.className += ' example-theme';
  modeField.querySelector('select').disabled=!sourceTheme().modes;
  modeField.querySelector('select').addEventListener('change', event => { if(hasNamedThemeModes(sourceTheme())){namedModes.set(themeKey,event.target.value);applyColorMode();}else colorMode.set(event.target.value); announce('Farvetilstanden er skiftet. Dine kladder er bevaret.'); });
  const open = c('button', { text: 'Åbn arbejdsrum', variant: 'tertiary', size:'small' });
  const save = c('button', { text: 'Hent arbejdsrum', variant: 'tertiary', size:'small' });
  const message = c('text', { text: 'Prøv et tema, vælg et projekt, eller arbejd videre med eksemplet.', variant: 'small', attrs: { id: 'example-message', role: 'status', 'aria-live': 'polite' } }); message.className += ' example-message';
  actions.append(themeField, modeField, open, save); controls.replaceChildren(title, actions, message);
  applyColorMode();
  mounted?.destroy(); mounted = mountWorkspace(theme, { state, onChange: () => { dirty = true; } }); root.replaceChildren(mounted.element);
  for (const { selector, top, left } of positions) {
    const node = root.querySelector(selector); if (node) { node.scrollTop = top; node.scrollLeft = left; }
  }
  open.addEventListener('click', async () => {
    try {
      const result = await projectFile.open();
      if (!result || ((dirty || workspaceHasDrafts(state)) && !confirm('Erstat arbejdsrummet og dets ændringer med indholdet fra filen?'))) return;
      state = createWorkspaceState(); state.projects = result.data.projects; state.filter = 'all'; state.selected = state.projects[0]?.id ?? null; dirty = false;
      render({ preserveScroll: false }); controls.querySelector('select').focus(); announce('Arbejdsrummet er åbnet fra ' + result.name + '.');
    } catch (error) { announce(error.message); }
  });
  save.addEventListener('click', () => {
    if (workspaceHasDrafts(state)) {
      const project = state.projects.find(item => Object.hasOwn(state.drafts, item.id) && Object.entries(state.drafts[item.id]).some(([key, value]) => item[key] !== value));
      state.selected = project.id; state.tab = 'settings'; state.filter = 'all'; state.query = ''; mounted.panels.setOpen(true); mounted.refresh();
      mounted.element.querySelector('[data-action="save-project"]')?.focus(); announce('Gem eller fortryd først ændringerne i projektets indstillinger. Hent derefter arbejdsrummet.'); return;
    }
    try { projectFile.save('arbejdsrum.json', workspaceData(state)); dirty = false; announce('Arbejdsrummet er sendt til browserens downloads. Den oprindelige fil overskrives ikke automatisk.'); }
    catch (error) { announce(error.message); }
  });
}
window.addEventListener('beforeunload', event => { if (dirty || workspaceHasDrafts(state)) { event.preventDefault(); event.returnValue = ''; } });
render();
