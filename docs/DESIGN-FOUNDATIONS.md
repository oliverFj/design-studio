# Designgrundlag

Design Studio har et projektagnostisk komponentbibliotek. En komponent navngives efter sin funktion og opbygning. Temaer giver den et visuelt udtryk; produktet leverer indhold og adfærd. Et startsæts oprindelse bestemmer aldrig bibliotekets anvendelse.

## Faglige kilder

Biblioteket bruger Microsoft Fluent 2 og IBM Carbon som designfaglige referencer. Design Studio implementerer sine egne framework-uafhængige komponenter. Vi importerer ikke disse systemers React-kode, mærker eller færdige temaer, og deres særpræg er ikke et krav til vores temaer.

| Biblioteksroller | Reference | Anvendt princip |
| --- | --- | --- |
| Knap, handlingsknap, handlingslinje | [Fluent 2 Button](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Carbon Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) | Beskriv den konkrete handling. Skeln mellem handling og navigation. Brug et tydeligt hierarki mellem primær og sekundær handling. Toggleadfærd har både synlig og maskinlæsbar tilstand. |
| Formularfelt, input og valg | [Fluent 2 Field](https://fluent2.microsoft.design/components/web/react/core/field/usage) | Label, kontrol, hjælp og fejl hører sammen. En placeholder erstatter ikke en label. Fejl forklarer, hvad brugeren skal gøre. |
| Segmentkontrol | [Carbon Content switcher](https://www.carbondesignsystem.com/building-blocks/core/components/content-switcher/guidelines) | Korte, beslægtede valg i en samlet gruppe. Brug ikke segmenter som erstatning for navigation eller en tænd/sluk-kontakt. |
| Skyder | [Carbon Slider](https://www.carbondesignsystem.com/building-blocks/core/components/slider/guidelines) | Vis label, aktuel værdi og relevant enhed. Interval og trin skal passe til opgaven; præcis indtastning kan supplere skyderen. |
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

## Hvad biblioteket fastholder

- Struktur, dele, mellemrum og indvendig afstand ligger i biblioteket. Temaet kan justere afstandstokens, men ikke fjerne dem.
- Native knapper og formularcontrols bevares. Labels, hjælp og fejl forbindes med unikke id'er. Et symbol er dekorativt, når knappens tekst allerede forklarer handlingen.
- En handlingsknap består af symbol, label og en valgfri genvej. Den kan bruges til at oprette, søge, åbne, redigere eller udføre andre handlinger. Genvejen vises kun, hvis produktet faktisk implementerer den.
- Tastaturfokus har en synlig markering med mindst 3 deklarerede pixels og afstand til kontrollen. Det giver en tydelig streg også ved Windows' enhedsafrunding. Temaets variant- eller stateoverrides må ikke slukke den.
- Interaktive komponenters klikflader bevares i bibliotekets grundlayout. Kompakte visuelle udtryk må ikke gøre dem svære at ramme.
- Kort, beskeder, paneler og dialoger har læselige flader. Transparente ghost-handlinger kan bruges på en kendt, kontrastkontrolleret underflade. En billedtekst skal have en sikker underflade, hvis et billede ellers gør den ulæselig.

## Visuel rytme i bibliotek 2.2

Kontroller deler en klikflade på mindst 44px og samme lodrette og vandrette padding. Mærker og billedtekstetiketter har mindre indvendig afstand, fordi de beskriver indhold frem for at udføre en handling. Korte kategorietiketter bruger moderat tracking; formularlabels følger almindelig læsetypografi.

Kort og detaljepaneler bruger kant og flade som deres grundhierarki. Skygge bruges til hævede kort og flydende dialoger. Paneltitler følger title/panel-skalaen, mens display og expressive har særskilte responsive størrelser. Temaet bestemmer fontkarakteren; en expressive rolle kræver ikke kursiv.

Kontakter, valgte mærkater og værktøjstip bruger komplette semantiske forgrund/baggrund-par. En mørk temaudgave må ikke antage, at primaryText eller primary også er den rigtige farve på en invers flade. Native kontroller og fokusmarkeringer bevares på tværs af udtrykkene. Egne dele, der er direkte børn i komponentens anatomi, styles med direkte child-selektorer, så en indlejret komponent bevarer sit eget hierarki. Handlingsgruppens interne dele bruger egne selectors; sammensatte knapper beholder deres varianter og tilstande.

## Robust layout og tilstande i bibliotek 2.4

Knapper og segmentvalg bevarer hele ord gennem normal word-break og overflow-wrap. Segmenter har min-content som indholdets nedre breddegrænse, og gruppen kan bryde til flere rækker. Standardgruppen fordeler ledig plads lige, når labels kan være der; wrap bruger en indholdsbestemt basis til større eller varierende grupper. Ingen fast procentkolonne eller produktspecifik ordopdeling styrer disse valg. Ubegrænsede enkeltord kan stadig kræve en særskilt afgrænset visning; biblioteket lover ikke, at alle tænkelige strenge kan vises ved enhver bredde. Lodrette handlingsknapper har automatisk bredde og strækkes af toolbar; lodrette dividers strækkes til den aktuelle rækkes højde.

[Carbon Content switcher](https://www.carbondesignsystem.com/building-blocks/core/components/content-switcher/guidelines) begrunder lige kontrolbredder med plads til den længste label. Design Studios wrap-variant udvider dette til grupper af beslægtede valg i smalle paneler. Carbon anbefaler ellipsis med tooltip ved meget lange labels; almindelige labels skal kunne læses som hele ord.

Hover og active har semantiske flade- og tekstpar under color.action: neutralHover/Active, primaryHover/Active, selectedHover/Active, dangerHover/Active og accentHover/Active med tilsvarende Text-tokens. Neutrale handlinger, primære handlinger, valgte segmenter, destruktive handlinger og accenthandlinger bevarer hver deres familie. Pressed handlingsknapper følger primary; et valgt segment følger selected. Disabled får ingen hover- eller active-feedback. Fuld opacity bevarer tekstkontrast. Fire private --ds-interaction-* bindings i bibliotekets opskrifter vælger den relevante familie; temaappearance kan ikke skrive dem.

Dette følger [Carbons interaktionstokens](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview): feedback ændrer fladen, og tekstfarven understøtter den. [Fluent 2 Button](https://fluent2.microsoft.design/components/web/react/core/button/usage) kræver læselig tekst og ikoner i alle interaktive tilstande og et tydeligt hierarki mellem primære og øvrige handlinger. Runtime kontrollerer de nye farvepar samt pressed/current sammen med hover/active.

Indrammede handlinger og indtastning bruger color.border.field. Kort og panelskillelinjer bruger color.border.default. Listehandlinger har direkte heading og description-dele; aria-current beskriver det aktuelle navigationsmål uden toggle-semantik.

Scroll-area har den faste anatomi root > viewport > content. Kun viewport scroller, og inset holder scrollbaren inden for den ydre afrunding. Content reserverer plads til tastaturfokus. contained ejer én samlet flade, kant og afrunding. Den indre native card, inspector eller toolbar får ds-scroll-area__surface og bevarer sin padding, orientering og direkte dele; surface fjerner kun den ekstra ramme, baggrund og skygge. body bruges til scrolling inde i et allerede indrammet kort med fast header. Dette er Design Studios konkrete anvendelse af [Carbons lagmodel](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview): indlejring skaber kontrollerede fladelag frem for gentagne panelrammer. Viewport kan modtage tastaturfokus med tabindex=0 og et tilgængeligt navn. Produktet ejer maksimal højde og placering.

## Indre og ydre afstand i bibliotek 2.5

Stack samler direkte felter, noter og handlinger i en lodret strøm. Standard bruger gapLarge mellem indholdsenheder; compact bruger gap mellem tæt relaterede kontroller. Grundrollen og compact har kun display, retning, minWidth og positivt gap, så de tilfører ingen ekstra ramme eller padding. Felter, kort og valggrupper ejer fortsat deres egen indvendige afstand. Kortets root-gap separerer header, body og footer, men skaber ikke automatisk afstand mellem bodyens indlejrede børn; disse kan have en body-stak.

En native details bevarer summary og browserens åbne/lukkede adfærd. Details-root beholder block-layout uden ds-stack; en separat disclosure-body-stak efter summary bruger gap mellem kontroller og paddingBlockStart med gapLarge til udløseren. Den indvendige afstand findes kun, når den native body er synlig, så lukket details ikke efterlader en tom flexafstand. Default og compact er fortsat uden padding. Sammenhængende segmentvalg forbliver én enhed i stakken, så deres interne opbygning bevares.

## Hierarkier og rækkehandlinger i bibliotek 2.6

Tree er en selvstændig rolle til hierarkisk objektvalg. Grundsemantikken følger [WAI-ARIA APG Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): `tree`, indlejrede `treeitem`/`group`, navngivet rod, `aria-expanded` på forældre og `aria-selected` på valgbare rækker. Ved multivalg bruges `aria-multiselectable`. Fokus vises særskilt fra vedvarende valg; foldning ændrer ikke i sig selv produktets valg.

Design Studio supplerer træet med få native rækkehandlinger. Dette er bibliotekets konkrete udvidelse: rækkefokus bevæges gennem én aktiv tabstop-position, og den aktive rækkes handlinger kan nås med Tab. Handlingsknapper bevarer deres egen tastaturadfærd, navn og eventuelle `aria-pressed`; de må ikke overtage træets navigation eller ændre valg som bivirkning. `item.disabled` deaktiverer objektvalg og træk. Foldning og handlinger har selvstændig tilgængelighed, så eksempelvis Lås op ikke forsvinder sammen med det låste objektvalg. Produktet skal bevare eller flytte fokus meningsfuldt, når et item fjernes. Principperne bygger på [APG Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) og [Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

Rækker, foldning og handlinger bruger bibliotekets fælles semantiske spacing-, kontrol-, fokus- og actiontokens. Produktet leverer navne, symboler, tilladelser, valgregler, flytning og menuindhold. Det er ikke en generalisering af én branches datamodel. Ved drag-and-drop skal produktet tilbyde en tilsvarende klikbar flyttehandling, som også kan betjenes med tastatur; [WCAG 2.2, 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) skelner dette fra tastaturbetjening alene.

Tree er ikke en tabel med redigerbare celler. Har hierarkiet mange interaktive kolonner, er [APG Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) det relevante særskilte mønster. Kildebaserede principper og automatiske prøver erstatter ikke kontrol af konkrete hjælpemidler og produktforløb.

## Kontrol i runtime

Format 2 validerer centrale semantiske tekst/flade-par med mindst 4,5:1 og fokusfarvens kontrast mod grundflader med mindst 3:1. Det bygger på [WCAG 2.2: tekstkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) og [WCAG 2.2: kontrast for interaktive markeringer](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). For eksplicitte farvepar i komponentopskrifter kan stor tekst bruge 3:1. De målbare variant- og tilstandskombinationer kontrolleres også; disabled er undtaget fra denne kontrastkontrol.

Canvas, almindelig indholdsflade, kontrolflade og invers grundflade skal være opaque farver, som kontrollen kan måle. Semantiske hovedroller bruger hex, rgb, hsl, oklab, oklch, color(srgb) eller understøttede farvenavne. Alpha i supplerende farver compositeres over grundfladen. Oklab/oklch beregnes i sRGB; kritiske farver bør holdes inden for sRGB-gamut.

Brødtekst har som projektstandard mindst 14 CSS-px og en linjehøjde på mindst 1,4. Kontrolhøjdetokens har mindst 24 CSS-px ved en reference på 16px for rem/em. Bibliotekets konkrete klikflader er som standard større. [WCAG 2.2: målstørrelse](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) beskriver også undtagelser og afstandskrav; Design Studio vælger større almindelige kontrolflader for enkel og sikker anvendelse.

Kontrollen måler de angivne grundroller og eksplicitte farvepar. Den er ikke en tilgængelighedscertificering af produktet: baggrundsbilleder, gradients, nedarvede farver, lokale adaptere, indhold, zoom og brugerforløb kræver fortsat relevant kontrol i det konkrete produkt. Ugyldige kladder kan redigeres i Studio, men må ikke gemmes eller eksporteres som gyldige temaer. Format 1 beholder sin historiske validering og CSS, indtil produktet migreres eksplicit.

## Når en agent udvider biblioteket

1. Find den nærmeste eksisterende funktionelle rolle. En produktspecifik betegnelse er ikke i sig selv en ny rolle.
2. Vælg variant ved et genbrugeligt behov inden for samme anatomi. Opret en komponent, hvis funktionen eller opbygningen kræver en selvstændig rolle.
3. Beskriv formål, anvendelse, anatomi, tilstande og semantik på neutralt dansk. Vis neutrale eksempeltekster og simple symboler; ingen projektnavne, brancher, geometrikrav eller bestemt font i den fælles beskrivelse.
4. Brug semantiske tokens og dokumenterede defaults. Beskriv det relevante kildeprincip her, hvis en ny komponenttype tilføjes.
5. Kontrollér rollen og dens nye varianter i alle medfølgende temaer. Synkronisér berørte produkter og showcase. Produktets egne skærme og særlige indholdssammensætninger bliver i produktet.

## Kommandomenuer og desktopvarianter · 2.7

Menulinje (`menubar`), kommandomenu (`menu`) og menupunkt (`menu-item`) følger [WAI-ARIA APG Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). Biblioteket leverer native knapper, roller, dele og visuelle tilstande; produktet ejer fokus, åbning, placering og kommandoer. Brug pile mellem topmenuer og menupunkter, Home/End og typeahead. Enter/Ned åbner menuen, Escape lukker det inderste niveau og returnerer fokus, og Tab forlader menukæden. Checkbox/radio bruger aria-checked; undermenuer bruger aria-haspopup og aria-expanded. Deaktiverede punkter forklares og kan fokuseres med pile, men må ikke aktiveres. Formularfelter hører til i en popover eller dialog. Vis kun implementerede genveje.

Desktopvarianterne til button, input, select, toolbar og segmented-option er eksplicitte valg til tætte desktopværktøjer. De genbruger temaets semantiske tokens, 32 px kontrolhøjde og den fælles fokusmarkering. Disse standardvarianter bevarer deres eksisterende større mål. Tree bruger som standard det kompakte hierarki med 32 px rækker og tæt indrykning; roomy bevarer de større 44 px klikflader og tekstombrydning, mens desktop er et kompatibelt eksplicit valg af den kompakte præsentation. Handlingsknappens tool-variant har symbol over en kort 13 px label og mindst 52 px samlet klikflade. Brug større mål ved touch eller behov for større klikflader. Menuernes katalog beskriver anvendelse, grupper, destruktive handlinger og højst ét undermenuniveau. Produktspecifikke værktøjslinjer og inspektørlayout bliver i produktet.
