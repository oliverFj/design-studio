# Produktion og levering

Design Studios standardleverance er én selvstændig `index.html`. Brugeren åbner filen direkte i browseren via `file://`. Den færdige editor kræver ingen server, installation, startfil eller Node.js. Server- og Windows-appudgaverne er fjernet.

## Byg og lever offline-editoren

Dette er kontrollen af en samlet systemleverance. Ved almindelige iterationer følges den proportionale kontrol i [agentarbejdsgangen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion); rene dokumentationsændringer kræver ikke tests eller genbygning. Kør kun `npm ci`, når udviklingsafhængigheder skal installeres fra låsefilen.

Fra projektmappen med Node.js 20 eller nyere:

```sh
npm ci
npm test
npm run check
npm run build
```

`npm ci` installerer udviklingsafhængigheder fra låsefilen. Testene kontrollerer runtime, værktøjer og relevante brugerforløb; `check` validerer de medfølgende temaer. Buildet indlejrer programkode, CSS og alle otte temaer i rodens `index.html`. Kildekoden ligger i Git; den genererede fil er Git-ignoreret og skal bygges efter et nyt checkout.

Åbn den byggede fil direkte i browseren før levering. Kontrollér det berørte brugerforløb, og ved ændringer i filhåndtering også åbning og download af et tema. Automatiske kontroller erstatter ikke denne konkrete browserkontrol. Rene dokumentationsændringer kræver hverken nyt build eller gentagelse af kodekontroller.

Kopiér den færdige `index.html` til modtageren. Notér det anvendte Git-commit sammen med leverancen, så kildegrundlaget kan findes igen. Der er ingen separat installation eller serveropsætning hos modtageren.

## Leveringspakker og portabel opsætning

Efter build kan `npm run release` samle to ZIP-filer i `artifacts/release/`:

- `design-studio-offline.zip` indeholder den byggede `index.html` og læsbare ikon-/skriftlicenser. Pak den ud, og åbn `index.html`.
- `design-studio-source.zip` indeholder de nødvendige kilder, temaer, ressourcer, tests, værktøjer og låsefil. Pak den ud på Windows, macOS eller Linux, og kør `npm ci` før udvikling eller build.

`manifest.json` angiver filnavne, byteantal og SHA-256 for arkiver og indhold. Pakningen bruger en afgrænset liste af kildemapper og filtyper; installerede `node_modules`, platformbinærer, `.git`, miljøfiler, logs og byggeoutput kopieres ikke til kildepakken. Kopiér derfor aldrig hele arbejdsmappen som installationspakke. `node tools/build-release.mjs --out DIRECTORY` vælger en anden outputmappe. Kommandoen pakker det eksisterende offlinebuild og bygger det ikke automatisk igen.

Installer altid udviklingsafhængigheder fra låsefilen på den aktuelle platform med `npm ci`. En anden platforms `node_modules` skal ikke medbringes. `npm test` finder testfiler gennem Node, så kommandoen ikke afhænger af shellens udvidelse af jokertegn. Testprojekter bruger en separat midlertidig mappe under `artifacts/test-runs/`, som fjernes efter kørslen; brugerens globale miljøindstillinger ændres ikke.

Repositoryets CI er sat op til installation, tests, temakontrol, offlinebuild, showcase og pakning på Windows, macOS og Linux. En konfigureret matrix er ikke dokumentation for en gennemført kørsel; kontrollér resultaterne i den relevante CI-kørsel før en platformsgaranti.

De lokale WOFF2-filer, originale licenser og fontmanifest følger kildepakken. Et almindeligt build kræver hverken fontdownload eller Python. Ved vedligeholdelse af fontressourcer regenererer `node tools/build-fonts.mjs` temaernes indlejrede fontdata fra de indcheckede filer og kontrollerer dem mod manifestets SHA-256. Bevar Platypis oprindelige TTF-filer som kildegrundlag. Offline- og showcasebuild håndhæver desuden størrelsesbudgetter før skrivning.

