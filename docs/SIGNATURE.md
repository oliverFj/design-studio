# Afsendersignatur i produkter

`signature` er et native link med logo og afsendernavn. `identity: 'fjordside'` viser det originale of-monogram og **Oliver Fjordside** i den medfølgende Platypi-skrift og linker til https://oliver.fjordside.dk/ i samme fane.

Signaturen krediterer afsenderen. Bevar produktets eget brand og primære handling. Agenter vælger placering og variant efter produktets layout; brug én tydelig signatur frem for at gentage den i alle paneler.

| Variant | Anvendelse |
| --- | --- |
| `default` | Indrammet signatur i header eller et selvstændigt område. |
| `quiet` | Uden synlig ramme på en almindelig temaflade, eksempelvis en footer. |
| `compact` | Mindre logo og navn til et smalt sidepanel; klikfladen er fortsat mindst 44 px høj. |
| `stacked` | Logo over navn i en centreret footer eller Om-visning. |

## Integration

```js
import {createComponent} from './design/runtime/components.mjs';

footer.append(createComponent(theme, 'signature', {
  identity: 'fjordside',
  variant: 'compact',
}));
```

Statisk HTML bruger samme options med `renderComponent`. Placér komponenten under produktets designscope. Produktet ejer placeringen; komponenten ejer layout, indvendige afstande, fokus og interaktionstilstande.

Flade, kant, afrunding, tekstfarve og hover følger temaets semantiske værdier. Navnet bevarer Platypi, og logoet bevarer originalens proportioner, mindst 20 px og en halv logobredde i frizone. Runtime vælger papir- eller sværteoriginalen ud fra kontrast mod temaets baggrund og interaktionstilstande. På en særskilt farvet flade kan `logoTone: 'paper'`, `'ink'` eller `'terracotta'` vælge en godkendt original; kontrollér selv kontrasten dér. Brug den indrammede variant, hvis den omgivende flade giver tvivl.

Logo og normal Platypi følger lokalt med runtime og genereret CSS, også når produktets tema er et andet. Der foretages ingen forespørgsel efter logo eller font ved brug. Bevar `SIGNATURE_LICENSE` fra `design/runtime/signature-assets.mjs` i produktets tredjepartslicenser. Originalerne er kopieret uændret fra Fjordsides brandressourcer; tegn ikke mærket på ny.

Til en anden afsender kan rollen bruge `name`, `href` og `logoSrc` med dennes godkendte original og rettigheder. `disabled: true` fjerner navigation og tabstop. Komponenten er et link, selv om den visuelt ligner en knap.

## Opdatering

Kør `tools/cli.mjs sync PROJECT_DIR` og produktets eget build efter biblioteksændringer. Eksisterende produkter får ikke signaturen indsat automatisk. Tilføj den, når opgaven omfatter afsenderkreditering.

Design Studio bruger signaturen i sidepanelet, og kataloget viser de fire varianter. [Onlinevejledningen](WEBSITE-SHOWCASE.md) beskriver synkronisering og udgivelse på hjemmesiden.
