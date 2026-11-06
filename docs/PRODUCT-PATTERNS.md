# Produktbaserede mønstre og skånsom opdatering

Design Studio skal samle det bedste fra produktfamilien og gøre fælles løsninger lettere at genbruge. Sammenhæng skal især komme fra forståelig betjening, præcise tilstande, gode komponenter og pålidelig adfærd. Produkterne skal fortsat have deres egen karakter, arbejdsmodel og komposition.

Denne vejledning gælder, når agenter udleder DS-mønstre fra eksisterende produkter eller indfører nyere DS-komponenter og mønstre i dem. Den er ikke en bestilling på at ændre produkterne. Arbejd inden for den konkrete brugeropgave; synkronisering, produktændringer og udgivelse følger dens omfang. En dokumentations- eller referencegennemgang kræver ingen produktbuild, sync eller browserkørsel.

Følg [agentarbejdsgangen](AGENT-WORKFLOW.md), [designgrundloven](DESIGN-PRINCIPLES.md) og produktets egne anvisninger. Genbrug etableret viden og genlæs kun relevante eller ændrede dele. Referencegrundlaget nedenfor er en læsning af kode og produktanvisninger den 6. november 2026, ikke en gennemført brugertest eller en garanti for hele produktet.

## To retninger i samme udvikling

1. **Undersøg et konkret produktforløb.** Følg opgaven fra start til afslutning, inklusive fejl, annullering og tilbagevenden. Brug produktets kode og regler til at forstå, hvorfor løsningen er sådan; et screenshot viser kun en tilstand.
2. **Udled en fælles løsning.** Bevar de nyttige arbejdsprincipper, og adskil dem fra produktets indhold, datamodel og faglige regler. Brug en eksisterende DS-rolle, før en variant eller ny rolle overvejes.
3. **Lav en troværdig DS-reference.** Indhold, model, visning og handlinger skal fortælle samme historie. Flere visninger skal følge samme state. Et objekttræ og en arbejdsflade må ikke vise modstridende relationer, blot fordi en kortdemo er nem at bygge.
4. **Afprøv løsningen i et afgrænset produktområde.** Brug det relevante kildeprodukt som første pilot. Undersøg derefter en anden faktisk anvendelse, før produktets særlige valg gøres til en bred fælles regel. Nye behov uden en produktreference kan udvikles som foreløbige mønstre med tydelig afgrænsning.

Et mønster i kataloget er ikke automatisk en erstatning for en moden produktfunktion. Beskriv, om noget er en kildeobservation, en mønsterkandidat, en fungerende reference eller en afprøvet produktintegration. Brug eksisterende katalog- og kildebeskrivelser; indfør ikke et parallelt register eller nye metadatafelter alene for denne vurdering. Bevar ophav og licenser.

## Det fælles og det særlige

| Lag | Fælles ansvar | Produktets ansvar |
| --- | --- | --- |
| Komponenter | Anatomi, semantik, tilstande og genbrugelig interaktion i det centrale bibliotek. | Tynde adaptere, indhold og forbindelse til produktets kommandoer. |
| Tema og brand | Semantiske tokens og understøttet appearance. | Egen identitet, originale ressourcer og bevidste produktfarver. Fælles kvalitet kræver ikke samme tema. |
| Designmønstre | Forståelige referenceforløb med dokumenterede valg og grænser. | Skærmkomposition, panelplacering, navigation og tilpasning til opgaven. Kopieret referencekode ejes af produktet. |
| Model og motor | Mønstret gør tilstande og handlinger forståelige. | Data, validering, historik, lagring, lyd, geometri, jobstyring og sikkerhedsgrænser. |

