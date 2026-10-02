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

## Achtergrondscènes

Een locatie (nu `projects` en `smithy`) mag een tekening als achtergrond
hebben. Die staat in `src/sprites/backgrounds/` als los `.svg` en wordt
aangesloten via `backgroundUrlsByView` in `src/types/ui.ts`.

| Regel | Waarom |
| --- | --- |
| `viewBox="0 0 320 200"` | De scene is een vast venster; de container bepaalt het uitsnedeformaat |
| `shape-rendering="crispEdges"` | Anders krijgt een diagonaal randje subpixelantialiasing in plaats van pixel |
| Alleen `<rect>` met gehele coördinaten | De scene is pixel-art. Curves en halve pixels breken die grid |
| Geen `stroke` | Streken schalen mee en worden dan dun of dik, een rect-spritesprite niet |
| Detail buiten het midden | Op breed scherm ligt het paneel over het midden; alleen de randen blijven echt zichtbaar |

Die laatste regel is de valkuil. Op 1440px schaalt de scene met `cover`
ongeveer 3.8x en valt een flinke strook van boven weg; op 320px is juist
alleen de onderste strook over. Leg dus het herkenbare werk (de haard, de
open deuren) in de randen en het midden, en het decor in het midden dat toch
al door het paneel valt.

De scene is nooit het contrast. `App.vue` legt er een sluier over met
`--scenery-veil-*`, en elke locatie draagt een eigen modifierklasse om die
kleuren te tunen: de smederij gebruikt warmbruin omdat een grijze sluier over
het fel vuur groen loopt. De sluier zit in een `::before` met
`z-index: -1` en een `inset: 0`, dus onder de panelen en zonder overhang die
horizontale scroll veroorzaakt.

## Forge-sheet

Het aambeeld met de hamer is het enige voorwerp dat je zelf aanklikt, en het
zit daarom in **één** sheet in plaats van in drie losse bestanden:
`src/sprites/forge/anvil-sheet.svg`. Drie cellen van 48 bij 48 op het 16-grid,
van links naar rechts `idle`, `pressed` en `strike`. De stam en het aambeeld
herhalen per frame; alleen de hamer verschuift.

De sheet wordt aangesloten via `src/sprites/forge-sheet.ts`, dat de URL, de
celgrootte, de framecount en de pose-union exporteert. `GameButton.vue` bindt
de frameindex aan `data-pose` en zet die om in twee custom properties:

| Eigenschap | Waarom |
| --- | --- |
| `background-size: 300% 100%` | De tekening is drie keer het element breed, dus elke cel is precies één element |
| `background-position: calc(var(--forge-frame) * var(--forge-frame-step))` | Eén stap van 50% haalt één cel op, want `p * (1 - 3) = -1` bij `p = 0.5` |
| `image-rendering: pixelated` | Anders herinterpoleert de browser de randen op schaal |

Let op de stap: `50%` is `1 / (frames - 1)` en dus geen deling door het aantal
frames. Bij vier frames zou 33,33% een derde cel zijn en geen hele, waardoor
de sprite op een halve cel staat te knippen. `FORGE_FRAME_STEP` staat in
`forge-sheet.ts` zodat sheet en component niet uit elkaar kunnen lopen, en
`forge-sheet.test.ts` rekent de relatie na.

De spritegrootte in het spel is 6rem, 9rem of 12rem, oftewel 2x, 3x of 4x de
cel van 48px. Een niet-gehele verhouding zou sommige pixelrijen drie
schermpixels dik maken en andere twee.

De poseruntime hoort in state, niet in een CSS-animatie: de hamer moet bij een
klik zichtbaar slaan en na 140ms terugvallen naar `idle`, ook als
`prefers-reduced-motion` de overgang op 1ms zet. `GameButton.vue` houdt daarom
een `setTimeout` bij die in `onUnmounted` wordt opgeruimd.

## Tijdelijke effecten

Vonken en munten hebben hetzelfde skelet: iets zichtbaar maken, een vaste
duur later weer weghalen. Dat skelet staat in één plek:
`useTransientEffect({ durationMs })` in `src/composables/`.

| Vastgeld | Waarom |
| --- | --- |
| `isRunning` | Zolang waar staat het effect in de DOM; de ouder bindt het met `v-if` |
| `runId` | Teller die bij elijke `trigger` oploopt; bind hem als `:key` |
| `trigger()` | Zet aan, herstart de duur |
| `stop()` | Wis de timer en zet uit |

De `runId` is niet gemakkelijkheid maar noodzaak. Zonder `:key` blijft het
element bij een snelle tweede klik in de DOM en herstart de CSS-animatie niet:
de speler tikt, tikt, en ziet de tweede vonkenburst of explosie over het
hoofd. `GameButton` doet hetzelfde voor de hamerklap.

De duur staat in JavaScript, niet in de animatie. Het element moet echt uit de
DOM, want dat is het enige wat de browser zeker niet meer tekent. Onder
`prefers-reduced-motion: reduce` duurt de animatie nog 1ms, terwijl het element
tot zijn tijd op voorbij blijft staan — onzichtbaar, en de toestand blijft
voorspelbaar voor tests.

