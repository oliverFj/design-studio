# Design Studios designgrundlov

Et fælles grundlag for at skabe produkter med karakter, klarhed og omhu. Fra den mindste tokenværdi til den samlede oplevelse.

Version 1.0 · 5. november 2026. Gælder nye temaer, forbedringer af eksisterende temaer, fælles komponenter, designmønstre og produkter bygget med Design Studio.

Grundloven beskriver de beslutninger, vi vil kunne genkende i vores arbejde. Brandguiden giver det enkelte brand sin stemme. Den tekniske kontrakt bestemmer, hvad biblioteket og temaformatet understøtter. Grundloven erstatter ingen af delene.

Vi skelner mellem forskningsfund, faglig praksis og vores egne beslutninger. Forskning har en bestemt metode og kontekst. Et andet systems retningslinjer er erfaring og inspiration. Vores regler er bevidste valg, som skal kunne ændres, når bedre viden eller konkrete brugerbehov begrunder det.

## 01. Opgaven giver formen retning

Et godt produkt har en tydelig hensigt. Beskriv først, hvad brugeren skal forstå eller gennemføre, og hvilken karakter oplevelsen skal have. Æstetik er en del af den kvalitet, vi leverer; den skal hjælpe produktet med at føles forståeligt, troværdigt og værd at bruge.

