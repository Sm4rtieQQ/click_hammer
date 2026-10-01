# ClickHammer — Agentrichtlijnen

## Goal
ClickHammer is een Vue 3-clickgame waarin je klik punten verdient, projecten voltooit, munten krijgt en upgrades koopt.
Doel: snel groeien, meer punten per klik produceren en alle projecten, opdrachten en upgrades ontgrendelen.

## Componentarchitectuur
- `App.vue`: layout, views, lifecycle en persistence; geeft state en acties via props aan child components.
- `GameHeader.vue`: toont score en munten; project- en ordertellers zijn hier niet zichtbaar.
- `GameNavigation.vue`: desktop-tabs en mobiel menu voor Projecten, Smederij, Upgrades en Leerling; geblokkeerde views komen via de prop `disabledViews` en zijn semantisch disabled.
- `GameButton.vue`: klikfeedback en `click`-event; de parent bepaalt of een project of order wordt gevorderd.
- `ProjectList.vue`: toont alleen voltooide projecten en het eerstvolgende project.
- `ProjectTracker.vue`: toont voortgang en voltooit één project aan de grens.
- `OrderSelection.vue`: toont twee offertes en emiteert `select` voor één opdracht.
- `OrderTracker.vue`: toont commandoregel, één itemstatusbalk die per voltooid item opnieuw vanaf 0% start en de totale opdrachtbalk.
- `UpgradeShop.vue`: toont beschikbare upgrades en verwerkt aankopen; `buy-upgrade` gaat naar `App.vue`.
- `UpgradeItem.vue`: toont één upgrade met prijs en koopstatus; `buy-upgrade` gaat naar `UpgradeShop.vue`.
- `GameStatusPanel.vue`: één presentational paneel voor info-, warning- en errorstates; `info` is een `role="status"`, de andere tonen een `role="alert"`.
- `ApprenticePanel.vue`: toont de ontgrendelde leerling met de huidige punten per seconde en per minuut; presentational, props naar beneden.
- `ItemSprite.vue`: composeert één sprite uit een `itemId` en `materialId`; het item bepaalt de vorm, het materiaal de kleur. `src/sprites/sprites.ts` koppelt items aan silhouetten en materialen aan paletten.
- `useGameState.ts`: centrale, reactieve gameplay-, project-, order-, upgrade- en auto-clicker-logica.

## TypeScript-interfaces
```ts
interface Material { id: number; name: string; adjective: string
  pointMultiplier: number; coinMultiplier: number }
interface Item { id: number; name: string
  pointMultiplier: number; coinMultiplier: number }
interface WorkOrder { id: number; materialId: number; itemId: number
  quantity: number; progress: number; requiredPoints: number; coinReward: number }
interface Project { id: number; name: string; description: string
  unlockPoints: number; requiredPoints: number; coinReward: number }
interface GameState {
  points: number; coins: number; completedProjects: number[]
  upgrades: number[]; projectProgress: Record<number, number>
  completedOrderCount: number; nextOrderId: number
  offeredOrders: WorkOrder[]; activeOrder: WorkOrder | null
  autoClickerUnlocked: boolean
}
```

## Vue 3-best practices
- Gebruik de Composition API; houd alle spelstatus en acties in `useGameState`.
- Gebruik `computed` voor afgeleide waarden en `watch` voor gerichte persistence; schrijf niet naar LocalStorage bij elke klik.
- Houd componenten presentational: props naar beneden, typed emits omhoog; lifecycle-opruiming in `onUnmounted`.
- Gebruik sterke TypeScript-types, Engelse identifiers en vermijd gedeelde, niet-reactieve mutaties.
- Toegankelijkheid is een harde eis: elke interactie werkt met keyboard, score en munten staan in een `aria-live`-regio, disabled views en knoppen zijn semantisch disabled en leesbare labels, en alle tekstcombinaties halen minimaal 4.5:1 contrast.
- De tablist in `GameNavigation.vue` ondersteunt pijltjestoetsen, `Home` en `End` en verplaatst de focus mee; `Escape` sluit het mobiele menu en herstelt de focus op de menuknop.

