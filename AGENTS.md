# ClickHammer — Agentrichtlijnen

## Goal
ClickHammer is een Vue 3-clickgame waarin je klik punten verdient, projecten voltooit, munten krijgt en upgrades koopt.
Doel: snel groeien, meer punten per klik produceren en alle projecten en upgrades ontgrendelen.

## Componentarchitectuur
- `App.vue`: layout en lifecycle/persistence; geeft state en acties via props aan child components.
- `GameHeader.vue`: toont score en munten; projecttellers zijn hier niet zichtbaar.
- `HammerButton.vue`: klik feedback en `click`-event om een punt te verdienen.
- `ProjectTracker.vue`: trekt punten af van projectdoelen en toont de teller totdat deze 0 is; `project-complete`-event bij 0.
- `UpgradeShop.vue`: koopt beschikbare upgrades; `buy-upgrade`-event naar `App.vue`.
- `useGameState.ts`: centrale, reactieve gameplay-, project- en upgrade-logica.
## TypeScript-interfaces
```ts
interface Upgrade {
  id: string; name: string; description: string
  baseCost: number; costMultiplier: number; clickBonus: number
}
interface Project {
  id: string; name: string; requiredPoints: number; coinReward: number
}
interface GameState {
  points: number; coins: number; completedProjects: string[]
  upgrades: string[]; projectProgress: Record<string, number>
}
```
## Vue 3-best practices
- Gebruik de Composition API; houd alle spelstatus en acties in `useGameState`.
- Gebruik `computed` voor afgeleide waarden en `watch` voor gerichte persistence; schrijf niet naar LocalStorage bij elke klik.
- Houd componenten presentational: props naar beneden, typed emits omhoog; lifecycle-opschoning in `onUnmounted`.
- Gebruik sterke TypeScript-types en vermijd gedeelde, niet-reactieve mutaties.

## Key Rules
- Upgradekosten: `floor(baseCost * costMultiplier^aantalGekocht)`, met een geldige minimumwaarde van 1.
- Elke `setInterval` krijgt een id en wordt in `onUnmounted` via `clearInterval` opgeruimd.
- LocalStorage wordt in `try/catch` gelezen en geschreven; corrupte data valt terug naar de beginstate en opslagfouten blokkeren gameplay niet.
