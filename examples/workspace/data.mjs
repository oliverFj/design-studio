export const PROJECT_STATUSES = Object.freeze({ active: 'I gang', review: 'Til godkendelse', completed: 'Afsluttet' });

export function createWorkspaceState() {
  return {
    query: '', filter: 'active', selected: 'kyst', tab: 'overview', drafts: {}, panel: { open: true, width: 420 },
    projects: [
      { id: 'kyst', title: 'Kyst — en ny identitet', client: 'Kyst Kulturhus', owner: 'Freja Madsen', due: '2026-11-06', status: 'review', notifications: true,
        description: 'En samlet visuel identitet for kulturhuset ved vandet. Vi samler skiltning, program og digitale flader om ét genkendeligt udtryk.',
        tasks: [{ id: 'retning', title: 'Afstem den visuelle retning med teamet', done: true }, { id: 'skilte', title: 'Gennemgå skilte og vejvisning på tværs af bygningerne', done: true }, { id: 'præsentation', title: 'Send præsentationen til kulturhusets projektgruppe', done: false }, { id: 'pakke', title: 'Klargør de endelige originalfiler', done: false }],
        activity: ['Den visuelle retning er godkendt internt.', 'Anden gennemgang af skiltningen er afsluttet.'] },
      { id: 'atlas', title: 'Atlas — et mere overskueligt bibliotek', client: 'Atlas Forlag', owner: 'Emil Sørensen', due: '2026-11-12', status: 'active', notifications: false,
        description: 'Et digitalt bibliotek, hvor redaktørerne hurtigt kan finde manuskripter, rettigheder og den nyeste version af en udgivelse.',
        tasks: [{ id: 'struktur', title: 'Kortlæg indhold og søgebehov', done: true }, { id: 'prototype', title: 'Afprøv prototypen med to redaktører', done: false }, { id: 'komponenter', title: 'Aflevér komponenter til udvikling', done: false }], activity: ['Indholdsstrukturen er klar til afprøvning.'] },
      { id: 'fælles', title: 'En fælles indgang til rådgivning, arrangementer og lokale fællesskaber', client: 'Fælleshuset Nord', owner: 'Asta Holm', due: '2026-11-19', status: 'active', notifications: true,
        description: 'Tre tilbud skal opleves som én sammenhængende service. Projektet omfatter både en ny navigation og letforståelige tekster til borgere, der besøger huset for første gang.',
        tasks: [{ id: 'interview', title: 'Saml observationer fra besøg og interviews', done: true }, { id: 'navigation', title: 'Test de lange menupunkter på en lille skærm', done: false }, { id: 'tekster', title: 'Gennemgå tekster med fagpersonerne', done: false }], activity: ['Indsigter fra de første interviews er samlet.'] },
      { id: 'gro', title: 'Gro — emballage med omtanke', client: 'Gro Gartneri', owner: 'Freja Madsen', due: '2026-11-23', status: 'active', notifications: true,
        description: 'Et enkelt emballagesystem til sæsonens planter med plads til dyrkningsråd, oprindelse og tydelig sortering.',
        tasks: [{ id: 'materialer', title: 'Bestil materialeprøver', done: false }, { id: 'etiketter', title: 'Tilpas etiketter til tre størrelser', done: false }, { id: 'tryk', title: 'Godkend første trykprøve', done: false }], activity: ['Brief og leveranceplan er aftalt.'] },
      { id: 'spor', title: 'Spor — sæsonprogram', client: 'Spor Scene', owner: 'Asta Holm', due: '2026-10-22', status: 'completed', notifications: false,
        description: 'Program, plakater og digitale formater til efterårets forestillinger. Originaler og vejledning er afleveret til scenens kommunikationsteam.',
        tasks: [{ id: 'program', title: 'Færdiggør programmet', done: true }, { id: 'levering', title: 'Aflevér trykklare filer og digitale formater', done: true }], activity: ['Alle leverancer er afleveret.', 'Projektet er afsluttet.'] },
      { id: 'lys', title: 'Lys i byen', client: 'Bylivssekretariatet', owner: 'Emil Sørensen', due: '2026-10-16', status: 'completed', notifications: false,
        description: 'En lille kampagne, som inviterer til at opdage byens aftener til fods. Kort, invitationer og skiltning er sat i produktion.',
        tasks: [{ id: 'kort', title: 'Godkend kort og ruter', done: true }, { id: 'produktion', title: 'Send materialerne i produktion', done: true }], activity: ['Materialerne er sendt i produktion.'] },
    ],
  };
}

const text = (value, max = 300) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;

/** The file stores project content; search, focus and unfinished form drafts stay local. */
export function validateWorkspaceData(data) {
  const errors = [];
  if (!data || !Array.isArray(data.projects) || data.projects.length > 100) return { valid: false, errors: ['Arbejdsrummet skal indeholde højst 100 projekter.'] };
  const ids = new Set();
  for (const project of data.projects) {
    if (!project || !text(project.id, 80) || !/^[\p{L}\p{N}_-]+$/u.test(project.id) || ids.has(project.id)) { errors.push('Projekt-id’er skal være gyldige og entydige.'); continue; }
    ids.add(project.id);
    if (!text(project.title) || !text(project.client) || !text(project.owner) || !text(project.description, 4000)) errors.push('Projekter skal have navn, kunde, ansvarlig og beskrivelse.');
    if (!Object.hasOwn(PROJECT_STATUSES, project.status) || !validDate(project.due) || typeof project.notifications !== 'boolean') errors.push('Projektstatus, afleveringsdato eller beskedvalg er ugyldigt.');
    if (!Array.isArray(project.tasks) || project.tasks.length > 100 || project.tasks.some(task => !task || !text(task.id, 80) || !/^[\p{L}\p{N}_-]+$/u.test(task.id) || !text(task.title, 500) || typeof task.done !== 'boolean') || new Set(project.tasks?.map(task => task?.id)).size !== project.tasks?.length) errors.push('Projektets opgaver skal have entydige id’er, tekst og en gyldig status.');
    if (!Array.isArray(project.activity) || project.activity.length > 50 || project.activity.some(item => !text(item, 600))) errors.push('Projektets aktivitet er ugyldig.');
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function workspaceData(state) { return { projects: structuredClone(state.projects) }; }

export function workspaceHasDrafts(state) {
  return state.projects.some(project => Object.hasOwn(state.drafts, project.id)
    && Object.entries(projectDraft(project)).some(([key, value]) => state.drafts[project.id][key] !== value));
}

export function projectDraft(project) {
  return Object.fromEntries(['title', 'client', 'owner', 'due', 'status', 'description', 'notifications'].map(key => [key, project[key]]));
}

export function validateProjectDraft(draft) {
  const errors = {};
  for (const [key, label] of [['title', 'et projektnavn'], ['client', 'en kunde'], ['owner', 'en ansvarlig'], ['description', 'en beskrivelse']]) {
    const max = key === 'description' ? 4000 : 300;
    if (typeof draft[key] !== 'string' || !draft[key].trim()) errors[key] = 'Angiv ' + label + '.';
    else if (draft[key].length > max) errors[key] = 'Brug højst ' + max + ' tegn.';
  }
  if (!validDate(draft.due)) errors.due = 'Angiv en gyldig afleveringsdato.';
  if (!Object.hasOwn(PROJECT_STATUSES, draft.status)) errors.status = 'Vælg en projektstatus.';
  return errors;
}