## Key Rules
- `addPoints('project')` voedt alleen het actieve ontgrendelde project; `addPoints('order')` voedt alleen de actieve order.
- De eerste twee ordercombinaties zijn vanaf het begin beschikbaar in de catalogus; na project 1 kan de speler ze kiezen.
- De twee orderoffertes hebben nooit hetzelfde item; materialen mogen gelijk zijn.
- `quantity = min(10000, round(10 * 1.4 ** completedOrderCount))`.
- `requiredPoints = max(quantity, ceil(quantity * material.pointMultiplier * item.pointMultiplier))`.
- `coinReward = max(1, floor(quantity * material.coinMultiplier * item.coinMultiplier))`.
- `Herstel het aambeeld` is het eerste doel en levert nul munten; latere projecten leveren veel meer munten.
- De vereiste punten van een order zijn intern, maar niet zichtbaar in `OrderSelection` of `OrderTracker`.
- Upgradekosten: `floor(baseCost * costMultiplier^purchaseCount)`, met een geldige minimumwaarde van 1.
- `clickBonus` is een percentage-multiplier: `clickPower` wordt berekend als `baseClickPower * product(1 + clickBonus / 100)`.
- De upgrade `Leerling` (ID 104) is eenmalig: `maxPurchases: 1`. Na aankoop staat hij op 'ontgrendeld' en kan hij niet opnieuw worden gekocht. Extra upgrades voor de leerling zijn er niet.
- De leerling levert `autoClickerShare` (10%) van de huidige `clickPower` per seconde en voedt hetzelfde doel als een handmatige klik: de actieve order, anders het actieve project. Dat loopt via `setInterval` in `useGameState`; gebruik `applyPoints(target, amount)` en niet `addPoints()`, want die rekent met de volledige clickkracht.
- De view heet `Leerling` en heeft id `apprentice`. Zolang `autoClickerUnlocked` onwaar is, is dat tabblad disabled via `disabledViews`.
- De view heet `Smederij` (niet `Smidse`) en heeft id `smithy`.
- Tijdens `Herstel het aambeeld` (dus zolang project 1 niet voltooid is) zijn `Smederij` en `Upgrades` disabled; `App.vue` levert dat via `disabledViews` en `GameNavigation.vue` rendert semantisch disabled knoppen.
- Alle tekst is niet-selecteerbaar: `body` heeft `user-select: none` in `src/styles/main.css`.
- Opslagstatus is zichtbaar: `loadGameStateResult` geeft `restored`, `fresh`, `recovered` of `unavailable`, en `useGamePersistence` levert `hasWriteError`. Samen tonen ze één niet-blokkerende `GameStatusPanel` met een sluitknop; een opslagfout mag nooit clicks blokkeren.
- Elk visueel effect gebruikt de tokens `--transition-fast` of `--transition-medium` en respecteert `prefers-reduced-motion: reduce`.
- Interactieve elementen zijn minimaal `--control-min-height` (2.75rem) hoog en geven hover, active en focus-feedback.
- Sprite-regel: het **item bepaalt de vorm**, het **materiaal de kleur**. Teken nooit een item-materiaalsprite apart; gebruik `ItemSprite.vue` met de `itemId` en `materialId` van de order. Silhouetten zijn witte SVG's op een `16 × 16` grid en doen dienst als `mask-image`; kleuren staan in `src/sprites/sprites.ts`. De stijl staat in `docs/visual-style.md` en `sprite-check.html` rendert alle 50 combinaties op 16, 32 en 64px.
- Elke `setInterval`/`setTimeout` krijgt een id en wordt in `onUnmounted` opgeruimd.
- LocalStorage gebruikt dezelfde key; saves zonder ordervelden worden volledig vervangen door de beginstate.
- Corrupte data en opslagfouten blokkeren gameplay niet.
- Taken in `tasks.md` worden pas afgevinkt (`[x]`) nadat de taak succesvol is voltooid en de bijbehorende tests/acceptatiecriteria slagen.
- Vink een taak **direct** af zodra die voltooid is, nog in dezelfde wijziging: niet uitstellen tot het einde van de sessie en niet overlaten aan een volgende ronde. Zo blijft `tasks.md` altijd de actuele status van de opdracht.
- Vul bij het afvinken een korte `**Uitgevoerd:**`-regel toe met wat er werkelijk is gebouwd, welke bestanden of tests het bewijzen, en eventuele afwijkingen of lessen. Blijft een `**Let op:**`-regel nodig (bijvoorbeeld omdat de aanpak afweek van de taaktekst), dan blijft die daar staan.
- Blijft een taak onvoltooid, laat de checkbox dan op `[ ]` staan en benoem in het antwoord wat er nog ontbreekt.
