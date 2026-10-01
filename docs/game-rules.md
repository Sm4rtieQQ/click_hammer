# ClickHammer — gameplayregels

Dit document legt de spelregels vast voor de centrale `useGameState`-composable en de views van ClickHammer.

## Beginstate

De eerste keer dat de game wordt geopend, geldt:

```ts
{
  points: 0,
  coins: 0,
  completedProjects: [],
  upgrades: [],
  projectProgress: {},
  completedOrderCount: 0,
  nextOrderId: 1,
  offeredOrders: [],
  activeOrder: null
}
```

- `clickPower` is `1`.
- Het eerste actieve project is `Herstel het aambeeld`.
- Er zijn geen aangekochte upgrades.
- Opdrachten zijn geblokkeerd totdat het eerste project voltooid is.
- `points` is de totale score. Punten worden niet uitgegeven; munten worden gebruikt voor upgrades.

## Clickregels

- Een handmatige klik voegt exact de huidige `clickPower` toe aan het actieve doel van de gekozen view.
- Op **Smederij** voeden clicks de actieve order.
- Op **Projecten** voeden clicks het actieve ontgrendelde project.
- Op **Upgrades** zijn geen clickacties beschikbaar.
- `clickPower` begint op `1`.
- `clickBonus` is een percentagebonus. Elke aangekochte upgrade vermenigvuldigt met `1 + clickBonus / 100`.
- Bij herhaalde aankopen wordt de bonus opnieuw toegepast.
- `points` en voortgang zijn nooit negatief, `NaN` of oneindig.
- Een klik die een niet-eindige waarde zou veroorzaken wordt genegeerd.

## Projectprogressie

Projecten worden in catalogusvolgorde afgehandeld. Het actieve project is het eerste niet-voltooide project dat ontgrendeld is.

Per earned point op het projecttabblad:

1. `points` neemt met de earned points toe.
2. `projectProgress[projectId]` neemt met dezelfde earned points toe.
3. De voortgang wordt begrensd op `requiredPoints`.
4. Bij bereiken van `requiredPoints` wordt het project één keer voltooid.
5. `coinReward` wordt één keer toegekend.
6. Het volgende project kan pas na het vorige project ontgrendeld worden.

### Projectcatalogus

| Volgorde | Project | Ontgrendeling | Vereiste punten | Munten |
| ---: | --- | ---: | ---: | ---: |
| 1 | Herstel het aambeeld | 0 | 10 | 0 |
| 2 | Bouw de smederij | 1.000 | 100.000 | 5.000.000 |
| 3 | Bevrijd de vesting | 25.000.000 | 250.000.000.000 | 500.000.000 |

`Herstel het aambeeld` is verplicht als eerste doel. Het levert geen munten. De andere projecten leveren veel meer munten dan een afzonderlijke order.

Het projecttabblad toont alleen alle voltooide projecten en het eerstvolgende project. Latere projecten blijven verborgen.

## Herhoudende opdrachten

Na voltooiing van `Herstel het aambeeld` worden twee offertes aangeboden. De speler kiest één aanbieding; daarna is er één actieve order.

Een order bestaat uit precies één item:

```text
smeed <aantal> <materiaal> <item>
```

Bijvoorbeeld:

```text
smeed 10 bronzen hoefijzers
smeed 10.000 vergulde harnassen
```

### Materialen

| ID | Naam | Weergave | Puntmultiplier | Muntmultiplier |
| ---: | --- | --- | ---: | ---: |
| 1 | Brons | bronzen | 1× | 1× |
| 2 | IJzer | ijzeren | 4× | 2× |
| 3 | Staal | stalen | 12× | 4× |
| 4 | Verzilverd | verzilverde | 36× | 8× |
| 5 | Verguld | vergulde | 100× | 16× |

### Items

| ID | Item | Puntmultiplier | Muntmultiplier |
| ---: | --- | ---: | ---: |
| 1 | hoefijzers | 1× | 1× |
| 2 | klinknagels | 1,5× | 1,2× |
| 3 | pijlpunten | 2,5× | 1,5× |
| 4 | bijlen | 4× | 2× |
| 5 | schilden | 7× | 2,5× |
| 6 | dolken | 12× | 3× |
| 7 | speren | 20× | 4× |
| 8 | zwaarden | 35× | 5× |
| 9 | helmen | 60× | 6× |
| 10 | harnassen | 100× | 8× |

### Ontgrendeling

Elke materiaal-itemcombinatie heeft een ontgrendelingsrang van `0` tot en met `49`. De puntgrens is:

```ts
unlockPoints = rank <= 1
  ? 0
  : round(50 * 1.23 ** (rank - 2))
```

De volgorde is zo gekozen dat:

- `ijzeren harnassen` (rang 27) vóór `vergulde hoefijzers` (rang 30) ontgrendelt;
- `vergulde bijlen` (rang 34) vóór `verzilverde harnassen` (rang 47) ontgrendelt.

De twee aanbiedingen worden bepaald uit de hoogst ontgrendelde combinaties. De items zijn altijd verschillend; het materiaal mag gelijk zijn.

### Hoeveelheid, punten en beloning

```ts
quantity = min(10000, max(10, round(10 * 1.4 ** completedOrderCount)))
requiredPoints = max(quantity, ceil(quantity * material.pointMultiplier * item.pointMultiplier))
coinReward = max(1, floor(quantity * material.coinMultiplier * item.coinMultiplier))
```

De vereiste punten worden berekend voor gameplay, maar zijn niet zichtbaar in `OrderSelection.vue` of `OrderTracker.vue`.

Tijdens een actieve order ziet de speler:

