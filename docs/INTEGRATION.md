# Brug Design Studio i et produkt

## Tilknyt og synkronisér

~~~sh
node tools/cli.mjs init "E:/produkt" --theme studio-light
~~~

Init kræver en eksisterende projektmappe og opretter følgende uden at overskrive filer:

- index.html: færdig offline-app, som åbnes direkte i browseren.
- src/app.mjs, src/styles.css og src/index.html: appens redigerbare kilder og HTML-skabelon.
- tools/build.mjs og package.json: et selvstændigt offlinebuild med esbuild og npm run build.
- .gitignore: udelukker node_modules og den genererede index.html.
- design/design.json: projektets tema i format 2.
- design/design.css: temaets tokens og bibliotekets fælles komponent-CSS.
- design/runtime/: engine, contract, library, quality og components som browserkompatible moduler.
- design/runtime/files.mjs: fælles JSON-filvalg, downloads og versionerede projektfiler.
- design/tools/: fælles doctor og kontrol af offlinebyggestempel; opdateres af sync.
- design/assets/: godkendte brandoriginaler og licenser, hvis temaet indeholder dem.
- design-studio.project.json: filstier, scope, biblioteksudgave og registrerede produktadaptere.
- En anvisning i AGENTS.md; eksisterende produktregler bevares.

Den første index.html bygges af init og kan åbnes straks uden installation. Agenten kører npm install i det nye projekt før senere builds, redigerer src-filerne og kører npm run build efter ændringer. Brugeren genindlæser blot browseren. Buildet anvender produktets egen kopierede runtime og kræver ikke Design Studios mappe.

Brug `init PROJECT_DIR --design-only` i et eksisterende produkt, der allerede har app- eller buildfiler. Det opretter kun designfilerne, konfigurationen og agentanvisningen. Standard-init afviser eksisterende output før skrivning, så fx package.json eller index.html ikke overskrives.

Efter ændringer i tema eller fælles bibliotek:

~~~sh
node tools/cli.mjs sync "E:/produkt"
~~~

Sync opdaterer runtime og CSS fra systemets kilder. Kopieret runtime må ikke blive en parallel lokal biblioteksudgave.

## Valgfrie opdateringer af startprojektet

Startprojektet er en start, ikke et krav om en bestemt produktarkitektur. Nye init-projekter registrerer `starterTemplate` i design-studio.project.json med en særskilt skabelonversion og fingeraftryk af de leverede filer. Produktet kan ændre kode, mapper og buildopsætning; der er ingen obligatoriske opdateringer eller automatisk opdatering under build.

Fra Design Studios mappe:

~~~sh
node tools/cli.mjs update "E:/produkt"
node tools/cli.mjs update "E:/produkt" --apply
~~~

Den første kommando viser en plan uden at skrive filer. `--apply` opdaterer filer, som stadig matcher den tidligere leverede udgave, og tilføjer nye manglende filer. Lokale ændringer og kendte lokale sletninger bevares. I package.json behandles skabelonens enkelte felter særskilt, så fx egne scripts og afhængigheder ikke erstattes. Tema, produktdata, AGENTS.md og den byggede index.html overskrives ikke.

Når både skabelonen og produktet har ændret samme fil eller felt, lægges et forslag under `.design-studio/updates/VERSION/INDHOLDSHASH/`. Gennemgå og flet det relevante indhold manuelt; produktets fil bevares. Opdateringen kører ikke produktets scripts. Genbyg med npm run build efter relevante ændringer, og brug doctor til kontrol.

Den registrerede version efter `--apply` er den senest tilbudte skabelonreference, ikke en påstand om, at produktet er identisk med skabelonen, eller at manuelle forslag er flettet. Det gør det muligt at beholde egne løsninger og stadig få nye forslag ved senere opdateringer. Skabelonversionen vedligeholdes i tools/starter.mjs og hæves ved ændringer i startskabelonerne; biblioteksversionen er uafhængig.

Ældre offline-initprojekter uden fingeraftryk behandles konservativt: identiske filer kan genkendes, men afvigende filer bevares og får forslag til gennemgang. Projekter uden registreret offlineopsætning omlægges ikke med update; brug sync til deres fælles runtime/CSS og tilpas produktets opsætning selv.

