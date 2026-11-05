import theme from '../design/design.json';
import { createComponent } from '../design/runtime/components.mjs';
import { createProjectFile } from '../design/runtime/files.mjs';
import { generateCSS } from '../design/runtime/engine.mjs';
import { resolveThemeMode, resolveThemeModeId, themeModeOptions, hasNamedThemeModes, createColorModePreference } from '../design/runtime/theme-modes.mjs';

const root = document.querySelector('#app');
const modeStyle = document.createElement('style');
document.head.append(modeStyle);
let activeTheme, modeField;
let namedMode=theme.defaultMode;
const modeChoice=()=>hasNamedThemeModes(theme)?namedMode:colorMode.value;
const colorMode = createColorModePreference({ key: 'design-studio.project.' + theme.id + '.color-mode', onChange: applyColorMode });
function applyColorMode() {
  activeTheme = resolveThemeMode(theme, modeChoice(), colorMode.resolved);
  modeStyle.textContent = generateCSS(activeTheme);
  if (modeField) modeField.querySelector('select').value = modeChoice();
  const selected=resolveThemeModeId(theme,modeChoice(),colorMode.resolved);
  document.documentElement.style.colorScheme=theme.modes?.[selected]?.colorScheme??(theme.modes?selected:'normal');
}
applyColorMode();
const heading = document.createElement('h1');
heading.textContent = document.title;
const status = document.createElement('p');
status.setAttribute('role', 'status');
status.textContent = 'Appen er klar.';
const card = createComponent(activeTheme, 'card', {
  idPrefix: 'starter',
  slots: {
    header: { tag: 'h2', text: 'Dit projekt er klar' },
    body: { tag: 'p', text: 'Her kan du bygge videre på dit eget indhold og dine funktioner.' },
    footer: [
      { component: 'button', options: { text: 'Prøv knappen', attrs: { id: 'starter-action' } } },
      { component: 'button', options: { text: 'Åbn projekt', attrs: { id: 'project-open' } } },
      { component: 'button', options: { text: 'Gem projekt', attrs: { id: 'project-save' } } },
    ],
  },
});
modeField = createComponent(activeTheme, 'field', {
  idPrefix: 'project-color-mode', label: 'Farvetilstand', value: modeChoice(), hint: '',
  slots: { control: { tag: 'select', children: themeModeOptions(theme).map(({value,label}) => ({ tag: 'option', attrs: { value }, text:label })) } },
});
modeField.querySelector('select').disabled=!theme.modes;
modeField.querySelector('select').addEventListener('change', event => {if(hasNamedThemeModes(theme)){namedMode=event.target.value;applyColorMode();}else colorMode.set(event.target.value);});
root.append(heading, modeField, card, status);
let clicks = 0;
let dirty = false;
const projectFile = createProjectFile({
  format: theme.id + '.project', version: 1,
  validate: data => ({ valid: !!data && Number.isSafeInteger(data.clicks) && data.clicks >= 0, errors: ['Projektets tæller skal være et positivt heltal eller nul.'] }),
});
card.querySelector('#starter-action').addEventListener('click', () => {
  dirty = true;
  status.textContent = 'Knappen er aktiveret ' + ++clicks + (clicks === 1 ? ' gang.' : ' gange.');
});
card.querySelector('#project-open').addEventListener('click', async () => {
  try {
    const opened = await projectFile.open();
    if (!opened || (dirty && !confirm('Vil du kassere de ændringer, der ikke er gemt?'))) return;
    clicks = opened.data.clicks; dirty = false;
    status.textContent = 'Projektet er åbnet. Tæller: ' + clicks + '.';
  } catch (error) { status.textContent = error.message; }
});
card.querySelector('#project-save').addEventListener('click', () => {
  try {
    projectFile.save(theme.id + '.project.json', { clicks }); dirty = false;
    status.textContent = 'Projektfilen er sendt til browserens downloads. Originalfilen overskrives ikke automatisk.';
  } catch (error) { status.textContent = error.message; }
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
