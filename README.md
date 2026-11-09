# Stade · Design Studio

Et fælles, framework-uafhængigt komponentbibliotek med udskiftelige temaer, offline-editor og web-showcase samt MCP-værktøjer, skills og kildeunderstøttede erfaringer til samarbejde med agenter.

Kildekode: [oliverFj/design-studio på GitHub](https://github.com/oliverFj/design-studio).

Biblioteket bestemmer struktur, semantik og grundlayout. Temaet bestemmer farver, typografi, afstandsværdier, kanter og skygger. Produktet bestemmer indhold, navigation og forretningslogik.

## Åbn Design Studio

Dobbeltklik på **[index.html](index.html)** i systemmappen. Design Studio åbner direkte i din normale browser og fungerer offline. Der kræves ingen server, Windows-app, terminal eller installeret Node.js for at bruge den færdige fil. Alle medfølgende temaer er indbygget.

De medfølgende temaer har deres egne farvetilstande, herunder lyse, mørke og særlige farvevariationer. Farvetilstanden kan følge systemet eller vælges manuelt; det manuelle valg har forrang. Temafilen gemmer alle leverede tilstande, mens en CSS-eksport gælder den valgte fremtoning. Ældre enkeltstående temaer bliver ikke automatisk konverteret.

**Åbn tema** læser en JSON-fil, du vælger, eksempelvis et projekts `design/design.json`. **Gem tema** henter det aktuelle tema som en JSON-fil med tokens, brandguide, originalressourcer og historik. Browseren håndterer placeringen; den oprindeligt åbnede fil overskrives ikke automatisk. Gem den hentede fil på den ønskede placering, og erstat projektets tema bevidst, hvis ændringen skal bruges dér.

Åbnede temaer og ændringer findes i den aktuelle browsersession. Gem dem som filer før genindlæsning eller lukning; hentede temaer kan åbnes igen med **Åbn tema**. De indbyggede temaer er kopier fra seneste build, og redigering ændrer ikke filerne i `packages/`.

`npm start` er en valgfri genvej for udviklere med Node.js; den åbner `index.html` i browseren.

## Byg offlineudgaven

Agenter og udviklere bygger filen fra projektmappen med Node.js 20 eller nyere:

~~~sh
npm ci
npm run build
~~~

`npm ci` bruges ved første opsætning eller ændrede afhængigheder. `npm run build` samler editor, bibliotek, temaer og design i én selvstændig `index.html`. Filen er genereret og Git-ignoreret; den skal bygges i et nyt checkout. Den kan derefter kopieres og åbnes selvstændigt uden projektmappen eller byggeværktøjerne.

Efter kode-, design- eller temaændringer køres `npm run build` igen. Brugeren skal derefter blot genindlæse browseren. Håndredigér ikke `index.html`. Rene dokumentationsændringer kræver ikke et nyt build. CLI-værktøjerne til produktintegration kræver Node.js 20 eller nyere.

`npm run release` pakker det aktuelle build som en offline-ZIP med licenser og en separat kilde-ZIP med låsefil. Kildepakken indeholder ingen installerede afhængigheder; brug `npm ci` på den aktuelle platform. Se [produktion og levering](docs/PRODUCTION.md) for pakker, kontrol, opdatering og web-showcase.

## Samarbejde med agenter

Siden **Samarbejde og koordination** forklarer API, CLI og MCP og viser værktøjspakker og erfaringer. Den lokale MCP leverer otte værktøjer til bibliotek, projektgrundlag og erfaringsopslag. Erfaringernes kildefiler kontrolleres automatisk ved opslag; nye forslag gemmes som kladder, mens gennemgang, rettelser og udfasning har en særskilt kurateringsvej.

Efter `npm ci` installeres forbindelsen og den fælles skill i Codex med:

~~~sh
npm run agents -- install
npm run agents -- status --probe
~~~

Projekter tilknyttes udtrykkeligt med `--project ID=ABSOLUTE_PATH`, og produktspecifikke skills vælges med `--skill NAVN`, eksempelvis `formlab-material-gpu`. Gentagen installation opdaterer uændrede, administrerede filer; lokale ændringer og øvrige Codex-indstillinger bevares. Én central Stade-mappe beholder bibliotek og erfaringer på tværs af produkterne.

[Samarbejdsguiden](docs/COLLABORATION.md) samler installation, statustjek, adgangsgrænser, kildekontrol, kuratering og udvidelse med nye værktøjer og skills. Serverprøven kontrollerer forbindelsen i en separat klient; den færdige offlineoversigt måler ikke den aktuelle chats indlæste værktøjer. MCP og skills kræver udviklingsopsætningen, mens den færdige `index.html` fortsat kan bruges selvstændigt.

En mulig fælles materialemotor er beskrevet i [udviklingsforslaget](docs/MATERIAL-ENGINE.md). Der er endnu ikke udtrukket en motor eller integreret den i andre produkter.

## Ét bibliotek, flere temaer

- **Komponenter:** Det samme katalog i alle temaer, med søgning, kategorier og valg mellem illustrationskort og liste. Vælg en komponent for at se varianter og tilstande i det fælles detaljeområde.
- **Animation og effekter:** Afprøv den fælles standard for udfoldning og tilbagevenden: 240 ms i begge retninger, uden ekstra forsinkelse og med respekt for reduceret bevægelse.
- **Tokens:** Redigér temaets værdier. Bibliotekets dokumenterede standardværdier dækker roller, som temaet ikke overskriver.
- **Brandguide:** Principper, anvendelsesregler, godkendte logoer, skrifter og originalressourcer.
- **Temaet:** Navn, beskrivelse, historik, JSON-eksport og genereret CSS.

Under **Designsystem → Designmønstre** findes interaktive eksempler på en objekteditor med kontekstpanel inspireret af FormLab, et parametrisk værksted, en opskriftseditor med lag, en formular, en liste med detaljevisning, et ressourcebibliotek og fortryd/gentag med gemmepunkt samt header/navigation, hero, footer og billedgalleri. De samme eksempler indgår i web-showcasen og kan afprøves med alle temaer. `node tools/cli.mjs examples PROJECT_DIR` kopierer valgfri referencekode og den selvstændige historikhjælper til et tilknyttet projekt uden overskrivning. Se [genbrug af designmønstre](docs/INTEGRATION.md#valgfrie-sammensætningseksempler).

Mønstrene vælges i en vandret kortbjælke over eksemplet. Rul sidelæns eller brug pilene; skift mellem kort bevarer kladder og bjælkens scrollposition. Hvert af de elleve mønstre har sin egen statiske illustration i Tegnets anatomi, Lysrum, Passage og Feltlinjer — 44 motiver, som følger temaets grafikmaterialer og Studios illustrationsvalg.

Komponentstruktur redigeres i det fælles bibliotek, ikke i hvert tema. Padding og gap kommer fra biblioteket. De semantiske spacingtokens skal være positive; temaet kan hverken udelade grundlayoutet eller erstatte det med nul-padding.

Temaet valideres før åbning og gemning. Ugyldige kladder kan redigeres, men ikke gemmes som gyldige temaer. **Hent CSS** under **Temaet** henter temaets genererede CSS. Når en hentet temafil er lagt tilbage i et produkt, opdateres produktets CSS og runtime med `sync`.

Bibliotek 3.9.1 har 62 fælles roller og en samling offentlige temaer med lyse og mørke tilstande. Temasamlingen udvides løbende, blandt andet når nye produkter udvikles; der er ikke et fast antal temaer. Hele det aftalte katalog er implementeret; dækningsoversigten har ingen resterende planlagte roller. Den skelner mellem statisk indhold/layout, native adfærd og fælles controllere. Det er dækning af dette katalog, ikke et løfte om alle komponenttyper eller en tilgængelighedscertificering.

Kataloget omfatter nu også combobox, multivalg, native dato/tid, spinner, progress, skeleton, toast, tom tilstand, lokalt filvalg, datatabel og redigerbart datagrid. Datatabellen bevarer native tabelnavigation; datagrid har særskilt cellenavigation, markering, kladder og atomisk indsættelse. Produktet ejer data, forespørgsler, kommandoer og lagring. Knapfamilien har fire fremhævelser med særskilt størrelse og betydning; historiske varianter bevares til kompatibilitet.

Farver har primitive `palette.*`-værdier med semantiske referencer. Fælles skalaer dækker spacing, elevation, lag og ikonstørrelser. Tabler Icons 3.50.0 er den fælles ikonstandard som et lokalt SVG-udvalg med medfølgende MIT-licens. Der er ingen ikonfont eller CDN-afhængighed. Se [temaformatet](docs/PACKAGE-FORMAT.md) og [ikon- og farvetilstandsintegration](docs/INTEGRATION.md#lyse-og-mørke-farvetilstande).

Feltgrænser mod kontrol-, indholds- og grundflader har et bindende minimum på 3:1. Valideringen kontrollerer også effektive feltopskrifter og begge farvetilstande. CSS indeholder tilpasninger til mere kontrast, reduceret bevægelse og forced colors. Native kalender-/tidsvælgere, filvælger og progress-tegning afhænger desuden af browser og operativsystem.

`tree`, `stack`, `scroll-area` og programmenuerne bevarer deres eksisterende roller. Historiske knapvarianter understøttes til kompatibilitet, mens ny kode bruger den fælles knapfamilie. Se [integrationsguiden](docs/INTEGRATION.md) for API og sammensætning og [temaformatet](docs/PACKAGE-FORMAT.md) for kontrakten. Biblioteksversionen er særskilt fra editorens versionsnummer.

## Grafik og animation

[Grafikguiden](docs/GRAPHICS-AUTHORING.md) beskriver stilstandarden for Tegnets anatomi, Lysrum, Passage og Feltlinjer. Komponentkortenes registrerede motiver er den primære reference. Familieguiderne angiver konkrete materialer, proportioner, stregvægte, referencepakker og undtagelser; [stilkontrakten](docs/graphics/style-contract.json) registrerer samme arbejdsgrundlag maskinlæsbart til senere MCP-integration.

`node tools/graphic-lab.mjs` bygger et selvstændigt grafikværksted i `artifacts/graphic-lab/index.html` med hus og musik i alle fire stilarter. Opskrifterne kan udvides af kommende agenter; prøvevisningen har tidslinje, reduceret bevægelse og SVG-eksport. Se guiden for temavalg og nye begreber.

## Brug i et produkt

[Agentarbejdsgangen](docs/AGENT-WORKFLOW.md) er den fælles indgang til valg af tema, komponenter, layout, interaktion og kontrol. [Integrationsguiden](docs/INTEGRATION.md) beskriver de fælles controllere, filvalg og data-API'er. Brug den relevante controller frem for lokal interaktionslogik. Dialoghjælperne bruger browserens native dialog; `open: true` alene giver ikke modaladfærd.

Giv agenten denne instruktion:

> Brug det tilknyttede Design Studio-system. Læs README.md, AGENTS.md og docs/AGENT-WORKFLOW.md. Find produktets faktiske designfiler i design-studio.project.json. Vælg komponenter fra det fælles bibliotek, og brug projektets tema til deres visuelle udtryk.

Opret tilknytningen fra systemmappen:

~~~sh
node tools/cli.mjs init PROJECT_DIR --theme studio-light
~~~

Erstat `PROJECT_DIR` med den faktiske projektsti; mappen skal eksistere. Kommandoen opretter et minimalt offlineprojekt med kildefiler i `src/`, `tools/build.mjs`, `package.json` med `npm run build` og en færdig `index.html`, som kan åbnes med det samme. Den opretter også tema, CSS, fælles komponentruntime, eventuelle brandoriginaler, projektkonfiguration og en anvisning i produktets AGENTS.md. Eksisterende output overskrives ikke; ved filkonflikter ændres intet.

Nye projekter får også `npm run doctor` og fælles filhåndtering med Åbn projekt/Gem projekt. Doctor kontrollerer tema, CSS, runtime, komponentadaptere og om offlinefilen er opdateret. Det ændrer ingen filer. Filmodulet validerer JSON, formatversion og projektdata og håndterer annulleret filvalg. Se [integrationsguiden](docs/INTEGRATION.md#projekttjek-med-doctor).

Startprojektet kan tilpasses frit. `node tools/cli.mjs update PROJECT_DIR` viser valgfrie versionsopdateringer; tilføj `--apply` for at anvende sikre ændringer. Egen kode bevares, og ændrede filer får separate forslag til manuel fletning. Buildet foretager ingen automatiske opdateringer. Se [opdateringsreglerne](docs/INTEGRATION.md#valgfrie-opdateringer-af-startprojektet).

Nye produkter åbnes direkte fra deres egen `index.html`, ligesom FormLab. Agenten kører `npm install` i produktet ved første udviklingsopsætning, redigerer `src`-filerne og kører `npm run build` efter ændringer, så brugeren blot genindlæser browseren. Den færdige fil kræver ingen installation, og produktets build er uafhængigt af Design Studios mappe. Se [arbejdsmetoden for nye projekter](docs/AGENT-WORKFLOW.md#start-eller-fortsæt-et-produkt).

I et eksisterende produkt bruges `node tools/cli.mjs init PROJECT_DIR --design-only` for kun at oprette designtilknytningen og bevare produktets app- og buildopsætning.

Importér komponentruntime fra design/runtime/components.mjs, eller forbind det gennem projektets frameworkadapter. Registrér faktiske adapterfiler og exports i design-studio.project.json. Læs docs/INTEGRATION.md.

Efter tema- eller biblioteksændringer:

~~~sh
node tools/cli.mjs sync PROJECT_DIR
~~~

## Designgrundlag

Komponenternes funktion, anatomi og anvendelse tager udgangspunkt i Microsoft Fluent 2 og IBM Carbon. Navne og eksempler er projektagnostiske; temaer kan have mange visuelle udtryk. Læs [docs/DESIGN-FOUNDATIONS.md](docs/DESIGN-FOUNDATIONS.md) for kilder, fælles regler og den automatiske kontrastkontrol.

## Nye komponenter

Find først en eksisterende rolle. Tilføj om nødvendigt en variant eller en ny komponent til core/library.mjs med dokumentation og preview. Brug centrale semantiske tokens og defaults. Kontrollér alle temaer, og synkronisér berørte produkter og showcase. Temaerne skal aldrig have hver sin kopi af komponentens struktur.

## Web-showcase

[Den offentlige udgave](https://oliver.fjordside.dk/design-studio/index.html) viser hele Design Studio med samme interface og bibliotek som den lokale editor. Besøgende kan eksperimentere med temaer, tokens og brandguide, men kan ikke åbne eller gemme temafiler eller eksportere. Deres ændringer påvirker ingen produkter og forsvinder ved genindlæsning.

Onlineudgaven er en bygget kopi og opdateres ikke af et lokalt build. [Onlinevejledningen](docs/WEBSITE-SHOWCASE.md) beskriver synkronisering, produktionsbuild og udgivelse fra hjemmesidens projektmappe. tools/build-showcase.mjs --studio --out DIRECTORY eksporterer den fulde offentlige udgave; uden --studio eksporteres den tidligere særskilte komponentdemo.

[Mediearbejdsgangen](docs/PRODUCT-MEDIA.md) beskriver screenshots, tre forskellige produktkortforslag og vurdering i hjemmesidens billedmål uden billedgenerering. Design Studio er reference med det godkendte kort **Samme form, flere udtryk** og seks screenshots. Redigerbare kompositioner og optageopskrifter ligger i `media/design-studio-study/`; de færdige, godkendte eksportfiler ligger i hjemmesidens projekt.

[Signaturkomponenten](docs/SIGNATURE.md) giver produkter et tematilpasset link med Fjordside-logo og Oliver Fjordside i Platypi.

## Portabilitet og kontrolgrænser

De offentlige temaers primære skrifter følger med som lokale WOFF2-filer med deres licenser. Inter, Source Serif 4 og Roboto Mono erstatter afhængigheden af installerede systemskrifter; Castle bevarer Nunito og Alegreya, og Fjordside bevarer Platypi. De fælles webfontudsnit dækker dansk og vestlig latin. Platypi bevarer den oprindelige tegn- og akseldækning. Andre skriftsystemer kan bruge fallback, og rasterisering kan variere mellem browser og operativsystem.

Offlinebuildet og web-showcasen genbruger gentagne data ved pakning. Den færdige editor kræver fortsat hverken netværk eller en ekstra runtime. Leveringsmanifestet viser de faktiske filstørrelser og kontrolsummer. CI er konfigureret til Windows, macOS og Linux; faktiske Mac-/Linux-kørsler er endnu ikke dokumenteret.

Automatiske kontrakter og browserkontrol erstatter ikke hjælpemiddel- eller systemkontrol. Reel Windows-højkontrast, operativsystemets filvælger og brugerens direkte `file://`-forløb er endnu ikke manuelt verificeret som samlet leverance. Strukturelle offlineprøver og HTTP-kontrol dokumenterer andre dele af løsningen. Se [designgrundlagets kontrolafgrænsning](docs/DESIGN-FOUNDATIONS.md#kontrol-i-runtime).

## Indhold

- core/library.mjs: fælles katalog og dokumenterede token-defaults.
- core/components.mjs: sikker fælles markup, native DOM, dialogmarkup og indgang til de fælles controllere.
- core/menus.mjs: fælles tastatur, fokus og åbning/lukning til kommandomenuer.
- core/input-choices.mjs, core/feedback.mjs og core/uploads.mjs: filtrerede valg, meddelelser og lokalt filvalg.
- core/data-table.mjs og core/data-grid.mjs: tabeladfærd og redigerbar arbejdskopi med validering.
- core/motion.mjs: fælles animation med reduceret bevægelse; eksporteres også fra components.mjs.
- core/quality.mjs: semantisk kontrast, målbare variantpar og grundlæggende læsbarhed.
- core/engine.mjs og core/contract.mjs: validering, tokenopløsning, CSS og migration.
- packages/: Studio Light, Midnight Editorial, Fjordside og Castle Studio samt Atelier, Signal og Nocturne, der viser bibliotekets spændvidde.
- schema/: temaformat og læsbar kompatibilitet med format 1.
- studio/: fælles editorinterface og åbning/gemning af temaer.
- tools/build-offline.mjs og index.html: byggeproces og genereret offline-editor.
- tools/: projektintegration og eksport til web-showcase.
- docs/: agentprocedure, integration, temaformat og brandguide.

## Kontrol og migration

~~~sh
npm test
npm run check
node tools/cli.mjs doctor PROJECT_DIR
node tools/cli.mjs validate packages/studio-light.json
node tools/cli.mjs compare packages/studio-light.json packages/midnight-editorial.json
node tools/cli.mjs migrate PROJECT_DIR/design/design.json --out PROJECT_DIR/design/theme-v2.json
~~~

Format 1 beholder sin eksisterende CSS. Konvertering til format 2 er eksplicit og ændrer komponenternes grundlayout til bibliotekets standard. Bevar originalfilen og fjern eventuel dobbelt padding i produktet før overgangen. Ukendte roller skal registreres i biblioteket før migration.

Temaudskiftning bevarer komponentkataloget. Produktets egen kode skal følge bibliotekets dele og semantik. Validering kontrollerer kontrakten og målbare kontrastpar; den erstatter ikke kontrol af produktets konkrete indhold, adaptere og brugerforløb.


Tidligere designudkast og referenceskitser ligger i `discussions and ideas/`. De er idéhistorik; den aktuelle editor bygges fra `studio/` til rodens `index.html`.