Flyt ikke en hel produktskal ind i biblioteket for at genbruge en del af den. Omvendt må et generisk mønster ikke skjule produktets nødvendige handlinger eller udskifte dets datamodel. Se [integrationsguiden](INTEGRATION.md#valgfrie-sammensætningseksempler) for eksport og ansvar.

## Referenceprodukter

De fire aktuelle produkter ligger under `E:/AI projekter/Second Gen/`. Mappen **Guitar** indeholder produktet **Tonerum**. Det relevante FormLab ligger i **FormLab**, ikke den særskilte mappe **Form-Lab**. Læs ved senere arbejde produktets faktiske `design-studio.project.json` og runtime; biblioteksversion, temaformat og UX-modning er forskellige størrelser.

### FormLab: objektarbejde og kontekst

Kilder: [arbejdsregler](<../../Second Gen/FormLab/AGENTS.md>), [fælles interaktion](<../../Second Gen/FormLab/docs/INTERAKTIONSPRINCIPPER.md>), [objektmodel](<../../Second Gen/FormLab/editor-objects.js>), [objektpanel](<../../Second Gen/FormLab/object-panel.js>) og [UI](<../../Second Gen/FormLab/ui.js>).

- **Bevar:** sammenhængen mellem scene, træ og egenskaber; valg efter omfang, multivalg, låsning, synlighed samt meningsfuldt fokus og scroll. Træ og inspector fungerer som én betjeningsdock. En venstreplaceret samling er ikke en generel DS-regel.
- **Skeln:** organisering, fysisk ejerskab og referencer. Et tag i træet kan være en reference til et afledt område, og et fælles tag kan nås fra flere former. En simpel `parent`-relation eller vilkårlig mappeflytning må ikke overtage disse regler.
- **Mønsterkandidat:** arbejdsområde med koordineret objektstruktur og kontekstpanel. En neutral reference kan bruge en enkel 2D-model; den behøver ikke kopiere 3D-motoren. Vis reel indlejring, når modellen betyder, at en del tilhører et objekt.
- **Første pilot:** én afgrænset forbindelse mellem objektvalg og egenskaber med de eksisterende adaptere. Bevar FormLabs fungerende arbejdsmodel, mens komponenternes nye API og fremtoning indføres.

### FormLab: Materialegenerator

Kilder: [generatorens kontrakt](<../../Second Gen/FormLab/docs/MATERIALEGENERATOR_V2.md>), [fælles skal](<../../Second Gen/FormLab/material-generator-shell.js>), [source-værksted](<../../Second Gen/FormLab/material-source-studio.js>) og [produktets transaktioner](<../../Second Gen/FormLab/app.js>).

- **Bevar handlingsbetydningen:** redigering, preview, **Bag**, **Gem**, **Gem som kopi** og **Brug på valget** er forskellige trin. Gem/Brug kræver aktuelle bagte data. Kopi giver selvstændig identitet; gemning kan opdatere en bibliotekspost og dens brugere. Kamera- og lysændringer må ikke starte bagning.
- **Bevar livscyklussen:** familiekladder huskes ved lukning og suspendering. Forældede beregningssvar afvises; lukning annullerer arbejde og frigiver previewressourcer. Delte teksturer og referenceoptælling må ikke erstattes af generel genmontering ved et tema- eller panelskift.
- **Mønsterkandidat:** parametrisk værksted med koordinerede visninger og tydelig forskel på ændret input, igangværende beregning, aktuelt resultat, gemning og anvendelse. Produktet leverer producent, revisioner og acceptregler.
- **Første pilot:** en begrænset parametergruppe eller handlingslinje, der fortsat kalder den eksisterende motor. Bevar rækkefølgen mellem modelændring, historik og asynkron lagring. Ældre arkitekturfund skal kontrolleres mod den aktuelle kode, før de bruges som begrundelse for en ændring.

PBR-kanaler, fysiske mål, atlas og materialernes produktion forbliver i FormLab. En UI-opdatering er ikke en bestilling på ændret materialepipeline.

### FormLab: Detaljeværksted

Kilder: [værkstedsvejledning](<../../Second Gen/FormLab/docs/DETALJEVAERKSTED_FOR_AGENTER.md>), [session og historik](<../../Second Gen/FormLab/detail-studio-session.js>) og [værkstedets UI](<../../Second Gen/FormLab/detail-studio.js>).

- **Bevar arbejdsmodellen:** bibliotek, front/bagside, tværsnit, mål og 3D-prøve arbejder på samme opskrift. Flere valgte lag er noget andet end det aktive lag til punktredigering.
- **Bevar transaktionerne:** valideret kandidat og gemmepunkt holdes adskilt. Én gestus samles i ét Fortryd-trin med afslutning eller annullering. Følgeændringer som større åbningsmål kræver fortsat et konkret valg; de må ikke ske skjult under ny betjening.
- **Bevar kladdepolitikken:** lukning og opskriftsskift kan kræve Gem/Fortsæt uden/Bliv. Materialegeneratorens sessionshukommelse er en anden politik; de to værksteder skal ikke have samme lukkeadfærd alene for ensartethed.
- **Mønsterkandidat:** opskriftseditor med aktivt element, multivalg, koordinerede previews, gemmepunkt og eksplicitte følgeændringer. Bibliotekspost, redigeringskladde og placeret kopi har hver sin identitet. Biblioteksredigering af detaljer ændrer ikke automatisk allerede placerede kopiers geometri.
- **Første pilot:** ét parameter-/lagpanel, mens sessionen og gestushistorikken bevares. Prøv ugyldigt input, valgskift, annulleret gestus og lukning med en kladde, før flere områder flyttes.

Værtsgeometri, pasform, profilpunkter og import-/pensioneringsregler forbliver produktansvar. Dialoger og felter må fortsat afgrænse scenens genveje.

### Tonerum i Guitar

Kilder: [README](<../../Second Gen/Guitar/README.md>), [adaptere](<../../Second Gen/Guitar/src/components/StudioControls.tsx>), [meloditræning](<../../Second Gen/Guitar/src/components/MelodyTrainer.tsx>), [træningstilstand](<../../Second Gen/Guitar/src/hooks/useMelodyTrainer.ts>), [kalibrering](<../../Second Gen/Guitar/src/components/InputCalibration.tsx>) og [toneindstillinger](<../../Second Gen/Guitar/src/components/ToneDetectionSettings.tsx>).

- **Bevar:** musikalsk informationshierarki, instrumenternes udtryk og farvernes roller for næste tone og registreret spil. Bevar React/TypeScript, den eksisterende driftsmodel og de tynde DS-adaptere.
- **Mønsterkandidater:** guidet træning med flere synkrone repræsentationer; kalibrering med delvist resultat, accept og annullering; indstillinger med øjeblikkelig virkning og særskilt varig lagring. [Kvintcirklen](<../../Second Gen/Guitar/src/components/CircleOfFifths.tsx>) er desuden reference til udforskning, forklaring og overgang til en relevant øvelse.
- **Første pilot:** et roligt indstillingsområde via eksisterende adaptere. Gør variantvalg eksplicitte gradvist, hvor knapfremhævelse i dag udledes af produktklasser. Kortlæg CSS-lagene, før lokale regler fjernes.
- **Kontrolgrænse:** en visuel opdatering må ikke utilsigtet genstarte mikrofon, lyd, kalibrering eller træning. Bevar regler for pause, skjult dokument, instrument-/arbejdsområdeskift og oprydning. Se [mikrofonmotor](<../../Second Gen/Guitar/src/music/microphone.ts>) og [hook](<../../Second Gen/Guitar/src/hooks/useMicrophone.ts>).

Musiknotation, pitchgenkendelse og instrumentgeometri forbliver produktkode. Indfør ikke projektfiler alene for at ensrette browserpræferencer og sessionskalibrering med en generisk gemmedemo.

### Hjemmesiden

Kilder: [produktregler](<../../Second Gen/Hjemmeside/AGENTS.md>), [projektkontrakt](<../../Second Gen/Hjemmeside/docs/ADD-PROJECT.md>), [komposition](<../../Second Gen/Hjemmeside/tools/render-site.mjs>), [udfoldning](<../../Second Gen/Hjemmeside/src/details.mjs>), [galleri](<../../Second Gen/Hjemmeside/src/gallery.mjs>) og [temaskift](<../../Second Gen/Hjemmeside/src/app.mjs>).

- **Bevar:** redaktionel brandkarakter, sticky header, sammenhørende tema-/visningsvalg og de gældende billedmål. Forsidekort åbner Om projektet; øvrige billeder åbner den store visning. Gallerivalg og åbne felter bevares ved temaskift.
- **Mønsterkandidater:** indholdsdrevet projektpræsentation med tilknyttet udfoldning; billedserie med forstørrelse og fokusretur; temaskift uden tab af brugerens placering. Hold generisk adfærd adskilt fra hjemmesidens fortælling og særlige galleriudtryk.
- **Første pilot:** én præsentationssektion eller ét galleri. DS' aktuelle billedgitter er ikke automatisk erstatning for en horisontal billedserie med særskilt coveradfærd. Sammenlign funktioner og tilstande før valg af reference.
- **Kontrolgrænse:** bevar dataformat, projektlinks, godkendte medier og originale logoer. Produktion og preview har forskellige leverancer. Almindelige builds skal fortsat kunne bruge lokale produktkopier uden udviklingsmapperne; en UI-opdatering giver ikke i sig selv tilladelse til udgivelse.

### Watchman

Kilder: [produktregler](<../../Second Gen/Watchman/AGENTS.md>), [UI og forløb](<../../Second Gen/Watchman/src/app.mjs>), [state og validering](<../../Second Gen/Watchman/src/model.mjs>), [lokal jobstyring](<../../Second Gen/Watchman/server/server.mjs>) og [MCP-adgang](<../../Second Gen/Watchman/tools/mcp.mjs>).

- **Bevar betydningerne:** alvorlighed, kilde, evidens, anbefaling, kontroldækning og brugerens opfølgning er forskellige oplysninger. Ingen fund er ikke det samme som fuld kontroldækning. Markeret løst er ikke en verificeret efterkontrol.
- **Mønsterkandidater:** prioriteret indbakke med efterprøvning; status med synlig dækning og usikkerhed; langvarig opgave med stadier, delresultater og stop. Disse er relevante for fremtidige agentiske produkter, men UI-mønstret ejer ikke jobmotoren eller dens beføjelser.
- **Første pilot:** indbakkens fundrækker og valg, med eksisterende filtre, sortering, detaljedialog og lagring. Brug liste/detalje som kompositionsreference; overfør ikke demomodellens boolske `reviewed` til Watchmans tre opfølgningsstatusser. Hold rækkehandlinger adskilt fra rækkevalg; indlejr ikke knapper i en klikbar listepost.
- **Kontrolgrænse:** bevar `watchman.workspace`-format og validering, adskillelsen mellem offlinecache og lokal server samt reglerne for historisk evidens ved ændrede projektmål. Polling må ikke erstatte åbne dialoger eller kladder. Bevar én aktiv serveropdatering og allerede gemte delresultater ved stop.

Den lokale MCP-adgang er kun læsning og starter ikke analyser. En DS-opdatering må ikke udvide adgang, starte opgaver eller lade projekt-/feedtekst fungere som instruktioner. Bevar valideringen af agentresultater og maskeringen af kildeudsnit; læs ikke private feed eller credentials for en almindelig UI-gennemgang.

## Aktuelle referenceforløb i Design Studio

Kataloget viser ét aktivt eksempel med valg af mønster, vejledning og genbrugskode. På brede flader bruges en navigationskolonne med miniaturevisninger; på smalle flader bruges et native valg. Præsentationen skal vise fungerende indhold: varianter har fælles prøveakse og beskrivelser under prøven, hierarkier får læsbar plads, og scroll-eksempler har indhold, der faktisk løber over.

- **Objekteditor:** Samling, hovedflade og detalje har samme indlejring i scene og træ. Objekter og samlingers rammer kan vælges direkte med synlig valgmarkering og tastaturfokus. Samlingens placering på skærmen er et produktvalg; ejerskab bestemmes af modellen.
- **Formular og liste/detalje:** Forbundne labels, hjælp og fejl samt bevarede kladder og tydelig anvendelse/kassering. Listeposter bruger den fælles `list-item`-rolle; rækkevalg og ekstra handlinger skal fortsat kunne betjenes hver for sig.
- **Parametrisk værksted:** Gyldige ændringer opdaterer prøven live gennem `range-field` med `with-input` og `mountRangeField`. Asynkrone resultater accepteres kun for den aktuelle revision. Gem, Gem som kopi og Brug prøve er separate handlinger; eksemplets bibliotek er kun i sessionen.
- **Opskriftseditor med lag:** Lag kan vælges i listen og direkte i begge visninger. Shift vælger et interval; Ctrl/⌘ tilføjer eller fjerner. Aktivt lag og udvalgte lag er særskilte tilstande. Gyldige parameterændringer opdaterer visningerne live, én afsluttet gestus bliver ét Fortryd-trin, og ugyldige kladder bevares. Gem opskrift og Anvend på kopien opdaterer hver sin identitet.

Disse er fungerende neutrale referencer. De fire produkter er ikke dermed migreret eller synkroniseret. FormLabs geometri, materialepipeline og modne sessionsregler skal fortsat vurderes særskilt ved en bestilt pilot. Den fælles skyderkontrakt er beskrevet i [integrationsguiden](INTEGRATION.md#skyder-med-præcis-talindtastning).

## Sådan indføres en fælles løsning

1. **Afgræns opgaven.** Vælg ét brugerforløb eller én sammenhængende kontrolgruppe. Beskriv kort gevinsten, det nuværende forløb og den DS-reference, der faktisk passer. Dette kræver ikke en separat projektplan eller løbende rapport.
2. **Kortlæg kontrakten.** Læs produktets reelle designfiler og adaptere. Find de berørte data, events/kommandoer, tilstande, validering, fokus, scroll, historik og ressourcer. Bevar relevante brugerbeslutninger og brandregler. Skeln mellem et dokumenteret problem og en antaget forbedring.
3. **Vurder mangler før erstatning.** Hvis DS mangler nødvendig adfærd, forbedres den fælles rolle eller reference først, eller den eksisterende løsning bevares. Byg ikke en konkurrerende lokal komponent. Et navn som formular, galleri eller editor er ikke nok til at fastslå samme funktion.
4. **Tilpas gennem den eksisterende grænse.** Genbrug tynde adaptere eller produktets direkte runtimebrug. Bevar eksterne kald og dataaftaler, hvor det er praktisk; oversæt til det fælles API i adapteren. Montér kun én controller for samme adfærd. Et rent temaskift bør ikke afmontere en lydmotor, scene, jobkørsel eller redigeringssession.
5. **Synkronisér bevidst ved en bestilt implementering.** `sync` opdaterer den kopierede runtime og CSS samlet; en lille UI-pilot betyder ikke en delvis biblioteksopdatering. Undersøg relevante versionsforskelle og adapterbrug før sync. Håndredigér ikke genereret CSS eller kopieret runtime, og indsæt ikke en løs ny komponent i en gammel runtime. Bevar lokale temakladder og den faktiske driftsmodel.
6. **Flet referencekode som produktkode.** `examples` kopierer uden overskrivning; allerede tilpassede mønstre skal gennemgås og flettes manuelt. `update` er en særskilt startskabelonopdatering og vedligeholder hverken produktets mønstre eller dets AGENTS.md automatisk. Brug ikke nyt `init` til at erstatte en eksisterende app eller byggeopsætning.
7. **Kontrollér den konkrete overgang.** Brug eksisterende målrettede tests og et repræsentativt brugerforløb. Sammenlign normaltilstand, fejl, annullering og tilbagevenden samt de temaer og skærmstørrelser, ændringen berører. Kontrollér relevante kombinationer, fx temaskift med en kladde, dialog under polling eller pause under træning. Browserkontrol følger den tilladte HTTP-kontrolvej i agentarbejdsgangen. Kør produktets normale build ved kode-/designændringer; bredere test kræver en konkret grund.
8. **Afslut pilotområdet.** Fjern kun de lokale regler og handlers, som den nye løsning faktisk erstatter. Bevar muligheden for en almindelig tilbageførsel via de isolerede kildeændringer; slet eller omform ikke brugerdata som en del af et visuelt løft. Beskriv kort ændring, faktisk kontrol og væsentlige begrænsninger. Udvid kun til flere områder inden for det bestilte omfang.

En overgang er vellykket, når den relevante opgave fortsat kan gennemføres, brugerens arbejde bevares, produktets karakter er genkendelig, og den fælles løsning reducerer konkrete lokale særregler. Et højere DS-versionsnummer eller færre CSS-linjer er ikke i sig selv et bevis på forbedring.
