# Designgrundlag

[Designgrundloven](DESIGN-PRINCIPLES.md) beskriver den fælles æstetiske og funktionelle retning med kildegrundlag og konkrete beslutningsregler. Den er også indholdskilden til siden **Principper**. Dette dokument beskriver bibliotekets tekniske anvendelse og gældende kontrakt; grundloven ændrer ikke kontrakten af sig selv.

Design Studio har et projektagnostisk komponentbibliotek. En komponent navngives efter sin funktion og opbygning. Temaer giver den et visuelt udtryk; produktet leverer indhold og adfærd. Et startsæts oprindelse bestemmer aldrig bibliotekets anvendelse.

Det aktuelle katalog og biblioteksversionen findes i `core/library.mjs`; `COMPONENT_COVERAGE` beskriver runtimeindgangene. Målet er robuste fælles byggesten, forskellige temaudtryk og en standard, som agenter kan videreføre mellem sessioner. Kataloget er afgrænset; nye produktbehov kan stadig kræve nye fælles roller.

## Faglige kilder

Biblioteket bruger Microsoft Fluent 2 og IBM Carbon som designfaglige referencer. Design Studio implementerer sine egne framework-uafhængige komponenter. Vi importerer ikke disse systemers React-kode, mærker eller færdige temaer, og deres særpræg er ikke et krav til vores temaer.

