# ClickHammer — Agentrichtlijnen

## Goal
ClickHammer is een Vue 3-clickgame waarin je klik punten verdient, projecten voltooit, munten krijgt en upgrades koopt.
Doel: snel groeien, meer punten per klik produceren en alle projecten, opdrachten en upgrades ontgrendelen.

## Componentarchitectuur
- `App.vue`: layout, views, lifecycle en persistence; geeft state en acties via props aan child components.
- `GameHeader.vue`: toont score en munten; project- en ordertellers zijn hier niet zichtbaar.
- `GameNavigation.vue`: desktop-tabs en mobiel menu voor Projecten, Smidse en Upgrades.
- `GameButton.vue`: klikfeedback en `click`-event; de parent bepaalt of een project of order wordt gevorderd.
- `ProjectList.vue`: toont alleen voltooide projecten en het eerstvolgende project.
- `ProjectTracker.vue`: toont voortgang en voltooit één project aan de grens.
- `OrderSelection.vue`: toont twee offertes en emiteert `select` voor één opdracht.
- `OrderTracker.vue`: toont commandoregel, één itemstatusbalk die per voltooid item opnieuw vanaf 0% start en de totale opdrachtbalk.
- `UpgradeShop.vue`: toont beschikbare upgrades en verwerkt aankopen; `buy-upgrade` gaat naar `App.vue`.
- `UpgradeItem.vue`: toont één upgrade met prijs en koopstatus; `buy-upgrade` gaat naar `UpgradeShop.vue`.
- `useGameState.ts`: centrale, reactieve gameplay-, project-, order- en upgrade-logica.

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
}
```

## Vue 3-best practices
- Gebruik de Composition API; houd alle spelstatus en acties in `useGameState`.
- Gebruik `computed` voor afgeleide waarden en `watch` voor gerichte persistence; schrijf niet naar LocalStorage bij elke klik.
- Houd componenten presentational: props naar beneden, typed emits omhoog; lifecycle-opruiming in `onUnmounted`.
- Gebruik sterke TypeScript-types, Engelse identifiers en vermijd gedeelde, niet-reactieve mutaties.

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
- Elke `setInterval`/`setTimeout` krijgt een id en wordt in `onUnmounted` opgeruimd.
- LocalStorage gebruikt dezelfde key; saves zonder ordervelden worden volledig vervangen door de beginstate.
- Corrupte data en opslagfouten blokkeren gameplay niet.
- Taken in `tasks.md` worden pas afgevinkt (`[x]`) nadat de taak succesvol is voltooid en de bijbehorende tests/acceptatiecriteria slagen.
