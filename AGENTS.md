# Design Studio: indgang for agenter

Læs [README.md](README.md), [docs/AGENT-WORKFLOW.md](docs/AGENT-WORKFLOW.md) og [docs/DESIGN-FOUNDATIONS.md](docs/DESIGN-FOUNDATIONS.md) før UI-arbejde samt produktets egne anvisninger. Genbrug allerede etableret viden; genlæs kun relevante eller ændrede dele.

- **Arbejdsgang:** AGENT-WORKFLOW er den fælles vej fra nyt projekt til færdig skærm, opdatering og kontrol.
- **API og eksempler:** [docs/INTEGRATION.md](docs/INTEGRATION.md).
- **Samarbejde og erfaringer:** [docs/COLLABORATION.md](docs/COLLABORATION.md) beskriver MCP-værktøjspakker, projektadgang og nye erfaringer. Søg efter relevante erfaringer før gentagen fejlsøgning; læs kilder, anvendelsesområde og faktisk kontrol, før en løsning genbruges.
- **Grafik og animation:** [docs/GRAPHICS-AUTHORING.md](docs/GRAPHICS-AUTHORING.md) samler stilguider, begrebsopskrifter og grafikværkstedet. Læs den før nye illustrationer eller animationsplaner; genbrug den fælles afspiller.
- **Eksisterende produkter:** [docs/PRODUCT-PATTERNS.md](docs/PRODUCT-PATTERNS.md) beskriver udtræk fra FormLab, Tonerum, Hjemmesiden og Watchman samt skånsom indføring af fælles mønstre. Læs de relevante dele før mønsterudtræk eller udskiftning af produktets eksisterende løsninger.
- **Designprincipper:** [Designgrundloven](docs/DESIGN-PRINCIPLES.md) gælder temaer, komponenter, mønstre og produkter. DESIGN-FOUNDATIONS beskriver den tekniske anvendelse, og [docs/BRANDGUIDE.md](docs/BRANDGUIDE.md) beskriver branddelen.
- **Format og levering:** [docs/PACKAGE-FORMAT.md](docs/PACKAGE-FORMAT.md) og [docs/PRODUCTION.md](docs/PRODUCTION.md).

## Faste grænser

- `core/library.mjs` er den fælles kilde til roller, dele, layout, varianter, tilstande og deklarative previews. `core/components.mjs` leverer markup, native DOM og indgangen til fælles interaktionshjælpere. Bevar framework-uafhængigheden.
- `packages/*.json` og produktets tema er format 2-temaer med tokens, afgrænsede appearance-overrides, brandguide og historik. De indeholder ikke komponentdefinitioner og må ikke ændre struktur, display, padding, gap, positionering eller fokusmekanik. Brug positive semantiske spacingtokens til tæthed.
- Temaer kan være lyse, mørke eller have begge farvetilstande. Vælg efter udtrykket og produktets behov; en modsat variation er ikke et krav. Kontrollér alle farvetilstande, som faktisk leveres.
- Produktet ejer indhold, navigation, data, kommandoer, lagring og skærmkomposition. Brug fælles runtime eller tynde adaptere, aldrig en konkurrerende lokal udgave af en eksisterende rolle. Registrér faktiske frameworkadaptere med verificerede `file` og `export`; direkte runtimebrug kræver ingen lokal adapter.
- Genbrug en eksisterende rolle før udvidelse. Nye varianter og genbrugelige roller udvikles centralt med projektagnostiske navne, beskrivelser og eksempler. Roller skal have navn, formål, anvendelse, parts, variants, states, composes og preview samt semantiske tokens eller dokumenterede defaults, der virker i alle temaer.
- Ved hele skærme: undersøg `patterns/catalog.mjs` og referenceeksemplerne. `tools/cli.mjs examples PROJECT_DIR` kopierer uden overskrivning; kopierne er valgfri produktkode. Bevar ophav og licenser.
- Vælg bredde efter indholdets rolle gennem `createLayout` eller `ds-layout`/`data-layout`. `--ds-layout-max-width` tilpasser en lokal ramme. Produktet ejer kolonnerne; indlejrede paneler skal bevare deres egen breddegrænse.
- Bevar native controls, label/hjælp/fejl-forbindelser og tilgængelige navne. Forbind kompleks adfærd gennem den relevante fælles controller. Brug native dialog med `showModal()` eller produktets etablerede tilgængelige adapter. Bevar kladder, fejl, valg og fokus meningsfuldt ved genmontering.
- Bevar produktets brand. Genbrug godkendte originaler fra `brand.assets` efter `brand.logos` og relevante brandregler; bevar proportioner og licenser. Hold token-, komponent- og ressourcehenvisninger ajour.

## Standardleverance