| Biblioteksroller | Reference | Anvendt princip |
| --- | --- | --- |
| Knap, handlingsknap, handlingslinje | [Fluent 2 Button](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Carbon Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) | Beskriv den konkrete handling. Skeln mellem handling og navigation. Brug et tydeligt hierarki mellem primær og sekundær handling. Toggleadfærd har både synlig og maskinlæsbar tilstand. |
| Formularfelt, input og valg | [Fluent 2 Field](https://fluent2.microsoft.design/components/web/react/core/field/usage) | Label, kontrol, hjælp og fejl hører sammen. En placeholder erstatter ikke en label. Fejl forklarer, hvad brugeren skal gøre. |
| Segmentkontrol | [Carbon Content switcher](https://www.carbondesignsystem.com/building-blocks/core/components/content-switcher/guidelines) | Korte, beslægtede valg i en samlet gruppe. Brug ikke segmenter som erstatning for navigation eller en tænd/sluk-kontakt. |
| Skyder | [Carbon Slider](https://www.carbondesignsystem.com/building-blocks/core/components/slider/guidelines) | Vis label, aktuel værdi og relevant enhed. Interval og trin skal passe til opgaven. Brug som udgangspunkt skyder med præcis talindtastning til parameterpaneler. |
| Kort og informationspanel | [Fluent 2 Card](https://fluent2.microsoft.design/components/web/react/core/card/usage) | Saml relateret indhold med klart hierarki. Containeren bliver ikke automatisk en handling, når indholdet allerede har knapper. |
| Dialog | [Fluent 2 Dialog](https://fluent2.microsoft.design/components/web/react/core/dialog/usage) | Tydelig titel, kort indhold og få relevante handlinger. Modaladfærd skal håndtere fokus, afslutning og retur til udløseren. |
| Besked og vejledning | [Carbon Notification](https://www.carbondesignsystem.com/building-blocks/core/components/notification/guidelines) | Skeln mellem orientering og en fejl, der kræver handling. Giv beskeden kontekst; afbryd kun brugerens arbejde, når det er nødvendigt. |
| Farver og visuelle tilstande | [Fluent 2 Color](https://fluent2.microsoft.design/color) | Neutrale flader skaber hierarki. Brandfarver og statusfarver har forskellige roller. Farve ledsages af tekst eller anden tydelig information. |

Typografi, skillelinjer, mærker, billedtekst og nøgletal er enkle lokale sammensætninger af disse grundprincipper. Billedtekst er indhold med en valgfri kort label; nøgletal er label og værdi. De forudsætter ingen bestemt branche, fortælling eller datamodel.

## Indholdsbredde og fuld bredde

Vælg bredde efter indholdets opgave, ikke efter den ledige skærmplads. En bred vært betyder ikke, at alle dens børn skal strækkes. Skeln mellem sidens ramme, arbejdsfladen, paneler og kontroller:

- Fuld bredde er relevant for indhold, der faktisk udnytter pladsen: en tegne-/3D-flade, et kort, en tidslinje eller en tæt datavisning. Bevar afgrænsede værktøjer og egenskabspaneler omkring fladen.
- Formularer og tekst får en læsbar maksimal bredde. I referenceeksemplerne begynder formularer ved højst 44rem, liste/detaljevisninger ved 72rem og komplette editor-eksempler ved 84rem. Brødtekst og vejledning begrænses typisk til 60–75ch. Tallene er udgangspunkter for eksemplerne, ikke krav til alle produkter.
- Handlinger har som udgangspunkt indholdsbestemt bredde. Stræk dem kun, når deres rolle kræver det, eksempelvis en listepost eller en bevidst primær handling i et smalt panel. Korte valg bliver ikke til en arbejdsflade, blot fordi knapperne fylder en hel række.
- En illustration af objekter kan bruge afgrænsede kort eller markører. Den skal ikke ligne en meget bred menu. Et rigtigt canvas kan vokse, mens kontrollerne bevarer deres hensigtsmæssige størrelse.
- Begrænsningerne skal stadig tilpasse sig den tilgængelige plads. Brug maksimal bredde og indholdsbaserede/containerbaserede brudpunkter; skift til én kolonne, når paneler ikke længere kan fungere side om side. Bevar klikflader, hele ord og tastaturfokus.

Breddeprofilerne er fælles layoutprimitiver i core/layout.mjs og eksporteres også fra core/library.mjs. De medfølger automatisk i format 2-CSS og kopieres med init/sync. Brug ds-layout med data-layout eller createLayout fra components.mjs. Profilerne prose, form, panel, split, workspace og fluid giver standardgrænser på henholdsvis 70ch, 44rem, 23rem, 72rem, 84rem og ingen grænse. En konkret ramme kan tilpasses med --ds-layout-max-width i produktets CSS. Indlejrede rammer nulstiller denne lokale tilpasning, så en bred arbejdsflade ikke gør dens paneler brede.

Breddevalg og kolonner tilhører fortsat produktet. Komponentbiblioteket ejer komponenternes indvendige afstande, anatomi og tilstande; temaerne skal ikke indføre layoutregler. patterns/catalog.mjs vælger en fælles profil for hvert eksempel, mens patterns/styles.css alene styrer eksemplets sammensætning. Profilen er en god standard, ikke et krav til produktets arkitektur.

Parameterpanelers kontrakt findes under [skyder med præcis talindtastning](INTEGRATION.md#skyder-med-præcis-talindtastning).

## Hvad biblioteket fastholder

Webnavigation bruger native links i navngivne `nav`-områder og lister, jf. [WAI Menus](https://www.w3.org/WAI/tutorials/menus/). `aria-current` markerer aktuelt mål; websitenavigation bruger ikke programmets menu-/menubar-roller. Headerens mobile eksempel bruger native `details`/`summary`. Billedrollen bruger `figure`, `img` og valgfri `figcaption`; alternativ tekst vælges efter billedets formål, jf. [WAI Images](https://www.w3.org/WAI/tutorials/images/). Header, hero, footer og billedgalleri er valgfrie sammensætninger i mønsterkataloget. Galleriets forstørrelse genbruger den fælles dialog i en native modal med retur til udløseren.

- Struktur, dele, mellemrum og indvendig afstand ligger i biblioteket. Temaet kan justere afstandstokens, men ikke fjerne dem.
- Native knapper og formularcontrols bevares. Labels, hjælp og fejl forbindes med unikke id'er. Et symbol er dekorativt, når knappens tekst allerede forklarer handlingen.
- En handlingsknap består af symbol, label og en valgfri genvej. Den kan bruges til at oprette, søge, åbne, redigere eller udføre andre handlinger. Genvejen vises kun, hvis produktet faktisk implementerer den.
- Tastaturfokus har en synlig markering med mindst 3 deklarerede pixels og afstand til kontrollen. Det giver en tydelig streg også ved Windows' enhedsafrunding. Temaets variant- eller stateoverrides må ikke slukke den.
- Interaktive komponenters klikflader bevares i bibliotekets grundlayout. Kompakte visuelle udtryk må ikke gøre dem svære at ramme.
- Kort, beskeder, paneler og dialoger har læselige flader. Transparente ghost-handlinger kan bruges på en kendt, kontrastkontrolleret underflade. En billedtekst skal have en sikker underflade, hvis et billede ellers gør den ulæselig.

## Visuel rytme

Kontrakten findes i [integrationsguiden: Synlige interaktioner og tæthed](INTEGRATION.md#synlige-interaktioner-og-tæthed).

## Robust layout og tilstande

Kontrakten findes i [integrationsguiden: Synlige interaktioner og tæthed](INTEGRATION.md#synlige-interaktioner-og-tæthed).

## Indre og ydre afstand

Kontrakten findes i [integrationsguiden: Afstande og indlejrede flader](INTEGRATION.md#afstande-og-indlejrede-flader).

## Hierarkier og rækkehandlinger

Kontrakten findes i [integrationsguiden: Hierarkisk indhold med tree](INTEGRATION.md#hierarkisk-indhold-med-tree).

## Kontrol i runtime

Format 2 validerer centrale semantiske tekst/flade-par med mindst 4,5:1 og fokusfarvens kontrast mod grundflader med mindst 3:1. Det bygger på [WCAG 2.2: tekstkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) og [WCAG 2.2: kontrast for interaktive markeringer](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). For eksplicitte farvepar i komponentopskrifter kan stor tekst bruge 3:1. De målbare variant- og tilstandskombinationer kontrolleres også; disabled er undtaget fra denne kontrastkontrol.

Bibliotekets synlige feltgrænser har et bindende minimum på 3:1 mod kontrolflade, indholdsflade og canvas. Det gælder både `color.border.field` og de målbare effektive opskrifter for tekst-/tal-/valgfeltfamilien, combobox/multivalg, dato/tid, filvalg og grid-editor, inklusive varianter og relevante tilstande. Et svagt appearance-override eller en fjernet feltkant kan derfor ikke omgå kravet ved at bevare et stærkt grundtoken. Dekorative kortkanter er ikke feltgrænser. Native popup-vælgere, browserens interne filknap og progress-tegning er browser-/systemstyret og måles ikke som bibliotekets egne CSS-dele. Denne fælles regel er bevidst enklere og strengere end at genfortolke hver produktsides nødvendige identifikationskant ved eksport.

Canvas, almindelig indholdsflade, kontrolflade og invers grundflade skal være opaque farver, som kontrollen kan måle. Semantiske hovedroller bruger hex, rgb, hsl, oklab, oklch, color(srgb) eller understøttede farvenavne. Alpha i supplerende farver compositeres over grundfladen. Oklab/oklch beregnes i sRGB; kritiske farver bør holdes inden for sRGB-gamut.

Brødtekst har som projektstandard mindst 14 CSS-px og en linjehøjde på mindst 1,4. Kontrolhøjdetokens har mindst 24 CSS-px ved en reference på 16px for rem/em. Bibliotekets konkrete klikflader er som standard større. [WCAG 2.2: målstørrelse](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) beskriver også undtagelser og afstandskrav; Design Studio vælger større almindelige kontrolflader for enkel og sikker anvendelse.

Kontrollen måler de angivne grundroller og eksplicitte farvepar. Den er ikke en tilgængelighedscertificering af produktet: baggrundsbilleder, gradients, nedarvede farver, lokale adaptere, indhold, zoom og brugerforløb kræver fortsat relevant kontrol i det konkrete produkt. Den faktiske [verifikationsstatus](PRODUCTION.md#verifikationsstatus) føres særskilt; HTTP-kontrol og strukturelle offlineprøver er ikke direkte filkontrol. Ugyldige kladder kan redigeres i Studio, men må ikke gemmes eller eksporteres som gyldige temaer. Format 1 beholder sin historiske validering og CSS, indtil produktet migreres eksplicit.

## Når en agent udvider biblioteket

1. Find den nærmeste eksisterende funktionelle rolle. En produktspecifik betegnelse er ikke i sig selv en ny rolle.
2. Vælg variant ved et genbrugeligt behov inden for samme anatomi. Opret en komponent, hvis funktionen eller opbygningen kræver en selvstændig rolle.
3. Beskriv formål, anvendelse, anatomi, tilstande og semantik på neutralt dansk. Vis neutrale eksempeltekster og simple symboler; ingen projektnavne, brancher, geometrikrav eller bestemt font i den fælles beskrivelse.
4. Brug semantiske tokens og dokumenterede defaults. Beskriv det relevante kildeprincip her, hvis en ny komponenttype tilføjes.
5. Kontrollér rollen og dens nye varianter i alle medfølgende temaer. Synkronisér berørte produkter og showcase. Produktets egne skærme og særlige indholdssammensætninger bliver i produktet.

## Kommandomenuer og kompakt betjening

Kontrakten findes i [integrationsguiden: Kommandomenuer](INTEGRATION.md#kommandomenuer).

## Knapfamilie og websiteindhold

Kontrakten findes i [integrationsguiden: Knapfamilien](INTEGRATION.md#knapfamilien).

## Udfoldning og bevægelse

Brug [fælles standardanimation](INTEGRATION.md#fælles-standardanimation). Editorens særlige kortvisning er beskrevet under [produktion](PRODUCTION.md#editorens-komponentvisning).

## Paletter, farvetilstande og brugerpræferencer

Primitive paletter ligger under `palette.*` og semantiske roller under `color.*`. Paletten definerer værdier; komponenten anvender den semantiske rolle. Et brand kan have særskilte primære farver og accentfarver. Et tema kan leveres alene som lyst eller mørkt; begge farvetilstande er valgfrit. Når begge leveres, er de sammenhørende fremtoninger inden for samme temaidentitet, ikke et skift til et andet brand. Enkeltstående temaer beholder deres værdier uanset farvepræference.

`core/scales.mjs` samler primitive afstande, elevation, dokumentlag og ikonstørrelser. Positive semantiske komponentafstande bevares. Indholdsbaseret layout og containerregler findes i referenceeksemplerne; fælles viewportgrænser til genereret shell-CSS findes i `BREAKPOINTS`. Valget af produktets kolonner tilhører fortsat produktet.

Farvepræferencen kan følge `prefers-color-scheme` eller være et gemt manuelt valg. Højkontrast er en selvstændig brugerpræference, ikke et ekstra brandtema. Den fælles CSS reagerer på `prefers-contrast: more`, `forced-colors: active` og reduceret bevægelse. Systemfarver bevares, grænser og valgmarkeringer får synlige signaler, og skygger er ikke eneste information om en flade. Native kontroller beholder deres browsersemantik.

Automatiske prøver erstatter ikke browser- og hjælpemiddelkontrol; se [verifikationsstatus](PRODUCTION.md#verifikationsstatus).

## Ikoner og komponentdækning

Tabler Icons 3.50.0 er den fælles SVG-standard. Outline bruger samme geometri og stregtykkelse; farven følger den aktuelle tekstfarve. Et ikon bestemmer ikke klikfladen, og ikonknapper har et forståeligt tilgængeligt navn. Kun registret med det anvendte udvalg distribueres sammen med MIT-licensen. Brandoriginaler erstattes ikke af generiske symboler.

`COMPONENT_COVERAGE` er den autoritative dækningsoversigt for det aktuelle katalog. Den skelner mellem statisk indhold/layout, native adfærd og fælles controllere med deres faktiske indgange. Metadata beskriver denne leverance; de er ikke en tilgængelighedsgodkendelse eller dækning af enhver tænkelig komponenttype.

## Indhold, formularer og overlays

Se [formularfamilien](INTEGRATION.md#formularfamilien-tekstområde-tal-og-feltgrupper), [faner og navigation](INTEGRATION.md#faner-og-native-navigation) og [overlays](INTEGRATION.md#dialog-drawer-tooltip-og-popover) for semantik, fokus og bevarede kladder.

## Filtrerede valg, feedback og lokale filer

Se [filtrerede valg](INTEGRATION.md#filtrerede-valg-og-native-datotid), [status](INTEGRATION.md#loading-fremdrift-og-tomt-indhold), [toast](INTEGRATION.md#korte-meddelelser-med-toast) og [filvalg](INTEGRATION.md#lokalt-filvalg).

## Datatabel og redigerbart datagrid

Brug [datatabel](INTEGRATION.md#datatabeller) til læsning og [datagrid](INTEGRATION.md#redigerbart-datagrid) til celleredigering. Integrationsguiden ejer kontrakten for tastatur, kladder, validering og atomisk indsættelse.

## Portabilitet og levering

Primære skrifter skal følge med leverancen med licens og dokumenteret dækning. Se [skrifter og portabilitet](PRODUCTION.md#skrifter-og-portabilitet) for ressourcer, platforme og leveringsmanifest.
