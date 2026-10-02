# ClickHammer — Agentrichtlijnen

## Goal
ClickHammer is een Vue 3-clickgame waarin je klik punten verdient, projecten voltooit, munten krijgt en upgrades koopt.
Doel: snel groeien, meer punten per klik produceren en alle projecten, opdrachten en upgrades ontgrendelen.

## Componentarchitectuur
- `App.vue`: layout, views, lifecycle en persistence; geeft state en acties via props aan child components.
- `GameHeader.vue`: toont score en munten; project- en ordertellers zijn hier niet zichtbaar.
- `GameNavigation.vue`: desktop-tabs en mobiel menu voor Projecten, Smederij, Upgrades en Leerling; geblokkeerde views komen via de prop `disabledViews` en zijn semantisch disabled.
- `GameButton.vue`: het aambeeld zelf, met een native button en een `data-pose`; de knop blijft een echte `<button>` met `aria-label`, ook al is er geen zichtbare tekst meer. De hamer-slaganimatie hangt aan een `strikeCount` die alleen bij een handmatige activatie oploopt, nooit aan `:active`; de teller staat als `data-strike-count` op de knop.
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
- `useTransientEffect.ts`: gedeelde tijdelijke-effectlogica; geeft `isRunning`, `runId`, `trigger` en `stop` terug en ruimt zijn eigen timer op in `onScopeDispose`.
- `SparkBurst.vue` en `CoinBurst.vue`: korte decoratieve bursts bij de hamerklap en bij een voltooid project. Beiden zijn `aria-hidden`, nemen geen ruimte in en hebben hun banen in een vaste tabel staan.

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
- De leerling levert `autoClickerShare` (10%) van de huidige `clickPower` per seconde en voedt **uitsluitend de actieve order**. Aan projecten helpt hij nooit mee; die worden alleen met een handmatige klik gevorderd. Zonder actieve order doet zijn tick niets: `applyPoints('order', amount)` geeft dan `false`, dus er komen geen punten bij en `autoClickCount` loopt niet op. Dat loopt via `setInterval` in `useGameState`; gebruik `applyPoints('order', autoClickerRate.value)` en niet `addPoints()`, want die rekent met de volledige clickkracht.
- De interval van de leerling draait door zolang hij ontgrendeld is en wordt dus niet gestopt of herstart op `activeOrder`. De gating zit in de tick, niet in het beheer van de timer: zo wisselen order kiezen en order afronden de timer niet, en `vi.getTimerCount()` blijft voorspelbaar.
- `isAutoClickerWorking` is de `autoClickerUnlocked && activeOrder !== null` waarmee `ApprenticePanel.vue` kiest tussen de werkstatus mét cijfers en de wachtstatus. Zonder order toont het paneel nadrukkelijk géén rate, want een cijfer dat er toch niet binnenkomt is misleidend.
- Elke klik heeft een bron: `addPoints(target?, source)` met `source` `'manual'` of `'auto'`. Alleen `'manual'` verhoogt `manualClickCount`, en alleen die teller drijft de hamerfeedback. De leerling verhoogt `autoClickCount` en beweegt de hamer nooit.
- `applyPoints(target, amount)` geeft terug of er punten zijn toegevoegd; zonder actief doel gebeurt er niets en telt de klik niet mee.
- Tellers voor visuele feedback staan buiten `GameState` en zijn `ref`, geen gewone `let`: een `computed` over een `let` heeft geen reactieve afhankelijkheid en blijft op de eerste waarde staan.
- De view heet `Leerling` en heeft id `apprentice`. Zolang `autoClickerUnlocked` onwaar is, is dat tabblad disabled via `disabledViews`.
- Alleen een handmatige activatie van `GameButton.vue` start vonken. De leerling loopt langs `applyPoints` en komt daar niet, dus automatisch klikken geeft geen vonken en geen hamerklap.
- De vonkenbad duurt 420ms en is dus langer dan de slag van 140ms: een hamer die meteen verdwijnt terwijl er nog vonken in de lucht hangen is geen explosie. `SparkBurst.vue` heeft daarom een eigen `SPARK_DURATION_MS`.
- `SparkBurst.vue` heeft twee lagen: een vierkante flitsring die in 231ms uitklapt, en een bad van twaalf vonken. Een bad van losse puntjes alleen leest niet als een klap.
- De vonken vermenigvuldigen hun vliegbaan met `--effect-scale` (2, 3 of 4, in `GameButton.vue` per breakpoint), zodat de waaier even groot is ten opzichte van het aambeeld. Hun blokgrootte wordt níet vermenigvuldigd: een meegeschalde vonk van 28px leest als een gloeiend blok.
- Die munten zijn 32px, dat is vier keer de 8px van de eerste versie, en hun eindpunt ligt omlaag. Recht omhoog zou ze achter de vaste topbar terechtkomen, want de explosielaag begint bovenaan de view.
- De opacity van een vonk staat om **80%** van de keyframe op nul, niet pas op 100%. De `.game-topbar` is `position: sticky` met een ondoorzichtige achtergrond, en gemeten wordt die kop rond de 86% van de vlucht bereikt; zonder die vroege stop schuurt de hoogste vonk er met een opacity van 0,27 langs. Doordat de vervaaging vóór die grens zit, hoeft de vlucht niet ingeperkt te worden, en een latere koptekst zou de vonken alleen nog eerder laten uitvagen. `SparkBurst.test.ts` bewaakt dit.
- Bij het afronden van het laatste project verdwijnt het aambeeld en dus de hele vonkenbad; de muntenexplosie staat daarom in de view-laak en overleeft dat. Vonken en munten zijn daardoor nooit tegelijk zichtbaar: de vonken zijn invoerfeedback, de munten zijn de beloning.
- De muntenexplosie viert zowel een voltooid project als een afgeronde order, en volgt daarom de state en niet het `project-complete`-event: `ProjectTracker` wordt bij het afronden ontmount omdat het niet meer het actieve project is, en zijn watcher vuurt dan niet. `App.vue` viert daarom vanuit een watcher op `gameState.completedProjects`, met `lastCelebratedProjectId` als idempotentieguard, en vanuit een watcher op `gameState.completedOrderCount`. Voor een order is er geen event om op te reageren.
- `completeOrder` zet `activeOrder` op `null`, dus de beloning van de lopende order moet worden onthouden zodra hij gekozen wordt; `activeOrderReward` in `App.vue` doet dat en wordt níet op nul gezet als de order verdwijnt, want de explosie heeft de beloning juist dan nodig.
- De orderteller loopt per order met precies één op. Springt hij met meer dan één omhoog, dan is dat een teruggezette save of een normalisatie en viert `App.vue` niets, want de beloning is dan onbekend.
- Een project met `coinReward` 0 viert niet met munten. `Herstel het aambeeld` levert nul munten en krijgt dus geen explosie; het krijgt wel de omklappende projectkaart en het paneel "Alle projecten voltooid".
- De view heet `Smederij` (niet `Smidse`) en heeft id `smithy`.
- Tijdens `Herstel het aambeeld` (dus zolang project 1 niet voltooid is) zijn `Smederij` en `Upgrades` disabled; `App.vue` levert dat via `disabledViews` en `GameNavigation.vue` rendert semantisch disabled knoppen.
- Alle tekst is niet-selecteerbaar: `body` heeft `user-select: none` in `src/styles/main.css`.
- Opslagstatus is zichtbaar: `loadGameStateResult` geeft `restored`, `fresh`, `recovered` of `unavailable`, en `useGamePersistence` levert `hasWriteError`. Samen tonen ze één niet-blokkerende `GameStatusPanel` met een sluitknop; een opslagfout mag nooit clicks blokkeren.
- Elk visueel effect gebruikt de tokens `--transition-fast` of `--transition-medium` en respecteert `prefers-reduced-motion: reduce`. Een keyframe-duur is geen transitie en heeft dus een eigen getal nodig, zoals `STRIKE_DURATION_MS` en `COIN_BURST_DURATION_MS`.
- Een tijdelijk effect (vonken, munten) loopt via `useTransientEffect({ durationMs })` en bindt `runId` als `:key`. Zonder die key herstart de CSS-animatie niet bij een snelle tweede klik, omdat het element in de DOM blijft staan.
- `SparkBurst.vue` en `CoinBurst.vue` zijn decoratie: `aria-hidden`, buiten de flow en `pointer-events: none`, dus geen layoutverschuiving. Hun banen staan in een vaste tabel, nooit in `Math.random()`.
- Schrijf een `animation` nooit als één samengestelde regel met een `--transition-`-token erin: die token is `180ms ease` en levert dus zelf een duur, waardoor er drie tijdswaarden in de lijst komen te staan. De shorthand is dan ongeldig en de hele declaratie wordt stilzwijgend weggegooid, waardoor de deeltjes gestapeld blijven staan. Gebruik losse `animation-name`/`-duration`/`-timing-function`/`-delay`/`-fill-mode` met een eigen duurgetal en het woord `ease-out`.
- Interactieve elementen zijn minimaal `--control-min-height` (2.75rem) hoog en geven hover, active en focus-feedback.
- Sprite-regel: het **item bepaalt de vorm**, het **materiaal de kleur**. Teken nooit een item-materiaalsprite apart; gebruik `ItemSprite.vue` met de `itemId` en `materialId` van de order. Silhouetten zijn witte SVG's op een `16 × 16` grid en doen dienst als `mask-image`; kleuren staan in `src/sprites/sprites.ts`. De stijl staat in `docs/visual-style.md` en `sprite-check.html` rendert alle 50 combinaties op 16, 32 en 64px.
- Elke `setInterval`/`setTimeout` krijgt een id en wordt in `onUnmounted` opgeruimd.
- LocalStorage gebruikt dezelfde key; saves zonder ordervelden worden volledig vervangen door de beginstate.
- Corrupte data en opslagfouten blokkeren gameplay niet.
- Taken in `tasks.md` worden pas afgevinkt (`[x]`) nadat de taak succesvol is voltooid en de bijbehorende tests/acceptatiecriteria slagen.
- Vink een taak **direct** af zodra die voltooid is, nog in dezelfde wijziging: niet uitstellen tot het einde van de sessie en niet overlaten aan een volgende ronde. Zo blijft `tasks.md` altijd de actuele status van de opdracht.
- Vul bij het afvinken een korte `**Uitgevoerd:**`-regel toe met wat er werkelijk is gebouwd, welke bestanden of tests het bewijzen, en eventuele afwijkingen of lessen. Blijft een `**Let op:**`-regel nodig (bijvoorbeeld omdat de aanpak afweek van de taaktekst), dan blijft die daar staan.
- Blijft een taak onvoltooid, laat de checkbox dan op `[ ]` staan en benoem in het antwoord wat er nog ontbreekt.
