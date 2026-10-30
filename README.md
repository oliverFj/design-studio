# Design Studio

Et fælles, framework-uafhængigt komponentbibliotek med udskiftelige temaer, agentprocedure, offline-editor i browseren og interaktiv web-showcase.

Kildekode: [oliverFj/design-studio på GitHub](https://github.com/oliverFj/design-studio).

Biblioteket bestemmer struktur, semantik og grundlayout. Temaet bestemmer farver, typografi, afstandsværdier, kanter og skygger. Produktet bestemmer indhold, navigation og forretningslogik.

## Åbn Design Studio

Dobbeltklik på **[index.html](index.html)** i systemmappen. Design Studio åbner direkte i din normale browser og fungerer offline. Der kræves ingen server, Windows-app, terminal eller installeret Node.js for at bruge den færdige fil. Alle otte medfølgende temaer er indbygget.

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

Se [produktion og levering](docs/PRODUCTION.md) for kontrol før levering, opdatering, tilbageførsel og eksport af web-showcasen.

## Ét bibliotek, flere temaer

- **Komponenter:** Det samme katalog i alle temaer. Klik på kortets top for at se varianter og tilstande. Rækkens eksempler skjules, mens korttoppene bliver som klikbare faner med uændret bredde. Klik på den aktive top eller tryk Escape for at lukke.
- **Animation og effekter:** Afprøv den fælles standard for udfoldning og tilbagevenden: 240 ms i begge retninger, uden ekstra forsinkelse og med respekt for reduceret bevægelse.
- **Tokens:** Redigér temaets værdier. Bibliotekets dokumenterede standardværdier dækker roller, som temaet ikke overskriver.
- **Brandguide:** Principper, anvendelsesregler, godkendte logoer, skrifter og originalressourcer.
- **Temaet:** Navn, beskrivelse, historik, JSON-eksport og genereret CSS.

Under **Designsystem → Designmønstre** findes interaktive eksempler på en objekteditor med kontekstpanel inspireret af FormLab, en formular, en liste med detaljevisning, et ressourcebibliotek og fortryd/gentag med gemmepunkt samt header/navigation, hero, footer og billedgalleri. De samme eksempler indgår i web-showcasen og kan afprøves med alle temaer. `node tools/cli.mjs examples PROJECT_DIR` kopierer valgfri referencekode og den selvstændige historikhjælper til et tilknyttet projekt uden overskrivning. Se [genbrug af designmønstre](docs/INTEGRATION.md#valgfrie-sammensætningseksempler).

Komponentstruktur redigeres i det fælles bibliotek, ikke i hvert tema. Padding og gap kommer fra biblioteket. De semantiske spacingtokens skal være positive; temaet kan hverken udelade grundlayoutet eller erstatte det med nul-padding.

Temaet valideres før åbning og gemning. Ugyldige kladder kan redigeres, men ikke gemmes som gyldige temaer. **Hent CSS** under **Temaet** henter temaets genererede CSS. Når en hentet temafil er lagt tilbage i et produkt, opdateres produktets CSS og runtime med `sync`.

Bibliotek 3.0.0 har 37 fælles roller og otte offentlige temaer. Knapfamilien har fire fremhævelser: primary, secondary, tertiary og ghost. Størrelse og destruktiv betydning vælges særskilt; knaplignende navigation bruger samme rolle med native links. `link`, `navigation` og `image` dækker websites sammen med de fælles designmønstre. Billedeksemplerne bruger det valgte temas palette; produktets egne billeder bevares.

`tree`, `stack`, `scroll-area` og programmenuerne bevarer deres eksisterende roller. Historiske knapvarianter understøttes til kompatibilitet, mens ny kode bruger den fælles knapfamilie. Se [integrationsguiden](docs/INTEGRATION.md) for API og sammensætning og [temaformatet](docs/PACKAGE-FORMAT.md) for kontrakten. Biblioteksversionen er særskilt fra editorens versionsnummer.

## Brug i et produkt

Giv agenten denne instruktion:

> Brug Design Studio-systemet i E:/AI projekter/Design Studio. Læs README.md, AGENTS.md og docs/AGENT-WORKFLOW.md. Vælg komponenter fra det fælles bibliotek, og brug projektets tema til deres visuelle udtryk.

Opret tilknytningen fra systemmappen:

~~~sh
node tools/cli.mjs init "E:/sti/til/produkt" --theme studio-light
~~~

Projektmappen skal eksistere. Kommandoen opretter et minimalt offlineprojekt med kildefiler i `src/`, `tools/build.mjs`, `package.json` med `npm run build` og en færdig `index.html`, som kan åbnes med det samme. Den opretter også tema, CSS, fælles komponentruntime, eventuelle brandoriginaler, projektkonfiguration og en anvisning i produktets AGENTS.md. Eksisterende output overskrives ikke; ved filkonflikter ændres intet.

Nye projekter får også `npm run doctor` og fælles filhåndtering med Åbn projekt/Gem projekt. Doctor kontrollerer tema, CSS, runtime, komponentadaptere og om offlinefilen er opdateret. Det ændrer ingen filer. Filmodulet validerer JSON, formatversion og projektdata og håndterer annulleret filvalg. Se [integrationsguiden](docs/INTEGRATION.md#projekttjek-med-doctor).

Startprojektet kan tilpasses frit. `node tools/cli.mjs update PROJECT_DIR` viser valgfrie versionsopdateringer; tilføj `--apply` for at anvende sikre ændringer. Egen kode bevares, og ændrede filer får separate forslag til manuel fletning. Buildet foretager ingen automatiske opdateringer. Se [opdateringsreglerne](docs/INTEGRATION.md#valgfrie-opdateringer-af-startprojektet).

Nye produkter åbnes direkte fra deres egen `index.html`, ligesom FormLab. Agenten kører `npm install` i produktet ved første udviklingsopsætning, redigerer `src`-filerne og kører `npm run build` efter ændringer, så brugeren blot genindlæser browseren. Den færdige fil kræver ingen installation, og produktets build er uafhængigt af Design Studios mappe. Se [arbejdsmetoden for nye projekter](docs/AGENT-WORKFLOW.md#start-et-projekt).

I et eksisterende produkt bruges `node tools/cli.mjs init PROJECT_DIR --design-only` for kun at oprette designtilknytningen og bevare produktets app- og buildopsætning.

Importér komponentruntime fra design/runtime/components.mjs, eller forbind det gennem projektets frameworkadapter. Registrér faktiske adapterfiler og exports i design-studio.project.json. Læs docs/INTEGRATION.md.

Efter tema- eller biblioteksændringer:

~~~sh
node tools/cli.mjs sync "E:/sti/til/produkt"
~~~

## Designgrundlag

Komponenternes funktion, anatomi og anvendelse tager udgangspunkt i Microsoft Fluent 2 og IBM Carbon. Navne og eksempler er projektagnostiske; temaer kan have mange visuelle udtryk. Læs [docs/DESIGN-FOUNDATIONS.md](docs/DESIGN-FOUNDATIONS.md) for kilder, fælles regler og den automatiske kontrastkontrol.

## Nye komponenter

Find først en eksisterende rolle. Tilføj om nødvendigt en variant eller en ny komponent til core/library.mjs med dokumentation og preview. Brug centrale semantiske tokens og defaults. Kontrollér alle temaer, og synkronisér berørte produkter og showcase. Temaerne skal aldrig have hver sin kopi af komponentens struktur.

## Web-showcase

Showcasen bruger samme bibliotek, renderer og offentlige temaer. Den kræver ingen backend til tema- og komponentskift. Kør npm run sync:design-studio i E:/AI projekter/Hjemmeside før hjemmesidens normale build. Det eksporterer gennem tools/build-showcase.mjs til public/design-studio. Andre websites kan bruge tools/build-showcase.mjs --out DIRECTORY. Hjemmesidens projektside forklarer systemet og åbner demoen. Temaer redigeres i offline-editoren via index.html; showcasen er en separat demo til websites.

## Indhold

- core/library.mjs: fælles katalog og dokumenterede token-defaults.
- core/components.mjs: sikker fælles markup, native DOM og dialoghjælpere.
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
node tools/cli.mjs doctor "E:/sti/til/produkt"
node tools/cli.mjs validate packages/studio-light.json
node tools/cli.mjs compare packages/studio-light.json packages/midnight-editorial.json
node tools/cli.mjs migrate "E:/produkt/design/design.json" --out "E:/produkt/design/theme-v2.json"
~~~

Format 1 beholder sin eksisterende CSS. Konvertering til format 2 er eksplicit og ændrer komponenternes grundlayout til bibliotekets standard. Bevar originalfilen og fjern eventuel dobbelt padding i produktet før overgangen. Ukendte roller skal registreres i biblioteket før migration.

Temaudskiftning bevarer komponentkataloget. Produktets egen kode skal følge bibliotekets dele og semantik. Validering kontrollerer kontrakten og målbare kontrastpar; den erstatter ikke kontrol af produktets konkrete indhold, adaptere og brugerforløb.


Tidligere designudkast og referenceskitser ligger i `discussions and ideas/`. De er idéhistorik; den aktuelle editor bygges fra `studio/` til rodens `index.html`.
