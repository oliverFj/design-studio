# Hjemmesidens projektshowcase

Oliver Fjordsides projektjournal ligger i `E:/AI projekter/Second Gen/Hjemmeside`.

## Opdatér Design Studio på hjemmesiden

Den offentlige udgave udgives på https://oliver.fjordside.dk/design-studio/index.html. `--studio` bygger hele det aktuelle Studio med tema-/farvevalg, **Temaet**, komponenter, designmønstre og de fire brugsscener. Besøgende kan redigere og åbne temafiler samt hente JSON, CSS og originalressourcer i deres egen browser. Ændringer påvirker ingen produkter og skal gemmes som filer før genindlæsning. Ved temaskift spørger siden, før en ændret temakladde nulstilles. Private tickets medtages ikke.

Onlineudgaven er en bygget kopi. Et lokalt `npm run build` i Design Studio opdaterer ikke hjemmesiden. Kør følgende fra hjemmesidens projektmappe, når den offentlige udgave skal opdateres:

Eksporten bruger den kuraterede samling fra `tools/public-themes.mjs`: aktuelt 13 temaer og 49 farver. Gyldige `packages/TEMA-ID.json`, hvor filnavnets id svarer til temaets id, opdages automatisk; fem historiske id'er udelades eksplicit og bevares kun til eksisterende produkter. Studio, temakontrol og showcase bruger samme samling. Ugyldige temaer stopper eksporten, så fejl skal rettes før udgivelse.

```powershell
npm run sync:design-studio
npm run build:production
npm run deploy:production
```

Synkronisering henter hjemmesidens fælles runtime og temaer og eksporterer den fulde offentlige Studio-udgave med `tools/build-showcase.mjs --studio` til `public/design-studio/`. Eksporten medtager også Aureol og Obsidians selvstændige materialestudier under `examples/scenes/`, så links fra Scener bevares. Hjemmesidens build medtager kopien i sit leveringsmanifest; udgivelsen uploader kun manifestets filer og sender hjemmesidens forside sidst. Et almindeligt hjemmesidebuild genbruger kopien og kræver ikke Design Studios projektmappe.

Agenten udfører synkronisering, build og udgivelse; brugeren genindlæser blot siden. Udgiv kun, når brugeren har bestilt en opdatering online. Kontrollér buildets resultat og udgiverens bekræftelse. Ved ændret UI afprøves de berørte forløb proportionelt; hvis brugeren selv vil kontrollere visuelt, skal browserkontrol ikke blokere udgivelsen.

Rodens `index.html` i Design Studio er den fulde lokale editor. Webudgaven er et særskilt offentligt build af samme interface og bibliotek. En eksport eller et lokalt hjemmesidebuild er ikke dokumentation for, at den aktuelle kode er udgivet online.

## Andre projekter på hjemmesiden

Når brugeren beder om at lægge et produkt på hjemmesiden, læses hjemmesidens `AGENTS.md` og `docs/ADD-PROJECT.md`. Den fælles projektliste er `content/projects.json`; almindelige tilføjelser kræver ingen ny layoutkode. Hjemmesiden bruger Design Studios kopierede runtime og det valgte udvalg af temaer med lys/mørk visning. Temasamlingen udvides løbende, blandt andet når nye produkter får deres eget tema; antallet er ikke fast. Fælles ændringer hentes med `npm run sync:design-studio`, hvorefter siden genbygges.

Følg [det fælles screenshot- og produktkortworkflow](PRODUCT-MEDIA.md) og hjemmesidens `docs/PRODUCT-MEDIA.md`, før medier fremstilles eller udskiftes. Design Studio er den godkendte reference med produktkort B, **Samme form, flere udtryk**, og seks screenshots. Andre projekter får egne motiver; der bruges ingen billedgenerering. En almindelig medieopdatering kræver kun kopiering af godkendte eksportfiler, ændring i projektposten og hjemmesidens build, ikke en designsynkronisering.

Hjemmesidens webbuild leverer `brand.json` med hjemmesideadresse, linktekst og originale logovarianter til produkternes logolinks. Følg Fjordsides eksisterende brandguide, og bevar offlineprodukter ved at kopiere originalressourcen lokalt frem for at hente den ved runtime. Se hjemmesidens tilføjelsesvejledning for detaljer.

Ændr ikke Design Studios komponentbibliotek for en almindelig projektpost. Nye fælles komponentbehov aftales og udvikles centralt efter systemets normale arbejdsgang.
