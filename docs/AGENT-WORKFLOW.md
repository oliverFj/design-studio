# Arbejdsmetode for agenter

Design Studio har ét fælles komponentbibliotek og flere temaer. Biblioteket ejer komponenternes struktur, layout, semantik, varianter og tilstande. Temaet ejer visuelle værdier og brand. Produktet ejer brugerforløb, data og forretningslogik.

## Start et projekt

1. Læs systemets README.md, AGENTS.md og denne vejledning og docs/DESIGN-FOUNDATIONS.md samt produktets egne anvisninger.
2. Find design-studio.project.json, projektets tema og registrerede komponentadaptere. Standardtemaet ligger i design/design.json.
3. Læs core/library.mjs og relevante komponenters formål, anvendelse, dele og preview. Brug getComponents(theme) til det effektive katalog.
4. Læs temaets tokens og relevante brandprincipper, sektionsregler og logobrug. Genbrug produktets godkendte originaler; overtag ikke et startsæts personlige brand.
5. Mangler tilknytningen, kør init PROJECT_DIR --theme THEME_ID. Vælg tema efter opgaven. Init kopierer fælles browser-runtime til design/runtime og opretter CSS; agenten forbinder dette med produktets faktiske kode.

## Før et nyt element

- **Genbrug:** Vælg en eksisterende komponent med samme rolle, selv om opgaven bruger et andet navn.
- **Udvid:** Tilføj en variant til den fælles rolle, hvis et genbrugeligt behov mangler.
- **Opret:** Tilføj en ny fælles komponent, når den har en selvstændig, genbrugelig rolle.

Navne, beskrivelser, variantnavne og previewtekster skal beskrive en generisk rolle. Temaets ophav, bestemte fonte, brancher og produktfunktioner må ikke definere en fælles komponent. Brug de kanoniske id'er til ny kode; aliaser er kun til kompatibilitet.

Produktspecifikke sammensætninger og sidelayout bliver i produktet og anvender de fælles komponenter og tokens. De behøver ikke blive generelle bibliotekskomponenter.

## Implementér gennem biblioteket

Brug renderComponent(theme, id, options) til sikker HTML eller createComponent(theme, id, options, {document}) til native DOM. Frameworks kan bruge tynde adaptere med de samme dele og native semantik. Registrér adapterens faktiske file og export i projektkonfigurationens components.

Temaet må ikke indeholde components. Brug tokens og afgrænsede appearance-overrides til visuelle valg. Padding, gap, display og opbygning må ikke sættes gennem temaoverrides eller fjernes i lokale komponentkopier. Justér de positive space.component.*-tokens for tæthed.

Biblioteket forbinder formularlabels, hjælp og fejl. Bevar den forbindelse i adaptere. Brug native dialog eller produktets etablerede tilgængelige løsning til modaladfærd; events, state og navigation forbliver produktets ansvar.

Brug scroll-area til afgrænsede, lange paneler. Bevar root > viewport > content; contained ejer én ramme, mens den indre card/inspector/toolbar markeres med den fælles surface-part og beholder padding og direkte anatomi. Declarativ sammensætning kan bruge slots.content: [{component: "inspector", part: "surface"}]; en tynd adapter bruger ds-scroll-area__surface på den indre native komponentroot. Brug body-varianten til scrolling under en fast header i et allerede indrammet kort. Sæt maksimal højde og placering på den ydre shell i produktets sidelayout. Fjern lokale scroll- og procentkolonneregler; segmentvalg har universelt intrinsic minimum og whole-word wrapping, wrap-varianten fordeler bredde efter indhold. toolbar.vertical strækker handlinger og divider.vertical følger rækkens højde. Hover/active bruger fælles color.action-flade/tekstpar; temaet ejer værdierne, og lokale opacity- eller tekstfarvehacks erstatter ikke feedbacken. Listehandlingers heading og description er direkte button-dele, og aktuelt navigationsmål bruger aria-current.

Brug stack til ydre afstand mellem direkte felter, noter og handlinger: default bruger space.component.gapLarge, compact bruger space.component.gap til tæt relaterede kontroller. Default og compact har hverken frame, padding eller margin. Et field ejer label/kontrol/hjælp; en segmented-control ejer sine sammenhængende valg. Undgå lokale descendantmargins og flere felter i én field-anatomi. Native details-root beholder block-layout uden ds-stack. Efter summary bruges en separat stack med varianten disclosure-body: gap mellem relaterede kontroller og paddingBlockStart med gapLarge til udløseren. Insets optager kun plads, når browserens native body er synlig; en flexstak på details-root kan ellers efterlade ekstra luft i lukket tilstand. Bevar native åben/lukket adfærd. Biblioteks-preview kan referere til deklarerede composes-komponenter med {component: "field"}; det genbruger samme native markup.

## Udvid det fælles bibliotek

Tilføj rollen i core/library.mjs med name, description, usage, composes, parts, variants, states og preview. Alle medfølgende temaer skal kunne bruge den. Genbrug tokens; nye roller skal have dokumenterede centrale defaults eller aliases til eksisterende semantiske værdier. Undgå temaspecifik struktur og afhængighed af et bestemt frameworks runtime.

Kontrollér preview, lange tekster, smal bredde og relevant tastaturfokus. Kør npm test og npm run check ved bibliotek-/runtimeændringer. Kør npm run sync:design-studio i hjemmesidens mappe (eller tools/build-showcase.mjs --out DIRECTORY til en anden vært), og kør sync på produkter, som skal bruge den nye biblioteksudgave.

## Afslut produktændringen

~~~sh
node tools/cli.mjs validate "E:/produkt/design/design.json"
node tools/cli.mjs sync "E:/produkt"
~~~

CSS og kopieret runtime er afledte filer. Ret temaet eller fælles kildekode og synkronisér; håndredigér ikke genereret CSS eller projektets kopierede runtime.

Notér nye temavalg i history. Hold brandreglernes komponent-, token- og ressourcehenvisninger ajour. Beskriv kort, hvilke komponenter der anvendes, og hvad der faktisk er kontrolleret.

## Migrér eksisterende produkter

Format 1 fortsætter med at virke som før. Brug migrate FILE --out NEW_FILE til en ny temafil. Registrér ukendte roller i biblioteket først. Gennemgå den konkrete produktkode og fjern gamle interne layoutregler, som ellers vil give dobbelt padding. Gennemfør overgangen eksplicit; en bestået formatkontrol beviser ikke, at et gammelt produkt bruger bibliotekets markup.
