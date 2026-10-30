import theme from '../design/design.json';
import { createComponent } from '../design/runtime/components.mjs';
import { createProjectFile } from '../design/runtime/files.mjs';
import { generateCSS } from '../design/runtime/engine.mjs';
import { resolveThemeMode, createColorModePreference } from '../design/runtime/theme-modes.mjs';

const root = document.querySelector('#app');
const modeStyle = document.createElement('style');
document.head.append(modeStyle);
let activeTheme, modeField;
const colorMode = createColorModePreference({ key: 'design-studio.project.' + theme.id + '.color-mode', onChange: applyColorMode });
function applyColorMode() {
  activeTheme = resolveThemeMode(theme, colorMode.value, colorMode.resolved);
  modeStyle.textContent = generateCSS(activeTheme);
  if (modeField) modeField.querySelector('select').value = colorMode.value;
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
  idPrefix: 'project-color-mode', label: 'Farvetilstand', value: colorMode.value, hint: '',
  slots: { control: { tag: 'select', children: [['system', 'System'], ['light', 'Lys'], ['dark', 'Mørk']].map(([value, text]) => ({ tag: 'option', attrs: { value }, text })) } },
});
modeField.querySelector('select').addEventListener('change', event => colorMode.set(event.target.value));
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
