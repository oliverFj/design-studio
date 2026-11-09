# Produktion og levering

Design Studios editor med komponenter, designmønstre og fire brugsscener leveres som én selvstændig `index.html`. De to ekstra materialestudier er selvstændige sider under `examples/scenes/`. Brugeren åbner filerne direkte i browseren via `file://`. Den færdige leverance kræver ingen server, installation, startfil eller Node.js.

## Byg og lever offline-editoren

Dette er kontrollen af en samlet systemleverance. Ved almindelige iterationer følges den proportionale kontrol i [agentarbejdsgangen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion); rene dokumentationsændringer kræver ikke tests eller genbygning. Kør kun `npm ci`, når udviklingsafhængigheder skal installeres fra låsefilen.

Fra projektmappen med Node.js 20 eller nyere:

```sh
npm ci
npm test
npm run check
npm run build
```

`npm ci` installerer udviklingsafhængigheder fra låsefilen. Testene kontrollerer runtime, værktøjer og relevante brugerforløb; `check` validerer de medfølgende temaer. Buildet indlejrer programkode, CSS og alle medfølgende temaer i rodens `index.html`. Kildekoden ligger i Git; den genererede fil er Git-ignoreret og skal bygges efter et nyt checkout.

Agenten kontrollerer den byggede fil over lokal HTTP og bruger relevante statiske offlineprøver efter [agentarbejdsgangen](AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion). Kontrollér det berørte brugerforløb, og ved ændringer i filhåndtering også åbning og download af et tema. Ved en samlet offlineleverance indgår desuden en særskilt direkte filkontrol; hvis browserværktøjet kun tillader HTTP/HTTPS, aftales den manuelle kontrol med brugeren. Forsøg ikke den kendt ikke-understøttede protokol, og omgå ikke en URL-afvisning. HTTP- og statisk kontrol må ikke kaldes direkte filkontrol. Rene dokumentationsændringer kræver hverken nyt build eller gentagelse af kodekontroller.

Kopiér den færdige `index.html` til modtageren. Skal links til materialestudierne også fungere, medtages `examples/scenes/aureol.html` og `examples/scenes/obsidian.html` med samme mappestruktur, eller brug offline-ZIP'en. Notér det anvendte Git-commit sammen med leverancen, så kildegrundlaget kan findes igen.

## Leveringspakker og portabel opsætning

Efter build kan `npm run release` samle to ZIP-filer i `artifacts/release/`:

- `design-studio-offline.zip` indeholder `index.html`, de to materialestudier og læsbare ikon-/skriftlicenser. Pak hele arkivet ud, og åbn `index.html`.
- `design-studio-source.zip` indeholder de nødvendige kilder, temaer, ressourcer, tests, værktøjer og låsefil. Pak den ud på Windows, macOS eller Linux, og kør `npm ci` før udvikling eller build.

`manifest.json` angiver filnavne, byteantal og SHA-256 for arkiver og indhold. Pakningen bruger en afgrænset liste af kildemapper og filtyper; Markdown og JSON under `docs/`, herunder grafikstandardens `style-contract.json`, følger med. Kildepakken indeholder også skills, installationsværktøjer, MCP-runtime og det centrale erfaringsbibliotek. Afgrænset testbelæg under `collaboration/evidence/` følger med, så de tilhørende kildehenvisninger bevares ved distribution. Git bevarer evidensfilernes oprindelige bytes og linjeafslutninger, som kontrolsummerne er beregnet ud fra.

Installerede `node_modules`, platformbinærer, `.git`, lokale agentindstillinger, miljøfiler, erfaringskladder og byggeoutput kopieres ikke til kildepakken. Det gælder også genererede scene-HTML-filer; deres kilder følger med. Almindelige lokale logs udelades; den særskilte evidensmappe kan indeholde gemt testoutput. Kopiér derfor aldrig hele arbejdsmappen som installationspakke. `node tools/build-release.mjs --out DIRECTORY` vælger en anden outputmappe. Fra systemmappen bygger kommandoen en frisk offentlig editor uden private tickets og begge materialestudier før pakning. API-kald med en anden `directory` pakker dens eksisterende build og eventuelle scenesider.

