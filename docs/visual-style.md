# ClickHammer — visuele stijl en assetpipeline

## Doel

De game is een middeleeuwse smederij in **pixel-art-achtige** stijl: herkenbare
silhouetten, beperkt palet en zichtbare trappen tussen kleuren. Het doel is
sfeer en leesbaarheid, geen photorealisme. Pixel-perfect vectorwerk is geen
eis; wel scherpe randen, een strak grid en consistente kleur.

## Spritegrid

- Elk silhouet tekent op een **`16 × 16` grid** in een `viewBox="0 0 16 16"`.
- Vormen bestaan uitsluitend uit `<rect>`-elementen op gehele coördinaten.
  Diagonale lijnen worden getrappeerd in trappen van 1px; er zijn geen
  `path`-curves en geen `stroke` in de silhouetten.
- Een sprite wordt maximaal `48 × 48` px getekend en schaalt daarna met
  CSS. Grotere weergaven gebruiken `image-rendering: pixelated`.

## Schaalregels

| Grootte | Gebruik | pixels |
| --- | --- | --- |
| `small` | inline in tekst of chips | 20px |
| `medium` | orderkaart, ordertracker | 32px |
| `large` | vooruitschuimende showcase | 48px |

Alle schaling gebeurt met gehele veelvouden van het grid, zodat een pixel nooit
over een rand valt.

## Kleur: item bepaalt vorm, materiaal bepaalt kleur

Dit is de kern van het systeem. Er worden **geen 50 losse sprites** gemaakt,
maar:

- **10 silhouetten** in `src/sprites/items/`, één per item, allemaal wit.
- **5 kleurpaletten** in `src/sprites/sprites.ts`, één per materiaal.
- `ItemSprite.vue` combineert beide tot één sprite.

Elke item-achtige combinatie deelt dus de vorm van zijn item, terwijl de kleur
van het materiaal komt. Alle vijf varianten van een bijl hebben exact dezelfde
silhouet.

### Palet per materiaal

Elk materiaal levert drie kleuren: `base`, `highlight` en `shadow`.

| Materiaal | base | highlight | shadow |
| --- | --- | --- | --- |
| Brons | `#b87333` | `#e2a663` | `#6f4119` |
| IJzer | `#8e98a3` | `#c9d2dc` | `#4c545c` |
| Staal | `#5f7d96` | `#9dbcd6` | `#33475a` |
| Verzilverd | `#c3ccd6` | `#f2f6fa` | `#7f8894` |
| Verguld | `#d3a017` | `#ffdc6b` | `#8a6206` |

De kleur wordt als een `linear-gradient(160deg, highlight, base, shadow)` over
de vorm gelegd, wat per materiaal dezelfde driedimensionale indruk geeft.

### Waarom een CSS-mask

`ItemSprite.vue` gebruikt het silhouet als `mask-image` en vult het met een
achtergrondkleur en gradient. Dat is de goedkoopste manier om vorm en kleur
volledig te scheiden:

- één silhouetbestand levert alle vijf kleuraarianten;
- CSS-variabelen kunnen per container worden overschreven, dus hover- en
  focusvarianten kosten geen extra asset;
- de sprite blijft één DOM-node en schaalt zonder kwaliteitsverlies;
- er is geen canvas nodig, dus geen lost drawing bij elke render.

### Toegankelijkheid

De sprite is `role="img"` met een `aria-label` zoals `Verguld harnassen`. De
commandoregel blijft als tekst staan, dus de sprite is aanvullend en nooit de
enige bron van informatie. Een onbekende `itemId` rendert een lege gestippelde
placeholder met het label `Onbekend voorwerp` en verbreekt de pagina niet.

## Assetformaten en besluit

| Asset | Formaat | Besluit |
| --- | --- | --- |
| Itemsilhouet | `.svg` per item | Ja: schaalbaar, doorzoekbaar, mask-baar |
| Materiaalkleur | `.ts` | Ja: kleuren horen bij het thema, niet bij een asset |
| Upgradesprites | eigen bestanden | Ja: geen upgrade valt samen met item + materiaal |
| Achtergrond | `.svg` of CSS-laag | Losse laag, nooit bovenop de UI |
| Effecten (vonken, munten) | CSS-animatie of sprite | Korte duur, opgeruimd na afloop |

Silhouetten zijn losse bestanden omdat ze vorm zijn, en vorm is iets wat je
als ontwerper met de hand tekent en aanpast. Kleuren zijn geen vorm en horen
daarom in TypeScript naast de catalogi.

## Spritegalerij

Tijdens het maken van sprites is `sprite-check.html` in de projectroot een
handig hulpgereedschap. Het is een losse pagina die via de dev-server alle 50
combinaties rendert op 16px, 32px en 64px, zodat je in één oogopslag ziet of
vormen onderscheidbaar blijven en of kleuren per materiaal kloppen. De pagina
gebruikt dezelfde `src/sprites/sprites.ts` als de game zelf en wordt niet meegebouwd.

De logica van de galerij staat in `src/sprite-gallery.ts` en wordt vanuit de
HTML via `<script type="module" src="...">` geladen. Schrijf de imports dus
nooit als inline `<script type="module">` in de HTML: die wordt door de browser
geladen zonder tussenkomst van Vite, waardoor een kale specificatie als `'vue'`
faalt met *"was a bare specifier, but was never reassigned"*.

## Contrast

Sprites zijn geen tekst, maar hun kleur moet wel losstaan van het paneel. Elke
materiaalcombinatie is gekozen tegen `--color-surface-raised` (`#3a2921`) met
minstens 3:1, wat ruim boven de eis voor niet-tekstuele elementen ligt. De
hoofdtekst van een opdracht blijft `--color-text` op het paneer, dus 11.3:1.