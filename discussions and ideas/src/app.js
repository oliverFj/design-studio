const themeSelect = document.querySelector('#theme-select');
const sizeSelect = document.querySelector('#size-select');
const themeStyle = document.querySelector('#theme-css');
const feedback = document.querySelector('#feedback');
let feedbackTimer;
function announce(message) {
  feedback.textContent = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 4500);
}
themeSelect.addEventListener('change', () => {
  document.documentElement.classList.add('changing-theme');
  themeStyle.textContent = themeData.find(theme => theme.id === themeSelect.value).css;
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('changing-theme')));
  announce(themeSelect.selectedOptions[0].textContent + ' vises i alle komponenteksempler.');
});
sizeSelect.addEventListener('change', () => {
  document.querySelector('#family-demo').dataset.size = sizeSelect.value;
  announce('Knapfamilien vises i ' + sizeSelect.selectedOptions[0].textContent + '.');
});

const kinds = [['primary', 'Primary'], ['secondary', 'Secondary'], ['tertiary', 'Tertiary'], ['ghost', 'Ghost']];
for (const [kind, label] of kinds) {
  const row = document.createElement('tr'), heading = document.createElement('th');
  heading.scope = 'row'; heading.textContent = label; row.append(heading);
  for (const state of ['normal','hover','active','focus','disabled','loading']) {
    const cell = document.createElement('td'), button = document.createElement('button');
    button.type = 'button'; button.className = 'p-btn'; button.dataset.kind = kind; button.dataset.state = state;
    button.textContent = 'Gem'; button.setAttribute('aria-label', label + ' · ' + ({normal:'normal',hover:'hover vist',active:'tryk vist',focus:'fokus vist',disabled:'deaktiveret',loading:'arbejder'})[state]);
    if (state === 'disabled') button.disabled = true;
    if (state === 'loading') {
      button.disabled = true; button.setAttribute('aria-busy', 'true');
      const spinner = document.createElement('span'); spinner.className = 'spinner'; spinner.setAttribute('aria-hidden','true'); button.append(spinner);
    }
    button.dataset.feedback = label + ' · vist tilstand: ' + state + '. Knapperne i tabellen er prøveeksempler.';
    cell.append(button); row.append(cell);
  }
  document.querySelector('#state-matrix').append(row);
}

const foldedStates = document.querySelector('.fold-states .table-scroll');
const stateTableCopy = document.querySelector('.state-table').cloneNode(true);
stateTableCopy.querySelector('tbody').removeAttribute('id');
foldedStates.append(stateTableCopy);
const componentCards = [...document.querySelectorAll('.fold-card')];
function foldCard(card, open) {
  const toggle = card.querySelector('.fold-toggle');
  toggle.setAttribute('aria-expanded', String(open));
  card.classList.toggle('is-open', open);
  card.querySelector('.fold-action').textContent = open ? 'Fold ind' : 'Vis varianter';
  card.querySelector('.fold-preview').hidden = open;
  card.querySelector('.fold-panel').hidden = !open;
}
for (const card of componentCards) {
  const toggle = card.querySelector('.fold-toggle');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    for (const other of componentCards) foldCard(other, other === card && open);
    // Closing a preceding card can move the active heading above the viewport.
    const bounds = toggle.getBoundingClientRect();
    if (bounds.top < 16 || bounds.bottom > innerHeight - 16) toggle.scrollIntoView({ block: 'nearest' });
  });
  card.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault(); foldCard(card, false); toggle.focus();
    }
  });
  for (const viewButton of card.querySelectorAll('[data-fold-view]')) {
    viewButton.addEventListener('click', () => {
      const states = viewButton.dataset.foldView === 'states';
      for (const other of card.querySelectorAll('[data-fold-view]')) other.setAttribute('aria-pressed', String(other === viewButton));
      card.querySelector('.fold-variants').hidden = states;
      const statePanel = card.querySelector('.fold-states');
      if (statePanel) statePanel.hidden = !states;
    });
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-feedback]');
  if (button) announce(button.dataset.feedback);
});

const before = document.querySelector('#show-before'), after = document.querySelector('#show-after');
function compare(showOld) {
  document.querySelector('#old-hero').hidden = !showOld;
  document.querySelector('#new-hero').hidden = showOld;
  before.setAttribute('aria-pressed', String(showOld)); after.setAttribute('aria-pressed', String(!showOld));
  document.querySelector('#hero-caption').textContent = showOld
    ? 'Nuværende · de faktiske linkvarianter fra biblioteket, inklusive understregning ved hover.'
    : 'Forslag · tydelig primary og en roligere, indrammet tertiary. Begge er links.';
}
before.addEventListener('click', () => compare(true)); after.addEventListener('click', () => compare(false));

const nameField = document.querySelector('#project-title'), save = document.querySelector('#save-demo'), reset = document.querySelector('#reset-demo');
const saveStatus = document.querySelector('#save-status');
let savedName = nameField.value;
reset.addEventListener('click', () => { nameField.value = savedName; saveStatus.textContent = 'Den senest gemte eksempelværdi er gendannet.'; });
save.addEventListener('click', () => {
  if (!nameField.value.trim()) { saveStatus.textContent = 'Angiv et projektnavn før du gemmer.'; nameField.setAttribute('aria-invalid','true'); nameField.focus(); return; }
  nameField.removeAttribute('aria-invalid');
  const value = nameField.value.trim();
  save.disabled = true; reset.disabled = true; nameField.readOnly = true;
  save.setAttribute('aria-busy','true'); save.querySelector('.spinner').hidden = false;
  saveStatus.textContent = 'Gemmer eksempelværdien…';
  setTimeout(() => {
    savedName = value; nameField.value = value;
    save.disabled = false; reset.disabled = false; nameField.readOnly = false;
    save.removeAttribute('aria-busy'); save.querySelector('.spinner').hidden = true;
    saveStatus.textContent = '“' + savedName + '” er gemt i eksemplet. Ingen fil er skrevet.';
  }, 1100);
});
nameField.setAttribute('aria-describedby','save-status');
nameField.addEventListener('input', () => { nameField.removeAttribute('aria-invalid'); });

const pin = document.querySelector('#pin-demo');
pin.addEventListener('click', () => {
  const pressed = pin.getAttribute('aria-pressed') !== 'true';
  pin.setAttribute('aria-pressed',String(pressed));
  announce(pressed ? 'Panelet er fastgjort i eksemplet.' : 'Panelet er frigjort i eksemplet.');
});
const dialog = document.querySelector('#image-dialog');
let imageOpener;
document.querySelectorAll('[data-open-image]').forEach(button => {
  button.setAttribute('aria-haspopup','dialog');
  button.addEventListener('click', () => {
    imageOpener = button; document.querySelector('#image-title').textContent = button.dataset.openImage;
    dialog.querySelector('.dialog-art').className = 'dialog-art mini-art ' + (button.dataset.openImage === 'Bue' ? 'one' : 'two');
    dialog.showModal();
  });
});
dialog.querySelector('button').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => imageOpener?.focus());