På en anden computer pakkes kildepakken ud ét centralt sted, hvorefter agenten kører `npm ci` og `npm run agents -- install` med de ønskede projektstier og skills. Gentag installationen for sikre opdateringer; lokale skillrettelser bliver konflikter, som skal gennemgås. Se [installations- og samarbejdsguiden](COLLABORATION.md#samlet-installation-i-codex). Den globale agentopsætning og dens maskinstier distribueres ikke med kildepakken.

Installer altid udviklingsafhængigheder fra låsefilen på den aktuelle platform med `npm ci`. En anden platforms `node_modules` skal ikke medbringes. `npm test` finder testfiler gennem Node, så kommandoen ikke afhænger af shellens udvidelse af jokertegn. Testprojekter bruger en separat midlertidig mappe under `artifacts/test-runs/`, som fjernes efter kørslen; brugerens globale miljøindstillinger ændres ikke.

Repositoryets CI er sat op til installation, tests, temakontrol, offlinebuild, showcase og pakning på Windows, macOS og Linux. En konfigureret matrix er ikke dokumentation for en gennemført kørsel; kontrollér resultaterne i den relevante CI-kørsel før en platformsgaranti.

De lokale WOFF2-filer, originale licenser og fontmanifest følger kildepakken. Et almindeligt build kræver hverken fontdownload eller Python. Ved vedligeholdelse af fontressourcer regenererer `node tools/build-fonts.mjs` temaernes indlejrede fontdata fra de indcheckede filer og kontrollerer dem mod manifestets SHA-256. Bevar Platypis oprindelige TTF-filer som kildegrundlag. Offline- og showcasebuild håndhæver desuden størrelsesbudgetter før skrivning.

[Størrelsesgrænserne](../tools/delivery-size.mjs) gælder ukomprimerede UTF-8-filer: 2.150.000 bytes for editoren, 1.650.000 for arbejdsrumseksemplet og hver selvstændig scene samt 850.000 for showcasens temamodul. Editorens ramme omfatter de fire brugsscener og 44 mønsterillustrationer; skrifter og logoer deles ved pakning. En overskridelse stopper buildet; undersøg dublering og ressourcer, før en eventuel ny grænse besluttes.

## Gemning og opdatering

Åbnede temaer og redigeringer findes i browsersessionen. **Gem tema** starter en JSON-download; det overskriver ikke automatisk den åbnede fil. Brugeren skal bevare den hentede temafil før genindlæsning eller lukning og kan senere åbne den igen med **Åbn tema**.

Ved en opdatering bygges en ny `index.html` fra de ændrede kilder. Gem åbne temaer, erstat offlinefilen, og genindlæs browseren. Indbyggede temaer er kopier fra buildtidspunktet; ændringer i editoren opdaterer ikke `packages/` eller andre produkters temaer.

En tidligere leveret `index.html` kan bruges til tilbageførsel. Bevar brugerens temafiler særskilt; en ældre editor kan afvise et nyere temaformat. Bevar derfor også tidligere temafiler ved formatmigration. Tilbageførsel af editoren gendanner ikke brugerdata.

## Nye og eksisterende produkter

`node tools/cli.mjs init PROJECT_DIR --theme THEME_ID` leverer et minimalt offlineprodukt med færdig `index.html`, kildefiler, `npm run build`, `npm run doctor` og fælles filhåndtering. Produktets senere build kræver dets egne udviklingsafhængigheder, men ikke Design Studios mappe.

Efter tema- eller biblioteksændringer køres `node tools/cli.mjs sync PROJECT_DIR`, produktets build og relevant funktionskontrol. Doctor er et læsetjek og reparerer ikke filer. Startskabelonens opdateringer tilbydes særskilt med `update`; egen kode og manuelt kopierede designmønstre opdateres ikke automatisk. Se [integrationsguiden](INTEGRATION.md).

## Designmønstre og fælles layout

Editor og showcase indeholder de afprøvbare referenceeksempler fra `patterns/catalog.mjs`: panel med træk og sammenklapning, objekteditor, parametrisk værksted, opskriftseditor med lag, formular, liste med detaljer, ressourcebibliotek, fortryd/gentag, header/navigation, hero, footer og billedgalleri. Kortvælgeren viser familiespecifikke illustrationer. `node tools/cli.mjs examples PROJECT_DIR` kopierer referencekoden og illustrationsmodulerne uden overskrivning. Produktet ejer derefter tilpasning, data og lagring. Eksemplernes handlinger og gemmepunkter gælder kun hukommelsen; ressourcebiblioteket indlæser ikke i sig selv produktfiler.

Breddeprofilerne `prose`, `form`, `panel`, `split`, `workspace` og `fluid` følger med fælles CSS og runtime. De giver indholdsbestemte standarder og kan tilpasses lokalt; produktet ejer kolonner og placering. Se [designgrundlaget](DESIGN-FOUNDATIONS.md) og [API og designmønstre](INTEGRATION.md).

## Showcase til hjemmesider

```sh
npm run showcase:build
```

Dette eksporterer en separat webdemo til `artifacts/showcase/` med offentlige temaer, komponenter, designmønstre, manifest og licensfiler. Hele mappen leveres samlet gennem et website. Showcasen bruger browsermoduler og er beregnet til webhosting; den selvstændige offline-editor leveres fra rodens `index.html`.

Til en anden eksportmappe bruges `node tools/build-showcase.mjs --out DIRECTORY`. Til den fulde offentlige Studio-udgave bruges `node tools/build-showcase.mjs --studio --out DIRECTORY`. Den har editorens faktiske interface, filåbning og eksport i besøgendes egen browser; private tickets medtages ikke. Begge eksporttyper medtager de selvstændige materialestudier under `examples/scenes/`.

Den tilknyttede hjemmeside bruger den fulde udgave. Kør `npm run sync:design-studio`, `npm run build:production` og `npm run deploy:production` fra hjemmesidens projektmappe, når en onlineopdatering er bestilt. Eksport og build offentliggør ikke automatisk hjemmesiden. Se [den samlede onlinevejledning](WEBSITE-SHOWCASE.md).

## Editorens komponentvisning

Studios komponentkatalog holder rækkens korttoppe synlige og lader den aktive top hænge sammen med et fælles variantpanel. Eksemplerne i rækken skjules under udfoldning og vender animeret tilbage ved lukning. Kortbredderne fastholdes, så panelets spænd over rækken ikke aktiverer tomme gridkolonner. Panelets øverste hjørner er skarpe i alle temaer; de nederste bruger temaets afrunding. Dette er editorens visningsmønster og tilføjer ikke layoutkrav til produktets kortkomponent.

Siden begynder direkte med søgning og katalogvalg. Antallet vises i kataloget; den tidligere ekstra overskrift og omskifter til et samlet eksempel er fjernet. Sammensatte produktdemonstrationer findes under **Scener**.

## Scener og materialestudier

**Scener** i Studio viser fire caseorienterede brugerflader med den globale tema- og farvevælger:

- **Blog · Mellemrum:** lokale artikler og SVG-illustrationer, kategorifilter og artikelvisning med tilbagevenden.
- **Webshop · Form/Butik:** fire produkter, kategorier, produktvalg, antal og kurv med fjernelse og samlet pris. Der er ingen betaling eller ordreafsendelse.
- **Editor · Formværk:** en udstillingsmodel med objekter, arbejdsflade og egenskabspanel, bygget på den fælles objekteditor.
- **Overblik · Studio Nord:** fiktive projekter, nøgletal, søgning, statusfilter, statusændring og noter.

De 13 offentlige temaer kan bruges i alle fire cases. Valg, kurv og kladder bevares ved scene-, tema- og farveskift i den aktuelle session. **Nulstil scene** nulstiller kun den valgte case. Data er lokale demonstrationer og bevares ikke som projektfiler. Kilderne er [studio/scenes.mjs](../studio/scenes.mjs) og modulerne i `studio/scenes/`; de er Studio-kompositioner og indgår ikke automatisk i CLI'ens mønstereksport.

**Materialestudier** åbner Aureol og Obsidian på selvstændige sider med mere atmosfære, frost og rumlig CSS-grafik. Begge har det originale Stade-mærke, tema-/farvevalg, lysstyrke, rumvalg og native dialog. De erstatter ikke brugsscenerne. `npm run build` bygger editor, arbejdsrum og begge studier; `npm run scenes:build` bygger kun studierne. [Byggeværktøjet](../tools/build-scenes.mjs) bruger kilderne i `examples/scenes/` og indlejrer temaer, skrifter og programkode i hver side. Intet hentes under brug.

## Skrifter og portabilitet

Temaets primære skrift skal følge med leverancen og have dokumenteret licens og tegn-/vægtdækning. De offentlige temaer bruger lokale WOFF2-filer: Inter til fælles sans, Source Serif 4 til de relevante expressive serifroller og Roboto Mono til tekniske detaljer. Castle bevarer Nunito og Alegreya; Fjordside bevarer Platypi, komprimeret fra de medfølgende TTF-originaler uden subsetting. De fælles Latin-udsnit dækker dansk og vestlig latin; andre skriftsystemer kan bruge fallback. Samme fontfil er ikke et løfte om identisk rasterisering på alle platforme.

Normale builds bruger de indcheckede ressourcer. Offline-editoren forbliver én selvstændig fil, og kildeleverancen indeholder låsefil frem for installerede afhængigheder. Buildets genbrug af gentagne data ændrer ikke temaformat eller runtime-API. Leveringsmanifestet registrerer faktiske størrelser og kontrolsummer. Windows-, macOS- og Linux-CI er konfigureret; platformsgarantier kræver gennemførte kørsler og relevant konkret kontrol. Se [produktion og levering](PRODUCTION.md).

## Verifikationsstatus

Status konsolideret 9. november 2026.

GitHubs [Portable build på commit 72abdb7](https://github.com/oliverFj/design-studio/actions/runs/42664280555) gennemførte tests, temakontrol, build, showcase og pakning på Windows, macOS og Linux. Den dokumenterer det kildegrundlag, ikke efterfølgende ændringer eller manuel visuel kontrol.

Den aktuelle tema-/scenesamling er lokalt kontrolleret på Windows med 588 beståede tests, temakontrol af alle 49 farver og offlinebuild. Efter den lille katalogoprydning bestod katalogets fem målrettede tests, og build blev gentaget. Browserkontrol over lokal HTTP omfattede de fire cases, alle 13 temavalg, 320px/desktop, bevarede kladder/kurv og afgrænset nulstilling. Materialestudiernes lyse/mørke udtryk, mobilvisning og dialogbetjening blev kontrolleret. De lokale kontrolfiler ligger under `artifacts/` og følger ikke kildepakken.

Reel Windows-højkontrast, operativsystemets filvælger og det samlede direkte `file://`-forløb er endnu ikke manuelt verificeret som samlet leverance. Opdatér denne status ved ny faktisk kontrol; skeln mellem automatiske platformskørsler, HTTP-kontrol, statiske offlineprøver og direkte filkontrol.

## Brug editoren

Dobbeltklik på **[index.html](../index.html)** i systemmappen. Design Studio åbner direkte i din normale browser og fungerer offline. Der kræves ingen server, Windows-app, terminal eller installeret Node.js for at bruge den færdige fil. Alle medfølgende temaer er indbygget.

De medfølgende temaer har deres egne farvetilstande, herunder lyse, mørke og særlige farvevariationer. Farvetilstanden kan følge systemet eller vælges manuelt; det manuelle valg har forrang. Temafilen gemmer alle leverede tilstande, mens en CSS-eksport gælder den valgte fremtoning. Ældre enkeltstående temaer bliver ikke automatisk konverteret.

**Åbn tema** læser en JSON-fil, du vælger, eksempelvis et projekts `design/design.json`. **Gem tema** henter det aktuelle tema som en JSON-fil med tokens, brandguide, originalressourcer og historik. Browseren håndterer placeringen; den oprindeligt åbnede fil overskrives ikke automatisk. Gem den hentede fil på den ønskede placering, og erstat projektets tema bevidst, hvis ændringen skal bruges dér.

Åbnede temaer og ændringer findes i den aktuelle browsersession. Gem dem som filer før genindlæsning eller lukning; hentede temaer kan åbnes igen med **Åbn tema**. De indbyggede temaer er kopier fra seneste build, og redigering ændrer ikke filerne i `packages/`.

`npm start` er en valgfri genvej for udviklere med Node.js; den åbner `index.html` i browseren.

- **Komponenter:** Det samme katalog i alle temaer, med søgning, kategorier og valg mellem illustrationskort og liste. Vælg en komponent for at se varianter og tilstande i det fælles detaljeområde.
- **Animation og effekter:** Afprøv den fælles standard for udfoldning og tilbagevenden: 240 ms i begge retninger, uden ekstra forsinkelse og med respekt for reduceret bevægelse.
- **Tokens:** Redigér temaets værdier. Bibliotekets dokumenterede standardværdier dækker roller, som temaet ikke overskriver.
- **Scener:** Blog, Webshop, Editor og Overblik med bevarede lokale tilstande samt links til materialestudier.
- **Temaet:** Hensigt, principper, form-, farve- og skriftprøver og anbefalet illustrationsstil. **Brand, originaler og kilder** samler brandspecifikke logoer og ressourcer; metadata, historik og CSS-eksport ligger i særskilte foldesektioner.

Under **Designmønstre** findes interaktive eksempler på en objekteditor med kontekstpanel inspireret af FormLab, et parametrisk værksted, en opskriftseditor med lag, en formular, en liste med detaljevisning, et ressourcebibliotek og fortryd/gentag med gemmepunkt samt header/navigation, hero, footer og billedgalleri. De samme eksempler indgår i web-showcasen og kan afprøves med alle temaer. `node tools/cli.mjs examples PROJECT_DIR` kopierer valgfri referencekode og den selvstændige historikhjælper til et tilknyttet projekt uden overskrivning. Se [genbrug af designmønstre](INTEGRATION.md#valgfrie-sammensætningseksempler).

Mønstrene vælges i kortvælgeren; skift bevarer de enkelte kladder. Elleve mønstre har statiske illustrationer i Tegnets anatomi, Lysrum, Passage og Feltlinjer — 44 motiver, som følger temaets grafikmaterialer og Studios illustrationsvalg. Det interaktive mønster **Panel med træk og sammenklapning** bruger samme standardplaceholder som komponenter uden illustration. Panelet demonstrerer skalering, lukning ved slip i lukkezonen og genåbning med kantgrebet; kladden bevares.

Temaet valideres før åbning og gemning. Ugyldige kladder kan redigeres, men ikke gemmes som gyldige temaer. **Hent CSS** under **Temaet** henter temaets genererede CSS for den valgte fremtoning. Når en hentet temafil er lagt tilbage i et produkt, opdateres produktets CSS og runtime med `sync`.
