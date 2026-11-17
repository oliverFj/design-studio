import { findGuide } from './guides.mjs';

const taskSections = Object.freeze({
  'small-fix': 'lille-produktrettelse',
  'new-product': 'nyt-produkt',
  'new-screen': 'ny-skærm',
  theme: 'tema-og-design',
  interaction: 'interaktion',
  'project-files': 'projektfiler',
  'shared-system': 'fælles-bibliotek-og-værktøjer',
  'shared-pattern': 'fælles-mønstre',
  graphics: 'grafik-og-animation',
  delivery: 'levering',
  website: 'hjemmeside',
  'product-media': 'produktmedier',
});

export const ONBOARDING_TASKS = Object.freeze(Object.keys(taskSections));

const projectSections = {
  stade: 'stade',
  'offline-product': 'offlineprodukt',
  'existing-product': 'eksisterende-produkt',
  'unlinked-product': 'produkt-uden-designtilknytning',
};

function onboardingSection(guide, section) {
  const entry = guide.sections.find(item => item.section === section);
  if (!entry) throw new Error(`Onboardingafsnittet mangler: ${guide.source}#${section}`);
  return entry;
}

export function selectOnboarding(projectId, config, tasks, guides) {
  let type = 'unlinked-product';
  if (projectId === 'stade') type = 'stade';
  else if (config?.offline === true) type = 'offline-product';
  else if (config) type = 'existing-product';

  const guide = findGuide(guides, 'agent-onboarding');
  const sections = [projectSections[type]];
  for (const task of new Set(tasks)) {
    if (!Object.hasOwn(taskSections, task)) throw new Error('Ukendt opgavetype.');
    sections.push(taskSections[task]);
  }

  const reading = new Map();
  const guidance = sections.map(section => {
    const { title, line, content } = onboardingSection(guide, section);
    for (const [, file, anchor] of content.matchAll(/\]\(([A-Z-]+\.md)#([^\s)]+)\)/g)) {
      const id = file.slice(0, -3).toLowerCase();
      const target = findGuide(guides, id);
      const entry = onboardingSection(target, anchor);
      reading.set(`${id}#${anchor}`, { id, section: anchor, title: entry.title, source: target.source, line: entry.line });
    }
    return { title, section, line, text: content.slice(content.indexOf('\n') + 1).trim() };
  });

  return {
    project: { id: projectId, type, linked: Boolean(config) },
    source: guide.source,
    guidance,
    reading: [...reading.values()],
  };
}
