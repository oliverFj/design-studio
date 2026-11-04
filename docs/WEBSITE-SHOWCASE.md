# Hjemmesidens projektshowcase

Oliver Fjordsides projektjournal ligger i `E:/AI projekter/Second Gen/Hjemmeside`.

## Opdatér Design Studio på hjemmesiden

Den offentlige udgave ligger på https://oliver.fjordside.dk/design-studio/index.html og viser hele Design Studio. Besøgende kan skifte tema, redigere tokens og brandguide og afprøve komponenter og designmønstre. Det er forsøg i deres egen browser: ændringer påvirker ingen produkter og forsvinder ved genindlæsning. Temafiler kan hverken åbnes eller gemmes, og eksport er fjernet. Ved temaskift spørger siden, før en ændret kladde nulstilles.

Onlineudgaven er en bygget kopi. Et lokalt `npm run build` i Design Studio opdaterer ikke hjemmesiden. Kør følgende fra hjemmesidens projektmappe, når den offentlige udgave skal opdateres:

Alle temafiler i Design Studios `packages/` kommer automatisk med ved eksport. Der er ingen separat liste over temaer til Studio-onlineudgaven: tilføj et gyldigt tema som `packages/TEMA-ID.json`, hvor filnavnets id svarer til temaets id, og kør den normale opdatering nedenfor. Bibliotekstjek og referenceeksempler bruger samme automatisk fundne samling. Ugyldige temaer stopper eksporten, så fejl skal rettes før udgivelse.

```powershell
npm run sync:design-studio
npm run build:production
npm run deploy:production
```

Synkronisering henter hjemmesidens fælles runtime og temaer og eksporterer den fulde offentlige Studio-udgave med `tools/build-showcase.mjs --studio` til `public/design-studio/`. Hjemmesidens build medtager kopien i sit leveringsmanifest; udgivelsen uploader kun manifestets filer og sender hjemmesidens forside sidst. Et almindeligt hjemmesidebuild genbruger kopien og kræver ikke Design Studios projektmappe.

Agenten udfører synkronisering, build og udgivelse; brugeren genindlæser blot siden. Udgiv kun, når brugeren har bestilt en opdatering online. Kontrollér buildets resultat og udgiverens bekræftelse. Ved ændret UI afprøves de berørte forløb proportionelt; hvis brugeren selv vil kontrollere visuelt, skal browserkontrol ikke blokere udgivelsen.

Rodens `index.html` i Design Studio er fortsat den fulde lokale editor med gemning. Demotilstanden er et særskilt build af samme interface, ikke et andet komponentbibliotek.

## Andre projekter på hjemmesiden

Når brugeren beder om at lægge et produkt på hjemmesiden, læses hjemmesidens `AGENTS.md` og `docs/ADD-PROJECT.md`. Den fælles projektliste er `content/projects.json`; almindelige tilføjelser kræver ingen ny layoutkode. Hjemmesiden bruger Design Studios kopierede runtime og det valgte udvalg af temaer med lys/mørk visning. Temasamlingen udvides løbende, blandt andet når nye produkter får deres eget tema; antallet er ikke fast. Fælles ændringer hentes med `npm run sync:design-studio`, hvorefter siden genbygges.

Læs også hjemmesidens `docs/PRODUCT-MEDIA.md`, før screenshots eller produktforsider udskiftes. **Det visuelle screenshot- og produktkortworkflow er endnu ikke aftalt.** Brugeren vil gennemgå det med en anden agent senere; de nuværende medier er placeholders. Vejledningen beskriver den eksisterende tekniske tilslutning og må ikke forveksles med en færdig designstandard.

Hjemmesidens webbuild leverer `brand.json` med hjemmesideadresse, linktekst og originale logovarianter til produkternes logolinks. Følg Fjordsides eksisterende brandguide, og bevar offlineprodukter ved at kopiere originalressourcen lokalt frem for at hente den ved runtime. Se hjemmesidens tilføjelsesvejledning for detaljer.

Ændr ikke Design Studios komponentbibliotek for en almindelig projektpost. Nye fælles komponentbehov aftales og udvikles centralt efter systemets normale arbejdsgang.
