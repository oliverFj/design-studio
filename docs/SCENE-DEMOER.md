# Fund fra Blog, Webshop og Editor i Stade Scene

Blog, Webshop og Editor ligger i **Scener**. **Åbn i Scene** åbner skabelonen, hvor de levende dele kan flyttes, og **Afprøv** kører den samme demo i det redigerede layout. Den byggede app indeholder den samme versionerede scenefil som editorens startpunkt.

`get_scene_context` læste de gemte akter, blokke og felter for alle tre apps i projektet `stade-scene`. Agenter kan nu inspicere demoerne med samme værktøj som andre registrerede Scene-apps.

| Demo | Hvad bibliotekerne kunne bære | Hvad der stadig kræver produktkode |
| --- | --- | --- |
| Blog | Fremhævet artikel, Artikelliste og Artikellæser kan placeres uafhængigt. Flere lister kan vise forskellige udsnit af én artikelsamling. | Artikler bygges til appen sammen med scenen. Scenen ejer indhold, billedreferencer og valget af læser. [Kilde](../studio/scenes/editorial-commerce.mjs) |
| Webshop | Kort, billeder og native antalvalg fungerer i katalog og produktdetaljer. Kurven bevarer antal og beløb, når dens blok flyttes. | Produktdata og kurvregler hører til appen. [Kilde](../studio/scenes/editorial-commerce.mjs) |
| Editor | Den eksisterende objekteditor genbruger træ, formular og arbejdsflade. Objektvalg, kladde og anvendelse fortsatte, da Scene flyttede hele blokken. | Arbejdsflade, hierarki og egenskaber er bundet til én controller bag én rod. Selve mønstret mangler de redigerbare dele og Scene-felter, der skal til for at indsætte det fra det almindelige blokbibliotek. [Mønster](../patterns/object-workbench.mjs) · [Katalog](../patterns/catalog.mjs) |

Alle tre demoer blev prøvet ved 320 pixels. Et butiksnavn på 91 tegn gav vandret rulning før rettelsen. De redigerbare overskrifter kan nu bryde lange ord, og den samme prøve passede i appvisningen efter rettelsen.

## Prioriterede mangler

1. **Registrér levende mønstre gennem én aftale med Scene.** Blog, Webshop og Editor afprøver nu én definition af dele og felter til Blokbiblioteket, Egenskaber og `get_scene_context`. De levende dele bruger fortsat deres egne controllere og kan sættes sammen i en tom app. [Appmønstre i Stade Scene](INTEGRATION.md#appmønstre-i-stade-scene)
2. **Bind handlinger til mål i layoutet.** Kurvknappen kan nu pege på en blok eller en akt. I browserprøven beholdt kurvblokken sit id, da den blev flyttet til en anden akt. Knappen åbnede kurven både som panel og side, med samme antal og beløb. [Handlinger i Stade Scene](INTEGRATION.md#appmønstre-i-stade-scene)
3. **Tilføj validerede, lokale indholdssamlinger og gentagelser.** Blog og Webshop registrerer Artikler og Varer i den samme indholdseditor. Magasinbutik afprøver, at en artikel kan pege på en vare, og at samme varepost bruges i katalog, varedetaljer og kurv. Bloggens lister har hver deres valg for antal, startpunkt og visning.
4. **Giv appens data deres egen gemmekontrakt.** Scenefilen beskriver layout, feltvalg og medier. Bloggens åbne artikel, Webshoppens kurv og Editorens objektkladder lever i den åbne app. For en egentlig produktapp skal agenten kunne se, hvilke data der gemmes, hvad der kan fortrydes, og hvordan en prøve starter i fx en tom eller fyldt kurv.

Komponenterne dækkede de tre demoers basale betjening. Den største gevinst for agenter ligger i at gøre sammensatte mønstres dele, data og handlinger til noget, Scene kan inspicere og validere. Produktkode kan fortsat levere forretningsregler og specialiserede arbejdsflader.
