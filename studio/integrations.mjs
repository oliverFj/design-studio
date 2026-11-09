import { renderComponent } from '../core/components.mjs';
import { renderCollaborationLibrary, bindCollaborationLibrary } from './collaboration-library.mjs';

const openQuestions = new Set();

const questions = [
  {
    id: 'access',
    label: 'Hvad må en agent få adgang til?',
    content: 'Du vælger, hvilke projekter og tjenester en forbindelse skal omfatte, og om agenten må læse eller også ændre noget. Stades MCP læser bibliotek og tilladte projekter og kan oprette nye erfaringskladder. Den kan ikke godkende erfaringer eller ændre produktets kode. Adgangen skal håndhæves af værktøjet, så den også gælder, hvis en agent tager fejl.',
  },
  {
    id: 'storage',
    label: 'Skal vi have en database eller en server?',
    content: 'Det fælles bibliotek kan fortsat ligge i versionsstyrede filer. En database bliver relevant, når flere agenter skal opdatere fælles opgaver og status samtidigt. En MCP-tjeneste kan køre lokalt på din computer; adgang fra andre computere eller tjenester kræver en passende delt løsning. Den færdige offlineudgave af Stade kan fortsat åbnes selvstændigt.',
  },
  {
    id: 'memory',
    label: 'Hvilke erfaringer skal blive fælles?',
    content: 'En erfaring bør have en kilde, en forklaring på hvad der blev afprøvet, og en afgrænsning af hvor den gælder. Forsøg skal kunne blive til godkendte løsninger, erstattes eller udgå. Et erfaringsbibliotek giver agenter noget at slå op i; det træner ikke automatisk modellerne og giver ikke i sig selv hukommelse på tværs af alle chats.',
  },
  {
    id: 'quality',
    label: 'Hvordan ved vi, om en tilføjelse hjælper?',
    content: 'Vi afprøver den på virkelige opgaver: Kan en ny agent finde den godkendte komponent, fortsætte en overdraget opgave og opdage et forældet projekt? Du vurderer kvaliteten og oplevelsen. Agenten undersøger, om løsningen giver færre fejl og gentagelser, og om vedligeholdelsen står mål med gevinsten.',
  },
];