## Projekttjek med doctor

Nye offlineprojekter får `npm run doctor`. Fra Design Studios mappe kan samme tjek køres med `node tools/cli.mjs doctor PROJECT_DIR`. Tjekket ændrer ingen filer og returnerer en fejlkode, når der findes fejl.

Doctor kontrollerer tema, genereret CSS, kopieret runtime, adapterfiler og deres faktiske exports samt offlinefilen. Buildet indlejrer et fingeraftryk af sine faktiske inputfiler, så doctor kan opdage en forældet index.html uden at kræve faste src-filnavne eller en bestemt produktmappestruktur. Kør sync ved forældet runtime eller CSS og derefter npm run build. Ved manglende Design Studio-mappe vises en advarsel om, at sammenligning med den centrale kilde ikke er mulig; produktets lokale tjek kan stadig køre.

Netværkskald og serverafhængigheder undersøges statisk og kan give advarsler. Doctor er ikke en garanti for alle brugerforløb eller en erstatning for relevant kontrol via file://. Ældre projekter uden byggestempel får en advarsel om, at buildets aktualitet ikke kan fastslås. Sync opdaterer fælles filer, men indsætter ikke scripts i eksisterende package.json eller erstatter produktets buildopsætning.

## Fælles projektfiler

Brug `createProjectFile` fra `design/runtime/files.mjs`. Produktet ejer sit format-id, versionsnummer og datavalidering. Et minimalt eksempel:

~~~js
import { createProjectFile } from './design/runtime/files.mjs';

const projectFile = createProjectFile({
  format: 'my-project', version: 1,
  validate: data => ({
    valid: !!data && typeof data.name === 'string',
    errors: ['Projektets navn skal være tekst.'],
  }),
});

// Kald fra brugerens klik. Opdatér først produktets state efter vellykket læsning.
const opened = await projectFile.open();
if (opened) state = opened.data;
projectFile.save('projekt.json', state);
~~~

Filformatet er `{ "format": "my-project", "version": 1, "data": { ... } }`. Forkert format, ukendt version og ugyldige data afvises; modulet migrerer ikke filer stiltiende. Annulleret filvalg giver null. Produktet håndterer fejlbesked, eventuelle ugemte ændringer og sin egen state. Standardgrænsen er 5 MiB; open/read accepterer maxBytes, hvis produktet har et konkret andet behov.

`readJSONFile`, `openJSONFile`, `downloadJSON` og `downloadFile` kan også bruges uden projektkonvolut, eksempelvis til temaer og originalressourcer. Validering returnerer `{ valid, errors }`. Save/download starter browserens download og bekræfter ikke, at brugeren har gemt filen på disken; originalfilen overskrives ikke automatisk. Nye init-projekter har Åbn projekt og Gem projekt som et lille eksempel med tællerens tilstand.

## Fælles breddeprofiler

Format 2-temaers genererede CSS indeholder de fælles layoutprimitiver fra core/layout.mjs. Init og sync kopierer også modulet til design/runtime/layout.mjs. Nye startprojekter bruger form-profilen som udgangspunkt. Profilerne tilføjer ikke kolonner, padding, rammer eller fokusadfærd.

| Profil | Standardgrænse | Brug |
| --- | --- | --- |
| prose | 70ch | Læsetekst og vejledning |
| form | 44rem | Formularer og indstillinger |
| panel | 23rem | Egenskaber og værktøjer |
| split | 72rem | Liste og detaljevisning |
| workspace | 84rem | Sammensatte editorer |
| fluid | Ingen | Arbejdsflader, som reelt udnytter fuld bredde |

~~~html
<main class="ds-scope">
  <section class="ds-layout my-form" data-layout="form">...</section>
</main>
~~~

Alternativt: `const frame = createLayout('form')` fra design/runtime/components.mjs, og tilføj indhold med frame.append. LAYOUT_PROFILES fra design/runtime/layout.mjs beskriver profilerne til værktøjer og adaptere. Containerens native semantik bestemmes fortsat af produktet.

