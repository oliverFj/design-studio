# Arbejdsmetode for agenter

Denne vejledning er den fælles arbejdsgang fra produktstart til kontrolleret leverance. Produktets egne anvisninger bestemmer indhold, funktioner og arkitektur. Genbrug viden fra den aktuelle session; genlæs kun ændrede eller relevante dele.

Brug det aktuelle katalog og `COMPONENT_COVERAGE` i `core/library.mjs` til at skelne mellem markup, native adfærd og controllere. Dækningen er afgrænset og er ikke en tilgængelighedscertificering.

## Find grundlaget

Læs produktets egne anvisninger og systemets [AGENTS.md](../AGENTS.md). Brug opgavematricen dér og læs kun de relevante afsnit; README er en introduktion, ikke obligatorisk agentkontekst. [Designgrundlaget](DESIGN-FOUNDATIONS.md) ejer generelle tekniske principper og kvalitetskrav; [integrationsguiden](INTEGRATION.md) ejer komponentkontrakter og API. Søg via MCP og hent det konkrete guideafsnit eller mønster, når forbindelsen er tilgængelig; ellers læses samme kildefiler lokalt.

Ved gentagen fejlsøgning eller overdraget arbejde: søg i de [fælles erfaringer](COLLABORATION.md#agentens-arbejdsgang), og læs relevante poster med kilder og begrænsninger. Brug Stade-MCP, når forbindelsen er tilgængelig; ellers læses `collaboration/experiences.json` direkte. Efterprøv løsningen i den aktuelle produktversion, og foreslå kun nye erfaringer ved konkret genbrugelig viden.

Ved bestilt projekttilknytning bruges den [fælles installation](COLLABORATION.md#samlet-installation-i-codex) af MCP og skills. Tilføj kun de navngivne projekter; bevar øvrige indstillinger og lokale skillrettelser. Brug `stade-collaboration` som fælles arbejdsvejledning og vælg produktspecifikke skills efter opgaven. En installeret skill eller bestået serverprøve er ikke i sig selv bevis for, at den aktuelle chat har indlæst forbindelsen.

Ved tema- og designarbejde bruges [designgrundloven](DESIGN-PRINCIPLES.md) som fælles beslutningsgrundlag fra tokens til produkter. Genbrug allerede læste principper; gennemgå især de berørte afsnit ved ændringer.

Find `design-studio.project.json`. Brug dens faktiske filstier, scope, tema og registrerede adaptere; standardstierne er `design/design.json`, `design/design.css` og `design/runtime/components.mjs`. Bevar produktets brand. Læs relevante brandprincipper, sektionsregler og logobrug; genbrug godkendte originaler og licenser.

| Kilde | Ansvar |
| --- | --- |
| `core/library.mjs`, `core/components.mjs` og fælles hjælpere | Komponentroller, anatomi, semantik, interne afstande og genbrugelig interaktion. |
| `packages/*.json` eller produktets tema | Tokens, godkendte appearance-overrides, brand og temahistorik. Ingen komponentdefinitioner. |
| `patterns/catalog.mjs` og referenceeksempler | Valgfri produktkode til hele forløb. Kopier tilpasses og ejes derefter af produktet. |
| Produktets kildekode | Skærmkomposition, indhold, data, kommandoer, navigation og lagring. |

## Start eller fortsæt et produkt

**Nyt projekt:** Opret først produktmappen. Kør fra Design Studios mappe:

```sh
node tools/cli.mjs init PROJECT_DIR --theme studio-light
```

Erstat `PROJECT_DIR` med produktets faktiske sti. Vælg tema efter produktets karakter; Studio (`studio-light`) er et udgangspunkt, ikke et æstetisk krav. Init leverer redigerbare `src`-filer, byggeopsætning, designfiler, agentanvisning og en færdig `index.html`. Eksisterende output overskrives ikke.

Kør derefter i produktmappen:

```sh
npm install
npm run doctor
```

**Eksisterende produkt:** Bevar dets arkitektur. Mangler designtilknytningen, bruges `init PROJECT_DIR --theme THEME_ID --design-only`. Dette etablerer ikke en ny app eller byggeopsætning. Find produktets faktiske build- og kontrolkommandoer.

Ved udtræk af mønstre eller indføring af nyere DS-løsninger følges [produktbaserede mønstre og skånsom opdatering](PRODUCT-PATTERNS.md). Brug det relevante produkt som reference og pilot; vurder funktioner og tilstande før erstatning. Bevar produktets faktiske driftsmodel, brand og arbejdsmodel. En nyere DS-demo er ikke i sig selv en bestilling på at omlægge et eksisterende produkt.

Lever som standard en selvstændig `index.html`, der kan åbnes via `file://` uden server, terminal eller installeret runtime. Pak kode, komponentruntime, CSS, skrifter og øvrige nødvendige ressourcer til offlinebrug. Undgå CDN'er, eksterne runtimeafhængigheder og lokale fetch-/modulkald. En anden driftsmodel kræver et udtrykkeligt brugerkrav eller konkret nødvendig funktionalitet; forklar behovet.

## Vælg og sammensæt

1. Find først rollen i det effektive katalog med `getComponents(theme)`. Læs de berørte komponenters `usage`, dele, varianter og tilstande. Genbrug rollen; tilføj en variant ved samme funktion og en ny fælles rolle kun ved et selvstændigt, genbrugeligt behov.
2. Ved hele skærme: undersøg `patterns/catalog.mjs`. `node tools/cli.mjs examples PROJECT_DIR` kopierer referencekode uden overskrivning. Bevar ophav og licenser. Arbejdsfladen i `examples/workspace/` viser også formularer, kladder, filhåndtering og temaskift i et samlet produkt.
3. Vælg bredde efter indholdets rolle: `prose` til læsetekst, `form` til indstillinger, `panel` til værktøjer, `split` til liste/detaljer, `workspace` til sammensatte editorer og `fluid` til reelt brede arbejdsflader. Brug `createLayout` eller `ds-layout`/`data-layout`; produktet bestemmer kolonner og placering. Se [breddeprofiler](INTEGRATION.md#fælles-breddeprofiler).
4. Importér `createComponent`, `createComponentFactory` eller `renderComponent` fra projektets kopierede runtime. Brug native controls og fælles dele. Registrér kun faktiske frameworkadaptere i konfigurationens `components` med verificerede `file` og `export`; direkte brug af runtime kræver ingen lokal adapter.

Temaet må ikke erstatte display, struktur, positionering, padding, gap eller fokusmekanik. Justér tæthed gennem positive semantiske spacingtokens. Produktets CSS ejer kun sammensætningen; opret ikke lokale kopier af fælles komponentroller. Se [afstande og indlejrede flader](INTEGRATION.md#afstande-og-indlejrede-flader) frem for at genskabe deres regler i produktet.

Ved personlig afsenderkreditering bruges [signature med Fjordside-identiteten](SIGNATURE.md). Vælg variant og placering efter produktet; bevar produktets eget brand.

## Forbind den faktiske adfærd

Et deklarativt preview viser ikke nødvendigvis en færdig interaktion. Vælg den relevante fælles runtime:

Find den relevante runtime og produktansvaret i [controlleroversigten](INTEGRATION.md#vælg-controller), og læs komponentens eget API-afsnit før integration.

Bevar dokumentdata, kladder, valg, viste fejl og relevante gemmetilstande ved temaskift eller genmontering. Fjern en gemt-bekræftelse, når indholdet ændres igen. Kassér controllere og effekter med deres `destroy`/cleanup før udskiftning af DOM. Se [API og eksempler](INTEGRATION.md).

Et datagrid-commit betyder kun, at arbejdskopien har accepteret ændringen. Produktet ejer lagring, fortryd, netværksfejl og gemmestatus. Afslut eller annullér en aktiv cellekladde før ændring af dens editoropsætning eller fjernelse af dens række/kolonne; et afvist `update` giver `false` og skal håndteres. Bevar den levende DOM ved rene temaændringer, når muligt, eller aflæs og genskab arbejdskopi og kladde bevidst. Se [grid-API](INTEGRATION.md#redigerbart-datagrid).

Brug `createProjectFile` med produktets format-id, version og datavalidering. Opdatér først state efter vellykket åbning og eventuel afklaring af ugemte ændringer. Annullering, ugyldige filer og ukendte versioner skal bevare den aktuelle tilstand. En download bekræfter ikke, at en fil er gemt på disken, og overskriver ikke automatisk originalen. Se [projektfiler](INTEGRATION.md#fælles-projektfiler).

## Byg og opdatér

- Installer fra produktets låsefil med `npm ci`, når den findes; et nyt startprojekt opretter sin første låsefil med `npm install`. Flyt kilder og låsefil mellem platforme, og installer lokalt frem for at kopiere `node_modules`.
- Bevar temaets lokale WOFF2-filer og licenser. Normale builds bruger de indcheckede ressourcer uden fontdownload eller Python.
- Redigér produktets kilder, ikke genereret `index.html`, CSS eller kopieret runtime. Kør produktets `npm run build` efter kode-, tema- og ressourceændringer. Agenten bygger; brugeren genindlæser browseren.
- Ved ændringer i tema eller fælles runtime: kør `node tools/cli.mjs sync PROJECT_DIR` fra systemmappen og genbyg produktet. Rene produktændringer kræver ikke en ny sync.
- Brug `npm run doctor` i startprojektet til at finde forældede filer, ugyldige temaer og adapterfejl. Det er et læsetjek og erstatter ikke funktionskontrol.
- `node tools/cli.mjs update PROJECT_DIR` viser valgfrie skabelonopdateringer. Gennemgå planen før `--apply`; lokale ændringer bevares og eventuelle forslag flettes efter behov. Update erstatter ikke produktets egen kode eller AGENTS.md. Se [opdateringsregler](INTEGRATION.md#valgfrie-opdateringer-af-startprojektet).

## Kontrollér den berørte funktion

Tilpas kontrollen til ændringen. Små, reversible rettelser kræver højst én hurtig relevant kontrol; kør ikke automatisk alle tests og builds i rækkefølge. En ny skærm eller væsentlig ændring i layout eller adfærd skal også inspiceres i browseren.

Ved en ny skærm: afprøv normaltilstand og relevante lange tekster, feltfejl eller tomme resultater. Kontrollér tastatur, fokus og smal visning omkring 320 CSS-px. Ved temaændringer kontrolleres også relevante lyse, mørke og ekspressive temaer. Ved ændringer i fælles stilregler kontrolleres de temaer, der bruger reglerne. Kontrollér zoom, reduceret bevægelse, højkontrast og hjælpemidler, når de er relevante; angiv præcist, hvad der faktisk er afprøvet.

Agentens standardkontrol kombinerer to forskellige prøver:

- **Visning og brugerforløb:** Åbn den byggede fil over en loopback-server, der kun udstiller nødvendigt testindhold. Det kræver ikke særskilt bekræftelse ved almindelig lokal kontrol. Genbrug forhåndsvisningen og genindlæs efter build.
- **Offlinepakning:** Brug produktets eksisterende doctor, buildkontrol eller `offlineIssues` fra `tools/offline-checks.mjs` til at undersøge indbygget kode, CSS, ressourcer og mulige netværksafhængigheder. Tilpas kontrollen til ændringen; gentag ikke uændrede prøver uden grund.

Brugerens leverance er fortsat en selvstændig `index.html`, som kan åbnes ved dobbeltklik. HTTP-kontrol og statiske offlineprøver beviser ikke i sig selv alle direkte `file://`-forløb.

Læs browserværktøjets dokumenterede URL-understøttelse, før det bruges. Et værktøj, der kun tillader HTTP/HTTPS, skal ikke have `file://`-adresser. En kendt begrænsning skal ikke genafprøves i hver opgave. Respektér en afvisning; skift ikke browserflade, værktøj eller script for at opnå samme blokerede filadgang. Ældre genererede DS-anvisninger om direkte åbning af editorens fil beskriver brugerens adgang til editoren, ikke et krav til agentens browserkontrol.

Direkte filkontrol er en særskilt slutkontrol ved ændrede offlineafhængigheder, filhåndtering eller en bestilt samlet offlineleverance. Brug kun en dokumenteret, tilladt kontrolvej. Hvis den mangler, færdiggøres den øvrige kontrol, og den konkrete manuelle filkontrol aftales med brugeren. Rapportér den udestående kontrol, når den har betydning for opgaven; gentag ikke den kendte værktøjsbegrænsning som standardforbehold efter almindelige UI-rettelser. Beskriv altid den kontrol, der faktisk er udført.

Ved ændret filhåndtering: afprøv gemning, genåbning og afvisning af en ugyldig fil uden datatab. Doctor skal acceptere produktets aktuelle build. Rapportér kort ændringen, de udførte kontroller og væsentlige begrænsninger. Dokumentation konsolideres, når brugeren bestiller det; opret ikke løbende sessionsrapporter.

Se [verifikationsstatus](PRODUCTION.md#verifikationsstatus) for uafprøvede platform- og hjælpemiddelforløb. Ved en systemleverance bruges [leveringspakkerne](PRODUCTION.md#leveringspakker-og-portabel-opsætning), som holder installerede afhængigheder og lokale filer ude af kildepakken.

## Når selve systemet ændres

Fælles roller skal have `name`, `description`, `usage`, `composes`, `parts`, `variants`, `states` og deklarativt `preview` i `core/library.mjs`. Genbrug semantiske tokens og dokumenterede centrale defaults. Hold kontrakt, runtime, kvalitet, skema, temaer og interface konsistente.

Vælg prøver ud fra, hvad ændringen kan påvirke.

| Ændring | Kontrol |
| --- | --- |
| Fælles mønster | Kør `npm run test:patterns` for mønstergruppen, eller afgræns til den berørte prøve med `npm run test:patterns -- --test-name-pattern="..."`. Afprøv ændret betjening i et relevant produkt. |
| Komponent eller controller | Kør de berørte testfiler og prøv relevante samspil. Fx `node --test tests/overlays.test.mjs` for en ændring af popoverens fokus eller placering. |
| Tema eller fælles stilregler | Kør den relevante temakontrol. `npm run check` kontrollerer det offentlige temakatalogs pakker, CSS, geometri og kontrast. Mønsterprøverne ligger i testpakken. |
| Eksport, synkronisering eller build | Kør prøverne for den berørte kommando og afprøv den ændrede leveringsvej med et midlertidigt projekt. |
| Udgivelse eller bred ændring | Kør hele pakken med `npm test`. Brede ændringer omfatter fælles format, rendering eller andre kontrakter med virkning på tværs af komponenter og produkter. Kør temakontrollen, når temaernes CSS eller kontrakt er berørt, og følg [udgivelseskontrollen](PRODUCTION.md#byg-og-lever-offline-editoren) ved udgivelse. |

Genbyg det berørte output efter kode-, design- eller temaændringer. Ved biblioteksændringer opdateres hjemmesidens showcase med `npm run sync:design-studio` og dens normale build. Synkronisér produkter, der skal have ændringen. Hæv `STARTER_VERSION` i `tools/starter.mjs`, når startskabelonerne ændres. Temaændringer noteres i temaets `history`.

Format 1 virker fortsat. Migration er eksplicit med `migrate FILE --out NEW_FILE`; bevar originalen og gennemgå gamle indre afstande før tilkobling. Se [format og migration](PACKAGE-FORMAT.md).
