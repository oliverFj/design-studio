# Design Studio

Et fælles, framework-uafhængigt komponentbibliotek med udskiftelige temaer, agentprocedure, lokal desktop-editor og interaktiv web-showcase.

Biblioteket bestemmer struktur, semantik og grundlayout. Temaet bestemmer farver, typografi, afstandsværdier, kanter og skygger. Produktet bestemmer indhold, navigation og forretningslogik.

## Åbn Design Studio

Dobbeltklik på **Design Studio.lnk** (genvejen i systemmappen) eller **Start Design Studio.cmd**. Den åbner den byggede Windows-app i sit eget vindue uden et terminalvindue eller manuel serverstart. Brug **Filer → Åbn projekttema** til at redigere et projekts design/design.json.

Den pakkede app har sin nødvendige runtime med. En selvstændig udgave opbevarer brugerens temaer i en skrivbar lokal arbejdsmappe; en udgave startet fra systemmappen kan arbejde med dens temaer. Lokale serverfunktioner starter og stopper sammen med appen.

Browseralternativet er **Start Design Studio Browser.cmd** eller npm start. Til udvikling af desktop bruges npm run desktop. Byg en ny Windows-distribution med npm run desktop:build; npm run desktop:smoke kontrollerer den pakkede app. CLI/browser kræver Node.js 20 eller nyere; desktopudvikling og pakning kræver Node.js 22.12 eller nyere; installer afhængigheder med npm install. Bibliotekets browser-runtime kræver ingen frameworkpakker. Den færdige portable app ligger i release/Design-Studio-0.2.0-portable.exe; genvejen åbner release/current/win-unpacked/Design Studio.exe.

## Ét bibliotek, flere temaer

- **Komponenter:** Det samme katalog af komponenter i alle temaer. Vælg varianter, læs anvendelse og inspicér den fælles definition.
- **Tokens:** Redigér temaets værdier. Bibliotekets dokumenterede standardværdier dækker roller, som temaet ikke overskriver.
- **Brandguide:** Principper, anvendelsesregler, godkendte logoer, skrifter og originalressourcer.
- **Temaet:** Navn, beskrivelse, historik, JSON-eksport og genereret CSS.

Komponentstruktur redigeres i det fælles bibliotek, ikke i hvert tema. Padding og gap kommer fra biblioteket. De semantiske spacingtokens skal være positive; temaet kan hverken udelade grundlayoutet eller erstatte det med nul-padding.

Gem ændringer skriver til den åbnede JSON-fil. Importér tema opretter en kopi; eksisterende filer overskrives ikke. Projektets genererede CSS opdateres med sync efter redigering. Revisionstjek forhindrer, at en samtidig filændring overskrives.

Bibliotek 2.5.0 har 30 fælles roller og syv offentlige temaer. `stack` styrer afstand mellem komponenter, `scroll-area` giver indlejret indhold én synlig ramme, og handlingsfamilierne bruger fælles hover-/tryk-tokens. Se [integrationsguiden](docs/INTEGRATION.md) for sammensætning og [temaformatet](docs/PACKAGE-FORMAT.md) for kontrakten. Biblioteksversionen er særskilt fra desktop-appens versionsnummer.

## Brug i et produkt

Giv agenten denne instruktion:

> Brug Design Studio-systemet i E:/AI projekter/Design Studio. Læs README.md, AGENTS.md og docs/AGENT-WORKFLOW.md. Vælg komponenter fra det fælles bibliotek, og brug projektets tema til deres visuelle udtryk.

Opret tilknytningen fra systemmappen:

~~~sh
node tools/cli.mjs init "E:/sti/til/produkt" --theme studio-light
~~~

Projektmappen skal eksistere. Kommandoen opretter tema, CSS, fælles komponentruntime, eventuelle brandoriginaler, projektkonfiguration og en anvisning i produktets AGENTS.md. Eksisterende output overskrives ikke.

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

Showcasen bruger samme bibliotek, renderer og offentlige temaer. Den kræver ingen backend til tema- og komponentskift. Kør npm run sync:design-studio i E:/AI projekter/Hjemmeside før hjemmesidens normale build. Det eksporterer gennem tools/build-showcase.mjs til public/design-studio. Andre websites kan bruge tools/build-showcase.mjs --out DIRECTORY. Hjemmesidens projektside forklarer systemet og åbner demoen. Lokal projektredigering tilhører desktop-appen.

## Indhold

- core/library.mjs: fælles katalog og dokumenterede token-defaults.
- core/components.mjs: sikker fælles markup, native DOM og dialoghjælpere.
- core/quality.mjs: semantisk kontrast, målbare variantpar og grundlæggende læsbarhed.
- core/engine.mjs og core/contract.mjs: validering, tokenopløsning, CSS og migration.
- packages/: Studio Light, Midnight Editorial, Fjordside og Castle Studio samt Atelier, Signal og Nocturne, der viser bibliotekets spændvidde.
- schema/: temaformat og læsbar kompatibilitet med format 1.
- studio/ og server.mjs: lokal temaeditor og kontrolleret filadgang.
- desktop/: Windows-app og pakningskonfiguration.
- tools/: projektintegration, desktopdistribution og web-showcase.
- docs/: agentprocedure, integration, temaformat og brandguide.

## Kontrol og migration

~~~sh
npm test
npm run check
node tools/cli.mjs validate packages/studio-light.json
node tools/cli.mjs compare packages/studio-light.json packages/midnight-editorial.json
node tools/cli.mjs migrate "E:/produkt/design/design.json" --out "E:/produkt/design/theme-v2.json"
~~~

Format 1 beholder sin eksisterende CSS. Konvertering til format 2 er eksplicit og ændrer komponenternes grundlayout til bibliotekets standard. Bevar originalfilen og fjern eventuel dobbelt padding i produktet før overgangen. Ukendte roller skal registreres i biblioteket før migration.

Temaudskiftning bevarer komponentkataloget. Produktets egen kode skal følge bibliotekets dele og semantik. Validering kontrollerer kontrakten og målbare kontrastpar; den erstatter ikke kontrol af produktets konkrete indhold, adaptere og brugerforløb.