> Faglig praksis · Rams forbinder æstetik med anvendelighed, forståelighed og omhu. GOV.UK tager udgangspunkt i brugerbehov og kontekst. Spectrum bruger principper som kriterier for beslutninger på tværs af fagligheder. [S01](#s01) · [S02](#s02) · [S03](#s03)

### Vores beslutning

- Beskriv temaets hensigt med tre præcise egenskaber og deres synlige konsekvenser. »Varm« kan betyde tonede neutrale farver og en bestemt billedstil; »moderne« alene kan ikke vejlede et valg.
- Skab karakter med få præcise greb. Lad en enkel form, en afgrænset accent eller et velplaceret materialeskift få plads. I illustrationer og præsentationer kan luft, fine kanter og bevidst komposition bære et stærkt udtryk uden høj visuel styrke. Det er en retning for vores arbejde, ikke en universel stilregel.
- Skeln mellem præsentation, læsning og arbejde. En introduktion må være generøs og udtryksfuld; en gentaget arbejdsopgave skal være hurtig og overskuelig.
- Prioritér adgang, forståelighed og bevaret brugerarbejde, når de kommer i konflikt med en visuel effekt. Bevar derefter brandets karakter med et andet greb.
- Lad produktet eje indhold, navigation og arbejdsgange. Biblioteket ejer fælles anatomi og adfærd; temaet ejer det visuelle udtryk inden for kontrakten.

### Kontrolspørgsmål

Hvilken opgave understøtter dette valg? Kan vi vise konsekvensen på en rigtig skærm? Hvis to principper kolliderer, vælger vi den løsning, der bedst bevarer adgang og opgavens gennemførelse, og forklarer den konkrete afvejning.

## 02. Hierarki gør opmærksomhed til en ressource

En skærm skal hjælpe øjet med at finde begyndelsen, det aktuelle arbejde og det næste relevante skridt. Hierarki opstår gennem samspil mellem størrelse, vægt, position, afstand, farve og gruppering. Flere fremhævelser giver ikke automatisk mere tydelighed.

> Forskningsfund · Tuch m.fl. undersøgte æstetiske førstehåndsvurderinger af websites. Lavere visuel kompleksitet og genkendelig opbygning gav bedre vurderinger i deres forsøg. Studiet dokumenterer førsteindtryk, ikke effektiviteten af en kompleks editor. [S04](#s04)

### Vores beslutning

- Giv hvert arbejdsområde et tydeligt tyngdepunkt. Fremhæv den vigtigste aktuelle handling; flere selvstændige områder kan have hver sin hovedhandling.
- Lad navigation og metadata træde tilbage uden at blive svære at læse. Visuel vægt må ikke reduceres ved at bryde kontrastkrav.
- Gruppér først med nærhed, justering og afstand. Tilføj en særskilt flade eller ramme, når gruppen har brug for en synlig grænse.
- Brug tætte og rummelige områder bevidst. En dataliste og en indledning behøver forskellige rytmer inden for samme tema.

### Kontrolspørgsmål

Kan en ny bruger pege på det vigtigste område og næste skridt? Kan en erfaren bruger stadig aflæse den nødvendige information uden unødig scrolling? Linears redesign er en relevant praksisreference for at få omgivende betjening til at træde tilbage. [S05](#s05)

## 03. Tokens fastholder beslutninger

Et token er nyttigt, når det navngiver en stabil rolle eller en genbrugt værdi. Antallet af tokens er ikke et kvalitetsmål. Målet er færre vilkårlige beslutninger og tydelige sammenhænge mellem palet, semantik og komponent.

> Teknisk reference · DTCG beskriver et udvekslingsformat med typer og referencer. Det er en Community Group-specifikation, ikke en W3C-standard, og det er ikke dokumentation for, at Design Studios eget format er fuldt kompatibelt. [S06](#s06)

### Vores beslutning

- Brug primitive værdier til paletter og skalaer, semantiske tokens til betydning og komponentbindinger til den konkrete anvendelse. Bevar Design Studios eksisterende model.
- Navngiv efter formål: en feltgrænse skal kunne justeres uafhængigt af en dekorativ skillelinje. Samme aktuelle værdi gør ikke to roller identiske.
- Opret kun et nyt token, hvis en eksisterende rolle ikke udtrykker behovet, og forskellen skal kunne styres bevidst. Beskriv anvendelse, standardværdi og relevante tilstande.
- Genbrug referencer ved fælles hensigt. Undersøg brug og kompatibilitet før sammenlægning eller fjernelse; en ubrugt værdi i kataloget kan være i brug i et produkt.
- Hold struktur, padding, gap, positionering og fokusmekanik i biblioteket. Temaet kan justere de understøttede positive spacingtokens, ikke genopfinde komponentens layout.

### Kontrolspørgsmål

Kan en anden person forklare forskellen mellem de to tokens uden at se deres værdier? Er ændringen placeret i det lag, der ejer beslutningen?

## 04. Farve har både betydning og karakter

Paletten giver temaet en stemme. Semantikken gør den pålidelig. Neutrale farver organiserer det meste af arbejdsfladen; handling, valg, status og brandaccent skal kunne skelnes i den konkrete sammenhæng.

> Faglig praksis · Fluent adskiller neutrale farver, brand og semantisk feedback. Carbon bruger semantiske roller og systematiske fladelag. Det er nyttige modeller, som vi tilpasser hvert temas karakter. [S07](#s07) · [S08](#s08)

### Vores beslutning

- Afstem neutralernes temperatur med brandet. En varm identitet må have varme grundflader; neutrale farver behøver ikke være rent grå.
- Giv accentfarven et bestemt arbejde, eksempelvis hovedhandling eller særlig redaktionel fremhævning. Ingen fast procentfordeling af farver er en universel regel.
- Hold fejl, advarsel og bekræftelse forståelige, også når brandets farve ligner en statusfarve. Supplér med tekst og relevante symboler.
- Afstem forgrund og baggrund som par i normal, hover, active og selected. Fokus og vedvarende valg har forskellige betydninger.
- Brug gerne OKLCH som designredskab til lyshed, farvestyrke og nuance. Kontrollér stadig de faktiske sRGB-farver, gamut og kontrast; ens numeriske trin garanterer ikke ens oplevelse. [S09](#s09)

### Kontrolspørgsmål

Er accentens rolle stadig tydelig, hvis vi fjerner logoet? Er status og valg forståelige uden farvesyn? Har hver relevant farvekombination tilstrækkelig kontrast?

## 05. Lys og mørke er samme identitet

Et tema kan være lyst, mørkt eller have begge farvetilstande. Vælg efter temaets idé og produktets behov; en modsat variation er ikke et leverancekrav. Når begge findes, skal de opleves som gennemarbejdede udgaver af samme produkt. Bevar typografisk karakter, geometri, betydning og placering. Afstem flader, farvestyrke, kanter og skygger særskilt.

> Faglig praksis · Carbon bruger forskellige lagmodeller i lyse og mørke temaer. Fluent justerer farvers lyshed og mætning i mørk tilstand. Ingen af delene gør automatisk inversion til en tilstrækkelig designmetode. [S07](#s07) · [S08](#s08)

### Vores beslutning

- Når temaet har begge tilstande, design og gennemgå dem side om side med samme indhold, samme valg og samme opgave.
- Skeln efter behov mellem canvas, arbejdsflade, indlejret område, kontrol og overlay. Roller kan dele farve, når andre signaler giver tilstrækkelig adskillelse.
- Brug lyshedsforskelle og relevante kanter til at gøre mørke lag læselige. Skygge alene er sjældent et tydeligt signal på en mørk baggrund.
- Genovervej lyse accentfladers areal og mætning i mørke. Bevar deres betydning uden at gøre dem utilsigtet dominerende.
- Kontrollér originale logoer, billeder, illustrationer, diagrammer og alle interaktionstilstande. Respektér systempræference og brugerens manuelle valg.

### Kontrolspørgsmål

Kan vi genkende brandet i begge tilstande? Er samme handling lige let at finde? Er lagene forståelige på en formular, en tæt editor og en præsentationsside?

## 06. Typografi og rum bærer kompositionen

Typografi skal give indholdet stemme og gøre det let at orientere sig. Afstande skal vise, hvad der hører sammen. En enkelt størrelsesskala eller en konsekvent afrunding kan ikke alene skabe en god skærm.

> Faglig praksis · Spectrum forbinder omhu med balancen mellem funktion og udtryk. Rams lægger vægt på grundighed i detaljen. Vores konkrete mål nedenfor er lokale arbejdsregler, ikke dokumenterede universelle optimummer. [S01](#s01) · [S03](#s03)

### Vores beslutning

- Giv display, overskrift, paneltitel, brødtekst, kontroltekst og metadata tydelige roller. Skab forskel med flere egenskaber end størrelse alene.
- Brug den expressive skrifttype til udvalgte øjeblikke. Lange tekster og gentagen betjening skal beholde en rolig, læsbar rytme.
- Tag udgangspunkt i 60–75 tegn pr. linje til længere læsetekst og mindst 1,4 i linjehøjde til brødtekst. Tilpas efter skrift og indhold; systemets brødtekstminimum er 14 CSS-px.
- Brug bibliotekets skalaer og positive semantiske afstande. Afstanden mellem grupper skal gøre relationen tydeligere end afstanden inden i gruppen.
- Vælg bredde gennem de eksisterende layoutprofiler efter indholdets opgave. Et bredt canvas må ikke trække formularfelter og indlejrede paneler ud af proportion.
- Bevar læsbarhed ved zoom, smal bredde, lange labels og manglende billeder. Lever skrifter lokalt med licens og relevant tegn- og vægtdækning.

### Kontrolspørgsmål

Kan siden stadig aflæses med realistisk tekstmængde? Hjælper de typografiske forskelle med at forstå indholdet, og holder indholdet sammen ved 200 % zoom?

## 07. Komponenter lover en bestemt adfærd

En komponent er et løfte om funktion, betydning og genkendelig betjening. Temaet må give den karakter, men må ikke gøre dens rolle eller tilstand tvetydig.

> Standardgrundlag · WCAG 2.2 stiller blandt andet krav til kontrast, tastaturbetjening og navne. At bestå et udvalg af automatiske kontrastmålinger er ikke dokumentation for et tilgængeligt produkt. [S10](#s10)

### Vores beslutning

- Genbrug en eksisterende rolle. Udvid centralt med en variant, når samme funktion og anatomi har et genbrugeligt behov; opret en rolle ved en selvstændig funktion.
- Beskriv formål, anvendelse, dele, varianter, tilstande, sammensætninger og preview. Giv nye roller brugbare defaults på tværs af temaer.
- Bevar native controls og fælles controllere. Labels, hjælp, fejl, tilgængelige navne og fokus er en del af komponentens kvalitet.
- Hold fremhævelse, størrelse og destruktiv betydning adskilt. En kompakt kontrol skal stadig have en brugbar klikflade og kunne rumme teksten.
- Gennemgå normal, hover, active, fokus, selected, disabled, loading og fejl, hvor de findes. Skeln især mellem fokus, aktuelt navigationsmål og vedvarende valg.
- Bevar brugerens kladder, fejl, valg og meningsfulde fokus ved opdateringer. Ugyldige input og annullering må ikke slette tidligere arbejde.

### Kontrolspørgsmål

Er komponentens funktion tydelig uden hover? Kan den bruges med tastatur? Er samme betydning synlig i begge farvetilstande og alle berørte temaer?

## 08. Mønstre viser et helt stykke arbejde

Et designmønster skal demonstrere en sammenhængende opgave med realistisk indhold, beslutninger og feedback. Det skal være muligt at forstå, hvornår mønstret er relevant, og hvad der skal tilpasses i produktet.

> Faglig praksis · GOV.UK anbefaler sammenhængende services, genkendelige mønstre og iteration med brugere. Linear beskriver, hvordan mange rimelige lokale tilføjelser over tid kan svække helheden. [S02](#s02) · [S05](#s05)

### Vores beslutning

- Præsentér først den færdige oplevelse og dens formål. Vis derefter anatomi, komponentvalg, interaktioner og genbrug.
- Gennemarbejd indgang, hovedopgave og afslutning. Medtag relevante tilstande som tomt indhold, ingen søgeresultater, fejl, ventetid, langt indhold og bevarede kladder.
- Vis klare relationer mellem navigation, liste, valg, detaljeområde og handling. Hver indlejret container skal have en grund til sin egen indramning.
- Brug realistiske tekstlængder og datamængder. Markér demonstrationsdata, og gør det tydeligt, hvad en handling faktisk gemmer eller ændrer.
- Lad produktet eje skærmkomposition, data, kommandoer og lagring. Referencekode er et udgangspunkt; en kopi bliver ikke automatisk opdateret med biblioteket.
- Præsenter mønstre med deres anvendelse, begrænsninger, adfærd og ophav. Et flot startscreenshot dokumenterer ikke et fungerende forløb.

### Kontrolspørgsmål

Kan brugeren gennemføre opgaven og forstå resultatet? Kan en udvikler se, hvad biblioteket leverer, og hvad produktet selv skal implementere?

## 09. Bevægelse forklarer forandring

Bevægelse skal forbinde årsag og virkning, bevare orientering eller give relevant feedback. Den skal føles responsiv og kunne afbrydes. Hver animation skal have en begrundelse og en forståelig statisk tilstand.

> Faglig praksis · Carbon skelner mellem diskret arbejdsbevægelse og mere udtryksfulde øjeblikke. Material beskriver bevægelse som én del af et samlet visuelt hierarki. Det dokumenterer ikke, at mere animation generelt forbedrer en oplevelse. [S11](#s11) · [S12](#s12)

### Vores beslutning

- Brug hurtig feedback til kontroller, rolig kontinuitet til ændringer i layout og mere udtryk til få betydningsfulde øjeblikke.
- Arbejd som udgangspunkt med cirka 100–160 ms til lille kontrolfeedback og 180–280 ms til afgrænsede overgange. Det er lokale startpunkter, der afstemmes efter afstand og opgave.
- Den eksisterende fælles standard er 240 ms til udfoldning og tilbagevenden. Brug den, hvor den passer. Nye fælles bevægelsesmønstre udvikles centralt; dokumentet indfører ingen nye runtime-tokens.
- Vis reaktion straks. Gentaget input skal kunne afløse en igangværende overgang uden en kø af animationer. Animation må ikke forsinke en kommando eller afgøre, hvornår data gemmes.
- Respektér reduceret bevægelse med en statisk eller væsentligt enklere overgang. Brug som lokal regel ingen automatisk, vedvarende dekorativ bevægelse i arbejdsflader.
- Motion graphics kan forklare et produkt eller et forløb. Giv brugeren kontrol over afspilning og tilsvarende information uden bevægelse. WCAG 2.2.2 er niveau A; 2.3.3 om interaktionsanimation er niveau AAA. Vi vælger at understøtte reduceret bevægelse uanset denne forskel. [S13](#s13) · [S14](#s14)

### Kontrolspørgsmål

Hvad lærer brugeren af bevægelsen? Virker gentagen aktivering og reduceret bevægelse? Kan opgaven stadig gennemføres, hvis animationen fjernes?

## 10. Gradienter og materialer skal have en opgave

Gradienter kan tilføre atmosfære, retning eller materialefornemmelse. Transparens, lys og skygge kan hjælpe med at forklare lag. Ingen af disse effekter er i sig selv et tegn på kvalitet eller modernitet.

> Vores vurdering · Vi har ikke grundlag for at sige, at gradienter generelt gør produkter mere brugbare. Her bygger valgene på visuel hensigt og konkret kontrol. Farveinterpolation er en teknisk egenskab; tekstkontrast skal stadig vurderes mod den faktiske baggrund. [S09](#s09) · [S15](#s15)

### Vores beslutning

- Brug en gradient til et navngivet formål: stemning i en introduktion, dybde i en illustration eller en forklaret databetydning. Undlad effekten, hvis hensigten ikke kan vises.
- Begynd med få velvalgte farvestop. Afstem nuance, lyshed, retning og styrke med brandet, og kontrollér overgangens mellemliggende farver.
- Bevar læselige, stabile underflader bag længere tekst og vigtig betjening. Kontrollér kontrast over hele tekstens område, i temaets leverede farvetilstande og ved ændret beskæring.
- Brug skygge til reel elevation og kanter til nødvendige grænser. Undgå at lægge glød, kraftig skygge og stærk kant på samme element uden en konkret grund.
- Transparens kræver kendt underlag og en solid fallback. Kontroller, fokus og indhold skal også fungere i højkontrast og uden effekten.
- Produktet ejer dekorativ komposition og grafik. Temaets understøttede appearance-overrides må kun ændre udtryk inden for kontrakten. De centrale grundflader forbliver opake og målbare.

### Kontrolspørgsmål

Understøtter effekten temaets karakter? Holder teksten kontrast gennem hele forløbet? Bevarer skærmen hierarki og funktion på en flad, statisk baggrund?

## 11. Tilgængelighed er en del af håndværket

Et udtryk skal kunne opleves og bruges af flere mennesker, på forskellige skærme og med forskellige præferencer. Tilgængelighed skal indgå i designbeslutningen fra begyndelsen og kontrolleres i det konkrete produkt.

> Standardgrundlag · WCAG angiver mindst 4,5:1 for almindelig tekst og 3:1 for stor tekst med kriteriets definition og undtagelser. Nødvendige visuelle signaler i kontroller har særskilte krav til nabofarver. Dekorative kanter er ikke automatisk omfattet. [S15](#s15) · [S16](#s16)

### Vores beslutning

- Bevar systemets strengere fælles regel om synlige feltgrænser på mindst 3:1 mod de relevante grundflader. Brug ikke denne regel som argument for kraftige rammer om alt indhold.
- Bevar synligt fokus, tilgængelige navne og logisk tastaturbetjening. Farve alene må ikke bære vigtig information.
- Almindelige handlingskontroller har som udgangspunkt mindst 44 px klikflade. Dokumenterede kompakte varianter følger bibliotekets regler; 44 px er vores udgangspunkt, ikke et universelt WCAG AA-krav.
- Kontrollér smalle rammer, tekstombrydning, zoom og relevant reflow. Prøv også højkontrast, reduceret bevægelse og relevante hjælpemidler, når ændringen berører dem.
- Rapporter præcist, hvad der er målt og afprøvet. Et gyldigt tema eller en automatiseret kontrol er ingen tilgængelighedscertificering.

### Kontrolspørgsmål

Hvad sker der med tastatur, større tekst og brugerens præferencer? Har vi fjernet en barriere eller blot bestået en måling?

## 12. Kvalitet bevises i produkter

Et tema er først overbevisende, når det fungerer på forskellige skærme med ægte indhold og relevante forløb. Vi vurderer både, hvordan noget opleves, og hvad mennesker faktisk kan gøre med det.

> Forskningsformidling · NN/g beskriver, hvordan visuelt tiltalende interfaces kan opleves som mere brugbare og samtidig maskere problemer i brugertest. Material rapporterer positive resultater for udvalgte expressive designs, men fremhæver selv kontekstens betydning. Ingen af delene er en garanti for Design Studio. [S12](#s12) · [S17](#s17)

### Vores beslutning

- Gennemgå et nyt tema på en læse-/præsentationsside, en formular eller liste og en tæt arbejdsflade. Hvis begge farvetilstande leveres, bruges samme indhold til sammenligning.
- Forbedr eksisterende temaer ud fra konkrete problemer: manglende hierarki, utydelige lag, inkonsekvente tilstande eller svag brandkarakter. Bevar det, der allerede virker.
- Brug fælles kontrolskærme til sammenligning, og prøv derefter et faktisk produkt. Ret fælles problemer i biblioteket og særlige kompositionsproblemer i produktet.
- Spørg særskilt til oplevet karakter og observeret opgaveløsning. »Det ser bedre ud« og »opgaven lykkes lettere« er forskellige resultater.
- Vælg validering efter ændringens konsekvens. En lille rettelse kræver en lille relevant kontrol; nye skærme og væsentlige visuelle ændringer kræver browsergennemgang og relevante brugerforløb.
- Respektér bygning, synkronisering og offlinelevering. Afprøv direkte file://, når leverancen skal fungere sådan; en HTTP-forhåndsvisning dokumenterer noget andet.

### Når vi udvikler eller reviderer et tema

1. Beskriv hensigt, produktkontekst og de konkrete problemer, der skal løses.
2. Vælg én eller begge farvetilstande, og afstem typografi, neutrale flader og accent i de valgte tilstande.
3. Gennemarbejd komponenternes relevante tilstande og deres samspil i mønstrene.
4. Tilføj kun bevægelse og materialer, hvor de styrker en navngivet hensigt.
5. Kontrollér repræsentative skærme og faktiske forløb; sammenhold karakter med brugbarhed.
6. Registrér endelige temaændringer i temaets history, og synkronisér de produkter, der skal have dem. Ingen automatisk omskrivning af eksisterende produkter.

### Gyldighed og udvikling

Dette er version 1 af vores fælles retning. Reglerne er ikke en påstand om, at alle nuværende temaer opfylder dem, og de ændrer ikke den tekniske kontrakt af sig selv. Nye beslutninger skal kunne begrundes med brugerbehov, relevant viden og et konkret eksempel. Ved revision opdateres dette dokument, som også er indholdskilden til siden Principper.

## Kilder og evidens

Udvalgt og gennemgået 5. november 2026. Vi bruger original forskning og forfatternes egne formidlinger, officielle standarder og designsystemernes egne beskrivelser. Blogs om egne produkter er værdifulde praksisreferencer, men ikke uafhængige effektstudier. Der er ingen systematisk litteraturgennemgang eller egen brugerundersøgelse bag denne første udgave.

### S01

**Dieter Rams / Vitsœ**

[Ten principles for good design](https://www.vitsoe.com/us/about/good-design). Designfilosofi og historisk faglig reference. Forbinder æstetik, anvendelighed, forståelighed, holdbarhed og omhu. Principperne er værdier og vurderingskriterier; de beviser ingen bestemt digital stil.

### S02

**Government Digital Service**

[Government Design Principles](https://www.gov.uk/guidance/government-design-principles). Officielle serviceprincipper. Vigtige for brugerbehov, kontekst, iteration og genbrug af velfungerende mønstre. Vi overtager ikke GOV.UK's visuelle identitet eller gør offentlige services til model for alle produkter.

### S03

**Adobe Spectrum**

[Principles](https://spectrum.adobe.com/page/principles/). Officiel designfilosofi med rationelle, menneskelige, fokuserede og samarbejdende perspektiver. Relevant som eksempel på principper, der bruges på tværs af design og udvikling. En normativ praksisreference, ikke et effektstudie.

### S04

**Tuch m.fl., 2012 / Google Research**

[The role of visual complexity and prototypicality regarding first impression of websites](https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/) og [forskerens formidling](https://research.google/blog/users-love-simple-and-familiar-designs-why-websites-need-to-make-a-great-first-impression/). Forskning i hurtige æstetiske vurderinger af websites ud fra screenshots. Informerer vores arbejde med kompleksitet og genkendelighed; må ikke bruges som evidens for arbejdshastighed eller en universel regel om minimalisme.

### S05

**Linear**

[A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh), 12. marts 2026. Produktteamets beskrivelse af et redesign med opmærksomhed, navigation og konsistens i fokus. Konkret inspiration til tætte arbejdsflader. Teamets egen fortælling er ikke en uafhængig sammenlignende evaluering.

### S06

**Design Tokens Community Group**

[Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/). Stabil Community Group-specifikation til udveksling af tokens. Teknisk reference for typer og referencer; hverken en W3C Recommendation eller en æstetisk kvalitetsmodel.

### S07

**IBM Carbon**

[Color overview](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview). Officiel vejledning om semantiske farver, interaktionstilstande og forskellige lagmodeller for lys og mørke. Vi bruger logikken som reference; palet og præcise lagvalg tilhører vores temaer.

### S08

**Microsoft Fluent 2**

[Color](https://fluent2.microsoft.design/color). Officiel vejledning om neutrale farver, brand, semantik og tilstande. Understøtter en systematisk adskillelse af betydning og udtryk. Det konkrete visuelle resultat skal stadig vurderes i vores produkter.

### S09

**W3C CSS Working Group**

[CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/). Teknisk specifikation under udvikling, blandt andet for OKLab/OKLCH og farveinterpolation. Beskriver farvernes beregning og repræsentation, ikke en opskrift på smukke paletter eller dokumenteret effekt af gradienter.

### S10

**W3C WAI**

[Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/). W3C Recommendation og normativ kilde til tilgængelighedskriterier. Konformitet kræver opfyldelse af relevante kriterier på det valgte niveau, ikke blot et udvalg af automatiske prøver.

### S11

**IBM Carbon**

[Motion overview](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview). Officiel vejledning om formål, bevægelseskarakter, easing og varighed. Informerer vores skelnen mellem hurtig feedback og større overgange. Vores tidsintervaller er egne startpunkter.

### S12

**Google Design / Material**

[Better, Easier, Emotional UX](https://design.google/library/expressive-material-design-google-research). Googles egen sammenfatning af research bag Material 3 Expressive. Rapporterer undersøgelser af præference og opmærksomhed og beskriver kontekstafhængige gevinster. Artiklen offentliggør ikke fulde metoder og data for alle studier og giver ingen generel garanti for udtryksfuldt design.

### S13

**W3C WAI**

[Understanding 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Forklaring til et niveau AAA-kriterium om at kunne deaktivere ikke-essentiel interaktionsanimation. Understanding-dokumentet er informativt; selve kriteriet står i WCAG.

### S14

**W3C WAI**

[Understanding 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). Forklarer niveau A-krav til automatisk bevægelse og opdatering, inklusive betingelser og undtagelser. Vores lokale regel om ro i arbejdsflader er bredere end kriteriet.

### S15

**W3C WAI**

[Understanding 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Forklarer niveau AA-kravet til tekstkontrast, stor tekst og undtagelser. For tekst på billeder og gradienter skal den faktiske baggrund tages i betragtning.

### S16

**W3C WAI**

[Understanding 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Forklarer niveau AA-kravet til nødvendige visuelle signaler i kontroller og grafik. Det er ikke et generelt krav om 3:1 for alle dekorative kanter eller mellem to efterfølgende hovertilstande.

### S17

**Nielsen Norman Group**

[The Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/). Faglig forskningsformidling om forholdet mellem visuelt udtryk og oplevet brugbarhed, med eksempler fra brugertest. Begrundelse for at måle oplevelse og faktisk opgaveløsning hver for sig; ingen tilladelse til at overse funktionelle fejl.
