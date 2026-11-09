import { renderComponent } from '../core/components.mjs';
import { downloadFile } from '../core/files.mjs';
import { TOOL_PACKAGES, EXPERIENCE_STATUSES, searchExperiences } from '../collaboration/catalog.mjs';
import experiences from '../collaboration/experiences.json' with { type: 'json' };

const draft = { query: '', scope: '', status: '', open: new Set(), packages: new Set() };
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const evidenceLabels = { 'source-inspection': 'Kildegennemgang', tested: 'Afprøvet', 'user-report': 'Brugerberetning' };
const selection = () => searchExperiences(experiences, { query: draft.query, scope: draft.scope || undefined, status: draft.status || undefined });
const paragraph = text => ({ tag: 'p', text });

function experienceMarkup(theme, entry) {
  const sourceText = source => `${source.project} · ${source.file}${source.line ? ':' + source.line : ''} — ${source.note}${source.revision ? ' Kildegrundlag: ' + source.revision + '.' : ''}${source.sha256 ? ' SHA-256: ' + source.sha256 : ''}`;
  return renderComponent(theme, 'card', {
    attrs: { 'data-experience-id': entry.id },
    slots: {
      header: { tag: 'h3', text: entry.title },
      body: [
        paragraph(entry.summary),
        { component: 'accordion', options: { idPrefix: 'experience-' + entry.id, items: [{
          id: entry.id, label: 'Læs erfaring og kilder', open: draft.open.has(entry.id), content: [
            { tag: 'h4', text: 'Problem' }, paragraph(entry.problem),
            { tag: 'h4', text: 'Fremgangsmåde' }, paragraph(entry.approach),
            { tag: 'h4', text: evidenceLabels[entry.verification.kind] }, paragraph(entry.verification.summary),
            { tag: 'h4', text: 'Gælder med disse forbehold' },
            { tag: 'ul', children: entry.limits.map(text => ({ tag: 'li', text })) },
            { tag: 'h4', text: 'Kilder' },
            { tag: 'ul', children: entry.sources.map(source => ({ tag: 'li', text: sourceText(source) })) },
            paragraph(`Opdateret ${entry.updatedAt} · ${entry.id}`),
          ],
        }] } },
      ],
      footer: [
        { component: 'badge', options: { text: EXPERIENCE_STATUSES[entry.status], variant: entry.status === 'reviewed' ? 'accent' : 'neutral' } },
        { tag: 'span', text: entry.scope === 'shared' ? 'Fælles erfaring' : 'Produktlokal · ' + entry.project },
        { tag: 'span', text: evidenceLabels[entry.verification.kind] },
      ],
    },
  });
}

function results(theme) {
  const entries = selection();
  return entries.length ? entries.map(entry => experienceMarkup(theme, entry)).join('') : renderComponent(theme, 'empty-state', {
    slots: { title: 'Ingen erfaringer passer til søgningen', body: 'Prøv et andet ord eller vælg et bredere omfang. Biblioteket viser kun de erfaringer, der følger med denne udgave.' },
  });
}