export function renderIntegrations(theme) {
  const badge = (text, variant = 'neutral') => renderComponent(theme, 'badge', { text, variant });
  const card = ({ term, name, description, example, status, proposed = false }) => renderComponent(theme, 'card', {
    slots: {
      header: { tag: 'div', children: [
        { tag: 'h3', text: term },
        { tag: 'p', text: name },
      ] },
      body: { tag: 'div', children: [
        { component: 'stack', options: { slots: { root: [
          { tag: 'p', text: description },
          { tag: 'p', children: [{ tag: 'strong', text: 'I Stade: ' }, { tag: 'span', text: example }] },
        ] } } },
      ] },
      footer: { component: 'badge', options: { text: status, variant: proposed ? 'neutral' : 'accent' } },
    },
  });

  return `<article class="connections ds-layout" data-layout="workspace" aria-labelledby="connections-title">
    <header class="connections-intro">
      <p class="connections-eyebrow">Samarbejde / fælles arbejdsgrundlag</p>
      <h2 id="connections-title">Fælles viden.<br>Flere veje ind.</h2>
      <p class="connections-lead">Find fælles værktøjer og erfaringer, så en ny agent kan bygge videre på det, der allerede er gjort. Her kan du se, hvad Stade stiller til rådighed, og forstå dine valg som designer.</p>
    </header>

    ${renderCollaborationLibrary(theme)}

    <section class="connections-section" aria-labelledby="connections-terms">
      <h2 id="connections-terms" class="connections-section-title">API, CLI og MCP — tre veje ind</h2>
      <div class="connections-terms">
        ${card({ term: 'API', name: 'En aftale mellem programmer', description: 'Et program beder et andet om en bestemt funktion eller oplysning gennem en fast grænseflade. Et API kan være lokalt i koden eller tilgængeligt over nettet.', example: 'Et produkt bruger det fælles biblioteks funktioner til at vise en knap i sit eget tema.', status: 'Findes · Bibliotekets API' })}
        ${card({ term: 'CLI', name: 'Værktøjer gennem kommandoer', description: 'En udvikler eller agent giver en tekstkommando for at udføre en opgave. Du beskriver det ønskede resultat; agenten håndterer kommandoerne.', example: 'Agenten kontrollerer et projekts designfiler eller opdaterer dets kopi af biblioteket.', status: 'Findes · Lokale værktøjer' })}
        ${card({ term: 'MCP', name: 'En fælles forbindelse til agenter', description: 'En standard, som lader en agent opdage tilgængelige værktøjer, hente relevant viden og kalde handlinger med klart beskrevne input og svar.', example: 'Stades værktøjer kan finde en komponent, kontrollere et projekt og hente eller foreslå en erfaring.', status: 'Findes · Lokal Stade-MCP' })}
      </div>
      <p class="connections-note">API = Application Programming Interface · CLI = Command Line Interface · MCP = Model Context Protocol.</p>
      <p class="connections-note">Status beskriver funktioner i denne udgave af Stade. Siden undersøger ikke aktive forbindelser, installerede plugins eller adgang i andre apps.</p>
    </section>

    <section class="connections-section" aria-labelledby="connections-example">
      <div class="connections-section-heading">
        <span class="connections-number" aria-hidden="true">04</span>
        <h2 id="connections-example">Fra dit ønske til en fælles løsning</h2>
      </div>
      <div class="connections-example">
        <div class="connections-request">
          <p class="connections-eyebrow">Du beskriver behovet</p>
          <blockquote>“Jeg skal bruge en tabel, hvor brugeren kan redigere indholdet.”</blockquote>
          <p>Du bestemmer opgaven og oplevelsen. Agenten finder og forbinder de relevante dele.</p>
        </div>
        <ol class="connections-steps">
          <li><strong>Find det, der allerede virker</strong><p>Agenten finder Stades datagrid og vejledningen. Opslaget kan ske gennem den tilsluttede MCP-tjeneste eller direkte i projektets filer.</p></li>
          <li><strong>Brug den fælles løsning</strong><p>Produktet bruger bibliotekets API. Det bevarer fælles tastaturbetjening og tema, mens produktet ejer indhold og lagring.</p></li>
          <li><strong>Kontrollér resultatet</strong><p>Agenten bruger relevante kontroller, herunder CLI-værktøjerne. Du vurderer, om tabellen understøtter brugerens arbejde.</p></li>
        </ol>
      </div>
      <p class="connections-note">Et illustreret arbejdsforløb. Der bliver ikke kørt kommandoer eller oprettet forbindelser på denne side.</p>
    </section>

    <section class="connections-section" aria-labelledby="connections-decisions">
      <div class="connections-section-heading">
        <span class="connections-number" aria-hidden="true">05</span>
        <h2 id="connections-decisions">Det er her, du tager stilling</h2>
      </div>
      <p class="connections-copy">Agenten kan foreslå og bygge teknikken. Du vælger formål, adgang og ambitionsniveau. De vigtigste spørgsmål handler om konsekvenserne for dit arbejde.</p>
      ${renderComponent(theme, 'accordion', { idPrefix: 'connections-decisions', label: 'Beslutninger om Stades forbindelser', items: questions.map(question => ({ ...question, open: openQuestions.has(question.id) })) })}
    </section>

    <section class="connections-section" aria-labelledby="connections-next">
      <h2 id="connections-next" class="connections-section-title">Når behovet vokser</h2>
      <dl class="connections-roadmap">
        <div><dt>Fælles opgavestatus ${badge('Senere ved behov')}</dt><dd>Arbejdsfordeling, overdragelse og håndtering af samtidige ændringer kræver særskilte regler. Det leverede fundament deler værktøjer og erfaringer; det er endnu ikke en opgavefordeler.</dd></div>
        <div><dt>Flere forbindelser ${badge('Senere ved behov')}</dt><dd>Sikkerhedsfund, andre tjenester og adgang fra flere computere kan kobles til gennem nye, afgrænsede værktøjer. Drift og lagring vælges efter det konkrete behov.</dd></div>
      </dl>
    </section>

    <footer class="connections-sources">
      <h2 class="connections-section-title">Hvis du vil vide mere</h2>
      <p>MCP er en åben standard. Et plugin kan pakke en forbindelse og arbejdsvejledninger sammen, så de kan bruges i en agentapp. Hvad der er tilgængeligt, afhænger af appen og den konkrete integration.</p>
      <ul>
        <li>${renderComponent(theme, 'link', { text: 'OpenAI: Hvornår giver MCP værdi?', href: 'https://learn.chatgpt.com/docs/learn/best-practices' })}</li>
        <li>${renderComponent(theme, 'link', { text: 'OpenAI: MCP-forbindelser i Codex', href: 'https://learn.chatgpt.com/docs/extend/mcp' })}</li>
        <li>${renderComponent(theme, 'link', { text: 'OpenAI: Plugins med vejledninger og værktøjer', href: 'https://developers.openai.com/plugins/quickstart' })}</li>
      </ul>
      <p class="connections-note">Eksterne vejledninger kræver internet. Forklaringerne på denne side følger med Stades offlineudgave.</p>
    </footer>
  </article>`;
}

export function bindIntegrations(root, theme) {
  bindCollaborationLibrary(root, theme);
  root.querySelectorAll('[aria-label="Beslutninger om Stades forbindelser"] .ds-accordion__item').forEach((details, index) => {
    details.addEventListener('toggle', () => {
      const id = questions[index].id;
      if (details.open) openQuestions.add(id);
      else openQuestions.delete(id);
    });
  });
}
