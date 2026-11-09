---
name: formlab-material-gpu
description: Undersøg og ret materialeflimmer i FormLab, især fuger, tilmurede blændingsfelter og munkestenskantsten, med aktuelle kilder og eksisterende GPU-prøver. Brug ved FormLabs materialer og produktionsshadere; almindeligt UI-arbejde og andre grafikmotorer kræver ikke denne skill.
---

# FormLab: materialer og GPU

Afgræns den konkrete fejl og bevar FormLabs eksisterende materialepipeline. En kildeobservation, en bestået shaderprøve og en korrekt synlig brugeroplevelse er forskellige former for belæg.

## Find det aktuelle grundlag

Brug Stades MCP-projekt `formlab`, når forbindelsen er tilgængelig og projektet er registreret: `get_project_context({projectId:"formlab"})`. Find den faktiske FormLab-mappe i opgavens projektkontekst; observationsscriptet bruger `FORMLAB_PROJECT_DIR` eller den aktuelle arbejdsmappe og validerer FormLab-filer før kørsel. Følg projektets aktuelle AGENTS.md, README.md, TASKS.md og relevante dele af docs/MATERIALEGENERATOR_V2.md. Historiske fejl er ikke automatisk aktuelle fejl.

Søg i erfaringerne med `search_experiences`, og hent relevante poster med `get_experience`. Læs hele `sourceChecks` sammen med `sourceStatus`, status, faktisk kontrol og begrænsninger. Brug `check_experience_sources({id})` til et nyt kildeopslag efter relevante ændringer.

- `changed`: læs og vurder den aktuelle kilde før erfaringen genbruges.
- `unavailable`: kontrollér projektregistrering eller adgang; fravær af adgang er ikke bevis for uændret kode.
- `unverifiable`: kilde eller sammenligningsgrundlag mangler; erfaringen er et spor til undersøgelse.
- `unchanged`: de kontrollerede filbytes matcher. Det beviser ikke uændrede afhængigheder, driverforhold eller brugerforløb.

Ved blandede resultater gælder vurderingen for hver kilde. Uden aktiv MCP kan de lokale erfaringsdata og faktiske kildefiler læses direkte; sammenlign relevante hashes/versioner og beskriv den udførte kontrol. Installerens genererede `references/stade-installation.json` kan angive `stadeRoot`, hvis Stades lokale mappe ikke er kendt. Skillen giver ikke adgang til nye projekter. En kladde eller en indsendt hash er ikke godkendt evidens.

## Undersøg den berørte materialevej

Registrér materialefamilie og materiale-id, kilde/asset-version, den faktiske produktionsvej, prøveflade eller byggedel samt kamera, lys og relevant browser/GPU. Brug samme opskrift og kameraforløb til sammenligningen. Læs [kildekort og prøver](references/material-workflow.md) for de berørte indgange.

Skeln især mellem:

- **Flimrende fuger:** Undersøg fysisk overfladehældning og filtrering før kantdækning. I FormLabs aktuelle kontrakt må skærm-AA, ejer-id'er og cellemasker ikke blive fysisk højde, som differentieres. Det er ikke et generelt forbud mod skærmafledte mål.
- **Blændingens tilmurede felt og munkestenenes kantsten:** Find den faktisk berørte mesh/materialevej. En bestået prøve af almindelig murflade eller blændingens bueprofil dækker ikke automatisk det tilmurede felt eller kantstenenes normaler.
- **Ressource- eller timingfejl:** Bevar delt ejerskab, den eksisterende teksturudskiftning og kontrollen af revision/lukning før adoption af sene svar.

Kamera, lys og pixelindlæsning må efter produktets kontrakt ikke udløse ny kildebagning. Materialer leverer overfladedata; FormLab ejer geometri, samlinger og koordinater. Ret den dokumenterede årsag i den berørte vej; en visningsfejl er ikke en bestilling på en ny materialemotor.

## Efterprøv og giv erfaringen videre

Vælg en eksisterende relevant prøve fra referencen. Ved shaderændringer kræves faktisk WebGL-kontrol med kompilering/upload, nær/fjern visning og det berørte kameraforløb. En CPU-test eller en bestået isoleret prøve erstatter ikke den berørte produktflade. Genbrug prøveværktøjer, før et nyt harness overvejes. Beskriv begrænsningen, hvis brugerens konkrete forløb ikke kunne reproduceres eller miljøet afviger.

Følg produktets buildregel efter autoriserede kodeændringer. Registrér kun ny genbrugelig viden, som arbejdet faktisk har givet: problem, afgrænset løsning, kilder med aktuel hash/version, kontrolmiljø og resultat samt resterende begrænsninger. `propose_experience` opretter en `draft`; brug kun `verification.kind:"tested"` om det, der faktisk blev afprøvet. Et historisk fund, som allerede er rettet, bør korrigeres eller afgrænses ved kuratering frem for at skabe en modstridende fælles regel.