Let op de `animation`-shorthand: daar hoort **geen** `--transition-`-token in.
Die token is `180ms ease` en levert dus zelf een duur in de lijst; samen met
een eigen duur en een vertraging ontstaan drie tijdswaarden, de shorthand is dan
ongeldig en de hele declaratie wordt stilzwijgend weggegooid. Alle deeltjes
stonden toen op één punt gestapeld en bewoog er niets. Gebruik daarom losse
`animation-name`, `-duration`, `-timing-function`, `-delay` en `-fill-mode`.

### Vonken

`src/components/SparkBurst.vue` is **geen asset**. Het is CSS, en dat is een
bewuste afwijking van de spriteconventies hierboven; het is merkbaar. De vonken
zijn blokkerig, niet gearond en niet onscherp, zodat ze nog als pixel-art lezen,
 maar ze komen niet uit een sprite.

De burst heeft twee lagen. Een vierkante flitsring klapt in 231ms uit tot bijna
twee keer de sprite, en daaromheen vliegt een bad van twaalf vonken uiteen. Een
bad van losse puntjes alleen leest niet als een klap; het ringje is wat het
contactpunt aan de schepper geeft.

De banen staan in een vaste tabel, niet in `Math.random()`. Een willekeurige
baan maakt de test en de screenshot onvoorspelbaar, terwijl niemand merkt dat
de vonken niet elke keer exact anders vliegen. Ze zitten in eenheden van
`--effect-scale` en de CSS vermenigvuldigt ze nog eens met 2, 3 of 4, zodat de
waaier op elk breakpoint even groot is ten opzichte van het aambeeld. De
**grootte** van een vonk wordt niet vermenigvuldigd: een meegeschalde vonk van
28px leest als een gloeiend blok.

De opacity staat om 80% van de keyframe op nul, niet pas op 100%. De
`.game-topbar` is sticky en ondoorzichtigig, en gemeten wordt die kop rond de
86% van de vlucht bereikt. Zonder de vroege vervaaging schuurt de hoogste vonk er
met een opacity van 0,27 langs, wat in beeld afknippen is. De vlucht hoeft daarom
niet ingeperkt te worden: de zichtbare waaier blijft even groot en een latere
koptekst zou de vonken alleen nog eerder laten uitvagen. Gemeten na de fix is de
kleinste ruimte 21px op 320px, 17px op 768px en 15px op 1440px.

Ze zitten in `.game-button__stage`, het vak dat de sprite deelt. De oorsprong
ligt op 47% bij en 52% hoog, wat in de forge-sheet van T35 overeenkomt met de
rij waar de hamer het aambeeld raakt. Zou de sprite en de vonken niet hetzelfde
vak delen, dan klopt dat contactpunt niet en zou `GameButton` de padding van de
knop moeten compenseren.

Bij het afronden van het laatste project verdwijnt het aambeeld en dus de hele
bad. De muntenexplosie staat daarom in de view-laak en niet op het aambeeld; de
twee zijn daardoor nooit tegelijk zichtbaar. Dat is geen ongeluk maar de
bedoeling: de vonken zijn invoerfeedback, de munten zijn de beloning.

### Munten

`src/components/CoinBurst.vue` werkt hetzelfde, met twaalf gouden blokken van
32px. Een munt is een blok met een donkere en een lichte inset, zodat hij als
schijf leest en niet als rechthoek. Ook hier een vaste tabel, met per munt een
eigen rotatie, want een munt die rechtop blijft hangen is geen munt maar een
rechthoek.

De baan is een fontein: een korte opwaartse schop en daarna het uitwaaieren en
neerkomen. De eindpunten liggen omlaag, want recht omhoog zou de munten achter
de vaste topbar terechtkomen. De zijwaartse spreiding blijft binnen 110px, zodat
er op 320px niets buiten het scherm stuurt.

De explosie staat niet in `GameButton`. Bij het afronden van een doel is het
aambeeld verdwenen, want het is dan niet meer het actieve doel, en het effect
zou zijn anker kwijt zijn. Daarom zit hij in `.game-view__effect-layer`, een
nulgroot vlak bovenaan de view. Die laag staat zowel in de projectenview als in
de smederij, want beide vieren met munten en je staat op dat moment in de view
waar je werkte. Doordat het vlak geen hoogte hoeft te kennen, blijft het kloppen
op elk breakpoint: de aambeeldgrootte staat op `.game-button` en wisselt per
schermbreedte.

De `reward` bepaalt de spreiding over een log schaal, met een klemmen. De
projecten leveren 0, 5 miljoen en 500 miljoen munten en een eerste order een
handvol; zonder klemmen zou de grote projectbeloning de munten het scherm uit
vliegen, en zonder vloer zou een kleine orderbeloning eruit vliegen.

## Contrast

Sprites zijn geen tekst, maar hun kleur moet wel losstaan van het paneel. Elke
materiaalcombinatie is gekozen tegen `--color-surface-raised` (`#3a2921`) met
minstens 3:1, wat ruim boven de eis voor niet-tekstuele elementen ligt. De
hoofdtekst van een opdracht blijft `--color-text` op het paneer, dus 11.3:1.