- de commandoregel;
- voortgang per item, bijvoorbeeld `1 / 10 bronzen klinknagels`;
- één itemstatusbalk die bij 0% begint en bij elk voltooid item opnieuw vanaf 0% start;
- de totale voortgangsbalk;
- de muntenbeloning;
- de gamebutton.

Bij voltooiing wordt de beloning één keer toegekend, verdwijnt de actieve order en verschijnen direct twee nieuwe aanbiedingen.

## Upgraderegels

- Upgrades kunnen vaker worden gekocht.
- Elke aankoop voegt de `upgradeId` één keer toe aan `upgrades`.
- `purchaseCount` is het aantal voorkomens van een `upgradeId` in `upgrades`.
- `currentCost = max(1, floor(baseCost * costMultiplier ** purchaseCount))`.
- Een mislukte aankoop, onvoldoende munten of onbekende ID verandert geen state.

## State-invarianten

- `points`, projectvoortgang en ordervoortgang zijn niet-negatief en eindig.
- `coins` is een niet-negatief geheel getal.
- Iedere `projectId` komt hoogstens één keer voor in `completedProjects`.
- Iedere `projectProgress[projectId]` is niet-negatief en overschrijdt `requiredPoints` niet.
- `completedOrderCount` is een niet-negatief geheel getal.
- `offeredOrders` bevat nul of twee workorders met verschillende `itemId`-waarden.
- `activeOrder` is `null` of één geldige workorder.
- Iedere aangekochte `upgradeId`, `materialId` en `itemId` bestaat in de juiste catalogus.
- `purchaseCount` wordt niet apart als tweede bron van waarheid opgeslagen.

## Normalisatie- en opslagcontract

De storage-key blijft `click-hammer:game-state`. Er is geen nieuwe saveversie.

Een opgeslagen state zonder de velden `completedOrderCount`, `nextOrderId`, `offeredOrders` en `activeOrder` wordt als oude save volledig vervangen door `createInitialGameState()`.

Daarnaast worden onbekende IDs, ongeldige orderdata, dubbele orderitems en ongeldige projectvoortgang geneormaliseerd. Storage-lezen en -schrijven gebeuren binnen `try/catch`; fouten blokkeren gameplay niet.

`useGamePersistence` bewaakt de state diep met een debounce van 250 ms. Clickreeksen schrijven niet per click; projectvoltooiingen, ordervoltooiingen en aankopen worden als volledige state opgeslagen.

## Toegankelijkheid

- `GameHeader` heeft een `aria-live="polite"` en `aria-atomic="true"` regio voor score en munten.
- De tablist in `GameNavigation` ondersteunt `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home` en `End` met wrap-around; disabled views worden overgeslagen en de focus volgt de geselecteerde tab.
- `Escape` sluit het mobiele menu en zet de focus terug op de menuknop.
- Orderknoppen dragen de commandoregel in het `aria-label`, zodat de twee offers te onderscheiden zijn.
- Upgradeknoppen noemen prijs en koopstatus in het `aria-label`.
- Alle interacties werken met keyboard; disabled knoppen en views gebruiken `disabled` en `aria-disabled`.
- Minimale contrastverhouding voor tekst is 4.5:1; `text` op `background` is 15.2:1 en `muted` op `surface-raised` is 6.9:1.

## Visuele feedback

- `--transition-fast` is 100ms en `--transition-medium` is 180ms; alle kaarten, knoppen en balken gebruiken die tokens.
- `prefers-reduced-motion: reduce` zet elke animatie en transitie op 1ms.
- Interactieve elementen zijn minimaal `--control-min-height` (2.75rem) hoog.
- Hover geven kaarten een subtielere rand en knoppen een lichte opbranding; active laat een knop 0.1rem zakken. Geblokkeerde elementen geven geen hover- of active-feedback.

## Status- en foutstates

| State | Trigger | Zichtbaar |
| --- | --- | --- |
| Geen melding | verse save (`fresh`) of geldige save (`restored`) | normaal spel |
| Opslagwaarschuwing | `recovered`, `unavailable` of een mislukte write | niet-blokkerende `GameStatusPanel` met sluitknop |
| Alle projecten klaar | geen ontgrendeld project meer | `info`-paneel, de aambeeldknop verdwijnt |
| Geen projecten | lege projectcatalogus | `role="status"` in plaats van een lege lijst |
| Geen orders | lege orderoffers | `role="status"` in plaats van een lege lijst |
| Geen upgrades | lege upgradecatalogus | bestaande lege-catalogusmelding |
| Niet betaalbaar | `coins < currentCost` | `Niet betaalbaar` plus `Nog N munten nodig` |

Een opslagfout blokkeert nooit clicks; het spel blijft volledig speelbaar en waarschuwt alleen dat de voortgang verdwijnt bij het sluiten van het venster.

## Navigatieregels

- De views zijn `Projecten`, `Smederij` (id `smithy`) en `Upgrades`; de game start op `Projecten`.
- Zolang `Herstel het aambeeld` niet voltooid is, zijn `Smederij` en `Upgrades` disabled in zowel de desktoptabs als het mobiele menu.
- Een disabled view kan niet geselecteerd worden: `GameNavigation.vue` negeert de `select` en `App.vue` weigert de view.
- Wordt een actieve view geblokkeerd (bijvoorbeeld na een reset), springt de game terug naar `Projecten`.
- Alle tekst in de UI is niet-selecteerbaar (`user-select: none` op `body`).

## Visuele feedbackregels

- `Herstel het aambeeld` is het eerste zichtbare doel op het projecttabblad.
- Alleen `manualClick` start de hamer-op-aambeeld-animatie en vonken.
- Een `project-complete`-event start één confetti-achtige explosie van gouden munten.
- Elke upgrade heeft een passende pixel-art sprite.
- De volledige UI gebruikt een charmante pixel-artstijl met een middeleeuwse-smithachtergrond.
