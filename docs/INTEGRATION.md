# Brug Design Studio i et produkt

Følg [agentarbejdsgangen](AGENT-WORKFLOW.md) for rækkefølge, valg af komponenter og proportional kontrol. Denne guide beskriver API og integration; produktets egne anvisninger ejer skærme og funktioner.

Den aktuelle biblioteksversion og kataloget findes i `core/library.mjs`. `COMPONENT_COVERAGE` viser den relevante runtimeindgang; almindelig komponentmarkup forbinder ikke automatisk en kompleks controller. Brug produktets faktiske filstier fra `design-studio.project.json`.

Brug [den fælles signaturkomponent](SIGNATURE.md), når et produkt skal krediteres med Fjordside-logo og Oliver Fjordside i Platypi. [Onlinevejledningen](WEBSITE-SHOWCASE.md) beskriver opdatering og udgivelse af Design Studio på hjemmesiden.

## Tilknyt og synkronisér

~~~sh
node tools/cli.mjs init PROJECT_DIR --theme studio-light
~~~

Erstat `PROJECT_DIR` med produktets faktiske sti. Init kræver en eksisterende projektmappe og opretter følgende uden at overskrive filer:

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

Den første index.html bygges af init og kan åbnes straks uden installation. Agenten opretter projektets første låsefil med npm install; efterfølgende installationer fra låsefilen bruger npm ci. Agenten redigerer src-filerne og kører npm run build efter ændringer. Brugeren genindlæser blot browseren. Buildet anvender produktets egen kopierede runtime og kræver ikke Design Studios mappe.

Brug `init PROJECT_DIR --design-only` i et eksisterende produkt, der allerede har app- eller buildfiler. Det opretter kun designfilerne, konfigurationen og agentanvisningen. Standard-init afviser eksisterende output før skrivning, så fx package.json eller index.html ikke overskrives.

Efter ændringer i tema eller fælles bibliotek:

~~~sh
node tools/cli.mjs sync PROJECT_DIR
~~~

Sync opdaterer runtime og CSS fra systemets kilder. Kopieret runtime må ikke blive en parallel lokal biblioteksudgave.

## Valgfrie opdateringer af startprojektet

Startprojektet er en start, ikke et krav om en bestemt produktarkitektur. Nye init-projekter registrerer `starterTemplate` i design-studio.project.json med en særskilt skabelonversion og fingeraftryk af de leverede filer. Produktet kan ændre kode, mapper og buildopsætning; der er ingen obligatoriske opdateringer eller automatisk opdatering under build.

Fra Design Studios mappe:

~~~sh
node tools/cli.mjs update PROJECT_DIR
node tools/cli.mjs update PROJECT_DIR --apply
~~~

Den første kommando viser en plan uden at skrive filer. `--apply` opdaterer filer, som stadig matcher den tidligere leverede udgave, og tilføjer nye manglende filer. Lokale ændringer og kendte lokale sletninger bevares. I package.json behandles skabelonens enkelte felter særskilt, så fx egne scripts og afhængigheder ikke erstattes. Tema, produktdata, AGENTS.md og den byggede index.html overskrives ikke.

Når både skabelonen og produktet har ændret samme fil eller felt, lægges et forslag under `.design-studio/updates/VERSION/INDHOLDSHASH/`. Gennemgå og flet det relevante indhold manuelt; produktets fil bevares. Opdateringen kører ikke produktets scripts. Genbyg med npm run build efter relevante ændringer, og brug doctor til kontrol.

Den registrerede version efter `--apply` er den senest tilbudte skabelonreference, ikke en påstand om, at produktet er identisk med skabelonen, eller at manuelle forslag er flettet. Det gør det muligt at beholde egne løsninger og stadig få nye forslag ved senere opdateringer. Skabelonversionen vedligeholdes i tools/starter.mjs og hæves ved ændringer i startskabelonerne; biblioteksversionen er uafhængig.

Ældre offline-initprojekter uden fingeraftryk behandles konservativt: identiske filer kan genkendes, men afvigende filer bevares og får forslag til gennemgang. Projekter uden registreret offlineopsætning omlægges ikke med update; brug sync til deres fælles runtime/CSS og tilpas produktets opsætning selv.

## Projekttjek med doctor

Nye offlineprojekter får `npm run doctor`. Fra Design Studios mappe kan samme tjek køres med `node tools/cli.mjs doctor PROJECT_DIR`. Tjekket ændrer ingen filer og returnerer en fejlkode, når der findes fejl.

Doctor kontrollerer tema, genereret CSS, kopieret runtime, adapterfiler og deres faktiske exports samt offlinefilen. Buildet indlejrer et fingeraftryk af sine faktiske inputfiler, så doctor kan opdage en forældet index.html uden at kræve faste src-filnavne eller en bestemt produktmappestruktur. Kør sync ved forældet runtime eller CSS og derefter npm run build. Ved manglende Design Studio-mappe vises en advarsel om, at sammenligning med den centrale kilde ikke er mulig; produktets lokale tjek kan stadig køre.

Netværkskald og serverafhængigheder undersøges statisk og kan give advarsler. Doctor er ikke en garanti for alle brugerforløb. Agenten kombinerer relevant browserkontrol over lokal HTTP med statisk offlinekontrol; særskilt direkte filkontrol følger [agentarbejdsgangen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion). Ældre projekter uden byggestempel får en advarsel om, at buildets aktualitet ikke kan fastslås. Sync opdaterer fælles filer, men indsætter ikke scripts i eksisterende package.json eller erstatter produktets buildopsætning.

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

`core/scales.mjs` kopieres til runtime med fælles primitive afstande, elevation, lag og ikonstørrelser. Semantiske `space.component.*` bruges stadig til komponenternes indre rytme; `space.scale.*` er et underliggende værdilag. `layer.base/sticky/popover/dialog/tooltip` giver dokumentets lagrækkefølge. Native modale dialoger bruger browserens top layer. Temaets egne semantiske værdier har fortsat forrang for centrale defaults.

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

## Skyder med præcis talindtastning

Brug `range-field` med `variant: 'with-input'` til parametre, som både skal kunne justeres hurtigt og indtastes præcist. Variantens native skyder og talfelt deler label, hjælp og fejl; værdien gentages ikke ved siden af feltet. `default` bevarer skyderen med et separat output.

```js
import {createComponent, mountRangeField} from './design/runtime/components.mjs';
const field = createComponent(theme, 'range-field', {
  variant: 'with-input', idPrefix: 'spacing', label: 'Gentagelse',
  value: 24, min: 8, max: 48, step: 1, hint: 'Afstand mellem båndene i px.',
});
host.append(field);
const controller = mountRangeField(field, {
  onInput: ({value, valid}) => { if (valid) updatePreview(value); },
  onCommit: ({value}) => commitGesture(value),
});
```

`onInput` og `onCommit` modtager `{value, draft, valid, error, source}`; `source` er `range` eller `number`. Gyldigt input opdaterer straks den anden kontrol. Ugyldige eller tomme kladder bevares, mens skyderen og prøven kan beholde seneste gyldige værdi. Commit samler gyldig afslutning ved change/blur uden dobbelt kald. Produktet ejer validering på tværs af felter, historik og lagring.

Controlleren har `getState()`, tavs `update({value, draft, error, disabled, readOnly})` og `destroy()`. Montér én controller pr. felt, og kald `destroy()` ved afmontering. Bevar kontroller og fokus ved live opdatering af prøven.

Talfeltet bruger centrerede cifre med fast cifferbredde og symmetrisk indvendig luft. Bredden beregnes fra min/max og decimalpræcisionen i grænser og step, med plads til fortegn. Den er stabil under redigering, har en kompakt minimumsbredde og reserverer højst 12 tegn; `step: 'any'` reserverer mindst seks. Meget lange værdier kan redigeres i feltet uden at udvide panelet. De native op/ned-pile skjules kun i denne kombination; piletaster og talfeltets semantik bevares. Almindelige `number-input` beholder deres betjening.