export function renderCollaborationLibrary(theme) {
  return `<div class="collaboration-library">
    <section class="connections-section" aria-labelledby="experience-library-title">
      <div class="connections-section-heading"><span class="connections-number" aria-hidden="true">01</span><h2 id="experience-library-title">Erfaringer, der kan gives videre</h2></div>
      <p class="connections-copy">Find en kendt fejl, før arbejdet begynder forfra. Hver erfaring viser, hvor den gælder, hvad den bygger på, og hvad der stadig skal efterprøves. Gennemgået betyder, at posten er kontrolleret mod sine kilder; den konkrete kontrol står på posten.</p>
      <p class="connections-copy">Når agenten henter en erfaring gennem MCP, sammenlignes kildernes aktuelle filer automatisk med de gemte kontrolsummer. Svaret skelner mellem uændret, ændret, utilgængelig og uden sammenligningsgrundlag. En ændret kilde kræver en ny gennemgang; erfaringen bliver ikke automatisk forkert eller omskrevet.</p>
      <form class="experience-filters" role="search" aria-label="Søg i erfaringer">
        <label class="studio-field" for="experience-query">Søg i erfaringer<input id="experience-query" class="studio-input" type="search" placeholder="Fx GPU, materialer eller hukommelse" value="${escape(draft.query)}"></label>
        <label class="studio-field" for="experience-scope">Omfang<select id="experience-scope" class="studio-input">${[['', 'Alle områder'], ['shared', 'Fælles'], ['project', 'Produktlokale']].map(([value, label]) => `<option value="${value}"${value === draft.scope ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
        <label class="studio-field" for="experience-status">Status<select id="experience-status" class="studio-input">${[['', 'Aktuelle'], ['reviewed', 'Gennemgået'], ['draft', 'Kladde'], ['retired', 'Udgået']].map(([value, label]) => `<option value="${value}"${value === draft.status ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
      </form>
      <div class="experience-result-bar"><p id="experience-count" role="status">${selection().length} af ${experiences.length} erfaringer</p>${renderComponent(theme, 'button', { text: 'Hent erfaringer som JSON', variant: 'tertiary', attrs: { id: 'experience-export' } })}</div>
      <div class="experience-results">${results(theme)}</div>
      <p class="connections-note">Dette er den samling, der fulgte med seneste build. Nye forslag gemmes af MCP-tjenesten som kladder og kommer først med her efter gennemgang og et nyt build. JSON-downloaden indeholder hele den viste udgaves samling, også poster som er skjult af filtre.</p>
    </section>

    <section class="connections-section" aria-labelledby="collaboration-packages-title">
      <div class="connections-section-heading"><span class="connections-number" aria-hidden="true">02</span><h2 id="collaboration-packages-title">Værktøjspakker til agenter</h2></div>
      <p class="connections-copy">Pakkerne samler beslægtede værktøjer, ligesom et plugin samler et bestemt arbejdsområde. De er implementeret i én lokal MCP-tjeneste. En forbindelse skal tilføjes i agentappen, før en agent kan kalde dem derfra.</p>
      <div class="collaboration-packages">${TOOL_PACKAGES.map(pack => renderComponent(theme, 'card', {
        attrs: { 'data-tool-package-id': pack.id },
        slots: {
          header: { tag: 'h3', text: pack.name },
          body: [paragraph(pack.description), { component: 'accordion', options: { idPrefix: 'tool-package-' + pack.id, items: [{
            id: pack.id, label: `Se ${pack.tools.length} værktøjer`, open: draft.packages.has(pack.id), content: pack.tools.flatMap(tool => [
              { tag: 'h4', text: tool.title }, paragraph(tool.description),
              paragraph(`${tool.name} · ${tool.readOnly ? 'Læser og undersøger' : 'Opretter en ny kladde'}`),
            ]),
          }] } }],
          footer: { component: 'badge', options: { text: 'Implementeret · Lokal MCP', variant: 'accent' } },
        },
      })).join('')}</div>
      <p class="connections-note">Pakkerne er logiske samlinger, ikke separat installerede plugins. Denne side måler ikke, om din agentapp har forbindelse. Projekter skal være tilføjet på tjenestens tilladelsesliste; forslag kan kun oprette nye erfaringskladder.</p>
    </section>

    <section class="connections-section" aria-labelledby="collaboration-install-title">
      <h2 id="collaboration-install-title" class="connections-section-title">Tag Stade med ind i et projekt</h2>
      <p class="connections-copy">Bed agenten: »Tilknyt dette projekt til Stade og installér de relevante skills.« Den fælles skill hjælper med bibliotek, erfaringer og kildekontrol. FormLabs materialeskill kan tilvælges, når opgaven kræver den.</p>
      <p class="connections-copy">Installationen bevarer eksisterende indstillinger og projekttilknytninger. Den kan gentages for at opdatere administrerede skills; lokale ændringer bliver meldt som en konflikt. Ét centralt Stade beholder biblioteket og erfaringerne, så de samme rettelser kan bruges på tværs af projekter.</p>
      <p class="connections-note">Agenten bruger Stades installations- og statustjek. Nye projekter får kun adgang, når de udtrykkeligt tilknyttes. Denne offlineoversigt installerer ikke noget og viser ikke den aktuelle chats forbindelsesstatus.</p>
    </section>

    <section class="connections-section" aria-labelledby="collaboration-formlab-title">
      <h2 id="collaboration-formlab-title" class="connections-section-title">FormLab: Materialer og GPU</h2>
      <p class="connections-copy">En dedikeret skill forbinder erfaringsopslag og kildekontrol med FormLabs materialedokumentation og relevante prøver. Den skelner mellem almindelige materialeflader, blændingernes tilmuring og kantsten, så en bestået prøve af én overflade ikke bliver en godkendelse af alle.</p>
      <p class="connections-copy">Bed agenten bruge <code>$formlab-material-gpu</code> til at undersøge materialeflimmer. Forløbet vælger kontrol efter den berørte rendervej og beskriver præcist, hvad der er afprøvet. Software-WebGL og kontrol på en fysisk GPU rapporteres særskilt.</p>
      <p class="connections-note">Skillens versionsstyrede kilde ligger i Stades skills/formlab-material-gpu. Agentappen skal have indlæst skillen og MCP-forbindelsen; denne offlineoversigt viser ikke deres aktuelle indlæsningsstatus.</p>
    </section>

    <section class="connections-section" aria-labelledby="collaboration-contribute-title">
      <div class="connections-section-heading"><span class="connections-number" aria-hidden="true">03</span><h2 id="collaboration-contribute-title">Sådan vokser det fælles grundlag</h2></div>
      <ol class="connections-steps collaboration-contribute">
        <li><strong>Slå op før gentagen fejlsøgning</strong><p>Agenten søger efter problemet, læser erfaringen og kontrollerer, at kilden stadig passer til produktets aktuelle kode.</p></li>
        <li><strong>Foreslå en præcis erfaring</strong><p>En ny løsning beskrives med problem, fremgangsmåde, kilde og faktisk kontrol. Forslag bliver kladder og kan ikke godkende sig selv.</p></li>
        <li><strong>Gennemgå og del bevidst</strong><p>Agenten viser den foreslåede ændring og kontrollerer kilderne, før posten optages i samlingen. Gennemgangen afviser en forældet version, så en anden agents ændringer bliver bevaret. Produktlokale valg bliver kun fælles, når erfaringen er afgrænset og efterprøvet til det bredere formål.</p></li>
      </ol>
      <p class="connections-copy">Bed fx agenten: »Gennemgå de nye erfaringskladder, og optag de erfaringer, der har tilstrækkeligt belæg.« Eksisterende poster kan også rettes eller markeres som udgået med en forklaring. Udgåede erfaringer bevares og kan findes med statusfilteret.</p>
      <p class="connections-note">Agentvejledningen i projektet beskriver tilslutning, erfaringsformat, gennemgang og tilføjelse af nye værktøjer. Stade bevarer én fælles kilde til pakkernes beskrivelser og funktioner.</p>
    </section>
  </div>`;
}

export function bindCollaborationLibrary(root, theme) {
  const host = root.querySelector('.collaboration-library');
  if (!host) return;
  const update = () => {
    host.querySelector('.experience-results').innerHTML = results(theme);
    host.querySelector('#experience-count').textContent = `${selection().length} af ${experiences.length} erfaringer`;
  };
  host.querySelector('.experience-filters').addEventListener('submit', event => event.preventDefault());
  for (const [id, field, type] of [['experience-query', 'query', 'input'], ['experience-scope', 'scope', 'change'], ['experience-status', 'status', 'change']]) {
    host.querySelector('#' + id).addEventListener(type, event => { draft[field] = event.target.value; update(); });
  }
  host.addEventListener('toggle', event => {
    const entry = event.target.closest('[data-experience-id]');
    const pack = event.target.closest('[data-tool-package-id]');
    const id = entry?.dataset.experienceId ?? pack?.dataset.toolPackageId;
    if (!id) return;
    const opened = entry ? draft.open : draft.packages;
    if (event.target.open) opened.add(id);
    else opened.delete(id);
  }, true);
  host.querySelector('#experience-export').addEventListener('click', () => downloadFile('stade-erfaringer.json', JSON.stringify(experiences, null, 2), 'application/json'));
}