[Størrelsesgrænserne](../tools/delivery-size.mjs) gælder ukomprimerede UTF-8-filer: 1.500.000 bytes for editoren, 1.250.000 for arbejdsrumseksemplet og 800.000 for showcasens temamodul. En overskridelse stopper buildet; undersøg dublering og ressourcer, før en eventuel ny grænse besluttes.

## Gemning og opdatering

Åbnede temaer og redigeringer findes i browsersessionen. **Gem tema** starter en JSON-download; det overskriver ikke automatisk den åbnede fil. Brugeren skal bevare den hentede temafil før genindlæsning eller lukning og kan senere åbne den igen med **Åbn tema**.

Ved en opdatering bygges en ny `index.html` fra de ændrede kilder. Gem åbne temaer, erstat offlinefilen, og genindlæs browseren. Indbyggede temaer er kopier fra buildtidspunktet; ændringer i editoren opdaterer ikke `packages/` eller andre produkters temaer.

En tidligere leveret `index.html` kan bruges til tilbageførsel. Bevar brugerens temafiler særskilt; en ældre editor kan afvise et nyere temaformat. Bevar derfor også tidligere temafiler ved formatmigration. Tilbageførsel af editoren gendanner ikke brugerdata.

## Nye og eksisterende produkter

`node tools/cli.mjs init PROJECT_DIR --theme THEME_ID` leverer et minimalt offlineprodukt med færdig `index.html`, kildefiler, `npm run build`, `npm run doctor` og fælles filhåndtering. Produktets senere build kræver dets egne udviklingsafhængigheder, men ikke Design Studios mappe.

Efter tema- eller biblioteksændringer køres `node tools/cli.mjs sync PROJECT_DIR`, produktets build og relevant funktionskontrol. Doctor er et læsetjek og reparerer ikke filer. Startskabelonens opdateringer tilbydes særskilt med `update`; egen kode og manuelt kopierede designmønstre opdateres ikke automatisk. Se [integrationsguiden](INTEGRATION.md).

## Designmønstre og fælles layout

Editor og showcase indeholder ni afprøvbare referenceeksempler: objekteditor, formular, liste med detaljer, ressourcebibliotek, fortryd/gentag, header/navigation, hero, footer og billedgalleri. `node tools/cli.mjs examples PROJECT_DIR` kopierer referencekoden uden overskrivning. Produktet ejer derefter tilpasning, data og lagring. Eksemplernes handlinger og gemmepunkter gælder kun hukommelsen; ressourcebiblioteket indlæser ikke i sig selv produktfiler.

Breddeprofilerne `prose`, `form`, `panel`, `split`, `workspace` og `fluid` følger med fælles CSS og runtime. De giver indholdsbestemte standarder og kan tilpasses lokalt; produktet ejer kolonner og placering. Se [designgrundlaget](DESIGN-FOUNDATIONS.md) og [API og designmønstre](INTEGRATION.md).

## Showcase til hjemmesider

```sh
npm run showcase:build
```

Dette eksporterer en separat webdemo til `artifacts/showcase/` med offentlige temaer, komponenter, designmønstre, manifest og licensfiler. Hele mappen leveres samlet gennem et website. Showcasen bruger browsermoduler og er beregnet til webhosting; den selvstændige offline-editor leveres fra rodens `index.html`.

Til en anden eksportmappe bruges `node tools/build-showcase.mjs --out DIRECTORY`. Til den fulde Studio-udgave uden gemning og eksport bruges `node tools/build-showcase.mjs --studio --out DIRECTORY`. Den bygges fra editorens faktiske interface, og besøgende kan eksperimentere i deres egen browser.

Den tilknyttede hjemmeside bruger den fulde udgave. Kør `npm run sync:design-studio`, `npm run build:production` og `npm run deploy:production` fra hjemmesidens projektmappe, når en onlineopdatering er bestilt. Eksport og build offentliggør ikke automatisk hjemmesiden. Se [den samlede onlinevejledning](WEBSITE-SHOWCASE.md).