Parameterpaneler bruger normalt `range-field` med `with-input` og den fælles `mountRangeField`. Gyldige ændringer opdaterer prøven live; produktet bevarer seneste gyldige visning under ugyldige kladder og adskiller forhåndsvisning fra lagring. Talfeltet har centrerede cifre, symmetrisk luft og stabil bredde efter interval og trin. Se [skyderkontrakten](INTEGRATION.md#skyder-med-præcis-talindtastning).

## Materialer på eksisterende komponenter

Materialernes CSS følger automatisk format 2-runtime og `init`/`sync`. Brug eksisterende varianter frem for lokale kopier af komponentopskrifter:

```js
const card = createComponent(theme, 'card', {
  variant: 'frosted', idPrefix: 'material-example',
  slots: {
    header: {tag: 'h2', text: 'Et roligt fokus'},
    body: {tag: 'p', text: 'Indholdet ligger på en opak læseflade.'},
  },
});
const title = createComponent(theme, 'heading', {
  variant: 'gradient', slots: {root: {tag: 'h1', text: 'Lys og retning'}},
});
```

`card.rimmed` giver en gradientkant med opakt indre; `card.frosted` giver frostet ramme med opake indholdsdele. `heading.gradient` bruger `gradient.ink`, som valideres mod de tre fælles tekstflader. Bevar semantisk overskriftsniveau og kontrollér ekstra produktbaggrunde særskilt.

Dekorative noder kan bruge `data-material="atmosphere"` eller `data-material="frost"` sammen med `aria-hidden="true"` inden i `.ds-scope`. Produktet ejer deres størrelse, lag og placering. Læg tekst og kontroller på separate, opake flader; ingen af behandlingerne indfører bevægelse eller en ny komponentrolle. Tokens og fallbackregler står i [materialekontrakten](PACKAGE-FORMAT.md#materialer-frost-og-gradienttekst).

## Valgfrie sammensætningseksempler

Før referencekode udledes af eller indføres i et eksisterende produkt, læses de relevante dele af [produktbaserede mønstre og skånsom opdatering](PRODUCT-PATTERNS.md). Vejledningen beskriver referenceforløb fra de fire aktuelle produkter, herunder FormLabs Materialegenerator og Detaljeværksted, og grænserne for en gradvis overgang.

Offline-editorens Designmønstre og web-showcasen viser samme tolv eksempler: panel med træk og sammenklapning, objekteditor med kontekstpanel, parametrisk værksted, opskriftseditor med lag, formular med validering, liste med detaljevisning, ressourcebibliotek, fortryd/gentag, header/navigation, hero, footer og billedgalleri. De bruger bibliotekets eksisterende roller og det valgte tema. Kilde, version, formål, komponenter og interaktioner findes i patterns/catalog.mjs; implementering og layout findes i patterns/compositions.mjs, de enkelte mønstermoduler og patterns/styles.css. PATTERN_FILES i kataloget er den fælles liste til referenceeksport og showcase.

`mountResizablePanel` fra `patterns/resizable-panel.mjs` er referenceeksemplet til `mountPanelControls`, som eksporteres fra runtime. Controlleren forbindes med `{container, panel, handle, toggle, width, minimum, maximum, open, side, onChange}`. Værten bruger `ds-panel-layout` med børnene `ds-panel-content`, `ds-panel-resize`, `ds-panel-side` og en native toggleknap. `side` er `right` som standard og kan sættes til `left` for at spejle placering, trækretning og piletaster. `onChange({width,open})` giver produktet mulighed for at bevare tilstanden. `setOpen(boolean)`, `setWidth(number)` og `destroy()` styrer livscyklussen.

Tilføj `collapsible:true` for at lade trækket fortsætte fra minimumsbredden til en lukkezone; lukning udføres ved slip. `collapseThreshold` er som standard den mindste af 64 px og halvdelen af minimumsbredden og skal ligge mellem nul og minimumsbredden. Toggleknappen fungerer også som kantgreb til genåbning. Escape og pointerannullering genskaber den tidligere bredde; separatorens piletaster, Home/End og Enter giver tastaturalternativer. Smalle eller lave flader bruger stablet indhold og almindelig knapbetjening. Produktet ejer indhold og kladder; controlleren bevarer panelnoden og håndterer fokus og reduceret bevægelse. Komponenter og mønstre uden illustration deler placeholderen fra `core/catalog-placeholder.mjs`; mønstre angiver `illustration:false` i kataloget.

`mountCompositionGallery` viser en kortvælger med native knapper og et aktivt eksempel. Valg bevarer de enkelte kladder; relaterede mønstre flytter fokus til den nye titel og bringer det tilhørende kort frem i vælgeren. `createPatternIllustrator` i `patterns/illustrations.mjs` bygger dekorative, statiske SVG'er fra fire lokale familiemoduler. De deler kun native SVG-primitiver; hver familie ejer sin geometri og materialebehandling. Illustrationsstilen vælges gennem `theme.graphics.family`, mens det opløste tema leverer grafikfarver og materialeværdier. Hele sæt af illustrationsmoduler følger med `examples`-eksporten. Se [grafikstandarden](GRAPHICS-AUTHORING.md).

Katalogets layoutprofil vælger en af bibliotekets fælles breddeprofiler. Profilerne vælges efter indholdets rolle og kan tilpasses i produktet. Objektkort og handlinger strækkes ikke med en bredere arbejdsflade. Se [retningslinjerne for indholdsbredde](DESIGN-FOUNDATIONS.md#indholdsbredde-og-fuld-bredde).

Objekteditoren er tilpasset fra FormLabs object-panel.js, ui.js og ui.css, gennemgået 27. oktober 2026. Den genbruger hierarkisk søgning med midlertidig åbning af matchende forældre, multivalg, gruppehandlinger for synlighed/låsning, kontekst, faner og bevarede foldesektioner. Gruppens lås beskytter også underobjekter; rækkehandlinger bevarer valget. Flytning er tilgængelig gennem Handlinger, så træk ikke er nødvendigt. Ved forskellige mål viser panelet en tom blandet værdi; tomt input bevarer de enkelte mål, mens en indtastet værdi gælder hele udvalget. Native faneroller har piletaster, Home/End og én tabstop-position.

Den neutrale objektmodel og arbejdsflade er implementeret særskilt i Design Studio. FormLabs geometri, bygningskommandoer, materialer og projektdata følger ikke med. Det oprindelige projekt ændres ikke ved at tilpasse mønstret. Kildens navn, relevante filer og afgrænsning vises under Genbrug og sammensætning.

Fra systemmappen kan referencekoden kopieres til et tilknyttet produkt:

~~~sh
node tools/cli.mjs examples "PROJECT_DIR"
~~~

Kommandoen opretter design/patterns uden at overskrive eksisterende filer. Kopierne bruger produktets design/runtime. De er valgfrie og ejes efter kopiering af produktet; sync og update ændrer dem ikke. Indlæs design/patterns/styles.css i produktets build og brug hele eksemplet eller kun de relevante dele.

I offline-startprojektets `tools/build.mjs` tilføjes mønstrenes stylesheet til de CSS-filer, som buildet allerede læser og indlejrer. Medtag også filen i listen til `buildStamp`, så doctor kan opdage senere CSS-ændringer:

```js
const patternCSS = await readFile(path.join(root, 'design/patterns/styles.css'), 'utf8');
// Kombinér med themeCSS og appCSS før det eksisterende </style-escape:
const cssSource = themeCSS + '\n' + patternCSS + '\n' + appCSS;
// Tilføj 'design/patterns/styles.css' til buildStamp(root, inputFiles).
```

Tilpas det eksisterende build frem for at oprette en ekstra byggeproces. Importér mønstrenes JavaScript fra `src/app.mjs` som øvrige runtime-moduler; bundleren indlejrer det. Tilpas eksempeltekster og gemmefeedback til produktet, og forbind produktets egne filer gennem `createProjectFile`.

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

Id'er er editor, form, list-detail, resource-library, history, site-header, hero, site-footer og image-gallery. Tilstanden kan beholdes ved afmontering og genbruges ved temaskift. Brug forskellige idPrefix-værdier ved flere instanser. Formularens gemning og handlingernes ændringer gælder kun den leverede state i hukommelsen. Eksemplerne har ikke en server, en 3D-motor eller produktets forretningslogik.

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

## Lyse og mørke farvetilstande

Temaer kan også tilbyde navngivne farvevariationer. Byg pickerens valg med `themeModeOptions(source)` fra komponentruntime eller `theme-modes.mjs`, og send det valgte id til `resolveThemeMode`. `hasNamedThemeModes(source)` skelner navngivne variationer fra det traditionelle lys/mørk-valg. Produktet ejer og bevarer det valgte id; `createColorModePreference` gælder fortsat OS-valget mellem lys og mørk. Brug tilstandens `colorScheme` til native kontroller. Bauhaus har tre lyse variationer og den mørke Værkstedsnat. Formatet kræver ikke begge lysheder; den offentlige samling tilbyder dem i hvert tema. Se [temaformatet](PACKAGE-FORMAT.md#farvetilstande-og-navngivne-farvevariationer).

Parrede temaer bruger det valgfrie format 2-felt `modes` med light/dark-tokenoverrides og `defaultMode`. Gem hele kilden. Opret en valgt læsemodel med `resolveThemeMode`, og brug den samme model til både CSS og komponenter:

```js
// Eksempel fra produktets src/app.mjs.
import source from '../design/design.json';
import { generateCSS } from '../design/runtime/engine.mjs';
import { resolveThemeMode, createColorModePreference } from '../design/runtime/components.mjs';

const preference = createColorModePreference({
  key: 'my-product.color-mode',
  onChange: () => render(),
});
function render() {
  const theme = resolveThemeMode(source, preference.value, preference.resolved);
  style.textContent = generateCSS(theme);
  // Produktet rydder tidligere controllere og renderer med samme bevarede state.
  renderProduct(theme, productState);
}
render();
picker.addEventListener('change', event => preference.set(event.target.value));
// Ved afmontering af denne præference: preference.destroy();
```

`style`, `picker`, `productState` og `renderProduct` tilhører produktet. Pickerens værdier er `system`, `light` og `dark`. `preference.value` er valget, mens `preference.resolved` er den aktuelt ønskede light/dark-fremtoning. Gemte manuelle valg har forrang for OS-ændringer; systemvalget følger `prefers-color-scheme`. `onChange(resolved, preference)` kaldes ved eksplicit valg og relevante OS-ændringer, ikke under oprettelsen. Lageradgang er valgfri og kan afvises i private eller file-kontekster uden at stoppe appen. `destroy()` fjerner OS-lytteren.

En gammel enkeltstående pakke beholder sin egen fremtoning. `resolveThemeMode` tilføjer ikke modes eller ændrer kilden. Ved parrede temaer redigeres en semantisk modeoverride i den aktive modes `tokens`; en ændring alene i grundtokens erstatter ikke en eksisterende override. Primitive paletteændringer kan deles mellem tilstandene gennem deres semantiske aliases.

### Fælles temavælger

Brug mønstret **Stade tema** (`theme-picker`) til et temavalg øverst til højre. Det samler Stades mærke, en knap, en popover og native felter til **Tema** og **Farve**. Montér `mountThemePicker(theme, {preferences, idPrefix})` fra `patterns/theme-picker.mjs`. I projekter med de eksporterede mønstre ligger filen i `design/patterns/`.

`preferences` leverer `themeOptions` som par af id og navn, de aktuelle `id` og `mode`, `modes()` for det aktuelle temas farver samt `set(id, mode)`. Produktet anvender temaet og gemmer valget. Indsæt mønstrets `element` i det aktive designscope. Brug `open()` til genveje og `destroy()` ved afmontering. Bevar samme instans, når temaets CSS udskiftes, så fokus og det åbne panel bevares.

## Fælles ikoner

Tabler Icons 3.50.0 leveres som et fast lokalt SVG-udvalg fra `core/icons.mjs`. `createIcon`, `renderIcon`, `ICON_NAMES` og `TABLER_VERSION` eksporteres gennem komponentruntime. Et ikonnavn skal findes i registret; vilkårlig SVG eller HTML indlæses ikke som ikondefinition.

```js
const save = createComponent(theme, 'button', {
  text: 'Gem ændringer', iconName: 'device-floppy', variant: 'primary',
});
const close = createComponent(theme, 'action-button', {
  variant: 'icon-only', label: 'Luk', iconName: 'x',
});
```

`iconName` bruges på button, action-button, menu-item, tag og segmented-option. `iconSize` er small, medium eller large med fælles standarder på 16, 20 og 24 px. Træets items og rækkehandlinger samt datatabellens rækkehandlinger kan også have `iconName`. Ældre `icon`-tekst og godkendte `iconAssetId`-ressourcer er kompatible alternativer; vælg én kilde pr. ikon.

SVG følger `currentColor`, klikfladen tilhører kontrollen, og dekorative kontrolikoner er skjult for hjælpemidler. Ved et selvstændigt meningsbærende ikon bruges `createIcon(name, {label})`; ellers er det dekorativt. Outline er standard med 24 × 24-geometri og stregtykkelse 2. Filled bruges kun ved en konsekvent betydning. Native kontrollernes markører og produktets godkendte logo-originaler bevares. MIT-licensen skal følge med distribuerede kopier; der kræves ingen ikonfont, CDN eller frameworkpakke i produktets runtime.

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

Formularfelter bruger label, hint, error og idPrefix. Biblioteket forbinder for/id og aria-describedby og bevarer ekstra henvisninger fra kontrollens attrs. Controls bevarer native type, disabled og checked; textarea får tekstværdien som indhold. Lad produktet håndtere værdier, events og state. `createComponentFactory(theme, {document})` opretter flere native komponenter fra ét valideret temasnapshot og bruger samme API som `createComponent`.

Gem dokumentdata, kladder, viste fejl, valg og relevant gemmefeedback i produktets state før genmontering, eksempelvis ved temaskift. En gemt-bekræftelse skal fjernes, når brugeren redigerer igen. Formularreferencen bevarer fejl og gemmefeedback mellem temaer; arbejdsfladen genvaliderer de kladder, som brugeren allerede har forsøgt at gemme. Almindelig tekst ombryder også lange, ubrudte referencer; produktet skal stadig afprøve sit faktiske indhold ved smal bredde.

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

`size` er `small` (32 px), `medium` (44 px, standard) eller `large` (48 px). `intent: 'danger'` kan kombineres med primary, tertiary og ghost; secondary bruges til neutrale ledsagehandlinger. Uden sideikon er teksten centreret med symmetrisk padding og indholdsbestemt bredde. `iconName` vælger et fælles Tabler-sideikon; `iconOnly: true` kræver både ikon og et tilgængeligt navn gennem `label` eller `aria-label`.

~~~js
const action = createComponent(theme, 'button', {
  text: 'Gem ændringer', variant: 'primary', size: 'medium',
});
const destination = createComponent(theme, 'button', {
  text: 'Udforsk samlingen', href: '#samling',
  variant: 'primary', size: 'large', iconName: 'arrow-right',
});
const remove = createComponent(theme, 'button', {
  text: 'Slet', variant: 'tertiary', intent: 'danger',
});
~~~

Med `href` bliver elementet et native `a`; uden er det en native `button`. Knaplignende links får knappens tilstande uden tekstunderstregning ved hover. Løbende tekstnavigation bruger `link`, og websitenavigation bruger `navigation` med navngivet `nav` og `aria-current` på det aktuelle link. Programmets menuer bruger fortsat `menubar`, `menu` og `menu-item`.

`loading: true` viser aktivitet og deaktiverer handlingen. Et deaktiveret eller arbejdende navigationslink får ikke et aktivt `href`. Produktet ejer arbejde, state og genaktivering. Historiske knapvarianter som desktop, rounded og danger understøttes fortsat af runtime, men vises ikke som den nye knapfamilie i Studio. Brug `buttonVariantIds(component)` fra library.mjs ved et katalog over de fire offentlige varianter; `getComponents(theme)` indeholder også kompatibilitetsopskrifter.

`action-button` bruger `variant` til opbygning (`horizontal`, `vertical`, `tool`, `icon-only`) og `emphasis` til de samme fire fremhævelser. `size` og `intent` er uafhængige af opbygningen. `loading` deaktiverer også handlingsknappen og bevarer dens navn. `pressed` angiver en vedvarende toggle og kan kombineres med `disabled` og `loading`.

`tag` og `segmented-option` understøtter `iconName` og `pressed`; produktet håndterer klik og opdaterer valget. Navngiv `toolbar` og `segmented-control` med `label`. Brug `segmented-control` med `variant: 'wrap'` til længere labels. Produktet ejer handlinger og valglogik.

### Designkontrakt og websiteindhold

Knapper følger et hierarki inspireret af Carbon: primary er hovedhandlingen, secondary er en solid neutral ledsager, tertiary er en indrammet handling, og ghost er supplerende. Fremhævelse, størrelse, destruktiv betydning og ikonbrug er særskilte valg. Et sideikon begrunder plads mellem label og ikon; uden sideikon centreres teksten med symmetrisk padding. Knaplignende navigation bruger native links med samme fremtoning, mens tekstlinks beholder linkrollens understregning. Dette er Design Studios eget API; det kopierer ikke Carbons komponentkode.

Secondary bruger inverse grundfarver og egne hover-/active-flade- og tekstpar under color.action.secondaryHover/Active. Destruktiv betydning er et intent på primary, tertiary eller ghost. Historiske variantnavne kan stadig læses og renderes, men er adskilt fra det offentlige katalog. Se integrationsguiden for API og migration i ny kode.

Link, navigation og image er selvstændige biblioteksroller; header, hero, footer og galleri er sammensætninger af dem og eksisterende roller. Native navigation og menusemantik holdes adskilt. Eksempelillustrationer bruger temaets semantiske flader, primærfarve og brandaccent. Produktets egne billeder og alternative tekster er produktindhold.

## Faner og native navigation

`tabs` leverer forbundne tab-/panel-id'er, én valgt fane og ét synligt panel. Angiv `items` med entydige, stabile `id`, en ikke-tom `label`, valgfri `disabled` og `content`. Indhold følger slotkontrakten: tekst, deklarative noder eller fælles komponenter. `selectedId` vælger den første aktive fane; uden bruges første tilgængelige fane. Et ukendt `selectedId` afvises ved komponentoprettelse. `orientation: 'vertical'` vælger både lodret opbygning og tastaturretning; standarden er én vandret række, hvor fanerne deler bredden og kan rulles ved pladsmangel. Vælg `variant: 'wrap'` for faner med indholdsbestemt bredde og ombrydning til flere rækker. Brug `idPrefix`, når produktet har brug for genkendelige relationer.

```js
import {createComponent,mountTabs} from './design/runtime/components.mjs';

const view=createComponent(theme,'tabs',{
  idPrefix:'document',label:'Dokumentets indhold',selectedId:state.tab,
  items:[
    {id:'overview',label:'Overblik',content:'Dokumentets vigtigste oplysninger.'},
    {id:'notes',label:'Noter',content:[
      {component:'field',options:{idPrefix:'document-notes',label:'Mine noter',value:state.notes}},
    ]},
  ],
},{document});
host.append(view);
const tabs=mountTabs(view,{
  selectedId:state.tab,
  activation:'automatic',
  onChange(id,{previousId,tab,panel,event}){state.tab=id;},
});
// Produktet forbinder feltets input med state.notes.
// Ved ekstern ændring af valg eller eksisterende markup:
// tabs.update({selectedId:state.tab});
// Ved afmontering: tabs.destroy();
```

Controlleren bruger venstre/højre eller op/ned, Home/End og Enter/Mellemrum. Den springer deaktiverede faner over og bevarer Tab til indholdet. Vandrette faner understøtter højre-mod-venstre-retning. `activation: 'automatic'` aktiverer ved fokus og kræver indhold uden ventetid; `'manual'` flytter fokus med pile og aktiverer med Enter/Mellemrum eller klik. `update({selectedId,orientation,activation,onChange})` genlæser de eksisterende relationer. `selectedId` på controlleren viser det faktiske valg, eller `null`, når alle faner er deaktiveret. Skift erstatter ingen paneler eller native kontroller og bevarer dermed kladder og lokal rulning. Produktet ejer data, lagring og udskiftning af indhold.

`mountTabs` kan også forbinde eksisterende native markup med én `role="tablist"`, unikke `role="tab"`-knapper og ét `role="tabpanel"` pr. fane. `aria-controls` og `aria-labelledby` skal være gensidige; `data-tab-id` giver produktets stabile id. Objekteditoren og arbejdsrummet bruger denne fælles controller sammen med deres eksisterende kortlayout. Bevar native knapper og fjern eventuel tidligere lokal tastaturlogik.

`accordion` bruger browserens `details`/`summary`, også til en enkelt disclosure. Angiv `items: [{label,content,open}]` og eventuelt et gruppenavn gennem `label`. Browseren styrer Enter/Mellemrum samt åbning og lukning. Produktet kan gemme foldestatus fra `toggle`/`details.open`. `disabled` afvises, fordi native details ingen sådan tilstand har; utilgængelige oplysninger skal have et særskilt produktvalg.

`breadcrumb` og `pagination` bruger navngivet `nav`, en ordnet liste og native links. Begge tager `label` og `items: [{label,href,current,disabled}]`. Ét aktuelt led får `aria-current="page"`; brødkrummer vælger ellers automatisk sidste led. Uden `href` eller med `disabled: true` bliver et led til tekst uden tabstop eller aktiv destination. Skilletegn i brødkrummer er dekorative. Produktet ejer adresser, sidetal, udeladelser og datalæsning; der er ingen ekstra navigationscontroller.

### Semantik og bevaret kladde

Tabs bruger gensidige tab-/panelrelationer, ét aktivt tabstop og automatisk eller manuel aktivering. Paneler og deres kladder bevares. Accordion bruger native `details`/`summary`; brødkrummer og paginering bruger native links. Det fælles fanemønster følger [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Datatabeller

`data-table` er en native `table` med caption, kolonneoverskrifter og valgfri rækkeoverskrift. Den bruger almindelig Tab-navigation og native knapper/valg; den har ingen grid-rolle eller lokal celleredigering. En navngivet, fokuserbar viewport afgrænser vandret scrolling, så brede data ikke gør hele siden bredere.

```js
import {createComponent,mountDataTable} from './design/runtime/components.mjs';

const view=createComponent(theme,'data-table',{
  idPrefix:'collections',label:'Samlinger',
  columns:[
    {id:'name',label:'Navn',sortable:true},
    {id:'status',label:'Status'},
  ],
  rows:[
    {id:'coast',label:'Kysten',cells:{name:'Kysten',status:'Klar'},
      detail:'Supplerende oplysninger.',actions:[{id:'open',label:'Åbn'}]},
  ],
  selection:'multiple',selectedIds:state.selectedIds,
  expandedIds:state.expandedIds,sort:state.sort,
},{document});
host.append(view);
const table=mountDataTable(view,{
  onSort(next){requestSortFromProduct(next);},
  onSelectionChange(ids){state.selectedIds=ids;},
  onExpand(ids){state.expandedIds=ids;},
  onAction(rowId,actionId){openRecord(rowId,actionId);},
});
// Efter produktet har opdateret den faktiske rækkefølge:
// table.update({sort:state.sort});
// Ved afmontering: table.destroy();
```

`columns` har entydige tekst-id'er, `label`, valgfri `sortable` og `rowHeader`. Første datakolonne er som standard rækkeoverskrift; sæt `rowHeader:false` dér for at fravælge det. `rows` har stabile tekst-id'er og `cells` efter kolonne-id. Celle- og detailindhold accepterer escaped tekst eller samme deklarative noder som slots. Rækkeværdier kan også ligge direkte på rækken efter kolonne-id. Brug `label` på rækken til tydelige valg-/handlingsnavne, især når første celle indeholder andet end tekst. `actions` har lokale `id`, `label` og valgfri `disabled`/`iconName`; `detail` tilføjer en ekspansionsknap med `aria-controls` og korrekt `colspan`.

`selection` er `'none'`, `'single'` eller `'multiple'`; med egne data er standarden `'none'`. Single bruger en native radiogruppe. Multiple bruger checkbokse og vælg alle for sidens tilgængelige rækker. Blandede valg giver den native indeterminate-tilstand og `aria-checked="mixed"`. `row.disabled` udelukker rækken fra valg og handlinger. Valg fra andre sider bevares i `selectedIds`; vælg alle ændrer kun de synlige tilgængelige rækker. Controlleren opdaterer valg og ekspansion på eksisterende noder og giver kopier til produktets callbacks og gennem `selectedIds`/`expandedIds`-getters.

`onSort({columnId,direction},{event})` anmoder om stigende eller faldende sortering. Controlleren sorterer ingen produktdata og sætter ikke en misvisende `aria-sort` før produktets opdatering. Produktet ejer `requestSortFromProduct`, data, eventuel serverforespørgsel og selve rækkefølgen; commit med `table.update({sort:{columnId,direction}})`, eller `sort:null` for at fjerne sorteringsangivelsen. Genbrug rækker og eventuelle tilhørende detailrækker ved flytning. Controlleren bevarer valg og fokus på eksisterende kontroller; et fuldt genbygget indhold kræver, at produktet også bevarer sine kladder.

`update({selectedIds,expandedIds,sort,...callbacks})` genlæser den aktuelle markup uden at genskabe den. `onSelectionChange(ids,{rowId,all,event})`, `onExpand(ids,{rowId,expanded,event})` og `onAction(rowId,actionId,{event})` forbinder produktets state og kommandoer. `destroy()` fjerner lyttere. Brug en stabil host eller genmontér efter udskiftning af selve roden.

`status` er `'ready'`, `'loading'`, `'error'` eller `'empty'`. Loading genbruger spinner og `aria-busy`; error genbruger alert; empty genbruger empty-state. `message` giver produktets forklaring. Loading/error kan bevare tidligere rækker som læsbart indhold med deaktiverede kontroller; empty viser ingen datarækker. `pagination` tager den eksisterende pagination-roles options. Produktet ejer destinationer, totaler, hentning og genforsøg. Et levende eksempel med sortering, valg, rækkehandlinger og bevarede detailfelter findes i `studio/data-table-example.mjs`.

### Valg af tabelrolle

Brug `data-table` til læsning med sortering, valg, rækkehandlinger og detaljer. Native tabeloverskrifter og almindelig Tab-navigation bevares; sortering anmodes hos produktet og bekræftes først, når data er opdateret. Brug `data-grid` ved egentlig celleredigering med et samlet tastaturforløb. At flytte aktiv celle er noget andet end at markere data; fokus og markering vises og rapporteres særskilt.

## Redigerbart datagrid

`data-grid` bruges til egentlig celleredigering. Opret komponenten med `label`, `columns` og `rows`, og giv samme data til `mountDataGrid`. Controlleren aflæser ikke datamodellen fra de viste tekstceller. Den arbejder på en kopi af rækker/celleværdier; produktet ejer dokumentet, fortryd, lagring og eventuelle serverkald.

```js
import {createComponent,mountDataGrid} from './design/runtime/components.mjs';

const options={label:'Projektets poster',columns:[
  {id:'name',label:'Navn',editable:true,required:true},
  {id:'quantity',label:'Antal',type:'number',editable:true,min:0,step:1},
],rows:state.rows};
const view=createComponent(theme,'data-grid',options,{document});
host.append(view);
const grid=mountDataGrid(view,{
  ...options,
  validateCell(value,{column,row,rows}){
    if(column.id==='name'&&rows.some(other=>other.id!==row.id&&other.cells.name===value))
      return 'Navnet skal være entydigt.';
    return true;
  },
  onCommit(changes,{rows,reason}){
    state.rows=rows;
    state.dirty=true;
    // Produktets normale gemme-/fortrydforløb håndterer derefter state.
  },
});
```

Kolonner har entydigt `id`, ikke-tom `label`, valgfri `editable:true` og `type: 'text'|'number'|'select'|'textarea'` (standard text). Number bruger `min`, `max` og positiv `step`; input valideres med punktum som decimaltegn og accepteres som et tal. Select bruger `options: [{value,label,disabled?}]`. `required` afviser en tom værdi. Rækker har stabile `id`, valgfri `label`, `disabled`/`readOnly` og `cells: {columnId: value}` med tekst, tal eller boolean. `readOnly` og `disabled` på gridet eller rækken blokerer redigering; cellerne kan stadig læses og fokuseres. En kolonne er kun redigerbar med `editable:true`.

Navigation og markering er særskilte. Pile og Home/End flytter den aktive celle uden at ændre den vedvarende markering; Ctrl/Meta+Home/End går til gridets begyndelse/slutning. Klik markerer én celle; Shift+klik eller Shift+pile udvider et rektangel. Mellemrum markerer aktiv celle, Shift+Mellemrum rækken og Ctrl/Meta+Mellemrum kolonnen. Ctrl/Meta+A markerer alle celler. Escape rydder markeringen, når der ikke redigeres. `onActiveCellChange(cell)` og `onSelectionChange(selection)` rapporterer hver sin tilstand.

Enter, F2, dobbeltklik eller almindelig tekstindtastning starter en native editor. Enter anvender kladden; Shift+Enter giver linjeskift i en flerlinjeeditor. Tab/Shift+Tab anvender først kladden og går videre i cellerækkefølgen; ved gridets ender fortsætter native Tab-navigation. Escape annullerer uden at ændre arbejdskopien. Ugyldige værdier beholder kladden og fejlen. At forlade gridet forsøger en anvendelse uden at flytte fokus tilbage ved en fejl.

`validateCell(value, {rowId,columnId,previousValue,row,column,rows})` er synkron og skal være uden bivirkninger. `value` er typekonverteret, og `rows`/`row` viser den foreslåede samlede ændring. `false`, en ikke-tom fejltekst eller en kastet fejl afviser ændringen; `true` eller ingen returværdi accepterer. En Promise afvises. `onCommit(changes, {reason,rows})` kaldes efter accept med `reason: 'edit'|'paste'` og ændringer med `rowId`, `columnId`, `value` og `previousValue`. Callbacken er ikke et veto eller en gemmebekræftelse: en fejl i produktets callback ruller ikke den accepterede arbejdskopi tilbage. Overfør data til produktets state synkront og håndtér asynkron lagring i produktets eget forløb.

Kopiering giver rektangulær TSV med citerede felter for tabs, linjeskift, citationstegn og tomme værdier. `paste(text)` starter ved markeringens øverste venstre celle eller den aktive celle. Der indsættes højst 10.000 celler i et eksisterende rektangulært område. Format, grænser, redigerbarhed, typer og alle valideringer kontrolleres før mutation; én fejl afviser hele indsættelsen og udløser intet `onCommit`. Mens en editor er aktiv, bruger Ctrl/Meta+C/V dens native tekstfunktion; gridets `paste` kræver først afslutning eller annullering af kladden. `parseGridTSV` og `serializeGridTSV` eksporteres også gennem komponentruntime.

| Controller-API | Betydning |
| --- | --- |
| `activeCell`, `selection`, `draft`, `rows` | Kopier af aktiv `{rowId,columnId}`, markering eller `null`, aktiv kladde eller `null` og accepterede arbejdsrækker. Markeringen indeholder `start`, `end`, `top`, `bottom`, `left`, `right`. Kladden indeholder `rowId`, `columnId`, `value`, `original`, `error`. |
| `startEdit(cell?, initialText?)` | Starter redigering af angivet eller aktiv celle; returnerer en boolean. |
| `commitEdit({restoreFocus:true}?)`, `cancelEdit({restoreFocus:true}?)` | Anvender eller annullerer kladden; returnerer en boolean. |
| `copySelection()`, `paste(text)` | Giver TSV fra accepterede celleværdier henholdsvis accepterer/afviser en indsættelse med en boolean. |
| `clearSelection()` | Rydder markeringen uden at ændre fokus eller data; returnerer en boolean. |
| `update(next)` | Opdaterer data, kolonneopsætning, callbacks eller `activeCell` med genbrug af stabile række-/cellenoder. Returnerer `false` ved en beskyttet kladdekonflikt; ugyldig konfiguration kaster en fejl. |
| `destroy()` | Fjerner lyttere; gemmer eller anvender ikke automatisk kladden. |

`onDraftChange(draft)` varsler redigeringens start og indtastning. Læs altid den aktuelle `draft`, før en visning erstattes. `update` afviser fjernelse af den aktive kladdes række/kolonne, ændring af dens `type`, `min`, `max`, `step`, `required` eller `options` og ændringer, der gør cellen utilgængelig for redigering. Editor, kladde og tidligere konfiguration bevares ved `false`. Andre opdateringer genbruger noder og bevarer editorens tekstmarkering og lokal rulning. Ændres den aktive celles accepterede værdi eksternt, bevares kladden med en konfliktfejl, og commit afvises, indtil produktet eller brugeren afklarer konflikten. Annullering viser da den nye eksterne værdi. Bevar arbejdskopi og kladde bevidst ved genmontering; de er ikke automatisk gemte projektdata.

### Validering og lagringsansvar

En grid-editor har en kladde, som bevares ved fejl, og kan annulleres uden at ændre arbejdskopien. Synkron validering afsluttes for hele den foreslåede ændring, før celler accepteres. TSV-indsættelse er atomisk: ukendt format, låste celler, områdeoverskridelse eller en ugyldig værdi afviser hele indsættelsen. Produktets data og lagring er et separat ansvar; et accepteret grid-commit er ikke en gemt fil eller serverbekræftelse. Se [den præcise grid-kontrakt](INTEGRATION.md#redigerbart-datagrid).

## Kommandomenuer

`menubar`, `menu` og `menu-item` leverer fælles markup. Forbind dem med `mountMenuControls` fra runtime. Roden skal indeholde udløsere og menupaneler; hver udløser har `aria-haspopup="menu"` og `aria-controls` med menuens entydige id. Menuer bruger `role="menu"`; en topmenu bruger native knapper med `role="menuitem"` under `role="menubar"`. En selvstændig menuknap beholder knaprollen. Brug tydelige tilgængelige navne.

```js
import { createComponent, mountMenuControls } from './design/runtime/components.mjs';

const root = document.createElement('div');
const trigger = createComponent(theme, 'button', {
  text: 'Handlinger',
  attrs: { 'aria-haspopup': 'menu', 'aria-controls': 'document-menu' },
});
const menu = createComponent(theme, 'menu', {
  attrs: { id: 'document-menu', 'aria-label': 'Dokumenthandlinger', hidden: true },
  slots: { root: [
    { component: 'menu-item', options: {
      slots: { label: 'Gem dokument' }, attrs: { 'data-command': 'save' },
    } },
  ] },
});
root.append(trigger, menu);
host.append(root); // host ligger under ds-scope. Produktets layout placerer menuen.
const controls = mountMenuControls(root, {
  onAction(item, event) {
    if (item.getAttribute('data-command') === 'save') saveDocument(event);
  },
});
// Ved udskiftning af markup eller afmontering:
// controls.destroy();
```

Controlleren leverer pile, Home/End, typeahead, Enter/Space, Escape med fokusretur, Tab ud af menukæden og lukning ved klik eller fokus udenfor. Den understøtter en vandret menulinje, selvstændige menuknapper og ét underniveau. `open(trigger, {last: true})` åbner programmatisk med sidste punkt; `close()` lukker og returnerer fokus; `destroy()` lukker og fjerner lyttere. Genmontér efter udskiftning af markup.

Brug `aria-disabled="true"` til utilgængelige punkter: de kan fokuseres med pile, men udføres ikke. Produktet ejer kommandoer, placering, eventuelle genveje og checkbox/radio-state med synlige markører og `aria-checked`. Menukæden lukkes før `onAction`, så en kommando kan åbne en dialog og placere fokus dér. Et selvstændigt, interaktivt eksempel findes i `studio/menu-example.mjs` og i editorens menulinjekatalog.

### Semantik og kompakte varianter

Menulinje (`menubar`), kommandomenu (`menu`) og menupunkt (`menu-item`) følger [WAI-ARIA APG Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). Biblioteket leverer native knapper, roller, dele og visuelle tilstande samt `mountMenuControls` til fokus og åbning/lukning. Produktet forbinder udløsere og menuer gennem `aria-controls` og ejer placering, kommandoer og data. Brug pile mellem topmenuer og menupunkter, Home/End og typeahead. Enter/Ned åbner menuen, Escape lukker det inderste niveau og returnerer fokus, og Tab forlader menukæden. Checkbox/radio bruger aria-checked; produktet opdaterer valg og synlige markører. Undermenuer bruger aria-haspopup og aria-expanded. Deaktiverede punkter forklares og kan fokuseres med pile, men må ikke aktiveres. Formularfelter hører til i en popover eller dialog. Vis kun implementerede genveje. Se [menuintegration](INTEGRATION.md#kommandomenuer).

Desktopvarianterne til button, input, select, toolbar og segmented-option er eksplicitte valg til tætte desktopværktøjer. De genbruger temaets semantiske tokens, 32 px kontrolhøjde og den fælles fokusmarkering. Disse standardvarianter bevarer deres eksisterende større mål. Tree bruger som standard det kompakte hierarki med 32 px rækker og tæt indrykning; roomy bevarer de større 44 px klikflader og tekstombrydning, mens desktop er et kompatibelt eksplicit valg af den kompakte præsentation. Handlingsknappens tool-variant har symbol over en kort 13 px label og mindst 52 px samlet klikflade. Brug større mål ved touch eller behov for større klikflader. Menuernes katalog beskriver anvendelse, grupper, destruktive handlinger og højst ét undermenuniveau. Produktspecifikke værktøjslinjer og inspektørlayout bliver i produktet.

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

Illustrationsforløb er en særskilt rolle med `duration.illustration` og den fælles `mountGraphicMotion`. En betroet `createPlan(svg, motif)`-funktion kan levere et nyt begrebs forløb uden at registrere en komponentrolle; playeren ejer stadig afspilning, reduceret bevægelse og oprydning. Planen er almindelig kildekode, ikke JavaScript i temadata. Se [authoring-API'et og familieprofilerne](GRAPHICS-AUTHORING.md#en-plan-på-den-fælles-afspiller).

### Bevægelsens sluttilstand

Den fælles standard i core/motion.mjs bruger 240 ms, hurtig start og rolig afslutning uden ekstra forsinkelse. Åbning og tilbagevenden har samme timing. Samtidige ændringer afløser ikke hinanden med ventetid; reduceret bevægelse viser slutlayoutet straks.

## Hierarkisk indhold med tree

Brug `tree` til navngivne objekter med børn og få handlinger pr. række. Den interaktive runtime importeres som `mountTree` fra `design/runtime/components.mjs`; katalogets deklarative preview er ikke en interaktiv produktintegration.

~~~js
import { mountTree } from './design/runtime/components.mjs';

let expandedIds = ['collection'];
const tree = mountTree(theme, host, {
  label: 'Indhold',
  items: [{ id: 'collection', label: 'Samling', children: [
    { id: 'item-a', label: 'Element A', iconName: 'file-text', meta: 'Kladde',
      actions: [{ id: 'visibility', label: 'Synlig', iconName: 'eye', pressed: true }] },
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

Et item har `id`, `label` og valgfrie `iconName`, `meta`, `badge`, `children`, `actions`, `disabled`, `draggable` og `dropTarget`. En rækkehandling har `id`, en forståelig `label` samt valgfrie `iconName`, `pressed` og `disabled`; symboler erstatter ikke handlingsnavne. Ældre `icon`-tekst understøttes fortsat. `dropTarget` er en boolean eller `{ inside, before, after }`. Options omfatter også `multiSelect` (standard `true`) og `variant` (standard `default`). Standardtræet har 32 px rækker, 24 px foldningsfelt, tæt indrykning og afkortning af lange navne. Brug `roomy` til de større 44 px klikflader og ombrudte navne. `desktop` bevares som eksplicit kompakt variant.

| Callback | Foreslået ændring og kontekst |
| --- | --- |
| `onSelect(ids, detail)` | Nyt valg; `detail` indeholder `id`, `item`, `event`, `toggle` og `range`. |
| `onToggle(id, expanded, detail)` | Åben/luk; kontekst er `{ item, event }`. |
| `onAction(id, actionId, detail)` | Aktivér rækkehandling; kontekst er `{ item, event }`. |
| `onMove(sourceIds, targetId, detail)` | Flyt til `position: 'inside'`, `'before'` eller `'after'`; `event` følger med. |
| `onContextMenu(id, detail)` | Produktets menu; kontekst er `{ item, event, selectedIds }`. |

Callbacks foreslår handlinger; de ændrer ikke produktets data. Produktet validerer flytning og valg, opdaterer tilstanden og sender resultatet tilbage med `update`. Det ejer også kontekstmenu, fortryd og en klik-/tastaturbetjent flyttehandling, når drag-and-drop bruges. En tastaturgenvej alene erstatter ikke et klikbart alternativ til træk. Se [WCAG 2.2 om dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

Pil op/ned og Home/End flytter kun rækkefokus; højre/venstre åbner, lukker eller navigerer mellem forælder og barn. Bogstaver søger efter rækkenavne med en buffer på 700 ms. Enter vælger rækken, mens Space skifter dens valgtilstand ved multivalg. Normalt klik erstatter valget, Ctrl/Meta-klik skifter en række, og Shift-klik eller Shift+pil op/ned foreslår et interval. `item.disabled` blokerer valg og træk, men ikke foldning eller særskilt aktiverede handlinger. Sådanne rækker kan fortsat få fokus; kun disabled-blade uden aktive handlinger springes over. `action.disabled` styrer den enkelte knap. Tab når den fokuserede rækkes native handlingsknapper; Enter/Space aktiverer knappen. ContextMenu eller Shift+F10 åbner produktets kontekstmenu. Fokus og vedvarende valg skal kunne skelnes. Se [semantik og rækkehandlinger](#semantik-og-rækkehandlinger) for kilder og afgrænsning.

Træet ejer sin indrykning, rækkeanatomi og fokus. Brug eksisterende `scroll-area` til lange træer og produktets shell til placering og maksimal højde. Brede redigerbare kolonner hører til en særskilt treegrid-løsning.

### Semantik og rækkehandlinger

Tree er en selvstændig rolle til hierarkisk objektvalg. Grundsemantikken følger [WAI-ARIA APG Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): `tree`, indlejrede `treeitem`/`group`, navngivet rod, `aria-expanded` på forældre og `aria-selected` på valgbare rækker. Ved multivalg bruges `aria-multiselectable`. Fokus vises særskilt fra vedvarende valg; foldning ændrer ikke i sig selv produktets valg.

Design Studio supplerer træet med få native rækkehandlinger. Dette er bibliotekets konkrete udvidelse: rækkefokus bevæges gennem én aktiv tabstop-position, og den aktive rækkes handlinger kan nås med Tab. Handlingsknapper bevarer deres egen tastaturadfærd, navn og eventuelle `aria-pressed`; de må ikke overtage træets navigation eller ændre valg som bivirkning. `item.disabled` deaktiverer objektvalg og træk. Foldning og handlinger har selvstændig tilgængelighed, så eksempelvis Lås op ikke forsvinder sammen med det låste objektvalg. Produktet skal bevare eller flytte fokus meningsfuldt, når et item fjernes. Principperne bygger på [APG Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) og [Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

Rækker, foldning og handlinger bruger bibliotekets fælles semantiske spacing-, kontrol-, fokus- og actiontokens. Produktet leverer navne, symboler, tilladelser, valgregler, flytning og menuindhold. Det er ikke en generalisering af én branches datamodel. Ved drag-and-drop skal produktet tilbyde en tilsvarende klikbar flyttehandling, som også kan betjenes med tastatur; [WCAG 2.2, 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) skelner dette fra tastaturbetjening alene.

Tree er ikke en tabel med redigerbare celler. Har hierarkiet mange interaktive kolonner, er [APG Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) det relevante særskilte mønster. Kildebaserede principper og automatiske prøver erstatter ikke kontrol af konkrete hjælpemidler og produktforløb.

## Tema og tokens

Temaet indeholder tokens, brandguide, historik og eventuelt appearance. Det indeholder ikke komponentdefinitioner. Brug bibliotekets positive semantiske spacingtokens til tæthed. appearance kan ændre godkendte visuelle egenskaber, men ikke padding, gap eller struktur.

Brugeren kan redigere temaet ved at åbne Design Studios `index.html` direkte i browseren og vælge **Åbn tema**. Agentens browseradgang følger HTTP-kontrolvejen i [agentarbejdsgangen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion). **Gem tema** henter den redigerede JSON-fil; placér den som produktets `design/design.json`, før `node tools/cli.mjs sync PROJECT_DIR` køres fra Design Studios mappe. Editorens download ændrer ikke automatisk produktets tema, CSS eller runtime.

Produktets sidelayout kan bruge CSS-variabler som --ds-space-6 og --ds-color-background-canvas. Token-id'ers punktummer bliver bindestreger; store bogstaver bevares. Biblioteket ejer komponenternes interne layout.

## Afstande og indlejrede flader

Produktet vælger grupperne; biblioteket leverer rytmen. Undgå ekstra lokale margins på samme grænse.

En contained scroll-area ejer den synlige flade, kant, radius og klipning. Den indre card, inspector eller toolbar får scroll-areaens surface-part: dens ekstra ramme fjernes, mens originale dele og indvendig spacing bevares. Når et allerede indrammet kort har en fast header, bruges body-varianten på det scrollende indhold. Tilføj ikke endnu en indrammet wrapper alene til scrollbarens placering.

Valggrupper bruger indholdsbaserede minimumsbredder. Brug segmented-control med wrap til lange labels og mange valg; gruppen kan gå over flere rækker. Giv produktpanelet tilstrækkelig bredde. Del ikke almindelige ord vilkårligt for at presse dem ind. Brug divider med vertical til funktionelle grupper i en vandret toolbar frem for store tomme mellemrum.

### Scroll-area

Scroll-area har den faste anatomi root > viewport > content. Kun viewport scroller, og inset holder scrollbaren inden for den ydre afrunding. Content reserverer plads til tastaturfokus. contained ejer én samlet flade, kant og afrunding. Den indre native card, inspector eller toolbar får ds-scroll-area__surface og bevarer sin padding, orientering og direkte dele; surface fjerner kun den ekstra ramme, baggrund og skygge. body bruges til scrolling inde i et allerede indrammet kort med fast header. Dette er Design Studios konkrete anvendelse af [Carbons lagmodel](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview): indlejring skaber kontrollerede fladelag frem for gentagne panelrammer. Viewport kan modtage tastaturfokus med tabindex=0 og et tilgængeligt navn. Produktet ejer maksimal højde og placering.

### Stack og native details

Stack samler direkte felter, noter og handlinger i en lodret strøm. Standard bruger gapLarge mellem indholdsenheder; compact bruger gap mellem tæt relaterede kontroller. Grundrollen og compact har kun display, retning, minWidth og positivt gap, så de tilfører ingen ekstra ramme eller padding. Felter, kort og valggrupper ejer fortsat deres egen indvendige afstand. Kortets root-gap separerer header, body og footer, men skaber ikke automatisk afstand mellem bodyens indlejrede børn; disse kan have en body-stak.

En native details bevarer summary og browserens åbne/lukkede adfærd. Details-root beholder block-layout uden ds-stack; en separat disclosure-body-stak efter summary bruger gap mellem kontroller og paddingBlockStart med gapLarge til udløseren. Den indvendige afstand findes kun, når den native body er synlig, så lukket details ikke efterlader en tom flexafstand. Default og compact er fortsat uden padding. Sammenhængende segmentvalg forbliver én enhed i stakken, så deres interne opbygning bevares.

## Synlige interaktioner og tæthed

Handlingsfamilierne neutral, primary, selected, danger og accent har hver fire tokens under color.action: eksempelvis neutralHover, neutralHoverText, neutralActive og neutralActiveText. Biblioteket binder disse flade-/tekstpar til de relevante roller og varianter; synlig hover må ikke bero på en lille tekstfarveændring alene. Vedvarende valg og aria-pressed bevares under hover og tryk, og disabled er undtaget.

Temaer justerer tæthed med positive space.component.padding, paddingLarge, paddingCompact, gap og gapLarge samt typografitokens. Bevar bibliotekets minimumsklikflader. De interne --ds-interaction-variabler er komponentlokale implementeringsdetaljer og må ikke sættes som globale tema-overrides.

### Kompakt tæthedsprofil

Brug `generateDensityCSS('compact')` fra `core/scales.mjs` eller den synkroniserede `design/runtime/scales.mjs`. Indlæs CSS-laget efter temaets CSS, og behold det, når tema eller farve skifter. Profilen sætter de fælles positive afstande og gør faner og kommandomenuer tættere ved præcis pegeindgang. Produktet vælger profil og kan fortsat bruge de semantiske afstande til egne paneler. `generateDensityCSS('standard')` leverer et tomt lag. En anden designklasse eller et id kan angives som andet argument og skal svare til temaets CSS-scope.

### Rytme og klikflader

Almindelige handlingskontroller bruger som standard mindst 44px klikflade; dokumenterede kompakte valg og tætte hierarkier kan være mindre. Padding følger den fælles opbygning og positive semantiske tokens. Mærker og billedtekstetiketter har mindre indvendig afstand, fordi de beskriver indhold frem for at udføre en handling. Korte kategorietiketter bruger moderat tracking; formularlabels følger almindelig læsetypografi.

Kort og detaljepaneler bruger kant og flade som deres grundhierarki. Skygge bruges til hævede kort og flydende dialoger. Paneltitler følger title/panel-skalaen, mens display og expressive har særskilte responsive størrelser. Temaet bestemmer fontkarakteren; en expressive rolle kræver ikke kursiv.

Kontakter, valgte mærkater og værktøjstip bruger komplette semantiske forgrund/baggrund-par. En mørk temaudgave må ikke antage, at primaryText eller primary også er den rigtige farve på en invers flade. Native kontroller og fokusmarkeringer bevares på tværs af udtrykkene. Egne dele, der er direkte børn i komponentens anatomi, styles med direkte child-selektorer, så en indlejret komponent bevarer sit eget hierarki. Handlingsgruppens interne dele bruger egne selectors; sammensatte knapper beholder deres varianter og tilstande.

### Layout og semantiske tilstandsfarver

Knapper og segmentvalg bevarer hele ord gennem normal word-break og overflow-wrap. Segmenter har min-content som indholdets nedre breddegrænse, og gruppen kan bryde til flere rækker. Standardgruppen fordeler ledig plads lige, når labels kan være der; wrap bruger en indholdsbestemt basis til større eller varierende grupper. Ingen fast procentkolonne eller produktspecifik ordopdeling styrer disse valg. Ubegrænsede enkeltord kan stadig kræve en særskilt afgrænset visning; biblioteket lover ikke, at alle tænkelige strenge kan vises ved enhver bredde. Lodrette handlingsknapper har automatisk bredde og strækkes af toolbar; lodrette dividers strækkes til den aktuelle rækkes højde.

[Carbon Content switcher](https://www.carbondesignsystem.com/building-blocks/core/components/content-switcher/guidelines) begrunder lige kontrolbredder med plads til den længste label. Design Studios wrap-variant udvider dette til grupper af beslægtede valg i smalle paneler. Carbon anbefaler ellipsis med tooltip ved meget lange labels; almindelige labels skal kunne læses som hele ord.

Hover og active har semantiske flade- og tekstpar under color.action: neutralHover/Active, primaryHover/Active, selectedHover/Active, dangerHover/Active og accentHover/Active med tilsvarende Text-tokens. Neutrale handlinger, primære handlinger, valgte segmenter, destruktive handlinger og accenthandlinger bevarer hver deres familie. Pressed handlingsknapper følger primary; et valgt segment følger selected. Disabled får ingen hover- eller active-feedback. Fuld opacity bevarer tekstkontrast. Fire private --ds-interaction-* bindings i bibliotekets opskrifter vælger den relevante familie; temaappearance kan ikke skrive dem.

Dette følger [Carbons interaktionstokens](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview): feedback ændrer fladen, og tekstfarven understøtter den. [Fluent 2 Button](https://fluent2.microsoft.design/components/web/react/core/button/usage) kræver læselig tekst og ikoner i alle interaktive tilstande og et tydeligt hierarki mellem primære og øvrige handlinger. Runtime kontrollerer de nye farvepar samt pressed/current sammen med hover/active.

Indrammede handlinger og indtastning bruger color.border.field. Kort og panelskillelinjer bruger color.border.default. Listehandlinger har direkte heading og description-dele; aria-current beskriver det aktuelle navigationsmål uden toggle-semantik.

## Brand

Læs relevante brandregler og brug godkendte originaler fra design/assets. Bevar proportioner og licenser. Temaets indlejrede WOFF2-skrifter genererer selvstændige @font-face-regler og kræver ingen lokal systemfont. `generateCSS(theme)` fra runtime/engine.mjs indeholder både skrifter og komponent-CSS. `generateFontCSS(theme)` giver kun de validerede font-face-regler til en vært, som ejer sin egen grænseflades CSS. Brug fortsat temaets skrifttokens til at vælge familier. Se BRANDGUIDE.md.

## Dialog, drawer, tooltip og popover

```js
import {createComponent,mountDialog,mountPopover,mountTooltip} from './design/runtime/components.mjs';

const dialog=createComponent(theme,'dialog',{
  title:'Gennemgå oplysninger',describeBody:false,
  slots:{body:[{component:'field',options:{label:'Navn',value:state.name}}],
    footer:[{component:'button',options:{text:'Luk',attrs:{'data-ds-close':''}}}]},
},{document});
host.append(dialog);
const dialogControl=mountDialog(dialog,{trigger:openButton});

const panel=createComponent(theme,'popover',{title:'Flere muligheder',body:'Supplerende indhold.'},{document});
host.append(panel);
const popoverControl=mountPopover(optionsButton,panel,{placement:'bottom'});

const tip=createComponent(theme,'tooltip',{text:'En kort supplerende forklaring.'},{document});
host.append(tip);
const tipControl=mountTooltip(helpButton,tip,{placement:'top'});
// Kald destroy() på hver controller, før dens markup fjernes.
```

Alle tre controllere har `open()`, `close()`, `opened` og `destroy()`. `mountDrawer` bruger samme kontrakt som `mountDialog`; drawerens `variant: 'start'|'end'` vælger siden efter læseretningen. `modal` er som standard `true`; `modal:false` bruger native `show()` uden fokusfælde. Der simuleres ingen modaladfærd, hvis native dialog mangler. Dialog/drawer og popover tager `initialFocus` som en node eller funktion, der returnerer en node i panelet; `onOpenChange(open)` forbinder til produktets tilstand. Knapper med `data-ds-close` lukker deres dialog/panel.

Dialog/panel har `title`, `body` og slots `body`/`footer`. `describeBody:false` undlader en samlet `aria-describedby` ved struktureret indhold. Produktet navngiver egne paneler, og den fælles renderer forbinder titel og forklaring automatisk. Bevar trigger og panel inden for samme designscope; indhold i en native modaldialog skal også placeres inde i dens DOM, så browserens inert- og fokusregler bevares.

Popover er ikke modal. Escape og eksplicit lukning returnerer fokus; klik eller fokus udenfor lukker uden at overtage det nye fokus. Skift ikke panelets markup ved hver åbning, hvis kladder skal bevares. Tooltip indeholder kun forklarende tekst, har som standard `delay:300` og `closeDelay:120` millisekunder og bevarer eksisterende `aria-describedby` på udløseren. Den erstatter ikke udløserens navn.

Tooltip/popover understøtter `placement: 'top'|'bottom'|'left'|'right'`, vender ved viewportkanter og genplaceres ved scrolling, resize og ændret elementstørrelse. Native Popover API giver top layer uden portals. Uden API'en bruges en fast positioneret fallback; clipping fra forfædre kan da stadig begrænse panelet. Der er ingen ekstern runtimeafhængighed.

### Overlaysemantik

Tooltip flytter ikke fokus og indeholder ingen interaktive kontroller; Escape lukker hjælpen, og hover over hjælpen holder den synlig. Interaktiv hjælp bruger en ikke-modal popover. Placeringen følger viewport, scrolling og ændrede størrelser; den native Popover API bruges til top layer, når den findes. Dialog og drawer bruger native dialog med eksplicit modalitet. Escape lukker det inderste overlay, og fokus vender meningsfuldt tilbage. Principperne bygger på [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/), [APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) og [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using).

## Tidligere produkter

~~~sh
node tools/cli.mjs migrate PROJECT_DIR/design/design.json --out PROJECT_DIR/design/theme-v2.json
~~~

Originalen bevares. Ukendte komponentroller skal registreres i det fælles bibliotek først. Tilpas produktets markup og tidligere paddingregler før temaet bliver aktivt, og synkronisér derefter. Format 1 kan fortsat generere sin hidtidige CSS, indtil produktet migreres.

## Avatarer

`avatar` bruger `name` som tilgængeligt navn og udleder initialer af første og sidste ord. `initials` kan erstatte dem; `src` tilføjer et dekorativt billede. Varianterne er `small` (32 px), `default` (44 px) og `large` (64 px). Initialerne vises under indlæsning og ved billedfejl. Native `createComponent` og `createComponentFactory` binder dette automatisk. Efter HTML-rendering kaldes `mountAvatarFallbacks(root)`; kald den returnerede controllers `destroy()` ved afmontering.

`avatar-group` tager `label` og `items`, hvor hvert element bruger avatarens options og har sit eget navn. `default` viser afstand mellem avatarerne; `overlap` giver let overlap og bevarer plads til fokus og ombrydning. Avatarer er statiske. Produktet ejer eventuelle omgivende links eller knapper.

~~~js
const create = createComponentFactory(theme, { document });
host.append(create('avatar-group', {
  label: 'Ansvarlige', variant: 'overlap',
  items: [{ name: 'Anna Larsen', src: 'assets/anna.webp' }, { name: 'Mikkel Holm' }],
}));
~~~

## Formularfamilien: tekstområde, tal og feltgrupper

`textarea` og `number-input` leverer label, native kontrol, hjælp og fejl. Brug `label`, `value`, `name`, `hint`, `error`, `required` og `disabled`. `textarea` tager også `rows`, `cols`, `minlength` og `maxlength`; værdien bevarer linjeskift. `number-input` bruger altid native `type="number"` og tager `min`, `max` og `step`. Browseren håndterer indtastning og tastatur; produktet ejer værdier, events og validering.

~~~js
const create = createComponentFactory(theme, { document });
host.append(create('field-group', {
  idPrefix: 'project-details', label: 'Projektoplysninger', hint: 'Udfyld de relevante oplysninger.',
  slots: { body: [
    { component: 'textarea', options: { label: 'Beskrivelse', value: draft.description, rows: 5, hint: 'Skriv kort og konkret.' } },
    { component: 'number-input', options: { label: 'Antal deltagere', value: draft.participants, min: 0, step: 1 } },
  ] },
}));
~~~

`field-group` er et native `fieldset`; `label` bliver gruppens `legend`, og `slots.body` indeholder deklarative felter. Gruppen giver underfelter entydige ID'er, når de ikke har eget `idPrefix`. `disabled` bruger browserens native nedarvning til gruppens kontroller. Gruppens eventuelle `hint` og `error` forbindes med selve feltgruppen.

`field`, `choice-field`, `textarea`, `number-input`, `range-field`, `checkbox`, `radio` og `switch` forbinder automatisk label, hjælp og fejl. `error` viser fejlteksten og sætter `aria-invalid`; `hint: ''` og `error: ''` skjuler tomme beskrivelser og udelader deres ID'er fra `aria-describedby`. Eksisterende eksterne beskrivelses-ID'er bevares. Checkbox, radio og switch bruger kun labelteksten som navn; hjælpen og fejlen er særskilte beskrivelser.

`readOnly` (alias `readonly`) på tekst- og talfelter bevarer fokus og kopiering og forhindrer redigering. Det erstatter ikke `disabled`. Select, checkbox, radio, switch og range har ingen native readonly-tilstand. `range-field` viser den initiale værdi i et `output`; produktets inputhåndtering opdaterer den synlige værdi ved ændringer.

### Indholdets semantik

Avatarer har navne uafhængigt af billeder; initialer bevares under indlæsning og ved billedfejl. Feltgrupper bruger `fieldset`/`legend`. Label, hjælp og fejl har særskilte relationer, så hjælpeteksten ikke bliver kontrollens navn. Tal og flerlinjetekst bruger native input/textarea; de nye kontrollers effektive feltkanter er omfattet af samme bindende kontrastkontrol.

## Loading, fremdrift og tomt indhold

`spinner` tager en forståelig `label` og varianterne `small`, `default` eller `large`. Den er en polite status; brug `announce: false`, hvis den omgivende visning allerede annoncerer arbejdet. `skeleton` er altid dekorativ med `aria-hidden="true"`; vælg `default` til en tekstlinje, `block` til en flade og `circle` til en rund pladsholder. Angiv én loading-status for hele området. Begge beholder deres betydning uden animation ved reduceret bevægelse.

`progress` bruger native `<progress>` med en tilknyttet `label`. `max` er et positivt tal (standard 100), og `value` ligger mellem 0 og max. Udeladt eller null `value` giver ubestemt fremdrift. `valueText` kan beskrive et trin, eksempelvis `"3 af 8 filer"`. Komponenten er ikke en live-region; produktet annoncerer relevante milepæle frem for hvert værdiskift.

`empty-state` tager `title`, `body` og valgfrie deklarative handlinger i `slots.actions`. Den er almindeligt navngivet indhold, også når en tabel eller søgning er tom. Produktet ejer søgning, nulstilling og oprettelse samt en eventuel separat statusmeddelelse.

### Status og annoncering

Loading skal have ét forståeligt navn for det relevante område. Spinner beskriver en aktivitet, progress viser native målelig eller ubestemt fremdrift, og skeleton reserverer dekorativ plads. Annoncér milepæle frem for hvert procenttrin. Toast annoncerer beskeden uden knaptekster, flytter ikke fokus og pauser sin tid ved hover, fokus og skjult dokument. Meddelelser med handlinger forsvinder kun ved eksplicit lukning. Tom tilstand forklarer situationen og kan tilbyde et næste skridt uden at være en automatisk live-region.

## Korte meddelelser med toast

Opret `toast` med `title`, `body`, valgfri `variant: 'danger'` og handlinger i `slots.actions`. Bind derefter `mountToast(element, { duration: 5000, onClose, announce: true })`. Den separate live-region annoncerer beskeden én gang uden handlingernes knaptekster. Controlleren flytter aldrig fokus. Tiden pauser ved hover, tastaturfokus og skjult dokument; beskeder med handlinger lukker kun eksplicit. `duration: 0` beholder også almindelige beskeder, indtil de lukkes. Produktet ejer placering og eventuel kø.

Controlleren giver `closed`, `close(reason)` og `destroy()`. `onClose(reason)` modtager `timeout` eller `dismissed`, medmindre produktet selv angiver en anden årsag til `close`. Kald `destroy()` ved afmontering. Hovedindholdet skal fortsat indeholde vigtig information, der skal kunne findes senere.

## Lokalt filvalg

`file-upload` giver et native filinput, label, hjælp, filnavne og fejl. Angiv `label`, valgfri `hint`, `accept`, `multiple`, `maxSize` i bytes og `maxFiles`. Varianten `drop` og `drop: true` giver en ekstra flade til fil-drop; det native input fungerer stadig med tastatur. Filnavne indsættes som tekst. Filvalget sender ikke filer til en server.

~~~js
import { createComponent, mountFileUpload } from './design/runtime/components.mjs';

const picker = createComponent(theme, 'file-upload', {
  label: 'Vælg bilag', accept: '.pdf,image/*', multiple: true,
  maxFiles: 3, maxSize: 5 * 1024 * 1024, variant: 'drop',
});
host.append(picker);
const selection = mountFileUpload(picker, {
  onChange(files) { draft.attachments = files; },
});
~~~

`mountFileUpload` læser begrænsninger fra den renderede komponent; samme options kan gives direkte til controlleren. `files` kan angive et allerede accepteret lokalt udvalg. Det valideres før montering. `accept` understøtter filendelser, MIME-typer og familier som `image/*`; valideringen bruger navn, type og størrelse og undersøger ikke filindholdet. Input og drop bruger samme validator. Annullering eller ugyldige filer bevarer tidligere valg og udløser ikke `onChange`.

Controlleren giver en kopi i `files`, `setFiles(files)`, `remove(index)`, `clear()` og `destroy()`. `onChange(files, detail)` kaldes først efter et gyldigt nyt valg; `detail.source` er `input`, `drop`, `programmatic`, `remove` eller `clear`. `onInvalid(errors, detail)` kan supplere den viste fejl. `validateFileSelection(files, options)` giver samme validering uden DOM og returnerer `{ valid, files, errors }`. Brug controllerens `files` som det samlede udvalg, også efter drop og fjernelse. Produktet ejer læsning, lagring og en eventuel netværksoverførsel.

### Validering og bevaret udvalg

Filvalg bevarer native input og tastaturbetjening. Input og valgfrit drop bruger samme metadata-validering før et nyt udvalg accepteres. Annullering og afviste filer bevarer det tidligere udvalg. Produktet ejer læsning, lagring og eventuel overførsel; filnavne er tekst, og metadata-validering er ikke en undersøgelse af filindholdet.

## Filtrerede valg og native dato/tid

`combobox` giver ét valg fra `items: [{id, label, disabled?}]`; `multiselect` bruger samme liste med flere valg. ID'er skal være entydige og ikke tomme. Angiv `value` (ét ID eller `null`) henholdsvis `values` (en liste af ID'er), og eventuelt `query`, `label`, `hint`, `error`, `placeholder`, `disabled` og `readOnly`. Montér controlleren på komponentens rod efter indsættelse:

~~~js
import {createComponent, mountCombobox, mountMultiselect} from './design/runtime/components.mjs';
const field = createComponent(theme, 'combobox', {
  idPrefix: 'contact', label: 'Kontaktperson', items: people, value: state.contactId,
});
host.append(field);
const control = mountCombobox(field, {
  onChange(value) { state.contactId = value; },
  onQueryChange(query, {requestId}) {
    control.update({loading: true, error: ''});
    findPeople(query).then(
      items => control.update({items, requestId, loading: false}),
      () => control.update({requestId, loading: false, error: 'Mulighederne kunne ikke hentes.'}),
    );
  },
});
// findPeople og state tilhører produktet; kald control.destroy() før afmontering.
~~~

`mountMultiselect(root, options)` bruger samme kontrakt med `values` og `onChange(values, detail)`. Begge controllere har `open()`, `close()`, `clear()`, `update(next)`, `destroy()` og getters `opened`, `query`, `requestId`, `value`/`values`. `onChange` giver også `previousValue`, `reason`, `query`, `item` og eventet, når ændringen kommer fra brugeren. Gem de valgte ID'er fra callbacken; inputtets tekst er en label eller indtastningskladde og er ikke en skjult formularværdi med ID'et.

Piletaster, Home/End og Enter navigerer og vælger, mens DOM-fokus bliver i inputtet; disabled-muligheder springes over. Home/End håndterer først listen, når den er åben. Escape lukker og bevarer kladden; Tab lukker og fortsætter native fokusnavigation. Ryd-knappen fjerner valg og kladde. Multiselect viser navngivne fjernknapper. Når brugeren redigerer teksten i en combobox, ryddes det tidligere valgte ID, og `onChange(null, {reason:'input', ...})` bliver kaldt; fri tekst forbliver en kladde, indtil en mulighed vælges. Produktet validerer, om et faktisk valgt ID er påkrævet.

`update({items})` bevarer inputnode, kladde, valg og kendte labels for valgte ID'er, der ikke findes i et filtreret eller nyt svar. `update({value})` eller `update({values})` ændrer udtrykkeligt valget; `update({query})` erstatter kladden. Ved asynkrone søgninger bruges det `requestId`, som `onQueryChange` leverede. Gamle resultater og svar efter afmontering ignoreres med returværdien `false`; opdateringer uden request-ID er produktets bevidste synkrone ændringer. `loading` og `error` giver fælles status og beskrivelse. Produktet ejer forespørgsler og eventuel annullering.

`date-picker` og `time-picker` bruger native `input type="date"`/`"time"` med den fælles label/hjælp/fejl-opbygning. Datoer bruger `YYYY-MM-DD`; tid bruger `HH:mm`, eventuelt med sekunder og millisekunder. Tom værdi er `''`. `min`/`max` følger samme format; `step` er positivt eller `'any'` (dage for dato, sekunder for tid). `required`, `readOnly`, `disabled`, `name`, `hint` og `error` følger felt-API'et. Browseren leverer lokal visning og eventuel kalender-/tidsvælger; de lagrede strenge indeholder ingen tidszone. Produktet håndterer native `input`/`change`, validering og lagring.

### Værdier og asynkrone svar

Combobox og multivalg skelner mellem indtastningskladde og valgte ID'er. Tastaturnavigation bevarer inputfokus, og asynkrone resultater forbindes med request-ID'er, så gamle svar ikke overtager nyere valg. Dato og tid bruger native kontroller og tidszonefri værdistrenge; produktet bestemmer databetydning og eventuel tidszonekonvertering.


## Vælg controller

| Behov | Anvendelse og produktansvar |
| --- | --- |
| Formular | `field` forbinder label, hjælp og fejl. Produktet ejer validering og flytter fokus til første fejl ved afvist indsendelse. |
| Filtrerede valg og dato/tid | Brug `mountCombobox`/`mountMultiselect`; produktet ejer stabile ID'er og asynkrone forespørgsler med controllerens request-ID. Native `date-picker`/`time-picker` bruger dato-/tidsstrenge uden tidszone. |
| Status og filvalg | Brug én navngivet loading-status; skeleton er dekorativ. Forbind `mountToast` og `mountFileUpload`. Bevar tidligere filer ved cancel/fejl; produktet ejer data og eventuel overførsel. |
| Datatabel | Brug native `data-table` og `mountDataTable` til valg, ekspansion og handlingscallbacks. Produktet sorterer data og bekræfter derefter sorteringstilstanden. |
| Redigerbart datagrid | Brug `data-grid` og `mountDataGrid` til cellenavigation, særskilt markering, kladder og atomisk TSV-indsættelse. Synkron `validateCell` afgør, om en ændring kan accepteres; `onCommit` overfører den accepterede arbejdskopi til produktets state. |
| Kommandomenu | `mountMenuControls(root, {onAction})` forbinder udløsere og menuer gennem `aria-controls`. Produktet ejer markup, placering, kommandoer og checkbox/radio-state. |
| Træ | `mountTree(theme, host, options)` leverer tastatur og fokus. Produktets callbacks accepterer valg, foldning og flytning gennem `update`. |
| Dialog og drawer | Brug native dialog fra `createComponent` med `mountDialog`/`mountDrawer` eller produktets etablerede tilgængelige adapter. Hjælperen forbinder åbning, lukning og fokusretur; produktet ejer handlinger og kladder. `modal:false` er eksplicit ikke-modalt; `open:true` alene giver ikke modaladfærd. |
| Faner | Brug `tabs` og `mountTabs`, også ved eksisterende kompatibel markup. Bevar panelerne ved skift; produktet ejer indhold og data. Automatisk aktivering bruges til indhold uden ventetid. |
| Tooltip og popover | Brug `mountTooltip` til kort hjælp uden kontroller; `mountPopover` til interaktivt indhold. Brug navn, fokusretur og Escape; bevar panelerne under samme designscope og inden for en eventuel native modaldialog. |
| Accordion og webnavigation | Brug native `accordion`, `breadcrumb` og `pagination`. Produktet ejer adresser, foldestatus og udsnittet af sidetal; der kræves ingen lokal tastaturcontroller. |
| Panel og bevægelse | Brug `mountPanelControls` og `animateStandard`, når de passer til behovet. Sluttilstanden skal fungere uden animation. |