- Nye produkter leveres som en selvstændig `index.html`, der fungerer via `file://` uden server, terminal, startfil eller installeret runtime. Pak kode, runtime, CSS og nødvendige ressourcer til offlinebrug. Undgå CDN-afhængigheder og lokale fetch-/modulkald, der forhindrer direkte åbning.
- Nye projekter oprettes med `tools/cli.mjs init PROJECT_DIR --theme THEME_ID`; eksisterende produkter med egen app/build tilknyttes med `--design-only`. Bevar eksisterende arkitektur, brand og produktregler. Afvig fra offline-standarden kun ved udtrykkelige brugerkrav eller konkret nødvendig funktionalitet, og forklar behovet.
- Agenten installerer udviklingsafhængigheder og kører produktets `npm run build` efter kode-, tema- og ressourceændringer. Brugeren genindlæser blot. Håndredigér ikke genereret HTML/CSS eller kopieret runtime. Synkronisér med `tools/cli.mjs sync PROJECT_DIR` ved ændret tema eller fælles bibliotek og genbyg derefter.
- Brug `createProjectFile` fra projektets runtime med produktets format-id, version og datavalidering. Filvælger og downloads er standarden. Annullering og ugyldige filer bevarer state; downloads overskriver ikke automatisk originalen. Browserlagring erstatter ikke gemte projektfiler.
- `npm run doctor` eller `tools/cli.mjs doctor PROJECT_DIR` er et læsetjek. `update PROJECT_DIR` viser valgfrie skabelonopdateringer; `--apply` bevarer lokal kode og lægger forslag til manuel fletning. Opdateringer er ikke et krav for at bruge eller bygge produktet.

## Kontrol og ændringer i systemet

Arbejd proportionelt. Små rettelser kræver højst én hurtig relevant kontrol. Nye skærme, nye temaer og væsentlige ændringer i layout, materialer, bevægelse eller interaktion skal inspiceres i browseren med relevante brugerforløb.

Agentens standard er browserkontrol af den byggede fil over lokal HTTP samt relevante statiske offlineprøver eller produktets doctor. Forhåndsvisningen må kun lytte på loopback og udstille nødvendigt testindhold. Genbrug den og genindlæs efter build. Almindelig lokal kontrol kræver ikke særskilt bekræftelse. Brugerens leverance er fortsat den selvstændige fil, som åbnes ved dobbeltklik.

Kontrollér browserværktøjets dokumenterede URL-understøttelse før navigation. Hvis det kun tillader HTTP/HTTPS, skal agenten ikke forsøge `file://`. En kendt begrænsning skal ikke genafprøves i hver opgave. Omgå ikke en afvisning gennem andre værktøjer, browserflader eller scripts. HTTP- og statisk kontrol må ikke beskrives som afprøvning af direkte filåbning. Ved ændrede offlineafhængigheder, filhåndtering eller en bestilt samlet offlineleverance aftales en særskilt manuel filkontrol, hvis ingen tilladt kontrolvej findes. Rapportér en udestående filkontrol, når den er relevant for opgaven; gentag ikke den kendte værktøjsbegrænsning som standardforbehold efter almindelige UI-rettelser. Se [kontrolvejen](docs/AGENT-WORKFLOW.md#kontrollér-den-berørte-funktion).

Ved format-, runtime- eller værktøjsændringer køres `npm test` og `npm run check`. Efter kode-, design- eller temaændringer køres `npm run build`. Bevar sammenhæng mellem contract, library, components, quality, skema, temaer og interface. Hæv `STARTER_VERSION` i `tools/starter.mjs` ved ændringer i startskabelonerne.

Ved biblioteksændringer: kontrollér de berørte roller i alle medfølgende temaer. Opdatér hjemmesidens showcase fra den tilknyttede hjemmesides projektmappe med `npm run sync:design-studio` og dens normale build. `tools/build-showcase.mjs --out DIRECTORY` kan eksportere til andre værter. Synkronisér produkter, der skal have ændringen. Notér temaændringer i temaets `history`.

Format 1 kan fortsat læses. Migration er eksplicit med `migrate FILE --out NEW_FILE`; bevar originalen og gennemgå tidligere indvendige afstande, så format 2 ikke giver dobbelt padding.

Ved almindelige iterationer opdateres dokumentation kun efter brugerens ønske eller ved konkret væsentlig teknisk risiko. Når dokumentation bestilles, beskriv den aktuelle implementering, fjern forældede regler og undgå løbende sessionshistorik. Lever kort på dansk med ændring, faktisk kontrol og væsentlige begrænsninger.

- **Projekter på Olivers hjemmeside:** Se [docs/WEBSITE-SHOWCASE.md](docs/WEBSITE-SHOWCASE.md) for projektregistrering og logolinks. Følg [docs/PRODUCT-MEDIA.md](docs/PRODUCT-MEDIA.md) for screenshots, tre produktkortforslag og levering uden billedgenerering.
