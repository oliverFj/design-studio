# Arbejdsmetode for agenter

Denne vejledning er den fælles arbejdsgang fra produktstart til kontrolleret leverance. Produktets egne anvisninger bestemmer indhold, funktioner og arkitektur. Genbrug viden fra den aktuelle session; genlæs kun ændrede eller relevante dele.

Bibliotek 3.4.1 leverer de 60 roller i det aftalte katalog på tværs af otte temaer og deres lyse/mørke tilstande. Brug dækningsoversigten til at skelne mellem indhold, native adfærd og en controller, der skal forbindes. Katalogets dækning er ikke en tilgængelighedscertificering eller et universelt komponentløfte.

## Find grundlaget

Læs systemets [README](../README.md), [AGENTS.md](../AGENTS.md) og [designgrundlag](DESIGN-FOUNDATIONS.md) samt produktets egne anvisninger før UI-arbejde.

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

Erstat `PROJECT_DIR` med produktets faktiske sti. Vælg tema efter produktets karakter; Studio Light er et udgangspunkt, ikke et æstetisk krav. Init leverer redigerbare `src`-filer, byggeopsætning, designfiler, agentanvisning og en færdig `index.html`. Eksisterende output overskrives ikke.

Kør derefter i produktmappen:

```sh
npm install
npm run doctor
```

**Eksisterende produkt:** Bevar dets arkitektur. Mangler designtilknytningen, bruges `init PROJECT_DIR --theme THEME_ID --design-only`. Dette etablerer ikke en ny app eller byggeopsætning. Find produktets faktiske build- og kontrolkommandoer.

Lever som standard en selvstændig `index.html`, der kan åbnes via `file://` uden server, terminal eller installeret runtime. Pak kode, komponentruntime, CSS, skrifter og øvrige nødvendige ressourcer til offlinebrug. Undgå CDN'er, eksterne runtimeafhængigheder og lokale fetch-/modulkald. En anden driftsmodel kræver et udtrykkeligt brugerkrav eller konkret nødvendig funktionalitet; forklar behovet.

## Vælg og sammensæt

1. Find først rollen i det effektive katalog med `getComponents(theme)`. Læs de berørte komponenters `usage`, dele, varianter og tilstande. Genbrug rollen; tilføj en variant ved samme funktion og en ny fælles rolle kun ved et selvstændigt, genbrugeligt behov.
2. Ved hele skærme: undersøg `patterns/catalog.mjs`. `node tools/cli.mjs examples PROJECT_DIR` kopierer referencekode uden overskrivning. Bevar ophav og licenser. Arbejdsfladen i `examples/workspace/` viser også formularer, kladder, filhåndtering og temaskift i et samlet produkt.
3. Vælg bredde efter indholdets rolle: `prose` til læsetekst, `form` til indstillinger, `panel` til værktøjer, `split` til liste/detaljer, `workspace` til sammensatte editorer og `fluid` til reelt brede arbejdsflader. Brug `createLayout` eller `ds-layout`/`data-layout`; produktet bestemmer kolonner og placering. Se [breddeprofiler](INTEGRATION.md#fælles-breddeprofiler).
4. Importér `createComponent`, `createComponentFactory` eller `renderComponent` fra projektets kopierede runtime. Brug native controls og fælles dele. Registrér kun faktiske frameworkadaptere i konfigurationens `components` med verificerede `file` og `export`; direkte brug af runtime kræver ingen lokal adapter.

Temaet må ikke erstatte display, struktur, positionering, padding, gap eller fokusmekanik. Justér tæthed gennem positive semantiske spacingtokens. Produktets CSS ejer kun sammensætningen; opret ikke lokale kopier af fælles komponentroller. Se [afstande og indlejrede flader](INTEGRATION.md#afstande-og-indlejrede-flader) frem for at genskabe deres regler i produktet.

## Forbind den faktiske adfærd

Et deklarativt preview viser ikke nødvendigvis en færdig interaktion. Vælg den relevante fælles runtime:

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

Ved en ny skærm: afprøv normaltilstand og relevante lange tekster, feltfejl eller tomme resultater. Kontrollér tastatur, fokus og smal visning omkring 320 CSS-px. Ved temaændringer kontrolleres også relevante lyse, mørke og ekspressive temaer. Ved fælles biblioteksændringer kontrolleres alle medfølgende temaer. Kontrollér zoom, reduceret bevægelse, højkontrast og hjælpemidler, når de er relevante; angiv præcist, hvad der faktisk er afprøvet.

Brug ved lokal browserkontrol en bygget fil over en loopback-server, der kun udstiller nødvendigt testindhold. Det kræver ikke særskilt bekræftelse ved almindelig lokal kontrol. HTTP-kontrol beviser ikke `file://`-funktion. Respektér afvisninger fra browserværktøjet; hvis direkte filåbning ikke kan kontrolleres, brug strukturelle offlineprøver og rapportér begrænsningen. Forsøg ikke at omgå sikkerhedspolitikken.

Ved ændret filhåndtering: afprøv gemning, genåbning og afvisning af en ugyldig fil uden datatab. Doctor skal acceptere produktets aktuelle build. Rapportér kort ændringen, de udførte kontroller og væsentlige begrænsninger. Dokumentation konsolideres, når brugeren bestiller det; opret ikke løbende sessionsrapporter.

For 3.4.1 er reel Windows-højkontrast, operativsystemets filvælger og det samlede direkte `file://`-forløb fortsat uden manuel verifikation. Faktiske Mac-/Linux-kørsler er heller ikke dokumenteret. Angiv den udførte kontrol præcist; lokale WOFF2-filer og en konfigureret CI-matrix erstatter ikke platform- og hjælpemiddelkontrol. Ved en systemleverance bruges [leveringspakkerne](PRODUCTION.md#leveringspakker-og-portabel-opsætning), som holder installerede afhængigheder og lokale filer ude af kildepakken.

## Når selve systemet ændres

Fælles roller skal have `name`, `description`, `usage`, `composes`, `parts`, `variants`, `states` og deklarativt `preview` i `core/library.mjs`. Genbrug semantiske tokens og dokumenterede centrale defaults. Hold kontrakt, runtime, kvalitet, skema, temaer og interface konsistente.

Kør `npm test` og `npm run check` efter ændringer i format, runtime eller værktøjer. Kør `npm run build` efter kode-, design- eller temaændringer. Ved biblioteksændringer opdateres hjemmesidens showcase med `npm run sync:design-studio` og dens normale build; synkronisér produkter, der skal have ændringen. Hæv `STARTER_VERSION` i `tools/starter.mjs`, når startskabelonerne ændres. Temaændringer noteres i temaets `history`.

Format 1 virker fortsat. Migration er eksplicit med `migrate FILE --out NEW_FILE`; bevar originalen og gennemgå gamle indre afstande før tilkobling. Se [format og migration](PACKAGE-FORMAT.md).