Tilpas kun den konkrete ramme, eksempelvis `.my-form { --ds-layout-max-width: 50rem; }` i produktets stylesheet efter design.css. En indlejret ds-layout starter igen med sin egen profilgrænse. Produktet kan vælge fluid eller opbygge egne kolonner uden at ændre temaet eller biblioteket. Format 1 beholder sin eksisterende CSS og får ikke profilerne automatisk.

## Valgfrie sammensætningseksempler

Offline-editorens Designsystem → Designmønstre og web-showcasen viser samme ni eksempler: objekteditor med kontekstpanel, formular med validering, liste med detaljevisning, ressourcebibliotek, fortryd/gentag, header/navigation, hero, footer og billedgalleri. De bruger bibliotekets eksisterende roller og det valgte tema. Kilde, version, formål, komponenter og interaktioner findes i patterns/catalog.mjs; implementering og layout findes i patterns/compositions.mjs, de enkelte mønstermoduler og patterns/styles.css. PATTERN_FILES i kataloget er den fælles liste til referenceeksport og showcase.

Katalogets layoutprofil vælger en af bibliotekets fælles breddeprofiler. Profilerne vælges efter indholdets rolle og kan tilpasses i produktet. Objektkort og handlinger strækkes ikke med en bredere arbejdsflade. Se [retningslinjerne for indholdsbredde](DESIGN-FOUNDATIONS.md#indholdsbredde-og-fuld-bredde).

Objekteditoren er tilpasset fra FormLabs object-panel.js, ui.js og ui.css, gennemgået 27. oktober 2026. Den genbruger hierarkisk søgning med midlertidig åbning af matchende forældre, multivalg, gruppehandlinger for synlighed/låsning, kontekst, faner og bevarede foldesektioner. Gruppens lås beskytter også underobjekter; rækkehandlinger bevarer valget. Flytning er tilgængelig gennem Handlinger, så træk ikke er nødvendigt. Ved forskellige mål viser panelet en tom blandet værdi; tomt input bevarer de enkelte mål, mens en indtastet værdi gælder hele udvalget. Native faneroller har piletaster, Home/End og én tabstop-position.

Den neutrale objektmodel og arbejdsflade er implementeret særskilt i Design Studio. FormLabs geometri, bygningskommandoer, materialer og projektdata følger ikke med. Det oprindelige projekt ændres ikke ved at tilpasse mønstret. Kildens navn, relevante filer og afgrænsning vises under Genbrug og sammensætning.

Fra systemmappen kan referencekoden kopieres til et tilknyttet produkt:

~~~sh
node tools/cli.mjs examples "E:/produkt"
~~~

Kommandoen opretter design/patterns uden at overskrive eksisterende filer. Kopierne bruger produktets design/runtime. De er valgfrie og ejes efter kopiering af produktet; sync og update ændrer dem ikke. Indlæs design/patterns/styles.css i produktets build og brug hele eksemplet eller kun de relevante dele.

~~~js
import { mountComposition, createCompositionState } from './design/patterns/compositions.mjs';

const state = createCompositionState('editor');
const example = mountComposition(theme, 'editor', {
  state, idPrefix: 'my-editor',
  onChange: nextState => { /* Produktet bestemmer lagring og øvrige handlinger. */ },
  announce: message => { liveRegion.textContent = message; },
});
host.append(example.element);
// Ved afmontering: example.destroy();
~~~

Id'er er editor, form, list-detail, resource-library og history. Tilstanden kan beholdes ved afmontering og genbruges ved temaskift. Brug forskellige idPrefix-værdier ved flere instanser. Formularens gemning og handlingernes ændringer gælder kun den leverede state i hukommelsen. Eksemplerne har ikke en server, en 3D-motor eller produktets forretningslogik.

Ressourcebibliotekets state indeholder items med id, title, description, type, tags og favorite samt søgning, filtre, visning og valgt id. `mountComposition(theme, 'resource-library', { state, onUse })` kalder onUse med en kopi af den valgte ressource, når brugeren vælger Brug ressourcen. Produktet bestemmer indlæsning og anvendelse. Søgning, typefilter og Kun favoritter kombineres; tomt bibliotek og ingen søgeresultater har forskellige tilstande. Favoritter og valg er separate handlinger.

Fortryd/gentag kan bruges som samlet eksempel med id history eller som den selvstændige JSON-historik i design/patterns/history.mjs:

~~~js
import { createHistoryState, createHistory } from './design/patterns/history.mjs';
const historyState = createHistoryState(documentData);
const history = createHistory(historyState, { limit: 50 });
history.commit('Omdøb objekt', changedDocument);
history.undo();
history.redo();
// Først efter produktets egen vellykkede gemning:
history.markSaved();
// history.value er en kopi. history.dirty sammenligner indhold med gemmepunktet.
~~~

Produktet ejer historyState og kan bevare den ved afmontering. Brug JSON-serialiserbare dokumentdata; udvalg, fokus, filtre og ufærdige inputkladder holdes uden for historikken. Ét afsluttet feltvalg eller greb bør være ét commit, ikke ét trin pr. tast eller pointerbevægelse. Identiske ændringer giver intet trin; nye ændringer efter undo rydder redo-grenen. Historikken har som standard højst 50 tidligere snapshots.

Eksemplets navnefelt commits ved change, mens uanvendte eller ugyldige kladder bevares og kan annulleres. Genveje er afgrænset til eksemplets rod og springer input, textarea, select og contenteditable over, så native tekstfortrydelse bevares. Ctrl/⌘+Z fortryder; Ctrl+Y eller Ctrl/⌘+Shift+Z gentager. Gem i eksemplet flytter kun et gemmepunkt i hukommelsen. Historikmodulet skriver ikke filer, installerer ikke globale genveje og bekræfter ikke en browserdownload som en vellykket disk-gemning.

Det er referencekode, ikke et pluginsystem eller et krav til produktets struktur. Ved optagelse af løsninger fra eksisterende apps: bevar kilde/ophav og relevante licenser; skeln mellem det oprindelige produkt som inspiration og det tilpassede, genbrugelige designmønster. Fjern produktdata og skjulte afhængigheder, brug fælles komponentroller, og kontrollér relevante interaktioner og temaer. Domænespecifik logik kan forblive i produktet. Formularen og liste/detaljevisningen er selvstændige referenceeksempler; objekteditoren er inspireret af FormLab.

## Brug de faktiske komponenter

Indlæs design/design.css gennem produktets normale stylesheetmekanisme. Komponenternes roots ligger inden i et ds-scope-element.

~~~js
import { createComponent } from './design/runtime/components.mjs';

const card = createComponent(theme, 'card', {
  idPrefix: 'collection',
  slots: {
    header: { tag: 'h3', text: 'Min samling' },
    body: { tag: 'p', text: 'Indholdet bestemmes af produktet.' },
    footer: { component: 'button', options: { text: 'Gem' } },
  },
}, { document });

document.querySelector('.ds-scope').append(card);
card.querySelector('button').addEventListener('click', saveCollection);
~~~

createComponent returnerer native DOM. renderComponent(theme, id, options) returnerer tilsvarende sikker HTML, når produktet arbejder med tekstbaseret rendering. Tekst escapes; slots bruger deklarative noder eller andre fælles komponenter, ikke vilkårlig HTML.

Formularfelter bruger label, hint, error og idPrefix. Biblioteket forbinder for/id og aria-describedby. Controls bevarer native type, disabled og checked. Lad produktet håndtere værdier, events og state.

Frameworkadaptere må forbinde komponenter til React, Vue eller lignende, men skal bevare fælles dele, native semantik og bibliotekets grundlayout. Registrér adaptere i components-feltet med verificerede file og export. Skærmlayout og routing er produktspecifikke.

Handlingsknappen action-button har slots icon, label og shortcut. Varianten tool placerer symbol over en kort label i en kompakt værktøjslinje; den bruger de samme pressed- og focustilstande. En tom shortcut skjules. iconAssetId kan vælge en godkendt logo- eller billedressource fra temaets brand.assets; billedet bevarer proportionerne. Brug den til en handling med symbol og tekst; forbind genvejen i produktet, hvis den vises. Billedtekst caption og nøgletal metric-row har ingen produktspecifik indholdslogik. Se DESIGN-FOUNDATIONS.md for valg mellem rollerne.

## Knapfamilien

Nye integrationer vælger `variant` uafhængigt af `size` og `intent`:

| Variant | Anvendelse |
| --- | --- |
| primary | Opgavens vigtigste næste handling. |
| secondary | Solid neutral ledsager til primary, eksempelvis Tilbage eller Annuller. |
| tertiary | Indrammet handling, som også kan stå alene. |
| ghost | Supplerende handling med mindst visuel vægt. |

`size` er `small` (32 px), `medium` (44 px, standard) eller `large` (48 px). `intent: 'danger'` kan kombineres med primary, tertiary og ghost; secondary bruges til neutrale ledsagehandlinger. Uden sideikon er teksten centreret med symmetrisk padding og indholdsbestemt bredde. `icon` giver et sideikon; `iconOnly: true` kræver både ikon og et tilgængeligt navn gennem `label` eller `aria-label`.

~~~js
const action = createComponent(theme, 'button', {
  text: 'Gem ændringer', variant: 'primary', size: 'medium',
});
const destination = createComponent(theme, 'button', {
  text: 'Udforsk samlingen', href: '#samling',
  variant: 'primary', size: 'large', icon: '→',
});
const remove = createComponent(theme, 'button', {
  text: 'Slet', variant: 'tertiary', intent: 'danger',
});
~~~

Med `href` bliver elementet et native `a`; uden er det en native `button`. Knaplignende links får knappens tilstande uden tekstunderstregning ved hover. Løbende tekstnavigation bruger `link`, og websitenavigation bruger `navigation` med navngivet `nav` og `aria-current` på det aktuelle link. Programmets menuer bruger fortsat `menubar`, `menu` og `menu-item`.

`loading: true` viser aktivitet og deaktiverer handlingen. Et deaktiveret eller arbejdende navigationslink får ikke et aktivt `href`. Produktet ejer arbejde, state og genaktivering. Historiske knapvarianter som desktop, rounded og danger understøttes fortsat af runtime, men vises ikke som den nye knapfamilie i Studio. Brug `buttonVariantIds(component)` fra library.mjs ved et katalog over de fire offentlige varianter; `getComponents(theme)` indeholder også kompatibilitetsopskrifter.

## Billeder og websiteeksempler

`image` bruger `figure`, `img` og valgfri billedtekst. Angiv altid `alt`, når du leverer `src`; tom tekst er tilladt for dekoration. `caption: ''` skjuler billedteksten. Grundudgaven bevarer motivets format; `landscape` og `square` beskærer med `object-fit: cover`.

~~~js
const image = createComponent(theme, 'image', {
  src: './assets/samling.jpg', alt: 'En samling af noter på et bord.',
  caption: 'Noter fra arbejdsdagen.', variant: 'landscape',
});
~~~

Uden en egen kilde bruger previewet en offline-illustration fra temaets palette. `createImageExamples(theme)` fra components.mjs leverer de samme indbyggede motiver til hero og billedgalleri. Genopret dem ved temaskift; brugerens egne billedkilder omfarves ikke. Galleriet åbner det valgte motiv i en native dialog og returnerer fokus til udløseren. Headerens mobile navigation bruger native details/summary. Websiteeksemplerne ligger i patterns/web.mjs; der er ingen karussel eller automatisk billedbevægelse.

## Fælles standardanimation

`animateStandard` og `STANDARD_MOTION` eksporteres fra `design/runtime/components.mjs`; implementeringen i motion.mjs kopieres af init og sync. Udfoldning og tilbagevenden bruger 240 ms og `cubic-bezier(.2,.7,.2,1)` uden ekstra forsinkelse. Animationen styrer visuel overgang; produktet ejer slutlayout, åbning/lukning og fokus.

~~~js
import { animateStandard } from './design/runtime/components.mjs';

function reveal(panel) {
  panel.hidden = false;
  const effect = animateStandard(panel, [{ opacity: 0 }, { opacity: 1 }]);
  return () => effect?.cancel(); // Kald når visningen erstattes.
}
~~~

Funktionen returnerer en native Animation eller null ved reduceret bevægelse eller manglende browserstøtte. Sæt derfor den anvendelige sluttilstand før kaldet. Produktet annullerer eventuelle effekter, når en visning afmonteres. Fanen Animation og effekter demonstrerer den faktiske standard; i komponentkataloget vender kortene tilbage samtidig med, at variantpanelet lukker.

## Hierarkisk indhold med tree

Brug `tree` til navngivne objekter med børn og få handlinger pr. række. Den interaktive runtime importeres som `mountTree` fra `design/runtime/components.mjs`; katalogets deklarative preview er ikke en interaktiv produktintegration.

~~~js
import { mountTree } from './design/runtime/components.mjs';

let expandedIds = ['collection'];
const tree = mountTree(theme, host, {
  label: 'Indhold',
  items: [{ id: 'collection', label: 'Samling', children: [
    { id: 'item-a', label: 'Element A', icon: '◇', meta: 'Kladde',
      actions: [{ id: 'visibility', label: 'Synlig', icon: '◉', pressed: true }] },
  ] }],
  selectedIds: [],
  expandedIds,
  onSelect(ids) { tree.update({ selectedIds: ids }); },
  onToggle(id, expanded) {
    expandedIds = expanded ? [...new Set([...expandedIds, id])] : expandedIds.filter(value => value !== id);
    tree.update({ expandedIds });
  },
  onAction(id, actionId, detail) { handleItemAction(id, actionId, detail); },
}, { document });
~~~

`host` ligger under `ds-scope`. Produktet leverer `handleItemAction` og sin egen tilstand. Controlleren eksponerer `element`, `update(nextOptions)` og `destroy()`; opdatér ved ændringer og afmontér med `destroy`. Brug stabile, entydige item-ID'er, så DOM og fokus kan bevares.

Et item har `id`, `label` og valgfrie `icon`, `meta`, `badge`, `children`, `actions`, `disabled`, `draggable` og `dropTarget`. En rækkehandling har `id`, en forståelig `label` samt valgfrie `icon`, `pressed` og `disabled`; symboler erstatter ikke handlingsnavne. `dropTarget` er en boolean eller `{ inside, before, after }`. Options omfatter også `multiSelect` (standard `true`) og `variant` (standard `default`). Standardtræet har 32 px rækker, 24 px foldningsfelt, tæt indrykning og afkortning af lange navne. Brug `roomy` til de større 44 px klikflader og ombrudte navne. `desktop` bevares som eksplicit kompakt variant.

| Callback | Foreslået ændring og kontekst |
| --- | --- |
| `onSelect(ids, detail)` | Nyt valg; `detail` indeholder `id`, `item`, `event`, `toggle` og `range`. |
| `onToggle(id, expanded, detail)` | Åben/luk; kontekst er `{ item, event }`. |
| `onAction(id, actionId, detail)` | Aktivér rækkehandling; kontekst er `{ item, event }`. |
| `onMove(sourceIds, targetId, detail)` | Flyt til `position: 'inside'`, `'before'` eller `'after'`; `event` følger med. |
| `onContextMenu(id, detail)` | Produktets menu; kontekst er `{ item, event, selectedIds }`. |

Callbacks foreslår handlinger; de ændrer ikke produktets data. Produktet validerer flytning og valg, opdaterer tilstanden og sender resultatet tilbage med `update`. Det ejer også kontekstmenu, fortryd og en klik-/tastaturbetjent flyttehandling, når drag-and-drop bruges. En tastaturgenvej alene erstatter ikke et klikbart alternativ til træk. Se [WCAG 2.2 om dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

Pil op/ned og Home/End flytter kun rækkefokus; højre/venstre åbner, lukker eller navigerer mellem forælder og barn. Bogstaver søger efter rækkenavne med en buffer på 700 ms. Enter vælger rækken, mens Space skifter dens valgtilstand ved multivalg. Normalt klik erstatter valget, Ctrl/Meta-klik skifter en række, og Shift-klik eller Shift+pil op/ned foreslår et interval. `item.disabled` blokerer valg og træk, men ikke foldning eller særskilt aktiverede handlinger. Sådanne rækker kan fortsat få fokus; kun disabled-blade uden aktive handlinger springes over. `action.disabled` styrer den enkelte knap. Tab når den fokuserede rækkes native handlingsknapper; Enter/Space aktiverer knappen. ContextMenu eller Shift+F10 åbner produktets kontekstmenu. Fokus og vedvarende valg skal kunne skelnes. [Designgrundlaget](DESIGN-FOUNDATIONS.md#hierarkier-og-rækkehandlinger-i-bibliotek-26) beskriver kilder og afgrænsning.

Træet ejer sin indrykning, rækkeanatomi og fokus. Brug eksisterende `scroll-area` til lange træer og produktets shell til placering og maksimal højde. Brede redigerbare kolonner hører til en særskilt treegrid-løsning.

## Tema og tokens

Temaet indeholder tokens, brandguide, historik og eventuelt appearance. Det indeholder ikke komponentdefinitioner. Brug bibliotekets positive semantiske spacingtokens til tæthed. appearance kan ændre godkendte visuelle egenskaber, men ikke padding, gap eller struktur.

Redigér temaet ved at åbne Design Studios `index.html` i browseren og vælge **Åbn tema**. **Gem tema** henter den redigerede JSON-fil; placér den som produktets `design/design.json`, før `node tools/cli.mjs sync PROJECT_DIR` køres fra Design Studios mappe. Editorens download ændrer ikke automatisk produktets tema, CSS eller runtime.

Produktets sidelayout kan bruge CSS-variabler som --ds-space-6 og --ds-color-background-canvas. Token-id'ers punktummer bliver bindestreger; store bogstaver bevares. Biblioteket ejer komponenternes interne layout.

## Afstande og indlejrede flader

Brug den uindrammede stack til afstand mellem direkte børn: standard bruger space.component.gapLarge, compact bruger space.component.gap. Felter og valggrupper ejer stadig deres interne padding og afstand; undgå ekstra lokale margins på samme grænse. Produktet vælger grupperne, biblioteket leverer rytmen.

Native details beholder almindeligt block-layout. Efter summary placeres en separat stack med varianten disclosure-body. Den bruger gapLarge fra overskriften og gap mellem børnene, og fylder kun, når details er åben. Sæt ikke flex-stack på selve details-roden.

En contained scroll-area ejer den synlige flade, kant, radius og klipning. Den indre card, inspector eller toolbar får scroll-areaens surface-part: dens ekstra ramme fjernes, mens originale dele og indvendig spacing bevares. Når et allerede indrammet kort har en fast header, bruges body-varianten på det scrollende indhold. Tilføj ikke endnu en indrammet wrapper alene til scrollbarens placering.

Valggrupper bruger indholdsbaserede minimumsbredder. Brug segmented-control med wrap til lange labels og mange valg; gruppen kan gå over flere rækker. Giv produktpanelet tilstrækkelig bredde. Del ikke almindelige ord vilkårligt for at presse dem ind. Brug divider med vertical til funktionelle grupper i en vandret toolbar frem for store tomme mellemrum.

## Synlige interaktioner og tæthed

Handlingsfamilierne neutral, primary, selected, danger og accent har hver fire tokens under color.action: eksempelvis neutralHover, neutralHoverText, neutralActive og neutralActiveText. Biblioteket binder disse flade-/tekstpar til de relevante roller og varianter; synlig hover må ikke bero på en lille tekstfarveændring alene. Vedvarende valg og aria-pressed bevares under hover og tryk, og disabled er undtaget.

Temaer justerer tæthed med positive space.component.padding, paddingLarge, paddingCompact, gap og gapLarge samt typografitokens. Bevar bibliotekets minimumsklikflader. De interne --ds-interaction-variabler er komponentlokale implementeringsdetaljer og må ikke sættes som globale tema-overrides.

## Brand og dialoger

Læs relevante brandregler og brug godkendte originaler fra design/assets. Bevar proportioner og licenser. Temaets indlejrede skrifter genererer selvstændige @font-face-regler. Se BRANDGUIDE.md.

Dialoger skal følge native dialog-semantik eller produktets etablerede tilgængelige adapter. Visuelle dialogeksempler er ikke i sig selv modaladfærd. Produktet styrer åbning, lukning og events.

## Tidligere produkter

~~~sh
node tools/cli.mjs migrate "E:/produkt/design/design.json" --out "E:/produkt/design/theme-v2.json"
~~~

Originalen bevares. Ukendte komponentroller skal registreres i det fælles bibliotek først. Tilpas produktets markup og tidligere paddingregler før temaet bliver aktivt, og synkronisér derefter. Format 1 kan fortsat generere sin hidtidige CSS, indtil produktet migreres.
